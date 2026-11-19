
import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);

function createResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null
  };

  res.setHeader = vi.fn((name, value) => {
    res.headers[name] = value;
    return res;
  });

  res.status = vi.fn((code) => {
    res.statusCode = code;
    return res;
  });

  res.json = vi.fn((body) => {
    res.body = body;
    return res;
  });

  return res;
}

function loadHandlerWithMock(mockClient) {
  const adminPath = require.resolve('./_supabaseAdmin.js');
  const profilePath = require.resolve('./profile.js');

  const originalAdminModule = require.cache[adminPath];
  const originalProfileModule = require.cache[profilePath];

  try {
    require.cache[adminPath] = {
      id: adminPath,
      filename: adminPath,
      loaded: true,
      exports: {
        getSupabaseAdmin: () => ({
          client: mockClient,
          error: null
        })
      }
    };

    delete require.cache[profilePath];

    return require('./profile.js');
  } finally {
    if (originalAdminModule) {
      require.cache[adminPath] = originalAdminModule;
    } else {
      delete require.cache[adminPath];
    }

    if (originalProfileModule) {
      require.cache[profilePath] = originalProfileModule;
    } else {
      delete require.cache[profilePath];
    }
  }
}

describe('Profile API', () => {
  it('rejects unsupported HTTP methods', async () => {
    const handler = loadHandlerWithMock({});

    const req = {
      method: 'POST',
      headers: {}
    };

    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('GET, PUT');
    expect(res.body).toEqual({
      error: 'Method not allowed'
    });
});
it('rejects malformed JSON without writing to the database', async () => {
  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com'
          }
        },
        error: null
      })
    },
    from: vi.fn()
  };

  const handler = loadHandlerWithMock(mockClient);

  const req = {
    method: 'PUT',
    headers: {
      authorization: 'Bearer valid-test-token'
    },
    body: '{"full_name": "Test User",'
  };

  const res = createResponse();

  await handler(req, res);

  expect(res.statusCode).toBe(400);
  expect(res.body).toEqual({
    error: 'Invalid JSON request body'
  });

  expect(mockClient.auth.getUser).toHaveBeenCalledWith(
    'valid-test-token'
  );

  expect(mockClient.from).not.toHaveBeenCalled();
});

it('rejects invalid or expired bearer tokens', async () => {
  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid JWT' }
      })
    },
    from: vi.fn()
  };

  const handler = loadHandlerWithMock(mockClient);

  const req = {
    method: 'GET',
    headers: {
      authorization: 'Bearer invalid-test-token'
    }
  };

  const res = createResponse();

  await handler(req, res);

  expect(res.statusCode).toBe(401);
  expect(res.body).toEqual({
    error: 'Invalid or expired token'
  });

  expect(mockClient.auth.getUser).toHaveBeenCalledWith(
    'invalid-test-token'
  );

  expect(mockClient.from).not.toHaveBeenCalled();
});

  it('rejects requests without a bearer token', async () => {
    const mockClient = {
      auth: {
        getUser: vi.fn()
      }
    };

    const handler = loadHandlerWithMock(mockClient);

    const req = {
      method: 'GET',
      headers: {}
    };

    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      error: 'Missing bearer token'
    });

    expect(mockClient.auth.getUser).not.toHaveBeenCalled();
  });

it('loads only the authenticated user profile', async () => {
  const authenticatedUser = {
    id: 'user-123',
    email: 'user@example.com'
  };

  const profile = {
    id: 'user-123',
    email: 'user@example.com',
    full_name: 'Test User',
    phone: '',
    organization: ''
  };

  const maybeSingle = vi.fn().mockResolvedValue({
    data: profile,
    error: null
  });

  const eq = vi.fn().mockReturnValue({
    maybeSingle
  });

  const select = vi.fn().mockReturnValue({
    eq
  });

  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authenticatedUser },
        error: null
      })
    },
    from: vi.fn().mockReturnValue({
      select
    })
  };

  const handler = loadHandlerWithMock(mockClient);

  const req = {
    method: 'GET',
    headers: {
      authorization: 'Bearer valid-test-token'
    },
    query: {
      id: 'another-user'
    }
  };

  const res = createResponse();

  await handler(req, res);

  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ profile });

  expect(mockClient.auth.getUser).toHaveBeenCalledWith(
    'valid-test-token'
  );

  expect(mockClient.from).toHaveBeenCalledWith('profiles');

  expect(eq).toHaveBeenCalledWith('id', 'user-123');
  expect(eq).not.toHaveBeenCalledWith('id', 'another-user');
});

});

describe('Profile API request body validation', () => {
  it('rejects JSON arrays without accessing the database', async () => {
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'user@example.com'
            }
          },
          error: null
        })
      },
      from: vi.fn()
    };

    const handler = loadHandlerWithMock(mockClient);

    const req = {
      method: 'PUT',
      headers: {
        authorization: 'Bearer valid-test-token'
      },
      body: '[]'
    };

    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: 'Request body must be a JSON object'
    });

    expect(mockClient.from).not.toHaveBeenCalled();
  });
});

describe('Profile API field length validation', () => {
  it('rejects full names longer than 150 characters', async () => {
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'user@example.com'
            }
          },
          error: null
        })
      },
      from: vi.fn()
    };

    const handler = loadHandlerWithMock(mockClient);

    const req = {
      method: 'PUT',
      headers: {
        authorization: 'Bearer valid-test-token'
      },
      body: JSON.stringify({
        full_name: 'A'.repeat(151),
        phone: '1234567890',
        organization: 'ONEED Research Institute'
      })
    };

    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);

    expect(res.body).toEqual({
      error: 'full_name must not exceed 150 characters'
    });

    expect(mockClient.from).not.toHaveBeenCalled();
  });
});

