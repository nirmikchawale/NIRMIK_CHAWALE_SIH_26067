@echo off
setlocal
echo Stopping OceanTwin local services...

for %%P in (5173 8000) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr ":%%P" ^| findstr "LISTENING"') do (
    taskkill /PID %%A /F >nul 2>nul
  )
)

echo OceanTwin services stopped.
timeout /t 2 /nobreak >nul
exit /b 0
