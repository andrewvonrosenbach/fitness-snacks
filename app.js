const { useState, useCallback, useEffect, useRef } = React;

// Auth
const AUTH_KEY = 'FitnessSnacksToken';
const getToken = () => localStorage.getItem(AUTH_KEY);
const setToken = (t) => localStorage.setItem(AUTH_KEY, t);
const clearToken = () => localStorage.removeItem(AUTH_KEY);

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    clearToken();
    window.location.reload();
    return null;
  }
  return res;
}

// ── Login Screen ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError('Incorrect password');
        return;
      }
      const { token } = await res.json();
      setToken(token);
      onLogin();
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-logo">
        <h1>Fitness Snacks</h1>
        <p>Quick breaks that add up</p>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className="login-error">{error}</p>}
        <button className="btn-primary" type="submit" disabled={loading || !password}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

// ── Type Badge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }) {
  const cls = type === 'strength' ? 'badge-strength' : type === 'mobility' ? 'badge-mobility' : 'badge-hybrid';
  return <span className={`pod-type-badge ${cls}`}>{type}</span>;
}

// ── Difficulty Badge ──────────────────────────────────────────────────────────

function DiffBadge({ level }) {
  const cls = level === 'beginner' ? 'diff-beginner' : level === 'intermediate' ? 'diff-intermediate' : 'diff-advanced';
  return <span className={`difficulty-badge ${cls}`}>{level}</span>;
}

// ── Home Screen ───────────────────────────────────────────────────────────────

