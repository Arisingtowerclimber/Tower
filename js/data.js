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

// ── Ветки разговоров с NPC (Этап 3) ───────────────────────────────────────
// «Поболтать» открывает список тем. Тема открыта, если репутация фракции
// NPC >= minRep И этаж state.maxFloor >= minFloor. У NPC без фракции
// (стелла, иван) minRep игнорируется. Прочитанные темы помечает
// state.dialogTopicsSeen ключом «npc:topic».
const DIALOG_BRANCHES = {
  ron: [
    {
      id: "tower_depths", title: "О Башне", minRep: 0, minFloor: 1,
      replies: [
        "Пять этажей, и каждый глубже. Мы, кузнецы, вглубь не ходим — руду нам носят. Ты — ходишь, и это честно.",
        "Металл из глубин звенит иначе. Приведёшь — расскажу, как он лёг в оправу.",
      ],
    },
    {
      id: "coal_and_temper", title: "О мастерстве", minRep: 5, minFloor: 1,
      replies: [
        "Уголь горячий, а терпение — горячее. Поспешишь с закалкой — клинок сломается на первом ударе. Как и любой совет, что даю наспех.",
        "Хороший кузнец ковает то, что просят. Мастер кует то, что нужно. Разницу видят через этаж, не раньше.",
      ],
    },
    {
      id: "guild_debt", title: "О фракции", minRep: 10, minFloor: 1,
      replies: [
        "Гильдия помнит, кто ей помог. Скидка — не милость, а долг, взысканный материалом. Работай дальше — станешь «Почтенным».",
        "Мы считаем репутацию в заказах: сданный по совести заказ — плюс к славе, минус к головной боли.",
      ],
    },
    {
      id: "demon_lord_rumor", title: "О Владыке Бездны", minRep: 20, minFloor: 5,
      replies: [
        "Владыка Бездны — его трон выкован из проклятых душ. Из адского камня всё же что-то куют: я держал осколок. Тяжёлый, как грех.",
        "Наверх тебе одному хода нет. Начни с обычного железа. Им же, если повезёт, и закончишь.",
      ],
    },
  ],
  elain: [
    {
      id: "herb_pot", title: "О зельях", minRep: 0, minFloor: 1,
      replies: [
        "Хороший отвар — это терпение. Поспешишь настаивать — окажется компот. Хотя бы вкусный.",
        "Мои зелья лечат всё, кроме глупости. С ней ты справишься сам — если добавишь смирением.",
      ],
    },
    {
      id: "cave_mushrooms", title: "О грибах", minRep: 5, minFloor: 2,
      replies: [
        "Пещерный гриб из шахт кобольдов — мой лучший помощник. Кислая порода им только на пользу, как, впрочем, и мне.",
        "Если увидишь гриб с рунной пылью на шляпке — неси мне целиком. С пылью. Он дорогой.",
      ],
    },
    {
      id: "guild_still", title: "О фракции", minRep: 10, minFloor: 1,
      replies: [
        "Цех алхимиков доверяет тем, кто приносит склероций, а не чужие сапоги. Ты пока в списке хороших. Список короткий.",
        "Репутация в цехе пахнет травами, а не деньгами. Это редкое качество для Легенд.",
      ],
    },
  ],
  elize: [
    {
      id: "quiet_stones", title: "О камнях", minRep: 0, minFloor: 1,
      replies: [
        "Камень без оправы — просто камень. С оправой — обещание. Правила одинаковые и для кольца, и для человека.",
        "Тише. Слушай, как блеск ловит свет. Именно за этот звук я беру серебро.",
      ],
    },
    {
      id: "gravesilver", title: "О серебре", minRep: 5, minFloor: 3,
      replies: [
        "Серебро из склепа ходит тихо, как его прежние хозяева. Работать с ним одно удовольствие — оно уже приучено к тишине.",
        "Проклятую ткань трогай только чистыми руками, иначе оправа запомнит твои отпечатки. Правило склепа, и я его не меняю.",
      ],
    },
    {
      id: "guild_lights", title: "О фракции", minRep: 10, minFloor: 1,
      replies: [
        "Ювелирный дом свет в воздухе не тратит: доверие даётся один раз и блистает, пока не запылится.",
        "К нам в доверие идут через камни и серебро — то есть через мои руки. Ты меня понял.",
      ],
    },
  ],
  stella: [
    {
      id: "tavern_house", title: "О гостинице", minRep: 0, minFloor: 1,
      replies: [
        "У нас в «Усталом путнике» правила простые: платишь за ночь — спишь. Не платишь — слушаешь истории. Второе дороже.",
        "Горницы свежие, эль свежий, постояльцы... наполовину свежие. Заходи, отогреешься — у нас как раз тихо.",
      ],
    },
    {
      id: "hero_rumors", title: "О постояльцах", minRep: 0, minFloor: 2,
      replies: [
        "Третий год мимо моей кухни не проходил герой, который не слышал о Владыке снизу. Слухи у нас созревают быстрее хлеба.",
        "Слухи бывают разные: про героев с золотыми глазами и про героев с пустым кошельком. Первые мне нравятся больше, зато вторые чаще платят за ночь.",
      ],
    },
    {
      id: "fatigue", title: "Об отдыхе", minRep: 0, minFloor: 3,
      replies: [
        "Отдых в счёт геройской карьеры не идёт, но идёт в счёт её продолжительности. Спи, тебе говорят.",
        "«Усталый путник» назван так, потому что усталые после подъёма сюда не доходят. Ты — дошёл. Значит, рано или поздно дойдёшь и в Башне.",
      ],
    },
  ],
  ivan: [
    {
      id: "training", title: "О тренировках", minRep: 0, minFloor: 1,
      replies: [
        "Тренировки — это когда ты бьёшь манекен, а по окончании манекен уходит к лекарям. Начнём с малого: с краткости.",
        "Сначала учу выживать. Потом учу побеждать. Порядок важен, пропустишь — станешь расходным уроком.",
      ],
    },
    {
      id: "deeper_floors", title: "О глубине", minRep: 0, minFloor: 3,
      replies: [
        "Начиная с третьего этажа тактика меняется: то, что громче тебя, встречает тебя первым. Помни об этом, когда выбираешь, чем сегодня вооружён.",
        "Не забывай про глубину — она задаёт порядок мыслей: сначала броня, потом подвиги.",
      ],
    },
    {
      id: "captain_past", title: "О прошлом Капитана", minRep: 0, minFloor: 2,
      replies: [
        "Прежде чем стать Капитаном, я был просто Иваном. Все мы когда-то были просто новобранцами. Не отвлекай меня от наставлений.",
        "Есть вещи, о которых Капитан не рассказывает. Поверь, они бы тебе понравились. Именно поэтому — ничего.",
      ],
    },
  ],
};

