
export function onRequestGet({ env }) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };

  const scopeMatches =
    env?.ONEED_DEPLOYMENT_SCOPE === 'preview';

  const diagnosticEnabled =
    env?.ONEED_DIAGNOSTIC_ENABLED === 'true';

  const branchBindingPresent =
    typeof env?.CF_PAGES_BRANCH === 'string' &&
    env.CF_PAGES_BRANCH.length > 0;

  // Report only boolean results. Never log secret values.
  console.log('ONEED Preview diagnostic guard', {
    scopeMatches,
    diagnosticEnabled,
    branchBindingPresent,
  });

  if (!scopeMatches || !diagnosticEnabled) {
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers }
    );
  }

  return new Response(
    JSON.stringify({
      diagnostic: 'runtime-branch-presence',
      branchBindingPresent,
    }),
    { status: 200, headers }
  );
}
