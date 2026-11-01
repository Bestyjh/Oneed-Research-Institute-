
const crypto = require('node:crypto');
const { getSupabaseAdmin } = require('./_supabaseAdmin');

function getIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded;

  return (
    forwardedValue?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

async function rateLimit(key, limit, windowMs) {
  if (
    typeof key !== 'string' ||
    !key ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 10000 ||
    !Number.isInteger(windowMs) ||
    windowMs < 1000 ||
    windowMs > 86400000
  ) {
    throw new Error('Invalid rate-limit parameters');
  }

  const secret = process.env.RATE_LIMIT_HASH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('RATE_LIMIT_HASH_SECRET is not configured');
  }

  const { client, error: initError } = getSupabaseAdmin();

  if (initError || !client) {
    throw new Error('Rate-limit database is unavailable');
  }

  const keyHash = crypto
    .createHmac('sha256', secret)
    .update(key)
    .digest('hex');

  const { data, error } = await client.rpc(
    'check_api_rate_limit',
    {
      p_key_hash: keyHash,
      p_limit: limit,
      p_window_seconds: Math.ceil(windowMs / 1000)
    }
  );

  if (error) {
    console.error('Rate-limit RPC failed:', error.message);
    throw new Error('Rate-limit check failed');
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (
    !result ||
    typeof result.allowed !== 'boolean' ||
    !Number.isInteger(result.remaining) ||
    !Number.isInteger(result.reset_in_seconds)
  ) {
    throw new Error('Invalid rate-limit response');
  }

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetInMs: result.reset_in_seconds * 1000
  };
}

module.exports = { rateLimit, getIp };
