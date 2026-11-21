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

  it('returns a successful mocked OpenAI response', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          output_text: 'ONEED offers professional development workshops.',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    try {
      const response = await run(
        {
          messages: [
            { role: 'user', content: 'What training does ONEED offer?' },
          ],
        },
        { OPENAI_API_KEY: 'test-key-not-real' }
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        reply: 'ONEED offers professional development workshops.',
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.openai.com/v1/responses',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key-not-real',
          }),
        })
      );
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('returns a fallback when OpenAI responds with HTTP 500', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { message: 'Mock upstream failure' } }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    try {
      const response = await run(
        {
          messages: [
            { role: 'user', content: 'Tell me about ONEED courses' },
          ],
        },
        { OPENAI_API_KEY: 'test-key-not-real' }
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);

      expect(await response.json()).toEqual({
        reply: 'Oneed offers short courses, workshops and training, conferences, and professional development. Share your goal and I can guide you to the best option.',
      });
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('returns a fallback when the OpenAI network request fails', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new TypeError('Mock network connection failure')
    );

    try {
      const response = await run(
        {
          messages: [
            { role: 'user', content: 'How can I contact ONEED?' },
          ],
        },
        { OPENAI_API_KEY: 'test-key-not-real' }
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);

      const data = await response.json();

      expect(typeof data.reply).toBe('string');
      expect(data.reply.trim().length).toBeGreaterThan(0);
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('returns a fallback when the OpenAI request times out', async () => {
    const timeoutError = new Error('Mock OpenAI request timeout');
    timeoutError.name = 'TimeoutError';

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      timeoutError
    );

    try {
      const response = await run(
        {
          messages: [
            { role: 'user', content: 'Tell me about ONEED partnerships' },
          ],
        },
        { OPENAI_API_KEY: 'test-key-not-real' }
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);

      const data = await response.json();

      expect(typeof data.reply).toBe('string');
      expect(data.reply.trim().length).toBeGreaterThan(0);
    } finally {
      fetchMock.mockRestore();
    }
  });
});
