// Kharzoth Dominion (levels 1-8). A fictional slaver empire of ash and iron:
// its overseers work captive labor to death in the cinder pits while the hidden
// Ashroot Refuge shelters the freed. This is the dedicated origin/introduction
// zone for the rootwarden class. NOTE (scope): this module ships only the zone
// and its population (Dominion enemies + the refuge NPCs) plus the Vharaeth trial
// elite (TK-5, driven by encounters/vharaeth.ts). The origin quest chain is still a
// SEPARATE follow-up task (TK-6); the zone keeps its empty quest tables and
// quest-anchor NPCs to receive it without a structural change here.
//
// The mythology is wholly invented fantasy: no real religion, ethnicity, or
// historical event is referenced. Treat Kharzoth as a generic cruel
// mining/industrial domain.

import type {
  CampDef,
  GroundObjectDef,
  MobTemplate,
  NpcDef,
  QuestDef,
  ZoneDef,
  ZonePropsDef,
} from '../types';

export const KHARZOTH_COOLANT_CISTERN = { x: -70, z: 1030, radius: 18 };

// Rootwarden origin spawn, inside Ashroot Refuge, offset from the hub center
// (0,960) the same way the base game's PLAYER_START (2,-2) offsets zone1's
// (0,0) hub: clear of the three refuge NPCs' exact positions.
export const ROOTWARDEN_START = { x: 2, z: 958 };

// Band appended NORTH of Thornpeak Heights (zMax 900). zoneAt() reads ZONES in
// ascending zMax order, so this stays last; WORLD_MAX_Z derives from it in
// data.ts (ZONES[last].zMax), no manual bound edit needed. progression.test.ts
// asserts the band tiles the strip: zMin here MUST equal Thornpeak's zMax (900).
export const KHARZOTH_ZONE: ZoneDef = {
  id: 'kharzoth_dominion',
  name: 'Kharzoth Dominion',
  zMin: 900,
  zMax: 1260,
  // The zone's OWN quest+kill xp budget only covers levels 1-3 with headroom
  // (tests/progression.test.ts "no forced grinding"): this declared range is
  // the origin-story leveling band, not a cap on danger. The refuge is levels
  // 1-3; the pits, Chain-Yards, and Embergate escalate well past that toward
  // the level-8 Vharaeth trial, same as any zone's optional overleveled rares
  // (see zone1's level-7 rares inside its own 1-7 band). A rootwarden finishes
  // the origin chain here, then continues leveling in the shared world.
  levelRange: [1, 3],
  biome: 'volcano',
  // Radius 28 (wider than a typical hub): the volcano biome's hill amplitude
  // (42, the largest of any real zone biome; previously paint-only per
  // BIOME_SHAPE's comment in world.ts) makes the hub-plateau-to-wild blend
  // band (smoothstep(radius*0.7, radius*1.6, distFromHub)) cross a steep raw
  // noise ripple at the default radius 20, breaking the ridge-adjacent
  // walkability margin (tests/terrain_walls.test.ts). A wider radius moves
  // that transition band to safer ground; verified empirically, not derived.
  hub: { x: 0, z: 960, radius: 28, name: 'Ashroot Refuge' },
  graveyard: { x: 15, z: 945 },
  lakes: [KHARZOTH_COOLANT_CISTERN],
  pois: [
    { x: 0, z: 960, label: 'Ashroot Refuge' },
    { x: -55, z: 1005, label: 'The Cinder Pits' },
    { x: 60, z: 1010, label: 'Slaghollow' },
    { x: -70, z: 1030, label: 'Coolant Cistern' },
    { x: 0, z: 1085, label: 'The Chain-Yards' },
    { x: 40, z: 1145, label: 'Embergate' },
    { x: -30, z: 1200, label: "Vharaeth's Overlook" },
  ],
  welcome:
    'Warden Kaelis keeps the Ashroot Refuge hidden. Beyond it, the Dominion pits swallow the free.',
};

// Internal roads (hub to the pits and up to Embergate). Roads only paint terrain
// and the map; they draw no rng. Kept clear of the Coolant Cistern carve so no
// point dips underwater (progression.test.ts samples every road segment).
export const KHARZOTH_ROADS: { x: number; z: number }[][] = [
  [
    { x: 6, z: 966 },
    { x: -30, z: 985 },
    { x: -55, z: 1005 },
  ], // refuge -> Cinder Pits (east)
  [
    { x: -6, z: 966 },
    { x: 35, z: 990 },
    { x: 60, z: 1010 },
  ], // refuge -> Slaghollow (west)
  [
    { x: 0, z: 972 },
    { x: 0, z: 1030 },
    { x: 0, z: 1085 },
    { x: 30, z: 1130 },
    { x: 40, z: 1145 },
  ], // refuge -> Chain-Yards -> Embergate
];