function Home({ onStart, onBrowse }) {
  const [pod, setPod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPod = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/pods?random=1');
      if (!res || !res.ok) throw new Error('No pods available');
      const data = await res.json();
      setPod(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const mins = pod ? Math.round(pod.total_duration_estimate_seconds / 60) : null;

  return (
    <div className="home">
      <div className="home-header">
        <h1>Fitness Snacks</h1>
        <p>Quick breaks that add up</p>
      </div>

      {!pod && (
        <button className="get-pod-btn" onClick={fetchPod} disabled={loading}>
          {loading ? 'Finding your pod…' : 'Get My Pod'}
        </button>
      )}

      {error && <p className="error-msg">{error}</p>}

      {pod && (
        <div className="pod-card">
          <div className="pod-card-header">
            <div className="pod-card-title-row">
              <h2>{pod.name}</h2>
              <TypeBadge type={pod.pod_type} />
            </div>
            <div className="pod-meta">
              <span>{pod.exercises.length} exercises</span>
              <span>~{mins} min</span>
              {pod.is_favorite && <span className="fav">★ Favorite</span>}
            </div>
          </div>

          <ul className="exercise-list">
            {(pod.exerciseDetails || []).map(ex => (
              <li key={ex.id} className="exercise-item">
                <div>
                  <p className="exercise-name">{ex.name}</p>
                  <p className="exercise-muscles">{ex.muscle_groups?.join(', ')}</p>
                </div>
                <DiffBadge level={ex.difficulty} />
              </li>
            ))}
          </ul>

          <div className="pod-actions">
            <button className="btn-start" onClick={() => onStart(pod)}>Start</button>
            <button className="btn-ghost" onClick={fetchPod} disabled={loading}>Shuffle</button>
            <button className="btn-ghost" onClick={onBrowse}>Browse</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Active Pod ────────────────────────────────────────────────────────────────

function ActivePod({ pod, onBack, onComplete }) {
  const totalSecs = pod.total_duration_estimate_seconds || 300;
  const [secsLeft, setSecsLeft] = useState(totalSecs);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && secsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setDone(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const mins = String(Math.floor(secsLeft / 60)).padStart(2, '0');
  const secs = String(secsLeft % 60).padStart(2, '0');

  const handleComplete = async () => {
    try {
      await apiFetch('/api/history', {
        method: 'POST',
        body: JSON.stringify({ pod_id: pod.id, pod_type: pod.pod_type, pod_name: pod.name }),
      });
    } catch {}
    onComplete();
  };

  return (
    <div className="active-pod">
      <div className="active-pod-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2 className="active-pod-title">{pod.name}</h2>
        <TypeBadge type={pod.pod_type} />
      </div>

      <div className="timer-card">
        <div className="timer-display">{mins}:{secs}</div>
        <div className="timer-controls">
          {!done && (
            <button
              className="btn-ghost"
              style={{ minWidth: 90 }}
              onClick={() => setRunning(r => !r)}
            >
              {running ? 'Pause' : secsLeft === totalSecs ? 'Start Timer' : 'Resume'}
            </button>
          )}
          {done && <p style={{ color: 'var(--green-light)', fontWeight: 600 }}>Time's up!</p>}
        </div>
      </div>

      <div className="exercises-card">
        <p className="exercises-card-title">Exercises</p>
        <ul className="exercise-list">
          {(pod.exerciseDetails || []).map(ex => (
            <li key={ex.id} className="exercise-item">
              <div>
                <p className="exercise-name">{ex.name}</p>
                <p className="exercise-muscles">{ex.muscle_groups?.join(', ')}</p>
              </div>
              <DiffBadge level={ex.difficulty} />
            </li>
          ))}
        </ul>
      </div>

      <div className="complete-actions">
        <button className="btn-primary" onClick={handleComplete}>Mark Complete</button>
        <button className="btn-secondary" onClick={onBack}>Skip</button>
      </div>
    </div>
  );
}

// ── Exercise Form ─────────────────────────────────────────────────────────────

function ExerciseForm({ initial, onSave, onCancel, saving }) {
  const toForm = (ex) => ex ? {
    ...ex,
    muscle_groups: Array.isArray(ex.muscle_groups) ? ex.muscle_groups.join(', ') : (ex.muscle_groups || ''),
    equipment: Array.isArray(ex.equipment) ? ex.equipment.join(', ') : (ex.equipment || ''),
    instructions: Array.isArray(ex.instructions) ? ex.instructions.join('\n') : (ex.instructions || ''),
  } : {
    name: '', description: '', difficulty: 'intermediate',
    muscle_groups: '', equipment: 'bodyweight', movement_type: 'strength',
    duration_estimate_seconds: 45, instructions: '',
  };

  const [form, setForm] = useState(() => toForm(initial));
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      muscle_groups: form.muscle_groups.split(',').map(s => s.trim()).filter(Boolean),
      equipment: form.equipment.split(',').map(s => s.trim()).filter(Boolean),
      duration_estimate_seconds: Number(form.duration_estimate_seconds),
      instructions: form.instructions.split('\n').map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <form className="crud-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label>Name</label>
        <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required />
      </div>
      <div className="form-field">
        <label>Description</label>
        <textarea className="form-input form-textarea" value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
      </div>
      <div className="form-row">
        <div className="form-field">
          <label>Difficulty</label>
          <select className="form-input" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="form-field">
          <label>Movement Type</label>
          <select className="form-input" value={form.movement_type} onChange={e => set('movement_type', e.target.value)}>
            <option value="strength">Strength</option>
            <option value="mobility">Mobility</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>
      <div className="form-field">
        <label>Muscle Groups <span className="form-hint">comma-separated</span></label>
        <input className="form-input" value={form.muscle_groups} onChange={e => set('muscle_groups', e.target.value)} placeholder="core, legs, glutes" />
      </div>
      <div className="form-field">
        <label>Equipment <span className="form-hint">comma-separated</span></label>
        <input className="form-input" value={form.equipment} onChange={e => set('equipment', e.target.value)} placeholder="bodyweight, dumbbells" />
      </div>
      <div className="form-field">
        <label>Duration (seconds)</label>
        <input className="form-input" type="number" min={10} max={600} value={form.duration_estimate_seconds} onChange={e => set('duration_estimate_seconds', e.target.value)} />
      </div>
      <div className="form-field">
        <label>Instructions <span className="form-hint">one per line</span></label>
        <textarea className="form-input form-textarea" value={form.instructions} onChange={e => set('instructions', e.target.value)} rows={5} placeholder={"Stand tall\nLower into squat\nDrive up"} />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={saving || !form.name.trim()}>
          {saving ? 'Saving…' : 'Save Exercise'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

// ── Library ───────────────────────────────────────────────────────────────────

function Library() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    apiFetch('/api/exercises')
      .then(r => r && r.json())
      .then(data => { if (data) setExercises(data); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        const res = await apiFetch(`/api/exercises?id=${editing.id}`, { method: 'PUT', body: JSON.stringify(data) });
        const updated = await res.json();
        setExercises(exs => exs.map(e => e.id === updated.id ? updated : e));
      } else {
        const res = await apiFetch('/api/exercises', { method: 'POST', body: JSON.stringify(data) });
        const created = await res.json();
        setExercises(exs => [...exs, created]);
      }
      setView('list');
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ex) => {
    if (!confirm(`Delete "${ex.name}"?`)) return;
    setDeleting(ex.id);
    await apiFetch(`/api/exercises?id=${ex.id}`, { method: 'DELETE' });
    setExercises(exs => exs.filter(e => e.id !== ex.id));
    setExpanded(null);
    setDeleting(null);
  };

  const cancel = () => { setEditing(null); setView('list'); };

  if (view === 'form') {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={cancel}>←</button>
          <h2 className="page-title">{editing ? 'Edit Exercise' : 'New Exercise'}</h2>
        </div>
        <ExerciseForm initial={editing} onSave={handleSave} onCancel={cancel} saving={saving} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Exercise Library</h2>
        <button className="btn-add" onClick={() => { setEditing(null); setView('form'); }}>+ New</button>
      </div>

      {loading && <p className="empty-state"><span className="spinner"></span></p>}
      {!loading && exercises.length === 0 && <p className="empty-state">No exercises yet.</p>}

      <div className="crud-list">
        {[...exercises].sort((a, b) => a.name.localeCompare(b.name)).map(ex => (
          <div key={ex.id} className="crud-card">
            <button className="crud-card-header" onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}>
              <div className="crud-card-info">
                <span className="crud-card-name">{ex.name}</span>
                <span className="crud-card-sub">{ex.muscle_groups?.join(', ')}</span>
              </div>
              <div className="crud-card-right">
                <DiffBadge level={ex.difficulty} />
                <span className="expand-icon">{expanded === ex.id ? '▲' : '▼'}</span>
              </div>
            </button>
            {expanded === ex.id && (
              <div className="crud-card-body">
                {ex.description && <p className="crud-detail-text">{ex.description}</p>}
                <div className="crud-detail-row">
                  <span className="crud-detail-label">Movement</span>
                  <span className="crud-detail-value">{ex.movement_type}</span>
                </div>
                <div className="crud-detail-row">
                  <span className="crud-detail-label">Equipment</span>
                  <span className="crud-detail-value">{ex.equipment?.join(', ')}</span>
                </div>
                <div className="crud-detail-row">
                  <span className="crud-detail-label">Duration</span>
                  <span className="crud-detail-value">{ex.duration_estimate_seconds}s</span>
                </div>
                {ex.instructions?.length > 0 && (
                  <ol className="crud-instructions">
                    {ex.instructions.map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                )}
                <div className="crud-card-actions">
                  <button className="btn-edit" onClick={() => { setEditing(ex); setView('form'); }}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(ex)} disabled={deleting === ex.id}>
                    {deleting === ex.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pod Form ──────────────────────────────────────────────────────────────────

function PodForm({ initial, exercises, onSave, onCancel, saving }) {
  const [name, setName] = useState(initial?.name || '');
  const [selectedIds, setSelectedIds] = useState(new Set(initial?.exercises || []));

  const toggle = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, exercises: [...selectedIds] });
  };

  return (
    <form className="crud-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label>Pod Name</label>
        <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="form-field">
        <label>Exercises <span className="form-hint">{selectedIds.size} selected</span></label>
        <div className="exercise-picker">
          {[...exercises].sort((a, b) => a.name.localeCompare(b.name)).map(ex => (
            <label key={ex.id} className={`picker-item${selectedIds.has(ex.id) ? ' selected' : ''}`}>
              <input type="checkbox" checked={selectedIds.has(ex.id)} onChange={() => toggle(ex.id)} />
              <div className="picker-item-info">
                <span className="picker-item-name">{ex.name}</span>
                <span className="picker-item-sub">{ex.duration_estimate_seconds}s · {ex.difficulty}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={saving || !name.trim() || selectedIds.size === 0}>
          {saving ? 'Saving…' : 'Save Pod'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

// ── Pods ──────────────────────────────────────────────────────────────────────

function Pods() {
  const [pods, setPods] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/pods').then(r => r && r.json()),
      apiFetch('/api/exercises').then(r => r && r.json()),
    ]).then(([podsData, exData]) => {
      if (podsData) setPods(podsData);
      if (exData) setExercises(exData);
    }).finally(() => setLoading(false));
  }, []);

  const exMap = Object.fromEntries(exercises.map(e => [e.id, e]));
  const mins = (secs) => Math.round(secs / 60);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        const res = await apiFetch(`/api/pods?id=${editing.id}`, { method: 'PUT', body: JSON.stringify(data) });
        const updated = await res.json();
        setPods(ps => ps.map(p => p.id === updated.id ? updated : p));
      } else {
        const res = await apiFetch('/api/pods', { method: 'POST', body: JSON.stringify(data) });
        const created = await res.json();
        setPods(ps => [...ps, created]);
      }
      setView('list');
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pod) => {
    if (!confirm(`Delete "${pod.name}"?`)) return;
    setDeleting(pod.id);
    await apiFetch(`/api/pods?id=${pod.id}`, { method: 'DELETE' });
    setPods(ps => ps.filter(p => p.id !== pod.id));
    setExpanded(null);
    setDeleting(null);
  };

  const handleFavorite = async (pod) => {
    const res = await apiFetch(`/api/pods?id=${pod.id}&action=favorite`, { method: 'PATCH' });
    const updated = await res.json();
    setPods(ps => ps.map(p => p.id === updated.id ? updated : p));
  };

  const cancel = () => { setEditing(null); setView('list'); };

  if (view === 'form') {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={cancel}>←</button>
          <h2 className="page-title">{editing ? 'Edit Pod' : 'New Pod'}</h2>
        </div>
        <PodForm initial={editing} exercises={exercises} onSave={handleSave} onCancel={cancel} saving={saving} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Pod Manager</h2>
        <button className="btn-add" onClick={() => { setEditing(null); setView('form'); }}>+ New</button>
      </div>

      {loading && <p className="empty-state"><span className="spinner"></span></p>}
      {!loading && pods.length === 0 && <p className="empty-state">No pods yet.</p>}

      <div className="crud-list">
        {[...pods].sort((a, b) => a.name.localeCompare(b.name)).map(pod => (
          <div key={pod.id} className="crud-card">
            <button className="crud-card-header" onClick={() => setExpanded(expanded === pod.id ? null : pod.id)}>
              <div className="crud-card-info">
                <span className="crud-card-name">{pod.name}</span>
                <span className="crud-card-sub">{pod.exercises.length} exercises · ~{mins(pod.total_duration_estimate_seconds)} min</span>
              </div>
              <div className="crud-card-right">
                <TypeBadge type={pod.pod_type} />
                {pod.is_favorite && <span className="fav-star">★</span>}
                <span className="expand-icon">{expanded === pod.id ? '▲' : '▼'}</span>
              </div>
            </button>
            {expanded === pod.id && (
              <div className="crud-card-body">
                <ul className="exercise-list">
                  {pod.exercises.map(id => {
                    const ex = exMap[id];
                    return ex ? (
                      <li key={id} className="exercise-item">
                        <div>
                          <p className="exercise-name">{ex.name}</p>
                          <p className="exercise-muscles">{ex.muscle_groups?.join(', ')}</p>
                        </div>
                        <DiffBadge level={ex.difficulty} />
                      </li>
                    ) : null;
                  })}
                </ul>
                <div className="crud-card-actions">
                  <button className="btn-favorite" onClick={() => handleFavorite(pod)}>
                    {pod.is_favorite ? '★ Unfav' : '☆ Fav'}
                  </button>
                  <button className="btn-edit" onClick={() => { setEditing(pod); setView('form'); }}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(pod)} disabled={deleting === pod.id}>
                    {deleting === pod.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────────────

function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/history')
      .then(r => r && r.json())
      .then(data => { if (data) setSessions(data); })
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const thisWeek = sessions.filter(s => now - s.completed_at < weekMs).length;
  const thisMonth = sessions.filter(s => now - s.completed_at < monthMs).length;

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="page">
      <h2 className="page-title">History</h2>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{thisWeek}</div>
          <div className="stat-label">This week</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{thisMonth}</div>
          <div className="stat-label">This month</div>
        </div>
      </div>

      {loading && <p className="empty-state"><span className="spinner"></span></p>}

      {!loading && sessions.length === 0 && (
        <p className="empty-state">No sessions yet. Complete your first pod!</p>
      )}

      <div className="history-list">
        {sessions.map((s, i) => (
          <div key={i} className="history-item">
            <div>
              <p className="history-pod-name">{s.pod_name}</p>
              <p className="history-meta">{formatDate(s.completed_at)}</p>
            </div>
            <TypeBadge type={s.pod_type || 'hybrid'} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bottom Nav ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'pods', label: 'Pods', icon: '📦' },
  { id: 'library', label: 'Library', icon: '📚' },
  { id: 'history', label: 'History', icon: '📋' },
];

function BottomNav({ page, onNav }) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ id, label, icon }) => (
        <button
          key={id}
          className={`nav-item${page === id ? ' active' : ''}`}
          onClick={() => onNav(id)}
        >
          <span className="nav-icon">{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [page, setPage] = useState('home');
  const [activePod, setActivePod] = useState(null);

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }

  if (activePod) {
    return (
      <div className="app-shell">
        <div className="main-content">
          <ActivePod
            pod={activePod}
            onBack={() => setActivePod(null)}
            onComplete={() => { setActivePod(null); setPage('history'); }}
          />
        </div>
        <BottomNav page={page} onNav={setPage} />
      </div>
    );
  }

  let content;
  if (page === 'home') {
    content = <Home onStart={p => setActivePod(p)} onBrowse={() => setPage('pods')} />;
  } else if (page === 'pods') {
    content = <Pods />;
  } else if (page === 'library') {
    content = <Library />;
  } else if (page === 'history') {
    content = <History />;
  }

  return (
    <div className="app-shell">
      <div className="main-content">{content}</div>
      <BottomNav page={page} onNav={setPage} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