// ── Фракции и репутация (Этап 1) ───────────────────────────────────────────
// Каждый NPC с лавкой представляет свою фракцию. Ежедневные заказы
// (weeklyQuests) повышают репутацию фракции, что даёт скидку в её лавке.
const FACTIONS = [
  { id: "smiths", name: "Гильдия кузнецов", npc: "ron", icon: "⚒️" },
  { id: "alchemists", name: "Цех алхимиков", npc: "elain", icon: "⚗️" },
  { id: "jewelers", name: "Ювелирный дом", npc: "elize", icon: "💍" },
];
const FACTION_MAP = Object.fromEntries(FACTIONS.map((f) => [f.id, f]));
const FACTION_TIERS = [
  { min: 0,  name: "Незнакомец", discount: 0 },
  { min: 5,  name: "Знакомый",   discount: 0.05 },
  { min: 10, name: "Уважаемый",  discount: 0.10 },
  { min: 20, name: "Почтенный",  discount: 0.15 },
  { min: 35, name: "Легенда",    discount: 0.20 },
];
const FACTION_BY_NPC = Object.fromEntries(FACTIONS.map((f) => [f.npc, f.id]));
const SHOP_FACTION = { forge: "smiths", alchemy: "alchemists", jewelry: "jewelers" };

// Текущий тир репутации и следующий тир (для прогресса).
function factionTier(rep) {
  rep = Number.isFinite(rep) ? Math.max(0, rep) : 0;
  let index = 0;
  for (let i = 0; i < FACTION_TIERS.length; i++) {
    if (rep >= FACTION_TIERS[i].min) index = i;
  }
  return { tier: FACTION_TIERS[index], tierIndex: index, next: FACTION_TIERS[index + 1] || null };
}

function factionForNpc(npcId) {
  const id = FACTION_BY_NPC[npcId];
  return id ? FACTION_MAP[id] : null;
}

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
const WEAPON_TYPE_NAMES = { sword: "Мечи/Рапиры", axe: "Топоры", mace: "Булавы/Молоты", spear: "Копья/Алебарды" };
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
// === ITEMS: Бронза (этаж 2) ===
  bronze_sword: { id: "bronze_sword", name: "Бронзовый меч", slot: "mainhand", icon: "🗡️", atk: 30, crit: 4, dodge: 2, weaponType: "sword", handed: "1h", damage: { slashing: 18, piercing: 12, bludgeoning: 0 }, price: 130, shopTier: 2, desc: "Тусклая бронза, выкованная в глубине шахты, — режет не хуже стали." },
  bronze_axe: { id: "bronze_axe", name: "Бронзовый топор", slot: "mainhand", icon: "🪓", atk: 34, crit: 2, dodge: 2, weaponType: "axe", handed: "1h", damage: { slashing: 26, piercing: 0, bludgeoning: 8 }, price: 150, shopTier: 2, desc: "Лёгкий топор с бронзовым лезвием, что входит в кость с одного замаха." },
  bronze_mace: { id: "bronze_mace", name: "Бронзовая булава", slot: "mainhand", icon: "🏏", atk: 38, crit: 2, dodge: 2, weaponType: "mace", handed: "1h", damage: { slashing: 3, piercing: 0, bludgeoning: 35 }, price: 170, shopTier: 2, desc: "Шиповатое бронзовое навершие дробит шлемы и черепа одинаково легко." },

  bronze_shield: { id: "bronze_shield", name: "Бронзовый щит", slot: "offhand", icon: "🛡️", def: 4, block: 1, dodge: 2, armorType: "leather", price: 90, shopTier: 2, desc: "Лёгкий бронзовый щит, за которым проще уйти от удара." },

  bronze_head: gearItem("bronze_head", "Бронзовый шлем", "head", "⛑️", 70, 2, { def: 4, hp: 45, dodge: 2, armorType: "leather" }, "Бронзовый шлем рудокопа, что гасит и камнепад, и удар."),
  bronze_chest: gearItem("bronze_chest", "Бронзовый нагрудник", "chest", "🥋", 120, 2, { def: 8, hp: 70, dodge: 1, armorType: "leather" }, "Нагрудник из звонкой бронзы, лёгкий настолько, что не мешает уклоняться."),
  bronze_hands: gearItem("bronze_hands", "Бронзовые перчатки", "hands", "🧤", 60, 2, { def: 4, hp: 40, dodge: 3, armorType: "leather" }, "Бронзовые перчатки, оставляющие пальцы свободными для кирки."),
  bronze_feet: gearItem("bronze_feet", "Бронзовые сапоги", "feet", "🥾", 70, 2, { def: 5, hp: 45, dodge: 3, armorType: "leather" }, "Лёгкие бронзовые сапоги, в которых шаг становится тише."),

  bronze_ring: gearItem("bronze_ring", "Бронзовое кольцо", "ring", "💍", 60, 2, { crit: 2 }, "Простое бронзовое кольцо, отполированное до зеркального блеска."),
  bronze_neck: gearItem("bronze_neck", "Бронзовый амулет", "neck", "📿", 65, 2, { dodge: 2 }, "Амулет из бронзы, чей тихий звон отводит беду."),
// === ITEMS: Сталь (этаж 3) ===
  steel_knight_sword: { id: "steel_knight_sword", name: "Рыцарский стальной меч", slot: "mainhand", icon: "⚔️", atk: 42, crit: 3, weaponType: "sword", handed: "1h", damage: { slashing: 26, piercing: 16, bludgeoning: 0 }, price: 220, shopTier: 2, desc: "Прямой рыцарский клинок из холодной стали." },
  steel_zweihander: { id: "steel_zweihander", name: "Стальной двуручник", slot: "mainhand", icon: "⚔️", atk: 50, weaponType: "sword", handed: "2h", damage: { slashing: 34, piercing: 16, bludgeoning: 0 }, price: 320, shopTier: 2, desc: "Двуручник, чей клинок длиннее человеческой тени." },
  steel_sledge: { id: "steel_sledge", name: "Стальная кувалда", slot: "mainhand", icon: "🔨", atk: 58, weaponType: "mace", handed: "2h", damage: { slashing: 3, piercing: 0, bludgeoning: 55 }, price: 380, shopTier: 2, desc: "Кузнечная кувалда, перекованная в орудие для черепов." },

  steel_bulwark: { id: "steel_bulwark", name: "Стальной оплот", slot: "offhand", icon: "🛡️", def: 6, block: 1, armorType: "plate", price: 180, shopTier: 2, desc: "Стальной щит, за которым можно переждать целый бой." },

  steel_head: gearItem("steel_head", "Стальной шлем", "head", "⛑️", 150, 2, { def: 8, hp: 80, armorType: "plate" }, "Глухой стальной шлем, оставляющий лишь щель для глаз."),
  steel_chest: gearItem("steel_chest", "Стальная кираса", "chest", "🛡️", 300, 2, { def: 14, hp: 120, armorType: "plate" }, "Тяжёлая стальная кираса, что глушит и удар, и страх."),
  steel_legs: gearItem("steel_legs", "Стальные поножи", "legs", "👖", 240, 2, { def: 12, hp: 100, armorType: "plate" }, "Стальные поножи, в которых шаг становится гулким."),
  steel_feet: gearItem("steel_feet", "Стальные сапоги", "feet", "🥾", 200, 2, { def: 10, hp: 90, armorType: "plate" }, "Стальные сапоги, что вбивают врага в землю."),

  steel_ring: gearItem("steel_ring", "Стальное кольцо", "ring", "💍", 150, 2, { crit: 3 }, "Стальное кольцо, холодящее палец перед точным ударом."),
  steel_trinket: gearItem("steel_trinket", "Стальной талисман", "trinket", "🔮", 140, 2, { hp: 60 }, "Талисман из стали, дающий телу вторую прочность."),
