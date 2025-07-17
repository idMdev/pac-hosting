terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
  required_version = ">= 1.0"
}

provider "azurerm" {
  features {}
}

# Random suffix for unique naming
resource "random_integer" "suffix" {
  min = 10000
  max = 99999
}

# Variables
variable "location" {
  description = "Azure location"
  type        = string
  default     = "East US"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "container_image" {
  description = "Container image"
  type        = string
  default     = "pac-hosting-server:latest"
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "pac-hosting-rg"
  location = var.location
  
  tags = {
    Environment = var.environment
    Project     = "PAC Hosting Server"
  }
}

# Container Registry
resource "azurerm_container_registry" "main" {
  name                = "pachostingacr${random_integer.suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true

  tags = {
    Environment = var.environment
    Project     = "PAC Hosting Server"
  }
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "pac-hosting-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = {
    Environment = var.environment
    Project     = "PAC Hosting Server"
  }
}

# Container Apps Environment
resource "azurerm_container_app_environment" "main" {
  name                       = "pac-hosting-env"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  tags = {
    Environment = var.environment
    Project     = "PAC Hosting Server"
  }
}

# Container App
resource "azurerm_container_app" "main" {
  name                         = "pac-hosting-server"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  template {
    container {
      name   = "pac-hosting-server"
      image  = "${azurerm_container_registry.main.login_server}/${var.container_image}"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }

    min_replicas = 1
    max_replicas = 3
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    username = azurerm_container_registry.main.admin_username
    password = azurerm_container_registry.main.admin_password
  }

  tags = {
    Environment = var.environment
    Project     = "PAC Hosting Server"
  }
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "pac-hosting-insights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "Node.JS"

  tags = {
    Environment = var.environment
    Project     = "PAC Hosting Server"
  }
}

# Outputs
output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "container_registry_name" {
  value = azurerm_container_registry.main.name
}

output "container_registry_login_server" {
  value = azurerm_container_registry.main.login_server
}

output "container_registry_admin_username" {
  value = azurerm_container_registry.main.admin_username
}

output "container_registry_admin_password" {
  value     = azurerm_container_registry.main.admin_password
  sensitive = true
}

output "application_url" {
  value = "https://${azurerm_container_app.main.latest_revision_fqdn}"
}

output "application_insights_instrumentation_key" {
  value     = azurerm_application_insights.main.instrumentation_key
  sensitive = true
}

output "application_insights_connection_string" {
  value     = azurerm_application_insights.main.connection_string
  sensitive = true
}
