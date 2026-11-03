export async function onRequest({ next }) {
  const response = await next();

  const headers = new Headers(response.headers);

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  headers.set(
    "Strict-Transport-Security",
    "max-age=31536000"
  );
  headers.set("Cache-Control", "no-store");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
