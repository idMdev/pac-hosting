const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Certificate endpoint - EfpTestCN
app.get('/certs/EfpTestCN.crt', (req, res) => {
  try {
    const certPath = path.join(__dirname, 'EfpTestCN.crt');
    
    // Check if certificate file exists
    if (!fs.existsSync(certPath)) {
      return res.status(404).json({ 
        error: 'Certificate file not found' 
      });
    }
    
    // Read and serve the certificate file
    const certContent = fs.readFileSync(certPath, 'utf8');
    
    // Set appropriate headers for certificate file
    res.setHeader('Content-Type', 'application/x-x509-ca-cert');
    res.setHeader('Content-Disposition', 'attachment; filename="EfpTestCN.crt"');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    res.send(certContent);
    
  } catch (error) {
    console.error('Error serving certificate file:', error);
    res.status(500).json({ 
      error: 'Internal server error while serving certificate file' 
    });
  }
});

// Certificate endpoint - AzureIdentity.Us
app.get('/certs/AzureIdentity.Us.crt', (req, res) => {
  try {
    const certPath = path.join(__dirname, 'azureidentity.us.crt');
    
    // Check if certificate file exists
    if (!fs.existsSync(certPath)) {
      return res.status(404).json({ 
        error: 'Certificate file not found' 
      });
    }
    
    // Read and serve the certificate file
    const certContent = fs.readFileSync(certPath, 'utf8');
    
    // Set appropriate headers for certificate file
    res.setHeader('Content-Type', 'application/x-x509-ca-cert');
    res.setHeader('Content-Disposition', 'attachment; filename="AzureIdentity.Us.crt"');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    res.send(certContent);
    
  } catch (error) {
    console.error('Error serving certificate file:', error);
    res.status(500).json({ 
      error: 'Internal server error while serving certificate file' 
    });
  }
});

// Default route - only show when no tenant ID is provided
app.get('/', (req, res) => {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PAC File Hosting Service - Microsoft GSA EFP</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #0078d4;
            border-bottom: 3px solid #0078d4;
            padding-bottom: 10px;
        }
        h2 {
            color: #106ebe;
            margin-top: 30px;
        }
        .url-example {
            background: #e8f4f8;
            padding: 15px;
            border-left: 4px solid #0078d4;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
        }
        .config-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .config-section h3 {
            margin-top: 0;
            color: #495057;
        }
        code {
            background: #f1f3f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .step {
            margin: 10px 0;
            padding-left: 20px;
        }
        .step::before {
            content: "→ ";
            color: #0078d4;
            font-weight: bold;
            margin-left: -20px;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Explicit Forward Proxy for Global Secure Access</h1>
        
        <div class="warning">
            <strong>📋 Note:</strong> This is an example service that generates proxy auto-configuration (PAC) files for Microsoft Entra Internet Access and is intended for testing/validating explicit forward proxy features. Please do not use this service for broad production deployments. This service is not supported by Microsoft and may be decommissioned without notice. Open source files for this service are available <a href="https://github.com/idMdev/pac-hosting" target="_blank">on GitHub</a>.
        </div>

        <h2>Usage</h2>
        <p>This service hosts customized PAC (Proxy Auto-Configuration) files for Microsoft Entra Internet Access. Each PAC file is dynamically generated based on your tenant ID.</p>

        <h3>PAC File URL Format</h3>
        <div class="url-example">
            https://pac.azureidentity.us/YOUR_TENANT_ID
        </div>

        <h3>Example</h3>
        <p>If your tenant ID is <code>12345678-1234-1234-1234-123456789012</code>, your PAC file URL would be:</p>
        <div class="url-example">
            https://pac.azureidentity.us/12345678-1234-1234-1234-123456789012
        </div>

        <p><strong>Note:</strong> Both HTTP and HTTPS are supported, but HTTPS is recommended for security.</p>

        <h2>Browser Configuration</h2>
        
        <div class="config-section">
            <h3>Windows - System-Wide Proxy Settings</h3>
            <div class="step">Open <strong>Settings</strong> → <strong>Network & Internet</strong> → <strong>Proxy</strong></div>
            <div class="step">Turn on <strong>"Use setup script"</strong></div>
            <div class="step">Enter your PAC file URL in the <strong>"Script address"</strong> field</div>
            <div class="step">Click <strong>"Save"</strong></div>
        </div>

        <div class="config-section">
            <h3>macOS - System-Wide Proxy Settings</h3>
            <div class="step">Open <strong>System Preferences</strong> → <strong>Network</strong></div>
            <div class="step">Select your active network connection and click <strong>"Advanced"</strong></div>
            <div class="step">Go to the <strong>"Proxies"</strong> tab</div>
            <div class="step">Check <strong>"Automatic Proxy Configuration"</strong></div>
            <div class="step">Enter your PAC file URL in the URL field</div>
            <div class="step">Click <strong>"OK"</strong> and then <strong>"Apply"</strong></div>
        </div>

        <div class="config-section">
            <h3>Microsoft Edge / Google Chrome</h3>
            <p>These browsers typically use system proxy settings, but you can also configure them individually:</p>
            <div class="step">Go to <strong>Settings</strong> → <strong>Advanced</strong> → <strong>System</strong></div>
            <div class="step">Click <strong>"Open your computer's proxy settings"</strong></div>
            <div class="step">Follow the Windows or macOS instructions above</div>
            
            <p><strong>Alternative for Chrome:</strong></p>
            <div class="step">Go to <strong>Settings</strong> → <strong>Advanced</strong> → <strong>System</strong></div>
            <div class="step">Turn off <strong>"Use system proxy settings"</strong></div>
            <div class="step">Configure proxy manually using the PAC file URL</div>
        </div>

        <div class="config-section">
            <h3>Mozilla Firefox</h3>
            <p>Firefox has its own proxy settings:</p>
            <div class="step">Go to <strong>Settings</strong> → <strong>General</strong> → <strong>Network Settings</strong></div>
            <div class="step">Click <strong>"Settings"</strong></div>
            <div class="step">Select <strong>"Automatic proxy configuration URL"</strong></div>
            <div class="step">Enter your PAC file URL</div>
            <div class="step">Click <strong>"OK"</strong></div>
        </div>

        <div class="config-section">
            <h3>Safari (macOS)</h3>
            <p>Safari uses system proxy settings:</p>
            <div class="step">Follow the macOS system-wide proxy configuration above</div>
            <div class="step">Safari will automatically use the configured PAC file</div>
        </div>

        <h2>Verification</h2>
        <p>To verify your PAC file is working correctly:</p>
        <div class="step">Visit a website that should go through the proxy</div>
        <div class="step">Check your browser's network tools or proxy logs</div>
        <div class="step">Use browser debugging tools like <code>chrome://net-internals/#proxy</code> in Chrome/Edge</div>

        <h2>Troubleshooting</h2>
        <div class="warning">
            <strong>Common Issues:</strong>
            <ul>
                <li>Ensure your tenant ID is correct and properly formatted as a GUID</li>
                <li>Verify your tenant has Microsoft Entra Internet Access enabled</li>
                <li>Check that the PAC file URL is accessible from your network</li>
                <li>Some corporate firewalls may block PAC file downloads</li>
            </ul>
        </div>

    </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(htmlContent);
});

