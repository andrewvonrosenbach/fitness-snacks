import handler from '../../api/exercises.js';
import { mockReq, mockRes, createMockRedis } from '../helpers.js';

jest.mock('ioredis');
jest.mock('../../api/_seed.js', () => ({
  seedOnce: jest.fn(async () => {}),
  randomId: () => 'test-id-123',
}));

const Redis = require('ioredis');

function setup(store = {}, sets = {}) {
  const client = createMockRedis(store, sets);
  Redis.mockImplementation(() => client);
  return client;
}

describe('GET /api/exercises', () => {
  it('returns 401 without auth', async () => {
    setup();
    const req = mockReq('GET', { headers: { authorization: 'Bearer wrong' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it('returns all exercises', async () => {
    const ex = { id: 'ex1', name: 'Push-ups', reps: 10 };
    setup(
      { 'exercises:ex1': JSON.stringify(ex) },
      { 'exercises:all': ['ex1'] },
    );
    const req = mockReq('GET');
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([ex]);
  });

  it('returns a single exercise by id', async () => {
    const ex = { id: 'ex1', name: 'Squats', duration_estimate_seconds: 45 };
    setup({ 'exercises:ex1': JSON.stringify(ex) });
    const req = mockReq('GET', { query: { id: 'ex1' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.body).toEqual(ex);
  });

  it('returns 404 for unknown id', async () => {
    setup();
    const req = mockReq('GET', { query: { id: 'missing' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/exercises', () => {
  it('creates a duration-based exercise', async () => {
    const client = setup({}, {});
    const req = mockReq('POST', {
      body: { name: 'Plank', duration_estimate_seconds: 60, movement_type: 'strength' },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe('test-id-123');
    expect(res.body.name).toBe('Plank');
    expect(res.body.duration_estimate_seconds).toBe(60);
    expect(client.set).toHaveBeenCalled();
    expect(client.sadd).toHaveBeenCalledWith('exercises:all', 'test-id-123');
  });

  it('creates a reps-based exercise', async () => {
    setup();
    const req = mockReq('POST', {
      body: { name: 'Pull-ups', reps: 8, movement_type: 'strength' },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(201);
    expect(res.body.reps).toBe(8);
  });
});

describe('PUT /api/exercises', () => {
  it('returns 400 without id', async () => {
    setup();
    const req = mockReq('PUT', { body: { name: 'Updated' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for unknown id', async () => {
    setup();
    const req = mockReq('PUT', { query: { id: 'nope' }, body: { name: 'X' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('updates exercise fields', async () => {
    const ex = { id: 'ex1', name: 'Squats', reps: 10 };
    setup({ 'exercises:ex1': JSON.stringify(ex) });
    const req = mockReq('PUT', { query: { id: 'ex1' }, body: { name: 'Deep Squats' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.body.name).toBe('Deep Squats');
    expect(res.body.reps).toBe(10); // unchanged field preserved
  });

  it('switches reps-based exercise to duration (reps: null clears the field)', async () => {
    const ex = { id: 'ex1', name: 'Squats', reps: 10, duration_estimate_seconds: 60 };
    setup({ 'exercises:ex1': JSON.stringify(ex) });
    const req = mockReq('PUT', {
      query: { id: 'ex1' },
      body: { duration_estimate_seconds: 45, reps: null },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.body.duration_estimate_seconds).toBe(45);
    expect(res.body.reps).toBeNull();
  });

  it('switches duration-based exercise to reps', async () => {
    const ex = { id: 'ex1', name: 'Plank', duration_estimate_seconds: 60 };
    setup({ 'exercises:ex1': JSON.stringify(ex) });
    const req = mockReq('PUT', {
      query: { id: 'ex1' },
      body: { reps: 15 },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.body.reps).toBe(15);
  });

  it('preserves other fields when only updating reps/duration', async () => {
    const ex = {
      id: 'ex1', name: 'Burpees', difficulty: 'advanced',
      muscle_groups: ['full body'], reps: 8,
    };
    setup({ 'exercises:ex1': JSON.stringify(ex) });
    const req = mockReq('PUT', {
      query: { id: 'ex1' },
      body: { duration_estimate_seconds: 30, reps: null },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.body.difficulty).toBe('advanced');
    expect(res.body.muscle_groups).toEqual(['full body']);
    expect(res.body.name).toBe('Burpees');
  });
});

describe('DELETE /api/exercises', () => {
  it('returns 400 without id', async () => {
    setup();
    const req = mockReq('DELETE');
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('deletes exercise and removes from set', async () => {
    const ex = { id: 'ex1', name: 'Burpees' };
    const client = setup(
      { 'exercises:ex1': JSON.stringify(ex) },
      { 'exercises:all': ['ex1'] },
    );
    const req = mockReq('DELETE', { query: { id: 'ex1' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(204);
    expect(client.del).toHaveBeenCalledWith('exercises:ex1');
    expect(client.srem).toHaveBeenCalledWith('exercises:all', 'ex1');
  });
});
