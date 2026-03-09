import Redis from 'ioredis';
import { seedOnce, calcPodType, randomId } from './_seed.js';

function checkAuth(req) {
  return req.headers.authorization === `Bearer ${process.env.APP_PASSWORD}`;
}

async function getPod(client, id) {
  const raw = await client.get(`pods:${id}`);
  return raw ? JSON.parse(raw) : null;
}

async function getExercise(client, id) {
  const raw = await client.get(`exercises:${id}`);
  return raw ? JSON.parse(raw) : null;
}

export default async function handler(req, res) {
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const client = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
  try {
    await seedOnce(client);

    const { id, random, action } = req.query;

    // GET /api/pods?random=1 — weighted random pod
    if (req.method === 'GET' && random) {
      const ids = await client.smembers('pods:all');
      if (ids.length === 0) return res.status(404).json({ error: 'No pods available' });

      const favIds = new Set(await client.smembers('pods:favorites'));
      const recentRaw = await client.zrevrange('history:all', 0, 9);
      const recent = recentRaw.map(r => JSON.parse(r));
      const last2Types = recent.slice(0, 2).map(s => s.pod_type);

      const completedMap = {};
      for (const session of recent) {
        if (!completedMap[session.pod_id]) {
          completedMap[session.pod_id] = (Date.now() - session.completed_at) / 86400000;
        }
      }

      const pods = (await Promise.all(ids.map(i => getPod(client, i)))).filter(Boolean);

      const weighted = pods.map(pod => {
        let weight = 1.0;
        if (favIds.has(pod.id)) weight *= 1.5;
        const daysSince = completedMap[pod.id] ?? Infinity;
        weight *= Math.min(daysSince / 7, 1.0);
        if (last2Types.length === 2 && last2Types.every(t => t === 'strength')) {
          if (pod.pod_type === 'mobility' || pod.pod_type === 'hybrid') weight *= 1.5;
        }
        if (last2Types.length === 2 && last2Types.every(t => t === 'mobility')) {
          if (pod.pod_type === 'strength' || pod.pod_type === 'hybrid') weight *= 1.5;
        }
        return { pod, weight: Math.max(weight, 0.01) };
      });

      const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
      let rand = Math.random() * totalWeight;
      let chosen = weighted[weighted.length - 1].pod;
      for (const { pod, weight } of weighted) {
        rand -= weight;
        if (rand <= 0) { chosen = pod; break; }
      }

      const exerciseDetails = (await Promise.all(chosen.exercises.map(i => getExercise(client, i)))).filter(Boolean);
      return res.json({ ...chosen, exerciseDetails });
    }

    if (req.method === 'GET') {
      if (id) {
        const pod = await getPod(client, id);
        if (!pod) return res.status(404).json({ error: 'Not found' });
        const exerciseDetails = (await Promise.all(pod.exercises.map(i => getExercise(client, i)))).filter(Boolean);
        return res.json({ ...pod, exerciseDetails });
      }
      const ids = await client.smembers('pods:all');
      const pods = (await Promise.all(ids.map(i => getPod(client, i)))).filter(Boolean);
      return res.json(pods);
    }

    if (req.method === 'POST') {
      const { exercises: exerciseIds = [], ...rest } = req.body;
      const exerciseObjs = (await Promise.all(exerciseIds.map(i => getExercise(client, i)))).filter(Boolean);
      const pod = {
        id: randomId(),
        exercises: exerciseIds,
        pod_type: calcPodType(exerciseObjs),
        total_duration_estimate_seconds: exerciseObjs.reduce((s, e) => s + (e.duration_estimate_seconds || 60), 0),
        is_favorite: false,
        created_at: Date.now(),
        ...rest,
      };
      await client.set(`pods:${pod.id}`, JSON.stringify(pod));
      await client.sadd('pods:all', pod.id);
      return res.status(201).json(pod);
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id required' });
      const existing = await getPod(client, id);
      if (!existing) return res.status(404).json({ error: 'Not found' });
      const { exercises: exerciseIds = existing.exercises, ...rest } = req.body;
      const exerciseObjs = (await Promise.all(exerciseIds.map(i => getExercise(client, i)))).filter(Boolean);
      const updated = {
        ...existing, ...rest,
        id,
        exercises: exerciseIds,
        pod_type: calcPodType(exerciseObjs),
        total_duration_estimate_seconds: exerciseObjs.reduce((s, e) => s + (e.duration_estimate_seconds || 60), 0),
      };
      await client.set(`pods:${id}`, JSON.stringify(updated));
      if (updated.is_favorite) {
        await client.sadd('pods:favorites', id);
      } else {
        await client.srem('pods:favorites', id);
      }
      return res.json(updated);
    }

    // PATCH /api/pods?id=xxx&action=favorite
    if (req.method === 'PATCH' && action === 'favorite') {
      if (!id) return res.status(400).json({ error: 'id required' });
      const pod = await getPod(client, id);
      if (!pod) return res.status(404).json({ error: 'Not found' });
      pod.is_favorite = !pod.is_favorite;
      await client.set(`pods:${id}`, JSON.stringify(pod));
      if (pod.is_favorite) {
        await client.sadd('pods:favorites', id);
      } else {
        await client.srem('pods:favorites', id);
      }
      return res.json(pod);
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id required' });
      await client.del(`pods:${id}`);
      await client.srem('pods:all', id);
      await client.srem('pods:favorites', id);
      return res.status(204).end();
    }

    res.status(405).end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    client.disconnect();
  }
}
