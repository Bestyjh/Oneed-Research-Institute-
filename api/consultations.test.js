
import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,

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


describe('Consultation API initialization error security', () => {
  it('does not expose Supabase initialization errors', async () => {
    const internalError = 'SUPABASE_SERVICE_ROLE_KEY is missing';

    const { handler, mockFrom } = createConsultationHandler({
      initError: internalError
    });

    const consoleSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      const req = {
        method: 'POST',
        headers: {},
        body: {
          name: 'Test User',
          email: 'test@example.com'
        }
      };

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
        error: 'Internal server error'
      });

      expect(JSON.stringify(res.body)).not.toContain(
        internalError
      );

      expect(mockFrom).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });
});



describe('Consultation API malformed JSON validation', () => {
  it('rejects malformed JSON without accessing the database', async () => {
    const { handler, mockFrom } = createConsultationHandler();

    const req = {
      method: 'POST',
      headers: {},
      body: '{"name":'
    };

    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: 'Invalid JSON request body'
    });

    expect(mockFrom).not.toHaveBeenCalled();
  });
});



describe('Consultation API request body structure', () => {
  it('rejects JSON arrays before database access', async () => {
    const { handler, mockFrom } = createConsultationHandler();

    const req = {
      method: 'POST',
      headers: {},
      body: []
    };

    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: 'Request body must be a JSON object'
    });

    expect(mockFrom).not.toHaveBeenCalled();
  });
});


describe('Consultation API input-length validation', () => {
  it('rejects names longer than 150 characters before database access', async () => {
    const { handler, mockFrom } = createConsultationHandler();

    const req = {
      method: 'POST',
      headers: {},
      body: {
        name: 'A'.repeat(151),
        email: 'test@example.com',
        service: 'consultation'
      }
    };

    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: 'name must not exceed 150 characters'
    });

    expect(mockFrom).not.toHaveBeenCalled();
  });
});

function createConsultationHandler({
  initError = null,
  mockFrom = vi.fn(),
  rateLimitResult = {
    allowed: true,
    remaining: 4,
    resetInMs: 3600000
  }
} = {}) {
  const adminPath = require.resolve('./_supabaseAdmin.js');
  const rateLimitPath = require.resolve('./_ratelimit.js');
  const consultationPath = require.resolve('./consultations.js');

  const originalModules = [
    [adminPath, require.cache[adminPath]],
    [rateLimitPath, require.cache[rateLimitPath]],
    [consultationPath, require.cache[consultationPath]]
  ];

  try {
    require.cache[adminPath] = {
      id: adminPath,
      filename: adminPath,
      loaded: true,
      exports: {
        getSupabaseAdmin: () => ({
          client: initError ? null : { from: mockFrom },
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

    delete require.cache[consultationPath];

    const handler = require('./consultations.js');

    return { handler, mockFrom };
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

describe('Consultation API email-length validation', () => {
  it('rejects emails longer than 254 characters before database access', async () => {
    const { handler, mockFrom } = createConsultationHandler();

    const req = {
      method: 'POST',
      headers: {},
      body: {
        name: 'Test User',
        email: `${'a'.repeat(250)}@example.com`,
        service: 'consultation'
      }
    };

    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: 'email must not exceed 254 characters'
    });

    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('Consultation API service-length validation', () => {
  it('rejects services longer than 150 characters before database access', async () => {
    const { handler, mockFrom } = createConsultationHandler();

    const req = {
      method: 'POST',
      headers: {},
      body: {
        name: 'Test User',
        email: 'test@example.com',
        service: 'A'.repeat(151)
      }
    };

    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: 'service must not exceed 150 characters'
    });

    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('Consultation API page URL length validation', () => {
  it('rejects page URLs longer than 2048 characters before database access', async () => {
    const { handler, mockFrom } = createConsultationHandler();

    const req = {
      method: 'POST',
      headers: {},
      body: {
        name: 'Test User',
        email: 'test@example.com',
        service: 'consultation',
        page_url: 'a'.repeat(2049)
      }
    };

    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: 'pageUrl must not exceed 2048 characters'
    });

    expect(mockFrom).not.toHaveBeenCalled();
  });
});


describe('Consultation API email-format validation', () => {
  it('rejects malformed email addresses before database access', async () => {
    const { handler, mockFrom } = createConsultationHandler();

    const req = {
      method: 'POST',
      headers: {},
      body: {
        name: 'Test User',
        email: 'not-an-email',
        service: 'consultation'
      }
    };

    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: 'Invalid email address'
    });

    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('Consultation API notification failure handling', () => {
  it('returns 201 when the consultation is saved but email delivery throws', async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      error: null
    });

    const mockFrom = vi.fn().mockReturnValue({
      insert: mockInsert
    });

    const { handler } = createConsultationHandler({
      mockFrom
    });

    const originalApiKey = process.env.RESEND_API_KEY;
    const originalFetch = globalThis.fetch;

    const consoleSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      process.env.RESEND_API_KEY = 'test-api-key';

      globalThis.fetch = vi.fn().mockRejectedValue(
        new Error('Simulated Resend network failure')
      );

      const req = {
        method: 'POST',
        headers: {},
        body: {
          name: 'Test User',
          email: 'test@example.com',
          service: 'consultation'
        }
      };

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({
        ok: true,
        email_notified: false
      });

      expect(mockFrom).toHaveBeenCalledWith(
        'consultation_requests'
      );

      expect(mockInsert).toHaveBeenCalledOnce();
      expect(globalThis.fetch).toHaveBeenCalledOnce();
    } finally {
      if (originalApiKey === undefined) {
        delete process.env.RESEND_API_KEY;
      } else {
        process.env.RESEND_API_KEY = originalApiKey;
      }

      globalThis.fetch = originalFetch;
      consoleSpy.mockRestore();
    }
  });
});

describe('Consultation API email timeout', () => {
  it('returns 201 when Resend aborts after its configured timeout', async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      error: null
    });

    const mockFrom = vi.fn().mockReturnValue({
      insert: mockInsert
    });

    const { handler } = createConsultationHandler({
      mockFrom
    });

    const originalApiKey = process.env.RESEND_API_KEY;
    const originalFetch = globalThis.fetch;
    const consoleSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      process.env.RESEND_API_KEY = 'test-api-key';

      globalThis.fetch = vi.fn((url, options) => {
        expect(url).toBe('https://api.resend.com/emails');
        expect(options.signal).toBeInstanceOf(AbortSignal);
        expect(options.signal.aborted).toBe(false);

        const signal = options.signal;

        return new Promise((resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(signal.reason),
            { once: true }
          );

          signal.dispatchEvent(new Event('abort'));
        });
      });

      const req = {
        method: 'POST',
        headers: {},
        body: {
          name: 'Test User',
          email: 'test@example.com',
          service: 'consultation'
        }
      };

      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({
        ok: true,
        email_notified: false
      });

      expect(mockInsert).toHaveBeenCalledOnce();
      expect(globalThis.fetch).toHaveBeenCalledOnce();
    } finally {
      if (originalApiKey === undefined) {
        delete process.env.RESEND_API_KEY;
      } else {
        process.env.RESEND_API_KEY = originalApiKey;
      }

      globalThis.fetch = originalFetch;
      consoleSpy.mockRestore();
    }
  });
});
