#!/bin/bash

# Azure PAC Hosting Server Deployment Script
# This script deploys the PAC hosting server to Azure Container Apps

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
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check if user is logged in to Azure
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    print_status "Prerequisites check passed!"
}

# Register required Azure resource providers
register_providers() {
    print_status "Checking and registering required Azure resource providers..."
    
    # List of required providers
    providers=(
        "Microsoft.ContainerRegistry"
        "Microsoft.App"
        "Microsoft.ContainerService"
        "Microsoft.OperationalInsights"
    )
    
    for provider in "${providers[@]}"; do
        print_status "Checking provider: $provider"
        status=$(az provider show --namespace "$provider" --query "registrationState" --output tsv 2>/dev/null || echo "NotRegistered")
        
        if [ "$status" != "Registered" ]; then
            print_status "Registering $provider..."
            az provider register --namespace "$provider" --wait
            print_status "$provider registered successfully!"
        else
            print_status "$provider is already registered."
        fi
    done
    
    print_status "All required resource providers are registered!"
}

# Set default values
RESOURCE_GROUP="pac-hosting-rg"
LOCATION="eastus"
ACR_NAME="pachostingacr$(date +%s)"
CONTAINER_NAME="pac-hosting-server"
CONTAINERAPPS_ENVIRONMENT="pac-hosting-env"

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
        --acr-name|-acr)
            ACR_NAME="$2"
            shift 2
            ;;
        --container-name|-cn)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --resource-group, -rg    Resource group name (default: pac-hosting-rg)"
            echo "  --location, -l           Azure location (default: eastus)"
            echo "  --acr-name, -acr         Azure Container Registry name (default: auto-generated)"
            echo "  --container-name, -cn    Container name (default: pac-hosting-server)"
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
deploy_to_azure() {
    print_status "Starting deployment to Azure..."
    print_status "Resource Group: $RESOURCE_GROUP"
    print_status "Location: $LOCATION"
    print_status "ACR Name: $ACR_NAME"
    print_status "Container Name: $CONTAINER_NAME"
    
    # Step 0: Register required providers
    register_providers
    
    # Step 1: Create Resource Group
    print_status "Creating resource group..."
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output table
    
    # Step 2: Create Azure Container Registry
    print_status "Creating Azure Container Registry..."
    az acr create --resource-group "$RESOURCE_GROUP" --name "$ACR_NAME" --sku Basic --admin-enabled true --output table
    
    # Get ACR details
    print_status "Getting ACR login details..."
    ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer --output tsv)
    ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query username --output tsv)
    ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query passwords[0].value --output tsv)
    
    print_status "ACR Login Server: $ACR_LOGIN_SERVER"
    
    # Step 3: Build and Push Docker Image
    print_status "Building Docker image..."
    docker build -t "$ACR_LOGIN_SERVER/$CONTAINER_NAME:latest" .
    
    print_status "Logging in to ACR..."
    az acr login --name "$ACR_NAME"
    
    print_status "Pushing image to ACR..."
    docker push "$ACR_LOGIN_SERVER/$CONTAINER_NAME:latest"
    
    # Step 4: Install Container Apps Extension
    print_status "Installing Container Apps extension..."
    az extension add --name containerapp --upgrade --yes
    
    # Step 5: Create Container Apps Environment
    print_status "Creating Container Apps environment..."
    az containerapp env create \
        --name "$CONTAINERAPPS_ENVIRONMENT" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --output table
    
    # Step 6: Deploy to Container Apps
    print_status "Deploying to Container Apps..."
    az containerapp create \
        --name "$CONTAINER_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --environment "$CONTAINERAPPS_ENVIRONMENT" \
        --image "$ACR_LOGIN_SERVER/$CONTAINER_NAME:latest" \
        --registry-server "$ACR_LOGIN_SERVER" \
        --registry-username "$ACR_USERNAME" \
        --registry-password "$ACR_PASSWORD" \
        --target-port 3000 \
        --ingress external \
        --cpu 0.5 \
        --memory 1Gi \
        --min-replicas 1 \
        --max-replicas 3 \
        --env-vars NODE_ENV=production \
        --output table
    
    # Get the application URL
    APP_URL=$(az containerapp show --name "$CONTAINER_NAME" --resource-group "$RESOURCE_GROUP" --query properties.configuration.ingress.fqdn --output tsv)
    
    print_status "Deployment completed successfully!"
    print_status "Application URL: https://$APP_URL"
    
    # Test the deployment
    print_status "Testing the deployment..."
    sleep 30  # Wait for the app to start
    
    if curl -s "https://$APP_URL/health" | grep -q "healthy"; then
        print_status "✅ Health check passed!"
    else
        print_warning "⚠️  Health check failed. The app might still be starting."
    fi
    
    # Display usage examples
    echo ""
    echo "🎉 Deployment successful! Here are some usage examples:"
    echo ""
    echo "Health check:"
    echo "  curl \"https://$APP_URL/health\""
    echo ""
    echo "Get PAC file:"
    echo "  curl \"https://$APP_URL/12345678-1234-1234-1234-123456789012\""
    echo ""
    echo "Get PAC file with beta edge:"
    echo "  curl \"https://$APP_URL/12345678-1234-1234-1234-123456789012?betaEdge=true\""
    echo ""
    echo "API documentation:"
    echo "  curl \"https://$APP_URL/\""
    echo ""
}

# Cleanup function
cleanup() {
    print_warning "To clean up resources, run:"
    echo "  az group delete --name $RESOURCE_GROUP --yes --no-wait"
}

# Main execution
main() {
    echo "🚀 Azure PAC Hosting Server Deployment"
    echo "======================================"
    echo ""
    
    check_prerequisites
    
    # Ask for confirmation
    read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
    
    deploy_to_azure
    
    # Set up cleanup trap
    trap cleanup EXIT
}

# Run main function
main "$@"
