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
    signal: AbortSignal.timeout(10000),
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

  try {
    const { allowed, remaining, resetInMs } = await rateLimit(
      `consultations:${ip}`,
      5,
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
    console.error('Consultation rate-limit failure:', error.message);

    return res.status(503).json({
      error: 'The service is temporarily unavailable. Please try again later.'
    });
  }



const { client: supabaseAdmin, error: initError } = getSupabaseAdmin();

if (initError) {
  console.error('Consultation API initialization failed:', initError);

  return res.status(500).json({
    error: 'Internal server error'
  });
}


let body;

try {
  body =
    typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : req.body ?? {};

  if (
    typeof body !== 'object' ||
    body === null ||
    Array.isArray(body)
  ) {
    return res.status(400).json({
      error: 'Request body must be a JSON object'
    });
  }
} catch {
  return res.status(400).json({
    error: 'Invalid JSON request body'
  });
}

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const service = typeof body.service === 'string' ? body.service.trim() : 'consultation';
  const pageUrl = typeof body.page_url === 'string' ? body.page_url.trim() : '';


const fieldLimits = {
  name: 150,
  email: 254,
  service: 150,
  pageUrl: 2048
};

const submittedFields = { name, email, service, pageUrl };

for (const [field, maxLength] of Object.entries(fieldLimits)) {
  if ([...submittedFields[field]].length > maxLength) {
    return res.status(400).json({
      error: `${field} must not exceed ${maxLength} characters`
    });
  }
}

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }


const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailPattern.test(email)) {
  return res.status(400).json({
    error: 'Invalid email address'
  });
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


let emailNotified = false;

try {
  const emailResult = await sendConsultationEmail({
    name,
    email,
    service,
    pageUrl
  });

  emailNotified = emailResult.ok;

  if (!emailResult.ok) {
    console.error(
      'Consultation notification email failed:',
      emailResult.reason
    );
  }
} catch (error) {
  console.error(
    'Consultation notification email encountered an unexpected error:',
    error
  );
}

return res.status(201).json({
  ok: true,
  email_notified: emailNotified
});
};
