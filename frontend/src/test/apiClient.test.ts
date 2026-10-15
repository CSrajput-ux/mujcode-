import { describe, it, expect } from 'vitest';
import { apiClient, API_BASE_URL, API_URL } from '../app/services/apiClient';

describe('Enterprise API Client Configuration', () => {
  it('should initialize with correct API_BASE_URL and API_URL structure', () => {
    expect(API_BASE_URL).toBeDefined();
    expect(typeof API_BASE_URL).toBe('string');
    expect(API_URL).toBe(`${API_BASE_URL}/api`);
  });

  it('should enable credentials for secure cross-origin cookie handling', () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it('should set default application/json content type', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should properly strip trailing slashes in base URL', () => {
    expect(API_BASE_URL.endsWith('/')).toBe(false);
  });
});
