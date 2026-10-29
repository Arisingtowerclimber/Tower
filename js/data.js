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
  stella: "assets/portraits/stella.webp",
  arthur: "assets/portraits/arthur.webp",
  ivan: "assets/portraits/ivan.webp",
  mira: "assets/portraits/mira.webp",
  alva: "assets/portraits/alva.webp",
  solveig: "assets/portraits/solveig.webp",
};

function npcPortraitSrc(id) {
  return NPC_PORTRAITS[id] || "assets/portraits/placeholder.webp";
}

const DIALOGS = {
  ron: {
    story: [
      { 
        npc: "Стой, путник. Новое лицо в Йорстеде. Я — Рон, держу эту кузницу. Судя по твоему виду, ты идёшь в Башню.", 
        options: [
          { text: "Верно. Мне нужно снаряжение, которое не подведёт." }
        ]
      },
      { 
        npc: "Снова ты. Слышал, ты уже спустился на нижние этажи. Неплохо для новичка. Принесёшь мне хорошей руды — скуём что-нибудь стоящее.", 
        options: [
          { text: "Договорились. Буду искать руду." }
        ]
      }
    ],
    greetings: ["Сталь не ждёт, путник. Что вам нужно: клинок или крепкая броня?", "Хороший металл, хороший уголь..."],
    shop_open: "Смотри, что сегодня на прилавке.",
    quest_complete: ["С добрым материалом и работать приятно."],
    farewell: "Заходи ещё.",
  },
  elain: {
    story: [
      { 
        npc: "Осторожнее, не зацепи колбы! Я Элейн. Если ищешь снадобья, чтобы залечить раны от когтей, — ты по адресу.", 
        options: [
          { text: "Зелья мне точно пригодятся. Спасибо, хозяйка." }
        ]
      },
      { 
        npc: "О, ты вернулся! Вижу, на тебе живого места нет. Травы на исходе, но для тебя найдётся капля целебного отвара.", 
        options: [
          { text: "Буду признателен." }
        ]
      }
    ],
    greetings: ["Тише сходи, путник, не урони мой склероций."],
    shop_open: "Пузырьки не бей, перемешивать я уже успела.",
    quest_complete: ["Всё свежее, всё добротное."],
    farewell: "Не хворай.",
  },
  elize: {
    story: [
      { 
        npc: "Тише... камни не любят суеты. Я Элиза. Твоя экипировка выглядит жалко, но я могу это исправить.", 
        options: [
          { text: "Буду рад твоей работе, ювелир." }
        ]
      },
      { 
        npc: "Взгляни на этот камень. Он потускнел, когда ты вошёл. Похоже, ты видел что-то в Башне...", 
        options: [
          { text: "Там много странного." }
        ]
      }
    ],
    greetings: ["Камень без оправы — просто камень. Нужна оправа?"],
    shop_open: "Оправы вон там, камни — вот тут.",
    quest_complete: ["Прекрасный материал!"],
    farewell: "До встречи.",
  },
  stella: {
    story: [
      { 
        npc: "О, свежее лицо! Добро пожаловать в «Усталый путник». Я Стелла, здесь можно согреться и отдохнуть перед походом.", 
        options: [
          { text: "Спасибо, хозяйка. Наконец-то безопасное место." }
        ]
      },
      { 
        npc: "С возвращением, герой. Эль сегодня свежий, а слухи о твоих подвигах уже дошли до города.", 
        options: [
          { text: "Слухи всегда опережают меня." }
        ]
      }
    ],
    greetings: ["О, новый герой! Заходи, у нас как раз тепло и пусто."],
    shop_open: "Номер всё ещё стоит тот же.",
    quest_complete: ["Спасибо тебе. Вот, держи."],
    farewell: "Ночь тёплая. Заглядывай ещё.",
  },
  ivan: {
    story: [
      { 
        npc: "Новобранец? Вижу, взгляд серьёзный. Я Иван, Капитан Зала Охотников. Если хочешь выжить в Башне — слушай меня.", 
        options: [
          { text: "Буду признателен за науку, Капитан." }
        ]
      },
      { 
        npc: "Стой, герой. У меня к тебе разговор. Ты уже доказал, что умеешь держать оружие. Пришло время для настоящего задания.", 
        options: [
          { text: "Я готов." }
        ]
      }
    ],
    greetings: ["А, новобранец. Заходи. Я научу тебя выживать."],
    shop_open: "Вот мои тренировки и контракты.",
    quest_complete: ["Неплохо. Для новичка — даже отлично."],
    farewell: "Не забывай отдыхать.",
  },
  arthur: {
    story: [
      { 
        npc: "Эй, путник! Не хочешь взглянуть на мой товар? У меня есть редкие вещицы, которых нет у местных лавочников.", 
        options: [
          { text: "Показывай, что у тебя есть." }
        ]
      },
      { 
        npc: "Смотри, выбирай, не стесняйся. Цены — как в лучших домах, а товар — из-за моря!", 
        options: [
          { text: "Спасибо, я посмотрю." }
        ]
      }
    ],
    greetings: [
      "Эй, путник! Не хочешь взглянуть на мой товар?",
      "Дорогу! Торговец идёт! У меня есть то, чего нет у местных лавочников.",
      "Редкие вещицы, зелья, амулеты... Всё для настоящего героя."
    ],
    shop_open: "Смотри, выбирай, не стесняйся. Цены — как в лучших домах, а товар — из-за моря!",
    quest_take: "Мне нужно кое-что найти... Но об этом позже.",
    quest_complete: [
      "Спасибо! Держи, я всегда плачу по счетам.",
      "Отличная работа, друг мой. Вот твоя доля."
    ],
    farewell: "Удачной охоты! И заходи ещё, у меня всегда есть что-то новенькое.",
  },
};



const DEFENSE_CAP = 0.6;

const DURABILITY_MAX = 100;
const DURABILITY_LOSS_PER_FIGHT = 3;
const REPAIR_COST_PER_POINT = 0.04;

function gearItem(id, name, slot, icon, price, shopTier, stats, desc) {
  return { id, name, slot, icon, price, shopTier, desc, ...stats };
}

