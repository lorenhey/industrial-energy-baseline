/**
 * industrial-energy-baseline - High-Fidelity SVG Interactive Chart Renderer
 * Vector graphics with clean dark aerospace/industrial styling, tooltips,
 * confidence intervals, and ISO 50006 annotations.
 */

class ChartRenderer {
  /**
   * Helper to format numbers cleanly with SI/local thousands separator
   */
  static fmt(num, decimals = 1) {
    if (num === null || num === undefined || isNaN(num)) return "-";
    return Number(num).toLocaleString("es-AR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Render Time-Series Chart: Actual vs Expected with Savings Shading & Cutoff
   */
  static renderTimeSeries(containerId, perfData, energyUnit, energyLabel) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const series = perfData.series;
    if (!series || series.length === 0) {
      container.innerHTML = '<div class="chart-empty">No hay datos para graficar</div>';
      return;
    }

    const width = container.clientWidth || 800;
    const height = 340;
    const pad = { top: 35, right: 30, bottom: 50, left: 75 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    // Find min and max
    let minY = Infinity, maxY = -Infinity;
    series.forEach(d => {
      minY = Math.min(minY, d.actual, d.expected);
      maxY = Math.max(maxY, d.actual, d.expected);
    });
    const yMargin = (maxY - minY) * 0.15 || 100;
    const y0 = Math.max(0, minY - yMargin);
    const y1 = maxY + yMargin;

    const scaleX = i => pad.left + (i / (series.length - 1)) * chartW;
    const scaleY = val => pad.top + chartH - ((val - y0) / (y1 - y0)) * chartH;

    // Build SVG
    let svg = `<svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="xMidYMid meet">`;

    // Definitions for gradients and markers
    svg += `
      <defs>
        <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#10b981" stop-opacity="0.05"/>
        </linearGradient>
        <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ef4444" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#ef4444" stop-opacity="0.05"/>
        </linearGradient>
      </defs>
    `;

    // Horizontal grid lines
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const val = y0 + (i / yTicks) * (y1 - y0);
      const yPos = scaleY(val);
      svg += `<line x1="${pad.left}" y1="${yPos}" x2="${pad.left + chartW}" y2="${yPos}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3,3"/>`;
      svg += `<text x="${pad.left - 10}" y="${yPos + 4}" fill="#94a3b8" font-size="11" text-anchor="end">${this.fmt(val, 0)}</text>`;
    }

    // Baseline Cutoff Vertical Line
    const cutoffIdx = perfData.baselineCount - 1;
    if (cutoffIdx >= 0 && cutoffIdx < series.length - 1) {
      const cutoffX = (scaleX(cutoffIdx) + scaleX(cutoffIdx + 1)) / 2;
      svg += `<line x1="${cutoffX}" y1="${pad.top}" x2="${cutoffX}" y2="${pad.top + chartH}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4,4"/>`;
      svg += `<rect x="${cutoffX - 60}" y="${pad.top - 24}" width="120" height="20" rx="4" fill="#1e293b" stroke="#f59e0b" stroke-width="1"/>`;
      svg += `<text x="${cutoffX}" y="${pad.top - 10}" fill="#fbbf24" font-size="10" font-weight="600" text-anchor="middle">Fin Línea Base / M&amp;V</text>`;
    }

    // Fill between lines for savings in reporting period
    let polyPoints = [];
    const repStart = perfData.baselineCount;
    if (repStart < series.length) {
      // Create area between expected and actual
      let areaD = `M ${scaleX(repStart)} ${scaleY(series[repStart].expected)}`;
      for (let i = repStart; i < series.length; i++) {
        areaD += ` L ${scaleX(i)} ${scaleY(series[i].expected)}`;
      }
      for (let i = series.length - 1; i >= repStart; i--) {
        areaD += ` L ${scaleX(i)} ${scaleY(series[i].actual)}`;
      }
      areaD += " Z";
      svg += `<path d="${areaD}" fill="url(#savingsGrad)"/>`;
    }

    // Expected line (dashed cyan)
    let expectedPath = "";
    series.forEach((d, i) => {
      expectedPath += `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.expected)} `;
    });
    svg += `<path d="${expectedPath}" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="5,4"/>`;

    // Actual line (solid emerald)
    let actualPath = "";
    series.forEach((d, i) => {
      actualPath += `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.actual)} `;
    });
    svg += `<path d="${actualPath}" fill="none" stroke="#10b981" stroke-width="3"/>`;

    // Data points & interaction
    series.forEach((d, i) => {
      const cx = scaleX(i);
      const cyAct = scaleY(d.actual);
      const cyExp = scaleY(d.expected);

      // Expected point
      svg += `<circle cx="${cx}" cy="${cyExp}" r="3.5" fill="#38bdf8" stroke="#0a0f1d" stroke-width="1"/>`;

      // Actual point
      const ptColor = d.isReporting ? (d.saving >= 0 ? "#10b981" : "#ef4444") : "#06b6d4";
      svg += `
        <circle cx="${cx}" cy="${cyAct}" r="5" fill="${ptColor}" stroke="#ffffff" stroke-width="1.5" class="chart-point">
          <title>${d.date}\nReal: ${this.fmt(d.actual, 0)} ${energyUnit}\nModelo: ${this.fmt(d.expected, 0)} ${energyUnit}\nAhorro: ${this.fmt(d.saving, 0)} ${energyUnit} (${this.fmt(d.savingPct, 1)}%)</title>
        </circle>
      `;

      // X-axis label (every 2 periods if dense)
      if (series.length <= 16 || i % 2 === 0 || i === series.length - 1) {
        svg += `<text x="${cx}" y="${pad.top + chartH + 18}" fill="#94a3b8" font-size="10.5" text-anchor="middle">${d.date}</text>`;
      }
    });

    // Axis titles
    svg += `<text x="${pad.left}" y="${pad.top - 12}" fill="#94a3b8" font-size="11" font-weight="600">${energyLabel} [${energyUnit}]</text>`;

    // Interactive Legend
    svg += `
      <g transform="translate(${pad.left + chartW - 270}, ${pad.top - 18})">
        <line x1="0" y1="0" x2="20" y2="0" stroke="#10b981" stroke-width="3"/>
        <circle cx="10" cy="0" r="3.5" fill="#10b981"/>
        <text x="26" y="4" fill="#e2e8f0" font-size="11">Consumo Real</text>

        <line x1="125" y1="0" x2="145" y2="0" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="4,3"/>
        <circle cx="135" cy="0" r="3" fill="#38bdf8"/>
        <text x="151" y="4" fill="#e2e8f0" font-size="11">Línea Base (Ajustada)</text>
      </g>
    `;

    svg += '</svg>';
    container.innerHTML = svg;
  }

  /**
   * Render CUSUM (Cumulative Sum of Differences) Curve
   */
  static renderCusum(containerId, perfData, energyUnit) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const series = perfData.series;
    if (!series || series.length === 0) {
      container.innerHTML = '<div class="chart-empty">No hay datos para graficar CUSUM</div>';
      return;
    }

    const width = container.clientWidth || 800;
    const height = 320;
    const pad = { top: 35, right: 30, bottom: 50, left: 80 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    let minC = Infinity, maxC = -Infinity;
    series.forEach(d => {
      minC = Math.min(minC, d.cusum);
      maxC = Math.max(maxC, d.cusum);
    });
    // Include 0 in range
    minC = Math.min(0, minC);
    maxC = Math.max(0, maxC);

    const cMargin = (maxC - minC) * 0.15 || 50;
    const y0 = minC - cMargin;
    const y1 = maxC + cMargin;

    const scaleX = i => pad.left + (i / (series.length - 1)) * chartW;
    const scaleY = val => pad.top + chartH - ((val - y0) / (y1 - y0)) * chartH;

    let svg = `<svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="xMidYMid meet">`;

    // Definitions
    svg += `
      <defs>
        <linearGradient id="cusumArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.30"/>
          <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
    `;

    // Grid lines
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const val = y0 + (i / yTicks) * (y1 - y0);
      const yPos = scaleY(val);
      svg += `<line x1="${pad.left}" y1="${yPos}" x2="${pad.left + chartW}" y2="${yPos}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3,3"/>`;
      svg += `<text x="${pad.left - 10}" y="${yPos + 4}" fill="#94a3b8" font-size="11" text-anchor="end">${this.fmt(val, 0)}</text>`;
    }

    // Zero Reference Line
    const zeroY = scaleY(0);
    svg += `<line x1="${pad.left}" y1="${zeroY}" x2="${pad.left + chartW}" y2="${zeroY}" stroke="#64748b" stroke-width="1.5"/>`;
    svg += `<text x="${pad.left + chartW - 5}" y="${zeroY - 6}" fill="#64748b" font-size="10" text-anchor="end">Línea Cero (Sin Ahorro)</text>`;

    // Baseline Cutoff Marker
    const cutoffIdx = perfData.baselineCount - 1;
    if (cutoffIdx >= 0 && cutoffIdx < series.length - 1) {
      const cutoffX = (scaleX(cutoffIdx) + scaleX(cutoffIdx + 1)) / 2;
      svg += `<line x1="${cutoffX}" y1="${pad.top}" x2="${cutoffX}" y2="${pad.top + chartH}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4,4"/>`;
      svg += `<text x="${cutoffX}" y="${pad.top - 8}" fill="#fbbf24" font-size="10" font-weight="600" text-anchor="middle">Comienzo de Medidas</text>`;
    }

    // CUSUM Fill Area
    let areaD = `M ${scaleX(0)} ${zeroY}`;
    series.forEach((d, i) => {
      areaD += ` L ${scaleX(i)} ${scaleY(d.cusum)}`;
    });
    areaD += ` L ${scaleX(series.length - 1)} ${zeroY} Z`;
    svg += `<path d="${areaD}" fill="url(#cusumArea)"/>`;

    // CUSUM Line
    let cusumPath = "";
    series.forEach((d, i) => {
      cusumPath += `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.cusum)} `;
    });
    svg += `<path d="${cusumPath}" fill="none" stroke="#10b981" stroke-width="3"/>`;

    // Data points
    series.forEach((d, i) => {
      const cx = scaleX(i);
      const cy = scaleY(d.cusum);
      const ptColor = d.cusum >= 0 ? "#10b981" : "#ef4444";
      svg += `
        <circle cx="${cx}" cy="${cy}" r="4.5" fill="${ptColor}" stroke="#ffffff" stroke-width="1.5">
          <title>${d.date}\nCUSUM Acumulado: ${this.fmt(d.cusum, 0)} ${energyUnit}\nAhorro mensual: ${this.fmt(d.saving, 0)} ${energyUnit}</title>
        </circle>
      `;

      if (series.length <= 16 || i % 2 === 0 || i === series.length - 1) {
        svg += `<text x="${cx}" y="${pad.top + chartH + 18}" fill="#94a3b8" font-size="10.5" text-anchor="middle">${d.date}</text>`;
      }
    });

    // Title & Final Savings Annotation
    svg += `<text x="${pad.left}" y="${pad.top - 12}" fill="#94a3b8" font-size="11" font-weight="600">Ahorro Acumulado CUSUM [${energyUnit}]</text>`;

    const finalVal = perfData.cusumFinal;
    const finalX = scaleX(series.length - 1);
    const finalY = scaleY(finalVal);
    svg += `
      <g transform="translate(${finalX - 110}, ${Math.max(pad.top + 25, finalY - 35)})">
        <rect width="115" height="26" rx="5" fill="#0f172a" stroke="#10b981" stroke-width="1.5"/>
        <text x="57" y="17" fill="#10b981" font-size="11" font-weight="700" text-anchor="middle">Total: +${this.fmt(finalVal, 0)}</text>
      </g>
    `;

    svg += '</svg>';
    container.innerHTML = svg;
  }

