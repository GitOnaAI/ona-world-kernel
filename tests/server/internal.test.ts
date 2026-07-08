// Unit coverage for the internal route layer (server/internal.ts).
//
// The migration moved the /internal endpoint (the deploy-gated restart-countdown)
// off the inline handleInternalApi ladder onto a RouteDef the shared dispatcher
// serves under API_DISPATCH 'new'. It is a PARITY-FIRST migration: the thin
// handler REPRODUCES its frozen legacy branch byte-for-byte, writing the SAME
// { success, data, error } envelope via the module's ok()/fail() helpers (the
// internal envelope IS the admin shape, so the route carries surface 'internal'
// + meta.envelope 'admin'). The secret gate moves to the requireInternalSecret
// middleware.
//
// This file pins HANDLER behavior behind a PASSING gate (the exhaustive
// unset-env-404 / wrong-secret-401 gate sweep lives in
// tests/server/http/ownership_coverage.test.ts, so only one representative gate
// case is repeated here to prove the gate rides the RouteDef middleware). It
// also pins the frozen { success, data, error } envelope, the
// game.startRestartCountdown injection seam (configureInternalRuntime), and the
// internalBodyValidationRemap 500 (a handler throw serializes through
// withErrors/serializeAdmin as { success:false, data:null, error:'internal.error' }).
//
// server/db builds a pg Pool at module load and throws when DATABASE_URL is unset;
// a dummy URL is set defensively before the module graph evaluates.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.DATABASE_URL ??= 'postgres://test:test@127.0.0.1:5433/wocc_phase18_internal';
});

import type * as http from 'node:http';
import { compose } from '../../server/http/compose';
import { withErrors } from '../../server/http/middleware/with_errors';
import type { Method, Middleware } from '../../server/http/types';
import {
  configureInternalRuntime,
  type InternalRuntime,
  resetInternalRuntimeForTests,
  routes,
} from '../../server/internal';
import { type FakeRes, fakeCtx } from './helpers';

// The shared secret and its matching header. The gate reads the env var
// PER REQUEST, so each test sets it as needed and passes the header.
const DEPLOY_SECRET = 'deploy-secret';
const DEPLOY_HEADERS = { 'x-owk-deploy-secret': DEPLOY_SECRET };

// The routes as [method, path], the legacy handleInternalApi ladder order.
const EXPECTED_ROUTES: ReadonlyArray<readonly [Method, string]> = [
  ['POST', '/internal/restart-countdown'],
];

/** Read status/body/content-type/headers off the fakeCtx's FakeRes. */
function readRes(res: http.ServerResponse): {
  status: number;
  body: unknown;
  raw: string;
  contentType: string | undefined;
  headers: Record<string, string | number | string[]>;
} {
  const fake = res as unknown as FakeRes;
  const raw = fake.body;
  let body: unknown;
  try {
    body = raw ? JSON.parse(raw) : undefined;
  } catch {
    body = undefined;
  }
  return {
    status: fake.statusCode,
    body,
    raw,
    contentType: fake.headers['content-type'] as string | undefined,
    headers: fake.headers,
  };
}

/** Grab a route by method + path (paths repeat across methods, so both are needed). */
function routeFor(method: Method, path: string) {
  const route = routes.find((r) => r.method === method && r.path === path);
  if (!route) throw new Error(`no route ${method} ${path}`);
  return route;
}

/** Drive a full route chain (its real gate middleware + handler) under withErrors. */
async function runRoute(
  method: Method,
  path: string,
  opts: { url?: string; body?: unknown; headers?: Record<string, string> } = {},
) {
  const route = routeFor(method, path);
  let reached = false;
  const terminal: Middleware = async (c) => {
    reached = true;
    await route.handler(c);
  };
  const ctx = fakeCtx({
    method,
    url: opts.url ?? path,
    headers: opts.headers,
    body: opts.body,
  });
  const stack: Middleware[] = [
    withErrors({ surface: route.meta?.envelope }),
    ...(route.middleware ?? []),
    terminal,
  ];
  await compose(stack)(ctx);
  return { reached, ...readRes(ctx.res) };
}

