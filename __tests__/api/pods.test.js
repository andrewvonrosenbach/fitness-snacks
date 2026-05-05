import handler from '../../api/pods.js';
import { mockReq, mockRes, createMockRedis } from '../helpers.js';

jest.mock('ioredis');
jest.mock('../../api/_seed.js', () => ({
  seedOnce: jest.fn(async () => {}),
  calcPodType: jest.fn((exs) => {
    if (!exs.length) return 'hybrid';
    const sc = exs.filter(e => e.movement_type === 'strength').length;
    return sc / exs.length > 0.7 ? 'strength' : 'hybrid';
  }),
  randomId: () => 'new-pod-id',
}));

const Redis = require('ioredis');

const EX1 = { id: 'ex1', name: 'Push-ups', duration_estimate_seconds: 30, movement_type: 'strength' };
const EX2 = { id: 'ex2', name: 'Squats', duration_estimate_seconds: 45, movement_type: 'strength' };

function makeStore(pods = [], exercises = [EX1, EX2]) {
  const store = {};
  const sets = { 'exercises:all': exercises.map(e => e.id) };
  for (const e of exercises) store[`exercises:${e.id}`] = JSON.stringify(e);
  for (const p of pods) {
    store[`pods:${p.id}`] = JSON.stringify(p);
    if (!sets['pods:all']) sets['pods:all'] = [];
    sets['pods:all'].push(p.id);
  }
  return { store, sets };
}

function setup(pods = [], exercises = [EX1, EX2]) {
  const { store, sets } = makeStore(pods, exercises);
  const client = createMockRedis(store, sets);
  Redis.mockImplementation(() => client);
  return client;
}

const POD1 = {
  id: 'pod1', name: 'Power Set', exercises: ['ex1', 'ex2'],
  pod_type: 'strength', total_duration_estimate_seconds: 75,
  is_favorite: false, created_at: 1000,
};

describe('GET /api/pods', () => {
  it('returns 401 without auth', async () => {
    setup();
    const req = mockReq('GET', { headers: { authorization: 'Bearer bad' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it('returns all pods', async () => {
    setup([POD1]);
    const req = mockReq('GET');
    const res = mockRes();
    await handler(req, res);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe('pod1');
  });

  it('returns a single pod with exerciseDetails', async () => {
    setup([POD1]);
    const req = mockReq('GET', { query: { id: 'pod1' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.body.id).toBe('pod1');
    expect(res.body.exerciseDetails).toHaveLength(2);
    expect(res.body.exerciseDetails[0].name).toBe('Push-ups');
  });

  it('returns 404 for unknown pod id', async () => {
    setup();
    const req = mockReq('GET', { query: { id: 'nope' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('returns a random pod with exerciseDetails', async () => {
    setup([POD1]);
    const req = mockReq('GET', { query: { random: '1' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.body.id).toBe('pod1');
    expect(Array.isArray(res.body.exerciseDetails)).toBe(true);
  });

  it('returns a random pod matching the requested type', async () => {
    const mobilityPod = { ...POD1, id: 'pod2', name: 'Mobility Flow', pod_type: 'mobility' };
    setup([POD1, mobilityPod]);
    // Run several times to confirm only mobility pod is ever returned
    for (let i = 0; i < 10; i++) {
      const req = mockReq('GET', { query: { random: '1', type: 'mobility' } });
      const res = mockRes();
      await handler(req, res);
      expect(res.body.pod_type).toBe('mobility');
    }
  });

  it('falls back to all pods when no pod matches the requested type', async () => {
    setup([POD1]); // only a strength pod
    const req = mockReq('GET', { query: { random: '1', type: 'core' } });
    const res = mockRes();
    await handler(req, res);
    // Falls back gracefully — returns something rather than 404
    expect(res.body.id).toBe('pod1');
  });

  it('returns 404 random when no pods exist', async () => {
    setup([]);
    const req = mockReq('GET', { query: { random: '1' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(404);
  });

});

describe('POST /api/pods', () => {
  it('creates a new pod', async () => {
    const client = setup();
    const req = mockReq('POST', {
      body: { name: 'Morning Flow', exercises: ['ex1', 'ex2'] },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe('new-pod-id');
    expect(res.body.name).toBe('Morning Flow');
    expect(res.body.exercises).toEqual(['ex1', 'ex2']);
    expect(res.body.total_duration_estimate_seconds).toBe(75);
    expect(client.sadd).toHaveBeenCalledWith('pods:all', 'new-pod-id');
  });
});

describe('PUT /api/pods', () => {
  it('returns 400 without id', async () => {
    setup([POD1]);
    const req = mockReq('PUT', { body: { name: 'Updated' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for unknown pod', async () => {
    setup();
    const req = mockReq('PUT', { query: { id: 'nope' }, body: { name: 'X' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('updates pod name and preserves other fields', async () => {
    setup([POD1]);
    const req = mockReq('PUT', {
      query: { id: 'pod1' },
      body: { name: 'Renamed Pod', exercises: ['ex1', 'ex2'] },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.body.name).toBe('Renamed Pod');
    expect(res.body.id).toBe('pod1');
    expect(res.body.exercises).toEqual(['ex1', 'ex2']);
  });

  it('recalculates duration when exercises change', async () => {
    setup([POD1]);
    const req = mockReq('PUT', {
      query: { id: 'pod1' },
      body: { name: 'Power Set', exercises: ['ex1'] }, // only one exercise now
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.body.total_duration_estimate_seconds).toBe(30); // only EX1's 30s
  });
});

describe('PATCH /api/pods — toggle favorite', () => {
  it('toggles favorite on', async () => {
    const client = setup([POD1]);
    const req = mockReq('PATCH', { query: { id: 'pod1', action: 'favorite' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.body.is_favorite).toBe(true);
    expect(client.sadd).toHaveBeenCalledWith('pods:favorites', 'pod1');
  });

  it('toggles favorite off', async () => {
    const favPod = { ...POD1, is_favorite: true };
    const client = setup([favPod]);
    const req = mockReq('PATCH', { query: { id: 'pod1', action: 'favorite' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.body.is_favorite).toBe(false);
    expect(client.srem).toHaveBeenCalledWith('pods:favorites', 'pod1');
  });

  it('returns 404 for unknown pod', async () => {
    setup();
    const req = mockReq('PATCH', { query: { id: 'nope', action: 'favorite' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/pods', () => {
  it('deletes pod and cleans up sets', async () => {
    const client = setup([POD1]);
    const req = mockReq('DELETE', { query: { id: 'pod1' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(204);
    expect(client.del).toHaveBeenCalledWith('pods:pod1');
    expect(client.srem).toHaveBeenCalledWith('pods:all', 'pod1');
    expect(client.srem).toHaveBeenCalledWith('pods:favorites', 'pod1');
  });

  it('returns 400 without id', async () => {
    setup();
    const req = mockReq('DELETE');
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });
});
