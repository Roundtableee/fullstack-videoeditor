#!/bin/bash

# Video Render Setup Script
echo "🚀 Setting up Video Render with Copilot..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd video-render-backend
if [ ! -f package.json ]; then
    echo "❌ Backend package.json not found"
    exit 1
fi
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd AI-avatar-frontend/react-video-editor-main
if [ ! -f package.json ]; then
    echo "❌ Frontend package.json not found"
    exit 1
fi
npm install
cd ../..

# Setup environment files
echo "⚙️ Setting up environment files..."

# Backend environment
if [ ! -f video-render-backend/.env ]; then
    cp video-render-backend/.env.example video-render-backend/.env
    echo "✅ Created backend .env file"
else
    echo "⚠️ Backend .env already exists"
fi

# Frontend environment
if [ ! -f AI-avatar-frontend/react-video-editor-main/.env ]; then
    cp AI-avatar-frontend/react-video-editor-main/.env.example AI-avatar-frontend/react-video-editor-main/.env
    echo "✅ Created frontend .env file"
else
    echo "⚠️ Frontend .env already exists"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p video-render-backend/uploads
mkdir -p video-render-backend/outputs
echo "✅ Created upload and output directories"

# Check for Docker (optional)
if command -v docker &> /dev/null; then
    echo "✅ Docker is available"
    if command -v docker-compose &> /dev/null; then
        echo "✅ Docker Compose is available"
    else
        echo "⚠️ Docker Compose not found. Install for container deployment."
    fi
else
    echo "⚠️ Docker not found. Install for container deployment."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📖 Next steps:"
echo "  1. Start development: npm run dev"
echo "  2. Or start with Docker: npm run docker:up"
echo ""
echo "🌐 URLs:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo "  Health:   http://localhost:3001/health"
echo ""
echo "📚 For more information, see README.md"
