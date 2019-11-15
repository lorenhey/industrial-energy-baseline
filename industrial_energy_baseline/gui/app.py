import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go

from industrial_energy_baseline.analysis.baseline import Baseline
from industrial_energy_baseline.analysis.performance import PerformanceEvaluator

st.set_page_config(page_title="Industrial Energy Baseline", layout="wide")

st.title("Industrial Energy Baseline")
st.markdown("Separando el cambio de producción y clima del desempeño energético real.")

@st.cache_data
def load_demo_data():
    np.random.seed(42)
    dates = pd.date_range(start="2024-01-01", periods=730, freq="D")
    production = np.random.normal(500, 50, 730)
    cdd = np.random.uniform(0, 10, 730)
    
    expected = 1000 + 2 * production + 15 * cdd
    noise = np.random.normal(0, 20, 730)
    observed = expected + noise
    
    saving_mask = np.arange(730) >= 499
    observed[saving_mask] = observed[saving_mask] * 0.9
    
    return pd.DataFrame({
        "date": dates,
        "production": production,
        "cdd": cdd,
        "energy": observed
    })

df = load_demo_data()

st.sidebar.header("Configuración")
target_col = st.sidebar.selectbox("Vector Energético (Target)", ["energy"])
driver_cols = st.sidebar.multiselect("Drivers (Variables explicativas)", ["production", "cdd"], default=["production", "cdd"])

baseline_start = st.sidebar.date_input("Inicio Baseline", pd.to_datetime("2024-01-01"))
baseline_end = st.sidebar.date_input("Fin Baseline", pd.to_datetime("2024-12-31"))

if st.sidebar.button("Calcular Desempeño"):
    # 1. Fit Baseline
    baseline = Baseline(
        name="Demo-Baseline",
        target=target_col,
        drivers=driver_cols,
        start_date=baseline_start.strftime("%Y-%m-%d"),
        end_date=baseline_end.strftime("%Y-%m-%d")
    )
    baseline.fit(df, time_column="date")
    
    st.header("1. Modelo de Línea Base")
    metrics = baseline.get_metrics()
    
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("R²", f"{metrics.get('r2', 0):.3f}")
    col2.metric("CV(RMSE)", f"{metrics.get('cv_rmse', 0):.2f} %")
    col3.metric("NMBE", f"{metrics.get('nmbe', 0):.2f} %")
    col4.metric("Observaciones", metrics.get('n_observations', 0))
    
    with st.expander("Ver Resumen del Modelo"):
        st.text(baseline.get_summary())
        
    # 2. Evaluate Performance
    st.header("2. Desempeño en Período de Reporte")
    
    report_start = pd.to_datetime("2025-01-01")
    df_report = df[df["date"] >= report_start].copy()
    
    evaluator = PerformanceEvaluator(baseline)
    perf_result = evaluator.evaluate(df_report, time_column="date")
    summary = evaluator.get_summary(perf_result)
    
    col1, col2, col3 = st.columns(3)
    col1.metric("Consumo Esperado", f"{summary['total_expected']:,.0f}")
    col2.metric("Consumo Observado", f"{summary['total_observed']:,.0f}")
    col3.metric("Ahorro Estimado", f"{summary['total_saving']:,.0f}", f"{summary['saving_pct']:.2f}%")
    
    # 3. Gráficos
    st.subheader("Observado vs Esperado")
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=perf_result["date"], y=perf_result["expected"], name="Esperado (Baseline)"))
    fig.add_trace(go.Scatter(x=perf_result["date"], y=perf_result["observed"], name="Observado"))
    st.plotly_chart(fig, use_container_width=True)
    
    st.subheader("CUSUM (Ahorro Acumulado)")
    fig_cusum = px.line(perf_result, x="date", y="cusum", title="CUSUM")
    # Add a marker where savings begin to be evident
    st.plotly_chart(fig_cusum, use_container_width=True)
else:
    st.info("Presioná 'Calcular Desempeño' en la barra lateral para ver los resultados usando datos sintéticos.")