// === ITEMS: Мифрил (этаж 4) ===
  mithril_sword: { id: "mithril_sword", name: "Мифриловый меч", slot: "mainhand", icon: "🗡️", atk: 62, crit: 5, weaponType: "sword", handed: "1h", damage: { slashing: 38, piercing: 24, bludgeoning: 0 }, price: 480, shopTier: 3, desc: "Клинок из мифрила, что поёт в воздухе, предсказывая крит." },
  mithril_halberd: { id: "mithril_halberd", name: "Мифриловая алебарда", slot: "mainhand", icon: "🪓", atk: 70, crit: 4, weaponType: "spear", handed: "2h", damage: { slashing: 30, piercing: 34, bludgeoning: 6 }, price: 560, shopTier: 3, desc: "Мифриловая алебарда — копьё и топор в одном древке." },
  mithril_axe: { id: "mithril_axe", name: "Мифриловая секира", slot: "mainhand", icon: "🪓", atk: 78, crit: 3, weaponType: "axe", handed: "2h", damage: { slashing: 58, piercing: 0, bludgeoning: 20 }, price: 640, shopTier: 3, desc: "Двуручная секира из мифрила, рассекающая воздух и броню." },

  mithril_shield: { id: "mithril_shield", name: "Мифриловый щит", slot: "offhand", icon: "🛡️", def: 8, block: 2, armorType: "plate", price: 320, shopTier: 3, desc: "Мифриловый щит, лёгкий как перо и прочный как скала." },

  mithril_head: gearItem("mithril_head", "Мифриловый шлем", "head", "💠", 320, 3, { def: 12, hp: 100, crit: 2, armorType: "chain" }, "Мифриловый шлем, чьи грани ловят свет и чужой взгляд."),
  mithril_chest: gearItem("mithril_chest", "Мифриловая кольчуга", "chest", "🥋", 560, 3, { def: 16, hp: 130, crit: 3, armorType: "chain" }, "Мифриловая кольчуга, лёгкая настолько, что не замедляет руку."),
  mithril_hands: gearItem("mithril_hands", "Мифриловые перчатки", "hands", "🧤", 300, 3, { def: 12, hp: 100, crit: 3, armorType: "chain" }, "Мифриловые перчатки, в которых пальцы точны до дрожи."),
  mithril_legs: gearItem("mithril_legs", "Мифриловые поножи", "legs", "👖", 420, 3, { def: 14, hp: 115, crit: 2, armorType: "chain" }, "Мифриловые поножи, что невесомы на ноге."),

  mithril_ring: gearItem("mithril_ring", "Мифриловое кольцо", "ring", "💍", 350, 3, { crit: 4 }, "Кольцо из мифрила, обострившее глаз до предела."),
  mithril_trinket: gearItem("mithril_trinket", "Мифриловый амулет", "trinket", "🔮", 340, 3, { crit: 3 }, "Мифриловый амулет, что шепчет, куда бить."),
// === ITEMS: Адский камень (этаж 5) ===
  hell_great_sword: { id: "hell_great_sword", name: "Двуручник из адского камня", slot: "mainhand", icon: "⚔️", atk: 92, dodge: -2, weaponType: "sword", handed: "2h", damage: { slashing: 58, piercing: 34, bludgeoning: 0 }, price: 780, shopTier: 4, desc: "Двуручник, выкованный из адского камня и закалённый в крови." },
  hell_halberd: { id: "hell_halberd", name: "Алебарда из адского камня", slot: "mainhand", icon: "🪓", atk: 100, dodge: -3, weaponType: "spear", handed: "2h", damage: { slashing: 40, piercing: 50, bludgeoning: 10 }, price: 880, shopTier: 4, desc: "Адская алебарда, чей крюк рвёт и плоть, и реальность." },
  hell_maul: { id: "hell_maul", name: "Молот из адского камня", slot: "mainhand", icon: "🔨", atk: 110, dodge: -4, weaponType: "mace", handed: "2h", damage: { slashing: 5, piercing: 0, bludgeoning: 105 }, price: 980, shopTier: 4, desc: "Молот из адского камня, от которого трещит сама земля." },

  hell_shield: { id: "hell_shield", name: "Щит из адского камня", slot: "offhand", icon: "🛡️", def: 12, block: 2, dodge: -4, armorType: "plate", price: 600, shopTier: 4, desc: "Щит из адского камня — стена, за которой не спрячешься от жара." },

  hell_head: gearItem("hell_head", "Шлем из адского камня", "head", "👹", 600, 4, { def: 16, hp: 130, armorType: "plate" }, "Шлем из адского камня, из глазниц которого сочится дым."),
  hell_chest: gearItem("hell_chest", "Кираса из адского камня", "chest", "🛡️", 850, 4, { def: 20, hp: 160, armorType: "plate" }, "Кираса из адского камня, что жжёт того, кто ударит по ней."),
  hell_legs: gearItem("hell_legs", "Поножи из адского камня", "legs", "👖", 750, 4, { def: 18, hp: 145, armorType: "plate" }, "Поножи из адского камня, чей вес давит на землю."),
  hell_feet: gearItem("hell_feet", "Сапоги из адского камня", "feet", "🥾", 650, 4, { def: 16, hp: 130, armorType: "plate" }, "Сапоги из адского камня, оставляющие тлеющие следы."),

  hell_ring: gearItem("hell_ring", "Кольцо из адского камня", "ring", "💍", 550, 4, { crit: 4, hp: 30 }, "Кольцо из адского камня, что питает удар жизнью."),
  hell_trinket: gearItem("hell_trinket", "Амулет из адского камня", "trinket", "🔮", 580, 4, { crit: 3, hp: 50 }, "Амулет из адского камня, что делает тело крепче и удар точнее."),
