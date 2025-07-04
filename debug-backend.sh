#!/bin/bash

echo "=== Backend Debug & Troubleshooting ==="
echo ""

# Check if backend directory exists
if [ -d "video-render-backend" ]; then
    echo "✓ Backend directory found"
    cd video-render-backend
    
    # Check uploads directory
    echo ""
    echo "=== Checking Upload Directories ==="
    
    if [ -d "uploads" ]; then
        echo "✓ Uploads directory exists"
        
        if [ -d "uploads/videos" ]; then
            echo "✓ Videos directory exists"
            echo "Video files:"
            ls -la uploads/videos/ || echo "No video files found"
        else
            echo "✗ Videos directory missing"
            mkdir -p uploads/videos
            echo "✓ Created videos directory"
        fi
        
        if [ -d "uploads/audio" ]; then
            echo "✓ Audio directory exists"
            echo "Audio files:"
            ls -la uploads/audio/ || echo "No audio files found"
        else
            echo "✗ Audio directory missing"
            mkdir -p uploads/audio
            echo "✓ Created audio directory"
        fi
        
        if [ -d "uploads/images" ]; then
            echo "✓ Images directory exists"
            echo "Image files:"
            ls -la uploads/images/ || echo "No image files found"
        else
            echo "✗ Images directory missing"
            mkdir -p uploads/images
            echo "✓ Created images directory"
        fi
    else
        echo "✗ Uploads directory missing"
        mkdir -p uploads/videos uploads/audio uploads/images
        echo "✓ Created upload directories"
    fi
    
    # Check outputs directory
    echo ""
    echo "=== Checking Output Directory ==="
    
    if [ -d "outputs" ]; then
        echo "✓ Outputs directory exists"
        echo "Output files:"
        ls -la outputs/ || echo "No output files found"
    else
        echo "✗ Outputs directory missing"
        mkdir -p outputs
        echo "✓ Created outputs directory"
    fi
    
    # Check node_modules and dependencies
    echo ""
    echo "=== Checking Dependencies ==="
    
    if [ -d "node_modules" ]; then
        echo "✓ Node modules installed"
        
        if [ -f "node_modules/ffmpeg-static/ffmpeg" ] || [ -f "node_modules/ffmpeg-static/ffmpeg.exe" ]; then
            echo "✓ FFmpeg static found"
        else
            echo "✗ FFmpeg static missing"
            echo "Run: npm install ffmpeg-static"
        fi
        
        if [ -d "node_modules/fluent-ffmpeg" ]; then
            echo "✓ Fluent FFmpeg found"
        else
            echo "✗ Fluent FFmpeg missing"
            echo "Run: npm install fluent-ffmpeg"
        fi
    else
        echo "✗ Node modules missing"
        echo "Run: npm install"
    fi
    
    # Check package.json scripts
    echo ""
    echo "=== Available Scripts ==="
    if [ -f "package.json" ]; then
        echo "Scripts in package.json:"
        grep -A 10 '"scripts":' package.json | head -15
    fi
    
    cd ..
else
    echo "✗ Backend directory not found"
    echo "Please run this script from the project root directory"
fi

echo ""
echo "=== Quick Fix Commands ==="
echo "1. Install dependencies:"
echo "   cd video-render-backend && npm install"
echo ""
echo "2. Start backend with debug:"
echo "   cd video-render-backend && npm run dev"
echo ""
echo "3. Test FFmpeg manually:"
echo "   node debug-ffmpeg.js"
echo ""
echo "4. Clear outputs and restart:"
echo "   rm -rf video-render-backend/outputs/* && cd video-render-backend && npm run dev"
echo ""
