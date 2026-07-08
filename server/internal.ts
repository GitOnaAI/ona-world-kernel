import { timingSafeEqual } from 'node:crypto';
import type * as http from 'node:http';
import type { GameServer } from './game';
import {
  DEPLOY_SECRET_ENV,
  DEPLOY_SECRET_HEADER,
  requireInternalSecret,
} from './http/middleware/require_internal_secret';
import type { RouteDef, RouteMeta } from './http/types';
import { json } from './http_util';

function ok(res: http.ServerResponse, data: unknown): void {
  json(res, 200, { success: true, data, error: null });
}

function fail(res: http.ServerResponse, status: number, error: string, data: unknown = null): void {
  json(res, status, { success: false, data, error });
}

function secretsMatch(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export async function handleInternalApi(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  game: GameServer,
): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');

  if (url.pathname === '/internal/restart-countdown') {
    if (req.method !== 'POST') return fail(res, 404, 'unknown endpoint');
    const expected = process.env.RESTART_COUNTDOWN_SECRET ?? '';
    if (!expected) return fail(res, 404, 'unknown endpoint');
    const actual = String(req.headers['x-woc-deploy-secret'] ?? '');
    if (!secretsMatch(actual, expected)) return fail(res, 401, 'not authenticated');
    const status = game.startRestartCountdown();
    if (!status.started) return fail(res, 409, 'restart countdown already active', status);
    return ok(res, status);
  }

  return fail(res, 404, 'unknown endpoint');
}

// ── Route table ────────────────────────────
// The one handleInternalApi endpoint as a RouteDef for the shared dispatcher:
// the deploy-gated restart-countdown. PARITY-FIRST: the thin handler REPRODUCES
// its frozen legacy branch above byte-for-byte (same ok()/fail() envelope
// bodies), and the secret gate moves to the requireInternalSecret middleware,
// which writes the SAME legacy bodies (feature-off 404 'unknown endpoint',
// mismatch 401 'not authenticated'). The legacy handleInternalApi ladder stays
// intact as the flag-off rollback path (and as the dispatcher's delegate for
// unknown paths, wrong methods, and HEAD, which therefore keep the legacy 404
// 'unknown endpoint' behavior: the wrong-method restart-countdown stays 404,
// never the table router's 405).
//
// The one divergence is an UNEXPECTED handler throw
// (internalBodyValidationRemap, tests/server/http/known_deviations.ts): the
// legacy ladder has NO outer catch (a throw becomes an unhandled rejection in
// main.ts's fire-and-forget arm and the request hangs), while the new path's
// withErrors serializes it through the admin-shape serializer as 500
// { success: false, data: null, error: 'internal.error' }. The internal
// envelope IS the admin { success, data, error } shape, so the route carries
// meta.envelope 'admin' (EnvelopeKind is a frozen server/http/types.ts contract
// with no separate 'internal' member; serializeAdmin already emits this exact shape).

// The game-loop side effect the restart-countdown handler needs, injected at
// boot by main.ts (configureInternalRuntime(game)) so this module never
// imports the live GameServer instance.
export type InternalRuntime = Pick<GameServer, 'startRestartCountdown'>;

let internalRuntime: InternalRuntime | null = null;

export function configureInternalRuntime(runtime: InternalRuntime): void {
  internalRuntime = runtime;
}

/** Clear the injected runtime so a unit test can install its own fake. */
export function resetInternalRuntimeForTests(): void {
  internalRuntime = null;
}

/** The injected runtime, or a loud failure if a request somehow beat boot wiring. */
function useInternalRuntime(): InternalRuntime {
  if (internalRuntime === null) {
    throw new Error('internal runtime is not configured; call configureInternalRuntime');
  }
  return internalRuntime;
}

const INTERNAL_META: RouteMeta = { envelope: 'admin' };

// One gate instance per (header, env var) pair, shared across the routes that
// carry it, mirroring the legacy gate block exactly.
const deployGate = requireInternalSecret({
  header: DEPLOY_SECRET_HEADER,
  envVar: DEPLOY_SECRET_ENV,
});

export const routes: RouteDef[] = [
  {
    method: 'POST',
    path: '/internal/restart-countdown',
    surface: 'internal',
    meta: INTERNAL_META,
    middleware: [deployGate],
    handler: async (ctx) => {
      const status = useInternalRuntime().startRestartCountdown();
      if (!status.started) {
        return fail(ctx.res, 409, 'restart countdown already active', status);
      }
      return ok(ctx.res, status);
    },
  },
];
