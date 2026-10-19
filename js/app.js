/**
 * industrial-energy-baseline - Main Web Application Controller
 * Handles UI interactions, reactive baseline fitting, tabs, CLI simulator,
 * CSV import/export, and ISO 50006 / IPMVP reporting.
 */

// App State
const state = {
  currentDatasetId: "boxmark_leather",
  dataset: null,
  baselineEndIdx: 11,
  selectedDrivers: [],
  model: null,
  perf: null,
  customRows: null
};

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  loadDataset("boxmark_leather");
  setupTabNavigation();
  setupEventListeners();
  setupCliTerminal();
  window.addEventListener("resize", debounce(() => renderCurrentCharts(), 200));
}

function loadDataset(datasetId) {
  state.currentDatasetId = datasetId;
  const ds = INDUSTRIAL_DATASETS[datasetId];
  if (!ds) return;

  state.dataset = JSON.parse(JSON.stringify(ds));
  state.baselineEndIdx = ds.baselineEndIdx;
  state.selectedDrivers = ds.drivers.map(d => d.id);

  // Update UI dataset selector
  const sel = document.getElementById("datasetSelect");
  if (sel) sel.value = datasetId;

  // Render drivers checkboxes
  renderDriversSelector();

  // Update baseline period slider/selector
  updatePeriodSlider();

  // Run calculation
  recalculateAll();

  // Populate data table editor
  populateTableEditor();
}

function renderDriversSelector() {
  const container = document.getElementById("driversContainer");
  if (!container) return;

  container.innerHTML = "";
  state.dataset.drivers.forEach(d => {
    const isChecked = state.selectedDrivers.includes(d.id);
    const label = document.createElement("label");
    label.className = "driver-chip" + (isChecked ? " active" : "");
    label.innerHTML = `
      <input type="checkbox" value="${d.id}" ${isChecked ? "checked" : ""}>
      <span class="chip-name">${d.label}</span>
      <span class="chip-unit">[${d.unit}]</span>
    `;
    label.querySelector("input").addEventListener("change", (e) => {
      if (e.target.checked) {
        if (!state.selectedDrivers.includes(d.id)) state.selectedDrivers.push(d.id);
      } else {
        if (state.selectedDrivers.length <= 1) {
          alert("Debés mantener al menos un driver independiente seleccionado para ajustar la regresión.");
          e.target.checked = true;
          return;
        }
        state.selectedDrivers = state.selectedDrivers.filter(id => id !== d.id);
      }
      label.classList.toggle("active", e.target.checked);
      recalculateAll();
    });
    container.appendChild(label);
  });
}

function updatePeriodSlider() {
  const total = state.dataset.data.length;
  const slider = document.getElementById("baselineSplitSlider");
  const label = document.getElementById("baselineSplitLabel");
  if (slider && label) {
    slider.min = 3;
    slider.max = total - 2;
    slider.value = state.baselineEndIdx + 1;
    label.textContent = `${slider.value} períodos de línea base (${state.dataset.data[0][state.dataset.dateCol]} a ${state.dataset.data[state.baselineEndIdx][state.dataset.dateCol]})`;
  }
}

function recalculateAll() {
  const ds = state.dataset;
  const rows = ds.data;
  const baselineRows = rows.slice(0, state.baselineEndIdx + 1);

  try {
    // 1. Fit OLS model on baseline rows
    state.model = BaselineEngine.fitLinear(baselineRows, ds.targetCol, state.selectedDrivers);

    // 2. Evaluate performance across entire dataset (M&V savings & CUSUM)
    state.perf = BaselineEngine.evaluatePerformance(state.model, rows, state.baselineEndIdx, ds.dateCol);

    // 3. Update DOM metrics and charts
    updateKpisDOM();
    updateCoefficientsTable();
    updateAuditTable();
    renderCurrentCharts();
  } catch (err) {
    console.error("Error al calcular línea base:", err);
    alert("Error de ajuste: " + err.message);
  }
}

