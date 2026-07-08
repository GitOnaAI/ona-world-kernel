// AUTO-ASSEMBLED localization for server-sent system/chat/error messages.
// The authoritative server emits friends/guild/world-join-leave/who/moderation
// messages as plain English text inside log/error events. The client cannot
// localize those at the source, so here we match the server's exact English
// (exact strings + regex for the dynamic ones) and re-render it through a
// per-locale dictionary. hud.ts calls localizeServerText() as a fallback inside
// localizeSystemText/localizeErrorText; main.ts uses tServer() for the
// moderation/throttle disconnect reasons. Player names, guild names and realm
// names are spliced through verbatim (not translatable); ranks, leave reasons,
// /who class + zone + status are themselves localized.
import { CLASSES, DUNGEONS, ZONES } from '../sim/data';
import type { PlayerClass } from '../sim/types';
import { tEntity } from './entity_i18n';
import { getLanguage, type InterpolationValues, type SupportedLanguage, tPlural } from './i18n';
import { IN_GAME_MODERATION_MESSAGES } from './server_i18n_moderation';

export const DICT: Record<string, Record<string, string>> = {
  en: {
    'friends.specifyName': 'Specify a character name.',
    'friends.noCharExists': "No character named '{name}' exists.",
    'friends.cannotBefriendSelf': 'You cannot befriend yourself.',
    'friends.ignoringRemoveFirst':
      'You are ignoring {name}. Remove them from your ignore list first.',
    'friends.alreadyFriend': '{name} is already your friend.',
    'friends.listFull': 'Your friends list is full.',
    'friends.notOnFriends': "No character named '{name}' on your friends list.",
    'friends.notYourFriend': '{name} is not on your friends list.',
    'friends.cannotIgnoreSelf': 'You cannot ignore yourself.',
    'friends.alreadyIgnored': '{name} is already ignored.',
    'friends.ignoreListFull': 'Your ignore list is full.',
    'friends.notOnIgnore': "No character named '{name}' on your ignore list.",
    'friends.notIgnored': '{name} is not on your ignore list.',
    'friends.added': '{name} added to friends.',
    'friends.removed': '{name} removed from friends.',
    'friends.nowIgnored': '{name} is now ignored.',
    'friends.noLongerIgnored': '{name} is no longer ignored.',
    'guild.nameRules': 'Guild names are 3-24 letters (spaces allowed).',
    'guild.exists': "A guild named '{name}' already exists.",
    'guild.alreadyInOne': 'You are already in a guild.',
    'guild.notInOne': 'You are not in a guild.',
    'guild.onlyOfficersInvite': 'Only officers and the Guild Master may invite.',
    'guild.alreadyInThis': 'You are already in the guild.',
    'guild.mustBeOnline': '{name} must be online to be invited.',
    'guild.targetAlreadyInGuild': '{name} is already in a guild.',
    'guild.pendingInvite': '{name} already has a pending guild invitation.',
    'guild.full': 'Your guild is full.',
    'guild.inviteExpired': 'The guild invitation has expired.',
    'guild.gone': 'That guild no longer exists.',
    'guild.thatFull': 'That guild is full.',
    'guild.gmPromoteFirst':
      'As Guild Master you must promote a new leader or disband the guild before leaving.',
    'guild.onlyGmPromote': 'Only the Guild Master may promote a new leader.',
    'guild.noMember': "No such guild member '{name}'.",
    'guild.notInYours': '{name} is not in your guild.',
    'guild.onlyGmDisband': 'Only the Guild Master may disband the guild.',
    'guild.onlyOfficersRemove': 'Only officers and the Guild Master may remove members.',
    'guild.noCharNamed': "No character named '{name}'.",
    'guild.useLeave': 'Use Leave Guild to remove yourself.',
    'guild.cannotRemoveGm': 'You cannot remove the Guild Master.',
    'guild.onlyGmRemoveOfficer': 'Only the Guild Master may remove an officer.',
    'guild.onlyGmChangeRanks': 'Only the Guild Master may change ranks.',
    'guild.useTransfer': 'Use a guild transfer to hand over leadership.',
    'guild.alreadyRank': '{name} is already {rank}.',
    'guild.onlyOfficersChat': 'Only officers and the Guild Master can use officer chat.',
    'guild.founded': 'You found the guild <{name}>! You are its Guild Master.',
    'guild.invited': 'You have invited {name} to the guild.',
    'guild.leftDisbanded': 'You have left <{name}>. The guild has disbanded.',
    'guild.left': 'You have left <{name}>.',
    'guild.disbanded': '<{name}> has been disbanded.',
    'guild.removedFrom': 'You have been removed from <{name}>.',
    'guild.joined': '{name} has joined the guild.',
    'guild.memberLeft': '{name} has left the guild.',
    'guild.newMaster': '{name} is now the Guild Master of <{guild}>.',
    'guild.removedBy': '{name} has been removed from the guild by {actor}.',
    'guild.nowRank': '{name} is now {rank}.',
    'guild.rankLeader': 'the Guild Master',
    'guild.rankOfficer': 'an Officer',
    'guild.rankMember': 'a Member',
    'world.entered': '{name} has entered World of ClaudeCraft.',
    'world.left': '{name} has left the world. ({reason})',
    'world.leaveLogout': 'logged out',
    'world.leaveDisconnect': 'disconnected',
    'world.leaveTimeout': 'timed out',
    'world.leaveError': 'connection error',
    'world.leaveModeration': 'moderation action',
    'world.leaveCharacterTakenOver': 'character taken over',
    'who.header': 'Who: {count} players online on {realm}.',
    'who.headerOne': 'Who: 1 player online on {realm}.',
    'who.row': '{name} - level {level} {className} - {zone}{status}',
    'who.more': '...and {count} more.',
    'who.statusAfk': 'AFK',
    'who.statusOnline': 'online',
    'moderation.suspended': 'This account is suspended.',
    'moderation.forceRename': 'A moderator requires one of your characters to be renamed.',
    'moderation.tooManyFailed': 'Too many failed attempts. Wait a few minutes and try again.',
    'friends.ignoreLoading': 'Your ignore list is still loading. Try /who again in a moment.',
    'who.statusCombat': 'combat',
    'who.statusDead': 'dead',
    'who.statusDungeon': 'dungeon',
    'who.zoneUnknown': 'Unknown',
    'chat.filterMutedRemaining': "You are muted and can't chat for another {duration}.",
    'chat.filterMuted': "That language isn't allowed here. You're muted for {duration}.",
    'chat.filterWarning': "Warning: that language isn't allowed here. Continued use will mute you.",
    'pet.nameNotAllowed': 'Pet name is not allowed.',
    'chat.muted': 'You are muted from chat for {minutes} more minutes.{reason}',
    'chat.mutedOne': 'You are muted from chat for {minutes} more minute.{reason}',
    'chat.muteReason': ' Reason: {reason}',
    'chat.onCooldown': 'Chat is on cooldown for {seconds}s.',
    'time.seconds': '{count} seconds',
    'time.second': '{count} second',
    'time.minutes': '{count} minutes',
    'time.minute': '{count} minute',
    'time.hours': '{count} hours',
    'time.hour': '{count} hour',
    'time.days': '{count} days',
    'time.day': '{count} day',
  },
  pt_BR: {
    'chat.filterMutedRemaining': 'Você está silenciado e não pode usar o chat por mais {duration}.',
    'chat.filterMuted':
      'Esse tipo de linguagem não é permitido aqui. Você foi silenciado por {duration}.',
    'chat.filterWarning':
      'Aviso: esse tipo de linguagem não é permitido aqui. Continuar fará com que você seja silenciado.',
    'pet.nameNotAllowed': 'Esse nome de mascote não é permitido.',
    'chat.muted': 'Você está silenciado no chat por mais {minutes} minutos.{reason}',
    'chat.mutedOne': 'Você está silenciado no chat por mais {minutes} minuto.{reason}',
    'chat.muteReason': ' Motivo: {reason}',
    'chat.onCooldown': 'O chat está em recarga por {seconds}s.',
    'time.seconds': '{count} segundos',
    'time.second': '{count} segundo',
    'time.minutes': '{count} minutos',
    'time.minute': '{count} minuto',
    'time.hours': '{count} horas',
    'time.hour': '{count} hora',
    'time.days': '{count} dias',
    'time.day': '{count} dia',
    'friends.specifyName': 'Especifique o nome de um personagem.',
    'friends.noCharExists': "Não existe nenhum personagem chamado '{name}'.",
    'friends.cannotBefriendSelf': 'Você não pode adicionar a si mesmo como amigo.',
    'friends.ignoringRemoveFirst':
      'Você está ignorando {name}. Remova-o da sua lista de ignorados primeiro.',
    'friends.alreadyFriend': '{name} já é seu amigo.',
    'friends.listFull': 'Sua lista de amigos está cheia.',
    'friends.notOnFriends': "Nenhum personagem chamado '{name}' na sua lista de amigos.",
    'friends.notYourFriend': '{name} não está na sua lista de amigos.',
    'friends.cannotIgnoreSelf': 'Você não pode ignorar a si mesmo.',
    'friends.alreadyIgnored': '{name} já está sendo ignorado.',
    'friends.ignoreListFull': 'Sua lista de ignorados está cheia.',
    'friends.notOnIgnore': "Nenhum personagem chamado '{name}' na sua lista de ignorados.",
    'friends.notIgnored': '{name} não está na sua lista de ignorados.',
    'friends.added': '{name} adicionado aos amigos.',
    'friends.removed': '{name} removido dos amigos.',
    'friends.nowIgnored': '{name} agora está sendo ignorado.',
    'friends.noLongerIgnored': '{name} não está mais sendo ignorado.',
    'guild.nameRules': 'Os nomes de guilda têm de 3 a 24 letras (espaços permitidos).',
    'guild.exists': "Já existe uma guilda chamada '{name}'.",
    'guild.alreadyInOne': 'Você já está em uma guilda.',
    'guild.notInOne': 'Você não está em uma guilda.',
    'guild.onlyOfficersInvite': 'Apenas oficiais e o Mestre da Guilda podem convidar.',
    'guild.alreadyInThis': 'Você já está na guilda.',
    'guild.mustBeOnline': '{name} precisa estar online para ser convidado.',
    'guild.targetAlreadyInGuild': '{name} já está em uma guilda.',
    'guild.pendingInvite': '{name} já tem um convite de guilda pendente.',
    'guild.full': 'Sua guilda está cheia.',
    'guild.inviteExpired': 'O convite de guilda expirou.',
    'guild.gone': 'Essa guilda não existe mais.',
    'guild.thatFull': 'Essa guilda está cheia.',
    'guild.gmPromoteFirst':
      'Como Mestre da Guilda, você precisa promover um novo líder ou desfazer a guilda antes de sair.',
    'guild.onlyGmPromote': 'Apenas o Mestre da Guilda pode promover um novo líder.',
    'guild.noMember': "Não há nenhum membro da guilda chamado '{name}'.",
    'guild.notInYours': '{name} não está na sua guilda.',
    'guild.onlyGmDisband': 'Apenas o Mestre da Guilda pode desfazer a guilda.',
    'guild.onlyOfficersRemove': 'Apenas oficiais e o Mestre da Guilda podem remover membros.',
    'guild.noCharNamed': "Nenhum personagem chamado '{name}'.",
    'guild.useLeave': 'Use Sair da Guilda para remover a si mesmo.',
    'guild.cannotRemoveGm': 'Você não pode remover o Mestre da Guilda.',
    'guild.onlyGmRemoveOfficer': 'Apenas o Mestre da Guilda pode remover um oficial.',
    'guild.onlyGmChangeRanks': 'Apenas o Mestre da Guilda pode alterar os cargos.',
    'guild.useTransfer': 'Use uma transferência de guilda para passar a liderança.',
    'guild.alreadyRank': '{name} já é {rank}.',
    'guild.onlyOfficersChat': 'Apenas oficiais e o Mestre da Guilda podem usar o chat de oficiais.',
    'guild.founded': 'Você fundou a guilda <{name}>! Você é o Mestre da Guilda.',
    'guild.invited': 'Você convidou {name} para a guilda.',
    'guild.leftDisbanded': 'Você saiu de <{name}>. A guilda foi desfeita.',
    'guild.left': 'Você saiu de <{name}>.',
    'guild.disbanded': '<{name}> foi desfeita.',
    'guild.removedFrom': 'Você foi removido de <{name}>.',
    'guild.joined': '{name} entrou na guilda.',
    'guild.memberLeft': '{name} saiu da guilda.',
    'guild.newMaster': '{name} agora é o Mestre da Guilda de <{guild}>.',
    'guild.removedBy': '{name} foi removido da guilda por {actor}.',
    'guild.nowRank': '{name} agora é {rank}.',
    'guild.rankLeader': 'o Mestre da Guilda',
    'guild.rankOfficer': 'um Oficial',
    'guild.rankMember': 'um Membro',
    'world.entered': '{name} entrou em World of ClaudeCraft.',
    'world.left': '{name} saiu do mundo. ({reason})',
    'world.leaveLogout': 'desconectou-se',
    'world.leaveDisconnect': 'desconectado',
    'world.leaveTimeout': 'tempo esgotado',
    'world.leaveError': 'erro de conexão',
    'world.leaveModeration': 'ação de moderação',
    'world.leaveCharacterTakenOver': 'personagem assumido',
    'who.header': 'Quem: {count} jogadores online em {realm}.',
    'who.headerOne': 'Quem: 1 jogador online em {realm}.',
    'who.row': '{name} - nível {level} {className} - {zone}{status}',
    'who.more': '...e mais {count}.',
    'who.statusAfk': 'Ausente',
    'who.statusOnline': 'online',
    'moderation.suspended': 'Esta conta está suspensa.',
    'moderation.forceRename': 'Um moderador exige que um dos seus personagens seja renomeado.',
    'moderation.tooManyFailed':
      'Tentativas demais sem sucesso. Aguarde alguns minutos e tente novamente.',
    'friends.ignoreLoading':
      'Sua lista de ignorados ainda está carregando. Tente /who novamente em instantes.',
    'who.statusCombat': 'em combate',
    'who.statusDead': 'morto',
    'who.statusDungeon': 'em masmorra',
    'who.zoneUnknown': 'Desconhecida',
  },
};
for (const [lang, messages] of Object.entries(IN_GAME_MODERATION_MESSAGES)) {
  Object.assign(DICT[lang], messages);
}

