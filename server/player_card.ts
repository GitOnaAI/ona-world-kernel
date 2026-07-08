// Shareable player cards + referral capture (server side).
//
// Three public surfaces:
//   POST /api/card?character=<id>   (authed) - store/replace this character's
//                                    client-composited PNG, return its slug+URL.
//   GET  /p/<slug>                  - an Open-Graph HTML page that unfurls on X /
//                                    social apps and links into the game with ?ref.
//   GET  /p/<slug>/card.png         - the stored PNG (the og:image).
//
// Cards are stored as bytes in Postgres (shared by every realm process), so a
// shared link resolves no matter which realm serves the request. Referral
// capture only records the relationship; reward payout is out of scope.
import type http from 'node:http';
import {
  accountForSlug,
  getCharacter,
  getPlayerCardBySlug,
  getPlayerCardMetaBySlug,
  recordReferral,
  slugAvailable,
  upsertPlayerCard,
} from './db';
import { logger } from './http/logger';
import { isUniqueViolation, json, parsePngInfo, readBinaryBody } from './http_util';
import { recordUsageMetric } from './provider_usage';
import { REALM_PUBLIC_ORIGIN } from './realm';

// A composited card is ~1200×630 @2× PNG - comfortably under this bound, which
// is generous enough to never reject a legitimate upload yet caps memory.
export const MAX_CARD_BYTES = 4 * 1024 * 1024;
const CARD_PNG_DIMENSIONS = [
  { width: 1200, height: 630 },
  { width: 2400, height: 1260 },
] as const;
const MAX_CARD_DECODED_BYTES = (2400 * 4 + 1) * 1260;
const MAX_SLUG_LENGTH = 64;
const MAX_SLUG_ATTEMPTS = 25;
const DEFAULT_PRODUCTION_PUBLIC_ORIGIN = 'https://onaworld.example';
const TRUSTED_PUBLIC_HOST_ORIGINS = new Map([
  ['onaworld.example', DEFAULT_PRODUCTION_PUBLIC_ORIGIN],
  ['www.onaworld.example', DEFAULT_PRODUCTION_PUBLIC_ORIGIN],
  ['dev.onaworld.example', 'https://dev.onaworld.example'],
]);
const CARD_NOT_FOUND_HEADERS = {
  'Content-Type': 'text/plain',
  'Cache-Control': 'no-store, max-age=0',
} as const;
const CARD_PAGE_NOT_FOUND_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
} as const;

export const PUBLIC_CARD_LOCALES = ['en', 'pt_BR'] as const;
export type PublicCardLocale = (typeof PUBLIC_CARD_LOCALES)[number];

type PlayerClassKey =
  | 'warrior'
  | 'paladin'
  | 'hunter'
  | 'rogue'
  | 'priest'
  | 'shaman'
  | 'mage'
  | 'warlock'
  | 'druid';

export interface PublicCardCopy {
  gameName: string;
  unknownClass: string;
  levelClass: string;
  description: string;
  cta: string;
  missingTitle: string;
  missingHeading: string;
  missingDescription: string;
  missingCta: string;
  classes: Record<PlayerClassKey, string>;
}

const EN_CLASSES: Record<PlayerClassKey, string> = {
  warrior: 'Warrior',
  paladin: 'Paladin',
  hunter: 'Hunter',
  rogue: 'Rogue',
  priest: 'Priest',
  shaman: 'Shaman',
  mage: 'Mage',
  warlock: 'Warlock',
  druid: 'Druid',
};

