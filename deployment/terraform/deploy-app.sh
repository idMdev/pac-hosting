#!/bin/bash
set -e

# This script deploys the PAC hosting application to the VM
# It's executed by the Azure VM Extension after the VM is created

echo "Starting PAC hosting application deployment..."

# Set up the application directory
cd /opt/pac-hosting

# Create package.json
cat > /opt/pac-hosting/package.json << 'EOF'
{
  "name": "pac-hosting-server",
  "version": "1.0.0",
  "description": "A web server that hosts dynamically generated PAC files based on tenant ID path parameters",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "engines": {
    "node": ">=14.0.0"
  },
  "license": "MIT"
}
EOF

# Note: In a real deployment, you would:
# 1. Clone from git repository, or
# 2. Download a release package, or
# 3. Have the files pre-packaged in the VM image
# For this example, the files should be copied separately

# Install dependencies if package.json exists
if [ -f "package.json" ]; then
    npm install --production
fi

# Start the service
systemctl start pac-hosting

# Wait for service to start
sleep 5

# Check service status
if systemctl is-active --quiet pac-hosting; then
    echo "PAC hosting service started successfully!"
else
    echo "Warning: PAC hosting service may not have started correctly"
    systemctl status pac-hosting
fi

echo "Deployment script completed!"
