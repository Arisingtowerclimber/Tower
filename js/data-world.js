// Файл содержит данные о мире: этажи, мобов, ресурсы, события.

// ── Вариация мобов: редкость, модификаторы, способности ──────────────────
// Вариация применяется только к обычным мобам; боссы всегда «обычные».
const ELITE_CHANCE = 0.05;    // шанс элитного моба (★)
const RARE_CHANCE = 0.10;     // шанс редкого моба (✦)

// Бонусы за редкость: модификаторы на награду не влияют.
const RARE_REWARDS = { goldMult: 1.5, xpMult: 1.25, recipeChance: 0.15 };
const ELITE_REWARDS = { goldMult: 2, xpMult: 1.5, recipeChance: 0.25 };

const RARITY_INFO = {
  common: { name: "Обычный", badge: "" },
  rare: { name: "Редкий", badge: "✦ Редкий" },
  elite: { name: "Элитный", badge: "★ Элитный" },
};

const ABILITY_POOL = ["poison", "vampire", "rage", "adaptive"];

const MOB_ABILITY_INFO = {
  poison: { name: "Яд", icon: "☠️", desc: "Отравляет героя: урон каждый ход 3 хода подряд. Повторное отравление обновляет таймер, но не стакается." },
  vampire: { name: "Вампиризм", icon: "🧛", desc: "Восстанавливает 20% нанесённого урона." },
  rage: { name: "Ярость", icon: "😡", desc: "Ниже 30% HP удары становятся сильнее на 30%." },
  adaptive: { name: "Адаптация", icon: "🧠", desc: "В полтора раза чаще подстраивает блок под ваш прошлый удар." },
};

const MOB_MODIFIERS = {
  frail: { name: "Хилый", icon: "💀", desc: "−25% HP", apply: (d) => { d.hp = Math.max(1, Math.round(d.hp * 0.75)); } },
  healthy: { name: "Крупный", icon: "🛡️", desc: "+25% HP", apply: (d) => { d.hp = Math.round(d.hp * 1.25); } },
  swift: { name: "Быстрый", icon: "💨", desc: "15% шанс уклониться от удара", apply: (d) => { d.dodgeBonus = SWIFT_DODGE; } },
  savage: { name: "Дикий", icon: "🩸", desc: "+20% урона", apply: (d) => { d.atk = Math.round(d.atk * 1.2); } },
  cowardly: { name: "Трусливый", icon: "🪨", desc: "−20% урона, +20% защиты", apply: (d) => { d.atk = Math.max(1, Math.round(d.atk * 0.8)); d.def = Math.round(d.def * 1.2); } },
};

const SWIFT_DODGE = 15;           // % шанса, что удар героя пройдёт мимо
const VAMPIRE_HEAL_PERCENT = 0.2; // доля нанесённого урона, которую вампир лечит
const ADAPTIVE_MULT = 1.5;        // множитель шанса адаптации блока
const POISON_TURNS = 3;           // сколько ходов действует яд
const POISON_ATK_MULT = 0.5;      // урон яда за ход: доля атаки врага (минимум 2)

// Засада: второй противник выходит сразу после победы, бой бесплатный по энергии.
const AMBUSH_CHANCE = 0.10;       // в обычном бою
const AMBUSH_TEXT = "Из тени выходит второй противник!";

// Случайный моб того же этажа для засады (не тот, с которым уже идёт бой).
function ambushMobIndex(floor, excludeIndex = -1) {
  const all = floor.mobs.map((_, i) => i);
  const pool = all.filter((i) => i !== excludeIndex);
  const list = pool.length ? pool : all;
  return list[Math.floor(Math.random() * list.length)];
}

// ── Доска объявлений Зала Охотников (контракты) ─────────────────────────────
// Шаблоны предложений. state.js раз в неделю разворачивает их в записи
// state.weekQuests.list — единого списка для Доски объявлений и Журнала
// заданий. Прогресс растёт в checkQuestProgress(mobId), награда — золото +
// репутация Гильдии Охотников.
// type: "weekly" — большой «Недельный заказ Ивана» (по одному на этаж),
// остальное — контракты на охоту вида «Истребить 5 [имя моба] на [этаж]».
const HUNT_CONTRACTS = [
  // Недельные заказы Ивана — по шаблону на каждый этаж.
  { id: "ivan_weekly_f1", type: "weekly", mobId: "goblin_scout", floorId: 1, target: 10, gold: 420, xp: 280, rep: 2, desc: "Капитан собирает трофейные счёты: десять гостей Тёмного Леса к концу недели (Этаж 1)." },
  { id: "ivan_weekly_f2", type: "weekly", mobId: "kobold_miner", floorId: 2, target: 10, gold: 620, xp: 420, rep: 2, desc: "Кобольды копают слишком близко к караванным путям. Ивану это не нравится (Этаж 2)." },
  { id: "ivan_weekly_f3", type: "weekly", mobId: "skeleton_warrior", floorId: 3, target: 10, gold: 860, xp: 560, rep: 2, desc: "Из склепа доносится стук костей. Капитан платит за тишину (Этаж 3)." },
  { id: "ivan_weekly_f4", type: "weekly", mobId: "orc_raider", floorId: 4, target: 10, gold: 1150, xp: 740, rep: 2, desc: "Орочьи набеги участились. Заплатят за каждый клинок, что не вернётся в лагерь (Этаж 4)." },
  { id: "ivan_weekly_f5", type: "weekly", mobId: "fire_imp", floorId: 5, target: 10, gold: 1500, xp: 980, rep: 2, desc: "Бесы жгут леса на подходах к Башне. Гильдия объявила облаву (Этаж 5)." },

  // Контракты на охоту — на доске висят по два.
  { id: "hc_hobgoblin", type: "hunt", mobId: "hobgoblin", floorId: 1, target: 5, gold: 180, xp: 120, rep: 1, desc: "Хобгоблины топчут покосы и пугают дровосеков (Этаж 1)." },
  { id: "hc_bugbear", type: "hunt", mobId: "bugbear", floorId: 1, target: 5, gold: 220, xp: 160, rep: 1, desc: "Багбиры ломают изгороди по краю Тёмного Леса (Этаж 1, зона 3)." },
  { id: "hc_kobold_servant", type: "hunt", mobId: "kobold_servant", floorId: 2, target: 5, gold: 280, xp: 190, rep: 1, desc: "Кобольдские слуги таскают руду наверх и путаются под ногами у караванов (Этаж 2)." },
  { id: "hc_kobold_overseer", type: "hunt", mobId: "kobold_overseer", floorId: 2, target: 5, gold: 300, xp: 210, rep: 1, desc: "Надсмотрщики сгоняют кобольдов в шахты и не дают им разбежаться (Этаж 2)." },
  { id: "hc_unquiet_ghost", type: "hunt", mobId: "unquiet_ghost", floorId: 3, target: 5, gold: 380, xp: 250, rep: 1, desc: "Призраки шепчут путникам странные вещи (Этаж 3)." },
  { id: "hc_crypt_ghoul", type: "hunt", mobId: "crypt_ghoul", floorId: 3, target: 5, gold: 400, xp: 270, rep: 1, desc: "Упыри растащили половину старого кладбища (Этаж 3)." },
  { id: "hc_orc_shaman", type: "hunt", mobId: "orc_shaman", floorId: 4, target: 5, gold: 460, xp: 310, rep: 1, desc: "Орочьи шаманы варят у костров что-то зловещее (Этаж 4)." },
  { id: "hc_ogre_brute", type: "hunt", mobId: "ogre_brute", floorId: 4, target: 5, gold: 520, xp: 350, rep: 1, desc: "Огр выворачивает валуны прямо на тракте (Этаж 4)." },
  { id: "hc_hell_hound", type: "hunt", mobId: "hell_hound", floorId: 5, target: 5, gold: 600, xp: 400, rep: 1, desc: "Гончие псарни Бездны вырвались на прогалины (Этаж 5)." },
  { id: "hc_horned_devil", type: "hunt", mobId: "horned_devil", floorId: 5, target: 5, gold: 680, xp: 450, rep: 1, desc: "Рогатый дьявол вершит свой суд на пятом ярусе (Этаж 5)." },
];

const MOB_ICONS = {
  goblin_scout: "assets/mobs/goblin_scout.webp",
  goblin_archer: "assets/mobs/goblin_scout.webp",
  goblin_shaman: "assets/mobs/goblin_scout.webp",
  goblin_berserker: "assets/mobs/hobgoblin.webp",
  hobgoblin: "assets/mobs/hobgoblin.webp",
  bugbear: "assets/mobs/bugbear.webp",
  bugbear_chief: "assets/mobs/bugbear.webp",
  goblin_chief: "assets/mobs/goblin_chief.webp",
  kobold_miner: "assets/mobs/kobold_miner.webp",
  kobold_servant: "assets/mobs/kobold_servant.webp",
  kobold_rat: "assets/mobs/kobold_servant.webp",
  kobold_caster: "assets/mobs/kobold_servant.webp",
  kobold_overseer: "assets/mobs/kobold_overseer.webp",
  kobold_zealot: "assets/mobs/kobold_overseer.webp",
  dragonborn: "assets/mobs/dragonborn.webp",
  skeleton_warrior: "assets/mobs/skeleton_warrior.webp",
  skeleton_archer: "assets/mobs/skeleton_warrior.webp",
  skeleton_knight: "assets/mobs/skeleton_warrior.webp",
  crypt_rat: "🐀",
  zombie: "🧟",
  unquiet_ghost: "assets/mobs/unquiet_ghost.webp",
  wraith: "assets/mobs/unquiet_ghost.webp",
  crypt_ghoul: "assets/mobs/crypt_ghoul.webp",
  dark_knight: "assets/mobs/dark_knight.webp",
  drowned: "🧟",
  crab: "🦀",
  eel: "⚡",
  gatekeeper: "🐙",
  golem: "🗿",
  shard: "🔷",
  wisp: "✨",
  sentinel: "💠",
  shadow: "🌑",
  fallen: "🗡️",
  whisper: "🔮",
  lord: "👑",
  demon_lord: "👹",
};

const RESOURCE_ICONS = {
  rust: "assets/resources/rust.webp",
  mushroom: "assets/resources/mushroom.webp",
  malachite: "assets/resources/malachite.webp",
  bone: "assets/resources/bone.webp",
  herb: "🌿",
  silver: "💍",
  iron: "🛠️",
  algae: "🌱",
  topaz: "🔶",
  steel: "⚔️",
  crystal_herb: "🌸",
  ruby: "🔴",
  obsidian: "⬛",
  shadow_herb: "🖤",
  diamond: "💎",
  wood: "🪵",
  cloth: "🧵",
  leather: "🧶",
  iron_ore: "⛏️",
  coral: "🪸",
  scale: "🐟",
  crystal_shard: "🔹",
  essence: "✨",
  void_dust: "🌑",
  dragon_scale: "🐉",
};

