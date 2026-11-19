const { getSupabaseAdmin } = require('./_supabaseAdmin');
const { rateLimit, getIp } = require('./_ratelimit');

function getOptionalBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }


  const ip = getIp(req);

  try {
    const { allowed, remaining, resetInMs } = await rateLimit(
      `bugs:${ip}`,
      10,
      60 * 60 * 1000
    );

    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (!allowed) {
      res.setHeader(
        'Retry-After',
        String(Math.max(1, Math.ceil(resetInMs / 1000)))
      );

      return res.status(429).json({
        error: 'Too many requests. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Bug-report rate-limit failure:', error.message);

    return res.status(503).json({
      error: 'The service is temporarily unavailable. Please try again later.'
    });
  }



const { client: supabaseAdmin, error: initError } = getSupabaseAdmin();

if (initError) {
  console.error('Bug-report Supabase initialization failure:', initError);

  return res.status(500).json({
    error: 'The service is temporarily unavailable. Please try again later.'
  });
}

let body;

try {
  body = typeof req.body === 'string'
    ? JSON.parse(req.body || '{}')
    : req.body || {};
} catch (error) {
  return res.status(400).json({
    error: 'Invalid JSON body'
  });
}

if (!body || typeof body !== 'object' || Array.isArray(body)) {
  return res.status(400).json({
    error: 'Invalid request body'
  });
}

  const title = typeof body.title === 'string' ? body.title.trim() : '';

if ([...title].length > 150) {
  return res.status(400).json({
    error: 'Title must be 150 characters or fewer'
  });
}

  const description = typeof body.description === 'string' ? body.description.trim() : '';

if ([...description].length > 5000) {
  return res.status(400).json({
    error: 'Description must be 5000 characters or fewer'
  });
}

  const reporterEmail = typeof body.reporter_email === 'string' ? body.reporter_email.trim() : '';

if (
  reporterEmail &&
  (
    reporterEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)
  )
) {
  return res.status(400).json({
    error: 'Invalid reporter email'
  });
}

  const severity = typeof body.severity === 'string' ? body.severity.trim() : 'medium';

const allowedSeverities = new Set([
  'low',
  'medium',
  'high'
]);

if (!allowedSeverities.has(severity)) {
  return res.status(400).json({
    error: 'Invalid severity'
  });
}

  const pageUrl = typeof body.page_url === 'string' ? body.page_url.trim() : '';

if ([...pageUrl].length > 2048) {
  return res.status(400).json({
    error: 'Page URL must be 2048 characters or fewer'
  });
}


  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }


let userId = null;
const token = getOptionalBearerToken(req);

if (token) {
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      if (error.status === 401 || error.status === 403) {
        return res.status(401).json({
          error: 'Invalid authentication token'
        });
      }

      console.error('Bug-report authentication failure:', error);

      return res.status(503).json({
        error: 'The service is temporarily unavailable. Please try again later.'
      });
    }

    userId = data?.user?.id || null;
  } catch (error) {
    console.error('Bug-report authentication exception:', error);

    return res.status(503).json({
      error: 'The service is temporarily unavailable. Please try again later.'
    });
  }
}

  const payload = {
    title,
    description,
    reporter_email: reporterEmail,
    severity,
    page_url: pageUrl,
    user_id: userId
  };


try {
  const { error } = await supabaseAdmin
    .from('bug_reports')
    .insert(payload);

  if (error) {
    console.error('Bug-report database error:', error);

    return res.status(500).json({
      error: 'Failed to submit bug report'
    });
  }

  return res.status(201).json({ ok: true });
} catch (error) {
  console.error('Bug-report database exception:', error);

  return res.status(503).json({
    error: 'The service is temporarily unavailable. Please try again later.'
  });
}
};
