import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../_lib/ratelimit.js', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
  rateLimit: vi.fn(),
}));

vi.mock('../_lib/supabase.js', () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { rateLimit } from '../_lib/ratelimit.js';
import { getSupabaseAdmin } from '../_lib/supabase.js';
import { onRequestPost } from './bugs.js';

const makeRequest = (body) =>
  new Request('http://localhost/api/bugs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const run = (body) =>
  onRequestPost({
    request: makeRequest(body),
    env: {},
  });

describe('Cloudflare Bugs API security', () => {
  beforeEach(() => {
    getSupabaseAdmin.mockReturnValue({
      client: null,
      error: 'Database unavailable',
    });

    rateLimit.mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetInMs: 60000,
    });
  });

  it('rejects missing required fields', async () => {
    const response = await run({});

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Title and description are required',
    });
  });

  it('rejects unsupported severity', async () => {
    const response = await run({
      title: 'Test bug',
      description: 'Testing severity',
      severity: 'critical',
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid severity',
    });
  });

  it('rejects invalid reporter email', async () => {
    const response = await run({
      title: 'Test bug',
      description: 'Testing email',
      reporter_email: 'invalid-email',
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid reporter email',
    });
  });

  it('rejects titles exceeding 150 characters', async () => {
    const response = await run({
      title: 'x'.repeat(151),
      description: 'Testing field limits',
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
      title: 'Test bug',
      description: 'Testing rate limit',
    });

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
  });

  it('returns 503 when the database is unavailable', async () => {
    const response = await run({
      title: 'Test bug',
      description: 'Testing database availability',
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'Database service is unavailable',
    });
  });

  it('stores a valid anonymous bug report', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ insert }));
    const getUser = vi.fn();

    getSupabaseAdmin.mockReturnValueOnce({
      client: {
        from,
        auth: { getUser },
      },
      error: null,
    });

    const response = await run({
      title: ' Contact form issue ',
      description: ' Form does not submit ',
      reporter_email: 'test@example.com',
      severity: 'high',
      page_url: 'https://example.com/contact',
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      ok: true,
    });

    expect(from).toHaveBeenCalledWith('bug_reports');
    expect(insert).toHaveBeenCalledWith({
      title: 'Contact form issue',
      description: 'Form does not submit',
      reporter_email: 'test@example.com',
      severity: 'high',
      page_url: 'https://example.com/contact',
      user_id: null,
    });

    expect(getUser).not.toHaveBeenCalled();
  });


  it('stores an authenticated bug report with the user ID', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ insert }));
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-123' } },
      error: null,
    });

    getSupabaseAdmin.mockReturnValueOnce({
      client: {
        from,
        auth: { getUser },
      },
      error: null,
    });

    const request = new Request('http://localhost/api/bugs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        title: 'Dashboard issue',
        description: 'The dashboard does not load',
        severity: 'medium',
      }),
    });

    const response = await onRequestPost({
      request,
      env: {},
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true });

    expect(getUser).toHaveBeenCalledWith('test-token');
    expect(from).toHaveBeenCalledWith('bug_reports');

    expect(insert).toHaveBeenCalledWith({
      title: 'Dashboard issue',
      description: 'The dashboard does not load',
      reporter_email: '',
      severity: 'medium',
      page_url: '',
      user_id: 'test-user-123',
    });
  });


  it('rejects an invalid authentication token', async () => {
    const insert = vi.fn();
    const from = vi.fn(() => ({ insert }));
    const getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: {
        status: 401,
        message: 'Invalid token',
      },
    });

    getSupabaseAdmin.mockReturnValueOnce({
      client: {
        from,
        auth: { getUser },
      },
      error: null,
    });

    const request = new Request('http://localhost/api/bugs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid-token',
      },
      body: JSON.stringify({
        title: 'Dashboard issue',
        description: 'Testing invalid authentication',
      }),
    });

    const response = await onRequestPost({
      request,
      env: {},
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: 'Invalid authentication token',
    });

    expect(getUser).toHaveBeenCalledWith('invalid-token');
    expect(from).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

});
