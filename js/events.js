// ── Движок процедурных событий исследования ─────────────────────────────────
// Загружается ПОСЛЕ data.js и ПЕРЕД state.js.
// Все функции здесь — чистые относительно DOM: принимают `state`, возвращают
// результат, сами ничего не рисуют и не читают localStorage.
// Единственная внешняя зависимость времени выполнения — stats() (state.js),
// чтобы сложить базовый стат и бонусы экипировки; при её отсутствии
// используется только базовый стат из state.attrs.

const EVENT_CHANCE = 0.15;   // базовый шанс события за одно исследование
const EVENT_COOLDOWN = 3;    // не чаще 1 события на 3 исследования

// Сумма базового стата и бонусов экипировки (без талантов и компаньонов).
// Снимок статов передаётся вызывающим кодом (ui.js), здесь нет обращений к state.js.
function eventAttrTotal(state, attr, st) {
  return ((st.attrs && st.attrs[attr]) || 0) + ((st.gearAttrs && st.gearAttrs[attr]) || 0);
}

// Скрытая проверка стата: бросок d20 + модификатор (как в настолках).
// difficulty — порог успеха. Возвращает подробности броска.
function eventCheck(state, attr, difficulty, st) {
  const total = eventAttrTotal(state, attr, st);
  const mod = Math.floor((total - 10) / 2); // +1 за каждые 2 пункта выше 10
  const roll = 1 + Math.floor(Math.random() * 20);
  const result = roll + mod;
  return { success: result >= difficulty, roll, mod, total, result, difficulty };
}

// Пул событий. `floor: null` — доступно на любом этаже; иначе — только на этом.
const PROCEDURAL_EVENTS = [
  {
    id: "boulder", name: "Обвал", icon: "🪨", floor: null, stat: "str", difficulty: 12,
    text: "Потолок угрожающе трещит, сверху сыплются камни. Тяжёлая плита вот-вот перекроет проход.",
    successText: "Вы упёрлись плечом и удержали завал. Путь свободен, а под камнями нашлась горсть монет.",
    failText: "Сил не хватило — вы едва успели отпрыгнуть, но надорвали спину.",
    successEffects: { gold: 25 },
    failEffects: { debuff: { id: "bad_back", name: "Надорвал спину", icon: "🤕", days: 1, damageMult: 0.8, desc: "−20% к урону до конца дня" } },
    options: [
      { id: "try", label: "Удержать завал (Сила)", stat: "str" },
      { id: "back", label: "Отступить" },
    ],
  },
  {
    id: "riddle", name: "Запертая дверь", icon: "🔒", floor: null, stat: "int", difficulty: 12,
    text: "Старая дверь исписана выцветшими рунами. Кажется, они складываются в древнюю загадку.",
    successText: "Вы вспомнили древний язык, и дверь бесшумно отворилась, открыв тайник с золотом.",
    failText: "Руны так и не сложились в слова. От натуги разболелась голова.",
    successEffects: { gold: 35 },
    failEffects: { debuff: { id: "headache", name: "Головная боль", icon: "🤯", days: 1, damageMult: 0.9, desc: "−10% к урону до конца дня" } },
    options: [
      { id: "try", label: "Разгадать руны (Интеллект)", stat: "int" },
      { id: "back", label: "Уйти" },
    ],
  },
  {
    id: "chasm", name: "Пропасть", icon: "🌉", floor: null, stat: "agi", difficulty: 12,
    text: "Пол обрывается в тёмную пропасть. На другой стороне что-то поблёскивает.",
    successText: "Вы ловко перепрыгнули и подобрали узелок с добычей.",
    failText: "Вы поскользнулись и сорвались, приложившись плечом о камни.",
    successEffects: { gold: 30 },
    failEffects: { hp: -12 },
    options: [
      { id: "try", label: "Перепрыгнуть (Ловкость)", stat: "agi" },
      { id: "back", label: "Не рисковать" },
    ],
  },
];

// Выбор события: шанс EVENT_CHANCE, с учётом кулдауна. Возвращает событие или null.
// Меняет только state.eventCooldown (счётчик исследований).
function rollEvent(floorId, state) {
  if ((state.eventCooldown || 0) > 0) { state.eventCooldown -= 1; return null; }
  if (Math.random() >= EVENT_CHANCE) return null;
  const pool = PROCEDURAL_EVENTS.filter((e) => e.floor == null || e.floor === floorId);
  if (!pool.length) return null;
  state.eventCooldown = EVENT_COOLDOWN;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Применение выбора игрока: скрытая проверка стата. Возвращает результат
// { ok, success, skipped, text, effects } — эффекты НЕ мутируют state здесь.
function resolveEventAction(optionId, event, state, st) {
  const option = event?.options?.find((o) => o.id === optionId);
  if (!event || !option) return { ok: false, success: false, text: "Неизвестное действие.", effects: {} };

  // Благоразумный отказ — без проверки и без последствий.
  if (option.noCheck || !option.stat) {
    return { ok: true, success: true, skipped: true, text: "Вы благоразумно отступаете.", effects: {} };
  }

  const attr = option.stat;
  const difficulty = event.difficulty || 10;
  const check = eventCheck(state, attr, difficulty, st);

  if (check.success) {
    return { ok: true, success: true, check, text: event.successText, effects: event.successEffects || {} };
  }
  return { ok: true, success: false, check, text: event.failText, effects: event.failEffects || {} };
}

// Применяет эффекты события к state (золото, HP, дебафф на дни).
// Возвращает список коротких строк-приобретений для тоста.
function applyEventEffects(effects, state, st) {
  const e = effects || {};
  const gained = [];
  if (e.gold) { state.gold = (state.gold || 0) + e.gold; gained.push(`+${e.gold} 💰`); }
  if (Number.isFinite(e.hp) && e.hp !== 0) {
    const maxHp = st ? st.maxHp : (state.hp || 0) + 100;
    state.hp = Math.max(0, Math.min(maxHp, (state.hp || 0) + e.hp));
    gained.push(`${e.hp > 0 ? "+" : ""}${e.hp} HP`);
  }
  if (e.debuff) {
    if (!Array.isArray(state.tempDebuffs)) state.tempDebuffs = [];
    state.tempDebuffs.push({ ...e.debuff });
    gained.push(`${e.debuff.icon || ""} ${e.debuff.name} (${e.debuff.days || 1} дн.)`);
  }
  return gained;
}
