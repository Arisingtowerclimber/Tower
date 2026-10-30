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

const NPC_PORTRAITS = {
  ron: "assets/portraits/ron.webp",
  elain: "assets/portraits/elain.webp",
  elize: "assets/portraits/elize.webp",
  stella: "assets/portraits/stella.webp",
  arthur: "assets/portraits/arthur.webp",
  ivan: "assets/portraits/ivan.webp",
  timmy: "assets/portraits/timmy.webp",
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
        npc: "Стой, {gender_term:путник|путница}. Новое лицо в Йорстеде. Я — Рон, держу эту кузницу. Судя по твоему виду, ты идёшь в Башню.", 
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
    greetings: ["Сталь не ждёт, {gender_term:путник|путница}. Что вам нужно: клинок или крепкая броня?", "Хороший металл, хороший уголь..."],
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
    greetings: ["Тише сходи, {gender_term:путник|путница}, не урони мой склероций."],
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
    greetings: ["А, {gender_term:новобранец|новобранка}. Заходи. Я научу тебя выживать."],
    shop_open: "Вот мои тренировки и контракты.",
    quest_complete: ["Неплохо. Для новичка — даже отлично."],
    farewell: "Не забывай отдыхать.",
  },
  arthur: {
    story: [
      { 
        npc: "Эй, {gender_term:путник|путница}! Не хочешь взглянуть на мой товар? У меня есть редкие вещицы, которых нет у местных лавочников.", 
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
      "Эй, {gender_term:путник|путница}! Не хочешь взглянуть на мой товар?",
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

// ── Диалоговые деревья NPC (Блок 2) ────────────────────────────────────────
// Узел: { text, options: [{ label, next, mood?, effects?, action? }] }.
// next: null — закрыть диалог. action: "open_shop" — открыть лавку NPC.
// effects применяет applyDialogEffects (state.js): gold, rep, flag, item.
const DIALOG_TREES = {
  ron: {
    start: {
      text: "Сталь не ждёт. Люди — тоже. Говори: клинок, броня или беда?",
      options: [
        { label: "🛒 Показать товары", next: "shop" },
        { label: "Что такое Башня на самом деле?", next: "lore_tower" },
        { label: "Ты ведь не всегда был кузнецом.", next: "personal" },
        { label: "О чём шепчутся в городе?", next: "rumors" },
        { label: "Твоя сталь держит удар. Это честная работа.", next: "praise", mood: "good", effects: { rep: 1, flag: "ron_praised" } },
        { label: "Твои клинки — ржавый хлам.", next: "insult", mood: "bad", effects: { rep: -2, flag: "ron_insulted" } },
        { label: "👑 Вождь Гоблинов мёртв. Моя работа.", next: "progress_1", requires: { bossKilled: "goblin_chief" } },
        { label: "🕯 Владыка Бездны пал. Я вернулся.", next: "progress_2", requires: { bossKilled: "demon_lord" } },
        { label: "📜 Расспросить о делах", next: "story_offer", requires: { maxFloor: 4, notFlag: "story_accepted_sq_ron_mithril_ore" } },
        { label: "Уйти", next: "leave" },
      ],
    },
    shop: {
      text: "Смотри, что сегодня на прилавке. Уголь горячий. Терпение — горячее.",
      options: [
        { label: "К прилавку", action: "open_shop" },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    lore_tower: {
      text: "Башня — не здание. Это рана в мире. Каждый этаж — чужой мир, и каждый лезет в наш.",
      options: [
        { label: "А что с металлом оттуда?", next: "lore_metal" },
        { label: "А другие города?", next: "lore_city" },
        { label: "Назад", next: "start" },
      ],
    },
    lore_metal: {
      text: "Металл из Башни звенит иначе. Он помнит чужое небо. Куёшь — будто чужой голос под рукой. Если клинок запоёт — беги. Или пой. Я не судья.",
      options: [
        { label: "Страшно, когда поёт сталь.", next: "hope" },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    lore_city: {
      text: "Йорстед стоит. Пока. Остальные города — имена на пепле. Дубовый Брод... не будем.",
      options: [
        { label: "Дубовый Брод — это твой дом?", next: "family" },
        { label: "Назад", next: "start" },
      ],
    },
    personal: {
      text: "Спрашиваешь про семью. Был дом. Жена. Сын. Теперь — горн и наковальня. Не жалей меня. Жалость ржавеет.",
      options: [
        { label: "Расскажи о них.", next: "family" },
        { label: "Почему ты остался в Йорстеде?", next: "forge_oath" },
        { label: "Назад", next: "start" },
      ],
    },
    family: {
      text: "Марта не дождалась. Кир... ему было семь. Я держал дверь, пока они бежали. Дверь выдержала. Стена — нет.",
      options: [
        { label: "Ты сделал всё, что мог.", next: "hope", mood: "good", effects: { rep: 1, flag: "ron_comforted" } },
        { label: "Соболезную.", next: "start" },
      ],
    },
    forge_oath: {
      text: "Я не спасаю мир. Я делаю так, чтобы тот, кто идёт спасать, вернулся. Иногда возвращается. Ради этого и стою у горна.",
      options: [
        { label: "Это больше, чем меч.", next: "praise" },
        { label: "Назад", next: "start" },
      ],
    },
    praise: {
      text: "Слышу редко. Сталь любит тех, кто умеет ждать. Держи совет: не бери клинок, который тяжелее тебя. И не спорь с кузнецом.",
      options: [
        { label: "Взять монету за честную работу.", next: "praise_paid", effects: { gold: 15, flag: "ron_tip_paid" }, requires: { notFlag: "ron_tip_paid" } },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    praise_paid: {
      text: "Не благодари. Это не подарок. Это аванс за то, что вернёшься живым. Вернёшься — сочтёмся.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    insult: {
      text: "Слова дешёвые, как шлак. Я запомню. Твой заказ будет ждать. Долго.",
      options: [
        { label: "Я пошутил. Плохо.", next: "start", mood: "neutral" },
        { label: "Уйти", next: null },
      ],
    },
    progress_1: {
      text: "Вождь гоблинов? Слышал. Хорошая работа. Не геройство — работа. Держи, на уголь.",
      options: [
        { label: "Взять монету.", next: "progress_1_paid", effects: { gold: 25, flag: "ron_goblin_paid" }, requires: { notFlag: "ron_goblin_paid" } },
        { label: "Оставь себе. Мне хватает.", next: "hope", mood: "good", effects: { rep: 1, flag: "ron_refused_pay" } },
        { label: "Назад", next: "start" },
      ],
    },
    progress_1_paid: {
      text: "Купи угля. Хорошего. Тот, что дешевле, зря переводит сталь. И тебя.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    progress_2: {
      text: "Владыка Бездны... Значит, дно есть. Я выкую тебе клинок, который не будет петь. Пока.",
      options: [
        { label: "Почему не будет петь?", next: "lore_metal" },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    rumors: {
      text: "Элейн варит зелья из трав, которые растут в чужом мире. Не спрашивай, что она туда добавляет. Она и сама не всегда знает.",
      options: [
        { label: "А про Ивана и Тимми?", next: "rumors2" },
        { label: "Назад", next: "start" },
      ],
    },
    rumors2: {
      text: "Волк и Ворон. Раньше — кровь. Сейчас — кружка на двоих. Башня уравняла. Или просто устали ненавидеть.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    hope: {
      text: "Йорстед ещё стоит. Пока стою я — будет кому подковать лошадь и заточить меч. Это немного. Это всё.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    story_offer: {
      text: "Слышал, в Лагере Орков жилы мифрила блестят на солнце. Принеси мне 5 мифриловой руды — скуём из неё что-нибудь стоящее, и я заплачу щедро.",
      options: [
        { label: "Я возьмусь.", next: "story_taken", effects: { action: "accept_story", questId: "sq_ron_mithril_ore" } },
        { label: "Не сейчас.", next: "start" },
      ],
    },
    story_taken: {
      text: "Вот это разговор. Жду руду. И не умри по дороге — мне нужен живой поставщик.",
      options: [
        { label: "Понял.", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    leave: {
      text: "Ступай. И не забудь: хорошая сталь не прощает спешки.",
      options: [{ label: "Уйти", next: null }],
    },
  },

  elain: {
    start: {
      text: "Осторожно, не зацепи колбы! Я Элейн. Раны, ожоги, дурные мысли — всё сюда. Мысли — за отдельную плату.",
      options: [
        { label: "🧪 Показать товары", next: "shop" },
        { label: "Откуда ты берёшь травы?", next: "lore_tower" },
        { label: "Ты ведь не всегда была алхимиком.", next: "personal" },
        { label: "Что говорят в городе?", next: "rumors" },
        { label: "Твои зелья спасают жизни. Спасибо.", next: "praise", mood: "good", effects: { rep: 1, flag: "elain_praised" } },
        { label: "Твои отвары — просто грязная вода.", next: "insult", mood: "bad", effects: { rep: -2, flag: "elain_insulted" } },
        { label: "👑 Вождь Гоблинов мёртв. Больше не будет рваных ран.", next: "progress_1", requires: { bossKilled: "goblin_chief" } },
        { label: "🕯 Владыка Бездны мёртв. Я вернулся.", next: "progress_2", requires: { bossKilled: "demon_lord" } },
        { label: "📜 Расспросить о делах", next: "story_offer", requires: { maxFloor: 2, notFlag: "story_accepted_sq_elain_cave_mushroom" } },
        { label: "Уйти", next: "leave" },
      ],
    },
    shop: {
      text: "Пузырьки не бей. Перемешивать я уже успела. Выбирай.",
      options: [
        { label: "К прилавку", action: "open_shop" },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    lore_tower: {
      text: "В Башне растут травы, которых нет в нашем мире. Без них мои зелья — просто вода. Горькая. Проверяла.",
      options: [
        { label: "А что не так с лесом на первом этаже?", next: "lore_world" },
        { label: "А если Башня дойдёт до Йорстеда?", next: "lore_city" },
        { label: "Назад", next: "start" },
      ],
    },
    lore_world: {
      text: "Лес не подчиняется природе. Деревья растут из камня. Звери не боятся огня. А травы... травы там честнее людей.",
      options: [
        { label: "Почему честнее?", next: "recipe" },
        { label: "Назад", next: "start" },
      ],
    },
    lore_city: {
      text: "Йорстед — последняя аптека на сотни миль. Если он падёт, лечить будет некому. Так что я не закрываюсь. Даже ночью.",
      options: [
        { label: "Ты не боишься?", next: "hope" },
        { label: "Назад", next: "start" },
      ],
    },
    personal: {
      text: "Моя мать была травницей. Умерла от болезни, которую сама же лечила. Не хватило одного корня. Я запомнила какого.",
      options: [
        { label: "А сестра?", next: "sister" },
        { label: "Ты поэтому пошла в алхимию?", next: "recipe" },
        { label: "Назад", next: "start" },
      ],
    },
    sister: {
      text: "Сестра ушла в Башню за тем корнем. Не вернулась. Я не злюсь. Я жду. И варю. Одно помогает другому.",
      options: [
        { label: "Может, она ещё вернётся.", next: "hope", mood: "good", effects: { rep: 1, flag: "elain_comforted" } },
        { label: "Назад", next: "start" },
      ],
    },
    recipe: {
      text: "Хороший отвар — это терпение. Поспешишь — получится компот. Вкусный, но от смерти не помогает. Обычно.",
      options: [
        { label: "Обычно?", next: "lore_world" },
        { label: "Назад", next: "start" },
      ],
    },
    praise: {
      text: "Приятно. Травы не терпят благодарности, а люди — терпят. Заходи, пока склероций свежий.",
      options: [
        { label: "Взять бинты и монету.", next: "praise_paid", effects: { gold: 12, flag: "elain_tip_paid" }, requires: { notFlag: "elain_tip_paid" } },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    praise_paid: {
      text: "Не спорь. Это не милость. Это чтобы ты не сдох от первого пореза. Мне потом руки мыть.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    insult: {
      text: "Глупость не лечится отваром. Но у меня есть кое-что от головной боли. Тебе уже пора.",
      options: [
        { label: "Прости. Я не так сказал.", next: "start", mood: "neutral" },
        { label: "Уйти", next: null },
      ],
    },
    progress_1: {
      text: "Вождь гоблинов? Хорошо. Меньше гоблинов — меньше рваных ран. Вот, возьми бинты. И не спорь.",
      options: [
        { label: "Взять бинты и монету.", next: "progress_1_paid", effects: { gold: 20, flag: "elain_goblin_paid" }, requires: { notFlag: "elain_goblin_paid" } },
        { label: "Оставь бинты тем, кому хуже.", next: "hope", mood: "good", effects: { rep: 1, flag: "elain_refused_pay" } },
        { label: "Назад", next: "start" },
      ],
    },
    progress_1_paid: {
      text: "Монета — за работу. Бинты — за то, что вернулся. Это разные вещи. Не путай.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    progress_2: {
      text: "Владыка Бездны мёртв. Тогда почему у меня руки дрожат? ...Наверное, от радости. Наверное.",
      options: [
        { label: "Ты боишься, что будет дальше.", next: "hope" },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    rumors: {
      text: "Рон ворчит, но после каждого твоего похода ставит чайник. Не говори ему, что я знаю. Он станет невыносим.",
      options: [
        { label: "А про Стеллу?", next: "rumors2" },
        { label: "Назад", next: "start" },
      ],
    },
    rumors2: {
      text: "Стелла знает все слухи. Иногда мне кажется, она их сама и придумывает. Но они сбываются. Это хуже.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    hope: {
      text: "Йорстед ещё дышит. Слышишь? Это не ветер. Это город. Пока дышит — лечим.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    story_offer: {
      text: "Пещерные грибы из Шахт Кобольдов — основа половины моих отваров, а запасы кончились. Принеси 4 штуки, и я не останусь в долгу.",
      options: [
        { label: "Я возьмусь.", next: "story_taken", effects: { action: "accept_story", questId: "sq_elain_cave_mushroom" } },
        { label: "Не сейчас.", next: "start" },
      ],
    },
    story_taken: {
      text: "Отлично. Только не жуй их по дороге — я говорила, что они ядовиты? Говорила.",
      options: [
        { label: "Понял.", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    leave: {
      text: "Не хворай. И не пей из неподписанных склянок. Мне потом отмывать.",
      options: [{ label: "Уйти", next: null }],
    },
  },

  elize: {
    start: {
      text: "Тише. Камни не любят суеты. Говори коротко. Что тебе нужно?",
      options: [
        { label: "💍 Показать украшения", next: "shop" },
        { label: "Откуда эти камни?", next: "lore_tower" },
        { label: "Кто ты была до лавки?", next: "personal" },
        { label: "Что шепчут камни?", next: "rumors" },
        { label: "Твоя работа — редкое искусство.", next: "praise", mood: "good", effects: { rep: 1, flag: "elize_praised" } },
        { label: "Этот блеск — дешёвая подделка.", next: "insult", mood: "bad", effects: { rep: -2, flag: "elize_insulted" } },
        { label: "👑 Вождь Гоблинов мёртв. Его тесак — история.", next: "progress_1", requires: { bossKilled: "goblin_chief" } },
        { label: "🕯 Владыка Бездны мёртв. Его трон молчит.", next: "progress_2", requires: { bossKilled: "demon_lord" } },
        { label: "📜 Расспросить о делах", next: "story_offer", requires: { maxFloor: 3, notFlag: "story_accepted_sq_elize_rune_dust" } },
        { label: "Уйти", next: "leave" },
      ],
    },
    shop: {
      text: "Оправы вон там. Камни — вот тут. Не дыши на витрину.",
      options: [
        { label: "К прилавку", action: "open_shop" },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    lore_tower: {
      text: "Камни из Башни светятся в темноте. Они красивы. Но я помню, что они означают.",
      options: [
        { label: "Что они означают?", next: "lore_stones" },
        { label: "А что с Йорстедом?", next: "lore_city" },
        { label: "Назад", next: "start" },
      ],
    },
    lore_stones: {
      text: "Каждый камень помнит свет своего мира. Лесной — зелёный. Склепный — белый. Демонический — красный. Красные я не беру в руки без перчаток.",
      options: [
        { label: "Почему без перчаток?", next: "warning" },
        { label: "Назад", next: "start" },
      ],
    },
    lore_city: {
      text: "Йорстед раньше торговал с двенадцатью городами. Теперь — с памятью о них. Память платит хуже.",
      options: [
        { label: "Но город ещё стоит.", next: "hope" },
        { label: "Назад", next: "start" },
      ],
    },
    personal: {
      text: "Мой дом был домом ювелиров. Мы продали всё, чтобы уехать. Кроме одного кольца. Оно до сих пор на мне. Не спрашивай, чьё.",
      options: [
        { label: "Расскажи о наставнике.", next: "mentor" },
        { label: "Почему ты осталась?", next: "hope" },
        { label: "Назад", next: "start" },
      ],
    },
    mentor: {
      text: "Мой наставник ушёл в Башню за камнем, которого не существует. Камень он нашёл. Наставник — нет.",
      options: [
        { label: "Ты поэтому не ходишь в Башню?", next: "warning" },
        { label: "Назад", next: "start" },
      ],
    },
    warning: {
      text: "Не носи красный камень на голой коже. Он не светится. Он смотрит.",
      options: [
        { label: "А если уже ношу?", next: "lore_stones" },
        { label: "Назад", next: "start" },
      ],
    },
    praise: {
      text: "Искусство не любит громких слов. Но твои слова легли ровно, как камень в оправу. Благодарю.",
      options: [
        { label: "Принять маленький камень на память.", next: "praise_paid", effects: { gold: 18, flag: "elize_tip_paid" }, requires: { notFlag: "elize_tip_paid" } },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    praise_paid: {
      text: "Он ничего не стоит. Пока. Носи с собой — и однажды он тебя вспомнит.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    insult: {
      text: "Подделка — это когда рука спешит. Моя рука не спешит. Уходи, пока я не запомнила твой голос.",
      options: [
        { label: "Прости. Я не подумал.", next: "start", mood: "neutral" },
        { label: "Уйти", next: null },
      ],
    },
    progress_1: {
      text: "Вождь гоблинов? Его тесак был из плохого железа. Теперь он — история. Возьми этот осколок. Он ничего не стоит. Пока.",
      options: [
        { label: "Принять осколок и монету.", next: "progress_1_paid", effects: { gold: 25, flag: "elize_goblin_paid" }, requires: { notFlag: "elize_goblin_paid" } },
        { label: "Оставь камень себе.", next: "hope", mood: "good", effects: { rep: 1, flag: "elize_refused_pay" } },
        { label: "Назад", next: "start" },
      ],
    },
    progress_1_paid: {
      text: "Камень будет холодным. Не пугайся. Это не смерть. Это память.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    progress_2: {
      text: "Владыка Бездны. Его трон был из душ. Теперь души свободны, а камень... камень молчит. Впервые за годы.",
      options: [
        { label: "Это хорошая тишина?", next: "hope" },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    rumors: {
      text: "Элейн добрая. Слишком. Такие, как она, обычно первыми уходят в Башню за кем-то. И не возвращаются.",
      options: [
        { label: "А Артур?", next: "rumors2" },
        { label: "Назад", next: "start" },
      ],
    },
    rumors2: {
      text: "Артур продаёт реликвии павших городов. Он говорит, что это торговля. Я говорю — это мародёрство с поклоном.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    hope: {
      text: "Йорстед стоит. Камни в его стенах ещё помнят солнце. Пока помнят — город жив.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    story_offer: {
      text: "Неупокоенные призраки таскают при себе рунную пыль. Мне нужно 3 щепотки — хочу опробовать новую оправу. Только не рассыпь её по пути.",
      options: [
        { label: "Я возьмусь.", next: "story_taken", effects: { action: "accept_story", questId: "sq_elize_rune_dust" } },
        { label: "Не сейчас.", next: "start" },
      ],
    },
    story_taken: {
      text: "Хорошо. Камни запомнят твой шаг. Не заставляй их ждать.",
      options: [
        { label: "Понял.", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    leave: {
      text: "До встречи. И не хлопай дверью — камни пугаются.",
      options: [{ label: "Уйти", next: null }],
    },
  },

  stella: {
    start: {
      text: "О, свежее лицо! Добро пожаловать в «Усталый путник». Согреться, отдохнуть или послушать, кто что натворил?",
      options: [
        { label: "🛏️ Снять номер", next: "shop" },
        { label: "Что ты знаешь о Башне?", next: "lore_tower" },
        { label: "Ты ведь не всегда была хозяйкой.", next: "personal" },
        { label: "Какие слухи ходят?", next: "rumors" },
        { label: "Здесь тепло, как дома. Спасибо, хозяйка.", next: "praise", mood: "good", effects: { rep: 1, flag: "stella_praised" } },
        { label: "Твоя гостиница — дыра с тараканами.", next: "insult", mood: "bad", effects: { rep: -2, flag: "stella_insulted" } },
        { label: "👑 Вождь Гоблинов мёртв. Меньше визга по ночам.", next: "progress_1", requires: { bossKilled: "goblin_chief" } },
        { label: "🕯 Владыка Бездны мёртв. Теперь можно спать?", next: "progress_2", requires: { bossKilled: "demon_lord" } },
        { label: "📜 Расспросить о делах", next: "story_offer", requires: { maxFloor: 3, notFlag: "story_accepted_sq_stella_crypt_ghoul" } },
        { label: "Уйти", next: "leave" },
      ],
    },
    shop: {
      text: "Номер всё тот же. Эль свежий. Простыни чистые. Постояльцы — наполовину.",
      options: [
        { label: "Снять номер", action: "open_shop" },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    lore_tower: {
      text: "Раньше здесь было больше постояльцев. Теперь... только те, кто нужен Башне. И те, кто ей уже не нужен.",
      options: [
        { label: "А куда делись остальные?", next: "lore_guests" },
        { label: "А что с городом?", next: "lore_city" },
        { label: "Назад", next: "start" },
      ],
    },
    lore_guests: {
      text: "Комнаты я не сдаю повторно, пока гость не вернётся. Глупо? Может быть. Зато у каждого ещё есть шанс.",
      options: [
        { label: "И многие возвращаются?", next: "hope" },
        { label: "Назад", next: "start" },
      ],
    },
    lore_city: {
      text: "Йорстед — это не город. Это гостиница побольше. Все зашли переждать. Никто не ушёл.",
      options: [
        { label: "И ты держишь дверь открытой.", next: "hope" },
        { label: "Назад", next: "start" },
      ],
    },
    personal: {
      text: "Я держу эту гостиницу двадцать лет. Муж погиб, когда стена рухнула. Сын ушёл в Башню. Комната его ждёт.",
      options: [
        { label: "Расскажи о муже.", next: "husband" },
        { label: "А сын?", next: "room" },
        { label: "Назад", next: "start" },
      ],
    },
    husband: {
      text: "Он любил говорить: «Стелла, у нас всегда есть место для ещё одного». Вот я и держу. Место есть. Его нет.",
      options: [
        { label: "Ты хранишь не комнату. Ты хранишь его.", next: "praise", mood: "good", effects: { rep: 1, flag: "stella_comforted" } },
        { label: "Назад", next: "start" },
      ],
    },
    room: {
      text: "Номер с видом на Башню. Вид оплачивается отдельно. Страх — бесплатно. Сын говорил, что это лучшая цена в городе.",
      options: [
        { label: "Он вернётся.", next: "hope" },
        { label: "Назад", next: "start" },
      ],
    },
    gossip: {
      text: "Сплетни — это не ложь. Это правда, которой ещё не нашли удобную форму. И я помогаю ей найтись.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    praise: {
      text: "Вот это по-нашему! За такие слова налью кружку в долг. Один раз. Не привыкай.",
      options: [
        { label: "Взять сдачу за прошлую ночь.", next: "praise_paid", effects: { gold: 10, flag: "stella_tip_paid" }, requires: { notFlag: "stella_tip_paid" } },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    praise_paid: {
      text: "Не благодари. Просто вернись. И желательно — не в сапогах с чужой кровью. Ковёр не казённый.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    insult: {
      text: "Тараканы платят вперёд и не хамят. Ты — пока нет. Дверь вон там.",
      options: [
        { label: "Прости. День был тяжёлый.", next: "start", mood: "neutral" },
        { label: "Уйти", next: null },
      ],
    },
    progress_1: {
      text: "Вождь гоблинов? О, это тот, который визжал на весь этаж? Я слышала его даже здесь. Через два мира. Ну, может, преувеличиваю.",
      options: [
        { label: "Взять ужин за счёт заведения.", next: "progress_1_paid", effects: { gold: 10, flag: "stella_goblin_paid" }, requires: { notFlag: "stella_goblin_paid" } },
        { label: "Мне хватит кружки.", next: "hope", mood: "good", effects: { rep: 1, flag: "stella_refused_pay" } },
        { label: "Назад", next: "start" },
      ],
    },
    progress_1_paid: {
      text: "Ешь. И слушай: если кто-то спросит, кто убил Вождя, — я скажу, что это была я. Шучу. Может быть.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    progress_2: {
      text: "Владыка Бездны мёртв. Значит, скоро появится новый герой. И новый слух. Садись, расскажу, пока не придумали.",
      options: [
        { label: "Слушаю.", next: "gossip" },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    rumors: {
      text: "Иван и Тимми пьют вместе. Ты видел? Волк и Ворон. Если бы их отцы это видели — перевернулись бы в гробах. Или заказали бы ещё кружку.",
      options: [
        { label: "А про Артура?", next: "rumors2" },
        { label: "Назад", next: "start" },
      ],
    },
    rumors2: {
      text: "Артур говорит, что его товар из-за моря. За моря теперь только пепел. Но плащи у него хорошие, не спорю.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    hope: {
      text: "Йорстед ещё стоит. И пока я ставлю на стол горячее — он будет стоять. Это не надежда. Это работа.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    story_offer: {
      text: "Неупокоенные из Древнего Склепа пугают постояльцев, а упыри и того хуже. Справься с упырём — и я буду встречать тебя как собственного героя.",
      options: [
        { label: "Я возьмусь.", next: "story_taken", effects: { action: "accept_story", questId: "sq_stella_crypt_ghoul" } },
        { label: "Не сейчас.", next: "start" },
      ],
    },
    story_taken: {
      text: "Спасибо. Наконец-то кто-то наведёт порядок. Комната за тобой, герой.",
      options: [
        { label: "Понял.", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    leave: {
      text: "Ночь тёплая. Заглядывай ещё — но не с пустым кошельком.",
      options: [{ label: "Уйти", next: null }],
    },
  },

  ivan: {
    start: {
      text: "{gender_term:Новобранец|Новобранка}? Вижу, взгляд серьёзный. Если хочешь выжить в Башне — слушай. Если хочешь славы — иди мимо.",
      options: [
        { label: "⚔️ Тренировки", next: "shop" },
        { label: "Что ждёт на глубине?", next: "lore_tower" },
        { label: "Кто ты был до Катаклизма?", next: "personal" },
        { label: "Что между тобой и Тимми?", next: "timmy" },
        { label: "Ты хороший командир. Люди за тобой идут.", next: "praise", mood: "good", effects: { rep: 1, flag: "ivan_praised" } },
        { label: "Твои тренировки — пустая трата времени.", next: "insult", mood: "bad", effects: { rep: -2, flag: "ivan_insulted" } },
        { label: "👑 Вождь Гоблинов мёртв. Первый босс взят.", next: "progress_1", requires: { bossKilled: "goblin_chief" } },
        { label: "🕯 Владыка Бездны мёртв. Дно достигнуто.", next: "progress_2", requires: { bossKilled: "demon_lord" } },
        { label: "📜 Расспросить о делах", next: "story_offer", requires: { notFlag: "story_accepted_sq_ivan_goblin_chief" } },
        { label: "Уйти", next: "leave" },
      ],
    },
    shop: {
      text: "Вот мои тренировки и контракты. Сначала выживать, потом побеждать. Порядок не переставляй.",
      options: [
        { label: "К тренировкам", action: "open_shop" },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    lore_tower: {
      text: "Башня — мультипланарное измерение. Каждый этаж — отдельный мир. Лес. Шахты. Склеп. Лагерь орков. Демонический план. Не ищи логику. Ищи выход.",
      options: [
        { label: "А правила этажей?", next: "lore_world" },
        { label: "Почему Йорстед ещё стоит?", next: "lore_city" },
        { label: "Назад", next: "start" },
      ],
    },
    lore_world: {
      text: "На первом этаже деревья растут из камня. На третьем время идёт назад. На пятом реальность плавится. Правила меняются. Ты — нет.",
      options: [
        { label: "Значит, держаться своих правил.", next: "oath" },
        { label: "Назад", next: "start" },
      ],
    },
    lore_city: {
      text: "Йорстед — один из немногих уцелевших. Остальные пали. Мы держим стену не потому, что сильные. Потому что больше некому.",
      options: [
        { label: "Ты веришь, что город выстоит?", next: "hope" },
        { label: "Назад", next: "start" },
      ],
    },
    personal: {
      text: "Я капитан Гильдии Охотников. До Катаклизма — наследник дома Волка. Теперь у меня нет дома. У меня есть пост.",
      options: [
        { label: "Расскажи о доме Волка.", next: "house" },
        { label: "А семья?", next: "grief" },
        { label: "Назад", next: "start" },
      ],
    },
    house: {
      text: "Дом Волка и дом Ворона грызли друг друга десятилетиями. Сейчас это неважно. Башня не спрашивает, какой у тебя герб. Она спрашивает, сколько ты стоишь.",
      options: [
        { label: "А Тимми — Ворон.", next: "timmy" },
        { label: "Назад", next: "start" },
      ],
    },
    timmy: {
      text: "Тимми — Ворон. Его отец убил моего дядю. Я должен был убить его. Вместо этого мы пьём в Зале Охотников. Сейчас все мы — дом Выживших.",
      options: [
        { label: "Ты жалеешь об этом?", next: "oath" },
        { label: "Он уважает тебя. По-своему.", next: "hope", mood: "good", effects: { rep: 1, flag: "ivan_timmy_peace" } },
        { label: "Назад", next: "start" },
      ],
    },
    oath: {
      text: "Присяга — это не слова. Это когда ты стоишь, хотя можешь бежать. Я стою. Пока.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    grief: {
      text: "Мой брат погиб в войне домов. Не в Башне. В войне за герб. Я до сих пор не знаю, за что. Теперь знаю: ни за что.",
      options: [
        { label: "Поэтому ты не хочешь новой войны.", next: "hope" },
        { label: "Назад", next: "start" },
      ],
    },
    praise: {
      text: "Дисциплина — это когда тебя хвалят, а ты всё равно выходишь на тренировку. Хорошо. Не расслабляйся.",
      options: [
        { label: "Взять премию Гильдии.", next: "praise_paid", effects: { gold: 20, flag: "ivan_tip_paid" }, requires: { notFlag: "ivan_tip_paid" } },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    praise_paid: {
      text: "Это не награда. Это аванс. Потрать на броню, а не на эль. Я проверю.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    insult: {
      text: "Слова без дисциплины — шум. Ещё одно такое — и будешь бегать вокруг Зала до заката.",
      options: [
        { label: "Виноват. Больше не повторится.", next: "start", mood: "neutral" },
        { label: "Уйти", next: null },
      ],
    },
    progress_1: {
      text: "Вождь гоблинов? Первый босс. Первая настоящая проверка. Ты прошёл. Не возгордись — второй этаж не мягче.",
      options: [
        { label: "Взять премию за босса.", next: "progress_1_paid", effects: { gold: 40, flag: "ivan_goblin_paid" }, requires: { notFlag: "ivan_goblin_paid" } },
        { label: "Оставь в фонд Гильдии.", next: "hope", mood: "good", effects: { rep: 2, flag: "ivan_refused_pay" } },
        { label: "Назад", next: "start" },
      ],
    },
    progress_1_paid: {
      text: "Купи броню. Не герб. Герб не держит удар. Проверено.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    progress_2: {
      text: "Владыка Бездны мёртв. Тогда почему я не чувствую облегчения? ...Потому что Башня не заканчивается. Она просто делает паузу.",
      options: [
        { label: "Значит, будем готовы к следующей.", next: "oath" },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    rumors: {
      text: "Рон — лучший кузнец города. Не говори ему. Он станет невыносим.",
      options: [
        { label: "А Стелла?", next: "rumors2" },
        { label: "Назад", next: "start" },
      ],
    },
    rumors2: {
      text: "Стелла знает больше, чем говорит. Это её оружие. Не отбирай.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    hope: {
      text: "Йорстед стоит. Пока стоит — есть куда возвращаться. Это не мало. Это всё, что у нас есть.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    story_offer: {
      text: "Вождь Гоблинов треплет караваны возле Йорстеда. Сруби ему башку — и я поставлю тебя в пример каждому новобранцу.",
      options: [
        { label: "Я возьмусь.", next: "story_taken", effects: { action: "accept_story", questId: "sq_ivan_goblin_chief" } },
        { label: "Не сейчас.", next: "start" },
      ],
    },
    story_taken: {
      text: "Так и знал, что ты не пустозвон. Иди. И вернись с его головой.",
      options: [
        { label: "Понял.", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    leave: {
      text: "Свободен. И не забывай отдыхать — мёртвые не тренируются.",
      options: [{ label: "Уйти", next: null }],
    },
  },

  timmy: {
    // Вступительная сцена: показывается один раз после создания героя
    // (флаг state.introPending), заканчивается флагом tutorial_done.
    intro_start: {
      text: "Вы замечаете, как к вам подходит кто-то в потрёпанном плаще. Молодой парень с усталыми, но внимательными глазами. «Эй! {gender_term:Новенький|Новенькая}? По взгляду вижу — в Башню собрался. Не спеши, тут есть о чём подумать. Я Тимми, местный охотник.»",
      options: [
        { label: "Кто ты такой?", next: "intro_who" },
        { label: "Отойди, я спешу.", next: "intro_angry" },
      ],
    },
    intro_who: {
      text: "Я тот, кто вытаскивал таких, как ты, из пасти гоблинов. Слушай сюда, это спасёт тебе жизнь...",
      options: [
        { label: "Слушаю.", next: "intro_tutorial" },
      ],
    },
    intro_angry: {
      text: "Дерзкий. Люблю таких. Но дерзость не спасёт от когтей. Ладно, слушай...",
      options: [
        { label: "Ну, говори.", next: "intro_tutorial" },
      ],
    },
    intro_tutorial: {
      text: "Первое — Зал Охотников. Там тренировки и контракты. Второе — Башня. Пять этажей, каждый — отдельный мир. Третье — отдых. Не лезь на рожон с пустой энергией. Зайди в Гостиницу, найми спутницу, если тяжело.",
      options: [
        { label: "Понял. Спасибо.", next: "intro_end" },
      ],
    },
    intro_end: {
      text: "Удачи, {gender_term:новобранец|новобранка}. Если что — я в Зале Охотников.",
      options: [
        { label: "До встречи.", next: null, effects: { flag: "tutorial_done", value: true } },
      ],
    },
    start: {
      text: "О, {gender_term:новенький|новенькая}! Я Тимми. Молодой охотник, гроза гоблинов, любимец барменши. Два из трёх — правда.",
      options: [
        { label: "🏹 Спросить совет", next: "shop" },
        { label: "Что ты знаешь об этажах?", next: "lore_tower" },
        { label: "Ты ведь из дома Ворона?", next: "personal" },
        { label: "Что у тебя с Иваном?", next: "ivan" },
        { label: "Ты храбрый. Не каждый идёт в Башню.", next: "praise", mood: "good", effects: { rep: 1, flag: "timmy_praised" } },
        { label: "Ты ещё ребёнок. Какой из тебя охотник?", next: "insult", mood: "bad", effects: { rep: -2, flag: "timmy_insulted" } },
        { label: "👑 Вождь Гоблинов мёртв. Я его сделал.", next: "progress_1", requires: { bossKilled: "goblin_chief" } },
        { label: "🕯 Владыка Бездны мёртв. Я спустился на дно.", next: "progress_2", requires: { bossKilled: "demon_lord" } },
        { label: "Уйти", next: "leave" },
      ],
    },
    shop: {
      text: "Советы бесплатные. За правильные иногда платят уважением. Слушай внимательно.",
      options: [
        { label: "Спросить совет", action: "open_shop" },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    lore_tower: {
      text: "Первый этаж — лес. Второй — шахты. Третий — склеп, где время идёт назад. Не пытайся понять. Просто не ложись там спать.",
      options: [
        { label: "А четвертый и пятый?", next: "lore_world" },
        { label: "А что с Йорстедом?", next: "lore_city" },
        { label: "Назад", next: "start" },
      ],
    },
    lore_world: {
      text: "Четвертый — лагерь орков из другого плана. Пятый — демонический. Там реальность плавится. Башня умеет ждать. Если этаж кажется пустым — ты просто не видишь, что там.",
      options: [
        { label: "И оно уже видит меня?", next: "scars" },
        { label: "Назад", next: "start" },
      ],
    },
    lore_city: {
      text: "Йорстед — последний город, где ещё наливают. Остальные пали. Так что пей, пока наливают. И воюй, пока стоит.",
      options: [
        { label: "Мрачно.", next: "hope" },
        { label: "Назад", next: "start" },
      ],
    },
    personal: {
      text: "Я из дома Ворона. Мой отец убил дядю Ивана. А сейчас мы вместе пьём в Зале Охотников. Вот так. Катаклизм сравнял нас всех.",
      options: [
        { label: "И что теперь?", next: "ivan" },
        { label: "А твой отец?", next: "father" },
        { label: "Назад", next: "start" },
      ],
    },
    ivan: {
      text: "Иван? Он думает, что я не знаю. Знаю. И он знает, что я знаю. Мы просто не говорим. Так проще пить.",
      options: [
        { label: "Ты его уважаешь?", next: "hope", mood: "good", effects: { rep: 1, flag: "timmy_ivan_peace" } },
        { label: "А он тебя?", next: "father" },
        { label: "Назад", next: "start" },
      ],
    },
    father: {
      text: "Отец хотел, чтобы я продолжил вражду. Я пошёл в Башню. Там врагов выбираешь не ты. Как оказалось, это легче.",
      options: [
        { label: "Ты не жалеешь?", next: "scars" },
        { label: "Назад", next: "start" },
      ],
    },
    scars: {
      text: "Мой самый большой шрам? Не от монстра. Упал с лестницы в гостинице. Стелла до сих пор смеётся. Башня — ерунда по сравнению с её языком.",
      options: [
        { label: "А остальные шрамы?", next: "joke" },
        { label: "Назад", next: "start" },
      ],
    },
    joke: {
      text: "Каждый шрам — история. Мои все врут. На самом деле я просто неуклюжий. Не говори Ивану. Он заставит отжиматься.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    praise: {
      text: "Правда? Спасибо! Я... я стараюсь. Вот, держи совет бесплатно: не стой под ударом. И не хвались до боя.",
      options: [
        { label: "Взять монету на стрелы.", next: "praise_paid", effects: { gold: 8, flag: "timmy_tip_paid" }, requires: { notFlag: "timmy_tip_paid" } },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    praise_paid: {
      text: "Только не говори, что я добрый. У меня репутация. Ну, была. Пока ты не пришёл.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    insult: {
      text: "Ну и ладно. Ну и пожалуйста. Я всё равно знаю больше, чем ты думаешь. Наверное. Не проверяй.",
      options: [
        { label: "Ладно, ты не ребёнок. Прости.", next: "start", mood: "neutral" },
        { label: "Уйти", next: null },
      ],
    },
    progress_1: {
      text: "Ты убил Вождя Гоблинов? Серьёзно? Я его видел. Он был... большой. И злой. Ладно, ты крут. Только не говори Ивану, что я так сказал.",
      options: [
        { label: "Взять монету. На стрелы.", next: "progress_1_paid", effects: { gold: 15, flag: "timmy_goblin_paid" }, requires: { notFlag: "timmy_goblin_paid" } },
        { label: "Оставь себе. Купи нормальный шлем.", next: "hope", mood: "good", effects: { rep: 1, flag: "timmy_refused_pay" } },
        { label: "Назад", next: "start" },
      ],
    },
    progress_1_paid: {
      text: "Спасибо! Я куплю... что-нибудь. Не шлем. Шлем портит причёску. Не говори Ивану.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    progress_2: {
      text: "Владыка Бездны? Ты? ...Ладно, я официально впечатлён. Но если ты теперь будешь ходить и рассказывать это всем — я тебя поколочу. Шутка. Почти.",
      options: [
        { label: "Ты бы пошёл со мной?", next: "hope" },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    rumors: {
      text: "Рон ворчит, что молодёжь не умеет держать клинок. Потом подковывает мне сапоги бесплатно. Странный способ заботиться.",
      options: [
        { label: "А про Элизу?", next: "rumors2" },
        { label: "Назад", next: "start" },
      ],
    },
    rumors2: {
      text: "Элиза говорит с камнями. Я проверял — они не отвечают. Но она всё равно выглядит так, будто знает больше.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    hope: {
      text: "Йорстед ещё стоит. Значит, есть куда вернуться после Башни. Выпить, поспать, соврать о подвигах. Нормальная жизнь.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    leave: {
      text: "Удачи! И если увидишь что-то страшное — беги. Это тоже совет.",
      options: [{ label: "Уйти", next: null }],
    },
  },

  arthur: {
    start: {
      text: "Дорогу! Торговец идёт! У меня есть то, чего нет у местных лавочников. Совесть, например. Шучу. Совесть не продаётся.",
      options: [
        { label: "💰 Показать товары", next: "shop" },
        { label: "Откуда твой товар?", next: "lore_tower" },
        { label: "Ты ведь из павшего дома?", next: "personal" },
        { label: "Что говорят о других?", next: "rumors" },
        { label: "Ты умеешь вести дело. Уважаю.", next: "praise", mood: "good", effects: { rep: 1, flag: "arthur_praised" } },
        { label: "Ты торгуешь краденым.", next: "insult", mood: "bad", effects: { rep: -2, flag: "arthur_insulted" } },
        { label: "👑 Вождь Гоблинов мёртв. Спрос на гоблинское падает.", next: "progress_1", requires: { bossKilled: "goblin_chief" } },
        { label: "🕯 Владыка Бездны мёртв. Демонические реликвии подешевеют?", next: "progress_2", requires: { bossKilled: "demon_lord" } },
        { label: "Уйти", next: "leave" },
      ],
    },
    shop: {
      text: "Смотри, выбирай, не стесняйся. Цены — как в лучших домах. Товар — из-за моря. Какого моря — не спрашивай.",
      options: [
        { label: "К товарам", action: "open_shop" },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    lore_tower: {
      text: "Башня — это рынок, который никто не закрывает. Каждый этаж — новый мир, новые товары, новые покупатели. Правда, покупатели иногда с клыками.",
      options: [
        { label: "А что с павшими городами?", next: "lore_world" },
        { label: "А Йорстед?", next: "lore_city" },
        { label: "Назад", next: "start" },
      ],
    },
    lore_world: {
      text: "Пока города падают, у торговца работа есть. Грустно? Да. Но кто-то же должен продавать павшим городам последние вещи.",
      options: [
        { label: "Это называется мародёрство.", next: "relic" },
        { label: "Назад", next: "start" },
      ],
    },
    lore_city: {
      text: "Йорстед — последний перекрёсток. Здесь сошлись те, кто раньше убивал друг друга. Теперь торгуются. Прогресс.",
      options: [
        { label: "И ты на этом прогресс зарабатываешь.", next: "deal" },
        { label: "Назад", next: "start" },
      ],
    },
    personal: {
      text: "Я из дома, которого больше нет. Мы торговали специями, шелками, чужими секретами. Теперь торгую тем, что осталось. Это называется адаптация.",
      options: [
        { label: "Расскажи о доме.", next: "house" },
        { label: "И ты не жалеешь?", next: "business" },
        { label: "Назад", next: "start" },
      ],
    },
    house: {
      text: "Мой отец проиграл всё в одну ночь. Дом, имя, даже герб. Я не проигрываю. Я продаю. Разница есть.",
      options: [
        { label: "Разница есть.", next: "hope", mood: "good", effects: { rep: 1, flag: "arthur_comforted" } },
        { label: "Назад", next: "start" },
      ],
    },
    business: {
      text: "Я не торгую краденым. Я торгую вещами, которые потеряли хозяев. Это разные вещи. Иногда.",
      options: [
        { label: "Иногда?", next: "relic" },
        { label: "Назад", next: "start" },
      ],
    },
    relic: {
      text: "Эта вещь из города, которого нет. Не спрашивай, откуда. Спрашивай, сколько. Это правильный вопрос.",
      options: [
        { label: "Сколько?", next: "deal" },
        { label: "Назад", next: "start" },
      ],
    },
    deal: {
      text: "Сделка — это когда оба уходят довольными. Или один довольный, а второй не заметил. Я предпочитаю первое. Обычно.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    praise: {
      text: "Приятно, когда ценят. За доброе слово — скидка. Почти. Ладно, просто запомню тебя добрым покупателем.",
      options: [
        { label: "Взять скидку монетой.", next: "praise_paid", effects: { gold: 15, flag: "arthur_tip_paid" }, requires: { notFlag: "arthur_tip_paid" } },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    praise_paid: {
      text: "Только никому. Если узнают, что я умею быть щедрым, цены упадут. А я этого не переживу.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    insult: {
      text: "Краденое? Обижаешь. Я беру только то, что плохо лежит... и хорошо платит. Шутка. Почти.",
      options: [
        { label: "Плохая шутка. Прости.", next: "start", mood: "neutral" },
        { label: "Уйти", next: null },
      ],
    },
    progress_1: {
      text: "Вождь гоблинов? Поздравляю! У меня как раз есть клинок, снятый с его... коллеги. Почти новый. Недорого.",
      options: [
        { label: "Принять скидку за босса.", next: "progress_1_paid", effects: { gold: 35, flag: "arthur_goblin_paid" }, requires: { notFlag: "arthur_goblin_paid" } },
        { label: "Обойдусь без твоих реликвий.", next: "hope", mood: "good", effects: { rep: 1, flag: "arthur_refused_pay" } },
        { label: "Назад", next: "start" },
      ],
    },
    progress_1_paid: {
      text: "Видишь? Честная сделка. Ты убил — я продал. Все довольны. Кроме Вождя. Но он уже не клиент.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    progress_2: {
      text: "Владыка Бездны? Значит, спрос на демонические реликвии упадёт. Или взлетит. Рынок непредсказуем.",
      options: [
        { label: "Ты думаешь о ценах даже сейчас?", next: "deal" },
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    rumors: {
      text: "Иван и Тимми? Волк и Ворон. Раньше они бы убили друг друга. Сейчас делят счёт. Прогресс, как я говорю.",
      options: [
        { label: "А про Элизу?", next: "rumors2" },
        { label: "Назад", next: "start" },
      ],
    },
    rumors2: {
      text: "Элиза не торгуется. Вообще. Это либо святая, либо очень хороший стратег. Ставлю на второе.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    hope: {
      text: "Йорстед стоит — значит, есть кому продавать. А пока есть кому продавать, есть смысл вставать утром. Почти поэзия.",
      options: [
        { label: "Назад", next: "start" },
        { label: "Уйти", next: null },
      ],
    },
    leave: {
      text: "Удачной охоты! И заходи ещё — у меня всегда есть что-то новенькое. Или почти новенькое.",
      options: [{ label: "Уйти", next: null }],
    },
  },

  // ── Найм компаньонов: разговоры в гостинице ─────────────────────────────
  mira: {
    hire_mira: {
      text: "Мира сидит у камина, перебирая травы. «О, новый постоялец. Ты выглядишь так, будто не спал неделю.»",
      options: [
        { label: "Мне нужна твоя помощь. Сколько?", next: "hire_price", mood: "neutral" },
        { label: "Просто проходил мимо. Ты красиво поёшь?", next: "hire_song", mood: "good", effects: { affinity: 2 } },
        { label: "Что ты умеешь, кроме трав?", next: "hire_story", mood: "neutral" },
        { label: "Уйти", next: "hire_leave" },
      ],
    },
    hire_story: {
      text: "«Я лечу тех, кто возвращается из Башни. Тех, кто не возвращается, — поминаю. Работа как работа.»",
      options: [
        { label: "Почему ты этим занимаешься?", next: "hire_wounded" },
        { label: "Мне нужна такая помощь.", next: "hire_price" },
        { label: "Назад", next: "hire_mira" },
      ],
    },
    hire_wounded: {
      text: "«Когда-то я не успела. Один охотник. Он умер у меня на руках, а я искала нужный корень. Теперь ищу быстрее.»",
      options: [
        { label: "Это не твоя вина.", next: "hire_discount", mood: "good", effects: { affinity: 5, hireDiscount: 0.1 } },
        { label: "Ты просто не справилась.", next: "hire_angry", mood: "bad", effects: { affinity: -5 } },
        { label: "Назад", next: "hire_mira" },
      ],
    },
    hire_song: {
      text: "«Ты слышал? Это была моя колыбельная для раненых. Они говорят, она успокаивает. Но я пою не для всех.»",
      options: [
        { label: "Я бы хотел услышать её снова. Наняться к тебе.", next: "hire_price", mood: "good", effects: { affinity: 2 } },
        { label: "Спой ещё. Может, я усну.", next: "hire_discount", mood: "good", effects: { affinity: 5, hireDiscount: 0.1 } },
        { label: "Назад", next: "hire_mira" },
      ],
    },
    hire_discount: {
      text: "«Не льсти. Но ты слушаешь. Это редкость. Ладно — скидка. Немного.»",
      options: [
        { label: "Сколько теперь?", next: "hire_price" },
        { label: "Назад", next: "hire_mira" },
      ],
    },
    hire_price: {
      text: "«Мои услуги стоят 500 золотых плюс надбавка за твой уровень. Я не беру меньше. Но если ты будешь вежлив — возможно, я снижу цену.»",
      options: [
        { label: "Я согласен. Вот оплата.", next: "hired_mira", effects: { action: "hire", companionId: "mira" }, requires: { minGold: 500 } },
        { label: "500? Это грабёж!", next: "hire_angry", mood: "bad", effects: { affinity: -5 } },
        { label: "Мне нужно подумать.", next: "hire_mira" },
      ],
    },
    hire_angry: {
      text: "«Нет. Я передумала. Не хочу иметь дело с таким, как ты.»",
      options: [
        { label: "Уйти", next: "hire_refuse" },
      ],
    },
    hire_refuse: {
      text: "Не хочу иметь дело с таким, как ты. Уходи.",
      options: [{ label: "Уйти", next: null }],
    },
    hired_mira: {
      text: "«Хорошо. Теперь я с тобой. Постарайся не умереть в первый же день.»",
      options: [
        { label: "Постараюсь.", next: null },
        { label: "А если умру?", next: "hire_after" },
      ],
    },
    hire_after: {
      text: "«Тогда я приду и вытащу тебя. Умирать при мне — плохая привычка.»",
      options: [{ label: "Уйти", next: null }],
    },
    hire_leave: {
      text: "«Иди. И выспись. Это тоже лекарство.»",
      options: [{ label: "Уйти", next: null }],
    },
  },

  alva: {
    hire_alva: {
      text: "Альва стоит у окна, белые волосы ловят свет. «Ты пришёл за песней или за тишиной? Второе дороже.»",
      options: [
        { label: "За твоей помощью. Сколько?", next: "hire_price", mood: "neutral" },
        { label: "За песней.", next: "hire_song", mood: "good", effects: { affinity: 2 } },
        { label: "Что ты делаешь в гостинице?", next: "hire_story", mood: "neutral" },
        { label: "Уйти", next: "hire_leave" },
      ],
    },
    hire_story: {
      text: "«Пою для тех, кто не может уснуть. Иногда — для тех, кто не должен просыпаться. Не спрашивай.»",
      options: [
        { label: "Ты потеряла свой дом?", next: "hire_past" },
        { label: "Мне нужна твоя помощь.", next: "hire_price" },
        { label: "Назад", next: "hire_alva" },
      ],
    },
    hire_past: {
      text: "«Я пела в доме, которого больше нет. Теперь пою в гостинице. Публика изменилась. Аплодисменты — тоже.»",
      options: [
        { label: "Твоя песня всё ещё жива.", next: "hire_discount", mood: "good", effects: { affinity: 5, hireDiscount: 0.1 } },
        { label: "Значит, ты никто без своего дома.", next: "hire_angry", mood: "bad", effects: { affinity: -5 } },
        { label: "Назад", next: "hire_alva" },
      ],
    },
    hire_song: {
      text: "«Тогда слушай. ... Это была колыбельная. Для одного охотника. Он уснул. Навсегда. Я больше не пою её всем.»",
      options: [
        { label: "Я не буду просить снова. Наняться к тебе.", next: "hire_price", mood: "good", effects: { affinity: 2 } },
        { label: "Спой ещё. Я заплачу.", next: "hire_angry", mood: "bad", effects: { affinity: -5 } },
        { label: "Назад", next: "hire_alva" },
      ],
    },
    hire_discount: {
      text: "«Ты слышишь не только ноты. Это... приятно. Ладно, скидка.»",
      options: [
        { label: "Сколько теперь?", next: "hire_price" },
        { label: "Назад", next: "hire_alva" },
      ],
    },
    hire_price: {
      text: "«Мой голос стоит 500 золотых и ежедневной платы. Он не для всех. Но ты уже слушал — значит, почти свой.»",
      options: [
        { label: "Я согласен. Вот оплата.", next: "hired_alva", effects: { action: "hire", companionId: "alva" }, requires: { minGold: 500 } },
        { label: "Петь за такие деньги? Смешно.", next: "hire_angry", mood: "bad", effects: { affinity: -5 } },
        { label: "Мне нужно подумать.", next: "hire_alva" },
      ],
    },
    hire_angry: {
      text: "«Смешно? Тогда иди смеяться в другое место.»",
      options: [
        { label: "Уйти", next: "hire_refuse" },
      ],
    },
    hire_refuse: {
      text: "Не хочу иметь дело с таким, как ты. Уходи.",
      options: [{ label: "Уйти", next: null }],
    },
    hired_alva: {
      text: "«Хорошо. Я буду рядом. И не вздумай умереть, не дослушав.»",
      options: [
        { label: "Постараюсь.", next: null },
        { label: "Что я услышу?", next: "hire_after" },
      ],
    },
    hire_after: {
      text: "«То, что тебе нужно. Не то, что ты хочешь. Это разные песни.»",
      options: [{ label: "Уйти", next: null }],
    },
    hire_leave: {
      text: "«Иди. Тишина тоже иногда лечит.»",
      options: [{ label: "Уйти", next: null }],
    },
  },

  solveig: {
    hire_solveig: {
      text: "Сольвейг сидит на столе, свесив ноги. «Ну? Чего уставился? Нанимать пришёл или драться?»",
      options: [
        { label: "Нанимать. Сколько?", next: "hire_price", mood: "neutral" },
        { label: "Драться.", next: "hire_fight", mood: "good", effects: { affinity: 2 } },
        { label: "Почему ты здесь?", next: "hire_story", mood: "neutral" },
        { label: "Уйти", next: "hire_leave" },
      ],
    },
    hire_fight: {
      text: "«Ха! Мне нравится. Но драться будем после найма. Или вместо. Платить всё равно придётся.»",
      options: [
        { label: "Тогда нанимаю.", next: "hire_price", mood: "good", effects: { affinity: 2 } },
        { label: "Давай без найма, просто по морде.", next: "hire_angry", mood: "bad", effects: { affinity: -5 } },
        { label: "Назад", next: "hire_solveig" },
      ],
    },
    hire_story: {
      text: "«Пришла с севера. Там больше нет ничего, кроме ветра и мёртвых. Здесь хотя бы платят.»",
      options: [
        { label: "Ты скучаешь по дому?", next: "hire_scar" },
        { label: "Мне нужен боец.", next: "hire_price" },
        { label: "Назад", next: "hire_solveig" },
      ],
    },
    hire_scar: {
      text: "«Скучаю? По чему? По снегу, который заметает могилы? Нет. Я скучаю по тем, кто остался. Это другое.»",
      options: [
        { label: "Я понимаю.", next: "hire_discount", mood: "good", effects: { affinity: 5, hireDiscount: 0.1 } },
        { label: "Жалко тебя.", next: "hire_angry", mood: "bad", effects: { affinity: -5 } },
        { label: "Назад", next: "hire_solveig" },
      ],
    },
    hire_discount: {
      text: "«Не жалей. Жалость — для слабаков. Но ты не отвернулся. Ладно, скидка. Один раз.»",
      options: [
        { label: "Сколько теперь?", next: "hire_price" },
        { label: "Назад", next: "hire_solveig" },
      ],
    },
    hire_price: {
      text: "«500 золотых и ежедневная плата. Дёшево за такую, как я. И не торгуйся — я плохо торгуюсь. Кулаками.»",
      options: [
        { label: "Я согласен. Вот оплата.", next: "hired_solveig", effects: { action: "hire", companionId: "solveig" }, requires: { minGold: 500 } },
        { label: "500? За бабу с топором?", next: "hire_angry", mood: "bad", effects: { affinity: -5 } },
        { label: "Мне нужно подумать.", next: "hire_solveig" },
      ],
    },
    hire_angry: {
      text: "«Вот теперь точно не наймёшься.»",
      options: [
        { label: "Уйти", next: "hire_refuse" },
      ],
    },
    hire_refuse: {
      text: "Не хочу иметь дело с таким, как ты. Уходи.",
      options: [{ label: "Уйти", next: null }],
    },
    hired_solveig: {
      text: "«Отлично. Теперь я твой щит и твой меч. В основном меч. Постарайся не путать.»",
      options: [
        { label: "Постараюсь.", next: null },
        { label: "А щит?", next: "hire_after" },
      ],
    },
    hire_after: {
      text: "«Щит — это когда я стою между тобой и чем-то большим. Не благодари. Плати.»",
      options: [{ label: "Уйти", next: null }],
    },
    hire_leave: {
      text: "«Иди. И не забудь: если встретишь что-то большое — зови. Я не люблю пропускать веселье.»",
      options: [{ label: "Уйти", next: null }],
    },
  },
};

// ── Фракции и репутация (Этап 1) ───────────────────────────────────────────
// Каждый NPC с лавкой представляет свою фракцию. Ежедневные заказы
// (weeklyQuests) повышают репутацию фракции, что даёт скидку в её лавке.
const FACTIONS = [
  { id: "smiths", name: "Гильдия кузнецов", npc: "ron", icon: "⚒️" },
  { id: "alchemists", name: "Цех алхимиков", npc: "elain", icon: "⚗️" },
  { id: "jewelers", name: "Ювелирный дом", npc: "elize", icon: "💍" },
  // Гильдия Охотников: контракты в Зале Охотников. У фракции нет лавки
  // (npc: null), репутация растёт за сданные контракты на доске объявлений.
  { id: "hunters", name: "Гильдия Охотников", npc: null, icon: "🏹" },
];
const FACTION_MAP = Object.fromEntries(FACTIONS.map((f) => [f.id, f]));
const FACTION_TIERS = [
  { min: 0,  name: "Незнакомец", discount: 0 },
  { min: 5,  name: "Знакомый",   discount: 0.05 },
  { min: 10, name: "Уважаемый",  discount: 0.10 },
  { min: 20, name: "Почтенный",  discount: 0.15 },
  { min: 35, name: "Легенда",    discount: 0.20 },
];
// npc: null (Охотники без лавки) не попадает в карту — иначе
// Object.fromEntries создал бы ключ "null".
const FACTION_BY_NPC = Object.fromEntries(
  FACTIONS.filter((f) => f.npc).map((f) => [f.npc, f.id])
);
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
  { id: "slashing", name: "Тигр", desc: "Аналог рубящего стиля." },
  { id: "piercing", name: "Журавль", desc: "Аналог колющего стиля." },
  { id: "bludgeoning", name: "Медведь", desc: "Аналог дробящего стиля." },
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
  // Активные навыки (умения): учатся как таланты, применяются в бою
  // через модалку «Приёмы». Списывают ману (и кураж), имеют откат в ходах.
  {
    id: "sk_berserk", branch: "war", name: "Ярость берсерка", active: true, maxRank: 1, stat: null,
    desc: "Активный навык: 10 маны и 3 куража — неудержимый удар силой ×1.8, который враг не может заблокировать. Откат: 3 хода.",
    skill: { name: "Ярость берсерка", icon: "🪓", manaCost: 10, rageCost: 3, cooldown: 3, effect: "fury" },
  },
  {
    id: "sk_shield", branch: "def", name: "Щит веры", active: true, maxRank: 1, stat: null,
    desc: "Активный навык: 15 маны — лечение на 30% максимума HP и иммунитет к яду до конца боя. Снимает яд. Откат: 4 хода.",
    skill: { name: "Щит веры", icon: "🛡️", manaCost: 15, rageCost: 0, cooldown: 4, effect: "faith" },
  },
  {
    id: "sk_precise", branch: "util", name: "Точный выстрел", active: true, maxRank: 1, stat: null,
    desc: "Активный навык: 12 маны — выверенный удар точно в уязвимое место: гарантированный крит, враг не успевает закрыться. Откат: 3 хода.",
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
const ACH_GOBLIN_IDS  = ["goblin_scout", "goblin_chief", "hobgoblin", "bugbear"];
const ACH_KOBOLD_IDS  = ["kobold_servant", "kobold_miner", "kobold_overseer"];
const ACH_UNDEAD_IDS  = ["skeleton_warrior", "unquiet_ghost", "crypt_ghoul", "dark_knight"];
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

// ── Уязвимости мобов (глобальное обновление боя) ────────────────────────────
// weakTo — список стилей удара, к которым моб восприимчив. Такой удар множит
// финальный урон на WEAKNESS_DAMAGE_MULT. Пустой weakTo — урон как обычно.
const WEAKNESS_DAMAGE_MULT = 1.25;

// Примеры раскладки: скелеты — дробящий, слизни/духи — рубящий,
// элементалы (бесы) — колющий. У остальных — свои честные слабости.
const MOB_WEAKNESS = {
  goblin_scout: ["piercing"],
  hobgoblin: ["slashing"],
  bugbear: ["bludgeoning"],
  goblin_chief: ["slashing"],

  kobold_servant: ["slashing"],
  kobold_miner: ["bludgeoning"],
  kobold_overseer: ["slashing"],
  dragonborn: ["bludgeoning"],

  skeleton_warrior: ["bludgeoning"],
  unquiet_ghost: ["slashing"],
  crypt_ghoul: ["bludgeoning"],
  dark_knight: ["bludgeoning"],

  orc_raider: ["piercing"],
  orc_shaman: ["piercing"],
  ogre_brute: ["slashing"],
  orc_warlord: ["slashing"],

  fire_imp: ["piercing"],
  hell_hound: ["slashing"],
  horned_devil: ["bludgeoning"],
  demon_lord: ["bludgeoning"],
};

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

// Ранги отношений. bonus — прибавка к профильному баффу компаньона,
// wageMult — множитель ежедневного жалования.
const COMPANION_AFFINITY_LEVELS = [
  { min: 0, name: "Незнакомка", bonus: 0, wageMult: 1.0 },
  { min: 100, name: "Подруга", bonus: 0.1, wageMult: 0.9 },
  { min: 200, name: "Близкая", bonus: 0.2, wageMult: 0.7 },
  { min: 300, name: "Родная душа", bonus: 0.35, wageMult: 0.5 },
];

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
    price: COMPANION_PRICE, 
    baseHireCost: 500,
    dailyWage: 50,
    battleAction: "heal",
    hireDialog: "hire_mira",
    affinityLevels: COMPANION_AFFINITY_LEVELS,
    src: "assets/portraits/mira.webp", 
    desc: "«Твоему телу нужен покой, а твоему упрямству — моя рука. Ложись и закрой глаза, {gender_term:милый|милая}.» Высокая и статная, Мира излучает спокойную, зрелую красоту. В ее изумрудных глазах читается безграничная теплота, но ее забота не терпит возражений. Сон в ее объятиях — это не просто отдых, это глубокое, живительное восстановление. Ее присутствие заставляет забытые раны затягиваться, а измученное тело — обретать новую прочность." 
  },
  { 
    id: "alva", 
    name: "Альва", 
    role: "Певица", 
    icon: "🎼", 
    price: COMPANION_PRICE, 
    baseHireCost: 500,
    dailyWage: 50,
    battleAction: "stun",
    hireDialog: "hire_alva",
    affinityLevels: COMPANION_AFFINITY_LEVELS,
    src: "assets/portraits/alva.webp", 
    desc: "«Твои мысли слишком шумны, а движения полны суеты. Позволь мне остудить твой разум... и зажечь твой клинок.» Роскошные белые волосы и пронзительный взгляд синих глаз делают Альву похожей на неприступную зимнюю богиню. Ее острые, аристократичные черты лица и ледяная сдержанность, казалось, делают ее неприступной. Но за этой маской скрывается удивительная, почти хрупкая нежность, которую она дарит лишь избранным. Ночь в ее объятиях дарует не только глубокий покой, но и обостряет чувства, превращая каждое твое движение в смертоносный, выверенный танец." 
  },
  { 
    id: "solveig", 
    name: "Сольвейг", 
    role: "Наёмница", 
    icon: "🗡️", 
    price: COMPANION_PRICE, 
    baseHireCost: 500,
    dailyWage: 50,
    battleAction: "strike",
    hireDialog: "hire_solveig",
    affinityLevels: COMPANION_AFFINITY_LEVELS,
    src: "assets/portraits/solveig.webp", 
    desc: "«Ты думаешь, что устал? Ха! Тогда я покажу тебе, что значит настоящая усталость. А ну вставай, слабак!» Молодая, дикая и неудержимая, Сольвейг похожа на северную бурю, заключенную в человеческий облик. Две пышные золотые косы, пронзительные зеленые глаза и едва заметные родовые татуировки, словно обжигающие ее бледную кожу. Она не знает нежности в привычном понимании — ее ласка это вызов, ее объятия это спарринг. Ночь с ней не даст покоя, но зато пробудит в тебе зверя. Проснувшись рядом с Сольвейг, ты чувствуешь, что твои мышцы гудят от силы, а клинок просится в бой." 
  }
];

const COMPANION_MAP = Object.fromEntries(COMPANIONS.map((c) => [c.id, c]));

// ── Реакции компаньонов (Блок 3) ───────────────────────────────────────────
// Ключи — типы событий. explore — запасной вариант для процедурных событий
// без type. Реплика выбирается детерминированно по id события.
const COMPANION_REACTIONS = {
  mira: {
    corpse: [
      "Не оставляй его без камня. Даже в Башне мёртвые заслуживают тени.",
      "Смотри не на кровь, а на руки. Они уже не боятся.",
    ],
    chest: [
      "Бери только нужное. Лишнее тянет вниз, как камень на шее.",
      "Чужое золото пахнет тревогой. Я бы проверила крышку ещё раз.",
    ],
    altar: [
      "Здесь пахнет старыми молитвами. Не насмехайся — они ещё слышат.",
      "Тише. Дай камню вспомнить, что он был святым.",
    ],
    beast: [
      "Тварь ранена. Добей быстро — милосердие тоже работа.",
      "Не подходи с открытой стороны. У зверя хватит сил на последний рывок.",
    ],
    hunter: [
      "Охотник жив. Значит, ещё есть кого вытаскивать.",
      "У него взгляд тех, кто слишком долго ходил один. Помоги, если можешь.",
    ],
    fight_start: [
      "Дыши ровно. Я рядом, и раны твои — мои.",
      "Не геройствуй. Просто вернись ко мне целым.",
    ],
    victory: [
      "Тише. Победа не отменяет усталости.",
      "Дай руку. Раны затянутся, если не мешать.",
    ],
    defeat: [
      "Нет. Вставай. Слышишь? Я не позволю тебе остаться здесь.",
      "Тьма не заберёт тебя. Дыши. Ещё раз.",
    ],
    explore: [
      "Чувствуешь? Воздух стал тяжелее. Держись ближе ко мне.",
      "Я соберу травы, а ты смотри по сторонам. Так надёжнее.",
    ],
  },
  alva: {
    corpse: [
      "Его песня оборвалась на середине. Слышишь, как тихо стало?",
      "Смерть — это пауза. Не задерживайся в ней.",
    ],
    chest: [
      "Сундук звенит фальшиво. Красивые вещи часто врут.",
      "Открывай. Но помни: цена иногда спрятана под крышкой.",
    ],
    altar: [
      "Камень поёт, если слушать долго. Не перебивай его.",
      "Здесь молились те, кто уже не споёт. Оставь им тишину.",
    ],
    beast: [
      "У зверя тоже есть ритм. Сбей его — и победа твоя.",
      "Не смотри в глаза. Смотри в лапы — там его намерение.",
    ],
    hunter: [
      "Он держится за жизнь, как за последнюю ноту. Не фальшивь.",
      "В его взгляде — зима. Подай руку, пока не замёрз.",
    ],
    fight_start: [
      "Задай ритм первым. Пусть сталь поёт твоим голосом.",
      "Страх — это фальшивая нота. Не дай ей прозвучать.",
    ],
    victory: [
      "Тишина после победы — лучшая из песен.",
      "Ты держишь удар. Теперь научись держать дыхание.",
    ],
    defeat: [
      "Нет. Не сейчас. Песня ещё не допета.",
      "Вставай. Я не буду петь над твоей могилой.",
    ],
    explore: [
      "Слушай. Башня дышит, и её дыхание сбивается к глубине.",
      "Здесь эхо отвечает не сразу. Значит, впереди пустота.",
    ],
  },
  solveig: {
    corpse: [
      "Ха! Этот уже не встанет. Обыщи и идём.",
      "Смотри под ноги. Мёртвые любят хватать за сапоги.",
    ],
    chest: [
      "Сундук! Наконец-то что-то, кроме камней и паутины.",
      "Открывай быстрее, пока я не открыла его сама.",
    ],
    altar: [
      "Камни, свечи, кости... Я бы тут не задерживалась.",
      "Если оно зашевелится — бей первым. Я прикрою.",
    ],
    beast: [
      "Зверь! Вот это честная драка, а не подлые ловушки.",
      "Не убивай сразу. Дай ему шанс показать клыки.",
    ],
    hunter: [
      "Охотник? Живой? Значит, ещё не всё потеряно.",
      "Держись, стрелок. Сейчас вытащим тебя из этой дыры.",
    ],
    fight_start: [
      "Наконец-то! Покажи им, на что ты годишься!",
      "Не сдерживайся. Бей так, чтобы запомнили.",
    ],
    victory: [
      "Ха! Вот это был бой. Ещё один такой — и я поверю в тебя.",
      "Хорошо бьёшь. Теперь не умри от первой же царапины.",
    ],
    defeat: [
      "Вставай, слабак! Я не для того шла сюда, чтобы тащить тебя обратно.",
      "Нет-нет-нет. Слышишь? Вставай. Приказ.",
    ],
    explore: [
      "Не топчись. Или идём, или я иду одна.",
      "Чуешь? Впереди кто-то дышит. Наконец-то веселье.",
    ],
  },
};


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
  { id: "heavy_lifting", attr: "str", stat: "str", name: "Тяжёлые камни", icon: "🏋️", cap: 10, risk: 0.3, desc: "Камни, мешки с песком и старые наковальни. После десятого подхода руки перестают дрожать — или отказывают.", effect: "+1 к силе за тренировку" },
];

const TRAINING_MAP = Object.fromEntries(TRAININGS.map((t) => [t.id, t]));

// ── Доска объявлений Зала Охотников (контракты) ─────────────────────────────
// Шаблоны предложений. state.js раз в неделю разворачивает их в записи
// state.weekQuests.list — единого списка для Доски объявлений и Журнала
// заданий. Прогресс растёт в checkQuestProgress(mobId), награда — золото +
// репутация Гильдии Охотников.
// type: "weekly" — большой «Недельный заказ Ивана» (по одному на этаж),
// остальное — контракты на охоту вида «Истребить 5 [имя моба] на [этаж]».
const HUNT_CONTRACTS = [
  // Недельные заказы Ивана — по шаблону на каждый этаж.
  { id: "ivan_weekly_f1", type: "weekly", mobId: "goblin_scout", floorId: 1, target: 10, gold: 420, xp: 280, rep: 2, desc: "Капитан собирает трофейные счёты: десять гостей Тёмного Леса к концу недели." },
  { id: "ivan_weekly_f2", type: "weekly", mobId: "kobold_miner", floorId: 2, target: 10, gold: 620, xp: 420, rep: 2, desc: "Кобольды копают слишком близко к караванным путям. Ивану это не нравится." },
  { id: "ivan_weekly_f3", type: "weekly", mobId: "skeleton_warrior", floorId: 3, target: 10, gold: 860, xp: 560, rep: 2, desc: "Из склепа доносится стук костей. Капитан платит за тишину." },
  { id: "ivan_weekly_f4", type: "weekly", mobId: "orc_raider", floorId: 4, target: 10, gold: 1150, xp: 740, rep: 2, desc: "Орочьи набеги участились. Заплатят за каждый клинок, что не вернётся в лагерь." },
  { id: "ivan_weekly_f5", type: "weekly", mobId: "fire_imp", floorId: 5, target: 10, gold: 1500, xp: 980, rep: 2, desc: "Бесы жгут леса на подходах к Башне. Гильдия объявила облаву." },

  // Контракты на охоту — на доске висят по два.
  { id: "hc_hobgoblin", type: "hunt", mobId: "hobgoblin", floorId: 1, target: 5, gold: 180, xp: 120, rep: 1, desc: "Хобгоблины топчут покосы и пугают дровосеков." },
  { id: "hc_bugbear", type: "hunt", mobId: "bugbear", floorId: 1, target: 5, gold: 220, xp: 160, rep: 1, desc: "Багбиры ломают изгороди по краю Тёмного Леса." },
  { id: "hc_kobold_servant", type: "hunt", mobId: "kobold_servant", floorId: 2, target: 5, gold: 280, xp: 190, rep: 1, desc: "Кобольдские слуги таскают руду наверх и путаются под ногами у караванов." },
  { id: "hc_kobold_overseer", type: "hunt", mobId: "kobold_overseer", floorId: 2, target: 5, gold: 300, xp: 210, rep: 1, desc: "Надсмотрщики сгоняют кобольдов в шахты и не дают им разбежаться." },
  { id: "hc_unquiet_ghost", type: "hunt", mobId: "unquiet_ghost", floorId: 3, target: 5, gold: 380, xp: 250, rep: 1, desc: "Призраки шепчут путникам странные вещи." },
  { id: "hc_crypt_ghoul", type: "hunt", mobId: "crypt_ghoul", floorId: 3, target: 5, gold: 400, xp: 270, rep: 1, desc: "Упыри растащили половину старого кладбища." },
  { id: "hc_orc_shaman", type: "hunt", mobId: "orc_shaman", floorId: 4, target: 5, gold: 460, xp: 310, rep: 1, desc: "Орочьи шаманы варят у костров что-то зловещее." },
  { id: "hc_ogre_brute", type: "hunt", mobId: "ogre_brute", floorId: 4, target: 5, gold: 520, xp: 350, rep: 1, desc: "Огр выворачивает валуны прямо на тракте." },
  { id: "hc_hell_hound", type: "hunt", mobId: "hell_hound", floorId: 5, target: 5, gold: 600, xp: 400, rep: 1, desc: "Гончие псарни Бездны вырвались на прогалины." },
  { id: "hc_horned_devil", type: "hunt", mobId: "horned_devil", floorId: 5, target: 5, gold: 680, xp: 450, rep: 1, desc: "Рогатый дьявол вершит свой суд на пятом ярусе." },
];

// ── Советы Тимми, молодого охотника ────────────────────────────────────────
// minFloor — минимальный этаж, с которого совет становится актуальным.
// ui.js выбирает случайный совет из доступных (minFloor <= state.maxFloor).
const HUNTER_TIPS = [
  { minFloor: 1, text: "Советую бить гоблинов в живот, у них там нет брони." },
  { minFloor: 1, text: "Капюшон и лохмотья — не броня. Багбир ломает их одним щелчком." },
  { minFloor: 1, text: "Не путай редкость с ценностью: ржавый нож лутается часто, но стоит гроши." },
  { minFloor: 1, text: "Мы здесь не для славы. Мы здесь, чтобы город спал спокойно." },
  { minFloor: 1, text: "Башня умеет ждать. Если этаж кажется пустым — ты просто не видишь, что там." },
  { minFloor: 1, text: "Тимми и Иван? Да, у них прошлое. Но сейчас они нужны друг другу. Как и все мы." },
  { minFloor: 2, text: "Кобольды ставят блоки, бери приёмы на пробитие." },
  { minFloor: 2, text: "Кобольд-надсмотрщик держит два блока сразу — бей в живот, там кольчуга не спасёт." },
  { minFloor: 4, text: "Мифрил падает с огров в Лагере Орков — не пропусти жилу." },
  { minFloor: 3, text: "Скелеты ничего не чувствуют, но кости хрупкие — руби по ногам." },
  { minFloor: 4, text: "Огр открыт, пока замахивается. Один его удар — половина твоего здоровья." },
  { minFloor: 5, text: "Дьяволы целятся в голову и в грудь. Держи блок там, и половина урона уйдёт в сталь." },
  { minFloor: 1, text: "Перед боем проверь, чем бьёт враг. Если у него топор — не подставляй плечо. Если копьё — не стой по прямой." },
  { minFloor: 2, text: "Не трать зелья на царапины. Лечись после боя, а в бою береги одно — на случай, когда земля уйдёт из-под ног." },
  { minFloor: 3, text: "Призрак бьёт сквозь броню. Против него важнее мана и голова, чем сталь на груди." },
  { minFloor: 4, text: "С орками не меняйся ударами. Бей, отходи, жди. У них больше силы, чем терпения." },
  { minFloor: 5, text: "Демонический план меняется, пока ты моргаешь. Запоминай дорогу назад, даже если идёшь вперёд." },
  { minFloor: 2, text: "Лут не бери весь. Если сумка трещит — ты не богаче, ты медленнее. А медленных Башня любит." },
  { minFloor: 3, text: "Редкий лут пахнет не золотом, а ошибкой. Если что-то лежит слишком удобно — сначала ткни в него копьём." },
];

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
  leather_armor: { id: "leather_armor", name: "Кожаный доспех", slot: "chest", icon: "🥋", def: 6, hp: 60, armorType: "leather", price: 70, shopTier: 1, desc: "Пахнет дёгтем и старым потом." },
  chain: { id: "chain", name: "Кольчуга", slot: "chest", icon: "🥋", def: 10, hp: 90, armorType: "chain", price: 210, shopTier: 2, desc: "Тысяча колец, ни одного лишнего." },
  scale: { id: "scale", name: "Чешуйчатый доспех", slot: "chest", icon: "🥋", def: 12, hp: 110, armorType: "chain", price: 300, shopTier: 2, desc: "Чешуя снята с чего-то большого." },
  plate: { id: "plate", name: "Латный доспех", slot: "chest", icon: "🛡️", def: 16, hp: 120, armorType: "plate", price: 600, shopTier: 3, desc: "В нём слышно только собственное дыхание." },

  wood_shield: { id: "wood_shield", name: "Деревянный щит", slot: "offhand", icon: "🛡️", def: 2, block: 1, price: 55, shopTier: 1, desc: "Третья зона блока." },
  kite_shield: { id: "kite_shield", name: "Стальной каплевидный щит", slot: "offhand", icon: "🛡️", def: 8, block: 1, price: 200, shopTier: 2, desc: "Прикрывает корпус целиком." },
  tower_shield: { id: "tower_shield", name: "Укрепленный башенный щит", slot: "offhand", icon: "🛡️", def: 10, block: 1, dodge: -2, price: 300, shopTier: 2, desc: "Стена, которую можно носить. В уклоне почти не помогает." },
  parrying_dagger: { id: "parrying_dagger", name: "Кинжал парирования", slot: "offhand", icon: "🗡️", atk: 12, crit: 2, weaponType: "sword", handed: "1h", damage: { slashing: 3, piercing: 12, bludgeoning: 0 }, price: 160, shopTier: 2, desc: "Вторая рука тоже умеет ранить." },

  worn_hood: gearItem("worn_hood", "Поношенный капюшон", "head", "🧢", 0, 0, { def: 0, hp: 0 }, "Ткань, которую не жалко потерять."),
  patched_pants: gearItem("patched_pants", "Штаны в заплатках", "legs", "👖", 0, 0, { def: 0, hp: 0 }, "Заплатка на заплатке."),
  worn_boots: gearItem("worn_boots", "Стоптанные сапоги", "feet", "🥾", 0, 0, { def: 0, hp: 0 }, "Скрипят на каждом шагу."),
  head_cloth: gearItem("head_cloth", "Тканевый капюшон", "head", "🧢", 25, 1, { def: 2, hp: 15 }, "Плотная ткань лучше, чем ничего."),
  head_iron: gearItem("head_iron", "Железный шлем", "head", "assets/icons/head_iron.webp", 110, 2, { def: 6, hp: 40 }, "Простой, тяжёлый, надёжный."),
  head_crystal: gearItem("head_crystal", "Кристальный шлем", "head", "💠", 320, 3, { def: 8, hp: 60 }, "Грани ловят свет и чужой удар."),
  shoulder_leather: gearItem("shoulder_leather", "Кожаные наплечники", "shoulder", "🛡️", 25, 1, { def: 2, hp: 15 }, "Ремни и куски кожи."),
  shoulder_iron: gearItem("shoulder_iron", "Железные наплечники", "shoulder", "assets/icons/shoulder_iron.webp", 100, 2, { def: 4, hp: 40 }, "Держат удар сверху."),
  shoulder_crystal: gearItem("shoulder_crystal", "Кристальные наплечники", "shoulder", "💠", 300, 3, { def: 6, hp: 50 }, "Осколки срослись в броню."),
  back_cloak: gearItem("back_cloak", "Рваный плащ", "back", "🧣", 20, 1, { def: 0, hp: 15 }, "Холодный ветер всё равно пробирается."),
  back_guard: gearItem("back_guard", "Плащ караульного", "back", "🧣", 90, 2, { def: 2, hp: 30 }, "Плотная ткань с чужого плеча."),
  back_crystal: gearItem("back_crystal", "Кристальный плащ", "back", "💠", 280, 3, { def: 4, hp: 40 }, "Ткань, будто покрытая инеем."),
  wrist_leather: gearItem("wrist_leather", "Кожаные наручи", "wrist", "🧤", 20, 1, { def: 2, hp: 10 }, "Защищают от случайного пореза."),
  wrist_chain: gearItem("wrist_chain", "Кольчужные наручи", "wrist", "🧤", 85, 2, { def: 4, hp: 25 }, "Мелкие кольца, плотная посадка."),
  wrist_crystal: gearItem("wrist_crystal", "Кристальные наручи", "wrist", "💠", 260, 3, { def: 4, hp: 30 }, "Холодят руку даже через ткань."),
  hands_gloves: gearItem("hands_gloves", "Рабочие перчатки", "hands", "🧤", 20, 1, { def: 2, hp: 10 }, "Ладони уже не горят."),
  hands_iron: gearItem("hands_iron", "Железные рукавицы", "hands", "assets/icons/hands_iron.webp", 85, 2, { def: 4, hp: 25 }, "Кулак становится доводом."),
  hands_crystal: gearItem("hands_crystal", "Кристальные рукавицы", "hands", "💠", 260, 3, { def: 2, hp: 6 }, "Пальцы двигаются, кристалл звенит."),
  waist_rope: gearItem("waist_rope", "Верёвочный пояс", "waist", "🎗️", 20, 1, { def: 2, hp: 15 }, "Держит штаны и надежду."),
  waist_plate: gearItem("waist_plate", "Пояс из пластин", "waist", "assets/icons/waist_plate.webp", 90, 2, { def: 4, hp: 30 }, "Пластины стучат при ходьбе."),
  waist_crystal: gearItem("waist_crystal", "Кристальный пояс", "waist", "💠", 270, 3, { def: 4, hp: 40 }, "Тяжёлый, но держит спину."),
  legs_leather: gearItem("legs_leather", "Кожаные штаны", "legs", "👖", 25, 1, { def: 2, hp: 20 }, "Мягкие, зато не рвутся сразу."),
  legs_chain: gearItem("legs_chain", "Кольчужные штаны", "legs", "👖", 110, 2, { def: 6, hp: 40 }, "Тяжело шагать, легко стоять."),
  legs_crystal: gearItem("legs_crystal", "Кристальные поножи", "legs", "💠", 320, 3, { def: 8, hp: 60 }, "Каждый шаг отдаётся звоном."),
  feet_leather: gearItem("feet_leather", "Кожаные сапоги", "feet", "🥾", 25, 1, { def: 2, hp: 15 }, "Подошва ещё держится."),
  feet_iron: gearItem("feet_iron", "Железные сапоги", "feet", "assets/icons/feet_iron.webp", 90, 2, { def: 4, hp: 30 }, "Гулкий шаг по каменным плитам."),
  feet_crystal: gearItem("feet_crystal", "Кристальные сапоги", "feet", "💠", 270, 3, { def: 6, hp: 40 }, "Ступня вмерзает в камень."),

  neck_bone: gearItem("neck_bone", "Грубый амулет", "neck", "📿", 30, 1, { hp: 25 }, "Грубый кусок малахита, наспех привязанный к ремешку."),
  neck_guard: gearItem("neck_guard", "Медальон караульного", "neck", "📿", 110, 2, { hp: 40, crit: 1 }, "Знак поста, который давно не сменяли."),
  neck_crystal: gearItem("neck_crystal", "Кристальный подвесок", "neck", "💠", 330, 3, { hp: 60, crit: 2 }, "Внутри что-то медленно пульсирует."),
  ring_copper: gearItem("ring_copper", "Медное кольцо", "ring", "💍", 35, 1, { crit: 1 }, "Тусклое, но своё."),
  ring_silver: gearItem("ring_silver", "Кольцо из холодного серебра", "ring", "💍", 120, 2, { crit: 2, hp: 20 }, "Тяжелое кольцо, выкованное из холодного серебра. Охраняет владельца от злых чар."),
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

  // ── Щиты (offhand): активная защита, armorType не нужен — зоны тела они не закрывают ──
  iron_shield: { id: "iron_shield", name: "Железный щит", slot: "offhand", icon: "assets/icons/iron_shield.webp", def: 6, block: 1, price: 120, shopTier: 1, desc: "Тяжёлый каплевидный щит из железа. Надёжно прикрывает корпус от ударов." },

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
  riveted_chain: gearItem("riveted_chain", "Клёпаная кольчуга", "chest", "🥋", 330, 3, { def: 13, hp: 100, armorType: "chain" }, "Каждое кольцо расклёпано вручную."),
  knight_plate: gearItem("knight_plate", "Полный латный доспех", "chest", "🛡️", 620, 3, { def: 18, hp: 140, dodge: -6, armorType: "plate" }, "Вес гасит чужие удары и вашу прыть."),
  hood_mage: gearItem("hood_mage", "Капюшон чародея", "head", "🧢", 60, 2, { def: 2, hp: 15, mana: 20, armorType: "cloth" }, "Тесьма вдоль шва отводит лишние мысли."),
  scout_gloves: gearItem("scout_gloves", "Разведческие перчатки", "hands", "🧤", 45, 1, { def: 2, hp: 10, dodge: 2, armorType: "leather" }, "Мягкая кожа, усиленная на ладонях."),
  scout_boots: gearItem("scout_boots", "Сапоги разведчика", "feet", "🥾", 50, 1, { def: 2, hp: 15, dodge: 2, armorType: "leather" }, "Подошва гасит звук собственных шагов."),
  plate_gorget: gearItem("plate_gorget", "Латный воротник", "neck", "📿", 140, 2, { def: 4, hp: 25, armorType: "plate" }, "Кольцо стали, прикрывающее горло."),

  // ── Броня тир 1 (Железо) ──
  student_robe: gearItem("student_robe", "Ученическая роба", "chest", "🧥", 50, 1, { def: 2, hp: 10, mana: 10, armorType: "cloth" }, "Роба ученика алхимика — ткань теперь пахнет травами."),
  rust_chain: gearItem("rust_chain", "Ржавая кольчуга", "chest", "🥋", 120, 1, { def: 8, hp: 30, armorType: "chain" }, "Кольца держат, пока не смотрят слишком пристально."),
  iron_chainmail: { id: "iron_chainmail", name: "Железная кольчуга", slot: "chest", armorType: "chain", def: 9, hp: 80, price: 140, shopTier: 1, icon: "🥋", desc: "Плотное плетение железных колец. Хорошо держит режущие удары." },
  dented_plate: gearItem("dented_plate", "Мятые латы", "chest", "assets/icons/dented_plate.webp", 150, 1, { def: 12, hp: 40, dodge: -5, armorType: "plate" }, "В наследство от чьей-то глупости. Но сталь есть сталь."),

  // ── Тир 1: полные комплекты брони (ткань / кожа / кольчуга / латы) ──
  shoulder_cloth: gearItem("shoulder_cloth", "Тканевые накидки", "shoulder", "🧣", 18, 1, { def: 1, hp: 10, armorType: "cloth" }, "Несколько слоёв плотной ткани на плечах."),
  wrist_cloth: gearItem("wrist_cloth", "Тканевые обмотки", "wrist", "🧤", 15, 1, { def: 1, hp: 10, armorType: "cloth" }, "Плотно стянутая ткань вместо наручей."),
  hands_cloth: gearItem("hands_cloth", "Тканевые перчатки", "hands", "🧤", 15, 1, { def: 1, hp: 10, armorType: "cloth" }, "Тонкие, зато руки не мёрзнут."),
  legs_cloth: gearItem("legs_cloth", "Тканевые штаны", "legs", "👖", 20, 1, { def: 1, hp: 10, armorType: "cloth" }, "Простая материя, подшитая у колен."),
  feet_cloth: gearItem("feet_cloth", "Тканевые тапочки", "feet", "🩴", 15, 1, { def: 1, hp: 10, armorType: "cloth" }, "Мягко ступают по каменным плитам."),

  head_leather: gearItem("head_leather", "Кожаный капюшон", "head", "🧢", 35, 1, { def: 2, hp: 15, armorType: "leather" }, "Кожа, пахнущая дёгтем, прикрывает голову и шею."),
  waist_leather: gearItem("waist_leather", "Кожаный ремень", "waist", "🎗️", 30, 1, { def: 2, hp: 15, armorType: "leather" }, "Широкий ремень с железной пряжкой."),

  head_chain: gearItem("head_chain", "Кольчужный капюшон", "head", "⛑️", 90, 1, { def: 4, hp: 25, armorType: "chain" }, "Кольца прикрывают шею и затылок."),
  shoulder_chain: gearItem("shoulder_chain", "Кольчужные наплечники", "shoulder", "🛡️", 95, 1, { def: 4, hp: 25, armorType: "chain" }, "Плечи в железных кольцах."),
  hands_chain: gearItem("hands_chain", "Кольчужные рукавицы", "hands", "🧤", 85, 1, { def: 3, hp: 20, armorType: "chain" }, "Пальцы гнутся, удары держат."),
  waist_chain: gearItem("waist_chain", "Кольчужный пояс", "waist", "🎗️", 80, 1, { def: 3, hp: 20, armorType: "chain" }, "Кольца свисают до бёдер."),
  feet_chain: gearItem("feet_chain", "Кольчужные сапоги", "feet", "🥾", 100, 1, { def: 4, hp: 25, armorType: "chain" }, "Шаг тяжёлый, зато голень закрыта."),

  wrist_iron: gearItem("wrist_iron", "Железные наручи", "wrist", "assets/icons/wrist_iron.webp", 160, 1, { def: 5, hp: 30, armorType: "plate" }, "Железо на предплечье гасит удар."),
  legs_iron: gearItem("legs_iron", "Железные поножи", "legs", "assets/icons/legs_iron.webp", 190, 1, { def: 6, hp: 40, armorType: "plate" }, "Пластины на бёдрах и голенях."),

  // ── Броня тир 2 (Сталь) ──
  dense_cloth: gearItem("dense_cloth", "Плотная ткань", "chest", "🧥", 150, 2, { def: 4, hp: 20, mana: 20, armorType: "cloth" }, "Слои плотной ткани, между которыми скрывают браслеты ткача."),
  steel_chainmail: { id: "steel_chainmail", name: "Стальная кольчуга", slot: "chest", armorType: "chain", def: 14, hp: 110, price: 280, shopTier: 2, icon: "🥋", desc: "Тяжёлая, но надёжная броня, способная остановить даже меч." },
  steel_plate: gearItem("steel_plate", "Стальные латы", "chest", "🛡️", 400, 2, { def: 20, hp: 80, dodge: -10, armorType: "plate" }, "Полный машинный вес стали; уклониться — долгая история."),

  hp_small: { id: "hp_small", name: "Малое зелье лечения", slot: "potion", icon: "🧪", type: "potion", effect: "hp", amount: 60, price: 20, shopTier: 1, desc: "Восстанавливает 60 HP." },
  hp_big:   { id: "hp_big",   name: "Большое зелье лечения", slot: "potion", icon: "⚗️", type: "potion", effect: "hp", amount: 120, price: 45, shopTier: 1, desc: "Восстанавливает 120 HP." },
  mana_small: { id: "mana_small", name: "Зелье маны", slot: "potion", icon: "🔷", type: "potion", effect: "mana", amount: 20, price: 20, shopTier: 1, desc: "Восстанавливает 20 маны." },
  smoke_bomb: { id: "smoke_bomb", name: "Дымовая бомба", icon: "💨", type: "combat", effect: "smoke", price: 30, desc: "Враг пропускает следующий удар.", slot: "potion" },
  fire_flask: { id: "fire_flask", name: "Греческий огонь", icon: "🔥", type: "combat", effect: "fire", damage: 20, price: 40, desc: "Наносит 20 урона, игнорируя броню.", slot: "potion" },
  poison_vial: { id: "poison_vial", name: "Флакон с ядом", icon: "🧪", type: "combat", effect: "poison", damage: 5, turns: 3, price: 35, desc: "Наносит 5 урона в течение 3 ходов.", slot: "potion", shopTier: 1 },
// === ITEMS: Холодное железо (этаж 2) ===
  cold_iron_sword: { id: "cold_iron_sword", name: "Меч из холодного железа", slot: "mainhand", icon: "🗡️", atk: 30, crit: 4, dodge: 2, weaponType: "sword", handed: "1h", damage: { slashing: 18, piercing: 12, bludgeoning: 0 }, price: 130, shopTier: 2, desc: "Клинок из холодного железа леденит ладонь даже через рукоять. Нежить чует его и отступает." },
  cold_iron_axe: { id: "cold_iron_axe", name: "Топор из холодного железа", slot: "mainhand", icon: "🪓", atk: 34, crit: 2, dodge: 2, weaponType: "axe", handed: "1h", damage: { slashing: 26, piercing: 0, bludgeoning: 8 }, price: 150, shopTier: 2, desc: "Лезвие из холодного железа холодно на ощупь и входит в мёртвую плоть без сопротивления." },
  cold_iron_mace: { id: "cold_iron_mace", name: "Булава из холодного железа", slot: "mainhand", icon: "🏏", atk: 38, crit: 2, dodge: 2, weaponType: "mace", handed: "1h", damage: { slashing: 3, piercing: 0, bludgeoning: 35 }, price: 170, shopTier: 2, desc: "Шиповатое навершие из холодного железа дробит кости и жжёт нежить холодом." },

  cold_iron_shield: { id: "cold_iron_shield", name: "Щит из холодного железа", slot: "offhand", icon: "assets/icons/iron_shield.webp", def: 4, block: 1, dodge: 2, price: 90, shopTier: 2, desc: "Щит из холодного железа. Металл холодит руку и не подпускает нежить вплотную." },

  cold_iron_head: gearItem("cold_iron_head", "Шлем из холодного железа", "head", "assets/icons/iron_helmet.webp", 70, 2, { def: 4, hp: 45, dodge: 2, armorType: "leather" }, "Шлем из холодного железа холодит виски — и нежить обходит его стороной."),
  cold_iron_chest: gearItem("cold_iron_chest", "Нагрудник из холодного железа", "chest", "assets/icons/iron_breastplate.webp", 120, 2, { def: 8, hp: 70, dodge: 1, armorType: "leather" }, "Нагрудник из холодного железа: лёгкий, холодный на ощупь и смертельно неприятный для нежити."),
  cold_iron_hands: gearItem("cold_iron_hands", "Перчатки из холодного железа", "hands", "assets/icons/hands_iron.webp", 60, 2, { def: 4, hp: 40, dodge: 3, armorType: "leather" }, "Перчатки из холодного железа оставляют пальцы свободными для кирки, а металл стынет на коже."),
  cold_iron_feet: gearItem("cold_iron_feet", "Сапоги из холодного железа", "feet", "assets/icons/iron_boots.webp", 70, 2, { def: 5, hp: 45, dodge: 3, armorType: "leather" }, "Сапоги из холодного железа: шаг тише, а нежить слышит его хуже."),

  cold_iron_ring: gearItem("cold_iron_ring", "Кольцо из холодного железа", "ring", "💍", 60, 2, { crit: 2 }, "Простое кольцо из холодного железа, отполированное до блеска. Нежить его не любит."),
  cold_iron_neck: gearItem("cold_iron_neck", "Амулет из холодного железа", "neck", "📿", 65, 2, { dodge: 2 }, "Амулет из холодного железа, чей тихий звон отводит беду и нежить."),
// === ITEMS: Сталь (этаж 3) ===
  steel_knight_sword: { id: "steel_knight_sword", name: "Рыцарский стальной меч", slot: "mainhand", icon: "⚔️", atk: 42, crit: 3, weaponType: "sword", handed: "1h", damage: { slashing: 26, piercing: 16, bludgeoning: 0 }, price: 220, shopTier: 3, desc: "Прямой рыцарский клинок из холодной стали." },
  steel_zweihander: { id: "steel_zweihander", name: "Стальной двуручник", slot: "mainhand", icon: "⚔️", atk: 50, weaponType: "sword", handed: "2h", damage: { slashing: 34, piercing: 16, bludgeoning: 0 }, price: 320, shopTier: 3, desc: "Двуручник, чей клинок длиннее человеческой тени." },
  steel_sledge: { id: "steel_sledge", name: "Стальная кувалда", slot: "mainhand", icon: "🔨", atk: 58, weaponType: "mace", handed: "2h", damage: { slashing: 3, piercing: 0, bludgeoning: 55 }, price: 380, shopTier: 3, desc: "Кузнечная кувалда, перекованная в орудие для черепов." },

  steel_bulwark: { id: "steel_bulwark", name: "Стальной оплот", slot: "offhand", icon: "🛡️", def: 6, block: 1, price: 180, shopTier: 3, desc: "Стальной щит, за которым можно переждать целый бой." },

  steel_head: gearItem("steel_head", "Стальной шлем", "head", "⛑️", 150, 3, { def: 8, hp: 80, armorType: "plate" }, "Глухой стальной шлем, оставляющий лишь щель для глаз."),
  steel_chest: gearItem("steel_chest", "Стальная кираса", "chest", "🛡️", 300, 3, { def: 14, hp: 120, armorType: "plate" }, "Тяжёлая стальная кираса, что глушит и удар, и страх."),
  steel_legs: gearItem("steel_legs", "Стальные поножи", "legs", "👖", 240, 3, { def: 12, hp: 100, armorType: "plate" }, "Стальные поножи, в которых шаг становится гулким."),
  steel_feet: gearItem("steel_feet", "Стальные сапоги", "feet", "🥾", 200, 3, { def: 10, hp: 90, armorType: "plate" }, "Стальные сапоги, что вбивают врага в землю."),

  steel_ring: gearItem("steel_ring", "Стальное кольцо", "ring", "💍", 150, 3, { crit: 3 }, "Стальное кольцо, холодящее палец перед точным ударом."),
  steel_trinket: gearItem("steel_trinket", "Стальной талисман", "trinket", "🔮", 140, 3, { hp: 60 }, "Талисман из стали, дающий телу вторую прочность."),
// === ITEMS: Мифрил (этаж 4) ===
  mithril_sword: { id: "mithril_sword", name: "Мифриловый меч", slot: "mainhand", icon: "🗡️", atk: 62, crit: 5, weaponType: "sword", handed: "1h", damage: { slashing: 38, piercing: 24, bludgeoning: 0 }, price: 480, shopTier: 4, desc: "Клинок из мифрила, что поёт в воздухе, предсказывая крит." },
  mithril_halberd: { id: "mithril_halberd", name: "Мифриловая алебарда", slot: "mainhand", icon: "🪓", atk: 70, crit: 4, weaponType: "spear", handed: "2h", damage: { slashing: 30, piercing: 34, bludgeoning: 6 }, price: 560, shopTier: 4, desc: "Мифриловая алебарда — копьё и топор в одном древке." },
  mithril_axe: { id: "mithril_axe", name: "Мифриловая секира", slot: "mainhand", icon: "🪓", atk: 78, crit: 3, weaponType: "axe", handed: "2h", damage: { slashing: 58, piercing: 0, bludgeoning: 20 }, price: 640, shopTier: 4, desc: "Двуручная секира из мифрила, рассекающая воздух и броню." },

  mithril_shield: { id: "mithril_shield", name: "Мифриловый щит", slot: "offhand", icon: "🛡️", def: 8, block: 2, price: 320, shopTier: 4, desc: "Мифриловый щит, лёгкий как перо и прочный как скала." },

  mithril_head: gearItem("mithril_head", "Мифриловый шлем", "head", "💠", 320, 4, { def: 12, hp: 100, crit: 2, armorType: "plate" }, "Мифриловый шлем, чьи грани ловят свет и чужой взгляд."),
  mithril_chest: gearItem("mithril_chest", "Мифриловая кираса", "chest", "🛡️", 560, 4, { def: 16, hp: 130, crit: 3, armorType: "plate" }, "Мифриловая кираса, лёгкая настолько, что не замедляет руку."),
  mithril_hands: gearItem("mithril_hands", "Мифриловые рукавицы", "hands", "🧤", 300, 4, { def: 12, hp: 100, crit: 3, armorType: "plate" }, "Мифриловые рукавицы, в которых пальцы точны до дрожи."),
  mithril_legs: gearItem("mithril_legs", "Мифриловые поножи", "legs", "👖", 420, 4, { def: 14, hp: 115, crit: 2, armorType: "plate" }, "Мифриловые поножи, что невесомы на ноге."),

  mithril_ring: gearItem("mithril_ring", "Мифриловое кольцо", "ring", "💍", 350, 4, { crit: 4 }, "Кольцо из мифрила, обострившее глаз до предела."),
  mithril_trinket: gearItem("mithril_trinket", "Мифриловый амулет", "trinket", "🔮", 340, 4, { crit: 3 }, "Мифриловый амулет, что шепчет, куда бить."),
// === ITEMS: Адский камень (этаж 5) ===
  hell_great_sword: { id: "hell_great_sword", name: "Двуручник из адского камня", slot: "mainhand", icon: "⚔️", atk: 92, dodge: -2, weaponType: "sword", handed: "2h", damage: { slashing: 58, piercing: 34, bludgeoning: 0 }, price: 780, shopTier: 5, desc: "Двуручник, выкованный из адского камня и закалённый в крови." },
  hell_halberd: { id: "hell_halberd", name: "Алебарда из адского камня", slot: "mainhand", icon: "🪓", atk: 100, dodge: -3, weaponType: "spear", handed: "2h", damage: { slashing: 40, piercing: 50, bludgeoning: 10 }, price: 880, shopTier: 5, desc: "Адская алебарда, чей крюк рвёт и плоть, и реальность." },
  hell_maul: { id: "hell_maul", name: "Молот из адского камня", slot: "mainhand", icon: "🔨", atk: 110, dodge: -4, weaponType: "mace", handed: "2h", damage: { slashing: 5, piercing: 0, bludgeoning: 105 }, price: 980, shopTier: 5, desc: "Молот из адского камня, от которого трещит сама земля." },

  hell_shield: { id: "hell_shield", name: "Щит из адского камня", slot: "offhand", icon: "🛡️", def: 12, block: 2, dodge: -4, price: 600, shopTier: 5, desc: "Щит из адского камня — стена, за которой не спрячешься от жара." },

  hell_ring: gearItem("hell_ring", "Кольцо из адского камня", "ring", "💍", 550, 5, { crit: 4, hp: 30 }, "Кольцо из адского камня, что питает удар жизнью."),
  hell_trinket: gearItem("hell_trinket", "Амулет из адского камня", "trinket", "🔮", 580, 5, { crit: 3, hp: 50 }, "Амулет из адского камня, что делает тело крепче и удар точнее."),
// === ITEMS: Дневники охотников (выпадают из событий этажей, не продаются) ===
  diary_goblin: gearItem("diary_goblin", "Дневник новичка", "trinket", "📔", 0, 0, { hp: 10, crit: 1, lore: "День 3. Гоблины сбиваются в группы. Раньше их было по двое, теперь — по пять. Что-то их гонит сверху." }, "Потрёпанный блокнот с кривыми записями про жизнь в лесу."),
  diary_crypt: gearItem("diary_crypt", "Дневник ветерана", "trinket", "📕", 0, 0, { hp: 15, dodge: 1, lore: "Склеп не пуст. Кто-то ходит между саркофагами. Я слышал шаги, но никого не видел." }, "Осторожный почерк старого гробокопателя."),
  diary_hell: gearItem("diary_hell", "Дневник безумца", "trinket", "📗", 0, 0, { hp: 20, crit: 2, lore: "У Владыки есть слабое место. Не в броне — в самом сердце. Дробящий удар, точно в грудь. Запомни. Запомни. Запомни." }, "Записи, обожжённые по краям; последние страницы залиты воском."),
// === ITEMS: Сеты (Рудокоп / Страж склепа / Адский клинок) ===
  // — Рудокоп (холодное железо, leather, этаж 2) —
  set_miner_head: gearItem("set_miner_head", "Шлем рудокопа", "head", "⛑️", 90, 2, { def: 4, hp: 40, dodge: 2, armorType: "leather", rarity: "legendary", unique: "lucky" }, "Шлем рудокопа с тусклой лампой — говорят, он приносит удачу."),
  set_miner_chest: gearItem("set_miner_chest", "Доспех рудокопа", "chest", "🦺", 150, 2, { def: 8, hp: 70, dodge: 2, armorType: "leather" }, "Кожаный доспех рудокопа, пропитанный рудной пылью и потом."),
  set_miner_legs: gearItem("set_miner_legs", "Штаны рудокопа", "legs", "👖", 120, 2, { def: 6, hp: 55, dodge: 3, armorType: "leather" }, "Штаны рудокопа, усиленные на коленях для долгой работы."),
  set_miner_hands: gearItem("set_miner_hands", "Перчатки рудокопа", "hands", "🧤", 80, 2, { def: 4, hp: 40, dodge: 4, armorType: "leather" }, "Перчатки рудокопа, в которых кирка не выскальзывает."),
  set_miner_feet: gearItem("set_miner_feet", "Сапоги рудокопа", "feet", "🥾", 90, 2, { def: 5, hp: 45, dodge: 4, armorType: "leather" }, "Сапоги рудокопа с подошвой, что держит на осыпи."),

  // — Страж склепа (сталь, plate, этаж 3) —
  set_guard_head: gearItem("set_guard_head", "Шлем стража склепа", "head", "🪖", 180, 3, { def: 12, hp: 100, block: 1, armorType: "plate" }, "Шлем стража склепа, из-под которого не видно глаз."),
  set_guard_chest: gearItem("set_guard_chest", "Латы стража склепа", "chest", "🛡️", 360, 3, { def: 16, hp: 130, block: 1, armorType: "plate", rarity: "legendary", unique: "thorns" }, "Латы стража склепа, чьи шипы возвращают удар обидчику."),
  set_guard_legs: gearItem("set_guard_legs", "Поножи стража склепа", "legs", "👖", 280, 3, { def: 14, hp: 115, block: 1, armorType: "plate" }, "Поножи стража склепа, кованные для вечной стражи."),
  set_guard_hands: gearItem("set_guard_hands", "Рукавицы стража склепа", "hands", "🧤", 220, 3, { def: 10, hp: 90, block: 1, armorType: "plate" }, "Рукавицы стража склепа, что держат клинок даже после смерти."),
  set_guard_feet: gearItem("set_guard_feet", "Сапоги стража склепа", "feet", "🥾", 240, 3, { def: 12, hp: 95, block: 1, armorType: "plate" }, "Сапоги стража склепа, что не скользят на могильных плитах."),

  // — Адский клинок (адский камень, plate, этаж 5) —
  set_hellblade_head: gearItem("set_hellblade_head", "Шлем адского клинка", "head", "👹", 700, 5, { def: 18, hp: 140, dodge: -4, crit: 3, armorType: "plate" }, "Шлем адского клинка, увенчанный рогами."),
  set_hellblade_chest: gearItem("set_hellblade_chest", "Кираса адского клинка", "chest", "🛡️", 950, 5, { def: 20, hp: 160, dodge: -4, crit: 4, armorType: "plate", rarity: "legendary", unique: "lifesteal" }, "Кираса адского клинка, что пьёт кровь врагов, даря силу."),
  set_hellblade_legs: gearItem("set_hellblade_legs", "Поножи адского клинка", "legs", "👖", 820, 5, { def: 18, hp: 145, dodge: -3, crit: 3, armorType: "plate" }, "Поножи адского клинка, тяжёлые, как грехи их владельца."),
  set_hellblade_hands: gearItem("set_hellblade_hands", "Рукавицы адского клинка", "hands", "🧤", 720, 5, { def: 16, hp: 120, dodge: -2, crit: 2, armorType: "plate" }, "Рукавицы адского клинка, что зажимают клинок до хруста."),
  set_hellblade_feet: gearItem("set_hellblade_feet", "Сапоги адского клинка", "feet", "🥾", 740, 5, { def: 16, hp: 125, dodge: -3, crit: 2, armorType: "plate" }, "Сапоги адского клинка, оставляющие в камне трещины."),

  // ══════════════════════════════════════════════════════════════════════════
  // БРОНЯ: 4 типа × 5 тиров × 8 слотов (20 сетов × 8 = 160 предметов)
  // iconFallback по слоту: 🪖 🛡️ 🧥 🧤 🧤 🎗️ 👖 🥾
  // ══════════════════════════════════════════════════════════════════════════

  // — Тир 1. «Грубая кольчуга» (chain, этаж 1): 7 недостающих слотов к iron_chainmail —
  set_rough_chain_head: gearItem("set_rough_chain_head", "Шлем грубой кольчуги", "head", "assets/icons/set_rough_chain_head.webp", 110, 1, { def: 3, hp: 22, armorType: "chain", iconFallback: "🪖" }, "Кольца нашиты на стёганую шапку. От стрелы убережёт, от топора — нет."),
  set_rough_chain_shoulder: gearItem("set_rough_chain_shoulder", "Наплечники грубой кольчуги", "shoulder", "assets/icons/set_rough_chain_shoulder.webp", 105, 1, { def: 3, hp: 20, armorType: "chain", iconFallback: "🛡️" }, "Плечи в мелких кольцах, скрипящих при каждом взмахе."),
  set_rough_chain_wrist: gearItem("set_rough_chain_wrist", "Наручи грубой кольчуги", "wrist", "assets/icons/set_rough_chain_wrist.webp", 85, 1, { def: 2, hp: 18, armorType: "chain", iconFallback: "🧤" }, "Обрывок кольчужного рукава, стянутый ремешком."),
  set_rough_chain_hands: gearItem("set_rough_chain_hands", "Рукавицы грубой кольчуги", "hands", "assets/icons/set_rough_chain_hands.webp", 85, 1, { def: 2, hp: 18, armorType: "chain", iconFallback: "🧤" }, "Пальцы в кольцах гнутся плохо, зато держат удар."),
  set_rough_chain_waist: gearItem("set_rough_chain_waist", "Пояс грубой кольчуги", "waist", "assets/icons/set_rough_chain_waist.webp", 80, 1, { def: 2, hp: 18, armorType: "chain", iconFallback: "🎗️" }, "Кольчужная юбка на ремне — прикрывает бёдра."),
  set_rough_chain_legs: gearItem("set_rough_chain_legs", "Поножи грубой кольчуги", "legs", "assets/icons/set_rough_chain_legs.webp", 120, 1, { def: 3, hp: 26, armorType: "chain", iconFallback: "👖" }, "Кольчужные чулки, тяжёлые и звонкие."),
  set_rough_chain_feet: gearItem("set_rough_chain_feet", "Сапоги грубой кольчуги", "feet", "assets/icons/set_rough_chain_feet.webp", 105, 1, { def: 3, hp: 24, armorType: "chain", iconFallback: "🥾" }, "Кольчужные чулки вшиты в подошву — шаг гулкий."),

  // — Тир 2. «Сталь» (plate, этаж 2): 4 недостающих слота к steel_head/chest/legs/feet —
  steel_shoulder: gearItem("steel_shoulder", "Стальные наплечники", "shoulder", "assets/icons/steel_shoulder.webp", 170, 2, { def: 7, hp: 45, dodge: -1, armorType: "plate", iconFallback: "🛡️" }, "Стальные пластины на плечах — весомый довод в споре."),
  steel_wrist: gearItem("steel_wrist", "Стальные наручи", "wrist", "assets/icons/steel_wrist.webp", 120, 2, { def: 6, hp: 40, dodge: -1, armorType: "plate", iconFallback: "🧤" }, "Кованые наручи с ремнями из сыромятной кожи."),
  steel_hands: gearItem("steel_hands", "Стальные рукавицы", "hands", "assets/icons/steel_hands.webp", 120, 2, { def: 6, hp: 40, dodge: -1, armorType: "plate", iconFallback: "🧤" }, "Сталь на пальцах делает кулак кузнечным молотом."),
  steel_waist: gearItem("steel_waist", "Стальной пояс", "waist", "assets/icons/steel_waist.webp", 125, 2, { def: 6, hp: 42, dodge: -1, armorType: "plate", iconFallback: "🎗️" }, "Пластинчатый пояс, что держит спину прямой."),

  // — Тир 2. «Стальная кольчуга» (chain, этаж 2): 7 недостающих слотов к steel_chainmail —
  set_steel_chain_head: gearItem("set_steel_chain_head", "Шлем стальной кольчуги", "head", "assets/icons/set_steel_chain_head.webp", 190, 2, { def: 7, hp: 45, armorType: "chain", iconFallback: "🪖" }, "Плотный кольчужный капюшон под стальным обручем."),
  set_steel_chain_shoulder: gearItem("set_steel_chain_shoulder", "Наплечники стальной кольчуги", "shoulder", "assets/icons/set_steel_chain_shoulder.webp", 185, 2, { def: 7, hp: 42, armorType: "chain", iconFallback: "🛡️" }, "Кольца ровного плетения — работа не спешная, но честная."),
  set_steel_chain_wrist: gearItem("set_steel_chain_wrist", "Наручи стальной кольчуги", "wrist", "assets/icons/set_steel_chain_wrist.webp", 140, 2, { def: 5, hp: 38, armorType: "chain", iconFallback: "🧤" }, "Стальные наручи с двойным плетением на предплечье."),
  set_steel_chain_hands: gearItem("set_steel_chain_hands", "Рукавицы стальной кольчуги", "hands", "assets/icons/set_steel_chain_hands.webp", 140, 2, { def: 5, hp: 38, armorType: "chain", iconFallback: "🧤" }, "Кольчужные рукавицы, обшитые кожей по швам."),
  set_steel_chain_waist: gearItem("set_steel_chain_waist", "Пояс стальной кольчуги", "waist", "assets/icons/set_steel_chain_waist.webp", 135, 2, { def: 5, hp: 38, armorType: "chain", iconFallback: "🎗️" }, "Кольчужная юбка до колен, тяжёлая и надёжная."),
  set_steel_chain_legs: gearItem("set_steel_chain_legs", "Поножи стальной кольчуги", "legs", "assets/icons/set_steel_chain_legs.webp", 230, 2, { def: 8, hp: 50, armorType: "chain", iconFallback: "👖" }, "Стальные кольчужные штаны — походка становится тяжёлой."),
  set_steel_chain_feet: gearItem("set_steel_chain_feet", "Сапоги стальной кольчуги", "feet", "assets/icons/set_steel_chain_feet.webp", 190, 2, { def: 7, hp: 45, armorType: "chain", iconFallback: "🥾" }, "Кольчуга до щиколоток, подошва — двойная кожа."),

  // — Тир 2. «Тёмная кожа» (leather, этаж 2): 3 недостающих слота к set_miner_* —
  set_miner_shoulder: gearItem("set_miner_shoulder", "Наплечники рудокопа", "shoulder", "assets/icons/set_miner_shoulder.webp", 130, 2, { def: 6, hp: 45, dodge: 3, armorType: "leather", iconFallback: "🛡️" }, "Плечи рудокопа усилены кожей — туннель узкий, стены не уступают."),
  set_miner_wrist: gearItem("set_miner_wrist", "Наручи рудокопа", "wrist", "assets/icons/set_miner_wrist.webp", 105, 2, { def: 5, hp: 35, dodge: 4, armorType: "leather", iconFallback: "🧤" }, "Мягкие наручи, чтобы кирка не натирала запястье."),
  set_miner_waist: gearItem("set_miner_waist", "Пояс рудокопа", "waist", "assets/icons/set_miner_waist.webp", 110, 2, { def: 5, hp: 40, dodge: 3, armorType: "leather", iconFallback: "🎗️" }, "Ремень с карабинами для мешочков с рудой."),

  // — Тир 2. «Подмастерье» (cloth, этаж 2): 6 недостающих слотов к hood_mage/dense_cloth —
  set_apprentice_cloth_shoulder: gearItem("set_apprentice_cloth_shoulder", "Накидки подмастерья", "shoulder", "assets/icons/set_apprentice_cloth_shoulder.webp", 90, 2, { def: 2, hp: 30, mana: 12, armorType: "cloth", iconFallback: "🛡️" }, "Ткань, пропитанная травяным отваром, держит слабую магию."),
  set_apprentice_cloth_wrist: gearItem("set_apprentice_cloth_wrist", "Обмотки подмастерья", "wrist", "assets/icons/set_apprentice_cloth_wrist.webp", 75, 2, { def: 2, hp: 30, mana: 10, armorType: "cloth", iconFallback: "🧤" }, "Обмотки с вышитыми знаками — пальцы не мёрзнут над колбой."),
  set_apprentice_cloth_hands: gearItem("set_apprentice_cloth_hands", "Перчатки подмастерья", "hands", "assets/icons/set_apprentice_cloth_hands.webp", 75, 2, { def: 2, hp: 30, mana: 10, armorType: "cloth", iconFallback: "🧤" }, "Тонкие перчатки, чтобы не оставить следов в зелье."),
  set_apprentice_cloth_waist: gearItem("set_apprentice_cloth_waist", "Пояс подмастерья", "waist", "assets/icons/set_apprentice_cloth_waist.webp", 75, 2, { def: 2, hp: 30, mana: 10, armorType: "cloth", iconFallback: "🎗️" }, "Пояс с карманами для реагентов и мела."),
  set_apprentice_cloth_legs: gearItem("set_apprentice_cloth_legs", "Штаны подмастерья", "legs", "assets/icons/set_apprentice_cloth_legs.webp", 100, 2, { def: 3, hp: 35, mana: 15, armorType: "cloth", iconFallback: "👖" }, "Плотные штаны, хранящие запах дыма и пыли."),
  set_apprentice_cloth_feet: gearItem("set_apprentice_cloth_feet", "Тапочки подмастерья", "feet", "assets/icons/set_apprentice_cloth_feet.webp", 80, 2, { def: 2, hp: 30, mana: 10, armorType: "cloth", iconFallback: "🥾" }, "Мягкие тапочки — по библиотеке ходить тихо."),

  // — Тир 3. «Руническая сталь» (plate, этаж 3): 3 недостающих слота к set_guard_* —
  set_guard_shoulder: gearItem("set_guard_shoulder", "Наплечники стража склепа", "shoulder", "assets/icons/set_guard_shoulder.webp", 260, 3, { def: 12, hp: 80, block: 1, dodge: -1, armorType: "plate", iconFallback: "🛡️" }, "Руны на стали тускнеют, но не гаснут."),
  set_guard_wrist: gearItem("set_guard_wrist", "Наручи стража склепа", "wrist", "assets/icons/set_guard_wrist.webp", 220, 3, { def: 10, hp: 78, block: 1, armorType: "plate", iconFallback: "🧤" }, "Наручи, что держали клинок крепче, чем память."),
  set_guard_waist: gearItem("set_guard_waist", "Пояс стража склепа", "waist", "assets/icons/set_guard_waist.webp", 240, 3, { def: 10, hp: 79, block: 1, armorType: "plate", iconFallback: "🎗️" }, "Пластины пояса помнят каждый удар, что приняли."),

  // — Тир 3. «Руническая кольчуга» (chain, этаж 3) —
  set_runic_chain_head: gearItem("set_runic_chain_head", "Рунический кольчужный шлем", "head", "assets/icons/set_runic_chain_head.webp", 260, 3, { def: 11, hp: 75, armorType: "chain", iconFallback: "🪖" }, "Кольца переплетены в знак, что отводит взгляд нежити."),
  set_runic_chain_shoulder: gearItem("set_runic_chain_shoulder", "Рунические кольчужные наплечники", "shoulder", "assets/icons/set_runic_chain_shoulder.webp", 250, 3, { def: 10, hp: 70, armorType: "chain", iconFallback: "🛡️" }, "Рунные кольца нашиты поверх обычного плетения."),
  set_runic_chain_chest: gearItem("set_runic_chain_chest", "Руническая кольчуга", "chest", "assets/icons/set_runic_chain_chest.webp", 380, 3, { def: 13, hp: 80, armorType: "chain", iconFallback: "🧥" }, "Плотная кольчуга с рунными вставками на груди."),
  set_runic_chain_wrist: gearItem("set_runic_chain_wrist", "Рунические кольчужные наручи", "wrist", "assets/icons/set_runic_chain_wrist.webp", 200, 3, { def: 9, hp: 65, armorType: "chain", iconFallback: "🧤" }, "Мелкие руны на каждом третьем кольце."),
  set_runic_chain_hands: gearItem("set_runic_chain_hands", "Рунические кольчужные рукавицы", "hands", "assets/icons/set_runic_chain_hands.webp", 200, 3, { def: 9, hp: 65, armorType: "chain", iconFallback: "🧤" }, "Кольчуга на пальцах не мешает держать клинок."),
  set_runic_chain_waist: gearItem("set_runic_chain_waist", "Рунический кольчужный пояс", "waist", "assets/icons/set_runic_chain_waist.webp", 195, 3, { def: 9, hp: 65, armorType: "chain", iconFallback: "🎗️" }, "Кольчужная юбка с рунным подолом."),
  set_runic_chain_legs: gearItem("set_runic_chain_legs", "Рунические кольчужные поножи", "legs", "assets/icons/set_runic_chain_legs.webp", 320, 3, { def: 12, hp: 80, armorType: "chain", iconFallback: "👖" }, "Тяжёлые кольчужные штаны, звенящие на ходу."),
  set_runic_chain_feet: gearItem("set_runic_chain_feet", "Рунические кольчужные сапоги", "feet", "assets/icons/set_runic_chain_feet.webp", 260, 3, { def: 10, hp: 70, armorType: "chain", iconFallback: "🥾" }, "Кольца до щиколоток, руны на подошве."),

  // — Тир 3. «Руническая кожа» (leather, этаж 3) —
  set_runic_leather_head: gearItem("set_runic_leather_head", "Рунический кожаный капюшон", "head", "assets/icons/set_runic_leather_head.webp", 240, 3, { def: 8, hp: 60, dodge: 4, armorType: "leather", iconFallback: "🪖" }, "Кожа, тиснённая рунами, глушит чужие шёпоты."),
  set_runic_leather_shoulder: gearItem("set_runic_leather_shoulder", "Рунические кожаные наплечники", "shoulder", "assets/icons/set_runic_leather_shoulder.webp", 230, 3, { def: 8, hp: 55, dodge: 4, armorType: "leather", iconFallback: "🛡️" }, "Мягкая кожа с костяными вставками на плечах."),
  set_runic_leather_chest: gearItem("set_runic_leather_chest", "Рунический кожаный доспех", "chest", "assets/icons/set_runic_leather_chest.webp", 350, 3, { def: 12, hp: 70, dodge: 3, armorType: "leather", iconFallback: "🧥" }, "Кожаный доспех, сшитый по рунным линиям."),
  set_runic_leather_wrist: gearItem("set_runic_leather_wrist", "Рунические кожаные наручи", "wrist", "assets/icons/set_runic_leather_wrist.webp", 180, 3, { def: 8, hp: 55, dodge: 4, armorType: "leather", iconFallback: "🧤" }, "Тонкая кожа, не стесняющая запястье."),
  set_runic_leather_hands: gearItem("set_runic_leather_hands", "Рунические кожаные перчатки", "hands", "assets/icons/set_runic_leather_hands.webp", 180, 3, { def: 8, hp: 55, dodge: 4, armorType: "leather", iconFallback: "🧤" }, "Перчатки с рунной строчкой по костяшкам."),
  set_runic_leather_waist: gearItem("set_runic_leather_waist", "Рунический кожаный ремень", "waist", "assets/icons/set_runic_leather_waist.webp", 175, 3, { def: 8, hp: 55, dodge: 4, armorType: "leather", iconFallback: "🎗️" }, "Ремень с пряжкой, на которой стёрлась руна."),
  set_runic_leather_legs: gearItem("set_runic_leather_legs", "Рунические кожаные штаны", "legs", "assets/icons/set_runic_leather_legs.webp", 300, 3, { def: 11, hp: 65, dodge: 3, armorType: "leather", iconFallback: "👖" }, "Кожаные штаны с вставками на коленях."),
  set_runic_leather_feet: gearItem("set_runic_leather_feet", "Рунические кожаные сапоги", "feet", "assets/icons/set_runic_leather_feet.webp", 235, 3, { def: 9, hp: 60, dodge: 4, armorType: "leather", iconFallback: "🥾" }, "Мягкие сапоги — шаг тише, чем у страха."),

  // — Тир 3. «Адепт» (cloth, этаж 3) —
  set_adept_cloth_head: gearItem("set_adept_cloth_head", "Капюшон адепта", "head", "assets/icons/set_adept_cloth_head.webp", 235, 3, { def: 4, hp: 60, mana: 22, armorType: "cloth", iconFallback: "🪖" }, "Капюшон с вышитой печатью — мысли становятся тише."),
  set_adept_cloth_shoulder: gearItem("set_adept_cloth_shoulder", "Накидки адепта", "shoulder", "assets/icons/set_adept_cloth_shoulder.webp", 220, 3, { def: 4, hp: 55, mana: 20, armorType: "cloth", iconFallback: "🛡️" }, "Слои ткани, держащие форму заклинания."),
  set_adept_cloth_chest: gearItem("set_adept_cloth_chest", "Роба адепта", "chest", "assets/icons/set_adept_cloth_chest.webp", 340, 3, { def: 6, hp: 65, mana: 30, armorType: "cloth", iconFallback: "🧥" }, "Роба, в подкладку которой вшиты серебряные нити."),
  set_adept_cloth_wrist: gearItem("set_adept_cloth_wrist", "Обмотки адепта", "wrist", "assets/icons/set_adept_cloth_wrist.webp", 175, 3, { def: 4, hp: 50, mana: 18, armorType: "cloth", iconFallback: "🧤" }, "Обмотки с узлом на каждом витке — так учили."),
  set_adept_cloth_hands: gearItem("set_adept_cloth_hands", "Перчатки адепта", "hands", "assets/icons/set_adept_cloth_hands.webp", 175, 3, { def: 4, hp: 50, mana: 18, armorType: "cloth", iconFallback: "🧤" }, "Тонкие перчатки, в которых жест читается без слов."),
  set_adept_cloth_waist: gearItem("set_adept_cloth_waist", "Пояс адепта", "waist", "assets/icons/set_adept_cloth_waist.webp", 170, 3, { def: 4, hp: 50, mana: 18, armorType: "cloth", iconFallback: "🎗️" }, "Пояс с гнёздами для кристаллов."),
  set_adept_cloth_legs: gearItem("set_adept_cloth_legs", "Штаны адепта", "legs", "assets/icons/set_adept_cloth_legs.webp", 290, 3, { def: 6, hp: 60, mana: 25, armorType: "cloth", iconFallback: "👖" }, "Плотная ткань, не мешающая шагу и жесту."),
  set_adept_cloth_feet: gearItem("set_adept_cloth_feet", "Сапоги адепта", "feet", "assets/icons/set_adept_cloth_feet.webp", 225, 3, { def: 4, hp: 55, mana: 20, armorType: "cloth", iconFallback: "🥾" }, "Сапоги с войлочной подкладкой — в склепе не холодно."),

  // — Тир 4. «Мифрил» (plate, этаж 4): 4 недостающих слота к mithril_head/chest/hands/legs —
  mithril_shoulder: gearItem("mithril_shoulder", "Мифриловые наплечники", "shoulder", "assets/icons/mithril_shoulder.webp", 300, 4, { def: 14, hp: 105, crit: 1, dodge: -1, armorType: "plate", iconFallback: "🛡️" }, "Мифрил почти невесом — плечи не устают до вечера."),
  mithril_wrist: gearItem("mithril_wrist", "Мифриловые наручи", "wrist", "assets/icons/mithril_wrist.webp", 260, 4, { def: 12, hp: 95, crit: 1, armorType: "plate", iconFallback: "🧤" }, "Мифриловые наручи гнутся там, где сталь бы лопнула."),
  mithril_waist: gearItem("mithril_waist", "Мифриловый пояс", "waist", "assets/icons/mithril_waist.webp", 270, 4, { def: 12, hp: 100, crit: 1, armorType: "plate", iconFallback: "🎗️" }, "Пояс, отлитый из одного куска мифрила."),
  mithril_feet: gearItem("mithril_feet", "Мифриловые сапоги", "feet", "assets/icons/mithril_feet.webp", 310, 4, { def: 14, hp: 110, crit: 1, armorType: "plate", iconFallback: "🥾" }, "Мифриловые сапоги: тихий шаг, гулкий удар."),

  // — Тир 4. «Мифриловая кольчуга» (chain, этаж 4) —
  set_mithril_chain_head: gearItem("set_mithril_chain_head", "Мифриловый кольчужный шлем", "head", "assets/icons/set_mithril_chain_head.webp", 380, 4, { def: 13, hp: 100, crit: 2, armorType: "chain", iconFallback: "🪖" }, "Мифриловая сетка под стальным обручем — легче шёпота."),
  set_mithril_chain_shoulder: gearItem("set_mithril_chain_shoulder", "Мифриловые кольчужные наплечники", "shoulder", "assets/icons/set_mithril_chain_shoulder.webp", 360, 4, { def: 12, hp: 95, crit: 1, armorType: "chain", iconFallback: "🛡️" }, "Кольца мифрила блестят даже в темноте склепа."),
  set_mithril_chain_chest: gearItem("set_mithril_chain_chest", "Мифриловая кольчуга", "chest", "assets/icons/set_mithril_chain_chest.webp", 620, 4, { def: 16, hp: 120, crit: 3, armorType: "chain", iconFallback: "🧥" }, "Мифриловая кольчуга, что поёт под ударом."),
  set_mithril_chain_wrist: gearItem("set_mithril_chain_wrist", "Мифриловые кольчужные наручи", "wrist", "assets/icons/set_mithril_chain_wrist.webp", 270, 4, { def: 12, hp: 90, crit: 1, armorType: "chain", iconFallback: "🧤" }, "Плетение такой плотности, что вода не проходит."),
  set_mithril_chain_hands: gearItem("set_mithril_chain_hands", "Мифриловые кольчужные рукавицы", "hands", "assets/icons/set_mithril_chain_hands.webp", 300, 4, { def: 12, hp: 90, crit: 2, armorType: "chain", iconFallback: "🧤" }, "Пальцы в мифриле чувствуют биение чужой крови."),
  set_mithril_chain_waist: gearItem("set_mithril_chain_waist", "Мифриловый кольчужный пояс", "waist", "assets/icons/set_mithril_chain_waist.webp", 275, 4, { def: 12, hp: 90, crit: 1, armorType: "chain", iconFallback: "🎗️" }, "Кольчужная юбка из мифрила — звенит, но не тянет."),
  set_mithril_chain_legs: gearItem("set_mithril_chain_legs", "Мифриловые кольчужные поножи", "legs", "assets/icons/set_mithril_chain_legs.webp", 480, 4, { def: 15, hp: 110, crit: 2, armorType: "chain", iconFallback: "👖" }, "Лёгкие поножи, в которых можно бежать по осыпи."),
  set_mithril_chain_feet: gearItem("set_mithril_chain_feet", "Мифриловые кольчужные сапоги", "feet", "assets/icons/set_mithril_chain_feet.webp", 380, 4, { def: 13, hp: 100, crit: 2, armorType: "chain", iconFallback: "🥾" }, "Мифриловая сетка на подошве — шаг как у кошки."),

  // — Тир 4. «Кожа с костяными пластинами» (leather, этаж 4) —
  set_bone_leather_head: gearItem("set_bone_leather_head", "Шлем из костяной кожи", "head", "assets/icons/set_bone_leather_head.webp", 340, 4, { def: 12, hp: 90, dodge: 4, armorType: "leather", iconFallback: "🪖" }, "Костяные пластины вшиты в кожу, как рёбра в плоть."),
  set_bone_leather_shoulder: gearItem("set_bone_leather_shoulder", "Костяные наплечники", "shoulder", "assets/icons/set_bone_leather_shoulder.webp", 320, 4, { def: 12, hp: 85, dodge: 4, armorType: "leather", iconFallback: "🛡️" }, "Оркские клыки держат кожу на плечах."),
  set_bone_leather_chest: gearItem("set_bone_leather_chest", "Костяная кираса", "chest", "assets/icons/set_bone_leather_chest.webp", 600, 4, { def: 16, hp: 105, dodge: 3, armorType: "leather", iconFallback: "🧥" }, "Кираса из кожи и рёбер — гнётся там, где сталь звенит."),
  set_bone_leather_wrist: gearItem("set_bone_leather_wrist", "Костяные наручи", "wrist", "assets/icons/set_bone_leather_wrist.webp", 250, 4, { def: 12, hp: 80, dodge: 4, armorType: "leather", iconFallback: "🧤" }, "Наручи с костяными шипами на внешней стороне."),
  set_bone_leather_hands: gearItem("set_bone_leather_hands", "Костяные перчатки", "hands", "assets/icons/set_bone_leather_hands.webp", 250, 4, { def: 12, hp: 80, dodge: 4, armorType: "leather", iconFallback: "🧤" }, "Костяные пластины на костяшках — удар тяжелее."),
  set_bone_leather_waist: gearItem("set_bone_leather_waist", "Костяной ремень", "waist", "assets/icons/set_bone_leather_waist.webp", 255, 4, { def: 12, hp: 80, dodge: 4, armorType: "leather", iconFallback: "🎗️" }, "Ремень, увешанный костяными пластинами."),
  set_bone_leather_legs: gearItem("set_bone_leather_legs", "Костяные штаны", "legs", "assets/icons/set_bone_leather_legs.webp", 450, 4, { def: 15, hp: 100, dodge: 3, armorType: "leather", iconFallback: "👖" }, "Кожаные штаны с костяными наколенниками."),
  set_bone_leather_feet: gearItem("set_bone_leather_feet", "Костяные сапоги", "feet", "assets/icons/set_bone_leather_feet.webp", 350, 4, { def: 13, hp: 90, dodge: 4, armorType: "leather", iconFallback: "🥾" }, "Сапоги с костяной стелькой — по камню идти легче."),

  // — Тир 4. «Маг» (cloth, этаж 4) —
  set_mage_cloth_head: gearItem("set_mage_cloth_head", "Капюшон мага", "head", "assets/icons/set_mage_cloth_head.webp", 330, 4, { def: 7, hp: 85, mana: 30, armorType: "cloth", iconFallback: "🪖" }, "Капюшон мага хранит чужие заклятия, как ткань — дым."),
  set_mage_cloth_shoulder: gearItem("set_mage_cloth_shoulder", "Накидка мага", "shoulder", "assets/icons/set_mage_cloth_shoulder.webp", 305, 4, { def: 7, hp: 80, mana: 28, armorType: "cloth", iconFallback: "🛡️" }, "Накидка, расшитая созвездиями чужого неба."),
  set_mage_cloth_chest: gearItem("set_mage_cloth_chest", "Мантия мага", "chest", "assets/icons/set_mage_cloth_chest.webp", 580, 4, { def: 9, hp: 90, mana: 40, armorType: "cloth", iconFallback: "🧥" }, "Мантия мага: ткань легче, чем кажется, и тёплее, чем должна."),
  set_mage_cloth_wrist: gearItem("set_mage_cloth_wrist", "Наручи мага", "wrist", "assets/icons/set_mage_cloth_wrist.webp", 235, 4, { def: 7, hp: 80, mana: 25, armorType: "cloth", iconFallback: "🧤" }, "Наручи с кристальной иглой, что не даёт жесту дрожать."),
  set_mage_cloth_hands: gearItem("set_mage_cloth_hands", "Перчатки мага", "hands", "assets/icons/set_mage_cloth_hands.webp", 235, 4, { def: 7, hp: 80, mana: 25, armorType: "cloth", iconFallback: "🧤" }, "Ткань перчаток помнит тепло последнего заклинания."),
  set_mage_cloth_waist: gearItem("set_mage_cloth_waist", "Пояс мага", "waist", "assets/icons/set_mage_cloth_waist.webp", 240, 4, { def: 7, hp: 80, mana: 25, armorType: "cloth", iconFallback: "🎗️" }, "Пояс с ячейками для свитков."),
  set_mage_cloth_legs: gearItem("set_mage_cloth_legs", "Штаны мага", "legs", "assets/icons/set_mage_cloth_legs.webp", 440, 4, { def: 9, hp: 85, mana: 32, armorType: "cloth", iconFallback: "👖" }, "Штаны, подшитые нитью, что не рвётся от жара."),
  set_mage_cloth_feet: gearItem("set_mage_cloth_feet", "Сапоги мага", "feet", "assets/icons/set_mage_cloth_feet.webp", 330, 4, { def: 7, hp: 85, mana: 28, armorType: "cloth", iconFallback: "🥾" }, "Сапоги с пылью, что не оседает на подошве."),

  // — Тир 5. «Бездна» (plate, этаж 5): 3 недостающих слота к set_hellblade_* —
  set_hellblade_shoulder: gearItem("set_hellblade_shoulder", "Наплечники адского клинка", "shoulder", "assets/icons/set_hellblade_shoulder.webp", 780, 5, { def: 18, hp: 140, dodge: -4, crit: 3, armorType: "plate", iconFallback: "🛡️" }, "Шипы наплечников тлеют даже под дождём."),
  set_hellblade_wrist: gearItem("set_hellblade_wrist", "Наручи адского клинка", "wrist", "assets/icons/set_hellblade_wrist.webp", 700, 5, { def: 16, hp: 115, dodge: -2, crit: 2, armorType: "plate", iconFallback: "🧤" }, "Наручи, что жгут холодом, а не жаром."),
  set_hellblade_waist: gearItem("set_hellblade_waist", "Пояс адского клинка", "waist", "assets/icons/set_hellblade_waist.webp", 720, 5, { def: 16, hp: 120, dodge: -3, crit: 2, armorType: "plate", iconFallback: "🎗️" }, "Пластины пояса скреплены цепью из Бездны."),

  // — Тир 5. «Кольчуга Бездны» (chain, этаж 5) —
  set_abyss_chain_head: gearItem("set_abyss_chain_head", "Кольчужный шлем Бездны", "head", "assets/icons/set_abyss_chain_head.webp", 700, 5, { def: 17, hp: 130, armorType: "chain", iconFallback: "🪖" }, "Кольца плавятся и снова твердеют — но не рвутся."),
  set_abyss_chain_shoulder: gearItem("set_abyss_chain_shoulder", "Кольчужные наплечники Бездны", "shoulder", "assets/icons/set_abyss_chain_shoulder.webp", 670, 5, { def: 16, hp: 120, armorType: "chain", iconFallback: "🛡️" }, "Тёмные кольца, что не блестят даже в огне."),
  set_abyss_chain_chest: gearItem("set_abyss_chain_chest", "Кольчуга Бездны", "chest", "assets/icons/set_abyss_chain_chest.webp", 900, 5, { def: 20, hp: 150, armorType: "chain", iconFallback: "🧥" }, "Кольчуга Бездны: холодная, тяжёлая, чужая."),
  set_abyss_chain_wrist: gearItem("set_abyss_chain_wrist", "Кольчужные наручи Бездны", "wrist", "assets/icons/set_abyss_chain_wrist.webp", 560, 5, { def: 15, hp: 105, armorType: "chain", iconFallback: "🧤" }, "Кольца наручей шепчут чужими голосами."),
  set_abyss_chain_hands: gearItem("set_abyss_chain_hands", "Кольчужные рукавицы Бездны", "hands", "assets/icons/set_abyss_chain_hands.webp", 570, 5, { def: 15, hp: 105, armorType: "chain", iconFallback: "🧤" }, "Рукавицы, в которых клинок держится сам."),
  set_abyss_chain_waist: gearItem("set_abyss_chain_waist", "Кольчужный пояс Бездны", "waist", "assets/icons/set_abyss_chain_waist.webp", 580, 5, { def: 15, hp: 105, armorType: "chain", iconFallback: "🎗️" }, "Пояс, к которому липнет пепел."),
  set_abyss_chain_legs: gearItem("set_abyss_chain_legs", "Кольчужные поножи Бездны", "legs", "assets/icons/set_abyss_chain_legs.webp", 800, 5, { def: 18, hp: 140, armorType: "chain", iconFallback: "👖" }, "Поножи Бездны: каждый шаг — как по углям."),
  set_abyss_chain_feet: gearItem("set_abyss_chain_feet", "Кольчужные сапоги Бездны", "feet", "assets/icons/set_abyss_chain_feet.webp", 680, 5, { def: 16, hp: 125, armorType: "chain", iconFallback: "🥾" }, "Сапоги, что не плавятся на раскалённом камне."),

  // — Тир 5. «Кожа Бездны» (leather, этаж 5) —
  set_abyss_leather_head: gearItem("set_abyss_leather_head", "Кожаный шлем Бездны", "head", "assets/icons/set_abyss_leather_head.webp", 640, 5, { def: 15, hp: 105, dodge: 5, armorType: "leather", iconFallback: "🪖" }, "Кожа, снятая с чего-то, что не имело имени."),
  set_abyss_leather_shoulder: gearItem("set_abyss_leather_shoulder", "Кожаные наплечники Бездны", "shoulder", "assets/icons/set_abyss_leather_shoulder.webp", 610, 5, { def: 15, hp: 100, dodge: 5, armorType: "leather", iconFallback: "🛡️" }, "Наплечники, что двигаются вместе с тенью."),
  set_abyss_leather_chest: gearItem("set_abyss_leather_chest", "Кожаный доспех Бездны", "chest", "assets/icons/set_abyss_leather_chest.webp", 850, 5, { def: 17, hp: 115, dodge: 4, armorType: "leather", iconFallback: "🧥" }, "Доспех Бездны: кожа теплее воздуха и тише шага."),
  set_abyss_leather_wrist: gearItem("set_abyss_leather_wrist", "Кожаные наручи Бездны", "wrist", "assets/icons/set_abyss_leather_wrist.webp", 520, 5, { def: 15, hp: 100, dodge: 5, armorType: "leather", iconFallback: "🧤" }, "Наручи с прожилками, что светятся в темноте."),
  set_abyss_leather_hands: gearItem("set_abyss_leather_hands", "Кожаные перчатки Бездны", "hands", "assets/icons/set_abyss_leather_hands.webp", 520, 5, { def: 15, hp: 100, dodge: 5, armorType: "leather", iconFallback: "🧤" }, "Перчатки, в которых пальцы не чувствуют жара."),
  set_abyss_leather_waist: gearItem("set_abyss_leather_waist", "Кожаный ремень Бездны", "waist", "assets/icons/set_abyss_leather_waist.webp", 530, 5, { def: 15, hp: 100, dodge: 5, armorType: "leather", iconFallback: "🎗️" }, "Ремень, стянутый пряжкой из чёрного камня."),
  set_abyss_leather_legs: gearItem("set_abyss_leather_legs", "Кожаные штаны Бездны", "legs", "assets/icons/set_abyss_leather_legs.webp", 750, 5, { def: 17, hp: 110, dodge: 4, armorType: "leather", iconFallback: "👖" }, "Штаны, что не пропускают ни жар, ни холод."),
  set_abyss_leather_feet: gearItem("set_abyss_leather_feet", "Кожаные сапоги Бездны", "feet", "assets/icons/set_abyss_leather_feet.webp", 620, 5, { def: 15, hp: 105, dodge: 5, armorType: "leather", iconFallback: "🥾" }, "Сапоги, оставляющие следы, что остывают медленно."),

  // — Тир 5. «Архимаг» (cloth, этаж 5) —
  set_archmage_cloth_head: gearItem("set_archmage_cloth_head", "Капюшон архимага", "head", "assets/icons/set_archmage_cloth_head.webp", 610, 5, { def: 9, hp: 105, mana: 40, armorType: "cloth", iconFallback: "🪖" }, "Капюшон архимага: под тканью — звёздная пустота."),
  set_archmage_cloth_shoulder: gearItem("set_archmage_cloth_shoulder", "Накидка архимага", "shoulder", "assets/icons/set_archmage_cloth_shoulder.webp", 570, 5, { def: 9, hp: 100, mana: 38, armorType: "cloth", iconFallback: "🛡️" }, "Накидка, что гасит искры заклинаний."),
  set_archmage_cloth_chest: gearItem("set_archmage_cloth_chest", "Мантия архимага", "chest", "assets/icons/set_archmage_cloth_chest.webp", 860, 5, { def: 11, hp: 110, mana: 50, armorType: "cloth", iconFallback: "🧥" }, "Мантия архимага помнит всех, кто её носил. И всех, кто нет."),
  set_archmage_cloth_wrist: gearItem("set_archmage_cloth_wrist", "Наручи архимага", "wrist", "assets/icons/set_archmage_cloth_wrist.webp", 480, 5, { def: 9, hp: 100, mana: 35, armorType: "cloth", iconFallback: "🧤" }, "Наручи с печатями, что нельзя прочесть дважды."),
  set_archmage_cloth_hands: gearItem("set_archmage_cloth_hands", "Перчатки архимага", "hands", "assets/icons/set_archmage_cloth_hands.webp", 490, 5, { def: 9, hp: 100, mana: 35, armorType: "cloth", iconFallback: "🧤" }, "Перчатки, в которых жест стоит дороже золота."),
  set_archmage_cloth_waist: gearItem("set_archmage_cloth_waist", "Пояс архимага", "waist", "assets/icons/set_archmage_cloth_waist.webp", 500, 5, { def: 9, hp: 100, mana: 35, armorType: "cloth", iconFallback: "🎗️" }, "Пояс, к которому прикованы пустые ножны для свитков."),
  set_archmage_cloth_legs: gearItem("set_archmage_cloth_legs", "Штаны архимага", "legs", "assets/icons/set_archmage_cloth_legs.webp", 760, 5, { def: 11, hp: 105, mana: 45, armorType: "cloth", iconFallback: "👖" }, "Штаны, подол которых не касается пола."),
  set_archmage_cloth_feet: gearItem("set_archmage_cloth_feet", "Сапоги архимага", "feet", "assets/icons/set_archmage_cloth_feet.webp", 600, 5, { def: 9, hp: 105, mana: 40, armorType: "cloth", iconFallback: "🥾" }, "Сапоги архимага ступают бесшумно по любому камню."),

  // ══════════════════════════════════════════════════════════════════════════
  // ПАРНЫЕ КОЛЬЦА И АКСЕССУАРЫ: 10 пар = 20 предметов (порог 2/2)
  // ══════════════════════════════════════════════════════════════════════════

  // — Тир 1: железные кольца и тотемы волка —
  ring_iron_1: gearItem("ring_iron_1", "Железное кольцо «Заря»", "ring", "assets/icons/ring_iron_1.webp", 35, 1, { crit: 1, iconFallback: "💍" }, "Пара к кольцу «Закат»: вместе они точнее находят щель в броне."),
  ring_iron_2: gearItem("ring_iron_2", "Железное кольцо «Закат»", "ring", "assets/icons/ring_iron_2.webp", 35, 1, { crit: 1, iconFallback: "💍" }, "Пара к кольцу «Заря»: холодный металл помнит чужой удар."),
  trinket_wolf_1: gearItem("trinket_wolf_1", "Тотем волка «Клык»", "trinket", "assets/icons/trinket_wolf_1.webp", 32, 1, { dodge: 1, iconFallback: "🔮" }, "Волчий клык на жиле — шаг становится мягче."),
  trinket_wolf_2: gearItem("trinket_wolf_2", "Тотем волка «Лапа»", "trinket", "assets/icons/trinket_wolf_2.webp", 32, 1, { dodge: 1, iconFallback: "🔮" }, "Лапа, высушенная в дыму: пара к тотему «Клык»."),

  // — Тир 2: медные кольца и грибные амулеты —
  ring_copper_1: gearItem("ring_copper_1", "Медное кольцо «Искра»", "ring", "assets/icons/ring_copper_1.webp", 70, 2, { crit: 1, iconFallback: "💍" }, "Медь под шахтным светом кажется золотом."),
  ring_copper_2: gearItem("ring_copper_2", "Медное кольцо «Жар»", "ring", "assets/icons/ring_copper_2.webp", 85, 2, { crit: 2, iconFallback: "💍" }, "Пара к «Искре»: вместе они держат удар точнее."),
  trinket_mushroom_1: gearItem("trinket_mushroom_1", "Грибной амулет «Бледный»", "trinket", "assets/icons/trinket_mushroom_1.webp", 68, 2, { hp: 10, iconFallback: "🔮" }, "Пещерный гриб в смоле: дышится легче."),
  trinket_mushroom_2: gearItem("trinket_mushroom_2", "Грибной амулет «Тёмный»", "trinket", "assets/icons/trinket_mushroom_2.webp", 76, 2, { hp: 15, iconFallback: "🔮" }, "Пара к «Бледному»: вместе они греют изнутри."),

  // — Тир 3: серебряные кольца и фиалы призрака —
  ring_silver_1: gearItem("ring_silver_1", "Серебряное кольцо «Луна»", "ring", "assets/icons/ring_silver_1.webp", 130, 3, { dodge: 2, iconFallback: "💍" }, "Холодное серебро отводит чужой взгляд."),
  ring_silver_2: gearItem("ring_silver_2", "Серебряное кольцо «Тень»", "ring", "assets/icons/ring_silver_2.webp", 130, 3, { dodge: 2, iconFallback: "💍" }, "Пара к «Луне»: вместе они делают шаг неслышным."),
  trinket_ghost_1: gearItem("trinket_ghost_1", "Фиал призрака «Шёпот»", "trinket", "assets/icons/trinket_ghost_1.webp", 140, 3, { hp: 20, iconFallback: "🔮" }, "В фиале плещется чужое дыхание — оно держит тебя на ногах."),
  trinket_ghost_2: gearItem("trinket_ghost_2", "Фиал призрака «Холод»", "trinket", "assets/icons/trinket_ghost_2.webp", 140, 3, { hp: 20, iconFallback: "🔮" }, "Пара к «Шёпоту»: вместе они выстуживают чужой удар."),

  // — Тир 4: мифриловые кольца и амулеты орка —
  ring_mithril_1: gearItem("ring_mithril_1", "Мифриловое кольцо «Блеск»", "ring", "assets/icons/ring_mithril_1.webp", 330, 4, { crit: 3, iconFallback: "💍" }, "Мифрил ловит свет и подсказывает, куда бить."),
  ring_mithril_2: gearItem("ring_mithril_2", "Мифриловое кольцо «Песнь»", "ring", "assets/icons/ring_mithril_2.webp", 330, 4, { crit: 3, iconFallback: "💍" }, "Пара к «Блеску»: вместе они поют перед ударом."),
  trinket_orc_1: gearItem("trinket_orc_1", "Амулет орка «Череп»", "trinket", "assets/icons/trinket_orc_1.webp", 330, 4, { dodge: 2, iconFallback: "🔮" }, "Оркский череп, обвязанный цепью, — враг промахивается чаще."),
  trinket_orc_2: gearItem("trinket_orc_2", "Амулет орка «Клык»", "trinket", "assets/icons/trinket_orc_2.webp", 330, 4, { dodge: 2, iconFallback: "🔮" }, "Пара к «Черепу»: вместе они пахнут войной."),

  // — Тир 5: кольца из адского камня и печати демона —
  ring_hell_1: gearItem("ring_hell_1", "Кольцо из адского камня «Уголёк»", "ring", "assets/icons/ring_hell_1.webp", 540, 5, { crit: 4, iconFallback: "💍" }, "Уголёк в оправе не гаснет — он ждёт удара."),
  ring_hell_2: gearItem("ring_hell_2", "Кольцо из адского камня «Пламя»", "ring", "assets/icons/ring_hell_2.webp", 540, 5, { crit: 4, iconFallback: "💍" }, "Пара к «Угольку»: вместе они разжигают кровь."),
  trinket_demon_1: gearItem("trinket_demon_1", "Печать демона «Зола»", "trinket", "assets/icons/trinket_demon_1.webp", 560, 5, { hp: 30, iconFallback: "🔮" }, "Печать, оттиснутая на пепле: тело помнит, что уже горело."),
  trinket_demon_2: gearItem("trinket_demon_2", "Печать демона «Уголь»", "trinket", "assets/icons/trinket_demon_2.webp", 560, 5, { hp: 30, iconFallback: "🔮" }, "Пара к «Золе»: вместе они держат душу в теле."),
};

// armorType старой gearItem()-брони (голова/плечи/спина/руки/пояс/ноги/ступни).
const ARMOR_TYPE_BY_ID = {
  worn_hood: "cloth", patched_pants: "cloth", worn_boots: "cloth",
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

// Автопути иконок всех предметов 1-го тира: assets/icons/<id>.webp.
// Прежний эмодзи сохраняем запасным вариантом — если файла ещё нет,
// iconHtml покажет его вместо пустого слота.
for (const item of Object.values(ITEMS)) {
  if (item.shopTier !== 1) continue;
  if (item.slot === "potion") continue; // зелья остаются на эмодзи
  if (typeof item.icon === "string" && item.icon.startsWith("assets/")) continue;
  if (!item.iconFallback) item.iconFallback = item.icon || "";
  item.icon = `assets/icons/${item.id}.webp`;
}

// Часть иконок сгенерирована под другими именами файлов (латы, кольчуга).
// Сопоставляем id предмета с реальным именем файла в assets/icons/.
// Записи, где ключ совпадает со значением, нужны предметам вне 1-го тира:
// файл для них уже есть, а путь ещё не был прописан.
const ICON_ALIASES = {
  head_iron: "iron_helmet",
  leather_armor: "leather",
  dented_plate: "iron_breastplate",
  feet_iron: "iron_boots",
  legs_iron: "iron_greaves",
  shoulder_chain: "shoulders_chain",
  wrist_chain: "wrist_chain",
  legs_chain: "legs_chain",
};

for (const [itemId, fileId] of Object.entries(ICON_ALIASES)) {
  const item = ITEMS[itemId];
  if (!item) continue;
  if (!item.iconFallback) {
    item.iconFallback = typeof item.icon === "string" && !item.icon.startsWith("assets/")
      ? item.icon
      : SLOT_ICON[item.slot] || "❔";
  }
  item.icon = `assets/icons/${fileId}.webp`;
}

// Обратный поиск «имя файла → id предмета» — чтобы эмодзи-заглушка
// находилась и для иконок с несовпадающим именем файла.
// Если имя файла совпадает с id реального предмета (iron_shield), файл
// принадлежит этому предмету, а не алиасу.
const ICON_ITEM_BY_FILE = Object.fromEntries(
  Object.entries(ICON_ALIASES)
    .filter(([, fileId]) => !ITEMS[fileId])
    .map(([itemId, fileId]) => [fileId, itemId])
);

// Текстовая (эмодзи) иконка предмета — для тостов и строк лога.
function itemEmoji(item) {
  if (!item) return "";
  if (item.iconFallback) return item.iconFallback;
  if (typeof item.icon === "string" && !item.icon.startsWith("assets/")) return item.icon;
  return SLOT_ICON[item.slot] || "";
}

const MOB_ICONS = {
  goblin_scout: "assets/mobs/goblin_scout.webp",
  hobgoblin: "assets/mobs/hobgoblin.webp",
  bugbear: "assets/mobs/bugbear.webp",
  goblin_chief: "assets/mobs/goblin_chief.webp",
  kobold_miner: "assets/mobs/kobold_miner.webp",
  kobold_servant: "assets/mobs/kobold_servant.webp",
  kobold_overseer: "assets/mobs/kobold_overseer.webp",
  dragonborn: "assets/mobs/dragonborn.webp",
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

// ── Роли мобов: тактические повадки (Блок 1) ───────────────────────────────
// blocksBonus меняет число закрываемых зон, atkMult — множитель урона.
// healer лечится, если игрок промахнулся в прошлом ходу; rogue уворачивается.
const MOB_ROLES = {
  tank:      { name: "Танк",     icon: "🛡️", blocksBonus: 2,  atkMult: 0.8, desc: "Блокирует больше зон, но бьёт слабее." },
  dps:       { name: "Боец",     icon: "⚔️", blocksBonus: 0,  atkMult: 1.2, desc: "Бьёт сильно в одну зону." },
  healer:    { name: "Целитель", icon: "💚", blocksBonus: 0,  atkMult: 0.7, healPercent: 0.15, healThreshold: 0.5, desc: "Лечится, если его не бьют." },
  berserker: { name: "Берсерк",  icon: "🔥", blocksBonus: -1, atkMult: 1.4, desc: "Бьёт в 2 зоны, но НЕ блокирует." },
  rogue:     { name: "Плут",     icon: "🗡️", blocksBonus: 0,  atkMult: 1.0, dodgeBonus: 20, desc: "Не блокирует, но уворачивается." },
};

const FLOORS = [
  { id: 1, name: "Тёмный Лес", subtitle: "Гиблое место, облюбованное гоблинскими племенами", icon: "🕳️",
    desc: "Лес, который не подчиняется законам природы. Деревья растут из камня, а звери не боятся огня. Гоблины здесь не живут — они прячутся. В корнях, что помнят другой мир.",
    cardImg: "assets/backgrounds/duskwood.webp",
    bg: "assets/backgrounds/duskwood.webp",
    mobs: [
      enemy({ role: "rogue", id: "goblin_scout", name: "Гоблин-разведчик", icon: "goblin_scout", hp: 126, atk: 24, def: 3, gold: 25, xp: 40, armorType: "leather", weapons: ["rusty_knife", "short_sword", "wood_club", "battle_axe"], prefers: ["legs", "belly"], desc: "Мелкий и юркий. Пытается зайти со спины и пырнуть ножом в бок.",
        drops: [
          { id: "rust", chance: 0.35, min: 1, max: 2 },
          { id: "cloth", chance: 0.25, min: 1, max: 2 },
        ] }),
      enemy({ role: "dps", id: "hobgoblin", name: "Хобгоблин", icon: "hobgoblin", hp: 189, atk: 31, def: 6, gold: 35, xp: 55, armorType: "leather", weapons: ["wood_club", "short_sword", "battle_axe"], prefers: ["head", "chest"], desc: "Крупнее и злее своих сородичей. Носит грубые кожаные доспехи и машет дубиной.",
        drops: [
          { id: "leather", chance: 0.30, min: 1, max: 2 },
          { id: "wood", chance: 0.20, min: 1, max: 2 },
        ] }),
      enemy({ role: "berserker", id: "bugbear", name: "Багбир", icon: "bugbear", hp: 279, atk: 41, def: 10, gold: 50, xp: 75, armorType: "leather", weapons: ["wood_club", "battle_axe"], prefers: ["chest", "belly"], desc: "Медлительный и уродливый гигант. Каждый его удар проламывает кости.",
        drops: [
          { id: "bone", chance: 0.35, min: 1, max: 3 },
          { id: "iron_ore", chance: 0.20, min: 1, max: 1 },
        ] }),
    ],
    boss: enemy({ role: "berserker", id: "goblin_chief", name: "Вождь Гоблинов", icon: "goblin_chief", hp: 1080, atk: 54, def: 14, gold: 250, xp: 300, armorType: "plate", prefers: ["head", "chest", "belly"], boss: true, enrage: true, desc: "Огромный, покрытый шрамами гоблин. Вооружен ржавым тесаком. В ярости его удары сокрушают всё.",
      drops: [
        { id: "gambeson", chance: 1.0, min: 1, max: 1, kind: "item" },
        { id: "malachite", chance: 0.60, min: 2, max: 3 },
      ] }),
  },
  // === FLOORS[1] — Кобольды (шахты) ===
  { id: 2, name: "Шахты Кобольдов", subtitle: "Под землёй стучат кирки, и стук всё ближе", icon: "⚙️",
    desc: "Шахты, вырубленные в теле мира. Кобольды добывают руду, которой нет в нашем мире. Стук кирок не смолкает — он просто становится ближе.",
    cardImg: "assets/backgrounds/mines.webp",
    bg: "assets/backgrounds/mines.webp",
    mobs: [
      enemy({ role: "dps", id: "kobold_servant", name: "Кобольд-слуга", icon: "kobold_servant", hp: 320, atk: 42, def: 8, gold: 55, xp: 75, armorType: "cloth", weapons: ["rusty_knife", "wood_club", "short_sword"], prefers: ["waist", "legs"],
        desc: "Тощий кобольд в грязном тряпье, вечно таскающий инструменты за старшими. В драку лезет неохотно, но бьёт низко — в пояс и ноги, норовя подрезать сухожилия.",
        drops: [
          { id: "copper_ore", chance: 0.35, min: 1, max: 2 },
          { id: "cave_mushroom", chance: 0.3, min: 1, max: 2 },
          { id: "kobold_gear", chance: 0.25, min: 1, max: 1 },
        ] }),
      enemy({ role: "tank", id: "kobold_miner", name: "Кобольд-рудокоп", icon: "kobold_miner", hp: 400, atk: 48, def: 12, gold: 68, xp: 90, armorType: "leather", weapons: ["mace", "short_sword", "rusty_knife"], prefers: ["waist", "legs"],
        desc: "Маленький, горбатый от многолетней работы в забое. Размахивает киркой, целясь в ноги и пояс — туда, где металл не прикрывает тело.",
        drops: [
          { id: "copper_ore", chance: 0.4, min: 1, max: 2 },
          { id: "tin_ore", chance: 0.3, min: 1, max: 2 },
          { id: "cold_iron_ingot", chance: 0.2, min: 1, max: 1 },
          { id: "kobold_gear", chance: 0.2, min: 1, max: 1 },
        ] }),
      enemy({ role: "tank", id: "kobold_overseer", name: "Кобольд-надсмотрщик", icon: "kobold_overseer", hp: 500, atk: 56, def: 18, gold: 82, xp: 110, armorType: "chain", weapons: ["mace", "short_sword", "battle_axe"], prefers: ["belly", "chest"], blocks: 2,
        desc: "Широкоплечий кобольд в кольчуге, с плетью на поясе и тяжёлой булавой в лапе. Гоняет сородичей в забой и бьёт в живот и грудь, не давая опомниться.",
        drops: [
          { id: "cold_iron_ingot", chance: 0.3, min: 1, max: 2 },
          { id: "steel", chance: 0.2, min: 1, max: 1 },
          { id: "kobold_gear", chance: 0.3, min: 1, max: 2 },
        ] }),
    ],
    boss: enemy({ role: "tank", id: "dragonborn", name: "Драконид", icon: "dragonborn", hp: 1728, atk: 92, def: 26, gold: 660, xp: 880, armorType: "plate", weapons: ["steel_great_sword"], prefers: ["chest", "head"], blocks: 3, boss: true, enrage: true,
      desc: "Чешуйчатый гигант в тяжёлых латах, поднявшийся из глубин вместе с кобольдами. Двуручный клинок в его лапах описывает широкую дугу, доставая сразу две зоны.",
      drops: [
        { id: "cold_iron_chest", chance: 1.0, min: 1, max: 1, kind: "item" },
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
      enemy({ role: "dps", id: "skeleton_warrior", name: "Скелет-воин", icon: "skeleton_warrior", hp: 504, atk: 62, def: 22, gold: 96, xp: 136, armorType: "chain", weapons: ["short_sword", "spear", "battle_axe"], prefers: ["chest", "legs"],
        desc: "Восставший из старой могилы скелет, стиснувший ржавый клинок. Бьёт по корпусу и ногам, не зная ни боли, ни усталости.",
        drops: [
          { id: "bone", chance: 0.4, min: 1, max: 2 },
          { id: "grave_iron", chance: 0.25, min: 1, max: 2 },
          { id: "copper_ore", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ role: "rogue", id: "unquiet_ghost", name: "Неупокоенный призрак", icon: "unquiet_ghost", hp: 567, atk: 66, def: 18, gold: 108, xp: 150, armorType: "cloth", weapons: ["staff"], prefers: ["head", "belly"],
        desc: "Полупрозрачный силуэт, что тянет к вам ледяные пальцы. Его шёпот ввинчивается в голову, а удары проходят сквозь броню.",
        drops: [
          { id: "rune_dust", chance: 0.35, min: 1, max: 2 },
          { id: "cursed_cloth", chance: 0.25, min: 1, max: 2 },
          { id: "tin_ore", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ role: "berserker", id: "crypt_ghoul", name: "Упырь", icon: "crypt_ghoul", hp: 630, atk: 72, def: 24, gold: 120, xp: 160, armorType: "cloth", weapons: ["claws"], unarmedStyle: "piercing", prefers: ["waist", "chest"],
        desc: "Сгорбленный пожиратель падали с длинными когтями. Рвётся к животу и поясу, чтобы добраться до плоти.",
        drops: [
          { id: "bone", chance: 0.35, min: 1, max: 2 },
          { id: "grave_iron", chance: 0.25, min: 1, max: 2 },
          { id: "kobold_gear", chance: 0.2, min: 1, max: 2 },
        ] }),
    ],
    boss: enemy({ role: "tank", id: "dark_knight", name: "Тёмный Рыцарь", icon: "dark_knight", hp: 2520, atk: 115, def: 34, gold: 960, xp: 1280, armorType: "plate", weapons: ["great_sword"], prefers: ["head", "chest", "belly"], boss: true, enrage: true,
      desc: "Павший паладин, чьи латы покрыты пеплом и копотью. В ярости его клинок крошит камень и кости.",
      drops: [
        { id: "steel_chest", chance: 1.0, min: 1, max: 1, kind: "item" },
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
      enemy({ role: "dps", id: "orc_raider", name: "Орк-налётчик", icon: "🐗", hp: 828, atk: 91, def: 32, gold: 145, xp: 205, armorType: "chain", weapons: ["battle_axe", "mace", "short_sword"], prefers: ["head", "chest"],
        desc: "Свирепый налётчик, чья секира помнит десятки черепов. Рубит сверху, целясь в голову и грудь.",
        drops: [
          { id: "iron_chain", chance: 0.35, min: 1, max: 2 },
          { id: "orc_tusk", chance: 0.3, min: 1, max: 2 },
          { id: "bone", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ role: "healer", id: "orc_shaman", name: "Орк-шаман", icon: "🐺", hp: 900, atk: 96, def: 30, gold: 158, xp: 215, armorType: "cloth", weapons: ["staff"], prefers: ["belly", "waist"],
        desc: "Шаман, обвешанный костями и амулетами. Его проклятия бьют в живот и пояс, пока он бормочет боевые молитвы.",
        drops: [
          { id: "blood_herb", chance: 0.35, min: 1, max: 2 },
          { id: "war_crystal", chance: 0.25, min: 1, max: 2 },
          { id: "rune_dust", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ role: "berserker", id: "ogre_brute", name: "Огр-громила", icon: "👹", hp: 990, atk: 102, def: 40, gold: 170, xp: 230, armorType: "plate", weapons: ["war_hammer", "battle_axe", "great_axe"], prefers: ["chest", "legs"],
        desc: "Гора мяса и шрамов, вооружённая вырванным из земли валуном. Бьёт по груди и ногам — медленно, но смертельно.",
        drops: [
          { id: "mithril_ore", chance: 0.35, min: 1, max: 2 },
          { id: "orc_tusk", chance: 0.3, min: 1, max: 2 },
          { id: "silver", chance: 0.2, min: 1, max: 2 },
        ] }),
    ],
    boss: enemy({ role: "berserker", id: "orc_warlord", name: "Вождь орков", icon: "🐗", hp: 3960, atk: 163, def: 56, gold: 1360, xp: 1840, armorType: "plate", weapons: ["war_hammer"], prefers: ["head", "chest", "belly"], boss: true, enrage: true,
      desc: "Вождь, чьи латы кованы из обломков осадных машин. В ярости он сминает строй одним ударом.",
      drops: [
        { id: "mithril_chest", chance: 1.0, min: 1, max: 1, kind: "item" },
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
      enemy({ role: "rogue", id: "fire_imp", name: "Огненный бес", icon: "🔥", hp: 918, atk: 125, def: 26, gold: 184, xp: 274, armorType: "cloth", weapons: ["dagger", "staff"], prefers: ["belly", "waist"],
        desc: "Мелкий бес, объятый пламенем, что хихикает из дыма. Жалит в живот и пояс, пока вы ищете его в огне.",
        drops: [
          { id: "brimstone", chance: 0.35, min: 1, max: 2 },
          { id: "infernal_ash", chance: 0.3, min: 1, max: 2 },
          { id: "war_crystal", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ role: "dps", id: "hell_hound", name: "Адская гончая", icon: "🐺", hp: 990, atk: 130, def: 33, gold: 190, xp: 280, armorType: "leather", weapons: ["claws", "dagger"], unarmedStyle: "piercing", prefers: ["head", "chest"],
        desc: "Адская гончая с глазами-углями и клыками длиной в кинжал. Рвётся к горлу и груди.",
        drops: [
          { id: "hellstone", chance: 0.35, min: 1, max: 2 },
          { id: "demon_horn", chance: 0.25, min: 1, max: 2 },
          { id: "iron_chain", chance: 0.2, min: 1, max: 2 },
        ] }),
      enemy({ role: "tank", id: "horned_devil", name: "Рогатый дьявол", icon: "🐏", hp: 1080, atk: 138, def: 40, gold: 200, xp: 290, armorType: "plate", weapons: ["war_hammer", "great_sword", "halberd"], prefers: ["chest", "head"],
        desc: "Рогатый дьявол в багровых латах, вооружённый чёрным клинком. Бьёт в грудь и голову, наслаждаясь чужой болью.",
        drops: [
          { id: "demon_horn", chance: 0.35, min: 1, max: 2 },
          { id: "void_crystal", chance: 0.25, min: 1, max: 2 },
          { id: "mithril_ore", chance: 0.2, min: 1, max: 2 },
        ] }),
    ],
    boss: enemy({ role: "dps", id: "demon_lord", name: "Владыка Бездны", icon: "👹", hp: 4320, atk: 221, def: 56, gold: 1600, xp: 2320, armorType: "plate", weapons: ["halberd"], prefers: ["head", "chest", "belly"], boss: true, enrage: true,
      desc: "Владыка Бездны, чей трон выкован из проклятых душ. В ярости его удары рвут саму реальность.",
      drops: [
        { id: "set_hellblade_chest", chance: 1.0, min: 1, max: 1, kind: "item" },
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

// ── Сюжетные квесты (глобальное обновление) ─────────────────────────────────
// Отдельно от недельных: выдаёт конкретный NPC, когда state.maxFloor >= reqFloor.
// Один раз за прохождение (id уходит в completedStoryQuests после сдачи).
// objectives: { kill: "mobId" } или { res: "resId", count: N }.
// reward: { gold, xp, rep, item, itemCount, recipe, potions } — всё опционально.
const STORY_QUESTS = [
  {
    id: "sq_ron_mithril_ore",
    npc: "ron",
    reqFloor: 4,
    title: "Мифрил для Рона",
    text: "Слышал, в Лагере Орков жилы мифрила блестят на солнце. Принеси 5 мифриловой руды — я сакую из неё что-то стоящее и заплачу щедро.",
    objectives: { res: "mithril_ore", count: 5 },
    reward: { gold: 1000, xp: 400, rep: 5, recipe: "recipe_mithril_sword" },
  },
  {
    id: "sq_elain_cave_mushroom",
    npc: "elain",
    reqFloor: 2,
    title: "Грибы из глубин",
    text: "Пещерные грибы из Шахт Кобольдов — основа половины моих отваров, но мои запасы кончились. Принеси 4 штуки, и я не останусь в долгу.",
    objectives: { res: "cave_mushroom", count: 4 },
    reward: { gold: 300, xp: 200, rep: 3, item: "hp_big", itemCount: 2 },
  },
  {
    id: "sq_elize_rune_dust",
    npc: "elize",
    reqFloor: 3,
    title: "Рунная пыль для оправы",
    text: "Неупокоенные призраки таскают при себе рунную пыль. Мне нужно 3 щепотки — хочу опробовать новую оправу. Только не рассыпь её по пути.",
    objectives: { res: "rune_dust", count: 3 },
    reward: { gold: 500, xp: 300, rep: 3, item: "ring_silver" },
  },
  {
    id: "sq_stella_crypt_ghoul",
    npc: "stella",
    reqFloor: 3,
    title: "Спокойствие для постояльцев",
    text: "Неупокоенные из Древнего Склепа пугают постояльцев, а упыри и того хуже. Справься с упырём — и я буду встречать тебя как собственного героя.",
    objectives: { kill: "crypt_ghoul" },
    reward: { gold: 350, xp: 250, item: "hp_big", itemCount: 2 },
  },
  {
    id: "sq_ivan_goblin_chief",
    npc: "ivan",
    reqFloor: 1,
    title: "По головам Гоблинов",
    text: "Вождь Гоблинов треплет караваны возле Йорстеда. Сруби ему башку — и я поставлю тебя в пример каждому новобранцу.",
    objectives: { kill: "goblin_chief" },
    reward: { gold: 600, xp: 500, potions: 2 },
  },
];

const STORY_QUEST_MAP = Object.fromEntries(STORY_QUESTS.map((q) => [q.id, q]));

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

// ── Обмен ресурсов (Этап 3): у Рона 50 любых ресурсов 1-го этажа → 1 редкий ─
const EXCHANGE_AMOUNT = 50;
const EXCHANGE_TARGET_RES = "mithril_ore";

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
// resolveFloorEventAction (actions.js); рендерит renderFloorEventModal (ui.js).
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

// ── Уникальные события компаньонов (Блок 3) ────────────────────────────────
// Формат совместим с FLOOR_EVENTS, но floor: null — обычный rollFloorEvent их
// не выбирает. Раз в exploreFloor есть отдельный бросок COMPANION_EVENT_CHANCE.
const COMPANION_EVENTS = [
  {
    id: "mira_herb_altar", companion: "mira", floor: null, type: "altar",
    title: "Забытый алтарь", icon: "🌿",
    text: "Мира останавливается у замшелого алтаря: между камнями проросли бледные травы, которых не должно быть в этой тьме.",
    actions: [
      { id: "gather", label: "🌿 Собрать травы", outcomes: [
        { chance: 0.60, text: "Мира срезает стебли и заворачивает их в платок.", effects: { potion: "hp_small", rep: ["alchemists", 1] } },
        { chance: 0.40, text: "Травы оказались пустышками, зато под камнем блеснула монета.", effects: { gold: [10, 25] } },
      ] },
      { id: "pray", label: "🕯 Постоять в тишине", outcomes: [
        { chance: 1, text: "Мира шепчет короткую молитву. На душе становится легче.", effects: { xp: 20 } },
      ] },
      { id: "leave", label: "🚶 Пройти мимо", outcomes: [ { chance: 1, text: "Мира недовольно качает головой, но идёт дальше.", effects: {} } ] },
    ],
  },
  {
    id: "alva_singing_hall", companion: "alva", floor: null, type: "altar",
    title: "Поющий зал", icon: "🎼",
    text: "Альва замирает: под сводами проносится едва слышная нота. Камень отзывается, будто помнит чей-то голос.",
    actions: [
      { id: "listen", label: "🎼 Вслушаться", outcomes: [
        { chance: 0.65, text: "Альва подхватывает мелодию, и в голове проясняется.", effects: { xp: 35 } },
        { chance: 0.35, text: "Звук обрывается, оставив после себя холодную тишину.", effects: { hp: [4, 10] } },
      ] },
      { id: "answer", label: "🎶 Ответить песней", outcomes: [
        { chance: 1, text: "Альва улыбается — впервые за весь день.", effects: { rep: ["jewelers", 1] } },
      ] },
      { id: "leave", label: "🚶 Уйти", outcomes: [ { chance: 1, text: "Альва идёт дальше, но ещё долго оглядывается.", effects: {} } ] },
    ],
  },
  {
    id: "solveig_wolf_trail", companion: "solveig", floor: null, type: "beast",
    title: "Волчья тропа", icon: "🐺",
    text: "Сольвейг приседает и касается следов на камне: свежие, глубокие. Впереди кто-то большой и голодный.",
    actions: [
      { id: "track", label: "🐺 Пойти по следу", outcomes: [
        { chance: 0.55, text: "Вы находите обглоданную тушу и кошель при ней.", effects: { gold: [25, 50] } },
        { chance: 0.45, text: "След обрывается, а из темноты доносится рычание.", effects: { skirmish: [0] } },
      ] },
      { id: "howl", label: "🌕 Ответить воем", outcomes: [
        { chance: 1, text: "Сольвейг хохочет. Дальше идёте тише — но веселее.", effects: { xp: 25 } },
      ] },
      { id: "leave", label: "🚶 Обойти тропу", outcomes: [ { chance: 1, text: "Сольвейг пожимает плечами: «В другой раз».", effects: {} } ] },
    ],
  },
  {
    id: "mira_food", companion: "mira", floor: null, type: "food",
    title: "Походная похлёбка", icon: "🍲",
    text: "Мира разводит маленький костёр прямо на каменном полу. «Сядь. Ты не ел нормально уже давно. Я вижу по глазам.»",
    actions: [
      { id: "eat", label: "🍲 Съесть всё", outcomes: [
        { chance: 1, text: "Похлёбка обжигает и оживляет. Мира довольно кивает: «Вот. Уже похож на человека.»", effects: { buff: "mira_food", affinity: 2, xp: 15 } },
      ] },
      { id: "share", label: "🥄 Поделиться с ней", outcomes: [
        { chance: 1, text: "Мира сначала отказывается, потом берёт ложку. Ест молча, но как-то теплее.", effects: { buff: "mira_food", affinity: 2, xp: 10 } },
      ] },
      { id: "leave", label: "🚶 Отказаться", outcomes: [
        { chance: 1, text: "«Как хочешь. Голод — тоже учитель. Только злой.»", effects: { affinity: -1 } },
      ] },
    ],
  },
  {
    id: "alva_song", companion: "alva", floor: null, type: "song",
    title: "Песня под сводами", icon: "🎼",
    text: "Альва останавливается и тихо начинает петь. Камень вокруг будто дышит в такт. «Не подпевай. Просто слушай.»",
    actions: [
      { id: "listen", label: "🎼 Слушать", outcomes: [
        { chance: 1, text: "Песня проходит через тело, как холодная вода. Боль уходит. Мысли — тоже.", effects: { buff: "alva_song", affinity: 2, xp: 15 } },
      ] },
      { id: "join", label: "🎶 Подпеть", outcomes: [
        { chance: 1, text: "Альва вздрагивает, но не останавливается. Когда песня смолкает, она смотрит на тебя иначе.", effects: { buff: "alva_song", affinity: 2, xp: 10 } },
      ] },
      { id: "leave", label: "🚶 Уйти", outcomes: [
        { chance: 1, text: "«Иди. Некоторые песни не для чужих ушей.»", effects: { affinity: -1 } },
      ] },
    ],
  },
  {
    id: "solveig_gear", companion: "solveig", floor: null, type: "gear",
    title: "Осмотр снаряжения", icon: "🛠️",
    text: "Сольвейг без предупреждения пинает тебя в бок. «Стой ровно. Если я вижу дыру в защите — её увидит и тварь.»",
    actions: [
      { id: "accept", label: "🛠️ Дать осмотреть снаряжение", outcomes: [
        { chance: 1, text: "Она дёргает ремни, подтягивает пряжки и хлопает по плечу. «Теперь не развалишься. Наверное.»", effects: { buff: "solveig_gear", affinity: 2, xp: 10 } },
      ] },
      { id: "train", label: "⚔️ Попросить научить", outcomes: [
        { chance: 1, text: "Сольвейг ухмыляется и ставит тебя в стойку. «Дыши. Бей. Не жди. Ещё раз.»", effects: { buff: "solveig_gear", affinity: 2, xp: 20 } },
      ] },
      { id: "leave", label: "🚶 Отмахнуться", outcomes: [
        { chance: 1, text: "«Твоя броня. Твои дырки. Твои похороны.»", effects: { affinity: -1 } },
      ] },
    ],
  },
];
const COMPANION_EVENT_MAP = Object.fromEntries(COMPANION_EVENTS.map((e) => [e.id, e]));
const COMPANION_EVENT_CHANCE = 0.10;
// События компаньонов должен видеть общий резолвер floor-событий.
for (const ev of COMPANION_EVENTS) FLOOR_EVENTS[ev.id] = ev;

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
  { id: "recipe_iron_chainmail", station: "forge", result: "iron_chainmail", desc: "Железная кольчуга", floor: 1, dropChance: 0.05, materials: { iron_ore: 6, rust: 4 } },
  { id: "recipe_wood_club", station: "forge", result: "wood_club", desc: "Дубина", floor: 1, dropChance: 0.05, materials: { wood: 3, rust: 2 } },
  { id: "recipe_wood_shield", station: "forge", result: "wood_shield", desc: "Деревянный щит", floor: 1, dropChance: 0.05, materials: { wood: 5, malachite: 3 } },
  { id: "recipe_iron_shield", station: "forge", result: "iron_shield", desc: "Железный щит", floor: 1, dropChance: 0.05, materials: { iron_ore: 6, wood: 2, leather: 2 } },
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
  { id: "recipe_parrying_dagger", station: "forge", result: "parrying_dagger", desc: "Кинжал парирования", floor: 2, dropChance: 0.05, materials: { copper_ore: 4, leather: 2, steel: 1 } },
  
  { id: "recipe_leather", station: "forge", result: "leather_armor", desc: "Кожаный доспех", floor: 2, dropChance: 0.05, materials: { leather: 6, cloth: 3, iron_ore: 1 } },
  { id: "recipe_wanderer_coat", station: "forge", result: "wanderer_coat", desc: "Плащ странника", floor: 2, dropChance: 0.05, materials: { cloth: 5, leather: 2, wood: 1 } },
  { id: "recipe_head_iron", station: "forge", result: "head_iron", desc: "Железный шлем", floor: 2, dropChance: 0.05, materials: { copper_ore: 5, leather: 2 } },
  { id: "recipe_shoulder_leather", station: "forge", result: "shoulder_leather", desc: "Кожаные наплечники", floor: 2, dropChance: 0.05, materials: { leather: 4, iron_ore: 1 } },
  { id: "recipe_wrist_leather", station: "forge", result: "wrist_leather", desc: "Кожаные наручи", floor: 2, dropChance: 0.05, materials: { leather: 3, cloth: 1 } },
  { id: "recipe_legs_leather", station: "forge", result: "legs_leather", desc: "Кожаные штаны", floor: 2, dropChance: 0.05, materials: { leather: 5, cloth: 2 } },
  { id: "recipe_feet_leather", station: "forge", result: "feet_leather", desc: "Кожаные сапоги", floor: 2, dropChance: 0.05, materials: { leather: 4, cloth: 2 } },
  
  // Сталь (Тир 2)
  { id: "recipe_dense_cloth", station: "forge", result: "dense_cloth", desc: "Плотная ткань", floor: 2, dropChance: 0.05, materials: { steel: 2, cloth: 5, tin_ore: 2 } },
  { id: "recipe_steel_chainmail", station: "forge", result: "steel_chainmail", desc: "Стальная кольчуга", floor: 2, dropChance: 0.05, materials: { steel: 5, copper_ore: 4, leather: 2 } },
  { id: "recipe_steel_plate", station: "forge", result: "steel_plate", desc: "Стальные латы", floor: 2, dropChance: 0.05, materials: { steel: 8, copper_ore: 5, leather: 2 } },
  { id: "recipe_steel_short_sword", station: "forge", result: "steel_short_sword", desc: "Стальной короткий меч", floor: 2, dropChance: 0.05, materials: { steel: 4, copper_ore: 2, leather: 1 } },
  { id: "recipe_steel_great_sword", station: "forge", result: "steel_great_sword", desc: "Стальной двуручный меч", floor: 2, dropChance: 0.05, materials: { steel: 8, copper_ore: 4, leather: 2 } },
  { id: "recipe_steel_rapier", station: "forge", result: "steel_rapier", desc: "Стальная рапира", floor: 2, dropChance: 0.05, materials: { steel: 5, cold_iron_ingot: 2, leather: 1 } },
  { id: "recipe_steel_axe", station: "forge", result: "steel_axe", desc: "Стальной топор", floor: 2, dropChance: 0.05, materials: { steel: 5, copper_ore: 3 } },
  { id: "recipe_steel_mace", station: "forge", result: "steel_mace", desc: "Стальная булава", floor: 2, dropChance: 0.05, materials: { steel: 6, copper_ore: 3 } },
  { id: "recipe_steel_maul", station: "forge", result: "steel_maul", desc: "Стальной молот", floor: 2, dropChance: 0.05, materials: { steel: 10, wood: 2 } },
  { id: "recipe_steel_spear", station: "forge", result: "steel_spear", desc: "Стальное копьё", floor: 2, dropChance: 0.05, materials: { steel: 6, wood: 5 } },
  { id: "recipe_tower_shield", station: "forge", result: "tower_shield", desc: "Укрепленный башенный щит", floor: 2, dropChance: 0.05, materials: { steel: 6, copper_ore: 4, leather: 2 } },
  { id: "recipe_hood_mage", station: "forge", result: "hood_mage", desc: "Капюшон чародея", floor: 2, dropChance: 0.05, materials: { steel: 2, cloth: 4, tin_ore: 2 } },
  { id: "recipe_scout_gloves", station: "forge", result: "scout_gloves", desc: "Разведческие перчатки", floor: 2, dropChance: 0.05, materials: { iron_ore: 2, leather: 5 } },
  { id: "recipe_scout_boots", station: "forge", result: "scout_boots", desc: "Сапоги разведчика", floor: 2, dropChance: 0.05, materials: { iron_ore: 3, leather: 6 } },
  
  // Ювелирка 2-го этажа
  { id: "recipe_ring_silver", station: "jewelry", result: "ring_silver", desc: "Кольцо из холодного серебра", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 4, kobold_gear: 2 } },
  { id: "recipe_neck_guard", station: "jewelry", result: "neck_guard", desc: "Медальон караульного", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 5, tin_ore: 3 } },
  { id: "recipe_plate_gorget", station: "jewelry", result: "plate_gorget", desc: "Латный воротник", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 3, steel: 4, leather: 2 } },

  // ── 2-Й ЭТАЖ (Холодное железо/сет «Рудокоп») ──
  { id: "recipe_cold_iron_sword", station: "forge", result: "cold_iron_sword", desc: "Меч из холодного железа", floor: 2, dropChance: 0.05, materials: { copper_ore: 4, tin_ore: 2, cold_iron_ingot: 2 } },
  { id: "recipe_cold_iron_axe", station: "forge", result: "cold_iron_axe", desc: "Топор из холодного железа", floor: 2, dropChance: 0.05, materials: { copper_ore: 4, tin_ore: 3, cold_iron_ingot: 2 } },
  { id: "recipe_cold_iron_mace", station: "forge", result: "cold_iron_mace", desc: "Булава из холодного железа", floor: 2, dropChance: 0.05, materials: { copper_ore: 5, tin_ore: 2, cold_iron_ingot: 3 } },
  { id: "recipe_cold_iron_shield", station: "forge", result: "cold_iron_shield", desc: "Щит из холодного железа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 2, copper_ore: 3, tin_ore: 1 } },
  { id: "recipe_cold_iron_head", station: "forge", result: "cold_iron_head", desc: "Шлем из холодного железа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 2, copper_ore: 2 } },
  { id: "recipe_cold_iron_chest", station: "forge", result: "cold_iron_chest", desc: "Нагрудник из холодного железа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 4, copper_ore: 3, tin_ore: 2 } },
  { id: "recipe_cold_iron_hands", station: "forge", result: "cold_iron_hands", desc: "Перчатки из холодного железа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, copper_ore: 2, tin_ore: 1 } },
  { id: "recipe_cold_iron_feet", station: "forge", result: "cold_iron_feet", desc: "Сапоги из холодного железа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 2, copper_ore: 2, tin_ore: 2 } },
  { id: "recipe_cold_iron_ring", station: "jewelry", result: "cold_iron_ring", desc: "Кольцо из холодного железа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, copper_ore: 2 } },
  { id: "recipe_cold_iron_neck", station: "jewelry", result: "cold_iron_neck", desc: "Амулет из холодного железа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 2, copper_ore: 1, tin_ore: 1 } },
  // Сет «Рудокоп» (холодное железо, этаж 2)
  { id: "recipe_set_miner_head", station: "forge", result: "set_miner_head", desc: "Шлем рудокопа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, kobold_gear: 1, copper_ore: 2 } },
  { id: "recipe_set_miner_chest", station: "forge", result: "set_miner_chest", desc: "Доспех рудокопа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 3, kobold_gear: 2, copper_ore: 3 } },
  { id: "recipe_set_miner_legs", station: "forge", result: "set_miner_legs", desc: "Штаны рудокопа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 2, copper_ore: 3, tin_ore: 2 } },
  { id: "recipe_set_miner_hands", station: "forge", result: "set_miner_hands", desc: "Перчатки рудокопа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, kobold_gear: 1, tin_ore: 2 } },
  { id: "recipe_set_miner_feet", station: "forge", result: "set_miner_feet", desc: "Сапоги рудокопа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, copper_ore: 2, tin_ore: 2 } },

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
  { id: "recipe_hell_ring", station: "jewelry", result: "hell_ring", desc: "Кольцо из адского камня", floor: 5, dropChance: 0.05, materials: { hellstone: 3, demon_horn: 1, void_crystal: 2 } },
  { id: "recipe_hell_trinket", station: "jewelry", result: "hell_trinket", desc: "Амулет из адского камня", floor: 5, dropChance: 0.05, materials: { hellstone: 2, brimstone: 2, void_crystal: 2 } },
  // Сет «Адский клинок» (адский камень, этаж 5)
  { id: "recipe_set_hellblade_head", station: "forge", result: "set_hellblade_head", desc: "Шлем адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 4, demon_horn: 2, void_crystal: 1 } },
  { id: "recipe_set_hellblade_chest", station: "forge", result: "set_hellblade_chest", desc: "Кираса адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 6, demon_horn: 3, void_crystal: 1 } },
  { id: "recipe_set_hellblade_legs", station: "forge", result: "set_hellblade_legs", desc: "Поножи адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 5, brimstone: 2, demon_horn: 2 } },
  { id: "recipe_set_hellblade_hands", station: "forge", result: "set_hellblade_hands", desc: "Рукавицы адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 4, demon_horn: 2, brimstone: 1 } },
  { id: "recipe_set_hellblade_feet", station: "forge", result: "set_hellblade_feet", desc: "Сапоги адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 4, brimstone: 2, demon_horn: 2 } },

  // ══════════════════════════════════════════════════════════════════════════
  // РЕЦЕПТЫ СЕТОВ БРОНИ: 8 на сет (160 предметов). Только ресурсы своего этажа.
  // ══════════════════════════════════════════════════════════════════════════

  // ── Тир 1: «Грубая кольчуга» (7 новых слотов; iron_chainmail — выше) ──
  { id: "recipe_set_rough_chain_head", station: "forge", result: "set_rough_chain_head", desc: "Шлем грубой кольчуги", floor: 1, dropChance: 0.05, materials: { iron_ore: 4, rust: 2 } },
  { id: "recipe_set_rough_chain_shoulder", station: "forge", result: "set_rough_chain_shoulder", desc: "Наплечники грубой кольчуги", floor: 1, dropChance: 0.05, materials: { iron_ore: 4, rust: 2 } },
  { id: "recipe_set_rough_chain_wrist", station: "forge", result: "set_rough_chain_wrist", desc: "Наручи грубой кольчуги", floor: 1, dropChance: 0.05, materials: { iron_ore: 3, rust: 1 } },
  { id: "recipe_set_rough_chain_hands", station: "forge", result: "set_rough_chain_hands", desc: "Рукавицы грубой кольчуги", floor: 1, dropChance: 0.05, materials: { iron_ore: 3, rust: 1 } },
  { id: "recipe_set_rough_chain_waist", station: "forge", result: "set_rough_chain_waist", desc: "Пояс грубой кольчуги", floor: 1, dropChance: 0.05, materials: { iron_ore: 3, rust: 1 } },
  { id: "recipe_set_rough_chain_legs", station: "forge", result: "set_rough_chain_legs", desc: "Поножи грубой кольчуги", floor: 1, dropChance: 0.05, materials: { iron_ore: 5, rust: 3 } },
  { id: "recipe_set_rough_chain_feet", station: "forge", result: "set_rough_chain_feet", desc: "Сапоги грубой кольчуги", floor: 1, dropChance: 0.05, materials: { iron_ore: 4, rust: 2 } },

  // ── Тир 1: «Грубое железо» (7 недостающих: без head_iron) ──
  { id: "recipe_dented_plate", station: "forge", result: "dented_plate", desc: "Мятые латы", floor: 1, dropChance: 0.05, materials: { iron_ore: 8, wood: 2, leather: 2 } },
  { id: "recipe_shoulder_iron", station: "forge", result: "shoulder_iron", desc: "Железные наплечники", floor: 2, dropChance: 0.05, materials: { copper_ore: 4, leather: 2 } },
  { id: "recipe_wrist_iron", station: "forge", result: "wrist_iron", desc: "Железные наручи", floor: 1, dropChance: 0.05, materials: { iron_ore: 4, leather: 1 } },
  { id: "recipe_hands_iron", station: "forge", result: "hands_iron", desc: "Железные рукавицы", floor: 2, dropChance: 0.05, materials: { copper_ore: 3, tin_ore: 1, leather: 1 } },
  { id: "recipe_waist_plate", station: "forge", result: "waist_plate", desc: "Пояс из пластин", floor: 2, dropChance: 0.05, materials: { copper_ore: 3, leather: 2 } },
  { id: "recipe_legs_iron", station: "forge", result: "legs_iron", desc: "Железные поножи", floor: 1, dropChance: 0.05, materials: { iron_ore: 6, leather: 2 } },
  { id: "recipe_feet_iron", station: "forge", result: "feet_iron", desc: "Железные сапоги", floor: 2, dropChance: 0.05, materials: { copper_ore: 4, leather: 2 } },

  // ── Тир 1: «Из грубой кожи» (2 недостающих) ──
  { id: "recipe_head_leather", station: "forge", result: "head_leather", desc: "Кожаный капюшон", floor: 1, dropChance: 0.05, materials: { leather: 4, cloth: 2 } },
  { id: "recipe_waist_leather", station: "forge", result: "waist_leather", desc: "Кожаный ремень", floor: 1, dropChance: 0.05, materials: { leather: 3, cloth: 1, wood: 1 } },

  // ── Тир 1: «Послушник» (5 недостающих) ──
  { id: "recipe_shoulder_cloth", station: "forge", result: "shoulder_cloth", desc: "Тканевые накидки", floor: 1, dropChance: 0.05, materials: { cloth: 3, rust: 1 } },
  { id: "recipe_wrist_cloth", station: "forge", result: "wrist_cloth", desc: "Тканевые обмотки", floor: 1, dropChance: 0.05, materials: { cloth: 2, rust: 1 } },
  { id: "recipe_hands_cloth", station: "forge", result: "hands_cloth", desc: "Тканевые перчатки", floor: 1, dropChance: 0.05, materials: { cloth: 2, malachite: 1 } },
  { id: "recipe_legs_cloth", station: "forge", result: "legs_cloth", desc: "Тканевые штаны", floor: 1, dropChance: 0.05, materials: { cloth: 4, wood: 1 } },
  { id: "recipe_feet_cloth", station: "forge", result: "feet_cloth", desc: "Тканевые тапочки", floor: 1, dropChance: 0.05, materials: { cloth: 3, rust: 1 } },

  // ── Тир 2: «Сталь» (4 новых слота) ──
  { id: "recipe_steel_shoulder", station: "forge", result: "steel_shoulder", desc: "Стальные наплечники", floor: 2, dropChance: 0.05, materials: { steel: 3, copper_ore: 2 } },
  { id: "recipe_steel_wrist", station: "forge", result: "steel_wrist", desc: "Стальные наручи", floor: 2, dropChance: 0.05, materials: { steel: 2, tin_ore: 2 } },
  { id: "recipe_steel_hands", station: "forge", result: "steel_hands", desc: "Стальные рукавицы", floor: 2, dropChance: 0.05, materials: { steel: 2, copper_ore: 2 } },
  { id: "recipe_steel_waist", station: "forge", result: "steel_waist", desc: "Стальной пояс", floor: 2, dropChance: 0.05, materials: { steel: 2, tin_ore: 2 } },

  // ── Тир 2: «Стальная кольчуга» (7 новых слотов; steel_chainmail — выше) ──
  { id: "recipe_set_steel_chain_head", station: "forge", result: "set_steel_chain_head", desc: "Шлем стальной кольчуги", floor: 2, dropChance: 0.05, materials: { steel: 4, copper_ore: 2 } },
  { id: "recipe_set_steel_chain_shoulder", station: "forge", result: "set_steel_chain_shoulder", desc: "Наплечники стальной кольчуги", floor: 2, dropChance: 0.05, materials: { steel: 3, copper_ore: 2 } },
  { id: "recipe_set_steel_chain_wrist", station: "forge", result: "set_steel_chain_wrist", desc: "Наручи стальной кольчуги", floor: 2, dropChance: 0.05, materials: { steel: 2, cold_iron_ingot: 1 } },
  { id: "recipe_set_steel_chain_hands", station: "forge", result: "set_steel_chain_hands", desc: "Рукавицы стальной кольчуги", floor: 2, dropChance: 0.05, materials: { steel: 2, cold_iron_ingot: 1 } },
  { id: "recipe_set_steel_chain_waist", station: "forge", result: "set_steel_chain_waist", desc: "Пояс стальной кольчуги", floor: 2, dropChance: 0.05, materials: { steel: 2, cold_iron_ingot: 1 } },
  { id: "recipe_set_steel_chain_legs", station: "forge", result: "set_steel_chain_legs", desc: "Поножи стальной кольчуги", floor: 2, dropChance: 0.05, materials: { steel: 4, tin_ore: 2, kobold_gear: 1 } },
  { id: "recipe_set_steel_chain_feet", station: "forge", result: "set_steel_chain_feet", desc: "Сапоги стальной кольчуги", floor: 2, dropChance: 0.05, materials: { steel: 3, copper_ore: 2 } },

  // ── Тир 2: «Тёмная кожа» (3 недостающих) ──
  { id: "recipe_set_miner_shoulder", station: "forge", result: "set_miner_shoulder", desc: "Наплечники рудокопа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 2, kobold_gear: 1, copper_ore: 2 } },
  { id: "recipe_set_miner_wrist", station: "forge", result: "set_miner_wrist", desc: "Наручи рудокопа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, kobold_gear: 1, tin_ore: 2 } },
  { id: "recipe_set_miner_waist", station: "forge", result: "set_miner_waist", desc: "Пояс рудокопа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, kobold_gear: 1, tin_ore: 2 } },

  // ── Тир 2: «Подмастерье» (6 недостающих) ──
  { id: "recipe_set_apprentice_cloth_shoulder", station: "forge", result: "set_apprentice_cloth_shoulder", desc: "Накидки подмастерья", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, tin_ore: 2, cave_mushroom: 1 } },
  { id: "recipe_set_apprentice_cloth_wrist", station: "forge", result: "set_apprentice_cloth_wrist", desc: "Обмотки подмастерья", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, tin_ore: 1, cave_mushroom: 2 } },
  { id: "recipe_set_apprentice_cloth_hands", station: "forge", result: "set_apprentice_cloth_hands", desc: "Перчатки подмастерья", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, tin_ore: 1, cave_mushroom: 2 } },
  { id: "recipe_set_apprentice_cloth_waist", station: "forge", result: "set_apprentice_cloth_waist", desc: "Пояс подмастерья", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, tin_ore: 1, cave_mushroom: 2 } },
  { id: "recipe_set_apprentice_cloth_legs", station: "forge", result: "set_apprentice_cloth_legs", desc: "Штаны подмастерья", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 2, tin_ore: 2, cave_mushroom: 1 } },
  { id: "recipe_set_apprentice_cloth_feet", station: "forge", result: "set_apprentice_cloth_feet", desc: "Тапочки подмастерья", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, copper_ore: 2, cave_mushroom: 2 } },

  // ── Тир 3: «Руническая сталь» (3 недостающих) ──
  { id: "recipe_set_guard_shoulder", station: "forge", result: "set_guard_shoulder", desc: "Наплечники стража склепа", floor: 3, dropChance: 0.05, materials: { grave_iron: 4, bone: 2, silver: 1 } },
  { id: "recipe_set_guard_wrist", station: "forge", result: "set_guard_wrist", desc: "Наручи стража склепа", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 2, silver: 1 } },
  { id: "recipe_set_guard_waist", station: "forge", result: "set_guard_waist", desc: "Пояс стража склепа", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 2, cursed_cloth: 1 } },

  // ── Тир 3: «Руническая кольчуга» ──
  { id: "recipe_set_runic_chain_head", station: "forge", result: "set_runic_chain_head", desc: "Рунический кольчужный шлем", floor: 3, dropChance: 0.05, materials: { grave_iron: 4, rune_dust: 2 } },
  { id: "recipe_set_runic_chain_shoulder", station: "forge", result: "set_runic_chain_shoulder", desc: "Рунические кольчужные наплечники", floor: 3, dropChance: 0.05, materials: { grave_iron: 4, rune_dust: 2 } },
  { id: "recipe_set_runic_chain_chest", station: "forge", result: "set_runic_chain_chest", desc: "Руническая кольчуга", floor: 3, dropChance: 0.05, materials: { grave_iron: 6, rune_dust: 3, bone: 2 } },
  { id: "recipe_set_runic_chain_wrist", station: "forge", result: "set_runic_chain_wrist", desc: "Рунические кольчужные наручи", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, rune_dust: 1 } },
  { id: "recipe_set_runic_chain_hands", station: "forge", result: "set_runic_chain_hands", desc: "Рунические кольчужные рукавицы", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, rune_dust: 1 } },
  { id: "recipe_set_runic_chain_waist", station: "forge", result: "set_runic_chain_waist", desc: "Рунический кольчужный пояс", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, rune_dust: 1 } },
  { id: "recipe_set_runic_chain_legs", station: "forge", result: "set_runic_chain_legs", desc: "Рунические кольчужные поножи", floor: 3, dropChance: 0.05, materials: { grave_iron: 5, rune_dust: 2, silver: 1 } },
  { id: "recipe_set_runic_chain_feet", station: "forge", result: "set_runic_chain_feet", desc: "Рунические кольчужные сапоги", floor: 3, dropChance: 0.05, materials: { grave_iron: 4, rune_dust: 2 } },

  // ── Тир 3: «Руническая кожа» ──
  { id: "recipe_set_runic_leather_head", station: "forge", result: "set_runic_leather_head", desc: "Рунический кожаный капюшон", floor: 3, dropChance: 0.05, materials: { bone: 4, rune_dust: 1 } },
  { id: "recipe_set_runic_leather_shoulder", station: "forge", result: "set_runic_leather_shoulder", desc: "Рунические кожаные наплечники", floor: 3, dropChance: 0.05, materials: { bone: 4, rune_dust: 1 } },
  { id: "recipe_set_runic_leather_chest", station: "forge", result: "set_runic_leather_chest", desc: "Рунический кожаный доспех", floor: 3, dropChance: 0.05, materials: { bone: 6, rune_dust: 2, cursed_cloth: 1 } },
  { id: "recipe_set_runic_leather_wrist", station: "forge", result: "set_runic_leather_wrist", desc: "Рунические кожаные наручи", floor: 3, dropChance: 0.05, materials: { bone: 2, rune_dust: 1 } },
  { id: "recipe_set_runic_leather_hands", station: "forge", result: "set_runic_leather_hands", desc: "Рунические кожаные перчатки", floor: 3, dropChance: 0.05, materials: { bone: 2, rune_dust: 1 } },
  { id: "recipe_set_runic_leather_waist", station: "forge", result: "set_runic_leather_waist", desc: "Рунический кожаный ремень", floor: 3, dropChance: 0.05, materials: { bone: 2, rune_dust: 1 } },
  { id: "recipe_set_runic_leather_legs", station: "forge", result: "set_runic_leather_legs", desc: "Рунические кожаные штаны", floor: 3, dropChance: 0.05, materials: { bone: 5, rune_dust: 2, silver: 1 } },
  { id: "recipe_set_runic_leather_feet", station: "forge", result: "set_runic_leather_feet", desc: "Рунические кожаные сапоги", floor: 3, dropChance: 0.05, materials: { bone: 3, rune_dust: 1 } },

  // ── Тир 3: «Адепт» ──
  { id: "recipe_set_adept_cloth_head", station: "forge", result: "set_adept_cloth_head", desc: "Капюшон адепта", floor: 3, dropChance: 0.05, materials: { cursed_cloth: 3, rune_dust: 2 } },
  { id: "recipe_set_adept_cloth_shoulder", station: "forge", result: "set_adept_cloth_shoulder", desc: "Накидки адепта", floor: 3, dropChance: 0.05, materials: { cursed_cloth: 3, rune_dust: 1 } },
  { id: "recipe_set_adept_cloth_chest", station: "forge", result: "set_adept_cloth_chest", desc: "Роба адепта", floor: 3, dropChance: 0.05, materials: { cursed_cloth: 5, rune_dust: 3 } },
  { id: "recipe_set_adept_cloth_wrist", station: "forge", result: "set_adept_cloth_wrist", desc: "Обмотки адепта", floor: 3, dropChance: 0.05, materials: { cursed_cloth: 2, rune_dust: 1 } },
  { id: "recipe_set_adept_cloth_hands", station: "forge", result: "set_adept_cloth_hands", desc: "Перчатки адепта", floor: 3, dropChance: 0.05, materials: { cursed_cloth: 2, rune_dust: 1 } },
  { id: "recipe_set_adept_cloth_waist", station: "forge", result: "set_adept_cloth_waist", desc: "Пояс адепта", floor: 3, dropChance: 0.05, materials: { cursed_cloth: 2, rune_dust: 1 } },
  { id: "recipe_set_adept_cloth_legs", station: "forge", result: "set_adept_cloth_legs", desc: "Штаны адепта", floor: 3, dropChance: 0.05, materials: { cursed_cloth: 4, rune_dust: 2, silver: 1 } },
  { id: "recipe_set_adept_cloth_feet", station: "forge", result: "set_adept_cloth_feet", desc: "Сапоги адепта", floor: 3, dropChance: 0.05, materials: { cursed_cloth: 3, rune_dust: 1 } },

  // ── Тир 4: «Мифрил» (4 новых слота) ──
  { id: "recipe_mithril_shoulder", station: "forge", result: "mithril_shoulder", desc: "Мифриловые наплечники", floor: 4, dropChance: 0.05, materials: { mithril_ore: 4, orc_tusk: 2 } },
  { id: "recipe_mithril_wrist", station: "forge", result: "mithril_wrist", desc: "Мифриловые наручи", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, orc_tusk: 2 } },
  { id: "recipe_mithril_waist", station: "forge", result: "mithril_waist", desc: "Мифриловый пояс", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, war_crystal: 1 } },
  { id: "recipe_mithril_feet", station: "forge", result: "mithril_feet", desc: "Мифриловые сапоги", floor: 4, dropChance: 0.05, materials: { mithril_ore: 4, orc_tusk: 1, war_crystal: 1 } },

  // ── Тир 4: «Мифриловая кольчуга» ──
  { id: "recipe_set_mithril_chain_head", station: "forge", result: "set_mithril_chain_head", desc: "Мифриловый кольчужный шлем", floor: 4, dropChance: 0.05, materials: { mithril_ore: 4, iron_chain: 2 } },
  { id: "recipe_set_mithril_chain_shoulder", station: "forge", result: "set_mithril_chain_shoulder", desc: "Мифриловые кольчужные наплечники", floor: 4, dropChance: 0.05, materials: { mithril_ore: 4, iron_chain: 2 } },
  { id: "recipe_set_mithril_chain_chest", station: "forge", result: "set_mithril_chain_chest", desc: "Мифриловая кольчуга", floor: 4, dropChance: 0.05, materials: { mithril_ore: 6, iron_chain: 3, war_crystal: 1 } },
  { id: "recipe_set_mithril_chain_wrist", station: "forge", result: "set_mithril_chain_wrist", desc: "Мифриловые кольчужные наручи", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, iron_chain: 1 } },
  { id: "recipe_set_mithril_chain_hands", station: "forge", result: "set_mithril_chain_hands", desc: "Мифриловые кольчужные рукавицы", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, iron_chain: 1 } },
  { id: "recipe_set_mithril_chain_waist", station: "forge", result: "set_mithril_chain_waist", desc: "Мифриловый кольчужный пояс", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, iron_chain: 1 } },
  { id: "recipe_set_mithril_chain_legs", station: "forge", result: "set_mithril_chain_legs", desc: "Мифриловые кольчужные поножи", floor: 4, dropChance: 0.05, materials: { mithril_ore: 5, iron_chain: 2, war_crystal: 1 } },
  { id: "recipe_set_mithril_chain_feet", station: "forge", result: "set_mithril_chain_feet", desc: "Мифриловые кольчужные сапоги", floor: 4, dropChance: 0.05, materials: { mithril_ore: 4, iron_chain: 2 } },

  // ── Тир 4: «Кожа с костяными пластинами» ──
  { id: "recipe_set_bone_leather_head", station: "forge", result: "set_bone_leather_head", desc: "Шлем из костяной кожи", floor: 4, dropChance: 0.05, materials: { orc_tusk: 3, blood_herb: 2 } },
  { id: "recipe_set_bone_leather_shoulder", station: "forge", result: "set_bone_leather_shoulder", desc: "Костяные наплечники", floor: 4, dropChance: 0.05, materials: { orc_tusk: 3, blood_herb: 2 } },
  { id: "recipe_set_bone_leather_chest", station: "forge", result: "set_bone_leather_chest", desc: "Костяная кираса", floor: 4, dropChance: 0.05, materials: { orc_tusk: 5, blood_herb: 3, iron_chain: 2 } },
  { id: "recipe_set_bone_leather_wrist", station: "forge", result: "set_bone_leather_wrist", desc: "Костяные наручи", floor: 4, dropChance: 0.05, materials: { orc_tusk: 2, blood_herb: 1 } },
  { id: "recipe_set_bone_leather_hands", station: "forge", result: "set_bone_leather_hands", desc: "Костяные перчатки", floor: 4, dropChance: 0.05, materials: { orc_tusk: 2, blood_herb: 1 } },
  { id: "recipe_set_bone_leather_waist", station: "forge", result: "set_bone_leather_waist", desc: "Костяной ремень", floor: 4, dropChance: 0.05, materials: { orc_tusk: 2, blood_herb: 1 } },
  { id: "recipe_set_bone_leather_legs", station: "forge", result: "set_bone_leather_legs", desc: "Костяные штаны", floor: 4, dropChance: 0.05, materials: { orc_tusk: 4, blood_herb: 2, war_crystal: 1 } },
  { id: "recipe_set_bone_leather_feet", station: "forge", result: "set_bone_leather_feet", desc: "Костяные сапоги", floor: 4, dropChance: 0.05, materials: { orc_tusk: 3, blood_herb: 2 } },

  // ── Тир 4: «Маг» ──
  { id: "recipe_set_mage_cloth_head", station: "forge", result: "set_mage_cloth_head", desc: "Капюшон мага", floor: 4, dropChance: 0.05, materials: { war_crystal: 2, blood_herb: 3 } },
  { id: "recipe_set_mage_cloth_shoulder", station: "forge", result: "set_mage_cloth_shoulder", desc: "Накидка мага", floor: 4, dropChance: 0.05, materials: { war_crystal: 2, blood_herb: 2 } },
  { id: "recipe_set_mage_cloth_chest", station: "forge", result: "set_mage_cloth_chest", desc: "Мантия мага", floor: 4, dropChance: 0.05, materials: { war_crystal: 3, blood_herb: 4 } },
  { id: "recipe_set_mage_cloth_wrist", station: "forge", result: "set_mage_cloth_wrist", desc: "Наручи мага", floor: 4, dropChance: 0.05, materials: { war_crystal: 1, blood_herb: 2 } },
  { id: "recipe_set_mage_cloth_hands", station: "forge", result: "set_mage_cloth_hands", desc: "Перчатки мага", floor: 4, dropChance: 0.05, materials: { war_crystal: 1, blood_herb: 2 } },
  { id: "recipe_set_mage_cloth_waist", station: "forge", result: "set_mage_cloth_waist", desc: "Пояс мага", floor: 4, dropChance: 0.05, materials: { war_crystal: 1, blood_herb: 2 } },
  { id: "recipe_set_mage_cloth_legs", station: "forge", result: "set_mage_cloth_legs", desc: "Штаны мага", floor: 4, dropChance: 0.05, materials: { war_crystal: 2, blood_herb: 3 } },
  { id: "recipe_set_mage_cloth_feet", station: "forge", result: "set_mage_cloth_feet", desc: "Сапоги мага", floor: 4, dropChance: 0.05, materials: { war_crystal: 2, blood_herb: 2 } },

  // ── Тир 5: «Бездна» (3 недостающих слота) ──
  { id: "recipe_set_hellblade_shoulder", station: "forge", result: "set_hellblade_shoulder", desc: "Наплечники адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 4, demon_horn: 2, brimstone: 1 } },
  { id: "recipe_set_hellblade_wrist", station: "forge", result: "set_hellblade_wrist", desc: "Наручи адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 3, brimstone: 2, infernal_ash: 1 } },
  { id: "recipe_set_hellblade_waist", station: "forge", result: "set_hellblade_waist", desc: "Пояс адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 3, demon_horn: 1, infernal_ash: 2 } },

  // ── Тир 5: «Кольчуга Бездны» ──
  { id: "recipe_set_abyss_chain_head", station: "forge", result: "set_abyss_chain_head", desc: "Кольчужный шлем Бездны", floor: 5, dropChance: 0.05, materials: { hellstone: 4, infernal_ash: 2 } },
  { id: "recipe_set_abyss_chain_shoulder", station: "forge", result: "set_abyss_chain_shoulder", desc: "Кольчужные наплечники Бездны", floor: 5, dropChance: 0.05, materials: { hellstone: 4, infernal_ash: 2 } },
  { id: "recipe_set_abyss_chain_chest", station: "forge", result: "set_abyss_chain_chest", desc: "Кольчуга Бездны", floor: 5, dropChance: 0.05, materials: { hellstone: 6, brimstone: 3, void_crystal: 1 } },
  { id: "recipe_set_abyss_chain_wrist", station: "forge", result: "set_abyss_chain_wrist", desc: "Кольчужные наручи Бездны", floor: 5, dropChance: 0.05, materials: { hellstone: 3, infernal_ash: 1 } },
  { id: "recipe_set_abyss_chain_hands", station: "forge", result: "set_abyss_chain_hands", desc: "Кольчужные рукавицы Бездны", floor: 5, dropChance: 0.05, materials: { hellstone: 3, infernal_ash: 1 } },
  { id: "recipe_set_abyss_chain_waist", station: "forge", result: "set_abyss_chain_waist", desc: "Кольчужный пояс Бездны", floor: 5, dropChance: 0.05, materials: { hellstone: 3, infernal_ash: 1 } },
  { id: "recipe_set_abyss_chain_legs", station: "forge", result: "set_abyss_chain_legs", desc: "Кольчужные поножи Бездны", floor: 5, dropChance: 0.05, materials: { hellstone: 5, brimstone: 2, infernal_ash: 1 } },
  { id: "recipe_set_abyss_chain_feet", station: "forge", result: "set_abyss_chain_feet", desc: "Кольчужные сапоги Бездны", floor: 5, dropChance: 0.05, materials: { hellstone: 4, infernal_ash: 2 } },

  // ── Тир 5: «Кожа Бездны» ──
  { id: "recipe_set_abyss_leather_head", station: "forge", result: "set_abyss_leather_head", desc: "Кожаный шлем Бездны", floor: 5, dropChance: 0.05, materials: { demon_horn: 3, infernal_ash: 2 } },
  { id: "recipe_set_abyss_leather_shoulder", station: "forge", result: "set_abyss_leather_shoulder", desc: "Кожаные наплечники Бездны", floor: 5, dropChance: 0.05, materials: { demon_horn: 3, infernal_ash: 2 } },
  { id: "recipe_set_abyss_leather_chest", station: "forge", result: "set_abyss_leather_chest", desc: "Кожаный доспех Бездны", floor: 5, dropChance: 0.05, materials: { demon_horn: 5, brimstone: 2, infernal_ash: 2 } },
  { id: "recipe_set_abyss_leather_wrist", station: "forge", result: "set_abyss_leather_wrist", desc: "Кожаные наручи Бездны", floor: 5, dropChance: 0.05, materials: { demon_horn: 2, infernal_ash: 1 } },
  { id: "recipe_set_abyss_leather_hands", station: "forge", result: "set_abyss_leather_hands", desc: "Кожаные перчатки Бездны", floor: 5, dropChance: 0.05, materials: { demon_horn: 2, infernal_ash: 1 } },
  { id: "recipe_set_abyss_leather_waist", station: "forge", result: "set_abyss_leather_waist", desc: "Кожаный ремень Бездны", floor: 5, dropChance: 0.05, materials: { demon_horn: 2, infernal_ash: 1 } },
  { id: "recipe_set_abyss_leather_legs", station: "forge", result: "set_abyss_leather_legs", desc: "Кожаные штаны Бездны", floor: 5, dropChance: 0.05, materials: { demon_horn: 4, infernal_ash: 3 } },
  { id: "recipe_set_abyss_leather_feet", station: "forge", result: "set_abyss_leather_feet", desc: "Кожаные сапоги Бездны", floor: 5, dropChance: 0.05, materials: { demon_horn: 3, infernal_ash: 2 } },

  // ── Тир 5: «Архимаг» ──
  { id: "recipe_set_archmage_cloth_head", station: "forge", result: "set_archmage_cloth_head", desc: "Капюшон архимага", floor: 5, dropChance: 0.05, materials: { void_crystal: 2, infernal_ash: 3 } },
  { id: "recipe_set_archmage_cloth_shoulder", station: "forge", result: "set_archmage_cloth_shoulder", desc: "Накидка архимага", floor: 5, dropChance: 0.05, materials: { void_crystal: 1, infernal_ash: 3 } },
  { id: "recipe_set_archmage_cloth_chest", station: "forge", result: "set_archmage_cloth_chest", desc: "Мантия архимага", floor: 5, dropChance: 0.05, materials: { void_crystal: 3, infernal_ash: 4, brimstone: 2 } },
  { id: "recipe_set_archmage_cloth_wrist", station: "forge", result: "set_archmage_cloth_wrist", desc: "Наручи архимага", floor: 5, dropChance: 0.05, materials: { void_crystal: 1, infernal_ash: 2 } },
  { id: "recipe_set_archmage_cloth_hands", station: "forge", result: "set_archmage_cloth_hands", desc: "Перчатки архимага", floor: 5, dropChance: 0.05, materials: { void_crystal: 1, infernal_ash: 2 } },
  { id: "recipe_set_archmage_cloth_waist", station: "forge", result: "set_archmage_cloth_waist", desc: "Пояс архимага", floor: 5, dropChance: 0.05, materials: { void_crystal: 1, infernal_ash: 2 } },
  { id: "recipe_set_archmage_cloth_legs", station: "forge", result: "set_archmage_cloth_legs", desc: "Штаны архимага", floor: 5, dropChance: 0.05, materials: { void_crystal: 2, infernal_ash: 3 } },
  { id: "recipe_set_archmage_cloth_feet", station: "forge", result: "set_archmage_cloth_feet", desc: "Сапоги архимага", floor: 5, dropChance: 0.05, materials: { void_crystal: 2, infernal_ash: 2 } },

  // ══════════════════════════════════════════════════════════════════════════
  // РЕЦЕПТЫ ПАР: 20 предметов (только ресурсы своего этажа)
  // ══════════════════════════════════════════════════════════════════════════
  { id: "recipe_ring_iron_1", station: "jewelry", result: "ring_iron_1", desc: "Железное кольцо «Заря»", floor: 1, dropChance: 0.05, materials: { iron_ore: 2, malachite: 1 } },
  { id: "recipe_ring_iron_2", station: "jewelry", result: "ring_iron_2", desc: "Железное кольцо «Закат»", floor: 1, dropChance: 0.05, materials: { iron_ore: 3, rust: 1 } },
  { id: "recipe_trinket_wolf_1", station: "jewelry", result: "trinket_wolf_1", desc: "Тотем волка «Клык»", floor: 1, dropChance: 0.05, materials: { wood: 2, leather: 2 } },
  { id: "recipe_trinket_wolf_2", station: "jewelry", result: "trinket_wolf_2", desc: "Тотем волка «Лапа»", floor: 1, dropChance: 0.05, materials: { wood: 2, cloth: 2 } },
  { id: "recipe_ring_copper_1", station: "jewelry", result: "ring_copper_1", desc: "Медное кольцо «Искра»", floor: 2, dropChance: 0.05, materials: { copper_ore: 3, kobold_gear: 1 } },
  { id: "recipe_ring_copper_2", station: "jewelry", result: "ring_copper_2", desc: "Медное кольцо «Жар»", floor: 2, dropChance: 0.05, materials: { copper_ore: 1, tin_ore: 2, kobold_gear: 1 } },
  { id: "recipe_trinket_mushroom_1", station: "jewelry", result: "trinket_mushroom_1", desc: "Грибной амулет «Бледный»", floor: 2, dropChance: 0.05, materials: { cave_mushroom: 3, tin_ore: 1 } },
  { id: "recipe_trinket_mushroom_2", station: "jewelry", result: "trinket_mushroom_2", desc: "Грибной амулет «Тёмный»", floor: 2, dropChance: 0.05, materials: { cave_mushroom: 3, cold_iron_ingot: 1 } },
  { id: "recipe_ring_silver_1", station: "jewelry", result: "ring_silver_1", desc: "Серебряное кольцо «Луна»", floor: 3, dropChance: 0.05, materials: { silver: 2, bone: 1 } },
  { id: "recipe_ring_silver_2", station: "jewelry", result: "ring_silver_2", desc: "Серебряное кольцо «Тень»", floor: 3, dropChance: 0.05, materials: { silver: 3, bone: 1, rune_dust: 1 } },
  { id: "recipe_trinket_ghost_1", station: "jewelry", result: "trinket_ghost_1", desc: "Фиал призрака «Шёпот»", floor: 3, dropChance: 0.05, materials: { rune_dust: 3, silver: 1 } },
  { id: "recipe_trinket_ghost_2", station: "jewelry", result: "trinket_ghost_2", desc: "Фиал призрака «Холод»", floor: 3, dropChance: 0.05, materials: { rune_dust: 3, cursed_cloth: 1, silver: 1 } },
  { id: "recipe_ring_mithril_1", station: "jewelry", result: "ring_mithril_1", desc: "Мифриловое кольцо «Блеск»", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, war_crystal: 1 } },
  { id: "recipe_ring_mithril_2", station: "jewelry", result: "ring_mithril_2", desc: "Мифриловое кольцо «Песнь»", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, orc_tusk: 1, war_crystal: 1 } },
  { id: "recipe_trinket_orc_1", station: "jewelry", result: "trinket_orc_1", desc: "Амулет орка «Череп»", floor: 4, dropChance: 0.05, materials: { orc_tusk: 3, iron_chain: 2 } },
  { id: "recipe_trinket_orc_2", station: "jewelry", result: "trinket_orc_2", desc: "Амулет орка «Клык»", floor: 4, dropChance: 0.05, materials: { orc_tusk: 3, blood_herb: 2 } },
  { id: "recipe_ring_hell_1", station: "jewelry", result: "ring_hell_1", desc: "Кольцо из адского камня «Уголёк»", floor: 5, dropChance: 0.05, materials: { hellstone: 3, demon_horn: 1 } },
  { id: "recipe_ring_hell_2", station: "jewelry", result: "ring_hell_2", desc: "Кольцо из адского камня «Пламя»", floor: 5, dropChance: 0.05, materials: { hellstone: 3, void_crystal: 1 } },
  { id: "recipe_trinket_demon_1", station: "jewelry", result: "trinket_demon_1", desc: "Печать демона «Зола»", floor: 5, dropChance: 0.05, materials: { demon_horn: 3, brimstone: 2 } },
  { id: "recipe_trinket_demon_2", station: "jewelry", result: "trinket_demon_2", desc: "Печать демона «Уголь»", floor: 5, dropChance: 0.05, materials: { demon_horn: 3, void_crystal: 1, infernal_ash: 2 } },
];

const RECIPE_MAP = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

function getRecipeById(id) { return RECIPE_MAP[id] || null; }
function getRecipes(station) { return RECIPES.filter((r) => r.station === station); }

// ══════════════════════════════════════════════════════════════════════════
// СЕТЫ И ПАРЫ. Пороги брони — 2/4/6/8 (8 слотов), пар — 2/2.
// Бонусы по типу брони (складываются по достигнутым порогам):
//   кожа    — уворот, крит, шанс дропа, скорость (контратака);
//   ткань   — мана, HP-реген, максимум HP;
//   кольчуга— HP, защита, зоны блока;
//   латы    — защита, снижение урона, зоны блока.
// Ключи бонусов: dodge, crit, lootChance, counterBonus, manaBonus, hpRegen,
// maxHpFlat, maxHpMult, def, blockZones, damageReduction, atkMult, lifesteal,
// goldBonus.
// ══════════════════════════════════════════════════════════════════════════
const SET_BONUS_TEMPLATES = {
  leather: { 2: { dodge: 3 }, 4: { crit: 2 }, 6: { lootChance: 5 }, 8: { dodge: 5, counterBonus: 5 } },
  cloth:   { 2: { manaBonus: 20 }, 4: { hpRegen: 2 }, 6: { maxHpFlat: 40 }, 8: { manaBonus: 25, hpRegen: 3 } },
  chain:   { 2: { maxHpFlat: 30 }, 4: { def: 4 }, 6: { blockZones: 1 }, 8: { def: 6, maxHpFlat: 60 } },
  plate:   { 2: { def: 3 }, 4: { damageReduction: 6 }, 6: { blockZones: 1 }, 8: { def: 5, damageReduction: 10 } },
};

const SETS = {
  // ── 20 сетов брони (4 типа × 5 тиров × 8 слотов) ──
  set_rough_iron: {
    name: "Грубое железо", type: "plate", tier: 1,
    items: ["head_iron", "shoulder_iron", "dented_plate", "wrist_iron", "hands_iron", "waist_plate", "legs_iron", "feet_iron"],
    bonuses: SET_BONUS_TEMPLATES.plate,
  },
  set_coarse_leather: {
    name: "Из грубой кожи", type: "leather", tier: 1,
    items: ["head_leather", "shoulder_leather", "wanderer_coat", "wrist_leather", "hands_gloves", "waist_leather", "legs_leather", "feet_leather"],
    bonuses: SET_BONUS_TEMPLATES.leather,
  },
  set_novice_cloth: {
    name: "Послушник", type: "cloth", tier: 1,
    items: ["head_cloth", "shoulder_cloth", "student_robe", "wrist_cloth", "hands_cloth", "waist_rope", "legs_cloth", "feet_cloth"],
    bonuses: SET_BONUS_TEMPLATES.cloth,
  },
  set_rough_chain: {
    name: "Грубая кольчуга", type: "chain", tier: 1,
    items: ["set_rough_chain_head", "set_rough_chain_shoulder", "iron_chainmail", "set_rough_chain_wrist", "set_rough_chain_hands", "set_rough_chain_waist", "set_rough_chain_legs", "set_rough_chain_feet"],
    bonuses: SET_BONUS_TEMPLATES.chain,
  },
  set_steel_plate: {
    name: "Сталь", type: "plate", tier: 2,
    items: ["steel_head", "steel_shoulder", "steel_chest", "steel_wrist", "steel_hands", "steel_waist", "steel_legs", "steel_feet"],
    bonuses: SET_BONUS_TEMPLATES.plate,
  },
  set_steel_chain: {
    name: "Стальная кольчуга", type: "chain", tier: 2,
    items: ["set_steel_chain_head", "set_steel_chain_shoulder", "steel_chainmail", "set_steel_chain_wrist", "set_steel_chain_hands", "set_steel_chain_waist", "set_steel_chain_legs", "set_steel_chain_feet"],
    bonuses: SET_BONUS_TEMPLATES.chain,
  },
  set_miner: {
    name: "Тёмная кожа", type: "leather", tier: 2,
    items: ["set_miner_head", "set_miner_shoulder", "set_miner_chest", "set_miner_wrist", "set_miner_hands", "set_miner_waist", "set_miner_legs", "set_miner_feet"],
    bonuses: SET_BONUS_TEMPLATES.leather,
  },
  set_apprentice_cloth: {
    name: "Подмастерье", type: "cloth", tier: 2,
    items: ["hood_mage", "set_apprentice_cloth_shoulder", "dense_cloth", "set_apprentice_cloth_wrist", "set_apprentice_cloth_hands", "set_apprentice_cloth_waist", "set_apprentice_cloth_legs", "set_apprentice_cloth_feet"],
    bonuses: SET_BONUS_TEMPLATES.cloth,
  },
  set_guard: {
    name: "Руническая сталь", type: "plate", tier: 3,
    items: ["set_guard_head", "set_guard_shoulder", "set_guard_chest", "set_guard_wrist", "set_guard_hands", "set_guard_waist", "set_guard_legs", "set_guard_feet"],
    bonuses: SET_BONUS_TEMPLATES.plate,
  },
  set_runic_chain: {
    name: "Руническая кольчуга", type: "chain", tier: 3,
    items: ["set_runic_chain_head", "set_runic_chain_shoulder", "set_runic_chain_chest", "set_runic_chain_wrist", "set_runic_chain_hands", "set_runic_chain_waist", "set_runic_chain_legs", "set_runic_chain_feet"],
    bonuses: SET_BONUS_TEMPLATES.chain,
  },
  set_runic_leather: {
    name: "Руническая кожа", type: "leather", tier: 3,
    items: ["set_runic_leather_head", "set_runic_leather_shoulder", "set_runic_leather_chest", "set_runic_leather_wrist", "set_runic_leather_hands", "set_runic_leather_waist", "set_runic_leather_legs", "set_runic_leather_feet"],
    bonuses: SET_BONUS_TEMPLATES.leather,
  },
  set_adept_cloth: {
    name: "Адепт", type: "cloth", tier: 3,
    items: ["set_adept_cloth_head", "set_adept_cloth_shoulder", "set_adept_cloth_chest", "set_adept_cloth_wrist", "set_adept_cloth_hands", "set_adept_cloth_waist", "set_adept_cloth_legs", "set_adept_cloth_feet"],
    bonuses: SET_BONUS_TEMPLATES.cloth,
  },
  set_mithril: {
    name: "Мифрил", type: "plate", tier: 4,
    items: ["mithril_head", "mithril_shoulder", "mithril_chest", "mithril_wrist", "mithril_hands", "mithril_waist", "mithril_legs", "mithril_feet"],
    bonuses: SET_BONUS_TEMPLATES.plate,
  },
  set_mithril_chain: {
    name: "Мифриловая кольчуга", type: "chain", tier: 4,
    items: ["set_mithril_chain_head", "set_mithril_chain_shoulder", "set_mithril_chain_chest", "set_mithril_chain_wrist", "set_mithril_chain_hands", "set_mithril_chain_waist", "set_mithril_chain_legs", "set_mithril_chain_feet"],
    bonuses: SET_BONUS_TEMPLATES.chain,
  },
  set_bone_leather: {
    name: "Кожа с костяными пластинами", type: "leather", tier: 4,
    items: ["set_bone_leather_head", "set_bone_leather_shoulder", "set_bone_leather_chest", "set_bone_leather_wrist", "set_bone_leather_hands", "set_bone_leather_waist", "set_bone_leather_legs", "set_bone_leather_feet"],
    bonuses: SET_BONUS_TEMPLATES.leather,
  },
  set_mage_cloth: {
    name: "Маг", type: "cloth", tier: 4,
    items: ["set_mage_cloth_head", "set_mage_cloth_shoulder", "set_mage_cloth_chest", "set_mage_cloth_wrist", "set_mage_cloth_hands", "set_mage_cloth_waist", "set_mage_cloth_legs", "set_mage_cloth_feet"],
    bonuses: SET_BONUS_TEMPLATES.cloth,
  },
  set_hellblade: {
    name: "Бездна", type: "plate", tier: 5,
    items: ["set_hellblade_head", "set_hellblade_shoulder", "set_hellblade_chest", "set_hellblade_wrist", "set_hellblade_hands", "set_hellblade_waist", "set_hellblade_legs", "set_hellblade_feet"],
    bonuses: SET_BONUS_TEMPLATES.plate,
  },
  set_abyss_chain: {
    name: "Кольчуга Бездны", type: "chain", tier: 5,
    items: ["set_abyss_chain_head", "set_abyss_chain_shoulder", "set_abyss_chain_chest", "set_abyss_chain_wrist", "set_abyss_chain_hands", "set_abyss_chain_waist", "set_abyss_chain_legs", "set_abyss_chain_feet"],
    bonuses: SET_BONUS_TEMPLATES.chain,
  },
  set_abyss_leather: {
    name: "Кожа Бездны", type: "leather", tier: 5,
    items: ["set_abyss_leather_head", "set_abyss_leather_shoulder", "set_abyss_leather_chest", "set_abyss_leather_wrist", "set_abyss_leather_hands", "set_abyss_leather_waist", "set_abyss_leather_legs", "set_abyss_leather_feet"],
    bonuses: SET_BONUS_TEMPLATES.leather,
  },
  set_archmage_cloth: {
    name: "Архимаг", type: "cloth", tier: 5,
    items: ["set_archmage_cloth_head", "set_archmage_cloth_shoulder", "set_archmage_cloth_chest", "set_archmage_cloth_wrist", "set_archmage_cloth_hands", "set_archmage_cloth_waist", "set_archmage_cloth_legs", "set_archmage_cloth_feet"],
    bonuses: SET_BONUS_TEMPLATES.cloth,
  },

  // ── 10 пар (порог 2/2): кольца и аксессуары ──
  pair_iron_rings: {
    name: "Железные кольца", pair: true, tier: 1,
    items: ["ring_iron_1", "ring_iron_2"], bonuses: { 2: { crit: 2 } },
  },
  pair_copper_rings: {
    name: "Медные кольца", pair: true, tier: 2,
    items: ["ring_copper_1", "ring_copper_2"], bonuses: { 2: { crit: 3 } },
  },
  pair_silver_rings: {
    name: "Серебряные кольца", pair: true, tier: 3,
    items: ["ring_silver_1", "ring_silver_2"], bonuses: { 2: { dodge: 4 } },
  },
  pair_mithril_rings: {
    name: "Мифриловые кольца", pair: true, tier: 4,
    items: ["ring_mithril_1", "ring_mithril_2"], bonuses: { 2: { crit: 6 } },
  },
  pair_hell_rings: {
    name: "Кольца Бездны", pair: true, tier: 5,
    items: ["ring_hell_1", "ring_hell_2"], bonuses: { 2: { crit: 8 } },
  },
  pair_wolf_trinkets: {
    name: "Тотемы волка", pair: true, tier: 1,
    items: ["trinket_wolf_1", "trinket_wolf_2"], bonuses: { 2: { dodge: 2 } },
  },
  pair_mushroom_trinkets: {
    name: "Грибные амулеты", pair: true, tier: 2,
    items: ["trinket_mushroom_1", "trinket_mushroom_2"], bonuses: { 2: { maxHpFlat: 25 } },
  },
  pair_ghost_trinkets: {
    name: "Фиалы призрака", pair: true, tier: 3,
    items: ["trinket_ghost_1", "trinket_ghost_2"], bonuses: { 2: { maxHpFlat: 40 } },
  },
  pair_orc_trinkets: {
    name: "Амулеты орка", pair: true, tier: 4,
    items: ["trinket_orc_1", "trinket_orc_2"], bonuses: { 2: { dodge: 4 } },
  },
  pair_demon_trinkets: {
    name: "Печати демона", pair: true, tier: 5,
    items: ["trinket_demon_1", "trinket_demon_2"], bonuses: { 2: { maxHpFlat: 60 } },
  },
};

const SET_MAP = Object.fromEntries(Object.entries(SETS).map(([id, set]) => [id, { id, ...set }]));

// Каждому мобу и боссу проставляем этаж — по нему считаются рецепты и дроп.
for (const floor of FLOORS) {
  for (const mob of floor.mobs) {
    mob.floorId = floor.id;
    // Уязвимость стилю: пустой weakTo — урон идёт как обычно.
    mob.weakTo = MOB_WEAKNESS[mob.id] || [];
  }
  floor.boss.floorId = floor.id;
  floor.boss.weakTo = MOB_WEAKNESS[floor.boss.id] || [];
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
    ATTR_INFO, RARITY_TIERS, AFFIXES, UNIQUE_EFFECTS, BACKGROUND_STEPS, DIALOG_TREES,
    MOB_ROLES, COMPANION_REACTIONS, COMPANION_EVENTS, COMPANION_EVENT_MAP, COMPANION_EVENT_CHANCE,
    CRAFT_RARITY_BONUS_PER_LEVEL, CRAFT_BASE_BONUS, CRAFT_MATERIALS_BONUS, CRAFT_MATERIALS_BONUS_MAX, CRAFT_FACTION_BONUS,
    ARCHETYPES, ARCHETYPE_MAP, STYLE_ORDER, STYLE_NAMES, STYLE_ICONS,
    ARMOR_TYPE_NAMES, ARMOR_STYLE_MULT, UNARMED_DAMAGE, MONK_STANCES,
    TALENTS, TALENT_MAP, RARITY_INFO, MOB_ABILITY_INFO, MOB_MODIFIERS,
    TIME_PHASES, COMPANIONS, COMPANION_MAP, COMPANION_AFFINITY_LEVELS, MONTHS, WEEKDAYS, WEEKLY_EVENTS,
    TRAININGS, TRAINING_MAP, HUNT_CONTRACTS, HUNTER_TIPS, ITEMS, ARMOR_TYPE_BY_ID, MOB_ICONS,
    RESOURCE_ICONS, FLOORS, FLOOR_RESOURCES, ALL_RESOURCES, FLOOR_SCENES,
    FLOOR_DIARY, HUNTER_ENCOUNTERS, FLOOR_EVENTS,
    NPCS, RECIPES, RECIPE_MAP, SETS, SET_MAP, SET_BONUS_TEMPLATES,
    getRecipeById, getRecipes, todaysEvent, forgeDiscountToday,
    alchemyDiscountToday, companionDiscountToday, xpMultToday, goldMultToday,
    weaponDamageFor, weaponStyleValue, weaponStyleMult, weaponBestStyle,
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
      for (const style of enemy.weakTo || []) {
        if (!STYLE_ORDER.includes(style)) {
          add("structure", `FLOORS[${floor.id}] ${enemy.id}: weakTo "${style}" отсутствует в STYLE_ORDER`);
        }
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
    "assets/sfx/hit_slash1.mp3", "assets/sfx/hit_slash2.mp3",
    "assets/sfx/hit_slash3.mp3", "assets/sfx/hit_slash4.mp3",
    "assets/sfx/hit_slash5.mp3", "assets/sfx/hit_slash6.mp3"
  ],
  hit_blunt: [
    "assets/sfx/hit_blunt.mp3", "assets/sfx/hit_blunt2.mp3"
  ],
  hit_crit_slash: ["assets/sfx/hit_slashcrit.mp3"],
  hit_crit_blunt: ["assets/sfx/hit_bluntcrit.mp3"],
  hit_block: [
    "assets/sfx/hit_block1.mp3", "assets/sfx/hit_block2.mp3",
    "assets/sfx/hit_block3.mp3", "assets/sfx/hit_block4.mp3"
  ],
  hit_miss: [
    "assets/sfx/hit_miss1.mp3", "assets/sfx/hit_miss2.mp3",
    "assets/sfx/hit_miss3.mp3", "assets/sfx/hit_miss4.mp3",
    "assets/sfx/hit_bluntmiss.mp3", "assets/sfx/hit_bluntmiss2.mp3"
  ],
  disarm: ["assets/sfx/disarm.mp3", "assets/sfx/disarm2.mp3"],
  
  // Заглушки (файлов пока нет)
  potion: ["assets/sfx/potion.mp3"],
  victory: ["assets/sfx/victory.mp3"],
  defeat: ["assets/sfx/defeat.mp3"],
  levelup: ["assets/sfx/levelup.mp3"],
  open: ["assets/sfx/open.mp3"],
  chest: ["assets/sfx/chest.mp3"],
  event: ["assets/sfx/event.mp3"],
  quest_complete: ["assets/sfx/quest_complete.mp3"],

  // Шаги
  footstep_dirt: ["assets/sfx/footsteps/dirt_walk_1.wav", "assets/sfx/footsteps/dirt_walk_2.wav", "assets/sfx/footsteps/dirt_walk_3.wav", "assets/sfx/footsteps/dirt_walk_4.wav", "assets/sfx/footsteps/dirt_walk_5.wav"],
  footstep_stone: ["assets/sfx/footsteps/stone_walk_1.wav", "assets/sfx/footsteps/stone_walk_2.wav", "assets/sfx/footsteps/stone_walk_3.wav", "assets/sfx/footsteps/stone_walk_4.wav", "assets/sfx/footsteps/stone_walk_5.wav"],
  footstep_wood: ["assets/sfx/footsteps/wood_walk_1.wav", "assets/sfx/footsteps/wood_walk_2.wav", "assets/sfx/footsteps/wood_walk_3.wav", "assets/sfx/footsteps/wood_walk_4.wav", "assets/sfx/footsteps/wood_walk_5.wav"],
  footstep_water: ["assets/sfx/footsteps/water_walk_1.wav", "assets/sfx/footsteps/water_walk_2.wav", "assets/sfx/footsteps/water_walk_3.wav"],
  // Прыжки и приземления
  footstep_jump: ["assets/sfx/footsteps/dirt_jump.wav", "assets/sfx/footsteps/stone_jump.wav", "assets/sfx/footsteps/wood_jump.wav", "assets/sfx/footsteps/water_jump.wav"],
  footstep_land: ["assets/sfx/footsteps/dirt_land.wav", "assets/sfx/footsteps/stone_land.wav", "assets/sfx/footsteps/wood_land.wav", "assets/sfx/footsteps/water_land.wav"],
  // Интерфейс и взаимодействия
  chest_open: ["assets/sfx/misc/chest_open_1.wav", "assets/sfx/misc/chest_open_2.wav"],
  chest_close: ["assets/sfx/misc/chest_close_1.wav", "assets/sfx/misc/chest_close_2.wav"],
  door_open: ["assets/sfx/misc/door_open_1.wav", "assets/sfx/misc/door_open_2.wav"],
  door_close: ["assets/sfx/misc/door_close_1.wav", "assets/sfx/misc/door_close_2.wav"],
  gate_open: ["assets/sfx/misc/gate_open.wav"],
  portcullis: ["assets/sfx/misc/portcullis_gate.wav"],
  lock_unlock: ["assets/sfx/misc/lock_unlock.wav"],
  forge_craft: ["assets/sfx/misc/forge_craft.wav"]
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