// ---------------------------------------------------------------------------
// Mobs. The Dominion's enslavers: all humanoid overseers plus their slave-hounds
// and the pit rare elite. Loot reuses existing shared items (no new item ids)
// so the intro zone stays self-contained; the origin quest chain adds its own
// collectibles and gear rewards later.
// ---------------------------------------------------------------------------

export const KHARZOTH_MOBS: Record<string, MobTemplate> = {
  kharzoth_thrallguard: {
    id: 'kharzoth_thrallguard',
    name: 'Kharzoth Thrall-Guard',
    minLevel: 1,
    maxLevel: 3,
    family: 'humanoid',
    hpBase: 34,
    hpPerLevel: 15,
    dmgBase: 4,
    dmgPerLevel: 1.6,
    attackSpeed: 2.0,
    armorPerLevel: 16,
    moveSpeed: 7,
    aggroRadius: 10,
    loot: [
      { copper: 10, chance: 1 },
      { itemId: 'linen_scrap', chance: 0.3 },
    ],
    scale: 1.0,
    color: 0x6e5a4a,
  },
  kharzoth_slavehound: {
    id: 'kharzoth_slavehound',
    name: 'Kharzoth Slave-Hound',
    minLevel: 2,
    maxLevel: 4,
    family: 'beast',
    hpBase: 32,
    hpPerLevel: 14,
    dmgBase: 4,
    dmgPerLevel: 1.7,
    attackSpeed: 1.9,
    armorPerLevel: 10,
    moveSpeed: 8.5,
    aggroRadius: 11,
    // The hounds hunt in a pack: one that draws blood whips the rest into a frenzy.
    packFrenzy: { radius: 12, hasteMult: 1.3, duration: 8 },
    loot: [
      { copper: 8, chance: 1 },
      { itemId: 'tough_jerky', chance: 0.25 },
    ],
    scale: 0.9,
    color: 0x4a3b30,
    componentTags: ['hide', 'fang'],
  },
  kharzoth_overseer: {
    id: 'kharzoth_overseer',
    name: 'Kharzoth Overseer',
    minLevel: 3,
    maxLevel: 5,
    family: 'humanoid',
    hpBase: 42,
    hpPerLevel: 17,
    dmgBase: 5,
    dmgPerLevel: 2.0,
    attackSpeed: 2.1,
    armorPerLevel: 20,
    moveSpeed: 7,
    aggroRadius: 11,
    // A cracking whip that saps the strength (attack power) from the struck.
    demoralize: { ap: 18, duration: 8, name: 'Cracking Whip' },
    loot: [
      { copper: 18, chance: 1 },
      { itemId: 'linen_scrap', chance: 0.3 },
      { itemId: 'tough_jerky', chance: 0.2 },
    ],
    scale: 1.05,
    color: 0x8a4b2f,
  },
  kharzoth_chainwarden: {
    id: 'kharzoth_chainwarden',
    name: 'Kharzoth Chain-Warden',
    minLevel: 4,
    maxLevel: 6,
    family: 'humanoid',
    hpBase: 46,
    hpPerLevel: 18,
    dmgBase: 6,
    dmgPerLevel: 2.1,
    attackSpeed: 2.2,
    armorPerLevel: 22,
    moveSpeed: 7,
    aggroRadius: 11,
    // Casts a length of shackle-chain to root a fleeing captive in place.
    ensnare: { chance: 0.3, duration: 3, name: 'Binding Chains', school: 'physical' },
    loot: [
      { copper: 25, chance: 1 },
      { itemId: 'linen_scrap', chance: 0.35 },
      { itemId: 'lesser_healing_potion', chance: 0.06 },
    ],
    scale: 1.05,
    color: 0x707b7c,
  },
  kharzoth_slavedriver: {
    id: 'kharzoth_slavedriver',
    name: 'Kharzoth Slavedriver',
    minLevel: 5,
    maxLevel: 7,
    family: 'humanoid',
    hpBase: 50,
    hpPerLevel: 19,
    dmgBase: 7,
    dmgPerLevel: 2.2,
    attackSpeed: 2.0,
    armorPerLevel: 22,
    moveSpeed: 7,
    aggroRadius: 12,
    // Flings a fistful of pit-ash to foul a foe's aim for a few seconds.
    blind: { chance: 0.25, miss: 0.3, duration: 5, name: 'Ash in the Eyes', school: 'physical' },
    // Drives the work-gang harder: a shout that quickens nearby Dominion swings.
    warcry: {
      radius: 12,
      every: 10,
      hasteMult: 1.2,
      duration: 6,
      name: "Driver's Cadence",
      school: 'physical',
    },
    loot: [
      { copper: 32, chance: 1 },
      { itemId: 'linen_scrap', chance: 0.3 },
      { itemId: 'lesser_healing_potion', chance: 0.08 },
    ],
    scale: 1.08,
    color: 0x943126,
  },
  pitmaster_vorgal: {
    id: 'pitmaster_vorgal',
    name: 'Pitmaster Vorgal',
    minLevel: 8,
    maxLevel: 8,
    family: 'humanoid',
    rare: true,
    elite: true,
    ccImmune: true,
    respawnMult: 432,
    hpBase: 300,
    hpPerLevel: 56,
    dmgBase: 12,
    dmgPerLevel: 3.4,
    attackSpeed: 2.2,
    armorPerLevel: 30,
    moveSpeed: 7,
    aggroRadius: 13,
    // Whirls his chains in a wide arc, then calls thrall-guards to the pit floor
    // and turns savage as he is brought low.
    aoePulse: { min: 13, max: 19, radius: 8, every: 9, name: 'Chainstorm', school: 'physical' },
    summonAdds: { mobId: 'kharzoth_thrallguard', count: 2, atHpPct: [0.6, 0.3] },
    enrage: { belowHpPct: 0.3, dmgMult: 1.5, hasteMult: 1.3 },
    loot: [
      { copper: 150, chance: 1 },
      { itemId: 'lesser_healing_potion', chance: 1 },
      { itemId: 'linen_scrap', chance: 1 },
    ],
    scale: 1.24,
    color: 0x5b2c1a,
  },
  // Vharaeth's Overlook trial (TK-5). A spirit avatar of the wild kindred (family
  // 'elemental'): a solo rare elite that tests the freed at the ridge above the
  // Dominion. All of its scripted behavior (opener yells, the half-health judgment
  // pulse, the death recognition) lives in encounters/vharaeth.ts, driven per tick
  // from mob/locomotion.ts; the template itself carries no aoePulse/summon fields,
  // so the ONLY rng draw is the module's judgment roll. ccImmune matches the pit
  // rare above. The origin quest chain (TK-6) will key a kill objective off its id.
  vharaeth_avatar: {
    id: 'vharaeth_avatar',
    name: 'Avatar of Vharaeth',
    minLevel: 8,
    maxLevel: 8,
    family: 'elemental',
    rare: true,
    elite: true,
    ccImmune: true,
    respawnMult: 144,
    hpBase: 150,
    hpPerLevel: 26,
    dmgBase: 8,
    dmgPerLevel: 2.4,
    attackSpeed: 2.2,
    armorPerLevel: 26,
    moveSpeed: 7,
    aggroRadius: 12,
    loot: [
      { copper: 120, chance: 1 },
      { itemId: 'lesser_healing_potion', chance: 1 },
      { itemId: 'tough_jerky', chance: 0.5 },
    ],
    scale: 1.2,
    color: 0x4d9e6a,
  },
};

