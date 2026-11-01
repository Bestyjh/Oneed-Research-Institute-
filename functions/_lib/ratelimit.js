import { getSupabaseAdmin } from './supabase.js';

function isValidIPv4(ip) {
  const parts = ip.split('.');

  return parts.length === 4 && parts.every(part =>
    /^(0|[1-9]\d{0,2})$/.test(part) &&
    Number(part) <= 255
  );
}

function isValidIPv6(ip) {
  if (!ip.includes(':')) return false;

  if (!/^[0-9a-fA-F:.]+$/.test(ip)) return false;

  try {
    const parsed = new URL(`http://[${ip}]/`);
    return parsed.hostname.startsWith('[') &&
      parsed.hostname.endsWith(']');
  } catch {
    return false;
  }
}

export function getClientIp(request) {
  const ip = request.headers.get('CF-Connecting-IP');

  if (!ip || !ip.trim()) {
    throw new Error('Trusted client IP is unavailable');
  }

  const value = ip.trim();

  if (!isValidIPv4(value) && !isValidIPv6(value)) {
    throw new Error('Invalid trusted client IP');
  }

  if (isValidIPv6(value)) {
    return new URL(`http://[${value}]/`).hostname.slice(1, -1);
  }

  return value;
}
async function hashRateLimitKey(key, secret) {
  const encoder = new TextEncoder();

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {
      name: 'HMAC',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(key)
  );

  return Array.from(new Uint8Array(signature))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function rateLimit(env, key, limit, windowMs) {
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

  const secret = env?.RATE_LIMIT_HASH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('Rate-limit secret is not configured');
  }

  const { client, error } = getSupabaseAdmin(env);

  if (error || !client) {
    throw new Error('Rate-limit database is unavailable');
  }

  const keyHash = await hashRateLimitKey(key, secret);

  const { data, error: rpcError } = await client.rpc(
    'check_api_rate_limit',
    {
      p_key_hash: keyHash,
      p_limit: limit,
      p_window_seconds: Math.ceil(windowMs / 1000)
    }
  );

  if (rpcError) {
    console.error('Rate-limit RPC failed:', rpcError.message);
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
