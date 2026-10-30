const { getSupabaseAdmin } = require('./_supabaseAdmin');

function getBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

async function getAuthedUser(req, res) {
  const { client: supabaseAdmin, error: initError } = getSupabaseAdmin();
  if (initError) {
    res.status(500).json({ error: initError });
    return null;
  }

  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Missing bearer token' });
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }

  return data.user;
}

module.exports = async function handler(req, res) {
  if (!['GET', 'PUT'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { client: supabaseAdmin, error: initError } = getSupabaseAdmin();
  if (initError) {
    return res.status(500).json({ error: initError });
  }

  const user = await getAuthedUser(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const { data: existing, error: selectError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, phone, organization')
      .eq('id', user.id)
      .maybeSingle();

    if (selectError) {
      return res.status(500).json({ error: 'Failed to load profile' });
    }

    if (existing) {
      return res.status(200).json({ profile: existing });
    }

    const seedProfile = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.name || '',
      phone: '',
      organization: ''
    };

    const { data: created, error: insertError } = await supabaseAdmin
      .from('profiles')
      .upsert(seedProfile, { onConflict: 'id' })
      .select('id, email, full_name, phone, organization')
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to initialize profile' });
    }

    return res.status(200).json({ profile: created });
  }

  const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const updates = {
    id: user.id,
    email: user.email || '',
    full_name: typeof payload.full_name === 'string' ? payload.full_name.trim() : '',
    phone: typeof payload.phone === 'string' ? payload.phone.trim() : '',
    organization: typeof payload.organization === 'string' ? payload.organization.trim() : '',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert(updates, { onConflict: 'id' })
    .select('id, email, full_name, phone, organization')
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to save profile' });
  }

  return res.status(200).json({ profile: data });
};
