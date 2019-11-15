import pytest
import pandas as pd
import numpy as np

from industrial_energy_baseline.analysis.baseline import Baseline
from industrial_energy_baseline.analysis.performance import PerformanceEvaluator

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

def test_baseline_golden_1(golden_dataset_1):
    df = golden_dataset_1
    
    # Create baseline for 2024
    baseline = Baseline(
        name="BL-2024",
        target="energy",
        drivers=["production", "cdd"],
        start_date="2024-01-01",
        end_date="2024-12-31"
    )
    
    baseline.fit(df, time_column="date")
    metrics = baseline.get_metrics()
    
    # Check that model recovers coefficients approximately
    # E = 1000 + 2*P + 15*CDD
    # Note: statsmodels params index depends on the names. 
    # Intercept is 'const', drivers are 'production', 'cdd'
    params = baseline.model.results.params
    assert abs(params['const'] - 1000) < 50
    assert abs(params['production'] - 2) < 0.2
    assert abs(params['cdd'] - 15) < 2
    
    assert metrics['r2'] > 0.8
    
    # Evaluate performance for 2025
    evaluator = PerformanceEvaluator(baseline)
    df_2025 = df[df["date"] >= "2025-01-01"].copy()
    
    perf_result = evaluator.evaluate(df_2025, time_column="date")
    summary = evaluator.get_summary(perf_result)
    
    # We expect savings because of the 10% reduction after day 500
    assert summary["total_saving"] > 0
    
    # Check that before day 500 (in 2025 it's up to ~mid may), savings are around 0
    # Day 500 is 2025-05-15
    mask_before = (perf_result["date"] < "2025-05-15")
    mask_after = (perf_result["date"] >= "2025-05-15")
    
    savings_before = perf_result.loc[mask_before, "saving"].mean()
    savings_after = perf_result.loc[mask_after, "saving"].mean()
    
    assert abs(savings_before) < 20 # noise is mean 0, std 20
    assert savings_after > 100 # 10% of ~2000 is ~200

def test_false_penalty(golden_dataset_1):
    """
    Dataset where consumption increases strictly because production increases,
    but performance remains exactly the same.
    """
    np.random.seed(42)
    dates = pd.date_range(start="2024-01-01", periods=730, freq="D")
    
    # Production increases in year 2
    production = np.concatenate([
        np.random.normal(500, 50, 365),
        np.random.normal(800, 50, 365) # much higher production
    ])
    
    cdd = np.zeros(730)
    
    expected = 1000 + 2 * production
    noise = np.random.normal(0, 10, 730)
    observed = expected + noise
    
    df = pd.DataFrame({
        "date": dates,
        "production": production,
        "energy": observed
    })
    
    baseline = Baseline(
        name="BL-2024",
        target="energy",
        drivers=["production"],
        start_date="2024-01-01",
        end_date="2024-12-31"
    )
    baseline.fit(df, time_column="date")
    
    df_2025 = df[df["date"] >= "2025-01-01"].copy()
    evaluator = PerformanceEvaluator(baseline)
    perf_result = evaluator.evaluate(df_2025, time_column="date")
    summary = evaluator.get_summary(perf_result)
    
    # Total consumption went up:
    total_obs_2024 = df[df["date"] < "2025-01-01"]["energy"].sum()
    total_obs_2025 = df_2025["energy"].sum()
    assert total_obs_2025 > total_obs_2024
    
    # But savings should be around 0 because the model normalizes the increase
    assert abs(summary["saving_pct"]) < 1.0
