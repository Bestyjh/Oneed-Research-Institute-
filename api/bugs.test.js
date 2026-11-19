
import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function createBugHandler({
  initError = null,
  mockFrom = vi.fn(),
  mockGetUser = vi.fn(),
  rateLimitResult = {
    allowed: true,
    remaining: 9,
    resetInMs: 3600000
  }
} = {}) {
  const adminPath = require.resolve('./_supabaseAdmin.js');
  const rateLimitPath = require.resolve('./_ratelimit.js');
  const bugsPath = require.resolve('./bugs.js');

  const originalModules = [
    [adminPath, require.cache[adminPath]],
    [rateLimitPath, require.cache[rateLimitPath]],
    [bugsPath, require.cache[bugsPath]]
  ];

  try {
    require.cache[adminPath] = {
      id: adminPath,
      filename: adminPath,
      loaded: true,
      exports: {
        getSupabaseAdmin: () => ({
          client: initError
            ? null
            : {
                from: mockFrom,
                auth: {
                  getUser: mockGetUser
                }
              },
          error: initError
        })
      }
    };

    require.cache[rateLimitPath] = {
      id: rateLimitPath,
      filename: rateLimitPath,
      loaded: true,
      exports: {
        getIp: () => '127.0.0.1',
        rateLimit: vi.fn().mockResolvedValue(rateLimitResult)
      }
    };

    delete require.cache[bugsPath];

    const handler = require('./bugs.js');

    return {
      handler,
      mockFrom,
      mockGetUser
    };
  } finally {
    for (const [path, original] of originalModules) {
      if (original) {
        require.cache[path] = original;
      } else {
        delete require.cache[path];
      }
    }
  }
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    headers: {},
    setHeader: vi.fn(function (name, value) {
      this.headers[name] = value;
      return this;
    }),
    status: vi.fn(function (code) {
      this.statusCode = code;
      return this;
    }),
    json: vi.fn(function (body) {
      this.body = body;
      return this;
    })
  };
}

