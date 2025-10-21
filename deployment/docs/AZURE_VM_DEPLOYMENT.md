# Azure VM Deployment Guide with Managed Identity

This guide provides instructions for deploying the PAC hosting server to an Azure Virtual Machine with managed identity support. This deployment option is ideal for scenarios where you need more control over the infrastructure or want to integrate with existing VM-based deployments.

## Overview

This deployment creates:
- An Azure Virtual Machine running Ubuntu 22.04
- A system-assigned managed identity for the VM
- Network security group with appropriate rules
- Nginx reverse proxy for the Node.js application
- Systemd service for automatic application management

## Prerequisites

1. **Azure CLI** installed and configured
   ```bash
   # Install Azure CLI (macOS)
   brew install azure-cli
   
   # Install Azure CLI (Ubuntu/Debian)
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   
   # Login to Azure
   az login
   ```

2. **SSH Key Pair** for VM access
   ```bash
   # Generate SSH key if you don't have one
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
   ```

3. **Terraform** (optional, for Infrastructure as Code deployment)
   ```bash
   # Install Terraform (macOS)
   brew install terraform
   
   # Install Terraform (Ubuntu/Debian)
   wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
   echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
   sudo apt update && sudo apt install terraform
   ```

## Deployment Options

### Option 1: Quick Deployment with Bash Script

The bash script provides a simple, automated way to deploy the PAC hosting server to an Azure VM.

```bash
# Navigate to the deployment scripts directory
cd deployment/scripts

# Run the deployment script
./deploy-azure-vm.sh
```

#### Script Options

```bash
# Deploy with custom settings
./deploy-azure-vm.sh \
  --resource-group "my-pac-rg" \
  --location "westus2" \
  --vm-name "my-pac-vm" \
  --vm-size "Standard_B2s"

# View help
./deploy-azure-vm.sh --help
```

#### What the Script Does

1. Creates a resource group
2. Sets up networking (VNet, subnet, NSG, public IP)
3. Creates an Azure VM with Ubuntu 22.04
4. Enables system-assigned managed identity on the VM
5. Configures firewall rules for HTTP, HTTPS, and SSH
6. Installs Node.js, npm, and Nginx
7. Sets up systemd service for the application
8. Configures Nginx as a reverse proxy
9. Deploys and starts the PAC hosting application

### Option 2: Terraform Infrastructure as Code

Terraform provides a declarative way to manage your infrastructure with version control and state management.

#### Step 1: Navigate to Terraform Directory

```bash
cd deployment/terraform
```

#### Step 2: Initialize Terraform

```bash
terraform init
```

#### Step 3: Review the Plan

```bash
terraform plan -var-file="vm-variables.tfvars"
```

#### Step 4: Deploy

```bash
terraform apply -var-file="vm-variables.tfvars"
```

Or use the deployment wrapper script:

```bash
./deploy-terraform.sh deploy-vm
```

#### Step 5: Get Outputs

```bash
# View all outputs
terraform output

# Get specific output
terraform output vm_public_ip
terraform output vm_managed_identity_principal_id
```

#### Terraform Variables

Create a `vm-variables.tfvars` file to customize your deployment:

```hcl
location              = "East US"
environment           = "production"
vm_size              = "Standard_B2s"
admin_username       = "azureuser"
ssh_public_key_path  = "~/.ssh/id_rsa.pub"
```

## Managed Identity Configuration

The VM is created with a **system-assigned managed identity**. This identity can be used to authenticate to Azure services without storing credentials.

### Get Managed Identity Information

```bash
# Using Azure CLI
az vm identity show \
  --name pac-hosting-vm \
  --resource-group pac-hosting-vm-rg

# Get Principal ID
PRINCIPAL_ID=$(az vm identity show \
  --name pac-hosting-vm \
  --resource-group pac-hosting-vm-rg \
  --query principalId \
  --output tsv)

echo "Managed Identity Principal ID: $PRINCIPAL_ID"
```

