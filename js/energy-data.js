/**
 * industrial-energy-baseline - Curated Industrial Datasets & Standards Guidelines
 * ISO 50001 / ISO 50006 / IPMVP / ASHRAE Guideline 14
 */

const INDUSTRIAL_DATASETS = {
  boxmark_leather: {
    id: "boxmark_leather",
    name: "Planta de Curtido y Acabado de Cuero Automotriz (Boxmark Industrial)",
    description: "Monitoreo mensual de 24 períodos de consumo de gas natural (m³) en calderas de vapor para túneles de secado continuo y electricidad (kWh) en líneas de terminado vs producción (m² de cuero procesado) y Grados Día de Calefacción (HDD 18°C). En el mes 13 se implementó aislación térmica de líneas de vapor, recuperación de condensados y quemadores modulantes.",
    energyUnit: "m³ GN",
    energyLabel: "Gas Natural",
    targetCol: "gas_m3",
    dateCol: "periodo",
    baselineEndIdx: 11, // Períodos 0 a 11 son Línea Base 2024
    interventionDescription: "Mes 13 (Ene 2025): Retrofit integral de aislamiento en ramales de vapor de secaderos, trampa de vapor termodinámica y purga automática de calderas.",
    drivers: [
      { id: "produccion_m2", label: "Producción de Cuero", unit: "m²", description: "Superficie neta de cuero vacuno terminado para tapicería automotriz" },
      { id: "hdd_18c", label: "Grados Día Calefacción (HDD 18°C)", unit: "°C·día", description: "Demanda térmica externa que impacta en pérdidas de naves y aire de reposición de secaderos" },
      { id: "horas_marcha", label: "Horas Operativas de Caldera", unit: "h", description: "Horas efectivas en régimen de generación de vapor a 7 bar" }
    ],
    enpi: {
      name: "Consumo Específico Térmico (SEC)",
      unit: "m³/m²",
      formula: "gas_m3 / produccion_m2"
    },
    data: [
      // Período 2024 (Línea Base: 12 meses)
      { periodo: "2024-01", produccion_m2: 42500, hdd_18c: 12, horas_marcha: 540, gas_m3: 38200, kwh: 124500 },
      { periodo: "2024-02", produccion_m2: 39800, hdd_18c: 18, horas_marcha: 510, gas_m3: 36400, kwh: 118200 },
      { periodo: "2024-03", produccion_m2: 45200, hdd_18c: 45, horas_marcha: 575, gas_m3: 41800, kwh: 131400 },
      { periodo: "2024-04", produccion_m2: 46100, hdd_18c: 110, horas_marcha: 580, gas_m3: 45600, kwh: 133800 },
      { periodo: "2024-05", produccion_m2: 48300, hdd_18c: 210, horas_marcha: 610, gas_m3: 52100, kwh: 139500 },
      { periodo: "2024-06", produccion_m2: 44700, hdd_18c: 320, horas_marcha: 570, gas_m3: 55400, kwh: 132100 },
      { periodo: "2024-07", produccion_m2: 43200, hdd_18c: 360, horas_marcha: 560, gas_m3: 56800, kwh: 129000 },
      { periodo: "2024-08", produccion_m2: 47900, hdd_18c: 280, horas_marcha: 605, gas_m3: 55200, kwh: 138600 },
      { periodo: "2024-09", produccion_m2: 49100, hdd_18c: 140, horas_marcha: 615, gas_m3: 49800, kwh: 141200 },
      { periodo: "2024-10", produccion_m2: 51200, hdd_18c: 75, horas_marcha: 635, gas_m3: 48700, kwh: 146800 },
      { periodo: "2024-11", produccion_m2: 50400, hdd_18c: 30, horas_marcha: 625, gas_m3: 45200, kwh: 144500 },
      { periodo: "2024-12", produccion_m2: 38100, hdd_18c: 8, horas_marcha: 480, gas_m3: 34100, kwh: 112300 },
      
      // Período 2025 (Período de Reporte: con mejoras operativas aplicadas)
      { periodo: "2025-01", produccion_m2: 43800, hdd_18c: 10, horas_marcha: 545, gas_m3: 34900, kwh: 122100 },
      { periodo: "2025-02", produccion_m2: 41200, hdd_18c: 15, horas_marcha: 520, gas_m3: 32800, kwh: 116400 },
      { periodo: "2025-03", produccion_m2: 47100, hdd_18c: 40, horas_marcha: 585, gas_m3: 38100, kwh: 128900 },
      { periodo: "2025-04", produccion_m2: 48500, hdd_18c: 115, horas_marcha: 595, gas_m3: 41200, kwh: 131500 },
      { periodo: "2025-05", produccion_m2: 50200, hdd_18c: 225, horas_marcha: 620, gas_m3: 47200, kwh: 137000 },
      { periodo: "2025-06", produccion_m2: 46100, hdd_18c: 335, horas_marcha: 575, gas_m3: 49500, kwh: 128400 },
      { periodo: "2025-07", produccion_m2: 45000, hdd_18c: 370, horas_marcha: 565, gas_m3: 50100, kwh: 126200 },
      { periodo: "2025-08", produccion_m2: 49500, hdd_18c: 290, horas_marcha: 610, gas_m3: 49200, kwh: 135800 },
      { periodo: "2025-09", produccion_m2: 52000, hdd_18c: 135, horas_marcha: 630, gas_m3: 45300, kwh: 141000 },
      { periodo: "2025-10", produccion_m2: 53500, hdd_18c: 70, horas_marcha: 645, gas_m3: 44100, kwh: 145100 },
      { periodo: "2025-11", produccion_m2: 51800, hdd_18c: 25, horas_marcha: 630, gas_m3: 40900, kwh: 140200 },
      { periodo: "2025-12", produccion_m2: 40200, hdd_18c: 12, horas_marcha: 495, gas_m3: 31800, kwh: 111900 }
    ]
  },

  air_compressors: {
    id: "air_compressors",
    name: "Central de Compresores de Aire Comprimido (Planta Industrial)",
    description: "Evaluación quincenal del consumo eléctrico (kWh) en sala de 3 compresores de tornillo rotativo de 75 kW y 90 kW frente a volumen de aire comprimido suministrado (Nm³ a 7.5 bar), horas en carga y presión media en colector. En el período 13 se repararon fugas en la red neumática y se instaló secuenciador de cascada.",
    energyUnit: "kWh",
    energyLabel: "Electricidad Central Aire",
    targetCol: "kwh_electricidad",
    dateCol: "quincena",
    baselineEndIdx: 11,
    interventionDescription: "Quincena 13: Campaña de ultrasonido para eliminación de 42 fugas de aire comprimido y ajuste de banda de presión de 8.2 bar a 7.2 bar con control de velocidad variable.",
    drivers: [
      { id: "volumen_nm3", label: "Volumen de Aire Suministrado", unit: "Nm³", description: "Caudal volumétrico total normalizado de aire comprimido suministrado a planta" },
      { id: "horas_carga", label: "Horas de Compresores en Carga", unit: "h", description: "Tiempo total de los compresores operando con admisión abierta" },
      { id: "presion_media_bar", label: "Presión Media de Red", unit: "bar", description: "Presión manométrica de entrega medida en el pulmón principal" }
    ],
    enpi: {
      name: "Consumo Específico de Aire (SEC)",
      unit: "kWh/100 Nm³",
      formula: "(kwh_electricidad / volumen_nm3) * 100"
    },
    data: [
      { quincena: "Q1-2024", volumen_nm3: 215000, horas_carga: 520, presion_media_bar: 8.2, kwh_electricidad: 34800 },
      { quincena: "Q2-2024", volumen_nm3: 228000, horas_carga: 545, presion_media_bar: 8.2, kwh_electricidad: 36700 },
      { quincena: "Q3-2024", volumen_nm3: 195000, horas_carga: 480, presion_media_bar: 8.3, kwh_electricidad: 32100 },
      { quincena: "Q4-2024", volumen_nm3: 242000, horas_carga: 570, presion_media_bar: 8.1, kwh_electricidad: 38600 },
      { quincena: "Q5-2024", volumen_nm3: 255000, horas_carga: 590, presion_media_bar: 8.2, kwh_electricidad: 40500 },
      { quincena: "Q6-2024", volumen_nm3: 238000, horas_carga: 560, presion_media_bar: 8.2, kwh_electricidad: 37900 },
      { quincena: "Q7-2024", volumen_nm3: 260000, horas_carga: 605, presion_media_bar: 8.3, kwh_electricidad: 41800 },
      { quincena: "Q8-2024", volumen_nm3: 248000, horas_carga: 580, presion_media_bar: 8.1, kwh_electricidad: 39400 },
      { quincena: "Q9-2024", volumen_nm3: 270000, horas_carga: 620, presion_media_bar: 8.2, kwh_electricidad: 43100 },
      { quincena: "Q10-2024", volumen_nm3: 265000, horas_carga: 610, presion_media_bar: 8.2, kwh_electricidad: 42200 },
      { quincena: "Q11-2024", volumen_nm3: 230000, horas_carga: 540, presion_media_bar: 8.3, kwh_electricidad: 37100 },
      { quincena: "Q12-2024", volumen_nm3: 180000, horas_carga: 440, presion_media_bar: 8.2, kwh_electricidad: 29800 },
      // Reporte (Intervención y reducción de fugas + baja de presión a 7.3 bar)
      { quincena: "Q13-2025", volumen_nm3: 205000, horas_carga: 460, presion_media_bar: 7.3, kwh_electricidad: 28400 },
      { quincena: "Q14-2025", volumen_nm3: 218000, horas_carga: 485, presion_media_bar: 7.3, kwh_electricidad: 30100 },
      { quincena: "Q15-2025", volumen_nm3: 190000, horas_carga: 435, presion_media_bar: 7.2, kwh_electricidad: 26800 },
      { quincena: "Q16-2025", volumen_nm3: 232000, horas_carga: 505, presion_media_bar: 7.3, kwh_electricidad: 31900 },
      { quincena: "Q17-2025", volumen_nm3: 246000, horas_carga: 525, presion_media_bar: 7.3, kwh_electricidad: 33700 },
      { quincena: "Q18-2025", volumen_nm3: 228000, horas_carga: 495, presion_media_bar: 7.2, kwh_electricidad: 31200 },
      { quincena: "Q19-2025", volumen_nm3: 250000, horas_carga: 535, presion_media_bar: 7.3, kwh_electricidad: 34400 },
      { quincena: "Q20-2025", volumen_nm3: 240000, horas_carga: 515, presion_media_bar: 7.3, kwh_electricidad: 32900 },
      { quincena: "Q21-2025", volumen_nm3: 260000, horas_carga: 550, presion_media_bar: 7.3, kwh_electricidad: 35800 },
      { quincena: "Q22-2025", volumen_nm3: 254000, horas_carga: 540, presion_media_bar: 7.2, kwh_electricidad: 34900 },
      { quincena: "Q23-2025", volumen_nm3: 225000, horas_carga: 485, presion_media_bar: 7.3, kwh_electricidad: 31100 },
      { quincena: "Q24-2025", volumen_nm3: 175000, horas_carga: 405, presion_media_bar: 7.2, kwh_electricidad: 24700 }
    ]
  },

  hvac_chiller: {
    id: "hvac_chiller",
    name: "Central de Agua Helada y Climatización HVAC (Chillers)",
    description: "Consumo mensual de energía eléctrica (kWh) de 2 chillers centrífugos de 400 TR y bombas de distribución en función de los Grados Día de Refrigeración (CDD 22°C), caudal de agua helada recirculada (m³) y horas de ocupación. En el mes 13 se ajustó el control de temperatura de condensación flotante y válvulas PICV.",
    energyUnit: "kWh",
    energyLabel: "Electricidad Chillers",
    targetCol: "kwh_hvac",
    dateCol: "mes",
    baselineEndIdx: 11,
    interventionDescription: "Mes 13: Optimización de setpoint de condensación en torres de enfriamiento, control por variador de bombas primarias-secundarias y balanceo hidrónico dinámico.",
    drivers: [
      { id: "cdd_22c", label: "Grados Día Refrigeración (CDD 22°C)", unit: "°C·día", description: "Carga térmica climática calculada con temperatura base de 22°C" },
      { id: "caudal_agua_m3", label: "Caudal de Agua Helada", unit: "m³", description: "Volumen mensual de agua bombeada a 7°C hacia unidades de tratamiento de aire" },
      { id: "horas_planta", label: "Horas Operativas de Planta", unit: "h", description: "Horas totales con áreas productivas y de ensamble climatizadas" }
    ],
    enpi: {
      name: "Rendimiento Global Chilling",
      unit: "kWh/m³ agua",
      formula: "kwh_hvac / caudal_agua_m3"
    },
    data: [
      { mes: "2024-01", cdd_22c: 185, caudal_agua_m3: 38500, horas_planta: 480, kwh_hvac: 84200 },
      { mes: "2024-02", cdd_22c: 165, caudal_agua_m3: 36200, horas_planta: 450, kwh_hvac: 79100 },
      { mes: "2024-03", cdd_22c: 120, caudal_agua_m3: 31000, horas_planta: 490, kwh_hvac: 68400 },
      { mes: "2024-04", cdd_22c: 45, caudal_agua_m3: 24500, horas_planta: 480, kwh_hvac: 49500 },
      { mes: "2024-05", cdd_22c: 12, caudal_agua_m3: 19800, horas_planta: 510, kwh_hvac: 38200 },
      { mes: "2024-06", cdd_22c: 0, caudal_agua_m3: 17200, horas_planta: 480, kwh_hvac: 32500 },
      { mes: "2024-07", cdd_22c: 0, caudal_agua_m3: 16900, horas_planta: 470, kwh_hvac: 31800 },
      { mes: "2024-08", cdd_22c: 8, caudal_agua_m3: 18400, horas_planta: 500, kwh_hvac: 35100 },
      { mes: "2024-09", cdd_22c: 35, caudal_agua_m3: 23100, horas_planta: 505, kwh_hvac: 46700 },
      { mes: "2024-10", cdd_22c: 85, caudal_agua_m3: 28900, horas_planta: 520, kwh_hvac: 59300 },
      { mes: "2024-11", cdd_22c: 140, caudal_agua_m3: 33800, horas_planta: 510, kwh_hvac: 73500 },
      { mes: "2024-12", cdd_22c: 195, caudal_agua_m3: 40100, horas_planta: 430, kwh_hvac: 87900 },
      // Reporte 2025
      { mes: "2025-01", cdd_22c: 190, caudal_agua_m3: 39100, horas_planta: 485, kwh_hvac: 73800 },
      { mes: "2025-02", cdd_22c: 170, caudal_agua_m3: 37000, horas_planta: 455, kwh_hvac: 69500 },
      { mes: "2025-03", cdd_22c: 125, caudal_agua_m3: 31800, horas_planta: 495, kwh_hvac: 60100 },
      { mes: "2025-04", cdd_22c: 50, caudal_agua_m3: 25100, horas_planta: 485, kwh_hvac: 43600 },
      { mes: "2025-05", cdd_22c: 15, caudal_agua_m3: 20200, horas_planta: 515, kwh_hvac: 33900 },
      { mes: "2025-06", cdd_22c: 0, caudal_agua_m3: 17500, horas_planta: 485, kwh_hvac: 28800 },
      { mes: "2025-07", cdd_22c: 0, caudal_agua_m3: 17100, horas_planta: 475, kwh_hvac: 28200 },
      { mes: "2025-08", cdd_22c: 10, caudal_agua_m3: 18900, horas_planta: 505, kwh_hvac: 31100 },
      { mes: "2025-09", cdd_22c: 40, caudal_agua_m3: 23800, horas_planta: 510, kwh_hvac: 41200 },
      { mes: "2025-10", cdd_22c: 90, caudal_agua_m3: 29500, horas_planta: 525, kwh_hvac: 52400 },
      { mes: "2025-11", cdd_22c: 145, caudal_agua_m3: 34500, horas_planta: 515, kwh_hvac: 64900 },
      { mes: "2025-12", cdd_22c: 205, caudal_agua_m3: 41200, horas_planta: 440, kwh_hvac: 77500 }
    ]
  },

  steam_boiler: {
    id: "steam_boiler",
    name: "Caldera Industrial Acuotubular de Vapor Saturado",
    description: "Evaluación de eficiencia y línea base de consumo de combustible (m³ gas natural) para caldera de 12 ton/h de vapor a 10 bar frente a producción neta de vapor (ton), temperatura de agua desaireada de alimentación (°C) y tasa de purga continua (%). En el mes 13 se instaló economizador para precalentamiento con gases de chimenea.",
    energyUnit: "m³ Gas",
    energyLabel: "Gas Caldera Vapor",
    targetCol: "gas_combustible_m3",
    dateCol: "mes",
    baselineEndIdx: 11,
    interventionDescription: "Mes 13: Montaje de economizador de humos (baja de temperatura de chimenea de 220°C a 135°C), elevando la temperatura de agua de alimentación en 28°C y optimización de purgas por conductividad.",
    drivers: [
      { id: "vapor_ton", label: "Vapor Saturado Generado", unit: "ton", description: "Producción neta de vapor industrial enviada al colector principal a 10 bar rel." },
      { id: "temp_alimentacion_c", label: "Temperatura Agua de Alimentación", unit: "°C", description: "Temperatura media del agua ingresando desde el desaireador a la caldera" },
      { id: "purga_pct", label: "Tasa de Purga Continua", unit: "%", description: "Porcentaje de agua de purga para control de sólidos disueltos totales (TDS)" }
    ],
    enpi: {
      name: "Razón Específica de Combustible (SFR)",
      unit: "m³ gas / ton vapor",
      formula: "gas_combustible_m3 / vapor_ton"
    },
    data: [
      { mes: "2024-01", vapor_ton: 4800, temp_alimentacion_c: 82, purga_pct: 4.8, gas_combustible_m3: 374000 },
      { mes: "2024-02", vapor_ton: 4500, temp_alimentacion_c: 81, purga_pct: 5.0, gas_combustible_m3: 352000 },
      { mes: "2024-03", vapor_ton: 5100, temp_alimentacion_c: 83, purga_pct: 4.6, gas_combustible_m3: 396000 },
      { mes: "2024-04", vapor_ton: 5300, temp_alimentacion_c: 82, purga_pct: 4.7, gas_combustible_m3: 412000 },
      { mes: "2024-05", vapor_ton: 5600, temp_alimentacion_c: 80, purga_pct: 5.2, gas_combustible_m3: 441000 },
      { mes: "2024-06", vapor_ton: 5400, temp_alimentacion_c: 78, purga_pct: 5.4, gas_combustible_m3: 429000 },
      { mes: "2024-07", vapor_ton: 5200, temp_alimentacion_c: 77, purga_pct: 5.3, gas_combustible_m3: 415000 },
      { mes: "2024-08", vapor_ton: 5500, temp_alimentacion_c: 79, purga_pct: 5.1, gas_combustible_m3: 434000 },
      { mes: "2024-09", vapor_ton: 5700, temp_alimentacion_c: 81, purga_pct: 4.8, gas_combustible_m3: 446000 },
      { mes: "2024-10", vapor_ton: 5900, temp_alimentacion_c: 82, purga_pct: 4.7, gas_combustible_m3: 460000 },
      { mes: "2024-11", vapor_ton: 5800, temp_alimentacion_c: 83, purga_pct: 4.5, gas_combustible_m3: 451000 },
      { mes: "2024-12", vapor_ton: 4400, temp_alimentacion_c: 84, purga_pct: 4.6, gas_combustible_m3: 341000 },
      // Reporte 2025 (Con economizador que sube temp alimentación a ~105-108°C)
      { mes: "2025-01", vapor_ton: 4950, temp_alimentacion_c: 106, purga_pct: 3.5, gas_combustible_m3: 359000 },
      { mes: "2025-02", vapor_ton: 4650, temp_alimentacion_c: 105, purga_pct: 3.6, gas_combustible_m3: 338000 },
      { mes: "2025-03", vapor_ton: 5250, temp_alimentacion_c: 107, purga_pct: 3.4, gas_combustible_m3: 381000 },
      { mes: "2025-04", vapor_ton: 5450, temp_alimentacion_c: 106, purga_pct: 3.5, gas_combustible_m3: 396000 },
      { mes: "2025-05", vapor_ton: 5750, temp_alimentacion_c: 105, purga_pct: 3.7, gas_combustible_m3: 420000 },
      { mes: "2025-06", vapor_ton: 5550, temp_alimentacion_c: 104, purga_pct: 3.8, gas_combustible_m3: 407000 },
      { mes: "2025-07", vapor_ton: 5350, temp_alimentacion_c: 103, purga_pct: 3.8, gas_combustible_m3: 394000 },
      { mes: "2025-08", vapor_ton: 5650, temp_alimentacion_c: 105, purga_pct: 3.6, gas_combustible_m3: 414000 },
      { mes: "2025-09", vapor_ton: 5850, temp_alimentacion_c: 106, purga_pct: 3.5, gas_combustible_m3: 426000 },
      { mes: "2025-10", vapor_ton: 6050, temp_alimentacion_c: 107, purga_pct: 3.4, gas_combustible_m3: 439000 },
      { mes: "2025-11", vapor_ton: 5950, temp_alimentacion_c: 107, purga_pct: 3.4, gas_combustible_m3: 431000 },
      { mes: "2025-12", vapor_ton: 4550, temp_alimentacion_c: 108, purga_pct: 3.5, gas_combustible_m3: 328000 }
    ]
  }
};

const ISO_THRESHOLDS = {
  ashrae_monthly: {
    cv_rmse_max: 15.0, // % max
    nmbe_max: 0.5,     // % +/- max for calibrated model
    r2_min: 0.75,      // Good fit
    p_value_max: 0.05  // Significance
  },
  ashrae_daily: {
    cv_rmse_max: 30.0,
    nmbe_max: 10.0,
    r2_min: 0.70,
    p_value_max: 0.05
  }
};
