import typer
import pandas as pd
from rich.console import Console
from rich.table import Table
import yaml

from industrial_energy_baseline.core.data_quality import DataQualityChecker
from industrial_energy_baseline.analysis.baseline import Baseline
from industrial_energy_baseline.analysis.performance import PerformanceEvaluator

app = typer.Typer(help="Industrial Energy Baseline CLI")
console = Console()

@app.command()
def validate(file_path: str, time_column: str = "date"):
    """
    Validate the data quality of a dataset.
    """
    console.print(f"Validating dataset: [bold]{file_path}[/bold]")
    
    try:
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file_path.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file_path)
        else:
            console.print("[red]Unsupported file format. Use CSV or XLSX.[/red]")
            raise typer.Exit(1)
            
        checker = DataQualityChecker(df, time_column=time_column)
        report = checker.check_all()
        
        table = Table(title="Data Quality Report")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="magenta")
        
        table.add_row("Total records", str(report["total_records"]))
        table.add_row("Is valid", "[green]Yes[/green]" if report["is_valid"] else "[red]No[/red]")
        
        console.print(table)
        
        if not report["is_valid"]:
            console.print("\n[red]Issues found:[/red]")
            for issue_type, issue_data in report["issues"].items():
                console.print(f"- {issue_type}: {issue_data}")
                
    except Exception as e:
        console.print(f"[red]Error validating data: {e}[/red]")
        raise typer.Exit(1)

@app.command()
def baseline_create(data_path: str, config_path: str, output_path: str = "baseline.yaml"):
    """
    Create a baseline model based on a configuration file.
    """
    console.print(f"Creating baseline from {config_path} using data {data_path}")
    
    try:
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
            
        if data_path.endswith('.csv'):
            df = pd.read_csv(data_path)
        elif data_path.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(data_path)
            
        baseline_conf = config.get("baseline", {})
        target = config.get("target", {}).get("energy")
        drivers = config.get("drivers", [])
        
        baseline = Baseline(
            name=baseline_conf.get("name", "Baseline"),
            target=target,
            drivers=drivers,
            start_date=baseline_conf.get("start"),
            end_date=baseline_conf.get("end"),
            model_type=config.get("model", {}).get("type", "linear")
        )
        
        baseline.fit(df, time_column=config.get("time_column", "date"))
        
        console.print("\n[green]Baseline created successfully![/green]\n")
        console.print(baseline.get_summary())
        
        # Here we would normally serialize the baseline to output_path
        # For MVP we just print the summary
        
    except Exception as e:
        console.print(f"[red]Error creating baseline: {e}[/red]")
        raise typer.Exit(1)

@app.command()
def gui():
    """
    Launch the interactive Streamlit dashboard.
    """
    import subprocess
    import os
    
    gui_path = os.path.join(os.path.dirname(__file__), '..', 'gui', 'app.py')
    console.print(f"[bold cyan]Launching GUI from {gui_path}[/bold cyan]")
    subprocess.run(["streamlit", "run", gui_path])

@app.command()
def demo():
    """
    Run a full synthetic demo.
    """
    console.print("[bold cyan]Running Industrial Energy Baseline Demo...[/bold cyan]")
    
    import numpy as np
    
    # Generate data
    np.random.seed(42)
    dates = pd.date_range(start="2024-01-01", periods=730, freq="D")
    production = np.random.normal(500, 50, 730)
    cdd = np.random.uniform(0, 10, 730)
    
    expected = 1000 + 2 * production + 15 * cdd
    noise = np.random.normal(0, 20, 730)
    observed = expected + noise
    
    saving_mask = np.arange(730) >= 499
    observed[saving_mask] = observed[saving_mask] * 0.9 # 10% saving
    
    df = pd.DataFrame({
        "date": dates,
        "production": production,
        "cdd": cdd,
        "energy": observed
    })
    
    console.print("1. Creating baseline for 2024...")
    baseline = Baseline(
        name="Demo-BL-2024",
        target="energy",
        drivers=["production", "cdd"],
        start_date="2024-01-01",
        end_date="2024-12-31"
    )
    baseline.fit(df, time_column="date")
    
    console.print(baseline.get_summary())
    
    console.print("\n2. Evaluating performance for 2025...")
    df_2025 = df[df["date"] >= "2025-01-01"].copy()
    
    evaluator = PerformanceEvaluator(baseline)
    perf_result = evaluator.evaluate(df_2025, time_column="date")
    summary = evaluator.get_summary(perf_result)
    
    table = Table(title="Performance Summary 2025")
    table.add_column("Metric")
    table.add_column("Value")
    table.add_row("Total Expected", f"{summary['total_expected']:.2f}")
    table.add_row("Total Observed", f"{summary['total_observed']:.2f}")
    table.add_row("Total Saving", f"{summary['total_saving']:.2f}")
    table.add_row("Saving (%)", f"{summary['saving_pct']:.2f}%")
    table.add_row("Final CUSUM", f"{summary['cusum_final']:.2f}")
    
    console.print(table)
    
    # 3. Generate Report
    console.print("\n3. Generating Markdown Report (demo_report.md)...")
    from industrial_energy_baseline.analysis.report import MarkdownReportGenerator
    report_gen = MarkdownReportGenerator(baseline, perf_result, summary)
    with open("demo_report.md", "w", encoding="utf-8") as f:
        f.write(report_gen.generate())
        
    console.print("[bold green]Demo finished![/bold green] Check demo_report.md")

if __name__ == "__main__":
    app()
