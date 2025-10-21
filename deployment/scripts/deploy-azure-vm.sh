#!/bin/bash

# Azure PAC Hosting Server VM Deployment Script
# This script deploys the PAC hosting server to an Azure VM with managed identity

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Azure CLI is installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed. Please install it first:"
        echo "  brew install azure-cli"
        exit 1
    fi
    
    # Check if user is logged in to Azure
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    print_status "Prerequisites check passed!"
}

# Set default values
RESOURCE_GROUP="pac-hosting-vm-rg"
LOCATION="eastus"
VM_NAME="pac-hosting-vm"
VM_SIZE="Standard_B2s"
VM_IMAGE="Ubuntu2204"
NSG_NAME="pac-hosting-nsg"
VNET_NAME="pac-hosting-vnet"
SUBNET_NAME="pac-hosting-subnet"
PUBLIC_IP_NAME="pac-hosting-public-ip"
NIC_NAME="pac-hosting-nic"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --resource-group|-rg)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        --location|-l)
            LOCATION="$2"
            shift 2
            ;;
        --vm-name|-vm)
            VM_NAME="$2"
            shift 2
            ;;
        --vm-size|-size)
            VM_SIZE="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --resource-group, -rg    Resource group name (default: pac-hosting-vm-rg)"
            echo "  --location, -l           Azure location (default: eastus)"
            echo "  --vm-name, -vm           Virtual Machine name (default: pac-hosting-vm)"
            echo "  --vm-size, -size         VM size (default: Standard_B2s)"
            echo "  --help, -h               Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Main deployment function
