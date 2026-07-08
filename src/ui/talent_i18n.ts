import {
  type ClassTalents,
  type GlobalModEffect,
  type Role,
  type SpecDef,
  type StatModEffect,
  TALENTS,
  type TalentChoiceOption,
  type TalentEffect,
  type TalentNode,
} from '../sim/content/talents';
import { ABILITIES } from '../sim/data';
import type { PlayerClass } from '../sim/types';
import { tEntity } from './entity_i18n';
import { getLanguage, languageTag, type SupportedLanguage, t } from './i18n';

// Localized UI label for a spec's combat role (tank/healer/dps). Shared by the
// talents window (spec cards) and the character sheet's spec summary so the role
// name reads identically in both. Distinct from the lowercased role words used to
// generate talent descriptions (localeText.roleLabels below).
export function roleLabel(role: Role): string {
  return role === 'tank'
    ? t('game.talents.roleTank')
    : role === 'healer'
      ? t('game.talents.roleHealer')
      : t('game.talents.roleDps');
}

export type TalentTranslationKind = 'talentNode' | 'talentChoice' | 'talentSpec' | 'talentMastery';
export type TalentTranslationField = 'name' | 'description';

export type TalentTranslationRequest =
  | { kind: 'talentNode'; node: TalentNode; field: TalentTranslationField }
  | { kind: 'talentChoice'; choice: TalentChoiceOption; field: TalentTranslationField }
  | { kind: 'talentSpec'; spec: SpecDef; field: TalentTranslationField }
  | { kind: 'talentMastery'; spec: SpecDef; field: TalentTranslationField };

export interface TalentTranslationManifestEntry {
  kind: TalentTranslationKind;
  id: string;
  classId: PlayerClass;
  specId?: string;
  field: TalentTranslationField;
  source: string;
}

type StatKey = keyof StatModEffect;
type GlobalKey = keyof GlobalModEffect;
type DisplayGlobalKey = Exclude<GlobalKey, 'critVsRooted'>;

export interface TalentLocaleText {
  // Primary-attribute multipliers (strPct/agiPct/intPct/spiPct) reuse their base stat
  // label ("+10% Agility"), so locales don't repeat them here.
  statLabels: Record<
    | Exclude<StatKey, 'strPct' | 'agiPct' | 'intPct' | 'spiPct'>
    | DisplayGlobalKey
    | 'damage'
    | 'cost'
    | 'cooldown'
    | 'castTime',
    string
  >;
  roleLabels: Record<'tank' | 'healer' | 'dps', string>;
  perRank: string;
  noEffect: string;
  chooseOne: (name: string) => string;
  specDescription: (className: string, role: string, abilityName: string) => string;
  grant: (abilityName: string) => string;
  increase: (target: string, amount: string, perRank: string) => string;
  reduce: (target: string, amount: string, perRank: string) => string;
}

const abilityIdByName = new Map(
  Object.values(ABILITIES).map((ability) => [ability.name, ability.id]),
);

const enText: TalentLocaleText = {
  statLabels: {
    str: 'Strength',
    agi: 'Agility',
    sta: 'Stamina',
    int: 'Intellect',
    spi: 'Spirit',
    armor: 'armor',
    ap: 'attack power',
    crit: 'critical strike chance',
    dodge: 'dodge chance',
    apPct: 'attack power',
    staPct: 'Stamina',
    armorPct: 'armor',
    maxHpPct: 'maximum health',
    meleeDmgPct: 'melee ability damage',
    spellDmgPct: 'spell damage',
    healPct: 'healing done',
    threatPct: 'threat generated',
    damage: 'damage',
    cost: 'cost',
    cooldown: 'cooldown',
    castTime: 'cast time',
  },
  roleLabels: { tank: 'tank', healer: 'healer', dps: 'damage' },
  perRank: ' per rank',
  noEffect: 'Provides a specialization benefit.',
  chooseOne: (name) => `Choose one ${name} option.`,
  specDescription: (className, role, abilityName) =>
    `${className} specialization focused on ${role}. Signature ability: ${abilityName}.`,
  grant: (abilityName) => `Grants ${abilityName}.`,
  increase: (target, amount, perRank) => `Increases ${target} by ${amount}${perRank}.`,
  reduce: (target, amount, perRank) => `Reduces ${target} by ${amount}${perRank}.`,
};

