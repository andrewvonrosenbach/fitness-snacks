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

const TYPE_BADGE_CLASS = {
  strength: 'badge-strength',
  mobility: 'badge-mobility',
  hybrid: 'badge-hybrid',
  core: 'badge-core',
  bedtime: 'badge-bedtime',
};

function TypeBadge({ type }) {
  const cls = TYPE_BADGE_CLASS[type] || 'badge-hybrid';
  return <span className={`pod-type-badge ${cls}`}>{type}</span>;
}

// ── Difficulty Badge ──────────────────────────────────────────────────────────

function DiffBadge({ level }) {
  const cls = level === 'beginner' ? 'diff-beginner' : level === 'intermediate' ? 'diff-intermediate' : 'diff-advanced';
  return <span className={`difficulty-badge ${cls}`}>{level}</span>;
}

// ── Pomodoro Timer ────────────────────────────────────────────────────────────

const POMODORO_OPTIONS = [
  { label: '5 min', secs: 300 },
  { label: '10 min', secs: 600 },
  { label: '25 min', secs: 1500 },
  { label: '50 min', secs: 3000 },
];

function playAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (startAt, freq, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.25, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
      osc.start(startAt);
      osc.stop(startAt + duration);
    };
    beep(ctx.currentTime, 880, 0.25);
    beep(ctx.currentTime + 0.3, 880, 0.25);
    beep(ctx.currentTime + 0.6, 1046, 0.5);
  } catch {}
}

function playExerciseTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (startAt, freq, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.18, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + dur);
      osc.start(startAt);
      osc.stop(startAt + dur);
    };
    beep(ctx.currentTime, 660, 0.12);
    beep(ctx.currentTime + 0.15, 880, 0.22);
  } catch {}
}

