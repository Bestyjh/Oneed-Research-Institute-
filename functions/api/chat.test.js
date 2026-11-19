import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../_lib/ratelimit.js', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
  rateLimit: vi.fn(),
}));

import { rateLimit } from '../_lib/ratelimit.js';
import { onRequestPost } from './chat.js';

const makeRequest = (body) =>
  new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const run = (body, env = {}) =>
  onRequestPost({ request: makeRequest(body), env });

describe('Cloudflare Chat API security', () => {
  beforeEach(() => {
    rateLimit.mockResolvedValue({
      allowed: true,
      remaining: 19,
      resetInMs: 60000,
    });
  });

  it('rejects missing messages', async () => {
    const response = await run({});

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Messages must be an array',
    });
  });

  it('rejects more than 12 messages', async () => {
    const messages = Array.from({ length: 13 }, () => ({
      role: 'user',
      content: 'Test',
    }));

    const response = await run({ messages });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Too many messages. Maximum is 12.',
    });
  });

  it('rejects messages exceeding 4000 characters', async () => {
    const response = await run({
      messages: [
        { role: 'user', content: 'x'.repeat(4001) },
      ],
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid chat messages',
    });
  });

  it('rejects requests when the OpenAI key is missing', async () => {
    const response = await run({
      messages: [
        { role: 'user', content: 'Hello' },
      ],
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'The service is temporarily unavailable',
    });
  });

  it('enforces the rate limit', async () => {
    rateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetInMs: 60000,
    });

    const response = await run({
      messages: [
        { role: 'user', content: 'Hello' },
      ],
    });

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(await response.json()).toEqual({
      error: 'Too many messages. Please try again later.',
    });
  });
});
