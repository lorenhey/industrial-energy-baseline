import pandas as pd
import numpy as np
from typing import Dict, Any

from industrial_energy_baseline.analysis.baseline import Baseline

class PerformanceEvaluator:
    def __init__(self, baseline: Baseline):
        self.baseline = baseline
        
    def evaluate(self, df: pd.DataFrame, time_column: str) -> pd.DataFrame:
        """
        Evaluate performance for the given reporting period dataframe.
        Returns a DataFrame with observed, expected, saving, and cusum.
        """
        result = df.copy()
        
        # Predict expected consumption
        expected = self.baseline.predict(result)
        result['expected'] = expected
        
        # Calculate savings (Positive = saving, Negative = overconsumption)
        result['observed'] = result[self.baseline.target]
        result['saving'] = result['expected'] - result['observed']
        
        # Calculate standardized residual for basic anomaly detection
        # residual = observed - expected
        # To match savings sign: saving = expected - observed
        # A positive residual means overconsumption.
        residual = result['observed'] - result['expected']
        
        # Get RMSE from baseline to standardize
        metrics = self.baseline.get_metrics()
        rmse = metrics.get('rmse', 1.0)
        if rmse == 0:
            rmse = 1.0
            
        result['standardized_residual'] = residual / rmse
        
        # Calculate CUSUM of savings
        result = result.sort_values(by=time_column)
        result['cusum'] = result['saving'].cumsum()
        
        return result
        
    def get_summary(self, result_df: pd.DataFrame) -> Dict[str, Any]:
        """Summarize the performance evaluation."""
        total_expected = result_df['expected'].sum()
        total_observed = result_df['observed'].sum()
        total_saving = result_df['saving'].sum()
        
        saving_pct = (total_saving / total_expected * 100) if total_expected != 0 else 0
        
        return {
            "total_expected": total_expected,
            "total_observed": total_observed,
            "total_saving": total_saving,
            "saving_pct": saving_pct,
            "cusum_final": result_df['cusum'].iloc[-1] if not result_df.empty else 0
        }