function PomodoroTimer() {
  const [selected, setSelected] = useState(null);
  const [secsLeft, setSecsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  // timerRef holds mutable timer state safe to read from closures
  const timerRef = useRef({ endTime: null, running: false });

  const finishPomodoro = useCallback(() => {
    timerRef.current.endTime = null;
    timerRef.current.running = false;
    setRunning(false);
    setDone(true);
    setSecsLeft(0);
    playAlarm();
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification('Fitness Snacks', { body: 'Time is up! Do a fitness snack.' }); } catch (_) {}
    }
  }, []);

  // Interval tick — uses timerRef so it's never stale
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const { endTime } = timerRef.current;
      if (!endTime) return;
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setSecsLeft(remaining);
      if (remaining === 0) finishPomodoro();
    }, 500);
    return () => clearInterval(id);
  }, [running, finishPomodoro]);

  // Catch up when app returns from background
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const { endTime, running: r } = timerRef.current;
      if (!endTime || !r) return;
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setSecsLeft(remaining);
      if (remaining === 0) finishPomodoro();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [finishPomodoro]);

  const selectOption = (opt) => {
    timerRef.current = { endTime: null, running: false };
    setSelected(opt);
    setSecsLeft(opt.secs);
    setRunning(false);
    setDone(false);
  };

  const start = () => {
    timerRef.current.endTime = Date.now() + secsLeft * 1000;
    timerRef.current.running = true;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setRunning(true);
  };

  const pause = () => {
    if (timerRef.current.endTime) {
      setSecsLeft(Math.max(0, Math.round((timerRef.current.endTime - Date.now()) / 1000)));
    }
    timerRef.current.endTime = null;
    timerRef.current.running = false;
    setRunning(false);
  };

  const reset = () => {
    timerRef.current = { endTime: null, running: false };
    setSelected(null);
    setSecsLeft(0);
    setRunning(false);
    setDone(false);
  };

  const mins = String(Math.floor(secsLeft / 60)).padStart(2, '0');
  const secs = String(secsLeft % 60).padStart(2, '0');
  const progress = selected ? 1 - secsLeft / selected.secs : 0;

  return (
    <div className="pomodoro-card">
      <p className="pomodoro-label">Pomodoro Timer</p>
      {!selected ? (
        <div className="pomodoro-options">
          {POMODORO_OPTIONS.map(opt => (
            <button key={opt.secs} className="pomodoro-opt-btn" onClick={() => selectOption(opt)}>
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="pomodoro-progress-ring">
            <svg viewBox="0 0 80 80" className="pomodoro-ring-svg">
              <circle cx="40" cy="40" r="34" className="ring-bg" />
              <circle
                cx="40" cy="40" r="34"
                className={`ring-fill${done ? ' ring-done' : ''}`}
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress)}`}
              />
            </svg>
            <div className="pomodoro-time">{mins}:{secs}</div>
          </div>
          <div className="pomodoro-controls">
            {done ? (
              <p className="pomodoro-done-msg">Done!</p>
            ) : (
              <button className="btn-ghost pomodoro-toggle" onClick={running ? pause : start}>
                {running ? 'Pause' : secsLeft === selected.secs ? 'Start' : 'Resume'}
              </button>
            )}
            <button className="btn-ghost pomodoro-reset" onClick={reset}>✕</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Home Screen ───────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'strength', label: 'Strength' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'core', label: 'Core' },
  { value: 'bedtime', label: 'Bedtime' },
];

function Home({ onStart, onBrowse }) {
  const [pod, setPod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [podType, setPodType] = useState('any');
  const [expandedEx, setExpandedEx] = useState(null);
  // { [exId]: { field: 'reps'|'duration_estimate_seconds', value: number, raw: string } }
  const [exOverrides, setExOverrides] = useState({});
  // { [exId]: { field, value } } — values changed from original, waiting for user to confirm save
  const [pendingDefaults, setPendingDefaults] = useState({});
  const [savingDefault, setSavingDefault] = useState(null);

  const fetchPod = useCallback(async (type) => {
    setLoading(true);
    setError(null);
    setExpandedEx(null);
    setExOverrides({});
    setPendingDefaults({});
    try {
      const typeParam = type && type !== 'any' ? `&type=${type}` : '';
      const res = await apiFetch(`/api/pods?random=1${typeParam}`);
      if (!res || !res.ok) {
        const body = await res?.json().catch(() => ({}));
        throw new Error(body?.error || 'No pods available');
      }
      const data = await res.json();
      setPod(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExOverride = (ex, rawVal) => {
    // Allow empty/partial input while typing — store the raw string, only update value when valid
    const field = exOverrides[ex.id]?.field ?? (ex.reps ? 'reps' : 'duration_estimate_seconds');
    const numVal = parseInt(rawVal, 10);
    const valid = !isNaN(numVal) && numVal >= 1;
    setExOverrides(prev => ({
      ...prev,
      [ex.id]: {
        field,
        value: valid ? numVal : (prev[ex.id]?.value ?? (ex[field] || 1)),
        raw: rawVal,
      },
    }));
    if (valid) {
      const origField = ex.reps ? 'reps' : 'duration_estimate_seconds';
      const changed = field !== origField || numVal !== ex[origField];
      if (changed) {
        setPendingDefaults(prev => ({ ...prev, [ex.id]: { field, value: numVal } }));
      } else {
        setPendingDefaults(prev => { const n = { ...prev }; delete n[ex.id]; return n; });
      }
    }
  };

  const handleExTrackMode = (ex, newField) => {
    const defaultVal = newField === 'reps'
      ? (ex.reps || 10)
      : (ex.duration_estimate_seconds || 45);
    const origField = ex.reps ? 'reps' : 'duration_estimate_seconds';
    const changed = newField !== origField || defaultVal !== ex[origField];
    setExOverrides(prev => ({
      ...prev,
      [ex.id]: { field: newField, value: defaultVal, raw: String(defaultVal) },
    }));
    if (changed) {
      setPendingDefaults(prev => ({ ...prev, [ex.id]: { field: newField, value: defaultVal } }));
    } else {
      setPendingDefaults(prev => { const n = { ...prev }; delete n[ex.id]; return n; });
    }
  };

  const confirmSaveDefault = async (exId) => {
    const pending = pendingDefaults[exId];
    if (!pending) return;
    setSavingDefault(exId);
    try {
      const payload = { [pending.field]: pending.value };
      // Switching to duration: clear reps so exercise becomes timer-based
      if (pending.field === 'duration_estimate_seconds') payload.reps = null;
      await apiFetch(`/api/exercises?id=${exId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setPendingDefaults(prev => { const n = { ...prev }; delete n[exId]; return n; });
    } finally {
      setSavingDefault(null);
    }
  };

  const dismissPending = (exId) => {
    setPendingDefaults(prev => { const n = { ...prev }; delete n[exId]; return n; });
  };

  const handleStart = () => {
    if (!pod) return;
    const updatedPod = {
      ...pod,
      exerciseDetails: (pod.exerciseDetails || []).map(ex => {
        const ov = exOverrides[ex.id];
        if (!ov) return ex;
        const updated = { ...ex, [ov.field]: ov.value };
        // If switching to duration, remove reps so ActivePod uses timer mode
        if (ov.field === 'duration_estimate_seconds') delete updated.reps;
        return updated;
      }),
    };
    onStart(updatedPod);
  };

  const mins = pod ? Math.round(pod.total_duration_estimate_seconds / 60) : null;

  return (
    <div className="home">
      <div className="home-header">
        <h1>Fitness Snacks</h1>
        <p>Quick breaks that add up</p>
      </div>

      <PomodoroTimer />

      <div className="pod-type-selector">
        {TYPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`type-sel-btn type-sel-${opt.value}${podType === opt.value ? ' active' : ''}`}
            onClick={() => setPodType(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {!pod && (
        <button className="get-pod-btn" onClick={() => fetchPod(podType)} disabled={loading}>
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
              {pod.is_favourite && <span className="fav">★ Favourite</span>}
            </div>
          </div>

          <ul className="exercise-list">
            {(pod.exerciseDetails || []).map(ex => {
              const ov = exOverrides[ex.id];
              const currentField = ov?.field ?? (ex.reps ? 'reps' : 'duration_estimate_seconds');
              const rawInput = ov?.raw ?? String(ex.reps ?? ex.duration_estimate_seconds);
              const fieldLabel = currentField === 'reps' ? 'Reps' : 'Duration (s)';
              const pending = pendingDefaults[ex.id];
              return (
                <li key={ex.id} className="exercise-item-expandable">
                  <button
                    className="exercise-item-header"
                    onClick={() => setExpandedEx(expandedEx === ex.id ? null : ex.id)}
                  >
                    <div>
                      <p className="exercise-name">{ex.name}</p>
                      <p className="exercise-muscles">{ex.muscle_groups?.join(', ')}</p>
                    </div>
                    <div className="exercise-item-right">
                      <DiffBadge level={ex.difficulty} />
                      <span className="expand-icon">{expandedEx === ex.id ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {expandedEx === ex.id && (
                    <div className="exercise-item-details">
                      {ex.description && <p className="crud-detail-text">{ex.description}</p>}
                      {ex.equipment?.length > 0 && (
                        <div className="crud-detail-row">
                          <span className="crud-detail-label">Equipment</span>
                          <span className="crud-detail-value">{ex.equipment.join(', ')}</span>
                        </div>
                      )}
                      <div className="ex-override-track-toggle">
                        <button
                          className={`ex-track-btn${currentField === 'duration_estimate_seconds' ? ' active' : ''}`}
                          onClick={e => { e.stopPropagation(); handleExTrackMode(ex, 'duration_estimate_seconds'); }}
                        >
                          Duration
                        </button>
                        <button
                          className={`ex-track-btn${currentField === 'reps' ? ' active' : ''}`}
                          onClick={e => { e.stopPropagation(); handleExTrackMode(ex, 'reps'); }}
                        >
                          Reps
                        </button>
                      </div>
                      <div className="crud-detail-row">
                        <span className="crud-detail-label">{fieldLabel}</span>
                        <input
                          type="number"
                          className="ex-override-input"
                          value={rawInput}
                          min={1}
                          max={currentField === 'reps' ? 200 : 600}
                          onClick={e => e.stopPropagation()}
                          onChange={e => handleExOverride(ex, e.target.value)}
                        />
                      </div>
                      {pending && (
                        <div className="ex-save-default-row">
                          <span className="ex-save-default-label">Save as new default?</span>
                          <button
                            className="ex-save-yes"
                            onClick={() => confirmSaveDefault(ex.id)}
                            disabled={savingDefault === ex.id}
                          >
                            {savingDefault === ex.id ? '…' : 'Yes'}
                          </button>
                          <button className="ex-save-no" onClick={() => dismissPending(ex.id)}>No</button>
                        </div>
                      )}
                      {ex.instructions?.length > 0 && (
                        <ol className="crud-instructions">
                          {ex.instructions.map((step, i) => <li key={i}>{step}</li>)}
                        </ol>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="pod-actions">
            <button className="btn-start" onClick={handleStart}>Start</button>
            <button className="btn-ghost" onClick={() => fetchPod(podType)} disabled={loading}>Shuffle</button>
            <button className="btn-ghost" onClick={onBrowse}>Browse</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Active Pod ────────────────────────────────────────────────────────────────

function ActivePod({ pod, onBack, onComplete }) {
  const exercises = pod.exerciseDetails || [];
  const totalExercises = exercises.length;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [podDone, setPodDone] = useState(false);
  const [secsLeft, setSecsLeft] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [exerciseDone, setExerciseDone] = useState(false);

  // Holds mutable timer state readable from intervals/callbacks without staleness
  const timerRef = useRef({ endTime: null, running: false });
  // Used to signal that the next exercise should auto-start its timer
  const autoStartRef = useRef(false);
  // Ref copy of currentIdx so finishExercise can read it without stale closure
  const currentIdxRef = useRef(0);
  // Ref copy of exercises array
  const exercisesRef = useRef(exercises);
  useEffect(() => { exercisesRef.current = exercises; }, [exercises]);

  const currentEx = exercises[currentIdx];
  const isTimerBased = currentEx && !currentEx.reps;

  const finishExercise = useCallback(() => {
    timerRef.current.endTime = null;
    timerRef.current.running = false;
    setTimerRunning(false);
    setExerciseDone(true);
    setSecsLeft(0);

    const idx = currentIdxRef.current;
    const exs = exercisesRef.current;
    const nextIdx = idx + 1;

    if (nextIdx >= exs.length) {
      playAlarm();
      setTimeout(() => setPodDone(true), 1400);
    } else {
      playExerciseTone();
      const nextEx = exs[nextIdx];
      // Auto-start next exercise's timer if it's timer-based
      setTimeout(() => {
        autoStartRef.current = !nextEx.reps;
        currentIdxRef.current = nextIdx;
        setCurrentIdx(nextIdx);
      }, 1400);
    }
  }, []);

  // Initialize state when exercise changes
  useEffect(() => {
    setExerciseDone(false);
    timerRef.current = { endTime: null, running: false };

    if (!currentEx) return;
    if (isTimerBased) {
      const secs = currentEx.duration_estimate_seconds || 30;
      setSecsLeft(secs);
      if (autoStartRef.current) {
        timerRef.current.endTime = Date.now() + secs * 1000;
        timerRef.current.running = true;
        setTimerRunning(true);
      } else {
        setTimerRunning(false);
      }
    } else {
      setSecsLeft(null);
      setTimerRunning(false);
    }
    autoStartRef.current = false;
  }, [currentIdx]); // eslint-disable-line

  // Timer interval
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      const { endTime } = timerRef.current;
      if (!endTime) return;
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setSecsLeft(remaining);
      if (remaining === 0) finishExercise();
    }, 500);
    return () => clearInterval(id);
  }, [timerRunning, finishExercise]);

  // Catch up when returning from background
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const { endTime, running: r } = timerRef.current;
      if (!endTime || !r) return;
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setSecsLeft(remaining);
      if (remaining === 0) finishExercise();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [finishExercise]);

  const startTimer = () => {
    if (!currentEx || !isTimerBased) return;
    timerRef.current.endTime = Date.now() + (secsLeft || currentEx.duration_estimate_seconds) * 1000;
    timerRef.current.running = true;
    setTimerRunning(true);
  };

  const handleRepsDone = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= totalExercises) {
      playAlarm();
      setPodDone(true);
      return;
    }
    playExerciseTone();
    const nextEx = exercises[nextIdx];
    autoStartRef.current = !nextEx.reps;
    currentIdxRef.current = nextIdx;
    setCurrentIdx(nextIdx);
  };

  const handleComplete = async () => {
    try {
      await apiFetch('/api/history', {
        method: 'POST',
        body: JSON.stringify({ pod_id: pod.id, pod_type: pod.pod_type, pod_name: pod.name }),
      });
    } catch (_) {}
    onComplete();
  };

  const timerMins = secsLeft !== null ? String(Math.floor(secsLeft / 60)).padStart(2, '0') : '00';
  const timerSecs = secsLeft !== null ? String(secsLeft % 60).padStart(2, '0') : '00';

  if (podDone) {
    return (
      <div className="active-pod">
        <div className="active-pod-header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2 className="active-pod-title">{pod.name}</h2>
          <TypeBadge type={pod.pod_type} />
        </div>
        <div className="pod-complete-card">
          <div className="pod-complete-icon">🎉</div>
          <h3 className="pod-complete-title">Pod Complete!</h3>
          <p className="pod-complete-sub">{totalExercises} exercise{totalExercises !== 1 ? 's' : ''} done</p>
        </div>
        <div className="complete-actions">
          <button className="btn-primary" onClick={handleComplete}>Save & Finish</button>
          <button className="btn-secondary" onClick={onBack}>Skip</button>
        </div>
      </div>
    );
  }

  return (
    <div className="active-pod">
      <div className="active-pod-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2 className="active-pod-title">{pod.name}</h2>
        <TypeBadge type={pod.pod_type} />
      </div>

      <div className="ex-progress-row">
        {exercises.map((_, i) => (
          <div
            key={i}
            className={`ex-progress-dot${i < currentIdx ? ' done' : i === currentIdx ? ' active' : ''}`}
          />
        ))}
      </div>

      <div className="current-ex-card">
        <div className="ex-counter">{currentIdx + 1} / {totalExercises}</div>
        <h3 className="ex-name">{currentEx?.name}</h3>
        {currentEx?.muscle_groups?.length > 0 && (
          <p className="ex-muscles">{currentEx.muscle_groups.join(', ')}</p>
        )}

        {isTimerBased && (
          <div className="ex-timer-section">
            <div className={`ex-timer-display${exerciseDone ? ' ex-timer-done' : ''}`}>
              {timerMins}:{timerSecs}
            </div>
            {!timerRunning && !exerciseDone && (
              <button className="btn-start-ex" onClick={startTimer}>
                {secsLeft !== null && secsLeft < (currentEx?.duration_estimate_seconds || 30) ? 'Resume' : 'Start'}
              </button>
            )}
            {timerRunning && <p className="ex-timer-label">Keep going…</p>}
            {exerciseDone && <p className="ex-timer-label ex-timer-done-label">Done ✓ — next up…</p>}
          </div>
        )}

        {!isTimerBased && currentEx && (
          <div className="ex-reps-section">
            <div className="ex-reps-display">
              {currentEx.reps} <span className="ex-reps-unit">reps</span>
            </div>
            <button className="btn-next-ex" onClick={handleRepsDone}>
              {currentIdx + 1 < totalExercises ? 'Next Exercise →' : 'Finish Pod →'}
            </button>
          </div>
        )}
      </div>

      {currentEx?.instructions?.length > 0 && (
        <div className="exercises-card">
          <p className="exercises-card-title">Instructions</p>
          <ol className="crud-instructions" style={{ padding: '12px 20px 14px' }}>
            {currentEx.instructions.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </div>
      )}

      <div className="active-pod-footer">
        <button className="btn-secondary" style={{ width: '100%' }} onClick={onBack}>Exit Pod</button>
      </div>
    </div>
  );
}

// ── Exercise Form ─────────────────────────────────────────────────────────────

const EXERCISE_DRAFT_KEY = 'draft_exercise';

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

  const [trackMode, setTrackMode] = useState(() => {
    if (initial?.reps) return 'reps';
    return 'duration';
  });

  const [form, setForm] = useState(() => {
    if (!initial) {
      try {
        const draft = sessionStorage.getItem(EXERCISE_DRAFT_KEY);
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed._trackMode) setTrackMode(parsed._trackMode);
          return parsed;
        }
      } catch {}
    }
    return toForm(initial);
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!initial) {
      sessionStorage.setItem(EXERCISE_DRAFT_KEY, JSON.stringify({ ...form, _trackMode: trackMode }));
    }
  }, [form, trackMode, initial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sessionStorage.removeItem(EXERCISE_DRAFT_KEY);
    const base = {
      ...form,
      muscle_groups: form.muscle_groups.split(',').map(s => s.trim()).filter(Boolean),
      equipment: form.equipment.split(',').map(s => s.trim()).filter(Boolean),
      instructions: form.instructions.split('\n').map(s => s.trim()).filter(Boolean),
    };
    if (trackMode === 'reps') {
      base.reps = Number(form.reps || 10);
      base.duration_estimate_seconds = 60;
      delete base._trackMode;
    } else {
      base.duration_estimate_seconds = Number(form.duration_estimate_seconds);
      delete base.reps;
      delete base._trackMode;
    }
    onSave(base);
  };

  const switchMode = (mode) => {
    setTrackMode(mode);
    if (mode === 'reps' && !form.reps) set('reps', 10);
    if (mode === 'duration' && !form.duration_estimate_seconds) set('duration_estimate_seconds', 45);
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
            <option value="core">Core</option>
            <option value="recovery">Recovery</option>
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
        <label>Track by</label>
        <div className="track-mode-toggle">
          <button
            type="button"
            className={`track-mode-btn${trackMode === 'duration' ? ' active' : ''}`}
            onClick={() => switchMode('duration')}
          >
            Duration
          </button>
          <button
            type="button"
            className={`track-mode-btn${trackMode === 'reps' ? ' active' : ''}`}
            onClick={() => switchMode('reps')}
          >
            Reps
          </button>
        </div>
        {trackMode === 'duration' ? (
          <input
            className="form-input"
            type="number"
            min={10}
            max={600}
            value={form.duration_estimate_seconds}
            onChange={e => set('duration_estimate_seconds', e.target.value)}
            placeholder="45"
          />
        ) : (
          <input
            className="form-input"
            type="number"
            min={1}
            max={200}
            value={form.reps || 10}
            onChange={e => set('reps', e.target.value)}
            placeholder="10"
          />
        )}
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

const EXERCISE_SORT_OPTIONS = [
  { value: 'recent', label: 'Recent' },
  { value: 'alpha', label: 'A–Z' },
  { value: 'type', label: 'By Type' },
];

const MOVEMENT_TYPE_ORDER = ['strength', 'mobility', 'both', 'core', 'recovery'];

function sortExercises(exercises, sort) {
  if (sort === 'alpha') return [...exercises].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'recent') return [...exercises].sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
  if (sort === 'type') {
    return [...exercises].sort((a, b) => {
      const ti = MOVEMENT_TYPE_ORDER.indexOf(a.movement_type);
      const tj = MOVEMENT_TYPE_ORDER.indexOf(b.movement_type);
      if (ti !== tj) return (ti === -1 ? 99 : ti) - (tj === -1 ? 99 : tj);
      return (b.created_at || 0) - (a.created_at || 0);
    });
  }
  return exercises;
}

function Library() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [sort, setSort] = useState('recent');

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
        setExercises(exs => [created, ...exs]);
      }
      sessionStorage.removeItem(EXERCISE_DRAFT_KEY);
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

  const cancel = () => {
    sessionStorage.removeItem(EXERCISE_DRAFT_KEY);
    setEditing(null);
    setView('list');
  };

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

  const sorted = sortExercises(exercises, sort);
  const grouped = sort === 'type';

  let groups = null;
  if (grouped) {
    const byType = {};
    for (const ex of sorted) {
      const t = ex.movement_type || 'other';
      if (!byType[t]) byType[t] = [];
      byType[t].push(ex);
    }
    groups = MOVEMENT_TYPE_ORDER.filter(t => byType[t]?.length > 0).map(t => ({ type: t, items: byType[t] }));
    const other = byType['other'];
    if (other?.length) groups.push({ type: 'other', items: other });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Exercise Library</h2>
        <button className="btn-add" onClick={() => { setEditing(null); setView('form'); }}>+ New</button>
      </div>

      <div className="sort-bar">
        {EXERCISE_SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`sort-btn${sort === opt.value ? ' active' : ''}`}
            onClick={() => setSort(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading && <p className="empty-state"><span className="spinner"></span></p>}
      {!loading && exercises.length === 0 && <p className="empty-state">No exercises yet.</p>}

      {grouped && groups ? groups.map(({ type, items }) => (
        <div key={type}>
          <div className="group-header">{type}</div>
          <div className="crud-list">
            {items.map(ex => <ExerciseCard key={ex.id} ex={ex} expanded={expanded} setExpanded={setExpanded} onEdit={() => { setEditing(ex); setView('form'); }} onDelete={handleDelete} deleting={deleting} />)}
          </div>
        </div>
      )) : (
        <div className="crud-list">
          {sorted.map(ex => <ExerciseCard key={ex.id} ex={ex} expanded={expanded} setExpanded={setExpanded} onEdit={() => { setEditing(ex); setView('form'); }} onDelete={handleDelete} deleting={deleting} />)}
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ ex, expanded, setExpanded, onEdit, onDelete, deleting }) {
  return (
    <div className="crud-card">
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
            <span className="crud-detail-label">{ex.reps ? 'Reps' : 'Duration'}</span>
            <span className="crud-detail-value">{ex.reps ? `${ex.reps} reps` : `${ex.duration_estimate_seconds}s`}</span>
          </div>
          {ex.instructions?.length > 0 && (
            <ol className="crud-instructions">
              {ex.instructions.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          )}
          <div className="crud-card-actions">
            <button className="btn-edit" onClick={onEdit}>Edit</button>
            <button className="btn-delete" onClick={() => onDelete(ex)} disabled={deleting === ex.id}>
              {deleting === ex.id ? '…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pod Form ──────────────────────────────────────────────────────────────────

const POD_DRAFT_KEY = 'draft_pod';
const ALL_POD_TYPES = ['strength', 'mobility', 'hybrid', 'core', 'bedtime'];

function PodForm({ initial, exercises, onSave, onCancel, saving }) {
  const [name, setName] = useState(() => {
    if (initial) return initial.name || '';
    try {
      const d = JSON.parse(sessionStorage.getItem(POD_DRAFT_KEY) || '{}');
      return d.name || '';
    } catch { return ''; }
  });

  const [orderedIds, setOrderedIds] = useState(() => {
    if (initial) return initial.exercises || [];
    try {
      const d = JSON.parse(sessionStorage.getItem(POD_DRAFT_KEY) || '{}');
      return d.orderedIds || [];
    } catch { return []; }
  });

  const [typeManual, setTypeManual] = useState(initial?.type_manual || false);
  const [manualType, setManualType] = useState(initial?.pod_type || 'hybrid');
  const initialType = useRef(initial?.pod_type || 'hybrid');

  const exMap = Object.fromEntries(exercises.map(e => [e.id, e]));
  const selectedSet = new Set(orderedIds);

  // Save draft on change
  useEffect(() => {
    if (!initial) {
      sessionStorage.setItem(POD_DRAFT_KEY, JSON.stringify({ name, orderedIds }));
    }
  }, [name, orderedIds, initial]);

  const toggle = (id) => {
    if (selectedSet.has(id)) {
      setOrderedIds(ids => ids.filter(i => i !== id));
    } else {
      setOrderedIds(ids => [...ids, id]);
    }
  };

  // Drag and drop reorder
  const dragIdx = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const handleDragStart = (i) => { dragIdx.current = i; };
  const handleDragOver = (e, i) => { e.preventDefault(); setDragOverIdx(i); };
  const handleDrop = (i) => {
    if (dragIdx.current === null || dragIdx.current === i) { setDragOverIdx(null); return; }
    const arr = [...orderedIds];
    const [moved] = arr.splice(dragIdx.current, 1);
    arr.splice(i, 0, moved);
    setOrderedIds(arr);
    dragIdx.current = null;
    setDragOverIdx(null);
  };
  const handleDragEnd = () => { dragIdx.current = null; setDragOverIdx(null); };

  // Touch drag
  const touchState = useRef({ startIdx: null, currentIdx: null });
  const handleTouchStart = (e, i) => {
    touchState.current.startIdx = i;
    touchState.current.currentIdx = i;
  };
  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const item = el?.closest('[data-drag-idx]');
    if (item) {
      const idx = parseInt(item.dataset.dragIdx, 10);
      touchState.current.currentIdx = idx;
      setDragOverIdx(idx);
    }
  };
  const handleTouchEnd = () => {
    const { startIdx, currentIdx } = touchState.current;
    if (startIdx !== null && currentIdx !== null && startIdx !== currentIdx) {
      const arr = [...orderedIds];
      const [moved] = arr.splice(startIdx, 1);
      arr.splice(currentIdx, 0, moved);
      setOrderedIds(arr);
    }
    touchState.current = { startIdx: null, currentIdx: null };
    setDragOverIdx(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sessionStorage.removeItem(POD_DRAFT_KEY);
    onSave({
      name,
      exercises: orderedIds,
      type_manual: typeManual,
      pod_type: manualType,
    });
  };

  const pickerExercises = [...exercises].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <form className="crud-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label>Pod Name</label>
        <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
      </div>

      <div className="form-field">
        <label>Pod Type{typeManual ? ' *' : ''} <span className="form-hint">{typeManual ? 'manual override' : 'auto from exercises'}</span></label>
        <select
          className="form-input"
          value={manualType}
          onChange={e => {
            setManualType(e.target.value);
            setTypeManual(e.target.value !== initialType.current || (initial?.type_manual || false) ? true : false);
          }}
        >
          {ALL_POD_TYPES.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      {orderedIds.length > 0 && (
        <div className="form-field">
          <label>Exercise Order <span className="form-hint">drag to reorder</span></label>
          <div className="ordered-list">
            {orderedIds.map((id, i) => {
              const ex = exMap[id];
              if (!ex) return null;
              return (
                <div
                  key={id}
                  data-drag-idx={i}
                  className={`ordered-item${dragOverIdx === i ? ' drag-over' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={e => handleTouchStart(e, i)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <span className="drag-handle">⠿</span>
                  <span className="ordered-item-name">{ex.name}</span>
                  <button type="button" className="ordered-item-remove" onClick={() => toggle(id)}>✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="form-field">
        <label>Add Exercises <span className="form-hint">{orderedIds.length} selected</span></label>
        <div className="exercise-picker">
          {pickerExercises.filter(ex => !selectedSet.has(ex.id)).map(ex => (
            <label key={ex.id} className="picker-item">
              <input type="checkbox" checked={false} onChange={() => toggle(ex.id)} />
              <div className="picker-item-info">
                <span className="picker-item-name">{ex.name}</span>
                <span className="picker-item-sub">{ex.reps ? `${ex.reps} reps` : `${ex.duration_estimate_seconds}s`} · {ex.difficulty}</span>
              </div>
            </label>
          ))}
          {pickerExercises.filter(ex => selectedSet.has(ex.id)).length === pickerExercises.length && (
            <p className="picker-all-selected">All exercises selected</p>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={saving || !name.trim() || orderedIds.length === 0}>
          {saving ? 'Saving…' : 'Save Pod'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

// ── Pods ──────────────────────────────────────────────────────────────────────

const POD_SORT_OPTIONS = [
  { value: 'recent', label: 'Recent' },
  { value: 'alpha', label: 'A–Z' },
  { value: 'type', label: 'By Type' },
  { value: 'favourites', label: 'Favourites' },
];

const POD_TYPE_ORDER = ['strength', 'mobility', 'hybrid', 'core', 'bedtime'];

function sortPods(pods, sort) {
  if (sort === 'alpha') return [...pods].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'recent') return [...pods].sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
  if (sort === 'favourites') {
    return [...pods].sort((a, b) => {
      if (a.is_favourite && !b.is_favourite) return -1;
      if (!a.is_favourite && b.is_favourite) return 1;
      return a.name.localeCompare(b.name);
    });
  }
  if (sort === 'type') {
    return [...pods].sort((a, b) => {
      const ti = POD_TYPE_ORDER.indexOf(a.pod_type);
      const tj = POD_TYPE_ORDER.indexOf(b.pod_type);
      if (ti !== tj) return (ti === -1 ? 99 : ti) - (tj === -1 ? 99 : tj);
      return (b.created_at || 0) - (a.created_at || 0);
    });
  }
  return pods;
}

function Pods({ onStart }) {
  const [pods, setPods] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [sort, setSort] = useState('recent');

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
        setPods(ps => [created, ...ps]);
      }
      sessionStorage.removeItem(POD_DRAFT_KEY);
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

  const handleFavourite = async (pod) => {
    const res = await apiFetch(`/api/pods?id=${pod.id}&action=favourite`, { method: 'PATCH' });
    const updated = await res.json();
    setPods(ps => ps.map(p => p.id === updated.id ? updated : p));
  };

  const handleStart = async (pod) => {
    const res = await apiFetch(`/api/pods?id=${pod.id}`);
    if (!res || !res.ok) return;
    const full = await res.json();
    onStart(full);
  };

  const cancel = () => {
    sessionStorage.removeItem(POD_DRAFT_KEY);
    setEditing(null);
    setView('list');
  };

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

  const sorted = sortPods(pods, sort);
  const grouped = sort === 'type';

  let groups = null;
  if (grouped) {
    const byType = {};
    for (const pod of sorted) {
      const t = pod.pod_type || 'hybrid';
      if (!byType[t]) byType[t] = [];
      byType[t].push(pod);
    }
    groups = POD_TYPE_ORDER.filter(t => byType[t]?.length > 0).map(t => ({ type: t, items: byType[t] }));
    const other = byType['other'];
    if (other?.length) groups.push({ type: 'other', items: other });
  }

  const renderPodCard = (pod) => (
    <div key={pod.id} className="crud-card">
      <button className="crud-card-header" onClick={() => setExpanded(expanded === pod.id ? null : pod.id)}>
        <div className="crud-card-info">
          <span className="crud-card-name">{pod.name}</span>
          <span className="crud-card-sub">{pod.exercises.length} exercises · ~{mins(pod.total_duration_estimate_seconds)} min</span>
        </div>
        <div className="crud-card-right">
          <TypeBadge type={pod.pod_type} />
          {pod.is_favourite && <span className="fav-star">★</span>}
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
                  <div className="exercise-item-right">
                    <span className="exercise-duration-tag">{ex.reps ? `${ex.reps} reps` : `${ex.duration_estimate_seconds}s`}</span>
                    <DiffBadge level={ex.difficulty} />
                  </div>
                </li>
              ) : null;
            })}
          </ul>
          <div className="crud-card-actions">
            <button className="btn-start-sm" onClick={() => handleStart(pod)}>▶ Start</button>
            <button className="btn-favourite" onClick={() => handleFavourite(pod)}>
              {pod.is_favourite ? '★ Unfavourite' : '☆ Favourite'}
            </button>
            <button className="btn-edit" onClick={() => { setEditing(pod); setView('form'); }}>Edit</button>
            <button className="btn-delete" onClick={() => handleDelete(pod)} disabled={deleting === pod.id}>
              {deleting === pod.id ? '…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Pod Manager</h2>
        <button className="btn-add" onClick={() => { setEditing(null); setView('form'); }}>+ New</button>
      </div>

      <div className="sort-bar">
        {POD_SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`sort-btn${sort === opt.value ? ' active' : ''}`}
            onClick={() => setSort(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading && <p className="empty-state"><span className="spinner"></span></p>}
      {!loading && pods.length === 0 && <p className="empty-state">No pods yet.</p>}

      {grouped && groups ? groups.map(({ type, items }) => (
        <div key={type}>
          <div className="group-header">{type}</div>
          <div className="crud-list">{items.map(renderPodCard)}</div>
        </div>
      )) : (
        <div className="crud-list">{sorted.map(renderPodCard)}</div>
      )}
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

// ── Top Nav ───────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'pods', label: 'Pods', icon: '📦' },
  { id: 'library', label: 'Library', icon: '📚' },
  { id: 'history', label: 'History', icon: '📋' },
];

function TopNav({ page, onNav }) {
  return (
    <nav className="top-nav">
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
        <TopNav page={page} onNav={setPage} />
        <div className="main-content">
          <ActivePod
            pod={activePod}
            onBack={() => setActivePod(null)}
            onComplete={() => { setActivePod(null); setPage('history'); }}
          />
        </div>
      </div>
    );
  }

  let content;
  if (page === 'home') {
    content = <Home onStart={p => setActivePod(p)} onBrowse={() => setPage('pods')} />;
  } else if (page === 'pods') {
    content = <Pods onStart={p => setActivePod(p)} />;
  } else if (page === 'library') {
    content = <Library />;
  } else if (page === 'history') {
    content = <History />;
  }

  return (
    <div className="app-shell">
      <TopNav page={page} onNav={setPage} />
      <div className="main-content">{content}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
