const STAGING_HOST = 'bvwxgetdaojkdjqpcmci.supabase.co';
const PRODUCTION_HOST = 'jdqacsksryqfvfzejsbv.supabase.co';

export function classifySupabaseTarget(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return 'unknown';
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== 'https:' ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      url.username ||
      url.password ||
      url.port
    ) {
      return 'unknown';
    }

    if (url.hostname === STAGING_HOST) {
      return 'staging';
    }

    if (url.hostname === PRODUCTION_HOST) {
      return 'production';
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}
