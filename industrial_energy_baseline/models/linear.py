import pandas as pd
import numpy as np
import statsmodels.api as sm
from typing import Dict, Any, List

from industrial_energy_baseline.models.base import BaseModel
from industrial_energy_baseline.core.exceptions import ModelFitError

class LinearRegressionModel(BaseModel):
    def __init__(self, target: str, drivers: List[str]):
        super().__init__(target, drivers)
        self.model = None
        self.results = None
        self.metrics = {}
        
    def fit(self, data: pd.DataFrame) -> None:
        if self.target not in data.columns:
            raise ModelFitError(f"Target column '{self.target}' not found in data.")
            
        for driver in self.drivers:
            if driver not in data.columns:
                raise ModelFitError(f"Driver column '{driver}' not found in data.")
                
        # Drop rows with NaNs in target or drivers
        fit_data = data[[self.target] + self.drivers].dropna()
        
        if len(fit_data) < len(self.drivers) + 2:
            raise ModelFitError("Not enough data points to fit the model.")
            
        y = fit_data[self.target]
        X = fit_data[self.drivers]
        X = sm.add_constant(X)
        
        try:
            self.model = sm.OLS(y, X)
            self.results = self.model.fit()
            self.is_fitted = True
            self._calculate_metrics(y, self.results.fittedvalues)
        except Exception as e:
            raise ModelFitError(f"Failed to fit linear regression model: {e}")
            
    def predict(self, data: pd.DataFrame) -> pd.Series:
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before calling predict.")
            
        X = data[self.drivers]
        X = sm.add_constant(X, has_constant='add')
        
        # statsmodels add_constant doesn't add constant if data is empty, so handle it
        if len(X) == 0:
             return pd.Series(dtype=float)
             
        # Ensure constant column is present even if some drivers are missing? 
        # Actually statsmodels needs exact column match
        # If the original fit had a constant, predict needs it.
        if 'const' not in X.columns and 'const' in self.results.params.index:
            X.insert(0, 'const', 1.0)
            
        return self.results.predict(X)
        
    def _calculate_metrics(self, y_true: pd.Series, y_pred: pd.Series) -> None:
        y_mean = y_true.mean()
        n = len(y_true)
        p = len(self.drivers)
        
        sse = np.sum((y_true - y_pred) ** 2)
        sst = np.sum((y_true - y_mean) ** 2)
        
        r2 = 1 - (sse / sst) if sst != 0 else 0
        adj_r2 = 1 - ((1 - r2) * (n - 1) / (n - p - 1)) if (n - p - 1) > 0 else 0
        
        rmse = np.sqrt(sse / n)
        cv_rmse = (rmse / y_mean) * 100 if y_mean != 0 else 0
        
        bias = np.sum(y_true - y_pred)
        nmbe = (bias / (n * y_mean)) * 100 if y_mean != 0 else 0
        
        self.metrics = {
            "r2": r2,
            "adj_r2": adj_r2,
            "rmse": rmse,
            "cv_rmse": cv_rmse,
            "nmbe": nmbe,
            "n_observations": n
        }
        
    def get_metrics(self) -> Dict[str, Any]:
        if not self.is_fitted:
            return {}
        return self.metrics
        
    def get_summary(self) -> str:
        if not self.is_fitted:
            return "Model not fitted."
        return self.results.summary().as_text()
