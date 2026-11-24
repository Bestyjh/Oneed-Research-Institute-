import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ mocked: true }))
}));

import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from './supabase.js';

const STAGING_URL =
  'https://bvwxgetdaojkdjqpcmci.supabase.co';

const PRODUCTION_URL =
  'https://jdqacsksryqfvfzejsbv.supabase.co';

const PREVIEW_BRANCH = 'security/vite-migration';
const PRODUCTION_BRANCH = 'security/shared-rate-limiting';

const PLACEHOLDER_KEY = 'test-placeholder-not-a-real-key';

function makeEnv(overrides = {}) {
  return {
    SUPABASE_URL: STAGING_URL,
    SUPABASE_SERVICE_ROLE_KEY: PLACEHOLDER_KEY,
    CF_PAGES_BRANCH: PREVIEW_BRANCH,
    ONEED_DEPLOYMENT_SCOPE: 'preview',
    ...overrides
  };
}

function makeProductionEnv(overrides = {}) {
  return makeEnv({
    SUPABASE_URL: PRODUCTION_URL,
    CF_PAGES_BRANCH: PRODUCTION_BRANCH,
    ONEED_DEPLOYMENT_SCOPE: 'production',
    ...overrides
  });
}

function expectRejected(env, missing = false) {
  const result = getSupabaseAdmin(env);

  expect(result.client).toBeNull();

  expect(result.error).toBe(
    missing
      ? 'Supabase server configuration is unavailable'
      : 'Supabase server configuration is invalid'
  );

  expect(createClient).not.toHaveBeenCalled();
}

describe('ONEED Supabase backend isolation', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();

    vi.mocked(createClient).mockImplementation(
      () => ({ mocked: true })
    );

    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows the approved staging project in Preview', () => {
    const result = getSupabaseAdmin(makeEnv());

    expect(result.error).toBeNull();
    expect(result.client).not.toBeNull();

    expect(createClient).toHaveBeenCalledExactlyOnceWith(
      STAGING_URL,
      PLACEHOLDER_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  });

  it('allows the approved Production project', () => {
    const result = getSupabaseAdmin(makeProductionEnv());

    expect(result.error).toBeNull();
    expect(result.client).not.toBeNull();

    expect(createClient).toHaveBeenCalledExactlyOnceWith(
      PRODUCTION_URL,
      PLACEHOLDER_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  });

  it.each([
    PRODUCTION_URL,
    'https://other-project.supabase.co',
    'https://bvwxgetdaojkdjqpcmci.supabase.co.evil.example'
  ])('rejects unauthorized Preview target: %s', (url) => {
    expectRejected(makeEnv({ SUPABASE_URL: url }));
  });

  it.each([
    STAGING_URL,
    'https://other-project.supabase.co',
    'https://jdqacsksryqfvfzejsbv.supabase.co.evil.example'
  ])('rejects unauthorized Production target: %s', (url) => {
    expectRejected(
      makeProductionEnv({ SUPABASE_URL: url })
    );
  });

  it.each([
    undefined,
    null,
    '',
    'unknown',
    'Preview',
    'production'
  ])('rejects invalid Preview scope: %s', (scope) => {
    expectRejected(
      makeEnv({ ONEED_DEPLOYMENT_SCOPE: scope })
    );
  });

  it.each([
    undefined,
    null,
    '',
    'unknown',
    'Production',
    'preview'
  ])('rejects invalid Production scope: %s', (scope) => {
    expectRejected(
      makeProductionEnv({ ONEED_DEPLOYMENT_SCOPE: scope })
    );
  });

  it.each([
    undefined,
    null,
    '',
    'main',
    'unexpected-branch',
    PRODUCTION_BRANCH
  ])('rejects invalid Preview branch: %s', (branch) => {
    expectRejected(
      makeEnv({ CF_PAGES_BRANCH: branch })
    );
  });

  it.each([
    undefined,
    null,
    '',
    'main',
    'unexpected-branch',
    PREVIEW_BRANCH
  ])('rejects invalid Production branch: %s', (branch) => {
    expectRejected(
      makeProductionEnv({ CF_PAGES_BRANCH: branch })
    );
  });

  it.each([
    'http://bvwxgetdaojkdjqpcmci.supabase.co',
    'https://bvwxgetdaojkdjqpcmci.supabase.co/path',
    'https://bvwxgetdaojkdjqpcmci.supabase.co?debug=true',
    'https://bvwxgetdaojkdjqpcmci.supabase.co#fragment',
    'https://bvwxgetdaojkdjqpcmci.supabase.co:8443',
    'https://user:password@bvwxgetdaojkdjqpcmci.supabase.co',
    'not-a-url'
  ])('rejects malformed Supabase URL: %s', (url) => {
    expectRejected(makeEnv({ SUPABASE_URL: url }));
  });

  it.each([
    undefined,
    null,
    '',
    '   ',
    123
  ])('rejects missing or invalid Supabase URL: %s', (url) => {
    expectRejected(
      makeEnv({ SUPABASE_URL: url }),
      true
    );
  });

  it.each([
    undefined,
    null,
    '',
    '   ',
    123
  ])('rejects missing or invalid credentials: %s', (key) => {
    expectRejected(
      makeEnv({ SUPABASE_SERVICE_ROLE_KEY: key }),
      true
    );
  });

  it('rejects missing environment configuration', () => {
    expectRejected(undefined, true);
  });

  it('sanitizes client initialization exceptions', () => {
    const sensitiveMarker = 'sensitive-test-marker';

    vi.mocked(createClient).mockImplementationOnce(() => {
      throw new Error(sensitiveMarker);
    });

    const result = getSupabaseAdmin(makeEnv());

    expect(result.client).toBeNull();

    expect(result.error).toBe(
      'Supabase server configuration is invalid'
    );

    expect(console.error).toHaveBeenCalledExactlyOnceWith(
      'Supabase initialization failed:',
      'SUPABASE_INIT_FAILED'
    );

    expect(JSON.stringify(result)).not.toContain(
      sensitiveMarker
    );

    expect(JSON.stringify(console.error.mock.calls))
      .not.toContain(sensitiveMarker);
  });

  it('does not log credentials from malformed URLs', () => {
    const sensitiveMarker = 'sensitive-test-password';

    expectRejected(
      makeEnv({
        SUPABASE_URL:
          `https://user:${sensitiveMarker}@bvwxgetdaojkdjqpcmci.supabase.co`
      })
    );

    expect(console.error).toHaveBeenCalledExactlyOnceWith(
      'Supabase initialization failed:',
      'SUPABASE_URL_INVALID'
    );

    expect(JSON.stringify(console.error.mock.calls))
      .not.toContain(sensitiveMarker);
  });
});
