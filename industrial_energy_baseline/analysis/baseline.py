import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime

from industrial_energy_baseline.models.base import BaseModel
from industrial_energy_baseline.models.linear import LinearRegressionModel
from industrial_energy_baseline.core.exceptions import ConfigurationError

class Baseline:
    def __init__(self, 
                 name: str, 
                 target: str, 
                 drivers: List[str], 
                 start_date: str, 
                 end_date: str,
                 model_type: str = "linear"):
        self.name = name
        self.target = target
        self.drivers = drivers
        self.start_date = pd.to_datetime(start_date)
        self.end_date = pd.to_datetime(end_date)
        self.model_type = model_type
        self.model: Optional[BaseModel] = None
        self.created_at = None
        
    def fit(self, df: pd.DataFrame, time_column: str) -> None:
        """Fit the baseline model using the data within the specified period."""
        if time_column not in df.columns:
            raise ConfigurationError(f"Time column '{time_column}' not found.")
            
        mask = (df[time_column] >= self.start_date) & (df[time_column] <= self.end_date)
        baseline_data = df.loc[mask].copy()
        
        if self.model_type == "linear":
            self.model = LinearRegressionModel(target=self.target, drivers=self.drivers)
        else:
            raise ConfigurationError(f"Unsupported model type: {self.model_type}")
            
        self.model.fit(baseline_data)
        self.created_at = datetime.now()
        
    def predict(self, df: pd.DataFrame) -> pd.Series:
        """Predict expected consumption using the fitted baseline model."""
        if self.model is None or not self.model.is_fitted:
            raise RuntimeError("Baseline model has not been fitted.")
        return self.model.predict(df)
        
    def get_metrics(self) -> Dict[str, Any]:
        if self.model is None:
            return {}
        return self.model.get_metrics()
        
    def get_summary(self) -> str:
        if self.model is None:
            return "Baseline model not fitted."
        
        summary = f"Baseline: {self.name}\n"
        summary += f"Period: {self.start_date.date()} to {self.end_date.date()}\n"
        summary += f"Target: {self.target}\n"
        summary += f"Drivers: {', '.join(self.drivers)}\n"
        summary += "-" * 40 + "\n"
        summary += self.model.get_summary()
        return summary
