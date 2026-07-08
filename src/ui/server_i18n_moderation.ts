type Messages = Record<string, string>;

const en: Messages = {
  'moderation.quotedNameRequired': 'Enclose the character name in double quotes.',
  'moderation.invalidTarget': "You can't moderate that player.",
  'moderation.noPermission': "You don't have permission to do that.",
  'moderation.kicked': 'Kicked {name}.',
  'moderation.killConfirm': 'Killed {name}.',
  'moderation.renameConfirm': 'Required {name} to rename.',
  'moderation.muteConfirm': 'Muted {name} for {duration}.',
  'moderation.banConfirm': 'Banned {name}.',
  'moderation.suspendConfirm': 'Suspended {name} for {duration}.',
  'moderation.banned': 'This account has been banned.',
  'moderation.muteUsage': 'Usage: /mute "<name>" <minutes> [reason]',
  'moderation.suspendUsage': 'Usage: /suspend "<name>" <minutes> [reason]',
  'moderation.spectateUsage': 'Usage: /spectate <name>',
  'moderation.spectateNotOnline': "No online player named '{name}'.",
  'moderation.notSpectating': 'You are not spectating anyone.',
  'moderation.spectateStart': 'Now spectating {name}.',
  'moderation.spectateStop': 'Stopped spectating.',
  'moderation.spectateEnded': '{name} is no longer online; spectate ended.',
  'moderation.spectateLocalChatUnavailable': 'Local chat is unavailable while spectating.',
};

const pt: Messages = {
  'moderation.quotedNameRequired': 'Coloque o nome do personagem entre aspas duplas.',
  'moderation.invalidTarget': 'Você não pode moderar esse jogador.',
  'moderation.noPermission': 'Você não tem permissão para fazer isso.',
  'moderation.kicked': '{name} foi expulso.',
  'moderation.killConfirm': '{name} foi morto.',
  'moderation.renameConfirm': '{name} deve renomear-se.',
  'moderation.muteConfirm': '{name} foi silenciado por {duration}.',
  'moderation.banConfirm': '{name} foi banido.',
  'moderation.suspendConfirm': '{name} foi suspenso por {duration}.',
  'moderation.banned': 'Esta conta foi banida.',
  'moderation.muteUsage': 'Uso: /mute "<nome>" <minutos> [motivo]',
  'moderation.suspendUsage': 'Uso: /suspend "<nome>" <minutos> [motivo]',
  'moderation.spectateUsage': 'Uso: /spectate <nome>',
  'moderation.spectateNotOnline': "Não há nenhum jogador online chamado '{name}'.",
  'moderation.notSpectating': 'Você não está observando ninguém.',
  'moderation.spectateStart': 'Agora observando {name}.',
  'moderation.spectateStop': 'Você parou de observar.',
  'moderation.spectateEnded': '{name} não está mais online; a observação foi encerrada.',
  'moderation.spectateLocalChatUnavailable':
    'O chat local não está disponível durante a observação.',
};

export const IN_GAME_MODERATION_MESSAGES: Record<string, Messages> = {
  en,
  pt_BR: pt,
};
