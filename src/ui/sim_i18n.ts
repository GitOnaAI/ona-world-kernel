// AUTO-ASSEMBLED localization for sim-emitted system/combat/loot/error log text.
// The deterministic core (src/sim) is host-agnostic and MUST stay English: it emits
// SimEvent log/error/loot text in English. The client re-renders it here, exactly
// mirroring server_i18n.ts. hud.ts calls localizeSimText() as a fallback inside
// localizeSystemText / localizeErrorText / localizeLootText (after localizeServerText).
// Player/build names splice through verbatim; item and mob names are localized via
// the entity dictionary; numbers and roll values pass through unchanged.
//
// NOTE: this is the ONE place sim English is re-localized — when a SimEvent text:
// literal in src/sim/sim.ts changes, update the matching EXACT value or RULE here.
// The S3 guard in tests/localization_fixes.test.ts parses src/sim/sim.ts, enumerates
// every player-facing emit site, and fails if any is no longer recognized by a client
// matcher — so a new unhandled sim string cannot ship silently.
import { ABILITIES, DELVES, ITEMS, MOBS } from '../sim/data';
import { DELVE_MODULE_NAMES } from '../sim/sim';
import { tEntity } from './entity_i18n';
import {
  formatNumber,
  getLanguage,
  type InterpolationValues,
  type SupportedLanguage,
  supportedLanguages,
  type TranslationKey,
  t,
} from './i18n';

const baseEnTable = {
  'error.lineOfSight': 'Line of sight.',
  'error.bagsFull': 'Your bags are full.',
  'error.bagSocketsFull': 'All your bag slots are full.',
  'error.bagSwapTooManyItems': 'You have too many items to swap to that bag.',
  'error.bagRemoveTooManyItems': 'You have too many items to remove that bag.',
  'error.tradeBagSpace': 'Trade failed: not enough bag space.',
  'log.bagsMigrated': 'Your belongings have been packed into new bags.',
  'error.specLevel': 'You may choose a specialization at level {level}.',
  'error.equipLevel': 'You must be level {level} to equip that.',
  'error.invalidBuild': 'Invalid talent build.',
  'error.unknownSpec': 'Unknown specialization.',
  'error.maxLoadouts': 'You can save at most {count} loadouts.',
  'error.noLoadout': 'No such loadout.',
  'error.loadoutLevel': 'That loadout needs a higher level.',
  'error.cannotEquip': 'You cannot equip that.',
  'error.faceWater': 'You need to face fishable water.',
  'error.potionNotReady': 'That potion is not ready yet.',
  'error.fullHealth': 'You are already at full health.',
  'error.nothingRestore': 'Nothing to restore.',
  'error.merchantUnavailable': 'That merchant is not available.',
  'error.notForSale': 'That item is not for sale.',
  'error.noMerchant': 'There is no merchant nearby.',
  'error.noSellQuest': 'You cannot sell quest items.',
  'error.noBuyback': 'That item is not available for buyback.',
  'error.nailedShut': 'It is nailed shut.',
  'error.enoughOfThose': 'You have enough of those.',
  'error.whoOnline': 'The /who roster is available in online play.',
  'error.alreadyInParty': 'You are already in a party.',
  'error.notPartyLeader': 'You are not the party leader.',
  'error.raidMarkersParty': 'You must be in a party to use raid markers.',
  'error.nameSellQty': 'Name how many you wish to sell.',
  'error.talentsInCombat': 'You cannot change talents in combat.',
  'error.talentsArena': 'You cannot change talents during an arena match.',
  'error.noItem': "You don't have that item.",
  'error.cantWhileDead': "You can't do that while dead.",
  'error.cantWhileSwimming': "You can't do that while swimming.",
  'error.tameThat': 'You cannot tame that.',
  'error.tameBeastsOnly': 'Only beasts can be tamed.',
  'error.tameTooStrong': 'That beast is too strong to tame.',
  'error.tameTooHigh': 'That beast is too high level for you to tame.',
  'error.tameDungeon': 'You cannot tame dungeon creatures.',
  'error.alreadyHavePet': 'You already have a pet.',
  'error.noLootPermission': "You don't have permission to loot that.",
  'error.corpseAlreadyHarvested': 'This corpse has already been harvested.',
  'error.corpseNothingToHarvest': 'That corpse has nothing to harvest.',
  'error.gatherNodeMissing': 'That resource node does not exist.',
  'error.gatherNodeNotRespawned': 'This resource node has not respawned for you yet.',
  // Custom per-item ground-pickup lines (src/sim/content/ground_pickup_lines.ts).
  // Emitted via def.pickupDeny/def.pickupEnough (variable-routed, so the S3 guard
  // cannot see them); values must stay byte-identical to that table for the EXACT
  // matcher to recognize them. The three grave_* deny lines share one string/key.
  'groundPickup.supplyCrateDeny': 'The crate is nailed shut.',
  'groundPickup.gravecallerSigilDeny': 'The sigil repels your touch.',
  'groundPickup.ledgerPageDeny': 'The ledger pages are bound too tightly to take.',
  'groundPickup.morthenGrimoireDeny': "The grimoire's clasp is magically sealed.",
  'groundPickup.fenMusterOrderDeny': 'The wax seal holds until the order is yours to claim.',
  'groundPickup.caravanGoodsDeny': "You aren't authorized to salvage these goods yet.",
  'groundPickup.rustedCenserDeny': 'The censer is chained in place.',
  'groundPickup.bastionWardStoneDeny': 'The ward stone will not budge.',
  'groundPickup.alienWeaponryDeny':
    'The meteor debris is too hot to handle without Aldric expecting it.',
  'groundPickup.highwatchSummonsDeny': 'The summons are sealed with Highwatch wax.',
  'groundPickup.ogreWarTotemDeny': 'The totem is planted too firmly to uproot.',
  'groundPickup.gravewyrmSigilDeny': 'Dark magic keeps the sigil rooted.',
  'groundPickup.sanctumKeyShardDeny': 'The shard is dormant and locked in place.',
  'groundPickup.moongateRubbingDeny':
    'The warding is not yours to copy until the watcher asks for it.',
  'groundPickup.graveSealedDeny':
    'The grave is sealed against the living until the dead call you to it.',
  'groundPickup.cryptRitualCircleDeny': 'The ritual circle lies cold and dormant.',
  'groundPickup.supplyCrateEnough': 'You already have enough supply crates.',
  'groundPickup.gravecallerSigilEnough': "You already carry a Gravecaller's Sigil.",
  'groundPickup.ledgerPageEnough': 'You already have enough ledger pages.',
  'groundPickup.morthenGrimoireEnough': "You already have Morthen's Grimoire.",
  'groundPickup.fenMusterOrderEnough': 'You already have the Fenbridge muster order.',
  'groundPickup.caravanGoodsEnough': 'You already have enough caravan goods.',
  'groundPickup.rustedCenserEnough': 'You already have enough rusted censers.',
  'groundPickup.bastionWardStoneEnough': 'You already have the Bastion ward stone.',
  'groundPickup.alienWeaponryEnough': 'You already recovered enough alien wreckage.',
  'groundPickup.highwatchSummonsEnough': 'You already have the Highwatch summons.',
  'groundPickup.ogreWarTotemEnough': 'You already have enough ogre war totems.',
  'groundPickup.gravewyrmSigilEnough': 'You already have enough Gravewyrm sigils.',
  'groundPickup.sanctumKeyShardEnough': 'You already have enough sanctum key shards.',
  'groundPickup.moongateRubbingEnough': 'You already have the warding rubbing.',
  'groundPickup.graveAldrenEnough': "You have already taken what Captain Aldren's grave will give.",
  'groundPickup.graveMalricEnough':
    "You have already taken what High Priest Malric's grave will give.",
  'groundPickup.graveVossEnough':
    "You have already taken what Royal Assassin Voss's grave will give.",
  'groundPickup.cryptRitualCircleEnough': 'The circle has nothing more to give you.',
  'log.talentsUpdated': 'Talents updated.',
  'log.talentsReset': 'Talents reset.',
  'log.savedBuild': 'Saved build “{name}”.',
  'log.loadoutApplied': 'Loadout “{name}” applied.',
  'log.deletedBuild': 'Deleted build “{name}”.',
  'log.dismissPet': 'You dismiss {name}.',
  'log.summonDemon': 'You summon {name}.',
  'log.tamedPet': '{name} is now your loyal companion.',
  'log.entityDies': '{name} dies.',
  'log.prestiged': 'You have prestiged! Prestige Rank {rank}.',
  'log.enraged': '{name} becomes enraged!',
  'log.callsForAid': '{name} calls for aid!',
  'log.deathThroesArm': '{name} begins to swell — get clear!',
  'log.deathThroesBurst': '{name} bursts in a cloud of {effect}!',
  'log.discarded': 'Discarded {item}.',
  'log.equipped': 'Equipped {item}.',
  'log.unequipped': 'Unequipped {item}.',
  'log.noFish': 'No fish are biting.',
  'log.rareCatch': 'A rare catch! Something gleams on your line.',
  'log.sitEat': 'You sit down to eat.',
  'log.sitDrink': 'You sit down to drink.',
  'log.quaff': 'You quaff {item}.',
  'log.boutDecided': 'The bout is decided. Returning to the world…',
  'log.partyLeaves': '{name} leaves the party.',
  'log.partyLeft': '{name} has left the party.',
  'log.partyRemoved': '{name} has been removed from the party.',
  'loot.rollWin': '{winner} wins {item} ({roll})',
  'loot.marketSellerBought':
    '{buyer} bought your {item} for {price} - collect {proceeds} from the Merchant.',
  'log.learnedAbility': 'You have learned a new ability: {name}.',
  'log.abilityRankUp': 'Your {name} has improved to Rank {rank}.',
  'log.stopFollowing': 'You stop following.',
  'log.noOneToFollow': 'There is no one to follow.',
  'log.stopFollowingCombat': 'You stop following - you are in combat.',
  'log.tooFarToFollow': '{name} is too far away to follow.',
  'log.nowFollowing': 'Now following {name}.',
  'error.notFollowingAnyone': 'You are not following anyone.',
  'error.cantFollowSelf': "You can't follow yourself.",
  'error.cantFollowInCombat': "You can't start following while in combat.",
  'error.targetToFollow': 'Target a player to follow, or use /follow <name>.',
  'presence.noLongerAfk': 'You are no longer Away From Keyboard.',
  'presence.leftDnd': 'You have left Do Not Disturb mode.',
  'presence.nowAfk': 'You are now Away From Keyboard: {message}',
  'presence.nowDnd': 'You are now in Do Not Disturb mode: {message}',
  'presence.noLongerAway': 'You are no longer marked as away.',
  'presence.afkDefault': 'Away From Keyboard',
  'presence.dndDefault': 'Do Not Disturb',
  'log.channelJoined': 'Joined the {channel} channel. Type /{channel} <message> to talk.',
  'log.channelLeft': 'Left the {channel} channel.',
  'error.channelUsage': 'Usage: /{action} <channel>. Channels: {list}.',
  'error.generalAlwaysOn': 'The General channel is always on - just use /general.',
  'error.noSuchChannel': "There is no channel named '{name}'. Channels: {list}.",
  'error.alreadyInChannel': 'You are already in the {channel} channel.',
  'error.notInChannel': 'You are not in the {channel} channel.',
  'error.notInChannelJoin': 'You are not in the {channel} channel. Type /join {channel} first.',
  'log.bossUnleashes': '{name} unleashes {mechanic}!',
  'log.mobChannels': '{name} channels {mechanic}.',
  'aura.tamed': 'Tamed',
  'aura.causticSpores': 'Caustic Spores',
  'aura.elixirBear': 'Might of the Bear',
  'mechanic.warStomp': 'Shuddering Stomp',
  'mechanic.boneCarapace': 'Bone Carapace',
  'mechanic.bansheesWail': 'Keening Wail',
  'mechanic.crushingSweep': 'Crushing Sweep',
  'mechanic.rallyingBanner': 'Rallying Banner',
  'mechanic.finalBell': 'Final Bell',
  'mechanic.blackwaterMark': 'Blackwater Mark',
  'mechanic.litanyPulse': 'Litany Pulse',
  'mechanic.siltWard': 'Silt Ward',
  'mechanic.siltHide': 'Silt Hide',
  'mechanic.sumpStomp': 'Sump Stomp',
  'mechanic.bellShock': 'Bell Shock',
  'mechanic.eggSacBurst': 'Egg-Sac Burst',
  'mechanic.tollingBell': 'Tolling Bell',
  'log.nhaliaTollsBells': '{name} tolls the bells!',
  'aura.drownedCanticle': 'Drowned Canticle',
  'mechanic.tectonicHeave': 'Tectonic Heave',
  'mechanic.seismicStomp': 'Seismic Stomp',
  'mechanic.mountainhide': 'Mountainhide',
  'mechanic.thunderclap': 'Thunderclap',
  'mechanic.stormcall': 'Stormcall',
  'mechanic.howlingGale': 'Howling Gale',
  'aura.spiderVenom': 'Spider Venom',
  'aura.skullthump': 'Skullthump',
  'aura.blindingPowder': 'Blinding Powder',
  'aura.witheringWail': 'Withering Wail',
  'aura.soulrot': 'Soulrot',
  'aura.mudfinHex': 'Mudfin Hex',
  'aura.miringPounce': 'Miring Pounce',
  'aura.acidSpit': 'Acid Spit',
  'aura.exposedWound': 'Exposed Wound',
  'aura.bogRot': 'Bog Rot',
  'aura.witheringRot': 'Withering Rot',
  'aura.curseOfFrailty': 'Curse of Frailty',
  'aura.weakeningHex': 'Weakening Hex',
  'aura.silencingShriek': 'Silencing Shriek',
  'aura.wailOfTheGrave': 'Wail of the Grave',
  'aura.graveBlight': 'Grave Blight',
  'aura.drainingLitany': 'Draining Litany',
  'aura.spiritSiphon': 'Spirit Siphon',
  'aura.dirgeOfTongues': 'Dirge of Tongues',
  'aura.profaneRune': 'Profane Rune',
  'aura.broodVenom': 'Brood Venom',
  'aura.rendingClaws': 'Rending Claws',
  'aura.smolderingFuse': 'Smoldering Fuse',
  'aura.cinderburn': 'Cinderburn',
  'aura.concussiveBlow': 'Concussive Blow',
  'aura.disarmingSmash': 'Disarming Smash',
  'aura.staticCharge': 'Static Charge',
  'aura.frostbite': 'Winterbite',
  'aura.maddeningWhisper': 'Maddening Whisper',
  'aura.wyrmwardSigil': 'Wyrmward Sigil',
  'aura.soulSiphon': 'Soul Siphon',
  'aura.forgottenWound': 'Forgotten Wound',
  'aura.searingMaw': 'Searing Maw',
  'aura.crackedGuard': 'Cracked Guard',
  'aura.offBalance': 'Off-Balance',
  'aura.numbingChill': 'Numbing Chill',
  'aura.webSnare': 'Web Snare',
  'aura.feedingFrenzy': 'Feeding Frenzy',
  'aura.demoralized': 'Demoralized',
  'aura.resurrectionSickness': "The Keeper's Toll",
} as const;

