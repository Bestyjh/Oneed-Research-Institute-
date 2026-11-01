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

async function sendConsultationEmail(env, details) {
  const apiKey = env.RESEND_API_KEY;
  const to = env.CONTACT_EMAIL_TO || 'info@oneedinstitute.ca';
  const from =
    env.CONTACT_EMAIL_FROM ||
    'Oneed Institute <onboarding@resend.dev>';

  if (!apiKey) {
    return { ok: false, reason: 'Email service not configured' };
  }

  const { name, email, service, pageUrl } = details;

  const lines = [
    'New consultation request received.',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Service: ${service}`,
    `Page URL: ${pageUrl || '-'}`,
    `Time (UTC): ${new Date().toISOString()}`
  ];

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `New Consultation Request - ${service}`,
        text: lines.join('\n')
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error('Resend notification failed:', response.status);
      return { ok: false };
    }

    return { ok: true };
  } catch (error) {
    console.error('Resend request failed:', error.message);
    return { ok: false };
  }
}

export async function onRequestPost({ request, env }) {
  let ip;

  try {
    ip = getClientIp(request);

    const { allowed, remaining, resetInMs } = await rateLimit(
      env,
      `consultations:${ip}`,
      5,
      60 * 60 * 1000
    );

    const rateHeaders = {
      'X-RateLimit-Remaining': String(remaining)
    };

    if (!allowed) {
      return json(
        { error: 'Too many requests. Please try again later.' },
        429,
        {
          ...rateHeaders,
          'Retry-After': String(
            Math.max(1, Math.ceil(resetInMs / 1000))
          )
        }
      );
    }
  } catch (error) {
    console.error('Consultation rate-limit failure:', error.message);

    return json(
      {
        error: 'The service is temporarily unavailable. Please try again later.'
      },
      503
    );
  }

  const MAX_BODY_BYTES = 8192;
  const declaredLength = request.headers.get('Content-Length');

  if (declaredLength !== null) {
    const length = Number(declaredLength);

    if (!Number.isSafeInteger(length) || length < 0) {
      return json({ error: 'Invalid Content-Length' }, 400);
    }

    if (length > MAX_BODY_BYTES) {
      return json({ error: 'Request body is too large' }, 413);
    }
  }

  let body;
  let reader;

  try {
    if (!request.body) {
      return json({ error: 'Invalid JSON request body' }, 400);
    }

    reader = request.body.getReader();

    const chunks = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > MAX_BODY_BYTES) {
        reader.cancel().catch(() => {});
        return json({ error: 'Request body is too large' }, 413);
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

    body = JSON.parse(raw);

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json({ error: 'Invalid request body' }, 400);
    }
  } catch {
    return json({ error: 'Invalid JSON request body' }, 400);
  } finally {
    if (reader) {
      try {
        reader.releaseLock();
      } catch {}
    }
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const service =
    typeof body.service === 'string'
      ? body.service.trim() || 'consultation'
      : 'consultation';
  const pageUrl =
    typeof body.page_url === 'string' ? body.page_url.trim() : '';

  if (!name || !email) {
    return json({ error: 'Name and email are required' }, 400);
  }

  if (
    name.length > 150 ||
    email.length > 254 ||
    service.length > 200 ||
    pageUrl.length > 2048
  ) {
    return json({ error: 'One or more fields are too long' }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'A valid email address is required' }, 400);
  }

  const { client, error: initError } = getSupabaseAdmin(env);

  if (initError || !client) {
    return json({ error: 'Database service is unavailable' }, 503);
  }

  try {
    const { error } = await client
      .from('consultation_requests')
      .insert({
        name,
        email,
        service,
        page_url: pageUrl
      });

    if (error) {
      console.error('Consultation insert failed:', error.message);
      return json(
        { error: 'Failed to submit consultation request' },
        500
      );
    }
  } catch (error) {
    console.error('Consultation database failure:', error.message);
    return json(
      { error: 'Failed to submit consultation request' },
      500
    );
  }

  const emailResult = await sendConsultationEmail(env, {
    name,
    email,
    service,
    pageUrl
  });

  return json(
    { ok: true, email_notified: emailResult.ok },
    201
  );
}
