# Quick Deployment Reference

All deployment files have been organized into the `deployment/` directory.

## 🚀 Quick Commands

### Azure Deployment
```bash
./deployment/scripts/deploy-azure.sh
```

### Terraform Deployment
```bash
cd deployment/terraform && ./deploy-terraform.sh deploy
```

### Docker Compose (Local)
```bash
cd deployment && docker-compose up --build
```

### Local Setup
```bash
./deployment/scripts/setup.sh
```

## 📚 Documentation

- **Quick Start**: [deployment/docs/QUICKSTART.md](deployment/docs/QUICKSTART.md)
- **Full Azure Guide**: [deployment/docs/AZURE_DEPLOYMENT.md](deployment/docs/AZURE_DEPLOYMENT.md)
- **Deployment Overview**: [deployment/README.md](deployment/README.md)

## 📁 Directory Structure

```
deployment/
├── README.md              # Deployment guide
├── docker-compose.yml     # Docker Compose config
├── scripts/               # Deployment scripts
│   ├── deploy-azure.sh    # Azure deployment
│   └── setup.sh           # Local setup
├── terraform/             # Infrastructure as Code
│   ├── main.tf           # Terraform config
│   └── deploy-terraform.sh # Terraform deployment
└── docs/                  # Documentation
    ├── AZURE_DEPLOYMENT.md # Complete guide
    └── QUICKSTART.md      # Quick start
```

All paths are relative to the project root directory.
