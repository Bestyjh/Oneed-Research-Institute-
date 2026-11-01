import { getSupabaseAdmin } from '../_lib/supabase.js';

const PROFILE_COLUMNS =
  'id, email, full_name, phone, organization';

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers
    }
  });

function getBearerToken(request) {
  const header = request.headers.get('Authorization');

  if (!header) return null;

  const match = /^Bearer ([^\s]+)$/.exec(header);

  return match ? match[1] : null;
}

async function authenticate(request, env) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      error: json({ error: 'Missing bearer token' }, 401)
    };
  }

  const { client, error } = getSupabaseAdmin(env);

  if (error || !client) {
    return {
      error: json(
        { error: 'Database service is unavailable' },
        503
      )
    };
  }

  try {
    const { data, error: authError } =
      await client.auth.getUser(token);

    if (authError || !data?.user?.id) {
      return {
        error: json(
          { error: 'Invalid or expired token' },
          401
        )
      };
    }

    return { client, user: data.user };
  } catch (error) {
    console.error('Profile authentication failed:', error.message);

    return {
      error: json(
        { error: 'Authentication service is unavailable' },
        503
      )
    };
  }
}

async function readJsonBody(request, maxBytes = 4096) {
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

        return {
          error: 'Request body is too large',
          status: 413
        };
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

export async function onRequestGet({ request, env }) {
  const auth = await authenticate(request, env);

  if (auth.error) return auth.error;

  const { client, user } = auth;

  try {
    const { data: existing, error } = await client
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Profile lookup failed:', error.message);

      return json({ error: 'Failed to load profile' }, 500);
    }

    if (existing) {
      return json({ profile: existing });
    }

    const seedProfile = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.name || '',
      phone: '',
      organization: ''
    };

    const { data: created, error: insertError } = await client
      .from('profiles')
      .upsert(seedProfile, { onConflict: 'id' })
      .select(PROFILE_COLUMNS)
      .single();

    if (insertError) {
      console.error(
        'Profile initialization failed:',
        insertError.message
      );

      return json(
        { error: 'Failed to initialize profile' },
        500
      );
    }

    return json({ profile: created });
  } catch (error) {
    console.error('Profile GET failed:', error.message);

    return json({ error: 'Failed to load profile' }, 500);
  }
}

export async function onRequestPut({ request, env }) {
  const auth = await authenticate(request, env);

  if (auth.error) return auth.error;

  const parsed = await readJsonBody(request);

  if (parsed.error) {
    return json({ error: parsed.error }, parsed.status);
  }

  const { client, user } = auth;
  const body = parsed.body;

  const fields = ['full_name', 'phone', 'organization'];

  for (const field of fields) {
    if (
      Object.prototype.hasOwnProperty.call(body, field) &&
      typeof body[field] !== 'string'
    ) {
      return json(
        { error: `Invalid ${field} field` },
        400
      );
    }
  }

  const maxLengths = {
    full_name: 200,
    phone: 50,
    organization: 200
  };

  const updates = {
    email: user.email || '',
    updated_at: new Date().toISOString()
  };

  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      const value = body[field].trim();

      if (value.length > maxLengths[field]) {
        return json(
          { error: 'One or more fields are too long' },
          400
        );
      }

      updates[field] = value;
    }
  }

  if (!fields.some((field) =>
    Object.prototype.hasOwnProperty.call(body, field)
  )) {
    return json(
      { error: 'No profile fields provided' },
      400
    );
  }
  try {
    const { data, error } = await client
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select(PROFILE_COLUMNS)
      .single();

    if (error) {
      console.error('Profile update failed:', error.message);

      return json({ error: 'Failed to save profile' }, 500);
    }

    return json({ profile: data });
  } catch (error) {
    console.error('Profile PUT failed:', error.message);

    return json({ error: 'Failed to save profile' }, 500);
  }
}
