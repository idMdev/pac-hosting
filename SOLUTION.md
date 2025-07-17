# PAC Hosting## File Structure
```text
pac-hosting/
├── server.js              # Main Express server application
├── gsaEfp.pac             # PAC file template
├── package.json           # Node.js dependencies and scripts
├── Dockerfile             # Container configuration
├── test.js                # Test suite
├── README.md              # Main documentation
├── SOLUTION.md            # Solution overview
├── .gitignore             # Git ignore rules
├── .dockerignore          # Docker ignore rules
├── .github/workflows/     # CI/CD pipeline
│   └── deploy-azure.yml   # GitHub Actions workflow
└── deployment/            # Deployment configurations
    ├── README.md          # Deployment guide
    ├── docker-compose.yml # Docker Compose configuration
    ├── scripts/           # Deployment scripts
    │   ├── deploy-azure.sh # One-click Azure deployment
    │   └── setup.sh       # Local setup script
    ├── terraform/         # Infrastructure as Code
    │   ├── main.tf        # Terraform configuration
    │   └── deploy-terraform.sh # Terraform deployment script
    └── docs/              # Deployment documentation
        ├── AZURE_DEPLOYMENT.md # Complete Azure deployment guide
        └── QUICKSTART.md       # Quick start guide
```tion Summary

## Overview
This solution provides a containerized web server that dynamically generates PAC (Proxy Auto-Configuration) files based on tenant ID path parameters.

## Key Features
- **Dynamic PAC Generation**: Replaces tenant ID in PAC file template based on path parameter
- **Container Ready**: Includes Dockerfile and docker-compose.yml for easy deployment
- **Input Validation**: Validates tenant ID format (GUID)
- **Health Monitoring**: Built-in health check endpoint
- **Security**: Runs as non-root user in container
- **Proper Headers**: Sets appropriate content-type and cache headers

## File Structure
```
pac-hosting/
├── server.js              # Main Express server application
├── gsaEfp.pac             # PAC file template
├── package.json           # Node.js dependencies and scripts
├── Dockerfile             # Container configuration
├── docker-compose.yml     # Docker Compose configuration
├── test.js                # Test suite
├── setup.sh               # Setup and deployment script
├── README.md              # Comprehensive documentation
├── .gitignore             # Git ignore rules
└── .dockerignore          # Docker ignore rules
```

## Quick Start Commands

### Local Development
```bash
npm install
npm start
```

### Docker Container
```bash
docker build -t pac-hosting-server .
docker run -p 3000:3000 pac-hosting-server
```

### Docker Compose
```bash
cd deployment && docker-compose up --build
```

## Usage Example
```bash
# Get PAC file for specific tenant
curl "http://localhost:3000/beee99f9-ff92-4b15-bddd-652c8204f79f"

# Get PAC file with beta edge endpoint
curl "http://localhost:3000/beee99f9-ff92-4b15-bddd-652c8204f79f?betaEdge=true"

# Health check
curl "http://localhost:3000/health"

# API documentation
curl "http://localhost:3000/"
```

## Key Implementation Details

### Tenant ID and Endpoint Replacement
The server reads the PAC file template and replaces the tenant ID and optionally the endpoint using regex:
```javascript
const tenantIdPattern = /var tenantId = "[^"]*";/;
const tenantIdReplacement = `var tenantId = "${newTenantId}";`;

// If betaEdge is set to 'true', replace the efpEndpoint
if (betaEdge === 'true') {
  const efpEndpointPattern = /var efpEndpoint = "[^"]*";/;
  const efpEndpointReplacement = `var efpEndpoint = "efp.ztna.azureedge-test.net";`;
  updatedContent = updatedContent.replace(efpEndpointPattern, efpEndpointReplacement);
}
```

### Container Security
- Runs as non-root user (nodejs:1001)
- Includes health checks
- Proper error handling
- Input validation

### Error Handling
- Missing tenant ID: 400 Bad Request
- Invalid GUID format: 400 Bad Request
- Server errors: 500 Internal Server Error

## Testing
Run the test suite:
```bash
npm test
```

Tests cover:

- Health check endpoint
- Root endpoint documentation
- PAC file generation with valid tenant ID
- PAC file generation with betaEdge=true (beta endpoint)
- PAC file generation with betaEdge=false (default endpoint)
- Error handling for missing/invalid tenant ID

## Production Considerations
- Set NODE_ENV=production
- Use reverse proxy (nginx) for SSL termination
- Configure proper logging
- Set up monitoring and alerting
- Consider rate limiting for production use