  /**
   * Render Scatter Plot with Regression Line and 95% Confidence Band
   */
  static renderScatterRegression(containerId, baselineModel, allRows, primaryDriver) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = 330;
    const pad = { top: 35, right: 30, bottom: 50, left: 75 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    // Filter points and get ranges for primary driver and energy
    const pts = allRows.map((r, i) => ({
      x: Number(r[primaryDriver.id]),
      y: Number(r[baselineModel.targetCol]),
      isBaseline: i < baselineModel.nObservations,
      period: r.periodo || r.mes || r.quincena || `P${i + 1}`
    })).filter(p => !isNaN(p.x) && !isNaN(p.y));

    if (pts.length === 0) {
      container.innerHTML = '<div class="chart-empty">Sin datos para dispersión</div>';
      return;
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    pts.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    const xMargin = (maxX - minX) * 0.08 || 10;
    const yMargin = (maxY - minY) * 0.12 || 100;
    const x0 = Math.max(0, minX - xMargin);
    const x1 = maxX + xMargin;
    const y0 = Math.max(0, minY - yMargin);
    const y1 = maxY + yMargin;

    const scaleX = val => pad.left + ((val - x0) / (x1 - x0)) * chartW;
    const scaleY = val => pad.top + chartH - ((val - y0) / (y1 - y0)) * chartH;

    let svg = `<svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="xMidYMid meet">`;

    // Definitions for confidence band
    svg += `
      <defs>
        <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.20"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.05"/>
        </linearGradient>
      </defs>
    `;

    // Y Grid lines
    for (let i = 0; i <= 5; i++) {
      const val = y0 + (i / 5) * (y1 - y0);
      const yPos = scaleY(val);
      svg += `<line x1="${pad.left}" y1="${yPos}" x2="${pad.left + chartW}" y2="${yPos}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3,3"/>`;
      svg += `<text x="${pad.left - 10}" y="${yPos + 4}" fill="#94a3b8" font-size="11" text-anchor="end">${this.fmt(val, 0)}</text>`;
    }

    // X Grid lines
    for (let i = 0; i <= 5; i++) {
      const val = x0 + (i / 5) * (x1 - x0);
      const xPos = scaleX(val);
      svg += `<line x1="${xPos}" y1="${pad.top}" x2="${xPos}" y2="${pad.top + chartH}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3,3"/>`;
      svg += `<text x="${xPos}" y="${pad.top + chartH + 18}" fill="#94a3b8" font-size="11" text-anchor="middle">${this.fmt(val, 0)}</text>`;
    }

    // Draw Regression Line: compute predictions across driver range holding others at mean
    const steps = 40;
    const bandPts = [];
    const tCrit = StatDistributions.tCritical95(baselineModel.dfResid);
    const rmse = baselineModel.rmse;

    for (let s = 0; s <= steps; s++) {
      const testX = x0 + (s / steps) * (x1 - x0);
      // Dummy row with mean values for all drivers
      const dummyRow = {};
      baselineModel.driverCols.forEach(d => {
        if (d === primaryDriver.id) {
          dummyRow[d] = testX;
        } else {
          // Average of baseline rows
          let sum = 0;
          for (let k = 0; k < baselineModel.nObservations; k++) {
            sum += Number(allRows[k][d]);
          }
          dummyRow[d] = sum / baselineModel.nObservations;
        }
      });

      const yHat = BaselineEngine.predictRow(baselineModel, dummyRow);
      // Approximate 95% individual prediction interval width:
      // PI = t_crit * rmse * sqrt(1 + 1/n + (x - x_bar)^2 / sum((x_i - x_bar)^2))
      const margin = tCrit * rmse * 1.15;
      bandPts.push({
        x: testX,
        y: yHat,
        yUpper: yHat + margin,
        yLower: Math.max(0, yHat - margin)
      });
    }

    // Confidence band polygon
    let bandD = `M ${scaleX(bandPts[0].x)} ${scaleY(bandPts[0].yUpper)}`;
    bandPts.forEach(p => {
      bandD += ` L ${scaleX(p.x)} ${scaleY(p.yUpper)}`;
    });
    for (let k = bandPts.length - 1; k >= 0; k--) {
      bandD += ` L ${scaleX(bandPts[k].x)} ${scaleY(bandPts[k].yLower)}`;
    }
    bandD += " Z";
    svg += `<path d="${bandD}" fill="url(#bandGrad)"/>`;

    // Regression Line
    let regLineD = `M ${scaleX(bandPts[0].x)} ${scaleY(bandPts[0].y)}`;
    bandPts.forEach(p => {
      regLineD += ` L ${scaleX(p.x)} ${scaleY(p.y)}`;
    });
    svg += `<path d="${regLineD}" fill="none" stroke="#38bdf8" stroke-width="2.5"/>`;

    // Scatter Points
    pts.forEach(p => {
      const cx = scaleX(p.x);
      const cy = scaleY(p.y);
      if (p.isBaseline) {
        // Cyan circle for baseline
        svg += `
          <circle cx="${cx}" cy="${cy}" r="5" fill="#38bdf8" stroke="#ffffff" stroke-width="1.2">
            <title>Línea Base: ${p.period}\n${primaryDriver.label}: ${this.fmt(p.x, 1)} ${primaryDriver.unit}\nConsumo: ${this.fmt(p.y, 0)}</title>
          </circle>
        `;
      } else {
        // Emerald or amber triangle for reporting
        svg += `
          <polygon points="${cx},${cy - 5.5} ${cx - 5},${cy + 4.5} ${cx + 5},${cy + 4.5}" fill="#10b981" stroke="#ffffff" stroke-width="1.2">
            <title>Reporte: ${p.period}\n${primaryDriver.label}: ${this.fmt(p.x, 1)} ${primaryDriver.unit}\nConsumo: ${this.fmt(p.y, 0)}</title>
          </polygon>
        `;
      }
    });

    // Titles
    svg += `<text x="${pad.left}" y="${pad.top - 12}" fill="#94a3b8" font-size="11" font-weight="600">Consumo Energético vs ${primaryDriver.label}</text>`;
    svg += `<text x="${pad.left + chartW / 2}" y="${height - 10}" fill="#94a3b8" font-size="11" text-anchor="middle">${primaryDriver.label} [${primaryDriver.unit}]</text>`;

    // Equation and R2 box
    const r2Txt = `R² = ${baselineModel.r2.toFixed(3)} | CV(RMSE) = ${baselineModel.cvRmse.toFixed(1)}%`;
    svg += `
      <g transform="translate(${pad.left + chartW - 220}, ${pad.top + 8})">
        <rect width="215" height="24" rx="4" fill="#0f172a" stroke="#38bdf8" stroke-width="1"/>
        <text x="107" y="16" fill="#38bdf8" font-size="10.5" font-weight="600" text-anchor="middle">${r2Txt}</text>
      </g>
    `;

    svg += '</svg>';
    container.innerHTML = svg;
  }

  /**
   * Render Standardized Residuals Distribution
   */
  static renderResiduals(containerId, baselineModel, perfData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const series = perfData.series;
    if (!series || series.length === 0) return;

    const width = container.clientWidth || 800;
    const height = 260;
    const pad = { top: 25, right: 30, bottom: 45, left: 60 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    const scaleX = i => pad.left + (i / (series.length - 1)) * chartW;
    const scaleY = val => pad.top + chartH / 2 - (val / 3.5) * (chartH / 2);

    let svg = `<svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="xMidYMid meet">`;

    // 2-sigma and 3-sigma bands
    const y2p = scaleY(2);
    const y2n = scaleY(-2);
    const y0 = scaleY(0);

    svg += `<rect x="${pad.left}" y="${y2p}" width="${chartW}" height="${y2n - y2p}" fill="rgba(16, 185, 129, 0.06)"/>`;
    svg += `<line x1="${pad.left}" y1="${y2p}" x2="${pad.left + chartW}" y2="${y2p}" stroke="#f59e0b" stroke-width="1" stroke-dasharray="2,2"/>`;
    svg += `<line x1="${pad.left}" y1="${y2n}" x2="${pad.left + chartW}" y2="${y2n}" stroke="#f59e0b" stroke-width="1" stroke-dasharray="2,2"/>`;
    svg += `<line x1="${pad.left}" y1="${y0}" x2="${pad.left + chartW}" y2="${y0}" stroke="#94a3b8" stroke-width="1.2"/>`;

    svg += `<text x="${pad.left - 8}" y="${y2p + 4}" fill="#f59e0b" font-size="10" text-anchor="end">+2σ</text>`;
    svg += `<text x="${pad.left - 8}" y="${y0 + 4}" fill="#94a3b8" font-size="10" text-anchor="end">0</text>`;
    svg += `<text x="${pad.left - 8}" y="${y2n + 4}" fill="#f59e0b" font-size="10" text-anchor="end">-2σ</text>`;

    // Vertical needles for each residual
    series.forEach((d, i) => {
      const cx = scaleX(i);
      const cy = scaleY(d.stdResidual);
      const isOutlier = Math.abs(d.stdResidual) > 2.0;
      const color = isOutlier ? "#ef4444" : (d.isBaseline ? "#38bdf8" : "#10b981");

      svg += `<line x1="${cx}" y1="${y0}" x2="${cx}" y2="${cy}" stroke="${color}" stroke-width="1.8"/>`;
      svg += `
        <circle cx="${cx}" cy="${cy}" r="3.5" fill="${color}">
          <title>${d.date}\nResiduo tipificado: ${d.stdResidual.toFixed(2)} σ</title>
        </circle>
      `;

      if (series.length <= 16 || i % 2 === 0 || i === series.length - 1) {
        svg += `<text x="${cx}" y="${pad.top + chartH + 16}" fill="#94a3b8" font-size="9.5" text-anchor="middle">${d.date}</text>`;
      }
    });

    svg += `<text x="${pad.left}" y="${pad.top - 8}" fill="#94a3b8" font-size="10.5" font-weight="600">Residuos Estandarizados (e / RMSE)</text>`;

    svg += '</svg>';
    container.innerHTML = svg;
  }
}
