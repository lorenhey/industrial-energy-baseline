import pandas as pd
from typing import Any, Dict
from datetime import datetime

from industrial_energy_baseline.analysis.baseline import Baseline
from industrial_energy_baseline.analysis.performance import PerformanceEvaluator

class MarkdownReportGenerator:
    def __init__(self, baseline: Baseline, performance_df: pd.DataFrame, summary: Dict[str, Any]):
        self.baseline = baseline
        self.performance_df = performance_df
        self.summary = summary
        
    def generate(self) -> str:
        report = []
        report.append(f"# Informe de Desempeño Energético")
        report.append(f"**Generado:** {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        
        # 1. Baseline Summary
        report.append(f"## 1. Línea Base (Baseline)")
        report.append(f"- **Nombre**: {self.baseline.name}")
        report.append(f"- **Período**: {self.baseline.start_date.date()} al {self.baseline.end_date.date()}")
        report.append(f"- **Target**: {self.baseline.target}")
        report.append(f"- **Drivers**: {', '.join(self.baseline.drivers)}")
        report.append(f"- **Tipo de Modelo**: {self.baseline.model_type}\n")
        
        metrics = self.baseline.get_metrics()
        report.append(f"### Métricas de Validación")
        report.append(f"- **R²**: {metrics.get('r2', 0):.3f}")
        report.append(f"- **CV(RMSE)**: {metrics.get('cv_rmse', 0):.2f}%")
        report.append(f"- **NMBE**: {metrics.get('nmbe', 0):.2f}%\n")
        
        # 2. Performance Summary
        report.append(f"## 2. Desempeño en Período de Reporte")
        if not self.performance_df.empty:
            start_rep = self.performance_df.iloc[0]['date'].date()
            end_rep = self.performance_df.iloc[-1]['date'].date()
            report.append(f"- **Período de Reporte**: {start_rep} al {end_rep}")
            
        report.append(f"- **Consumo Esperado (Normalizado)**: {self.summary['total_expected']:,.2f}")
        report.append(f"- **Consumo Observado**: {self.summary['total_observed']:,.2f}")
        report.append(f"- **Ahorro Estimado**: {self.summary['total_saving']:,.2f}")
        report.append(f"- **Ahorro (%)**: {self.summary['saving_pct']:.2f}%\n")
        
        # 3. Model details
        report.append(f"## 3. Detalles del Modelo (Statsmodels)")
        report.append("```text")
        report.append(self.baseline.get_summary())
        report.append("```\n")
        
        report.append("---\n")
        report.append("*Generado por industrial-energy-baseline.*")
        
        return "\n".join(report)