const localeTextByBase = {
  en: enText,
  pt_BR: {
    statLabels: {
      str: 'Força',
      agi: 'Agilidade',
      sta: 'Vigor',
      int: 'Intelecto',
      spi: 'Espírito',
      armor: 'armadura',
      ap: 'poder de ataque',
      crit: 'chance de acerto crítico',
      dodge: 'chance de esquiva',
      apPct: 'poder de ataque',
      staPct: 'Vigor',
      armorPct: 'armadura',
      maxHpPct: 'vida máxima',
      meleeDmgPct: 'dano de habilidades corpo a corpo',
      spellDmgPct: 'dano mágico',
      healPct: 'cura realizada',
      threatPct: 'ameaça gerada',
      damage: 'dano',
      cost: 'custo',
      cooldown: 'recarga',
      castTime: 'tempo de conjuração',
    },
    roleLabels: { tank: 'tanque', healer: 'cura', dps: 'dano' },
    perRank: ' por grau',
    noEffect: 'Concede um benefício de especialização.',
    chooseOne: (name) => `Escolha uma opção de ${name}.`,
    specDescription: (className, role, abilityName) =>
      `Especialização de ${className} focada em ${role}. Habilidade assinatura: ${abilityName}.`,
    grant: (abilityName) => `Concede ${abilityName}.`,
    increase: (target, amount, perRank) => `Aumenta ${target} em ${amount}${perRank}.`,
    reduce: (target, amount, perRank) => `Reduz ${target} em ${amount}${perRank}.`,
  },
} satisfies Record<SupportedLanguage, TalentLocaleText>;

const localeText: Record<SupportedLanguage, TalentLocaleText> = {
  ...localeTextByBase,
};

