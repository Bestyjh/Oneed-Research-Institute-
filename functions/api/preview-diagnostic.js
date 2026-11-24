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

  const branchMatches =
    env?.CF_PAGES_BRANCH === 'security/vite-migration';

  // Report only boolean results. Never log secret values.
  console.log('ONEED Preview diagnostic guard', {
    scopeMatches,
    diagnosticEnabled,
    branchBindingPresent,
    branchMatches,
  });

  if (!scopeMatches || !diagnosticEnabled) {
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers }
    );
  }

  return new Response(
    JSON.stringify({
      diagnostic: 'runtime-branch-verification',
      branchBindingPresent,
      branchMatches,
    }),
    { status: 200, headers }
  );
}
