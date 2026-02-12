# Azure Deployment Secrets Configuration

This document describes the GitHub secrets required for deploying to two Azure subscriptions simultaneously.

## Overview

The GitHub Actions workflow deploys the PAC hosting server to two Azure subscriptions in parallel:
- **Subscription 1**: Original subscription (existing configuration)
- **Subscription 2**: Additional subscription (new configuration)

## Required GitHub Secrets

### Subscription 1 (Existing)

These secrets are already configured and should remain unchanged:

- `PACHOSTINGSERVER_AZURE_CLIENT_ID` - Azure service principal client ID
- `PACHOSTINGSERVER_AZURE_TENANT_ID` - Azure tenant ID
- `PACHOSTINGSERVER_AZURE_SUBSCRIPTION_ID` - Azure subscription ID
- `PACHOSTINGSERVER_REGISTRY_USERNAME` - Container registry username
- `PACHOSTINGSERVER_REGISTRY_PASSWORD` - Container registry password

### Subscription 2 (New - Must Be Added)

Add the following secrets to your GitHub repository for the second subscription:

- `PACHOSTINGSERVER_AZURE_CLIENT_ID_SUB2` - Azure service principal client ID for subscription 2
- `PACHOSTINGSERVER_AZURE_TENANT_ID_SUB2` - Azure tenant ID for subscription 2
- `PACHOSTINGSERVER_AZURE_SUBSCRIPTION_ID_SUB2` - Azure subscription ID for subscription 2
- `PACHOSTINGSERVER_REGISTRY_URL_SUB2` - Container registry URL for subscription 2 (e.g., `yourregistry.azurecr.io`)
- `PACHOSTINGSERVER_REGISTRY_USERNAME_SUB2` - Container registry username for subscription 2
- `PACHOSTINGSERVER_REGISTRY_PASSWORD_SUB2` - Container registry password for subscription 2
- `PACHOSTINGSERVER_CONTAINER_APP_NAME_SUB2` - Container app name for subscription 2
- `PACHOSTINGSERVER_RESOURCE_GROUP_SUB2` - Resource group name for subscription 2

## How to Add GitHub Secrets

1. Navigate to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret from the "Subscription 2" list above with the appropriate values from your Azure subscription

## Azure Service Principal Setup

For subscription 2, you'll need to create a service principal with the necessary permissions:

```bash
# Login to Azure CLI
az login

# Set the subscription
az account set --subscription "<SUBSCRIPTION_ID_SUB2>"

# Create service principal
az ad sp create-for-rbac \
  --name "pac-hosting-server-sub2" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID_SUB2> \
  --sdk-auth

# The output will contain the client-id, tenant-id, and subscription-id
```

## Deployment Workflow

When code is pushed to the `main` branch:

1. **Test Job**: Runs tests to validate code
2. **Build and Deploy Subscription 1**: Deploys to first subscription (runs in parallel with subscription 2)
3. **Build and Deploy Subscription 2**: Deploys to second subscription (runs in parallel with subscription 1)

Both deployments run simultaneously after the tests pass, ensuring the code is deployed to both subscriptions at the same time.

## Verification

After setting up the secrets and pushing to main:

1. Go to **Actions** tab in your GitHub repository
2. Click on the latest workflow run
3. Verify both deployment jobs complete successfully
4. Check that both Azure subscriptions have the updated container image

## Troubleshooting

If a deployment fails:

1. Check the GitHub Actions logs for the specific job that failed
2. Verify all secrets are correctly configured
3. Ensure the Azure resources (resource groups, container registries, container apps) exist in the subscription
4. Verify the service principal has the necessary permissions
