/**
 * industrial-energy-baseline - Core Linear Regression & M&V Performance Engine
 * Mathematically identical to industrial_energy_baseline Python package.
 * Implements OLS multiple regression, ANOVA, ASHRAE Guideline 14 / ISO 50006 validation,
 * CUSUM tracking, and M&V uncertainty quantification.
 */

class MatrixOps {
  static transpose(A) {
    const rows = A.length, cols = A[0].length;
    const res = Array.from({ length: cols }, () => new Array(rows));
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        res[j][i] = A[i][j];
      }
    }
    return res;
  }

  static multiply(A, B) {
    const rA = A.length, cA = A[0].length;
    const rB = B.length, cB = B[0].length;
    if (cA !== rB) throw new Error(`Matrix dimension mismatch: [${rA}x${cA}] * [${rB}x${cB}]`);
    const res = Array.from({ length: rA }, () => new Array(cB).fill(0));
    for (let i = 0; i < rA; i++) {
      for (let k = 0; k < cA; k++) {
        const aik = A[i][k];
        for (let j = 0; j < cB; j++) {
          res[i][j] += aik * B[k][j];
        }
      }
    }
    return res;
  }

  static multiplyVec(A, x) {
    const rA = A.length, cA = A[0].length;
    const res = new Array(rA).fill(0);
    for (let i = 0; i < rA; i++) {
      for (let j = 0; j < cA; j++) {
        res[i] += A[i][j] * x[j];
      }
    }
    return res;
  }

  static invert(matrix) {
    const n = matrix.length;
    // Create augmented matrix [A | I]
    const A = matrix.map((row, i) => {
      const augRow = new Array(2 * n).fill(0);
      for (let j = 0; j < n; j++) augRow[j] = row[j];
      augRow[n + i] = 1.0;
      return augRow;
    });

    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxEl = Math.abs(A[i][i]);
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(A[k][i]) > maxEl) {
          maxEl = Math.abs(A[k][i]);
          maxRow = k;
        }
      }
      if (maxEl < 1e-12) {
        throw new Error("Matriz singular o casi singular: colinealidad detectada en los drivers.");
      }

      // Swap rows
      const tmp = A[maxRow];
      A[maxRow] = A[i];
      A[i] = tmp;

      // Normalize row i
      const pivot = A[i][i];
      for (let j = 0; j < 2 * n; j++) {
        A[i][j] /= pivot;
      }

      // Eliminate other rows
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = A[k][i];
          for (let j = 0; j < 2 * n; j++) {
            A[k][j] -= factor * A[i][j];
          }
        }
      }
    }

    // Extract inverse
    const inv = Array.from({ length: n }, () => new Array(n));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        inv[i][j] = A[i][n + j];
      }
    }
    return inv;
  }
}

class StatDistributions {
  // Approximation of Student-t two-tailed p-value
  static tPValue(tVal, df) {
    if (df <= 0) return 1.0;
    const t = Math.abs(tVal);
    // Approximation using incomplete beta or Abramowitz & Stegun
    const x = df / (df + t * t);
    // Incomplete beta approximation I_x(df/2, 1/2)
    return this.incompleteBeta(x, df / 2, 0.5);
  }

  static incompleteBeta(x, a, b) {
    // Continued fraction expansion for incomplete beta function
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    // Symmetry transformation
    if (x > (a + 1) / (a + b + 2)) {
      return 1 - this.incompleteBeta(1 - x, b, a);
    }

    const factor = Math.exp(
      this.logGamma(a + b) - this.logGamma(a) - this.logGamma(b) +
      a * Math.log(x) + b * Math.log(1 - x)
    ) / a;

    // Lentz's method
    const maxIter = 100;
    const eps = 1e-12;
    let c = 1.0;
    let d = 1.0 - (a + b) * x / (a + 1.0);
    if (Math.abs(d) < eps) d = eps;
    d = 1.0 / d;
    let h = d;

    for (let m = 1; m <= maxIter; m++) {
      // Even step
      let numer = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
      d = 1.0 + numer * d;
      if (Math.abs(d) < eps) d = eps;
      c = 1.0 + numer / c;
      if (Math.abs(c) < eps) c = eps;
      d = 1.0 / d;
      h *= d * c;

      // Odd step
      numer = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1));
      d = 1.0 + numer * d;
      if (Math.abs(d) < eps) d = eps;
      c = 1.0 + numer / c;
      if (Math.abs(c) < eps) c = eps;
      d = 1.0 / d;
      const delta = d * c;
      h *= delta;

