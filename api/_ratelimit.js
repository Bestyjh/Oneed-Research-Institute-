/**
 * Simple in-memory rate limiter.
 * Works per serverless instance — resets on cold start.
 * Good enough for protecting against spam and runaway costs.
 */

const store = new Map();

/**
 * @param {string} key       - Unique key, e.g. "chat:192.168.1.1"
 * @param {number} limit     - Max requests allowed in the window
 * @param {number} windowMs  - Window size in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetInMs: number }}
 */
function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetInMs: windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetInMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetInMs: entry.resetAt - now };
}

/**
 * Get the real client IP from Vercel request headers.
 */
function getIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

module.exports = { rateLimit, getIp };