export const PUBLIC_CARD_COPY: Record<PublicCardLocale, PublicCardCopy> = {
  en: {
    gameName: 'Ona World Kernel',
    unknownClass: 'Adventurer',
    levelClass: 'Level {level} {className}',
    description: '{name} is forging a legend in Ona World Kernel. Join the realm.',
    cta: 'Forge your legend',
    missingTitle: 'Card not found',
    missingHeading: 'This card is no longer available.',
    missingDescription: 'It may have been retired or never existed.',
    missingCta: 'Enter Ona World Kernel',
    classes: EN_CLASSES,
  },
  pt_BR: {
    gameName: 'Ona World Kernel',
    unknownClass: 'Aventureiro',
    levelClass: 'Nível {level} {className}',
    description: '{name} está forjando uma lenda em Ona World Kernel. Entre no reino.',
    cta: 'Forje sua lenda',
    missingTitle: 'Cartão não encontrado',
    missingHeading: 'Este cartão não está mais disponível.',
    missingDescription: 'Ele pode ter sido removido ou nunca ter existido.',
    missingCta: 'Entrar em Ona World Kernel',
    classes: {
      warrior: 'Guerreiro',
      paladin: 'Paladino',
      hunter: 'Caçador',
      rogue: 'Ladino',
      priest: 'Sacerdote',
      shaman: 'Xamã',
      mage: 'Mago',
      warlock: 'Bruxo',
      druid: 'Druida',
    },
  },
};

const PUBLIC_CARD_LOCALE_BY_LOWER = new Map(
  PUBLIC_CARD_LOCALES.map((locale) => [locale.toLowerCase(), locale]),
);

export function normalizePublicCardLocale(raw: unknown): PublicCardLocale {
  if (typeof raw !== 'string') return 'en';
  const cleaned = raw.trim().replace(/-/g, '_');
  const exact = PUBLIC_CARD_LOCALE_BY_LOWER.get(cleaned.toLowerCase());
  if (exact) return exact;
  const lower = cleaned.toLowerCase();
  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('pt')) return 'pt_BR';
  return 'en';
}

function publicCardCopy(locale: unknown): PublicCardCopy {
  return PUBLIC_CARD_COPY[normalizePublicCardLocale(locale)];
}

function publicCardLanguageTag(locale: PublicCardLocale): string {
  return locale.replace('_', '-');
}

function localeFromAcceptLanguage(raw: string | string[] | undefined): PublicCardLocale {
  const header = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  if (!header) return 'en';
  const choices = header
    .split(',')
    .map((part, index) => {
      const [tagPart, ...params] = part.trim().split(';');
      const qParam = params.find((param) => param.trim().toLowerCase().startsWith('q='));
      const q = qParam ? Number(qParam.split('=')[1]) : 1;
      return { tag: tagPart.trim(), q: Number.isFinite(q) ? q : 0, index };
    })
    .filter((choice) => choice.tag && choice.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  return choices.length > 0 ? normalizePublicCardLocale(choices[0].tag) : 'en';
}

function requestLocale(req: http.IncomingMessage): PublicCardLocale {
  const params = new URLSearchParams((req.url ?? '').split('?')[1] ?? '');
  const requested = params.get('lang');
  if (requested) return normalizePublicCardLocale(requested);
  return localeFromAcceptLanguage(req.headers['accept-language']);
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_m, key: string) => String(values[key] ?? ''));
}

function classDisplay(cls: string, locale: PublicCardLocale): string {
  const copy = PUBLIC_CARD_COPY[locale];
  return Object.hasOwn(copy.classes, cls) ? copy.classes[cls as PlayerClassKey] : copy.unknownClass;
}

// Build a URL/file-safe slug from a character name. Lowercased, non-alphanumerics
// collapsed to single hyphens, trimmed, capped. May be empty (e.g. an all-symbol
// name) - callers fall back to a character-id slug.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

// Validate a slug arriving from an untrusted URL before it is used in a query.
// Slugs are only ever used as SQL parameters (never file paths), but this keeps
// lookups bounded and 404s clean.
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,63}$/.test(slug);
}

function slugWithSuffix(base: string, suffix: string): string {
  const maxBaseLength = Math.max(1, MAX_SLUG_LENGTH - suffix.length);
  const prefix = base.slice(0, maxBaseLength).replace(/-+$/g, '') || 'player';
  return `${prefix}${suffix}`.slice(0, MAX_SLUG_LENGTH);
}

