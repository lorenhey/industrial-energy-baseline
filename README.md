# Industrial Energy Baseline

`industrial-energy-baseline` separa los cambios reales de desempeño energético de los cambios explicados por producción, clima y operación.

Esta herramienta open source está diseñada para responder a una pregunta muy concreta:
> ¿El desempeño energético de esta instalación realmente mejoró o empeoró, una vez corregidos los efectos de producción, clima, calendario y otras variables relevantes?

## Características Principales

*   **Modelado riguroso**: Distinción clara entre consumo absoluto y desempeño energético.
*   **Alineación normativa**: Metodologías compatibles con ISO 50001, ISO 50006 y conceptos de IPMVP.
*   **Normalización**: Ajuste de consumo por producción, clima (degree days), calendario y otros *drivers*.
*   **Evaluación de modelos**: Métricas robustas (R², CV(RMSE), NMBE, análisis de residuos, validación cruzada temporal).
*   **Measurement & Verification (M&V)**: Cálculo de ahorro e incertidumbre.
*   **Transparencia**: Todo el análisis, exclusiones de datos y re-baselines quedan registrados. No hay re-entrenamiento silencioso.
*   **Multi-interfaz**: API Python, CLI y aplicación GUI (dashboard) que comparten el mismo motor.

## Instalación

```bash
git clone https://github.com/lorenhey/industrial-energy-baseline.git
cd industrial-energy-baseline
pip install -e .
```

## Uso Rápido (CLI)

```bash
# Validar datos de entrada
ieb validate data.csv

# Crear un modelo de línea base
ieb baseline create config.yaml

# Inspeccionar el modelo generado
ieb baseline inspect BL-2025

# Ejecutar el dashboard interactivo
ieb gui
```

## Estructura del Proyecto

*   `industrial_energy_baseline/core/`: Funcionalidades base (manejo de datos, unidades, validación temporal).
*   `industrial_energy_baseline/models/`: Modelos estadísticos para establecer líneas base (Regresión lineal simple/múltiple, modelos de punto de cambio).
*   `industrial_energy_baseline/analysis/`: Motores de evaluación de desempeño, CUSUM, detección de anomalías y cuantificación de ahorro.
*   `industrial_energy_baseline/cli/`: Interfaz de línea de comandos.
*   `industrial_energy_baseline/gui/`: Interfaz gráfica interactiva.
*   `tests/`: Pruebas exhaustivas y validación contra datasets con *verdad conocida*.
*   `docs/`: Documentación técnica.

## Contribución

Revisar [CONTRIBUTING.md](CONTRIBUTING.md) para más detalles.

## Licencia

[MIT License](LICENSE)
