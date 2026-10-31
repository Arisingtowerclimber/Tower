// Node/bundler: в браузере предметы уже подключены через index.html.
if (typeof module !== "undefined" && module.exports && typeof ITEMS === "undefined") {
  Object.assign(globalThis, require("./data-items.js"));
}
// Node/bundler: данные мира вынесены в data-world.js.
if (typeof module !== "undefined" && module.exports && typeof FLOORS === "undefined") {
  Object.assign(globalThis, require("./data-world.js"));
}
// Node/bundler: NPC, диалоги и сюжетные квесты вынесены в data-npcs.js.
if (typeof module !== "undefined" && module.exports && typeof NPC_PORTRAITS === "undefined") {
  Object.assign(globalThis, require("./data-npcs.js"));
}

const ZONES = [
  { id: "head", name: "Голова", critBonus: 10, risk: 0.25, tip: "Критический удар, но промах открывает вас для контратаки." },
  { id: "chest", name: "Грудь", damageMult: 0.9, tip: "Надёжный удар с чуть сниженным уроном." },
  { id: "belly", name: "Живот", armorPierce: 0.5, tip: "Пробивает половину защиты врага." },
  { id: "waist", name: "Пояс", staggerChance: 0.35, tip: "Может сбить стойку — враг пропустит блок." },
  { id: "legs", name: "Ноги", tripChance: 0.25, tip: "Может сбить с ног — враг пропустит ответный удар." },
];

const ZONE_NAME = Object.fromEntries(ZONES.map((z) => [z.id, z.name]));
const ZONE_MAP = Object.fromEntries(ZONES.map((z) => [z.id, z]));
// Винительный падеж зон — для окрика «КРИТ В ГОЛОВУ!» в логе боя.
const ZONE_ACCUSATIVE = {
  head: "ГОЛОВУ", chest: "ГРУДЬ", belly: "ЖИВОТ", waist: "ПОЯС", legs: "НОГИ",
};

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
  { id: "offhand", name: "Левая рука", icon: "🛡️", accepts: ["offhand", "mainhand"] },
];

const SLOT_NAME = Object.fromEntries(SLOTS.map((s) => [s.id, s.name]));
const SLOT_ICON = Object.fromEntries(SLOTS.map((s) => [s.id, s.icon]));

// Текстовая (эмодзи) иконка предмета — для тостов, лога и товаров торговца.
// Восстановлена после рефакторинга иконок: на неё ссылаются state.js и ui.js.
function itemEmoji(item) {
  if (!item) return "";
  if (item.iconFallback) return item.iconFallback;
  if (typeof item.icon === "string" && !item.icon.startsWith("assets/")) return item.icon;
  return SLOT_ICON[item.slot] || "";
}
SLOT_NAME.ring = "Кольца";
SLOT_NAME.trinket = "Аксессуары";
SLOT_ICON.ring = "💍";
SLOT_ICON.trinket = "🔮";

const PORTRAITS = [
  { id: "m1", name: "Мужчина 1", gender: "male", src: "assets/portraits/m1.webp" },
  { id: "m2", name: "Мужчина 2", gender: "male", src: "assets/portraits/m2.webp" },
  { id: "f1", name: "Женщина 1", gender: "female", src: "assets/portraits/f1.webp" },
  { id: "f2", name: "Женщина 2", gender: "female", src: "assets/portraits/f2.webp" },
  { id: "m3", name: "Мужчина 3", gender: "male", src: "assets/portraits/m3.webp" },
];

const PORTRAIT_MAP = Object.fromEntries(PORTRAITS.map((p) => [p.id, p]));

function portraitSrc(id) {
  return (PORTRAIT_MAP[id] || PORTRAITS[0]).src;
}

const DEFENSE_CAP = 0.6;

const DURABILITY_MAX = 100;
const DURABILITY_LOSS_PER_FIGHT = 3;

const ATTR_INFO = [
  { id: "str", name: "Сила", effect: "Увеличивает урон, если вы печатаете слово быстро." },
  { id: "agi", name: "Ловкость", effect: "Увеличивает шанс выпадения мощных (длинных) комбинаций, наносящих критический урон." },
  { id: "end", name: "Выносливость", effect: "+10 к максимуму HP" },
  { id: "int", name: "Интеллект", effect: "Увеличивает шанс появления слов-аффиксов (приставок), усиливающих удар и накладывающих эффекты." },
];

const LEVEL_ATTR_POINTS = 3;
const AGILITY_DODGE_PERCENT = 1;
const AGILITY_CRIT_PERCENT = 0.5;
const AGILITY_COUNTER_PERCENT = 0.3;
const COUNTERATTACK_CAP = 30;

const BASE_ARCHETYPE_MODS = { atk: 1, maxHp: 1, dodgeCap: 35, blockZones: 2, ragePerHit: 1, blockCounter: 0 };

