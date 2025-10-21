#!/bin/bash

# Terraform deployment script for PAC Hosting Server
# This script initializes and applies the Terraform configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install it first:"
        echo "  brew install terraform"
        exit 1
    fi
    
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed. Please install it first:"
        echo "  brew install azure-cli"
        exit 1
    fi
    
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    print_status "Prerequisites check passed!"
}

# Initialize Terraform
init_terraform() {
    print_status "Initializing Terraform..."
    local config_file=${1:-"main.tf"}
    terraform init
}

# Plan Terraform deployment
plan_terraform() {
    print_status "Planning Terraform deployment..."
    local config_file=${1:-"main.tf"}
    terraform plan -out=tfplan
}

# Apply Terraform deployment
apply_terraform() {
    print_status "Applying Terraform deployment..."
    terraform apply tfplan
}

# Get outputs
get_outputs() {
    print_status "Getting deployment outputs..."
    
    # Check which deployment type based on outputs available
    if terraform output resource_group_name &>/dev/null; then
        RESOURCE_GROUP=$(terraform output -raw resource_group_name 2>/dev/null || echo "")
    fi
    
    # Container Apps outputs
    if terraform output container_registry_name &>/dev/null; then
        ACR_NAME=$(terraform output -raw container_registry_name 2>/dev/null || echo "")
        ACR_LOGIN_SERVER=$(terraform output -raw container_registry_login_server 2>/dev/null || echo "")
        APP_URL=$(terraform output -raw application_url 2>/dev/null || echo "")
        
        echo "Deployment Type: Container Apps"
        echo "Resource Group: $RESOURCE_GROUP"
        echo "Container Registry: $ACR_NAME"
        echo "ACR Login Server: $ACR_LOGIN_SERVER"
        echo "Application URL: $APP_URL"
    fi
    
    # VM outputs
    if terraform output vm_name &>/dev/null; then
        VM_NAME=$(terraform output -raw vm_name 2>/dev/null || echo "")
        VM_PUBLIC_IP=$(terraform output -raw vm_public_ip 2>/dev/null || echo "")
        VM_IDENTITY=$(terraform output -raw vm_managed_identity_principal_id 2>/dev/null || echo "")
        APP_URL=$(terraform output -raw application_url 2>/dev/null || echo "")
        
        echo "Deployment Type: Virtual Machine"
        echo "Resource Group: $RESOURCE_GROUP"
        echo "VM Name: $VM_NAME"
        echo "VM Public IP: $VM_PUBLIC_IP"
        echo "Managed Identity Principal ID: $VM_IDENTITY"
        echo "Application URL: $APP_URL"
    fi
    
    # Export for use in other scripts
    export RESOURCE_GROUP
    export APP_URL
}

# Build and push Docker image
build_and_push() {
    print_status "Building and pushing Docker image..."
    
    # Login to ACR
    az acr login --name "$ACR_NAME"
    
    # Build and push
    docker build -t "$ACR_LOGIN_SERVER/pac-hosting-server:latest" .
    docker push "$ACR_LOGIN_SERVER/pac-hosting-server:latest"
}

# Update container app
update_container_app() {
    print_status "Updating container app..."
    
    az containerapp update \
        --name pac-hosting-server \
        --resource-group "$RESOURCE_GROUP" \
        --image "$ACR_LOGIN_SERVER/pac-hosting-server:latest"
}

# Test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Wait for deployment
    sleep 30
    
    # Test health endpoint
    if curl -s "$APP_URL/health" | grep -q "healthy"; then
        print_status "✅ Health check passed!"
    else
        print_warning "⚠️  Health check failed. The app might still be starting."
    fi
    
    # Test PAC endpoint
    if curl -s "$APP_URL/12345678-1234-1234-1234-123456789012" | grep -q "FindProxyForURL"; then
        print_status "✅ PAC endpoint test passed!"
    else
        print_warning "⚠️  PAC endpoint test failed."
    fi
}

# Cleanup function
cleanup() {
    print_warning "To destroy the infrastructure, run:"
    echo "  cd terraform && terraform destroy"
}