deploy_to_azure_vm() {
    print_status "Starting deployment to Azure VM..."
    print_status "Resource Group: $RESOURCE_GROUP"
    print_status "Location: $LOCATION"
    print_status "VM Name: $VM_NAME"
    print_status "VM Size: $VM_SIZE"
    
    # Step 1: Create Resource Group
    print_status "Creating resource group..."
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output table
    
    # Step 2: Create Network Security Group with rules
    print_status "Creating Network Security Group..."
    az network nsg create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$NSG_NAME" \
        --location "$LOCATION" \
        --output table
    
    # Allow SSH
    print_status "Adding SSH rule to NSG..."
    az network nsg rule create \
        --resource-group "$RESOURCE_GROUP" \
        --nsg-name "$NSG_NAME" \
        --name "Allow-SSH" \
        --priority 100 \
        --source-address-prefixes "*" \
        --destination-port-ranges 22 \
        --access Allow \
        --protocol Tcp \
        --description "Allow SSH" \
        --output table
    
    # Allow HTTP
    print_status "Adding HTTP rule to NSG..."
    az network nsg rule create \
        --resource-group "$RESOURCE_GROUP" \
        --nsg-name "$NSG_NAME" \
        --name "Allow-HTTP" \
        --priority 200 \
        --source-address-prefixes "*" \
        --destination-port-ranges 80 \
        --access Allow \
        --protocol Tcp \
        --description "Allow HTTP" \
        --output table
    
    # Allow HTTPS
    print_status "Adding HTTPS rule to NSG..."
    az network nsg rule create \
        --resource-group "$RESOURCE_GROUP" \
        --nsg-name "$NSG_NAME" \
        --name "Allow-HTTPS" \
        --priority 300 \
        --source-address-prefixes "*" \
        --destination-port-ranges 443 \
        --access Allow \
        --protocol Tcp \
        --description "Allow HTTPS" \
        --output table
    
    # Allow Application Port (3000)
    print_status "Adding Application Port rule to NSG..."
    az network nsg rule create \
        --resource-group "$RESOURCE_GROUP" \
        --nsg-name "$NSG_NAME" \
        --name "Allow-App" \
        --priority 400 \
        --source-address-prefixes "*" \
        --destination-port-ranges 3000 \
        --access Allow \
        --protocol Tcp \
        --description "Allow Application Port" \
        --output table
    
    # Step 3: Create Virtual Network
    print_status "Creating Virtual Network..."
    az network vnet create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$VNET_NAME" \
        --address-prefix 10.0.0.0/16 \
        --subnet-name "$SUBNET_NAME" \
        --subnet-prefix 10.0.1.0/24 \
        --location "$LOCATION" \
        --output table
    
    # Associate NSG with subnet
    print_status "Associating NSG with subnet..."
    az network vnet subnet update \
        --resource-group "$RESOURCE_GROUP" \
        --vnet-name "$VNET_NAME" \
        --name "$SUBNET_NAME" \
        --network-security-group "$NSG_NAME" \
        --output table
    
    # Step 4: Create Public IP
    print_status "Creating Public IP..."
    az network public-ip create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$PUBLIC_IP_NAME" \
        --allocation-method Static \
        --sku Standard \
        --location "$LOCATION" \
        --output table
    
    # Step 5: Create Network Interface
    print_status "Creating Network Interface..."
    az network nic create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$NIC_NAME" \
        --vnet-name "$VNET_NAME" \
        --subnet "$SUBNET_NAME" \
        --public-ip-address "$PUBLIC_IP_NAME" \
        --network-security-group "$NSG_NAME" \
        --location "$LOCATION" \
        --output table
    
    # Step 6: Create VM with system-assigned managed identity
    print_status "Creating Virtual Machine with managed identity..."
    az vm create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$VM_NAME" \
        --location "$LOCATION" \
        --nics "$NIC_NAME" \
        --image "$VM_IMAGE" \
        --size "$VM_SIZE" \
        --admin-username azureuser \
        --generate-ssh-keys \
        --assign-identity \
        --output table
    
    print_status "VM created successfully with system-assigned managed identity!"
    
    # Get the managed identity principal ID
    IDENTITY_PRINCIPAL_ID=$(az vm identity show \
        --name "$VM_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query principalId \
        --output tsv)
    
    print_status "Managed Identity Principal ID: $IDENTITY_PRINCIPAL_ID"
    
    # Step 7: Get VM public IP
    VM_PUBLIC_IP=$(az network public-ip show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$PUBLIC_IP_NAME" \
        --query ipAddress \
        --output tsv)
    
    print_status "VM Public IP: $VM_PUBLIC_IP"
    
    # Step 8: Create cloud-init script for VM setup
    print_status "Preparing cloud-init configuration..."
    cat > /tmp/cloud-init-pac-hosting.txt << 'EOF'
#cloud-config
package_update: true
package_upgrade: true

packages:
  - nodejs
  - npm
  - nginx

write_files:
  - path: /etc/systemd/system/pac-hosting.service
    permissions: '0644'
    content: |
      [Unit]
      Description=PAC Hosting Server
      After=network.target

      [Service]
      Type=simple
      User=azureuser
      WorkingDirectory=/opt/pac-hosting
      ExecStart=/usr/bin/node /opt/pac-hosting/server.js
      Restart=on-failure
      RestartSec=10
      StandardOutput=syslog
      StandardError=syslog
      SyslogIdentifier=pac-hosting
      Environment=NODE_ENV=production
      Environment=PORT=3000

      [Install]
      WantedBy=multi-user.target

  - path: /etc/nginx/sites-available/pac-hosting
    permissions: '0644'
    content: |
      server {
          listen 80;
          server_name _;

          location / {
              proxy_pass http://localhost:3000;
              proxy_http_version 1.1;
              proxy_set_header Upgrade $http_upgrade;
              proxy_set_header Connection 'upgrade';
              proxy_set_header Host $host;
              proxy_cache_bypass $http_upgrade;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
              proxy_set_header X-Forwarded-Proto $scheme;
          }
      }

runcmd:
  - mkdir -p /opt/pac-hosting
  - chown azureuser:azureuser /opt/pac-hosting
  - systemctl daemon-reload
  - systemctl enable pac-hosting
  - ln -sf /etc/nginx/sites-available/pac-hosting /etc/nginx/sites-enabled/
  - rm -f /etc/nginx/sites-enabled/default
  - systemctl restart nginx
  - systemctl enable nginx
EOF
    
    # Step 9: Run custom script extension to deploy the application
    print_status "Installing application on VM..."
    
    # Create deployment script
    cat > /tmp/deploy-app.sh << 'EOF'
#!/bin/bash
set -e

# Clone or copy application code
cd /opt/pac-hosting

# For demo purposes, we'll create a minimal setup
# In production, you would clone from git or copy files
cat > /opt/pac-hosting/package.json << 'PACKAGE_EOF'
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
  }
}
PACKAGE_EOF

# Install dependencies
npm install --production

# Start the service
systemctl start pac-hosting

echo "Application deployed successfully!"
EOF
    
    print_status "Copying application files to VM..."
    
    # Wait for VM to be ready
    sleep 30
    
    # Copy the deployment script
    az vm run-command invoke \
        --resource-group "$RESOURCE_GROUP" \
        --name "$VM_NAME" \
        --command-id RunShellScript \
        --scripts @/tmp/deploy-app.sh \
        --output table
    
    # Step 10: Copy application files to VM
    print_status "Copying PAC hosting application files..."
    cd ../..
    
    # Create a tarball of the application
    tar -czf /tmp/pac-hosting-app.tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=deployment \
        --exclude=terraform \
        --exclude=.github \
        server.js package.json gsaEfp.pac EfpTestCN.crt azureidentity.us.crt
    
    # Copy tarball to VM
    scp -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa \
        /tmp/pac-hosting-app.tar.gz azureuser@$VM_PUBLIC_IP:/tmp/ || true
    
    # Extract and setup on VM
    az vm run-command invoke \
        --resource-group "$RESOURCE_GROUP" \
        --name "$VM_NAME" \
        --command-id RunShellScript \
        --scripts "
            cd /opt/pac-hosting && \
            sudo tar -xzf /tmp/pac-hosting-app.tar.gz && \
            sudo chown -R azureuser:azureuser /opt/pac-hosting && \
            npm install --production && \
            sudo systemctl restart pac-hosting && \
            sudo systemctl status pac-hosting
        " \
        --output table
    
    print_status "Deployment completed successfully!"
    print_status "VM Public IP: $VM_PUBLIC_IP"
    print_status "Managed Identity Principal ID: $IDENTITY_PRINCIPAL_ID"
    
    # Display usage examples
    echo ""
    echo "🎉 Deployment successful! Here are some usage examples:"
    echo ""
    echo "SSH to VM:"
    echo "  ssh azureuser@$VM_PUBLIC_IP"
    echo ""
    echo "Health check:"
    echo "  curl \"http://$VM_PUBLIC_IP/health\""
    echo ""
    echo "Get PAC file:"
    echo "  curl \"http://$VM_PUBLIC_IP/12345678-1234-1234-1234-123456789012\""
    echo ""
    echo "View service logs:"
    echo "  ssh azureuser@$VM_PUBLIC_IP \"sudo journalctl -u pac-hosting -f\""
    echo ""
    echo "Managed Identity:"
    echo "  The VM has a system-assigned managed identity with Principal ID: $IDENTITY_PRINCIPAL_ID"
    echo "  You can assign Azure roles to this identity for accessing Azure resources"
    echo ""
}

# Cleanup function
cleanup() {
    print_warning "To clean up resources, run:"
    echo "  az group delete --name $RESOURCE_GROUP --yes --no-wait"
    
    # Clean up temporary files
    rm -f /tmp/cloud-init-pac-hosting.txt
    rm -f /tmp/deploy-app.sh
    rm -f /tmp/pac-hosting-app.tar.gz
}

# Main execution
main() {
    echo "🚀 Azure VM PAC Hosting Server Deployment"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    
    # Ask for confirmation
    read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
    
    deploy_to_azure_vm
    
    # Set up cleanup trap
    trap cleanup EXIT
}

# Run main function
main "$@"
