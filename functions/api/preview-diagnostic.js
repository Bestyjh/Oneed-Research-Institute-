
export function onRequestGet({ env }) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };

  if (
    env?.ONEED_DEPLOYMENT_SCOPE !== 'preview' ||
    env?.ONEED_DIAGNOSTIC_ENABLED !== 'true'
  ) {
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers }
    );
  }

  return new Response(
    JSON.stringify({
      diagnostic: 'runtime-branch-presence',
      branchBindingPresent:
        typeof env?.CF_PAGES_BRANCH === 'string' &&
        env.CF_PAGES_BRANCH.length > 0,
    }),
    { status: 200, headers }
  );
}
