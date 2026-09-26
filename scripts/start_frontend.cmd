@echo off
setlocal
cd /d "%~dp0..\frontend"
title OceanTwin React + Cesium

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo.
  echo [OceanTwin] npm.cmd was not found.
  echo Install Node.js, reopen Windows, then re-run START_OCEANTWIN.cmd.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [OceanTwin] First frontend run: installing dependencies...
  call npm.cmd install
  if errorlevel 1 (
    echo [OceanTwin] npm install failed.
    pause
    exit /b 1
  )
)

echo [OceanTwin] Starting React + Cesium on http://localhost:5173
call npm.cmd run dev
