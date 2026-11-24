import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../_lib/ratelimit.js', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
  rateLimit: vi.fn(),
}));

vi.mock('../_lib/supabase.js', () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { rateLimit } from '../_lib/ratelimit.js';
import { getSupabaseAdmin } from '../_lib/supabase.js';
import { onRequestPost } from './consultations.js';

const makeRequest = (body) =>
  new Request('http://localhost/api/consultations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const run = (body) =>
  onRequestPost({
    request: makeRequest(body),
    env: {},
  });

describe('Cloudflare Consultations API security', () => {
  let fetchMock;
  let unexpectedFetch;

  beforeEach(() => {
    unexpectedFetch = vi.fn();

    fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockImplementation(async () => {
        unexpectedFetch();
        throw new Error('Unexpected network request blocked');
      });
  });

  afterEach(() => {
    try {
      expect(unexpectedFetch).not.toHaveBeenCalled();
    } finally {
      fetchMock.mockRestore();
    }
  });

  beforeEach(() => {
    getSupabaseAdmin.mockReturnValue({
      client: null,
      error: 'Database unavailable',
    });

    rateLimit.mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetInMs: 60000,
    });
  });

  it('rejects missing required fields', async () => {
    const response = await run({});

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Name and email are required',
    });
  });

  it('rejects invalid email addresses', async () => {
    const response = await run({
      name: 'Test User',
      email: 'invalid-email',
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'A valid email address is required',
    });
  });

  it('rejects names exceeding 150 characters', async () => {
    const response = await run({
      name: 'x'.repeat(151),
      email: 'test@example.com',
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'One or more fields are too long',
    });
  });

  it('enforces the rate limit', async () => {
    rateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetInMs: 60000,
    });

    const response = await run({
      name: 'Test User',
      email: 'test@example.com',
    });

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
  });

  it('returns 503 when the database is unavailable', async () => {
    const response = await run({
      name: 'Test User',
      email: 'test@example.com',
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'Database service is unavailable',
    });
  });

  it('stores a consultation successfully without email configuration', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ insert }));

    getSupabaseAdmin.mockReturnValueOnce({
      client: { from },
      error: null,
    });

    const response = await run({
      name: ' Test User ',
      email: 'test@example.com',
      service: 'Research',
      page_url: 'https://example.com/contact',
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      ok: true,
      email_notified: false,
    });

    expect(from).toHaveBeenCalledWith('consultation_requests');
    expect(insert).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      service: 'Research',
      page_url: 'https://example.com/contact',
    });
  });


  it('sends a notification after successfully storing a consultation', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ insert }));

    getSupabaseAdmin.mockReturnValueOnce({
      client: { from },
      error: null,
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
    });


      const response = await onRequestPost({
        request: makeRequest({
          name: 'Test User',
          email: 'test@example.com',
          service: 'Research',
        }),
        env: {
          RESEND_API_KEY: 'test-key',
          CONTACT_EMAIL_TO: 'notifications@example.com',
          CONTACT_EMAIL_FROM: 'ONEED <sender@example.com>',
        },
      });

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({
        ok: true,
        email_notified: true,
      });

      expect(from).toHaveBeenCalledWith('consultation_requests');
      expect(insert).toHaveBeenCalledOnce();

      expect(fetchMock).toHaveBeenCalledOnce();

      const [url, options] = fetchMock.mock.calls[0];

      expect(url).toBe('https://api.resend.com/emails');
      expect(options.method).toBe('POST');

      const payload = JSON.parse(options.body);

      expect(payload.to).toEqual(['notifications@example.com']);
      expect(payload.reply_to).toBe('test@example.com');
      expect(payload.subject).toBe('New Consultation Request - Research');

  });


  it('returns 500 and does not email when database insertion fails', async () => {
    const insert = vi.fn().mockResolvedValue({
      error: { message: 'Mock database failure' },
    });
    const from = vi.fn(() => ({ insert }));

    getSupabaseAdmin.mockReturnValueOnce({
      client: { from },
      error: null,
    });


      const response = await onRequestPost({
        request: makeRequest({
          name: 'Test User',
          email: 'test@example.com',
          service: 'Research',
        }),
        env: { RESEND_API_KEY: 'test-key' },
      });

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: 'Failed to submit consultation request',
      });

      expect(from).toHaveBeenCalledWith('consultation_requests');
      expect(insert).toHaveBeenCalledOnce();
      expect(fetchMock).not.toHaveBeenCalled();

  });


  it('preserves a successful submission when Resend fails', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ insert }));

    getSupabaseAdmin.mockReturnValueOnce({
      client: { from },
      error: null,
    });

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
    });


      const response = await onRequestPost({
        request: makeRequest({
          name: 'Test User',
          email: 'test@example.com',
          service: 'Research',
        }),
        env: {
          RESEND_API_KEY: 'test-key',
        },
      });

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({
        ok: true,
        email_notified: false,
      });

      expect(from).toHaveBeenCalledWith('consultation_requests');
      expect(insert).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledOnce();

  });

});
