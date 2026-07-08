import { describe, expect, it } from 'vitest';
import { ensureLocaleLoaded, setLanguage, supportedLanguages } from '../src/ui/i18n';
import { localizeServerText, tServer } from '../src/ui/server_i18n';

// Messages the authoritative server emits as plain English; the client must
// re-render them in the active locale (friends/guild/world/who/moderation).
describe('server-sent message localization', () => {
  const samples: string[] = [
    'Mira added to friends.',
    'Your friends list is full.',
    "No character named 'Zzz' exists.",
    'Bob has joined the guild.',
    'Bob is now Officer.',
    'Bob is already Guild Master.',
    'You found the guild <Knights>! You are its Guild Master.',
    'You have been removed from <Knights>.',
    'Mira has been removed from the guild by Bob.',
    'Mira has entered World of ClaudeCraft.',
    'Bob has left the world. (disconnected)',
    'Who: 3 players online on Stormforge.',
    'Who: 1 player online on Stormforge.',
    '...and 5 more.',
    'Enclose the character name in double quotes.',
    "You can't moderate that player.",
    'Usage: /mute "<name>" <minutes> [reason]',
    'Usage: /suspend "<name>" <minutes> [reason]',
    'Usage: /spectate <name>',
    "No online player named 'Zephyr'.",
    "You don't have permission to do that.",
    'You are not spectating anyone.',
    'Now spectating Zephyr.',
    'Stopped spectating.',
    'Zephyr is no longer online; spectate ended.',
    'Local chat is unavailable while spectating.',
    'Kicked Bob.',
    'Killed Bob.',
    'Required Bob to rename.',
    'Muted Bob for 5 minutes.',
    'Suspended Bob for 30 minutes.',
    'Banned Bob.',
    'This account has been banned.',
    'Server restart in 10 minutes.',
    'Server restart in 5 minutes.',
    'Server restart in 2 minutes.',
    'Server restart in 1 minute.',
    'Server restart in 30 seconds.',
    'Server restart in 10 seconds.',
    'Server restarting now.',
  ];

  it('recognizes and localizes every sample in every non-English locale', async () => {
    for (const lang of supportedLanguages) {
      // The /who header now resolves through the main catalog's CLDR plural keys
      // (tPlural), so its locale slice must be resident - exactly as the app does
      // (the HUD bootstrap awaits ensureLocaleLoaded before any server text paints).
      await ensureLocaleLoaded(lang);
      setLanguage(lang);
      for (const s of samples) {
        const out = localizeServerText(s);
        expect(out, `${lang}: "${s}" should be recognized`).not.toBeNull();
        if (lang !== 'en') {
          expect(out, `${lang}: "${s}" should not stay English`).not.toBe(s);
        }
      }
    }
    setLanguage('en');
  });

  it('preserves player names, guild names and counts verbatim', () => {
    for (const lang of supportedLanguages) {
      setLanguage(lang);
      expect(localizeServerText('Mira added to friends.')).toContain('Mira');
      expect(localizeServerText('You have been removed from <Knights>.')).toContain('Knights');
      expect(localizeServerText('...and 5 more.')).toContain('5');
      // /who row localizes class + zone but keeps the player name and level number
      const who = localizeServerText('Carl - level 12 warrior - Eastbrook Vale');
      if (!who) throw new Error(`${lang}: /who row should be recognized`);
      expect(who).toContain('Carl');
      expect(who).toContain('12');
    }
    setLanguage('en');
  });

  it('returns null for text that is not a server message', () => {
    setLanguage('pt_BR');
    expect(localizeServerText('This is an ordinary chat line.')).toBeNull();
    expect(localizeServerText('')).toBeNull();
    setLanguage('en');
  });

  it('keeps every interpolation placeholder intact across all locales', () => {
    const keys = [
      'friends.added',
      'guild.alreadyRank',
      'guild.newMaster',
      'world.left',
      'who.header',
      'who.row',
      'who.more',
      'moderation.spectateNotOnline',
      'moderation.spectateStart',
      'moderation.spectateEnded',
    ];
    const expected: Record<string, string> = {
      'friends.added': 'name',
      'guild.alreadyRank': 'name,rank',
      'guild.newMaster': 'guild,name',
      'world.left': 'name,reason',
      'who.header': 'count,realm',
      'who.row': 'className,level,name,status,zone',
      'who.more': 'count',
      'moderation.spectateNotOnline': 'name',
      'moderation.spectateStart': 'name',
      'moderation.spectateEnded': 'name',
    };
    for (const lang of supportedLanguages) {
      setLanguage(lang);
      for (const key of keys) {
        const raw = tServer(key); // no params -> placeholders survive verbatim
        const found = [...raw.matchAll(/\{([A-Za-z]+)\}/g)]
          .map((m) => m[1])
          .sort()
          .join(',');
        expect(found, `${lang}.${key} placeholders`).toBe(expected[key]);
      }
    }
    setLanguage('en');
  });
});