const ATTR_INFO = [
  { id: "str", name: "Сила", effect: "+1 к урону" },
  { id: "agi", name: "Ловкость", effect: "+1% уворот, +0.5% крит, +0.3% контратака" },
  { id: "end", name: "Выносливость", effect: "+10 к максимуму HP" },
  { id: "int", name: "Интеллект", effect: "+10 к максимуму маны" },
];

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
const BACKGROUND_STEPS = [
  {
    id: "childhood",
    title: "Детство",
    text: "Кем ты был до того, как Башня позвала тебя?",
    options: [
      { 
        id: "slums", 
        label: "Вырос в трущобах", 
        desc: "+2 Ловкость, +10 золота", 
        icon: "🏚️",
        effects: { agi: 2, gold: 10 } 
      },
      { 
        id: "smith", 
        label: "Сын кузнеца", 
        desc: "+2 Сила, +1 Выносливость, дубина", 
        icon: "⚒️",
        effects: { str: 2, end: 1, equipment: ["wood_club"] } 
      },
      { 
        id: "monastery", 
        label: "Ученик монастыря", 
        desc: "+2 Интеллект, +10 маны", 
        icon: "📖",
        effects: { int: 2, mana: 10 } 
      },
      { 
        id: "farm", 
        label: "Работал на ферме", 
        desc: "+2 Выносливость, +20 HP", 
        icon: "🌾",
        effects: { end: 2, hp: 20 } 
      }
    ]
  },
  {
    id: "youth",
    title: "Юность",
    text: "Чему ты научился, когда вырос?",
    options: [
      { 
        id: "guard", 
        label: "Служил в страже", 
        desc: "+2 Выносливость, деревянный щит", 
        icon: "🛡️",
        effects: { end: 2, equipment: ["wood_shield"] } 
      },
      { 
        id: "thief", 
        label: "Был вором", 
        desc: "+2 Ловкость, кинжал", 
        icon: "🗡️",
        effects: { agi: 2, equipment: ["dagger"] } 
      },
      { 
        id: "alchemist", 
        label: "Ученик алхимика", 
        desc: "+2 Интеллект, 2 зелья лечения", 
        icon: "🧪",
        effects: { int: 2, potions: ["hp_small", "hp_small"] } 
      },
      { 
        id: "mercenary", 
        label: "Наёмник", 
        desc: "+1 Сила, +1 Ловкость, +30 золота", 
        icon: "⚔️",
        effects: { str: 1, agi: 1, gold: 30 } 
      }
    ]
  },
  {
    id: "reason",
    title: "Причина прихода в Йорстед",
    text: "Почему ты здесь? Что гонит тебя к Башне?",
    options: [
      { 
        id: "glory", 
        label: "Ищу славу и золото", 
        desc: "+50 золота", 
        icon: "💰",
        effects: { gold: 50 } 
      },
      { 
        id: "revenge", 
        label: "Месть за семью", 
        desc: "+1 Сила, +1 Ловкость", 
        icon: "🔥",
        effects: { str: 1, agi: 1 } 
      },
      { 
        id: "exile", 
        label: "Меня сослали сюда", 
        desc: "+2 Выносливость", 
        icon: "⛓️",
        effects: { end: 2 } 
      },
      { 
        id: "knowledge", 
        label: "Ищу древние знания", 
        desc: "+2 Интеллект, +15 маны", 
        icon: "📜",
        effects: { int: 2, mana: 15 } 
      }
    ]
  }
];

const ARCHETYPES = [
  {
    id: "duelist",
    name: "Дуэлянт",
    icon: "🤺", // иконка останется в данных, но отображаться не будет
    desc: "+30% к урону, +10% к шансу крита если в правой руке есть одноручное оружие, а левая свободна. Повышенный предел уворота (до 45%). −10% к максимуму HP.",
    mods: { atk: 1, maxHp: 0.9, dodgeCap: 45, blockZones: 2, ragePerHit: 1, blockCounter: 0 },
    startEquipment: ["rusty_knife", "rags", "worn_hood", "patched_pants", "worn_boots"]
  },
   {
    id: "guardian",
    name: "Страж",
    icon: "🛡️",
    desc: "Успешный блок наносит ответный удар (10% атаки врага). Получаемый и наносимый урон снижен на 10%. Надежная защита.",
    mods: { atk: 0.9, maxHp: 1, dodgeCap: 35, blockZones: 2, ragePerHit: 1, blockCounter: 0.1, dmgTakenMult: 0.9 },
    startEquipment: ["rusty_knife", "rags", "worn_hood", "patched_pants", "worn_boots", "wood_shield"]
  },
  {
    id: "assassin",
    name: "Убийца",
    icon: "🗡️",
    desc: "Сражается двумя клинками: оружие в левой руке дает 50% урона. Повышенный предел уворота (до 45%). −10% к максимуму HP, щиты недоступны.",
    mods: { atk: 1, maxHp: 0.9, dodgeCap: 60, blockZones: 2, ragePerHit: 1, blockCounter: 0 },
    startEquipment: ["rusty_knife", "rusty_knife", "rags", "worn_hood", "patched_pants", "worn_boots"]
  },
  {
    id: "monk",
    name: "Монах",
    icon: "🧘",
    desc: "Дерётся голыми руками: урон растёт от Силы и Ловкости. Три стойки — Тигр, Журавль и Змея. Оружие запрещено полностью, но предел уворота повышен до 50%.",
    mods: { atk: 1.0, maxHp: 1.0, dodgeCap: 50, blockZones: 2, ragePerHit: 1, blockCounter: 0 },
    startEquipment: ["rags", "worn_hood", "patched_pants", "worn_boots"]
  },
];

const ARCHETYPE_MAP = Object.fromEntries(ARCHETYPES.map((a) => [a.id, a]));

// ── Стили удара и типы брони (глобальное обновление боя) ────────────────────
const STYLE_ORDER = ["slashing", "piercing", "bludgeoning"];
const STYLE_NAMES = { slashing: "Рубящий", piercing: "Колющий", bludgeoning: "Дробящий" };
const STYLE_ICONS = { slashing: "⚔", piercing: "🗡", bludgeoning: "🔨" };
const ARMOR_TYPE_NAMES = { cloth: "Ткань", leather: "Кожа", chain: "Кольчуга", plate: "Латы" };
// Насколько каждый стиль пробивает тип брони врага.
const ARMOR_STYLE_MULT = {
  piercing:    { cloth: 1.3, leather: 1.1, chain: 1.0, plate: 0.6 },
  slashing:    { cloth: 1.3, leather: 1.3, chain: 0.8, plate: 0.4 },
  bludgeoning: { cloth: 1.3, leather: 0.8, chain: 1.1, plate: 1.3 },
};
const UNARMED_DAMAGE = { slashing: 6, piercing: 4, bludgeoning: 6 }; // кулаки: любой стиль доступен
const MONK_UNARMED_STYLE_MULT = 1.0;
const MONK_DEFAULT_STANCE = "bludgeoning";
const MONK_STANCES = [
  { id: "slashing", name: "Тигр", icon: "🐯", desc: "Стойка Тигра: +10% урона, −10% уклонения." },
  { id: "piercing", name: "Журавль", icon: "🦢", desc: "Стойка Журавля: +10% уклонения, −10% урона." },
  { id: "bludgeoning", name: "Змея", icon: "🐍", desc: "Стойка Змеи: игнорирует 30% брони, −10% урона." },
];

// ── Таланты: 3 ветки, очко раз в 3 уровня ────────────────────────────────────
const TALENT_BRANCHES = [
  { id: "war",  name: "Урон",      icon: "⚔" },
  { id: "def",  name: "Стойкость", icon: "🛡" },
  { id: "util", name: "Хитрость",  icon: "👣" },
];