// Helper function to generate random 12-character unique ID using cryptographically secure random
function generateUniqueId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charsLength = chars.length;
  // Generate extra bytes to minimize modulo bias
  const randomBytes = crypto.randomBytes(24);
  let result = '';
  let byteIndex = 0;
  
  while (result.length < 12 && byteIndex < randomBytes.length) {
    const randomValue = randomBytes[byteIndex];
    byteIndex++;
    // Use rejection sampling to minimize bias
    // 252 is the largest multiple of 36 that fits in a byte (252 = 36 * 7)
    if (randomValue < 252) {
      result += chars.charAt(randomValue % charsLength);
    }
  }
  
  // Fallback in extremely unlikely case we don't have enough bytes
  // Add a safety limit to prevent theoretical infinite loop
  let attempts = 0;
  const maxAttempts = 100;
  while (result.length < 12 && attempts < maxAttempts) {
    attempts++;
    const extraBytes = crypto.randomBytes(12); // Generate multiple bytes at once for efficiency
    for (let i = 0; i < extraBytes.length && result.length < 12; i++) {
      if (extraBytes[i] < 252) {
        result += chars.charAt(extraBytes[i] % charsLength);
      }
    }
  }
  
  return result;
}

// PAC file endpoint - serve on root with tenant ID and optional pinnedsession path
app.get('/:tenantId/pinnedsession', (req, res) => {
  try {
    const { tenantId } = req.params;
    const { betaEdge } = req.query;
    const requestHost = req.get('host') || req.get('Host') || 'localhost';
    
    // Validate tenant ID
    if (!tenantId) {
      return res.status(400).json({ 
        error: 'Missing required path parameter: tenantId' 
      });
    }
    
    // Validate tenant ID format (basic GUID validation)
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidRegex.test(tenantId)) {
      return res.status(400).json({ 
        error: 'Invalid tenant ID format. Must be a valid GUID.' 
      });
    }
    
    // Generate unique ID for pinned session
    const uniqueId = generateUniqueId();
    
    // Read the PAC file template
    const pacFilePath = path.join(__dirname, 'gsaEfp.pac');
    const pacFileContent = fs.readFileSync(pacFilePath, 'utf8');
    
    // Replace the tenant ID, endpoint, and PAC file host in the PAC file with pinned session format
    const updatedPacContent = replaceTenantIdAndEndpoint(pacFileContent, tenantId, betaEdge, requestHost, uniqueId);
    
    // Set appropriate headers for PAC file
    res.setHeader('Content-Type', 'application/x-ns-proxy-autoconfig');
    // Tenant ID is already validated as GUID format, safe to use in filename
    res.setHeader('Content-Disposition', `attachment; filename="proxy-${tenantId}-pinned.pac"`);
    res.setHeader('Cache-Control', 'public, max-age=43200');
    res.setHeader('ETag', 'pac-v1');
    
    res.send(updatedPacContent);
    
  } catch (error) {
    console.error('Error serving PAC file:', error);
    res.status(500).json({ 
      error: 'Internal server error while generating PAC file' 
    });
  }
});