function interpolate(template: string, params?: InterpolationValues): string {
  if (!params) return template;
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (m, name: string) => {
    const v = params[name];
    return v === undefined ? m : String(v);
  });
}

export function tServer(
  key: string,
  params?: InterpolationValues,
  lang: SupportedLanguage = getLanguage(),
): string {
  const table = DICT[lang] ?? DICT.en;
  const tmpl = table[key] ?? DICT.en[key] ?? key;
  return interpolate(tmpl, params);
}

// English-content sub-values the server interpolates, mapped back to dictionary keys.
const RANK_KEY: Record<string, string> = {
  'Guild Master': 'guild.rankLeader',
  Officer: 'guild.rankOfficer',
  Member: 'guild.rankMember',
};
const LEAVE_REASON_KEY: Record<string, string> = {
  disconnected: 'world.leaveDisconnect',
  'connection error': 'world.leaveError',
  'moderation action': 'world.leaveModeration',
  'logged out': 'world.leaveLogout',
  'timed out': 'world.leaveTimeout',
  'character taken over': 'world.leaveCharacterTakenOver',
};
function localizeRank(r: string): string {
  const k = RANK_KEY[r];
  return k ? tServer(k) : r;
}
function localizeReason(r: string): string {
  const k = LEAVE_REASON_KEY[r];
  return k ? tServer(k) : r;
}