// ── Бонус к редкости крафта (Блок 5) ────────────────────────────────────────
// Итоговый бонус = CRAFT_BASE_BONUS + (уровень-1)*CRAFT_RARITY_BONUS_PER_LEVEL
// + CRAFT_MATERIALS_BONUS*max(0, число материалов - 2) (максимум +15%)
// + CRAFT_FACTION_BONUS ( если тир фракции станции ≥ «Уважаемый» ).
const CRAFT_RARITY_BONUS_PER_LEVEL = 0.03;
const CRAFT_BASE_BONUS = 0.10;
const CRAFT_MATERIALS_BONUS = 0.05; // за каждый материал свыше двух
const CRAFT_MATERIALS_BONUS_MAX = 0.15; // потолок за материалы
const CRAFT_FACTION_BONUS = 0.05; // тир фракции не ниже «Уважаемого» (tier >= 2)
const ELITE_RARITY_BONUS = 0.1;
const BACKGROUND_STEPS = [
  {
    id: "archetype",
    title: "Архетип",
    text: "Кем ты был до зова Башни?",
    lore: "Башня не спрашивает имени. Она смотрит на походку, хватку и шрамы.",
    // Варианты шага рендерятся из ARCHETYPES (ui.js), здесь — краткая сводка.
    options: [
      { id: "duelist", label: "Дуэлянт", desc: "Танец клинка: быстрота, точность и презрение к броне." },
      { id: "guardian", label: "Страж", desc: "Живая стена: щит, стойка и ответный удар." },
      { id: "assassin", label: "Убийца", desc: "Смерть с двух рук: тень, скорость и яд." },
      { id: "monk", label: "Аскет", desc: "Отказ от стали: кулак, стойка и внутренний жар." }
    ]
  },
  {
    id: "childhood",
    title: "Детство",
    text: "Что осталось в памяти от первых лет?",
    lore: "Детство — первая сталь, которую получает человек. Остальное — закалка.",
    optionsByArchetype: {
      duelist: [
        {
          id: "duelist_child_arena",
          label: "Среди гладиаторов",
          desc: "Яма для боёв, где хлеб добывался кровью.",
          effects: { agi: 1, end: 1 }
        },
        {
          id: "duelist_child_yard",
          label: "Двор наставника",
          desc: "Тысяча ударов по столбу — раньше, чем первое слово.",
          effects: { str: 1, gold: 10 }
        },
        {
          id: "duelist_child_troupe",
          label: "Бродячая труппа",
          desc: "Поклоны, клинки и монеты, брошенные в пыль.",
          effects: { int: 2 }
        }
      ],
      guardian: [
        {
          id: "guardian_child_wall",
          label: "Тень городской стены",
          desc: "Стена выше дома — и урок: не быть ниже.",
          effects: { end: 2 }
        },
        {
          id: "guardian_child_quarry",
          label: "Каменный двор",
          desc: "Камень в руках тяжелел с каждым годом.",
          effects: { str: 1, end: 1 }
        },
        {
          id: "guardian_child_barracks",
          label: "Кухня гарнизона",
          desc: "Слухи стражников — первая школа войны.",
          effects: { end: 1, gold: 10 }
        }
      ],
      assassin: [
        {
          id: "assassin_child_alley",
          label: "Тени переулков",
          desc: "Голод учит тишине быстрее любой школы.",
          effects: { agi: 1, gold: 10 }
        },
        {
          id: "assassin_child_roofs",
          label: "Крыши и карнизы",
          desc: "Падение — единственный учитель, которого не прощают.",
          effects: { agi: 1, end: 1 }
        },
        {
          id: "assassin_child_house",
          label: "Дом без окон",
          desc: "Здесь учили читать людей, а не книги.",
          effects: { int: 1, potions: 1 }
        }
      ],
      monk: [
        {
          id: "monk_child_cloister",
          label: "Тишина обители",
          desc: "Молитва, пост и холодный пол под коленями.",
          effects: { int: 2 }
        },
        {
          id: "monk_child_well",
          label: "Двор с колодцем",
          desc: "Вёдра с водой и долгие поклоны закалили спину.",
          effects: { end: 2 }
        },
        {
          id: "monk_child_vigil",
          label: "Долгие посты",
          desc: "Голод и безмолвие учат слышать себя.",
          effects: { end: 1, int: 1 }
        }
      ]
    }
  },
  {
    id: "youth",
    title: "Юность",
    text: "Какое ремесло осталось в руках?",
    lore: "Дорога к Башне усеяна не камнями, а сломанными судьбами.",
    optionsByArchetype: {
      duelist: [
        {
          id: "duelist_youth_mercenary",
          label: "Наёмный клинок",
          desc: "Чужая война платила золотом и учила бить первым.",
          effects: { str: 1, gold: 15 }
        },
        {
          id: "duelist_youth_duels",
          label: "Дуэли за монету",
          desc: "Честь стоила дешевле, чем хороший удар.",
          effects: { agi: 1, gold: 10 }
        },
        {
          id: "duelist_youth_school",
          label: "Школа фехтования",
          desc: "Пыльные трактаты о том, как не умереть.",
          effects: { int: 2 }
        }
      ],
      guardian: [
        {
          id: "guardian_youth_watch",
          label: "Караул у ворот",
          desc: "Ночные смены и чужие лица, которым нет доверия.",
          effects: { end: 1, gold: 10 }
        },
        {
          id: "guardian_youth_shieldwall",
          label: "Щит в первой шеренге",
          desc: "Стойка держится на плече соседа. Или не держится.",
          effects: { str: 1, end: 1 }
        },
        {
          id: "guardian_youth_guard",
          label: "Служба в страже",
          desc: "Приказы, смены и один украденный сон.",
          effects: { end: 1, potions: 1 }
        }
      ],
      assassin: [
        {
          id: "assassin_youth_night",
          label: "Ночной промысел",
          desc: "Чужие карманы и тёмные крыши.",
          effects: { agi: 1, gold: 15 }
        },
        {
          id: "assassin_youth_poison",
          label: "Яд и шёпот",
          desc: "Смерть не обязана быть громкой.",
          effects: { int: 1, potions: 1 }
        },
        {
          id: "assassin_youth_contract",
          label: "Работа по контракту",
          desc: "Имя жертвы важнее имени исполнителя.",
          effects: { agi: 1, end: 1 }
        }
      ],
      monk: [
        {
          id: "monk_youth_obedience",
          label: "Годы послушания",
          desc: "Смирение оказалось тяжелее камня.",
          effects: { end: 2 }
        },
        {
          id: "monk_youth_stances",
          label: "Стойки на рассвете",
          desc: "Тигр, Журавль и Медведь — до первого пота.",
          effects: { agi: 1, int: 1 }
        },
        {
          id: "monk_youth_scribes",
          label: "Переписывание свитков",
          desc: "Чужие слова оставляли мозоли на разуме.",
          effects: { int: 2 }
        }
      ]
    }
  },
  {
    id: "adult",
    title: "Взрослая жизнь",
    text: "Чем закончилась пора ученичества?",
    lore: "Взрослость — это когда шрамы уже не удивляют, а предупреждают.",
    optionsByArchetype: {
      duelist: [
        {
          id: "duelist_adult_arena",
          label: "Кровь на арене",
          desc: "Толпа помнит победителей и забывает остальных.",
          effects: { str: 1, end: 1 }
        },
        {
          id: "duelist_adult_fame",
          label: "Слава дуэлянта",
          desc: "Имя, которое произносят с опаской.",
          effects: { agi: 1, gold: 15 }
        },
        {
          id: "duelist_adult_master",
          label: "Уроки старого мастера",
          desc: "Наставник ушёл, оставив только науку.",
          effects: { int: 1, potions: 1 }
        }
      ],
      guardian: [
        {
          id: "guardian_adult_siege",
          label: "Осада и пепел",
          desc: "Стена пала. Ты — нет.",
          effects: { end: 2 }
        },
        {
          id: "guardian_adult_veteran",
          label: "Ветеран стены",
          desc: "Тяжёлый щит и ещё более тяжёлый опыт.",
          effects: { str: 1, gold: 10 }
        },
        {
          id: "guardian_adult_oath",
          label: "Клятва защитника",
          desc: "Слово, данное тем, кто уже не может сказать.",
          effects: { end: 1, int: 1 }
        }
      ],
      assassin: [
        {
          id: "assassin_adult_nameless",
          label: "Заказ без имени",
          desc: "Никто не спрашивал, кто ты. Только когда.",
          effects: { agi: 1, gold: 15 }
        },
        {
          id: "assassin_adult_court",
          label: "Тень при дворе",
          desc: "Интриги оказались острее любого клинка.",
          effects: { int: 1, potions: 1 }
        },
        {
          id: "assassin_adult_hunted",
          label: "Охота на охотника",
          desc: "Тех, кто шёл по следу, больше нет.",
          effects: { agi: 1, end: 1 }
        }
      ],
      monk: [
        {
          id: "monk_adult_hermit",
          label: "Путь отшельника",
          desc: "Годы в тишине, где отвечает только эхо.",
          effects: { int: 2 }
        },
        {
          id: "monk_adult_fist",
          label: "Кулак и посох",
          desc: "Оружие отринуто, но руки помнят всё.",
          effects: { str: 1, end: 1 }
        },
        {
          id: "monk_adult_mountains",
          label: "Молчание гор",
          desc: "Здесь не было свидетелей — только путь.",
          effects: { end: 1, potions: 1 }
        }
      ]
    }
  },
  {
    id: "motive",
    title: "Мотив",
    text: "Что ведёт тебя в Башню?",
    lore: "Каждый, кто входит в Башню, несёт с собой причину. Некоторые несут её на плечах.",
    options: [
      {
        id: "motive_wealth",
        label: "Богатство",
        desc: "Золото откроет двери, что заперты для прочих.",
        effects: { gold: 50 }
      },
      {
        id: "motive_revenge",
        label: "Месть",
        desc: "Одна тень в Башне знает твоё имя. Она ответит.",
        effects: { str: 1 }
      },
      {
        id: "motive_knowledge",
        label: "Знание",
        desc: "Тайны глубин стоят дороже любой короны.",
        effects: { int: 2 }
      },
      {
        id: "motive_defense",
        label: "Защита",
        desc: "Кто-то должен встать между тьмой и домом.",
        effects: { end: 1 }
      }
    ]
  }
];

const ARCHETYPES = [
  {
    id: "duelist",
    name: "Дуэлянт",
    desc: "Танец клинка и пустоты: с одноручным оружием в правой и свободной левой бьёт на 30% сильнее и на 10% чаще в уязвимое место. Скользит по грани — предел уворота 45%, но плоть на 10% тоньше.",
    mods: { atk: 1, maxHp: 0.9, dodgeCap: 45, blockZones: 2, ragePerHit: 1, blockCounter: 0 },
    startEquipment: ["rusty_knife", "rags", "worn_hood", "patched_pants", "worn_boots"]
  },
   {
    id: "guardian",
    name: "Страж",
    desc: "Живая стена. Успешный блок отвечает врагу десятой частью его же удара. Спокоен и в атаке, и в защите: наносит и получает на 10% меньше урона.",
    mods: { atk: 0.9, maxHp: 1, dodgeCap: 35, blockZones: 2, ragePerHit: 1, blockCounter: 0.1, dmgTakenMult: 0.9 },
    startEquipment: ["rusty_knife", "rags", "worn_hood", "patched_pants", "worn_boots", "wood_shield"]
  },
  {
    id: "assassin",
    name: "Убийца",
    desc: "Смерть с двух рук: клинок в левой ладони бьёт вполсилы — на 50% урона. Скользит между ударами, предел уворота 60%. Щиты не для него, а плоть на 10% слабее.",
    mods: { atk: 1, maxHp: 0.9, dodgeCap: 60, blockZones: 2, ragePerHit: 1, blockCounter: 0 },
    startEquipment: ["rusty_knife", "rusty_knife", "rags", "worn_hood", "patched_pants", "worn_boots"]
  },
  {
    id: "monk",
    name: "Аскет",
    desc: "Отвергает сталь: бьёт голыми руками, и урон растёт от силы и ловкости. Три звериные стойки — Тигр, Журавль и Медведь. Оружие запрещено, зато предел уворота — 50%.",
    mods: { atk: 1.0, maxHp: 1.0, dodgeCap: 50, blockZones: 2, ragePerHit: 1, blockCounter: 0 },
    startEquipment: ["rags", "worn_hood", "patched_pants", "worn_boots"]
  },
];

