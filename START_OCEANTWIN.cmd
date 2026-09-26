@echo off
setlocal
cd /d "%~dp0"
title OceanTwin Launcher

echo ============================================
echo        OceanTwin 3D - Local Launcher
echo ============================================
echo.
echo Starting scientific API and 3D frontend...
echo.

start "OceanTwin FastAPI" cmd /k ""%~dp0scripts\start_backend.cmd""
timeout /t 2 /nobreak >nul
start "OceanTwin React + Cesium" cmd /k ""%~dp0scripts\start_frontend.cmd""

echo Waiting for the services to initialise...
timeout /t 6 /nobreak >nul

start "" "http://localhost:5173"
echo.
echo OceanTwin launched.
echo Frontend: http://localhost:5173
echo API:      http://localhost:8000
echo API docs: http://localhost:8000/docs
echo.
echo You can close this launcher window.
timeout /t 3 /nobreak >nul
exit /b 0