const TALENTS = [
  // Ветка «Урон»
  { id: "t_atk",            branch: "war",  name: "Тяжёлая рука",    desc: "+2 к урону за ранг.",                 maxRank: 5, stat: "atk",            value: 2 },
  { id: "t_crit",           branch: "war",  name: "Точный удар",     desc: "+3% к шансу крита за ранг.",          maxRank: 3, stat: "crit",           value: 3 },
  { id: "t_armorPierce",    branch: "war",  name: "Знание брони",    desc: "+5% к пробитию брони за ранг.",       maxRank: 3, stat: "armorPierce",    value: 5 },
  { id: "t_lifesteal",      branch: "war",  name: "Вампирская хватка", desc: "Атаки восстанавливают 10% HP урона.", maxRank: 1, stat: "lifesteal",      value: 10 },
  // Ветка «Стойкость»
  { id: "t_hp",             branch: "def",  name: "Крепкое тело",    desc: "+30 к максимуму HP за ранг.",         maxRank: 5, stat: "hp",             value: 30 },
  { id: "t_def",            branch: "def",  name: "Упорный",         desc: "+1 к защите за ранг.",                maxRank: 5, stat: "def",            value: 1 },
  { id: "t_regen",          branch: "def",  name: "Второе дыхание",  desc: "+5 HP за ход в бою за ранг.",         maxRank: 3, stat: "regen",          value: 5 },
  { id: "t_secondWind",     branch: "def",  name: "Невозгибимый",    desc: "Раз в бой: при HP ниже 20% восстанавливает 30% HP.", maxRank: 1, stat: "secondWind", value: 30 },
  // Ветка «Хитрость»
  { id: "t_dodge",          branch: "util", name: "Лёгкий шаг",      desc: "+2% к увороту за ранг.",              maxRank: 5, stat: "dodge",          value: 2 },
  { id: "t_lootChance",     branch: "util", name: "Везучий ищейка",  desc: "+10% к шансу дропа за ранг.",         maxRank: 3, stat: "lootChance",     value: 10 },  { id: "t_maxEnergy",      branch: "util", name: "Выносливый",      desc: "+1 к запасу энергии за ранг.",        maxRank: 3, stat: "maxEnergy",      value: 1 },
  { id: "t_counterOnDodge", branch: "util", name: "Тень",            desc: "Уворот отвечает контрударом на 50% атаки.", maxRank: 1, stat: "counterOnDodge", value: 0.5 },
];

const TALENT_MAP = Object.fromEntries(TALENTS.map((t) => [t.id, t]));

