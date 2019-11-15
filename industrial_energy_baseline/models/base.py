import pandas as pd
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from industrial_energy_baseline.core.exceptions import ModelFitError

class BaseModel(ABC):
    def __init__(self, target: str, drivers: List[str]):
        self.target = target
        self.drivers = drivers
        self.is_fitted = False
        
    @abstractmethod
    def fit(self, data: pd.DataFrame) -> None:
        """Fit the model to the provided data."""
        pass
        
    @abstractmethod
    def predict(self, data: pd.DataFrame) -> pd.Series:
        """Predict target values using the fitted model."""
        pass
        
    @abstractmethod
    def get_metrics(self) -> Dict[str, Any]:
        """Return model validation metrics."""
        pass
        
    @abstractmethod
    def get_summary(self) -> str:
        """Return a human-readable summary of the model."""
        pass
