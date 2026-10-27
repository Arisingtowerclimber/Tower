const ZONES = [
  { id: "head", name: "Голова", critBonus: 10, risk: 0.25, tip: "Критический удар, но промах открывает вас для контратаки." },
  { id: "chest", name: "Грудь", damageMult: 0.9, tip: "Надёжный удар с чуть сниженным уроном." },
  { id: "belly", name: "Живот", armorPierce: 0.5, tip: "Пробивает половину защиты врага." },
  { id: "waist", name: "Пояс", staggerChance: 0.35, tip: "Может сбить стойку — враг пропустит блок." },
  { id: "legs", name: "Ноги", tripChance: 0.25, tip: "Может сбить с ног — враг пропустит ответный удар." },
];

const ZONE_NAME = Object.fromEntries(ZONES.map((z) => [z.id, z.name]));
const ZONE_MAP = Object.fromEntries(ZONES.map((z) => [z.id, z]));

const SLOTS = [
  { id: "head", name: "Голова", icon: "⛑️", accepts: ["head"] },
  { id: "neck", name: "Шея", icon: "📿", accepts: ["neck"] },
  { id: "shoulder", name: "Плечи", icon: "🛡️", accepts: ["shoulder"] },
  { id: "back", name: "Спина", icon: "🧣", accepts: ["back"] },
  { id: "chest", name: "Грудь", icon: "👕", accepts: ["chest"] },
  { id: "wrist", name: "Запястья", icon: "⌚", accepts: ["wrist"] },
  { id: "hands", name: "Кисти", icon: "🧤", accepts: ["hands"] },
  { id: "waist", name: "Пояс", icon: "🎗️", accepts: ["waist"] },
  { id: "legs", name: "Ноги", icon: "👖", accepts: ["legs"] },
  { id: "feet", name: "Ступни", icon: "🥾", accepts: ["feet"] },
  { id: "ring1", name: "Кольцо 1", icon: "💍", accepts: ["ring"] },
  { id: "ring2", name: "Кольцо 2", icon: "💍", accepts: ["ring"] },
  { id: "trinket1", name: "Аксессуар 1", icon: "🔮", accepts: ["trinket"] },
  { id: "trinket2", name: "Аксессуар 2", icon: "🔮", accepts: ["trinket"] },
  { id: "mainhand", name: "Правая рука", icon: "⚔️", accepts: ["mainhand"] },
  { id: "offhand", name: "Левая рука", icon: "🛡️", accepts: ["offhand"] },
];

const SLOT_NAME = Object.fromEntries(SLOTS.map((s) => [s.id, s.name]));
const SLOT_ICON = Object.fromEntries(SLOTS.map((s) => [s.id, s.icon]));
SLOT_NAME.ring = "Кольца";
SLOT_NAME.trinket = "Аксессуары";
SLOT_ICON.ring = "💍";
SLOT_ICON.trinket = "🔮";

