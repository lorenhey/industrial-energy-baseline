# Industrial Energy Baseline

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Suite-emerald?style=for-the-badge&logo=github)](https://lorenhey.github.io/industrial-energy-baseline/)
[![ISO Standard](https://img.shields.io/badge/Norma-ISO%2050001%20%7C%20ISO%2050006-blue?style=for-the-badge)](https://www.iso.org/standard/60089.html)
[![Protocol](https://img.shields.io/badge/Protocol-IPMVP%20Opci%C3%B3n%20C-purple?style=for-the-badge)](https://evo-world.org/)
[![License](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)](LICENSE)

`industrial-energy-baseline` separa los cambios reales de desempeño energético de los cambios explicados por producción, clima y operación.

Esta herramienta está diseñada para responder a una pregunta muy concreta en ingeniería de planta:
> *¿El desempeño energético de esta instalación realmente mejoró o empeoró, una vez corregidos los efectos de producción, clima, calendario y otras variables relevantes?*

🌐 **Suite Interactiva en Vivo en GitHub Pages:** [https://lorenhey.github.io/industrial-energy-baseline/](https://lorenhey.github.io/industrial-energy-baseline/)

---

## Características Principales

*   **Modelado riguroso**: Distinción matemática clara entre consumo absoluto y desempeño energético real ($EnPI$).
*   **Alineación normativa**: Metodologías y umbrales estrictamente compatibles con **ISO 50001**, **ISO 50006** y conceptos de **IPMVP** (Opción C: Whole Facility / Opción B: Retrofit Isolation).
*   **Validación según ASHRAE Guideline 14**:
    *   $R^2 \ge 0.75$ (Bondad de ajuste).
    *   $CV(RMSE) \le 15.0\%$ (Dispersión residual para datos mensuales).
    *   $NMBE \le \pm 0.50\%$ (Control estricto de sesgo sistemático).
    *   Pruebas $t$ de Student y $F$-test de significancia global ($p < 0.05$).
*   **Monitoreo CUSUM (Cumulative Sum of Differences)**:
    *   Detección gráfica de quiebres estructurales en el proceso.
    *   Cuantificación continua de la tasa de ahorro y persistencia de mejoras operativas.
*   **Incertidumbre M&V al 95% de Confianza**:
    *   Cálculo del intervalo de confianza para ahorros netos según $t$-Student y número de períodos ($n, m$).
*   **Consumo Basal e Intercepto ($\beta_0$)**:
    *   Descomposición de pérdidas fijas independientes de la producción (fugas, cañerías sin aislar, radiación).
*   **Casos de Estudio Industriales Reales**:
    *   *Planta de Curtido y Acabado de Cuero Automotriz (Boxmark)*: Gas en calderas de secado continuo vs $m^2$ y $HDD_{18^\circ C}$.
    *   *Central de Compresores de Aire Comprimido*: kWh vs $Nm^3$ y horas en carga.
    *   *Central de Agua Helada y HVAC*: Chillers centrífugos vs $CDD_{22^\circ C}$ y caudal circulado.
    *   *Caldera de Vapor Industrial*: Gas vs vapor saturado y temperatura de agua de alimentación.
*   **Multi-interfaz**: API de Python, CLI interactiva (`ieb`), dashboard web local (Streamlit) y suite web zero-backend en GitHub Pages.

---

## Suite Web Interactiva (GitHub Pages)

Podés acceder directamente sin instalar dependencias desde cualquier navegador:
👉 **[https://lorenhey.github.io/industrial-energy-baseline/](https://lorenhey.github.io/industrial-energy-baseline/)**

La aplicación web incluye:
1. **Auditor de Línea Base**: Ajuste MCO en tiempo real, KPIs normativos y bandas de predicción al 95%.
2. **Monitoreo CUSUM y M&V**: Curva de suma acumulada y matriz período a período.
3. **Indicadores EnPI**: Descomposición del consumo basal y $EnPI$ normalizado ($E_{real} / E_{esperado}$).
4. **Catálogo de Casos**: Carga y auditoría inmediata de los 4 procesos industriales.
5. **Editor de Datos & Subida CSV**: Modificación interactiva de celdas y parser de datasets propios.
6. **Simulador de Terminal CLI**: Emulador de comandos `ieb` en el navegador.
7. **Tratado Teórico ISO 50006**: Formulaciones matemáticas rigurosas con renderizado KaTeX.

---

## Instalación Local (Python)

```bash
git clone https://github.com/lorenhey/industrial-energy-baseline.git
cd industrial-energy-baseline
pip install -e .
```

---

## Uso Rápido (CLI)

```bash
# Validar la calidad del dataset (nulos, monotonía temporal)
ieb validate data.csv

# Crear y ajustar una línea base mediante regresión lineal MCO
ieb baseline create data.csv config.yaml

# Inspeccionar el modelo (R², CV(RMSE), NMBE, ANOVA y coeficientes)
ieb baseline inspect BL-2025

# Calcular ahorros en el período de reporte
ieb savings

# Visualizar la trayectoria CUSUM
ieb cusum

# Lanzar el dashboard interactivo local
ieb gui
```

---

## Estructura del Repositorio

*   `index.html`: Suite web interactiva para GitHub Pages.
*   `css/style.css`: Estilos visuales de tablero de control industrial.
*   `js/`: Motor de regresión lineal matricial, datasets industriales, renderizado SVG y controlador.
*   `industrial_energy_baseline/core/`: Funcionalidades base en Python (datos, unidades, validación temporal).
*   `industrial_energy_baseline/models/`: Modelos estadísticos de regresión OLS.
*   `industrial_energy_baseline/analysis/`: Motores de evaluación de desempeño, CUSUM y M&V.
*   `industrial_energy_baseline/cli/`: Interfaz de línea de comandos `ieb`.
*   `industrial_energy_baseline/gui/`: Interfaz gráfica interactiva en Streamlit.
*   `tests/`: Pruebas unitarias de ajuste de modelos y serialización.
*   `.github/workflows/deploy.yml`: Automatización de despliegue en GitHub Pages.

---

## Licencia

[MIT License](LICENSE) &mdash; Desarrollado por **Loren** ([@lorenhey](https://github.com/lorenhey)).