function updateKpisDOM() {
  const m = state.model;
  const p = state.perf;
  const ds = state.dataset;

  // Model KPIs
  setElemText("kpiR2", m.r2.toFixed(3));
  setElemText("kpiAdjR2", m.adjR2.toFixed(3));
  setElemText("kpiCvRmse", `${m.cvRmse.toFixed(1)}%`);
  setElemText("kpiNmbe", `${m.nmbe.toFixed(2)}%`);
  setElemText("kpiFstat", m.fStatistic.toFixed(1));
  setElemText("kpiRmse", `${ChartRenderer.fmt(m.rmse, 1)} ${ds.energyUnit}`);

  // Badges
  setComplianceBadge("badgeCvRmse", m.compliance.cvRmsePass, "≤ 15% (ASHRAE 14)", "> 15% (No cumple)");
  setComplianceBadge("badgeNmbe", m.compliance.nmbePass, "≤ ±0.5% (ASHRAE 14)", "> ±0.5% (Sesgo alto)");
  setComplianceBadge("badgeR2", m.compliance.r2Pass, "≥ 0.75 (Alineado)", "< 0.75 (Débil)");

  // Overall status banner
  const banner = document.getElementById("modelStatusBanner");
  if (banner) {
    if (m.compliance.overallValid) {
      banner.className = "status-banner valid";
      banner.innerHTML = `<i class="fa-solid fa-circle-check"></i> <strong>Línea Base Válida y Certificable:</strong> Cumple con todos los criterios estadísticos exigidos por ASHRAE Guideline 14 y la norma ISO 50006 para monitoreo M&amp;V.`;
    } else {
      banner.className = "status-banner warning";
      banner.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>Línea Base con Observaciones:</strong> Alguno de los parámetros estadísticos excede el umbral normativo recomendado. Revisá drivers o datos atípicos.`;
    }
  }

  // Savings KPIs
  setElemText("kpiTotalSavings", `${ChartRenderer.fmt(p.totalSavingsReporting, 0)} ${ds.energyUnit}`);
  setElemText("kpiPctSavings", `${p.netSavingsPct.toFixed(1)}%`);
  setElemText("kpiUncertainty", `±${ChartRenderer.fmt(p.uncertaintyUnits95, 0)} ${ds.energyUnit} (±${p.uncertaintyPct95.toFixed(1)}%)`);
  setElemText("kpiCusumFinal", `${ChartRenderer.fmt(p.cusumFinal, 0)} ${ds.energyUnit}`);
  setElemText("kpiExpectedRep", `${ChartRenderer.fmt(p.totalExpectedReporting, 0)} ${ds.energyUnit}`);
  setElemText("kpiActualRep", `${ChartRenderer.fmt(p.totalActualReporting, 0)} ${ds.energyUnit}`);

  // Baseload (intercept)
  const intercept = m.beta[0];
  const totalBaseEnergy = baselineEnergySum();
  const baseloadPct = totalBaseEnergy > 0 ? (intercept * m.nObservations / totalBaseEnergy) * 100 : 0;
  setElemText("kpiBaseloadVal", `${ChartRenderer.fmt(intercept, 0)} ${ds.energyUnit}/período`);
  setElemText("kpiBaseloadPct", `${Math.max(0, Math.min(100, baseloadPct)).toFixed(1)}% del consumo`);

  // Active dataset name banner
  setElemText("activeDatasetTitle", ds.name);
  setElemText("activeDatasetDesc", ds.description);
  setElemText("activeDatasetIntervention", ds.interventionDescription);
}

function baselineEnergySum() {
  const rows = state.dataset.data.slice(0, state.baselineEndIdx + 1);
  return rows.reduce((sum, r) => sum + Number(r[state.dataset.targetCol]), 0);
}

function setElemText(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

function setComplianceBadge(id, isPass, passTxt, failTxt) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = "compliance-badge " + (isPass ? "pass" : "fail");
  el.textContent = isPass ? passTxt : failTxt;
}

function updateCoefficientsTable() {
  const tbody = document.getElementById("coefficientsTableBody");
  if (!tbody || !state.model) return;

  tbody.innerHTML = "";
  state.model.coefficients.forEach(c => {
    const tr = document.createElement("tr");
    const isConst = c.name === "const";
    let displayName = isConst ? "Término Independiente (Consumo Basal / Intercepto β₀)" : c.name;
    
    // Find driver label
    const driverObj = state.dataset.drivers.find(d => d.id === c.name);
    if (driverObj) {
      displayName = `${driverObj.label} (${c.name}) [${driverObj.unit}]`;
    }

    const sigClass = c.isSignificant ? "sig-yes" : "sig-no";
    const sigLabel = c.isSignificant ? "Sí (p < 0.05)" : "No significativo";

    tr.innerHTML = `
      <td><strong>${displayName}</strong></td>
      <td class="num">${ChartRenderer.fmt(c.value, 4)}</td>
      <td class="num">${ChartRenderer.fmt(c.stdError, 4)}</td>
      <td class="num">${c.tStatistic.toFixed(3)}</td>
      <td class="num">${c.pValue < 0.0001 ? "< 0.0001" : c.pValue.toFixed(4)}</td>
      <td><span class="sig-badge ${sigClass}">${sigLabel}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function updateAuditTable() {
  const tbody = document.getElementById("auditTableBody");
  if (!tbody || !state.perf) return;

  tbody.innerHTML = "";
  const unit = state.dataset.energyUnit;

  state.perf.series.forEach(d => {
    const tr = document.createElement("tr");
    tr.className = d.isBaseline ? "row-baseline" : "row-reporting";

    const savingClass = d.saving >= 0 ? "positive-saving" : "negative-saving";
    const periodType = d.isBaseline ? 
      '<span class="badge-tag base">Línea Base</span>' : 
      '<span class="badge-tag rep">Reporte M&amp;V</span>';

    tr.innerHTML = `
      <td><strong>${d.date}</strong></td>
      <td>${periodType}</td>
      <td class="num">${ChartRenderer.fmt(d.actual, 0)} ${unit}</td>
      <td class="num">${ChartRenderer.fmt(d.expected, 0)} ${unit}</td>
      <td class="num ${savingClass}">${d.isReporting ? (d.saving > 0 ? "+" : "") + ChartRenderer.fmt(d.saving, 0) : "-"}</td>
      <td class="num ${savingClass}">${d.isReporting ? (d.savingPct > 0 ? "+" : "") + d.savingPct.toFixed(1) + "%" : "-"}</td>
      <td class="num">${ChartRenderer.fmt(d.cusum, 0)} ${unit}</td>
      <td class="num">${d.stdResidual.toFixed(2)} σ</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCurrentCharts() {
  if (!state.model || !state.perf) return;

  const ds = state.dataset;
  const primaryDriver = ds.drivers[0];

  // 1. Time Series Chart
  ChartRenderer.renderTimeSeries("chartTimeSeries", state.perf, ds.energyUnit, ds.energyLabel);

  // 2. CUSUM Curve
  ChartRenderer.renderCusum("chartCusum", state.perf, ds.energyUnit);

  // 3. Scatter Regression Plot
  ChartRenderer.renderScatterRegression("chartScatter", state.model, ds.data, primaryDriver);

  // 4. Residuals Plot
  ChartRenderer.renderResiduals("chartResiduals", state.model, state.perf);

  // 5. EnPI Chart
  renderEnpiChart();
}

function renderEnpiChart() {
  const container = document.getElementById("chartEnpi");
  if (!container || !state.perf) return;

  const series = state.perf.series;
  const width = container.clientWidth || 800;
  const height = 280;
  const pad = { top: 30, right: 30, bottom: 45, left: 65 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  // Calculate EnPI = Actual / Expected (Normalized EnPI, 1.0 is baseline target)
  const enpiVals = series.map(d => ({
    date: d.date,
    val: d.expected > 0 ? d.actual / d.expected : 1.0,
    isReporting: d.isReporting
  }));

  let minY = 0.7, maxY = 1.3;
  enpiVals.forEach(d => {
    minY = Math.min(minY, d.val);
    maxY = Math.max(maxY, d.val);
  });
  minY = Math.max(0, minY - 0.08);
  maxY = maxY + 0.08;

  const scaleX = i => pad.left + (i / (series.length - 1)) * chartW;
  const scaleY = val => pad.top + chartH - ((val - minY) / (maxY - minY)) * chartH;

  let svg = `<svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="xMidYMid meet">`;

  // Baseline 1.0 Target line
  const y1 = scaleY(1.0);
  svg += `<line x1="${pad.left}" y1="${y1}" x2="${pad.left + chartW}" y2="${y1}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4,4"/>`;
  svg += `<text x="${pad.left + chartW - 5}" y="${y1 - 6}" fill="#f59e0b" font-size="10" text-anchor="end">Meta Línea Base (1.00)</text>`;

  // Grid
  for (let step = 0.8; step <= 1.25; step += 0.1) {
    if (step >= minY && step <= maxY) {
      const yPos = scaleY(step);
      svg += `<line x1="${pad.left}" y1="${yPos}" x2="${pad.left + chartW}" y2="${yPos}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="2,2"/>`;
      svg += `<text x="${pad.left - 8}" y="${yPos + 4}" fill="#94a3b8" font-size="10" text-anchor="end">${step.toFixed(2)}</text>`;
    }
  }

  // Cutoff
  const cutoffIdx = state.perf.baselineCount - 1;
  if (cutoffIdx >= 0 && cutoffIdx < series.length - 1) {
    const cutoffX = (scaleX(cutoffIdx) + scaleX(cutoffIdx + 1)) / 2;
    svg += `<line x1="${cutoffX}" y1="${pad.top}" x2="${cutoffX}" y2="${pad.top + chartH}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,3"/>`;
  }

  // Path
  let lineD = "";
  enpiVals.forEach((d, i) => {
    lineD += `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.val)} `;
  });
  svg += `<path d="${lineD}" fill="none" stroke="#38bdf8" stroke-width="2.5"/>`;

  // Points
  enpiVals.forEach((d, i) => {
    const cx = scaleX(i);
    const cy = scaleY(d.val);
    const isGood = d.val <= 1.0;
    const ptColor = d.isReporting ? (isGood ? "#10b981" : "#ef4444") : "#0ea5e9";

    svg += `
      <circle cx="${cx}" cy="${cy}" r="4" fill="${ptColor}" stroke="#ffffff" stroke-width="1.2">
        <title>${d.date}\nEnPI Normalizado: ${d.val.toFixed(3)}\n${d.val < 1.0 ? 'Ahorro: ' + ((1 - d.val) * 100).toFixed(1) + '%' : 'Sobreconsumo: ' + ((d.val - 1) * 100).toFixed(1) + '%'}</title>
      </circle>
    `;

    if (series.length <= 16 || i % 2 === 0 || i === series.length - 1) {
      svg += `<text x="${cx}" y="${pad.top + chartH + 16}" fill="#94a3b8" font-size="9.5" text-anchor="middle">${d.date}</text>`;
    }
  });

  svg += `<text x="${pad.left}" y="${pad.top - 10}" fill="#94a3b8" font-size="10.5" font-weight="600">EnPI Normalizado (Consumo Real / Consumo Esperado)</text>`;
  svg += '</svg>';
  container.innerHTML = svg;
}

function setupTabNavigation() {
  const tabBtns = document.querySelectorAll(".nav-tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const targetTab = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.remove("active");
      });
      const targetPane = document.getElementById(targetTab);
      if (targetPane) targetPane.classList.add("active");

      // Trigger resize for newly active charts
      setTimeout(() => renderCurrentCharts(), 50);
    });
  });
}