function cardSlugCandidate(base: string, characterId: number, attempt: number): string {
  if (attempt === 0) return base.slice(0, MAX_SLUG_LENGTH);
  const suffix = attempt === 1 ? `-${characterId}` : `-${characterId}-${attempt}`;
  return slugWithSuffix(base, suffix);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function firstHeaderValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? (value[0] ?? '') : (value ?? '')).split(',')[0].trim();
}

function trustedPublicOriginFromHost(req: http.IncomingMessage): string {
  const raw = firstHeaderValue(req.headers.host).toLowerCase();
  const host = raw.includes(':') ? raw.split(':')[0] : raw;
  return TRUSTED_PUBLIC_HOST_ORIGINS.get(host) ?? '';
}

function requestOrigin(req: http.IncomingMessage): string {
  if (REALM_PUBLIC_ORIGIN) return REALM_PUBLIC_ORIGIN;
  if (process.env.NODE_ENV === 'production')
    return trustedPublicOriginFromHost(req) || DEFAULT_PRODUCTION_PUBLIC_ORIGIN;
  const fwd = firstHeaderValue(req.headers['x-forwarded-proto']).toLowerCase();
  const proto =
    fwd === 'http' || fwd === 'https'
      ? fwd
      : (req.socket as { encrypted?: boolean }).encrypted
        ? 'https'
        : 'http';
  const host = firstHeaderValue(req.headers.host) || 'localhost';
  return `${proto}://${host}`;
}

export function cardUploadContentLengthTooLarge(req: http.IncomingMessage): boolean {
  const raw = req.headers['content-length'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return false;
  return Number(trimmed) > MAX_CARD_BYTES;
}

// POST /api/card?character=<id>  (body: image/png)  → { url, ref }
export async function handleCardUpload(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  accountId: number,
  liveLevelForCharacter?: (characterId: number) => number | null,
): Promise<void> {
  const params = new URLSearchParams((req.url ?? '').split('?')[1] ?? '');
  const characterId = Number(params.get('character'));
  const locale = normalizePublicCardLocale(params.get('lang'));
  if (!Number.isInteger(characterId) || characterId <= 0) {
    recordUsageMetric('card.publish.rejected');
    return json(res, 400, { error: 'character id is required' });
  }
  if (cardUploadContentLengthTooLarge(req)) {
    recordUsageMetric('card.publish.rejected');
    return json(res, 413, { error: 'image too large' });
  }
  const character = await getCharacter(accountId, characterId);
  if (!character) {
    recordUsageMetric('card.publish.rejected');
    return json(res, 404, { error: 'character not found' });
  }

  let png: Buffer;
  try {
    png = await readBinaryBody(req, MAX_CARD_BYTES);
  } catch (err) {
    const tooLarge = err instanceof Error && err.message === 'body too large';
    recordUsageMetric('card.publish.rejected');
    return json(res, tooLarge ? 413 : 400, {
      error: tooLarge ? 'image too large' : 'could not read image',
    });
  }
  if (
    !parsePngInfo(png, {
      allowedDimensions: CARD_PNG_DIMENSIONS,
      maxDecodedBytes: MAX_CARD_DECODED_BYTES,
    })
  ) {
    recordUsageMetric('card.publish.rejected');
    return json(res, 400, { error: 'expected a PNG image' });
  }

  const base = slugify(character.name) || `player-${characterId}`;
  const copy = PUBLIC_CARD_COPY[locale];
  // Server-side state owns level metadata. Prefer the live authoritative Sim
  // level for online characters, then persisted JSONB state, then the column.
  // The uploaded PNG is client-composed, but public title/OG claims must never
  // trust query parameters.
  const level = liveLevelForCharacter?.(characterId) ?? character.state?.level ?? character.level;
  const levelClass = interpolate(copy.levelClass, {
    level,
    className: classDisplay(character.class, locale),
  });
  const title = `${character.name} - ${levelClass}`;
  const description = interpolate(copy.description, { name: character.name });

  // Prefer the clean name slug, then the historical character-id suffix. If
  // those are already taken, keep walking deterministic suffixes so a clean
  // name like "sir-test-5" cannot strand character 5 on a 500.
  let slug = '';
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = cardSlugCandidate(base, characterId, attempt);
    if (!(await slugAvailable(candidate, characterId))) continue;
    try {
      await upsertPlayerCard({
        characterId,
        accountId,
        slug: candidate,
        png,
        title,
        description,
        locale,
      });
      slug = candidate;
      break;
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }
  if (!slug) throw new Error('could not allocate player card slug');
  return json(res, 200, { url: `/p/${slug}`, ref: slug });
}

// GET /p/<slug>  and  GET /p/<slug>/card.png
export async function handleCardRoutes(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  try {
    const path = (req.url ?? '').split('?')[0];
    const m = /^\/p\/([^/]+)(\/card\.png)?\/?$/.exec(path);
    // A malformed percent-escape (e.g. /p/%E0) makes decodeURIComponent throw a
    // URIError - that's an unparseable URL (404), not a server fault (500).
    let slug = '';
    try {
      slug = m ? decodeURIComponent(m[1]).toLowerCase() : '';
    } catch {
      slug = '';
    }
    if (!m || !isValidSlug(slug)) {
      res.writeHead(404, CARD_NOT_FOUND_HEADERS);
      res.end('not found');
      return;
    }
    if (m[2]) return await serveCardImage(res, slug);
    return await serveCardPage(req, res, slug);
  } catch (err) {
    logger.error({ err }, 'player-card route error');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('internal error');
  }
}

async function serveCardImage(res: http.ServerResponse, slug: string): Promise<void> {
  const card = await getPlayerCardBySlug(slug);
  if (!card) {
    res.writeHead(404, CARD_NOT_FOUND_HEADERS);
    res.end('not found');
    return;
  }
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': card.png.length,
    // Cards can be re-published, so revalidate fairly often rather than caching
    // immutably like content-hashed build assets.
    'Cache-Control': 'public, max-age=300',
  });
  res.end(card.png);
}

