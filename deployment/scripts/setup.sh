#!/bin/bash

# PAC Hosting Server Setup Script

set -e

echo "🚀 PAC Hosting Server Setup"
echo "=========================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is required but not installed."
    echo "Please install npm (usually comes with Node.js)"
    exit 1
fi

echo "✓ Node.js and npm are installed"

# Install dependencies
echo "Installing dependencies..."
npm install

# Display options
echo ""
echo "Setup complete! Choose an option:"
echo "1. Start the server (npm start)"
echo "2. Start in development mode (npm run dev)"
echo "3. Run tests (npm test)"
echo "4. Build and run with Docker"
echo "5. Build and run with Docker Compose"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "Starting server..."
        npm start
        ;;
    2)
        echo "Starting in development mode..."
        npm run dev
        ;;
    3)
        echo "Running tests..."
        echo "Note: This will start the server first if not already running"
        npm start &
        SERVER_PID=$!
        sleep 3
        npm test
        kill $SERVER_PID
        ;;
    4)
        if ! command_exists docker; then
            echo "❌ Docker is required but not installed."
            exit 1
        fi
        echo "Building Docker image..."
        docker build -t pac-hosting-server .
        echo "Running Docker container..."
        docker run -p 80:80 pac-hosting-server
        ;;
    5)
        if ! command_exists docker-compose; then
            echo "❌ Docker Compose is required but not installed."
            exit 1
        fi
        echo "Building and running with Docker Compose..."
        docker-compose up --build
        ;;
    *)
        echo "Invalid choice. You can manually run:"
        echo "  npm start          - Start the server"
        echo "  npm run dev        - Start in development mode"
        echo "  npm test           - Run tests"
        echo "  docker-compose up  - Run with Docker Compose"
        ;;
esac
