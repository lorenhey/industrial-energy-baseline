# Contribución a Industrial Energy Baseline

Bienvenido/a. Al contribuir a este proyecto, por favor tené en cuenta los siguientes principios:

## Principios Centrales

1.  **Integridad Estadística**: La herramienta no debe falsear correlación con causalidad. Si un modelo no ajusta, no se oculta.
2.  **No re-entrenamiento silencioso**: Las líneas base (`baselines`) son artefactos estáticos. Los datos nuevos no las recalibran automáticamente.
3.  **Transparencia de Datos**: Todo descarte de *outliers* o imputación de datos debe quedar registrado de forma explícita.
4.  **Reproducibilidad**: Todo resultado debe poder reproducirse desde los archivos de configuración y datos originales (mismos hashes).
5.  **Explicabilidad**: Evitar cajas negras, como selección automática de variables o modelos complejos si un modelo simple (ej. regresión múltiple) es suficiente y más transparente.

## Proceso de Desarrollo

1. **Tests Obligatorios**: Toda nueva funcionalidad debe ir acompañada de un test. Si afecta a la detección de desempeño, debe incluir un dataset con *verdad conocida* (Golden Dataset) para probar que la herramienta identifica correctamente mejoras y deterioros reales y los diferencia de los efectos de variables explicativas.
2. **Estilo**: Seguimos `black` y `isort`. El código debe incluir Type Hints rigurosos.
3. **Pull Requests**: Proporcionar descripciones claras sobre *por qué* se toma una decisión técnica y no solo *qué* cambia. Usar convenciones de commits semánticos (`feat:`, `fix:`, `docs:`, etc.).
