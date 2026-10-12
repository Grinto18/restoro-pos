@echo off
TITLE GRINE RESTAURANT POS - Windows 7 Starter
COLOR 0A
chcp 65001 >nul

echo ================================================================
echo   GRINE RESTAURANT POS - SYSTEM LAUNCHER (Windows 7 SP1 x64)
echo   Computer: Enigma | Printer: CAFETERIA (Driver: 80Normal)
echo ================================================================
echo.

:: 1. Enable Node.js execution on Windows 7
set NODE_SKIP_PLATFORM_CHECK=1

:: 2. Check Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 16.20.2 x64 or Node.js 18 with NODE_SKIP_PLATFORM_CHECK=1.
    pause
    exit /b 1
)

:: 3. Check for .env file
if not exist .env (
    if exist .env.example (
        echo [INFO] Copying .env.example to .env ...
        copy .env.example .env >nul
    )
)

echo [1/3] Starting POS Backend Server (Node.js + Express + PostgreSQL)...
start "GRINE POS SERVER" /min cmd /c "set NODE_SKIP_PLATFORM_CHECK=1 && npm run dev"

echo [2/3] Waiting for server to initialize on http://localhost:3000 ...
timeout /t 5 /nobreak >nul

echo [3/3] Launching Cashier Terminal in Silent POS Print Mode...
:: Search for Chrome installation path
set CHROME_PATH=""
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set CHROME_PATH="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set CHROME_PATH="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set CHROME_PATH="%LocalAppData%\Google\Chrome\Application\chrome.exe"

if not %CHROME_PATH%=="" (
    echo Launching Chrome with Kiosk Silent Thermal Printing...
    start "" %CHROME_PATH% --kiosk-printing --app=http://localhost:3000
) else (
    echo Chrome not found in default locations. Opening default browser...
    start http://localhost:3000
)

echo.
echo ================================================================
echo   POS IS RUNNING! DO NOT CLOSE THE BACKGROUND SERVER WINDOW.
echo   Press any key to stop the server when closing the restaurant.
echo ================================================================
pause
taskkill /f /im node.exe >nul 2>nul
