// Shared test helpers

export function mockReq(method, { query = {}, body = {}, headers = {} } = {}) {
  return {
    method,
    query,
    body,
    headers: { authorization: 'Bearer testpass', ...headers },
  };
}

export function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    end() { return this; },
  };
  return res;
}

export function createMockRedis(initialStore = {}, initialSets = {}) {
  const store = { ...initialStore };
  const sets = {};
  for (const [k, v] of Object.entries(initialSets)) {
    sets[k] = new Set(v);
  }

  const client = {
    _store: store,
    _sets: sets,
    get: jest.fn(async (key) => store[key] ?? null),
    set: jest.fn(async (key, value) => { store[key] = value; return 'OK'; }),
    del: jest.fn(async (key) => { delete store[key]; return 1; }),
    sadd: jest.fn(async (key, ...members) => {
      if (!sets[key]) sets[key] = new Set();
      members.forEach(m => sets[key].add(m));
      return members.length;
    }),
    smembers: jest.fn(async (key) => sets[key] ? [...sets[key]] : []),
    scard: jest.fn(async (key) => (sets[key] ? sets[key].size : 0)),
    srem: jest.fn(async (key, member) => {
      if (sets[key]) sets[key].delete(member);
      return 1;
    }),
    zrevrange: jest.fn(async () => []),
    disconnect: jest.fn(),
  };
  return client;
}

process.env.APP_PASSWORD = 'testpass';