async function serveCardPage(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  slug: string,
): Promise<void> {
  // Metadata-only read - the HTML page never needs the (up to ~4 MB) PNG bytes.
  const card = await getPlayerCardMetaBySlug(slug);
  const origin = requestOrigin(req);
  if (!card) {
    res.writeHead(404, CARD_PAGE_NOT_FOUND_HEADERS);
    res.end(missingCardHtml(origin, requestLocale(req)));
    return;
  }
  // Version the og:image URL by the card's last-publish time (epoch ms) so a
  // re-published card (e.g. after a level-up) busts social/browser image caches
  // that key on the otherwise-stable /p/<slug>/card.png URL and serve the old PNG.
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=120',
  });
  res.end(
    cardPageHtml({
      slug,
      title: card.title,
      description: card.description,
      locale: normalizePublicCardLocale(card.locale),
      origin,
      version: card.updatedAt,
    }),
  );
}

function cardPageHtml(opts: {
  slug: string;
  title: string;
  description: string;
  locale: PublicCardLocale;
  origin: string;
  version: number;
}): string {
  const { slug, title, description, locale, origin, version } = opts;
  const pagePath = `/p/${encodeURIComponent(slug)}`;
  const imageQuery = version > 0 ? `?v=${version}` : '';
  const imagePath = `${pagePath}/card.png${imageQuery}`;
  const playPath = `/?ref=${encodeURIComponent(slug)}`;
  const pageUrl = `${origin}${pagePath}`;
  const imageUrl = `${origin}${imagePath}`;
  const copy = publicCardCopy(locale);
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const gameName = escapeHtml(copy.gameName);
  const cta = escapeHtml(copy.cta);
  return `<!doctype html>
<html lang="${publicCardLanguageTag(locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t} · ${gameName}</title>
<meta name="description" content="${d}">
<link rel="canonical" href="${escapeHtml(pageUrl)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:image" content="${escapeHtml(imageUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${escapeHtml(pageUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${escapeHtml(imageUrl)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Alegreya+Sans:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root { --gold: #ffd100; }
  * { box-sizing: border-box; }
  /* 100dvh tracks the visible area as the mobile URL bar shows/hides. */
  body { margin: 0; min-height: 100vh; min-height: 100dvh; display: flex; padding: 32px 16px;
    background: radial-gradient(circle at 50% 18%, #241910, #0a0805 70%);
    color: #ece2c4; font-family: 'Alegreya Sans', system-ui, sans-serif; text-align: center; }
  /* margin:auto centers the card when it fits and lets the page scroll from the TOP
     when it doesn't (justify-content:center would clip the top on a short/portrait
     phone, the reported bug). */
  main { margin: auto; width: 100%; max-width: 720px; display: flex; flex-direction: column;
    align-items: center; gap: 22px; }
  h1 { font-family: 'Cinzel', Georgia, serif; color: var(--gold); font-size: clamp(22px, 4vw, 34px);
    margin: 0; max-width: 100%; overflow-wrap: anywhere; text-shadow: 0 2px 10px rgba(0,0,0,.6); }
  p { margin: 0; color: #c9bb92; max-width: 640px; line-height: 1.5; overflow-wrap: anywhere; }
  img.card { width: 100%; max-width: 720px; height: auto; border-radius: 12px;
    box-shadow: 0 12px 48px rgba(0,0,0,.6); border: 1px solid #4a3a18; }
  a.cta { display: inline-block; margin-top: 6px; padding: 13px 30px; border-radius: 8px;
    font-family: 'Cinzel', serif; font-weight: 700; font-size: 17px; text-decoration: none;
    color: #2a1d05; background: linear-gradient(#ffe27a, #e0a52a); box-shadow: 0 4px 18px rgba(224,165,42,.4); }
  a.cta:hover { filter: brightness(1.08); }
  footer { color: #7c6f4e; font-size: 13px; }
</style>
</head>
<body>
  <main>
    <h1>${t}</h1>
    <img class="card" src="${escapeHtml(imagePath)}" alt="${t}" width="1200" height="630">
    <p>${d}</p>
    <a class="cta" href="${escapeHtml(playPath)}">${cta}</a>
    <footer>${gameName}</footer>
  </main>
</body>
</html>`;
}