const petEnTable = {
  'error.noPet': 'You have no pet.',
  'error.petsNotAllowedInDelves': 'Pets are not allowed inside the delves.',
  'error.petAlreadyAlive': 'Your pet is already alive.',
  'error.permanentPetAbandonFrame': 'Permanent pets can only be abandoned from the pet frame.',
  'error.summonUnavailable': 'That summon is unavailable.',
  'error.huntersAbandonPets': 'Only hunters can abandon pets.',
  'error.petClassesRename': 'Only pet classes can rename pets.',
  'error.petNameInvalid':
    'Pet name must be 2-16 letters/spaces/hyphen/apostrophe and start with a letter.',
  'error.petClassesRevive': 'Only pet classes can revive pets.',
  'error.petClassesCommand': 'Only pet classes can command pets.',
  'error.noLivingPet': 'You have no living pet.',
  'error.petNeedsHostileTarget': 'Your pet needs a hostile target.',
  'error.petTauntNotReady': 'Pet taunt is not ready.',
  'petGrowl.ready': "Your pet's Growl is ready. {autoState}",
  'petGrowl.cooldown': "Your pet's Growl is on cooldown. {autoState} Ready in {seconds}s.",
  'petGrowl.autoOn': 'Auto-taunt is on.',
  'petGrowl.autoOff': 'Auto-taunt is off.',
  'error.huntersFeedPets': 'Only hunters can feed pets.',
  'error.petFoodOnly': 'Your pet can only eat food.',
  'error.petFullHealth': 'Your pet is already at full health.',
  'error.warlocksDemonHeal': 'Only warlocks can channel demon healing.',
  'error.youAreDead': 'You are dead.',
  'error.youAreStunned': 'You are stunned.',
  'error.noLivingDemon': 'You have no living demon.',
  'error.demonFullHealth': 'Your demon is already at full health.',
  'log.petFadesVoid': '{name} fades back into the void.',
  'log.petAnswersSummons': '{name} answers your summons.',
  'log.abandonPet': 'You abandon {name}.',
  'log.petRenamed': 'Your pet is now named {name}.',
  'log.petReturns': '{name} returns to your side.',
  'log.petRestoreLost': '{name} could not be restored and has been lost.',
  'log.petRestoreLostNoName': 'Your pet could not be restored and has been lost.',
  'log.feedPet': 'You feed {name}.',
  'log.demonHealChannel': 'You channel healing into {name}.',
  'log.petMode': '{name} is now {mode}.',
  'petMode.passive': 'passive',
  'petMode.defensive': 'defensive',
  'petMode.aggressive': 'aggressive',
  'aura.summoned': 'Summoned',
  'aura.fed': 'Fed',
} as const;

const enTable = { ...baseEnTable, ...petEnTable } as const;

type BaseSimMessageKey = keyof typeof baseEnTable;
type PetSimMessageKey = keyof typeof petEnTable;
export type SimMessageKey = keyof typeof enTable;