// ---------------------------------------------------------------------------
// NPCs (Ashroot Refuge). Warden Kaelis and Rootspeaker Ysha anchor the origin
// chain below; Steward Orin is a vendor only (no quests).
// ---------------------------------------------------------------------------

export const KHARZOTH_NPCS: Record<string, NpcDef> = {
  warden_kaelis: {
    id: 'warden_kaelis',
    name: 'Warden Kaelis',
    title: 'Keeper of Ashroot',
    pos: { x: 4, z: 962 },
    facing: Math.PI,
    color: 0x6e4a2f,
    questIds: ['q_kharzoth_first_steps', 'q_kharzoth_trial_of_roots'],
    greeting:
      'Speak low, $C. Every soul in this refuge slipped a Kharzoth chain, and the Dominion counts its losses.',
  },
  steward_orin: {
    id: 'steward_orin',
    name: 'Steward Orin',
    title: 'Camp Steward',
    pos: { x: -6, z: 964 },
    facing: Math.PI / 2,
    color: 0x1e8449,
    questIds: [],
    vendorItems: [
      'baked_bread',
      'spring_water',
      'tough_jerky',
      'minor_healing_potion',
      'minor_mana_potion',
    ],
    greeting: 'Scavenged, salvaged, and shared. Take what you need, $N, and leave what you can.',
  },
  rootspeaker_ysha: {
    id: 'rootspeaker_ysha',
    name: 'Rootspeaker Ysha',
    title: 'Voice of the Kindred',
    pos: { x: 8, z: 958 },
    facing: -Math.PI / 2,
    color: 0x4d7a3a,
    questIds: ['q_kharzoth_ancestors_call', 'q_kharzoth_trial_of_roots'],
    greeting:
      'The old roots remember what the Dominion tried to burn out of us, $N. Listen, and they will remember through you.',
  },
};