const ORIGINAL_DEPLOY_SECRET = process.env.RESTART_COUNTDOWN_SECRET;

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

beforeEach(() => {
  vi.resetAllMocks();
  delete process.env.RESTART_COUNTDOWN_SECRET;
  resetInternalRuntimeForTests();
});

afterEach(() => {
  restoreEnv('RESTART_COUNTDOWN_SECRET', ORIGINAL_DEPLOY_SECRET);
  resetInternalRuntimeForTests();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 1. Registration shape.
// ---------------------------------------------------------------------------

describe('internal route registration', () => {
  it('registers exactly 1 route matching the legacy method+path ladder', () => {
    expect(routes).toHaveLength(1);
    const actual = routes.map((r) => `${r.method} ${r.path}`).sort();
    const expected = EXPECTED_ROUTES.map(([m, p]) => `${m} ${p}`).sort();
    expect(actual).toEqual(expected);
  });

  it('every route is surface internal, envelope admin, with a non-empty gate middleware', () => {
    for (const r of routes) {
      expect(r.surface, r.path).toBe('internal');
      expect(r.meta?.envelope, r.path).toBe('admin');
      expect(Array.isArray(r.middleware) && r.middleware.length > 0, r.path).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. restart-countdown (deploy gate + injected runtime).
// ---------------------------------------------------------------------------

describe('restart-countdown', () => {
  it('200s with the status payload when the countdown starts', async () => {
    process.env.RESTART_COUNTDOWN_SECRET = DEPLOY_SECRET;
    const status = { started: true, active: true, totalSeconds: 600, remainingSeconds: 600 };
    const startRestartCountdown = vi.fn(() => status);
    configureInternalRuntime({ startRestartCountdown } as unknown as InternalRuntime);

    const r = await runRoute('POST', '/internal/restart-countdown', { headers: DEPLOY_HEADERS });

    expect(r.reached).toBe(true);
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ success: true, data: status, error: null });
    expect(startRestartCountdown).toHaveBeenCalledTimes(1);
  });

  it('409s carrying the status payload when a countdown is already active', async () => {
    process.env.RESTART_COUNTDOWN_SECRET = DEPLOY_SECRET;
    const status = { started: false, active: true, totalSeconds: 600, remainingSeconds: 540 };
    configureInternalRuntime({
      startRestartCountdown: vi.fn(() => status),
    } as unknown as InternalRuntime);

    const r = await runRoute('POST', '/internal/restart-countdown', { headers: DEPLOY_HEADERS });

    expect(r.status).toBe(409);
    expect(r.body).toEqual({
      success: false,
      data: status,
      error: 'restart countdown already active',
    });
  });

  it('500s internal.error when the runtime was never configured', async () => {
    process.env.RESTART_COUNTDOWN_SECRET = DEPLOY_SECRET;
    resetInternalRuntimeForTests();
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const r = await runRoute('POST', '/internal/restart-countdown', { headers: DEPLOY_HEADERS });

    expect(r.status).toBe(500);
    expect(r.body).toEqual({ success: false, data: null, error: 'internal.error' });
    errSpy.mockRestore();
  });

  it('representative gate case: an unset env secret answers the feature-off 404 before the handler', async () => {
    // The exhaustive gate sweep (every route, unset-404 + wrong-secret-401) lives in
    // ownership_coverage.test.ts; this one case proves the gate rides the RouteDef.
    const startRestartCountdown = vi.fn();
    configureInternalRuntime({ startRestartCountdown } as unknown as InternalRuntime);

    const r = await runRoute('POST', '/internal/restart-countdown', { headers: DEPLOY_HEADERS });

    expect(r.reached).toBe(false);
    expect(r.status).toBe(404);
    expect(r.body).toEqual({ success: false, data: null, error: 'unknown endpoint' });
    expect(startRestartCountdown).not.toHaveBeenCalled();
  });
});
