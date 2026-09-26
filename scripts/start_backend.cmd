@echo off
setlocal
cd /d "%~dp0.."
title OceanTwin FastAPI

if not exist ".venv\Scripts\python.exe" (
  echo.
  echo [OceanTwin] Python virtual environment not found.
  echo Expected: %CD%\.venv\Scripts\python.exe
  echo.
  echo Create/install the environment once, then re-run START_OCEANTWIN.cmd.
  pause
  exit /b 1
)

echo [OceanTwin] Starting FastAPI on http://localhost:8000
".venv\Scripts\python.exe" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