// The server's formatDuration (server/game.ts) emits English "N second(s)/minute(s)/
// hour(s)/day(s)". Re-render it through tServer so the duration localizes too; an
// unrecognized form passes through verbatim.
const DURATION_UNIT_KEY: Record<string, [one: string, many: string]> = {
  second: ['time.second', 'time.seconds'],
  minute: ['time.minute', 'time.minutes'],
  hour: ['time.hour', 'time.hours'],
  day: ['time.day', 'time.days'],
};
function localizeServerDuration(s: string): string {
  const m = /^(\d+) (second|minute|hour|day)s?$/.exec(s.trim());
  if (!m) return s;
  const count = m[1];
  const [one, many] = DURATION_UNIT_KEY[m[2]];
  return tServer(count === '1' ? one : many, { count });
}

// Reverse maps for the English zone/dungeon name the /who roster carries.
const zoneNameToId = new Map<string, string>();
for (const z of ZONES) zoneNameToId.set(z.name, z.id);
const dungeonNameToId = new Map<string, string>();
for (const [id, d] of Object.entries(DUNGEONS)) dungeonNameToId.set(d.name, id);
export function localizeZone(name: string): string {
  if (name === 'Unknown') return tServer('who.zoneUnknown');
  const zid = zoneNameToId.get(name);
  if (zid) return tEntity({ kind: 'zone', id: zid, field: 'name' });
  const did = dungeonNameToId.get(name);
  if (did) return tEntity({ kind: 'dungeon', id: did, field: 'name' });
  return name;
}
// Only localize real class ids; guard so the catch-all who.row rule cannot feed
// a non-class word into tEntity (which would surface a raw fallback label).
function localizeClass(cls: string): string {
  return cls in CLASSES ? tEntity({ kind: 'class', id: cls as PlayerClass, field: 'name' }) : cls;
}
function localizeStatus(s: string): string {
  const k = s.toLowerCase();
  if (k === 'afk') return tServer('who.statusAfk');
  if (k === 'combat') return tServer('who.statusCombat');
  if (k === 'dead') return tServer('who.statusDead');
  if (k === 'dungeon') return tServer('who.statusDungeon');
  return s;
}