describe('in-game moderation strings round-trip through localizeServerText', () => {
  const cases: { input: string; pt: string }[] = [
    {
      input: 'Enclose the character name in double quotes.',
      pt: 'Coloque o nome do personagem entre aspas duplas.',
    },
    {
      input: "You can't moderate that player.",
      pt: 'Você não pode moderar esse jogador.',
    },
    {
      input: 'Usage: /spectate <name>',
      pt: 'Uso: /spectate <nome>',
    },
    {
      input: "No online player named 'Bob'.",
      pt: "Não há nenhum jogador online chamado 'Bob'.",
    },
    {
      input: 'Now spectating Bob.',
      pt: 'Agora observando Bob.',
    },
    {
      input: 'Bob is no longer online; spectate ended.',
      pt: 'Bob não está mais online; a observação foi encerrada.',
    },
    { input: 'Kicked Bob.', pt: 'Bob foi expulso.' },
    { input: 'Killed Bob.', pt: 'Bob foi morto.' },
    {
      input: 'Muted Bob for 5 minutes.',
      pt: 'Bob foi silenciado por 5 minutos.',
    },
  ];

  it('renders the exact localized form in pt_BR', () => {
    setLanguage('pt_BR');
    for (const c of cases) {
      expect(localizeServerText(c.input), `pt_BR: ${c.input}`).toBe(c.pt);
    }
    setLanguage('en');
  });

  it('keeps affected player names verbatim in every locale', () => {
    for (const lang of supportedLanguages) {
      setLanguage(lang);
      expect(localizeServerText('Kicked Zephyr.')).toContain('Zephyr');
      expect(localizeServerText('Now spectating Zephyr.')).toContain('Zephyr');
      expect(localizeServerText('Zephyr is no longer online; spectate ended.')).toContain('Zephyr');
    }
    setLanguage('en');
  });
});

// Concrete round-trips for the chat-moderation RULES (the strings the server emits at
// runtime after substituting the count). Pinned to pt_BR so a RULE that stops
// matching or stops interpolating bites with an exact mismatch.
describe('chat-moderation strings round-trip through localizeServerText', () => {
  const cases: { input: string; pt: string }[] = [
    {
      input: 'You are muted from chat for 5 more minutes.',
      pt: 'Você está silenciado no chat por mais 5 minutos.',
    },
    {
      input: 'You are muted from chat for 1 more minute.',
      pt: 'Você está silenciado no chat por mais 1 minuto.',
    },
    {
      input: "That language isn't allowed here. You're muted for 5 minutes.",
      pt: 'Esse tipo de linguagem não é permitido aqui. Você foi silenciado por 5 minutos.',
    },
    {
      input: 'Chat is on cooldown for 5s.',
      pt: 'O chat está em recarga por 5s.',
    },
  ];

  it('renders the exact localized form in pt_BR', () => {
    setLanguage('pt_BR');
    for (const c of cases) {
      expect(localizeServerText(c.input), `pt_BR: ${c.input}`).toBe(c.pt);
    }
    setLanguage('en');
  });

  it('recognizes but does not alter the English source under en', () => {
    setLanguage('en');
    for (const c of cases) {
      expect(localizeServerText(c.input), `en: ${c.input}`).toBe(c.input);
    }
    setLanguage('en');
  });
});

// localizeServerDuration is module-private; exercise it through the filter-mute RULE
// whose build() calls it. These duration strings are exactly what server/game.ts's
// formatDuration emits ("1 minute" / "5 minutes" / "1 hour" / "3 days").
describe('localizeServerDuration maps formatDuration output (via the filter-mute RULE)', () => {
  const cases: { duration: string; pt: string }[] = [
    { duration: '1 minute', pt: '1 minuto' },
    { duration: '5 minutes', pt: '5 minutos' },
    { duration: '1 hour', pt: '1 hora' },
    { duration: '3 days', pt: '3 dias' },
  ];

  it('localizes each duration unit inside the filter-mute notice (pt_BR)', () => {
    setLanguage('pt_BR');
    for (const c of cases) {
      const input = `You are muted and can't chat for another ${c.duration}.`;
      expect(localizeServerText(input), `pt_BR duration ${c.duration}`).toBe(
        `Você está silenciado e não pode usar o chat por mais ${c.pt}.`,
      );
    }
    setLanguage('en');
  });
});
