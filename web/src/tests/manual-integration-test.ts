// Manual Integration Test Script
// This script can be run in the browser console to test API integration

import apiClient, { apiWithRetry } from '@/services/apiClient';
import { ApiErrorHandler, ErrorType } from '@/services/errorHandling';
import { login, register, clearSession } from '@/services/authApi';

export const runIntegrationTests = async () => {
  console.log('🧪 Starting Manual Integration Tests...');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: [] as Array<{ name: string; passed: boolean; error?: string }>
  };

  const test = async (name: string, testFn: () => Promise<void>) => {
    try {
      await testFn();
      console.log(`✅ ${name}`);
      results.passed++;
      results.tests.push({ name, passed: true });
    } catch (error) {
      console.error(`❌ ${name}:`, error);
      results.failed++;
      results.tests.push({ name, passed: false, error: String(error) });
    }
  };

  // Test 1: Health Check
  await test('Health Check', async () => {
    const response = await apiClient.get('/health');
    if (response.data.status !== 'ok') {
      throw new Error('Health check failed');
    }
  });

  // Test 2: Authentication
  await test('User Registration', async () => {
    try {
      await register({
        name: 'Test User',
        email: 'test.manual@example.com',
        organization: 'Test Org',
        role: 'brigadista',
        password: 'testpass123'
      });
    } catch (error) {
      // User might already exist, that's ok
      const apiError = ApiErrorHandler.classifyError(error);
      if (apiError.statusCode !== 409) {
        throw error;
      }
    }
  });

  let authToken = '';
  await test('User Login', async () => {
    const response = await login({
      email: 'test.manual@example.com',
      password: 'testpass123'
    });
    authToken = response.token;
    if (!authToken) {
      throw new Error('No token received');
    }
  });

  // Test 3: Protected Endpoints
  await test('Fetch Regions', async () => {
    const response = await apiWithRetry.get('/regions');
    if (!Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('Invalid regions data');
    }
  });

  await test('Fetch Risk Data', async () => {
    const response = await apiWithRetry.get('/risk');
    if (!Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('Invalid risk data');
    }
  });

  // Test 4: Public Endpoints
  await test('Fetch Fires Data', async () => {
    const response = await apiWithRetry.get('/fires');
    if (!Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('Invalid fires data');
    }
  });

  await test('Fetch Fire Points', async () => {
    const response = await apiWithRetry.get('/fires/points');
    if (!Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('Invalid fire points data');
    }
  });

  // Test 5: Fauna Endpoints
  await test('Fetch Fauna Filters', async () => {
    const response = await apiWithRetry.get('/fauna/filters');
    const data = response.data;
    if (!data.estados || !data.biomas || !data.grupos || !data.status_iucn) {
      throw new Error('Invalid fauna filters data');
    }
  });

  await test('Fetch Fauna Occurrences', async () => {
    const response = await apiWithRetry.get('/fauna/occurrences');
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid fauna occurrences data');
    }
  });

  await test('Fetch Fauna Species', async () => {
    const response = await apiWithRetry.get('/fauna/biodiversity/species');
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid fauna species data');
    }
  });

  // Test 6: Error Handling
  await test('404 Error Handling', async () => {
    try {
      await apiClient.get('/nonexistent-endpoint');
      throw new Error('Should have thrown 404 error');
    } catch (error) {
      const apiError = ApiErrorHandler.classifyError(error);
      if (apiError.type !== ErrorType.NOT_FOUND_ERROR) {
        throw new Error('Expected 404 error');
      }
    }
  });

  await test('Authentication Error Handling', async () => {
    clearSession();
    try {
      await apiClient.get('/regions');
      throw new Error('Should have thrown auth error');
    } catch (error) {
      const apiError = ApiErrorHandler.classifyError(error);
      if (apiError.type !== ErrorType.AUTHENTICATION_ERROR) {
        throw new Error('Expected authentication error');
      }
    }
  });

  // Results Summary
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(t => !t.passed).forEach(test => {
      console.log(`  - ${test.name}: ${test.error}`);
    });
  }

  return results;
};

// Auto-run tests if this script is loaded
if (typeof window !== 'undefined') {
  // Make it available globally
  (window as any).runIntegrationTests = runIntegrationTests;
  console.log('🧪 Integration tests loaded! Run runIntegrationTests() in console to start.');
}

export default runIntegrationTests;
