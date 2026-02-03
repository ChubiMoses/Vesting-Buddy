import subprocess
import os
import sys
import warnings

# Suppress Pydantic V1 compatibility warning
warnings.filterwarnings("ignore", message="Core Pydantic V1 functionality isn't compatible")

# Ensure backend directory is in path for imports
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

# Apply Opik patches
try:
    import patch_opik
except ImportError:
    print("⚠️ Could not import patch_opik")
except Exception as e:
    print(f"⚠️ Error importing patch_opik: {e}")

# Load environment variables from .env
try:
    import config_loader
except ImportError:
    # Fallback if config_loader not found in path
    print("⚠️ config_loader not found, attempting manual .env load")
    from dotenv import load_dotenv
    load_dotenv(os.path.join(BASE_DIR, ".env"))

# List of evaluation scripts
EVAL_SCRIPTS = [
    "opik/evals/extractor_eval.py",
    "opik/evals/guardrail_eval.py",
    "opik/evals/policy_scout_eval.py",
    "opik/evals/strategist_eval.py",
    "opik/evals/vesting_cliff_eval.py",
]

# List of optimization scripts
OPTIMIZATION_SCRIPTS = [
    "opik/optimizations/optimize_extractor.py",
    "opik/optimizations/optimize_guardrail.py",
    "opik/optimizations/optimize_policy.py",
    "opik/optimizations/optimize_strategist.py",
    # "opik/optimizations/optimize_vesting_cliff.py", # Producing error: list has no attribute items
]

def run_script(script_rel_path):
    script_path = os.path.join(BASE_DIR, script_rel_path)
    if not os.path.exists(script_path):
        print(f"⚠️ Script not found: {script_rel_path}")
        return False

    print(f"\n========================================================")
    print(f"▶️ Running: {script_rel_path}")
    print(f"========================================================")
    
    # Prepare environment
    env = os.environ.copy()
    # Include current sys.path to ensure installed packages are found even if HOME changes
    env["PYTHONPATH"] = f"{env.get('PYTHONPATH', '')}:{':'.join(sys.path)}:{BASE_DIR}"
    
    # Suppress Pydantic V1 compatibility warning in subprocesses
    env["PYTHONWARNINGS"] = "ignore:Core Pydantic V1 functionality isn't compatible"

    # Fix for permission issues by redirecting HOME
    # This ensures tools writing to ~/.cache or ~/.litellm_cache write to the local project instead
    local_home = os.path.join(BASE_DIR, ".local_home")
    if not os.path.exists(local_home):
        os.makedirs(local_home, exist_ok=True)
    env["HOME"] = local_home
    env["LITELLM_CACHE_DIR"] = os.path.join(local_home, ".litellm_cache")
    
    try:
        # Run the script
        result = subprocess.run(
            [sys.executable, script_path],
            env=env,
            cwd=os.path.dirname(BASE_DIR), # Run from project root (parent of backend) or backend? 
            # The scripts assume they are run from project root usually if they do relative imports or file access.
            # But the previous command ran them with CWD as project root.
            # However, the scripts have `sys.path.append(...)` to find backend modules.
            # Let's check `vesting_cliff_eval.py`:
            # `dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "datasets", "vesting_cliff.jsonl")`
            # This is relative to the script file, so CWD shouldn't matter for file access if they use __file__.
            # But `sys.path.append` adds `backend` to path.
            # Let's set CWD to project root.
            check=True
        )
        print(f"✅ Finished: {script_rel_path}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed: {script_rel_path} (Exit Code: {e.returncode})")
        return False
    except Exception as e:
        print(f"❌ Error running {script_rel_path}: {e}")
        return False

def main():
    print("🚀 Starting Opik Evaluations and Optimizations Batch Run")
    
    failures = []
    
    print("\n--- Evaluations ---")
    for script in EVAL_SCRIPTS:
        if not run_script(script):
            failures.append(script)
            
    print("\n--- Optimizations ---")
    for script in OPTIMIZATION_SCRIPTS:
        if not run_script(script):
            failures.append(script)
            
    print("\n========================================================")
    if failures:
        print(f"⚠️ Completed with {len(failures)} failures:")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)
    else:
        print("✅ All tasks completed successfully!")
        sys.exit(0)

if __name__ == "__main__":
    main()
