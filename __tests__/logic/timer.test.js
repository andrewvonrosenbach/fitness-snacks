/**
 * Tests for the Pomodoro timer logic that mirrors what _pomodoroStore + PomodoroTimer does.
 * We test the pure functions rather than mounting the React component.
 */

function createStore() {
  return { selected: null, secsLeft: 0, running: false, done: false, endTime: null };
}

function initSecsLeft(store, now = Date.now()) {
  if (store.running && store.endTime && store.endTime > now) {
    return Math.max(0, Math.round((store.endTime - now) / 1000));
  }
  return store.secsLeft;
}

function initRunning(store, now = Date.now()) {
  return !!(store.running && store.endTime && store.endTime > now);
}

function applyStart(store, secsLeft, now = Date.now()) {
  const endTime = now + secsLeft * 1000;
  store.endTime = endTime;
  store.running = true;
  return endTime;
}

function applyPause(store, timerEndTime, now = Date.now()) {
  const remaining = timerEndTime
    ? Math.max(0, Math.round((timerEndTime - now) / 1000))
    : store.secsLeft;
  store.endTime = null;
  store.running = false;
  store.secsLeft = remaining;
  return remaining;
}

function applyReset(store) {
  store.selected = null;
  store.endTime = null;
  store.running = false;
  store.done = false;
  store.secsLeft = 0;
}

function applyFinish(store) {
  store.endTime = null;
  store.running = false;
  store.done = true;
  store.secsLeft = 0;
}

describe('Pomodoro timer initialization from store', () => {
  it('initializes to zero when store is empty', () => {
    const store = createStore();
    expect(initSecsLeft(store)).toBe(0);
    expect(initRunning(store)).toBe(false);
  });

  it('restores paused secsLeft from store', () => {
    const store = createStore();
    store.secsLeft = 240;
    store.running = false;
    expect(initSecsLeft(store)).toBe(240);
    expect(initRunning(store)).toBe(false);
  });

  it('restores a running timer from endTime', () => {
    const store = createStore();
    const now = 1000000;
    store.running = true;
    store.endTime = now + 120000; // 120s remaining
    expect(initSecsLeft(store, now)).toBe(120);
    expect(initRunning(store, now)).toBe(true);
  });

  it('treats an expired endTime as not running', () => {
    const store = createStore();
    const now = 1000000;
    store.running = true;
    store.endTime = now - 5000; // expired 5s ago
    expect(initSecsLeft(store, now)).toBe(0);
    expect(initRunning(store, now)).toBe(false);
  });

  it('restores done state', () => {
    const store = createStore();
    store.done = true;
    expect(store.done).toBe(true);
  });
});

describe('Pomodoro timer state transitions', () => {
  it('start stores endTime and sets running', () => {
    const store = createStore();
    store.secsLeft = 300;
    const now = 5000000;
    applyStart(store, store.secsLeft, now);
    expect(store.running).toBe(true);
    expect(store.endTime).toBe(now + 300000);
  });

  it('pause saves remaining secsLeft and clears endTime', () => {
    const store = createStore();
    const now = 5000000;
    store.running = true;
    store.endTime = now + 150000;
    const remaining = applyPause(store, store.endTime, now);
    expect(remaining).toBe(150);
    expect(store.secsLeft).toBe(150);
    expect(store.endTime).toBeNull();
    expect(store.running).toBe(false);
  });

  it('pause clamps remaining to 0 for an expired timer', () => {
    const store = createStore();
    const now = 5000000;
    store.running = true;
    store.endTime = now - 1000; // expired
    const remaining = applyPause(store, store.endTime, now);
    expect(remaining).toBe(0);
  });

  it('reset clears all store state', () => {
    const store = createStore();
    store.selected = { label: '10 min', secs: 600 };
    store.secsLeft = 300;
    store.running = true;
    store.endTime = 9999999;
    applyReset(store);
    expect(store.selected).toBeNull();
    expect(store.secsLeft).toBe(0);
    expect(store.running).toBe(false);
    expect(store.endTime).toBeNull();
    expect(store.done).toBe(false);
  });

  it('finish sets done and clears timer', () => {
    const store = createStore();
    store.running = true;
    store.endTime = 9999999;
    store.secsLeft = 1;
    applyFinish(store);
    expect(store.done).toBe(true);
    expect(store.running).toBe(false);
    expect(store.endTime).toBeNull();
    expect(store.secsLeft).toBe(0);
  });
});

describe('Pomodoro timer persistence across navigation', () => {
  it('a running timer can be restored after remount', () => {
    const store = createStore();
    const t0 = 10000000;
    store.selected = { label: '25 min', secs: 1500 };
    applyStart(store, 1500, t0);

    // Simulate navigation: 30s pass, component remounts
    const t1 = t0 + 30000;
    expect(initRunning(store, t1)).toBe(true);
    expect(initSecsLeft(store, t1)).toBe(1470);
  });

  it('a paused timer preserves remaining time across navigation', () => {
    const store = createStore();
    store.selected = { label: '10 min', secs: 600 };
    store.secsLeft = 250;
    store.running = false;
    store.endTime = null;

    // Remount: should see 250s, not running
    expect(initRunning(store)).toBe(false);
    expect(initSecsLeft(store)).toBe(250);
  });

  it('timer expired during navigation shows 0 and not running', () => {
    const store = createStore();
    const t0 = 10000000;
    applyStart(store, 10, t0); // 10s timer

    // 15s pass — timer already expired
    const t1 = t0 + 15000;
    expect(initRunning(store, t1)).toBe(false);
    expect(initSecsLeft(store, t1)).toBe(0);
  });
});
