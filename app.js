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

// ── Library ───────────────────────────────────────────────────────────────────

function Library() {
  return (
    <div className="page">
      <h2 className="page-title">Exercise Library</h2>
      <div className="coming-soon">
        <span className="icon">📚</span>
        <p>Coming soon</p>
      </div>
    </div>
  );
}

// ── Pods ──────────────────────────────────────────────────────────────────────

function Pods() {
  return (
    <div className="page">
      <h2 className="page-title">Pod Manager</h2>
      <div className="coming-soon">
        <span className="icon">📦</span>
        <p>Coming soon</p>
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