      if (Math.abs(delta - 1.0) < eps) break;
    }

    return factor * h;
  }

  static logGamma(x) {
    // Lanczos approximation
    const g = 7;
    const C = [
      0.99999999999980993,
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.138571095836524,
      9.9843695780195716e-6,
      1.5056327351493116e-7
    ];
    if (x < 0.5) {
      return Math.log(Math.PI / Math.sin(Math.PI * x)) - this.logGamma(1 - x);
    }
    x -= 1;
    let base = C[0];
    for (let i = 1; i < g + 2; i++) {
      base += C[i] / (x + i);
    }
    const t = x + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(base);
  }

  // F distribution p-value approximation
  static fPValue(fVal, df1, df2) {
    if (fVal <= 0 || df1 <= 0 || df2 <= 0) return 1.0;
    const x = df2 / (df2 + df1 * fVal);
    return this.incompleteBeta(x, df2 / 2, df1 / 2);
  }

  // Two-tailed Student-t critical value for alpha=0.05 (95% CI)
  static tCritical95(df) {
    if (df <= 1) return 12.706;
    if (df === 2) return 4.303;
    if (df === 3) return 3.182;
    if (df === 4) return 2.776;
    if (df === 5) return 2.571;
    if (df === 6) return 2.447;
    if (df === 7) return 2.365;
    if (df === 8) return 2.306;
    if (df === 9) return 2.262;
    if (df === 10) return 2.228;
    if (df <= 12) return 2.179;
    if (df <= 15) return 2.131;
    if (df <= 20) return 2.086;
    if (df <= 30) return 2.042;
    if (df <= 60) return 2.000;
    return 1.960;
  }
}

class BaselineEngine {
  /**
   * Fit an Ordinary Least Squares (OLS) linear model:
   * y = beta_0 + beta_1 * x_1 + ... + beta_p * x_p
   * @param {Array<Object>} rows Array of data objects
   * @param {string} targetCol Energy consumption column name
   * @param {Array<string>} driverCols Array of driver column names
   * @returns {Object} Fitted model parameters, metrics and diagnostics
   */
  static fitLinear(rows, targetCol, driverCols) {
    const n = rows.length;
    const p = driverCols.length;
    if (n < p + 2) {
      throw new Error(`Datos insuficientes para ajustar el modelo: se requieren al menos ${p + 2} observaciones y hay ${n}.`);
    }

    // Build X matrix with intercept
    const X = [];
    const y = [];
    for (let i = 0; i < n; i++) {
      const row = rows[i];
      const rowX = [1.0]; // Constant beta_0
      for (const d of driverCols) {
        const val = Number(row[d]);
        if (isNaN(val)) throw new Error(`Valor no numérico en driver '${d}', fila ${i + 1}`);
        rowX.push(val);
      }
      X.push(rowX);

      const yVal = Number(row[targetCol]);
      if (isNaN(yVal)) throw new Error(`Valor no numérico en target '${targetCol}', fila ${i + 1}`);
      y.push(yVal);
    }

    // Matrix calculations: beta = (X^T * X)^(-1) * X^T * y
    const XT = MatrixOps.transpose(X);
    const XTX = MatrixOps.multiply(XT, X);
    const XTX_inv = MatrixOps.invert(XTX);
    const XTy = MatrixOps.multiplyVec(XT, y);
    const beta = MatrixOps.multiplyVec(XTX_inv, XTy);

    // Fitted values and residuals
    const fitted = MatrixOps.multiplyVec(X, beta);
    const residuals = y.map((yi, idx) => yi - fitted[idx]);

    // Sum of Squares
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    let sse = 0; // Sum of Squared Errors (Residual SS)
    let sst = 0; // Total Sum of Squares
    let ssr = 0; // Regression Sum of Squares

    for (let i = 0; i < n; i++) {
      sse += residuals[i] * residuals[i];
      sst += (y[i] - yMean) * (y[i] - yMean);
      ssr += (fitted[i] - yMean) * (fitted[i] - yMean);
    }

    // Degrees of freedom
    const dfModel = p;
    const dfResid = n - p - 1;

    // Variance of residuals (Mean Square Error)
    const mse = sse / dfResid;
    const rmse = Math.sqrt(sse / n); // Python StatsModels/ASHRAE RMSE calculation

    // Variance-Covariance matrix of beta: Cov(beta) = mse * (X^T * X)^(-1)
    const covBeta = XTX_inv.map(row => row.map(val => val * mse));
    const seBeta = beta.map((_, i) => Math.sqrt(Math.max(0, covBeta[i][i])));

    // t-statistics and p-values for each coefficient
    const coefficients = [];
    const varNames = ["const", ...driverCols];
    for (let j = 0; j < varNames.length; j++) {
      const se = seBeta[j];
      const t = se > 0 ? beta[j] / se : 0;
      const pVal = StatDistributions.tPValue(t, dfResid);
      coefficients.push({
        name: varNames[j],
        value: beta[j],
        stdError: se,
        tStatistic: t,
        pValue: pVal,
        isSignificant: pVal < 0.05
      });
    }

    // R2 and Adjusted R2
    const r2 = sst !== 0 ? 1 - (sse / sst) : 0;
    const adjR2 = dfResid > 0 ? 1 - ((1 - r2) * (n - 1) / dfResid) : 0;

    // F-statistic and F p-value
    const msr = ssr / dfModel;
    const fStat = mse > 0 ? msr / mse : 0;
    const fPValue = StatDistributions.fPValue(fStat, dfModel, dfResid);

    // CV(RMSE) and NMBE according to ASHRAE Guideline 14 & ISO 50006
    const cvRmse = yMean !== 0 ? (rmse / yMean) * 100 : 0;
    const bias = residuals.reduce((a, b) => a + b, 0);
    const nmbe = yMean !== 0 ? (bias / (n * yMean)) * 100 : 0;

    // Normative compliance checks (ASHRAE 14 monthly criteria)
    const compliance = {
      cvRmsePass: cvRmse <= 15.0,
      cvRmseThreshold: 15.0,
      nmbePass: Math.abs(nmbe) <= 0.5,
      nmbeThreshold: 0.5,
      r2Pass: r2 >= 0.75,
      r2Threshold: 0.75,
      overallValid: cvRmse <= 15.0 && Math.abs(nmbe) <= 0.5 && r2 >= 0.75
    };

    return {
      targetCol,
      driverCols,
      nObservations: n,
      dfModel,
      dfResid,
      beta,
      coefficients,
      fittedValues: fitted,
      residuals,
      yMean,
      sse,
      sst,
      ssr,
      r2,
      adjR2,
      rmse,
      cvRmse,
      nmbe,
      fStatistic: fStat,
      fPValue,
      compliance,
      covBeta,
      XTX_inv
    };
  }