// ---------------------------------------------------------------------------
// Origin quest chain (capture, survive -> ritual call -> trial of roots): the
// rootwarden's escape and awakening. No item rewards: the shared item pool has
// no slot-agnostic accessory and every existing armor piece is the wrong
// armorType for a mail class (rootwarden resolves rewards through
// REWARD_ARCHETYPE's 'rogue' fallback, but 'rogue'-keyed gear here is
// leather/cloth), so xp/copper alone avoids handing out a downgrade; a proper
// mail reward is new-item scope, out of this task.
// ---------------------------------------------------------------------------

export const KHARZOTH_QUESTS: Record<string, QuestDef> = {
  q_kharzoth_first_steps: {
    id: 'q_kharzoth_first_steps',
    name: 'First Steps Free',
    giverNpcId: 'warden_kaelis',
    turnInNpcId: 'warden_kaelis',
    text: "You made it out of the pits, $N, but the Dominion's thrall-guards still patrol the approaches. Thin them out so the refuge stays hidden. Fell 4 Kharzoth Thrall-Guards.",
    completionText:
      "Steadier already. That's the first thing the Dominion takes from you, $N: the belief you can still fight back.",
    objectives: [
      {
        type: 'kill',
        targetMobId: 'kharzoth_thrallguard',
        count: 4,
        label: 'Kharzoth Thrall-Guard slain',
      },
    ],
    xpReward: 120,
    copperReward: 40,
    itemRewards: {},
  },
  q_kharzoth_ancestors_call: {
    id: 'q_kharzoth_ancestors_call',
    name: "The Ancestors' Call",
    giverNpcId: 'rootspeaker_ysha',
    turnInNpcId: 'rootspeaker_ysha',
    text: 'I felt it the moment you slipped your chain, $N: the old roots stirring. The slave-hounds hunt the pit trails; outlast their pack and the ancestors will know your name. Slay 5 Kharzoth Slave-Hounds.',
    completionText:
      "They are watching now, $N. Climb to Vharaeth's Overlook, north past the Chain-Yards, and stand before the trial they have set for you.",
    objectives: [
      {
        type: 'kill',
        targetMobId: 'kharzoth_slavehound',
        count: 5,
        label: 'Kharzoth Slave-Hound slain',
      },
    ],
    xpReward: 180,
    copperReward: 60,
    itemRewards: {},
    requiresQuest: 'q_kharzoth_first_steps',
  },
  q_kharzoth_trial_of_roots: {
    id: 'q_kharzoth_trial_of_roots',
    name: 'The Trial of Roots',
    giverNpcId: 'rootspeaker_ysha',
    turnInNpcId: 'warden_kaelis',
    text: "This is the last of it, $N. The Avatar of Vharaeth waits at the Overlook to judge what you've become. Stand before it, and endure.",
    completionText:
      'The roots remember your name now, warden. Kharzoth took everything from you once. See that it never does again.',
    objectives: [
      {
        type: 'kill',
        targetMobId: 'vharaeth_avatar',
        count: 1,
        label: 'Avatar of Vharaeth defeated',
      },
    ],
    xpReward: 500,
    copperReward: 250,
    itemRewards: {},
    requiresQuest: 'q_kharzoth_ancestors_call',
  },
};

export const KHARZOTH_QUEST_ORDER: string[] = [
  'q_kharzoth_first_steps',
  'q_kharzoth_ancestors_call',
  'q_kharzoth_trial_of_roots',
];

