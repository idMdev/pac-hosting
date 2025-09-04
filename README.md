# PAC File Hosting Server

A containerized web server that hosts dynamically generated PAC (Proxy Auto-Configuration) files based on tenant ID path parameters.

## Features

- **Dynamic PAC Generation**: Generates PAC files with tenant-specific configurations
- **Container Ready**: Designed to run in Docker containers
- **Health Checks**: Built-in health monitoring endpoint
- **Input Validation**: Validates tenant ID format (GUID)
- **Proper Headers**: Sets appropriate content-type and caching headers for PAC files

## Quick Start

### Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   npm start
   ```

   For development with auto-reload:

   ```bash
   npm run dev
   ```

3. Access the PAC file:

   ```text
   http://localhost:3000/your-tenant-guid
   ```

   Or with beta edge endpoint:

   ```text
   http://localhost:3000/your-tenant-guid?betaEdge=true
   ```

### Docker Container

1. Build the Docker image:

   ```bash
   docker build -t pac-hosting-server .
   ```

2. Run the container:

   ```bash
   docker run -p 3000:3000 pac-hosting-server
   ```

3. Access the service:

   ```text
   http://localhost:3000/your-tenant-guid
   ```

## API Endpoints

### GET /{tenantId}

Generates and returns a PAC file with the specified tenant ID.

**Path Parameters:**

- `tenantId` (required): A valid GUID representing the tenant ID

**Examples:**

```text
GET /beee99f9-ff92-4b15-bddd-652c82ffffff

```

**Response:**

- Content-Type: `application/x-ns-proxy-autoconfig`
- Returns the PAC file content with the specified tenant ID and optionally the beta edge endpoint

### GET /health

Health check endpoint for monitoring.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-07-16T12:00:00.000Z"
}
```

### GET /

Returns API documentation and usage information.

## Configuration

The server uses the following environment variables:

- `PORT`: Server port (default: 3000)

## PAC File Template

The server uses `gsaEfp.pac` as a template and dynamically replaces the tenant ID in the following line:

```javascript
var tenantId = "beee99f9-ff92-4b15-bddd-652c8204f79f";
```

The replacement ensures that the PAC file is customized for each tenant request.

## Error Handling

The server provides proper error responses for:

- Missing tenant ID parameter (400 Bad Request)
- Invalid tenant ID format (400 Bad Request)
- Server errors (500 Internal Server Error)

## Security Features

- Input validation for tenant ID (GUID format)
- Non-root user in Docker container
- Proper error handling without exposing internal details
- Cache control headers to prevent stale PAC files

## Deployment

### Docker Compose Example

```yaml
version: '3.8'
services:
  pac-server:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Kubernetes Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pac-hosting-server
spec:
  replicas: 2
  selector:
    matchLabels:
      app: pac-hosting-server
  template:
    metadata:
      labels:
        app: pac-hosting-server
    spec:
      containers:
      - name: pac-hosting-server
        image: pac-hosting-server:latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: pac-hosting-service
spec:
  selector:
    app: pac-hosting-server
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Azure Deployment 🚀

Deploy to Azure Container Apps with one command:

```bash
# Quick deployment
./deployment/scripts/deploy-azure.sh

# Or with Terraform
cd deployment/terraform && ./deploy-terraform.sh deploy
```

See [deployment/docs/QUICKSTART.md](deployment/docs/QUICKSTART.md) for detailed deployment instructions.

### Deployment Options

1. **Azure Container Apps** (Recommended) - Serverless, auto-scaling
2. **Azure Container Instances** - Simple container hosting
3. **Azure App Service** - Traditional web app hosting
4. **Terraform** - Infrastructure as Code

Full deployment guide: [deployment/docs/AZURE_DEPLOYMENT.md](deployment/docs/AZURE_DEPLOYMENT.md)

## License

MIT
