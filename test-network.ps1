#!/usr/bin/env pwsh
# Network Access Test Script
# Run this script to verify that both servers are working correctly

Write-Host "🔍 React Video Editor - Network Access Test" -ForegroundColor Cyan
Write-Host "=" * 50

# Test 1: Check if processes are running
Write-Host "`n1. Checking Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
if ($nodeProcesses.Count -gt 0) {
    Write-Host "✅ Found $($nodeProcesses.Count) Node.js processes running" -ForegroundColor Green
} else {
    Write-Host "❌ No Node.js processes found" -ForegroundColor Red
}

# Test 2: Check ports
Write-Host "`n2. Checking server ports..." -ForegroundColor Yellow

$backend = netstat -an | findstr ":3001.*LISTENING"
$frontend = netstat -an | findstr ":5173.*LISTENING"

if ($backend) {
    Write-Host "✅ Backend port 3001: LISTENING" -ForegroundColor Green
} else {
    Write-Host "❌ Backend port 3001: NOT LISTENING" -ForegroundColor Red
}

if ($frontend) {
    Write-Host "✅ Frontend port 5173: LISTENING" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend port 5173: NOT LISTENING" -ForegroundColor Red
}

# Test 3: Get IP addresses
Write-Host "`n3. Network addresses:" -ForegroundColor Yellow
$ipAddresses = ipconfig | Select-String "IPv4" | ForEach-Object { 
    $_.ToString().Split(':')[1].Trim() 
} | Where-Object { $_ -ne "127.0.0.1" }

Write-Host "   Localhost: http://localhost:5173" -ForegroundColor White
foreach ($ip in $ipAddresses) {
    Write-Host "   Network:   http://$ip:5173" -ForegroundColor White
}

# Test 4: Basic connectivity test
Write-Host "`n4. Testing connectivity..." -ForegroundColor Yellow

try {
    $backendTest = Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue
    if ($backendTest.TcpTestSucceeded) {
        Write-Host "✅ Backend (3001): Connection successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend (3001): Connection failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend (3001): Test failed" -ForegroundColor Red
}

try {
    $frontendTest = Test-NetConnection -ComputerName localhost -Port 5173 -WarningAction SilentlyContinue
    if ($frontendTest.TcpTestSucceeded) {
        Write-Host "✅ Frontend (5173): Connection successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend (5173): Connection failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Frontend (5173): Test failed" -ForegroundColor Red
}

# Test 5: Instructions
Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open browser to: http://localhost:5173" -ForegroundColor White
Write-Host "2. Test file upload functionality" -ForegroundColor White
Write-Host "3. Test video playback in media library" -ForegroundColor White
Write-Host "4. For network testing, use IP addresses shown above" -ForegroundColor White

Write-Host "`n📝 To start servers manually:" -ForegroundColor Cyan
Write-Host "Backend:  cd video-render-backend && npm run dev" -ForegroundColor Gray
Write-Host "Frontend: cd AI-avatar-frontend/react-video-editor-main && npm run dev" -ForegroundColor Gray

Write-Host "`n" + "=" * 50
Write-Host "Test completed! Check results above." -ForegroundColor Cyan
