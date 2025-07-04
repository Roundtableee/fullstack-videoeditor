@echo off
REM Video Render Setup Script for Windows

echo 🚀 Setting up Video Render with Copilot...

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo ✅ Node.js version: 
node -v

REM Install root dependencies
echo 📦 Installing root dependencies...
call npm install

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd video-render-backend
if not exist package.json (
    echo ❌ Backend package.json not found
    exit /b 1
)
call npm install
cd ..

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd AI-avatar-frontend\react-video-editor-main
if not exist package.json (
    echo ❌ Frontend package.json not found
    exit /b 1
)
call npm install
cd ..\..

REM Setup environment files
echo ⚙️ Setting up environment files...

REM Backend environment
if not exist video-render-backend\.env (
    copy video-render-backend\.env.example video-render-backend\.env
    echo ✅ Created backend .env file
) else (
    echo ⚠️ Backend .env already exists
)

REM Frontend environment
if not exist AI-avatar-frontend\react-video-editor-main\.env (
    copy AI-avatar-frontend\react-video-editor-main\.env.example AI-avatar-frontend\react-video-editor-main\.env
    echo ✅ Created frontend .env file
) else (
    echo ⚠️ Frontend .env already exists
)

REM Create necessary directories
echo 📁 Creating directories...
mkdir video-render-backend\uploads 2>nul
mkdir video-render-backend\outputs 2>nul
echo ✅ Created upload and output directories

REM Check for Docker (optional)
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Docker is available
    where docker-compose >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Docker Compose is available
    ) else (
        echo ⚠️ Docker Compose not found. Install for container deployment.
    )
) else (
    echo ⚠️ Docker not found. Install for container deployment.
)

echo.
echo 🎉 Setup complete!
echo.
echo 📖 Next steps:
echo   1. Start development: npm run dev
echo   2. Or start with Docker: npm run docker:up
echo.
echo 🌐 URLs:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo   Health:   http://localhost:3001/health
echo.
echo 📚 For more information, see README.md

pause
