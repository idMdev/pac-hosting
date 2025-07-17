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
    cd terraform
    terraform init
    cd ..
}

# Plan Terraform deployment
plan_terraform() {
    print_status "Planning Terraform deployment..."
    cd terraform
    terraform plan -out=tfplan
    cd ..
}

# Apply Terraform deployment
apply_terraform() {
    print_status "Applying Terraform deployment..."
    cd terraform
    terraform apply tfplan
    cd ..
}

# Get outputs
get_outputs() {
    print_status "Getting deployment outputs..."
    cd terraform
    
    RESOURCE_GROUP=$(terraform output -raw resource_group_name)
    ACR_NAME=$(terraform output -raw container_registry_name)
    ACR_LOGIN_SERVER=$(terraform output -raw container_registry_login_server)
    APP_URL=$(terraform output -raw application_url)
    
    echo "Resource Group: $RESOURCE_GROUP"
    echo "Container Registry: $ACR_NAME"
    echo "ACR Login Server: $ACR_LOGIN_SERVER"
    echo "Application URL: $APP_URL"
    
    cd ..
    
    # Export for use in other scripts
    export RESOURCE_GROUP
    export ACR_NAME
    export ACR_LOGIN_SERVER
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
    
    case $COMMAND in
        "deploy")
            print_status "Starting deployment..."
            init_terraform
            plan_terraform
            
            read -p "Do you want to apply the Terraform plan? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_status "Deployment cancelled."
                exit 0
            fi
            
            apply_terraform
            get_outputs
            build_and_push
            update_container_app
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
        "destroy")
            print_warning "This will destroy all infrastructure!"
            read -p "Are you sure you want to destroy everything? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cd terraform
                terraform destroy
                cd ..
                print_status "Infrastructure destroyed."
            else
                print_status "Destroy cancelled."
            fi
            ;;
        "plan")
            init_terraform
            plan_terraform
            ;;
        "output")
            get_outputs
            ;;
        *)
            echo "Usage: $0 [deploy|destroy|plan|output]"
            echo "  deploy  - Initialize, plan, and apply infrastructure"
            echo "  destroy - Destroy all infrastructure"
            echo "  plan    - Show what changes will be made"
            echo "  output  - Show deployment outputs"
            exit 1
            ;;
    esac
    
    # Set up cleanup trap
    trap cleanup EXIT
}

# Run main function
main "$@"
