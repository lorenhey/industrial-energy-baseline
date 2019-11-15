# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-09-14
### Added
- Modelado core usando Regresión Lineal Múltiple (statsmodels).
- CLI para validación de datos y creación de baselines (`ieb validate`, `ieb baseline create`, `ieb demo`).
- Interfaz gráfica (GUI) base con Streamlit para análisis de CUSUM y comparación Observado vs Esperado.
- Generador de reportes Markdown.
- Datasets sintéticos con *verdad conocida* y *falsa penalidad* para tests.
- Controles de calidad de datos y manejo de acumuladores.