// Per-locale table. Contributors add English only; non-English omissions fall
// back to English here until the release localization pass fills them.
const BASE_DICT: Record<SupportedLanguage, Partial<Record<BaseSimMessageKey, string>>> = {
  en: {
    'error.lineOfSight': 'Line of sight.',
    'error.bagsFull': 'Your bags are full.',
    'error.bagSocketsFull': 'All your bag slots are full.',
    'error.bagSwapTooManyItems': 'You have too many items to swap to that bag.',
    'error.bagRemoveTooManyItems': 'You have too many items to remove that bag.',
    'error.tradeBagSpace': 'Trade failed: not enough bag space.',
    'log.bagsMigrated': 'Your belongings have been packed into new bags.',
    'error.specLevel': 'You may choose a specialization at level {level}.',
    'error.equipLevel': 'You must be level {level} to equip that.',
    'error.invalidBuild': 'Invalid talent build.',
    'error.unknownSpec': 'Unknown specialization.',
    'error.maxLoadouts': 'You can save at most {count} loadouts.',
    'error.noLoadout': 'No such loadout.',
    'error.loadoutLevel': 'That loadout needs a higher level.',
    'error.cannotEquip': 'You cannot equip that.',
    'error.faceWater': 'You need to face fishable water.',
    'error.potionNotReady': 'That potion is not ready yet.',
    'error.fullHealth': 'You are already at full health.',
    'error.nothingRestore': 'Nothing to restore.',
    'error.merchantUnavailable': 'That merchant is not available.',
    'error.notForSale': 'That item is not for sale.',
    'error.noMerchant': 'There is no merchant nearby.',
    'error.noSellQuest': 'You cannot sell quest items.',
    'error.noBuyback': 'That item is not available for buyback.',
    'error.nailedShut': 'It is nailed shut.',
    'error.enoughOfThose': 'You have enough of those.',
    'error.whoOnline': 'The /who roster is available in online play.',
    'error.alreadyInParty': 'You are already in a party.',
    'error.notPartyLeader': 'You are not the party leader.',
    'error.raidMarkersParty': 'You must be in a party to use raid markers.',
    'error.nameSellQty': 'Name how many you wish to sell.',
    'error.talentsInCombat': 'You cannot change talents in combat.',
    'error.talentsArena': 'You cannot change talents during an arena match.',
    'error.noItem': "You don't have that item.",
    'error.cantWhileDead': "You can't do that while dead.",
    'error.cantWhileSwimming': "You can't do that while swimming.",
    'error.tameThat': 'You cannot tame that.',
    'error.tameBeastsOnly': 'Only beasts can be tamed.',
    'error.tameTooStrong': 'That beast is too strong to tame.',
    'error.tameTooHigh': 'That beast is too high level for you to tame.',
    'error.tameDungeon': 'You cannot tame dungeon creatures.',
    'error.alreadyHavePet': 'You already have a pet.',
    'error.noLootPermission': "You don't have permission to loot that.",
    'error.corpseAlreadyHarvested': 'This corpse has already been harvested.',
    'error.corpseNothingToHarvest': 'That corpse has nothing to harvest.',
    'error.gatherNodeMissing': 'That resource node does not exist.',
    'error.gatherNodeNotRespawned': 'This resource node has not respawned for you yet.',
    'log.talentsUpdated': 'Talents updated.',
    'log.talentsReset': 'Talents reset.',
    'log.savedBuild': 'Saved build “{name}”.',
    'log.loadoutApplied': 'Loadout “{name}” applied.',
    'log.deletedBuild': 'Deleted build “{name}”.',
    'log.dismissPet': 'You dismiss {name}.',
    'log.summonDemon': 'You summon {name}.',
    'log.tamedPet': '{name} is now your loyal companion.',
    'log.entityDies': '{name} dies.',
    'log.prestiged': 'You have prestiged! Prestige Rank {rank}.',
    'log.enraged': '{name} becomes enraged!',
    'log.callsForAid': '{name} calls for aid!',
    'log.deathThroesArm': '{name} begins to swell — get clear!',
    'log.deathThroesBurst': '{name} bursts in a cloud of {effect}!',
    'log.discarded': 'Discarded {item}.',
    'log.equipped': 'Equipped {item}.',
    'log.unequipped': 'Unequipped {item}.',
    'log.noFish': 'No fish are biting.',
    'log.rareCatch': 'A rare catch! Something gleams on your line.',
    'log.sitEat': 'You sit down to eat.',
    'log.sitDrink': 'You sit down to drink.',
    'log.quaff': 'You quaff {item}.',
    'log.boutDecided': 'The bout is decided. Returning to the world…',
    'log.partyLeaves': '{name} leaves the party.',
    'log.partyLeft': '{name} has left the party.',
    'log.partyRemoved': '{name} has been removed from the party.',
    'loot.rollWin': '{winner} wins {item} ({roll})',
    'loot.marketSellerBought':
      '{buyer} bought your {item} for {price} - collect {proceeds} from the Merchant.',
    'log.learnedAbility': 'You have learned a new ability: {name}.',
    'log.abilityRankUp': 'Your {name} has improved to Rank {rank}.',
    'log.stopFollowing': 'You stop following.',
    'log.noOneToFollow': 'There is no one to follow.',
    'log.stopFollowingCombat': 'You stop following - you are in combat.',
    'log.tooFarToFollow': '{name} is too far away to follow.',
    'log.nowFollowing': 'Now following {name}.',
    'error.notFollowingAnyone': 'You are not following anyone.',
    'error.cantFollowSelf': "You can't follow yourself.",
    'error.cantFollowInCombat': "You can't start following while in combat.",
    'error.targetToFollow': 'Target a player to follow, or use /follow <name>.',
    'presence.noLongerAfk': 'You are no longer Away From Keyboard.',
    'presence.leftDnd': 'You have left Do Not Disturb mode.',
    'presence.nowAfk': 'You are now Away From Keyboard: {message}',
    'presence.nowDnd': 'You are now in Do Not Disturb mode: {message}',
    'presence.noLongerAway': 'You are no longer marked as away.',
    'presence.afkDefault': 'Away From Keyboard',
    'presence.dndDefault': 'Do Not Disturb',
    'log.channelJoined': 'Joined the {channel} channel. Type /{channel} <message> to talk.',
    'log.channelLeft': 'Left the {channel} channel.',
    'error.channelUsage': 'Usage: /{action} <channel>. Channels: {list}.',
    'error.generalAlwaysOn': 'The General channel is always on - just use /general.',
    'error.noSuchChannel': "There is no channel named '{name}'. Channels: {list}.",
    'error.alreadyInChannel': 'You are already in the {channel} channel.',
    'error.notInChannel': 'You are not in the {channel} channel.',
    'error.notInChannelJoin': 'You are not in the {channel} channel. Type /join {channel} first.',
    'log.bossUnleashes': '{name} unleashes {mechanic}!',
    'log.mobChannels': '{name} channels {mechanic}.',
    'aura.tamed': 'Tamed',
    'aura.causticSpores': 'Caustic Spores',
    'aura.elixirBear': 'Might of the Bear',
    'mechanic.warStomp': 'Shuddering Stomp',
    'mechanic.boneCarapace': 'Bone Carapace',
    'mechanic.bansheesWail': 'Keening Wail',
    'mechanic.crushingSweep': 'Crushing Sweep',
    'mechanic.rallyingBanner': 'Rallying Banner',
    'mechanic.tectonicHeave': 'Tectonic Heave',
    'mechanic.seismicStomp': 'Seismic Stomp',
    'mechanic.mountainhide': 'Mountainhide',
    'mechanic.thunderclap': 'Thunderclap',
    'mechanic.stormcall': 'Stormcall',
    'aura.spiderVenom': 'Spider Venom',
    'aura.skullthump': 'Skullthump',
    'aura.blindingPowder': 'Blinding Powder',
    'aura.witheringWail': 'Withering Wail',
    'aura.soulrot': 'Soulrot',
    'aura.mudfinHex': 'Mudfin Hex',
    'aura.miringPounce': 'Miring Pounce',
    'aura.acidSpit': 'Acid Spit',
    'aura.exposedWound': 'Exposed Wound',
    'aura.bogRot': 'Bog Rot',
    'aura.witheringRot': 'Withering Rot',
    'aura.curseOfFrailty': 'Curse of Frailty',
    'aura.weakeningHex': 'Weakening Hex',
    'aura.silencingShriek': 'Silencing Shriek',
    'aura.wailOfTheGrave': 'Wail of the Grave',
    'aura.graveBlight': 'Grave Blight',
    'aura.drainingLitany': 'Draining Litany',
    'aura.spiritSiphon': 'Spirit Siphon',
    'aura.dirgeOfTongues': 'Dirge of Tongues',
    'aura.profaneRune': 'Profane Rune',
    'aura.broodVenom': 'Brood Venom',
    'aura.rendingClaws': 'Rending Claws',
    'aura.smolderingFuse': 'Smoldering Fuse',
    'aura.cinderburn': 'Cinderburn',
    'aura.concussiveBlow': 'Concussive Blow',
    'aura.disarmingSmash': 'Disarming Smash',
    'aura.staticCharge': 'Static Charge',
    'aura.frostbite': 'Winterbite',
    'aura.maddeningWhisper': 'Maddening Whisper',
    'aura.wyrmwardSigil': 'Wyrmward Sigil',
    'aura.soulSiphon': 'Soul Siphon',
    'aura.forgottenWound': 'Forgotten Wound',
    'aura.searingMaw': 'Searing Maw',
    'aura.crackedGuard': 'Cracked Guard',
    'aura.offBalance': 'Off-Balance',
    'aura.numbingChill': 'Numbing Chill',
    'aura.webSnare': 'Web Snare',
    'aura.feedingFrenzy': 'Feeding Frenzy',
    'mechanic.litanyPulse': 'Litany Pulse',
    'mechanic.siltHide': 'Silt Hide',
    'aura.demoralized': 'Demoralized',
    'aura.resurrectionSickness': "The Keeper's Toll",
  },
  pt_BR: {
    'groundPickup.supplyCrateDeny': 'O caixote está fechado com pregos.',
    'groundPickup.gravecallerSigilDeny': 'O sigilo repele seu toque.',
    'groundPickup.ledgerPageDeny':
      'As páginas do livro-caixa estão encadernadas firme demais para serem arrancadas.',
    'groundPickup.morthenGrimoireDeny': 'O fecho do grimório está selado por magia.',
    'groundPickup.fenMusterOrderDeny':
      'O selo de cera resiste até que a ordem seja sua por direito.',
    'groundPickup.caravanGoodsDeny':
      'Você ainda não tem autorização para recolher essas mercadorias.',
    'groundPickup.rustedCenserDeny': 'O incensário está acorrentado no lugar.',
    'groundPickup.bastionWardStoneDeny': 'A pedra de guarda não cede um palmo.',
    'groundPickup.alienWeaponryDeny':
      'Os destroços do meteoro estão quentes demais para carregar sem que Aldric os espere.',
    'groundPickup.highwatchSummonsDeny': 'A convocação está selada com cera de Highwatch.',
    'groundPickup.ogreWarTotemDeny': 'O totem está fincado firme demais para ser arrancado.',
    'groundPickup.gravewyrmSigilDeny': 'Magia sombria mantém o sigilo cravado no chão.',
    'groundPickup.sanctumKeyShardDeny': 'O estilhaço está adormecido e preso no lugar.',
    'groundPickup.moongateRubbingDeny': 'Não cabe a você copiar a proteção até que o vigia a peça.',
    'groundPickup.graveSealedDeny':
      'O túmulo está selado contra os vivos até que os mortos chamem você a ele.',
    'groundPickup.cryptRitualCircleDeny': 'O círculo ritual jaz frio e adormecido.',
    'groundPickup.supplyCrateEnough': 'Você já tem caixotes de suprimentos suficientes.',
    'groundPickup.gravecallerSigilEnough': 'Você já carrega um Sigilo de Gravecaller.',
    'groundPickup.ledgerPageEnough': 'Você já tem páginas de livro-caixa suficientes.',
    'groundPickup.morthenGrimoireEnough': 'Você já tem o Grimório de Morthen.',
    'groundPickup.fenMusterOrderEnough': 'Você já tem a ordem de convocação de Fenbridge.',
    'groundPickup.caravanGoodsEnough': 'Você já tem mercadorias da caravana suficientes.',
    'groundPickup.rustedCenserEnough': 'Você já tem incensários enferrujados suficientes.',
    'groundPickup.bastionWardStoneEnough': 'Você já tem a pedra de guarda do Bastião.',
    'groundPickup.alienWeaponryEnough': 'Você já recuperou destroços alienígenas suficientes.',
    'groundPickup.highwatchSummonsEnough': 'Você já tem a convocação de Highwatch.',
    'groundPickup.ogreWarTotemEnough': 'Você já tem totens de guerra ogros suficientes.',
    'groundPickup.gravewyrmSigilEnough': 'Você já tem sigilos do Gravewyrm suficientes.',
    'groundPickup.sanctumKeyShardEnough':
      'Você já tem estilhaços da chave do santuário suficientes.',
    'groundPickup.moongateRubbingEnough': 'Você já tem o decalque protetor.',
    'groundPickup.graveAldrenEnough': 'Você já tomou o que o túmulo do capitão Aldren tem a dar.',
    'groundPickup.graveMalricEnough':
      'Você já tomou o que o túmulo do sumo sacerdote Malric tem a dar.',
    'groundPickup.graveVossEnough':
      'Você já tomou o que o túmulo do assassino real Voss tem a dar.',
    'groundPickup.cryptRitualCircleEnough': 'O círculo não tem mais nada a lhe dar.',
    'mechanic.finalBell': 'Sino Final',
    'mechanic.blackwaterMark': 'Marca da Água Negra',
    'mechanic.sumpStomp': 'Pisão do Sumidouro',
    'mechanic.bellShock': 'Choque do Sino',
    'mechanic.eggSacBurst': 'Estouro do Saco de Ovos',
    'mechanic.tollingBell': 'Dobre do Sino',
    'mechanic.howlingGale': 'Vendaval Uivante',
    'aura.drownedCanticle': 'Cântico Afogado',
    'log.learnedAbility': 'Você aprendeu uma nova habilidade: {name}.',
    'log.abilityRankUp': 'Sua habilidade {name} melhorou para o Grau {rank}.',
    'log.stopFollowing': 'Você parou de seguir.',
    'log.noOneToFollow': 'Não há ninguém para seguir.',
    'log.stopFollowingCombat': 'Você parou de seguir - você está em combate.',
    'log.tooFarToFollow': '{name} está longe demais para seguir.',
    'log.nowFollowing': 'Seguindo {name} agora.',
    'log.nhaliaTollsBells': '{name} faz soar os sinos!',
    'error.notFollowingAnyone': 'Você não está seguindo ninguém.',
    'error.cantFollowSelf': 'Você não pode seguir a si mesmo.',
    'error.cantFollowInCombat': 'Você não pode começar a seguir alguém durante o combate.',
    'error.targetToFollow': 'Selecione um jogador para seguir ou use /follow <nome>.',
    'presence.noLongerAfk': 'Você não está mais Ausente.',
    'presence.leftDnd': 'Você saiu do modo Não Perturbe.',
    'presence.nowAfk': 'Você agora está Ausente: {message}',
    'presence.nowDnd': 'Você agora está no modo Não Perturbe: {message}',
    'presence.noLongerAway': 'Você não está mais marcado como ausente.',
    'presence.afkDefault': 'Ausente',
    'presence.dndDefault': 'Não Perturbe',
    'log.channelJoined': 'Você entrou no canal {channel}. Digite /{channel} <mensagem> para falar.',
    'log.channelLeft': 'Você saiu do canal {channel}.',
    'error.channelUsage': 'Uso: /{action} <canal>. Canais: {list}.',
    'error.generalAlwaysOn': 'O canal Geral está sempre ativo - basta usar /general.',
    'error.noSuchChannel': "Não existe nenhum canal chamado '{name}'. Canais: {list}.",
    'error.alreadyInChannel': 'Você já está no canal {channel}.',
    'error.notInChannel': 'Você não está no canal {channel}.',
    'error.notInChannelJoin': 'Você não está no canal {channel}. Digite /join {channel} primeiro.',
    'log.bossUnleashes': '{name} desencadeia {mechanic}!',
    'log.mobChannels': '{name} canaliza {mechanic}.',
    'mechanic.warStomp': 'Pisão de Guerra',
    'mechanic.boneCarapace': 'Carapaça de Ossos',
    'mechanic.bansheesWail': 'Lamento da Banshee',
    'mechanic.crushingSweep': 'Golpe Esmagador',
    'mechanic.rallyingBanner': 'Estandarte de Conclamação',
    'mechanic.tectonicHeave': 'Impulso Tectônico',
    'mechanic.seismicStomp': 'Pisada Sísmica',
    'mechanic.mountainhide': 'Pele de Montanha',
    'mechanic.thunderclap': 'Estrondo Trovejante',
    'mechanic.stormcall': 'Chamado da Tempestade',
    'aura.spiderVenom': 'Peçonha de Aranha',
    'aura.skullthump': 'Pancada no Crânio',
    'aura.blindingPowder': 'Pó Cegante',
    'aura.witheringWail': 'Lamento Murchante',
    'aura.soulrot': 'Putrefação da Alma',
    'aura.mudfinHex': 'Feitiço dos Barbatana-de-lodo',
    'aura.miringPounce': 'Bote Atoleiro',
    'aura.acidSpit': 'Cuspe Ácido',
    'aura.exposedWound': 'Ferida Exposta',
    'aura.bogRot': 'Podridão do Pântano',
    'aura.witheringRot': 'Podridão Murchante',
    'aura.curseOfFrailty': 'Maldição da Fragilidade',
    'aura.weakeningHex': 'Feitiço Enfraquecedor',
    'aura.silencingShriek': 'Grito Silenciador',
    'aura.wailOfTheGrave': 'Lamento da Sepultura',
    'aura.graveBlight': 'Praga Sepulcral',
    'aura.drainingLitany': 'Litania Drenante',
    'aura.spiritSiphon': 'Sifão de Espírito',
    'aura.dirgeOfTongues': 'Réquiem das Línguas',
    'aura.profaneRune': 'Runa Profana',
    'aura.broodVenom': 'Peçonha da Ninhada',
    'aura.rendingClaws': 'Garras Dilacerantes',
    'aura.smolderingFuse': 'Pavio Fumegante',
    'aura.cinderburn': 'Brasa Ardente',
    'aura.concussiveBlow': 'Golpe Concussivo',
    'aura.disarmingSmash': 'Pancada Desarmante',
    'aura.staticCharge': 'Carga Estática',
    'aura.frostbite': 'Mordida Gélida',
    'aura.maddeningWhisper': 'Sussurro Enlouquecedor',
    'aura.wyrmwardSigil': 'Sigilo Anti-Wyrm',
    'aura.soulSiphon': 'Sifão de Alma',
    'aura.forgottenWound': 'Ferida Esquecida',
    'aura.searingMaw': 'Fauce Escaldante',
    'aura.crackedGuard': 'Guarda Quebrada',
    'aura.offBalance': 'Desequilibrado',
    'aura.numbingChill': 'Frio Entorpecente',
    'aura.webSnare': 'Armadilha de teia',
    'aura.feedingFrenzy': 'Frenesi voraz',
    'mechanic.litanyPulse': 'Pulso da ladainha',
    'mechanic.siltHide': 'Pele de lodo',
    'aura.demoralized': 'Desmoralizado',
    'aura.resurrectionSickness': 'Mal da Ressurreição',
    'error.lineOfSight': 'Sem linha de visão.',
    'error.bagsFull': 'Suas bolsas estão cheias.',
    'error.bagSocketsFull': 'Todos os seus espaços de bolsa estão ocupados.',
    'error.bagSwapTooManyItems': 'Você tem itens demais para trocar para essa bolsa.',
    'error.bagRemoveTooManyItems': 'Você tem itens demais para remover essa bolsa.',
    'error.tradeBagSpace': 'Troca falhou: espaço insuficiente nas bolsas.',
    'log.bagsMigrated': 'Seus pertences foram guardados em bolsas novas.',
    'error.specLevel': 'Você pode escolher uma especialização no nível {level}.',
    'error.equipLevel': 'Você precisa ser nível {level} para equipar isso.',
    'error.invalidBuild': 'Estrutura de talentos inválida.',
    'error.unknownSpec': 'Especialização desconhecida.',
    'error.maxLoadouts': 'Você pode salvar no máximo {count} conjuntos.',
    'error.noLoadout': 'Esse conjunto não existe.',
    'error.loadoutLevel': 'Esse conjunto exige um nível mais alto.',
    'error.cannotEquip': 'Você não pode equipar isso.',
    'error.faceWater': 'Você precisa estar de frente para água com peixes.',
    'error.potionNotReady': 'Essa poção ainda não está pronta.',
    'error.fullHealth': 'Você já está com a vida cheia.',
    'error.nothingRestore': 'Nada a restaurar.',
    'error.merchantUnavailable': 'Esse comerciante não está disponível.',
    'error.notForSale': 'Esse item não está à venda.',
    'error.noMerchant': 'Não há nenhum comerciante por perto.',
    'error.noSellQuest': 'Você não pode vender itens de missão.',
    'error.noBuyback': 'Esse item não está disponível para recompra.',
    'error.nailedShut': 'Está pregado e não abre.',
    'error.enoughOfThose': 'Você já tem o bastante desses.',
    'error.whoOnline': 'A lista do /who está disponível no jogo online.',
    'error.alreadyInParty': 'Você já está em um grupo.',
    'error.notPartyLeader': 'Você não é o líder do grupo.',
    'error.raidMarkersParty': 'Você precisa estar em um grupo para usar marcadores de raide.',
    'error.nameSellQty': 'Diga quantos você deseja vender.',
    'error.talentsInCombat': 'Você não pode mudar talentos em combate.',
    'error.talentsArena': 'Você não pode mudar talentos durante uma luta de arena.',
    'error.noItem': 'Você não tem esse item.',
    'error.cantWhileDead': 'Você não pode fazer isso enquanto está morto.',
    'error.cantWhileSwimming': 'Você não pode fazer isso enquanto está nadando.',
    'error.tameThat': 'Você não pode domar isso.',
    'error.tameBeastsOnly': 'Somente feras podem ser domadas.',
    'error.tameTooStrong': 'Essa fera é forte demais para domar.',
    'error.tameTooHigh': 'Essa fera é de nível alto demais para você domar.',
    'error.tameDungeon': 'Você não pode domar criaturas de masmorra.',
    'error.alreadyHavePet': 'Você já tem um ajudante.',
    'error.noLootPermission': 'Você não tem permissão para saquear isso.',
    'error.corpseAlreadyHarvested': 'Este cadáver já foi coletado.',
    'error.corpseNothingToHarvest': 'Esse cadáver não tem nada para coletar.',
    'error.gatherNodeMissing': 'Esse ponto de recursos não existe.',
    'error.gatherNodeNotRespawned': 'Este ponto de recursos ainda não ressurgiu para você.',
    'log.talentsUpdated': 'Talentos atualizados.',
    'log.talentsReset': 'Talentos redefinidos.',
    'log.savedBuild': 'Estrutura “{name}” salva.',
    'log.loadoutApplied': 'Conjunto “{name}” aplicado.',
    'log.deletedBuild': 'Estrutura “{name}” excluída.',
    'log.dismissPet': 'Você dispensa {name}.',
    'log.summonDemon': 'Você invoca {name}.',
    'log.tamedPet': '{name} agora é seu companheiro leal.',
    'log.entityDies': '{name} morre.',
    'log.prestiged': 'Você ganhou prestígio! Posto de Prestígio {rank}.',
    'log.enraged': '{name} fica enfurecido!',
    'log.callsForAid': '{name} pede ajuda!',
    'log.deathThroesArm': '{name} começa a inchar — afaste-se!',
    'log.deathThroesBurst': '{name} explode numa nuvem de {effect}!',
    'log.discarded': '{item} descartado.',
    'log.equipped': '{item} equipado.',
    'log.unequipped': '{item} desequipado.',
    'log.noFish': 'Os peixes não estão mordendo.',
    'log.rareCatch': 'Uma fisgada rara! Algo reluz na sua linha.',
    'log.sitEat': 'Você se senta para comer.',
    'log.sitDrink': 'Você se senta para beber.',
    'log.quaff': 'Você bebe {item}.',
    'log.boutDecided': 'O duelo foi decidido. Retornando ao mundo…',
    'log.partyLeaves': '{name} sai do grupo.',
    'log.partyLeft': '{name} saiu do grupo.',
    'log.partyRemoved': '{name} foi removido do grupo.',
    'loot.rollWin': '{winner} vence {item} ({roll})',
    'loot.marketSellerBought':
      '{buyer} comprou seu {item} por {price}; colete {proceeds} com o comerciante.',
    'aura.tamed': 'Domado',
    'aura.causticSpores': 'Esporos Cáusticos',
    'aura.elixirBear': 'Força do Urso',
  },
};