  /**
   * Predict expected energy for a single observation or an array of rows
   */
  static predictRow(model, row) {
    let pred = model.beta[0]; // intercept
    for (let j = 0; j < model.driverCols.length; j++) {
      const d = model.driverCols[j];
      const val = Number(row[d]);
      pred += model.beta[j + 1] * val;
    }
    return pred;
  }

  /**
   * Perform Measurement & Verification (M&V) evaluation and CUSUM calculation
   * on the reporting period (or entire dataset)
   * @param {Object} baselineModel Fitted model from BaselineEngine.fitLinear
   * @param {Array<Object>} allRows Complete array of historical and reporting rows
   * @param {number} baselineEndIdx Index of last baseline row (inclusive)
   * @param {string} dateCol Column name for periods/dates
   * @returns {Object} Comprehensive evaluation metrics, time series and CUSUM
   */
  static evaluatePerformance(baselineModel, allRows, baselineEndIdx, dateCol = "periodo") {
    const series = [];
    let totalExpectedReporting = 0;
    let totalActualReporting = 0;
    let totalSavingsReporting = 0;
    let cusum = 0;

    const m = allRows.length - (baselineEndIdx + 1); // Number of reporting periods
    const n = baselineEndIdx + 1; // Number of baseline periods

    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      const date = row[dateCol] || `P${i + 1}`;
      const actual = Number(row[baselineModel.targetCol]);
      const expected = this.predictRow(baselineModel, row);
      
      const isBaseline = i <= baselineEndIdx;
      const isReporting = !isBaseline;

      // In M&V: Saving = Expected (Baseline adjusted) - Actual (Observed)
      // Positive = Energy Saved. Negative = Overconsumption
      const saving = expected - actual;
      const savingPct = expected !== 0 ? (saving / expected) * 100 : 0;

      // CUSUM accumulates savings across periods
      cusum += saving;

      // Standardized residual: (Actual - Expected) / RMSE
      const stdResidual = baselineModel.rmse > 0 ? (actual - expected) / baselineModel.rmse : 0;

      if (isReporting) {
        totalExpectedReporting += expected;
        totalActualReporting += actual;
        totalSavingsReporting += saving;
      }

      series.push({
        index: i,
        date,
        isBaseline,
        isReporting,
        actual,
        expected,
        saving,
        savingPct,
        cusum,
        stdResidual,
        rawRow: row
      });
    }

    const netSavingsPct = totalExpectedReporting !== 0 ? 
      (totalSavingsReporting / totalExpectedReporting) * 100 : 0;

    // Uncertainty of cumulative savings according to ASHRAE Guideline 14 / IPMVP
    // Formula for uncertainty at 95% confidence interval:
    // U_95% = t_crit * (CV_RMSE / sqrt(m)) * sqrt(1 + m/n)
    const dfResid = baselineModel.dfResid;
    const tCrit = StatDistributions.tCritical95(dfResid);
    
    // Absolute uncertainty in energy units:
    // SE_total = RMSE * sqrt(m * (1 + m/n))
    const seSavingsTotal = m > 0 ? baselineModel.rmse * Math.sqrt(m * (1.0 + m / n)) : 0;
    const uncertaintyUnits95 = tCrit * seSavingsTotal;
    const uncertaintyPct95 = totalSavingsReporting !== 0 ? 
      Math.abs((uncertaintyUnits95 / totalSavingsReporting) * 100) : 0;

    return {
      series,
      baselineCount: n,
      reportingCount: m,
      totalExpectedReporting,
      totalActualReporting,
      totalSavingsReporting,
      netSavingsPct,
      tCritical: tCrit,
      seSavingsTotal,
      uncertaintyUnits95,
      uncertaintyPct95,
      cusumFinal: cusum
    };
  }
}