describe('Profile API phone validation', () => {
  it('rejects phone numbers longer than 30 characters', async () => {
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'user@example.com'
            }
          },
          error: null
        })
      },
      from: vi.fn()
    };

    const handler = loadHandlerWithMock(mockClient);

    const req = {
      method: 'PUT',
      headers: {
        authorization: 'Bearer valid-test-token'
      },
      body: JSON.stringify({
        full_name: 'Test User',
        phone: '1'.repeat(31),
        organization: 'ONEED Research Institute'
      })
    };

    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: 'phone must not exceed 30 characters'
    });

    expect(mockClient.from).not.toHaveBeenCalled();
  });
});

describe('Profile API organization validation', () => {
  it('rejects organization names longer than 200 characters', async () => {
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'user@example.com'
            }
          },
          error: null
        })
      },
      from: vi.fn()
    };

    const handler = loadHandlerWithMock(mockClient);

    const req = {
      method: 'PUT',
      headers: {
        authorization: 'Bearer valid-test-token'
      },
      body: JSON.stringify({
        full_name: 'Test User',
        phone: '1234567890',
        organization: 'A'.repeat(201)
      })
    };

    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: 'organization must not exceed 200 characters'
    });

    expect(mockClient.from).not.toHaveBeenCalled();
  });
});

describe('Profile API field type validation', () => {
  it('rejects non-string profile fields without database writes', async () => {
    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'user@example.com'
            }
          },
          error: null
        })
      },
      from: vi.fn()
    };

    const handler = loadHandlerWithMock(mockClient);

    const req = {
      method: 'PUT',
      headers: {
        authorization: 'Bearer valid-test-token'
      },
      body: JSON.stringify({
        full_name: 12345,
        phone: '1234567890',
        organization: 'ONEED Research Institute'
      })
    };

    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: 'full_name must be a string'
    });

    expect(mockClient.from).not.toHaveBeenCalled();
  });
});

describe('Profile API PUT authorization', () => {
  it('updates only the authenticated user profile', async () => {
    const savedProfile = {
      id: 'user-123',
      email: 'user@example.com',
      full_name: 'Test User',
      phone: '1234567890',
      organization: 'ONEED Research Institute'
    };

    const single = vi.fn().mockResolvedValue({
      data: savedProfile,
      error: null
    });

    const select = vi.fn().mockReturnValue({ single });

    const upsert = vi.fn().mockReturnValue({ select });

    const mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'user@example.com'
            }
          },
          error: null
        })
      },
      from: vi.fn().mockReturnValue({ upsert })
    };

    const handler = loadHandlerWithMock(mockClient);

    const req = {
      method: 'PUT',
      headers: {
        authorization: 'Bearer valid-test-token'
      },
      body: JSON.stringify({
        id: 'another-user',
        email: 'another@example.com',
        full_name: 'Test User',
        phone: '1234567890',
        organization: 'ONEED Research Institute'
      })
    };

    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);

    expect(mockClient.from).toHaveBeenCalledWith('profiles');

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-123',
        email: 'user@example.com',
        full_name: 'Test User',
        phone: '1234567890',
        organization: 'ONEED Research Institute'
      }),
      { onConflict: 'id' }
    );

    expect(upsert.mock.calls[0][0].id).not.toBe('another-user');
    expect(upsert.mock.calls[0][0].email).not.toBe(
      'another@example.com'
    );

    expect(res.body).toEqual({
      profile: savedProfile
    });
  });
});

describe('Profile API initialization error security', () => {
  it('does not expose internal initialization errors to clients', async () => {
    const adminPath = require.resolve('./_supabaseAdmin.js');
    const profilePath = require.resolve('./profile.js');

    const originalAdminModule = require.cache[adminPath];
    const originalProfileModule = require.cache[profilePath];

    const internalError = 'SUPABASE_SERVICE_ROLE_KEY is missing';

    let handler;

    try {
      require.cache[adminPath] = {
        id: adminPath,
        filename: adminPath,
        loaded: true,
        exports: {
          getSupabaseAdmin: () => ({
            client: null,
            error: internalError
          })
        }
      };

      delete require.cache[profilePath];
      handler = require('./profile.js');
    } finally {
      if (originalAdminModule) {
        require.cache[adminPath] = originalAdminModule;
      } else {
        delete require.cache[adminPath];
      }

      if (originalProfileModule) {
        require.cache[profilePath] = originalProfileModule;
      } else {
        delete require.cache[profilePath];
      }
    }

    const consoleSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      const req = {
        method: 'GET',
        headers: {
          authorization: 'Bearer test-token'
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
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
describe('Profile API unexpected exception handling', () => {
  it('returns a generic 500 when Supabase authentication throws', async () => {
    const sensitiveError = 'Sensitive database connection details';

    const mockClient = {
      auth: {
        getUser: vi.fn().mockRejectedValue(
          new Error(sensitiveError)
        )
      },
      from: vi.fn()
    };

    const handler = loadHandlerWithMock(mockClient);

    const req = {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token'
      }
    };

    const res = createResponse();

    const consoleSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });

      expect(JSON.stringify(res.json.mock.calls))
        .not.toContain(sensitiveError);

      expect(mockClient.from).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
