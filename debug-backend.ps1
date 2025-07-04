# Backend Debug & Troubleshooting Script for Windows
Write-Host "=== Backend Debug & Troubleshooting ===" -ForegroundColor Cyan
Write-Host ""

# Check if backend directory exists
if (Test-Path "video-render-backend") {
    Write-Host "✓ Backend directory found" -ForegroundColor Green
    Set-Location "video-render-backend"
    
    # Check uploads directory
    Write-Host ""
    Write-Host "=== Checking Upload Directories ===" -ForegroundColor Cyan
    
    if (Test-Path "uploads") {
        Write-Host "✓ Uploads directory exists" -ForegroundColor Green
        
        if (Test-Path "uploads\videos") {
            Write-Host "✓ Videos directory exists" -ForegroundColor Green
            Write-Host "Video files:"
            Get-ChildItem "uploads\videos" -ErrorAction SilentlyContinue | Format-Table Name, Length, LastWriteTime
        } else {
            Write-Host "✗ Videos directory missing" -ForegroundColor Red
            New-Item -ItemType Directory -Path "uploads\videos" -Force | Out-Null
            Write-Host "✓ Created videos directory" -ForegroundColor Green
        }
        
        if (Test-Path "uploads\audio") {
            Write-Host "✓ Audio directory exists" -ForegroundColor Green
            Write-Host "Audio files:"
            Get-ChildItem "uploads\audio" -ErrorAction SilentlyContinue | Format-Table Name, Length, LastWriteTime
        } else {
            Write-Host "✗ Audio directory missing" -ForegroundColor Red
            New-Item -ItemType Directory -Path "uploads\audio" -Force | Out-Null
            Write-Host "✓ Created audio directory" -ForegroundColor Green
        }
        
        if (Test-Path "uploads\images") {
            Write-Host "✓ Images directory exists" -ForegroundColor Green
            Write-Host "Image files:"
            Get-ChildItem "uploads\images" -ErrorAction SilentlyContinue | Format-Table Name, Length, LastWriteTime
        } else {
            Write-Host "✗ Images directory missing" -ForegroundColor Red
            New-Item -ItemType Directory -Path "uploads\images" -Force | Out-Null
            Write-Host "✓ Created images directory" -ForegroundColor Green
        }
    } else {
        Write-Host "✗ Uploads directory missing" -ForegroundColor Red
        New-Item -ItemType Directory -Path "uploads\videos" -Force | Out-Null
        New-Item -ItemType Directory -Path "uploads\audio" -Force | Out-Null
        New-Item -ItemType Directory -Path "uploads\images" -Force | Out-Null
        Write-Host "✓ Created upload directories" -ForegroundColor Green
    }
    
    # Check outputs directory
    Write-Host ""
    Write-Host "=== Checking Output Directory ===" -ForegroundColor Cyan
    
    if (Test-Path "outputs") {
        Write-Host "✓ Outputs directory exists" -ForegroundColor Green
        Write-Host "Output files:"
        Get-ChildItem "outputs" -ErrorAction SilentlyContinue | Format-Table Name, Length, LastWriteTime
    } else {
        Write-Host "✗ Outputs directory missing" -ForegroundColor Red
        New-Item -ItemType Directory -Path "outputs" -Force | Out-Null
        Write-Host "✓ Created outputs directory" -ForegroundColor Green
    }
    
    # Check node_modules and dependencies
    Write-Host ""
    Write-Host "=== Checking Dependencies ===" -ForegroundColor Cyan
    
    if (Test-Path "node_modules") {
        Write-Host "✓ Node modules installed" -ForegroundColor Green
        
        if ((Test-Path "node_modules\ffmpeg-static\ffmpeg.exe") -or (Test-Path "node_modules\ffmpeg-static\ffmpeg")) {
            Write-Host "✓ FFmpeg static found" -ForegroundColor Green
        } else {
            Write-Host "✗ FFmpeg static missing" -ForegroundColor Red
            Write-Host "Run: npm install ffmpeg-static" -ForegroundColor Yellow
        }
        
        if (Test-Path "node_modules\fluent-ffmpeg") {
            Write-Host "✓ Fluent FFmpeg found" -ForegroundColor Green
        } else {
            Write-Host "✗ Fluent FFmpeg missing" -ForegroundColor Red
            Write-Host "Run: npm install fluent-ffmpeg" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ Node modules missing" -ForegroundColor Red
        Write-Host "Run: npm install" -ForegroundColor Yellow
    }
    
    # Check package.json scripts
    Write-Host ""
    Write-Host "=== Available Scripts ===" -ForegroundColor Cyan
    if (Test-Path "package.json") {
        Write-Host "Scripts in package.json:"
        $packageContent = Get-Content "package.json" | ConvertFrom-Json
        $packageContent.scripts | Format-List
    }
    
    Set-Location ".."
} else {
    Write-Host "✗ Backend directory not found" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Quick Fix Commands ===" -ForegroundColor Cyan
Write-Host "1. Install dependencies:" -ForegroundColor White
Write-Host "   cd video-render-backend; npm install" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start backend with debug:" -ForegroundColor White
Write-Host "   cd video-render-backend; npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test FFmpeg manually:" -ForegroundColor White
Write-Host "   node debug-ffmpeg.js" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Clear outputs and restart:" -ForegroundColor White
Write-Host "   Remove-Item video-render-backend\outputs\* -Force; cd video-render-backend; npm run dev" -ForegroundColor Gray
Write-Host ""

# Check current location for additional debug
Write-Host "=== Current Environment ===" -ForegroundColor Cyan
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
Write-Host "Node version: $(node --version 2>$null)" -ForegroundColor Gray
Write-Host "NPM version: $(npm --version 2>$null)" -ForegroundColor Gray
