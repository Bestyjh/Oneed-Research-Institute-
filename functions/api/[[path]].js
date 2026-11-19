export async function onRequest() {
  return new Response(
    JSON.stringify({
      error: "API endpoint not found"
    }),
    {
      status: 404,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    }
  );
}