### Assign Roles to Managed Identity

Grant the managed identity access to Azure resources:

```bash
# Example: Grant access to a Key Vault
az keyvault set-policy \
  --name my-keyvault \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list

# Example: Grant access to a Storage Account
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Storage Blob Data Reader" \
  --scope "/subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Storage/storageAccounts/{storage-account}"

# Example: Grant access to Azure Container Registry
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "AcrPull" \
  --scope "/subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.ContainerRegistry/registries/{acr-name}"
```

### Using Managed Identity in Application

To use the managed identity in your Node.js application, you can use the Azure SDK:

```javascript
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

// The DefaultAzureCredential will automatically use the VM's managed identity
const credential = new DefaultAzureCredential();

// Example: Access Key Vault
const keyVaultUrl = "https://my-keyvault.vault.azure.net";
const client = new SecretClient(keyVaultUrl, credential);
const secret = await client.getSecret("my-secret");
```

## Post-Deployment Configuration

### Access the VM

```bash
# SSH to the VM
ssh azureuser@<VM_PUBLIC_IP>

# View application logs
sudo journalctl -u pac-hosting -f

# Check service status
sudo systemctl status pac-hosting

# Restart the service
sudo systemctl restart pac-hosting
```

### Update Application Code

```bash
# SSH to the VM
ssh azureuser@<VM_PUBLIC_IP>

# Navigate to application directory
cd /opt/pac-hosting

# Update code (example: pull from git)
sudo -u azureuser git pull origin main

# Install dependencies
sudo -u azureuser npm install --production

# Restart service
sudo systemctl restart pac-hosting
```

### Configure Custom Domain

1. **Add DNS A Record** pointing to the VM's public IP

2. **Update Nginx Configuration** for the custom domain:

```bash
# SSH to the VM
ssh azureuser@<VM_PUBLIC_IP>

# Edit Nginx config
sudo nano /etc/nginx/sites-available/pac-hosting

# Update server_name directive
server_name your-domain.com www.your-domain.com;

# Restart Nginx
sudo systemctl restart nginx
```

3. **Optional: Set up SSL with Let's Encrypt**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot will automatically configure Nginx for HTTPS
```

## Testing the Deployment

```bash
# Get VM public IP
VM_IP=$(az network public-ip show \
  --resource-group pac-hosting-vm-rg \
  --name pac-hosting-public-ip \
  --query ipAddress \
  --output tsv)

# Test health endpoint
curl "http://$VM_IP/health"

# Test PAC endpoint
curl "http://$VM_IP/12345678-1234-1234-1234-123456789012"

# Test with beta edge
curl "http://$VM_IP/12345678-1234-1234-1234-123456789012?betaEdge=true"
```

## Monitoring and Logging

### View Application Logs

```bash
# View real-time logs
sudo journalctl -u pac-hosting -f

# View recent logs
sudo journalctl -u pac-hosting -n 100

# View logs from specific time
sudo journalctl -u pac-hosting --since "1 hour ago"
```

### View Nginx Access Logs

```bash
# Real-time access logs
sudo tail -f /var/log/nginx/access.log

# Real-time error logs
sudo tail -f /var/log/nginx/error.log
```

### Azure Monitor Integration

The deployment includes Azure Log Analytics and Application Insights resources that can be configured to collect metrics and logs from the VM.

```bash
# Install Azure Monitor agent (optional)
# This can be done through the Azure Portal or CLI
az vm extension set \
  --resource-group pac-hosting-vm-rg \
  --vm-name pac-hosting-vm \
  --name AzureMonitorLinuxAgent \
  --publisher Microsoft.Azure.Monitor \
  --enable-auto-upgrade true