// ---------------------------------------------------------------------------
// World layout. Ashroot Refuge sits at (0,960); +z north (deeper into Dominion
// territory), +x WEST (east is -x, per the zone1 layout note).
//
// CAMP ORDERING CAUTION (determinism): the Sim ctor's camp loop is the final
// rng consumer at world construction, and it draws in CAMPS array order, so an
// entry inserted before others shifts their spawn rolls. In data.ts these camps
// are appended LAST (after every existing zone camp and the tail rare elites),
// so existing content keeps its exact draw order. The pit rare elite
// (pitmaster_vorgal) is kept as the LAST entry of this block for the same
// reason: adding it perturbs nothing before it.
// ---------------------------------------------------------------------------

export const KHARZOTH_CAMPS: CampDef[] = [
  // Thrall-guards on the refuge approaches
  { mobId: 'kharzoth_thrallguard', center: { x: -40, z: 990 }, radius: 20, count: 6 },
  { mobId: 'kharzoth_thrallguard', center: { x: 45, z: 995 }, radius: 20, count: 6 },
  // Slave-hound pack roaming between the pits
  { mobId: 'kharzoth_slavehound', center: { x: -25, z: 1015 }, radius: 16, count: 5 },
  // Overseers working the cinder pits (east) and Slaghollow (west)
  { mobId: 'kharzoth_overseer', center: { x: -58, z: 1005 }, radius: 18, count: 6 },
  { mobId: 'kharzoth_overseer', center: { x: 62, z: 1015 }, radius: 18, count: 6 },
  // Chain-wardens holding the slave pens
  { mobId: 'kharzoth_chainwarden', center: { x: -5, z: 1085 }, radius: 20, count: 6 },
  { mobId: 'kharzoth_chainwarden', center: { x: 25, z: 1095 }, radius: 16, count: 5 },
  // Slavedrivers pushing the deep work-gangs toward Embergate
  { mobId: 'kharzoth_slavedriver', center: { x: 35, z: 1140 }, radius: 18, count: 6 },
  { mobId: 'kharzoth_slavedriver', center: { x: -15, z: 1160 }, radius: 16, count: 5 },
  // Pit rare elite (see ordering caution above)
  { mobId: 'pitmaster_vorgal', center: { x: 40, z: 1150 }, radius: 4, count: 1 },
  // Vharaeth's Overlook trial elite (TK-5), a solo spawn kept AFTER pitmaster_vorgal
  // (the true LAST entry now) so appending it perturbs no earlier camp's spawn rolls,
  // preserving the same world-construction rng draw order the ordering caution guards.
  { mobId: 'vharaeth_avatar', center: { x: -30, z: 1200 }, radius: 3, count: 1 },
];

// No collectible ground objects yet (the origin chain adds its own). Exported so
// data.ts can spread a stable, empty array now.
export const KHARZOTH_OBJECTS: GroundObjectDef[] = [];

// ---------------------------------------------------------------------------
// Static props (rendering + collision share this placement data)
// ---------------------------------------------------------------------------

export const KHARZOTH_PROPS: ZonePropsDef = {
  buildings: [
    { kind: 'house', x: 10, z: 966, w: 6, d: 5, rot: 0.3 },
    { kind: 'house', x: -12, z: 964, w: 6, d: 5, rot: -0.4 },
  ],
  wells: [{ x: 0, z: 958, r: 1.5 }],
  stalls: [{ x: -8, z: 962, rot: Math.PI / 2, r: 1.7 }], // Steward Orin's stall
  mines: [
    { x: -58, z: 1005, rot: 0.6 },
    { x: 62, z: 1015, rot: -0.8 },
    { x: 0, z: 1085, rot: 0.2 },
  ],
  docks: [],
  tents: [
    { x: 14, z: 970, rot: 0.4, scale: 1 },
    { x: -16, z: 972, rot: 1.8, scale: 1 },
    { x: 36, z: 1140, rot: 0.6, scale: 1.2 },
    { x: -14, z: 1158, rot: -0.5, scale: 1 },
  ],
  crates: [
    [-55, 1002],
    [60, 1012],
    [2, 1082],
    [38, 1146],
  ],
  campfires: [
    [3, 962],
    [-56, 1004],
    [61, 1014],
    [0, 1084],
    [38, 1148],
  ],
  mudHuts: [],
  ruinRings: [{ x: 40, z: 1145, ringR: 7, columns: 6 }],
  fences: [
    { x1: -10, z1: 1080, x2: 10, z2: 1090 },
    { x1: 20, z1: 1092, x2: 32, z2: 1100 },
  ],
  graveyards: [{ x: 15, z: 945 }],
  delveMarkers: [],
};
