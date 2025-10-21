# Quick Start: Deploy PAC Hosting Server to Azure

This guide provides the fastest way to deploy your PAC hosting server to Azure using the provided automation scripts.

## 🚀 Option 1: One-Click Deployment (Recommended)

### Prerequisites
```bash
# Install Azure CLI
brew install azure-cli

# Login to Azure
az login

# Verify Docker is installed
docker --version
```

### Deploy
```bash
# Make script executable and run
chmod +x deploy-azure.sh
./deploy-azure.sh
```

That's it! The script will:
- ✅ Create all Azure resources
- ✅ Build and push your Docker image
- ✅ Deploy to Azure Container Apps
- ✅ Test the deployment
- ✅ Provide you with the application URL

## 🏗️ Option 2: Infrastructure as Code (Terraform)

### Prerequisites
```bash
# Install Terraform
brew install terraform

# Install Azure CLI and login
brew install azure-cli
az login
```

### Deploy
```bash
# Navigate to terraform directory and deploy
cd terraform
chmod +x deploy-terraform.sh
./deploy-terraform.sh deploy
```

## 🔧 Option 3: Manual Step-by-Step

Follow the detailed instructions in [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md)

## 🧪 Testing Your Deployment

After deployment, you'll receive an application URL. Test it:

```bash
# Replace YOUR_APP_URL with your actual URL
APP_URL="https://your-app-url.com"

# Test health endpoint
curl "$APP_URL/health"

# Test PAC generation
curl "$APP_URL/12345678-1234-1234-1234-123456789012"

# Test with beta edge
curl "$APP_URL/12345678-1234-1234-1234-123456789012?betaEdge=true"
```

## 📊 Monitoring

Your deployment includes:
- **Application Insights** for monitoring
- **Log Analytics** for centralized logging
- **Health checks** for availability monitoring
- **Auto-scaling** based on demand

Access monitoring in the Azure Portal under your resource group.

## 🔄 CI/CD Pipeline

For automated deployments on code changes:

1. **Fork/Clone** this repository
2. **Set up GitHub secrets**:
   - `AZURE_CREDENTIALS`: Service principal credentials
3. **Push to main branch** triggers automatic deployment

See [.github/workflows/deploy-azure.yml](.github/workflows/deploy-azure.yml) for details.

## 🛡️ Security Features

✅ **HTTPS enabled** by default  
✅ **Non-root container** user  
✅ **Input validation** for tenant IDs  
✅ **Private container registry**  
✅ **Azure AD integration** ready  

## 💰 Cost Optimization

- **Container Apps**: Pay only for what you use
- **Auto-scaling**: Scales down to 1 instance when idle
- **Resource limits**: CPU and memory limits prevent overspend
- **Monitoring**: Built-in cost tracking in Azure Portal

## 🧹 Cleanup

To remove all resources:

```bash
# If you used the deployment script
az group delete --name pac-hosting-rg --yes --no-wait

# If you used Terraform
cd terraform
./deploy-terraform.sh destroy
```

## 📞 Support

- **Logs**: Check Azure Portal > Container Apps > Logs
- **Health**: Monitor at `https://your-app-url/health`
- **Scaling**: Configure in Azure Portal > Container Apps > Scale
- **Updates**: Push to GitHub or re-run deployment script

## 🎯 What's Deployed

| Component | Purpose | Location |
|-----------|---------|----------|
| **Resource Group** | Contains all resources | Azure Portal |
| **Container Registry** | Stores Docker images | `pachostingacr*.azurecr.io` |
| **Container App** | Runs your application | `https://*.azurecontainerapps.io` |
| **Log Analytics** | Centralized logging | Azure Portal |
| **Application Insights** | Performance monitoring | Azure Portal |

Your PAC hosting server is now production-ready! 🎉