const FORGE_TABS = [
  { id: "held", name: "Оружие и Щиты", slots: ["mainhand", "offhand"] },
  { id: "armor", name: "Доспехи", slots: ["head", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet"] },
  { id: "craft", name: "Крафт", slots: [] },
  { id: "buyback", name: "Скупка", slots: [] },
  { id: "quests", name: "📦 Заказы", slots: [] },
];

const JEWELRY_TABS = [
  { id: "jewelry", name: "Украшения", slots: ["neck", "ring", "trinket"] },
  { id: "craft", name: "Крафт", slots: [] },
  { id: "buyback", name: "Скупка", slots: [] },
  { id: "quests", name: "📦 Заказы", slots: [] },
];

const PORTRAITS = [
  { id: "m1", name: "Мужчина 1", gender: "m", src: "assets/portraits/m1.webp" },
  { id: "m2", name: "Мужчина 2", gender: "m", src: "assets/portraits/m2.webp" },
  { id: "f1", name: "Женщина 1", gender: "f", src: "assets/portraits/f1.webp" },
];

const PORTRAIT_MAP = Object.fromEntries(PORTRAITS.map((p) => [p.id, p]));

function portraitSrc(id) {
  return (PORTRAIT_MAP[id] || PORTRAITS[0]).src;
}

const NPC_PORTRAITS = {
  ron: "assets/portraits/ron.webp",
  elain: "assets/portraits/elain.webp",
  elize: "assets/portraits/elize.webp",
  mira: "assets/portraits/mira.webp",
  alva: "assets/portraits/alva.webp",
  solveig: "assets/portraits/solveig.webp",
};

function npcPortraitSrc(id) {
  return NPC_PORTRAITS[id] || "assets/portraits/placeholder.webp";
}

const DEFENSE_CAP = 0.6;

const DURABILITY_MAX = 100;
const DURABILITY_LOSS_PER_FIGHT = 3;
const REPAIR_COST_PER_POINT = 0.04;

function gearItem(id, name, slot, icon, price, shopTier, stats, desc) {
  return { id, name, slot, icon, price, shopTier, desc, ...stats };
}

const ATTR_INFO = [
  { id: "str", name: "Сила", effect: "+2 к урону" },
  { id: "agi", name: "Ловкость", effect: "+1% уворот, +0.5% крит, +0.3% контратака" },
  { id: "end", name: "Выносливость", effect: "+10 к максимуму HP" },
  { id: "int", name: "Интеллект", effect: "+10 к максимуму маны" },
];

const START_ATTR_POINTS = 10;
const LEVEL_ATTR_POINTS = 3;
const AGILITY_DODGE_PERCENT = 1;
const AGILITY_CRIT_PERCENT = 0.5;
const AGILITY_COUNTER_PERCENT = 0.3;
const COUNTERATTACK_CAP = 30;

const BASE_ARCHETYPE_MODS = { atk: 1, maxHp: 1, dodgeCap: 35, blockZones: 2, ragePerHit: 1, blockCounter: 0 };

// ── Редкость предметов: множитель базовых статов, число бонусов аффикса, шансы ──
const RARITY_TIERS = {
  common:    { name: "Обычный",    color: "#6b6b6b", mult: 1.0,  bonusCount: 0, chance: 0.60, sellMult: 1.0 },
  uncommon:  { name: "Необычный",  color: "#4caf50", mult: 1.1,  bonusCount: 1, chance: 0.25, sellMult: 1.5 },
  rare:      { name: "Редкий",     color: "#2196f3", mult: 1.25, bonusCount: 2, chance: 0.10, sellMult: 2.5 },
  epic:      { name: "Эпический",  color: "#9c27b0", mult: 1.5,  bonusCount: 3, chance: 0.04, sellMult: 4.0 },
  legendary: { name: "Легендарный",color: "#ff9800", mult: 1.8,  bonusCount: 4, chance: 0.01, sellMult: 8.0, unique: true },
};

// Аффиксы: тема предмета (часть названия) и пул статов для бонусов [min..max].
const AFFIXES = [
  { id: "bear",   name: "Медведя", stats: [{ id: "str", min: 1, max: 2 }, { id: "end", min: 1, max: 2 }] },
  { id: "eagle",  name: "Орла",    stats: [{ id: "agi", min: 1, max: 2 }, { id: "int", min: 1, max: 2 }] },
  { id: "wolf",   name: "Волка",   stats: [{ id: "str", min: 1, max: 2 }, { id: "crit", min: 1, max: 3 }] },
  { id: "boar",   name: "Вепря",   stats: [{ id: "end", min: 2, max: 3 }, { id: "hp", min: 5, max: 15 }] },
  { id: "falcon", name: "Сокола",  stats: [{ id: "agi", min: 1, max: 2 }, { id: "dodge", min: 1, max: 3 }] },
  { id: "owl",    name: "Совы",    stats: [{ id: "int", min: 1, max: 2 }, { id: "mana", min: 5, max: 15 }] },
];

// Уникальные эффекты легендарных предметов.
const UNIQUE_EFFECTS = [
  { id: "lifesteal", name: "Вампиризм", desc: "Восстанавливает 5% нанесённого урона в HP." },
  { id: "thorns",    name: "Шипы",      desc: "Отражает 10% полученного урона." },
  { id: "swift",     name: "Скорость",  desc: "+5% уворота." },
  { id: "lucky",     name: "Удача",     desc: "+5% шанс крита." },
];
const LIFESTEAL_PERCENT = 0.05;
const THORNS_PERCENT = 0.1;
const CRAFT_RARITY_BONUS_PER_LEVEL = 0.01;
const ELITE_RARITY_BONUS = 0.1;

const ARCHETYPES = [
  {
    id: "berserker",
    name: "Берсерк",
    icon: "🪓",
    desc: "Чем ниже HP, тем сильнее удар — до +30%. Больше куража за удар и блок. −15% к максимуму HP.",
    mods: { atk: 1, maxHp: 0.85, dodgeCap: 35, blockZones: 2, ragePerHit: 2, blockCounter: 0 },
    startEquipment: ["rusty_knife", "rags", "worn_hood", "patched_pants", "worn_boots"]
  },
   {
    id: "guardian",
    name: "Страж",
    icon: "🛡️",
    desc: "Успешный блок наносит ответный удар — 10% атаки врага. −10% к наносимому и получаемому урону.",
    mods: { atk: 0.9, maxHp: 1, dodgeCap: 35, blockZones: 2, ragePerHit: 1, blockCounter: 0.1, dmgTakenMult: 0.9 },
    startEquipment: ["rusty_knife", "rags", "worn_hood", "patched_pants", "worn_boots", "wood_shield"]
  },
  {
    id: "assassin",
    name: "Убийца",
    icon: "🗡️",
    desc: "Держит оружие в обеих руках: левая рука даёт 50% урона. Уворот до 50%. −10% к максимуму HP, щиты недоступны.",
    mods: { atk: 1, maxHp: 0.9, dodgeCap: 50, blockZones: 2, ragePerHit: 1, blockCounter: 0 },
    startEquipment: ["rusty_knife", "rusty_knife", "rags", "worn_hood", "patched_pants", "worn_boots"]
  },
];

const ARCHETYPE_MAP = Object.fromEntries(ARCHETYPES.map((a) => [a.id, a]));

// ── Вариация мобов: редкость, модификаторы, способности ──────────────────
// Вариация применяется только к обычным мобам; боссы всегда «обычные».
const ELITE_CHANCE = 0.05;    // шанс элитного моба (★)
const RARE_CHANCE = 0.10;     // шанс редкого моба (✦)
const MODIFIER_CHANCE = 0.30; // шанс боевого модификатора

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
const AMBUSH_GATHER_CHANCE = 0.05; // в стычке во время поиска припасов
const AMBUSH_TEXT = "Из тени выходит второй противник!";

// Случайный моб того же этажа для засады (не тот, с которым уже идёт бой).
function ambushMobIndex(floor, excludeIndex = -1) {
  const all = floor.mobs.map((_, i) => i);
  const pool = all.filter((i) => i !== excludeIndex);
  const list = pool.length ? pool : all;
  return list[Math.floor(Math.random() * list.length)];
}

const TECH_COST = 6;
const MANA_REGEN = 1;

const EXPLORATION_MAX = 10;
const FIGHT_ENERGY_COST = 1;
const FREE_REST_AMOUNT = 3;

const HOTEL_PRICE = 20;
const COMPANION_PRICE = 100;
const COMPANION_BUFF_DAYS = 2;

const TIME_PHASES = [
  { id: "morning", name: "Утро", icon: "🌅", towerOpen: true },
  { id: "day", name: "День", icon: "☀️", towerOpen: true },
  { id: "evening", name: "Вечер", icon: "🌇", towerOpen: true },
  { id: "night", name: "Ночь", icon: "🌙", towerOpen: false },
];

const COMPANIONS = [
  { 
    id: "mira", 
    name: "Мира", 
    role: "Травница", 
    icon: "🌿", 
    buff: "hp", 
    buffText: "+10% к максимуму HP", 
    price: COMPANION_PRICE, 
    src: "assets/portraits/mira.webp", 
    desc: "«Твоему телу нужен покой, а твоему упрямству — моя рука. Ложись и закрой глаза, милый.» Высокая и статная, Мира излучает спокойную, зрелую красоту. В ее изумрудных глазах читается безграничная теплота, но ее забота не терпит возражений. Сон в ее объятиях — это не просто отдых, это глубокое, живительное восстановление. Ее присутствие заставляет забытые раны затягиваться, а измученное тело — обретать новую прочность." 
  },
  { 
    id: "alva", 
    name: "Альва", 
    role: "Певица", 
    icon: "🎼", 
    buff: "hybrid", 
    buffText: "+5% к максимуму HP, +5% к урону", 
    price: COMPANION_PRICE, 
    src: "assets/portraits/alva.webp", 
    desc: "«Твои мысли слишком шумны, а движения полны суеты. Позволь мне остудить твой разум... и зажечь твой клинок.» Роскошные белые волосы и пронзительный взгляд синих глаз делают Альву похожей на неприступную зимнюю богиню. Ее острые, аристократичные черты лица и ледяная сдержанность, казалось, делают ее неприступной. Но за этой маской скрывается удивительная, почти хрупкая нежность, которую она дарит лишь избранным. Ночь в ее объятиях дарует не только глубокий покой, но и обостряет чувства, превращая каждое твое движение в смертоносный, выверенный танец." 
  },
  { 
    id: "solveig", 
    name: "Сольвейг", 
    role: "Наёмница", 
    icon: "🗡️", 
    buff: "damage", 
    buffText: "+10% к урону", 
    price: COMPANION_PRICE, 
    src: "assets/portraits/solveig.webp", 
    desc: "«Ты думаешь, что устал? Ха! Тогда я покажу тебе, что значит настоящая усталость. А ну вставай, слабак!» Молодая, дикая и неудержимая, Сольвейг похожа на северную бурю, заключенную в человеческий облик. Две пышные золотые косы, пронзительные зеленые глаза и едва заметные родовые татуировки, словно обжигающие ее бледную кожу. Она не знает нежности в привычном понимании — ее ласка это вызов, ее объятия это спарринг. Ночь с ней не даст покоя, но зато пробудит в тебе зверя. Проснувшись рядом с Сольвейг, ты чувствуешь, что твои мышцы гудят от силы, а клинок просится в бой." 
  }
];

const COMPANION_MAP = Object.fromEntries(COMPANIONS.map((c) => [c.id, c]));

const GOLD_DROP_MULT = 0.25;

const CALENDAR_START = { year: 197, month: 1, day: 1 };

const MONTHS = [
  { id: 1,  name: "Январь",   short: "янв", days: 31 }, { id: 2,  name: "Февраль",  short: "фев", days: 28 },
  { id: 3,  name: "Март",     short: "мар", days: 31 }, { id: 4,  name: "Апрель",   short: "апр", days: 30 },
  { id: 5,  name: "Май",      short: "май", days: 31 }, { id: 6,  name: "Июнь",     short: "июн", days: 30 },
  { id: 7,  name: "Июль",     short: "июл", days: 31 }, { id: 8,  name: "Август",   short: "авг", days: 31 },
  { id: 9,  name: "Сентябрь", short: "сен", days: 30 }, { id: 10, name: "Октябрь",  short: "окт", days: 31 },
  { id: 11, name: "Ноябрь",   short: "ноя", days: 30 }, { id: 12, name: "Декабрь",  short: "дек", days: 31 },
];

const WEEKDAYS = [
  { id: 1, name: "Понедельник", short: "Пн" }, { id: 2, name: "Вторник", short: "Вт" },
  { id: 3, name: "Среда", short: "Ср" }, { id: 4, name: "Четверг", short: "Чт" },
  { id: 5, name: "Пятница", short: "Пт" }, { id: 6, name: "Суббота", short: "Сб" },
  { id: 7, name: "Воскресенье", short: "Вс" },
];

const WEEKDAY_OF_START = 6;

const WEEKLY_EVENTS = {
  1: { id: "forge_sale", name: "День кузнеца", icon: "⚒️", desc: "Скидка 10% на снаряжение в Кузнице.", shopDiscount: 0.10 },
  3: { id: "alchemy_sale", name: "День алхимика", icon: "🧪", desc: "Скидка 10% на зелья у Элейн.", shopDiscount: 0.10 },
  5: { id: "companion_night", name: "Ночь у камина", icon: "🛏️", desc: "Скидка 15% на найм спутницы.", companionDiscount: 0.15 },
  6: { id: "gold_rush", name: "Золотая лихорадка", icon: "💰", desc: "+10% золота с мобов.", goldMult: 1.10 },
  7: { id: "xp_boost", name: "День знаний", icon: "📖", desc: "+5% опыта с мобов.", xpMult: 1.05 },
};

const TRAINING_ENERGY_COST = 5;
const TRAINING_PHASES = 3;

function trainingCap(level = state.level) {
  return level <= 1 ? 5 : level * 2;
}

const TRAININGS = [
  { id: "strength", attr: "str", name: "Круг Силы", icon: "🪨", desc: "Здесь сосредоточены древние камни. Некоторые из них удивительно тяжелы для своего размера.", effect: "+1 к силе (+1 к урону)" },
  { id: "agility", attr: "agi", name: "Спарринг", icon: "🤺", desc: "Отшлифуй свою технику в тренировочном бою с другим авантюристом.", effect: "+1 к ловкости (+1% уворот, +0.5% крит)" },
  { id: "endurance", attr: "end", name: "Царь Горы", icon: "⛰️", desc: "Серия повторяющихся упражнений, где выбивший последний побеждает.", effect: "+1 к выносливости (+2 к максимуму HP)" },
];

const TRAINING_MAP = Object.fromEntries(TRAININGS.map((t) => [t.id, t]));

const ITEMS = {
  rusty_knife: { id: "rusty_knife", name: "Ржавый нож", slot: "mainhand", icon: "assets/icons/rusty_knife.webp?v=2", atk: 4, price: 0, shopTier: 0, desc: "Всё, что осталось от прошлой жизни." },
  wood_club: { id: "wood_club", name: "Дубина", slot: "mainhand", icon: "🏏", atk: 16, price: 45, shopTier: 1, desc: "Тяжёлая, но честная." },
  short_sword: { id: "short_sword", name: "Короткий меч", slot: "mainhand", icon: "🗡️", atk: 20, crit: 2, price: 75, shopTier: 1, desc: "Быстрый и точный." },
  iron_sword: { id: "iron_sword", name: "Железный меч", slot: "mainhand", icon: "⚔️", atk: 36, crit: 3, price: 190, shopTier: 2, desc: "Работа кузнеца из нижних ярусов." },
  dagger: { id: "dagger", name: "Гранёный кинжал", slot: "mainhand", icon: "🔪", atk: 28, crit: 12, price: 200, shopTier: 2, desc: "Ищет щели в чужой защите." },
  battle_axe: { id: "battle_axe", name: "Боевой топор", slot: "mainhand", icon: "🪓", atk: 48, price: 280, shopTier: 2, desc: "Пробивает даже панцирь." },
  rune_blade: { id: "rune_blade", name: "Рунный клинок", slot: "mainhand", icon: "⚔️", atk: 72, crit: 5, price: 560, shopTier: 3, desc: "На лезвии проступают чужие имена." },
  great_axe: { id: "great_axe", name: "Секира палача", slot: "mainhand", icon: "🪓", atk: 96, price: 640, shopTier: 3, desc: "Тяжелая настолько, что бой заканчивается быстро." },

  rags: { id: "rags", name: "Рваная рубаха", slot: "chest", icon: "👕", def: 0, hp: 0, price: 0, shopTier: 0, desc: "Лучше, чем ничего." },
  gambeson: { id: "gambeson", name: "Стёганый гамбезон", slot: "chest", icon: "🥋", def: 4, hp: 40, price: 40, shopTier: 1, desc: "Мягкая броня, но держит удар." },
  leather: { id: "leather", name: "Кожаный доспех", slot: "chest", icon: "🥋", def: 6, hp: 60, price: 70, shopTier: 1, desc: "Пахнет дёгтем и старым потом." },
  chain: { id: "chain", name: "Кольчуга", slot: "chest", icon: "🥋", def: 10, hp: 90, price: 210, shopTier: 2, desc: "Тысяча колец, ни одного лишнего." },
  scale: { id: "scale", name: "Чешуйчатый доспех", slot: "chest", icon: "🥋", def: 12, hp: 110, price: 300, shopTier: 2, desc: "Чешуя снята с чего-то большого." },
  plate: { id: "plate", name: "Латный доспех", slot: "chest", icon: "🛡️", def: 16, hp: 120, price: 600, shopTier: 3, desc: "В нём слышно только собственное дыхание." },

  wood_shield: { id: "wood_shield", name: "Деревянный щит", slot: "offhand", icon: "🛡️", def: 2, block: 1, price: 55, shopTier: 1, desc: "Третья зона блока." },
  kite_shield: { id: "kite_shield", name: "Каплевидный щит", slot: "offhand", icon: "🛡️", def: 6, block: 1, price: 200, shopTier: 2, desc: "Прикрывает корпус целиком." },
  tower_shield: { id: "tower_shield", name: "Башенный щит", slot: "offhand", icon: "🛡️", def: 10, block: 1, price: 480, shopTier: 3, desc: "Стена, которую можно носить." },
  parrying_dagger: { id: "parrying_dagger", name: "Кинжал парирования", slot: "offhand", icon: "🗡️", atk: 12, crit: 2, price: 160, shopTier: 2, desc: "Вторая рука тоже умеет ранить." },

  worn_hood: gearItem("worn_hood", "Поношенный капюшон", "head", "🧢", 0, 0, { def: 0, hp: 0 }, "Ткань, которую не жалко потерять."),
  patched_pants: gearItem("patched_pants", "Штаны в заплатках", "legs", "👖", 0, 0, { def: 0, hp: 0 }, "Заплатка на заплатке."),
  worn_boots: gearItem("worn_boots", "Стоптанные сапоги", "feet", "🥾", 0, 0, { def: 0, hp: 0 }, "Скрипят на каждом шагу."),
  head_cloth: gearItem("head_cloth", "Тканевый капюшон", "head", "🧢", 25, 1, { def: 2, hp: 15 }, "Плотная ткань лучше, чем ничего."),
  head_iron: gearItem("head_iron", "Железный шлем", "head", "⛑️", 110, 2, { def: 6, hp: 40 }, "Простой, тяжёлый, надёжный."),
  head_crystal: gearItem("head_crystal", "Кристальный шлем", "head", "💠", 320, 3, { def: 8, hp: 60 }, "Грани ловят свет и чужой удар."),
  shoulder_leather: gearItem("shoulder_leather", "Кожаные наплечники", "shoulder", "🛡️", 25, 1, { def: 2, hp: 15 }, "Ремни и куски кожи."),
  shoulder_iron: gearItem("shoulder_iron", "Железные наплечники", "shoulder", "🛡️", 100, 2, { def: 4, hp: 40 }, "Держат удар сверху."),
  shoulder_crystal: gearItem("shoulder_crystal", "Кристальные наплечники", "shoulder", "💠", 300, 3, { def: 6, hp: 50 }, "Осколки срослись в броню."),
  back_cloak: gearItem("back_cloak", "Рваный плащ", "back", "🧣", 20, 1, { def: 0, hp: 15 }, "Холодный ветер всё равно пробирается."),
  back_guard: gearItem("back_guard", "Плащ караульного", "back", "🧣", 90, 2, { def: 2, hp: 30 }, "Плотная ткань с чужого плеча."),
  back_crystal: gearItem("back_crystal", "Кристальный плащ", "back", "💠", 280, 3, { def: 4, hp: 40 }, "Ткань, будто покрытая инеем."),
  wrist_leather: gearItem("wrist_leather", "Кожаные наручи", "wrist", "🧤", 20, 1, { def: 2, hp: 10 }, "Защищают от случайного пореза."),
  wrist_chain: gearItem("wrist_chain", "Кольчужные наручи", "wrist", "🧤", 85, 2, { def: 4, hp: 25 }, "Мелкие кольца, плотная посадка."),
  wrist_crystal: gearItem("wrist_crystal", "Кристальные наручи", "wrist", "💠", 260, 3, { def: 4, hp: 30 }, "Холодят руку даже через ткань."),
  hands_gloves: gearItem("hands_gloves", "Рабочие перчатки", "hands", "🧤", 20, 1, { def: 2, hp: 10 }, "Ладони уже не горят."),
  hands_iron: gearItem("hands_iron", "Железные рукавицы", "hands", "🛡️", 85, 2, { def: 4, hp: 25 }, "Кулак становится доводом."),
  hands_crystal: gearItem("hands_crystal", "Кристальные рукавицы", "hands", "💠", 260, 3, { def: 2, hp: 6 }, "Пальцы двигаются, кристалл звенит."),
  waist_rope: gearItem("waist_rope", "Верёвочный пояс", "waist", "🎗️", 20, 1, { def: 2, hp: 15 }, "Держит штаны и надежду."),
  waist_plate: gearItem("waist_plate", "Пояс из пластин", "waist", "🛡️", 90, 2, { def: 4, hp: 30 }, "Пластины стучат при ходьбе."),
  waist_crystal: gearItem("waist_crystal", "Кристальный пояс", "waist", "💠", 270, 3, { def: 4, hp: 40 }, "Тяжёлый, но держит спину."),
  legs_leather: gearItem("legs_leather", "Кожаные штаны", "legs", "👖", 25, 1, { def: 2, hp: 20 }, "Мягкие, зато не рвутся сразу."),
  legs_chain: gearItem("legs_chain", "Кольчужные штаны", "legs", "👖", 110, 2, { def: 6, hp: 40 }, "Тяжело шагать, легко стоять."),
  legs_crystal: gearItem("legs_crystal", "Кристальные поножи", "legs", "💠", 320, 3, { def: 8, hp: 60 }, "Каждый шаг отдаётся звоном."),
  feet_leather: gearItem("feet_leather", "Кожаные сапоги", "feet", "🥾", 25, 1, { def: 2, hp: 15 }, "Подошва ещё держится."),
  feet_iron: gearItem("feet_iron", "Железные сапоги", "feet", "🥾", 90, 2, { def: 4, hp: 30 }, "Гулкий шаг по каменным плитам."),
  feet_crystal: gearItem("feet_crystal", "Кристальные сапоги", "feet", "💠", 270, 3, { def: 6, hp: 40 }, "Ступня вмерзает в камень."),

  neck_bone: gearItem("neck_bone", "Грубый амулет", "neck", "📿", 30, 1, { hp: 25 }, "Грубый кусок малахита, наспех привязанный к ремешку."),
  neck_guard: gearItem("neck_guard", "Медальон караульного", "neck", "📿", 110, 2, { hp: 40, crit: 1 }, "Знак поста, который давно не сменяли."),
  neck_crystal: gearItem("neck_crystal", "Кристальный подвесок", "neck", "💠", 330, 3, { hp: 60, crit: 2 }, "Внутри что-то медленно пульсирует."),
  ring_copper: gearItem("ring_copper", "Медное кольцо", "ring", "💍", 35, 1, { crit: 1 }, "Тусклое, но своё."),
  ring_silver: gearItem("ring_silver", "Серебряное кольцо", "ring", "💍", 120, 2, { crit: 2, hp: 20 }, "На внутренней стороне стёрта чужая надпись."),
  ring_crystal: gearItem("ring_crystal", "Кристальное кольцо", "ring", "💍", 350, 3, { crit: 3, hp: 20 }, "Осколок, оправленный в серебро."),
  trinket_coin: gearItem("trinket_coin", "Счастливая монета", "trinket", "💰", 35, 1, { dodge: 1 }, "Счастливая, пока не потрачена."),
  trinket_totem: gearItem("trinket_totem", "Железный тотем", "trinket", "🔮", 120, 2, { dodge: 2, hp: 20 }, "Тёплый, если долго держать."),
  trinket_shard: gearItem("trinket_shard", "Кристальный осколок", "trinket", "💠", 350, 3, { dodge: 3, crit: 1 }, "Показывает, куда придётся удар."),

  hp_small: { id: "hp_small", name: "Малое зелье лечения", slot: "potion", icon: "🧪", type: "potion", effect: "hp", amount: 100, price: 20, shopTier: 1, desc: "Восстанавливает 100 HP." },
  hp_big: { id: "hp_big", name: "Большое зелье лечения", slot: "potion", icon: "⚗️", type: "potion", effect: "hp", amount: 225, price: 45, shopTier: 1, desc: "Восстанавливает 225 HP." },
  mana_small: { id: "mana_small", name: "Зелье маны", slot: "potion", icon: "🔷", type: "potion", effect: "mana", amount: 20, price: 20, shopTier: 1, desc: "Восстанавливает 20 маны." },
};

const MOB_ICONS = {
  goblin_scout: "assets/mobs/goblin_scout.webp",
  hobgoblin: "assets/mobs/hobgoblin.webp",
  bugbear: "assets/mobs/bugbear.webp",
  goblin_chief: "assets/mobs/goblin_chief.webp",
  skeleton_warrior: "assets/mobs/skeleton_warrior.webp",
  unquiet_ghost: "assets/mobs/unquiet_ghost.webp",
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

function shopFloorFor(item) {
  if (item.shopTier <= 1) return 1;
  if (item.shopTier === 2) return 2;
  return 4;
}

function enemy(def) {
  return { prefers: ["chest"], gold: 10, xp: 10, ...def, maxHp: def.hp };
}

const FLOORS = [
  { id: 1, name: "Тёмный Лес", subtitle: "Гиблое место, облюбованное гоблинскими племенами", icon: "🕳️",
    desc: "Тёмный Лес — это древняя чаща, куда даже опытные охотники заходят с опаской. Исполинские деревья здесь настолько стары, что их корни выворотили землю, создав естественные ловушки. Но главная угроза — гоблины. Эти твари не просто выживают здесь, они построили свои грязные логова в корнях и дуплах. Выследить их почти невозможно, пока гоблинская стрела не вонзится вам в спину. Говорят, в самой чаще прячется их вожак, чей тесак срубил не одну голову",
    cardImg: "assets/backgrounds/duskwood.webp",
    bg: "assets/backgrounds/duskwood.webp",
    mobs: [
      enemy({ id: "goblin_scout", name: "Гоблин-разведчик", icon: "goblin_scout", hp: 140, atk: 20, def: 3, gold: 25, xp: 40, prefers: ["legs", "belly"], desc: "Мелкий и юркий. Пытается зайти со спины и пырнуть ножом в бок.",
        drops: [
          { id: "rust", chance: 0.35, min: 1, max: 2 },
          { id: "cloth", chance: 0.25, min: 1, max: 2 },
        ] }),
      enemy({ id: "hobgoblin", name: "Хобгоблин", icon: "hobgoblin", hp: 210, atk: 26, def: 6, gold: 35, xp: 55, prefers: ["head", "chest"], desc: "Крупнее и злее своих сородичей. Носит грубые кожаные доспехи и машет дубиной.",
        drops: [
          { id: "leather", chance: 0.30, min: 1, max: 2 },
          { id: "wood", chance: 0.20, min: 1, max: 2 },
        ] }),
      enemy({ id: "bugbear", name: "Багбир", icon: "bugbear", hp: 310, atk: 34, def: 10, gold: 50, xp: 75, prefers: ["chest", "belly"], desc: "Медлительный и уродливый гигант. Каждый его удар проламывает кости.",
        drops: [
          { id: "bone", chance: 0.35, min: 1, max: 3 },
          { id: "iron_ore", chance: 0.20, min: 1, max: 1 },
        ] }),
    ],
    boss: enemy({ id: "goblin_chief", name: "Вождь Гоблинов", icon: "goblin_chief", hp: 1200, atk: 45, def: 14, gold: 250, xp: 300, prefers: ["head", "chest", "belly"], boss: true, enrage: true, desc: "Огромный, покрытый шрамами гоблин. Вооружен ржавым тесаком. В ярости его удары сокрушают всё.",
      drops: [
        { id: "gambeson", chance: 1.0, min: 1, max: 1, kind: "item" },
        { id: "malachite", chance: 0.60, min: 2, max: 3 },
      ] }),
  },
  { id: 2, name: "Древний Склеп", subtitle: "Лишенные покоя не ведают жалости", icon: "💀",
    desc: "Даже свет факела кажется маленькой искрой и выхватывает из темноты лишь сырые каменные стены...",
    cardImg: "assets/backgrounds/crypt.webp", 
    bg: "assets/backgrounds/crypt.webp", 
    mobs: [
      enemy({ 
        id: "skeleton_warrior", 
        name: "Скелет-воин", 
        icon: "skeleton_warrior", // <-- ИЗМЕНЕНО
        hp: 350, atk: 36, def: 12, gold: 60, xp: 84, prefers: ["chest", "legs"], desc: "Восставший из старой могилы...",
        drops: [
          { id: "bone", chance: 0.40, min: 1, max: 2 },
          { id: "rust", chance: 0.20, min: 1, max: 3 },
        ] 
      }),
      enemy({ 
        id: "unquiet_ghost", 
        name: "Неупокоенный призрак", 
        icon: "unquiet_ghost", // <-- ИЗМЕНЕНО
        hp: 400, atk: 42, def: 6, gold: 65, xp: 90, prefers: ["head", "belly"], desc: "Полупрозрачный силуэт...",
        drops: [
          { id: "bone", chance: 0.30, min: 1, max: 2 },
          { id: "herb", chance: 0.20, min: 1, max: 2 },
        ] 
      }),
      enemy({ 
        id: "crypt_ghoul", 
        name: "Свежий Упырь", 
        icon: "crypt_ghoul", // <-- ИЗМЕНЕНО
        hp: 480, atk: 48, def: 16, gold: 75, xp: 105, prefers: ["waist", "chest"], desc: "Пожиратель падали...",
        drops: [
          { id: "bone", chance: 0.35, min: 1, max: 3 },
          { id: "leather", chance: 0.20, min: 1, max: 2 },
        ] 
      }),
    ],
    boss: enemy({ 
      id: "dark_knight", 
      name: "Темный Рыцарь", 
      icon: "dark_knight", // <-- ИЗМЕНЕНО
      hp: 2100, atk: 64, def: 28, gold: 450, xp: 480, prefers: ["head", "chest", "belly"], boss: true, enrage: true, desc: "Павший паладин...",
      drops: [
        { id: "head_iron", chance: 1.0, min: 1, max: 1 },
        { id: "steel", chance: 0.40, min: 1, max: 2 }, 
      ] 
    }),
  },
  { id: 3, name: "Затопленный ярус", subtitle: "Вода по колено, и в ней кто-то двигается", icon: "🌊",
    desc: "Вода стоит по колено, отражая тусклый свет факелов. Из-под поверхности тянутся руки, а в тёмной глубине что-то тяжело ворочается.",
    bg: "assets/backgrounds/floor3.webp",
    mobs: [
      enemy({ id: "drowned", name: "Утопленник", icon: "drowned", hp: 110, atk: 27, def: 7, gold: 30, xp: 44, prefers: ["head", "chest"], desc: "Тянется к горлу обеими руками.",
        drops: [
          { id: "algae", chance: 0.35, min: 1, max: 2 },
          { id: "iron", chance: 0.20, min: 1, max: 1 },
          { id: "wood", chance: 0.20, min: 1, max: 3 },
          { id: "cloth", chance: 0.20, min: 1, max: 3 },
          { id: "leather", chance: 0.20, min: 1, max: 3 },
          { id: "iron_ore", chance: 0.20, min: 1, max: 3 },
        ] }),
      enemy({ id: "crab", name: "Панцирный краб", icon: "crab", hp: 140, atk: 21, def: 14, gold: 32, xp: 46, prefers: ["legs"], desc: "Почти не пробивается, зато бьёт по ногам.",
        drops: [
          { id: "topaz", chance: 0.30, min: 1, max: 1 },
          { id: "iron", chance: 0.20, min: 1, max: 2 },
          { id: "wood", chance: 0.20, min: 1, max: 3 },
          { id: "cloth", chance: 0.20, min: 1, max: 3 },
          { id: "leather", chance: 0.20, min: 1, max: 3 },
          { id: "iron_ore", chance: 0.20, min: 1, max: 3 },
        ] }),
      enemy({ id: "eel", name: "Электрический угорь", icon: "eel", hp: 95, atk: 36, def: 5, gold: 28, xp: 42, prefers: ["waist", "belly"], desc: "Бьёт разрядом в бок, пока вы ждёте удара сверху.",
        drops: [
          { id: "topaz", chance: 0.35, min: 1, max: 2 },
          { id: "algae", chance: 0.20, min: 1, max: 1 },
          { id: "wood", chance: 0.20, min: 1, max: 3 },
          { id: "cloth", chance: 0.20, min: 1, max: 3 },
          { id: "leather", chance: 0.20, min: 1, max: 3 },
          { id: "iron_ore", chance: 0.20, min: 1, max: 3 },
        ] }),
    ],
    boss: enemy({ id: "gatekeeper", name: "Хранитель шлюза", icon: "gatekeeper", hp: 600, atk: 39, def: 11, gold: 240, xp: 280, prefers: ["chest", "legs"], boss: true, enrage: true, desc: "Щупальца перекрывают проход, а вода поднимается.",
      drops: [
        { id: "kite_shield", chance: 1.0, min: 1, max: 1 },
        { id: "topaz", chance: 0.60, min: 2, max: 3 },
      ] }),
  },
  { id: 4, name: "Кристальный ярус", subtitle: "Свет преломляется и режет глаза", icon: "💎",
    desc: "Стены покрыты кристаллами, которые ловят каждый луч света. Тишина здесь звенит, а отражения в гранях двигаются чуть медленнее, чем вы.",
    bg: "assets/backgrounds/floor4.webp",
    mobs: [
      enemy({ id: "golem", name: "Кристальный голем", icon: "golem", hp: 900, atk: 72, def: 34, gold: 144, xp: 204, prefers: ["chest"], desc: "Медленный, но каждый удар как обвал.",
        drops: [
          { id: "steel", chance: 0.35, min: 1, max: 2 },
          { id: "ruby", chance: 0.20, min: 1, max: 1 },
        ] }),
      enemy({ id: "shard", name: "Осколочный двойник", icon: "shard", hp: 675, atk: 90, def: 18, gold: 132, xp: 192, prefers: ["head", "waist"], desc: "Повторяет ваши движения с задержкой в полсекунды.",
        drops: [
          { id: "crystal_herb", chance: 0.30, min: 1, max: 2 },
          { id: "steel", chance: 0.20, min: 1, max: 1 },
        ] }),
      enemy({ id: "wisp", name: "Луч света", icon: "wisp", hp: 600, atk: 102, def: 14, gold: 126, xp: 186, prefers: ["belly", "legs"], desc: "Бьёт снизу, туда, где обычно не ждут.",
        drops: [
          { id: "ruby", chance: 0.30, min: 1, max: 1 },
          { id: "crystal_herb", chance: 0.20, min: 1, max: 2 },
        ] }),
    ],
    boss: enemy({ id: "sentinel", name: "Кристальный страж", icon: "sentinel", hp: 4300, atk: 108, def: 30, gold: 1260, xp: 1380, prefers: ["head", "chest"], boss: true, enrage: true, desc: "В его гранях отражается ваше же оружие.",
      drops: [
        { id: "head_crystal", chance: 1.0, min: 1, max: 1 },
        { id: "ruby", chance: 0.60, min: 2, max: 3 },
      ] }),
  },
  { id: 5, name: "Шпиль", subtitle: "Ветер, темнота и чей-то шёпот", icon: "🗼",
    desc: "Вершина Башни. Ветер вырывается из щелей, а темнота кажется гуще, чем должна быть. Где-то наверху ждёт Владыка.",
    bg: "assets/backgrounds/floor5.webp",
    mobs: [
      enemy({ id: "shadow", name: "Тень", icon: "shadow", hp: 1100, atk: 102, def: 26, gold: 186, xp: 276, prefers: ["legs", "waist"], desc: "Не отбрасывает тени, потому что сама — тень.",
        drops: [
          { id: "shadow_herb", chance: 0.35, min: 1, max: 2 },
          { id: "obsidian", chance: 0.20, min: 1, max: 1 },
        ] }),
      enemy({ id: "fallen", name: "Падший рыцарь", icon: "fallen", hp: 1450, atk: 120, def: 42, gold: 225, xp: 315, prefers: ["head", "chest"], desc: "Держит строй даже без строя.",
        drops: [
          { id: "obsidian", chance: 0.30, min: 1, max: 2 },
          { id: "diamond", chance: 0.20, min: 1, max: 1 },
        ] }),
      enemy({ id: "whisper", name: "Шёпот башни", icon: "whisper", hp: 925, atk: 132, def: 22, gold: 204, xp: 294, prefers: ["belly", "waist"], desc: "Бьёт туда, куда вы уже не смотрите.",
        drops: [
          { id: "diamond", chance: 0.30, min: 1, max: 1 },
          { id: "shadow_herb", chance: 0.20, min: 1, max: 2 },
        ] }),
    ],
    boss: enemy({ id: "lord", name: "Владыка Башни", icon: "lord", hp: 5600, atk: 132, def: 38, gold: 2700, xp: 2850, prefers: ["head", "chest"], boss: true, enrage: true, desc: "Он ждал вас на самом верху. Похоже, очень давно.",
      drops: [
        { id: "rune_blade", chance: 1.0, min: 1, max: 1 },
        { id: "diamond", chance: 0.60, min: 2, max: 3 },
      ] }),
  },
];

const TIER_HINT = {
  2: "Откроется после победы над боссом 1-го этажа",
  3: "Откроется после победы над боссом 3-го этажа",
};

const QUEST_TARGET = 3;
const QUEST_COUNT = 2;

const QUEST_MOBS = FLOORS.flatMap((floor) =>
  floor.mobs.map((mob) => ({ ...mob, floorId: floor.id }))
);

const FLOOR_RESOURCES = {
  1: [
    { id: "rust", name: "Ржавый хлам", icon: "rust", minAmount: 1, maxAmount: 3, sellPrice: 5, npc: "ron" },
    { id: "mushroom", name: "Бледный гриб", icon: "mushroom", minAmount: 1, maxAmount: 3, sellPrice: 6, npc: "elain" },
    { id: "malachite", name: "Малахит", icon: "malachite", minAmount: 1, maxAmount: 3, sellPrice: 7, npc: "elize" },
    { id: "wood", name: "Кривая доска", icon: "wood", minAmount: 1, maxAmount: 3, sellPrice: 4, npc: "ron" },
    { id: "cloth", name: "Обрывок ткани", icon: "cloth", minAmount: 1, maxAmount: 3, sellPrice: 5, npc: "elain" },
  ],
  2: [
    { id: "bone", name: "Кости", icon: "bone", minAmount: 1, maxAmount: 3, sellPrice: 10, npc: "ron" },
    { id: "herb", name: "Склероций", icon: "herb", minAmount: 1, maxAmount: 3, sellPrice: 12, npc: "elain" },
    { id: "silver", name: "Серебро", icon: "assets/resources/silver.webp", minAmount: 1, maxAmount: 3, sellPrice: 15, npc: "elize" },
    { id: "leather", name: "Кусок кожи", icon: "leather", minAmount: 1, maxAmount: 3, sellPrice: 9, npc: "elize" },
    { id: "iron_ore", name: "Железная руда", icon: "assets/resources/iron.webp", minAmount: 1, maxAmount: 3, sellPrice: 14, npc: "ron" },
  ],
  3: [
    { id: "iron", name: "Ржавое железо", icon: "iron", minAmount: 1, maxAmount: 3, sellPrice: 20, npc: "ron" },
    { id: "algae", name: "Водоросли", icon: "algae", minAmount: 1, maxAmount: 3, sellPrice: 22, npc: "elain" },
    { id: "topaz", name: "Топаз", icon: "topaz", minAmount: 1, maxAmount: 3, sellPrice: 25, npc: "elize" },
    { id: "coral", name: "Коралл", icon: "coral", minAmount: 1, maxAmount: 3, sellPrice: 24, npc: "elize" },
    { id: "scale", name: "Чешуя", icon: "scale", minAmount: 1, maxAmount: 3, sellPrice: 26, npc: "ron" },
  ],
  4: [
    { id: "steel", name: "Сталь", icon: "steel", minAmount: 1, maxAmount: 3, sellPrice: 30, npc: "ron" },
    { id: "crystal_herb", name: "Кристальная трава", icon: "crystal_herb", minAmount: 1, maxAmount: 3, sellPrice: 35, npc: "elain" },
    { id: "ruby", name: "Рубин", icon: "ruby", minAmount: 1, maxAmount: 3, sellPrice: 40, npc: "elize" },
    { id: "crystal_shard", name: "Осколок кристалла", icon: "crystal_shard", minAmount: 1, maxAmount: 3, sellPrice: 38, npc: "elize" },
    { id: "essence", name: "Эссенция света", icon: "essence", minAmount: 1, maxAmount: 3, sellPrice: 42, npc: "elain" },
  ],
  5: [
    { id: "obsidian", name: "Обсидиан", icon: "obsidian", minAmount: 1, maxAmount: 3, sellPrice: 50, npc: "ron" },
    { id: "shadow_herb", name: "Тенецвет", icon: "shadow_herb", minAmount: 1, maxAmount: 3, sellPrice: 55, npc: "elain" },
    { id: "diamond", name: "Алмаз", icon: "diamond", minAmount: 1, maxAmount: 3, sellPrice: 60, npc: "elize" },
    { id: "void_dust", name: "Прах пустоты", icon: "void_dust", minAmount: 1, maxAmount: 3, sellPrice: 58, npc: "ron" },
    { id: "dragon_scale", name: "Чешуя дракона", icon: "dragon_scale", minAmount: 1, maxAmount: 3, sellPrice: 65, npc: "elize" },
  ],
};

const ALL_RESOURCES = Object.values(FLOOR_RESOURCES).flat();

const RECIPES = [
  // 1-й этаж
  { id: "recipe_gambeson", station: "forge", result: "gambeson", desc: "Стёганый гамбезон", floor: 1, dropChance: 0.05, materials: { cloth: 4, malachite: 2 } },
  { id: "recipe_wood_club", station: "forge", result: "wood_club", desc: "Дубина", floor: 1, dropChance: 0.05, materials: { wood: 3, rust: 2 } },
  { id: "recipe_wood_shield", station: "forge", result: "wood_shield", desc: "Деревянный щит", floor: 1, dropChance: 0.05, materials: { wood: 5, malachite: 3 } },
  { id: "recipe_ring_copper", station: "jewelry", result: "ring_copper", desc: "Медное кольцо", floor: 1, dropChance: 0.05, materials: { malachite: 1, rust: 1 } },
  { id: "recipe_neck_bone", station: "jewelry", result: "neck_bone", desc: "Грубый амулет", floor: 1, dropChance: 0.05, materials: { malachite: 2, rust: 2 } },

  // 2-й этаж
  { id: "recipe_short_sword", station: "forge", result: "short_sword", desc: "Короткий меч", floor: 2, dropChance: 0.05, materials: { iron_ore: 4, wood: 2, leather: 1 } },
  { id: "recipe_leather", station: "forge", result: "leather", desc: "Кожаный доспех", floor: 2, dropChance: 0.05, materials: { leather: 6, cloth: 3, bone: 1 } },
  { id: "recipe_ring_silver", station: "jewelry", result: "ring_silver", desc: "Серебряное кольцо", floor: 2, dropChance: 0.05, materials: { silver: 4, malachite: 2 } },
  { id: "recipe_neck_guard", station: "jewelry", result: "neck_guard", desc: "Медальон караульного", floor: 2, dropChance: 0.05, materials: { silver: 5, bone: 3 } },

  // 3-й этаж
  { id: "recipe_iron_sword", station: "forge", result: "iron_sword", desc: "Железный меч", floor: 3, dropChance: 0.05, materials: { iron: 6, iron_ore: 3, leather: 2 } },
  { id: "recipe_chain", station: "forge", result: "chain", desc: "Кольчуга", floor: 3, dropChance: 0.05, materials: { iron: 8, iron_ore: 4, leather: 2 } },
  { id: "recipe_kite_shield", station: "forge", result: "kite_shield", desc: "Каплевидный щит", floor: 3, dropChance: 0.05, materials: { iron: 6, scale: 3, leather: 2 } },
  { id: "recipe_dagger", station: "forge", result: "dagger", desc: "Гранёный кинжал", floor: 3, dropChance: 0.05, materials: { iron: 4, coral: 2, leather: 1 } },

  // 4-й этаж
  { id: "recipe_battle_axe", station: "forge", result: "battle_axe", desc: "Боевой топор", floor: 4, dropChance: 0.05, materials: { steel: 6, crystal_shard: 3, leather: 2 } },
  { id: "recipe_plate", station: "forge", result: "plate", desc: "Латный доспех", floor: 4, dropChance: 0.05, materials: { steel: 10, iron: 5, crystal_shard: 2, leather: 2 } },
  { id: "recipe_ring_crystal", station: "jewelry", result: "ring_crystal", desc: "Кристальное кольцо", floor: 4, dropChance: 0.05, materials: { ruby: 5, crystal_shard: 3, essence: 1 } },
  { id: "recipe_neck_crystal", station: "jewelry", result: "neck_crystal", desc: "Кристальный подвесок", floor: 4, dropChance: 0.05, materials: { essence: 4, crystal_herb: 3, ruby: 2 } },

  // 5-й этаж
  { id: "recipe_rune_blade", station: "forge", result: "rune_blade", desc: "Рунный клинок", floor: 5, dropChance: 0.05, materials: { steel: 8, void_dust: 3, diamond: 2, dragon_scale: 1 } },
  { id: "recipe_great_axe", station: "forge", result: "great_axe", desc: "Секира палача", floor: 5, dropChance: 0.05, materials: { steel: 12, void_dust: 4, dragon_scale: 2, ruby: 3 } },
  { id: "recipe_trinket_shard", station: "jewelry", result: "trinket_shard", desc: "Кристальный осколок", floor: 5, dropChance: 0.05, materials: { void_dust: 5, crystal_herb: 3, shadow_herb: 2 } },
];

const RECIPE_MAP = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

function getRecipeById(id) { return RECIPE_MAP[id] || null; }
function getRecipes(station) { return RECIPES.filter((r) => r.station === station); }

// Каждому мобу и боссу проставляем этаж — по нему считаются рецепты и дроп.
for (const floor of FLOORS) {
  for (const mob of floor.mobs) mob.floorId = floor.id;
  floor.boss.floorId = floor.id;
}

function todaysEvent() { return WEEKLY_EVENTS[calendarInfo().weekday.id] || null; }
function forgeDiscountToday() { const ev = WEEKLY_EVENTS[calendarInfo().weekday.id]; return ev?.id === "forge_sale" ? ev.shopDiscount : 0; }
function alchemyDiscountToday() { const ev = WEEKLY_EVENTS[calendarInfo().weekday.id]; return ev?.id === "alchemy_sale" ? ev.shopDiscount : 0; }
function companionDiscountToday() { const ev = WEEKLY_EVENTS[calendarInfo().weekday.id]; return ev?.companionDiscount || 0; }
function xpMultToday() { const ev = WEEKLY_EVENTS[calendarInfo().weekday.id]; return ev?.xpMult || 1; }
function goldMultToday() { const ev = WEEKLY_EVENTS[calendarInfo().weekday.id]; return ev?.goldMult || 1; }