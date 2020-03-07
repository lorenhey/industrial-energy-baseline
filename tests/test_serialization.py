import pandas as pd
from industrial_energy_baseline.analysis.baseline import Baseline

def test_baseline_serialization(golden_dataset_1):
    df = golden_dataset_1
    
    baseline = Baseline(
        name="BL-Serialize",
        target="energy",
        drivers=["production", "cdd"],
        start_date="2024-01-01",
        end_date="2024-12-31"
    )
    baseline.fit(df, time_column="date")
    
    # Serialize
    b_dict = baseline.to_dict()
    assert b_dict["name"] == "BL-Serialize"
    assert "const" in b_dict["coefficients"]
    assert "production" in b_dict["coefficients"]
    
    # Deserialize
    baseline_loaded = Baseline.from_dict(b_dict)
    
    # Predict with both and compare
    df_2025 = df[df["date"] >= "2025-01-01"].copy()
    
    pred_orig = baseline.predict(df_2025)
    pred_load = baseline_loaded.predict(df_2025)
    
    pd.testing.assert_series_equal(pred_orig, pred_load, check_names=False)
