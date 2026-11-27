import { describe, it, expect } from 'vitest';
import { getVisitCount, formatVisits, prefersNoTracking, COUNTER_BASE, COUNTER_KEY, SESSION_FLAG } from '../src/lib/visits.js';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => { data.set(k, String(v)); }
  };
}

function mockFetch(value = 42, ok = true) {
  const calls = [];
  const fn = async (url, opts) => {
    calls.push({ url, opts });
    return { ok, json: async () => ({ value }) };
  };
  fn.calls = calls;
  return fn;
}

const HOST = 'lance6x5.github.io';

describe('visit counter', () => {
  it('hits on the first load of a session, then only gets', async () => {
    const storage = memoryStorage();
    const fetchFn = mockFetch(1234);
    expect(await getVisitCount({ fetchFn, storage, nav: {}, hostname: HOST })).toBe(1234);
    expect(fetchFn.calls[0].url).toBe(`${COUNTER_BASE}/hit/${COUNTER_KEY}`);
    expect(fetchFn.calls[0].opts.cache).toBe('no-store');
    expect(fetchFn.calls[0].opts.credentials).toBe('omit');
    expect(fetchFn.calls[0].opts.headers).toBeUndefined();
    expect(storage.getItem(SESSION_FLAG)).toBe('1');

    expect(await getVisitCount({ fetchFn, storage, nav: {}, hostname: HOST })).toBe(1234);
    expect(fetchFn.calls[1].url).toBe(`${COUNTER_BASE}/get/${COUNTER_KEY}`);
  });

  it('returns null on network errors and non-OK responses', async () => {
    const failing = async () => { throw new Error('offline'); };
    expect(await getVisitCount({ fetchFn: failing, storage: memoryStorage(), nav: {}, hostname: HOST })).toBeNull();
    const notFound = mockFetch(0, false);
    expect(await getVisitCount({ fetchFn: notFound, storage: memoryStorage(), nav: {}, hostname: HOST })).toBeNull();
  });

  it('does not hit when Do Not Track or Global Privacy Control is on', async () => {
    for (const nav of [{ doNotTrack: '1' }, { globalPrivacyControl: true }]) {
      const fetchFn = mockFetch(7);
      expect(await getVisitCount({ fetchFn, storage: memoryStorage(), nav, hostname: HOST })).toBe(7);
      expect(fetchFn.calls).toHaveLength(1);
      expect(fetchFn.calls[0].url).toContain('/get/');
    }
    expect(prefersNoTracking({ doNotTrack: '0' })).toBe(false);
  });

  it('skips localhost and survives broken storage', async () => {
    const fetchFn = mockFetch(5);
    expect(await getVisitCount({ fetchFn, storage: memoryStorage(), nav: {}, hostname: 'localhost' })).toBeNull();
    expect(fetchFn.calls).toHaveLength(0);
    const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
    expect(await getVisitCount({ fetchFn, storage: broken, nav: {}, hostname: HOST })).toBe(5);
  });

  it('formats counts', () => {
    expect(formatVisits(12345, 'en-US')).toBe('12,345 visits');
    expect(formatVisits(1, 'en-US')).toBe('1 visit');
  });
});
