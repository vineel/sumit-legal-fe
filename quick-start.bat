@echo off
echo 🚀 LegalCollab Platform - Quick Start Setup
echo ==============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo 📦 Installing Backend Dependencies...
cd legal-collab-platform-backend
call npm install

echo 📦 Installing Frontend Dependencies...
cd ..\legal-collab-platform
call npm install

echo 🔧 Setting up Environment Variables...

REM Create backend .env file
(
echo # Database
echo MONGODB_URI=mongodb://localhost:27017/legalcollab
echo.
echo # JWT
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
echo JWT_EXPIRES_IN=24h
echo.
echo # OpenAI ^(Add your API key here^)
echo OPENAI_API_KEY=your-openai-api-key-here
echo.
echo # Email ^(Configure your email settings^)
echo EMAIL_HOST=smtp.gmail.com
echo EMAIL_PORT=587
echo EMAIL_USER=your-email@gmail.com
echo EMAIL_PASS=your-app-password
echo.
echo # Frontend URL
echo FRONTEND_URL=http://localhost:3000
echo.
echo # Server
echo PORT=5000
echo NODE_ENV=development
) > ..\legal-collab-platform-backend\.env

REM Create frontend .env.local file
(
echo NEXT_PUBLIC_API_URL=http://localhost:5000
echo NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
) > .env.local

echo ✅ Environment files created!
echo.
echo ⚠️  IMPORTANT: Please update the following in legal-collab-platform-backend\.env:
echo    - OPENAI_API_KEY: Add your OpenAI API key
echo    - EMAIL_USER: Add your email address
echo    - EMAIL_PASS: Add your email app password
echo.
echo 🚀 Starting servers...

REM Start backend
cd ..\legal-collab-platform-backend
start "Backend Server" cmd /k "npm run dev"

REM Wait a moment
timeout /t 5 /nobreak >nul

REM Start frontend
cd ..\legal-collab-platform
start "Frontend Server" cmd /k "npm run dev"

echo.
echo 🎉 Servers are starting!
echo    Backend: http://localhost:5000
echo    Frontend: http://localhost:3001
echo.
echo 📋 Next Steps:
echo    1. Open http://localhost:3001 in your browser
echo    2. Create an admin account at /admin/login
echo    3. Add some templates and clauses
echo    4. Create a user account and test the flow
echo.
echo 🛑 To stop servers: Close the command windows
pause