// PAC file endpoint - serve on root with tenant ID in path
app.get('/:tenantId', (req, res) => {
  try {
    const { tenantId } = req.params;
    const { betaEdge } = req.query;
    const requestHost = req.get('host') || req.get('Host') || 'localhost';
    
    // Validate tenant ID
    if (!tenantId) {
      return res.status(400).json({ 
        error: 'Missing required path parameter: tenantId' 
      });
    }
    
    // Validate tenant ID format (basic GUID validation)
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidRegex.test(tenantId)) {
      return res.status(400).json({ 
        error: 'Invalid tenant ID format. Must be a valid GUID.' 
      });
    }
    
    // Read the PAC file template
    const pacFilePath = path.join(__dirname, 'gsaEfp.pac');
    const pacFileContent = fs.readFileSync(pacFilePath, 'utf8');
    
    // Replace the tenant ID, endpoint, and PAC file host in the PAC file
    const updatedPacContent = replaceTenantIdAndEndpoint(pacFileContent, tenantId, betaEdge, requestHost);
    
    // Set appropriate headers for PAC file
    res.setHeader('Content-Type', 'application/x-ns-proxy-autoconfig');
    // Tenant ID is already validated as GUID format, safe to use in filename
    res.setHeader('Content-Disposition', `attachment; filename="proxy-${tenantId}.pac"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.send(updatedPacContent);
    
  } catch (error) {
    console.error('Error serving PAC file:', error);
    res.status(500).json({ 
      error: 'Internal server error while generating PAC file' 
    });
  }
});

// Function to replace tenant ID and optionally endpoint in PAC file content
function replaceTenantIdAndEndpoint(pacContent, newTenantId, betaEdge, requestHost, uniqueId) {
  // Replace the tenant ID in the variable declaration
  const tenantIdPattern = /var tenantId = "[^"]*";/;
  let tenantIdReplacement;
  
  // If uniqueId is provided, use pinned session format
  if (uniqueId) {
    tenantIdReplacement = `var tenantId = "${newTenantId}_${uniqueId}";`;
  } else {
    tenantIdReplacement = `var tenantId = "${newTenantId}";`;
  }
  
  let updatedContent = pacContent.replace(tenantIdPattern, tenantIdReplacement);
  
  // Replace the dynamic PAC host placeholder with the actual request host
  const pacHostPattern = /var pacFileRequestHost = "[^"]*";/;
  const pacHostReplacement = `var pacFileRequestHost = "${requestHost}";`;
  updatedContent = updatedContent.replace(pacHostPattern, pacHostReplacement);
  
  // If betaEdge is set to 'true', replace the efpEndpoint
  if (betaEdge === 'true') {
    const efpEndpointPattern = /var efpEndpoint = "[^"]*";/;
    const efpEndpointReplacement = `var efpEndpoint = "efp.ztna.azureedge-test.net";`;
    updatedContent = updatedContent.replace(efpEndpointPattern, efpEndpointReplacement);
  }
  
  // Also comment out any other tenant ID lines to avoid confusion
  updatedContent = updatedContent.replace(
    /^(\s*)(\/\/var tenantId = "[^"]*";)/gm,
    '$1$2'
  );
  
  return updatedContent;
}

// Start server
app.listen(PORT, () => {
  console.log(`PAC hosting server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`PAC endpoint: http://localhost:${PORT}/{tenantId}?betaEdge=true`);
});

module.exports = app;
