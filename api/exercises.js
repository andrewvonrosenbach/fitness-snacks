import Redis from 'ioredis';
import { seedOnce, randomId } from './_seed.js';

function checkAuth(req) {
  return req.headers.authorization === `Bearer ${process.env.APP_PASSWORD}`;
}

export default async function handler(req, res) {
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const client = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
  try {
    await seedOnce(client);

    const { id } = req.query;

    if (req.method === 'GET') {
      if (id) {
        const raw = await client.get(`exercises:${id}`);
        if (!raw) return res.status(404).json({ error: 'Not found' });
        return res.json(JSON.parse(raw));
      }
      const ids = await client.smembers('exercises:all');
      const items = await Promise.all(ids.map(i => client.get(`exercises:${i}`)));
      return res.json(items.filter(Boolean).map(r => JSON.parse(r)));
    }

    if (req.method === 'POST') {
      const ex = { id: randomId(), ...req.body };
      await client.set(`exercises:${ex.id}`, JSON.stringify(ex));
      await client.sadd('exercises:all', ex.id);
      return res.status(201).json(ex);
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id required' });
      const raw = await client.get(`exercises:${id}`);
      if (!raw) return res.status(404).json({ error: 'Not found' });
      const updated = { ...JSON.parse(raw), ...req.body, id };
      await client.set(`exercises:${id}`, JSON.stringify(updated));
      return res.json(updated);
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id required' });
      await client.del(`exercises:${id}`);
      await client.srem('exercises:all', id);
      return res.status(204).end();
    }

    res.status(405).end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    client.disconnect();
  }
}
