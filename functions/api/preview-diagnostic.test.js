
import { describe, expect, it } from 'vitest';
import { onRequestGet } from './preview-diagnostic.js';

const enabledEnv = {
  ONEED_DEPLOYMENT_SCOPE: 'preview',
  ONEED_DIAGNOSTIC_ENABLED: 'true',
};

describe('Preview runtime diagnostic security', () => {
  it.each([
    {},
    { ONEED_DEPLOYMENT_SCOPE: 'preview' },
    { ONEED_DIAGNOSTIC_ENABLED: 'true' },
    { ...enabledEnv, ONEED_DEPLOYMENT_SCOPE: 'production' },
    { ...enabledEnv, ONEED_DIAGNOSTIC_ENABLED: 'false' },
  ])('returns 404 when the diagnostic guard is not satisfied', async (env) => {
    const response = onRequestGet({ env });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Not found',
    });
  });

  it('reports when the runtime branch binding is present', async () => {
    const response = onRequestGet({
      env: {
        ...enabledEnv,
        CF_PAGES_BRANCH: 'security/vite-migration',
      },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      diagnostic: 'runtime-branch-presence',
      branchBindingPresent: true,
    });
  });

  it.each([
    undefined,
    null,
    '',
    123,
  ])('reports missing or invalid branch binding: %s', async (branch) => {
    const response = onRequestGet({
      env: {
        ...enabledEnv,
        CF_PAGES_BRANCH: branch,
      },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      diagnostic: 'runtime-branch-presence',
      branchBindingPresent: false,
    });
  });

  it('does not disclose branch names or credentials', async () => {
    const branch = 'security/vite-migration';
    const secret = 'test-secret-value';
    const supabaseUrl =
      'https://bvwxgetdaojkdjqpcmci.supabase.co';

    const response = onRequestGet({
      env: {
        ...enabledEnv,
        CF_PAGES_BRANCH: branch,
        SUPABASE_URL: supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: secret,
      },
    });

    const body = await response.text();

    expect(body).not.toContain(branch);
    expect(body).not.toContain(secret);
    expect(body).not.toContain(supabaseUrl);
  });

  it('disables caching of diagnostic responses', () => {
    const response = onRequestGet({ env: enabledEnv });

    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
