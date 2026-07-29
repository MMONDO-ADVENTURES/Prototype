@echo off
setlocal
cd /d "%~dp0"

if exist "venv\Scripts\python.exe" (
  "venv\Scripts\python.exe" run.py %*
  exit /b %ERRORLEVEL%
)

where py >nul 2>&1
if %ERRORLEVEL%==0 (
  py -3 run.py %*
  exit /b %ERRORLEVEL%
)

where python >nul 2>&1
if %ERRORLEVEL%==0 (
  python run.py %*
  exit /b %ERRORLEVEL%
)

echo Python was not found.
echo Install Python 3, or create the venv first, then run this file again.
echo.
echo   py -3 -m venv venv
echo   venv\Scripts\pip install -r requirements.txt
echo   run.bat
exit /b 1
