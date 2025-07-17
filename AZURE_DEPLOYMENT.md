# Azure Deployment Guide for PAC Hosting Server

This guide provides multiple options for deploying the PAC hosting server container to Azure.

## Prerequisites

1. **Azure CLI** installed and configured
   ```bash
   # Install Azure CLI (macOS)
   brew install azure-cli
   
   # Login to Azure
   az login
   ```

2. **Docker** installed (for building and pushing the image)

3. **Azure Container Registry (ACR)** or Docker Hub account

## Option 1: Azure Container Instances (ACI) - Simplest

### Step 1: Create Resource Group
```bash
# Set variables
RESOURCE_GROUP="pac-hosting-rg"
LOCATION="eastus"
ACR_NAME="pachostingacr$(date +%s)"  # Unique name
CONTAINER_NAME="pac-hosting-server"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION
```

### Step 2: Create Azure Container Registry
```bash
# Create ACR
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)
echo "ACR Login Server: $ACR_LOGIN_SERVER"

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value --output tsv)
```

### Step 3: Build and Push Docker Image
```bash
# Build the image
docker build -t $ACR_LOGIN_SERVER/$CONTAINER_NAME:latest .

# Login to ACR
az acr login --name $ACR_NAME

# Push the image
docker push $ACR_LOGIN_SERVER/$CONTAINER_NAME:latest
```

### Step 4: Deploy to Azure Container Instances
```bash
# Deploy container instance
az container create \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --image $ACR_LOGIN_SERVER/$CONTAINER_NAME:latest \
  --cpu 1 \
  --memory 1 \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label pac-hosting-$(date +%s) \
  --ports 3000 \
  --environment-variables NODE_ENV=production

# Get the FQDN
FQDN=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query ipAddress.fqdn --output tsv)
echo "Application URL: http://$FQDN:3000"
```

## Option 2: Azure Container Apps - Production Ready

### Step 1: Install Container Apps Extension
```bash
# Install the Container Apps extension
az extension add --name containerapp --upgrade
```

### Step 2: Create Container Apps Environment
```bash
# Create Container Apps environment
CONTAINERAPPS_ENVIRONMENT="pac-hosting-env"

az containerapp env create \
  --name $CONTAINERAPPS_ENVIRONMENT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
```

### Step 3: Deploy to Container Apps
```bash
# Deploy to Container Apps
az containerapp create \
  --name $CONTAINER_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINERAPPS_ENVIRONMENT \
  --image $ACR_LOGIN_SERVER/$CONTAINER_NAME:latest \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 3000 \
  --ingress external \
  --cpu 0.5 \
  --memory 1Gi \
  --min-replicas 1 \
  --max-replicas 3 \
  --env-vars NODE_ENV=production

# Get the application URL
APP_URL=$(az containerapp show --name $CONTAINER_NAME --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv)
echo "Application URL: https://$APP_URL"
```

## Option 3: Azure App Service (Docker Container)

### Step 1: Create App Service Plan
```bash
# Create App Service Plan
APP_SERVICE_PLAN="pac-hosting-plan"
WEB_APP_NAME="pac-hosting-app-$(date +%s)"

az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux
```

### Step 2: Create Web App
```bash
# Create Web App
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $WEB_APP_NAME \
  --deployment-container-image-name $ACR_LOGIN_SERVER/$CONTAINER_NAME:latest

# Configure container settings
az webapp config container set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $ACR_LOGIN_SERVER/$CONTAINER_NAME:latest \
  --docker-registry-server-url https://$ACR_LOGIN_SERVER \
  --docker-registry-server-user $ACR_USERNAME \
  --docker-registry-server-password $ACR_PASSWORD

# Set environment variables
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $WEB_APP_NAME \
  --settings NODE_ENV=production WEBSITES_PORT=3000

echo "Application URL: https://$WEB_APP_NAME.azurewebsites.net"
```

## Testing the Deployment

After deployment, test your application:

```bash
# Test health endpoint
curl "https://your-app-url/health"

# Test PAC endpoint
curl "https://your-app-url/12345678-1234-1234-1234-123456789012"

# Test with beta edge
curl "https://your-app-url/12345678-1234-1234-1234-123456789012?betaEdge=true"
```

## Security Considerations

### 1. Enable HTTPS (Container Apps automatically provides this)
### 2. Configure Custom Domain (Optional)
```bash
# For Container Apps
az containerapp hostname add \
  --name $CONTAINER_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname your-domain.com
```

### 3. Configure Authentication (Optional)
```bash
# Enable Azure AD authentication for App Service
az webapp auth update \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --enabled true \
  --action LoginWithAzureActiveDirectory
```

## Monitoring and Scaling

### Enable Application Insights
```bash
# Create Application Insights
APP_INSIGHTS_NAME="pac-hosting-insights"

az monitor app-insights component create \
  --app $APP_INSIGHTS_NAME \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app $APP_INSIGHTS_NAME \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey --output tsv)

# Set Application Insights key (for Container Apps)
az containerapp update \
  --name $CONTAINER_NAME \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY
```

## Cost Management

### Container Apps Pricing
- **Consumption**: Pay per vCPU and memory used
- **Dedicated**: Fixed monthly cost for reserved capacity

### Container Instances Pricing
- **Pay per second**: For CPU, memory, and duration

### App Service Pricing
- **Fixed monthly cost**: Based on App Service Plan tier

## Cleanup Resources

```bash
# Delete the entire resource group (removes all resources)
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

## Recommended Deployment Strategy

For **development/testing**: Use Azure Container Instances (Option 1)
For **production**: Use Azure Container Apps (Option 2)
For **existing App Service infrastructure**: Use App Service (Option 3)

## Next Steps

1. Set up CI/CD pipeline with GitHub Actions
2. Configure custom domain and SSL
3. Set up monitoring and alerting
4. Configure backup and disaster recovery
5. Implement rate limiting and authentication if needed