```

## Security Best Practices

1. **Keep the VM Updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Configure Firewall Rules**
   - Only allow necessary ports (80, 443, 22)
   - Restrict SSH access to known IP addresses

3. **Use Managed Identity** instead of storing credentials
   - No need to manage passwords or keys for Azure service access

4. **Enable Azure Security Center** recommendations

5. **Regular Backups**
   ```bash
   # Create a backup/snapshot of the VM disk
   az snapshot create \
     --resource-group pac-hosting-vm-rg \
     --name pac-hosting-vm-snapshot \
     --source "/subscriptions/{subscription-id}/resourceGroups/pac-hosting-vm-rg/providers/Microsoft.Compute/disks/pac-hosting-vm-osdisk"
   ```

## Scaling Considerations

### Vertical Scaling (Resize VM)

```bash
# Deallocate VM
az vm deallocate \
  --resource-group pac-hosting-vm-rg \
  --name pac-hosting-vm

# Resize VM
az vm resize \
  --resource-group pac-hosting-vm-rg \
  --name pac-hosting-vm \
  --size Standard_B4ms

# Start VM
az vm start \
  --resource-group pac-hosting-vm-rg \
  --name pac-hosting-vm
```

### Horizontal Scaling (Load Balancer)

For high availability, consider:
1. Creating multiple VMs behind an Azure Load Balancer
2. Using Azure Application Gateway with multiple backend VMs
3. Implementing Azure VM Scale Sets

## Cleanup Resources

### Using Azure CLI

```bash
# Delete the entire resource group (removes all resources)
az group delete --name pac-hosting-vm-rg --yes --no-wait
```

### Using Terraform

```bash
# Destroy all resources
terraform destroy -var-file="vm-variables.tfvars"

# Or using the wrapper script
./deploy-terraform.sh destroy-vm
```

## Troubleshooting

### Service Not Starting

```bash
# Check service status
sudo systemctl status pac-hosting

# View detailed logs
sudo journalctl -u pac-hosting -n 100 --no-pager

# Check if port 3000 is listening
sudo netstat -tlnp | grep 3000
```

### Nginx Issues

```bash
# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx
```

### Cannot Access Application

1. Check Network Security Group rules
2. Verify VM is running: `az vm get-instance-view --name pac-hosting-vm --resource-group pac-hosting-vm-rg`
3. Check firewall settings on the VM
4. Verify DNS resolution (if using custom domain)

## Cost Optimization

- **Use B-series VMs** for cost-effective burstable performance
- **Stop/Deallocate VMs** when not in use to save costs
- **Use Azure Reservations** for long-term deployments (1-3 year commitments)
- **Monitor usage** with Azure Cost Management

### Example: Stop VM During Non-Business Hours

```bash
# Stop VM
az vm deallocate \
  --resource-group pac-hosting-vm-rg \
  --name pac-hosting-vm

# Start VM
az vm start \
  --resource-group pac-hosting-vm-rg \
  --name pac-hosting-vm
```

## Comparison: VM vs Container Apps

| Feature | Azure VM | Azure Container Apps |
|---------|----------|---------------------|
| Control | Full control over OS | Managed platform |
| Scaling | Manual or VMSS | Automatic |
| Pricing | Fixed (per hour) | Consumption-based |
| Managed Identity | ✅ Supported | ✅ Supported |
| Maintenance | You manage updates | Platform managed |
| Complexity | Higher | Lower |
| Use Case | Need OS-level access, custom configurations | Simpler deployments, auto-scaling |

## Next Steps

1. Set up automated deployments with CI/CD (GitHub Actions, Azure DevOps)
2. Implement monitoring and alerting
3. Configure backup and disaster recovery
4. Set up SSL/TLS with custom domain
5. Implement rate limiting and additional security measures
6. Configure auto-scaling with VM Scale Sets (for production)

## Support and Documentation

- [Azure Virtual Machines Documentation](https://docs.microsoft.com/azure/virtual-machines/)
- [Managed Identities for Azure Resources](https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/)
- [Azure CLI Reference](https://docs.microsoft.com/cli/azure/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
