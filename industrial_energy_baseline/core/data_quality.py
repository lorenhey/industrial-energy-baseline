import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional

from industrial_energy_baseline.core.exceptions import DataQualityError

class DataQualityChecker:
    def __init__(self, df: pd.DataFrame, time_column: str, frequency: str = "D"):
        self.df = df.copy()
        self.time_column = time_column
        self.frequency = frequency
        self.issues = {}
        
    def check_all(self) -> Dict[str, Any]:
        """Run all data quality checks."""
        self._check_timestamps()
        self._check_missing_values()
        self._check_negatives()
        
        return {
            "total_records": len(self.df),
            "issues": self.issues,
            "is_valid": len(self.issues) == 0
        }
        
    def _check_timestamps(self):
        if not pd.api.types.is_datetime64_any_dtype(self.df[self.time_column]):
            try:
                self.df[self.time_column] = pd.to_datetime(self.df[self.time_column])
            except Exception as e:
                self.issues["timestamps"] = f"Failed to parse datetime: {e}"
                return
                
        # Check for duplicates
        duplicates = self.df.duplicated(subset=[self.time_column]).sum()
        if duplicates > 0:
            self.issues["duplicate_timestamps"] = duplicates
            
        # Check for gaps based on frequency
        # Simplistic check for now
        self.df = self.df.sort_values(by=self.time_column).set_index(self.time_column)
        
    def _check_missing_values(self):
        missing = self.df.isna().sum()
        missing_dict = missing[missing > 0].to_dict()
        if missing_dict:
            self.issues["missing_values"] = missing_dict
            
    def _check_negatives(self):
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        negatives = (self.df[numeric_cols] < 0).sum()
        negatives_dict = negatives[negatives > 0].to_dict()
        if negatives_dict:
            self.issues["negative_values"] = negatives_dict

def process_accumulators(df: pd.DataFrame, columns: List[str]) -> pd.DataFrame:
    """
    Process cumulative meter readings into intervals.
    Handles basic resets (when diff < 0, assumes reset and takes current value).
    """
    result = df.copy()
    for col in columns:
        if col in result.columns:
            diff = result[col].diff()
            # Handle resets: if negative, assume the meter was reset to the current reading
            diff = diff.mask(diff < 0, result[col])
            result[f"{col}_interval"] = diff
    return result
