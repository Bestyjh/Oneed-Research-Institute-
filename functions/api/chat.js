import { rateLimit, getClientIp } from '../_lib/ratelimit.js';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_BODY_BYTES = 16384;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES = 12;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers
    }
  });
}

async function readJsonBody(request) {
  const declaredLength = request.headers.get('Content-Length');

  if (declaredLength !== null) {
    const length = Number(declaredLength);

    if (!Number.isSafeInteger(length) || length < 0) {
      return { error: 'Invalid Content-Length', status: 400 };
    }

    if (length > MAX_BODY_BYTES) {
      return { error: 'Request body is too large', status: 413 };
    }
  }

  if (!request.body) {
    return { error: 'Invalid JSON request body', status: 400 };
  }

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > MAX_BODY_BYTES) {
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

    const raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
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

function extractReplyText(payload) {
  if (
    typeof payload?.output_text === 'string' &&
    payload.output_text.trim()
  ) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];

  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];

    for (const chunk of content) {
      if (
        typeof chunk?.text === 'string' &&
        chunk.text.trim()
      ) {
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
    return 'You can find conference and event information on the Conferences page. Please check the website for current details.';
  }

  if (text.includes('contact') || text.includes('email')) {
    return 'You can contact Oneed at info@oneedinstitute.ca.';
  }

  return 'I can help with Oneed services, training, conferences, and partnerships. You can also contact info@oneedinstitute.ca for official information.';
}

export async function onRequestPost({ request, env }) {
  const ip = getClientIp(request);

  if (!ip) {
    return json({ error: 'Unable to verify request origin' }, 503);
  }

  let limit;

  try {
    limit = await rateLimit(
      env,
      `chat:${ip}`,
      20,
      60 * 60 * 1000
    );
  } catch (error) {
    console.error('Chat rate-limit failure:', error.message);

    return json({
      error: 'The service is temporarily unavailable'
    }, 503);
  }

  if (!limit || typeof limit.allowed !== 'boolean') {
    return json({ error: 'The service is temporarily unavailable' }, 503);
  }

  const remaining = String(Math.max(0, limit.remaining ?? 0));

  if (!limit.allowed) {
    return json({
      error: 'Too many messages. Please try again later.'
    }, 429, {
      'X-RateLimit-Remaining': remaining,
      'Retry-After': String(
        Math.max(1, Math.ceil((limit.resetInMs || 1000) / 1000))
      )
    });
  }

  const parsed = await readJsonBody(request);

  if (parsed.error) {
    return json({ error: parsed.error }, parsed.status);
  }

  const incomingMessages = parsed.body.messages;

  if (!Array.isArray(incomingMessages)) {
    return json({ error: 'Messages must be an array' }, 400);
  }

  const messages = incomingMessages.slice(-MAX_MESSAGES);

  if (
    messages.length === 0 ||
    messages.some(message =>
      !message ||
      typeof message !== 'object' ||
      (message.role !== 'user' && message.role !== 'assistant') ||
      typeof message.content !== 'string' ||
      !message.content.trim() ||
      message.content.length > MAX_MESSAGE_LENGTH
    )
  ) {
    return json({ error: 'Invalid chat messages' }, 400);
  }

  if (!messages.some(message => message.role === 'user')) {
    return json({
      error: 'At least one user message is required'
    }, 400);
  }

  const normalizedMessages = messages.map(message => ({
    role: message.role,
    content: message.content.trim()
  }));

  const latestUserMessage = [...normalizedMessages]
    .reverse()
    .find(message => message.role === 'user');

  const fallbackReply = buildFallbackReply(
    latestUserMessage?.content
  );

  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('Chat API configuration missing');
    return json({ error: 'The service is temporarily unavailable' }, 503);
  }

  const systemPrompt = [
    'You are the Oneed Research Institute virtual assistant.',
    'Be concise, clear, and helpful.',
    'Only claim services visible on this site: short courses, workshops and training, conferences and seminars, professional development, and consultations.',
    'If unsure, ask a clarifying question and suggest contacting info@oneedinstitute.ca for official confirmation.'
  ].join(' ');

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || DEFAULT_MODEL,
        input: [
          { role: 'system', content: systemPrompt },
          ...normalizedMessages
        ],
        max_output_tokens: 280
      }),
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      console.error('OpenAI request failed:', response.status);
      return json({ reply: fallbackReply });
    }

    const payload = await response.json();
    const reply = extractReplyText(payload);

    if (!reply) {
      return json({ reply: fallbackReply });
    }

    return json({ reply });
  } catch (error) {
    console.error('Chat upstream request failed:', error.message);
    return json({ reply: fallbackReply });
  }
}
