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

variable "vm_size" {
  description = "Azure VM size"
  type        = string
  default     = "Standard_B2s"
}

variable "admin_username" {
  description = "Admin username for the VM"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key file"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "pac-hosting-vm-rg"
  location = var.location
  
  tags = {
    Environment = var.environment
    Project     = "PAC Hosting Server"
    DeploymentType = "VM"
  }
}

# Network Security Group
resource "azurerm_network_security_group" "main" {
  name                = "pac-hosting-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "Allow-SSH"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Allow-HTTP"
    priority                   = 200
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Allow-HTTPS"
    priority                   = 300
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Allow-App"
    priority                   = 400
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3000"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = {
    Environment = var.environment
    Project     = "PAC Hosting Server"
  }
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "pac-hosting-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  tags = {
    Environment = var.environment
    Project     = "PAC Hosting Server"
  }
}

# Subnet
resource "azurerm_subnet" "main" {
  name                 = "pac-hosting-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
}

# Associate NSG with Subnet
resource "azurerm_subnet_network_security_group_association" "main" {
  subnet_id                 = azurerm_subnet.main.id
  network_security_group_id = azurerm_network_security_group.main.id
}

# Public IP
resource "azurerm_public_ip" "main" {
  name                = "pac-hosting-public-ip"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"

  tags = {
    Environment = var.environment
    Project     = "PAC Hosting Server"
  }
}

# Network Interface
resource "azurerm_network_interface" "main" {
  name                = "pac-hosting-nic"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.main.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.main.id
  }

  tags = {
    Environment = var.environment
    Project     = "PAC Hosting Server"
  }
}

# Associate NSG with Network Interface
resource "azurerm_network_interface_security_group_association" "main" {
  network_interface_id      = azurerm_network_interface.main.id
  network_security_group_id = azurerm_network_security_group.main.id
}

# Linux Virtual Machine with Managed Identity
resource "azurerm_linux_virtual_machine" "main" {
  name                = "pac-hosting-vm"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  size                = var.vm_size
  admin_username      = var.admin_username

  network_interface_ids = [
    azurerm_network_interface.main.id,
  ]

  admin_ssh_key {
    username   = var.admin_username
    public_key = file(var.ssh_public_key_path)
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  # Enable system-assigned managed identity
  identity {
    type = "SystemAssigned"
  }

  custom_data = base64encode(templatefile("${path.module}/cloud-init.yaml", {}))

  tags = {
    Environment = var.environment
    Project     = "PAC Hosting Server"
  }
}

# VM Extension to deploy the application
resource "azurerm_virtual_machine_extension" "deploy_app" {
  name                 = "deploy-pac-hosting"
  virtual_machine_id   = azurerm_linux_virtual_machine.main.id
  publisher            = "Microsoft.Azure.Extensions"
  type                 = "CustomScript"
  type_handler_version = "2.1"

  settings = <<SETTINGS
    {
        "script": "${base64encode(file("${path.module}/deploy-app.sh"))}"
    }
SETTINGS

  tags = {
    Environment = var.environment
    Project     = "PAC Hosting Server"
  }

  depends_on = [azurerm_linux_virtual_machine.main]
}

# Log Analytics Workspace (for monitoring)
resource "azurerm_log_analytics_workspace" "main" {
  name                = "pac-hosting-vm-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = {
    Environment = var.environment
    Project     = "PAC Hosting Server"
  }
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "pac-hosting-vm-insights"
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
  value       = azurerm_resource_group.main.name
  description = "The name of the resource group"
}

output "vm_name" {
  value       = azurerm_linux_virtual_machine.main.name
  description = "The name of the virtual machine"
}

output "vm_public_ip" {
  value       = azurerm_public_ip.main.ip_address
  description = "The public IP address of the VM"
}

output "vm_managed_identity_principal_id" {
  value       = azurerm_linux_virtual_machine.main.identity[0].principal_id
  description = "The Principal ID of the system-assigned managed identity"
}

output "vm_managed_identity_tenant_id" {
  value       = azurerm_linux_virtual_machine.main.identity[0].tenant_id
  description = "The Tenant ID of the system-assigned managed identity"
}

output "application_url" {
  value       = "http://${azurerm_public_ip.main.ip_address}"
  description = "The URL to access the application"
}

output "ssh_connection_command" {
  value       = "ssh ${var.admin_username}@${azurerm_public_ip.main.ip_address}"
  description = "SSH command to connect to the VM"
}

output "application_insights_instrumentation_key" {
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
  description = "Application Insights instrumentation key"
}

output "application_insights_connection_string" {
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
  description = "Application Insights connection string"
}
