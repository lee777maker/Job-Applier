#!/usr/bin/env python3
import os
import subprocess
import sys

from dotenv import load_dotenv

def main():
    # Load environment variables from .env if present
    if os.path.exists(".env"):
        load_dotenv(".env")
        print("Loaded environment variables from .env")
    
    # Verify OPENAI_API_KEY is loaded
    if not os.getenv("OPENAI_API_KEY"):
        print("ERROR: OPENAI_API_KEY not found in environment or .env file")
        sys.exit(1)

    # IMPORTANT: your FastAPI app is in app.py -> app = FastAPI(...)
    # So the import string should be "app:app" (module:file : variable)
    cmd = [
        sys.executable, "-m", "uvicorn",
        "app:app",
        "--host", "0.0.0.0",
        "--port", "8001",
        "--reload",
    ]

    # Pass the current environment (including loaded .env vars) to subprocess
    subprocess.run(cmd, check=True, env=os.environ.copy())

if __name__ == "__main__":
    main()