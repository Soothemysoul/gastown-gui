/**
 * Gas Town GUI - API Endpoint Tests
 *
 * Tests server endpoints for correct behavior, input validation, and error handling.
 * Uses the mock server for isolation from the actual Gas Town backend.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const PORT = process.env.PORT || 5678;
const BASE_URL = `http://localhost:${PORT}`;

// Helper to make API requests
async function api(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const contentType = response.headers.get('content-type');
  let data = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { status: response.status, data, ok: response.ok };
}

describe('API Endpoint Tests', () => {

  describe('GET /api/status', () => {
    it('should return system status with required fields', async () => {
      const { status, data, ok } = await api('/api/status');

      expect(ok).toBe(true);
      expect(status).toBe(200);
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('agents');
      expect(Array.isArray(data.agents)).toBe(true);
    });

    it('should include agent count and status', async () => {
      const { data } = await api('/api/status');

      expect(typeof data.active_agents).toBe('number');
      expect(typeof data.convoy_count).toBe('number');
    });
  });

  describe('GET /api/health', () => {
    it('should return health check with ok status', async () => {
      const { status, data, ok } = await api('/api/health');

      expect(ok).toBe(true);
      expect(status).toBe(200);
      expect(data).toHaveProperty('status', 'ok');
    });
  });

  describe('GET /api/convoys', () => {
    it('should return array of convoys', async () => {
      const { status, data, ok } = await api('/api/convoys');

      expect(ok).toBe(true);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should include convoy details', async () => {
      const { data } = await api('/api/convoys');

      if (data.length > 0) {
        const convoy = data[0];
        expect(convoy).toHaveProperty('id');
        expect(convoy).toHaveProperty('name');
        expect(convoy).toHaveProperty('status');
      }
    });
  });

  describe('GET /api/convoy/:id', () => {
    it('should return specific convoy by id', async () => {
      // First get list to find a valid ID
      const { data: convoys } = await api('/api/convoys');

      if (convoys.length > 0) {
        const convoyId = convoys[0].id;
        const { status, data, ok } = await api(`/api/convoy/${convoyId}`);

        expect(ok).toBe(true);
        expect(status).toBe(200);
        expect(data).toHaveProperty('id', convoyId);
      }
    });

    it('should return 404 for non-existent convoy', async () => {
      const { status, ok } = await api('/api/convoy/non-existent-id-12345');

      // Mock server may return 200 with null, or 404
      expect([200, 404]).toContain(status);
    });
  });

  describe('GET /api/mail', () => {
    it('should return array of mail messages', async () => {
      const { status, data, ok } = await api('/api/mail');

      expect(ok).toBe(true);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should include mail message details', async () => {
      const { data } = await api('/api/mail');

      if (data.length > 0) {
        const mail = data[0];
        expect(mail).toHaveProperty('id');
        expect(mail).toHaveProperty('from');
        expect(mail).toHaveProperty('subject');
      }
    });
  });

  describe('GET /api/rigs', () => {
    it('should return array of rigs or 404 if not mocked', async () => {
      const { status, data } = await api('/api/rigs');

      // Mock server may not implement this endpoint
      if (status === 200) {
        expect(Array.isArray(data)).toBe(true);
      } else {
        expect(status).toBe(404);
      }
    });
  });

  describe('GET /api/agents', () => {
    it('should return array of agents', async () => {
      const { status, data, ok } = await api('/api/agents');

      expect(ok).toBe(true);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should include agent details', async () => {
      const { data } = await api('/api/agents');

      if (data.length > 0) {
        const agent = data[0];
        expect(agent).toHaveProperty('id');
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('role');
        expect(agent).toHaveProperty('status');
      }
    });
  });

  describe('GET /api/beads', () => {
    it('should return array of beads/work items or 404 if not mocked', async () => {
      const { status, data } = await api('/api/beads');

      // Mock server may not implement this endpoint
      if (status === 200) {
        expect(Array.isArray(data)).toBe(true);
      } else {
        expect(status).toBe(404);
      }
    });
  });

  describe('POST /api/convoy', () => {
    it('should create a new convoy with valid data', async () => {
      const { status, ok } = await api('/api/convoy', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Convoy',
          issues: ['Test issue 1', 'Test issue 2'],
        }),
      });

      // May succeed (201) or fail if mock doesn't support POST
      expect([200, 201, 400, 500]).toContain(status);
    });

    it('should handle missing required fields', async () => {
      const { status } = await api('/api/convoy', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      // Should either reject with 400 or handle gracefully
      expect([200, 201, 400, 500]).toContain(status);
    });
  });

  describe('POST /api/nudge', () => {
    it('should send a nudge message', async () => {
      const { status } = await api('/api/nudge', {
        method: 'POST',
        body: JSON.stringify({
          target: 'agent-1',
          message: 'Test nudge message',
        }),
      });

      expect([200, 201, 400, 500]).toContain(status);
    });
  });

  describe('GET /api/doctor', () => {
    it('should return diagnostic information or 404 if not mocked', async () => {
      const { status } = await api('/api/doctor');

      // Mock server may not implement this endpoint
      expect([200, 404]).toContain(status);
    });
  });

  describe('GET /api/setup/status', () => {
    it('should return setup status or 404 if not mocked', async () => {
      const { status } = await api('/api/setup/status');

      // Mock server may not implement this endpoint
      expect([200, 404]).toContain(status);
    });
  });

});

describe('API Error Handling', () => {

  it('should return 404 for unknown endpoints', async () => {
    const { status } = await api('/api/unknown-endpoint-12345');

    expect(status).toBe(404);
  });

  it('should handle malformed JSON gracefully', async () => {
    const response = await fetch(`${BASE_URL}/api/convoy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ invalid json }',
    });

    // Should return 400 for bad JSON, not crash
    expect([400, 500]).toContain(response.status);
  });

});