export const RESTART_MESSAGES: Record<string, Record<string, string>> = {
  'Server restart in 10 minutes.': {
    en: 'Server restart in 10 minutes.',
    pt_BR: 'Reinício do servidor em 10 minutos.',
  },
  'Server restart in 5 minutes.': {
    en: 'Server restart in 5 minutes.',
    pt_BR: 'Reinício do servidor em 5 minutos.',
  },
  'Server restart in 2 minutes.': {
    en: 'Server restart in 2 minutes.',
    pt_BR: 'Reinício do servidor em 2 minutos.',
  },
  'Server restart in 1 minute.': {
    en: 'Server restart in 1 minute.',
    pt_BR: 'Reinício do servidor em 1 minuto.',
  },
  'Server restart in 30 seconds.': {
    en: 'Server restart in 30 seconds.',
    pt_BR: 'Reinício do servidor em 30 segundos.',
  },
  'Server restart in 10 seconds.': {
    en: 'Server restart in 10 seconds.',
    pt_BR: 'Reinício do servidor em 10 segundos.',
  },
  'Server restarting now.': {
    en: 'Server restarting now.',
    pt_BR: 'O servidor está reiniciando agora.',
  },
};

// Exact (no-placeholder) messages: server English -> dictionary key. who.* values
// are either placeholdered or sub-fragments spliced into who.row, never standalone.
const FRAGMENT = /^(guild\.rank|world\.leave|who\.)/;
const EXACT: Record<string, string> = {};
for (const key of Object.keys(DICT.en)) {
  const v = DICT.en[key];
  if (FRAGMENT.test(key)) continue;
  if (v.includes('{') || v.includes('<')) continue;
  if (EXACT[v] !== undefined)
    throw new Error(
      `server_i18n: duplicate exact English message "${v}" (keys ${EXACT[v]} and ${key})`,
    );
  EXACT[v] = key;
}