describe('Bug Report API request validation', () => {
  it('rejects malformed JSON with HTTP 400', async () => {
    const { handler, mockFrom } = createBugHandler();

    const req = {
      method: 'POST',
      headers: {},
      body: '{"title":'
    };

    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: 'Invalid JSON body'
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

it('rejects JSON arrays before database access', async () => {
  const { handler, mockFrom } = createBugHandler();

  const req = {
    method: 'POST',
    headers: {},
    body: JSON.stringify([
      {
        title: 'Test bug',
        description: 'Test description'
      }
    ])
  };

  const res = createResponse();

  await handler(req, res);

  expect(res.statusCode).toBe(400);
  expect(res.body).toEqual({
    error: 'Invalid request body'
  });

  expect(mockFrom).not.toHaveBeenCalled();
});

it('rejects unsupported severity values before database access', async () => {
  const { handler, mockFrom } = createBugHandler();

  const req = {
    method: 'POST',
    headers: {},
    body: {
      title: 'Test bug report',
      description: 'The form is not working correctly.',
      severity: 'critical',
      reporter_email: 'test@example.com',
      page_url: ''
    }
  };

  const res = createResponse();

  await handler(req, res);

  expect(res.statusCode).toBe(400);
  expect(res.body).toEqual({
    error: 'Invalid severity'
  });

  expect(mockFrom).not.toHaveBeenCalled();
});

it('rejects titles longer than 150 characters before database access', async () => {
  const { handler, mockFrom } = createBugHandler();

  const req = {
    method: 'POST',
    headers: {},
    body: {
      title: 'A'.repeat(151),
      description: 'The website is not working correctly.',
      severity: 'medium',
      reporter_email: 'test@example.com',
      page_url: ''
    }
  };

  const res = createResponse();

  await handler(req, res);

  expect(res.statusCode).toBe(400);
  expect(res.body).toEqual({
    error: 'Title must be 150 characters or fewer'
  });

  expect(mockFrom).not.toHaveBeenCalled();
});

it('rejects descriptions longer than 5000 characters before database access', async () => {
  const { handler, mockFrom } = createBugHandler();

  const req = {
    method: 'POST',
    headers: {},
    body: {
      title: 'Test bug report',
      description: 'A'.repeat(5001),
      severity: 'medium',
      reporter_email: 'test@example.com',
      page_url: ''
    }
  };

  const res = createResponse();

  await handler(req, res);

  expect(res.statusCode).toBe(400);
  expect(res.body).toEqual({
    error: 'Description must be 5000 characters or fewer'
  });

  expect(mockFrom).not.toHaveBeenCalled();
});

it('rejects invalid reporter email addresses before database access', async () => {
  const { handler, mockFrom } = createBugHandler();

  const req = {
    method: 'POST',
    headers: {},
    body: {
      title: 'Test bug report',
      description: 'The website is not working correctly.',
      severity: 'medium',
      reporter_email: 'not-an-email',
      page_url: ''
    }
  };

  const res = createResponse();

  await handler(req, res);

  expect(res.statusCode).toBe(400);
  expect(res.body).toEqual({
    error: 'Invalid reporter email'
  });

  expect(mockFrom).not.toHaveBeenCalled();
});

it('rejects page URLs longer than 2048 characters before database access', async () => {
  const { handler, mockFrom } = createBugHandler();

  const req = {
    method: 'POST',
    headers: {},
    body: {
      title: 'Test bug report',
      description: 'The website is not working correctly.',
      severity: 'medium',
      reporter_email: 'test@example.com',
      page_url: 'https://example.com/' + 'a'.repeat(2048)
    }
  };

  const res = createResponse();

  await handler(req, res);

  expect(res.statusCode).toBe(400);
  expect(res.body).toEqual({
    error: 'Page URL must be 2048 characters or fewer'
  });

  expect(mockFrom).not.toHaveBeenCalled();
});

it('handles authentication service failures without crashing', async () => {
  const mockGetUser = vi.fn().mockRejectedValue(
    new Error('Authentication service unavailable')
  );

  const { handler, mockFrom } = createBugHandler({
    mockGetUser
  });

  const req = {
    method: 'POST',
    headers: {
      authorization: 'Bearer test-token'
    },
    body: {
      title: 'Test bug report',
      description: 'The website is not working correctly.',
      severity: 'medium',
      reporter_email: 'test@example.com',
      page_url: ''
    }
  };

  const res = createResponse();

  await handler(req, res);

  expect(res.statusCode).toBe(503);
  expect(res.body).toEqual({
    error: 'The service is temporarily unavailable. Please try again later.'
  });

  expect(mockFrom).not.toHaveBeenCalled();
});

it('handles database insertion exceptions without crashing', async () => {
  const mockFrom = vi.fn().mockImplementation(() => {
    throw new Error('Database connection unavailable');
  });

  const { handler } = createBugHandler({
    mockFrom
  });

  const req = {
    method: 'POST',
    headers: {},
    body: {
      title: 'Test bug report',
      description: 'The website is not working correctly.',
      severity: 'medium',
      reporter_email: 'test@example.com',
      page_url: ''
    }
  };

  const res = createResponse();

  await handler(req, res);

  expect(res.statusCode).toBe(503);
  expect(res.body).toEqual({
    error: 'The service is temporarily unavailable. Please try again later.'
  });

  expect(mockFrom).toHaveBeenCalledWith('bug_reports');
});

it('does not expose Supabase initialization errors to clients', async () => {
  const internalError =
    'Missing SUPABASE_SERVICE_ROLE_KEY in server configuration';

  const { handler, mockFrom } = createBugHandler({
    initError: internalError
  });

  const req = {
    method: 'POST',
    headers: {},
    body: {
      title: 'Test bug',
      description: 'Test description'
    }
  };

  const res = createResponse();

  await handler(req, res);

  expect(res.statusCode).toBe(500);

  expect(res.body).toEqual({
    error: 'The service is temporarily unavailable. Please try again later.'
  });

  expect(JSON.stringify(res.body)).not.toContain(
    'SUPABASE_SERVICE_ROLE_KEY'
  );

  expect(mockFrom).not.toHaveBeenCalled();
});
});