// Урон оружия по стилям (без оружия — кулаки). Экземпляр оружия передаётся
// явно из боя/UI, чтобы редкость влияла на damage без глобального состояния.
function weaponDamageFor(weapon, inst = null) {
  if (!weapon) return UNARMED_DAMAGE;
  if (!weapon.damage) return UNARMED_DAMAGE;
  if (inst && ITEMS[inst.id] === weapon) {
    const scaled = getInstanceStats(inst).damage;
    if (scaled) return scaled;
  }
  return weapon.damage;
}
function weaponStyleValue(weapon, style, inst = null) { return weaponDamageFor(weapon, inst)[style] || 0; }
// Множитель стиля: лучший стиль оружия = 1.0, слабые 0.55–1.0, ноль = не бьёт.
function weaponStyleMult(weapon, style, inst = null) {
  const d = weaponDamageFor(weapon, inst);
  const v = d[style] || 0;
  if (v <= 0) return 0;
  const best = Math.max(d.slashing, d.piercing, d.bludgeoning, 1);
  return 0.55 + 0.45 * (v / best);
}
// Сильнейший стиль оружия (для подписи «Вооружен: … (Колющий)»).
function weaponBestStyle(weapon, inst = null) {
  const d = weaponDamageFor(weapon, inst);
  return STYLE_ORDER.reduce((acc, s) => (d[s] > d[acc] ? s : acc), "slashing");
}

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
  rusty_knife: { id: "rusty_knife", name: "Ржавый нож", slot: "mainhand", icon: "assets/icons/rusty_knife.webp?v=2", atk: 4, weaponType: "sword", handed: "1h", damage: { slashing: 2, piercing: 4, bludgeoning: 0 }, price: 0, shopTier: 0, desc: "Всё, что осталось от прошлой жизни." },
  wood_club: { id: "wood_club", name: "Дубина", slot: "mainhand", icon: "🏏", atk: 16, weaponType: "mace", handed: "1h", damage: { slashing: 2, piercing: 1, bludgeoning: 16 }, price: 45, shopTier: 1, desc: "Тяжёлая, но честная." },
  short_sword: { id: "short_sword", name: "Короткий меч", slot: "mainhand", icon: "🗡️", atk: 20, crit: 2, weaponType: "sword", handed: "1h", damage: { slashing: 12, piercing: 10, bludgeoning: 0 }, price: 75, shopTier: 1, desc: "Быстрый и точный." },
  iron_sword: { id: "iron_sword", name: "Железный меч", slot: "mainhand", icon: "⚔️", atk: 36, crit: 3, weaponType: "sword", handed: "1h", damage: { slashing: 26, piercing: 12, bludgeoning: 2 }, price: 190, shopTier: 2, desc: "Работа кузнеца из нижних ярусов." },
  dagger: { id: "dagger", name: "Гранёный кинжал", slot: "mainhand", icon: "🔪", atk: 28, crit: 12, weaponType: "sword", handed: "1h", damage: { slashing: 4, piercing: 22, bludgeoning: 0 }, price: 200, shopTier: 2, desc: "Ищет щели в чужой защите." },
  battle_axe: { id: "battle_axe", name: "Боевой топор", slot: "mainhand", icon: "🪓", atk: 48, weaponType: "axe", handed: "1h", damage: { slashing: 34, piercing: 2, bludgeoning: 14 }, price: 280, shopTier: 2, desc: "Пробивает даже панцирь." },
  rune_blade: { id: "rune_blade", name: "Рунный клинок", slot: "mainhand", icon: "⚔️", atk: 72, crit: 5, weaponType: "sword", handed: "2h", damage: { slashing: 40, piercing: 15, bludgeoning: 5 }, price: 560, shopTier: 3, desc: "На лезвии проступают чужие имена." },
  great_axe: { id: "great_axe", name: "Секира палача", slot: "mainhand", icon: "🪓", atk: 96, weaponType: "axe", handed: "2h", damage: { slashing: 45, piercing: 2, bludgeoning: 20 }, price: 640, shopTier: 3, desc: "Тяжелая настолько, что бой заканчивается быстро." },

  rags: { id: "rags", name: "Рваная рубаха", slot: "chest", icon: "👕", def: 0, hp: 0, armorType: "cloth", price: 0, shopTier: 0, desc: "Лучше, чем ничего." },
  gambeson: { id: "gambeson", name: "Стёганый гамбезон", slot: "chest", icon: "🥋", def: 4, hp: 40, armorType: "cloth", mana: 5, price: 40, shopTier: 1, desc: "Мягкая броня, но держит удар." },
  leather: { id: "leather", name: "Кожаный доспех", slot: "chest", icon: "🥋", def: 6, hp: 60, armorType: "leather", price: 70, shopTier: 1, desc: "Пахнет дёгтем и старым потом." },
  chain: { id: "chain", name: "Кольчуга", slot: "chest", icon: "🥋", def: 10, hp: 90, armorType: "chain", price: 210, shopTier: 2, desc: "Тысяча колец, ни одного лишнего." },
  scale: { id: "scale", name: "Чешуйчатый доспех", slot: "chest", icon: "🥋", def: 12, hp: 110, armorType: "chain", price: 300, shopTier: 2, desc: "Чешуя снята с чего-то большого." },
  plate: { id: "plate", name: "Латный доспех", slot: "chest", icon: "🛡️", def: 16, hp: 120, armorType: "plate", price: 600, shopTier: 3, desc: "В нём слышно только собственное дыхание." },

  wood_shield: { id: "wood_shield", name: "Деревянный щит", slot: "offhand", icon: "🛡️", def: 2, block: 1, armorType: "cloth", price: 55, shopTier: 1, desc: "Третья зона блока." },
  kite_shield: { id: "kite_shield", name: "Стальной каплевидный щит", slot: "offhand", icon: "🛡️", def: 6, block: 1, armorType: "plate", price: 200, shopTier: 2, desc: "Прикрывает корпус целиком." },
  tower_shield: { id: "tower_shield", name: "Укрепленный башенный щит", slot: "offhand", icon: "🛡️", def: 10, block: 1, dodge: -2, armorType: "plate", price: 300, shopTier: 2, desc: "Стена, которую можно носить. В уклоне почти не помогает." },
  parrying_dagger: { id: "parrying_dagger", name: "Кинжал парирования", slot: "offhand", icon: "🗡️", atk: 12, crit: 2, weaponType: "sword", handed: "1h", damage: { slashing: 3, piercing: 12, bludgeoning: 0 }, price: 160, shopTier: 2, desc: "Вторая рука тоже умеет ранить." },

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

  // ── Новое оружие (weaponType/handed/damage) ──
  rapier: { id: "rapier", name: "Рапира", slot: "mainhand", icon: "🗡️", atk: 26, crit: 6, weaponType: "sword", handed: "1h", damage: { slashing: 5, piercing: 15, bludgeoning: 1 }, price: 90, shopTier: 1, desc: "Тонкий клинок для точных уколов." },
  mace: { id: "mace", name: "Булава", slot: "mainhand", icon: "🏏", atk: 30, weaponType: "mace", handed: "1h", damage: { slashing: 2, piercing: 1, bludgeoning: 14 }, price: 65, shopTier: 1, desc: "Инструмент, что правит чужие шлемы." },
  staff: { id: "staff", name: "Посох", slot: "mainhand", icon: "🦯", atk: 18, weaponType: "mace", handed: "2h", damage: { slashing: 0, piercing: 2, bludgeoning: 12 }, price: 50, shopTier: 1, desc: "Древко для сдерживания жадной толпы." },
  claws: { id: "claws", name: "Когти", slot: "mainhand", icon: "🐾", atk: 22, crit: 5, weaponType: "claw", handed: "1h", damage: { slashing: 13, piercing: 3, bludgeoning: 0 }, price: 40, shopTier: 1, desc: "Четыре дуги ржавого металла. Не для галантности." },
  sabre: { id: "sabre", name: "Сабля", slot: "mainhand", icon: "⚔️", atk: 34, crit: 4, weaponType: "sword", handed: "1h", damage: { slashing: 16, piercing: 6, bludgeoning: 2 }, price: 150, shopTier: 2, desc: "Тянущий рубящий удар с разворота." },
  spear: { id: "spear", name: "Копьё", slot: "mainhand", icon: "🔱", atk: 52, weaponType: "spear", handed: "2h", damage: { slashing: 3, piercing: 18, bludgeoning: 2 }, price: 240, shopTier: 2, desc: "Держит врага на расстоянии. Страж умеет носить его со щитом." },
  great_sword: { id: "great_sword", name: "Двуручный меч", slot: "mainhand", icon: "⚔️", atk: 68, weaponType: "sword", handed: "2h", damage: { slashing: 40, piercing: 15, bludgeoning: 5 }, price: 350, shopTier: 2, desc: "Обе руки заняты — зато дуга широка." },
  war_hammer: { id: "war_hammer", name: "Боевой молот", slot: "mainhand", icon: "🔨", atk: 76, weaponType: "mace", handed: "2h", damage: { slashing: 2, piercing: 0, bludgeoning: 45 }, price: 590, shopTier: 3, desc: "Латы против него — просто приглашение." },
  halberd: { id: "halberd", name: "Алебарда", slot: "mainhand", icon: "🪓", atk: 88, weaponType: "spear", handed: "2h", damage: { slashing: 30, piercing: 28, bludgeoning: 8 }, price: 620, shopTier: 3, desc: "Копьё, топор и крюк в одном древке." },

  // ── Тир 1 «Железо» (shopTier: 1, ниша 50–150) ──
  iron_longsword: { id: "iron_longsword", name: "Железный длинный меч", slot: "mainhand", icon: "⚔️", atk: 26, weaponType: "sword", handed: "2h", damage: { slashing: 18, piercing: 8, bludgeoning: 0 }, price: 110, shopTier: 1, desc: "Длинный клинок, требующий обеих рук." },
  iron_hatchet: { id: "iron_hatchet", name: "Железный топорик", slot: "mainhand", icon: "🪓", atk: 18, weaponType: "axe", handed: "1h", damage: { slashing: 14, piercing: 0, bludgeoning: 4 }, price: 95, shopTier: 1, desc: "Плотницкий инструмент, ставший оружием." },
  iron_battleaxe: { id: "iron_battleaxe", name: "Железная секира", slot: "mainhand", icon: "🪓", atk: 26, weaponType: "axe", handed: "2h", damage: { slashing: 20, piercing: 0, bludgeoning: 6 }, price: 150, shopTier: 1, desc: "Древко подлиннее — и размах шире." },
  iron_mace: { id: "iron_mace", name: "Железная булава", slot: "mainhand", icon: "🏏", atk: 18, weaponType: "mace", handed: "1h", damage: { slashing: 2, piercing: 0, bludgeoning: 16 }, price: 85, shopTier: 1, desc: "Грубая дробящая простота." },
  iron_maul: { id: "iron_maul", name: "Железный молот", slot: "mainhand", icon: "🔨", atk: 24, weaponType: "mace", handed: "2h", damage: { slashing: 2, piercing: 0, bludgeoning: 22 }, price: 150, shopTier: 1, desc: "Кузнечный молот, перепрофилированный по врагам." },
  iron_spear: { id: "iron_spear", name: "Железное копьё", slot: "mainhand", icon: "🔱", atk: 20, weaponType: "spear", handed: "2h", damage: { slashing: 4, piercing: 16, bludgeoning: 0 }, price: 120, shopTier: 1, desc: "Дешёвое древко с честным жалом." },

  // ── Щиты (offhand; armorType — чтобы броня видела тип) ──
  leather_shield: { id: "leather_shield", name: "Кожаный щит", slot: "offhand", icon: "🛡️", def: 3, block: 1, armorType: "leather", price: 80, shopTier: 1, desc: "Кожа на раме — легче стали, но держит." },

  // ── Тир 2 «Сталь» (shopTier: 2, ниша 150–350) ──
  steel_short_sword: { id: "steel_short_sword", name: "Стальной короткий меч", slot: "mainhand", icon: "🗡️", atk: 33, crit: 2, weaponType: "sword", handed: "1h", damage: { slashing: 18, piercing: 15, bludgeoning: 0 }, price: 160, shopTier: 2, desc: "Тот же профиль, что у железного — но сталь честнее." },
  steel_great_sword: { id: "steel_great_sword", name: "Стальной двуручный меч", slot: "mainhand", icon: "⚔️", atk: 38, weaponType: "sword", handed: "2h", damage: { slashing: 26, piercing: 12, bludgeoning: 0 }, price: 310, shopTier: 2, desc: "Клинок длиной в человека." },
  steel_rapier: { id: "steel_rapier", name: "Стальная рапира", slot: "mainhand", icon: "🗡️", atk: 30, crit: 6, weaponType: "sword", handed: "1h", damage: { slashing: 8, piercing: 22, bludgeoning: 0 }, price: 210, shopTier: 2, desc: "Укол длиннее, сталь звонче." },
  steel_axe: { id: "steel_axe", name: "Стальной топор", slot: "mainhand", icon: "🪓", atk: 26, weaponType: "axe", handed: "1h", damage: { slashing: 20, piercing: 0, bludgeoning: 6 }, price: 180, shopTier: 2, desc: "Лезвие правильной стали не вязнет." },
  steel_great_axe: { id: "steel_great_axe", name: "Стальная секира", slot: "mainhand", icon: "🪓", atk: 36, weaponType: "axe", handed: "2h", damage: { slashing: 28, piercing: 0, bludgeoning: 8 }, price: 330, shopTier: 2, desc: "Каждый замах — обещание." },
  steel_mace: { id: "steel_mace", name: "Стальная булава", slot: "mainhand", icon: "🏏", atk: 26, weaponType: "mace", handed: "1h", damage: { slashing: 4, piercing: 0, bludgeoning: 22 }, price: 190, shopTier: 2, desc: "Ребра стали сиротливо звенят по шлемам." },
  steel_maul: { id: "steel_maul", name: "Стальной молот", slot: "mainhand", icon: "🔨", atk: 34, weaponType: "mace", handed: "2h", damage: { slashing: 4, piercing: 0, bludgeoning: 30 }, price: 340, shopTier: 2, desc: "Против лат — это уже не оружие, а решение." },
  steel_spear: { id: "steel_spear", name: "Стальное копьё", slot: "mainhand", icon: "🔱", atk: 30, weaponType: "spear", handed: "2h", damage: { slashing: 6, piercing: 24, bludgeoning: 0 }, price: 250, shopTier: 2, desc: "Жало, что держит врага на расстоянии." },

  // ── Новая броня (armorType) ──
  wanderer_coat: gearItem("wanderer_coat", "Плащ странника", "chest", "🧥", 35, 1, { def: 3, hp: 45, mana: 8, armorType: "cloth" }, "Стёганая ткань, пахнущая дорогой и дымом."),
  mage_robe: gearItem("mage_robe", "Мантия чародея", "chest", "🧙", 80, 1, { def: 2, hp: 30, mana: 40, armorType: "cloth" }, "Ткань хранит тепло чужих заклинаний."),
  hard_leather: gearItem("hard_leather", "Просмолённая кожа", "chest", "🥋", 55, 1, { def: 7, hp: 55, armorType: "leather" }, "Слои кожи вяжут дёгтем в единый пласт."),
  shadow_leather: gearItem("shadow_leather", "Кожа ловца дорожек", "chest", "🥋", 180, 2, { def: 6, hp: 60, dodge: 5, armorType: "leather" }, "Сшита по следам; в ней двигаешься тише."),
  riveted_chain: gearItem("riveted_chain", "Клёпаная кольчуга", "chest", "🥋", 330, 3, { def: 13, hp: 100, armorType: "chain" }, "Каждое кольцо расклёпано вручную."),
  knight_plate: gearItem("knight_plate", "Полный латный доспех", "chest", "🛡️", 620, 3, { def: 18, hp: 140, dodge: -6, armorType: "plate" }, "Вес гасит чужие удары и вашу прыть."),
  hood_mage: gearItem("hood_mage", "Капюшон чародея", "head", "🧢", 60, 2, { def: 2, hp: 15, mana: 20, armorType: "cloth" }, "Тесьма вдоль шва отводит лишние мысли."),
  scout_gloves: gearItem("scout_gloves", "Разведческие перчатки", "hands", "🧤", 45, 1, { def: 2, hp: 10, dodge: 2, armorType: "leather" }, "Мягкая кожа, усиленная на ладонях."),
  scout_boots: gearItem("scout_boots", "Сапоги разведчика", "feet", "🥾", 50, 1, { def: 2, hp: 15, dodge: 2, armorType: "leather" }, "Подошва гасит звук собственных шагов."),
  plate_gorget: gearItem("plate_gorget", "Латный воротник", "neck", "📿", 140, 2, { def: 4, hp: 25, armorType: "plate" }, "Кольцо стали, прикрывающее горло."),

  // ── Броня тир 1 (Железо) ──
  student_robe: gearItem("student_robe", "Ученическая роба", "chest", "🧥", 50, 1, { def: 2, hp: 10, mana: 10, armorType: "cloth" }, "Роба ученика алхимика — ткань теперь пахнет травами."),
  rough_leather: gearItem("rough_leather", "Грубый кожаный доспех", "chest", "🥋", 80, 1, { def: 4, hp: 20, dodge: 2, armorType: "leather" }, "Свинженные куски, сшитые без вкуса, но вовремя."),
  rust_chain: gearItem("rust_chain", "Ржавая кольчуга", "chest", "🥋", 120, 1, { def: 8, hp: 30, armorType: "chain" }, "Кольца держат, пока не смотрят слишком пристально."),
  dented_plate: gearItem("dented_plate", "Мятые латы", "chest", "🛡️", 150, 1, { def: 12, hp: 40, dodge: -5, armorType: "plate" }, "В наследство от чьей-то глупости. Но сталь есть сталь."),

  // ── Броня тир 2 (Сталь) ──
  dense_cloth: gearItem("dense_cloth", "Плотная ткань", "chest", "🧥", 150, 2, { def: 4, hp: 20, mana: 20, armorType: "cloth" }, "Слои плотной ткани, между которыми скрывают браслеты ткача."),
  reinforced_leather: gearItem("reinforced_leather", "Укрепленная кожа", "chest", "🥋", 200, 2, { def: 8, hp: 40, dodge: 4, armorType: "leather" }, "Кожа с вбиваемыми стальными шипами."),
  steel_chain: gearItem("steel_chain", "Стальная кольчуга", "chest", "🥋", 300, 2, { def: 14, hp: 60, armorType: "chain" }, "Каждое кольцо — углеродистая сталь."),
  steel_plate: gearItem("steel_plate", "Стальные латы", "chest", "🛡️", 400, 2, { def: 20, hp: 80, dodge: -10, armorType: "plate" }, "Полный машинный вес стали; уклониться — долгая история."),

  hp_small: { id: "hp_small", name: "Малое зелье лечения", slot: "potion", icon: "🧪", type: "potion", effect: "hp", amount: 60, price: 20, shopTier: 1, desc: "Восстанавливает 60 HP." },
  hp_big:   { id: "hp_big",   name: "Большое зелье лечения", slot: "potion", icon: "⚗️", type: "potion", effect: "hp", amount: 120, price: 45, shopTier: 1, desc: "Восстанавливает 120 HP." },
  mana_small: { id: "mana_small", name: "Зелье маны", slot: "potion", icon: "🔷", type: "potion", effect: "mana", amount: 20, price: 20, shopTier: 1, desc: "Восстанавливает 20 маны." },
  smoke_bomb: { id: "smoke_bomb", name: "Дымовая бомба", icon: "💨", type: "combat", effect: "smoke", price: 30, desc: "Враг пропускает следующий удар.", slot: "potion" },
  fire_flask: { id: "fire_flask", name: "Греческий огонь", icon: "🔥", type: "combat", effect: "fire", damage: 20, price: 40, desc: "Наносит 20 урона, игнорируя броню.", slot: "potion" },
  poison_vial: { id: "poison_vial", name: "Флакон с ядом", icon: "🧪", type: "combat", effect: "poison", damage: 5, turns: 3, price: 35, desc: "Наносит 5 урона в течение 3 ходов.", slot: "potion", shopTier: 1 },
};