// === ITEMS: Сеты (Рудокоп / Страж склепа / Адский клинок) ===
  // — Рудокоп (бронза, leather, этаж 2) —
  set_miner_head: gearItem("set_miner_head", "Шлем рудокопа", "head", "⛑️", 90, 2, { def: 4, hp: 40, dodge: 2, armorType: "leather", rarity: "legendary", unique: "lucky" }, "Шлем рудокопа с тусклой лампой — говорят, он приносит удачу."),
  set_miner_chest: gearItem("set_miner_chest", "Доспех рудокопа", "chest", "🦺", 150, 2, { def: 8, hp: 70, dodge: 2, armorType: "leather" }, "Кожаный доспех рудокопа, пропитанный рудной пылью и потом."),
  set_miner_legs: gearItem("set_miner_legs", "Штаны рудокопа", "legs", "👖", 120, 2, { def: 6, hp: 55, dodge: 3, armorType: "leather" }, "Штаны рудокопа, усиленные на коленях для долгой работы."),
  set_miner_hands: gearItem("set_miner_hands", "Перчатки рудокопа", "hands", "🧤", 80, 2, { def: 4, hp: 40, dodge: 4, armorType: "leather" }, "Перчатки рудокопа, в которых кирка не выскальзывает."),
  set_miner_feet: gearItem("set_miner_feet", "Сапоги рудокопа", "feet", "🥾", 90, 2, { def: 5, hp: 45, dodge: 4, armorType: "leather" }, "Сапоги рудокопа с подошвой, что держит на осыпи."),

  // — Страж склепа (сталь, plate, этаж 3) —
  set_guard_head: gearItem("set_guard_head", "Шлем стража склепа", "head", "🪖", 180, 2, { def: 12, hp: 100, block: 1, armorType: "plate" }, "Шлем стража склепа, из-под которого не видно глаз."),
  set_guard_chest: gearItem("set_guard_chest", "Латы стража склепа", "chest", "🛡️", 360, 2, { def: 16, hp: 130, block: 1, armorType: "plate", rarity: "legendary", unique: "thorns" }, "Латы стража склепа, чьи шипы возвращают удар обидчику."),
  set_guard_legs: gearItem("set_guard_legs", "Поножи стража склепа", "legs", "👖", 280, 2, { def: 14, hp: 115, block: 1, armorType: "plate" }, "Поножи стража склепа, кованные для вечной стражи."),
  set_guard_hands: gearItem("set_guard_hands", "Рукавицы стража склепа", "hands", "🧤", 220, 2, { def: 10, hp: 90, block: 1, armorType: "plate" }, "Рукавицы стража склепа, что держат клинок даже после смерти."),
  set_guard_feet: gearItem("set_guard_feet", "Сапоги стража склепа", "feet", "🥾", 240, 2, { def: 12, hp: 95, block: 1, armorType: "plate" }, "Сапоги стража склепа, что не скользят на могильных плитах."),

  // — Адский клинок (адский камень, plate, этаж 5) —
  set_hellblade_head: gearItem("set_hellblade_head", "Шлем адского клинка", "head", "👹", 700, 4, { def: 18, hp: 140, dodge: -4, crit: 3, armorType: "plate" }, "Шлем адского клинка, увенчанный рогами."),
  set_hellblade_chest: gearItem("set_hellblade_chest", "Кираса адского клинка", "chest", "🛡️", 950, 4, { def: 20, hp: 160, dodge: -4, crit: 4, armorType: "plate", rarity: "legendary", unique: "lifesteal" }, "Кираса адского клинка, что пьёт кровь врагов, даря силу."),
  set_hellblade_legs: gearItem("set_hellblade_legs", "Поножи адского клинка", "legs", "👖", 820, 4, { def: 18, hp: 145, dodge: -3, crit: 3, armorType: "plate" }, "Поножи адского клинка, тяжёлые, как грехи их владельца."),
  set_hellblade_hands: gearItem("set_hellblade_hands", "Рукавицы адского клинка", "hands", "🧤", 720, 4, { def: 16, hp: 120, dodge: -2, crit: 2, armorType: "plate" }, "Рукавицы адского клинка, что зажимают клинок до хруста."),
  set_hellblade_feet: gearItem("set_hellblade_feet", "Сапоги адского клинка", "feet", "🥾", 740, 4, { def: 16, hp: 125, dodge: -3, crit: 2, armorType: "plate" }, "Сапоги адского клинка, оставляющие в камне трещины."),
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