const ARCHETYPE_MAP = Object.fromEntries(ARCHETYPES.map((a) => [a.id, a]));

// ── Стили удара и типы брони (глобальное обновление боя) ────────────────────
const STYLE_ORDER = ["slashing", "piercing", "bludgeoning"];
const STYLE_NAMES = { slashing: "Рубящий", piercing: "Колющий", bludgeoning: "Дробящий" };

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

// ── Боевая печать: слова для ввода в бою ───────────────────────────────────
// Единый пул слов для всех стилей оружия. Стиль влияет только на урон.
// Базовые слова короче 7 букв, длинные — 7+.
const ATTACK_WORDS_BASE = ["УДАР", "УКОЛ", "ВЫПАД", "СЛЭМ", "СМЭШ"];
const ATTACK_WORDS_LONG = ["РАЗРЕЗ", "РАСКОЛ", "РАЗРУБИТЬ", "СОКРУШИТЬ", "СЛОМИТЬ", "УНИЧТОЖИТЬ"];
const WORD_AFFIXES = ["ОГНЕННЫЙ ", "ЛЕДЯНОЙ ", "КРОВАВЫЙ ", "ЯДОВИТЫЙ ", "СТАЛЬНОЙ ", "ТЕНЕВОЙ "];
const DEFEND_WORDS = ["БЛОК", "УКЛОН", "ОТВОД", "ЗАСЛОН", "СТОЙКА", "РЫВОК"];
const SKILL_WORDS = ["РАГНАРЕК", "КАЗНЬ", "КАРА", "СУД", "РАСПЛАТА", "ЯРОСТЬ", "ГНЕВ"];
const COMBO_WORDS = ["ДРОБЯЩИЙ УДАР", "ЖЕСТОКИЙ ФИНАЛ", "ДИКИЙ НАТИСК", "СМЕРТЕЛЬНЫЙ", "СОКРУШИТЕЛЬНЫЙ", "БЕСПОЩАДНЫЙ"];

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
  // Активные навыки (умения): учатся как таланты, применяются в бою
  // через модалку «Приёмы». Списывают ману (и кураж), имеют откат в ходах.
  {
    id: "sk_berserk", branch: "war", name: "Ярость берсерка", active: true, maxRank: 1, stat: null,
    desc: "Активный навык: 10 маны и 3 куража — неудержимый удар силой ×1.8, который враг не может заблокировать. Печать приёма: RAGNAROK. Откат: 3 хода.",
    combo: ["ArrowUp", "ArrowUp", "ArrowLeft", "ArrowRight"],
    skill: { name: "Ярость берсерка", icon: "🪓", manaCost: 10, rageCost: 3, cooldown: 3, effect: "fury" },
  },
  {
    id: "sk_shield", branch: "def", name: "Щит веры", active: true, maxRank: 1, stat: null,
    desc: "Активный навык: 15 маны — лечение на 30% максимума HP и иммунитет к яду до конца боя. Снимает яд. Печать приёма: ANNIHILATION. Откат: 4 хода.",
    combo: ["ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight"],
    skill: { name: "Щит веры", icon: "🛡️", manaCost: 15, rageCost: 0, cooldown: 4, effect: "faith" },
  },
  {
    id: "sk_precise", branch: "util", name: "Точный выстрел", active: true, maxRank: 1, stat: null,
    desc: "Активный навык: 12 маны — выверенный удар точно в уязвимое место: гарантированный крит, враг не успевает закрыться. Печать приёма: OBLITERATION. Откат: 3 хода.",
    combo: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowUp"],
    skill: { name: "Точный выстрел", icon: "🎯", manaCost: 12, rageCost: 0, cooldown: 3, effect: "aim" },
  },
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

// ── Достижения и титулы ────────────────────────────────────────────────────
// Ачивка с полем `title` — это титул: игрок носит один из открытых (см.
// state.currentTitle). Бонусы титула применяются ТОЛЬКО против мобов своей
// расы (поле `race` + список id ниже) — их считает titleBonusVsMob в combat.js.
// Обычные ачивки (без `race`) дают глобальные пассивные бонусы через stats().
const ACH_GOBLIN_IDS  = ["goblin_scout", "goblin_chief", "hobgoblin", "bugbear", "goblin_archer", "goblin_shaman", "goblin_berserker", "bugbear_chief"];
const ACH_KOBOLD_IDS  = ["kobold_servant", "kobold_miner", "kobold_overseer", "kobold_rat", "kobold_caster", "kobold_zealot"];
const ACH_UNDEAD_IDS  = ["skeleton_warrior", "unquiet_ghost", "crypt_ghoul", "dark_knight", "crypt_rat", "skeleton_archer", "zombie", "skeleton_knight", "wraith"];
const ACH_DEMON_IDS   = ["fire_imp", "hell_hound", "horned_devil", "demon_lord"];

// Раса → список id мобов. Драконид (id: "dragonborn") сюда не входит — это
// отдельная раса, поэтому бонусы кобольдов на него НЕ распространяются.
const ACH_RACE_IDS = {
  goblin: ACH_GOBLIN_IDS,
  kobold: ACH_KOBOLD_IDS,
  undead: ACH_UNDEAD_IDS,
};

function achKillSum(s, ids) {
  const kills = s.bestiaryKills || {};
  return ids.reduce((n, id) => n + (Number.isFinite(kills[id]) ? kills[id] : 0), 0);
}

const ACHIEVEMENTS = [
  {
    id: "ach_tutorial_complete",
    name: "Курс молодого бойца",
    icon: "🎖️",
    desc: "Пройти обучение у Капитана Ивана. Бонус: +10 к максимуму HP и +1 к урону.",
    condition: (s) => s.tutorialProgress === 2,
    progress: (s) => [s.tutorialProgress === 2 ? 1 : 0, 1],
    bonus: { hp: 10, atk: 1 },
  },
  // ── Титулы (выбираемые): бонусы только против своей расы ─────────────────
  {
    id: "ach_goblin_slayer", name: "Убийца гоблинов", title: "Убийца гоблинов", icon: "👺", race: "goblin",
    desc: "Убить 30 гоблинов. Бонус против гоблинов: +5% урона, +2% крита и уворота.",
    condition: (s) => achKillSum(s, ACH_GOBLIN_IDS) >= 30,
    progress: (s) => [Math.min(30, achKillSum(s, ACH_GOBLIN_IDS)), 30],
    bonus: { dmgPct: 5, crit: 2, dodge: 2 },
  },
  {
    id: "ach_goblin_exterminator", name: "Истребитель гоблинов", title: "Истребитель гоблинов", icon: "🔥", race: "goblin",
    desc: "Убить 100 гоблинов. Бонус против гоблинов: +10% урона, +2% крита и уворота.",
    condition: (s) => achKillSum(s, ACH_GOBLIN_IDS) >= 100,
    progress: (s) => [Math.min(100, achKillSum(s, ACH_GOBLIN_IDS)), 100],
    bonus: { dmgPct: 10, crit: 2, dodge: 2 },
  },
  {
    id: "ach_kobold_slayer", name: "Убийца кобольдов", title: "Убийца кобольдов", icon: "🦎", race: "kobold",
    desc: "Убить 30 кобольдов. Бонус против кобольдов: +5% урона, +2% крита и уворота.",
    condition: (s) => achKillSum(s, ACH_KOBOLD_IDS) >= 30,
    progress: (s) => [Math.min(30, achKillSum(s, ACH_KOBOLD_IDS)), 30],
    bonus: { dmgPct: 5, crit: 2, dodge: 2 },
  },
  {
    id: "ach_kobold_exterminator", name: "Истребитель кобольдов", title: "Истребитель кобольдов", icon: "🐲", race: "kobold",
    desc: "Убить 100 кобольдов. Бонус против кобольдов: +10% урона, +2% крита и уворота.",
    condition: (s) => achKillSum(s, ACH_KOBOLD_IDS) >= 100,
    progress: (s) => [Math.min(100, achKillSum(s, ACH_KOBOLD_IDS)), 100],
    bonus: { dmgPct: 10, crit: 2, dodge: 2 },
  },
  {
    id: "ach_crypt_storm", name: "Гроза склепа", title: "Гроза склепа", icon: "💀", race: "undead",
    desc: "Убить 30 неупокоенных. Бонус против нежити: +5% урона, +2% крита и уворота.",
    condition: (s) => achKillSum(s, ACH_UNDEAD_IDS) >= 30,
    progress: (s) => [Math.min(30, achKillSum(s, ACH_UNDEAD_IDS)), 30],
    bonus: { dmgPct: 5, crit: 2, dodge: 2 },
  },
  {
    id: "ach_undead_bane", name: "Погибель нежити", title: "Погибель нежити", icon: "☠️", race: "undead",
    desc: "Убить 100 неупокоенных. Бонус против нежити: +10% урона, +2% крита и уворота.",
    condition: (s) => achKillSum(s, ACH_UNDEAD_IDS) >= 100,
    progress: (s) => [Math.min(100, achKillSum(s, ACH_UNDEAD_IDS)), 100],
    bonus: { dmgPct: 10, crit: 2, dodge: 2 },
  },

  // ── Обычные достижения (пассивные, без титула) ────────────────────────────
  {
    id: "ach_demon_hunter", name: "Охотник на демонов", icon: "😈",
    desc: "Убить 10 демонов. Бонус: +5% к увороту.",
    condition: (s) => achKillSum(s, ACH_DEMON_IDS) >= 10,
    progress: (s) => [Math.min(10, achKillSum(s, ACH_DEMON_IDS)), 10],
    bonus: { dodge: 5 },
  },
  {
    id: "ach_blade_master", name: "Мастер клинка", icon: "🗡️",
    desc: "Нанести 50 критических ударов. Бонус: +3% к криту.",
    condition: (s) => (s.critCount || 0) >= 50,
    progress: (s) => [Math.min(50, s.critCount || 0), 50],
    bonus: { crit: 3 },
  },
  {
    id: "ach_survivor", name: "Бессмертный", icon: "🕊️",
    desc: "Выжить, оставшись на волосок от смерти. Бонус: +10 к максимуму HP.",
    condition: (s) => Boolean(s.brinkSurvived),
    progress: (s) => [s.brinkSurvived ? 1 : 0, 1],
    bonus: { hp: 10 },
  },
  {
    id: "ach_tower_veteran", name: "Ветеран Башни", icon: "🏅",
    desc: "Убить 100 существ в Башне. Бонус: +2 к урону и +2% к криту.",
    condition: (s) => (s.kills || 0) >= 100,
    progress: (s) => [Math.min(100, s.kills || 0), 100],
    bonus: { atk: 2, crit: 2 },
  },
];