const PET_DICT_EN: Record<PetSimMessageKey, string> = {
  'error.noPet': 'You have no pet.',
  'error.petsNotAllowedInDelves': 'Pets are not allowed inside the delves.',
  'error.petAlreadyAlive': 'Your pet is already alive.',
  'error.permanentPetAbandonFrame': 'Permanent pets can only be abandoned from the pet frame.',
  'error.summonUnavailable': 'That summon is unavailable.',
  'error.huntersAbandonPets': 'Only hunters can abandon pets.',
  'error.petClassesRename': 'Only pet classes can rename pets.',
  'error.petNameInvalid':
    'Pet name must be 2-16 letters/spaces/hyphen/apostrophe and start with a letter.',
  'error.petClassesRevive': 'Only pet classes can revive pets.',
  'error.petClassesCommand': 'Only pet classes can command pets.',
  'error.noLivingPet': 'You have no living pet.',
  'error.petNeedsHostileTarget': 'Your pet needs a hostile target.',
  'error.petTauntNotReady': 'Pet taunt is not ready.',
  'petGrowl.ready': "Your pet's Growl is ready. {autoState}",
  'petGrowl.cooldown': "Your pet's Growl is on cooldown. {autoState} Ready in {seconds}s.",
  'petGrowl.autoOn': 'Auto-taunt is on.',
  'petGrowl.autoOff': 'Auto-taunt is off.',
  'error.huntersFeedPets': 'Only hunters can feed pets.',
  'error.petFoodOnly': 'Your pet can only eat food.',
  'error.petFullHealth': 'Your pet is already at full health.',
  'error.warlocksDemonHeal': 'Only warlocks can channel demon healing.',
  'error.youAreDead': 'You are dead.',
  'error.youAreStunned': 'You are stunned.',
  'error.noLivingDemon': 'You have no living demon.',
  'error.demonFullHealth': 'Your demon is already at full health.',
  'log.petFadesVoid': '{name} fades back into the void.',
  'log.petAnswersSummons': '{name} answers your summons.',
  'log.abandonPet': 'You abandon {name}.',
  'log.petRenamed': 'Your pet is now named {name}.',
  'log.petReturns': '{name} returns to your side.',
  'log.petRestoreLost': '{name} could not be restored and has been lost.',
  'log.petRestoreLostNoName': 'Your pet could not be restored and has been lost.',
  'log.feedPet': 'You feed {name}.',
  'log.demonHealChannel': 'You channel healing into {name}.',
  'log.petMode': '{name} is now {mode}.',
  'petMode.passive': 'passive',
  'petMode.defensive': 'defensive',
  'petMode.aggressive': 'aggressive',
  'aura.summoned': 'Summoned',
  'aura.fed': 'Fed',
};

const PET_DICT_PT: Record<PetSimMessageKey, string> = {
  'error.noPet': 'Você não tem mascote.',
  'error.petsNotAllowedInDelves': 'Mascotes não são permitidos dentro das incursões.',
  'error.petAlreadyAlive': 'Seu mascote já está vivo.',
  'error.permanentPetAbandonFrame':
    'Mascotes permanentes só podem ser abandonados pela moldura do mascote.',
  'error.summonUnavailable': 'Essa invocação não está disponível.',
  'error.huntersAbandonPets': 'Somente caçadores podem abandonar mascotes.',
  'error.petClassesRename': 'Somente classes com mascote podem renomear mascotes.',
  'error.petNameInvalid':
    'O nome do mascote deve ter 2-16 letras, espaços, hífens ou apóstrofos e começar com uma letra.',
  'error.petClassesRevive': 'Somente classes com mascote podem reviver mascotes.',
  'error.petClassesCommand': 'Somente classes com mascote podem comandar mascotes.',
  'error.noLivingPet': 'Você não tem um mascote vivo.',
  'error.petNeedsHostileTarget': 'Seu mascote precisa de um alvo hostil.',
  'error.petTauntNotReady': 'A provocação do mascote não está pronta.',
  'petGrowl.ready': 'O Rosnar do seu mascote está pronto. {autoState}',
  'petGrowl.cooldown': 'O Rosnar do seu mascote está em recarga. {autoState} Pronto em {seconds}s.',
  'petGrowl.autoOn': 'Provocação automática ativada.',
  'petGrowl.autoOff': 'Provocação automática desativada.',
  'error.huntersFeedPets': 'Somente caçadores podem alimentar mascotes.',
  'error.petFoodOnly': 'Seu mascote só pode comer comida.',
  'error.petFullHealth': 'Seu mascote já está com a vida cheia.',
  'error.warlocksDemonHeal': 'Somente bruxos podem canalizar cura demoníaca.',
  'error.youAreDead': 'Você está morto.',
  'error.youAreStunned': 'Você está atordoado.',
  'error.noLivingDemon': 'Você não tem um demônio vivo.',
  'error.demonFullHealth': 'Seu demônio já está com a vida cheia.',
  'log.petFadesVoid': '{name} desaparece de volta no vazio.',
  'log.petAnswersSummons': '{name} responde à sua invocação.',
  'log.abandonPet': 'Você abandona {name}.',
  'log.petRenamed': 'Seu mascote agora se chama {name}.',
  'log.petReturns': '{name} volta para o seu lado.',
  'log.petRestoreLost': '{name} não pôde ser restaurado e foi perdido.',
  'log.petRestoreLostNoName': 'Seu mascote não pôde ser restaurado e foi perdido.',
  'log.feedPet': 'Você alimenta {name}.',
  'log.demonHealChannel': 'Você canaliza cura em {name}.',
  'log.petMode': '{name} agora está no modo {mode}.',
  'petMode.passive': 'passivo',
  'petMode.defensive': 'defensivo',
  'petMode.aggressive': 'agressivo',
  'aura.summoned': 'Invocado',
  'aura.fed': 'Alimentado',
};

const PET_DICT: Record<SupportedLanguage, Record<PetSimMessageKey, string>> = {
  en: PET_DICT_EN,
  pt_BR: PET_DICT_PT,
};

export const DICT: Record<SupportedLanguage, Record<SimMessageKey, string>> = Object.fromEntries(
  supportedLanguages.map((lang) => [
    lang,
    { ...baseEnTable, ...BASE_DICT[lang], ...PET_DICT[lang] },
  ]),
) as Record<SupportedLanguage, Record<SimMessageKey, string>>;

function interpolate(template: string, params?: InterpolationValues): string {
  if (!params) return template;
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (m, name: string) => {
    const v = params[name];
    return v === undefined ? m : String(v);
  });
}

export function tSim(
  key: SimMessageKey,
  params?: InterpolationValues,
  lang: SupportedLanguage = getLanguage(),
): string {
  const table = DICT[lang] ?? DICT.en;
  const tmpl = table[key] ?? DICT.en[key];
  return interpolate(tmpl, params);
}

// Reverse maps: the sim splices English item/mob names into its text; localize them.
const itemNameToId = new Map<string, string>();
for (const [id, it] of Object.entries(ITEMS)) itemNameToId.set(it.name, id);
const mobNameToId = new Map<string, string>();
for (const [id, m] of Object.entries(MOBS)) mobNameToId.set(m.name, id);
const abilityNameToId = new Map<string, string>();
for (const [id, a] of Object.entries(ABILITIES)) abilityNameToId.set(a.name, id);
const delveNameToId = new Map<string, string>();
for (const [id, d] of Object.entries(DELVES)) delveNameToId.set(d.name, id);
// Module display names are also the delveUi.moduleName.* source values; reverse
// them so the sim's English module-name splices localize like the run tracker.
const delveModuleNameToId = new Map<string, string>();
for (const [id, name] of Object.entries(DELVE_MODULE_NAMES)) delveModuleNameToId.set(name, id);

