// Seed data for the i18n status registry - the verbatim blocked-surface
// allow-lists. These were extracted byte-faithfully (once) from the earlier
// hand-maintained Sets that used to live in tests/localization_fixes.test.ts;
// there is NO regenerator - this file is now the CANONICAL hand-maintained source
// (those in-test Sets are gone, so edit the blocked surface HERE). The registry
// (scripts/i18n_scan.mjs) seeds its `blocked` rows + `blockedSource` list from
// these, and the tests derive their allow-lists as views over the registry. An
// edit here MUST be intentional: it changes which copied-English / unlocalized
// strings the H3b copied-English and S3 drift guards permit.
//
// COPIED_ALLOW_IDS: server DICT (scope::locale::key) entries where a
// translation legitimately equals English (cognate / brand / borrowed term /
// numeric format) -> one per-key per-locale `blocked` row each.
//
// V07_SLASH: concrete (placeholder-substituted) English emissions on the v0.7
// in-game slash-command / diagnostic surface that the sim matcher does not yet
// localize; they ship English as a documented backstop -> the `blockedSource`
// list. These are SOURCE strings, not keys.

export const COPIED_ALLOW_IDS = [
  // pt_BR cognates / borrowed terms that are legitimately byte-identical to
  // English (e.g. "online" is the accepted borrowed term).
  'server::pt_BR::who.statusOnline',
];

export const V07_SLASH = [
  'Abilities on cooldown (5): Aki.',
  'Active effects (5): Aki.',
  'Aki attempts to flee!',
  'Aki channels Aki.',
  'Aki draws on a desperate second wind!',
  'Aki flies into a frenzy!',
  'Aki is Aki: Aki',
  'Aki unleashes Aki!',
  'Arena: Aki. Aki.',
  'Auto-attack is off.',
  'Auto-attack is on against Aki — next swing Aki (Akis swing).',
  'Auto-attack is on, but you have no valid target.',
  'Bags (5): Aki. Aki',
  'Combat potion is ready to use.',
  'Combat potion on cooldown — ready in 5s.',
  'Combo points: Aki/5.',
  'Completed quests (5): Aki.',
  'Dev commands: /dev level N, /dev tp X Z, /dev give itemId [count], /dev quest questId, /dev quests, /dev kill',
  'Dungeons (5): Aki.',
  'Effects on Aki (5): Aki.',
  'If you fall here, your spirit returns to the Aki graveyard at (5, 5).',
  'Inspect whom? Usage: /inspect <name>.',
  'Invalid roll range. Use /roll, /roll N, or /roll M-N (1-5).',
  'Landmarks in Aki (5): Aki.',
  'Level 5 — Aki/Aki XP (Aki%), Aki to go.',
  'Level 5 — maximum level reached.',
  'Mana regen is paused — resumes in Akis (you spent mana recently).',
  'Mana regeneration does not apply to your class.',
  'Movement speed: 100% of normal.',
  'Movement speed: Aki% of normal (hastened).',
  'Movement speed: Aki% of normal (slowed).',
  'Nearby (5): Aki.',
  'No abilities are on cooldown.',
  'No zones are defined.',
  'Nobody has any threat on Aki.',
  'Nothing is nearby.',
  'Only mana-using classes park mana; your class never does.',
  'Overpower is a warrior ability; your class cannot use it.',
  'Overpower is not available. It opens for 5s after an enemy dodges your attack.',
  'Overpower is ready — strike within Akis (an enemy dodged your attack).',
  'Party (5/Aki): Aki.',
  'Quest log (5): Aki.',
  'Spellbook (5): Aki.',
  'Target: Aki (level 5 Aki) — Aki.',
  'That player is already trading.',
  'Threat is only tracked on enemies; Aki is not one.',
  'Threat on Aki (5): Aki.',
  'Time played this session: Aki.',
  'Unknown command: Aki. Type /help for a list.',
  'Vendor buyback (5): Aki. Repurchase at any merchant.',
  'You are Aki.',
  'You are airborne and rising — Akiyd above the ground.',
  'You are falling — Akiyd above the ground.Aki',
  'You are fishing — Akis of Akis remaining.',
  'You are in Aki (levels Aki–Aki) at (5, 5).',
  'You are in Aki.',
  'You are in combat (enemies still engaged).',
  'You are in combat — leaving in 5s if no further action.',
  'You are not casting anything.',
  'You are not eating or drinking.',
  'You are not in any form or stance.',
  'You are not in combat.',
  'You are on solid ground.',
  'You are rooted in place and cannot move.',
  'You are stealthed.',
  'You do not have a pet.',
  'You have 5 mana parked while shifted; it returns when you leave your form.',
  'You have 5s.',
  'You have no ability queued for your next swing.',
  'You have no active effects.',
  'You have no combo points built up.',
  'You have no goods on the World Market.',
  'You have no mana parked while shifted.',
  'You have no one to reply to.',
  'You have no target to consider.',
  'You have not completed any quests yet.',
  'You have not learned any abilities yet.',
  'Your bags are empty. Aki',
  'Your mana is not parked — you are not shapeshifted.',
  'Your mana is regenerating (out of combat for 5s+).',
  'Your market listings (5/5): Aki.',
  "Your pet's Growl is on cooldown — ready in 5s.",
  "Your pet's Growl is ready — it will taunt its target on the next melee swing.",
  'Your pet: Aki (level 5Aki) — HP Aki/Aki (Aki%).',
  'Your purse is empty.',
  'Your quest log is empty.',
  'Your target Aki is 5yd away (Aki).',
  'Your vendor buyback list is empty.',
  'Zones (5): Aki.',
  '[dev] Added Akig to your purse.',
  '[dev] Level set to 5.',
  '[dev] Teleported to Aki, Aki.',
  "[dev] Unknown item 'Aki'.",
];
