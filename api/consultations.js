const { getSupabaseAdmin } = require('./_supabaseAdmin');
const { rateLimit, getIp } = require('./_ratelimit');

async function sendConsultationEmail({ name, email, service, pageUrl }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL_TO || 'info@oneedinstitute.ca';
  const from = process.env.CONTACT_EMAIL_FROM || 'Oneed Institute <onboarding@resend.dev>';

  if (!apiKey) {
    return { ok: false, skipped: true, reason: 'Missing RESEND_API_KEY' };
  }

  const lines = [
    'New consultation request received.',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Service: ${service}`,
    `Page URL: ${pageUrl || '-'}`,
    `Time (UTC): ${new Date().toISOString()}`
  ];

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
    })
  });

  if (!response.ok) {
    const raw = await response.text();
    return { ok: false, skipped: false, reason: raw || 'Failed to send email' };
  }

  return { ok: true };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getIp(req);
  const { allowed } = rateLimit(`consultations:${ip}`, 5, 60 * 60 * 1000); // 5 per hour
  if (!allowed) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { client: supabaseAdmin, error: initError } = getSupabaseAdmin();
  if (initError) {
    return res.status(500).json({ error: initError });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const service = typeof body.service === 'string' ? body.service.trim() : 'consultation';
  const pageUrl = typeof body.page_url === 'string' ? body.page_url.trim() : '';

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const { error } = await supabaseAdmin.from('consultation_requests').insert({
    name,
    email,
    service,
    page_url: pageUrl
  });

  if (error) {
    return res.status(500).json({ error: 'Failed to submit consultation request' });
  }

  const emailResult = await sendConsultationEmail({ name, email, service, pageUrl });
  if (!emailResult.ok) {
    console.error('Consultation notification email failed:', emailResult.reason);
  }

  return res.status(201).json({ ok: true, email_notified: emailResult.ok });
};