// Single authoritative table of per-name talent-title translations using official
// classic-MMO terminology. translateTitle() consults this after ability-name
// resolution. To add a talent or locale, add its localized name here for each
// locale — there is no secondary additions/corrections layer.
const titleOverrides: Partial<Record<SupportedLanguage, Record<string, string>>> = {
  pt_BR: {
    'Aether Surge': 'Poder Arcano',
    'Aetheric Aim': 'Foco Arcano',
    'Aetheric Flux': 'Instabilidade Arcana',
    'Aetheric Mind': 'Mente Arcana',
    'Aetheric Poise': 'Concentração Arcana',
    'Aetheric Shell': 'Resiliência Arcana',
    'Aetheric Thesis': 'Tese Arcana',
    Aethermancy: 'Arcano',
    Afterflame: 'Inflamar',
    "Ancestor's Mercy": 'Cura Ancestral',
    'Ancient Lore': 'Conhecimento Ancestral',
    Anointing: 'Infusão de Poder',
    'Answering Fang': 'Contra-ataque',
    'Arc Mastery': 'Maestria de Raios',
    'Arcing Reach': 'Alcance da Tempestade',
    'Arrow Squall': 'Saraivada',
    'Ashen Call': 'Chamado das Chamas',
    'Baleful Rod': 'Especialização em Varinha',
    Barbarity: 'Crueldade',
    'Battle Doctrine': 'Domínio Tático',
    Battlecraft: 'Armas',
    'Beast Tending': 'Curar Mascote Aprimorado',
    Beastpact: 'Vínculo Bestial',
    Benison: 'Sagrado',
    'Bitter Lessons': 'Táticas de Sobrevivência',
    'Black Office': 'Artes Sombrias',
    'Blackblood Vigor': 'Vigor Vil',
    Blackfire: 'Tempestade de Brasas',
    'Blade Turn': 'Deflexão',
    Blademaster: 'Mestre das Lâminas',
    'Bleak Insight': 'Iluminação',
    'Blood Debt': 'Vingança',
    Bloodlather: 'Frenesi',
    Bloodletter: 'Sede de Sangue',
    Bloodrush: 'Fúria',
    Bonepiercer: 'Empalar',
    'Boundless Ire': 'Ira Desenfreada',
    Brackenstride: 'Desbravador de Trilhas',
    "Brawler's Way": 'Estilo de Combate',
    Bristleguard: 'Dissuasão',
    Brittlebreak: 'Estilhaçar',
    Bulwark: 'Baluarte',
    "Butcher's Aim": 'Tiros Letais',
    Calamity: 'Cataclismo',
    'Calloused Hide': 'Pele Grossa',
    'Carrion Eye': 'Olho de Falcão',
    'Ceaseless Cuts': 'Golpes Implacáveis',
    Chastisement: 'Penitência',
    'Cleansing Tides': 'Purificação',
    'Cold Comfort': 'Tempo Emprestado',
    'Cold Reckoning': 'Vingança',
    'Cold Shoulder': 'Frio Invernal',
    Coldsight: 'Pontaria',
    'Coldsight Mastery': 'Maestria de Pontaria',
    Contingency: 'Preparação',
    'Court of Fiends': 'Táticas Demoníacas',
    'Cowing Roar': 'Intimidação',
    'Creeping Dark': 'Escuridão',
    'Creeping Rot': 'Aflições Potentes',
    Cremation: 'Incinerar',
    'Crimson Hunger': 'Frenesi Sanguíneo',
    'Cruel Venoms': 'Venenos Vis',
    'Cruel Wounds': 'Disparos Mortais',
    Cryomancy: 'Gelo',
    'Dead Aim': 'Precisão',
    'Deathless Ardor': 'Defensor Fervoroso',
    'Deathless Will': 'Instintos de Sobrevivência',
    'Deep Reserves': 'Fôlego Renovado',
    'Deep Rime': 'Gelo Eterno',
    'Deepened Hex': 'Ampliar Maldição',
    Deepword: 'Palavra Sagrada',
    Desolation: 'Ruína',
    'Dire Bruin': 'Urso Temível',
    'Dirty Work': 'Homicídio',
    Doctrine: 'Disciplina',
    'Doctrine Focus': 'Foco em Disciplina',
    'Dread Aspect': 'Metamorfose',
    Duskbound: 'Afinidade Sombria',
    'Earthen Fury': 'Fúria Elemental',
    'Earthen Grit': 'Tenacidade',
    "Eel's Grace": 'Escorregadio',
    'Effortless Art': 'Conjuração Límpida',
    'Elder Arms': 'Armas Ancestrais',
    'Elemental Rigor': 'Precisão Elemental',
    'Eleventh Hour': 'Resistência Final',
    'Evergreen Soul': 'Espírito Vivo',
    'Fair Warning': 'Antecipação',
    'False Face': 'Mestre do Engano',
    Farflame: 'Lançamento de Chamas',
    'Fault Line': 'Concussão',
    'Fervent Oath': 'Bênção',
    'Fervid Aura': 'Aura de Santidade',
    'Fevered Instinct': 'Instintos Rápidos',
    Fieldcraft: 'Sobrevivência',
    'Fiendish Fortitude': 'Abraço Demoníaco',
    Fiendlore: 'Conhecimento Demoníaco',
    Fiendmaster: 'Mestre Demonologista',
    'Final Notice': 'Selar o Destino',
    'First Fang': 'Líder da Matilha',
    'Fixed Purpose': 'Vontade Focada',
    Flashburn: 'Refluxo de Chamas',
    Flashfire: 'Combustão',
    Forewarning: 'Antecipação',
    'Foul Play': 'Truques Sujos',
    'Frenzied Tempo': 'Rajada',
    'Gathered Prayers': 'Preces de Cura',
    'Gentle Gloam': 'Brilho Lunar',
    Ghostlight: 'Orientação Espiritual',
    Gloamveil: 'Forma Sombria',
    'Grand Binder': 'Mestre Invocador',
    'Grave Mercy': 'Cura Espiritual',
    'Grave Mistake': 'Acerto de Contas',
    'Grim Bargain': 'Pacto Sombrio',
    'Grim Certainty': 'Convicção',
    'Grim Tidings': 'Anoitecer',
    'Grim Vigor': 'Vigor do Assassino',
    Grit: 'Tenacidade',
    "Grove's Gift": 'Dádiva da Natureza',
    Groveheart: 'Restauração',
    'Guiding Spirits': 'Orientação Ancestral',
    'Hallowed Wall': 'Escudo Sagrado',
    Hallowlight: 'Luz Santificada',
    'Hastened Doom': 'Perdição',
    Heartwood: 'Árvore da Vida',
    'Heavy Blows': 'Impacto Brutal',
    Hexcraft: 'Aflição',
    'Honed Edge': 'Maestria de Armas',
    'Howling Rage': 'Ira Bestial',
    'Hush Money': 'Sentidos Aguçados',
    Icecraft: 'Arte do Gelo',
    'Ill Will': 'Malícia',
    'Improved Aether Darts': 'Mísseis Arcanos Aprimorados',
    'Improved Armor Shear': 'Fender Armadura Aprimorado',
    'Improved Bewitch': 'Polimorfia Aprimorada',
    'Improved Blackrot': 'Corrupção Aprimorada',
    'Improved Bloodletting': 'Sede de Sangue Aprimorada',
    'Improved Brute Swing': 'Batida Aprimorada',
    'Improved Burning Oath': 'Fúria Íntegra Aprimorada',
    'Improved Cinderbolt': 'Bola de Fogo Aprimorada',
    'Improved Cinderfall': 'Impacto de Fogo Aprimorado',
    'Improved Dirge of Decay': 'Palavra Sombria: Dor Aprimorada',
    'Improved Dirt Nap': 'Eviscerar Aprimorado',
    'Improved Eye Jab': 'Cutilada Aprimorada',
    'Improved Fell Shot': 'Tiro Arcano Aprimorado',
    'Improved Fettering Slash': 'Cortar Asas Aprimorado',
    'Improved Fiendhide': 'Pele Demoníaca Aprimorada',
    'Improved Goad': 'Provocar Aprimorado',
    'Improved Hard Bargain': 'Conversão de Vida Aprimorada',
    "Improved Harrier's Guise": 'Aspecto do Falcão Aprimorado',
    'Improved Hex of Anguish': 'Maldição da Agonia Aprimorada',
    'Improved Icebind': 'Nova Congelante Aprimorada',
    'Improved Last Rite': 'Imposição de Mãos Aprimorada',
    'Improved Lingering Grace': 'Renovar Aprimorado',
    'Improved Litany of Resolve': 'Fortitude Aprimorada',
    'Improved Litany of Woe': 'Açoite Mental Aprimorado',
    'Improved Lunar Tempest': 'Fogo Lunar Aprimorado',
    "Improved Lurker's Strike": 'Emboscada Aprimorada',
    'Improved Maiming Strike': 'Golpe Mortal Aprimorado',
    'Improved Mending Light': 'Luz Sagrada Aprimorada',
    'Improved Mending Waters': 'Onda de Cura Aprimorada',
    'Improved Psalm of Warding': 'Palavra de Poder: Escudo Aprimorada',
    'Improved Quaking Blow': 'Trovoada Aprimorada',
    'Improved Reaping Arc': 'Fender Aprimorado',
    'Improved Reaver Strike': 'Golpe Heroico Aprimorado',
    'Improved Redhand': 'Sobrepujar Aprimorado',
    'Improved Rimelance': 'Seta de Gelo Aprimorada',
    'Improved Sear': 'Dor Calcinante Aprimorada',
    'Improved Second Bloom': 'Recrescimento Aprimorado',
    'Improved Shadewolf': 'Lobo Fantasma Aprimorado',
    'Improved Shieldcrack': 'Impacto com Escudo Aprimorado',
    'Improved Steadfast Aura': 'Aura de Devoção Aprimorada',
    'Improved Stonebound': 'Mordida da Rocha Aprimorada',
    'Improved Swift Heels': 'Disparada Aprimorada',
    'Improved Thunder Ward': 'Escudo de Raios Aprimorado',
    'Improved Verdict': 'Julgamento Aprimorado',
    'Improved Wicked Slash': 'Golpe Sinistro Aprimorado',
    'Improved Wildbloom': 'Rejuvenescimento Aprimorado',
    'Improved Wildbolt': 'Ira Aprimorada',
    'Improved Wildward': 'Marca do Selvagem Aprimorada',
    'Iron Aim': 'Treino de Tiro Certeiro',
    Ironguard: 'Proteção',
    Ironpelt: 'Pele Grossa',
    Ironsinew: 'Treino de Resistência',
    "Killer's Calm": 'Sangue Frio',
    'Killing Calm': 'Instinto Assassino',
    'Kindled Faith': 'Iluminação Divina',
    Knifework: 'Assassinato',
    'Last Prayer': 'Prece Desesperada',
    'Latent Charge': 'Convecção',
    'Lean Quiver': 'Eficiência',
    'Leeching Dirge': 'Abraço Vampírico',
    'Lettered Faith': 'Intelecto Divino',
    Lifesap: 'Avivar',
    'Lightmend Focus': 'Foco de Flash',
    Lightwright: 'Maestria da Luz',
    'Lingering Echo': 'Reverberação',
    'Lingering Wounds': 'Feridas Profundas',
    Lodestar: 'Disciplina do Sinal',
    'Low Cunning': 'Oportunidade',
    "Martyr's Boon": 'Favor Divino',
    "Mender's Vow": 'Luz Curativa',
    'Merciless Strikes': 'Golpes Selvagens',
    'Mirrored Blades': 'Rajada de Lâminas',
    Monsterbane: 'Matança de Monstros',
    Moongrove: 'Equilíbrio',
    Moonrage: 'Fúria Lunar',
    'Moonwing Form': 'Forma Moonkin',
    'Moonwing Path': 'Caminho do Moonkin',
    'Night Trade': 'Artes Sombrias',
    'Nimble Mind': 'Agilidade Mental',
    Nocturns: 'Meditação',
    'Oath of Refuge': 'Bênção do Santuário',
    'Oathbrand Command': 'Selo de Comando',
    Oathward: 'Proteção Sagrada',
    'Old Scars': 'Sobrevivencialista',
    Packbond: 'Espíritos Afins',
    Packlord: 'Domínio das Feras',
    Pactbound: 'Demonologia',
    'Pain Communion': 'Elo de Alma',
    Palisade: 'Reduto',
    'Parting Gift': 'Aflição Instável',
    'Path of Fangs': 'Instinto Feral',
    'Path of Renewal': 'Dom da Restauração',
    'Path of Seasons': 'Caminho da Natureza',
    'Path of Spirits': 'Chamado Elemental',
    'Pitiless Blows': 'Ataques Impiedosos',
    'Poleaxe Discipline': 'Especialização em Alabarda',
    'Practiced Steel': 'Perícia em Armas',
    "Predator's Cunning": 'Golpes Predatórios',
    'Primal Clarity': 'Foco Elemental',
    'Primal Heart': 'Coração Selvagem',
    'Primal Mastery': 'Maestria Elemental',
    'Punishing Blows': 'Golpes do Cruzado',
    'Pyre Tender': 'Piromante',
    Pyromancy: 'Fogo',
    Quickblood: 'Reflexos Relâmpago',
    'Quiet Fervor': 'Foco Espiritual',
    Quietude: 'Reflexão',
    'Racing Mind': 'Presença de Espírito',
    'Rapid Blows': 'Rajada',
    'Reaching Boughs': 'Alcance da Natureza',
    'Reaching Word': 'Alcance Sagrado',
    "Reaper's Vow": 'Zelo do Cruzado',
    'Reaping Path': 'Colheita de Almas',
    Recompense: 'Vingança',
    'Red Hunger': 'Agressão Feral',
    'Red Mist': 'Enfurecer',
    'Red Ribbon': 'Hemorragia',
    Redhanded: 'Intenção Homicida',
    Redmaw: 'Ferocidade',
    Refuge: 'Santuário',
    Requital: 'Retribuição',
    'Rolling Flame': 'Onda de Impacto',
    Ruination: 'Destruição',
    'Rushing Waters': 'Rapidez da Natureza',
    'Sablewind Focus': 'Foco do Vento Espectral',
    Sacrament: 'Sagrado',
    Savagery: 'Selvageria',
    'School Focus': 'Foco em Escola',
    "Scrapper's Edge": 'Potência de Combate',
    'Scything Blows': 'Golpes Amplos',
    'Second Winter': 'Onda de Frio',
    'Serene Waters': 'Foco das Marés',
    Shadeslip: 'Passo Furtivo',
    'Shared Quarry': 'Fogo Concentrado',
    'Sharpened Blades': 'Lâminas Afiadas',
    'Shattered Earth': 'Devastação Elemental',
    Shieldbearer: 'Especialização em Escudo',
    Shieldwright: 'Maestria de Escudo',
    'Short Fuse': 'Impacto',
    'Silent Treatment': 'Silêncio',
    Skulduggery: 'Sutileza',
    'Skyfall Mastery': 'Maestria de Fogo Estelar',
    Skyrend: 'Invocador de Tempestades',
    'Slipped Leash': 'Fúria Desencadeada',
    'Small Mercies': 'Inspiração',
    'Snuffed Light': 'Apagão',
    Sootcloak: 'Camuflagem',
    'Soothing Grace': 'Graça Curativa',
    Soulglean: 'Toque Espiritual',
    'Spiked Harness': 'Armadura Lâmina',
    'Spiritforged Arms': 'Armas Espirituais',
    Spiritmend: 'Restauração',
    Splinterfrost: 'Fragmentos de Gelo',
    Springflood: 'Maré de Mana',
    'Stalwart Shield': 'Especialização em Escudo',
    'Starlit Grace': 'Graça da Natureza',
    'Steadfast Soul': 'Alma Devotada',
    Steadfoot: 'Passo Firme',
    'Steadied Prayer': 'Foco em Cura',
    'Steady Draw': 'Foco da Mira',
    'Stifling Grasp': 'Supressão',
    'Stilled Mind': 'Foco Interior',
    'Stolen Breath': 'Vigor',
    'Sure Footing': 'Orientação da Natureza',
    Sureflight: 'Tiro Certeiro',
    'Sureflight Aura': 'Aura de Pontaria',
    'Swift Verdict': 'Busca pela Justiça',
    Swiftbloom: 'Rapidez da Natureza',
    Swiftpaw: 'Agilidade Felina',
    'Sworn Strength': 'Força Divina',
    'Thicket Snare': 'Aperto da Natureza',
    Thuggery: 'Combate',
    'Thunder Path': 'Caminho da Tempestade',
    Thundercall: 'Elemental',
    'Thunderous Blows': 'Golpes Trovejantes',
    'Tidesworn Path': 'Bênção da Natureza',
    'Tipping Point': 'Massa Crítica',
    Turnabout: 'Ripostar',
    Turnaside: 'Deflexão',
    'Twofold Creed': 'Disciplinas Gêmeas',
    'Umbral Intent': 'Foco Sombrio',
    'Umbral Mastery': 'Maestria Sombria',
    'Unbowed Mind': 'Vontade Inquebrável',
    'Unbroken Focus': 'Concentração Vil',
    'Unearned Mercy': 'Graça Sagrada',
    'Unyielding Pact': 'Resiliência Demoníaca',
    'Veiled Calling': 'Chamado Interior',
    Veinleech: 'Sugar Vida',
    'Verdict of Light': 'Julgamento da Luz',
    Vespers: 'Sombra',
    Vigil: 'Proteção',
    'Vile Carapace': 'Armadura Vil',
    'Vile Cunning': 'Intelecto Vil',
    'Vile Precision': 'Precisão Vil',
    'Viper Reflexes': 'Reflexos Relâmpago',
    'Votive Calling': 'Chamado Sagrado',
    Wandcraft: 'Especialização em Varinha',
    'War Madness': 'Frenético',
    "Warder's Vow": 'Favor do Guardião',
    Warpath: 'Caminho do Cruzado',
    Warspirit: 'Aprimoramento',
    Waywise: 'Desbravador',
    'Weapon Mastery': 'Maestria de Armas',
    'Whetted Fangs': 'Ferocidade',
    Wildfang: 'Feral',
    Wildsurge: 'Furor',
    Winterguard: 'Proteção contra Gelo',
    Woodwise: 'Naturalista',
    Wrack: 'Devastação',
    'Wrathful Psalm': 'Fúria Divina',
  },
};