function resolveIcon(icon) {
  if (!icon) return "";
  if (icon.startsWith("assets/")) return icon;
  return MOB_ICONS[icon] || RESOURCE_ICONS[icon] || icon;
}

function enemy(def) {
  return { prefers: ["chest"], armorType: "leather", gold: 10, xp: 10, ...def, maxHp: def.hp };
}

const FLOORS = [
  { id: 1, name: "Тёмный Лес", subtitle: "Гиблое место, облюбованное гоблинскими племенами", icon: "🕳️",
    desc: "Лес, который не подчиняется законам природы. Деревья растут из камня, а звери не боятся огня. Гоблины здесь не живут — они прячутся. В корнях, что помнят другой мир.",
    cardImg: "assets/backgrounds/duskwood.webp",
    bg: "assets/backgrounds/duskwood.webp",
    mobs: [
      enemy({ id: "goblin_scout", name: "Гоблин-разведчик", icon: "goblin_scout", zone: 1, hp: 200, atk: 24, str: 8, agi: 18, int: 6, def: 6, gold: 25, xp: 40, armorType: "leather", weapons: ["rusty_knife", "iron_short_sword", "wood_club", "iron_hatchet"], prefers: ["legs", "belly"], desc: "Мелкий и юркий. Пытается зайти со спины и пырнуть ножом в бок.",
        drops: [
          { id: "rust", chance: 0.35, min: 1, max: 2 },
          { id: "cloth", chance: 0.25, min: 1, max: 2 },
        ] }),
      enemy({ id: "goblin_archer", name: "Гоблин-лучник", icon: "goblin_archer", zone: 1, hp: 180, atk: 20, str: 7, agi: 20, int: 7, def: 4, gold: 22, xp: 36, armorType: "leather", weapons: ["rusty_knife", "iron_hatchet"], prefers: ["head", "legs"], desc: "Щуплый гоблин с грубым самодельным луком. Держится позади сородичей и бьёт исподтишка.",
        drops: [
          { id: "rust", chance: 0.30, min: 1, max: 2 },
          { id: "wood", chance: 0.30, min: 1, max: 2 },
        ] }),
      enemy({ id: "hobgoblin", name: "Хобгоблин", icon: "hobgoblin", zone: 2, hp: 320, atk: 31, str: 10, agi: 16, int: 8, def: 10, gold: 35, xp: 55, armorType: "leather", weapons: ["wood_club", "iron_short_sword", "iron_great_axe"], prefers: ["head", "chest"], canUseHeavyStrike: true, desc: "Крупнее и злее своих сородичей. Носит грубые кожаные доспехи и машет дубиной.",
        drops: [
          { id: "leather", chance: 0.30, min: 1, max: 2 },
          { id: "wood", chance: 0.20, min: 1, max: 2 },
        ] }),
      enemy({ id: "goblin_shaman", name: "Гоблин-шаман", icon: "goblin_shaman", zone: 2, hp: 250, atk: 28, str: 8, agi: 12, int: 22, def: 8, gold: 30, xp: 48, armorType: "cloth", weapons: ["wood_club", "iron_mace"], prefers: ["head", "belly"], desc: "Полубезумный гоблин в костяных побрякушках. Швыряет в лицо горсти едкой трухи и бьёт дубиной.",
        drops: [
          { id: "mushroom", chance: 0.35, min: 1, max: 2 },
          { id: "bone", chance: 0.25, min: 1, max: 2 },
        ] }),
      enemy({ id: "bugbear", name: "Багбир", icon: "bugbear", zone: 3, hp: 450, atk: 41, str: 23, agi: 5, int: 5, def: 14, gold: 50, xp: 75, armorType: "leather", weapons: ["wood_club", "iron_great_axe"], prefers: ["chest", "belly"], canUseHeavyStrike: true, desc: "Медлительный и уродливый гигант. Каждый его удар проламывает кости.",
        drops: [
          { id: "bone", chance: 0.35, min: 1, max: 3 },
          { id: "iron_ore", chance: 0.20, min: 1, max: 1 },
        ] }),
      enemy({ id: "goblin_berserker", name: "Гоблин-берсерк", icon: "goblin_berserker", zone: 3, hp: 380, atk: 38, str: 18, agi: 14, int: 5, def: 12, gold: 42, xp: 64, armorType: "leather", weapons: ["iron_great_axe", "wood_club", "iron_hatchet"], prefers: ["head", "chest"], canUseHeavyStrike: true, desc: "Заросший шрамами гоблин в боевом трансе. Не защищается, а только рубит и рубит, пока стоит.",
        drops: [
          { id: "leather", chance: 0.30, min: 1, max: 2 },
          { id: "bone", chance: 0.25, min: 1, max: 2 },
        ] }),
      enemy({ id: "bugbear_chief", name: "Багбир-вожак", icon: "bugbear_chief", zone: 4, hp: 550, atk: 45, str: 26, agi: 7, int: 6, def: 20, gold: 66, xp: 95, armorType: "chain", weapons: ["iron_great_axe", "iron_mace"], prefers: ["head", "chest", "belly"], canUseHeavyStrike: true, desc: "Самый крупный багбир племени, увешанный чужими трофеями. Его удар валит с ног, а рёв сбивает с толку.",
        drops: [
          { id: "bone", chance: 0.40, min: 2, max: 3 },
          { id: "iron_ore", chance: 0.30, min: 1, max: 2 },
          { id: "leather", chance: 0.25, min: 1, max: 2 },
        ] }),
    ],
    boss: enemy({ id: "goblin_chief", name: "Вождь Гоблинов", icon: "goblin_chief", hp: 1150, atk: 54, str: 34, agi: 32, int: 30, def: 36, gold: 250, xp: 300, armorType: "plate", weapons: ["iron_great_sword"], prefers: ["head", "chest", "belly"], boss: true, enrage: true, desc: "Огромный, покрытый шрамами гоблин. Вооружен ржатым тесаком. В ярости его удары сокрушают всё.",
      drops: [
        { id: "set_miner_chest", chance: 1.0, min: 1, max: 1, kind: "item", rarity: "legendary" },
        { id: "malachite", chance: 0.60, min: 2, max: 3 },
      ] }),
  },
  // === FLOORS[1] — Кобольды (шахты) ===
  { id: 2, name: "Шахты Кобольдов", subtitle: "Под землёй стучат кирки, и стук всё ближе", icon: "⚙️",
    desc: "Шахты, вырубленные в теле мира. Кобольды добывают руду, которой нет в нашем мире. Стук кирок не смолкает — он просто становится ближе.",
    cardImg: "assets/backgrounds/mines.webp",
    bg: "assets/backgrounds/mines.webp",
    mobs: [
      enemy({ id: "kobold_servant", name: "Кобольд-слуга", icon: "kobold_servant", zone: 1, hp: 350, atk: 42, str: 9, agi: 11, int: 16, def: 8, gold: 55, xp: 75, armorType: "cloth", weapons: ["rusty_knife", "wood_club", "iron_short_sword"], prefers: ["waist", "legs"],
        desc: "Тощий кобольд в грязном тряпье, вечно таскающий инструменты за старшими. В драку лезет неохотно, но бьёт низко — в пояс и ноги, норовя подрезать сухожилия.",
        drops: [
          { id: "copper_ore", chance: 0.35, min: 1, max: 2 },
          { id: "cave_mushroom", chance: 0.3, min: 1, max: 2 },
          { id: "kobold_gear", chance: 0.25, min: 1, max: 1 },
        ] }),
      enemy({ id: "kobold_rat", name: "Кобольд-крыса", icon: "kobold_rat", zone: 1, hp: 260, atk: 34, str: 6, agi: 20, int: 10, def: 5, gold: 42, xp: 58, armorType: "cloth", weapons: ["rusty_knife", "claws"], prefers: ["legs", "waist"],
        desc: "Самый мелкий и трусливый из кобольдов. Шныряет в темноте, кусает за ноги и сразу отскакивает назад.",
        drops: [
          { id: "copper_ore", chance: 0.30, min: 1, max: 2 },
          { id: "cave_mushroom", chance: 0.25, min: 1, max: 1 },
        ] }),
      enemy({ id: "kobold_miner", name: "Кобольд-рудокоп", icon: "kobold_miner", zone: 2, hp: 500, atk: 48, str: 12, agi: 10, int: 18, def: 12, gold: 68, xp: 90, armorType: "leather", weapons: ["iron_mace", "iron_short_sword", "rusty_knife"], prefers: ["waist", "legs"],
        desc: "Маленький, горбатый от многолетней работы в забое. Размахивает киркой, целясь в ноги и пояс — туда, где металл не прикрывает тело.",
        drops: [
          { id: "copper_ore", chance: 0.4, min: 1, max: 2 },
          { id: "tin_ore", chance: 0.3, min: 1, max: 2 },
          { id: "cold_iron_ingot", chance: 0.2, min: 1, max: 1 },
          { id: "kobold_gear", chance: 0.2, min: 1, max: 1 },
        ] }),
      enemy({ id: "kobold_caster", name: "Кобольд-колдун", icon: "kobold_caster", zone: 2, hp: 420, atk: 46, str: 8, agi: 10, int: 26, def: 10, gold: 72, xp: 95, armorType: "cloth", weapons: ["iron_short_sword", "wood_club"], prefers: ["head", "belly"],
        desc: "Кобольд в балахоне, обвешанный светящимися кристаллами. Шепчет заклинания и жжёт неосторожных холодным пламенем.",
        drops: [
          { id: "cave_mushroom", chance: 0.35, min: 1, max: 2 },
          { id: "rune_dust", chance: 0.25, min: 1, max: 1 },
          { id: "kobold_gear", chance: 0.2, min: 1, max: 1 },
        ] }),
      enemy({ id: "kobold_overseer", name: "Кобольд-надсмотрщик", icon: "kobold_overseer", zone: 3, hp: 650, atk: 56, str: 15, agi: 9, int: 19, def: 16, gold: 86, xp: 116, armorType: "chain", weapons: ["iron_mace", "iron_short_sword", "iron_great_axe"], prefers: ["belly", "chest"], blocks: 2,
        desc: "Широкоплечий кобольд в кольчуге, с плетью на поясе и тяжёлой булавой в лапе. Гоняет сородичей в забой и бьёт в живот и грудь, не давая опомниться.",
        drops: [
          { id: "cold_iron_ingot", chance: 0.3, min: 1, max: 2 },
          { id: "steel", chance: 0.2, min: 1, max: 1 },
          { id: "kobold_gear", chance: 0.3, min: 1, max: 2 },
        ] }),
      enemy({ id: "kobold_zealot", name: "Кобольд-фанатик", icon: "kobold_zealot", zone: 4, hp: 720, atk: 64, str: 18, agi: 12, int: 14, def: 22, gold: 110, xp: 150, armorType: "chain", weapons: ["iron_great_axe", "iron_mace"], prefers: ["chest", "head"], canUseHeavyStrike: true,
        desc: "Одержимый кобольд с обожжённой мордой и секирой в лапах. Считает смерть в бою высшей наградой и не отступает никогда.",
        drops: [
          { id: "cold_iron_ingot", chance: 0.35, min: 1, max: 2 },
          { id: "steel", chance: 0.25, min: 1, max: 1 },
          { id: "kobold_gear", chance: 0.35, min: 1, max: 2 },
        ] }),
    ],
    boss: enemy({ id: "dragonborn", name: "Драконид", icon: "dragonborn", hp: 1728, atk: 92, str: 36, agi: 33, int: 32, def: 38, gold: 660, xp: 880, armorType: "plate", weapons: ["coldsteel_great_sword"], prefers: ["chest", "head"], blocks: 3, boss: true, enrage: true,
      desc: "Чешуйчатый гигант в тяжёлых латах, поднявшийся из глубин вместе с кобольдами. Двуручный клинок в его лапах описывает широкую дугу, доставая сразу две зоны.",
      drops: [
        { id: "set_miner_head", chance: 1.0, min: 1, max: 1, kind: "item", rarity: "legendary" },
        { id: "cold_iron_ingot", chance: 0.6, min: 2, max: 3 },
        { id: "steel", chance: 0.5, min: 1, max: 2 },
      ] }),
  },
  // === FLOORS[2] — Нежить (склеп) ===
  { id: 3, name: "Древний Склеп", subtitle: "Лишённые покоя не ведают жалости", icon: "💀",
    desc: "Склеп, где время течёт вспять. Мертвые не спят, а ждут. Свет факела здесь стареет быстрее, чем ты успеваешь моргнуть.",
    cardImg: "assets/backgrounds/crypt.webp",
    bg: "assets/backgrounds/crypt.webp",
    mobs: [
      enemy({ id: "skeleton_warrior", name: "Скелет-воин", icon: "skeleton_warrior", zone: 1, hp: 504, atk: 62, str: 20, agi: 12, int: 6, def: 14, gold: 96, xp: 136, armorType: "chain", weapons: ["runic_short_sword", "runic_spear", "runic_great_axe"], prefers: ["chest", "legs"],
        desc: "Восставший из старой могилы скелет, стиснувший ржавый клинок. Бьёт по корпусу и ногам, не зная ни боли, ни усталости.",
        drops: [
          { id: "bone", chance: 0.4, min: 1, max: 2 },
          { id: "grave_iron", chance: 0.25, min: 1, max: 2 },
          { id: "copper_ore", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ id: "crypt_rat", name: "Могильная крыса", icon: "crypt_rat", zone: 1, hp: 380, atk: 50, str: 8, agi: 22, int: 4, def: 10, gold: 78, xp: 110, armorType: "cloth", weapons: ["claws"], unarmedStyle: "piercing", prefers: ["legs", "belly"],
        desc: "Раздутая крыса, вырытая из могильной земли. Быстро снуёт между надгробий и вцепляется в ноги острыми резцами.",
        drops: [
          { id: "bone", chance: 0.35, min: 1, max: 2 },
          { id: "cursed_cloth", chance: 0.2, min: 1, max: 1 },
        ] }),
      enemy({ id: "unquiet_ghost", name: "Неупокоенный призрак", icon: "unquiet_ghost", zone: 2, hp: 567, atk: 66, str: 12, agi: 10, int: 28, def: 16, gold: 108, xp: 150, armorType: "cloth", weapons: ["runic_maul"], prefers: ["head", "belly"],
        desc: "Полупрозрачный силуэт, что тянет к вам ледяные пальцы. Его шёпот ввинчивается в голову, а удары проходят сквозь броню.",
        drops: [
          { id: "rune_dust", chance: 0.35, min: 1, max: 2 },
          { id: "cursed_cloth", chance: 0.25, min: 1, max: 2 },
          { id: "tin_ore", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ id: "skeleton_archer", name: "Скелет-лучник", icon: "skeleton_archer", zone: 2, hp: 540, atk: 68, str: 14, agi: 20, int: 6, def: 18, gold: 110, xp: 150, armorType: "chain", weapons: ["runic_short_sword", "runic_spear"], prefers: ["head", "legs"],
        desc: "Скелет с обломками костяного лука в руках. Стреляет из темноты, а если подойти вплотную — бьёт костяным клинком.",
        drops: [
          { id: "bone", chance: 0.4, min: 1, max: 2 },
          { id: "grave_iron", chance: 0.25, min: 1, max: 2 },
        ] }),
      enemy({ id: "crypt_ghoul", name: "Упырь", icon: "crypt_ghoul", zone: 3, hp: 630, atk: 72, str: 24, agi: 16, int: 4, def: 21, gold: 124, xp: 166, armorType: "cloth", weapons: ["claws"], unarmedStyle: "piercing", prefers: ["waist", "chest"],
        desc: "Сгорбленный пожиратель падали с длинными когтями. Рвётся к животу и поясу, чтобы добраться до плоти.",
        drops: [
          { id: "bone", chance: 0.35, min: 1, max: 2 },
          { id: "grave_iron", chance: 0.25, min: 1, max: 2 },
          { id: "kobold_gear", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ id: "zombie", name: "Зомби", icon: "zombie", zone: 3, hp: 760, atk: 78, str: 26, agi: 5, int: 3, def: 24, gold: 130, xp: 174, armorType: "cloth", weapons: ["claws"], unarmedStyle: "bludgeoning", prefers: ["chest", "head"],
        desc: "Медленно бредущий мертвец с раздутыми руками. Не чувствует ударов и тянется к горлу, пока его не развалить на части.",
        drops: [
          { id: "bone", chance: 0.45, min: 1, max: 3 },
          { id: "cursed_cloth", chance: 0.3, min: 1, max: 2 },
        ] }),
      enemy({ id: "skeleton_knight", name: "Скелет-рыцарь", icon: "skeleton_knight", zone: 4, hp: 980, atk: 96, str: 30, agi: 12, int: 10, def: 30, gold: 205, xp: 285, armorType: "plate", weapons: ["runic_great_sword", "runic_spear"], prefers: ["chest", "head"], blocks: 2, canUseHeavyStrike: true,
        desc: "Кости в проржавевших латах, сжимающие двуручный клинок. Держит строй в одиночку и рубит так же, как при жизни.",
        drops: [
          { id: "steel", chance: 0.35, min: 1, max: 2 },
          { id: "grave_iron", chance: 0.35, min: 1, max: 2 },
          { id: "bone", chance: 0.3, min: 1, max: 2 },
        ] }),
      enemy({ id: "wraith", name: "Тень", icon: "wraith", zone: 4, hp: 820, atk: 92, str: 10, agi: 22, int: 34, def: 26, gold: 195, xp: 275, armorType: "cloth", weapons: ["runic_maul", "claws"], prefers: ["head", "belly"],
        desc: "Сгусток тьмы, принявший человеческий облик. Проходит сквозь камень и гасит факелы, а его прикосновение вытягивает тепло из костей.",
        drops: [
          { id: "rune_dust", chance: 0.4, min: 1, max: 2 },
          { id: "cursed_cloth", chance: 0.3, min: 1, max: 2 },
        ] }),
    ],
    boss: enemy({ id: "dark_knight", name: "Тёмный Рыцарь", icon: "dark_knight", hp: 2520, atk: 115, str: 38, agi: 31, int: 30, def: 40, gold: 960, xp: 1280, armorType: "plate", weapons: ["runic_great_sword"], prefers: ["head", "chest", "belly"], boss: true, enrage: true,
      desc: "Павший паладин, чьи латы покрыты пеплом и копотью. В ярости его клинок крошит камень и кости.",
      drops: [
        { id: "set_guard_chest", chance: 1.0, min: 1, max: 1, kind: "item", rarity: "legendary" },
        { id: "grave_iron", chance: 0.6, min: 2, max: 3 },
        { id: "rune_dust", chance: 0.5, min: 1, max: 2 },
      ] }),
  },
  // === FLOORS[3] — Орки и огры ===
  { id: 4, name: "Лагерь Орков", subtitle: "Пахнет костром, дёгтем и свежей кровью", icon: "🐗",
    desc: "Лагерь орков, пришедших из другого плана. Здесь нет места жалости. Костры горят без дров, а тени падают не в ту сторону.",
    cardImg: "assets/backgrounds/orc_camp.webp",
    bg: "assets/backgrounds/orc_camp.webp",
    mobs: [
      enemy({ id: "orc_raider", name: "Орк-налётчик", icon: "🐗", zone: 1, hp: 828, atk: 91, str: 30, agi: 18, int: 8, def: 30, gold: 145, xp: 205, armorType: "chain", weapons: ["runic_great_axe", "runic_mace", "runic_short_sword"], prefers: ["head", "chest"],
        desc: "Свирепый налётчик, чья секира помнит десятки черепов. Рубит сверху, целясь в голову и грудь.",
        drops: [
          { id: "iron_chain", chance: 0.35, min: 1, max: 2 },
          { id: "orc_tusk", chance: 0.3, min: 1, max: 2 },
          { id: "bone", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ id: "orc_shaman", name: "Орк-шаман", icon: "🐺", zone: 2, hp: 900, atk: 96, str: 18, agi: 14, int: 32, def: 22, gold: 158, xp: 215, armorType: "cloth", weapons: ["runic_maul"], prefers: ["belly", "waist"],
        desc: "Шаман, обвешанный костями и амулетами. Его проклятия бьют в живот и пояс, пока он бормочет боевые молитвы.",
        drops: [
          { id: "blood_herb", chance: 0.35, min: 1, max: 2 },
          { id: "war_crystal", chance: 0.25, min: 1, max: 2 },
          { id: "rune_dust", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ id: "ogre_brute", name: "Огр-громила", icon: "👹", zone: 3, hp: 990, atk: 102, str: 34, agi: 8, int: 6, def: 34, gold: 170, xp: 230, armorType: "plate", weapons: ["runic_maul", "runic_great_axe", "runic_great_sword"], prefers: ["chest", "legs"],
        desc: "Гора мяса и шрамов, вооружённая вырванным из земли валуном. Бьёт по груди и ногам — медленно, но смертельно.",
        drops: [
          { id: "mithril_ore", chance: 0.35, min: 1, max: 2 },
          { id: "orc_tusk", chance: 0.3, min: 1, max: 2 },
          { id: "silver", chance: 0.2, min: 1, max: 2 },
        ] }),
    ],
    boss: enemy({ id: "orc_warlord", name: "Вождь орков", icon: "🐗", hp: 3960, atk: 163, str: 40, agi: 30, int: 28, def: 40, gold: 1360, xp: 1840, armorType: "plate", weapons: ["runic_maul"], prefers: ["head", "chest", "belly"], boss: true, enrage: true,
      desc: "Вождь, чьи латы кованы из обломков осадных машин. В ярости он сминает строй одним ударом.",
      drops: [
        { id: "mithril_chest", chance: 1.0, min: 1, max: 1, kind: "item", rarity: "legendary" },
        { id: "war_crystal", chance: 0.6, min: 2, max: 3 },
        { id: "mithril_ore", chance: 0.5, min: 1, max: 2 },
      ] }),
  },
// === FLOORS[4] — Демонический план ===
  { id: 5, name: "Демонический План", subtitle: "Разрыв в реальности, и из него течёт сера", icon: "🔥",
    desc: "Демонический план, где реальность плавится. Это не место. Это состояние. Сера хрустит под ногами, а воздух помнит чужие имена.",
    cardImg: "assets/backgrounds/hell_plane.webp",
    bg: "assets/backgrounds/hell_plane.webp",
    mobs: [
      enemy({ id: "fire_imp", name: "Огненный бес", icon: "🔥", zone: 1, hp: 918, atk: 125, str: 22, agi: 34, int: 24, def: 18, gold: 184, xp: 274, armorType: "cloth", weapons: ["runic_rapier", "runic_maul"], prefers: ["belly", "waist"],
        desc: "Мелкий бес, объятый пламенем, что хихикает из дыма. Жалит в живот и пояс, пока вы ищете его в огне.",
        drops: [
          { id: "brimstone", chance: 0.35, min: 1, max: 2 },
          { id: "infernal_ash", chance: 0.3, min: 1, max: 2 },
          { id: "war_crystal", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ id: "hell_hound", name: "Адская гончая", icon: "🐺", zone: 2, hp: 990, atk: 130, str: 28, agi: 36, int: 10, def: 22, gold: 190, xp: 280, armorType: "leather", weapons: ["claws", "runic_rapier"], unarmedStyle: "piercing", prefers: ["head", "chest"],
        desc: "Адская гончая с глазами-углями и клыками длиной в кинжал. Рвётся к горлу и груди.",
        drops: [
          { id: "hellstone", chance: 0.35, min: 1, max: 2 },
          { id: "demon_horn", chance: 0.25, min: 1, max: 2 },
          { id: "iron_chain", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ id: "horned_devil", name: "Рогатый дьявол", icon: "🐏", zone: 3, hp: 1080, atk: 138, str: 34, agi: 20, int: 18, def: 34, gold: 200, xp: 290, armorType: "plate", weapons: ["runic_maul", "runic_great_sword", "runic_spear"], prefers: ["chest", "head"],
        desc: "Рогатый дьявол в багровых латах, вооружённый чёрным клинком. Бьёт в грудь и голову, наслаждаясь чужой болью.",
        drops: [
          { id: "demon_horn", chance: 0.35, min: 1, max: 2 },
          { id: "void_crystal", chance: 0.25, min: 1, max: 2 },
          { id: "mithril_ore", chance: 0.2, min: 1, max: 2 },
        ] }),
    ],
    boss: enemy({ id: "demon_lord", name: "Владыка Бездны", icon: "👹", hp: 4320, atk: 221, str: 40, agi: 34, int: 36, def: 40, gold: 1600, xp: 2320, armorType: "plate", weapons: ["runic_great_sword"], prefers: ["head", "chest", "belly"], boss: true, enrage: true,
      desc: "Владыка Бездны, чей трон выкован из проклятых душ. В ярости его удары рвут саму реальность.",
      drops: [
        { id: "set_hellblade_chest", chance: 1.0, min: 1, max: 1, kind: "item", rarity: "legendary" },
        { id: "void_crystal", chance: 0.6, min: 2, max: 3 },
        { id: "hellstone", chance: 0.5, min: 1, max: 2 },
      ] }),
  },
];

const FLOOR_RESOURCES = {
  1: [
    { id: "rust", name: "Ржавый хлам", icon: "rust", minAmount: 1, maxAmount: 3, sellPrice: 5, npc: "ron" },
    { id: "mushroom", name: "Бледный гриб", icon: "mushroom", minAmount: 1, maxAmount: 3, sellPrice: 6, npc: "elain" },
    { id: "malachite", name: "Малахит", icon: "malachite", minAmount: 1, maxAmount: 3, sellPrice: 7, npc: "elize" },
    { id: "wood", name: "Кривая доска", icon: "wood", minAmount: 1, maxAmount: 3, sellPrice: 4, npc: "ron" },
    { id: "cloth", name: "Обрывок ткани", icon: "cloth", minAmount: 1, maxAmount: 3, sellPrice: 5, npc: "elain" },
    { id: "leather", name: "Кусок кожи", icon: "leather", minAmount: 1, maxAmount: 2, sellPrice: 6, npc: "ron" },
    { id: "iron_ore", name: "Железная руда", icon: "iron_ore", minAmount: 1, maxAmount: 2, sellPrice: 9, npc: "ron" },
  ],
// === FLOOR_RESOURCES[2..5] ===
  2: [
    { id: "copper_ore", name: "Медная руда", icon: "🟠", minAmount: 1, maxAmount: 3, sellPrice: 18, npc: "ron" },
    { id: "tin_ore", name: "Оловянная руда", icon: "⚪", minAmount: 1, maxAmount: 3, sellPrice: 20, npc: "ron" },
    { id: "kobold_gear", name: "Шестерёнка", icon: "⚙️", minAmount: 1, maxAmount: 3, sellPrice: 22, npc: "elize" },
    { id: "cave_mushroom", name: "Пещерный гриб", icon: "🍄", minAmount: 1, maxAmount: 3, sellPrice: 20, npc: "elain" },
    { id: "cold_iron_ingot", name: "Слиток холодного железа", icon: "🟫", minAmount: 1, maxAmount: 3, sellPrice: 25, npc: "ron" },
    { id: "steel", name: "Стальной слиток", icon: "steel", minAmount: 1, maxAmount: 2, sellPrice: 25, npc: "ron" },
    { id: "cloth", name: "Обрывок ткани", icon: "cloth", minAmount: 1, maxAmount: 3, sellPrice: 5, npc: "elain" }, // базовый ресурс
    { id: "leather", name: "Кусок кожи", icon: "leather", minAmount: 1, maxAmount: 2, sellPrice: 6, npc: "ron" }, // базовый ресурс
    { id: "wood", name: "Кривая доска", icon: "wood", minAmount: 1, maxAmount: 3, sellPrice: 4, npc: "ron" }, // базовый ресурс
  ],
  3: [
    { id: "bone", name: "Кости", icon: "🦴", minAmount: 1, maxAmount: 3, sellPrice: 12, npc: "ron" },
    { id: "grave_iron", name: "Могильное железо", icon: "⚔️", minAmount: 1, maxAmount: 3, sellPrice: 28, npc: "ron" },
    { id: "rune_dust", name: "Рунная пыль", icon: "✨", minAmount: 1, maxAmount: 3, sellPrice: 32, npc: "elain" },
    { id: "silver", name: "Серебро", icon: "💍", minAmount: 1, maxAmount: 3, sellPrice: 15, npc: "elize" },
    { id: "cursed_cloth", name: "Проклятая ткань", icon: "🧵", minAmount: 1, maxAmount: 3, sellPrice: 25, npc: "elain" },
  ],
  4: [
    { id: "mithril_ore", name: "Мифриловая руда", icon: "🔵", minAmount: 1, maxAmount: 3, sellPrice: 35, npc: "ron" },
    { id: "orc_tusk", name: "Клык орка", icon: "🦷", minAmount: 1, maxAmount: 3, sellPrice: 32, npc: "ron" },
    { id: "blood_herb", name: "Кровавая трава", icon: "🌿", minAmount: 1, maxAmount: 3, sellPrice: 38, npc: "elain" },
    { id: "war_crystal", name: "Боевой кристалл", icon: "🔮", minAmount: 1, maxAmount: 3, sellPrice: 40, npc: "elize" },
    { id: "iron_chain", name: "Железная цепь", icon: "⛓️", minAmount: 1, maxAmount: 3, sellPrice: 42, npc: "ron" },
  ],
  5: [
    { id: "hellstone", name: "Адский камень", icon: "🪨", minAmount: 1, maxAmount: 3, sellPrice: 55, npc: "ron" },
    { id: "brimstone", name: "Сера", icon: "🟡", minAmount: 1, maxAmount: 3, sellPrice: 58, npc: "elain" },
    { id: "demon_horn", name: "Рог демона", icon: "🐏", minAmount: 1, maxAmount: 3, sellPrice: 60, npc: "elize" },
    { id: "void_crystal", name: "Кристалл пустоты", icon: "🔮", minAmount: 1, maxAmount: 3, sellPrice: 62, npc: "elize" },
    { id: "infernal_ash", name: "Адский пепел", icon: "🌫️", minAmount: 1, maxAmount: 3, sellPrice: 58, npc: "elain" },
  ],
};

const ALL_RESOURCES = Object.values(FLOOR_RESOURCES).flat();

// ── Сцены (Этап 2) ─────────────────────────────────────────────────────────
// Текстовые события с выборами. Выпадают при исследовании (10%).
// group — индексы мобов этажа для группового боя; actions — кнопки выбора.
// Действия разбирает resolveSceneAction (ui.js): stealth/fight/dig/leave.
const FLOOR_SCENES = {
  1: [
    {
      id: "goblin_murmur",
      title: "Гоблинское бормотание",
      text: "За поворотом тропы — гоблинское кострище. Твари бормочут над горшком, спины их повернулись к вам. Можно переждать в кустах, пока они разойдутся, а можно обрушиться на них в лоб.",
      actions: [
        { id: "stealth", label: "🫥 Затаиться" },
        { id: "fight", label: "⚔ Сразиться" },
      ],
      group: [0, 0, 1],
    },
    {
      id: "dark_pit",
      title: "Тёмный провал",
      text: "Тропа обрывается: чёрный провал уходит вниз, оттуда тянет холодом и падалью. Вокруг блестят чьи-то косточки. Можно обойти стороной, а можно спуститься и порыться.",
      actions: [
        { id: "leave", label: "🚶 Обойти" },
        { id: "dig", label: "⛏ Спуститься" },
      ],
      group: [0, 1],
    },
    {
      id: "goblin_deserter",
      title: "Гоблин-дезертир",
      text: "За копной листы прячется гоблин — без доспехов, с перевязанной лапой. Он узнаёт вас и, вздрогнув, тянет лапу к горлу. Не атакует: дезертир из дозора, и опасается своих больше, чем вас.",
      actions: [
        { id: "talk", label: "💬 Заговорить по-доброму" },
        { id: "fight", label: "⚔ Напасть" },
        { id: "leave", label: "🚶 Уйти" },
      ],
      talkOutcome: {
        text: "Дезертир хрипло объясняет: с холма вниз гонят их «дай-дай», высокие и голодные. За обещание не выдавать он тянется к кожаному схрону и отдаёт монеты.",
        gold: [30, 45],
        rumor: "«Пятеро теперь ходят в дозоре. Пятеро! Не ходи вдоль реки — там их логово.»",
      },
      group: [1],
    },
    {
      id: "snares_row",
      title: "Ряд силков",
      text: "Между двумя деревьями натянута бечёвка, и на ней висят силки — чьи-то кроличьи глазницы блестят в петлях. Кто-то подробно ставил ловушки прямо у тропы.",
      actions: [
        { id: "loot", label: "🧰 Осмотреть и обобрать" },
        { id: "leave", label: "🚶 Обойти" },
      ],
      lootOutcome: {
        resource: ["leather", 1, 2],
        gold: [10, 25],
        risk: 0.35,
        failText: "Силок защёлкнулся у вас на запястье — вы едва вырвались.",
      },
      group: [1],
    },
  ],
  2: [
    {
      id: "mine_collapse",
      title: "Обвал в шахте",
      text: "Нависший свод шахты не выдержал — камни хлынули вниз, отрезая проход. В клубах пыли слышится заунывный скрежет кирок: кобольды-рудокопы спешат разрыть завал, а на стене тускло блестит свежая жила меди. Пока твари поглощены работой, можно пробиться сквозь их толпу или тихо уйти.",
      actions: [
        { id: "fight", label: "⚔ Пробиваться сквозь завал" },
        { id: "leave", label: "🚶 Обойти завал" },
      ],
      group: [0, 2],
    },
    {
      id: "kobold_chest",
      title: "Запертый сундук кобольдов",
      text: "В укромной нише стоит сундук, обитый медными полосами и запертый на хитроумный кобольдий замок. Слышно, как внутри перекатывается что-то тяжёлое. Но рядом, за поворотом, стоит стража — она наверняка заметит взлом. Рисковать ли?",
      actions: [
        { id: "dig", label: "⛏ Взломать замок" },
        { id: "leave", label: "🚶 Оставить сундук" },
      ],
      group: [0, 1],
    },
    {
      id: "collapsed_kart",
      title: "Опрокинутая вагонетка",
      text: "У штрека стоит рудная вагонетка — недавний обвал завалил повозку, и она так и осталась наполовину засыпанной. Из-под камней торчит лямка и блестит медью.",
      actions: [
        { id: "loot", label: "🧰 Разгрести завал" },
        { id: "leave", label: "🚶 Обойти" },
      ],
      lootOutcome: {
        resource: ["copper_ore", 1, 3],
        gold: [20, 40],
        risk: 0.3,
        failText: "Вы потянули за лямку — свод крякнул, и камень достал вас по плечу.",
      },
      group: [1, 2],
    },
    {
      id: "kobold_accountant",
      title: "Кобольд-счётовод",
      text: "Кобольд с костяной грифельной доской сидит на перевёрнутой тачке и с усердием ведёт счёт: «доля-доля-жила-жила». Он так увлечён, что не сразу замечает вас.",
      actions: [
        { id: "talk", label: "💬 Заговорить" },
        { id: "fight", label: "⚔ Напасть" },
        { id: "leave", label: "🚶 Уйти" },
      ],
      talkOutcome: {
        text: "Счётовод гордится своим учётом и, поразмыслив, продаёт вам мешочек руды, выкраденный из надсмотрщиковой доли.",
        resource: ["copper_ore", 2, 3],
        rumor: "«Надсмотрщик скрывает долю от большого Коб-холда. Его палата — за наклонными штреками, охрана слаба.»",
      },
      group: [2],
    },
  ],
  3: [
    {
      id: "strange_sarcophagus",
      title: "Странный саркофаг",
      text: "Погребальный зал полон гранитных плит, но лишь один саркофаг стоит на постаменте — с нечеловеческими узорами и тёмными потёками на крышке. Тяжёлая плита сдвинута на ладонь. Склеп терпеливо ждёт: вскроете вы — или это сделает то, что внутри.",
      actions: [
        { id: "dig", label: "⛏ Вскрыть саркофаг" },
        { id: "leave", label: "🚶 Не тревожить покой" },
      ],
      group: [0, 2],
    },
    {
      id: "whispering_shadows",
      title: "Шепчущие тени",
      text: "В узком коридоре тени не совпадают с телами. Что-то шепчет на языке, от которого ноют зубы, — и шёпот складывается в ваше имя. Тени сгущаются, мешаясь с неупокоенными, что бродят между колонн. Развеять? Или пройти мимо, не оборачиваясь?",
      actions: [
        { id: "fight", label: "⚔ Развеять тени" },
        { id: "leave", label: "🚶 Пройти не оборачиваясь" },
      ],
      group: [1, 2],
    },
    {
      id: "mourning_knight",
      title: "Скорбящий рыцарь",
      text: "На краю склепа стоит рыцарь в тусклых латах — не мёртвый, но отлитый в камень скорбью. Он держит шлем как урну с прахом и молчит, глядя в одну точку.",
      actions: [
        { id: "talk", label: "💬 Сказать слово утешения" },
        { id: "fight", label: "⚔ Узнать, кто он" },
        { id: "leave", label: "🚶 Оставить его" },
      ],
      talkOutcome: {
        text: "Рыцарь пришёл сюда искать брата и не нашёл. Он отдаёт вам горсть монет из ниши — «мёртвым они ни к чему» — и оставляет то, что слышал сам.",
        gold: [40, 60],
        rumor: "«Саркофаги здесь ставят не к стене, а по кругу. В центре — тот, кого до сих пор питают молитвы.»",
      },
      group: [1],
    },
    {
      id: "bone_garden",
      title: "Сад из костей",
      text: "Между плит растут кости, будто пшеница: рёбра — стебли, черепа — соцветья. Кто-то заботливо окучивал их руками без ногтей.",
      actions: [
        { id: "loot", label: "🧰 Собрать кости" },
        { id: "leave", label: "🚶 Не трогать" },
      ],
      lootOutcome: {
        resource: ["bone", 2, 3],
        gold: [15, 30],
        risk: 0.4,
        skirmish: [2],
        failText: "Кости хрустнули и сложились в лапы — сад смотрит в ответ.",
      },
      group: [1, 2],
    },
  ],
  4: [
    {
      id: "orc_cage",
      title: "Клетка с пленником",
      text: "Среди орочьих знамён стоит клетка с прутьями из мифрила — внутри мечется измождённый пленник, гость из чужих земель. Рядом лениво прохлаждается дозор: орки и огр-громила. Можно перебить стражу и открыть клетку, а можно уйти, притворившись, что вы не слышите криков.",
      actions: [
        { id: "fight", label: "⚔ Освободить пленника" },
        { id: "leave", label: "🚶 Уйти, не встревая" },
      ],
      group: [0, 2],
    },
    {
      id: "shaman_bonfire",
      title: "Костёр шамана",
      text: "Орк-шаман бросает в пламя горсть кровавой травы, и огонь отвечает зелёным душным светом. В трепещущих тенях угадывается спина огри-телохранителя, а то и чьи-то духи. Костёр тёплый и манящий, но то, о чём шепчет пламя, смертным слушать не велено.",
      actions: [
        { id: "stealth", label: "🫥 Обкрасть костёр" },
        { id: "fight", label: "⚔ Напасть из тени" },
      ],
      group: [1, 2],
    },
    {
      id: "orc_prisoner",
      title: "Пленный у столба",
      text: "К столбу привязан бродяга-человек — то ли обносят его перед казнью, то ли забыли. Орочьи следы вокруг свежие: дозор ушёл, но вернётся.",
      actions: [
        { id: "talk", label: "🗡 Перерезать верёвки" },
        { id: "fight", label: "⚔ Встретить дозор" },
        { id: "leave", label: "🚶 Уйти" },
      ],
      talkOutcome: {
        text: "Пленный шёпотом благодарит: он проводник Гильдии, раненый у орочьего стана. Живым его не сдержать — он уводит вас тропой мимо дозоров.",
        rep: ["hunters", 2],
        rumor: "«Шаманы красят барабаны кровью первую неделю дороги. Пока краска свежа — они бьют сильнее.»",
      },
      group: [0, 2],
    },
    {
      id: "broken_drums",
      title: "Разбитый барабан",
      text: "Главная вышка лагеря опрокинута, а под ней — барабан с проломленным боком. Клыки орков покрывают кожу, кровь на них ещё не обсохла: голос у лагеря один, и он кричит.",
      actions: [
        { id: "loot", label: "🧰 Ободрать кожу и клыки" },
        { id: "fight", label: "⚔ Проверить, кто рядом" },
        { id: "leave", label: "🚶 Уйти" },
      ],
      lootOutcome: {
        resource: ["orc_tusk", 1, 2],
        gold: [25, 45],
        risk: 0.4,
        failText: "Пронзительный лай в стороне: вы уронили барабан и убежали налегке.",
      },
      group: [0],
    },
  ],
  5: [
    {
      id: "abyss_portal",
      title: "Портал в бездну",
      text: "В высокой арке из адского камня чёрный воздух мерцает, будто в нём проступают звёзды чужого неба. Сквозь разрыв тянет не холодом — отсутствием. Дверь стерегут бесы и рогатый дьявол. Одолеть стражей — или тихо отступить от портала?",
      actions: [
        { id: "fight", label: "⚔ Сразить стражей" },
        { id: "leave", label: "🚶 Отступить от портала" },
      ],
      group: [0, 2],
    },
    {
      id: "victim_altar",
      title: "Алтарь с жертвой",
      text: "На алтарной плите извивается прикованный к ней пленник, кровь по желобам стекает к горящей сере. Рогатый дьявол поднимает нож — ритуал на исходе. Можно прервать его, бросившись в середину движения, а можно, пока взоры заняты жертвой, юркнуть к приношениям у алтаря.",
      actions: [
        { id: "fight", label: "⚔ Прервать ритуал" },
        { id: "dig", label: "⛏ Обыскать приношения" },
      ],
      group: [1, 2],
    },
    {
      id: "wounded_ritualist",
      title: "Раненый ритуалист",
      text: "У догорающих углей скорчился человек в алых рясах: рука его обескровлена, на поясе мел и всякие кости. Он выцарапал на камне круг незаконченный — его ритуал сорвали.",
      actions: [
        { id: "talk", label: "💬 Подойти и выслушать" },
        { id: "fight", label: "⚔ Сомкнуть руки на нём" },
        { id: "leave", label: "🚶 Оставить" },
      ],
      talkOutcome: {
        text: "Ритуалист хрипит, что убивал себя ради «нужного слуха» — и одаривает уже вас: «Слушай ниже, воин».",
        rep: ["hunters", 2],
        rumor: "«Броня Владыки не имеет прорех — но в самом сердце уязвим. Дробящий удар точно в грудь, и пехота подступит к нему.»",
      },
      group: [0, 2],
    },
    {
      id: "ash_stash",
      title: "Схрон с пеплом",
      text: "Между обломками цепи спрятан узкий ящик, окованный чёрным железом. Крышка на одной петле, содержимое нетронуто: внутри — горка адского пепла.",
      actions: [
        { id: "loot", label: "🧰 Забрать пепел" },
        { id: "leave", label: "🚶 Оставить бесам" },
      ],
      lootOutcome: {
        resource: ["infernal_ash", 1, 2],
        gold: [35, 55],
        risk: 0.45,
        failText: "Пепел ещё тёплый и ростёт жалящим облаком — вам пришлось отпрыгивать.",
      },
      group: [0, 2],
    },
  ],
};

// ── Дневники по этажам ──────────────────────────────────────────────────────
// Выпадают из событий «труп», «сундук» и убийства охотников. Новый персонаж
// сбрасывает (сейв-совместимость: ключ не сохраняется, а дневники — да).
const FLOOR_DIARY = { 1: "diary_goblin", 2: "diary_goblin", 3: "diary_crypt", 4: "diary_crypt", 5: "diary_hell" };

// ── NPC-охотники (встречи Гильдии на этажах) ────────────────────────────────
// helpNeed: null — помощь по совести (без предмета); { potion: true } — требуется
// любое лечащее зелье; { resource, amount } — требуется ресурс в state.resources.
// killHpMult: у охотника половина HP и опыта моба этажа — дерзко, но честно.
const HUNTER_ENCOUNTERS = [
  {
    id: "novice", name: "Раненый охотник", floors: [1, 2], icon: "🏹",
    text: "Молодой охотник сидит, привалившись к пню, и зажимает порез на боку. Гильдейский капюшон мят, колчан почти пуст: две стрелы и процарапанный клинок.",
    helpNeed: { potion: true },
    helpText: "«Зелье… и я на ногах. Гильдия процентов не забывает.»",
    helpReward: {
      gold: [50, 50],
      rep: ["hunters", 1],
      rumor: "«Гоблинам помогают сверху. Не сверху, а изнутри — их гонит кто-то с пятого яруса.»",
    },
    killHpMult: 0.5,
    killDrop: "diary_goblin",
    killText: "Глаза юнца вспыхивают: «Гильдии… не забуду…»",
  },
  {
    id: "veteran", name: "Странник с картой", floors: [3, 4], icon: "🗺️",
    text: "Старик с картой в кожаном чехле перебинтовывает руку верёвкой, зажав конец зубами. На карте — засечки этажей: он ходит по склепу, как по собственному огороду.",
    helpNeed: { resource: "rune_dust", amount: 1 },
    helpText: "«Рунная пыль — единственное, что держит призраков от моей спины. Поделись, и я расщедрюсь.»",
    helpReward: {
      gold: [80, 80],
      rep: ["hunters", 2],
      rumor: "«Тёмный Рыцарь ещё не мёртв. Его саркофаг полон пустоты — и он точит клинок, когда в склепе темно.»",
    },
    killHpMult: 0.5,
    killDrop: "diary_crypt",
    killText: "Ветеран роняет карту и достаёт копьё. «Эх. Менялись времена…»",
  },
  {
    id: "madman", name: "Безумный отшельник", floors: [5], icon: "🕯️",
    text: "Отшельник сидит в круге свечей и открывает глаза то на один, то на второй огонёк. Он слышит башню насквозь — как колокол.",
    helpNeed: null,
    helpText: "«Сядь, слушай. Я тебе расскажу, где Башня царапает сама себя.»",
    helpReward: {
      gold: [120, 120],
      rep: ["hunters", 3],
      rumor: "«Владыка не броню носит — он носит сердце снаружи. Дробящий удар в грудь сверху — и сердце треснет.»",
    },
    killHpMult: 0.5,
    killDrop: "diary_hell",
    killText: "Отшельник смеётся — не злобно. «Уже кто-то идёт. Уже кто-то идёт.»",
  },
];

// ── Спонтанные события на этажах (FLOOR_EVENTS) ─────────────────────────────
// Не сцены, а случайные встречи при exploreFloor. Разбирает
// resolveFloorEventAction (actions.js); рендерит единая нижняя панель eventSheetHtml (ui-world.js).
// Формат outcome: { chance, effects, text } — chance суммируются от 0 до 1.
// Эффекты: gold([min,max]|n), resource([id,min,max]), potion(id), rep[фракция, n],
// rumor(строка), diary( bool → дневник этажа, если он уже есть — золото),
// skirmish([индексы мобов]), hp([min,max] — урон), xp(n).
const FLOOR_EVENTS = {
  // === Этаж 1: Гоблинские чащи ===
  corpse_f1: {
    id: "corpse_f1", floor: 1, type: "corpse", title: "Тело охотника", icon: "🕯️",
    text: "Вы нашли тело охотника. Рядом — сумка с записями.",
    actions: [
      { id: "search", label: "🖐 Обыскать", outcomes: [
        { chance: 0.30, text: "В сумке — кошель, переживший хозяина.", effects: { gold: [20, 50] } },
        { chance: 0.20, text: "Между стрелами — дневник с набросками первых дней в Башне.", effects: { diary: true } },
        { chance: 0.20, text: "Из карманов — кусок кожи, только что с ловушки.", effects: { resource: ["leather", 1, 2] } },
        { chance: 0.30, text: "Сумка пуста, и лишь сырость говорит за неё.", effects: {} },
      ] },
      { id: "bury", label: "⚰ Похоронить", outcomes: [
        { chance: 1, text: "Вы складываете тело под корни и наваливаете камень. Гильдия таких не забывает.", effects: { rep: ["hunters", 1], potion: "hp_small" } },
      ] },
      { id: "leave", label: "🚶 Пройти мимо", outcomes: [ { chance: 1, text: "Вы идёте дальше.", effects: {} } ] },
    ],
  },
  hunter_f1: {
    id: "hunter_f1", floor: 1, type: "hunter", title: "Фигура в плаще", icon: "🏹",
    text: "Впереди фигура в плаще Гильдии. Ранен, но жив.",
    actions: [
      { id: "approach", label: "👋 Подойти" },
      { id: "pass", label: "🚶 Пройти мимо", outcomes: [ { chance: 1, text: "Вы обходите стороной — не всем охотникам нужно ваше участие.", effects: {} } ] },
    ],
  },
  chest_f1: {
    id: "chest_f1", floor: 1, type: "chest", title: "Сундук с письмом", icon: "✉️",
    text: "Сундук с письмом, приколотым к крышке. Бумага пожелтела, но читается.",
    actions: [
      { id: "open", label: "🔓 Открыть", outcomes: [
        { chance: 0.50, text: "Монеты и связка дневника — «когда кто-то дойдёт». Недельный срок уже вышел.", effects: { gold: [30, 60], diary: true } },
        { chance: 0.50, text: "Монеты. Письмо — лишь про то, что «лес стал подозрительным».", effects: { gold: [30, 60] } },
      ] },
      { id: "leave", label: "🚶 Уйти", outcomes: [ { chance: 1, text: "Пусть весточка лежит дальше.", effects: {} } ] },
    ],
  },
  goblin_totem: {
    id: "goblin_totem", floor: 1, type: "creative", title: "Гоблинский тотем", icon: "🗿",
    text: "На поляне стоит тотем из черепов и пёстрых лент: гоблины оставляют ему добычу и приметы. У подножия — свежие приношения.",
    actions: [
      { id: "desecrate", label: "🧨 Обрушить тотем", outcomes: [
        { chance: 0.30, text: "Тотем рушится, и с него сыпятся приношения — монеты и кости.", effects: { gold: [25, 45] } },
        { chance: 0.35, text: "Тотем трещит, и на шум сбегается дозор.", effects: { skirmish: [0, 1] } },
        { chance: 0.35, text: "Тотем устоял — на свой страх вы сняли лишь пару приношений.", effects: { resource: ["cloth", 1, 2], gold: [5, 15] } },
      ] },
      { id: "steal", label: "🖐 Стянуть приношения", outcomes: [
        { chance: 0.60, text: "Тихо. Вы собираете приношения быстрее, чем их успели запомнить.", effects: { gold: [15, 30], resource: ["leather", 1, 1] } },
        { chance: 0.40, text: "Ветки хрустят, дозор отзывается на звук.", effects: { skirmish: [1] } },
      ] },
      { id: "leave", label: "🚶 Оставить в покое", outcomes: [ { chance: 1, text: "С богами шутить не стоит.", effects: {} } ] },
    ],
  },
  poison_mushroom: {
    id: "poison_mushroom", floor: 1, type: "creative", title: "Сладкий гриб", icon: "🍄",
    text: "У коряги гриб в розовую крапину — пахнет так аппетитно, что это само по себе подозрительно. Шляпка мягкая и подозрительно пружинистая.",
    actions: [
      { id: "eat", label: "🍽 Откусить", outcomes: [
        { chance: 0.40, text: "Волна тепла: голова проясняется и дышится легче.", effects: {} },
        { chance: 0.60, text: "Горечь ударяет в голову и подкашивает.", effects: { hp: [10, 20] } },
      ] },
      { id: "pick", label: "🧺 Срезать для алхимика", outcomes: [
        { chance: 0.80, text: "Гриб аккуратно уложен — Элэйн скажет спасибо.", effects: { potion: "hp_small" } },
        { chance: 0.20, text: "Гриб при срезе брызнул кислотой.", effects: { hp: [5, 10] } },
      ] },
      { id: "leave", label: "🚶 Обойти", outcomes: [ { chance: 1, text: "Лучше смотреть, чем жалеть.", effects: {} } ] },
    ],
  },
  wolf_bait: {
    id: "wolf_bait", floor: 1, type: "creative", title: "Волчья приманка", icon: "🥩",
    text: "На бечёвке между деревьями подвешена приманка — кусок чего-то, обмазанного кровью. Кто-то устроил ловушку на волков: ловит не волков.",
    actions: [
      { id: "take", label: "🖐 Снять приманку", outcomes: [
        { chance: 0.55, text: "Приманка добротная: кожа и жир — со свежего.", effects: { resource: ["leather", 1, 2], gold: [10, 20] } },
        { chance: 0.45, text: "Бечёвка дёргается: с кустов смотрит не волк.", effects: { skirmish: [0] } },
      ] },
      { id: "search", label: "🔍 Осмотреть ловушку", outcomes: [
        { chance: 0.70, text: "Рядом в траве — горсть монет, потерянная ставившим.", effects: { gold: [15, 30] } },
        { chance: 0.30, text: "Лишь следы. Ставивший ушёл — и быстро.", effects: {} },
      ] },
      { id: "leave", label: "🚶 Пройти мимо", outcomes: [ { chance: 1, text: "На чужие ловушки лучше смотреть со стороны.", effects: {} } ] },
    ],
  },
  // === Этаж 2: Кобольдские низы ===
  corpse_f2: {
    id: "corpse_f2", floor: 2, type: "corpse", title: "Тело охотника", icon: "🕯️",
    text: "Вы нашли тело охотника. Рядом — сумка с записями.",
    actions: [
      { id: "search", label: "🖐 Обыскать", outcomes: [
        { chance: 0.30, text: "Кошель и чеканка на стрелах — он был из ближнего круга.", effects: { gold: [20, 50] } },
        { chance: 0.20, text: "Дневник новичка — записи путаются: «второй этаж звенит», «низ звенит».", effects: { diary: true } },
        { chance: 0.20, text: "В развёрнутых карманах — рудная горсть.", effects: { resource: ["copper_ore", 1, 2] } },
        { chance: 0.30, text: "Сумка вывернута: кто-то успел раньше.", effects: {} },
      ] },
      { id: "bury", label: "⚰ Похоронить", outcomes: [
        { chance: 1, text: "Вы заваливаете тело плитой, чтобы кобольды не растащили. Гильдия отвечает малым зельем.", effects: { rep: ["hunters", 1], potion: "hp_small" } },
      ] },
      { id: "leave", label: "🚶 Пройти мимо", outcomes: [ { chance: 1, text: "Тайна — не ваша обязанность.", effects: {} } ] },
    ],
  },
  hunter_f2: {
    id: "hunter_f2", floor: 2, type: "hunter", title: "Фигура в плаще", icon: "🏹",
    text: "Впереди фигура в плаще Гильдии. Ранен, но жив.",
    actions: [
      { id: "approach", label: "👋 Подойти" },
      { id: "pass", label: "🚶 Пройти мимо", outcomes: [ { chance: 1, text: "Вы уходите — Гильдия справится сама.", effects: {} } ] },
    ],
  },
  chest_f2: {
    id: "chest_f2", floor: 2, type: "chest", title: "Сундук с письмом", icon: "✉️",
    text: "Сундук с письмом, приколотым к крышке. Бумага пожелтела, но читается.",
    actions: [
      { id: "open", label: "🔓 Открыть", outcomes: [
        { chance: 0.50, text: "Монеты, и сверху — дневник, брошенный читателем на середине.", effects: { gold: [30, 60], diary: true } },
        { chance: 0.50, text: "Монеты. Письмо — всего пара строк: «второй этаж звенит ночью».", effects: { gold: [30, 60] } },
      ] },
      { id: "leave", label: "🚶 Уйти", outcomes: [ { chance: 1, text: "Не ваше — не тронете.", effects: {} } ] },
    ],
  },
  rusty_drill: {
    id: "rusty_drill", floor: 2, type: "creative", title: "Кобольдская дрель", icon: "⚙️",
    text: "Механизм на ручной тяге: кобольды сверлят им жилу, а не копают. Привод скрипит, но ход жив.",
    actions: [
      { id: "tinker", label: "🔧 Покрутить привод", outcomes: [
        { chance: 0.70, text: "Сверло ходит, и жила подаёт руду.", effects: { resource: ["copper_ore", 1, 3] } },
        { chance: 0.30, text: "Сверло чёркает по пустоте и бьёт искрой в лицо.", effects: { hp: [5, 12] } },
      ] },
      { id: "dismantle", label: "🧰 Разобрать на части", outcomes: [
        { chance: 0.60, text: "Шестерёнки и крепёж желанного вида.", effects: { resource: ["kobold_gear", 1, 2], gold: [10, 25] } },
        { chance: 0.40, text: "Механизм припадает и лязгает зубьями на вашу руку.", effects: { hp: [8, 16] } },
      ] },
      { id: "leave", label: "🚶 Оставить", outcomes: [ { chance: 1, text: "Чужое хозяйство — чужая забота.", effects: {} } ] },
    ],
  },
  rune_door: {
    id: "rune_door", floor: 2, type: "creative", title: "Запертая дверь с рунами", icon: "🚪",
    text: "В нише штрека — дубовая дверь с рунами, вросшая в скалу. Кобольды обходят её суетливо, будто дверь помнит их по именам.",
    actions: [
      { id: "pick", label: "🗝 Вскрыть отмычкой", outcomes: [
        { chance: 0.50, text: "Дверь поддаётся: за ней кобольдский тайник.", effects: { gold: [40, 70], resource: ["tin_ore", 1, 2] } },
        { chance: 0.50, text: "Руны гаснут, и из-за двери тянет холодом.", effects: {} },
      ] },
      { id: "rummage", label: "🔍 Прочесть надписи", outcomes: [
        { chance: 0.80, text: "Руны — старая кобольдская бухгалтерия: имена и доли. Ничего ценного, но занятно.", effects: { rumor: "«Коб-холд держит палату не в глубине — этажом выше. Слушайте счёт.»" } },
        { chance: 0.20, text: "Одна руна кричит в вашей голове — и вы отшатываетесь.", effects: { hp: [4, 10] } },
      ] },
      { id: "leave", label: "🚶 Уйти", outcomes: [ { chance: 1, text: "Дверь имела силы не впускать.", effects: {} } ] },
    ],
  },
  // === Этаж 3: Склеп ===
  corpse_f3: {
    id: "corpse_f3", floor: 3, type: "corpse", title: "Тело охотника", icon: "🕯️",
    text: "Вы нашли тело охотника. Рядом — сумка с записями.",
    actions: [
      { id: "search", label: "🖐 Обыскать", outcomes: [
        { chance: 0.30, text: "Кошель, спрятанный в сапогах — дальновидный был.", effects: { gold: [20, 50] } },
        { chance: 0.20, text: "Дневник ветерана: почерк аккуратный — до самого конца.", effects: { diary: true } },
        { chance: 0.20, text: "Из подсумка — кости и свиток.", effects: { resource: ["bone", 1, 2] } },
        { chance: 0.30, text: "Сумка пуста и мокра, как весь этот склеп.", effects: {} },
      ] },
      { id: "bury", label: "⚰ Похоронить", outcomes: [
        { chance: 1, text: "Вы накрываете тело плащом. Гильдия отвечает малым зельем.", effects: { rep: ["hunters", 1], potion: "hp_small" } },
      ] },
      { id: "leave", label: "🚶 Пройти мимо", outcomes: [ { chance: 1, text: "Склеп не ждёт нежностей.", effects: {} } ] },
    ],
  },
  hunter_f3: {
    id: "hunter_f3", floor: 3, type: "hunter", title: "Фигура в плаще", icon: "🏹",
    text: "Впереди фигура в плаще Гильдии. Ранен, но жив.",
    actions: [
      { id: "approach", label: "👋 Подойти" },
      { id: "pass", label: "🚶 Пройти мимо", outcomes: [ { chance: 1, text: "Вы решаете не мешать охотнику выздоравливать.", effects: {} } ] },
    ],
  },
  chest_f3: {
    id: "chest_f3", floor: 3, type: "chest", title: "Сундук с письмом", icon: "✉️",
    text: "Сундук с письмом, приколотым к крышке. Бумага пожелтела, но читается.",
    actions: [
      { id: "open", label: "🔓 Открыть", outcomes: [
        { chance: 0.50, text: "Монеты и дневник, прикопанный вместе с ними.", effects: { gold: [30, 60], diary: true } },
        { chance: 0.50, text: "Монеты. Письмо умоляет «не верить шёпоту у саркофагов».", effects: { gold: [30, 60] } },
      ] },
      { id: "leave", label: "🚶 Уйти", outcomes: [ { chance: 1, text: "Сундук остаётся при своём.", effects: {} } ] },
    ],
  },
  gravestone_sign: {
    id: "gravestone_sign", floor: 3, type: "creative", title: "Надгробие с надписью", icon: "🪦",
    text: "Гранитное надгробие стоит не к стене, а лицом в проход. «Сначала — мысли. Потом — стена».",
    actions: [
      { id: "read", label: "📜 Прочесть вслух", outcomes: [
        { chance: 0.80, text: "Слова гремят в голове эхом, и тяжёлые мысли отпускают.", effects: { rumor: "«Саркофаги стоят кругом не случайно. В центре — тот, кого ещё питают молитвами.»" } },
        { chance: 0.20, text: "Надгробие отвечает прорезью холода в спину.", effects: { hp: [6, 14] } },
      ] },
      { id: "scrape", label: "🖐 Соскоблить гранит", outcomes: [
        { chance: 0.60, text: "От кромки откалываются куски — гранит и старое железо.", effects: { resource: ["grave_iron", 1, 2] } },
        { chance: 0.40, text: "Рука напарывается на скрытый обломок саркофага.", effects: { hp: [5, 12] } },
      ] },
      { id: "leave", label: "🚶 Обойти", outcomes: [ { chance: 1, text: "Читанное лучше не трогать.", effects: {} } ] },
    ],
  },
  empty_sarcophagus: {
    id: "empty_sarcophagus", floor: 3, type: "creative", title: "Пустой саркофаг", icon: "⚰️",
    text: "Саркофаг открыт и пуст — крышка содрана изнутри, если верить царапинам. Внутри чисто, будто здесь недавно прибирались.",
    actions: [
      { id: "sleep", label: "🌙 Прилечь отдохнуть", outcomes: [
        { chance: 0.45, text: "На удивление — самый спокойный отдых за неделю.", effects: {} },
        { chance: 0.55, text: "Тень накрывает сверху, и вы вскакиваете с холодом в костях.", effects: { hp: [8, 18] } },
      ] },
      { id: "search", label: "🔍 Простукивать дно", outcomes: [
        { chance: 0.65, text: "Под насыпью — кости и запавший кошель.", effects: { resource: ["bone", 2, 3], gold: [15, 30] } },
        { chance: 0.35, text: "Простук отзывается камнем за ним: не саркофаг, а ниша.", effects: { rumor: "«Пустые саркофаги не для мёртвых. Их ставят — для приходящих.»" } },
      ] },
      { id: "leave", label: "🚶 Уйти", outcomes: [ { chance: 1, text: "Спать в чужом ложе — не ваш удел.", effects: {} } ] },
    ],
  },
  // === Этаж 4: Лагерь Орков ===
  corpse_f4: {
    id: "corpse_f4", floor: 4, type: "corpse", title: "Тело охотника", icon: "🕯️",
    text: "Вы нашли тело охотника. Рядом — сумка с записями.",
    actions: [
      { id: "search", label: "🖐 Обыскать", outcomes: [
        { chance: 0.30, text: "Кошель и жетон гильдейский — всё возместят последней шишкой.", effects: { gold: [20, 50] } },
        { chance: 0.20, text: "Дневник ветерана: последняя запись про «барабаны, что бьются сами».", effects: { diary: true } },
        { chance: 0.20, text: "Из сумки — клык орка, не вырванный, а честно добытый.", effects: { resource: ["orc_tusk", 1, 2] } },
        { chance: 0.30, text: "Ограблено подчистую — и быстро.", effects: {} },
      ] },
      { id: "bury", label: "⚰ Похоронить", outcomes: [
        { chance: 1, text: "Вы наваливаете камни — Гильдия отвечает малым зельем.", effects: { rep: ["hunters", 1], potion: "hp_small" } },
      ] },
      { id: "leave", label: "🚶 Пройти мимо", outcomes: [ { chance: 1, text: "В лагере не мешкают.", effects: {} } ] },
    ],
  },
  hunter_f4: {
    id: "hunter_f4", floor: 4, type: "hunter", title: "Фигура в плаще", icon: "🏹",
    text: "Впереди фигура в плаще Гильдии. Ранен, но жив.",
    actions: [
      { id: "approach", label: "👋 Подойти" },
      { id: "pass", label: "🚶 Пройти мимо", outcomes: [ { chance: 1, text: "Вы проходите — лагерь слишком слышен.", effects: {} } ] },
    ],
  },
  chest_f4: {
    id: "chest_f4", floor: 4, type: "chest", title: "Сундук с письмом", icon: "✉️",
    text: "Сундук с письмом, приколотым к крышке. Бумага пожелтела, но читается.",
    actions: [
      { id: "open", label: "🔓 Открыть", outcomes: [
        { chance: 0.50, text: "Монеты и дневник, выдержавший орочий лагерь.", effects: { gold: [30, 60], diary: true } },
        { chance: 0.50, text: "Монеты. Письмо — дважды перечёркнутый план «дойти до пятого».", effects: { gold: [30, 60] } },
      ] },
      { id: "leave", label: "🚶 Уйти", outcomes: [ { chance: 1, text: "Пусть лежит.", effects: {} } ] },
    ],
  },
  sleeping_warband: {
    id: "sleeping_warband", floor: 4, type: "creative", title: "Спящий дозор", icon: "😴",
    text: "Трое орков спят у углей, обняв секиры. Один во сне тявкает и поправляет «подушку» из костей.",
    actions: [
      { id: "sneak", label: "🤫 Пройти мимо на цыпочках", outcomes: [
        { chance: 0.60, text: "Вы проходите и прихватываете лежащее у костра.", effects: { resource: ["iron_ore", 1, 2], gold: [20, 40] } },
        { chance: 0.40, text: "Один храпит в такт вашему шагу — дозор просыпается.", effects: { skirmish: [0, 1] } },
      ] },
      { id: "wake", label: "💬 Разбудить их сознательно", outcomes: [
        { chance: 1, text: "Вы топаете по ведру. Слышно, как орки вскакивают.", effects: { skirmish: [0, 1] } },
      ] },
      { id: "leave", label: "🚶 Обойти", outcomes: [ { chance: 1, text: "Не спят те, кому надо.", effects: {} } ] },
    ],
  },
  training_effigy: {
    id: "training_effigy", floor: 4, type: "creative", title: "Орочье чучело", icon: "🎯",
    text: "Деревянное чучело истыкано клинками: орки учат удар. Плиты на нём — трофейные, из чужих доспехов.",
    actions: [
      { id: "loot", label: "🧰 Снять трофейные пластины", outcomes: [
        { chance: 0.60, text: "Пластины сняты и годны как материал.", effects: { resource: ["iron_chain", 1, 2], gold: [15, 30] } },
        { chance: 0.30, text: "Веревка лопается, и чучело валится вам на плечи.", effects: { hp: [5, 12] } },
      ] },
      { id: "smash", label: "⚔ Тренироваться о чучело", outcomes: [
        { chance: 0.80, text: "Хороший замах: рука помнит движение.", effects: { xp: 40 } },
        { chance: 0.20, text: "Клинок с него вылетает и бьёт вас по ноге.", effects: { hp: [8, 15] } },
      ] },
      { id: "leave", label: "🚶 Уйти", outcomes: [ { chance: 1, text: "Тренировка — не сегодня.", effects: {} } ] },
    ],
  },
  // === Этаж 5: Бездна ===
  corpse_f5: {
    id: "corpse_f5", floor: 5, type: "corpse", title: "Тело охотника", icon: "🕯️",
    text: "Вы нашли тело охотника. Рядом — сумка с записями.",
    actions: [
      { id: "search", label: "🖐 Обыскать", outcomes: [
        { chance: 0.30, text: "Кошель — монеты здесь что-то значат.", effects: { gold: [20, 50] } },
        { chance: 0.20, text: "Дневник безумца: страницы обожжены, письма дрожат.", effects: { diary: true } },
        { chance: 0.20, text: "Из сумки — адский пепел.", effects: { resource: ["infernal_ash", 1, 2] } },
        { chance: 0.30, text: "Сумка продавлена и пуста.", effects: {} },
      ] },
      { id: "bury", label: "⚰ Похоронить", outcomes: [
        { chance: 1, text: "Даже здесь вы наваливаете камень. Гильдия отблагодарит по-гильдейски.", effects: { rep: ["hunters", 1], potion: "hp_small" } },
      ] },
      { id: "leave", label: "🚶 Пройти мимо", outcomes: [ { chance: 1, text: "Бездна не для медленных.", effects: {} } ] },
    ],
  },
  hunter_f5: {
    id: "hunter_f5", floor: 5, type: "hunter", title: "Фигура в плаще", icon: "🏹",
    text: "Впереди фигура в плаще Гильдии. Ранен, но жив.",
    actions: [
      { id: "approach", label: "👋 Подойти" },
      { id: "pass", label: "🚶 Пройти мимо", outcomes: [ { chance: 1, text: "Вы идёте дальше — здесь выживают по-своему.", effects: {} } ] },
    ],
  },
  chest_f5: {
    id: "chest_f5", floor: 5, type: "chest", title: "Сундук с письмом", icon: "✉️",
    text: "Сундук с письмом, приколотым к крышке. Бумага пожелтела, но читается.",
    actions: [
      { id: "open", label: "🔓 Открыть", outcomes: [
        { chance: 0.50, text: "Монеты и дневник, перевязанный восковой ниткой.", effects: { gold: [30, 60], diary: true } },
        { chance: 0.50, text: "Монеты. Письмо — одна строчка: «сердце. дробящий. помни.»", effects: { gold: [30, 60] } },
      ] },
      { id: "leave", label: "🚶 Уйти", outcomes: [ { chance: 1, text: "Здесь всё оставляют как есть.", effects: {} } ] },
    ],
  },
  hell_kennel: {
    id: "hell_kennel", floor: 5, type: "creative", title: "Псарня Бездны", icon: "🔥",
    text: "Уходящая в камень низкая арка, из которой дышит жар: у гончих свой двор. Цепи у входа дрожат на ветру.",
    actions: [
      { id: "feed", label: "🥩 Бросить им еды", outcomes: [
        { chance: 0.50, text: "Гончие глотают и отходят — проход открыт.", effects: { gold: [20, 40] } },
        { chance: 0.50, text: "Еда им не по нраву — из арки рвётся рёв.", effects: { skirmish: [0] } },
      ] },
      { id: "strike", label: "⚔ Пробиваться силой", outcomes: [
        { chance: 1, text: "Вы идёте в арку с клинком наперевес.", effects: { skirmish: [0] } },
      ] },
      { id: "leave", label: "🚶 Обойти арку", outcomes: [ { chance: 1, text: "У псарни не стоят.", effects: {} } ] },
    ],
  },
  blood_brazier: {
    id: "blood_brazier", floor: 5, type: "creative", title: "Кровавая жаровня", icon: "🔥",
    text: "Жаровня с углями, что не гаснут: их поливают капли, стекающие с потолка Бездны. Рядом — нечеловеческие кости.",
    actions: [
      { id: "warm", label: "♨️ Погреть руки", outcomes: [
        { chance: 0.70, text: "Тепло опасно-хорошее: вы чувствуете прилив сил.", effects: { xp: 50 } },
        { chance: 0.30, text: "Жар кусается и оставляет отметины.", effects: { hp: [8, 16] } },
      ] },
      { id: "snuff", label: "🧯 Засыпать угли", outcomes: [
        { chance: 0.60, text: "Угли поддаются, и на дне остаются монеты и пепел.", effects: { gold: [25, 45], resource: ["infernal_ash", 1, 1] } },
        { chance: 0.40, text: "Жаровня разгорается в ответ, и вспышка хлещет.", effects: { hp: [10, 20] } },
      ] },
      { id: "leave", label: "🚶 Уйти", outcomes: [ { chance: 1, text: "Пусть жарится.", effects: {} } ] },
    ],
  },
};

// Каждому мобу и боссу проставляем этаж — по нему считаются рецепты и дроп.
for (const floor of FLOORS) {
  for (const mob of floor.mobs) {
    mob.floorId = floor.id;
  }
  floor.boss.floorId = floor.id;
}

const ZONE_NAMES = {
  1: ["Опушка", "Чаща", "Бурелом", "Пещера", "Логово"],
  2: ["Вход", "Штрек", "Жила", "Тоннели", "Плавильня"],
  3: ["Вход", "Крипта", "Могилы", "Саркофаги", "Тронный зал"],
  4: ["Аванпост", "Лагерь", "Костры", "Шаманы", "Трон"],
  5: ["Портал", "Алтарь", "Псарня", "Жаровня", "Бездна"]
};

// Node/bundler: экспорт для тестов и аудита вне браузера.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ELITE_CHANCE, RARE_CHANCE, RARE_REWARDS, ELITE_REWARDS, RARITY_INFO,
    ABILITY_POOL, MOB_ABILITY_INFO, MOB_MODIFIERS, SWIFT_DODGE, VAMPIRE_HEAL_PERCENT,
    ADAPTIVE_MULT, POISON_TURNS, POISON_ATK_MULT, AMBUSH_CHANCE, AMBUSH_TEXT,
    ambushMobIndex, HUNT_CONTRACTS, MOB_ICONS, RESOURCE_ICONS, resolveIcon,
    enemy, FLOORS, FLOOR_RESOURCES, ALL_RESOURCES, FLOOR_SCENES,
    FLOOR_DIARY, HUNTER_ENCOUNTERS, FLOOR_EVENTS, ZONE_NAMES,
  };
}