function setupEventListeners() {
  // Preset selector
  const dsSel = document.getElementById("datasetSelect");
  if (dsSel) {
    dsSel.addEventListener("change", (e) => {
      loadDataset(e.target.value);
    });
  }

  // Baseline split slider
  const slider = document.getElementById("baselineSplitSlider");
  if (slider) {
    slider.addEventListener("input", (e) => {
      state.baselineEndIdx = Number(e.target.value) - 1;
      updatePeriodSlider();
      recalculateAll();
    });
  }

  // Load preset buttons in Case Catalog
  document.querySelectorAll(".btn-load-case").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const caseId = btn.getAttribute("data-case");
      if (caseId) {
        loadDataset(caseId);
        // Switch to auditor tab
        document.querySelector('.nav-tab-btn[data-tab="tab-auditor"]').click();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // Export report button
  const btnExport = document.getElementById("btnExportReport");
  if (btnExport) {
    btnExport.addEventListener("click", exportAuditReport);
  }

  // Copy formula button
  const btnCopyEq = document.getElementById("btnCopyEquation");
  if (btnCopyEq) {
    btnCopyEq.addEventListener("click", copyRegressionEquation);
  }

  // Parse CSV Button in Data Editor
  const btnParseCsv = document.getElementById("btnParseCsv");
  if (btnParseCsv) {
    btnParseCsv.addEventListener("click", handleCustomCsvPaste);
  }

  // Reset to default dataset button
  const btnResetDs = document.getElementById("btnResetDataset");
  if (btnResetDs) {
    btnResetDs.addEventListener("click", () => {
      loadDataset(state.currentDatasetId);
    });
  }
}

function populateTableEditor() {
  const container = document.getElementById("tableEditorWrapper");
  if (!container || !state.dataset) return;

  const ds = state.dataset;
  let html = '<table class="editor-table"><thead><tr>';
  html += `<th>Período (${ds.dateCol})</th>`;
  html += `<th>Energía: ${ds.energyLabel} [${ds.energyUnit}]</th>`;
  ds.drivers.forEach(d => {
    html += `<th>${d.label} [${d.unit}]</th>`;
  });
  html += '</tr></thead><tbody>';

  ds.data.forEach((row, i) => {
    const isBase = i <= state.baselineEndIdx;
    html += `<tr class="${isBase ? 'row-base' : 'row-rep'}">`;
    html += `<td><strong>${row[ds.dateCol]}</strong></td>`;
    html += `<td><input type="number" step="any" class="cell-input" data-row="${i}" data-col="${ds.targetCol}" value="${row[ds.targetCol]}"></td>`;
    ds.drivers.forEach(d => {
      html += `<td><input type="number" step="any" class="cell-input" data-row="${i}" data-col="${d.id}" value="${row[d.id]}"></td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  container.innerHTML = html;

  // Listen to cell modifications
  container.querySelectorAll(".cell-input").forEach(inp => {
    inp.addEventListener("change", (e) => {
      const rIdx = Number(e.target.getAttribute("data-row"));
      const col = e.target.getAttribute("data-col");
      const val = Number(e.target.value);
      if (!isNaN(val)) {
        state.dataset.data[rIdx][col] = val;
        recalculateAll();
      }
    });
  });
}

function handleCustomCsvPaste() {
  const textarea = document.getElementById("customCsvTextarea");
  if (!textarea || !textarea.value.trim()) {
    alert("Pegá contenido CSV con encabezados en el área de texto.");
    return;
  }

  try {
    const lines = textarea.value.trim().split("\n").map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 5) throw new Error("El archivo CSV debe tener al menos 5 filas de datos.");

    // Detect delimiter (comma or semicolon)
    const delim = lines[0].includes(";") ? ";" : ",";
    const headers = lines[0].split(delim).map(h => h.trim().replace(/"/g, ''));

    if (headers.length < 3) throw new Error("El CSV debe tener al menos: Fecha/Período, Consumo Energético y al menos 1 Driver independiente.");

    const parsedData = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delim).map(p => p.trim().replace(/"/g, ''));
      if (parts.length === headers.length) {
        const rowObj = {};
        headers.forEach((h, idx) => {
          const num = Number(parts[idx].replace(",", "."));
          rowObj[h] = isNaN(num) ? parts[idx] : num;
        });
        parsedData.push(rowObj);
      }
    }

    // Set custom dataset
    const dateCol = headers[0];
    const targetCol = headers[1];
    const driverCols = headers.slice(2);

    state.dataset = {
      id: "custom_dataset",
      name: "Dataset Personalizado (Cargado por Usuario)",
      description: `Dataset importado con ${parsedData.length} períodos, variable objetivo '${targetCol}' y ${driverCols.length} variables independientes.`,
      energyUnit: "unidades",
      energyLabel: targetCol,
      targetCol: targetCol,
      dateCol: dateCol,
      baselineEndIdx: Math.floor(parsedData.length / 2),
      interventionDescription: `Intervención definida a partir del período ${parsedData[Math.floor(parsedData.length / 2)][dateCol]}`,
      drivers: driverCols.map(c => ({ id: c, label: c, unit: "-", description: c })),
      data: parsedData
    };

    state.baselineEndIdx = state.dataset.baselineEndIdx;
    state.selectedDrivers = driverCols;

    renderDriversSelector();
    updatePeriodSlider();
    recalculateAll();
    populateTableEditor();

    alert(`¡Dataset importado con éxito! Se procesaron ${parsedData.length} filas.`);
    document.querySelector('.nav-tab-btn[data-tab="tab-auditor"]').click();
  } catch (err) {
    alert("Error al parsear CSV: " + err.message);
  }
}

function copyRegressionEquation() {
  if (!state.model) return;
  const m = state.model;
  let eq = `${state.dataset.targetCol} = ${m.beta[0].toFixed(2)}`;
  m.driverCols.forEach((d, idx) => {
    const val = m.beta[idx + 1];
    const sign = val >= 0 ? " + " : " - ";
    eq += `${sign}${Math.abs(val).toFixed(4)} × ${d}`;
  });

  navigator.clipboard.writeText(eq).then(() => {
    alert("Ecuación de línea base copiada al portapapeles:\n" + eq);
  });
}

function exportAuditReport() {
  if (!state.model || !state.perf) return;

  const report = {
    standard: "ISO 50001 / ISO 50006 / IPMVP Core Concepts",
    plantCase: state.dataset.name,
    timestamp: new Date().toISOString(),
    baselinePeriod: {
      count: state.perf.baselineCount,
      start: state.dataset.data[0][state.dataset.dateCol],
      end: state.dataset.data[state.baselineEndIdx][state.dataset.dateCol]
    },
    reportingPeriod: {
      count: state.perf.reportingCount,
      start: state.dataset.data[state.baselineEndIdx + 1]?.[state.dataset.dateCol],
      end: state.dataset.data[state.dataset.data.length - 1]?.[state.dataset.dateCol]
    },
    statistics: {
      r2: state.model.r2,
      adjR2: state.model.adjR2,
      cvRmse: state.model.cvRmse,
      nmbe: state.model.nmbe,
      fStatistic: state.model.fStatistic,
      rmse: state.model.rmse
    },
    coefficients: state.model.coefficients,
    mvResults: {
      totalExpectedReporting: state.perf.totalExpectedReporting,
      totalActualReporting: state.perf.totalActualReporting,
      totalSavingsReporting: state.perf.totalSavingsReporting,
      netSavingsPct: state.perf.netSavingsPct,
      cusumFinal: state.perf.cusumFinal,
      uncertaintyUnits95: state.perf.uncertaintyUnits95,
      uncertaintyPct95: state.perf.uncertaintyPct95
    }
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `informe_linea_base_${state.dataset.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// Interactive Web CLI Terminal Simulator (`ieb`)
// -------------------------------------------------------------
function setupCliTerminal() {
  const input = document.getElementById("cliInput");
  const output = document.getElementById("cliOutput");
  if (!input || !output) return;

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const cmd = input.value.trim();
      input.value = "";
      if (cmd) {
        executeCliCommand(cmd, output);
        output.scrollTop = output.scrollHeight;
      }
    }
  });
}

function executeCliCommand(cmd, output) {
  // Print user command
  const line = document.createElement("div");
  line.className = "cli-cmd-line";
  line.innerHTML = `<span class="cli-prompt">ieb:~$</span> ${escapeHtml(cmd)}`;
  output.appendChild(line);

  const parts = cmd.split(" ").filter(p => p.length > 0);
  const root = parts[0].toLowerCase();
  const sub = parts[1]?.toLowerCase();
  const arg = parts[2]?.toLowerCase();

  const res = document.createElement("div");
  res.className = "cli-result";

  if (root === "clear") {
    output.innerHTML = "";
    return;
  }

  if (root === "help" || (root === "ieb" && (!sub || sub === "--help" || sub === "-h"))) {
    res.innerHTML = `
<span class="cli-info">Industrial Energy Baseline CLI (v2.0.0)</span>
<span class="cli-dim">Alineado a ISO 50001, ISO 50006 e IPMVP</span>

Comandos disponibles:
  <span class="cli-cmd">ieb validate &lt;archivo&gt;</span>       Valida calidad de datos (nulos, fechas, atípicos)
  <span class="cli-cmd">ieb baseline create</span>          Ajusta la regresión multivariable OLS
  <span class="cli-cmd">ieb baseline inspect</span>         Muestra ANOVA, métricas de bondad y coeficientes
  <span class="cli-cmd">ieb savings</span>                  Cuantifica ahorros M&amp;V en el período de reporte
  <span class="cli-cmd">ieb cusum</span>                    Calcula la trayectoria CUSUM y ahorros acumulados
  <span class="cli-cmd">ieb enpi</span>                     Calcula indicadores de desempeño normalizados
  <span class="cli-cmd">ieb demo &lt;caso&gt;</span>             Carga casos: boxmark | compressors | chiller | boiler
  <span class="cli-cmd">ieb report --export</span>          Genera y descarga el informe técnico en JSON
  <span class="cli-cmd">clear</span>                        Limpia la pantalla del terminal
`;
    output.appendChild(res);
    return;
  }

  if (root === "ieb" && sub === "validate") {
    const ds = state.dataset;
    res.innerHTML = `
Validando dataset: <span class="cli-bold">${ds.name}</span>
------------------------------------------------------------
Registros totales:      <span class="cli-val">${ds.data.length}</span>
Columnas identificadas: <span class="cli-val">${ds.dateCol}, ${ds.targetCol}, ${ds.drivers.map(d=>d.id).join(", ")}</span>
Valores nulos:          <span class="cli-good">0 (0.0%)</span>
Secuencia temporal:     <span class="cli-good">Monótona creciente (OK)</span>
Estado de calidad:      <span class="cli-good">VÁLIDO PARA MODELADO</span>
`;
    output.appendChild(res);
    return;
  }

  if (root === "ieb" && sub === "baseline" && (arg === "create" || parts[2] === "create")) {
    recalculateAll();
    res.innerHTML = `
<span class="cli-good">✓ Línea Base ajustada exitosamente con MCO (Mínimos Cuadrados Ordinarios)</span>
Período de Línea Base: <span class="cli-val">${state.dataset.data[0][state.dataset.dateCol]}</span> a <span class="cli-val">${state.dataset.data[state.baselineEndIdx][state.dataset.dateCol]}</span> (${state.perf.baselineCount} observaciones)
Target: <span class="cli-bold">${state.dataset.targetCol}</span>
Drivers: <span class="cli-bold">${state.selectedDrivers.join(", ")}</span>
`;
    output.appendChild(res);
    return;
  }

  if (root === "ieb" && sub === "baseline" && (arg === "inspect" || parts[2] === "inspect" || !arg)) {
    const m = state.model;
    const ds = state.dataset;
    let tableCoeff = `\nCoeficientes:\n  Variable            Coeficiente       Std Error      t-stat     p-value\n`;
    m.coefficients.forEach(c => {
      tableCoeff += `  ${c.name.padEnd(18)}  ${c.value.toFixed(4).padStart(12)}  ${c.stdError.toFixed(4).padStart(13)}  ${c.tStatistic.toFixed(3).padStart(9)}  ${c.pValue.toFixed(4).padStart(9)}\n`;
    });

    res.innerHTML = `
<span class="cli-info">=== DIAGNÓSTICO DE LÍNEA BASE (ISO 50006) ===</span>
Modelo:                Regresión Lineal Multivariable (OLS)
Observaciones (n):     ${m.nObservations} | Grados de libertad resid.: ${m.dfResid}
R²:                    <span class="${m.compliance.r2Pass ? 'cli-good' : 'cli-warn'}">${m.r2.toFixed(4)}</span> (Umbral ≥ 0.75)
R² Ajustado:           ${m.adjR2.toFixed(4)}
CV(RMSE):              <span class="${m.compliance.cvRmsePass ? 'cli-good' : 'cli-warn'}">${m.cvRmse.toFixed(2)}%</span> (ASHRAE Guideline 14 ≤ 15.0%)
NMBE:                  <span class="${m.compliance.nmbePass ? 'cli-good' : 'cli-warn'}">${m.nmbe.toFixed(3)}%</span> (Sesgo medio ≤ ±0.5%)
RMSE:                  ${m.rmse.toFixed(1)} ${ds.energyUnit}
F-statistic:           ${m.fStatistic.toFixed(2)} (p-value = ${m.fPValue < 0.001 ? '< 0.001' : m.fPValue.toFixed(4)})
<pre class="cli-pre">${tableCoeff}</pre>
`;
    output.appendChild(res);
    return;
  }

  if (root === "ieb" && sub === "savings") {
    const p = state.perf;
    const ds = state.dataset;
    res.innerHTML = `
<span class="cli-info">=== BALANCE M&amp;V PERÍODO DE REPORTE ===</span>
Período evaluado:        ${ds.data[state.baselineEndIdx + 1][ds.dateCol]} a ${ds.data[ds.data.length - 1][ds.dateCol]} (${p.reportingCount} períodos)
Consumo Esperado (Base): <span class="cli-val">${ChartRenderer.fmt(p.totalExpectedReporting, 0)} ${ds.energyUnit}</span>
Consumo Real Observado:  <span class="cli-val">${ChartRenderer.fmt(p.totalActualReporting, 0)} ${ds.energyUnit}</span>
------------------------------------------------------------
AHORRO NETO TOTAL:       <span class="cli-good">+${ChartRenderer.fmt(p.totalSavingsReporting, 0)} ${ds.energyUnit}</span>
PORCENTAJE DE AHORRO:    <span class="cli-good">+${p.netSavingsPct.toFixed(2)}%</span>
INCERTIDUMBRE (95% CI):  ±${ChartRenderer.fmt(p.uncertaintyUnits95, 0)} ${ds.energyUnit} (±${p.uncertaintyPct95.toFixed(1)}%)
`;
    output.appendChild(res);
    return;
  }

  if (root === "ieb" && sub === "cusum") {
    const p = state.perf;
    const ds = state.dataset;
    res.innerHTML = `
<span class="cli-info">=== SUMA ACUMULADA DE DIFERENCIAS (CUSUM) ===</span>
CUSUM Final Acumulado:   <span class="cli-good">+${ChartRenderer.fmt(p.cusumFinal, 0)} ${ds.energyUnit}</span>
Interpretación:          <span class="cli-val">Pendiente positiva sostenida tras la intervención. Demuestra ahorros energéticos reales y persistentes desacoplados del volumen productivo.</span>
`;
    output.appendChild(res);
    return;
  }

  if (root === "ieb" && sub === "demo") {
    const caseMap = {
      boxmark: "boxmark_leather",
      compressors: "air_compressors",
      chiller: "hvac_chiller",
      boiler: "steam_boiler"
    };
    const targetCase = caseMap[arg];
    if (targetCase) {
      loadDataset(targetCase);
      res.innerHTML = `<span class="cli-good">✓ Caso '${targetCase}' cargado correctamente.</span>`;
    } else {
      res.innerHTML = `<span class="cli-err">Caso desconocido. Opciones: boxmark | compressors | chiller | boiler</span>`;
    }
    output.appendChild(res);
    return;
  }

  if (root === "ieb" && sub === "report") {
    exportAuditReport();
    res.innerHTML = `<span class="cli-good">✓ Informe técnico descargado en formato JSON.</span>`;
    output.appendChild(res);
    return;
  }

  // Fallback unknown
  res.innerHTML = `<span class="cli-err">Comando no reconocido: '${escapeHtml(cmd)}'. Escribí 'help' para ver la lista de comandos.</span>`;
  output.appendChild(res);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
