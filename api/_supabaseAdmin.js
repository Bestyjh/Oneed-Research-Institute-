const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    return {
      client: null,
      error: 'Missing SUPABASE_URL (or REACT_APP_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY'
    };
  }

  try {
    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    return { client, error: null };
  } catch (error) {
    return { client: null, error: error?.message || 'Failed to initialize Supabase client' };
  }
}

module.exports = { getSupabaseAdmin };
