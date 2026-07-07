import { beforeEach, describe, expect, it } from 'vitest';
import {
  providerUsageSnapshot,
  recordUsageCacheEvent,
  recordUsageMetric,
  resetProviderUsageForTests,
  setUsageCacheSize,
} from '../server/provider_usage';

function metricCounts(key: string, now: number) {
  const metric = providerUsageSnapshot(now).metrics.find((row) => row.key === key);
  if (!metric) throw new Error(`missing metric ${key}`);
  return metric.counts;
}

describe('provider usage metrics', () => {
  beforeEach(() => {
    resetProviderUsageForTests();
  });

  it('reports rolling counts across the admin dashboard windows', () => {
    const now = 1_000_000_000;
    recordUsageMetric('turnstile.verify.failure', now - 25 * 60 * 60_000);
    recordUsageMetric('turnstile.verify.failure', now - 2 * 60 * 60_000);
    recordUsageMetric('turnstile.verify.failure', now - 2 * 60_000);
    recordUsageMetric('turnstile.verify.failure', now - 30_000);

    expect(metricCounts('turnstile.verify.failure', now)).toEqual({
      m1: 1,
      m5: 2,
      h1: 2,
      h24: 3,
    });
  });

  it('keeps fixed-size bucketed counts under repeated events', () => {
    const now = 1_500_000_000;
    for (let i = 0; i < 25_000; i++) recordUsageMetric('github.releases.api', now);

    expect(metricCounts('github.releases.api', now)).toEqual({
      m1: 25_000,
      m5: 25_000,
      h1: 25_000,
      h24: 25_000,
    });
  });

  it('reuses old ring slots without leaking stale 24h counts', () => {
    const start = 2_000_000_000;
    for (let i = 0; i < 100; i++) recordUsageMetric('turnstile.verify', start);
    expect(metricCounts('turnstile.verify', start).h24).toBe(100);

    const later = start + 24 * 60 * 60_000 + 60_000;
    recordUsageMetric('turnstile.verify', later);

    expect(metricCounts('turnstile.verify', later)).toEqual({
      m1: 1,
      m5: 1,
      h1: 1,
      h24: 1,
    });
  });

  it('reports cache counters and current cache size', () => {
    const now = 2_000_000_000;
    setUsageCacheSize('github.releases', 3, 1024, now);
    recordUsageCacheEvent('github.releases', 'hit', now);
    recordUsageCacheEvent('github.releases', 'miss', now);
    recordUsageCacheEvent('github.releases', 'stale', now);
    recordUsageCacheEvent('github.releases', 'store', now);
    recordUsageCacheEvent('github.releases', 'failure', now);
    recordUsageCacheEvent('github.releases', 'eviction', now);

    const cache = providerUsageSnapshot(now).caches.find((row) => row.key === 'github.releases');
    expect(cache).toEqual(
      expect.objectContaining({
        entries: 3,
        maxEntries: 1024,
        hits: 1,
        misses: 1,
        staleRefreshes: 1,
        stores: 1,
        failures: 1,
        evictions: 1,
      }),
    );
  });
});