# Main execution
main() {
    echo "🚀 Terraform Azure PAC Hosting Server Deployment"
    echo "==============================================="
    echo ""
    
    check_prerequisites
    
    # Parse arguments
    COMMAND=${1:-"deploy"}
    DEPLOYMENT_TYPE=${2:-"container"}  # container or vm
    
    case $COMMAND in
        "deploy"|"deploy-container")
            print_status "Starting Container Apps deployment..."
            init_terraform "main.tf"
            plan_terraform "main.tf"
            
            read -p "Do you want to apply the Terraform plan? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_status "Deployment cancelled."
                exit 0
            fi
            
            apply_terraform
            get_outputs
            
            if [ -n "$ACR_NAME" ]; then
                build_and_push
                update_container_app
            fi
            
            test_deployment
            
            print_status "🎉 Deployment completed successfully!"
            echo ""
            echo "Application URL: $APP_URL"
            echo ""
            echo "Usage examples:"
            echo "  curl \"$APP_URL/health\""
            echo "  curl \"$APP_URL/12345678-1234-1234-1234-123456789012\""
            echo "  curl \"$APP_URL/12345678-1234-1234-1234-123456789012?betaEdge=true\""
            ;;
        "deploy-vm")
            print_status "Starting VM deployment..."
            init_terraform "vm-main.tf"
            
            # Check for SSH key
            if [ ! -f ~/.ssh/id_rsa.pub ]; then
                print_error "SSH public key not found at ~/.ssh/id_rsa.pub"
                print_status "Generate one with: ssh-keygen -t rsa -b 4096"
                exit 1
            fi
            
            # Create tfvars file if it doesn't exist
            if [ ! -f vm-variables.tfvars ]; then
                print_status "Creating vm-variables.tfvars with default values..."
                cat > vm-variables.tfvars << EOF
location              = "East US"
environment           = "production"
vm_size              = "Standard_B2s"
admin_username       = "azureuser"
ssh_public_key_path  = "~/.ssh/id_rsa.pub"
EOF
            fi
            
            terraform plan -var-file="vm-variables.tfvars" -out=tfplan
            
            read -p "Do you want to apply the Terraform plan? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_status "Deployment cancelled."
                exit 0
            fi
            
            apply_terraform
            get_outputs
            
            print_status "🎉 VM Deployment completed successfully!"
            echo ""
            echo "Application URL: $APP_URL"
            echo "SSH Command: ssh azureuser@$VM_PUBLIC_IP"
            echo ""
            echo "Next steps:"
            echo "1. Copy application files to the VM"
            echo "2. SSH to the VM and verify the service is running"
            echo "3. Check logs: ssh azureuser@$VM_PUBLIC_IP 'sudo journalctl -u pac-hosting -f'"
            ;;
        "destroy"|"destroy-container")
            print_warning "This will destroy all Container Apps infrastructure!"
            read -p "Are you sure you want to destroy everything? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                terraform destroy
                print_status "Infrastructure destroyed."
            else
                print_status "Destroy cancelled."
            fi
            ;;
        "destroy-vm")
            print_warning "This will destroy all VM infrastructure!"
            read -p "Are you sure you want to destroy everything? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                terraform destroy -var-file="vm-variables.tfvars"
                print_status "Infrastructure destroyed."
            else
                print_status "Destroy cancelled."
            fi
            ;;
        "plan")
            init_terraform "main.tf"
            plan_terraform "main.tf"
            ;;
        "plan-vm")
            init_terraform "vm-main.tf"
            if [ ! -f vm-variables.tfvars ]; then
                print_error "vm-variables.tfvars not found. Please create it first."
                exit 1
            fi
            terraform plan -var-file="vm-variables.tfvars"
            ;;
        "output")
            get_outputs
            ;;
        *)
            echo "Usage: $0 [COMMAND]"
            echo ""
            echo "Commands:"
            echo "  deploy, deploy-container - Deploy to Azure Container Apps (default)"
            echo "  deploy-vm                - Deploy to Azure Virtual Machine with managed identity"
            echo "  destroy, destroy-container - Destroy Container Apps infrastructure"
            echo "  destroy-vm               - Destroy VM infrastructure"
            echo "  plan                     - Show Container Apps changes"
            echo "  plan-vm                  - Show VM changes"
            echo "  output                   - Show deployment outputs"
            echo ""
            echo "Examples:"
            echo "  $0 deploy-vm             # Deploy to VM"
            echo "  $0 deploy                # Deploy to Container Apps"
            echo "  $0 destroy-vm            # Destroy VM deployment"
            exit 1
            ;;
    esac
    
    # Set up cleanup trap
    trap cleanup EXIT
}

# Run main function
main "$@"
