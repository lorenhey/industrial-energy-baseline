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
        
    def to_dict(self) -> Dict[str, Any]:
        """Serialize baseline to a dictionary format."""
        if not self.model or not self.model.is_fitted:
            raise RuntimeError("Cannot serialize an unfitted baseline.")
            
        return {
            "name": self.name,
            "target": self.target,
            "drivers": self.drivers,
            "start_date": self.start_date.strftime("%Y-%m-%d"),
            "end_date": self.end_date.strftime("%Y-%m-%d"),
            "model_type": self.model_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "metrics": self.get_metrics(),
            "coefficients": self.model.results.params.to_dict() if self.model_type == "linear" else {}
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Baseline":
        """Reconstruct a baseline from a dictionary, warning that it needs refitting for full diagnostics."""
        b = cls(
            name=data["name"],
            target=data["target"],
            drivers=data["drivers"],
            start_date=data["start_date"],
            end_date=data["end_date"],
            model_type=data["model_type"]
        )
        if data.get("created_at"):
            b.created_at = datetime.fromisoformat(data["created_at"])
            
        # We instantiate a dummy model with coefficients so predict works
        # Note: full statsmodels summary won't be available without refitting
        if b.model_type == "linear":
            b.model = LinearRegressionModel(target=b.target, drivers=b.drivers)
            b.model.is_fitted = True
            b.model.metrics = data.get("metrics", {})
            
            # create a dummy results object that can predict
            class DummyResults:
                def __init__(self, params_dict):
                    self.params = pd.Series(params_dict)
                def predict(self, exog):
                    return exog.dot(self.params)
                def summary(self):
                    class DummySummary:
                        def as_text(self):
                            return "Model loaded from artifact. Refit required for full diagnostics."
                    return DummySummary()
                    
            b.model.results = DummyResults(data.get("coefficients", {}))
            
        return b
