import { classifySupabaseTarget } from '../_lib/preview-diagnostic.js';

export function onRequestGet({ env }) {
  if (
    env?.ONEED_DEPLOYMENT_SCOPE !== 'preview' ||
    env?.ONEED_DIAGNOSTIC_ENABLED !== 'true'
  ) {
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  const target = classifySupabaseTarget(env?.SUPABASE_URL);

  return new Response(
    JSON.stringify({
      diagnostic: 'supabase-target',
      target,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    }
  );
}
