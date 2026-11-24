import { createClient } from '@supabase/supabase-js';

const STAGING_HOST = 'bvwxgetdaojkdjqpcmci.supabase.co';
const PRODUCTION_HOST = 'jdqacsksryqfvfzejsbv.supabase.co';

const PREVIEW_BRANCH = 'security/vite-migration';
const PRODUCTION_BRANCH = 'security/shared-rate-limiting';

function rejectConfiguration(code, missing = false) {
  console.error('Supabase initialization failed:', code);

  return {
    client: null,
    error: missing
      ? 'Supabase server configuration is unavailable'
      : 'Supabase server configuration is invalid'
  };
}

export function getSupabaseAdmin(env) {
  const supabaseUrl = env?.SUPABASE_URL;
  const serviceRoleKey = env?.SUPABASE_SERVICE_ROLE_KEY;

  if (
    typeof supabaseUrl !== 'string' ||
    !supabaseUrl.trim() ||
    typeof serviceRoleKey !== 'string' ||
    !serviceRoleKey.trim()
  ) {
    return rejectConfiguration('SUPABASE_CONFIG_MISSING', true);
  }

  const scope = env?.ONEED_DEPLOYMENT_SCOPE;
  const branch = env?.CF_PAGES_BRANCH;

  if (scope !== 'preview' && scope !== 'production') {
    return rejectConfiguration('DEPLOYMENT_SCOPE_INVALID');
  }

  const expectedBranch =
    scope === 'preview' ? PREVIEW_BRANCH : PRODUCTION_BRANCH;

  const expectedHost =
    scope === 'preview' ? STAGING_HOST : PRODUCTION_HOST;

  if (branch !== expectedBranch) {
    return rejectConfiguration('DEPLOYMENT_BRANCH_INVALID');
  }

  let url;

  try {
    url = new URL(supabaseUrl);
  } catch {
    return rejectConfiguration('SUPABASE_URL_INVALID');
  }

  if (
    url.protocol !== 'https:' ||
    !url.hostname.endsWith('.supabase.co') ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password ||
    url.port
  ) {
    return rejectConfiguration('SUPABASE_URL_INVALID');
  }

  if (url.hostname !== expectedHost) {
    return rejectConfiguration('SUPABASE_TARGET_MISMATCH');
  }

  try {
    const client = createClient(url.origin, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    return {
      client,
      error: null
    };
  } catch {
    return rejectConfiguration('SUPABASE_INIT_FAILED');
  }
}
