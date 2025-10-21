# Azure VM Deployment Quick Start

This guide provides a quick reference for deploying the PAC hosting server to an Azure VM with managed identity.

## Prerequisites

1. Azure CLI installed and logged in
   ```bash
   az login
   ```

2. SSH key pair (will be auto-generated if not present)
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
   ```

## Quick Deployment

### Option 1: Bash Script (Fastest)

```bash
# Navigate to the scripts directory
cd deployment/scripts

# Run the deployment script
./deploy-azure-vm.sh
```

The script will:
- Create an Azure VM with Ubuntu 22.04
- Enable system-assigned managed identity
- Install Node.js and Nginx
- Set up the PAC hosting application as a systemd service
- Configure Nginx as a reverse proxy

### Option 2: Terraform (Recommended for Production)

```bash
# Navigate to the terraform directory
cd deployment/terraform

# Deploy with VM configuration
./deploy-terraform.sh deploy-vm
```

## Post-Deployment

### Access Your Application

```bash
# Get the VM's public IP
VM_IP=$(az network public-ip show \
  --resource-group pac-hosting-vm-rg \
  --name pac-hosting-public-ip \
  --query ipAddress \
  --output tsv)

# Test the health endpoint
curl "http://$VM_IP/health"

# Test PAC file endpoint
curl "http://$VM_IP/12345678-1234-1234-1234-123456789012"
```

### SSH to Your VM

```bash
ssh azureuser@$VM_IP
```

### View Application Logs

```bash
ssh azureuser@$VM_IP "sudo journalctl -u pac-hosting -f"
```

### Copy Application Files to VM

After deployment, you need to copy your application files:

```bash
# Create a tarball of the application
tar -czf pac-hosting-app.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=deployment \
  server.js package.json gsaEfp.pac *.crt

# Copy to VM
scp pac-hosting-app.tar.gz azureuser@$VM_IP:/tmp/

# SSH to VM and extract
ssh azureuser@$VM_IP << 'EOF'
  cd /opt/pac-hosting
  sudo tar -xzf /tmp/pac-hosting-app.tar.gz
  sudo chown -R azureuser:azureuser /opt/pac-hosting
  npm install --production
  sudo systemctl restart pac-hosting
EOF
```

## Managed Identity Configuration

### Get Managed Identity Principal ID

```bash
PRINCIPAL_ID=$(az vm identity show \
  --name pac-hosting-vm \
  --resource-group pac-hosting-vm-rg \
  --query principalId \
  --output tsv)

echo "Principal ID: $PRINCIPAL_ID"
```

### Grant Access to Azure Resources

#### Key Vault Access
```bash
az keyvault set-policy \
  --name my-keyvault \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

#### Storage Account Access
```bash
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Storage Blob Data Reader" \
  --scope "/subscriptions/{subscription-id}/resourceGroups/{rg}/providers/Microsoft.Storage/storageAccounts/{storage}"
```

#### Container Registry Access
```bash
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "AcrPull" \
  --scope "/subscriptions/{subscription-id}/resourceGroups/{rg}/providers/Microsoft.ContainerRegistry/registries/{acr}"
```

## Using Managed Identity in Your Application

Install Azure Identity SDK:

```bash
npm install @azure/identity @azure/keyvault-secrets
```

Example code:

```javascript
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

// DefaultAzureCredential automatically uses the VM's managed identity
const credential = new DefaultAzureCredential();

// Access Key Vault
const keyVaultUrl = "https://my-keyvault.vault.azure.net";
const client = new SecretClient(keyVaultUrl, credential);
const secret = await client.getSecret("my-secret");
console.log("Secret value:", secret.value);
```

## Common Commands

### Service Management
```bash
# Check service status
ssh azureuser@$VM_IP "sudo systemctl status pac-hosting"

# Restart service
ssh azureuser@$VM_IP "sudo systemctl restart pac-hosting"

# View logs
ssh azureuser@$VM_IP "sudo journalctl -u pac-hosting -n 100"
```

### Nginx Management
```bash
# Check nginx status
ssh azureuser@$VM_IP "sudo systemctl status nginx"

# Test nginx config
ssh azureuser@$VM_IP "sudo nginx -t"

# Reload nginx
ssh azureuser@$VM_IP "sudo systemctl reload nginx"
```

### Update Application
```bash
# SSH and update code
ssh azureuser@$VM_IP << 'EOF'
  cd /opt/pac-hosting
  # Your update commands here (e.g., git pull)
  npm install --production
  sudo systemctl restart pac-hosting
EOF
```

## Troubleshooting

### Service Not Running
```bash
ssh azureuser@$VM_IP "sudo systemctl status pac-hosting"
ssh azureuser@$VM_IP "sudo journalctl -u pac-hosting -n 50"
```

### Check Port Listening
```bash
ssh azureuser@$VM_IP "sudo netstat -tlnp | grep 3000"
```

### Nginx Issues
```bash
ssh azureuser@$VM_IP "sudo nginx -t"
ssh azureuser@$VM_IP "sudo tail -f /var/log/nginx/error.log"
```

## Cleanup

```bash
# Delete all resources
az group delete --name pac-hosting-vm-rg --yes --no-wait

# Or with Terraform
cd deployment/terraform && ./deploy-terraform.sh destroy-vm
```

## More Information

For detailed documentation, see:
- [Full VM Deployment Guide](AZURE_VM_DEPLOYMENT.md)
- [Container Deployment Guide](AZURE_DEPLOYMENT.md)
- [Main README](../../README.md)

## Architecture

```
Internet
   ↓
Azure Load Balancer / Public IP (80, 443)
   ↓
Nginx Reverse Proxy (Port 80)
   ↓
Node.js Application (Port 3000)
   ↓
Azure Services (via Managed Identity)
```

## Security Features

- System-assigned managed identity (no credentials to manage)
- Network Security Group with restrictive rules
- Nginx reverse proxy with security headers
- Non-root user for application service
- Regular security updates via `apt`

## Cost Estimation

- **Standard_B2s VM**: ~$30-40/month (2 vCPU, 4 GB RAM)
- **Public IP**: ~$3/month
- **Disk Storage**: ~$5/month (30 GB)
- **Total**: ~$38-48/month

Use `az vm deallocate` when not in use to save compute costs.
