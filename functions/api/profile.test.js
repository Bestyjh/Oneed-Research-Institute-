import { describe, it, expect, vi } from 'vitest';

vi.mock('../_lib/supabase.js', () => ({
  getSupabaseAdmin: vi.fn(() => {
    throw new Error('Supabase should not be called');
  }),
}));

import {
  onRequestGet,
  onRequestPut,
  onRequest,
} from './profile.js';

describe('Cloudflare Profile API security', () => {
  it('rejects GET without authentication', async () => {
    const request = new Request('http://localhost/api/profile');

    const response = await onRequestGet({
      request,
      env: {},
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: 'Missing bearer token',
    });
  });

  it('rejects oversized PUT before authentication', async () => {
    const request = new Request('http://localhost/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': '5016',
        Authorization: 'Bearer invalid-test-token',
      },
      body: JSON.stringify({ full_name: 'x'.repeat(5000) }),
    });

    const response = await onRequestPut({
      request,
      env: {},
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: 'Request body is too large',
    });
  });

  it('rejects unsupported DELETE requests', async () => {
    const request = new Request('http://localhost/api/profile', {
      method: 'DELETE',
    });

    const response = await onRequest({ request });

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('GET, HEAD, PUT');
  });
});
