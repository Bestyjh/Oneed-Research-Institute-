import { describe, expect, it } from 'vitest';
import { onRequestGet } from './preview-diagnostic.js';

const stagingUrl = 'https://bvwxgetdaojkdjqpcmci.supabase.co';
const productionUrl = 'https://jdqacsksryqfvfzejsbv.supabase.co';

const enabledEnv = {
  ONEED_DEPLOYMENT_SCOPE: 'preview',
  ONEED_DIAGNOSTIC_ENABLED: 'true',
  SUPABASE_URL: stagingUrl,
};

describe('Preview diagnostic endpoint security', () => {
  it.each([
    {},
    { ONEED_DEPLOYMENT_SCOPE: 'preview' },
    { ONEED_DIAGNOSTIC_ENABLED: 'true' },
    { ...enabledEnv, ONEED_DEPLOYMENT_SCOPE: 'production' },
    { ...enabledEnv, ONEED_DIAGNOSTIC_ENABLED: 'false' },
  ])('returns 404 when the diagnostic guard is not satisfied', async (env) => {
    const response = onRequestGet({ env });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Not found' });
  });

  it('identifies the staging Supabase project', async () => {
    const response = onRequestGet({ env: enabledEnv });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      diagnostic: 'supabase-target',
      target: 'staging',
    });
  });

  it('identifies the production Supabase project', async () => {
    const response = onRequestGet({
      env: { ...enabledEnv, SUPABASE_URL: productionUrl },
    });

    expect(response.status).toBe(200);
    expect((await response.json()).target).toBe('production');
  });

  it('returns unknown for invalid configuration', async () => {
    const response = onRequestGet({
      env: { ...enabledEnv, SUPABASE_URL: 'invalid-url' },
    });

    expect(response.status).toBe(200);
    expect((await response.json()).target).toBe('unknown');
  });

  it('does not disclose Supabase credentials', async () => {
    const response = onRequestGet({
      env: {
        ...enabledEnv,
        SUPABASE_SERVICE_ROLE_KEY: 'test-secret-value',
      },
    });

    const body = await response.text();

    expect(body).not.toContain(stagingUrl);
    expect(body).not.toContain('test-secret-value');
  });
});