const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

const MANA_REGEN = 1;

const EXPLORATION_MAX = 10;
const FIGHT_ENERGY_COST = 1;
const FREE_REST_AMOUNT = 3;

const HOTEL_PRICE = 20;

const TIME_PHASES = [
  { id: "morning", name: "Утро", icon: "🌅", towerOpen: true },
  { id: "day", name: "День", icon: "☀️", towerOpen: true },
  { id: "evening", name: "Вечер", icon: "🌇", towerOpen: true },
  { id: "night", name: "Ночь", icon: "🌙", towerOpen: false },
];

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
const TRAINING_PHASES = 1;

function trainingCap(level = state.level) {
  return level <= 1 ? 5 : level * 2;
}

// Тренировки Зала Охотников. cap — личный потолок именно этой тренировки,
// stat — какой атрибут растёт, risk — шанс травмы за занятие.
const TRAININGS = [
  { id: "obstacle_course", attr: "end", stat: "end", name: "Полоса препятствий", icon: "🏃", cap: 10, risk: 0.2, desc: "Иван гоняет вас через рвы, заборы и канаты.", effect: "+1 к выносливости за тренировку", qteType: "rhythm", reward: { maxEnergy: 10 } },
  { id: "sparring", attr: "agi", stat: "agi", name: "Спарринг на клинках", icon: "🤺", cap: 10, risk: 0.25, desc: "Учебный бой на деревянных клинках. Быстрота важнее силы — Иван бьёт по пальцам за каждый зевок.", effect: "+1 к ловкости за тренировку" },
  { id: "heavy_lifting", attr: "str", stat: "str", name: "Оттачивание клинка", icon: "🏋️", cap: 10, risk: 0.3, desc: "Учебный бой с акцентом на уязвимые точки. Иван показывает, куда бить, чтобы свалить врага с одного удара.", effect: "+1 к силе за тренировку" },
];

const TRAINING_MAP = Object.fromEntries(TRAININGS.map((t) => [t.id, t]));

const CHEST_PITY_LIMIT = 10; // подряд «пустых» сундуков → гарантированный rare/epic

// ── Обмен ресурсов (Этап 3): у Рона 50 любых ресурсов 1-го этажа → 1 редкий ─
const EXCHANGE_AMOUNT = 50;
const EXCHANGE_TARGET_RES = "mithril_ore";

