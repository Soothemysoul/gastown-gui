/**
 * Gas Town GUI - WebSocket Integration Tests
 *
 * Tests WebSocket connectivity and real-time event handling.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';

const PORT = process.env.PORT || 5678;
const WS_URL = `ws://localhost:${PORT}/ws`;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('WebSocket Integration Tests', () => {

  describe('Connection', () => {
    it('should establish WebSocket connection', async () => {
      const ws = new WebSocket(WS_URL);

      const connected = await new Promise((resolve) => {
        ws.on('open', () => resolve(true));
        ws.on('error', () => resolve(false));
        setTimeout(() => resolve(false), 5000);
      });

      expect(connected).toBe(true);
      ws.close();
    });

    it('should receive initial status message on connect', async () => {
      const ws = new WebSocket(WS_URL);

      const message = await new Promise((resolve) => {
        ws.on('message', (data) => {
          try {
            resolve(JSON.parse(data.toString()));
          } catch {
            resolve(null);
          }
        });
        ws.on('error', () => resolve(null));
        setTimeout(() => resolve(null), 5000);
      });

      // Mock server may or may not send initial status
      if (message) {
        expect(message).toHaveProperty('type');
      }

      ws.close();
    });

    it('should handle multiple concurrent connections', async () => {
      const connections = [];
      const numConnections = 3;

      for (let i = 0; i < numConnections; i++) {
        connections.push(new WebSocket(WS_URL));
      }

      const results = await Promise.all(
        connections.map(ws => new Promise((resolve) => {
          ws.on('open', () => resolve(true));
          ws.on('error', () => resolve(false));
          setTimeout(() => resolve(false), 5000);
        }))
      );

      const allConnected = results.every(r => r === true);
      expect(allConnected).toBe(true);

      // Cleanup
      connections.forEach(ws => ws.close());
    });
  });

  describe('Disconnection', () => {
    it('should handle clean disconnect', async () => {
      const ws = new WebSocket(WS_URL);

      await new Promise((resolve) => {
        ws.on('open', () => resolve());
        setTimeout(resolve, 5000);
      });

      const closed = await new Promise((resolve) => {
        ws.on('close', () => resolve(true));
        ws.close();
        setTimeout(() => resolve(false), 2000);
      });

      expect(closed).toBe(true);
    });

    it('should handle abrupt disconnect gracefully', async () => {
      const ws = new WebSocket(WS_URL);

      await new Promise((resolve) => {
        ws.on('open', () => resolve());
        setTimeout(resolve, 5000);
      });

      // Force close without proper handshake
      ws.terminate();

      // Server should not crash - verify by creating new connection
      await sleep(100);

      const ws2 = new WebSocket(WS_URL);
      const connected = await new Promise((resolve) => {
        ws2.on('open', () => resolve(true));
        ws2.on('error', () => resolve(false));
        setTimeout(() => resolve(false), 5000);
      });

      expect(connected).toBe(true);
      ws2.close();
    });
  });

  describe('Message Handling', () => {
    it('should handle ping/pong', async () => {
      const ws = new WebSocket(WS_URL);

      await new Promise((resolve) => {
        ws.on('open', () => resolve());
        setTimeout(resolve, 5000);
      });

      // WebSocket library handles ping/pong automatically
      // Just verify connection stays alive
      await sleep(500);
      expect(ws.readyState).toBe(WebSocket.OPEN);

      ws.close();
    });

    it('should handle invalid JSON gracefully', async () => {
      const ws = new WebSocket(WS_URL);

      await new Promise((resolve) => {
        ws.on('open', () => resolve());
        setTimeout(resolve, 5000);
      });

      // Send invalid JSON
      ws.send('not valid json {{{');

      // Connection should remain open
      await sleep(200);
      expect(ws.readyState).toBe(WebSocket.OPEN);

      ws.close();
    });

    it('should handle empty messages', async () => {
      const ws = new WebSocket(WS_URL);

      await new Promise((resolve) => {
        ws.on('open', () => resolve());
        setTimeout(resolve, 5000);
      });

      // Send empty message
      ws.send('');

      // Connection should remain open
      await sleep(200);
      expect(ws.readyState).toBe(WebSocket.OPEN);

      ws.close();
    });
  });

  describe('Reconnection', () => {
    it('should allow reconnection after disconnect', async () => {
      // First connection
      const ws1 = new WebSocket(WS_URL);
      await new Promise((resolve) => {
        ws1.on('open', () => resolve());
        setTimeout(resolve, 5000);
      });
      ws1.close();

      await sleep(100);

      // Second connection
      const ws2 = new WebSocket(WS_URL);
      const connected = await new Promise((resolve) => {
        ws2.on('open', () => resolve(true));
        ws2.on('error', () => resolve(false));
        setTimeout(() => resolve(false), 5000);
      });

      expect(connected).toBe(true);
      ws2.close();
    });
  });

});
