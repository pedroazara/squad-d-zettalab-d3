import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import apiClient, { apiWithRetry } from '@/services/apiClient';
import { ApiErrorHandler, ErrorType } from '@/services/errorHandling';
import { login, register, clearSession } from '@/services/authApi';
import type { UserLoginPayload } from '@/types/api';

// Test data
const TEST_USER: UserLoginPayload = {
  email: 'integration.test@example.com',
  password: 'testpass123'
};

const TEST_REGISTER_USER = {
  name: 'Integration Test User',
  email: 'integration.test@example.com',
  organization: 'Test Organization',
  role: 'brigadista' as const,
  password: 'testpass123'
};

describe('API Integration Tests', () => {
  let authToken: string | null = null;

  beforeAll(async () => {
    // Clear any existing session
    clearSession();
    
    try {
      // Try to register the test user (might already exist)
      await register(TEST_REGISTER_USER);
    } catch (error) {
      // User might already exist, that's fine
      console.log('Test user might already exist, proceeding with login');
    }
  });

  afterAll(() => {
    // Clean up session
    clearSession();
  });

  describe('Authentication Endpoints', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await login(TEST_USER);
      
      expect(response).toBeDefined();
      expect(response.token).toBeDefined();
      expect(response.user.email).toBe(TEST_USER.email);
      expect(response.user.role).toBe('brigadista');
      
      authToken = response.token;
    });

    it('should fail login with invalid credentials', async () => {
      try {
        await login({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        const apiError = ApiErrorHandler.classifyError(error);
        expect(apiError.type).toBe(ErrorType.AUTHENTICATION_ERROR);
        expect(apiError.statusCode).toBe(401);
      }
    });

    it('should access protected endpoints with valid token', async () => {
      expect(authToken).toBeDefined();
      
      const response = await apiWithRetry.get('/regions');
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    it('should reject protected endpoints without token', async () => {
      // Clear token
      clearSession();
      
      try {
        await apiClient.get('/regions');
        expect.fail('Should have thrown an error');
      } catch (error) {
        const apiError = ApiErrorHandler.classifyError(error);
        expect(apiError.type).toBe(ErrorType.AUTHENTICATION_ERROR);
        expect(apiError.statusCode).toBe(401);
      }
    });
  });

  describe('Dashboard API Endpoints', () => {
    beforeAll(async () => {
      // Ensure we have a valid token
      if (!authToken) {
        const response = await login(TEST_USER);
        authToken = response.token;
      }
    });

    it('should fetch regions data', async () => {
      const response = await apiWithRetry.get('/regions');
      
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Validate data structure
      const firstRegion = response.data[0];
      expect(firstRegion).toHaveProperty('id');
      expect(firstRegion).toHaveProperty('nome');
      expect(firstRegion).toHaveProperty('latitude');
      expect(firstRegion).toHaveProperty('longitude');
      expect(firstRegion).toHaveProperty('temperatura');
      expect(firstRegion).toHaveProperty('umidade');
      expect(firstRegion).toHaveProperty('vento');
      expect(firstRegion).toHaveProperty('precipitacao');
      expect(firstRegion).toHaveProperty('focos_calor');
    });

    it('should fetch risk data', async () => {
      const response = await apiWithRetry.get('/risk');
      
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Validate data structure
      const firstRisk = response.data[0];
      expect(firstRisk).toHaveProperty('regiao_id');
      expect(firstRisk).toHaveProperty('regiao_nome');
      expect(firstRisk).toHaveProperty('score');
      expect(firstRisk).toHaveProperty('risco');
      expect(firstRisk).toHaveProperty('score_amanha');
      expect(firstRisk).toHaveProperty('risco_amanha');
      expect(firstRisk).toHaveProperty('tendencia');
    });

    it('should fetch fires data without authentication', async () => {
      const response = await apiWithRetry.get('/fires');
      
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Validate data structure
      const firstFire = response.data[0];
      expect(firstFire).toHaveProperty('id');
      expect(firstFire).toHaveProperty('estado');
      expect(firstFire).toHaveProperty('municipio');
      expect(firstFire).toHaveProperty('ano_mes');
      expect(firstFire).toHaveProperty('quantidade_focos');
      expect(firstFire).toHaveProperty('risco_fogo_mediano');
      expect(firstFire).toHaveProperty('frp_mediano');
      expect(firstFire).toHaveProperty('score');
      expect(firstFire).toHaveProperty('risco');
    });

    it('should fetch fire points with coordinates', async () => {
      const response = await apiWithRetry.get('/fires/points');
      
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Validate data structure
      const firstPoint = response.data[0];
      expect(firstPoint).toHaveProperty('id');
      expect(firstPoint).toHaveProperty('data_hora');
      expect(firstPoint).toHaveProperty('satelite');
      expect(firstPoint).toHaveProperty('estado');
      expect(firstPoint).toHaveProperty('municipio');
      expect(firstPoint).toHaveProperty('bioma');
      expect(firstPoint).toHaveProperty('risco_fogo');
      expect(firstPoint).toHaveProperty('frp');
      expect(firstPoint).toHaveProperty('latitude');
      expect(firstPoint).toHaveProperty('longitude');
      expect(firstPoint).toHaveProperty('ano_mes');
    });
  });

  describe('Fauna API Endpoints', () => {
    it('should fetch fauna filters', async () => {
      const response = await apiWithRetry.get('/fauna/filters');
      
      expect(response.data).toBeDefined();
      expect(response.data).toHaveProperty('estados');
      expect(response.data).toHaveProperty('biomas');
      expect(response.data).toHaveProperty('grupos');
      expect(response.data).toHaveProperty('status_iucn');
      
      expect(Array.isArray(response.data.estados)).toBe(true);
      expect(Array.isArray(response.data.biomas)).toBe(true);
      expect(Array.isArray(response.data.grupos)).toBe(true);
      expect(Array.isArray(response.data.status_iucn)).toBe(true);
    });

    it('should fetch fauna occurrences', async () => {
      const response = await apiWithRetry.get('/fauna/occurrences');
      
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Validate data structure
      const firstOccurrence = response.data[0];
      expect(firstOccurrence).toHaveProperty('id');
      expect(firstOccurrence).toHaveProperty('nome_cientifico');
      expect(firstOccurrence).toHaveProperty('nome_popular');
      expect(firstOccurrence).toHaveProperty('grupo');
      expect(firstOccurrence).toHaveProperty('status_iucn');
      expect(firstOccurrence).toHaveProperty('bioma');
      expect(firstOccurrence).toHaveProperty('latitude');
      expect(firstOccurrence).toHaveProperty('longitude');
      expect(firstOccurrence).toHaveProperty('estado');
      expect(firstOccurrence).toHaveProperty('ano');
      expect(firstOccurrence).toHaveProperty('mes');
    });

    it('should fetch fauna species', async () => {
      const response = await apiWithRetry.get('/fauna/biodiversity/species');
      
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        const firstSpecies = response.data[0];
        expect(firstSpecies).toHaveProperty('nome_cientifico');
        expect(firstSpecies).toHaveProperty('nome_popular');
        expect(firstSpecies).toHaveProperty('grupo');
        expect(firstSpecies).toHaveProperty('status');
        expect(firstSpecies).toHaveProperty('bioma');
        expect(firstSpecies).toHaveProperty('percentualAfetado');
        expect(firstSpecies).toHaveProperty('location');
        expect(firstSpecies.location).toHaveProperty('lat');
        expect(firstSpecies.location).toHaveProperty('lng');
      }
    });

    it('should fetch fauna timeline', async () => {
      const response = await apiWithRetry.get('/fauna/timeline');
      
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        const firstTimeline = response.data[0];
        expect(firstTimeline).toHaveProperty('periodo');
        expect(firstTimeline).toHaveProperty('ocorrencias');
        expect(typeof firstTimeline.ocorrencias).toBe('number');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors correctly', async () => {
      try {
        await apiClient.get('/nonexistent-endpoint');
        expect.fail('Should have thrown an error');
      } catch (error) {
        const apiError = ApiErrorHandler.classifyError(error);
        expect(apiError.type).toBe(ErrorType.NOT_FOUND_ERROR);
        expect(apiError.statusCode).toBe(404);
        expect(apiError.retryable).toBe(false);
      }
    });

    it('should handle validation errors correctly', async () => {
      try {
        await apiClient.post('/auth/login', {
          email: 'invalid-email',
          password: '123' // Too short
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        const apiError = ApiErrorHandler.classifyError(error);
        expect(apiError.type).toBe(ErrorType.VALIDATION_ERROR);
        expect(apiError.statusCode).toBe(422);
        expect(apiError.retryable).toBe(false);
      }
    });

    it('should retry retryable errors', async () => {
      const result = await apiWithRetry.get('/health');
      expect(result.data).toBeDefined();
    }, 10000); // Increased timeout for retry tests
  });

  describe('Data Consistency', () => {
    it('should have consistent data formats across endpoints', async () => {
      // Test that coordinate formats are consistent
      const firesResponse = await apiWithRetry.get('/fires/points');
      const faunaResponse = await apiWithRetry.get('/fauna/occurrences');
      
      // Check fire points coordinates
      const firePoint = firesResponse.data[0];
      expect(typeof firePoint.latitude).toBe('number');
      expect(typeof firePoint.longitude).toBe('number');
      expect(firePoint.latitude).toBeGreaterThanOrEqual(-90);
      expect(firePoint.latitude).toBeLessThanOrEqual(90);
      expect(firePoint.longitude).toBeGreaterThanOrEqual(-180);
      expect(firePoint.longitude).toBeLessThanOrEqual(180);
      
      // Check fauna coordinates
      if (faunaResponse.data.length > 0) {
        const faunaOccurrence = faunaResponse.data[0];
        expect(typeof faunaOccurrence.latitude).toBe('number');
        expect(typeof faunaOccurrence.longitude).toBe('number');
        expect(faunaOccurrence.latitude).toBeGreaterThanOrEqual(-90);
        expect(faunaOccurrence.latitude).toBeLessThanOrEqual(90);
        expect(faunaOccurrence.longitude).toBeGreaterThanOrEqual(-180);
        expect(faunaOccurrence.longitude).toBeLessThanOrEqual(180);
      }
    });

    it('should have consistent date formats', async () => {
      const firesResponse = await apiWithRetry.get('/fires/points');
      const firePoint = firesResponse.data[0];
      
      // Check date format
      expect(firePoint.ano_mes).toMatch(/^\d{4}-\d{2}$/);
      
      if (firePoint.data_hora) {
        expect(firePoint.data_hora).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      }
    });
  });
});
