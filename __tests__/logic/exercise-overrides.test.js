/**
 * Tests for the reps/duration toggle and save-default logic used in Home, Pods, and Library.
 * This mirrors the handleExTrackMode / handleExOverride / confirmSaveDefault functions.
 */

function getInitialField(ex) {
  return ex.reps ? 'reps' : 'duration_estimate_seconds';
}

function buildTrackModeOverride(ex, newField) {
  const defaultVal = newField === 'reps'
    ? (ex.reps || 10)
    : (ex.duration_estimate_seconds || 45);
  const origField = getInitialField(ex);
  const changed = newField !== origField || defaultVal !== ex[origField];
  return { field: newField, value: defaultVal, raw: String(defaultVal), changed };
}

function buildSavePayload(pending) {
  const payload = { [pending.field]: pending.value };
  if (pending.field === 'duration_estimate_seconds') {
    payload.reps = null;
  }
  return payload;
}

function applyOverrideInput(ex, overrides, rawVal) {
  const field = overrides?.field ?? getInitialField(ex);
  const numVal = parseInt(rawVal, 10);
  const valid = !isNaN(numVal) && numVal >= 1;
  const prevValue = overrides?.value ?? (ex[field] || 1);
  return {
    field,
    value: valid ? numVal : prevValue,
    raw: rawVal,
    valid,
  };
}

describe('getInitialField', () => {
  it('returns reps when ex.reps is set', () => {
    expect(getInitialField({ reps: 10 })).toBe('reps');
  });

  it('returns duration when ex.reps is null', () => {
    expect(getInitialField({ reps: null, duration_estimate_seconds: 45 })).toBe('duration_estimate_seconds');
  });

  it('returns duration when ex.reps is undefined', () => {
    expect(getInitialField({ duration_estimate_seconds: 30 })).toBe('duration_estimate_seconds');
  });

  it('returns duration when ex.reps is 0 (falsy)', () => {
    expect(getInitialField({ reps: 0, duration_estimate_seconds: 45 })).toBe('duration_estimate_seconds');
  });
});

describe('buildTrackModeOverride', () => {
  it('switching from duration to reps uses ex.reps or fallback 10', () => {
    const ex = { duration_estimate_seconds: 45 };
    const result = buildTrackModeOverride(ex, 'reps');
    expect(result.field).toBe('reps');
    expect(result.value).toBe(10); // fallback
    expect(result.changed).toBe(true);
  });

  it('switching from reps to duration uses ex.duration_estimate_seconds or fallback 45', () => {
    const ex = { reps: 8, duration_estimate_seconds: 30 };
    const result = buildTrackModeOverride(ex, 'duration_estimate_seconds');
    expect(result.field).toBe('duration_estimate_seconds');
    expect(result.value).toBe(30);
    expect(result.changed).toBe(true);
  });

  it('selecting same field with same value is not changed', () => {
    const ex = { reps: 10 };
    const result = buildTrackModeOverride(ex, 'reps');
    expect(result.changed).toBe(false);
  });
});

describe('buildSavePayload — critical regression tests', () => {
  it('duration mode: payload contains reps: null to clear the field', () => {
    const payload = buildSavePayload({ field: 'duration_estimate_seconds', value: 45 });
    expect(payload.reps).toBeNull();
    expect(payload.duration_estimate_seconds).toBe(45);
  });

  it('reps mode: payload does NOT set reps: null', () => {
    const payload = buildSavePayload({ field: 'reps', value: 12 });
    expect(payload.reps).toBe(12);
    expect(payload).not.toHaveProperty('duration_estimate_seconds');
  });

  it('duration payload with reps: null will override existing reps when API merges', () => {
    const storedExercise = { id: 'ex1', name: 'Squats', reps: 10, duration_estimate_seconds: 60 };
    const payload = buildSavePayload({ field: 'duration_estimate_seconds', value: 45 });
    const merged = { ...storedExercise, ...payload };
    // After merge, reps should be null — exercise is now timer-based
    expect(merged.reps).toBeNull();
    expect(merged.duration_estimate_seconds).toBe(45);
  });

  it('reps payload correctly activates reps mode after merge', () => {
    const storedExercise = { id: 'ex1', name: 'Plank', duration_estimate_seconds: 60 };
    const payload = buildSavePayload({ field: 'reps', value: 15 });
    const merged = { ...storedExercise, ...payload };
    expect(merged.reps).toBe(15);
    expect(getInitialField(merged)).toBe('reps');
  });
});

describe('applyOverrideInput', () => {
  it('stores valid numeric input', () => {
    const ex = { reps: 10 };
    const result = applyOverrideInput(ex, null, '15');
    expect(result.value).toBe(15);
    expect(result.valid).toBe(true);
  });

  it('keeps previous value for empty input', () => {
    const ex = { reps: 10 };
    const prev = { field: 'reps', value: 10, raw: '10' };
    const result = applyOverrideInput(ex, prev, '');
    expect(result.valid).toBe(false);
    expect(result.value).toBe(10); // previous preserved
    expect(result.raw).toBe('');
  });

  it('keeps previous value for non-numeric input', () => {
    const ex = { reps: 10 };
    const prev = { field: 'reps', value: 10, raw: '10' };
    const result = applyOverrideInput(ex, prev, 'abc');
    expect(result.valid).toBe(false);
    expect(result.value).toBe(10);
  });

  it('rejects values below 1', () => {
    const ex = { reps: 10 };
    const result = applyOverrideInput(ex, null, '0');
    expect(result.valid).toBe(false);
  });
});

describe('sortPods favourites sort uses is_favorite field', () => {
  it('favorite pods sort before non-favorite', () => {
    const pods = [
      { id: 'a', name: 'Alpha', is_favorite: false, created_at: 100 },
      { id: 'b', name: 'Beta', is_favorite: true, created_at: 200 },
    ];
    const sorted = [...pods].sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return a.name.localeCompare(b.name);
    });
    expect(sorted[0].id).toBe('b');
    expect(sorted[1].id).toBe('a');
  });
});
