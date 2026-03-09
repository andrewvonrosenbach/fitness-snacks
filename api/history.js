import Redis from 'ioredis';

function checkAuth(req) {
  return req.headers.authorization === `Bearer ${process.env.APP_PASSWORD}`;
}

export default async function handler(req, res) {
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const client = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
  try {
    if (req.method === 'GET') {
      const raw = await client.zrevrange('history:all', 0, -1);
      return res.json(raw.map(r => JSON.parse(r)));
    }

    if (req.method === 'POST') {
      const { pod_id, pod_type, pod_name } = req.body;
      if (!pod_id) return res.status(400).json({ error: 'pod_id required' });
      const session = { pod_id, pod_type, pod_name, completed_at: Date.now() };
      await client.zadd('history:all', session.completed_at, JSON.stringify(session));
      return res.status(201).json(session);
    }

    res.status(405).end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    client.disconnect();
  }
}
