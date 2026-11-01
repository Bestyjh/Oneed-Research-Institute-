import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin(env) {
  const supabaseUrl = env?.SUPABASE_URL;
  const serviceRoleKey = env?.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      client: null,
      error: 'Supabase server configuration is unavailable'
    };
  }

  try {
    const url = new URL(supabaseUrl);

    if (
      url.protocol !== 'https:' ||
      !url.hostname.endsWith('.supabase.co') ||
      url.pathname !== '/'
    ) {
      throw new Error('Invalid Supabase URL');
    }

    const client = createClient(
      url.origin,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    return {
      client,
      error: null
    };
  } catch (error) {
    console.error('Supabase initialization failed:', error.message);

    return {
      client: null,
      error: 'Supabase server configuration is invalid'
    };
  }
}
