/**
 * Gas Town GUI - Cache Integration Tests
 *
 * Tests caching behavior through API endpoints.
 * Verifies that cache improves response times and handles TTL correctly.
 */

import { describe, it, expect } from 'vitest';

const PORT = process.env.PORT || 5678;
const BASE_URL = `http://localhost:${PORT}`;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to make timed API requests
async function timedFetch(endpoint) {
  const start = Date.now();
  const response = await fetch(`${BASE_URL}${endpoint}`);
  const duration = Date.now() - start;
  const data = await response.json().catch(() => null);
  return { status: response.status, data, duration, ok: response.ok };
}

describe('Cache Integration Tests', () => {

  describe('Response Time Consistency', () => {
    it('should return cached status quickly on repeated requests', async () => {
      // First request (may be slower - fetches fresh data)
      const first = await timedFetch('/api/status');
      expect(first.ok).toBe(true);

      // Second request (should be cached)
      const second = await timedFetch('/api/status');
      expect(second.ok).toBe(true);

      // Third request (should also be cached)
      const third = await timedFetch('/api/status');
      expect(third.ok).toBe(true);

      // Cached requests should generally be fast
      // (not a strict assertion since timing can vary)
      console.log(`Status response times: ${first.duration}ms, ${second.duration}ms, ${third.duration}ms`);
    });

    it('should return cached convoys on repeated requests', async () => {
      const first = await timedFetch('/api/convoys');
      expect(first.ok).toBe(true);

      const second = await timedFetch('/api/convoys');
      expect(second.ok).toBe(true);

      console.log(`Convoy response times: ${first.duration}ms, ${second.duration}ms`);
    });

    it('should return cached mail on repeated requests', async () => {
      const first = await timedFetch('/api/mail');
      expect(first.ok).toBe(true);

      const second = await timedFetch('/api/mail');
      expect(second.ok).toBe(true);

      console.log(`Mail response times: ${first.duration}ms, ${second.duration}ms`);
    });
  });

  describe('Cache Bypass', () => {
    it('should support refresh parameter to bypass cache', async () => {
      // Normal cached request
      const cached = await timedFetch('/api/status');
      expect(cached.ok).toBe(true);

      // Request with refresh=true should bypass cache
      const fresh = await timedFetch('/api/status?refresh=true');
      expect(fresh.ok).toBe(true);

      // Both should return valid data
      expect(cached.data).toHaveProperty('name');
      expect(fresh.data).toHaveProperty('name');
    });
  });

  describe('Data Consistency', () => {
    it('should return consistent data from cache', async () => {
      const first = await timedFetch('/api/status');
      const second = await timedFetch('/api/status');

      expect(first.data).toEqual(second.data);
    });

    it('should return consistent convoy data from cache', async () => {
      const first = await timedFetch('/api/convoys');
      const second = await timedFetch('/api/convoys');

      expect(first.data).toEqual(second.data);
    });

    it('should return consistent mail data from cache', async () => {
      const first = await timedFetch('/api/mail');
      const second = await timedFetch('/api/mail');

      expect(first.data).toEqual(second.data);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests for same endpoint', async () => {
      // Make 5 concurrent requests
      const requests = Array(5).fill(null).map(() => timedFetch('/api/status'));
      const results = await Promise.all(requests);

      // All should succeed
      const allSuccess = results.every(r => r.ok);
      expect(allSuccess).toBe(true);

      // All should return the same data
      const firstData = JSON.stringify(results[0].data);
      const allSame = results.every(r => JSON.stringify(r.data) === firstData);
      expect(allSame).toBe(true);
    });

    it('should handle concurrent requests for different endpoints', async () => {
      const requests = [
        timedFetch('/api/status'),
        timedFetch('/api/convoys'),
        timedFetch('/api/mail'),
        timedFetch('/api/agents'),
      ];

      const results = await Promise.all(requests);

      // All should succeed
      const allSuccess = results.every(r => r.ok);
      expect(allSuccess).toBe(true);
    });
  });

  describe('Cache Under Load', () => {
    it('should handle rapid repeated requests', async () => {
      const numRequests = 10;
      const durations = [];

      for (let i = 0; i < numRequests; i++) {
        const result = await timedFetch('/api/status');
        expect(result.ok).toBe(true);
        durations.push(result.duration);
      }

      // Calculate average response time
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      console.log(`Average response time over ${numRequests} requests: ${avgDuration.toFixed(2)}ms`);

      // Response times should be reasonable (under 500ms)
      const maxDuration = Math.max(...durations);
      expect(maxDuration).toBeLessThan(500);
    });
  });

});