function locItem(name: string): string {
  const id = itemNameToId.get(name);
  return id ? tEntity({ kind: 'item', id, field: 'name' }) : name;
}
function locMob(name: string): string {
  const id = mobNameToId.get(name);
  return id ? tEntity({ kind: 'mob', id, field: 'name' }) : name;
}
function locAbility(name: string): string {
  const id = abilityNameToId.get(name);
  return id ? tEntity({ kind: 'ability', id, field: 'name' }) : name;
}
function locDelve(name: string): string {
  const id = delveNameToId.get(name);
  return id ? tEntity({ kind: 'delve', id, field: 'name' }) : name;
}
function locDelveModule(name: string): string {
  const id = delveModuleNameToId.get(name);
  return id ? t(`delveUi.moduleName.${id}` as TranslationKey) : name;
}
function locItemStack(name: string, stackSuffix?: string): string {
  const item = locItem(name);
  if (!stackSuffix) return item;
  const count = Number(stackSuffix.trim().slice(1));
  return `${item} ${t('itemUi.bags.stackCount', { count: formatNumber(count, { maximumFractionDigits: 0 }) })}`;
}
function locPetMode(mode: string): string {
  const normalized = mode.toLowerCase();
  if (normalized === 'passive' || normalized === 'defensive' || normalized === 'aggressive') {
    return tSim(`petMode.${normalized}` as PetSimMessageKey);
  }
  return mode;
}
function locPetGrowlAutoState(state: string): string {
  if (state === 'Auto-taunt is on.') return tSim('petGrowl.autoOn');
  if (state === 'Auto-taunt is off.') return tSim('petGrowl.autoOff');
  return state;
}

// Flavor aura names (not abilities, not talents) shown in the buff frame / combat log.
// Includes mob "mechanic" names (War Stomp, etc.) - they surface both as a debuff on the
// player (stun/incapacitate/absorb aura) and as the boss "unleashes" combat-log line, so
// they share a single English source here.
const AURA_NAME_KEY: Record<string, SimMessageKey> = {
  Tamed: 'aura.tamed',
  'Might of the Bear': 'aura.elixirBear',
  Summoned: 'aura.summoned',
  Fed: 'aura.fed',
  'Caustic Spores': 'aura.causticSpores',
  // Boss / mob mechanics (the {mechanic} in "{mob} unleashes {mechanic}!").
  'Shuddering Stomp': 'mechanic.warStomp',
  'Bone Carapace': 'mechanic.boneCarapace',
  'Keening Wail': 'mechanic.bansheesWail',
  'Crushing Sweep': 'mechanic.crushingSweep',
  'Rallying Banner': 'mechanic.rallyingBanner',
  'Final Bell': 'mechanic.finalBell',
  'Blackwater Mark': 'mechanic.blackwaterMark',
  'Tolling Bell': 'mechanic.tollingBell',
  'Litany Pulse': 'mechanic.litanyPulse',
  'Silt Ward': 'mechanic.siltWard',
  'Silt Hide': 'mechanic.siltHide',
  'Sump Stomp': 'mechanic.sumpStomp',
  'Bell Shock': 'mechanic.bellShock',
  'Egg-Sac Burst': 'mechanic.eggSacBurst',
  'Drowned Canticle': 'aura.drownedCanticle',
  'Tectonic Heave': 'mechanic.tectonicHeave',
  'Seismic Stomp': 'mechanic.seismicStomp',
  Mountainhide: 'mechanic.mountainhide',
  Thunderclap: 'mechanic.thunderclap',
  Stormcall: 'mechanic.stormcall',
  'Howling Gale': 'mechanic.howlingGale',
  // On-hit / DoT / debuff flavor auras applied to players (would otherwise leak raw English
  // in the buff/debuff frame and combat log). Data-driven from src/sim/content/zone*.ts.
  'Spider Venom': 'aura.spiderVenom',
  Skullthump: 'aura.skullthump',
  'Blinding Powder': 'aura.blindingPowder',
  'Withering Wail': 'aura.witheringWail',
  Soulrot: 'aura.soulrot',
  'Mudfin Hex': 'aura.mudfinHex',
  'Miring Pounce': 'aura.miringPounce',
  'Acid Spit': 'aura.acidSpit',
  'Exposed Wound': 'aura.exposedWound',
  'Bog Rot': 'aura.bogRot',
  'Withering Rot': 'aura.witheringRot',
  'Curse of Frailty': 'aura.curseOfFrailty',
  'Weakening Hex': 'aura.weakeningHex',
  'Silencing Shriek': 'aura.silencingShriek',
  'Wail of the Grave': 'aura.wailOfTheGrave',
  'Grave Blight': 'aura.graveBlight',
  'Draining Litany': 'aura.drainingLitany',
  'Spirit Siphon': 'aura.spiritSiphon',
  'Dirge of Tongues': 'aura.dirgeOfTongues',
  'Profane Rune': 'aura.profaneRune',
  'Brood Venom': 'aura.broodVenom',
  'Rending Claws': 'aura.rendingClaws',
  'Smoldering Fuse': 'aura.smolderingFuse',
  Cinderburn: 'aura.cinderburn',
  'Concussive Blow': 'aura.concussiveBlow',
  'Disarming Smash': 'aura.disarmingSmash',
  'Static Charge': 'aura.staticCharge',
  Winterbite: 'aura.frostbite',
  'Maddening Whisper': 'aura.maddeningWhisper',
  'Wyrmward Sigil': 'aura.wyrmwardSigil',
  'Soul Siphon': 'aura.soulSiphon',
  'Forgotten Wound': 'aura.forgottenWound',
  'Searing Maw': 'aura.searingMaw',
  'Cracked Guard': 'aura.crackedGuard',
  'Off-Balance': 'aura.offBalance',
  'Numbing Chill': 'aura.numbingChill',
  'Web Snare': 'aura.webSnare',
  'Feeding Frenzy': 'aura.feedingFrenzy',
  Demoralized: 'aura.demoralized',
  'Resurrection Sickness': 'aura.resurrectionSickness',
};
export function localizeSimAuraName(name: string): string | null {
  const key = AURA_NAME_KEY[name];
  return key ? tSim(key) : null;
}

// A boss/mob "mechanic" name spliced into "{mob} unleashes {mechanic}!". Reuses the shared
// aura localizer (the mechanic names double as the debuff aura names), falling back to the
// raw English name for any mechanic not yet registered.
function locBossMechanic(name: string): string {
  return localizeSimAuraName(name) ?? name;
}

type ArenaExtraKey =
  | 'join2v2'
  | 'leave2v2'
  | 'teamLeave2v2'
  | 'alreadyQueuedOther'
  | 'leaveParty1v1'
  | 'partyLeaderQueue2v2'
  | 'premadeNeedsTwo'
  | 'partyMemberUnavailable'
  | 'memberDead'
  | 'memberInMatch'
  | 'memberQueued'
  | 'memberDueling'
  | 'memberTrading'
  | 'memberInstance';

export const ARENA_EXTRA: Record<SupportedLanguage, Record<ArenaExtraKey, string>> = {
  en: {
    join2v2: 'You join the Ashen Coliseum 2v2 queue. Stand by for opponents...',
    leave2v2: 'You leave the Ashen Coliseum 2v2 queue.',
    teamLeave2v2: 'Your team leaves the Ashen Coliseum 2v2 queue.',
    alreadyQueuedOther:
      'You are already in the {current} queue. Leave it before queueing for {next}.',
    leaveParty1v1: 'Leave your party before queueing for 1v1.',
    partyLeaderQueue2v2: 'Only the party leader may queue your team for 2v2.',
    premadeNeedsTwo: 'A 2v2 premade requires a party of exactly two.',
    partyMemberUnavailable: 'A party member is unavailable.',
    memberDead: '{name} cannot queue while dead.',
    memberInMatch: '{name} is already in an arena match.',
    memberQueued: '{name} is already in the arena queue.',
    memberDueling: '{name} cannot queue while dueling.',
    memberTrading: '{name} must finish trading before queueing.',
    memberInstance: '{name} cannot queue from inside an instance.',
  },
  pt_BR: {
    join2v2: 'Você entra na fila 2v2 do Coliseu Cinzento. Aguarde oponentes...',
    leave2v2: 'Você sai da fila 2v2 do Coliseu Cinzento.',
    teamLeave2v2: 'Sua equipe sai da fila 2v2 do Coliseu Cinzento.',
    alreadyQueuedOther: 'Você já está na fila {current}. Saia dela antes de entrar na fila {next}.',
    leaveParty1v1: 'Saia do grupo antes de entrar na fila 1v1.',
    partyLeaderQueue2v2: 'Só o líder do grupo pode colocar sua equipe na fila 2v2.',
    premadeNeedsTwo: 'Uma equipe premade 2v2 exige um grupo de exatamente dois.',
    partyMemberUnavailable: 'Um membro do grupo não está disponível.',
    memberDead: '{name} não pode entrar na fila morto.',
    memberInMatch: '{name} já está em uma luta de arena.',
    memberQueued: '{name} já está na fila de arena.',
    memberDueling: '{name} não pode entrar na fila enquanto duela.',
    memberTrading: '{name} precisa terminar a troca antes de entrar na fila.',
    memberInstance: '{name} não pode entrar na fila dentro de uma instância.',
  },
};

function tArenaExtra(key: ArenaExtraKey, params?: InterpolationValues): string {
  const table = ARENA_EXTRA[getLanguage()] ?? ARENA_EXTRA.en;
  return interpolate(table[key] ?? ARENA_EXTRA.en[key], params);
}

type QuestExtraKey =
  | 'ritualNeedsKey'
  | 'aldrenVision1'
  | 'aldrenVision2'
  | 'aldrenVision3'
  | 'malricVision1'
  | 'malricVision2'
  | 'malricVision3'
  | 'vossVision1'
  | 'vossVision2'
  | 'vossVision3'
  | 'vossVision4'
  | 'ritualBreaks'
  | 'cryptSealed'
  | 'awakens'
  | 'aldrenYell'
  | 'malricYell'
  | 'vossYell';

export const QUEST_EXTRA: Record<SupportedLanguage, Record<QuestExtraKey, string>> = {
  en: {
    ritualNeedsKey: 'The ritual circle is silent without the Crypt Keystone.',
    aldrenVision1: 'My king was a good man.',
    aldrenVision2: 'I swore my blade to him.',
    aldrenVision3: 'I would do so again.',
    malricVision1: 'There had to be another way.',
    malricVision2: 'I could not let him die.',
    malricVision3: 'I only wanted to save him.',
    vossVision1: 'The king was already dead.',
    vossVision2: 'Malric refused to accept it.',
    vossVision3: 'We should have let him rest.',
    vossVision4: 'If you find the crypt... end this.',
    ritualBreaks: 'The Crypt Keystone turns cold as the seal breaks.',
    cryptSealed: 'The crypt entrance is sealed to you.',
    awakens: '{name} awakens!',
    aldrenYell: '{name} yells, "None shall disturb the king\'s rest! For Thornpeak!"',
    malricYell: '{name} yells, "Death shall never claim my king! The ritual must endure!"',
    vossYell: '{name} yells, "You will not reach him! The king must endure!"',
  },
  pt_BR: {
    ritualNeedsKey: 'O círculo ritual fica em silêncio sem a Pedra-chave da cripta.',
    aldrenVision1: 'Meu rei era um bom homem.',
    aldrenVision2: 'Jurei minha lâmina a ele.',
    aldrenVision3: 'Eu faria isso novamente.',
    malricVision1: 'Tinha que haver outro caminho.',
    malricVision2: 'Eu não podia deixá-lo morrer.',
    malricVision3: 'Eu só queria salvá-lo.',
    vossVision1: 'O rei já estava morto.',
    vossVision2: 'Malric se recusou a aceitar.',
    vossVision3: 'Deveríamos tê-lo deixado descansar.',
    vossVision4: 'Se encontrar a cripta... termine isto.',
    ritualBreaks: 'A Pedra-chave da cripta fica fria enquanto o selo se rompe.',
    cryptSealed: 'A entrada da cripta está selada para você.',
    awakens: '{name} desperta!',
    aldrenYell: '{name} grita: "Ninguém perturbará o descanso do rei! Por Thornpeak!"',
    malricYell: '{name} grita: "A morte jamais levará meu rei! O ritual deve perdurar!"',
    vossYell: '{name} grita: "Você não chegará até ele! O rei deve perdurar!"',
  },
};

function tQuestExtra(key: QuestExtraKey, params?: InterpolationValues): string {
  const table = QUEST_EXTRA[getLanguage()] ?? QUEST_EXTRA.en;
  return interpolate(table[key] ?? QUEST_EXTRA.en[key], params);
}

// Item / equipment / world-object interaction strings emitted by src/sim: the
// /gear self-readout frame plus the relic + quest-item pickup error toasts. Like
// QUEST_EXTRA/ARENA_EXTRA these live here (not the DICT) and are matched by the
// RULES below; the gear readout's per-slot LABELS reuse the already-translated
// itemUi.slots.* keys via t(), so only the frame + "(empty)" marker are new here.
type ItemExtraKey =
  | 'gearReadout'
  | 'gearEmptySlot'
  | 'nothingEquipped'
  | 'cannotTakeYet'
  | 'offersNothingMore'
  | 'relicBound'
  | 'relicRecovered';