function talentClassData(): ClassTalents[] {
  return Object.values(TALENTS).filter((ct): ct is ClassTalents => ct !== undefined);
}

function formatNumber(value: number, lang: SupportedLanguage): string {
  return new Intl.NumberFormat(languageTag(lang), { maximumFractionDigits: 1 }).format(value);
}

function formatPercent(value: number, lang: SupportedLanguage): string {
  // Intl percent style applies the locale's percent spacing/placement (e.g. fr/de/es/ru
  // render "5 %" with a no-break space, en/it/CJK render "5%"). `value` is a fraction, so
  // pass it directly rather than pre-multiplying and appending a raw "%". Mirrors the HUD
  // settings percent renderer in hud.ts.
  return new Intl.NumberFormat(languageTag(lang), {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(Math.abs(value));
}

function statAmount(stat: StatKey, value: number, lang: SupportedLanguage): string {
  return stat === 'crit' || stat === 'dodge' || stat.endsWith('Pct')
    ? formatPercent(value, lang)
    : formatNumber(Math.abs(value), lang);
}

function translateTitle(source: string, lang: SupportedLanguage): string {
  if (lang === 'en') return source;
  const abilityId = abilityIdByName.get(source);
  if (abilityId) return tEntity({ kind: 'ability', id: abilityId, field: 'name' });
  const override = titleOverrides[lang]?.[source];
  if (override !== undefined) return override;
  // Every shipped talent name has an explicit override (enforced by tests) or is an
  // ability name (resolved above). A bare return here only triggers for a newly-added
  // talent that still needs a localized override — clean English is preferable to a
  // broken word-by-word guess, and the leak-guard test flags it for translation.
  return source;
}

function abilityName(id: string): string {
  return tEntity({ kind: 'ability', id, field: 'name' });
}

// True when a talent title has an explicit per-locale translation override. The
// coverage test uses this to tell a deliberately-kept cognate (e.g. French
// "Riposte", Spanish "Vigor") apart from a name that leaks English by accident
// because the word-substitution dictionary does not cover its vocabulary.
export function hasTalentTitleOverride(lang: SupportedLanguage, source: string): boolean {
  return titleOverrides[lang]?.[source] !== undefined;
}

// Public wrapper: localize a content title given its English source name. Resolves an
// ability name (via the entity dictionary) or a talent-title override, else returns the
// source unchanged. Used by the HUD to localize aura/buff names that are granted by a
// talent or ability but surface in the buff frame / combat log by their raw English name.
export function localizeTalentTitle(
  source: string,
  lang: SupportedLanguage = getLanguage(),
): string {
  return translateTitle(source, lang);
}

function effectDescription(
  effect: TalentEffect | undefined,
  maxRank: number,
  lang: SupportedLanguage,
): string {
  if (!effect) return localeText[lang].noEffect;
  const text = localeText[lang];
  const perRank = maxRank > 1 ? text.perRank : '';
  const parts: string[] = [];

  if (effect.grant) parts.push(text.grant(abilityName(effect.grant.ability)));

  const stats = effect.stats ?? {};
  const PRIMARY_PCT: Partial<Record<StatKey, 'str' | 'agi' | 'int' | 'spi'>> = {
    strPct: 'str',
    agiPct: 'agi',
    intPct: 'int',
    spiPct: 'spi',
  };
  for (const [key, value] of Object.entries(stats) as [StatKey, number][]) {
    if (value === undefined || value === 0) continue;
    const label = text.statLabels[PRIMARY_PCT[key] ?? (key as keyof typeof text.statLabels)];
    parts.push(text.increase(label, statAmount(key, value, lang), perRank));
  }

  const global = effect.global ?? {};
  for (const [key, value] of Object.entries(global) as [GlobalKey, number][]) {
    if (value === undefined || value === 0) continue;
    if (key === 'critVsRooted') continue;
    parts.push(text.increase(text.statLabels[key], formatPercent(value, lang), perRank));
  }

  for (const mod of effect.ability ?? []) {
    const name = abilityName(mod.ability);
    if (mod.dmgPct)
      parts.push(
        text.increase(
          `${name} ${text.statLabels.damage}`,
          formatPercent(mod.dmgPct, lang),
          perRank,
        ),
      );
    if (mod.flatDmg)
      parts.push(
        text.increase(
          `${name} ${text.statLabels.damage}`,
          formatNumber(Math.abs(mod.flatDmg), lang),
          perRank,
        ),
      );
    if (mod.costPct)
      parts.push(
        (mod.costPct < 0 ? text.reduce : text.increase)(
          `${name} ${text.statLabels.cost}`,
          formatPercent(mod.costPct, lang),
          perRank,
        ),
      );
    if (mod.cooldownPct)
      parts.push(
        (mod.cooldownPct < 0 ? text.reduce : text.increase)(
          `${name} ${text.statLabels.cooldown}`,
          formatPercent(mod.cooldownPct, lang),
          perRank,
        ),
      );
    if (mod.castPct)
      parts.push(
        (mod.castPct < 0 ? text.reduce : text.increase)(
          `${name} ${text.statLabels.castTime}`,
          formatPercent(mod.castPct, lang),
          perRank,
        ),
      );
    // buffPct strengthens the named buff itself (e.g. "Increases Devotion Aura by 20%").
    if (mod.buffPct) parts.push(text.increase(name, formatPercent(mod.buffPct, lang), perRank));
  }

  return parts.length > 0 ? parts.join(' ') : text.noEffect;
}

function className(id: PlayerClass): string {
  return tEntity({ kind: 'class', id, field: 'name' });
}

export function tTalent(request: TalentTranslationRequest): string {
  const lang = getLanguage();
  // English is the authored source of truth: the hand-written `description` strings carry
  // the real numbers (kept honest against the effect by tests/talent_tooltip_accuracy.ts).
  // The other 12 locales GENERATE from the effect data (effectDescription), so they cannot
  // drift and need no per-string translation.
  if (lang === 'en') {
    if (request.kind === 'talentMastery') {
      return request.field === 'name'
        ? request.spec.mastery.name
        : request.spec.mastery.description;
    }
    if (request.kind === 'talentSpec') return request.spec[request.field];
    if (request.kind === 'talentChoice') return request.choice[request.field];
    return request.node[request.field];
  }

  if (request.kind === 'talentMastery') {
    return request.field === 'name'
      ? translateTitle(request.spec.mastery.name, lang)
      : effectDescription(request.spec.mastery.effect, 1, lang);
  }
  if (request.kind === 'talentSpec') {
    return request.field === 'name'
      ? translateTitle(request.spec.name, lang)
      : localeText[lang].specDescription(
          className(request.spec.class),
          localeText[lang].roleLabels[request.spec.role],
          abilityName(request.spec.signature),
        );
  }
  if (request.kind === 'talentChoice') {
    return request.field === 'name'
      ? translateTitle(request.choice.name, lang)
      : effectDescription(request.choice.effect, 1, lang);
  }
  if (request.field === 'name') return translateTitle(request.node.name, lang);
  if (request.node.kind === 'choice')
    return localeText[lang].chooseOne(translateTitle(request.node.name, lang));
  return effectDescription(request.node.effect, request.node.maxRank, lang);
}

export function talentTranslationManifest(): TalentTranslationManifestEntry[] {
  const entries: TalentTranslationManifestEntry[] = [];
  for (const ct of talentClassData()) {
    for (const spec of ct.specs) {
      entries.push({
        kind: 'talentSpec',
        id: spec.id,
        classId: spec.class,
        field: 'name',
        source: spec.name,
      });
      entries.push({
        kind: 'talentSpec',
        id: spec.id,
        classId: spec.class,
        field: 'description',
        source: spec.description,
      });
      entries.push({
        kind: 'talentMastery',
        id: `${spec.id}.mastery`,
        classId: spec.class,
        specId: spec.id,
        field: 'name',
        source: spec.mastery.name,
      });
      entries.push({
        kind: 'talentMastery',
        id: `${spec.id}.mastery`,
        classId: spec.class,
        specId: spec.id,
        field: 'description',
        source: spec.mastery.description,
      });
    }
    for (const node of ct.nodes) {
      entries.push({
        kind: 'talentNode',
        id: node.id,
        classId: ct.class,
        specId: node.specId,
        field: 'name',
        source: node.name,
      });
      entries.push({
        kind: 'talentNode',
        id: node.id,
        classId: ct.class,
        specId: node.specId,
        field: 'description',
        source: node.description,
      });
      for (const choice of node.choices ?? []) {
        entries.push({
          kind: 'talentChoice',
          id: `${node.id}.${choice.id}`,
          classId: ct.class,
          specId: node.specId,
          field: 'name',
          source: choice.name,
        });
        entries.push({
          kind: 'talentChoice',
          id: `${node.id}.${choice.id}`,
          classId: ct.class,
          specId: node.specId,
          field: 'description',
          source: choice.description,
        });
      }
    }
  }
  return entries;
}

export function renderTalentManifestEntry(entry: TalentTranslationManifestEntry): string {
  const ct = TALENTS[entry.classId];
  if (!ct) return entry.source;
  if (entry.kind === 'talentSpec' || entry.kind === 'talentMastery') {
    const spec = ct.specs.find(
      (candidate) => candidate.id === (entry.kind === 'talentSpec' ? entry.id : entry.specId),
    );
    if (!spec) return entry.source;
    return tTalent({ kind: entry.kind, spec, field: entry.field });
  }
  const [nodeId, choiceId] = entry.id.split('.');
  const node = ct.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) return entry.source;
  if (entry.kind === 'talentChoice') {
    const choice = node.choices?.find((candidate) => candidate.id === choiceId);
    if (!choice) return entry.source;
    return tTalent({ kind: 'talentChoice', choice, field: entry.field });
  }
  return tTalent({ kind: 'talentNode', node, field: entry.field });
}
