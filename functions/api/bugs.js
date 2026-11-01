import { getSupabaseAdmin } from '../_lib/supabase.js';
import { getClientIp, rateLimit } from '../_lib/ratelimit.js';

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers
    }
  });

async function readJsonBody(request, maxBytes = 16384) {
  const declaredLength = request.headers.get('Content-Length');

  if (declaredLength !== null) {
    const length = Number(declaredLength);

    if (!Number.isSafeInteger(length) || length < 0) {
      return { error: 'Invalid Content-Length', status: 400 };
    }

    if (length > maxBytes) {
      return { error: 'Request body is too large', status: 413 };
    }
  }

  if (!request.body) {
    return { error: 'Invalid JSON request body', status: 400 };
  }

  const reader = request.body.getReader();

  try {
    const chunks = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => {});
        return { error: 'Request body is too large', status: 413 };
      }

      chunks.push(value);
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const raw = new TextDecoder('utf-8', {
      fatal: true
    }).decode(bytes);

    const body = JSON.parse(raw);

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return { error: 'Invalid request body', status: 400 };
    }

    return { body };
  } catch {
    return { error: 'Invalid JSON request body', status: 400 };
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }
}

function getOptionalBearerToken(request) {
  const header = request.headers.get('Authorization');

  if (!header) return null;

  const match = /^Bearer ([^\s]+)$/.exec(header);

  return match ? match[1] : null;
}

export async function onRequestPost({ request, env }) {
  try {
    const ip = getClientIp(request);

    const { allowed, remaining, resetInMs } = await rateLimit(
      env,
      `bugs:${ip}`,
      10,
      60 * 60 * 1000
    );

    if (!allowed) {
      return json(
        { error: 'Too many requests. Please try again later.' },
        429,
        {
          'X-RateLimit-Remaining': String(remaining),
          'Retry-After': String(
            Math.max(1, Math.ceil(resetInMs / 1000))
          )
        }
      );
    }
  } catch (error) {
    console.error('Bug-report rate-limit failure:', error.message);

    return json(
      {
        error: 'The service is temporarily unavailable. Please try again later.'
      },
      503
    );
  }

  const parsed = await readJsonBody(request);

  if (parsed.error) {
    return json({ error: parsed.error }, parsed.status);
  }

  const body = parsed.body;

  const title = typeof body.title === 'string'
    ? body.title.trim() : '';

  const description = typeof body.description === 'string'
    ? body.description.trim() : '';

  const reporterEmail = typeof body.reporter_email === 'string'
    ? body.reporter_email.trim() : '';

  const severity = typeof body.severity === 'string'
    ? body.severity.trim() || 'medium' : 'medium';

  const pageUrl = typeof body.page_url === 'string'
    ? body.page_url.trim() : '';

  if (!title || !description) {
    return json(
      { error: 'Title and description are required' },
      400
    );
  }

  if (
    title.length > 200 ||
    description.length > 10000 ||
    reporterEmail.length > 254 ||
    pageUrl.length > 2048
  ) {
    return json({ error: 'One or more fields are too long' }, 400);
  }

  if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
    return json({ error: 'Invalid severity' }, 400);
  }

  if (
    reporterEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)
  ) {
    return json({ error: 'Invalid reporter email' }, 400);
  }

  const { client, error: initError } = getSupabaseAdmin(env);

  if (initError || !client) {
    return json({ error: 'Database service is unavailable' }, 503);
  }

  let userId = null;
  const token = getOptionalBearerToken(request);

  if (token) {
    try {
      const { data, error } = await client.auth.getUser(token);

      if (!error && data?.user?.id) {
        userId = data.user.id;
      }
    } catch (error) {
      console.error('Optional user lookup failed:', error.message);
    }
  }

  try {
    const { error } = await client.from('bug_reports').insert({
      title,
      description,
      reporter_email: reporterEmail,
      severity,
      page_url: pageUrl,
      user_id: userId
    });

    if (error) {
      console.error('Bug-report insert failed:', error.message);
      return json({ error: 'Failed to submit bug report' }, 500);
    }
  } catch (error) {
    console.error('Bug-report database failure:', error.message);
    return json({ error: 'Failed to submit bug report' }, 500);
  }

  return json({ ok: true }, 201);
}
