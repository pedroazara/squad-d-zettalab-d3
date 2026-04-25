import { beforeAll, afterAll } from 'vitest';

// Setup test environment
beforeAll(() => {
  // Set up any global test configuration
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Clean up any global test configuration
  delete process.env.NODE_ENV;
});
