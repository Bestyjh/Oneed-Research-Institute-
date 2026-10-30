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
  const { allowed } = rateLimit(`bugs:${ip}`, 10, 60 * 60 * 1000); // 10 per hour
  if (!allowed) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { client: supabaseAdmin, error: initError } = getSupabaseAdmin();
  if (initError) {
    return res.status(500).json({ error: initError });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const reporterEmail = typeof body.reporter_email === 'string' ? body.reporter_email.trim() : '';
  const severity = typeof body.severity === 'string' ? body.severity.trim() : 'medium';
  const pageUrl = typeof body.page_url === 'string' ? body.page_url.trim() : '';

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  let userId = null;
  const token = getOptionalBearerToken(req);
  if (token) {
    const { data } = await supabaseAdmin.auth.getUser(token);
    userId = data?.user?.id || null;
  }

  const payload = {
    title,
    description,
    reporter_email: reporterEmail,
    severity,
    page_url: pageUrl,
    user_id: userId
  };

  const { error } = await supabaseAdmin.from('bug_reports').insert(payload);
  if (error) {
    return res.status(500).json({ error: 'Failed to submit bug report' });
  }

  return res.status(201).json({ ok: true });
};