function shopFloorFor(item) {
  return Math.max(1, Math.min(5, item.shopTier || 1));
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
  // === FLOORS[1] — Кобольды (шахты) ===
  { id: 2, name: "Шахты Кобольдов", subtitle: "Под землёй стучат кирки, и стук всё ближе", icon: "⚙️",
    desc: "Заброшенные рудники, где кобольды день и ночь вгрызаются в жилы бронзы. Воздух тяжёл от рудной пыли, а из тёмных штолен доносится скрежет тележек и шипение колдовских заклинаний.",
    cardImg: "assets/backgrounds/mines.webp",
    bg: "assets/backgrounds/mines.webp",
    mobs: [
      enemy({ id: "kobold_miner", name: "Кобольд-рудокоп", icon: "⚙️", hp: 360, atk: 38, def: 12, gold: 60, xp: 84, armorType: "leather", weapons: ["mace", "short_sword", "rusty_knife"], prefers: ["waist", "legs"],
        desc: "Маленький, горбатый от многолетней работы в забое. Размахивает киркой, целясь в ноги и пояс — туда, где металл не прикрывает тело.",
        drops: [
          { id: "copper_ore", chance: 0.4, min: 1, max: 2 },
          { id: "tin_ore", chance: 0.3, min: 1, max: 2 },
          { id: "wood", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ id: "kobold_tinker", name: "Кобольд-механик", icon: "⚙️", hp: 420, atk: 42, def: 14, gold: 70, xp: 95, armorType: "leather", weapons: ["dagger", "mace", "short_sword"], prefers: ["belly", "chest"],
        desc: "Толкает перед собой скрипучую тележку с шестерёнками. Швыряет в вас осколки бронзы, целясь в живот и грудь.",
        drops: [
          { id: "kobold_gear", chance: 0.4, min: 1, max: 2 },
          { id: "bronze_ingot", chance: 0.25, min: 1, max: 1 },
          { id: "rust", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ id: "kobold_sorcerer", name: "Кобольд-колдун", icon: "💀", hp: 480, atk: 46, def: 10, gold: 80, xp: 105, armorType: "cloth", weapons: ["staff"], prefers: ["head", "belly"],
        desc: "Шипит сквозь острые зубы заклинания, от которых искры сыплются на камень. Бьёт по голове и животу, пока остальные отвлекают.",
        drops: [
          { id: "cave_mushroom", chance: 0.35, min: 1, max: 2 },
          { id: "copper_ore", chance: 0.25, min: 1, max: 2 },
          { id: "mushroom", chance: 0.2, min: 1, max: 2 },
        ] }),
    ],
    boss: enemy({ id: "kobold_master", name: "Кобольд-Мастер Крови", icon: "👹", hp: 1920, atk: 74, def: 22, gold: 640, xp: 840, armorType: "chain", weapons: ["war_hammer"], prefers: ["head", "chest", "belly"], boss: true, enrage: true,
      desc: "Огромный, перемазанный рудой кобольд с молотом в лапах. В ярости его удары разбрызгивают кровь по стенам шахты.",
      drops: [
        { id: "bronze_chest", chance: 1.0, min: 1, max: 1, kind: "item" },
        { id: "bronze_ingot", chance: 0.6, min: 2, max: 3 },
        { id: "copper_ore", chance: 0.5, min: 2, max: 3 },
      ] }),
  },
  // === FLOORS[2] — Нежить (склеп) ===
  { id: 3, name: "Древний Склеп", subtitle: "Лишённые покоя не ведают жалости", icon: "💀",
    desc: "Даже свет факела кажется маленькой искрой и выхватывает из темноты лишь сырые каменные стены. Здесь не спят те, кто давно должен был рассыпаться в прах.",
    cardImg: "assets/backgrounds/crypt.webp",
    bg: "assets/backgrounds/crypt.webp",
    mobs: [
      enemy({ id: "skeleton_warrior", name: "Скелет-воин", icon: "skeleton_warrior", hp: 560, atk: 52, def: 22, gold: 96, xp: 136, armorType: "chain", weapons: ["short_sword", "spear", "battle_axe"], prefers: ["chest", "legs"],
        desc: "Восставший из старой могилы скелет, стиснувший ржавый клинок. Бьёт по корпусу и ногам, не зная ни боли, ни усталости.",
        drops: [
          { id: "bone", chance: 0.4, min: 1, max: 2 },
          { id: "grave_iron", chance: 0.25, min: 1, max: 2 },
          { id: "copper_ore", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ id: "unquiet_ghost", name: "Неупокоенный призрак", icon: "unquiet_ghost", hp: 630, atk: 55, def: 18, gold: 108, xp: 150, armorType: "cloth", weapons: ["staff"], prefers: ["head", "belly"],
        desc: "Полупрозрачный силуэт, что тянет к вам ледяные пальцы. Его шёпот ввинчивается в голову, а удары проходят сквозь броню.",
        drops: [
          { id: "rune_dust", chance: 0.35, min: 1, max: 2 },
          { id: "cursed_cloth", chance: 0.25, min: 1, max: 2 },
          { id: "tin_ore", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ id: "crypt_ghoul", name: "Упырь", icon: "crypt_ghoul", hp: 700, atk: 60, def: 24, gold: 120, xp: 160, armorType: "cloth", weapons: ["claws"], prefers: ["waist", "chest"],
        desc: "Сгорбленный пожиратель падали с длинными когтями. Рвётся к животу и поясу, чтобы добраться до плоти.",
        drops: [
          { id: "bone", chance: 0.35, min: 1, max: 2 },
          { id: "grave_iron", chance: 0.25, min: 1, max: 2 },
          { id: "kobold_gear", chance: 0.2, min: 1, max: 2 },
        ] }),
    ],
    boss: enemy({ id: "dark_knight", name: "Тёмный Рыцарь", icon: "dark_knight", hp: 2800, atk: 96, def: 34, gold: 960, xp: 1280, armorType: "plate", weapons: ["great_sword"], prefers: ["head", "chest", "belly"], boss: true, enrage: true,
      desc: "Павший паладин, чьи латы покрыты пеплом и копотью. В ярости его клинок крошит камень и кости.",
      drops: [
        { id: "steel_chest", chance: 1.0, min: 1, max: 1, kind: "item" },
        { id: "grave_iron", chance: 0.6, min: 2, max: 3 },
        { id: "rune_dust", chance: 0.5, min: 1, max: 2 },
      ] }),
  },
  // === FLOORS[3] — Орки и огры ===
  { id: 4, name: "Лагерь Орков", subtitle: "Пахнет костром, дёгтем и свежей кровью", icon: "🐗",
    desc: "Военный лагерь, где орки готовят осаду, а огры выворачивают из земли валуны. Дым костров застилает небо, и в этом дыму движутся могучие тени.",
    cardImg: "assets/backgrounds/orc_camp.webp",
    bg: "assets/backgrounds/orc_camp.webp",
    mobs: [
      enemy({ id: "orc_raider", name: "Орк-налётчик", icon: "🐗", hp: 920, atk: 76, def: 32, gold: 145, xp: 205, armorType: "chain", weapons: ["battle_axe", "mace", "short_sword"], prefers: ["head", "chest"],
        desc: "Свирепый налётчик, чья секира помнит десятки черепов. Рубит сверху, целясь в голову и грудь.",
        drops: [
          { id: "iron_chain", chance: 0.35, min: 1, max: 2 },
          { id: "orc_tusk", chance: 0.3, min: 1, max: 2 },
          { id: "bone", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ id: "orc_shaman", name: "Орк-шаман", icon: "🐺", hp: 1000, atk: 80, def: 30, gold: 158, xp: 215, armorType: "cloth", weapons: ["staff"], prefers: ["belly", "waist"],
        desc: "Шаман, обвешанный костями и амулетами. Его проклятия бьют в живот и пояс, пока он бормочет боевые молитвы.",
        drops: [
          { id: "blood_herb", chance: 0.35, min: 1, max: 2 },
          { id: "war_crystal", chance: 0.25, min: 1, max: 2 },
          { id: "rune_dust", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ id: "ogre_brute", name: "Огр-громила", icon: "👹", hp: 1100, atk: 85, def: 40, gold: 170, xp: 230, armorType: "plate", weapons: ["war_hammer", "battle_axe", "great_axe"], prefers: ["chest", "legs"],
        desc: "Гора мяса и шрамов, вооружённая вырванным из земли валуном. Бьёт по груди и ногам — медленно, но смертельно.",
        drops: [
          { id: "mithril_ore", chance: 0.35, min: 1, max: 2 },
          { id: "orc_tusk", chance: 0.3, min: 1, max: 2 },
          { id: "silver", chance: 0.2, min: 1, max: 2 },
        ] }),
    ],
    boss: enemy({ id: "orc_warlord", name: "Вождь орков", icon: "🐗", hp: 4400, atk: 136, def: 56, gold: 1360, xp: 1840, armorType: "plate", weapons: ["war_hammer"], prefers: ["head", "chest", "belly"], boss: true, enrage: true,
      desc: "Вождь, чьи латы кованы из обломков осадных машин. В ярости он сминает строй одним ударом.",
      drops: [
        { id: "mithril_chest", chance: 1.0, min: 1, max: 1, kind: "item" },
        { id: "war_crystal", chance: 0.6, min: 2, max: 3 },
        { id: "mithril_ore", chance: 0.5, min: 1, max: 2 },
      ] }),
  },
// === FLOORS[4] — Демонический план ===
  { id: 5, name: "Демонический План", subtitle: "Разрыв в реальности, и из него течёт сера", icon: "🔥",
    desc: "Здесь реальность рвётся, как гнилая ткань, обнажая пылающий план. Сера хрустит под ногами, а воздух плавится от жара — где-то впереди ждёт Владыка Бездны.",
    cardImg: "assets/backgrounds/hell_plane.webp",
    bg: "assets/backgrounds/hell_plane.webp",
    mobs: [
      enemy({ id: "fire_imp", name: "Огненный бес", icon: "🔥", hp: 1020, atk: 104, def: 26, gold: 184, xp: 274, armorType: "cloth", weapons: ["dagger", "staff"], prefers: ["belly", "waist"],
        desc: "Мелкий бес, объятый пламенем, что хихикает из дыма. Жалит в живот и пояс, пока вы ищете его в огне.",
        drops: [
          { id: "brimstone", chance: 0.35, min: 1, max: 2 },
          { id: "infernal_ash", chance: 0.3, min: 1, max: 2 },
          { id: "war_crystal", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ id: "hell_hound", name: "Адская гончая", icon: "🐺", hp: 1100, atk: 108, def: 33, gold: 190, xp: 280, armorType: "leather", weapons: ["claws", "dagger"], prefers: ["head", "chest"],
        desc: "Адская гончая с глазами-углями и клыками длиной в кинжал. Рвётся к горлу и груди.",
        drops: [
          { id: "hellstone", chance: 0.35, min: 1, max: 2 },
          { id: "demon_horn", chance: 0.25, min: 1, max: 2 },
          { id: "iron_chain", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ id: "horned_devil", name: "Рогатый дьявол", icon: "🐏", hp: 1200, atk: 115, def: 40, gold: 200, xp: 290, armorType: "plate", weapons: ["war_hammer", "great_sword", "halberd"], prefers: ["chest", "head"],
        desc: "Рогатый дьявол в багровых латах, вооружённый чёрным клинком. Бьёт в грудь и голову, наслаждаясь чужой болью.",
        drops: [
          { id: "demon_horn", chance: 0.35, min: 1, max: 2 },
          { id: "void_crystal", chance: 0.25, min: 1, max: 2 },
          { id: "mithril_ore", chance: 0.2, min: 1, max: 2 },
        ] }),
    ],
    boss: enemy({ id: "demon_lord", name: "Владыка Бездны", icon: "👹", hp: 4800, atk: 184, def: 56, gold: 1600, xp: 2320, armorType: "plate", weapons: ["halberd"], prefers: ["head", "chest", "belly"], boss: true, enrage: true,
      desc: "Владыка Бездны, чей трон выкован из проклятых душ. В ярости его удары рвут саму реальность.",
      drops: [
        { id: "hell_chest", chance: 1.0, min: 1, max: 1, kind: "item" },
        { id: "void_crystal", chance: 0.6, min: 2, max: 3 },
        { id: "hellstone", chance: 0.5, min: 1, max: 2 },
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
// === FLOOR_RESOURCES[2..5] ===
  2: [
    { id: "copper_ore", name: "Медная руда", icon: "🟠", minAmount: 1, maxAmount: 3, sellPrice: 18, npc: "ron" },
    { id: "tin_ore", name: "Оловянная руда", icon: "⚪", minAmount: 1, maxAmount: 3, sellPrice: 20, npc: "ron" },
    { id: "kobold_gear", name: "Шестерёнка", icon: "⚙️", minAmount: 1, maxAmount: 3, sellPrice: 22, npc: "elize" },
    { id: "cave_mushroom", name: "Пещерный гриб", icon: "🍄", minAmount: 1, maxAmount: 3, sellPrice: 20, npc: "elain" },
    { id: "bronze_ingot", name: "Бронзовый слиток", icon: "🟫", minAmount: 1, maxAmount: 3, sellPrice: 25, npc: "ron" },
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
  ],
};

// ── Улучшение предметов (Этап 2) ───────────────────────────────────────────
// Каждая ветка улучшений привязана к фракции (UPGRADE_FACTION) и требует
// её тир «Уважаемый» (репутация 10+, см. FACTION_TIERS[2]).
// Материалы — только ресурсы нижних этажей (FLOOR_RESOURCES 2..5).
const UPGRADE_MAX_LEVEL = 5;
const UPGRADE_GOLD_COST = [50, 150, 400, 900, 2000];
const UPGRADE_PATHS = {
  weapon: {
    id: "weapon", name: "Оружие", icon: "⚒️",
    materials: [
      { copper_ore: 3, tin_ore: 2 },
      { bronze_ingot: 3, kobold_gear: 2 },
      { grave_iron: 3, rune_dust: 2 },
      { mithril_ore: 3, war_crystal: 1 },
      { hellstone: 3, void_crystal: 1 },
    ],
  },
  armor: {
    id: "armor", name: "Броня", icon: "🛡️",
    materials: [
      { copper_ore: 3, tin_ore: 3 },
      { bronze_ingot: 2, kobold_gear: 3 },
      { grave_iron: 4, rune_dust: 2 },
      { mithril_ore: 3, iron_chain: 2 },
      { hellstone: 4, void_crystal: 2 },
    ],
  },
  jewelry: {
    id: "jewelry", name: "Украшения", icon: "💍",
    // В ювелирной ветке игрок выбирает, что расти: крит или уворот.
    altStat: "dodge",
    materials: [
      { silver: 3, tin_ore: 2 },
      { silver: 4, kobold_gear: 1 },
      { silver: 5, rune_dust: 2, cursed_cloth: 1 },
      { silver: 6, war_crystal: 2 },
      { silver: 8, void_crystal: 2 },
    ],
  },
};
// Прирост стата за каждый уровень улучшения.
const UPGRADE_PER_LEVEL = { weapon: { atk: 5 }, armor: { def: 2 }, jewelry: { crit: 2, dodge: 1 } };
// Фракция, которая делает улучшение для каждой ветки.
const UPGRADE_FACTION = { weapon: "smiths", armor: "smiths", jewelry: "jewelers" };
// Подписи статов для UI.
const UPGR_STAT_LABEL = { atk: "Атака", def: "Защита", crit: "Крит", dodge: "Уворот", hp: "HP", block: "Зон блока", mana: "Мана" };

// Ветка улучшения для предмета: оружие/щиты — weapon, украшения — jewelry,
// броня (ткань/кожа/пластинчатые слоты) — armor, остальное — null.
function upgradePathForItem(item) {
  if (!item) return null;
  if (item.slot && (item.slot === "mainhand" || item.slot === "offhand")) return UPGRADE_PATHS.weapon;
  if (item.slot && ["ring", "neck", "trinket"].includes(item.slot)) return UPGRADE_PATHS.jewelry;
  if (item.slot && ["head", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet"].includes(item.slot)) return UPGRADE_PATHS.armor;
  return null;
}

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

  // ── 2-Й ЭТАЖ (Бронза/сет «Рудокоп») ──
  { id: "recipe_bronze_sword", station: "forge", result: "bronze_sword", desc: "Бронзовый меч", floor: 2, dropChance: 0.05, materials: { copper_ore: 4, tin_ore: 2, bronze_ingot: 2 } },
  { id: "recipe_bronze_axe", station: "forge", result: "bronze_axe", desc: "Бронзовый топор", floor: 2, dropChance: 0.05, materials: { copper_ore: 4, tin_ore: 3, bronze_ingot: 2 } },
  { id: "recipe_bronze_mace", station: "forge", result: "bronze_mace", desc: "Бронзовая булава", floor: 2, dropChance: 0.05, materials: { copper_ore: 5, tin_ore: 2, bronze_ingot: 3 } },
  { id: "recipe_bronze_shield", station: "forge", result: "bronze_shield", desc: "Бронзовый щит", floor: 2, dropChance: 0.05, materials: { bronze_ingot: 2, copper_ore: 3, tin_ore: 1 } },
  { id: "recipe_bronze_head", station: "forge", result: "bronze_head", desc: "Бронзовый шлем", floor: 2, dropChance: 0.05, materials: { bronze_ingot: 2, copper_ore: 2 } },
  { id: "recipe_bronze_chest", station: "forge", result: "bronze_chest", desc: "Бронзовый нагрудник", floor: 2, dropChance: 0.05, materials: { bronze_ingot: 4, copper_ore: 3, tin_ore: 2 } },
  { id: "recipe_bronze_hands", station: "forge", result: "bronze_hands", desc: "Бронзовые перчатки", floor: 2, dropChance: 0.05, materials: { bronze_ingot: 1, copper_ore: 2, tin_ore: 1 } },
  { id: "recipe_bronze_feet", station: "forge", result: "bronze_feet", desc: "Бронзовые сапоги", floor: 2, dropChance: 0.05, materials: { bronze_ingot: 2, copper_ore: 2, tin_ore: 2 } },
  { id: "recipe_bronze_ring", station: "jewelry", result: "bronze_ring", desc: "Бронзовое кольцо", floor: 2, dropChance: 0.05, materials: { bronze_ingot: 1, copper_ore: 2 } },
  { id: "recipe_bronze_neck", station: "jewelry", result: "bronze_neck", desc: "Бронзовый амулет", floor: 2, dropChance: 0.05, materials: { bronze_ingot: 2, copper_ore: 1, tin_ore: 1 } },
  // Сет «Рудокоп» (бронза, этаж 2)
  { id: "recipe_set_miner_head", station: "forge", result: "set_miner_head", desc: "Шлем рудокопа", floor: 2, dropChance: 0.05, materials: { bronze_ingot: 1, kobold_gear: 1, copper_ore: 2 } },
  { id: "recipe_set_miner_chest", station: "forge", result: "set_miner_chest", desc: "Доспех рудокопа", floor: 2, dropChance: 0.05, materials: { bronze_ingot: 3, kobold_gear: 2, copper_ore: 3 } },
  { id: "recipe_set_miner_legs", station: "forge", result: "set_miner_legs", desc: "Штаны рудокопа", floor: 2, dropChance: 0.05, materials: { bronze_ingot: 2, copper_ore: 3, tin_ore: 2 } },
  { id: "recipe_set_miner_hands", station: "forge", result: "set_miner_hands", desc: "Перчатки рудокопа", floor: 2, dropChance: 0.05, materials: { bronze_ingot: 1, kobold_gear: 1, tin_ore: 2 } },
  { id: "recipe_set_miner_feet", station: "forge", result: "set_miner_feet", desc: "Сапоги рудокопа", floor: 2, dropChance: 0.05, materials: { bronze_ingot: 1, copper_ore: 2, tin_ore: 2 } },

  // ── 3-Й ЭТАЖ (Сталь/сет «Страж склепа») ──
  { id: "recipe_steel_knight_sword", station: "forge", result: "steel_knight_sword", desc: "Рыцарский стальной меч", floor: 3, dropChance: 0.05, materials: { grave_iron: 4, bone: 2, silver: 1 } },
  { id: "recipe_steel_zweihander", station: "forge", result: "steel_zweihander", desc: "Стальной двуручник", floor: 3, dropChance: 0.05, materials: { grave_iron: 6, bone: 3 } },
  { id: "recipe_steel_sledge", station: "forge", result: "steel_sledge", desc: "Стальная кувалда", floor: 3, dropChance: 0.05, materials: { grave_iron: 5, bone: 4 } },
  { id: "recipe_steel_bulwark", station: "forge", result: "steel_bulwark", desc: "Стальной оплот", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 2, silver: 1 } },
  { id: "recipe_steel_head", station: "forge", result: "steel_head", desc: "Стальной шлем", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 2 } },
  { id: "recipe_steel_chest", station: "forge", result: "steel_chest", desc: "Стальная кираса", floor: 3, dropChance: 0.05, materials: { grave_iron: 5, bone: 3, cursed_cloth: 1 } },
  { id: "recipe_steel_legs", station: "forge", result: "steel_legs", desc: "Стальные поножи", floor: 3, dropChance: 0.05, materials: { grave_iron: 4, bone: 2 } },
  { id: "recipe_steel_feet", station: "forge", result: "steel_feet", desc: "Стальные сапоги", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 2, cursed_cloth: 1 } },
  { id: "recipe_steel_ring", station: "jewelry", result: "steel_ring", desc: "Стальное кольцо", floor: 3, dropChance: 0.05, materials: { silver: 3, grave_iron: 2, bone: 1 } },
  { id: "recipe_steel_trinket", station: "jewelry", result: "steel_trinket", desc: "Стальной талисман", floor: 3, dropChance: 0.05, materials: { silver: 3, cursed_cloth: 2, bone: 1 } },
  // Сет «Страж склепа» (сталь, этаж 3)
  { id: "recipe_set_guard_head", station: "forge", result: "set_guard_head", desc: "Шлем стража склепа", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 2, silver: 1 } },
  { id: "recipe_set_guard_chest", station: "forge", result: "set_guard_chest", desc: "Латы стража склепа", floor: 3, dropChance: 0.05, materials: { grave_iron: 5, bone: 3, cursed_cloth: 1 } },
  { id: "recipe_set_guard_legs", station: "forge", result: "set_guard_legs", desc: "Поножи стража склепа", floor: 3, dropChance: 0.05, materials: { grave_iron: 4, bone: 2, cursed_cloth: 1 } },
  { id: "recipe_set_guard_hands", station: "forge", result: "set_guard_hands", desc: "Рукавицы стража склепа", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 2, silver: 1 } },
  { id: "recipe_set_guard_feet", station: "forge", result: "set_guard_feet", desc: "Сапоги стража склепа", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 2, cursed_cloth: 1 } },

  // ── 4-Й ЭТАЖ (Мифрил) ──
  { id: "recipe_mithril_sword", station: "forge", result: "mithril_sword", desc: "Мифриловый меч", floor: 4, dropChance: 0.05, materials: { mithril_ore: 4, blood_herb: 2, war_crystal: 1 } },
  { id: "recipe_mithril_halberd", station: "forge", result: "mithril_halberd", desc: "Мифриловая алебарда", floor: 4, dropChance: 0.05, materials: { mithril_ore: 5, orc_tusk: 2, war_crystal: 1 } },
  { id: "recipe_mithril_axe", station: "forge", result: "mithril_axe", desc: "Мифриловая секира", floor: 4, dropChance: 0.05, materials: { mithril_ore: 6, orc_tusk: 3, blood_herb: 2 } },
  { id: "recipe_mithril_shield", station: "forge", result: "mithril_shield", desc: "Мифриловый щит", floor: 4, dropChance: 0.05, materials: { mithril_ore: 4, war_crystal: 2 } },
  { id: "recipe_mithril_head", station: "forge", result: "mithril_head", desc: "Мифриловый шлем", floor: 4, dropChance: 0.05, materials: { mithril_ore: 4, orc_tusk: 2 } },
  { id: "recipe_mithril_chest", station: "forge", result: "mithril_chest", desc: "Мифриловая кольчуга", floor: 4, dropChance: 0.05, materials: { mithril_ore: 6, blood_herb: 3, war_crystal: 1 } },
  { id: "recipe_mithril_hands", station: "forge", result: "mithril_hands", desc: "Мифриловые перчатки", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, orc_tusk: 2 } },
  { id: "recipe_mithril_legs", station: "forge", result: "mithril_legs", desc: "Мифриловые поножи", floor: 4, dropChance: 0.05, materials: { mithril_ore: 5, war_crystal: 1 } },
  { id: "recipe_mithril_ring", station: "jewelry", result: "mithril_ring", desc: "Мифриловое кольцо", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, war_crystal: 2 } },
  { id: "recipe_mithril_trinket", station: "jewelry", result: "mithril_trinket", desc: "Мифриловый амулет", floor: 4, dropChance: 0.05, materials: { mithril_ore: 2, blood_herb: 2, war_crystal: 2 } },

  // ── 5-Й ЭТАЖ (Адский камень/сет «Адский клинок») ──
  { id: "recipe_hell_great_sword", station: "forge", result: "hell_great_sword", desc: "Двуручник из адского камня", floor: 5, dropChance: 0.05, materials: { hellstone: 5, demon_horn: 2, void_crystal: 1 } },
  { id: "recipe_hell_halberd", station: "forge", result: "hell_halberd", desc: "Алебарда из адского камня", floor: 5, dropChance: 0.05, materials: { hellstone: 6, demon_horn: 3, brimstone: 2 } },
  { id: "recipe_hell_maul", station: "forge", result: "hell_maul", desc: "Молот из адского камня", floor: 5, dropChance: 0.05, materials: { hellstone: 7, brimstone: 3, demon_horn: 2 } },
  { id: "recipe_hell_shield", station: "forge", result: "hell_shield", desc: "Щит из адского камня", floor: 5, dropChance: 0.05, materials: { hellstone: 5, brimstone: 2, void_crystal: 1 } },
  { id: "recipe_hell_head", station: "forge", result: "hell_head", desc: "Шлем из адского камня", floor: 5, dropChance: 0.05, materials: { hellstone: 4, demon_horn: 2 } },
  { id: "recipe_hell_chest", station: "forge", result: "hell_chest", desc: "Кираса из адского камня", floor: 5, dropChance: 0.05, materials: { hellstone: 6, brimstone: 3, void_crystal: 1 } },
  { id: "recipe_hell_legs", station: "forge", result: "hell_legs", desc: "Поножи из адского камня", floor: 5, dropChance: 0.05, materials: { hellstone: 5, demon_horn: 2, brimstone: 1 } },
  { id: "recipe_hell_feet", station: "forge", result: "hell_feet", desc: "Сапоги из адского камня", floor: 5, dropChance: 0.05, materials: { hellstone: 4, brimstone: 2, void_crystal: 1 } },
  { id: "recipe_hell_ring", station: "jewelry", result: "hell_ring", desc: "Кольцо из адского камня", floor: 5, dropChance: 0.05, materials: { hellstone: 3, demon_horn: 1, void_crystal: 2 } },
  { id: "recipe_hell_trinket", station: "jewelry", result: "hell_trinket", desc: "Амулет из адского камня", floor: 5, dropChance: 0.05, materials: { hellstone: 2, brimstone: 2, void_crystal: 2 } },
  // Сет «Адский клинок» (адский камень, этаж 5)
  { id: "recipe_set_hellblade_head", station: "forge", result: "set_hellblade_head", desc: "Шлем адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 4, demon_horn: 2, void_crystal: 1 } },
  { id: "recipe_set_hellblade_chest", station: "forge", result: "set_hellblade_chest", desc: "Кираса адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 6, demon_horn: 3, void_crystal: 1 } },
  { id: "recipe_set_hellblade_legs", station: "forge", result: "set_hellblade_legs", desc: "Поножи адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 5, brimstone: 2, demon_horn: 2 } },
  { id: "recipe_set_hellblade_hands", station: "forge", result: "set_hellblade_hands", desc: "Рукавицы адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 4, demon_horn: 2, brimstone: 1 } },
  { id: "recipe_set_hellblade_feet", station: "forge", result: "set_hellblade_feet", desc: "Сапоги адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 4, brimstone: 2, demon_horn: 2 } },
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
// ── Экспорт для bundler/Node (не влияет на браузер) ────────────────────────
// TODO(port): при переходе на ES-модули заменить этот блок на export { ... }.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ZONES, ZONE_NAME, ZONE_MAP, SLOTS, SLOT_NAME, SLOT_ICON,
    FORGE_TABS, JEWELRY_TABS, PORTRAITS, PORTRAIT_MAP, NPC_PORTRAITS, DIALOGS,
    ATTR_INFO, RARITY_TIERS, AFFIXES, UNIQUE_EFFECTS, BACKGROUND_STEPS,
    ARCHETYPES, ARCHETYPE_MAP, STYLE_ORDER, STYLE_NAMES, STYLE_ICONS,
    ARMOR_TYPE_NAMES, ARMOR_STYLE_MULT, UNARMED_DAMAGE, MONK_STANCES,
    TALENTS, TALENT_MAP, RARITY_INFO, MOB_ABILITY_INFO, MOB_MODIFIERS,
    TIME_PHASES, COMPANIONS, COMPANION_MAP, MONTHS, WEEKDAYS, WEEKLY_EVENTS,
    TRAININGS, TRAINING_MAP, ITEMS, ARMOR_TYPE_BY_ID, MOB_ICONS,
    RESOURCE_ICONS, FLOORS, FLOOR_RESOURCES, ALL_RESOURCES, FLOOR_SCENES,
    NPCS, RECIPES, RECIPE_MAP,
    getRecipeById, getRecipes, todaysEvent, forgeDiscountToday,
    alchemyDiscountToday, companionDiscountToday, xpMultToday, goldMultToday,
    weaponDamageFor, weaponStyleValue, weaponStyleMult, weaponBestStyle,
  };
}
