#!/bin/bash
# Set tenant ID variable
# Get tenant ID from script parameter or environment variable
TENANT_ID="${1:-$TENANT_ID}"

# Check if tenant ID is set
if [ -z "$TENANT_ID" ]; then
    echo "Error: TENANT_ID not provided"
    echo "Usage: $0 <tenant-id>"
    echo "   or: TENANT_ID=<tenant-id> $0"
    exit 1
fi

# Validate TENANT_ID is in GUID format
if ! [[ "$TENANT_ID" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ ]]; then
    echo "Error: TENANT_ID must be a valid GUID"
    echo "Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    exit 1
fi
echo "Using TENANT_ID: $TENANT_ID"
# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python3 is not installed. Installing..."
    
    # Detect OS and install Python3
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y python3
        elif command -v yum &> /dev/null; then
            sudo yum install -y python3
        else
            echo "Unsupported package manager"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install python3
        else
            echo "Please install Homebrew first"
            exit 1
        fi
    else
        echo "Unsupported OS"
        exit 1
    fi
fi

# Set PAC file URL (change this to your actual URL)
PAC_URL="https://pac.azureidentity.us/$TENANT_ID"
PAC_FILE="proxy.pac"
PORT="${PORT:-8001}"

# Download PAC file
echo "Downloading PAC file from $PAC_URL..."
if command -v curl &> /dev/null; then
    curl -o "$PAC_FILE" "$PAC_URL"
elif command -v wget &> /dev/null; then
    wget -O "$PAC_FILE" "$PAC_URL"
else
    echo "Neither curl nor wget found. Please install one of them."
    exit 1
fi

# Check if download was successful
if [ ! -f "$PAC_FILE" ]; then
    echo "Failed to download PAC file"
    exit 1
fi

# Start HTTP server
echo "Starting HTTP server on port $PORT..."
python3 -m http.server $PORT