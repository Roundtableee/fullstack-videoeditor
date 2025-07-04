# PowerShell Setup Script for React Video Editor with Backend
Write-Host "🚀 Setting up React Video Editor with Backend..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Setup Backend
Write-Host "📦 Setting up backend..." -ForegroundColor Yellow
Set-Location "video-render-backend"

# Copy environment file
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created backend .env file" -ForegroundColor Green
}

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

# Start backend in background
Write-Host "🔧 Starting backend server..." -ForegroundColor Yellow
Start-Process -WindowStyle Minimized -FilePath "npm" -ArgumentList "run", "dev"
Write-Host "✅ Backend started in background" -ForegroundColor Green

# Wait for backend to start
Start-Sleep -Seconds 3

# Setup Frontend
Write-Host "📦 Setting up frontend..." -ForegroundColor Yellow
Set-Location "../AI-avatar-frontend/react-video-editor-main"

# Copy environment file
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created frontend .env file" -ForegroundColor Green
}

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green

# Start frontend
Write-Host "🔧 Starting frontend server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 Frontend will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🌐 Backend will be available at: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Press Ctrl+C to stop the frontend server" -ForegroundColor Yellow
Write-Host ""

npm run dev