type Rule = { re: RegExp; build: (m: RegExpExecArray) => string };
const RULES: Rule[] = [
  {
    re: /^You found the guild <([^>]+)>! You are its Guild Master\.$/,
    build: (m) => tServer('guild.founded', { name: m[1] }),
  },
  {
    re: /^You have left <([^>]+)>\. The guild has disbanded\.$/,
    build: (m) => tServer('guild.leftDisbanded', { name: m[1] }),
  },
  { re: /^You have left <([^>]+)>\.$/, build: (m) => tServer('guild.left', { name: m[1] }) },
  {
    re: /^<([^>]+)> has been disbanded\.$/,
    build: (m) => tServer('guild.disbanded', { name: m[1] }),
  },
  {
    re: /^You have been removed from <([^>]+)>\.$/,
    build: (m) => tServer('guild.removedFrom', { name: m[1] }),
  },
  {
    re: /^(.+) is now the Guild Master of <([^>]+)>\.$/,
    build: (m) => tServer('guild.newMaster', { name: m[1], guild: m[2] }),
  },
  {
    re: /^(.+) has been removed from the guild by (.+)\.$/,
    build: (m) => tServer('guild.removedBy', { name: m[1], actor: m[2] }),
  },
  {
    re: /^You have invited (.+) to the guild\.$/,
    build: (m) => tServer('guild.invited', { name: m[1] }),
  },
  { re: /^(.+) has joined the guild\.$/, build: (m) => tServer('guild.joined', { name: m[1] }) },
  { re: /^(.+) has left the guild\.$/, build: (m) => tServer('guild.memberLeft', { name: m[1] }) },
  {
    re: /^A guild named '(.+)' already exists\.$/,
    build: (m) => tServer('guild.exists', { name: m[1] }),
  },
  {
    re: /^No such guild member '(.+)'\.$/,
    build: (m) => tServer('guild.noMember', { name: m[1] }),
  },
  {
    re: /^(.+) must be online to be invited\.$/,
    build: (m) => tServer('guild.mustBeOnline', { name: m[1] }),
  },
  {
    re: /^(.+) is already in a guild\.$/,
    build: (m) => tServer('guild.targetAlreadyInGuild', { name: m[1] }),
  },
  {
    re: /^(.+) already has a pending guild invitation\.$/,
    build: (m) => tServer('guild.pendingInvite', { name: m[1] }),
  },
  {
    re: /^(.+) is not in your guild\.$/,
    build: (m) => tServer('guild.notInYours', { name: m[1] }),
  },
  {
    re: /^(.+) is already (Guild Master|Officer|Member)\.$/,
    build: (m) => tServer('guild.alreadyRank', { name: m[1], rank: localizeRank(m[2]) }),
  },
  {
    re: /^(.+) is now (Guild Master|Officer|Member)\.$/,
    build: (m) => tServer('guild.nowRank', { name: m[1], rank: localizeRank(m[2]) }),
  },
  {
    re: /^No character named '(.+)' exists\.$/,
    build: (m) => tServer('friends.noCharExists', { name: m[1] }),
  },
  {
    re: /^No character named '(.+)' on your friends list\.$/,
    build: (m) => tServer('friends.notOnFriends', { name: m[1] }),
  },
  {
    re: /^No character named '(.+)' on your ignore list\.$/,
    build: (m) => tServer('friends.notOnIgnore', { name: m[1] }),
  },
  {
    re: /^No character named '(.+)'\.$/,
    build: (m) => tServer('guild.noCharNamed', { name: m[1] }),
  },
  {
    re: /^You are ignoring (.+)\. Remove them from your ignore list first\.$/,
    build: (m) => tServer('friends.ignoringRemoveFirst', { name: m[1] }),
  },
  {
    re: /^(.+) is already your friend\.$/,
    build: (m) => tServer('friends.alreadyFriend', { name: m[1] }),
  },
  {
    re: /^(.+) is not on your friends list\.$/,
    build: (m) => tServer('friends.notYourFriend', { name: m[1] }),
  },
  {
    re: /^(.+) is already ignored\.$/,
    build: (m) => tServer('friends.alreadyIgnored', { name: m[1] }),
  },
  {
    re: /^(.+) is not on your ignore list\.$/,
    build: (m) => tServer('friends.notIgnored', { name: m[1] }),
  },
  { re: /^(.+) added to friends\.$/, build: (m) => tServer('friends.added', { name: m[1] }) },
  { re: /^(.+) removed from friends\.$/, build: (m) => tServer('friends.removed', { name: m[1] }) },
  { re: /^(.+) is now ignored\.$/, build: (m) => tServer('friends.nowIgnored', { name: m[1] }) },
  {
    re: /^(.+) is no longer ignored\.$/,
    build: (m) => tServer('friends.noLongerIgnored', { name: m[1] }),
  },
  {
    re: /^(.+) has entered World of ClaudeCraft\.$/,
    build: (m) => tServer('world.entered', { name: m[1] }),
  },
  {
    re: /^(.+) has left the world\. \((.+)\)$/,
    build: (m) => tServer('world.left', { name: m[1], reason: localizeReason(m[2]) }),
  },
  { re: /^Kicked (.+)\.$/, build: (m) => tServer('moderation.kicked', { name: m[1] }) },
  { re: /^Killed (.+)\.$/, build: (m) => tServer('moderation.killConfirm', { name: m[1] }) },
  {
    re: /^Required (.+) to rename\.$/,
    build: (m) => tServer('moderation.renameConfirm', { name: m[1] }),
  },
  {
    re: /^Muted (.+) for (.+)\.$/,
    build: (m) =>
      tServer('moderation.muteConfirm', {
        name: m[1],
        duration: localizeServerDuration(m[2]),
      }),
  },
  {
    re: /^Suspended (.+) for (.+)\.$/,
    build: (m) =>
      tServer('moderation.suspendConfirm', {
        name: m[1],
        duration: localizeServerDuration(m[2]),
      }),
  },
  { re: /^Banned (.+)\.$/, build: (m) => tServer('moderation.banConfirm', { name: m[1] }) },
  {
    re: /^No online player named '(.+)'\.$/,
    build: (m) => tServer('moderation.spectateNotOnline', { name: m[1] }),
  },
  {
    re: /^Now spectating (.+)\.$/,
    build: (m) => tServer('moderation.spectateStart', { name: m[1] }),
  },
  {
    re: /^(.+) is no longer online; spectate ended\.$/,
    build: (m) => tServer('moderation.spectateEnded', { name: m[1] }),
  },
  {
    re: /^Usage: \/mute "<name>" <minutes> \[reason\]$/,
    build: () => tServer('moderation.muteUsage'),
  },
  {
    re: /^Usage: \/suspend "<name>" <minutes> \[reason\]$/,
    build: () => tServer('moderation.suspendUsage'),
  },
  {
    re: /^Usage: \/spectate <name>$/,
    build: () => tServer('moderation.spectateUsage'),
  },
  // Chat-filter mute notices. The {duration} comes from formatDuration; re-localize it.
  {
    re: /^You are muted and can't chat for another (.+)\.$/,
    build: (m) => tServer('chat.filterMutedRemaining', { duration: localizeServerDuration(m[1]) }),
  },
  {
    re: /^That language isn't allowed here\. You're muted for (.+)\.$/,
    build: (m) => tServer('chat.filterMuted', { duration: localizeServerDuration(m[1]) }),
  },
  // Mute-remaining readout: singular/plural minutes + an optional free-text reason
  // clause (the operator reason passes through; the "Reason:" label is a key).
  {
    re: /^You are muted from chat for (\d+) more minutes?\.(?: Reason: (.+))?$/,
    build: (m) =>
      tServer(m[1] === '1' ? 'chat.mutedOne' : 'chat.muted', {
        minutes: m[1],
        reason: m[2] ? tServer('chat.muteReason', { reason: m[2] }) : '',
      }),
  },
  {
    re: /^Chat is on cooldown for (.+)s\.$/,
    build: (m) => tServer('chat.onCooldown', { seconds: m[1] }),
  },
  {
    re: /^Who: (\d+) (?:player|players) online on (.+)\.$/,
    build: (m) =>
      tPlural('hudChrome.plurals.playersOnline', Number(m[1]), { count: m[1], realm: m[2] }),
  },
  {
    re: /^Who: (\d+) (?:player|players) matching "(.+)" on (.+)\.$/,
    build: (m) =>
      tPlural('hudChrome.plurals.playersMatching', Number(m[1]), {
        count: m[1],
        query: m[2],
        realm: m[3],
      }),
  },
  { re: /^\.\.\.and (\d+) more\.$/, build: (m) => tServer('who.more', { count: m[1] }) },
  {
    re: /^(.+) - level (\d+) (\w+) - (.+?)(?: \(([^)]+)\))?$/,
    build: (m) =>
      tServer('who.row', {
        name: m[1],
        level: m[2],
        className: localizeClass(m[3]),
        zone: localizeZone(m[4]),
        status: m[5] ? ` (${localizeStatus(m[5])})` : '',
      }),
  },
];

// Returns the localized form of a server message, or null if it is not one of ours.
export function localizeServerText(text: string): string | null {
  const restart = RESTART_MESSAGES[text]?.[getLanguage()];
  if (restart) return restart;
  const exactKey = EXACT[text];
  if (exactKey) return tServer(exactKey);
  for (const rule of RULES) {
    const m = rule.re.exec(text);
    if (m) return rule.build(m);
  }
  return null;
}
