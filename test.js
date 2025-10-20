#!/usr/bin/env node

const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';
const TEST_TENANT_ID = 'beee99f9-ff92-4b15-bddd-652c8204f79f';

// Helper function to make HTTP requests
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('Starting PAC server tests...\n');
  
  try {
    // Test 1: Health check
    console.log('Test 1: Health check endpoint');
    const healthResponse = await makeRequest('/health');
    assert.strictEqual(healthResponse.statusCode, 200);
    const healthData = JSON.parse(healthResponse.data);
    assert.strictEqual(healthData.status, 'healthy');
    console.log('✓ Health check passed\n');
    
    // Test 2: Root endpoint
    console.log('Test 2: Root endpoint');
    const rootResponse = await makeRequest('/');
    assert.strictEqual(rootResponse.statusCode, 200);
    assert(rootResponse.data.includes('12345678-1234-1234-1234-123456789012'));
    assert(rootResponse.message);
    assert(rootResponse.endpoints);
    console.log('✓ Root endpoint passed\n');
    
    // Test 3: PAC endpoint with valid tenant ID
    console.log('Test 3: PAC endpoint with valid tenant ID');
    const pacResponse = await makeRequest(`/${TEST_TENANT_ID}`);
    assert.strictEqual(pacResponse.statusCode, 200);
    assert(pacResponse.headers['content-type'].includes('application/x-ns-proxy-autoconfig'));
    assert(pacResponse.data.includes(`var tenantId = "${TEST_TENANT_ID}";`));
    console.log('✓ PAC endpoint with valid tenant ID passed\n');
    
    // Test 4: PAC endpoint with invalid tenant ID
    console.log('Test 4: PAC endpoint with invalid tenant ID (should fail)');
    const pacInvalidTenantResponse = await makeRequest('/invalid-guid');
    assert.strictEqual(pacInvalidTenantResponse.statusCode, 400);
    const invalidErrorData = JSON.parse(pacInvalidTenantResponse.data);
    assert(invalidErrorData.error.includes('Invalid tenant ID format'));
    console.log('✓ PAC endpoint with invalid tenant ID properly rejected\n');
    
    // Test 5: PAC endpoint with betaEdge=true
    console.log('Test 5: PAC endpoint with betaEdge=true');
    const pacBetaEdgeResponse = await makeRequest(`/${TEST_TENANT_ID}?betaEdge=true`);
    assert.strictEqual(pacBetaEdgeResponse.statusCode, 200);
    assert(pacBetaEdgeResponse.headers['content-type'].includes('application/x-ns-proxy-autoconfig'));
    assert(pacBetaEdgeResponse.data.includes(`var tenantId = "${TEST_TENANT_ID}";`));
    assert(pacBetaEdgeResponse.data.includes(`var efpEndpoint = "efp.ztna.azureedge-test.net";`));
    console.log('✓ PAC endpoint with betaEdge=true passed\n');
    
    // Test 6: PAC endpoint with betaEdge=false (should use default endpoint)
    console.log('Test 6: PAC endpoint with betaEdge=false');
    const pacBetaEdgeFalseResponse = await makeRequest(`/${TEST_TENANT_ID}?betaEdge=false`);
    assert.strictEqual(pacBetaEdgeFalseResponse.statusCode, 200);
    assert(pacBetaEdgeFalseResponse.data.includes(`var tenantId = "${TEST_TENANT_ID}";`));
    assert(pacBetaEdgeFalseResponse.data.includes(`var efpEndpoint = "internet.efp.globalsecureaccess.microsoft.com";`));
    console.log('✓ PAC endpoint with betaEdge=false passed\n');
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await makeRequest('/health');
    console.log('Server is running, starting tests...\n');
    return true;
  } catch (error) {
    console.log('Server is not running. Please start the server first:');
    console.log('  npm start');
    console.log('  or');
    console.log('  node server.js');
    return false;
  }
}

async function main() {
  if (await checkServer()) {
    await runTests();
  }
}

main();