// armorType старой gearItem()-брони (голова/плечи/спина/руки/пояс/ноги/ступни).
const ARMOR_TYPE_BY_ID = {
  head_cloth: "cloth", head_iron: "plate", head_crystal: "plate",
  shoulder_leather: "leather", shoulder_iron: "plate", shoulder_crystal: "plate",
  back_cloak: "cloth", back_guard: "cloth", back_crystal: "plate",
  wrist_leather: "leather", wrist_chain: "chain", wrist_crystal: "plate",
  hands_gloves: "leather", hands_iron: "plate", hands_crystal: "plate",
  waist_rope: "cloth", waist_plate: "plate", waist_crystal: "plate",
  legs_leather: "leather", legs_chain: "chain", legs_crystal: "plate",
  feet_leather: "leather", feet_iron: "plate", feet_crystal: "plate",
};
for (const [id, armorType] of Object.entries(ARMOR_TYPE_BY_ID)) {
  if (ITEMS[id] && !ITEMS[id].armorType) ITEMS[id].armorType = armorType;
}

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
  return { prefers: ["chest"], armorType: "leather", gold: 10, xp: 10, ...def, maxHp: def.hp };
}

const FLOORS = [
  { id: 1, name: "Тёмный Лес", subtitle: "Гиблое место, облюбованное гоблинскими племенами", icon: "🕳️",
    desc: "Тёмный Лес — это древняя чаща, куда даже опытные охотники заходят с опаской. Исполинские деревья здесь настолько стары, что их корни выворотили землю, создав естественные ловушки. Но главная угроза — гоблины. Эти твари не просто выживают здесь, они построили свои грязные логова в корнях и дуплах. Выследить их почти невозможно, пока гоблинская стрела не вонзится вам в спину. Говорят, в самой чаще прячется их вожак, чей тесак срубил не одну голову",
    cardImg: "assets/backgrounds/duskwood.webp",
    bg: "assets/backgrounds/duskwood.webp",
    mobs: [
      enemy({ id: "goblin_scout", name: "Гоблин-разведчик", icon: "goblin_scout", hp: 140, atk: 20, def: 3, gold: 25, xp: 40, armorType: "leather", weapons: ["rusty_knife", "short_sword", "wood_club", "battle_axe"], prefers: ["legs", "belly"], desc: "Мелкий и юркий. Пытается зайти со спины и пырнуть ножом в бок.",
        drops: [
          { id: "rust", chance: 0.35, min: 1, max: 2 },
          { id: "cloth", chance: 0.25, min: 1, max: 2 },
        ] }),
      enemy({ id: "hobgoblin", name: "Хобгоблин", icon: "hobgoblin", hp: 210, atk: 26, def: 6, gold: 35, xp: 55, armorType: "leather", weapons: ["wood_club", "short_sword", "battle_axe"], prefers: ["head", "chest"], desc: "Крупнее и злее своих сородичей. Носит грубые кожаные доспехи и машет дубиной.",
        drops: [
          { id: "leather", chance: 0.30, min: 1, max: 2 },
          { id: "wood", chance: 0.20, min: 1, max: 2 },
        ] }),
      enemy({ id: "bugbear", name: "Багбир", icon: "bugbear", hp: 310, atk: 34, def: 10, gold: 50, xp: 75, armorType: "leather", weapons: ["wood_club", "battle_axe"], prefers: ["chest", "belly"], desc: "Медлительный и уродливый гигант. Каждый его удар проламывает кости.",
        drops: [
          { id: "bone", chance: 0.35, min: 1, max: 3 },
          { id: "iron_ore", chance: 0.20, min: 1, max: 1 },
        ] }),
    ],
    boss: enemy({ id: "goblin_chief", name: "Вождь Гоблинов", icon: "goblin_chief", hp: 1200, atk: 45, def: 14, gold: 250, xp: 300, armorType: "plate", prefers: ["head", "chest", "belly"], boss: true, enrage: true, desc: "Огромный, покрытый шрамами гоблин. Вооружен ржавым тесаком. В ярости его удары сокрушают всё.",
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
        hp: 350, atk: 36, def: 12, gold: 60, xp: 84, armorType: "chain", weapons: ["short_sword", "spear", "battle_axe"], prefers: ["chest", "legs"], desc: "Восставший из старой могилы...",
        drops: [
          { id: "bone", chance: 0.40, min: 1, max: 2 },
          { id: "rust", chance: 0.20, min: 1, max: 3 },
        ] 
      }),
      enemy({ 
        id: "unquiet_ghost", 
        name: "Неупокоенный призрак", 
        icon: "unquiet_ghost", // <-- ИЗМЕНЕНО
        hp: 400, atk: 42, def: 6, gold: 65, xp: 90, armorType: "cloth", weapons: ["staff"], prefers: ["head", "belly"], desc: "Полупрозрачный силуэт...",
        drops: [
          { id: "bone", chance: 0.30, min: 1, max: 2 },
          { id: "herb", chance: 0.20, min: 1, max: 2 },
        ] 
      }),
      enemy({ 
        id: "crypt_ghoul", 
        name: "Свежий Упырь", 
        icon: "crypt_ghoul", // <-- ИЗМЕНЕНО
        hp: 480, atk: 48, def: 16, gold: 75, xp: 105, armorType: "cloth", weapons: ["claws"], prefers: ["waist", "chest"], desc: "Пожиратель падали...",
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
      hp: 2100, atk: 64, def: 28, gold: 450, xp: 480, armorType: "plate", prefers: ["head", "chest", "belly"], boss: true, enrage: true, desc: "Павший паладин...",
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
      enemy({ id: "crab", name: "Панцирный краб", icon: "crab", hp: 140, atk: 21, def: 14, gold: 32, xp: 46, armorType: "plate", prefers: ["legs"], desc: "Почти не пробивается, зато бьёт по ногам.",
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
    boss: enemy({ id: "gatekeeper", name: "Хранитель шлюза", icon: "gatekeeper", hp: 600, atk: 39, def: 11, gold: 240, xp: 280, armorType: "plate", prefers: ["chest", "legs"], boss: true, enrage: true, desc: "Щупальца перекрывают проход, а вода поднимается.",
      drops: [
        { id: "kite_shield", chance: 1.0, min: 1, max: 1 },
        { id: "topaz", chance: 0.60, min: 2, max: 3 },
      ] }),
  },
  { id: 4, name: "Кристальный ярус", subtitle: "Свет преломляется и режет глаза", icon: "💎",
    desc: "Стены покрыты кристаллами, которые ловят каждый луч света. Тишина здесь звенит, а отражения в гранях двигаются чуть медленнее, чем вы.",
    bg: "assets/backgrounds/floor4.webp",
    mobs: [
      enemy({ id: "golem", name: "Кристальный голем", icon: "golem", hp: 900, atk: 72, def: 34, gold: 144, xp: 204, armorType: "plate", prefers: ["chest"], desc: "Медленный, но каждый удар как обвал.",
        drops: [
          { id: "steel", chance: 0.35, min: 1, max: 2 },
          { id: "ruby", chance: 0.20, min: 1, max: 1 },
        ] }),
      enemy({ id: "shard", name: "Осколочный двойник", icon: "shard", hp: 675, atk: 90, def: 18, gold: 132, xp: 192, armorType: "plate", prefers: ["head", "waist"], desc: "Повторяет ваши движения с задержкой в полсекунды.",
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
    boss: enemy({ id: "sentinel", name: "Кристальный страж", icon: "sentinel", hp: 4300, atk: 108, def: 30, gold: 1260, xp: 1380, armorType: "plate", prefers: ["head", "chest"], boss: true, enrage: true, desc: "В его гранях отражается ваше же оружие.",
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
    boss: enemy({ id: "lord", name: "Владыка Башни", icon: "lord", hp: 5600, atk: 132, def: 38, gold: 2700, xp: 2850, armorType: "plate", prefers: ["head", "chest"], boss: true, enrage: true, desc: "Он ждал вас на самом верху. Похоже, очень давно.",
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
  ],
  2: [
    {
      id: "strange_grave",
      title: "Странная могила",
      text: "Среди старых ниш стоит могила без имени. Земля взрыта свежо — чей-то труд или чья-то приманка. Можно пройти мимо, а можно порыться в рыхлой земле.",
      actions: [
        { id: "leave", label: "🚶 Пойти дальше" },
        { id: "dig", label: "⛏ Порыскать" },
      ],
      group: [0, 2],
    },
  ],
};

// ── NPC (Этап 3) ───────────────────────────────────────────────────────────
// События исследования могут открывать диалог NPC. Портреты — через npcPortraitSrc().
const TRADER_PRICE_MULT = 1.5; // странствующий торговец берёт на 50% дороже лавочной цены

// Артур — странствующий торговец: появляется только из ивентов исследования в Башне.
const NPCS = {
  arthur: {
    id: "arthur",
    name: "Артур, странствующий торговец",
    portrait: "arthur",
    text: "Дорогу! Торговец идёт! У меня есть то, чего нет у местных лавочников — редкие вещицы, зелья, амулеты. Цены — как в лучших домах, а товар — из-за моря.",
    options: [
      { id: "show-goods", label: "💰 Показать товары" },
      { id: "leave", label: "🚶 Уйти" },
    ],
  },
};

const RECIPES = [
  // ── 1-Й ЭТАЖ (Тир 0 и Железо/Тир 1) ──
  { id: "recipe_gambeson", station: "forge", result: "gambeson", desc: "Стёганый гамбезон", floor: 1, dropChance: 0.05, materials: { cloth: 4, malachite: 2 } },
  { id: "recipe_wood_club", station: "forge", result: "wood_club", desc: "Дубина", floor: 1, dropChance: 0.05, materials: { wood: 3, rust: 2 } },
  { id: "recipe_wood_shield", station: "forge", result: "wood_shield", desc: "Деревянный щит", floor: 1, dropChance: 0.05, materials: { wood: 5, malachite: 3 } },
  { id: "recipe_leather_shield", station: "forge", result: "leather_shield", desc: "Кожаный щит", floor: 1, dropChance: 0.05, materials: { leather: 4, wood: 4 } },
  { id: "recipe_head_cloth", station: "forge", result: "head_cloth", desc: "Тканевый капюшон", floor: 1, dropChance: 0.05, materials: { cloth: 3, rust: 1 } },
  { id: "recipe_back_cloak", station: "forge", result: "back_cloak", desc: "Рваный плащ", floor: 1, dropChance: 0.05, materials: { cloth: 4, wood: 1 } },
  { id: "recipe_hands_gloves", station: "forge", result: "hands_gloves", desc: "Рабочие перчатки", floor: 1, dropChance: 0.05, materials: { leather: 2, cloth: 2 } },
  { id: "recipe_waist_rope", station: "forge", result: "waist_rope", desc: "Верёвочный пояс", floor: 1, dropChance: 0.05, materials: { cloth: 3, wood: 2 } },
  { id: "recipe_student_robe", station: "forge", result: "student_robe", desc: "Ученическая роба", floor: 1, dropChance: 0.05, materials: { cloth: 5, malachite: 2 } },
  { id: "recipe_iron_hatchet", station: "forge", result: "iron_hatchet", desc: "Железный топорик", floor: 1, dropChance: 0.05, materials: { iron_ore: 2, wood: 4, rust: 2 } },
  { id: "recipe_iron_battleaxe", station: "forge", result: "iron_battleaxe", desc: "Железная секира", floor: 1, dropChance: 0.05, materials: { iron_ore: 4, wood: 4 } },
  { id: "recipe_ring_copper", station: "jewelry", result: "ring_copper", desc: "Медное кольцо", floor: 1, dropChance: 0.05, materials: { malachite: 1, rust: 1 } },
  { id: "recipe_neck_bone", station: "jewelry", result: "neck_bone", desc: "Грубый амулет", floor: 1, dropChance: 0.05, materials: { malachite: 2, rust: 2 } },
  { id: "recipe_trinket_coin", station: "jewelry", result: "trinket_coin", desc: "Счастливая монета", floor: 1, dropChance: 0.05, materials: { malachite: 2, rust: 2 } },

  // ── 2-Й ЭТАЖ (Железо высшего тира и Сталь/Тир 2) ──
  { id: "recipe_short_sword", station: "forge", result: "short_sword", desc: "Короткий меч", floor: 2, dropChance: 0.05, materials: { iron_ore: 4, wood: 2, leather: 1 } },
  { id: "recipe_iron_longsword", station: "forge", result: "iron_longsword", desc: "Железный длинный меч", floor: 2, dropChance: 0.05, materials: { iron_ore: 6, wood: 2, leather: 1 } },
  { id: "recipe_iron_mace", station: "forge", result: "iron_mace", desc: "Железная булава", floor: 2, dropChance: 0.05, materials: { iron_ore: 5, wood: 2 } },
  { id: "recipe_iron_maul", station: "forge", result: "iron_maul", desc: "Железный молот", floor: 2, dropChance: 0.05, materials: { iron_ore: 8, wood: 4 } },
  { id: "recipe_iron_spear", station: "forge", result: "iron_spear", desc: "Железное копьё", floor: 2, dropChance: 0.05, materials: { iron_ore: 4, wood: 5 } },
  { id: "recipe_parrying_dagger", station: "forge", result: "parrying_dagger", desc: "Кинжал парирования", floor: 2, dropChance: 0.05, materials: { iron_ore: 4, leather: 2, silver: 1 } },
  
  { id: "recipe_leather", station: "forge", result: "leather", desc: "Кожаный доспех", floor: 2, dropChance: 0.05, materials: { leather: 6, cloth: 3, bone: 1 } },
  { id: "recipe_wanderer_coat", station: "forge", result: "wanderer_coat", desc: "Плащ странника", floor: 2, dropChance: 0.05, materials: { cloth: 5, leather: 2, bone: 1 } },
  { id: "recipe_rough_leather", station: "forge", result: "rough_leather", desc: "Грубый кожаный доспех", floor: 2, dropChance: 0.05, materials: { leather: 8, iron_ore: 2 } },
  { id: "recipe_head_iron", station: "forge", result: "head_iron", desc: "Железный шлем", floor: 2, dropChance: 0.05, materials: { iron_ore: 5, leather: 2 } },
  { id: "recipe_shoulder_leather", station: "forge", result: "shoulder_leather", desc: "Кожаные наплечники", floor: 2, dropChance: 0.05, materials: { leather: 4, iron_ore: 1 } },
  { id: "recipe_wrist_leather", station: "forge", result: "wrist_leather", desc: "Кожаные наручи", floor: 2, dropChance: 0.05, materials: { leather: 3, cloth: 1 } },
  { id: "recipe_legs_leather", station: "forge", result: "legs_leather", desc: "Кожаные штаны", floor: 2, dropChance: 0.05, materials: { leather: 5, cloth: 2 } },
  { id: "recipe_feet_leather", station: "forge", result: "feet_leather", desc: "Кожаные сапоги", floor: 2, dropChance: 0.05, materials: { leather: 4, cloth: 2 } },
  
  // Сталь (Тир 2)
  { id: "recipe_dense_cloth", station: "forge", result: "dense_cloth", desc: "Плотная ткань", floor: 2, dropChance: 0.05, materials: { steel: 2, cloth: 5, bone: 2 } },
  { id: "recipe_shadow_leather", station: "forge", result: "shadow_leather", desc: "Кожа ловца дорожек", floor: 2, dropChance: 0.05, materials: { steel: 2, leather: 6, bone: 2 } },
  { id: "recipe_steel_chain", station: "forge", result: "steel_chain", desc: "Стальная кольчуга", floor: 2, dropChance: 0.05, materials: { steel: 5, iron_ore: 4, leather: 2 } },
  { id: "recipe_steel_plate", station: "forge", result: "steel_plate", desc: "Стальные латы", floor: 2, dropChance: 0.05, materials: { steel: 8, iron_ore: 5, leather: 2 } },
  { id: "recipe_steel_short_sword", station: "forge", result: "steel_short_sword", desc: "Стальной короткий меч", floor: 2, dropChance: 0.05, materials: { steel: 4, iron_ore: 2, leather: 1 } },
  { id: "recipe_steel_great_sword", station: "forge", result: "steel_great_sword", desc: "Стальной двуручный меч", floor: 2, dropChance: 0.05, materials: { steel: 8, iron_ore: 4, leather: 2 } },
  { id: "recipe_steel_rapier", station: "forge", result: "steel_rapier", desc: "Стальная рапира", floor: 2, dropChance: 0.05, materials: { steel: 5, silver: 2, leather: 1 } },
  { id: "recipe_steel_axe", station: "forge", result: "steel_axe", desc: "Стальной топор", floor: 2, dropChance: 0.05, materials: { steel: 5, iron_ore: 3 } },
  { id: "recipe_steel_mace", station: "forge", result: "steel_mace", desc: "Стальная булава", floor: 2, dropChance: 0.05, materials: { steel: 6, iron_ore: 3 } },
  { id: "recipe_steel_maul", station: "forge", result: "steel_maul", desc: "Стальной молот", floor: 2, dropChance: 0.05, materials: { steel: 10, wood: 2 } },
  { id: "recipe_steel_spear", station: "forge", result: "steel_spear", desc: "Стальное копьё", floor: 2, dropChance: 0.05, materials: { steel: 6, wood: 5 } },
  { id: "recipe_tower_shield", station: "forge", result: "tower_shield", desc: "Укрепленный башенный щит", floor: 2, dropChance: 0.05, materials: { steel: 6, iron_ore: 4, leather: 2 } },
  { id: "recipe_hood_mage", station: "forge", result: "hood_mage", desc: "Капюшон чародея", floor: 2, dropChance: 0.05, materials: { steel: 2, cloth: 4, bone: 2 } },
  { id: "recipe_scout_gloves", station: "forge", result: "scout_gloves", desc: "Разведческие перчатки", floor: 2, dropChance: 0.05, materials: { steel: 2, leather: 5 } },
  { id: "recipe_scout_boots", station: "forge", result: "scout_boots", desc: "Сапоги разведчика", floor: 2, dropChance: 0.05, materials: { steel: 3, leather: 6 } },
  
  // Ювелирка 2-го этажа
  { id: "recipe_ring_silver", station: "jewelry", result: "ring_silver", desc: "Серебряное кольцо", floor: 2, dropChance: 0.05, materials: { silver: 4, malachite: 2 } },
  { id: "recipe_neck_guard", station: "jewelry", result: "neck_guard", desc: "Медальон караульного", floor: 2, dropChance: 0.05, materials: { silver: 5, bone: 3 } },
  { id: "recipe_plate_gorget", station: "jewelry", result: "plate_gorget", desc: "Латный воротник", floor: 2, dropChance: 0.05, materials: { silver: 3, steel: 4, leather: 2 } },
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