import pytest
import pandas as pd
import numpy as np

@pytest.fixture
def golden_dataset_1():
    """
    E = 1000 + 2*P + 15*CDD + noise
    Baseline: days 1-365
    Reporting: days 366-730
    At day 500, we introduce a real saving of 10%.
    """
    np.random.seed(42)
    dates = pd.date_range(start="2024-01-01", periods=730, freq="D")
    
    # Drivers
    production = np.random.normal(500, 50, 730)
    cdd = np.random.uniform(0, 10, 730)
    
    # Expected consumption without savings
    expected = 1000 + 2 * production + 15 * cdd
    noise = np.random.normal(0, 20, 730)
    
    observed = expected + noise
    
    # Introduce real saving starting day 500 (index 499)
    # The saving is 10% reduction in consumption
    saving_mask = np.arange(730) >= 499
    observed[saving_mask] = observed[saving_mask] * 0.9
    
    df = pd.DataFrame({
        "date": dates,
        "production": production,
        "cdd": cdd,
        "energy": observed
    })
    return df
