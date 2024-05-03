@echo off
cls

:: Check for Node.js and npm and install them if they are not present
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed. Installing Node.js...
    powershell -Command "Set-ExecutionPolicy Unrestricted -Scope CurrentUser -Force"
    powershell -Command "(New-Object System.Net.WebClient).DownloadFile('https://nodejs.org/dist/v14.17.0/node-v14.17.0-x64.msi', 'node-v14.17.0-x64.msi')"
    msiexec /i node-v14.17.0-x64.msi /quiet /norestart
    SET "PATH=%PATH%;C:\Program Files\nodejs"
)

:: Installing npm packages
echo Installing npm packages...
cd /d %~dp0
cd ..
npm install

echo Setup complete. Please restart your terminal for all changes to take effect.
pause >nul
