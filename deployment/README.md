# Deployment

This directory contains all deployment configurations and scripts for the PAC Hosting Server.

## 📁 Directory Structure

```
deployment/
├── README.md                   # This file
├── docker-compose.yml          # Docker Compose configuration
├── scripts/                    # Deployment scripts
│   ├── deploy-azure.sh         # One-click Azure deployment
│   └── setup.sh                # Local setup script
├── terraform/                  # Infrastructure as Code
│   ├── main.tf                 # Terraform configuration
│   └── deploy-terraform.sh     # Terraform deployment script
├── azure/                      # Azure-specific configurations
└── docs/                       # Deployment documentation
    ├── AZURE_DEPLOYMENT.md     # Complete Azure deployment guide
    └── QUICKSTART.md            # Quick start guide
```

## 🚀 Quick Deployment Options

### 1. One-Click Azure Deployment (Recommended)
```bash
./scripts/deploy-azure.sh
```

### 2. Infrastructure as Code (Terraform)
```bash
cd terraform
./deploy-terraform.sh deploy
```

### 3. Local Development with Docker Compose
```bash
docker-compose up --build
```

### 4. Local Setup
```bash
./scripts/setup.sh
```

## 📚 Documentation

- **[QUICKSTART.md](docs/QUICKSTART.md)** - Get started in minutes
- **[AZURE_DEPLOYMENT.md](docs/AZURE_DEPLOYMENT.md)** - Complete Azure deployment guide

## 🔧 CI/CD Pipeline

The GitHub Actions workflow is located at:
```
.github/workflows/deploy-azure.yml
```

## 🛠️ Customization

### Environment Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 80)

### Azure Configuration
- Resource Group: `pac-hosting-rg`
- Location: `eastus` (configurable)
- Container Registry: Auto-generated unique name
- Container App: `pac-hosting-server`

### Terraform Variables
Customize deployment by editing `terraform/main.tf`:
- `location` - Azure region
- `environment` - Environment tag
- `container_image` - Container image name

## 🔒 Security

All deployment methods include:
- HTTPS enforcement
- Non-root container execution
- Private container registry
- Azure AD integration ready
- Network isolation options

## 💰 Cost Optimization

The deployment is configured for cost efficiency:
- Auto-scaling (1-3 instances)
- Pay-per-use pricing model
- Automatic scale-to-zero when idle
- Resource limits to prevent overspend

## 🧪 Testing

After deployment, test your endpoints:
```bash
# Health check
curl "https://your-app-url/health"

# PAC file generation
curl "https://your-app-url/12345678-1234-1234-1234-123456789012"

# Beta edge endpoint
curl "https://your-app-url/12345678-1234-1234-1234-123456789012?betaEdge=true"
```

## 🧹 Cleanup

To remove all resources:
```bash
# If using Azure CLI deployment
az group delete --name pac-hosting-rg --yes --no-wait

# If using Terraform
cd terraform
./deploy-terraform.sh destroy
```

## 📞 Support

For deployment issues:
1. Check the logs in Azure Portal
2. Verify prerequisites are met
3. Ensure you're logged into Azure CLI
4. Check the GitHub Actions logs for CI/CD issues