// ── Улучшение предметов (Этап 2) ───────────────────────────────────────────
// Каждая ветка улучшений привязана к фракции (UPGRADE_FACTION) и требует
// её тир «Уважаемый» (репутация 10+, см. FACTION_TIERS[2]).
// Материалы уровня N — только ресурсы FLOOR_RESOURCES[N] (уровень 1 — этаж 1).
const UPGRADE_MAX_LEVEL = 5;
const UPGRADE_GOLD_COST = [50, 150, 400, 900, 2000];
const UPGRADE_PATHS = {
  weapon: {
    id: "weapon", name: "Оружие", icon: "⚒️",
    materials: [
      { iron_ore: 3, rust: 2 },
      { cold_iron_ingot: 3, kobold_gear: 2 },
      { grave_iron: 3, rune_dust: 2 },
      { mithril_ore: 3, war_crystal: 1 },
      { hellstone: 3, void_crystal: 1 },
    ],
  },
  armor: {
    id: "armor", name: "Броня", icon: "🛡️",
    materials: [
      { iron_ore: 3, rust: 3 },
      { cold_iron_ingot: 2, kobold_gear: 3 },
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
      { malachite: 3, rust: 2 },
      { tin_ore: 4, kobold_gear: 1 },
      { silver: 5, rune_dust: 2, cursed_cloth: 1 },
      { war_crystal: 6, orc_tusk: 2 },
      { demon_horn: 8, void_crystal: 2 },
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
    PORTRAITS, PORTRAIT_MAP, NPC_PORTRAITS, DIALOGS,
    ATTR_INFO, RARITY_TIERS, AFFIXES, UNIQUE_EFFECTS, BACKGROUND_STEPS, DIALOG_TREES,
    COMPANION_REACTIONS, COMPANION_EVENTS, COMPANION_EVENT_MAP, COMPANION_EVENT_CHANCE,
    CRAFT_RARITY_BONUS_PER_LEVEL, CRAFT_BASE_BONUS, CRAFT_MATERIALS_BONUS, CRAFT_MATERIALS_BONUS_MAX, CRAFT_FACTION_BONUS,
    ARCHETYPES, ARCHETYPE_MAP, STYLE_ORDER, STYLE_NAMES,
    ARMOR_TYPE_NAMES, ARMOR_STYLE_MULT, UNARMED_DAMAGE,
    ATTACK_WORDS_BASE, ATTACK_WORDS_LONG, WORD_AFFIXES, DEFEND_WORDS, SKILL_WORDS, COMBO_WORDS,
    TALENTS, TALENT_MAP, RARITY_INFO, MOB_ABILITY_INFO, MOB_MODIFIERS,
    TIME_PHASES, COMPANIONS, COMPANION_MAP, COMPANION_AFFINITY_LEVELS, MONTHS, WEEKDAYS, WEEKLY_EVENTS,
    TRAININGS, TRAINING_MAP, HUNT_CONTRACTS, HUNTER_TIPS, ITEMS, ARMOR_TYPE_BY_ID, MOB_ICONS,
    RESOURCE_ICONS, FLOORS, FLOOR_RESOURCES, ALL_RESOURCES, FLOOR_SCENES,
    FLOOR_DIARY, HUNTER_ENCOUNTERS, FLOOR_EVENTS,
    NPCS, RECIPES, RECIPE_MAP, SETS, SET_MAP, SET_BONUS_TEMPLATES,
    getRecipeById, getRecipes, todaysEvent, forgeDiscountToday,
    alchemyDiscountToday, companionDiscountToday, xpMultToday, goldMultToday,
    weaponDamageFor, weaponStyleValue, weaponStyleMult, weaponBestStyle
  };
}

// ══════════════════════════════════════════════════════════════════════════
// ── АУДИТ ДАННЫХ (только чтение) ──────────────────────────────────────────
// validateData()      — структурная и семантическая проверка ссылок.
// auditBalance()      — таблицы баланса мобов, боссов, предметов и рецептов.
// auditReachability() — проверка достижимости материалов к нужному этажу.
// Все функции ниже только читают данные и ничего не мутируют.
// ══════════════════════════════════════════════════════════════════════════

const _AUDIT_HERO_ATK = 50;
const _AUDIT_HERO_DEF = 20;

const _AUDIT_ARMOR_SLOTS = ["head", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet"];
const _AUDIT_NUMERIC_FIELDS = ["price", "atk", "def", "hp", "mana", "crit", "dodge", "block"];
const _AUDIT_STAT_FIELDS = ["atk", "def", "hp", "mana", "crit", "dodge", "block"];
const _AUDIT_POTION_TYPES = ["potion", "combat"];
const _AUDIT_WEAPON_TYPES = ["sword", "axe", "mace", "spear", "claw"];
const _AUDIT_HANDED = ["1h", "2h"];
const _AUDIT_ARMOR_TYPES = ["cloth", "leather", "chain", "plate"];

function _auditFinite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function _auditEnemies(floor) {
  return [...floor.mobs, floor.boss];
}

function _auditResourceIds() {
  return new Set(ALL_RESOURCES.map((resource) => resource.id));
}

function _auditMobIds() {
  const ids = new Set();
  for (const floor of FLOORS) {
    for (const enemy of _auditEnemies(floor)) ids.add(enemy.id);
  }
  return ids;
}

// Сумма всех статов предмета (для поиска «пустых» дорогих вещей).
function _auditStatSum(item) {
  let sum = 0;
  for (const stat of _AUDIT_STAT_FIELDS) {
    if (_auditFinite(item[stat])) sum += Math.abs(item[stat]);
  }
  if (item.damage && typeof item.damage === "object") {
    for (const style of STYLE_ORDER) {
      if (_auditFinite(item.damage[style])) sum += Math.abs(item.damage[style]);
    }
  }
  return sum;
}

function _auditAvg(values) {
  const list = values.filter(_auditFinite);
  if (!list.length) return 0;
  const sum = list.reduce((total, value) => total + value, 0);
  return +(sum / list.length).toFixed(1);
}

// ── Валидация: предметы ────────────────────────────────────────────────────
function _validateItems(add) {
  const validSlots = new Set(["potion"]);
  for (const slot of SLOTS) {
    for (const accept of slot.accepts) validSlots.add(accept);
  }

  const seenIds = new Set();
  // id не должен пересекаться между ITEMS и ALL_RESOURCES.
  const resourceIds = new Set(ALL_RESOURCES.map((r) => r.id));
  for (const [key, item] of Object.entries(ITEMS)) {
    if (!item || typeof item !== "object") {
      add("structure", `ITEMS["${key}"] — не объект`);
      continue;
    }
    if (resourceIds.has(key)) {
      add("semantic", `ITEMS["${key}"]: id совпадает с ресурсом из ALL_RESOURCES — коллизия «предмет/ресурс»`);
    }
    if (item.id !== key) {
      add("structure", `ITEMS["${key}"]: id "${item.id}" не совпадает с ключом`);
    }
    if (seenIds.has(item.id)) {
      add("structure", `ITEMS: повторяющийся id "${item.id}" (ключ "${key}")`);
    }
    seenIds.add(item.id);

    if (!validSlots.has(item.slot)) {
      add("structure", `ITEMS["${key}"]: недопустимый slot "${item.slot}"`);
    }

    if (item.slot === "potion") {
      if (!_AUDIT_POTION_TYPES.includes(item.type)) {
        add("structure", `ITEMS["${key}"]: type "${item.type}" не из {potion, combat}`);
      }
      if (!item.effect) {
        add("structure", `ITEMS["${key}"]: у зелья нет effect`);
      }
    }

    if (item.slot === "mainhand") {
      if (!_AUDIT_WEAPON_TYPES.includes(item.weaponType)) {
        add("structure", `ITEMS["${key}"]: weaponType "${item.weaponType}" не из {sword, axe, mace, spear, claw}`);
      }
      if (!_AUDIT_HANDED.includes(item.handed)) {
        add("structure", `ITEMS["${key}"]: handed "${item.handed}" не из {1h, 2h}`);
      }
      const damage = item.damage;
      if (!damage || typeof damage !== "object") {
        add("structure", `ITEMS["${key}"]: у оружия нет damage`);
      } else if (!STYLE_ORDER.some((style) => _auditFinite(damage[style]) && damage[style] > 0)) {
        add("structure", `ITEMS["${key}"]: damage — все три стиля не больше 0`);
      }
    }

    if (item.slot === "offhand" && _auditFinite(item.block) && item.block > 0 && item.damage) {
      add("structure", `ITEMS["${key}"]: щит с block > 0 не должен иметь damage`);
    }

    if (_AUDIT_ARMOR_SLOTS.includes(item.slot) && !item.armorType) {
      add("structure", `ITEMS["${key}"]: для слота "${item.slot}" обязателен armorType`);
    }

    for (const field of _AUDIT_NUMERIC_FIELDS) {
      if (item[field] === undefined) continue;
      if (!_auditFinite(item[field])) {
        add("structure", `ITEMS["${key}"]: ${field} = ${item[field]} — не конечное число`);
      }
    }

    // dodge может быть отрицательным: тяжёлая броня даёт штраф к уклонению.
    for (const field of ["crit", "dodge"]) {
      const min = field === "dodge" ? -50 : 0;
      if (_auditFinite(item[field]) && (item[field] < min || item[field] > 50)) {
        add("structure", `ITEMS["${key}"]: ${field} = ${item[field]} вне диапазона [${min}, 50]`);
      }
    }

    if (item.unique != null && item.rarity !== "legendary") {
      add("structure", `ITEMS["${key}"]: unique задан, но rarity = "${item.rarity}"`);
    }

    if (item.slot !== "potion" && item.price > 0 && _auditStatSum(item) === 0) {
      add("semantic", `ITEMS["${key}"]: price = ${item.price}, но все статы равны 0`);
    }
    if (item.shopTier > 0 && item.price === 0) {
      add("semantic", `ITEMS["${key}"]: shopTier = ${item.shopTier}, но price = 0`);
    }
  }
}

// ── Валидация: рецепты ─────────────────────────────────────────────────────
function _validateRecipes(add) {
  const resourceIds = _auditResourceIds();
  const byResult = new Map();

  for (const recipe of RECIPES) {
    if (!ITEMS[recipe.result]) {
      add("structure", `RECIPES["${recipe.id}"]: result "${recipe.result}" не найден в ITEMS`);
    }
    if (!["forge", "jewelry", "alchemy"].includes(recipe.station)) {
      add("structure", `RECIPES["${recipe.id}"]: station "${recipe.station}" не из {forge, jewelry, alchemy}`);
    }
    if (!Number.isInteger(recipe.floor) || recipe.floor < 1 || recipe.floor > FLOORS.length) {
      add("structure", `RECIPES["${recipe.id}"]: floor = ${recipe.floor} вне [1..${FLOORS.length}]`);
    }
    const materials = recipe.materials;
    if (!materials || typeof materials !== "object" || !Object.keys(materials).length) {
      add("structure", `RECIPES["${recipe.id}"]: пустой materials`);
    } else {
      for (const resId of Object.keys(materials)) {
        if (!resourceIds.has(resId)) {
          add("structure", `RECIPES["${recipe.id}"]: материал "${resId}" отсутствует в ALL_RESOURCES`);
        }
      }
    }
    if (!byResult.has(recipe.result)) byResult.set(recipe.result, []);
    byResult.get(recipe.result).push(recipe.id);
  }

  for (const [result, ids] of byResult) {
    if (ids.length > 1) {
      add("structure", `RECIPES: result "${result}" дублируется у рецептов ${ids.join(", ")}`);
    }
  }
}

// ── Валидация: этажи, мобы и боссы ─────────────────────────────────────────
function _validateFloors(add) {
  const resourceIds = _auditResourceIds();

  for (const floor of FLOORS) {
    for (const enemy of _auditEnemies(floor)) {
      if (enemy.floorId !== floor.id) {
        add("structure", `FLOORS[${floor.id}] ${enemy.id}: floorId = ${enemy.floorId}`);
      }
      for (const field of ["hp", "atk", "def", "gold", "xp"]) {
        if (!_auditFinite(enemy[field]) || enemy[field] <= 0) {
          add("structure", `FLOORS[${floor.id}] ${enemy.id}: ${field} = ${enemy[field]} (ожидалось > 0)`);
        }
      }
      if (!_AUDIT_ARMOR_TYPES.includes(enemy.armorType)) {
        add("structure", `FLOORS[${floor.id}] ${enemy.id}: armorType "${enemy.armorType}" не из {cloth, leather, chain, plate}`);
      }
      for (const weaponId of enemy.weapons || []) {
        const weapon = ITEMS[weaponId];
        if (!weapon) {
          add("structure", `FLOORS[${floor.id}] ${enemy.id}: оружие "${weaponId}" не найдено в ITEMS`);
        } else if (weapon.slot !== "mainhand") {
          add("structure", `FLOORS[${floor.id}] ${enemy.id}: оружие "${weaponId}" имеет slot "${weapon.slot}", а не mainhand`);
        }
      }
      for (const drop of enemy.drops || []) {
        if (!ITEMS[drop.id] && !resourceIds.has(drop.id)) {
          add("structure", `FLOORS[${floor.id}] ${enemy.id}: drop "${drop.id}" не найден ни в ITEMS, ни в ALL_RESOURCES`);
        }
        if (!_auditFinite(drop.chance) || drop.chance <= 0 || drop.chance > 1) {
          add("structure", `FLOORS[${floor.id}] ${enemy.id}: drop "${drop.id}" chance = ${drop.chance} вне (0, 1]`);
        }
        if (!Number.isInteger(drop.min) || drop.min < 1) {
          add("structure", `FLOORS[${floor.id}] ${enemy.id}: drop "${drop.id}" min = ${drop.min} (ожидалось целое ≥ 1)`);
        }
        if (!_auditFinite(drop.max) || drop.max < 1) {
          add("structure", `FLOORS[${floor.id}] ${enemy.id}: drop "${drop.id}" max = ${drop.max} (ожидалось ≥ 1)`);
        }
        if (Number.isInteger(drop.min) && _auditFinite(drop.max) && drop.min > drop.max) {
          add("structure", `FLOORS[${floor.id}] ${enemy.id}: drop "${drop.id}" min ${drop.min} > max ${drop.max}`);
        }
      }
    }

    const first = floor.mobs[0];
    const last = floor.mobs[floor.mobs.length - 1];
    if (first && last && last.hp < first.hp) {
      add("semantic", `FLOORS[${floor.id}]: hp последнего моба (${last.hp}) меньше hp первого (${first.hp})`);
    }

    const strongest = floor.mobs.reduce((best, mob) => (mob.hp > best.hp ? mob : best), floor.mobs[0]);
    const strongestAtk = floor.mobs.reduce((best, mob) => Math.max(best, mob.atk), 0);
    if (strongest && floor.boss) {
      if (floor.boss.hp < 2.5 * strongest.hp) {
        add("semantic", `FLOORS[${floor.id}]: hp босса ${floor.boss.hp} < 2.5 × hp сильнейшего моба ${strongest.hp}`);
      }
      if (floor.boss.atk < 1.3 * strongestAtk) {
        add("semantic", `FLOORS[${floor.id}]: atk босса ${floor.boss.atk} < 1.3 × atk сильнейшего моба ${strongestAtk}`);
      }
    }
  }
}

// ── Валидация: сюжетные квесты и контракты ─────────────────────────────────
function _validateQuests(add) {
  const resourceIds = _auditResourceIds();
  const mobIds = _auditMobIds();

  for (const quest of STORY_QUESTS) {
    const reward = quest.reward || {};
    if (reward.item != null && !ITEMS[reward.item]) {
      add("structure", `STORY_QUESTS["${quest.id}"]: reward.item "${reward.item}" не найден в ITEMS`);
    }
    if (reward.recipe != null && !RECIPE_MAP[reward.recipe]) {
      add("structure", `STORY_QUESTS["${quest.id}"]: reward.recipe "${reward.recipe}" не найден в RECIPE_MAP`);
    }
    const objectives = quest.objectives || {};
    if (objectives.res != null && !resourceIds.has(objectives.res)) {
      add("structure", `STORY_QUESTS["${quest.id}"]: objectives.res "${objectives.res}" отсутствует в ALL_RESOURCES`);
    }
    if (objectives.kill != null && !mobIds.has(objectives.kill)) {
      add("structure", `STORY_QUESTS["${quest.id}"]: objectives.kill "${objectives.kill}" не найден на этажах`);
    }
  }

  for (const contract of HUNT_CONTRACTS) {
    if (!mobIds.has(contract.mobId)) {
      add("structure", `HUNT_CONTRACTS["${contract.id}"]: mobId "${contract.mobId}" не найден на этажах`);
    }
    if (!Number.isInteger(contract.floorId) || contract.floorId < 1 || contract.floorId > FLOORS.length) {
      add("structure", `HUNT_CONTRACTS["${contract.id}"]: floorId = ${contract.floorId} вне [1..${FLOORS.length}]`);
    }
  }
}

// ── Валидация: фракции и диалоги ───────────────────────────────────────────
function _validateFactions(add) {
  const knownNpcs = new Set([
    ...Object.keys(DIALOGS),
    ...Object.keys(NPCS),
    ...Object.keys(NPC_PORTRAITS),
  ]);
  if (typeof NPC_NAMES !== "undefined") {
    for (const npcId of Object.keys(NPC_NAMES)) knownNpcs.add(npcId);
  }
  if (typeof SHOP_NPCS !== "undefined") {
    for (const npcId of Object.values(SHOP_NPCS)) knownNpcs.add(npcId);
  }

  for (const faction of FACTIONS) {
    if (faction.npc === undefined) {
      add("structure", `FACTIONS["${faction.id}"]: npc не задан (undefined)`);
    } else if (faction.npc !== null && !knownNpcs.has(faction.npc)) {
      add("structure", `FACTIONS["${faction.id}"]: npc "${faction.npc}" не найден среди NPC`);
    }
  }

  if (Object.prototype.hasOwnProperty.call(FACTION_BY_NPC, "undefined")) {
    add("structure", "FACTION_BY_NPC: есть ключ undefined");
  }
}

function _validateDialogBranches(add) {
  const tierMins = FACTION_TIERS.map((tier) => tier.min);

  for (const [npcId, branches] of Object.entries(DIALOG_BRANCHES)) {
    if (!Array.isArray(branches)) {
      add("structure", `DIALOG_BRANCHES["${npcId}"] — не массив`);
      continue;
    }
    for (const branch of branches) {
      if (!tierMins.includes(branch.minRep)) {
        add("structure", `DIALOG_BRANCHES["${npcId}"].${branch.id}: minRep ${branch.minRep} отсутствует в FACTION_TIERS`);
      }
      if (!Array.isArray(branch.replies) || !branch.replies.length || branch.replies.some((reply) => typeof reply !== "string")) {
        add("structure", `DIALOG_BRANCHES["${npcId}"].${branch.id}: replies должен быть непустым массивом строк`);
      }
      if (!Number.isInteger(branch.minFloor) || branch.minFloor < 1 || branch.minFloor > FLOORS.length) {
        add("structure", `DIALOG_BRANCHES["${npcId}"].${branch.id}: minFloor = ${branch.minFloor} вне [1..${FLOORS.length}]`);
      }
    }
  }
}

// ── Валидация: иконки (не блокирует поток) ────────────────────────────────
function _validateIcons() {
  if (typeof Image === "undefined") return;
  for (const [itemId, item] of Object.entries(ITEMS)) {
    const icon = item.icon;
    if (typeof icon !== "string" || !icon.startsWith("assets/")) continue;
    const image = new Image();
    image.onerror = () => console.error(`[data/icon] не найден файл: ${icon} (${itemId})`);
    image.src = icon;
  }
}

// ── validateData: структурная и семантическая проверка ─────────────────────
function validateData() {
  const problems = [];
  const add = (type, message) => problems.push(`[data/${type}] ${message}`);

  const sections = [
    _validateItems,
    _validateRecipes,
    _validateFloors,
    _validateQuests,
    _validateFactions,
    _validateDialogBranches,
  ];
  for (const section of sections) {
    try {
      section(add);
    } catch (error) {
      add("structure", `исключение в ${section.name}: ${error && error.message ? error.message : error}`);
    }
  }

  try {
    _validateIcons();
  } catch (error) {
    add("structure", `исключение при проверке иконок: ${error && error.message ? error.message : error}`);
  }

  let tierErrors = [];
  try {
    tierErrors = validateCraftTiers();
  } catch (error) {
    add("structure", `исключение в validateCraftTiers: ${error && error.message ? error.message : error}`);
  }
  if (tierErrors.length) {
    add("tier", `tier-нарушений: ${tierErrors.length}, см. validateCraftTiers()`);
  }

  if (!problems.length) {
    console.log("%c[data] OK — ссылочная целостность в порядке", "color:#7ac47a");
  } else {
    console.group(`%c[data] ${problems.length} проблем(ы)`, "color:#ff9800;font-weight:bold");
    for (const problem of problems) console.warn(problem);
    console.groupEnd();
  }
  return problems;
}

// ── auditBalance: таблицы баланса и подозрительные места ───────────────────
function auditBalance() {
  const mobRows = [];
  const bossRows = [];
  const suspicious = [];

  for (const floor of FLOORS) {
    const strongestHp = floor.mobs.reduce((best, mob) => Math.max(best, mob.hp), 0);
    const strongestAtk = floor.mobs.reduce((best, mob) => Math.max(best, mob.atk), 0);

    for (const mob of floor.mobs) {
      const turns = mob.hp / _AUDIT_HERO_ATK;
      const dmgThroughDef = Math.max(1, Math.round(mob.atk - _AUDIT_HERO_DEF * 0.6));
      mobRows.push({
        floor: floor.id,
        mob: mob.name,
        hp: mob.hp,
        atk: mob.atk,
        def: mob.def,
        gold: mob.gold,
        xp: mob.xp,
        turns_to_kill: +turns.toFixed(2),
        dmg_through_def: dmgThroughDef,
      });

      if (turns < 2 || turns > 30) {
        suspicious.push(`Моб "${mob.name}" (этаж ${floor.id}): turns_to_kill = ${turns.toFixed(2)}`);
      }
      if (dmgThroughDef <= 1) {
        suspicious.push(`Моб "${mob.name}" (этаж ${floor.id}): dmg_through_def = ${dmgThroughDef} — герой с def ${_AUDIT_HERO_DEF} не получает урона`);
      }
    }

    const boss = floor.boss;
    const hpRatio = strongestHp ? boss.hp / strongestHp : 0;
    const atkRatio = strongestAtk ? boss.atk / strongestAtk : 0;
    bossRows.push({
      floor: floor.id,
      boss: boss.name,
      hp: boss.hp,
      atk: boss.atk,
      def: boss.def,
      hp_ratio_to_strongest: +hpRatio.toFixed(2),
      atk_ratio_to_strongest: +atkRatio.toFixed(2),
    });
    if (hpRatio < 2.5) {
      suspicious.push(`Босс "${boss.name}" (этаж ${floor.id}): hp_ratio_to_strongest = ${hpRatio.toFixed(2)} < 2.5`);
    }
  }

  const tierGroups = new Map();
  for (const item of Object.values(ITEMS)) {
    const tier = _auditFinite(item.shopTier) ? item.shopTier : 0;
    if (!tierGroups.has(tier)) tierGroups.set(tier, []);
    tierGroups.get(tier).push(item);
  }
  const itemRows = [...tierGroups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([tier, items]) => ({
      shopTier: tier,
      count: items.length,
      avg_price: _auditAvg(items.map((item) => item.price)),
      avg_atk: _auditAvg(items.filter((item) => item.slot === "mainhand").map((item) => item.atk)),
      avg_def: _auditAvg(items.filter((item) => _AUDIT_ARMOR_SLOTS.includes(item.slot)).map((item) => item.def)),
      avg_hp: _auditAvg(items.map((item) => item.hp)),
    }));

  const resourcePrice = new Map(ALL_RESOURCES.map((resource) => [
    resource.id,
    _auditFinite(resource.sellPrice) ? resource.sellPrice : 1,
  ]));
  const recipeRows = RECIPES.map((recipe) => {
    let materialsValue = 0;
    for (const [resId, quantity] of Object.entries(recipe.materials || {})) {
      const unitPrice = resourcePrice.has(resId) ? resourcePrice.get(resId) : 1;
      materialsValue += unitPrice * (_auditFinite(quantity) ? quantity : 0);
    }
    const result = ITEMS[recipe.result];
    const resultPrice = result && _auditFinite(result.price) ? result.price : 0;
    const ratio = materialsValue / Math.max(1, resultPrice);
    if (ratio < 0.3) {
      suspicious.push(`Рецепт "${recipe.id}" (этаж ${recipe.floor}): ratio = ${ratio.toFixed(2)} < 0.3 — материалы дешевле результата`);
    }
    if (ratio > 3.0) {
      suspicious.push(`Рецепт "${recipe.id}" (этаж ${recipe.floor}): ratio = ${ratio.toFixed(2)} > 3.0 — материалы дороже результата`);
    }
    return {
      station: recipe.station,
      floor: recipe.floor,
      result: recipe.result,
      materials_value: materialsValue,
      result_price: resultPrice,
      ratio: +ratio.toFixed(2),
    };
  });

  for (const item of Object.values(ITEMS)) {
    if (item.price > 100 && _auditStatSum(item) === 0) {
      suspicious.push(`Предмет "${item.name}" (${item.id}): price = ${item.price}, но все статы равны 0`);
    }
  }

  console.log("%c[auditBalance] Мобы по этажам", "font-weight:bold");
  console.table(mobRows);
  console.log("%c[auditBalance] Боссы", "font-weight:bold");
  console.table(bossRows);
  console.log("%c[auditBalance] Предметы по тирам", "font-weight:bold");
  console.table(itemRows);
  console.log("%c[auditBalance] Рецепты", "font-weight:bold");
  console.table(recipeRows);

  console.groupCollapsed("Подозрительное");
  if (!suspicious.length) {
    console.log("— ничего не найдено");
  } else {
    for (const text of suspicious) console.warn(text);
  }
  console.groupEnd();

  return { mobs: mobRows, bosses: bossRows, items: itemRows, recipes: recipeRows, suspicious };
}

// ── auditReachability: достижимость ресурсов по этажам ─────────────────────
function _auditReachFloorMap() {
  const resourceIds = _auditResourceIds();
  const floors = new Map();
  const mark = (resId, floor) => {
    if (!resourceIds.has(resId)) return;
    if (!floors.has(resId) || floor < floors.get(resId)) floors.set(resId, floor);
  };

  for (const [floorKey, resources] of Object.entries(FLOOR_RESOURCES)) {
    const floor = Number(floorKey);
    for (const resource of resources) mark(resource.id, floor);
  }
  for (const floor of FLOORS) {
    for (const enemy of _auditEnemies(floor)) {
      for (const drop of enemy.drops || []) mark(drop.id, floor.id);
    }
  }
  for (const quest of STORY_QUESTS) {
    const reward = quest.reward || {};
    for (const resId of [reward.item, reward.recipe, reward.res]) mark(resId, quest.reqFloor);
  }
  return floors;
}

function _auditMobFloors() {
  const floors = new Map();
  for (const floor of FLOORS) {
    for (const enemy of _auditEnemies(floor)) {
      if (!floors.has(enemy.id) || floor.id < floors.get(enemy.id)) floors.set(enemy.id, floor.id);
    }
  }
  return floors;
}

function auditReachability() {
  const problems = [];
  const resourceFloors = _auditReachFloorMap();
  const mobFloors = _auditMobFloors();

  const describe = (resId) => (resourceFloors.has(resId)
    ? `мин. этаж ${resourceFloors.get(resId)}`
    : "недостижим");
  const reachable = (resId, floor) => resourceFloors.has(resId) && resourceFloors.get(resId) <= floor;

  for (const recipe of RECIPES) {
    for (const resId of Object.keys(recipe.materials || {})) {
      if (!reachable(resId, recipe.floor)) {
        problems.push(`Рецепт "${recipe.id}" (этаж ${recipe.floor}): материал "${resId}" — ${describe(resId)}`);
      }
    }
  }

  for (const [pathId, path] of Object.entries(UPGRADE_PATHS)) {
    (path.materials || []).forEach((materials, index) => {
      const floor = index + 1;
      for (const resId of Object.keys(materials)) {
        if (!reachable(resId, floor)) {
          problems.push(`Улучшение "${pathId}" (уровень ${index + 1}, этаж ${floor}): материал "${resId}" — ${describe(resId)}`);
        }
      }
    });
  }

  for (const quest of STORY_QUESTS) {
    const objectives = quest.objectives || {};
    if (objectives.res && !reachable(objectives.res, quest.reqFloor)) {
      problems.push(`Квест "${quest.id}" (этаж ${quest.reqFloor}): ресурс "${objectives.res}" — ${describe(objectives.res)}`);
    }
    if (objectives.kill) {
      const mobFloor = mobFloors.get(objectives.kill);
      if (mobFloor === undefined) {
        problems.push(`Квест "${quest.id}": моб "${objectives.kill}" не найден на этажах`);
      } else if (mobFloor > quest.reqFloor) {
        problems.push(`Квест "${quest.id}" (этаж ${quest.reqFloor}): моб "${objectives.kill}" появляется только на этаже ${mobFloor}`);
      }
    }
  }

  for (const contract of HUNT_CONTRACTS) {
    const mobFloor = mobFloors.get(contract.mobId);
    if (mobFloor === undefined) {
      problems.push(`Контракт "${contract.id}": моб "${contract.mobId}" не найден на этажах`);
    } else if (mobFloor > contract.floorId) {
      problems.push(`Контракт "${contract.id}" (этаж ${contract.floorId}): моб "${contract.mobId}" появляется только на этаже ${mobFloor}`);
    }
  }

  console.group("Достижимость");
  if (!problems.length) {
    console.log("OK");
  } else {
    for (const problem of problems) console.warn(problem);
  }
  console.groupEnd();

  return problems;
}

if (typeof window !== "undefined") {
  window.auditBalance = auditBalance;
  window.auditReachability = auditReachability;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports.validateData = validateData;
  module.exports.auditBalance = auditBalance;
  module.exports.auditReachability = auditReachability;
}

// ── validateCraftTiers: правило «тир предмета = этаж его материалов» ────────
// Рецепт тира N собирается только из FLOOR_RESOURCES[N]; уровень улучшения N —
// только из FLOOR_RESOURCES[N + 1]. Возвращает список нарушений и печатает их
// в консоль; ошибки не модифицируют данные. validateData() вызывает её и
// добавляет в сводку только число нарушений.
function validateCraftTiers() {
  const errors = [];
  for (const r of RECIPES) {
    const tier = ITEMS[r.result]?.shopTier;
    if (!tier) continue;
    const allowed = new Set((FLOOR_RESOURCES[tier] || []).map(x => x.id));
    for (const resId of Object.keys(r.materials || {})) {
      if (!allowed.has(resId)) {
        errors.push(`[craft/tier] ${r.id}: материал «${resId}» не с этажа ${tier}`);
      }
    }
  }
  for (const [pathId, path] of Object.entries(UPGRADE_PATHS)) {
    path.materials.forEach((mats, level) => {
      const allowed = new Set((FLOOR_RESOURCES[level + 1] || []).map(x => x.id));
      for (const resId of Object.keys(mats)) {
        if (!allowed.has(resId)) {
          errors.push(`[upgrade/tier] ${pathId}.materials[${level}]: «${resId}» не с этажа ${level + 1}`);
        }
      }
    });
  }
  if (errors.length) {
    console.group(`%c[data] ${errors.length} нарушений tier-правила`, "color:#e06060;font-weight:bold");
    errors.forEach(e => console.warn(e));
    console.groupEnd();
  } else {
    console.log("%c[data] tier-правило соблюдено", "color:#7ac47a");
  }
  return errors;
}

if (typeof window !== "undefined") {
  window.validateCraftTiers = validateCraftTiers;
}

// ── Звуки боя (строго под существующие файлы) ──────────────────────
const SOUND_VARIANTS = {
  hit_slash: [
    "assets/audio/hit_slash1.mp3", "assets/audio/hit_slash2.mp3",
    "assets/audio/hit_slash3.mp3", "assets/audio/hit_slash4.mp3",
    "assets/audio/hit_slash5.mp3", "assets/audio/hit_slash6.mp3"
  ],
  hit_blunt: [
    "assets/audio/hit_blunt.mp3", "assets/audio/hit_blunt2.mp3"
  ],
  hit_crit_slash: ["assets/audio/hit_slashcrit.mp3"],
  hit_crit_blunt: ["assets/audio/hit_bluntcrit.mp3"],
  hit_block: [
    "assets/audio/hit_block1.mp3", "assets/audio/hit_block2.mp3",
    "assets/audio/hit_block3.mp3", "assets/audio/hit_block4.mp3"
  ],
  hit_miss: [
    "assets/audio/hit_miss1.mp3", "assets/audio/hit_miss2.mp3",
    "assets/audio/hit_miss3.mp3", "assets/audio/hit_miss4.mp3",
    "assets/audio/hit_bluntmiss.mp3", "assets/audio/hit_bluntmiss2.mp3"
  ],
  disarm: ["assets/audio/disarm.mp3", "assets/audio/disarm2.mp3"],
  
  // Заглушки (файлов пока нет)
  potion: ["assets/audio/potion.mp3"],
  victory: ["assets/audio/victory.mp3"],
  defeat: ["assets/audio/defeat.mp3"],
  levelup: ["assets/audio/levelup.mp3"],
  open: ["assets/audio/open.mp3"],
  chest: ["assets/audio/chest.mp3"],
  event: ["assets/audio/event.mp3"],
  quest_complete: ["assets/audio/quest_complete.mp3"],

  // Шаги
  footstep_dirt: ["assets/audio/dirt_walk_1.wav", "assets/audio/dirt_walk_2.wav", "assets/audio/dirt_walk_3.wav", "assets/audio/dirt_walk_4.wav", "assets/audio/dirt_walk_5.wav"],
  footstep_stone: ["assets/audio/stone_walk_1.wav", "assets/audio/stone_walk_2.wav", "assets/audio/stone_walk_3.wav", "assets/audio/stone_walk_4.wav", "assets/audio/stone_walk_5.wav"],
  footstep_wood: ["assets/audio/wood_walk_1.wav", "assets/audio/wood_walk_2.wav", "assets/audio/wood_walk_3.wav", "assets/audio/wood_walk_4.wav", "assets/audio/wood_walk_5.wav"],
  footstep_water: ["assets/audio/water_walk_1.wav", "assets/audio/water_walk_2.wav", "assets/audio/water_walk_3.wav"],
  // Прыжки и приземления
  footstep_jump: ["assets/audio/dirt_jump.wav", "assets/audio/stone_jump.wav", "assets/audio/wood_jump.wav", "assets/audio/water_jump.wav"],
  footstep_land: ["assets/audio/dirt_land.wav", "assets/audio/stone_land.wav", "assets/audio/wood_land.wav", "assets/audio/water_land.wav"],
  // Интерфейс и взаимодействия
  chest_open: ["assets/audio/chest_open_1.wav", "assets/audio/chest_open_2.wav"],
  chest_close: ["assets/audio/chest_close_1.wav", "assets/audio/chest_close_2.wav"],
  door_open: ["assets/audio/door_open_1.wav", "assets/audio/door_open_2.wav"],
  door_close: ["assets/audio/door_close_1.wav", "assets/audio/door_close_2.wav"],
  gate_open: ["assets/audio/gate_open.wav"],
  portcullis: ["assets/audio/portcullis_gate.wav"],
  lock_unlock: ["assets/audio/lock_unlock.wav"],
  forge_craft: ["assets/audio/forge_craft.wav"]
};
window.SOUND_VARIANTS = SOUND_VARIANTS;

// ── Фоновая музыка и амбиент локаций ───────────────────────────────────────
const MUSIC_TRACKS = {
  hub: "assets/audio/hub_music.mp3",
  market: "assets/audio/market_ambient.mp3",
  tower: "assets/audio/tower_music.mp3",
  battle: "assets/audio/battle_music.mp3",
  boss: "assets/audio/boss_music.mp3",
};

const AMBIENT_TRACKS = {
  hotel: "assets/audio/tavern_ambient.mp3",
  forge: "assets/audio/forge_ambient.mp3",
  alchemy: "assets/audio/alchemy_ambient.mp3",
  jewelry: "assets/audio/jewelry_ambient.mp3",
  training: "guild",
  floor_1: "assets/audio/floor1_forest.mp3",
  floor_2: "assets/audio/floor2_mines.mp3",
  floor_3: "assets/audio/floor3_crypt.mp3",
  floor_4: "assets/audio/floor4_orcs.mp3",
  floor_5: "assets/audio/floor5_hell.mp3",
};
