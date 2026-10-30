const { rateLimit, getIp } = require('./_ratelimit');

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-4o-mini';

function parseRequestBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (_) {
      return {};
    }
  }
  return body;
}

function extractReplyText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const chunk of content) {
      if (typeof chunk?.text === 'string' && chunk.text.trim()) {
        return chunk.text.trim();
      }
    }
  }

  return '';
}

function buildFallbackReply(userText) {
  const text = (userText || '').toLowerCase();
  if (text.includes('course') || text.includes('program')) {
    return 'Oneed offers short courses, workshops and training, conferences, and professional development. Share your goal and I can guide you to the best option.';
  }
  if (text.includes('grant') || text.includes('scholarship')) {
    return 'For grants and scholarship opportunities, visit the Grants page and contact info@oneedinstitute.ca for current application guidance.';
  }
  if (text.includes('conference') || text.includes('event')) {
    return 'You can find conference and event information on the Conferences page. If you want, I can also suggest which section to start with.';
  }
  if (text.includes('contact') || text.includes('email') || text.includes('phone')) {
    return 'You can contact Oneed at info@oneedinstitute.ca or by phone at (226) 753-2321.';
  }
  return 'I can help with Oneed services, admissions guidance, conferences, grants, and partnerships. You can also reach info@oneedinstitute.ca for direct support.';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getIp(req);
  const { allowed } = rateLimit(`chat:${ip}`, 20, 60 * 60 * 1000); // 20 per hour
  if (!allowed) {
    return res.status(429).json({ error: 'Too many messages. Please try again later.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
  }

  const body = parseRequestBody(req.body);
  const incomingMessages = Array.isArray(body?.messages) ? body.messages : [];
  const latestUserMessage = [...incomingMessages].reverse().find((message) => message?.role === 'user');
  const fallbackReply = buildFallbackReply(latestUserMessage?.content);

  const messages = incomingMessages
    .filter((message) => (
      message &&
      (message.role === 'user' || message.role === 'assistant') &&
      typeof message.content === 'string' &&
      message.content.trim()
    ))
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.content.trim()
    }));

  const hasUserMessage = messages.some((message) => message.role === 'user');
  if (!hasUserMessage) {
    return res.status(400).json({ error: 'At least one user message is required' });
  }

  const systemPrompt = [
    'You are the Oneed Research Institute virtual assistant.',
    'Be concise, clear, and helpful.',
    'Only claim services that are visible on this site: short courses, workshops and training, conferences and seminars, professional development, and consultations.',
    'If unsure, ask a short clarifying question and suggest contacting info@oneedinstitute.ca for official confirmation.'
  ].join(' ');

  try {
    const openAIResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        input: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...messages
        ],
        max_output_tokens: 280
      })
    });

    const raw = await openAIResponse.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (_) {
      data = { raw };
    }

    if (!openAIResponse.ok) {
      return res.status(200).json({ reply: fallbackReply });
    }

    const reply = extractReplyText(data);
    if (!reply) {
      return res.status(502).json({ error: 'No assistant reply generated' });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(200).json({ reply: fallbackReply });
  }
};