export const ITEM_EXTRA: Record<SupportedLanguage, Record<ItemExtraKey, string>> = {
  en: {
    gearReadout: 'Equipped ({worn}/{total}): {items}.',
    gearEmptySlot: '(empty)',
    nothingEquipped: 'You have nothing equipped.',
    cannotTakeYet: 'You cannot take the {name} yet.',
    offersNothingMore: '{name} offers nothing more.',
    relicBound: 'The relic is bound by the sealed crypt.',
    relicRecovered: 'You have already recovered this relic.',
  },
  pt_BR: {
    gearReadout: 'Equipado ({worn}/{total}): {items}.',
    gearEmptySlot: '(vazio)',
    nothingEquipped: 'Você não tem nada equipado.',
    cannotTakeYet: 'Você ainda não pode pegar {name}.',
    offersNothingMore: '{name} não oferece mais nada.',
    relicBound: 'A relíquia está presa à cripta selada.',
    relicRecovered: 'Você já recuperou esta relíquia.',
  },
};

function tItemExtra(key: ItemExtraKey, params?: InterpolationValues): string {
  const table = ITEM_EXTRA[getLanguage()] ?? ITEM_EXTRA.en;
  return interpolate(table[key] ?? ITEM_EXTRA.en[key], params);
}

type RaidExtraKey =
  | 'converted'
  | 'memberMoved'
  | 'needFullParty'
  | 'leaderConvert'
  | 'alreadyRaid'
  | 'notInRaid'
  | 'leaderAdjust'
  | 'groupFull'
  | 'yourRaidFull'
  | 'thatRaidFull'
  | 'noDuelArena'
  | 'noStandardDungeons'
  | 'mustConvert'
  | 'royalDoorSealed'
  | 'locked'
  | 'engagedSealed'
  | 'mustFall';

export const RAID_EXTRA: Record<SupportedLanguage, Record<RaidExtraKey, string>> = {
  en: {
    converted: 'Your party has converted to a raid group.',
    memberMoved: '{name} has been moved to raid group {group}.',
    needFullParty: 'You need a full party of five before converting to raid.',
    leaderConvert: 'Only the party leader may convert to raid.',
    alreadyRaid: 'Your group is already a raid.',
    notInRaid: 'You are not in a raid group.',
    leaderAdjust: 'Only the raid leader may adjust groups.',
    groupFull: 'Raid group {group} is full.',
    yourRaidFull: 'Your raid is full.',
    thatRaidFull: 'That raid is full.',
    noDuelArena: 'You cannot duel in Nythraxis Raid Arena.',
    noStandardDungeons: 'Raid groups cannot enter standard dungeons.',
    mustConvert: 'You must convert your party to a raid group first.',
    royalDoorSealed: 'The royal door is sealed to you.',
    locked: 'You are locked to Nythraxis Raid Arena.',
    engagedSealed: 'Nythraxis is engaged - the royal door has sealed shut.',
    mustFall: 'The royal door is sealed - Nythraxis must fall first.',
  },
  pt_BR: {
    converted: 'Seu grupo foi convertido em raide.',
    memberMoved: '{name} foi movido para o grupo de raide {group}.',
    needFullParty: 'Voce precisa de um grupo completo de cinco antes de converter para raide.',
    leaderConvert: 'Apenas o lider do grupo pode converter para raide.',
    alreadyRaid: 'Seu grupo ja e um raide.',
    notInRaid: 'Voce nao esta em um grupo de raide.',
    leaderAdjust: 'Apenas o lider de raide pode ajustar os grupos.',
    groupFull: 'O grupo de raide {group} esta cheio.',
    yourRaidFull: 'Seu raide esta cheio.',
    thatRaidFull: 'Esse raide esta cheio.',
    noDuelArena: 'Voce nao pode duelar na Arena de Raide de Nythraxis.',
    noStandardDungeons: 'Grupos de raide nao podem entrar em masmorras comuns.',
    mustConvert: 'Voce deve converter seu grupo em raide primeiro.',
    royalDoorSealed: 'A porta real esta selada para voce.',
    locked: 'Voce esta salvo na Arena de Raide de Nythraxis.',
    engagedSealed: 'Nythraxis esta em combate; a porta real se selou.',
    mustFall: 'A porta real esta selada; Nythraxis deve cair primeiro.',
  },
};

function tRaidExtra(key: RaidExtraKey, params?: InterpolationValues): string {
  const table = RAID_EXTRA[getLanguage()] ?? RAID_EXTRA.en;
  return interpolate(table[key] ?? RAID_EXTRA.en[key], params);
}

// The /gear readout's English slot labels -> the already-translated itemUi.slots.*
// keys the character-window paperdoll renders. Keep in sync with gearReadout() in
// src/sim/sim.ts (the slot order/labels it emits).
const GEAR_SLOT_KEYS: Record<string, TranslationKey> = {
  'Main Hand': 'itemUi.slots.mainhand',
  Helmet: 'itemUi.slots.helmet',
  Shoulder: 'itemUi.slots.shoulder',
  Chest: 'itemUi.slots.chest',
  Waist: 'itemUi.slots.waist',
  Legs: 'itemUi.slots.legs',
  Gloves: 'itemUi.slots.gloves',
  Feet: 'itemUi.slots.feet',
};

// Rebuild the /gear readout in the active locale: localize each "Slot: value"
// segment (slot label via itemUi.slots.*, item name via the entity dict, the
// "(empty)" marker via ITEM_EXTRA) then re-frame via the gearReadout template.
function locGearReadout(worn: string, total: string, body: string): string {
  const items = body
    .split(', ')
    .map((seg) => {
      const sep = seg.indexOf(': ');
      if (sep < 0) return seg;
      const label = seg.slice(0, sep);
      const value = seg.slice(sep + 2);
      const slotKey = GEAR_SLOT_KEYS[label];
      const locLabel = slotKey ? t(slotKey) : label;
      const locValue = value === '(empty)' ? tItemExtra('gearEmptySlot') : locItem(value);
      return `${locLabel}: ${locValue}`;
    })
    .join(', ');
  return tItemExtra('gearReadout', { worn, total, items });
}

// EXACT (no-placeholder) sim messages: English -> key (auto-built; throws on collision).
const EXACT: Record<string, SimMessageKey> = {};
for (const key of Object.keys(enTable) as SimMessageKey[]) {
  const v = enTable[key];
  if (
    v.includes('{') ||
    key.startsWith('aura.') ||
    key.startsWith('petMode.') ||
    key.startsWith('mechanic.')
  )
    continue;
  if (EXACT[v] !== undefined)
    throw new Error(
      `sim_i18n: duplicate exact English message "${v}" (keys ${EXACT[v]} and ${key})`,
    );
  EXACT[v] = key;
}

// /talents readout (src/sim/sim.ts talentsReadout): the sim assembles an English
// summary; rebuild it here from t() keys. Spec names splice verbatim (English
// content names) like player/build names. The breakdown sub-grammar is "Class N"
// or "Class N, <spec> M"; the optional tail is " N unspent.".
function locTalentBreakdown(s: string): string {
  let m = /^Class (.+), (.+) (.+)$/.exec(s);
  if (m)
    return t('game.talents.readout.breakdownSpec', { classPts: m[1], spec: m[2], specPts: m[3] });
  m = /^Class (.+)$/.exec(s);
  if (m) return t('game.talents.readout.breakdownClass', { classPts: m[1] });
  return s;
}
function locTalentTail(s: string): string {
  const m = /^ (.+) unspent\.$/.exec(s);
  return m ? t('game.talents.readout.unspent', { count: m[1] }) : s;
}