function missingCardHtml(origin: string, locale: PublicCardLocale): string {
  const copy = publicCardCopy(locale);
  const gameName = escapeHtml(copy.gameName);
  const title = escapeHtml(copy.missingTitle);
  const heading = escapeHtml(copy.missingHeading);
  const description = escapeHtml(copy.missingDescription);
  const cta = escapeHtml(copy.missingCta);
  return `<!doctype html>
<html lang="${publicCardLanguageTag(locale)}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · ${gameName}</title>
<link rel="canonical" href="${escapeHtml(origin)}/">
<style>
  body { margin: 0; min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 16px; background: radial-gradient(circle at 50% 18%, #241910, #0a0805 70%);
    color: #ece2c4; font-family: system-ui, sans-serif; text-align: center; padding: 24px; }
  a { color: #ffd100; }
</style></head>
<body><h1>${heading}</h1>
<p>${description}</p>
<p><a href="/">${cta}</a></p>
</body></html>`;
}

// Record a referral when a brand-new account registered via ?ref=<slug>. Safe to
// call with any untrusted `ref`: invalid slugs, unknown slugs, and self-referrals
// are silently ignored.
export async function captureReferral(refereeAccountId: number, ref: unknown): Promise<void> {
  const slug = typeof ref === 'string' ? ref.trim().toLowerCase() : '';
  if (!isValidSlug(slug)) return;
  const referrer = await accountForSlug(slug);
  if (referrer === null || referrer === refereeAccountId) return;
  await recordReferral(refereeAccountId, referrer, slug);
}