type Rule = { re: RegExp; build: (m: RegExpExecArray) => string };
const RULES: Rule[] = [
  { re: /^Your class has no talent tree yet\.$/, build: () => t('game.talents.readout.noTree') },
  {
    re: /^You have not unlocked talents yet — they begin at level (.+)\.$/,
    build: (m) => t('game.talents.readout.locked', { level: m[1] }),
  },
  {
    re: /^Talents: (.+) — (.+)\/(.+) points spent \((.+)\)\.(.*)$/,
    build: (m) =>
      t('game.talents.readout.summary', {
        head: m[1] === 'no specialization' ? t('game.talents.readout.noSpec') : m[1],
        spent: m[2],
        total: m[3],
        breakdown: locTalentBreakdown(m[4]),
      }) + (m[5] ? locTalentTail(m[5]) : ''),
  },
  {
    re: /^The ritual circle is silent without the Crypt Keystone\.$/,
    build: () => tQuestExtra('ritualNeedsKey'),
  },
  { re: /^My king was a good man\.$/, build: () => tQuestExtra('aldrenVision1') },
  { re: /^I swore my blade to him\.$/, build: () => tQuestExtra('aldrenVision2') },
  { re: /^I would do so again\.$/, build: () => tQuestExtra('aldrenVision3') },
  { re: /^There had to be another way\.$/, build: () => tQuestExtra('malricVision1') },
  { re: /^I could not let him die\.$/, build: () => tQuestExtra('malricVision2') },
  { re: /^I only wanted to save him\.$/, build: () => tQuestExtra('malricVision3') },
  { re: /^The king was already dead\.$/, build: () => tQuestExtra('vossVision1') },
  { re: /^Malric refused to accept it\.$/, build: () => tQuestExtra('vossVision2') },
  { re: /^We should have let him rest\.$/, build: () => tQuestExtra('vossVision3') },
  { re: /^If you find the crypt\.\.\. end this\.$/, build: () => tQuestExtra('vossVision4') },
  {
    re: /^The Crypt Keystone turns cold as the seal breaks\.$/,
    build: () => tQuestExtra('ritualBreaks'),
  },
  { re: /^The crypt entrance is sealed to you\.$/, build: () => tQuestExtra('cryptSealed') },
  {
    re: /^That item cannot be listed on the World Market\.$/,
    build: () => t('itemUi.tooltip.cannotMarket'),
  },
  { re: /^(.+) awakens!$/, build: (m) => tQuestExtra('awakens', { name: locMob(m[1]) }) },
  {
    re: /^(.+) rises over Thornpeak Heights!$/,
    build: (m) => t('hudChrome.worldBoss.spawn', { name: locMob(m[1]) }),
  },
  {
    re: /^Fallen Captain Aldren yells, "None shall disturb the king's rest! For Thornpeak!"$/,
    build: () => tQuestExtra('aldrenYell', { name: locMob('Fallen Captain Aldren') }),
  },
  {
    re: /^Corrupted Priest Malric yells, "Death shall never claim my king! The ritual must endure!"$/,
    build: () => tQuestExtra('malricYell', { name: locMob('Corrupted Priest Malric') }),
  },
  {
    re: /^Deathstalker Voss yells, "You will not reach him! The king must endure!"$/,
    build: () => tQuestExtra('vossYell', { name: locMob('Deathstalker Voss') }),
  },
  {
    re: /^You may choose a specialization at level (\d+)\.$/,
    build: (m) => tSim('error.specLevel', { level: m[1] }),
  },
  {
    re: /^You must be level (\d+) to equip that\.$/,
    build: (m) => tSim('error.equipLevel', { level: m[1] }),
  },
  {
    re: /^You can save at most (\d+) loadouts\.$/,
    build: (m) => tSim('error.maxLoadouts', { count: m[1] }),
  },
  { re: /^Saved build "(.+)"\.$/, build: (m) => tSim('log.savedBuild', { name: m[1] }) },
  { re: /^Loadout "(.+)" applied\.$/, build: (m) => tSim('log.loadoutApplied', { name: m[1] }) },
  { re: /^Deleted build "(.+)"\.$/, build: (m) => tSim('log.deletedBuild', { name: m[1] }) },
  { re: /^You dismiss (.+)\.$/, build: (m) => tSim('log.dismissPet', { name: locMob(m[1]) }) },
  { re: /^You summon (.+)\.$/, build: (m) => tSim('log.summonDemon', { name: locMob(m[1]) }) },
  {
    re: /^(.+) fades back into the void\.$/,
    build: (m) => tSim('log.petFadesVoid', { name: locMob(m[1]) }),
  },
  {
    re: /^(.+) answers your summons\.$/,
    build: (m) => tSim('log.petAnswersSummons', { name: locMob(m[1]) }),
  },
  {
    re: /^Your pet's Growl is ready\. (Auto-taunt is (?:on|off)\.)$/,
    build: (m) => tSim('petGrowl.ready', { autoState: locPetGrowlAutoState(m[1]) }),
  },
  {
    re: /^Your pet's Growl is on cooldown\. (Auto-taunt is (?:on|off)\.) Ready in (\d+)s\.$/,
    build: (m) =>
      tSim('petGrowl.cooldown', {
        autoState: locPetGrowlAutoState(m[1]),
        seconds: formatNumber(Number(m[2]), { maximumFractionDigits: 0, useGrouping: false }),
      }),
  },
  { re: /^You abandon (.+)\.$/, build: (m) => tSim('log.abandonPet', { name: locMob(m[1]) }) },
  { re: /^Your pet is now named (.+)\.$/, build: (m) => tSim('log.petRenamed', { name: m[1] }) },
  {
    re: /^(.+) returns to your side\.$/,
    build: (m) => tSim('log.petReturns', { name: locMob(m[1]) }),
  },
  {
    re: /^(.+) could not be restored and has been lost\.$/,
    build: (m) => tSim('log.petRestoreLost', { name: locMob(m[1]) }),
  },
  { re: /^You feed (.+)\.$/, build: (m) => tSim('log.feedPet', { name: locMob(m[1]) }) },
  {
    re: /^You channel healing into (.+)\.$/,
    build: (m) => tSim('log.demonHealChannel', { name: locMob(m[1]) }),
  },
  {
    re: /^(.+) is now your loyal companion\.$/,
    build: (m) => tSim('log.tamedPet', { name: locMob(m[1]) }),
  },
  {
    re: /^(.+) is now (.+)\.$/,
    build: (m) => tSim('log.petMode', { name: locMob(m[1]), mode: locPetMode(m[2]) }),
  },
  { re: /^(.+) dies\.$/, build: (m) => tSim('log.entityDies', { name: locMob(m[1]) }) },
  {
    re: /^You have prestiged! Prestige Rank (\d+)\.$/,
    build: (m) => tSim('log.prestiged', { rank: m[1] }),
  },
  { re: /^(.+) becomes enraged!$/, build: (m) => tSim('log.enraged', { name: locMob(m[1]) }) },
  { re: /^(.+) calls for aid!$/, build: (m) => tSim('log.callsForAid', { name: locMob(m[1]) }) },
  {
    re: /^(.+) begins to swell — get clear!$/,
    build: (m) => tSim('log.deathThroesArm', { name: locMob(m[1]) }),
  },
  {
    re: /^(.+) bursts in a cloud of (.+)!$/,
    build: (m) =>
      tSim('log.deathThroesBurst', {
        name: locMob(m[1]),
        effect: localizeSimAuraName(m[2]) ?? m[2],
      }),
  },
  {
    re: /^Discarded (.+?)( x\d+)?\.$/,
    build: (m) => tSim('log.discarded', { item: locItemStack(m[1], m[2]) }),
  },
  // /gear self-readout (must precede the single-item Equipped rule below, which is
  // anchored with (?!\() so it can never swallow this compound readout).
  { re: /^Equipped \(([^/]+)\/([^)]+)\): (.+)\.$/, build: (m) => locGearReadout(m[1], m[2], m[3]) },
  { re: /^You have nothing equipped\.$/, build: () => tItemExtra('nothingEquipped') },
  // Quest-item + relic pickup error toasts (src/sim emits these as `?? 'English'`
  // fallbacks, so the S3 drift guard's this.error regex cannot see them — covered
  // explicitly by tests/sim_item_i18n.test.ts instead).
  {
    re: /^You cannot take the (.+) yet\.$/,
    build: (m) => tItemExtra('cannotTakeYet', { name: locItem(m[1]) }),
  },
  {
    re: /^(.+) offers nothing more\.$/,
    build: (m) => tItemExtra('offersNothingMore', { name: locItem(m[1]) }),
  },
  { re: /^The relic is bound by the sealed crypt\.$/, build: () => tItemExtra('relicBound') },
  { re: /^You have already recovered this relic\.$/, build: () => tItemExtra('relicRecovered') },
  { re: /^Equipped (?!\()(.+)\.$/, build: (m) => tSim('log.equipped', { item: locItem(m[1]) }) },
  { re: /^Unequipped (.+)\.$/, build: (m) => tSim('log.unequipped', { item: locItem(m[1]) }) },
  { re: /^You quaff (.+)\.$/, build: (m) => tSim('log.quaff', { item: locItem(m[1]) }) },
  {
    re: /^(.+) wins (.+) \((\d+)\)$/,
    build: (m) => tSim('loot.rollWin', { winner: m[1], item: m[2], roll: m[3] }),
  },
  {
    re: /^(.+) bought your (.+) for (.+) [—-] collect (.+) from the Merchant\.$/,
    build: (m) =>
      tSim('loot.marketSellerBought', {
        buyer: m[1],
        item: locItem(m[2]),
        price: m[3],
        proceeds: m[4],
      }),
  },
  // Ability learned / rank-up. {name} is an ability name (localized via the entity dict).
  {
    re: /^You have learned a new ability: (.+)\.$/,
    build: (m) => tSim('log.learnedAbility', { name: locAbility(m[1]) }),
  },
  {
    re: /^Your (.+) has improved to Rank (\d+)\.$/,
    build: (m) => tSim('log.abilityRankUp', { name: locAbility(m[1]), rank: m[2] }),
  },
  // /follow family. {name} is another player (a mob name only if it happens to collide).
  {
    re: /^(.+) is too far away to follow\.$/,
    build: (m) => tSim('log.tooFarToFollow', { name: locMob(m[1]) }),
  },
  { re: /^Now following (.+)\.$/, build: (m) => tSim('log.nowFollowing', { name: locMob(m[1]) }) },
  // AFK / DND presence. The {message} is custom text OR the default presence label; the
  // default labels are themselves keys, custom text splices through verbatim.
  {
    re: /^You are now Away From Keyboard: (.+)$/,
    build: (m) =>
      tSim('presence.nowAfk', {
        message: m[1] === 'Away From Keyboard' ? tSim('presence.afkDefault') : m[1],
      }),
  },
  {
    re: /^You are now in Do Not Disturb mode: (.+)$/,
    build: (m) =>
      tSim('presence.nowDnd', {
        message: m[1] === 'Do Not Disturb' ? tSim('presence.dndDefault') : m[1],
      }),
  },
  // Chat channel join/leave + /join /leave /channel readouts. The channel/action tokens
  // are command identifiers (world, lfg, join, ...) and splice through verbatim.
  {
    re: /^Joined the (.+) channel\. Type \/(.+) <message> to talk\.$/,
    build: (m) => tSim('log.channelJoined', { channel: m[1] }),
  },
  { re: /^Left the (.+) channel\.$/, build: (m) => tSim('log.channelLeft', { channel: m[1] }) },
  {
    re: /^Usage: \/(.+) <channel>\. Channels: (.+)\.$/,
    build: (m) => tSim('error.channelUsage', { action: m[1], list: m[2] }),
  },
  {
    re: /^There is no channel named '(.+)'\. Channels: (.+)\.$/,
    build: (m) => tSim('error.noSuchChannel', { name: m[1], list: m[2] }),
  },
  {
    re: /^You are not in the (.+) channel\. Type \/join (.+) first\.$/,
    build: (m) => tSim('error.notInChannelJoin', { channel: m[1] }),
  },
  {
    re: /^You are already in the (.+) channel\.$/,
    build: (m) => tSim('error.alreadyInChannel', { channel: m[1] }),
  },
  {
    re: /^You are not in the (.+) channel\.$/,
    build: (m) => tSim('error.notInChannel', { channel: m[1] }),
  },
  { re: /^(.+) leaves the party\.$/, build: (m) => tSim('log.partyLeaves', { name: m[1] }) },
  { re: /^(.+) has left the party\.$/, build: (m) => tSim('log.partyLeft', { name: m[1] }) },
  {
    re: /^(.+) has been removed from the party\.$/,
    build: (m) => tSim('log.partyRemoved', { name: m[1] }),
  },
  { re: /^Your party has converted to a raid group\.$/, build: () => tRaidExtra('converted') },
  {
    re: /^(.+) has been moved to raid group (.+)\.$/,
    build: (m) => tRaidExtra('memberMoved', { name: m[1], group: m[2] }),
  },
  {
    re: /^You need a full party of five before converting to raid\.$/,
    build: () => tRaidExtra('needFullParty'),
  },
  { re: /^Only the party leader may convert to raid\.$/, build: () => tRaidExtra('leaderConvert') },
  { re: /^Your group is already a raid\.$/, build: () => tRaidExtra('alreadyRaid') },
  { re: /^You are not in a raid group\.$/, build: () => tRaidExtra('notInRaid') },
  { re: /^Only the raid leader may adjust groups\.$/, build: () => tRaidExtra('leaderAdjust') },
  {
    re: /^Your raid has converted back to a party\.$/,
    build: () => t('hudChrome.raidConvert.toPartyDone'),
  },
  { re: /^Your group is not a raid\.$/, build: () => t('hudChrome.raidConvert.notRaid') },
  {
    re: /^Only the raid leader may convert to a party\.$/,
    build: () => t('hudChrome.raidConvert.leaderOnly'),
  },
  {
    re: /^A raid with more than five members cannot convert back to a party\.$/,
    build: () => t('hudChrome.raidConvert.tooLarge'),
  },
  { re: /^Raid group (.+) is full\.$/, build: (m) => tRaidExtra('groupFull', { group: m[1] }) },
  { re: /^Your raid is full\.$/, build: () => tRaidExtra('yourRaidFull') },
  { re: /^That raid is full\.$/, build: () => tRaidExtra('thatRaidFull') },
  { re: /^You cannot duel in Nythraxis Raid Arena\.$/, build: () => tRaidExtra('noDuelArena') },
  {
    re: /^Raid groups cannot enter standard dungeons\.$/,
    build: () => tRaidExtra('noStandardDungeons'),
  },
  {
    re: /^You must convert your party to a raid group first\.$/,
    build: () => tRaidExtra('mustConvert'),
  },
  { re: /^The royal door is sealed to you\.$/, build: () => tRaidExtra('royalDoorSealed') },
  { re: /^You are locked to Nythraxis Raid Arena\.$/, build: () => tRaidExtra('locked') },
  {
    re: /^Nythraxis is engaged — the royal door has sealed shut\.$/,
    build: () => tRaidExtra('engagedSealed'),
  },
  {
    re: /^The royal door is sealed — Nythraxis must fall first\.$/,
    build: () => tRaidExtra('mustFall'),
  },
  {
    re: /^You join the Ashen Coliseum 2v2 queue\. Stand by for opponents[.…]{1,3}$/,
    build: () => tArenaExtra('join2v2'),
  },
  { re: /^You leave the Ashen Coliseum 2v2 queue\.$/, build: () => tArenaExtra('leave2v2') },
  {
    re: /^Your team leaves the Ashen Coliseum 2v2 queue\.$/,
    build: () => tArenaExtra('teamLeave2v2'),
  },
  {
    re: /^You are already in the (.+) queue\. Leave it before queueing for (.+)\.$/,
    build: (m) => tArenaExtra('alreadyQueuedOther', { current: m[1], next: m[2] }),
  },
  { re: /^Leave your party before queueing for 1v1\.$/, build: () => tArenaExtra('leaveParty1v1') },
  {
    re: /^Only the party leader may queue your team for 2v2\.$/,
    build: () => tArenaExtra('partyLeaderQueue2v2'),
  },
  {
    re: /^2v2 premade requires a party of exactly two\.$/,
    build: () => tArenaExtra('premadeNeedsTwo'),
  },
  { re: /^A party member is unavailable\.$/, build: () => tArenaExtra('partyMemberUnavailable') },
  {
    re: /^(.+) cannot queue while dead\.$/,
    build: (m) => tArenaExtra('memberDead', { name: m[1] }),
  },
  {
    re: /^(.+) is already in an arena match\.$/,
    build: (m) => tArenaExtra('memberInMatch', { name: m[1] }),
  },
  {
    re: /^(.+) is already in the arena queue\.$/,
    build: (m) => tArenaExtra('memberQueued', { name: m[1] }),
  },
  {
    re: /^(.+) cannot queue while dueling\.$/,
    build: (m) => tArenaExtra('memberDueling', { name: m[1] }),
  },
  {
    re: /^(.+) must finish trading before queueing\.$/,
    build: (m) => tArenaExtra('memberTrading', { name: m[1] }),
  },
  {
    re: /^(.+) cannot queue from inside an instance\.$/,
    build: (m) => tArenaExtra('memberInstance', { name: m[1] }),
  },
  // Delve / lockpicking sim text. Re-localized through t() against the sim.delve.* /
  // sim.lockpick.* keys (src/ui/i18n.catalog/index.ts). The module-enter banner is two
  // rules anchored on the fixed objective lines ("X: Clear the room." / "X: Defeat the
  // boss."), each localizing the captured module name, so there is no bare catch-all.
  { re: /^You cannot enter a delve right now\.$/, build: () => t('sim.delve.cannotEnterNow') },
  { re: /^Leave the dungeon first\.$/, build: () => t('sim.delve.leaveDungeonFirst') },
  { re: /^Leave the arena first\.$/, build: () => t('sim.delve.leaveArenaFirst') },
  { re: /^You are already in a delve\.$/, build: () => t('sim.delve.alreadyInDelve') },
  { re: /^You cannot enter a delve while trading\.$/, build: () => t('sim.delve.whileTrading') },
  { re: /^You cannot enter a delve during a duel\.$/, build: () => t('sim.delve.duringDuel') },
  {
    re: /^You cannot enter a delve during an arena match\.$/,
    build: () => t('sim.delve.duringArena'),
  },
  { re: /^Unknown delve tier\.$/, build: () => t('sim.delve.unknownTier') },
  {
    re: /^A mechanism clicks open nearby\. A passage opens to the north\. Find the exit portal ahead\.$/,
    build: () => t('sim.delve.mechanismOpen'),
  },
  { re: /^The grave rite falters\.$/, build: () => t('sim.delve.graveFalters') },
  {
    re: /^The dead answer Deacon Varric's call!$/,
    build: () => t('delveUi.boss.varric.raise.interrupt_fail'),
  },
  { re: /^The door is already open\.$/, build: () => t('sim.delve.doorAlreadyOpen') },
  {
    re: /^The boss falls\. A warded reliquary chest rises on the dais\. Pick its lock to claim your spoils\.$/,
    build: () => t('sim.delve.bossChest'),
  },
  {
    re: /^Sister Nhalia falls silent\. The Drowned Reliquary rises from the blackwater\. Approach it to begin the rite\.$/,
    build: () => t('sim.delve.drownedLitanyReliquaryRise'),
  },
  {
    re: /^The bell rope snaps taut\. Drowned Cantors reel from the shock\.$/,
    build: () => t('sim.delve.bellRopeShock'),
  },
  {
    re: /^The egg-sac bursts\. Spiderlings skitter free across the baptistry rim\.$/,
    build: () => t('sim.delve.eggSacBurst'),
  },
  {
    re: /^The baptistry falls quiet\. Spider egg-sacs cling wetly to the rim\.$/,
    build: () => t('sim.delve.baptistryEggs'),
  },
  {
    re: /^You should try to destroy the spider sacs\.$/,
    build: () => t('sim.delve.baptistrySpidersSealed'),
  },
  {
    re: /^You need to open the seal by applying pressure somewhere in the room\.$/,
    build: () => t('sim.delve.puzzleSealed'),
  },
  {
    re: /^You should try pulling the bell ropes\.$/,
    build: () => t('sim.delve.ropesSealed'),
  },
  {
    re: /^Something stirs in the black baptistry water\.$/,
    build: () => t('sim.delve.baptistryWave'),
  },
  {
    re: /^The shrines fall dark\. Repeat the sequence\.$/,
    build: () => t('sim.delve.riteSequenceReady'),
  },
  {
    re: /^The shrines replay the rite\. Wait\.$/,
    build: () => t('sim.delve.riteSequencePlaying'),
  },
  { re: /^A soft chime answers your touch\.$/, build: () => t('sim.delve.riteCorrect') },
  {
    re: /^A harsh bell crack\. Black water splashes at your feet\.$/,
    build: () => t('sim.delve.riteWrong'),
  },
  { re: /^The Drowned Reliquary opens\.$/, build: () => t('sim.delve.riteReliquaryOpen') },
  {
    re: /^Complete the shrine rite to open the reliquary\.$/,
    build: () => t('sim.delve.riteReliquaryLocked'),
  },
  { re: /^The reliquary is empty\.$/, build: () => t('sim.delve.riteReliquaryEmpty') },
  {
    re: /^A stairway to the surface opens\. Press F at the stairs to leave\.$/,
    build: () => t('sim.delve.surfaceStairs'),
  },
  {
    re: /^A tombstone passage opens to the north when the room is cleared\.$/,
    build: () => t('sim.delve.tombstoneHint'),
  },
  {
    re: /^A sealed tombstone passage grinds open to the north\. Walk into it to continue\.$/,
    build: () => t('sim.delve.tombstoneOpen'),
  },
  { re: /^The chest is empty\.$/, build: () => t('sim.delve.chestEmpty') },
  { re: /^You are not in a delve\.$/, build: () => t('sim.delve.notInDelve') },
  { re: /^You cannot interact with that\.$/, build: () => t('sim.delve.cannotInteract') },
  { re: /^You are too far away\.$/, build: () => t('sim.delve.tooFar') },
  { re: /^The grave is silent for now\.$/, build: () => t('sim.delve.graveSilent') },
  { re: /^The door is locked\.$/, build: () => t('sim.delve.doorLocked') },
  { re: /^Strike the wall to break through\.$/, build: () => t('sim.delve.strikeWall') },
  { re: /^Nothing happens\.$/, build: () => t('sim.delve.nothingHappens') },
  { re: /^Unknown companion\.$/, build: () => t('sim.delve.unknownCompanion') },
  {
    re: /^This companion is already fully upgraded\.$/,
    build: () => t('sim.delve.companionMaxRank'),
  },
  {
    re: /^You cannot afford this upgrade\.$/,
    build: () => t('sim.delve.cannotAffordCompanionUpgrade'),
  },
  { re: /^The passage is sealed\.$/, build: () => t('sim.delve.passageSealed') },
  { re: /^Move closer to the passage\.$/, build: () => t('sim.delve.moveCloserPassage') },
  { re: /^Move closer to the chest\.$/, build: () => t('sim.delve.moveCloserChest') },
  { re: /^Move closer to the reliquary\.$/, build: () => t('sim.delve.moveCloserReliquary') },
  { re: /^There is nothing left to take\.$/, build: () => t('sim.delve.nothingToTake') },
  { re: /^The way out is not yet open\.$/, build: () => t('sim.delve.wayOutNotOpen') },
  { re: /^Move closer to the stairs\.$/, build: () => t('sim.delve.moveCloserStairs') },
  // Lockpicking minigame (exact lines).
  {
    re: /^Someone is already working the lock\.$/,
    build: () => t('sim.lockpick.alreadyInProgress'),
  },
  { re: /^You cannot pick that\.$/, build: () => t('sim.lockpick.cannotPickThat') },
  { re: /^Choose 1, 2, or 3 picks\.$/, build: () => t('sim.lockpick.chooseAnte') },
  { re: /^No lock attempt in progress\.$/, build: () => t('sim.lockpick.noAttempt') },
  { re: /^That is not your lock\.$/, build: () => t('sim.lockpick.notYours') },
  { re: /^That tool slips off this lock\.$/, build: () => t('sim.lockpick.toolSlips') },
  // Chest-loss lockpick lines.
  {
    re: /^The lock is jammed beyond picking\. Clear the delve again for another attempt\.$/,
    build: () => t('sim.lockpick.lockJammed'),
  },
  {
    re: /^The last pick snaps\. The lock jams\. The chest is lost unless you clear the delve again\.$/,
    build: () => t('sim.lockpick.lastPickSnaps'),
  },
  // Bountiful seal (purple coffer): requires Premium ante.
  {
    re: /^This seal yields only to a master's hand\. Only the Premium ante can open it\.$/,
    build: () => t('sim.delve.shopSealPremiumOnly'),
  },
  // Interpolated delve / lockpick lines.
  // levelRequired with tier label (must precede the two-arg form without tier).
  {
    re: /^You must be level (\d+) to enter (.+) on (.+)\.$/,
    build: (m) => t('sim.delve.levelRequiredTier', { level: m[1], name: m[2], tier: m[3] }),
  },
  {
    re: /^You must be level (\d+) to enter (.+)\.$/,
    build: (m) => t('sim.delve.levelRequired', { level: m[1], name: m[2] }),
  },
  {
    re: /^(.+) is meant for solo or duo delves\. Parties of (\d+) or more may not enter\.$/,
    build: (m) => t('sim.delve.partyTooLarge', { name: m[1], max: m[2] }),
  },
  // "All instances of X are busy" is handled by the hud-local localizeErrorText
  // arm (it runs first and resolves the dungeon-or-delve name), so no rule here.
  { re: /^(.+) run failed\.$/, build: (m) => t('sim.delve.runFailed', { name: locDelve(m[1]) }) },
  {
    re: /^(.+) begins Raise Dead\.$/,
    build: (m) => t('sim.delve.raiseDead', { name: locMob(m[1]) }),
  },
  {
    re: /^(.+) marks (.+) with Blackwater!$/,
    build: (m) => t('sim.delve.nhaliaBlackwaterMark', { name: locMob(m[1]), player: m[2] }),
  },
  { re: /^Cantors, hold the note!$/, build: () => t('sim.delve.nhaliaCantorShield') },
  {
    re: /^(.+) tolls the bells!$/,
    build: (m) => tSim('log.nhaliaTollsBells', { name: locMob(m[1]) }),
  },
  {
    re: /^You need (.+) Delve Marks to upgrade (.+)\.$/,
    build: (m) => t('sim.delve.companionMarksRequired', { marks: m[1], name: locMob(m[2]) }),
  },
  { re: /^You have not unlocked that item yet\.$/, build: () => t('sim.delve.shopItemLocked') },
  {
    re: /^You need (.+) Delve Marks to buy (.+)\.$/,
    build: (m) => t('sim.delve.shopMarksRequired', { marks: m[1], name: locItem(m[2]) }),
  },
  {
    re: /^You pass through the tombstone into (.+)\.$/,
    build: (m) => t('sim.delve.tombstoneInto', { name: locDelveModule(m[1]) }),
  },
  {
    re: /^(.+) reaches rank (.+)\.$/,
    build: (m) => t('sim.delve.companionRankUp', { name: locMob(m[1]), rank: m[2] }),
  },
  { re: /^(.+) complete\.$/, build: (m) => t('sim.delve.complete', { name: locDelve(m[1]) }) },
  // Module-enter banner: "<module>: <objective>". Anchored on the two fixed
  // objective lines (not a bare "X: Y" catch-all), so the captured module name is
  // the only free part; localize it and the objective.
  {
    re: /^(.+): Clear the room\.$/,
    build: (m) =>
      t('sim.delve.moduleEnter', {
        name: locDelveModule(m[1]),
        objective: t('sim.delve.objectiveClearRoom'),
      }),
  },
  {
    re: /^(.+): Defeat the boss\.$/,
    build: (m) =>
      t('sim.delve.moduleEnter', {
        name: locDelveModule(m[1]),
        objective: t('sim.delve.objectiveDefeatBoss'),
      }),
  },
  // 2v2 Fiesta. The leader/premade rules are wildcards so they catch both the
  // '2v2' and 'Fiesta' label variants (the ranked exact rules above match first
  // at runtime; this picks up Fiesta and the i18n guard's placeholder token).
  {
    re: /^You join the 2v2 Fiesta queue\. Get ready to PARTY[.…]{1,3}$/,
    build: () => t('fiesta.queue.join'),
  },
  { re: /^You leave the 2v2 Fiesta queue\.$/, build: () => t('fiesta.queue.leave') },
  { re: /^Your team leaves the 2v2 Fiesta queue\.$/, build: () => t('fiesta.queue.teamLeave') },
  {
    re: /^Only the party leader may queue your team for (.+)\.$/,
    build: (m) => t('fiesta.error.leaderOnly', { label: m[1] }),
  },
  {
    re: /^(.+) premade requires a party of exactly two\.$/,
    build: (m) => t('fiesta.error.premadeTwo', { label: m[1] }),
  },
  { re: /^You have no augment to choose right now\.$/, build: () => t('fiesta.error.noAugment') },
  { re: /^That augment is not on offer\.$/, build: () => t('fiesta.error.notOnOffer') },
  {
    re: /^Welcome to the 2v2 FIESTA! Score takedowns, grab augments, survive the ring!$/,
    build: () => t('fiesta.log.welcome'),
  },
  { re: /^FIESTA — GO!$/, build: () => t('fiesta.log.go') },
  {
    re: /^FIESTA OVER! What a party\. Returning to the world[.…]{1,3}$/,
    build: () => t('fiesta.log.over'),
  },
  // Boss/mob mechanic broadcast. Broad (two open captures), so it MUST stay last -
  // after every more-specific "{X} {verb}!" rule above (awakens, enraged, calls for aid).
  {
    re: /^(.+) channels (.+)\.$/,
    build: (m) => tSim('log.mobChannels', { name: locMob(m[1]), mechanic: locBossMechanic(m[2]) }),
  },
  {
    re: /^(.+) unleashes (.+)!$/,
    build: (m) =>
      tSim('log.bossUnleashes', { name: locMob(m[1]), mechanic: locBossMechanic(m[2]) }),
  },
];

// Returns the localized form of a sim-emitted message, or null if not one of ours.
export function localizeSimText(text: string): string | null {
  const exactKey = EXACT[text];
  if (exactKey) return tSim(exactKey);
  for (const rule of RULES) {
    const m = rule.re.exec(text);
    if (m) return rule.build(m);
  }
  return null;
}
