const view = {
  screen: "hub", battle: null, attackZone: "chest", attackStyle: "slashing",
  preBattle: false, weaponSlotPicker: null,
  comboState: null, comboPaused: null, typingState: null, typingPaused: null, typingPausedAt: 0,
  // Real-Time дуэль: слова живут в battle, здесь — флаг и id интервала.
  duelActive: false, duelTimer: null,
  _lastTypedWord: null,
  currentAttackResult: null, currentAttackTypingSpeed: 999, currentDefenseResult: null, currentAttackFast: false, currentAttackSlow: false,
  logExpanded: true, lastBattleLog: [],
  summary: null, create: null, forgeTab: "held", jewelryTab: "jewelry", talentsTab: "war",
  questsOpen: false, bestiaryOpen: false, bestiaryFilter: "all",
  timmyTip: null,
  currentFloor: null,
  selectedZone: 1,
  levelUp: null,
  dollSlot: null, tripActive: false,
  sceneGroup: null, sceneGroupFloorId: null, autoExplore: null,
  autoExploreMode: "safe",
  // Арена: бесконечная орда. Живёт только в текущей сессии.
  arenaState: { active: false, wave: 1, floorId: 1 },
  arenaNotice: null,
  arenaTimer: null,
  traderStock: null,
  npcInteraction: null,
  tradeFilter: "all",
  tradeSubFilter: "all",
  purchaseConfirm: null,
  chestResults: null,
  chestReveal: null,
  chestMassResults: null,
  chestMassRevealed: [],
  chestMassOpened: 0,
  shopTab: "buy", sellSelection: [], activeShopNpc: null, shopNpcPhrase: null, shopFilterArmor: null,
  companionInfo: null,
  tutorialQte: null,
  trainingTab: "train",
  hallTab: "board",
  inventoryTab: "gear",
  invItemUid: null,
  chestMenu: null,
  invFilter: "all",
  invSearch: "",
  alchemyTab: "potions", alchemyFilter: "all",
  heroBackScreen: "hub",
  ambush: null,
  storyJustPlayed: false,
  introPending: false,
  // Единая нижняя панель событий: текущий результат + история-журнал.
  eventResult: null, eventJournal: [], eventSelectedIndex: 0,
  // Карусель журнала исследований: -1 — режим реального времени.
  eventLog: [], eventLogIndex: -1,
  weaponSwap: false,
  battleModal: null,
  titleModal: false,
  achievementsOpen: false,
  abilitiesOpen: false,
  talentsModal: false,
  settingsOpen: false, settingsTab: "audio",
  shopFilterSlot: "all", shopFilterType: "all", shopFilterStyle: null,
};

let toastTimer = null;
let invFilterCache = { key: "", list: [] };

// ── QTE: общее состояние анимации ──────────────────────────────────────────
// Таймер тренировки и «Боевой печати» тикает setInterval раз в 100 мс.
const QTE_TICK_MS = 100;
let qteInterval = null;

// Экранирование для HTML и атрибутов: важны кавычки — в data-tooltip лежит готовый HTML.
function esc(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
function bar(cls, value, max, role = "") { const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100)); return `<div class="bar ${cls}"${role ? ` data-role="${role}"` : ""}><span style="width:${pct}%"></span></div>`; }
function toast(text, kind = "info") { const el = platform.dom.byId("toast"); if (!el) return; el.textContent = text; el.className = `toast show ${kind}`; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.className = "toast"; }, 2400); }

function iconHtml(icon, size = 32, fit = "contain") {
  const resolved = resolveIcon(icon);
  if (!resolved) return "";
  if (resolved.startsWith("assets/")) {
    // Если файла иконки нет (onerror) — показываем эмодзи-заглушку по слоту,
    // чтобы слот не оставался пустым.
    const emoji = iconFallbackEmoji(resolved);
    return `<span style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;flex-shrink:0;vertical-align:middle;"><img src="${resolved}" class="game-icon" style="width:100%;height:100%;object-fit:${fit};" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='inline';"><span style="display:none;font-size:${Math.round(size * 0.8)}px;line-height:1;vertical-align:middle;">${emoji}</span></span>`;
  }
  return `<span style="font-size:${Math.round(size * 0.8)}px;line-height:1;vertical-align:middle;">${resolved}</span>`;
}

// По пути к иконке «assets/icons/head_iron.webp» подбираем эмодзи слота,
// чтобы при отсутствии файла показать осмысленную заглушку.
let ICON_ITEM_BY_PATH = null;
function iconFallbackEmoji(resolved) {
  if (!ICON_ITEM_BY_PATH) {
    ICON_ITEM_BY_PATH = new Map();
    for (const it of Object.values(ITEMS)) if (it.icon) ICON_ITEM_BY_PATH.set(it.icon, it);
  }
  const item = ICON_ITEM_BY_PATH.get(resolved) || null;
  if (item && item.iconFallback) return item.iconFallback;
  const slot = item ? item.slot : null;
  return (slot && SLOT_ICON[slot]) || "❔";
}

const ATTR_LABEL = { str: "Сила", end: "Выносливость", agi: "Ловкость", int: "Интеллект" };

const DMG_TIPS = {
  slashing: "Урон рубящего типа. Эффективен против ткани и кожи, слаб против лат.",
  piercing: "Урон колющего типа. Эффективен против ткани, слаб против лат.",
  bludgeoning: "Урон дробящего типа. Эффективен против лат и кольчуги.",
};

function itemStats(item, inst = null) {
  const s = inst ? getInstanceStats(inst) : item;
  const out = [];
  // Сначала — разбивка урона по стилям, всегда все три типа,
  // чтобы карточки предметов были одинаковой высоты.
  if (s.damage) {
    for (const st of STYLE_ORDER) {
      const val = s.damage[st] || 0;
      out.push(`${STYLE_NAMES[st]} ${val > 0 ? val : "—"}`);
    }
  }
  // Затем — бонусные статы, чистым текстом без иконок.
  if (s.def) out.push(`+${s.def} броня`);
  if (s.crit) out.push(`+${s.crit}% крит`);
  if (s.dodge) out.push(`+${s.dodge}% уворот`);
  if (s.block) out.push(`+${s.block} блок`);
  if (s.hp) out.push(`+${s.hp} HP`);
  if (s.mana) out.push(`+${s.mana} маны`);
  return out;
}

// Стиль урона по тексту чипа (для класса и подсказки).
function dmgStyleOf(text) {
  return STYLE_ORDER.find((st) => text.startsWith(`${STYLE_NAMES[st]} `)) || null;
}

function chipTitle(text) {
  const style = dmgStyleOf(text);
  if (style) return DMG_TIPS[style];
  if (text.includes("крит")) return "Шанс критического удара.";
  if (text.includes("уворот")) return "Шанс уклониться от атаки.";
  return "";
}

function getItemDisplayName(instance) {
  const item = instance ? ITEMS[instance.id] : null;
  if (!item) return "Предмет";
  return instance.affix?.name ? `${item.name} ${instance.affix.name}` : item.name;
}

function rarityClass(instance) {
  const r = instance?.rarity;
  return r && r !== "common" && RARITY_TIERS[r] ? ` rarity-${r}` : "";
}

function durabilityChip() { return ""; }

function statsChips(item, inst = null) {
  const chips = itemStats(item, inst);
  // Чипы урона помечаем отдельным классом (одинаковая ширина/высота)
  // и добавляем подсказку о взаимодействии с бронёй.
  let html = chips.length
    ? chips
        .map((c) => {
          const title = chipTitle(c);
          const cls = `chip${dmgStyleOf(c) ? " dmg" : ""}`;
          return `<span class="${cls}"${title ? ` title="${title}"` : ""}>${c}</span>`;
        })
        .join("")
    : "";

  if (inst && inst.affix) {
    for (const b of inst.affix.bonuses || []) {
      if (ATTR_LABEL[b.id]) html += `<span class="chip affix">${ATTR_LABEL[b.id]} +${b.value}</span>`;
    }
  }
  
  if (inst && inst.unique) {
    const eff = UNIQUE_EFFECTS.find((u) => u.id === inst.unique);
    if (eff) html += `<span class="chip unique">✨ ${eff.name}</span>`;
  }
  
  return html || `<span class="chip dim">без бонусов</span>`;
}

function copiesOf(id) { return state.owned.filter((inst) => inst.id === id); }
function equippedUidOf(id) {
  for (const [slot, uid] of Object.entries(state.equipped)) {
    const inst = uid ? getInstance(uid) : null;
    if (inst && inst.id === id) return { slot, uid };
  }
  return null;
}

// Канонический priceFor(item, shop) живёт в state.js (этап 1): учитывает
// дневную скидку рынка И репутацию фракции лавки (по максимуму).

function priceHtml(item, shop = "forge") { const p = priceFor(item, shop); if (!p.hasDiscount) return `${p.price} 💰`; return `<s class="price-old">${p.old} 💰</s> <b class="price-new">${p.price} 💰</b>`; }

// DOM-хук для actions.js: визуальная тряска экрана боя.
function battleShake() {
  document.body.classList.remove("screen-shake");
  void document.body.offsetWidth; // Принудительный рефлоу для перезапуска анимации
  document.body.classList.add("screen-shake");
  setTimeout(() => document.body.classList.remove("screen-shake"), 400);
}

// Тряска контейнера боя при крите (Этап 4): класс shake-screen на 0.3 сек.
function shakeBattleContainer() {
  const panel = document.querySelector("section.battle");
  if (!panel) return;
  panel.classList.remove("shake-screen");
  void panel.offsetWidth; // Принудительный рефлоу для перезапуска анимации
  panel.classList.add("shake-screen");
  setTimeout(() => panel.classList.remove("shake-screen"), 300);
}

// Звук шагов по экрану/этажу: тип покрытия зависит от локации.
let _stepTimeout = null;
function playFootstep(screen, floorId = null) {
  let id = null;
  if (screen === "floor" && floorId !== null) {
    if (floorId === 1 || floorId === 4) id = "footstep_dirt";
    else if (floorId === 2 || floorId === 3 || floorId === 5) id = "footstep_stone";
  } else if (screen === "hub" || screen === "market" || screen === "forge" || screen === "jewelry") {
    id = "footstep_stone";
  } else if (screen === "hotel" || screen === "alchemy") {
    id = "footstep_wood";
  }
  if (!id) return;
  if (_stepTimeout) clearTimeout(_stepTimeout);
  Sfx.play(id);
  // Второй шаг через 180 мс — звук воспринимается как пара шагов.
  _stepTimeout = setTimeout(() => Sfx.play(id), 180);
}

function previewStats(attrs, archetypeId = null) {
  const gear = gearBonuses();
  const arch = ARCHETYPE_MAP[archetypeId];
  if (arch && Array.isArray(arch.startEquipment)) {
    const eq = {};
    for (const id of arch.startEquipment) {
      const item = ITEMS[id];
      if (!item) continue;
      let slot = null;
      if (item.slot === "mainhand" || item.slot === "offhand") {
        if (!eq.mainhand) slot = "mainhand";
        else if (!eq.offhand) slot = "offhand";
        else slot = "mainhand";
      } else if (item.slot === "ring") {
        if (!eq.ring1) slot = "ring1"; else slot = "ring2";
      } else if (item.slot === "trinket") {
        if (!eq.trinket1) slot = "trinket1"; else slot = "trinket2";
      } else {
        slot = item.slot;
      }
      if (slot) eq[slot] = id;
    }
    for (const [slot, id] of Object.entries(eq)) {
      const item = ITEMS[id];
      if (!item) continue;
      let atkMult = 1;
      if (slot === "offhand" && item.slot === "mainhand") atkMult = 0.5;
      if (item.atk) gear.atk += Math.round(item.atk * atkMult);
      if (item.def) gear.def += item.def;
      if (item.hp) gear.hp += item.hp;
      if (item.mana) gear.mana += item.mana;
      if (item.crit) gear.crit += item.crit;
      if (item.dodge) gear.dodge += item.dodge;
      if (item.block) gear.block += item.block;
    }
  }
  const a = { str: attrs.str + (gear.str || 0), agi: attrs.agi + (gear.agi || 0), end: attrs.end + (gear.end || 0), int: attrs.int + (gear.int || 0) };
  const mods = archetypeMods(archetypeId);
  return {
    maxHp: Math.round((BASE_STATS.hp + a.end * 10 + gear.hp) * mods.maxHp),
    maxMana: BASE_STATS.mana + a.int * 10 + gear.mana,
    atk: Math.ceil((BASE_STATS.damage + a.str * 1 + gear.atk) * mods.atk),
    def: gear.def,
    crit: Math.min(BASE_STATS.critCap, a.agi * AGILITY_CRIT_PERCENT + gear.crit),
    dodge: Math.min(mods.dodgeCap, a.agi * AGILITY_DODGE_PERCENT + gear.dodge),
    counter: Math.min(COUNTERATTACK_CAP, a.agi * AGILITY_COUNTER_PERCENT),
    blockZones: Math.min(ZONES.length, mods.blockZones + gear.block),
  };
}

// ── Отношения с NPC (affection) ─────────────────────────────────────────────
// Пилюля продавца в топбаре — на экранах лавок показывает личное отношение.
function shopFactionPill() {
  const npcId = SHOP_NPCS[view.screen];
  if (!npcId) return "";
  const name = NPC_NAMES[npcId] || npcId;
  const value = state.npcAffinity ? (state.npcAffinity[npcId] || 0) : 0;
  const level = getNpcAffinityLevel(value);
  const tip = `${name}: отношение ${value}, уровень «${level.name}»${level.discount > 0 ? `, скидка ${Math.round(level.discount * 100)}%` : ""}`;
  return `<div class="pill faction" data-tip="${esc(tip)}">🤝 <b>${name} · ${level.name}</b></div>`;
}

const SHOP_NPCS = { forge: "ron", alchemy: "elain", jewelry: "elize", hotel: "stella", training: "ivan" };
const CRAFT_NPC_STATIONS = { ron: "forge", elain: "alchemy", elize: "jewelry" };

function npcStorySlide(npcId) {
  const storyArr = DIALOGS[npcId]?.story;
  const storyIndex = state.npcDialogueIndex[npcId] || 0;
  return (!view.storyJustPlayed && Array.isArray(storyArr)) ? storyArr[storyIndex] : null;
}

function trainingAvailability(training) {
  const cap = Number(training.cap) || 10;
  const count = state.trainingCount?.[training.id] || 0;
  if (state.phase === 3) return { ok: false, reason: "Иван спит" };
  if (count >= cap) return { ok: false, reason: `Потолок (${cap})` };
  if (state.energy < TRAINING_ENERGY_COST) return { ok: false, reason: `Нужно ${TRAINING_ENERGY_COST} ⚡` };
  return { ok: true, reason: "" };
}

// ── Доска объявлений Зала Охотников ────────────────────────────────────────
// Карточки контрактов: «Взять» → «В работе (2/5)» → «Сдать» → «Сдано».
function findMobIcon(mobId) {
  for (const f of FLOORS) {
    const mob = (f.mobs || []).find((m) => m.id === mobId);
    if (mob) return mob.icon;
    if (f.boss && f.boss.id === mobId) return f.boss.icon;
  }
  return "";
}

// ── Статистика охотника («Мои свершения») ──────────────────────────────────

// Модалка совета удалена: отдельных окон с советами больше нет, все реплики
// Тимми идут через диалоговое дерево.

// ── Сюжетные квесты (Этап 2): панель у NPC и кнопка диалога ────────────────
function storyQuestObjectivesText(def) {
  return def.objectives.kill
    ? `Убить: ${findMobName(def.objectives.kill)}`
    : `Собрать: ${findResName(def.objectives.res)} ×${def.objectives.count}`;
}

function storyQuestRewardText(def) {
  const r = def.reward || {};
  const parts = [`💰 ${r.gold || 0}`, `✦ ${r.xp || 0}`];
  if (r.rep) parts.push(`⭐ +${r.rep}`);
  if (r.potions) parts.push(`🧪 +${r.potions}`);
  if (r.item && ITEMS[r.item]) parts.push(`${itemEmoji(ITEMS[r.item])} ${ITEMS[r.item].name}${(r.itemCount || 1) > 1 ? ` ×${r.itemCount}` : ""}`);
  if (r.recipe && RECIPE_MAP[r.recipe]) parts.push(`📜 ${RECIPE_MAP[r.recipe].desc}`);
  return parts.join(" · ");
}

// группы слотов для верхней панели фильтров магазина (Этап 8)
const SHOP_SLOT_GROUPS = [
  { id: "weapon", name: "Оружие", slots: ["mainhand", "offhand"] },
  { id: "armor", name: "Броня", slots: ["head", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet"] },
  { id: "jewelry", name: "Украшения", slots: ["neck", "ring", "trinket"] },
];

// ── Панель улучшения предметов (Этап 2) ────────────────────────────────────
// Кузница (ron): ветки weapon + armor. Ювелирная лавка (elize): jewelry,
// выбор стата «Крит» или «Уворот». У Алхимика (elain) наковальни нет — заглушка.

// Материальные чипы для произвольной карты материалов { resId: need }.

const DOLL_LEFT = ["head", "neck", "shoulder", "back", "chest", "wrist", "hands", "waist"];
const DOLL_RIGHT = ["legs", "feet", "ring1", "ring2", "trinket1", "trinket2", "mainhand", "offhand"];

// Полная кукла для центральной колонки торговли: все 16 слотов, но без
// кнопок талантов/титулов и с отключёнными слотами (только просмотр).

// ── Обмен ресурсов (Этап 3): 50 ресурсов 1-го этажа → 1 редкий ─────────────

// ── Сундуки (Гача): блок во вкладке «Снаряжение» инвентаря ─────────────────

// ── Сетовые бонусы в профиле героя ─────────────────────────────────────────
// Форматирует объект бонусов одного порога в читаемую строку.
const SET_BONUS_LABELS = {
  dodge: { suffix: "% уворота", signed: true },
  crit: { suffix: "% крита", signed: true },
  lootChance: { suffix: "% дропа", signed: true },
  counterBonus: { suffix: "% контратаки", signed: true },
  manaBonus: { suffix: " маны", signed: true },
  hpRegen: { suffix: " HP/день", signed: true },
  maxHpFlat: { suffix: " HP", signed: true },
  maxHpMult: { suffix: "% макс. HP", mult: true },
  def: { suffix: " защиты", signed: true },
  blockZones: { suffix: " зон блока", signed: true },
  damageReduction: { suffix: "% урона", reduction: true },
  atkMult: { suffix: "% урона", mult: true },
  lifesteal: { suffix: "% вампиризма", signed: true },
  goldBonus: { suffix: "% золота", signed: true },
};

function setBonusText(bonuses) {
  return Object.entries(bonuses || {}).map(([key, value]) => {
    const label = SET_BONUS_LABELS[key];
    if (!label || !Number.isFinite(value)) return "";
    if (label.mult) return `+${Math.round((value - 1) * 100)}${label.suffix}`;
    if (label.reduction) return `−${value}${label.suffix}`;
    // Суффиксы заданы вперемешку («% уворота» и « защиты») — нормализуем пробел.
    const suffix = label.suffix.startsWith(" ") || label.suffix.startsWith("%") ? label.suffix : ` ${label.suffix}`;
    return `+${value}${suffix}`;
  }).filter(Boolean).join(", ");
}

// ── Сет в подсказках предметов ─────────────────────────────────────────────
// У предметов нет ссылки на сет, поэтому строим индекс «id предмета → id сета».
let SET_ITEM_INDEX = null;
function setOfItem(itemId) {
  if (!SET_ITEM_INDEX) {
    SET_ITEM_INDEX = {};
    for (const [setId, set] of Object.entries(SETS || {})) {
      for (const id of set.items || []) SET_ITEM_INDEX[id] = setId;
    }
  }
  const setId = SET_ITEM_INDEX[itemId];
  return setId && SETS[setId] ? { id: setId, ...SETS[setId] } : null;
}

// Сколько предметов сета надето сейчас (сломанные не считаются).
function wornSetCount(set) {
  const worn = new Set();
  for (const uid of Object.values(state.equipped || {})) {
    if (!uid) continue;
    const inst = getInstance(uid);
    if (!inst || isBroken(inst)) continue;
    worn.add(inst.id);
  }
  return (set.items || []).filter((id) => worn.has(id)).length;
}

// Текст для title: «Сет: X (3/8). Активно: +1 защита. Далее: +5% HP (4/8)».
function setTooltipText(itemId) {
  const found = setOfItem(itemId);
  if (!found) return "";
  const total = (found.items || []).length;
  const worn = wornSetCount(found);
  const thresholds = Object.keys(found.bonuses || {}).map(Number).sort((a, b) => a - b);
  const activeText = thresholds
    .filter((t) => t <= worn)
    .map((t) => setBonusText(found.bonuses[t]))
    .filter(Boolean)
    .join(", ");
  const nextText = thresholds
    .filter((t) => t > worn)
    .map((t) => `${setBonusText(found.bonuses[t])} (${t}/${total})`)
    .filter(Boolean)
    .join(", ");
  const parts = [`Сет: ${found.name} (${worn}/${total})`];
  if (activeText) parts.push(`Активно: ${activeText}`);
  if (nextText) parts.push(`Далее: ${nextText}`);
  return parts.join(". ");
}

// HTML-версия подсказки предмета для кастомного тултипа (data-tooltip).
// Возвращает готовую разметку; в атрибут её кладём через esc().
function itemTooltipHtml(item, inst = null, extra = []) {
  if (!item) return "";
  const parts = [`<div class="tt-title">${esc(item.name)}</div>`];
  for (const line of extra) if (line) parts.push(line);
  if (inst && inst.affix) parts.push(`<div class="tt-set">${esc(inst.affix.name)}</div>`);

  const stats = itemStats(item, inst);
  if (stats.length) parts.push(`<div class="tt-stat">${esc(stats.join(", "))}</div>`);

  const set = setOfItem(item.id);
  if (set) {
    const total = (set.items || []).length;
    const worn = wornSetCount(set);
    parts.push(`<div class="tt-set">Сет: ${esc(set.name)} (${worn}/${total})</div>`);

    const thresholds = Object.keys(set.bonuses || {}).map(Number).sort((a, b) => a - b);
    const active = thresholds
      .filter((t) => t <= worn)
      .map((t) => setBonusText(set.bonuses[t]))
      .filter(Boolean);
    if (active.length) parts.push(`<div class="tt-set-active">Активно: ${esc(active.join(", "))}</div>`);

    const next = thresholds
      .filter((t) => t > worn)
      .map((t) => `${setBonusText(set.bonuses[t])} (${t}/${total})`)
      .filter(Boolean);
    if (next.length) parts.push(`<div>Далее: ${esc(next.join(", "))}</div>`);
  }

  if (inst && isBroken(inst)) parts.push(`<div class="tt-negative">Сломано — бонусы не действуют</div>`);
  return parts.join("");
}

// Боевые слоты героя: три ячейки, которые в бою переключаются клавишами 1/2/3.

// ── QTE-модалки ────────────────────────────────────────────────────────────
// Комбо атаки/защиты: последовательность стрелок за 2 секунды.
const COMBO_ARROW_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
const COMBO_ARROW_GLYPHS = { ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→" };
const COMBO_LENGTH = 3;
const COMBO_TIME = 5.0;

// Интеллект влияет на время подсказки комбинации навыка.
function playerIntValue() {
  const st = stats();
  return Math.max(0, Math.floor((st.attrs?.int || 0) + (st.gearAttrs?.int || 0)));
}

// Доступные навыки: изучены, не на откате, хватает маны и куража.
// Подсказка показывает первый из них, но ввести можно комбинацию любого.
function availableSkillsForCombo() {
  const battle = view.battle;
  if (!battle) return [];
  const cd = battle.skillCd || {};
  return TALENTS.filter((t) => t.active
    && ((state.talents || {})[t.id] || 0) > 0
    && Array.isArray(t.combo) && t.combo.length >= 3
    && state.mana >= t.skill.manaCost
    && (!t.skill.rageCost || battle.rage >= t.skill.rageCost)
    && (cd[t.id] || 0) <= 0)
    .map((t) => ({ id: t.id, name: t.skill.name, icon: t.skill.icon || "✨", combo: [...t.combo] }));
}

function isArrowSubsequence(sub, seq) {
  let j = 0;
  for (const key of seq) {
    if (key === sub[j]) j += 1;
    if (j >= sub.length) return true;
  }
  return sub.length === 0;
}

function randomComboTarget(skills) {
  const random = () => Array.from({ length: COMBO_LENGTH }, () => COMBO_ARROW_KEYS[Math.floor(Math.random() * COMBO_ARROW_KEYS.length)]);
  for (let i = 0; i < 60; i += 1) {
    const target = random();
    // Обычная атака не должна собираться из стрелок комбинации навыка:
    // иначе при вводе навыка сработает обычный удар и навык будет недоступен.
    if (skills.some((skill) => isArrowSubsequence(target, skill.combo))) continue;
    return target;
  }
  return random();
}

// ── «Боевая печать»: ввод слов вместо стрелок ──────────────────────────────
// Базовое время и надбавки: длинное слово +1 с, аффикс +1 с.
const TYPING_TIME = 3.0;
const TYPING_TIME_LONG = 4.0;
const TYPING_TIME_AFFIX = 4.0;
const TYPING_TIME_LONG_AFFIX = 5.0;

function typingWordPool(mode, style) {
  if (mode === "attack") {
    return [...ATTACK_WORDS_BASE, ...ATTACK_WORDS_LONG];
  }
  if (mode === "defense") return DEFEND_WORDS;
  return SKILL_WORDS;
}

// Слово приёма закреплено за талантом, поэтому не меняется между ходами.
function skillWordForTalent(talent) {
  if (!talent) return SKILL_WORDS[0];
  const actives = TALENTS.filter((t) => t.active);
  const index = Math.max(0, actives.findIndex((t) => t.id === talent.id));
  return SKILL_WORDS[index % SKILL_WORDS.length] || SKILL_WORDS[0];
}

// Все изученные приёмы со своими словами и стоимостью.
function skillTypingEntries() {
  const battle = view.battle;
  if (!battle) return [];
  const cd = battle.skillCd || {};
  return TALENTS.filter((t) => t.active && ((state.talents || {})[t.id] || 0) > 0)
    .map((t) => ({
      id: t.id,
      talent: t,
      name: t.skill.name,
      icon: t.skill.icon || "✨",
      word: skillWordForTalent(t),
      manaCost: t.skill.manaCost || 0,
      rageCost: t.skill.rageCost || 0,
      cd: cd[t.id] || 0,
    }));
}

// Приёмы, которые можно ввести прямо сейчас: кураж 3+, мана и откат.
function readySkillTypingEntries() {
  const battle = view.battle;
  if (!battle) return [];
  return skillTypingEntries().filter((e) => battle.rage >= 3
    && battle.rage >= e.rageCost
    && state.mana >= e.manaCost
    && e.cd <= 0);
}

// Начатый приём ищется по префиксу слова: первая же буква из блока
// переключает печать с обычного удара на приём.
function matchSkillTyping(prefix) {
  if (!prefix) return null;
  return readySkillTypingEntries().find((e) => e.word.startsWith(prefix)) || null;
}

// Переключение печати с атаки на приём: слово атаки сохраняется для
// тусклого отображения, таймер приёма стартует заново.
function startSkillTypingFromAttack(entry, typed) {
  const typing = view.typingState;
  if (!typing || !entry) return false;
  view.typingState = {
    mode: "skill",
    word: entry.word,
    typed,
    timeLeft: TYPING_TIME,
    timeLimit: TYPING_TIME,
    startTime: Date.now(),
    style: typing.style,
    defendOnly: false,
    skillId: entry.id,
    attackWord: typing.attackWord || typing.word,
    attackTyped: typing.attackTyped !== undefined ? typing.attackTyped : typing.typed,
    attackStyle: typing.attackStyle || typing.style,
    attackAffix: typing.attackAffix || typing.affix || "",
    attackIsCritWord: Boolean(typing.attackIsCritWord || typing.isCritWord),
    failed: false,
    wrongIndex: -1,
    failDelay: 0,
  };
  return true;
}

// Гасим таймер прошлой фазы. Общий QTE-интервал и «Боевая печать» делят
// один setInterval, поэтому сбрасываем оба указателя.
function clearTypingTimer() {
  if (view.typingTimer != null) {
    clearInterval(view.typingTimer);
    view.typingTimer = null;
  }
  if (qteInterval !== null) {
    clearInterval(qteInterval);
    qteInterval = null;
  }
}

// Запуск нового слова над портретом. style фиксируется в момент ввода и
// передаётся дальше, чтобы смена оружия не меняла уже показанное слово.
function startTyping(mode, opts = {}) {
  // ПЕРВЫМ ДЕЛОМ убиваем «призрачный» таймер прошлой фазы, иначе он
  // досчитает старое слово и перепутает атаку с защитой.
  clearTypingTimer();
  const phaseNow = Date.now();
  view.currentPhaseId = phaseNow <= (view._lastPhaseId || 0)
    ? (view._lastPhaseId || 0) + 1
    : phaseNow;
  view._lastPhaseId = view.currentPhaseId;

  if (!view.battle || view.battle.over) return;
  // Новый раунд печати не должен наследовать старое комбо или зону удара.
  view.comboState = null;
  view.comboPaused = null;
  view.typingPaused = null;
  view.typingPausedAt = 0;
  view.battleModal = null;
  if (mode === "attack" && (!view.attackZone || !ZONE_NAME[view.attackZone])) {
    view.attackZone = "chest";
  }

  if (mode === "attack") {
    // Новый раунд атаки: старые результаты больше не нужны.
    view.currentAttackResult = null;
    view.currentAttackTypingSpeed = 999;
    view.currentAttackIsCrit = false;
    view.currentAttackHasAffix = false;
    view.currentAttackAffixType = null;
    view.pendingHitSfx = null;
  }

  const style = playerStrikeStyle();
  let word = "";
  let isCritWord = false;
  let hasAffix = false;
  let affix = "";
  let affixType = null;
  let timeLimit = TYPING_TIME;

  if (mode === "attack") {
    const st = stats();
    const agi = Math.max(0, Number(st.attrs?.agi) || 0);
    const int = Math.max(0, Number(st.attrs?.int) || 0);
    const critChance = 5 + agi * 1.0;
    const affixChance = 5 + int * 1.0;
    isCritWord = Math.random() * 100 < critChance;
    hasAffix = Math.random() * 100 < affixChance;

    const basePool = ATTACK_WORDS_BASE;
    const longPool = ATTACK_WORDS_LONG;
    const pool = isCritWord && longPool.length ? longPool : (basePool.length ? basePool : longPool);
    // Защита от повторов: базовое слово не выпадает дважды подряд.
    const fresh = pool.length > 1 ? pool.filter((w) => w !== view._lastTypedWord) : pool;
    const baseWord = opts.word || fresh[Math.floor(Math.random() * fresh.length)] || pool[0] || "SLASH";
    view._lastTypedWord = baseWord;

    affixType = hasAffix
      ? WORD_AFFIXES[Math.floor(Math.random() * WORD_AFFIXES.length)]
      : null;
    affix = affixType ? String(affixType).trim() : "";
    hasAffix = Boolean(affix);
    word = affix + baseWord;
    timeLimit = isCritWord && hasAffix
      ? TYPING_TIME_LONG_AFFIX
      : isCritWord
        ? TYPING_TIME_LONG
        : hasAffix ? TYPING_TIME_AFFIX : TYPING_TIME;
  } else {
    const pool = typingWordPool(mode, style);
    // Защита от повторов: то же слово не выпадает дважды подряд, если пул
    // позволяет выбрать другое. Для приёма слово закреплено за талантом.
    const fresh = pool.length > 1 ? pool.filter((w) => w !== view._lastTypedWord) : pool;
    const skillTalent = mode === "skill" && opts.skillId ? TALENT_MAP[opts.skillId] : null;
    word = opts.word
      || (skillTalent ? skillWordForTalent(skillTalent) : null)
      || fresh[Math.floor(Math.random() * fresh.length)]
      || pool[0]
      || "SLASH";
    view._lastTypedWord = word;
  }

  view.typingState = {
    mode,
    word,
    typed: "",
    timeLeft: timeLimit,
    timeLimit,
    startTime: Date.now(),
    style,
    defendOnly: opts.defendOnly === true,
    skillId: opts.skillId || null,
    isCritWord,
    hasAffix,
    affix,
    affixType,
    failed: false,
    wrongIndex: -1,
    failDelay: 0,
  };
}

// Старый вызов startCombo() из боевого потока теперь запускает печать.
function startCombo(mode, opts = {}) {
  startTyping(mode, opts);
}

// Точечное обновление слова без полного render(): буквы и полоска таймера.
function updateTypingDisplay() {
  const typing = view.typingState;
  if (!typing) return;
  document.querySelectorAll('[data-role="typing-word"]').forEach((el) => {
    const textEl = el.querySelector(".typing-word-text");
    if (textEl) textEl.innerHTML = typingWordTextHtml(typing);
    el.classList.toggle("failed", typing.failed === true);
  });
  // Прогресс слова в блоке приёмов: активный приём подсвечивается.
  document.querySelectorAll('[data-role="skill-word-chip"]').forEach((el) => {
    const active = typing.mode === "skill" && el.dataset.skillId === typing.skillId;
    el.classList.toggle("active", active);
    if (!active) return;
    const typedEl = el.querySelector(".skill-word-typed");
    const restEl = el.querySelector(".skill-word-rest");
    if (typedEl) typedEl.textContent = String(typing.typed || "");
    if (restEl) restEl.textContent = String(typing.word || "").slice(String(typing.typed || "").length);
  });
  const fill = document.querySelector('[data-role="typing-timer-fill"]');
  if (fill) {
    const timeLimit = Number(typing.timeLimit) > 0 ? Number(typing.timeLimit) : TYPING_TIME;
    fill.style.width = `${Math.max(0, Math.min(100, (typing.timeLeft / timeLimit) * 100))}%`;
  }
}

// Пауза QTE на время меню: состояние сохраняется и возвращается при закрытии.
// Для «Боевой печати» дополнительно сдвигаем startTime, чтобы время,
// проведённое в меню, не засчитывалось как медленный ввод.
function pauseCombo() {
  const hadCombo = Boolean(view.comboState);
  if (hadCombo) {
    view.comboPaused = view.comboState;
    view.comboState = null;
  }
  if (view.typingState) {
    view.typingPaused = view.typingState;
    view.typingPausedAt = Date.now();
    view.typingState = null;
    stopQteLoop();
  } else if (hadCombo) {
    stopQteLoop();
  }
}

function resumeCombo() {
  if (view.comboPaused) {
    view.comboState = view.comboPaused;
    view.comboPaused = null;
  }
  if (view.typingPaused) {
    const paused = view.typingPaused;
    const pausedFor = Math.max(0, Date.now() - (view.typingPausedAt || Date.now()));
    paused.startTime += pausedFor;
    view.typingState = paused;
    view.typingPaused = null;
    view.typingPausedAt = 0;
  }
}

// Клавиши 1/2/3: смена оружия в Real-Time. Замах моба продолжает тикать,
// прогресс слова атаки сбрасывается, слово генерируется под новое оружие.
function switchBattleWeapon(index) {
  const battle = view.battle;
  if (!battle || battle.over || view.preBattle || !view.duelActive) return;
  const uid = Array.isArray(state.weaponSlots) ? state.weaponSlots[index] : null;
  if (!uid) {
    toast(`Боевой слот ${index + 1} пуст. Назначьте оружие в разделе «Герой».`, "warn");
    return;
  }
  const inst = getInstance(uid);
  const item = inst ? ITEMS[inst.id] : null;
  if (!inst || !item) {
    toast("Оружие из боевого слота не найдено.", "warn");
    return;
  }
  const res = equipItemToSlot(uid, "mainhand");
  if (!res.ok) {
    toast(res.text, "warn");
    return;
  }
  battleLog(battle, `Вы меняете оружие на «${getItemDisplayName(inst)}».`, "info");
  if (battle.stunned) {
    battle.attackWord = battle.comboWord;
    battle.attackTyped = "";
    battle.attackAuto = "";
  } else {
    duelNewAttackWord(state, battle);
  }
  battle.activeSlot = "attack";
  render();
}

// Стиль текущего оружия — для мгновенного звука удара в момент последней стрелки.
function playerStrikeStyle() {
  const mainInst = state.equipped.mainhand ? getInstance(state.equipped.mainhand) : null;
  const weapon = mainInst ? ITEMS[mainInst.id] : null;
  if (state.archetype === "monk" && !weapon) {
    return (view.battle && STYLE_ORDER.includes(view.battle.monkStance))
      ? view.battle.monkStance
      : MONK_DEFAULT_STANCE;
  }
  return weapon ? weaponBestStyle(weapon, mainInst) : "slashing";
}

function resolveCombo(success) {
  const combo = view.comboState;
  if (!combo) return;
  if (combo.mode === "attack") {
    view.currentAttackResult = success;
    // Быстрый ввод (осталось больше 2.5 с) — гарантированный крит.
    // Медленный (меньше 1.5 с) — небольшой штраф к урону в exchange().
    view.currentAttackFast = success && combo.timeLeft > 2.5;
    view.currentAttackSlow = success && combo.timeLeft < 1.5;
    view.pendingHitSfx = null;
    if (success) {
      // Звук удара — сразу по последней верной стрелке: не ждём QTE защиты
      // и расчёт урона в exchange(). Повтор в exchange() подавим флагами.
      const isCrit = view.currentAttackFast;
      playHitSound(playerStrikeStyle(), { isCrit });
      view.pendingHitSfx = { crit: isCrit };
      view.comboState = null;
      startCombo("defense");
      render();
      return;
    }
    // Провал атаки: слабый удар (×0.3 в exchange) сразу, моб отвечает.
    // Ход не пропадает и QTE защиты после провала не запускается.
    view.comboState = null;
    view.comboPaused = null;
    doExchange({ type: "attack", comboSuccess: false, comboFast: false, comboSlow: false });
    return;
  }
  // Фаза защиты: успех — парирование, провал — полный удар моба.
  const defendOnly = combo.defendOnly === true;
  view.currentDefenseResult = success;
  const pendingHit = view.pendingHitSfx;
  view.pendingHitSfx = null;
  view.comboState = null;
  doExchange(defendOnly
    ? { type: "defend", defenseSuccess: success === true }
    : {
      type: "attack",
      comboSuccess: view.currentAttackResult === true,
      comboFast: view.currentAttackFast === true,
      comboSlow: view.currentAttackSlow === true,
      defenseSuccess: success === true,
      silentPlayerHit: Boolean(pendingHit),
      silentPlayerCrit: Boolean(pendingHit && pendingHit.crit),
    });
}

// Защищённый размен: исключение в doExchange не должно оставить бой без
// следующей фазы (иначе наступает «мёртвый ход»).
function safeDoExchange(action, fallbackPhase) {
  try {
    doExchange(action);
    return true;
  } catch (error) {
    console.error("[Боевая печать] doExchange упал:", error);
    if (view.battle && !view.battle.over && !view.typingState && !view.summary) {
      console.log("Переход к фазе:", fallbackPhase);
      startTyping(fallbackPhase);
      render();
    }
    return false;
  }
}

// Завершение слова «Боевой печати». Атака наносит удар сразу (type: attack),
// защита отвечает за удар врага (type: defend). Каждая фаза — отдельный
// размен, поэтому атака и защита больше не могут перепутаться.
function resolveTyping(success) {
  if (view.isResolvingTyping) {
    console.log("[Боевая печать] resolveTyping: результат уже обрабатывается — выход.");
    return;
  }
  view.isResolvingTyping = true;
  try {
    // Старый таймер не должен досчитать слово и вызвать второй resolve.
    clearTypingTimer();
    const current = view.typingState;
    const phaseId = view.currentPhaseId;
    console.log("[Боевая печать] resolveTyping", {
      success,
      phaseId,
      mode: current?.mode || null,
      word: current?.word || null,
      typed: current?.typed || null,
    });
    const typing = current;
    if (!typing) {
      console.log("[Боевая печать] resolveTyping: typingState уже null — выход.");
      return;
    }
    const timeSpent = (Date.now() - typing.startTime) / 1000;
    const mode = typing.mode;
    view.typingState = null;

    if (mode === "attack") {
      const isCrit = typing.isCritWord === true;
      view.currentAttackResult = success === true;
      view.currentAttackTypingSpeed = success === true ? timeSpent : 999;
      view.currentAttackIsCrit = isCrit;
      view.currentAttackHasAffix = typing.hasAffix === true;
      view.currentAttackAffixType = typing.affixType || null;
      view.pendingHitSfx = null;
      if (success === true) {
        // Звук удара — сразу. Флаги silent* в exchange() не дадут
        // проиграть его повторно.
        playHitSound(playerStrikeStyle(), { isCrit });
        view.pendingHitSfx = { crit: isCrit };
      }
      console.log("Фаза атаки завершена:", { success, typingSpeed: view.currentAttackTypingSpeed });
      safeDoExchange({
        type: "attack",
        typingPhase: "attack",
        phaseId,
        typingSpeed: view.currentAttackTypingSpeed,
        typingAttackSuccess: success === true,
        isCrit,
        hasAffix: typing.hasAffix === true,
        affixType: typing.affixType || null,
        silentPlayerHit: success === true,
        silentPlayerCrit: success === true && isCrit,
      }, "defense");
      return;
    }

    if (mode === "defense") {
      view.currentDefenseResult = success === true;
      view.pendingHitSfx = null;
      if (typing.defendOnly === true) {
        // Смена оружия/провал навыка: игрок не бьёт, только защищается.
        safeDoExchange({ type: "defend", defenseSuccess: success === true }, "attack");
        return;
      }
      console.log("Фаза защиты завершена:", { success });
      safeDoExchange({
        type: "defend",
        typingPhase: "defense",
        phaseId,
        defenseSuccess: success === true,
      }, "attack");
      return;
    }

    // Навык: слово открывает выбранное умение, ошибка — штраф и ответ врага.
    if (success === true && typing.skillId) {
      safeDoExchange({ type: "skill", id: typing.skillId }, "attack");
    } else {
      failSkillCombo();
    }
  } finally {
    view.isResolvingTyping = false;
  }
}

// Верная комбинация навыка: применяем навык через обычный размен.
function resolveSkillCombo(skillId) {
  if (!view.comboState) return;
  view.comboState = null;
  view.comboPaused = null;
  doExchange({ type: "skill", id: skillId });
}

// Ошибка в комбинации навыка: штраф по куражу и ответный удар моба.
function failSkillCombo() {
  const battle = view.battle;
  if (!battle) return;
  const int = playerIntValue();
  if (int >= 10) {
    battle.rage = Math.max(0, battle.rage - 1);
    battleLog(battle, `Печать навыка рассыпалась! Кураж −1 (Интеллект ${int}).`, "warn");
  } else {
    battle.rage = 0;
    battleLog(battle, `Печать навыка рассыпалась! Кураж сгорел (Интеллект ${int}).`, "warn");
  }
  view.comboState = null;
  view.comboPaused = null;
  view.typingState = null;
  view.typingPaused = null;
  view.currentAttackResult = false;
  view.currentAttackTypingSpeed = 999;
  view.currentAttackFast = false;
  view.currentAttackSlow = false;
  startTyping("defense", { defendOnly: true });
  render();
}

// Подсказка комбинации навыка: видна только ограниченное Интеллектом время.
function skillHintHtml(combo) {
  const skill = combo.skill;
  if (!skill || combo.skillHintTimeLeft <= 0) return "";
  const arrows = skill.combo.map((key, i) => {
    const done = i < combo.skillProgress;
    const next = i === combo.skillProgress;
    const color = done ? "#8fd98f" : (next ? "#ffe6a3" : "#dfb86c");
    return `<span class="skill-hint-arrow" data-role="skill-hint-arrow" style="color:${color}; font-weight:900; text-shadow:0 0 6px rgba(223,184,108,0.35);">${COMBO_ARROW_GLYPHS[key] || key}</span>`;
  }).join(" ");
  const pct = combo.skillHintTotal > 0
    ? Math.max(0, Math.min(100, (combo.skillHintTimeLeft / combo.skillHintTotal) * 100))
    : 0;
  return `
    <div data-role="skill-hint" style="display:block; margin:0 0 12px; padding:8px 12px; border-radius:8px; border:1px dashed rgba(223,184,108,0.6); background:linear-gradient(180deg, rgba(223,184,108,0.14), rgba(223,184,108,0.06));">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; font-size:12px;">
        <span style="color:var(--gold2); font-weight:700; white-space:nowrap;">${skill.icon} ${esc(skill.name)}</span>
        <span style="font-size:22px; line-height:1; letter-spacing:3px; white-space:nowrap;">${arrows}</span>
      </div>
      <div style="height:3px; background:rgba(0,0,0,0.35); border-radius:2px; margin-top:6px; overflow:hidden;">
        <span data-role="skill-hint-fill" style="display:block; height:100%; width:${pct}%; background:var(--gold2); transition:width 0.1s linear;"></span>
      </div>
    </div>`;
}

// QTE прямо в нижней панели боя, без всплывающей модалки.
function renderComboPanel() {
  const combo = view.comboState;
  if (!combo) return "";
  const isAttack = combo.mode === "attack";
  const accent = isAttack ? "#6fdc7f" : "#ff6b5b";
  const bg = isAttack ? "rgba(70, 180, 95, 0.12)" : "rgba(200, 70, 55, 0.14)";
  const border = isAttack ? "rgba(111, 220, 127, 0.55)" : "rgba(255, 107, 91, 0.55)";
  const pct = Math.max(0, Math.min(100, (combo.timeLeft / COMBO_TIME) * 100));
  // Цвет стрелок по фазе: атака — зелёные, защита — красные.
  const arrowPalette = isAttack
    ? { done: "#7ac47c", current: "#b9ffc6", upcoming: "rgba(111, 220, 127, 0.5)" }
    : { done: "#c25a4c", current: "#ffb3a8", upcoming: "rgba(255, 107, 91, 0.5)" };
  const arrows = combo.target.map((key, i) => {
    const done = i < combo.current.length;
    const current = i === combo.current.length;
    const color = done ? arrowPalette.done : (current ? arrowPalette.current : arrowPalette.upcoming);
    const scale = current ? " scale(1.18)" : " scale(1)";
    return `<span class="combo-arrow" data-role="combo-arrow" style="display:inline-block; font-weight:900; transition: color 0.1s, transform 0.1s; color:${color}; transform:${scale};">${COMBO_ARROW_GLYPHS[key] || key}</span>`;
  }).join("");
  const hint = isAttack ? skillHintHtml(combo) : "";
  return `
    <div class="combo-panel-inner" style="border:1px solid ${border}; background:${bg}; border-radius:12px; padding:10px 14px;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:6px;">
        <span style="font-weight:700; letter-spacing:0.06em; color:${accent}; font-size:14px;">${isAttack ? "ТВОЙ УДАР" : "ЗАЩИТА!"}</span>
        <span style="font-size:11px; color:var(--dim);">WASD / ←↑↓→</span>
      </div>
      ${hint}
      <div class="combo-arrows" data-role="combo-arrows" style="display:flex; justify-content:center; align-items:center; gap:10px; margin:0 0 8px; font-size:38px; line-height:1; min-height:48px;">${arrows}</div>
      <div class="qte-timer-bar" style="margin:0;"><span class="qte-timer-fill" data-role="combo-timer-fill" style="width:${pct}%"></span></div>
    </div>`;
}

function updateComboArrows() {
  const combo = view.comboState;
  if (!combo) return;
  document.querySelectorAll('.combo-panel [data-role="combo-arrow"]').forEach((el, i) => {
    const done = i < combo.current.length;
    const current = i === combo.current.length;
    const palette = combo.mode === "attack"
      ? { done: "#7ac47c", current: "#b9ffc6", upcoming: "rgba(111, 220, 127, 0.5)" }
      : { done: "#c25a4c", current: "#ffb3a8", upcoming: "rgba(255, 107, 91, 0.5)" };
    el.style.color = done ? palette.done : (current ? palette.current : palette.upcoming);
    el.style.transform = current ? "scale(1.18)" : "scale(1)";
  });
  document.querySelectorAll('.combo-panel [data-role="skill-hint-arrow"]').forEach((el, i) => {
    const done = i < combo.skillProgress;
    const next = i === combo.skillProgress;
    el.style.color = done ? "#8fd98f" : (next ? "#ffe6a3" : "#dfb86c");
  });
}

function stopQteLoop() {
  if (qteInterval !== null) {
    clearInterval(qteInterval);
    qteInterval = null;
  }
  view.typingTimer = null;
}

function ensureQteLoop() {
  if (qteInterval !== null) return;
  const battle = view.battle;
  const battleQte = battle && !battle.over && !view.summary && view.screen === "battle"
    && (view.typingState || view.comboState);
  if (!view.trainingQTE && !battleQte) return;

  qteInterval = setInterval(() => {
    const dt = QTE_TICK_MS / 1000;

    // Тренировка: печать слова с общим таймером. Время вышло — провал.
    if (view.trainingQTE) {
      const q = view.trainingQTE;
      q.timeLeft = (Number(q.timeLeft) || 0) - dt;
      updateTrainingQteDisplay();
      if (q.timeLeft <= 0) {
        stopQteLoop();
        completeTraining(false);
      }
      return;
    }

    // «Боевая печать»: таймер слова. При нуле — мгновенный провал.
    if (view.typingState) {
      const typing = view.typingState;
      // Опечатка: показываем красную букву короткую паузу, затем провал.
      if (typing.failed) {
        typing.failDelay = (Number(typing.failDelay) || 0) - dt;
        if (typing.failDelay <= 0) resolveTyping(false);
        return;
      }
      typing.timeLeft -= dt;
      const fill = document.querySelector('[data-role="typing-timer-fill"]');
      if (fill) {
        const timeLimit = Number(typing.timeLimit) > 0 ? Number(typing.timeLimit) : TYPING_TIME;
        fill.style.width = `${Math.max(0, Math.min(100, (typing.timeLeft / timeLimit) * 100))}%`;
      }
      if (typing.timeLeft <= 0) resolveTyping(false);
      return;
    }

    // Комбо атаки/защиты: таймер 2 секунды. Обновляем только полоску панели.
    if (view.comboState) {
      const combo = view.comboState;
      combo.timeLeft -= dt;
      const comboFill = document.querySelector('.combo-panel [data-role="combo-timer-fill"]');
      if (comboFill) comboFill.style.width = `${Math.max(0, Math.min(100, (combo.timeLeft / COMBO_TIME) * 100))}%`;

      // Подсказка комбинации навыка гаснет через 0.2 + INT*0.05 секунд.
      if (combo.skill && combo.skillHintTimeLeft > 0) {
        combo.skillHintTimeLeft = Math.max(0, combo.skillHintTimeLeft - dt);
        const hintFill = document.querySelector('.combo-panel [data-role="skill-hint-fill"]');
        if (hintFill && combo.skillHintTotal > 0) {
          hintFill.style.width = `${Math.max(0, Math.min(100, (combo.skillHintTimeLeft / combo.skillHintTotal) * 100))}%`;
        }
        if (combo.skillHintTimeLeft <= 0) {
          const hintEl = document.querySelector('.combo-panel [data-role="skill-hint"]');
          if (hintEl) hintEl.style.display = "none";
        }
      }

      if (combo.timeLeft <= 0) resolveCombo(false);
      return;
    }

    stopQteLoop();
  }, QTE_TICK_MS);
  // Этот же интервал обслуживает таймер слова «Боевой печати».
  view.typingTimer = qteInterval;
}

function resultHtml() {
  const summary = view.summary;
  if (!summary) return "";

  if (summary.fled) {
    return `<div class="result-overlay">
      <div class="result-card" style="border-color: #6b5122; max-width: 520px;">
        <h2>Вы сбежали</h2>
        <p class="result-note">Вы вырвались из боя, но получили удар в спину и потеряли 5 энергии.</p>
        <button class="btn primary" data-act="result-continue" type="button">Продолжить</button>
      </div>
    </div>`;
  }

  if (summary.victory) {
    const loot = Array.isArray(summary.loot) ? summary.loot : [];
    const lootHtml = loot.length
      ? `<div class="result-loot">
           <h3>Добыча</h3>
           <ul>
             ${loot.map((lootItem) => {
               const rCls = lootItem.kind === "equipment" ? rarityClass(getInstance(lootItem.uid)).trim() : "";
               return `
               <li${lootItem.kind === "recipe" ? ` class="loot-recipe"` : ""}>
                 ${iconHtml(lootItem.icon, 24)}
                 <span${rCls ? ` class="${rCls}"` : ""}>${esc(lootItem.name)}</span>
                 ${lootItem.kind === "recipe" ? `<span class="badge">Рецепт</span>` : ""}
                 ${lootItem.amount > 1 ? `<b>×${lootItem.amount}</b>` : ""}
               </li>
             `;
             }).join("")}
           </ul>
         </div>`
      : "";

    return `<div class="result-overlay">
      <div class="result-card win">
        <h2>Победа</h2>
        <p>+${summary.gold} 💰, +${summary.xp} ✦</p>
        ${lootHtml}
        ${view.ambush ? `<p class="result-note">🔪 ${AMBUSH_TEXT} Второй бой — бесплатный.</p>` : ""}
        <button class="btn primary" data-act="result-continue" type="button">Продолжить</button>
      </div>
    </div>`;
  }

  const battle = view.battle;
  const log = battle ? battle.log.slice(-12).map((entry) =>
    `<div class="log-line ${entry.cls}">${esc(entry.text)}</div>`
  ).join("") : "";

  return `<div class="result-overlay">
    <div class="result-card lose" style="max-width: 600px;">
      <h2>Поражение</h2>
      <p style="margin-bottom: 15px; color: #d97a6c;">Вы потеряли ${summary.lostGold} 💰 и пропустили день, восстанавливая силы.</p>
      ${summary.lostItemsText ? `<p style="margin-bottom: 15px; color: #d97a6c; font-weight: 600; background: rgba(194, 72, 60, 0.1); padding: 10px; border-radius: 8px; border: 1px dashed #6a2a24; text-align: left;">${summary.lostItemsText}</p>` : ""}
      
      <div class="battle-log" style="text-align: left; height: 180px; margin-bottom: 20px; background: #0e0a08; border-color: #6a2a24;">
        ${log || `<div class="log-line info">Лог боя пуст.</div>`}
      </div>

      <button class="btn primary" data-act="result-continue" type="button">В Йорстед</button>
    </div>
  </div>`;
}

function subHeader(title, subtitle, backScreen, backLabel = "← Назад") {
  return `<div class="subhead"><button class="btn tiny" data-act="goto" data-screen="${backScreen}" type="button">${backLabel}</button><div><h1>${title}</h1>${subtitle ? `<p class="muted">${subtitle}</p>` : ""}</div></div>`;
}

function scrollLog() { const log = platform.dom.byId("battle-log"); if (log) log.scrollTop = log.scrollHeight; }

// Точечное обновление боевого экрана: полосы, счётчики, лог и прогноз.
// Полный render() остаётся для смены экрана и показа summary.
// Всплывающие цифры боя (Этап 4): над карточкой моба — урон (красный) и крит
// (жёлтый), над героем — входящий урон (красный) и «Блок!» (синий).
function battlePopupsHtml(newLines) {
  if (!Array.isArray(newLines) || !newLines.length) return "";
  const cardPos = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return "left:50%; top:35%;";
    const r = el.getBoundingClientRect();
    return `left:${Math.round(r.left + r.width * 0.12)}px; top:${Math.round(r.top + 16)}px;`;
  };
  const enemyPos = cardPos(".fighter.enemy-fighter");
  const heroPos = cardPos(".fighter.hero-fighter");
  let dmgPopups = "";
  let popupShift = 0;
  for (const line of newLines) {
    const match = line.text.match(/(\d+)\s+урона/);
    const num = match ? match[1] : (line.text.match(/\d+/) || ["?"])[0];
    const shiftStyle = `margin-left:${popupShift * 16}px;`;
    popupShift += 1;
    if (line.cls === "hit") dmgPopups += `<div class="dmg-popup dmg-dmg" style="${enemyPos}${shiftStyle}">−${num}</div>`;
    else if (line.cls === "crit") dmgPopups += `<div class="dmg-popup dmg-crit" style="${enemyPos}${shiftStyle}">−${num}</div>`;
    else if (line.cls === "block" && /блокиру/.test(line.text)) dmgPopups += `<div class="dmg-popup dmg-block" style="${heroPos}${shiftStyle}">Блок!</div>`;
    else if (line.cls === "enemy") dmgPopups += `<div class="dmg-popup dmg-taken" style="${heroPos}${shiftStyle}">−${num}</div>`;
  }
  return dmgPopups ? `<div class="dmg-overlay">${dmgPopups}</div>` : "";
}

function renderBattle() {
  const battle = view.battle;
  if (!battle) { render(); return; }
  const st = stats();

  const setBar = (role, value, max) => {
    const el = document.querySelector(`[data-role="${role}"] span`);
    if (el) el.style.width = `${Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))}%`;
  };
  setBar("hero-hp", state.hp, st.maxHp);
  setBar("hero-mana", state.mana, st.maxMana);
  setBar("rage-bar", battle.rage, 5);
  setBar("enemy-hp", battle.hp, battle.maxHp);
  setBar("enemy-mana", battle.enemy.mana || 0, battle.enemy.maxMana || 1);
  setBar("enemy-rage", battle.enemy.rage || 0, battle.enemy.maxRage || 5);
  setBar("balance", battle.balance ?? battle.maxBalance ?? 100, battle.maxBalance || 100);
  const balanceFill = document.querySelector('[data-role="balance-fill"]');
  if (balanceFill) {
    balanceFill.style.width = `${Math.max(0, Math.min(100, ((battle.balance ?? battle.maxBalance ?? 100) / Math.max(1, battle.maxBalance || 100)) * 100))}%`;
  }
  const balanceValue = document.querySelector('[data-role="balance-text"]');
  if (balanceValue) balanceValue.textContent = String(Math.max(0, Math.round(battle.balance ?? battle.maxBalance ?? 100)));
  duelUpdateBars();
  const enemyRageBadgeEl = document.querySelector('[data-role="enemy-rage-badge"]');
  if (enemyRageBadgeEl) enemyRageBadgeEl.style.display = (battle.enemy.rage || 0) >= 3 ? "" : "none";

  const setText = (role, text) => {
    const el = document.querySelector(`[data-role="${role}"]`);
    if (el) el.textContent = text;
  };
  setText("hero-hp-text", `${state.hp}/${st.maxHp} HP`);
  setText("hero-mana-text", `${state.mana}/${st.maxMana} MP`);
  setText("rage-text", `Кураж: ${battle.rage}/5`);
  setText("enemy-hp-text", `${battle.hp}/${battle.maxHp} HP`);

  const topbar = platform.dom.byId("topbar");
  if (topbar) topbar.innerHTML = topbarHtml(st);

  const prevLog = view.prevLog || 0;
  const newLines = battle.log.length > prevLog ? battle.log.slice(prevLog) : [];
  const logEl = document.querySelector('[data-role="battle-log"]');
  if (logEl) {
    logEl.innerHTML = battle.log.slice(-18).map((entry) => `<div class="log-line ${entry.cls}">${esc(entry.text)}</div>`).join("")
      || `<div class="log-line info">Бой начинается — напечатайте слово для удара.</div>`;
    logEl.scrollTop = logEl.scrollHeight;
  }
  const sidebarLogEl = document.querySelector('[data-role="battle-log-sidebar-body"]');
  if (sidebarLogEl) {
    sidebarLogEl.innerHTML = battleLogLinesHtml(battle.log) || `<div class="log-line info">Бой начинается — напечатайте слово для удара.</div>`;
    sidebarLogEl.scrollTop = sidebarLogEl.scrollHeight;
  }
  view.prevLog = battle.log.length;

  document.querySelector(".dmg-overlay")?.remove();
  const popups = battlePopupsHtml(newLines);
  if (popups) document.body.insertAdjacentHTML("beforeend", popups);
}

function render() {
  // Подсказка не должна «зависать» после перерисовки DOM.
  hideTooltip();
  const screen = platform.dom.byId("screen"); const topbar = platform.dom.byId("topbar");
  if (!state.created) { 
    if (!view.create) resetCreate(); 
    topbar.innerHTML = ""; topbar.hidden = true; 
    screen.innerHTML = createHtml(); screen.dataset.screen = "create"; 
    if (view.settingsOpen) screen.insertAdjacentHTML("beforeend", settingsModalHtml());
    return; 
  }

  // Смерть врага: сначала fade-out карточки (.dead), и только через 0.5с —
  // модалка победы. Флаг живёт на объекте боя, поэтому новый бой его сбрасывает.
  if (view.battle && view.battle.hp <= 0 && view.summary?.victory && !view.battle._deathShown) {
    const enemyCard = document.querySelector(".fighter.enemy-fighter");
    if (enemyCard) {
      view.battle._deathShown = true;
      enemyCard.classList.add("dead");
      setTimeout(render, 500);
      return;
    }
  }
  
  topbar.hidden = false; 
  const st = stats(); 
  topbar.innerHTML = topbarHtml(st); 
  let html = "";

  switch (view.screen) {
    case "floor": html = floorHtml(); break;
    case "hub": html = hubHtml(st); break; case "market": html = marketHtml(); break; case "forge": html = forgeHtml(); break; case "alchemy": html = alchemyHtml(); break;
    case "jewelry": html = jewelryHtml(); break; case "hotel": html = hotelHtml(); break; case "training": html = trainingHtml(); break; case "hero": html = heroHtml(st); break;
    case "tower": html = towerHtml(); break; case "battle": html = battleHtml(st); break; default: html = hubHtml(st);
  }
  
  if (view.questsOpen) html += questsModalHtml();
  if (view.settingsOpen) html += settingsModalHtml();
  if (view.companionInfo) html += renderCompanionInfoModal();
  if (view.titleModal) html += titleModalHtml();
  if (view.achievementsOpen) html += renderAchievementsModal();
  if (view.abilitiesOpen) html += renderAbilitiesModal();
  if (view.talentsModal) html += talentsModalHtml();
  if (view.weaponSwap) html += weaponSwapHtml();
  if (view.weaponSlotPicker !== null && view.weaponSlotPicker !== undefined) html += weaponSlotPickerHtml();
  if (view.levelUp) html += levelUpModalHtml();

  // В лавках единый экран взаимодействия уже вернул forgeHtml/alchemyHtml/
  // jewelryHtml. На остальных экранах диалог/торговля/крафт рисуются поверх.
  const interaction = view.npcInteraction;
  const shopOwnsInteraction = !!interaction
    && ["forge", "alchemy", "jewelry"].includes(view.screen)
    && SHOP_NPCS[view.screen] === interaction.npcId;
  if (interaction && !shopOwnsInteraction && view.screen !== "battle") {
    html += interactionOverlayHtml(interaction.npcId);
  }

  if (view.bestiaryOpen) html += bestiaryModalHtml();
  if (view.purchaseConfirm) html += renderPurchaseConfirmModal();
  if (view.chestResults) html += chestResultModalHtml();
  if (view.chestReveal) html += renderFifaChestModal();
  if (view.chestMassResults) html += renderMassChestModal();
  if (view.chestMenu) html += chestMenuHtml();
  
  const prevLog = view.prevLog || 0;
  const newLines = view.battle && view.battle.log.length > prevLog ? view.battle.log.slice(prevLog) : [];
  if (view.battle) view.prevLog = view.battle.log.length;
  html += battlePopupsHtml(newLines);
  if (view.screen === "battle" && (!view.battle || (view.battle.round || 0) === 0)) view.prevLog = 0;

  // Мини-игра тренировки: модалка живёт поверх экрана Зала Охотников.
  if (view.trainingQTE) html += renderNewTrainingQte();

  // События и сцены — единая нижняя панель (Bottom Sheet) с журналом.
  // Рисуются в самом конце, поверх интерфейса, но без затемнения экрана.
  const hasEventSheet = Boolean(state.activeEvent || state.activeFloorEvent || view.eventResult);
  if (hasEventSheet && !state.activeNpcId && !state.activeSceneId && view.screen !== "battle") {
    html += state.activeFloorEvent ? renderFloorEventModal() : renderEventModal();
  }
  if (state.activeSceneId && view.screen !== "battle") html += sceneModalHtml();

  // Фон экрана переживает перерисовку: если URL и классы не изменились,
  // возвращаем старый уже отрисованный узел вместо создания нового.
  // Это убирает вспышку фонового изображения при render().
  const prevBg = screen.querySelector(":scope > .screen-bg");
  const prevBgKey = prevBg ? `${prevBg.className}|${prevBg.getAttribute("style") || ""}` : null;

  screen.innerHTML = html;

  if (prevBg && prevBgKey) {
    const nextBg = screen.querySelector(":scope > .screen-bg");
    if (nextBg && `${nextBg.className}|${nextBg.getAttribute("style") || ""}` === prevBgKey) {
      nextBg.replaceWith(prevBg);
    }
  }
  screen.dataset.screen = view.screen; 
  
  if (view.screen === "battle") requestAnimationFrame(scrollLog);
  if (view.trainingQTE || view.screen === "battle") ensureQteLoop();
  else stopQteLoop();

  // Real-Time дуэль: таймер живёт, пока открыт боевой экран.
  if (view.screen === "battle" && view.duelActive && view.battle && !view.battle.over && !view.summary && !view.preBattle) {
    duelEnsureTimer();
    duelUpdateBars();
  } else if (view.screen !== "battle" || !view.duelActive) {
    duelStopTimer();
  }

  updateLocationAudio(view.screen, view.currentFloor, view.battle);

  // Боковые журналы живут поверх экрана и пересоздаются в самом конце,
  // после подстановки основного HTML: оба журнала справа, на всех экранах.
  screen.insertAdjacentHTML("beforeend", renderBattleLogSidebar());
  screen.insertAdjacentHTML("beforeend", renderEventLogSidebar());
}

// Музыка/амбиент по текущему экрану. Вызывается из render(); смена трека
// происходит только при реальной смене id (см. LocationAudio.playMusic).
function updateLocationAudio(screen, floorId, battle) {
  LocationAudio.init(); // на случай первого запуска

  if (screen === "battle" && battle) {
    LocationAudio.playMusic(battle.boss ? "boss" : "battle");
    LocationAudio.playAmbient(null); // В бою амбиент не нужен
    return;
  }
  if (screen === "floor" && floorId) {
    LocationAudio.playMusic("tower");
    LocationAudio.playAmbient("floor_" + floorId);
    return;
  }
  if (screen === "tower" || screen === "hero") {
    LocationAudio.playMusic("tower");
    LocationAudio.playAmbient(null);
    return;
  }
  if (screen === "market") {
    LocationAudio.playMusic("market"); // Рынок звучит в слоте музыки
    LocationAudio.playAmbient(null);   // и не дублируется как амбиент
    return;
  }
  if (["hub", "forge", "alchemy", "jewelry", "hotel", "training"].includes(screen)) {
    LocationAudio.playMusic("hub");
    LocationAudio.playAmbient(screen);
    return;
  }
}

function beginBattle(def, floorId, opts = {}) {
  if (def && def.id && !state.bestiary[def.id]) { state.bestiary[def.id] = true; saveState(); }
  view.tripActive = true;
  view.battle = createBattle(def, floorId);
  // Арена: каждая следующая волна усиливает моба (HP и атака).
  if (opts.arenaWave) {
    const wave = Math.max(1, Number(opts.arenaWave) || 1);
    if (wave > 1) {
      const hpMult = 1 + (wave - 1) * 0.15;
      const atkMult = 1 + (wave - 1) * 0.08;
      view.battle.enemy.hp = Math.round(view.battle.enemy.hp * hpMult);
      view.battle.enemy.maxHp = view.battle.enemy.hp;
      view.battle.hp = view.battle.enemy.hp;
      view.battle.maxHp = view.battle.enemy.maxHp;
      view.battle.enemy.atk = Math.round(view.battle.enemy.atk * atkMult);
      battleLog(
        view.battle,
        `Волна ${wave}: противник усилен (+${Math.round((hpMult - 1) * 100)}% HP, +${Math.round((atkMult - 1) * 100)}% атаки).`,
        "warn"
      );
    }
  }
  if (opts.ambush) {
    view.battle.ambush = true;
    battleLog(view.battle, AMBUSH_TEXT, "warn");
  }
  view.screen = "battle";
  view.summary = null;
  view.battleModal = null;
  view.dollSlot = null;
  view.invItemUid = null;
  view.attackZone = "chest";
  duelStopTimer();
  view.duelActive = false;
  view.comboState = null;
  view.comboPaused = null;
  view.typingState = null;
  view.typingPaused = null;
  view.typingPausedAt = 0;
  view.currentAttackResult = null;
  view.currentAttackTypingSpeed = 999;
  view.currentDefenseResult = null;
  view.currentAttackFast = false;
  view.currentAttackSlow = false;
  view.pendingHitSfx = null;
  // Экран подготовки: QTE стартует только после Enter/Space.
  view.preBattle = true;
  view.weaponSlotPicker = null;
  render();
}

function endTrip() { if (!view.tripActive) return; view.tripActive = false; advancePhase(); }

function onInput(event) {
  const el = event.target;
  if (el?.dataset?.role === "create-name" && view.create) {
    view.create.name = el.value;
    const caption = document.querySelector(".preview-portrait-caption b");
    if (caption) caption.textContent = el.value.trim() || "Странник";
    return;
  }
  if (el?.dataset?.role === "inv-search") {
    view.invSearch = el.value;
    const pos = el.selectionStart;
    render();
    const input = document.querySelector('[data-role="inv-search"]');
    if (input) { input.focus(); try { input.setSelectionRange(pos, pos); } catch { } }
  }
  // Ползунок громкости звуковых эффектов (Этап 4). Без рендера: обновляем
  // только подписанное значение, чтобы ползунок не терял фокус.
  if (el?.dataset?.role === "sfx-volume") {
    Sfx.setVolume(el.value);
    const label = document.querySelector('[data-role="sfx-volume-label"]');
    if (label) label.textContent = Math.round(Sfx.getVolume() * 100) + "%";
    Sfx.play("hit_slash", { volume: Sfx.getVolume() });
  }
}

const NPC_NAMES = { ron: "Рон, кузнец", elain: "Элейн, алхимик", elize: "Элиза, ювелир", stella: "Стелла, хозяйка гостиницы", ivan: "Иван, Капитан", timmy: "Тимми, молодой охотник", arthur: "Артур, странствующий торговец", mira: "Мира, травница", alva: "Альва, певица", solveig: "Сольвейг, наёмница" };

function getRandomPhrase(npcId, phraseType) {
  const set = DIALOGS[npcId];
  const phrase = set ? set[phraseType] : null;
  if (Array.isArray(phrase) && phrase.length) return genderText(phrase[Math.floor(Math.random() * phrase.length)]);
  return genderText(phrase || "");
}

// Подставляет форму обращения из плейсхолдера {gender_term:мужская|женская}.
// Используется для текстов из data.js, которые остаются обычными строками.
function genderText(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\{gender_term:([^|}]+)\|([^}]+)\}/g, (_, male, female) => getGenderTerm(male, female));
}

// Следующий шаг FIFA-карточки: шаг + точечная перерисовка с затуханием.
function advanceChestReveal() {
  const reveal = view.chestReveal;
  const maxSteps = Math.max(1, Number(reveal?.maxSteps) || 4);
  if (!reveal || reveal.animating || reveal.step >= maxSteps) return;
  reveal.animating = true;
  reveal.step += 1;
  if (typeof Sfx !== "undefined" && Sfx.play) Sfx.play("open");
  const container = document.querySelector(".fifa-card-container");
  if (container) {
    container.style.opacity = "0";
    setTimeout(() => {
      if (!view.chestReveal) return;
      container.innerHTML = renderFifaCardContent();
      container.style.opacity = "1";
    }, 200);
  }
  setTimeout(() => {
    if (view.chestReveal === reveal) reveal.animating = false;
  }, 400);
}

// Закрытие FIFA-карточки: убираем оверлей и возвращаем игрока к экрану.
function closeChestReveal() {
  if (view.chestReveal?.animating) return;
  document.querySelector(".fifa-card-overlay")?.remove();
  view.chestReveal = null;
  saveState();
  render();
}

function onClick(event) {
  event.preventDefault();
  const el = event.target.closest("[data-act]"); 
  if (!el || el.disabled) return; 

  const act = el.dataset.act; const id = el.dataset.id; let res;
  
  // Вспомогательная функция для тряски экрана
  const shake = () => {
    const screen = document.querySelector("section.battle");
    if (screen) {
      screen.classList.add("screen-shake");
      setTimeout(() => screen.classList.remove("screen-shake"), 300);
    }
  };

  switch (act) {
    case "start-tutorial-qte": {
      // Курс новичка: три случайных слова подряд. Повтор подряд не выдаём,
      // чтобы переход между словами был заметен.
      const pool = ["УДАР", "ВЗМАХ", "БЛОК"];
      const words = [];
      for (let i = 0; i < 3; i++) {
        let word = pool[Math.floor(Math.random() * pool.length)];
        if (i > 0 && word === words[i - 1]) word = pool[(pool.indexOf(word) + 1) % pool.length];
        words.push(word);
      }
      view.tutorialQte = {
        words,
        wordIndex: 0,
        word: words[0],
        typed: "",
        completed: 0,
        timeLeft: 10.0,
      };
      view.tutorialStep = 0;
      render();
      break;
    }
    case "bio-option": {
      const c = view.create;
      if (!c) break;
      c.answers[el.dataset.step] = el.dataset.option;
      render();
      break;
    }
    case "bio-next": {
      const c = view.create;
      if (!c) break;
      c.step += 1;
      render();
      break;
    }
    case "bio-back": {
      const c = view.create;
      if (!c) break;
      c.step = Math.max(0, c.step - 1);
      render();
      break;
    }
    case "bio-portrait": {
      const c = view.create;
      if (!c) break;
      c.portrait = el.dataset.id;
      render();
      break;
    }
    case "bio-gender": {
      const c = view.create;
      if (!c) break;
      c.gender = el.dataset.id === "female" ? "female" : "male";
      const allowed = PORTRAITS.filter((p) => p.gender === c.gender);
      if (!allowed.some((p) => p.id === c.portrait)) c.portrait = (allowed[0] || PORTRAITS[0]).id;
      render();
      break;
    }
    case "bio-archetype": {
      const c = view.create;
      if (!c) break;
      const nextArchetype = el.dataset.id;
      // Смена класса не должна тянуть ответы от прежнего архетипа.
      if (c.archetype !== nextArchetype) {
        c.archetype = nextArchetype;
        for (const step of BACKGROUND_STEPS) {
          if (step.optionsByArchetype) delete c.answers[step.id];
        }
      }
      render();
      break;
    }
    case "rest":
      if (battleActive()) { toast("Сначала завершите бой.", "warn"); break; }
      // Проверяем, где герой отдыхает: тост про Башню уместен только в Башне.
      const wasInTower = Boolean(view.tripActive) && ["tower", "floor", "battle"].includes(view.screen);
      // Ночь фиксируем до freeRest(): ночной отдых сразу переводит время в утро.
      const restStartedAtNight = isNight();
      res = freeRest();
      if (wasInTower && (restStartedAtNight || isNight())) {
        view.screen = "hub";
        view.tripActive = false;
        toast("Ночь. Вы покидаете Башню.", "warn");
      } else {
        toast(res.text, res.ok ? "ok" : "warn");
      }
      view.ambush = null;
      view.sceneGroup = null;
      view.sceneGroupFloorId = null;
      render();
      break;
    case "floor-open": view.currentFloor = Number(el.dataset.floor); view.screen = "floor"; render(); break;
    case "quests-open": view.questsOpen = true; render(); break;
    case "quests-close": view.questsOpen = false; Sfx.play("chest_close"); render(); break;
    case "settings-open": view.settingsOpen = true; render(); break;
    case "settings-close": view.settingsOpen = false; Sfx.play("chest_close"); render(); break;
    case "settings-tab": view.settingsTab = el.dataset.tab || "audio"; render(); break;
    case "test-sound": Sfx.play("open"); break;
    case "bestiary-open": view.bestiaryOpen = true; render(); break;
    case "bestiary-close": view.bestiaryOpen = false; Sfx.play("chest_close"); render(); break;
    case "bestiary-filter":
      if (["all", "defeated", "unknown", "boss"].includes(el.dataset.filter)) { view.bestiaryFilter = el.dataset.filter; render(); }
      break;
    case "levelup-close": view.levelUp = null; render(); break;
    case "companion-info": {
      if (!COMPANION_MAP[el.dataset.id]) break;
      view.companionInfo = el.dataset.id;
      render();
      break;
    }
    case "companion-info-close": view.companionInfo = null; render(); break;
    case "companion-info-stop": break;
    case "goto":
      if (el.dataset.screen === "tower") view.currentFloor = null;
      go(el.dataset.screen);
      break;
    case "npc-talk": {
      const npcId = el.dataset.npc;
      if (!NPC_TALK_TARGETS[npcId]) break;
      // У компаньонов «Поговорить» открывает найм-диалог (ветки hire_*).
      startNpcInteraction(npcId);
      render();
      break;
    }
    case "dialog-option": {
      const npcId = el.dataset.npc;
      const tree = DIALOG_TREES[npcId];
      if (!tree) break;
      const node = interactionNode(npcId) || tree.start;
      const rawIndex = el.dataset.option !== undefined ? el.dataset.option : el.dataset.index;
      const opt = node && Array.isArray(node.options) ? node.options[Number(rawIndex)] : null;
      if (!opt) break;
      if (!dialogRequiresMet(opt.requires)) break;
      if (opt.effects) {
        const applied = applyDialogEffects(opt.effects, npcId);
        if (applied.text) toast(applied.text, opt.mood === "bad" ? "warn" : "ok");
      }
      if (opt.mood) {
        state.npcMood[npcId] = opt.mood;
        saveState();
      }

      // Похвала/оскорбление недоступны этому NPC ближайшие 3 дня.
      const cooldownTag = dialogOptionCooldownTag(opt);
      if (cooldownTag) {
        state.dialogCooldowns = state.dialogCooldowns || {};
        state.dialogCooldowns[`${npcId}_${cooldownTag}`] = state.day;
        saveState();
      }

      const setNode = (next) => {
        if (!view.npcInteraction || view.npcInteraction.npcId !== npcId) {
          startNpcInteraction(npcId, next);
        } else {
          view.npcInteraction.node = next;
          view.npcInteraction.mode = "dialog";
        }
      };

      // Действия-переходы между режимами одной state machine.
      if (opt.action === "open_trade" || opt.action === "open_shop") {
        openDialogTrade(npcId);
        break;
      }
      if (opt.action === "open_craft") {
        openDialogCraft(npcId);
        break;
      }
      if (opt.action === "open_service") {
        openDialogShop(npcId);
        break;
      }

      if (opt.effects && opt.effects.action === "hire") {
        const companionId = opt.effects.companionId || npcId;
        const hired = finalizeCompanionHire(companionId);
        if (!hired.ok) { toast(hired.text, "warn"); break; }
        toast(hired.text, "ok");
        view.hiringCompanion = null;
        if (opt.next === null || opt.next === undefined) closeNpcInteraction();
        else setNode(opt.next);
        render();
        break;
      }
      // Сюжетное задание выдаётся прямо в диалоге: effects.action = "accept_story".
      if (opt.effects && opt.effects.action === "accept_story") {
        const storyRes = acceptStoryQuest(opt.effects.questId);
        if (!storyRes.ok) { toast(storyRes.text, "warn"); break; }
        // Флаг скрывает опцию предложения, пока задание не сдано.
        state.dialogFlags[`story_accepted_${opt.effects.questId}`] = true;
        saveState();
        toast("Задание принято", "ok");
        if (opt.next === null || opt.next === undefined) closeNpcInteraction();
        else setNode(opt.next);
        render();
        break;
      }

      // Курс новичка у Ивана: прогресс обучения 0 → 1.
      if (opt.effects && opt.effects.action === "set_tutorial_progress") {
        state.tutorialProgress = opt.effects.value;
        saveState();
        if (opt.next === null || opt.next === undefined) closeNpcInteraction();
        else setNode(opt.next);
        render();
        break;
      }

      // next: null — «Уйти»: закрываем взаимодействие и возвращаемся к
      // обычному экрану. В лавке (forge/alchemy/jewelry) «Уйти» означает
      // выход на Торговую площадь, а не рендер старого shop-UI.
      if (opt.next === null || opt.next === undefined) {
        const farewell = getRandomPhrase(npcId, "farewell");
        // Завершение вступительной сцены: снимаем оба флага и сохраняемся,
        // чтобы сцена не появилась снова после перезагрузки.
        const wasIntro = view.introPending || state.introPending;
        closeNpcInteraction();
        if (wasIntro) {
          view.introPending = false;
          state.introPending = false;
          saveState();
        }
        if (["forge", "alchemy", "jewelry"].includes(view.screen)) {
          go("market");
        } else {
          render();
        }
        if (farewell) toast(farewell, "ok");
        break;
      }
      setNode(opt.next);
      render();
      break;
    }
    case "interaction-back":
    case "trade-close": {
      // Из торговли/крафта — назад к диалогу, без выхода из лавки.
      interactionBackToDialog();
      render();
      break;
    }
    case "mnb-trade-buy": {
      const npcId = el.dataset.npc;
      const key = el.dataset.key;
      const activeTrade = view.npcInteraction && view.npcInteraction.npcId === npcId && view.npcInteraction.mode === "trade";
      if (!activeTrade || !MNB_TRADE_NPCS[npcId] || !key || el.classList.contains("disabled")) break;
      if (npcId === "arthur") {
        const stockEntry = (view.traderStock || []).find((entry) => (entry.kind === "gear" ? entry.uid : entry.id) === key);
        if (!stockEntry) break;
        const item = stockEntry.kind === "gear" ? ITEMS[stockEntry.inst?.id] : ITEMS[stockEntry.id];
        view.purchaseConfirm = {
          id: key,
          shop: "market",
          npcId,
          name: stockEntry.kind === "gear" ? getItemDisplayName(stockEntry.inst) : (item?.name || key),
          price: stockEntry.price,
        };
      } else {
        const shop = MNB_TRADE_NPCS[npcId];
        const item = ITEMS[key];
        if (!item) break;
        view.purchaseConfirm = { id: key, shop, npcId, name: item.name, price: priceFor(item, shop).price };
      }
      render();
      break;
    }
    case "mnb-trade-sell": {
      const npcId = el.dataset.npc;
      const key = el.dataset.key;
      const kind = el.dataset.kind;
      const activeTrade = view.npcInteraction && view.npcInteraction.npcId === npcId && view.npcInteraction.mode === "trade";
      if (!activeTrade || !MNB_TRADE_NPCS[npcId] || !key) break;
      let res;
      if (kind === "potion") {
        const item = ITEMS[key];
        const count = state.potions[key] || 0;
        if (!item || count <= 0) {
          res = { ok: false, text: "Нечего продавать." };
        } else {
          const price = sellPrice(item);
          state.potions[key] = count - 1;
          state.gold += price;
          saveState();
          res = { ok: true, text: `Продано: ${item.name} (+${price} 💰).` };
        }
      } else {
        res = sellItem(key);
      }
      toast(res.text, res.ok ? "ok" : "warn");
      render();
      break;
    }
    case "npc-talk-backdrop": {
      if (!view.npcInteraction) break;
      // Из торговли/крафта клик мимо возвращает к диалогу, а не закрывает всё.
      if (view.npcInteraction.mode !== "dialog") { interactionBackToDialog(); render(); break; }
      // Вступительную сцену нельзя закрыть кликом мимо — только кнопкой «До встречи».
      if (view.introPending || state.introPending) break;
      closeNpcInteraction();
      if (["forge", "alchemy", "jewelry"].includes(view.screen)) {
        go("market");
      } else {
        render();
      }
      break;
    }
    case "interaction-noop": break;
    case "npc-talk-topics": {
      const npcId = el.dataset.npc;
      if (!npcId) break;
      if (!view.npcInteraction || view.npcInteraction.npcId !== npcId) startNpcInteraction(npcId);
      view.topicReply = null;
      view.npcInteraction.node = DIALOG_TOPICS_NODE;
      render();
      break;
    }
    case "dialog-topics-back": {
      if (!view.npcInteraction) break;
      view.topicReply = null;
      view.npcInteraction.node = "start";
      render();
      break;
    }
    case "topic-open": {
      const npcId = el.dataset.npc;
      const topic = (DIALOG_BRANCHES[npcId] || []).find((t) => t.id === el.dataset.topic);
      if (!topic || !topicAvailable(topic, npcId)) break;
      const phrase = topic.replies[Math.floor(Math.random() * topic.replies.length)];
      view.topicReply = { npc: npcId, topic: topic.id, reply: phrase };
      state.dialogTopicsSeen[npcId + ":" + topic.id] = true;
      saveState();
      render();
      break;
    }
    case "npc-talk-close": {
      const npc = view.npcInteraction ? view.npcInteraction.npcId : null;
      closeNpcInteraction();
      if (["forge", "alchemy", "jewelry"].includes(view.screen)) {
        go("market");
      } else {
        render();
      }
      if (npc) toast(getRandomPhrase(npc, "farewell"), "ok");
      break;
    }
    case "npc-talk-shop": {
      openDialogShop(el.dataset.npc);
      break;
    }
    case "npc-talk-quest": {
      const npcId = el.dataset.npc;
      if (!npcId) break;
      // Задания с доски принимаются только на Доске объявлений.
      toast("Все мои заявки висят на Доске объявлений в Зале Охотников. Загляни туда.", "ok");
      render();
      break;
    }
    case "accept-week-quest": {
      res = acceptWeekQuest(el.dataset.npc);
      toast(res.text, res.ok ? "ok" : "warn");
      render();
      break;
    }
    case "story-choice": {
      const npcId = el.dataset.npc;
      if (npcId) {
        state.npcDialogueIndex[npcId] = (state.npcDialogueIndex[npcId] || 0) + 1;
        saveState();
        view.storyJustPlayed = true;
        render();
      }
      break;
    }
    case "story-leave": {
      view.storyJustPlayed = false;
      go("hub");
      break;
    }
    case "event-action": {
      const event = state.activeEvent;
      if (!event || event.id !== el.dataset.event) break;
      const st = stats();
      const result = resolveEventAction(el.dataset.option, event, state, st);
      if (!result.ok) { pushEventLog("Исход события", result.text); render(); break; }
      const floorId = Number(event.floorId) || Number(event.floor) || 1;
      const gained = applyEventEffects(result.effects, state, st, floorId);
      state.activeEvent = null;
      saveState();
      const suffix = gained.length ? ` ${gained.join(", ")}` : "";
      pushEventResult(
        event.icon,
        event.title || event.name,
        `${result.text}${suffix}`,
        result.success ? "ok" : "warn"
      );
      if (result.ambush) {
        const floor = FLOORS.find((f) => f.id === floorId);
        const pool = floor ? floorMobsForZone(floor, event.zone) : [];
        if (pool.length) {
          const mob = pool[Math.floor(Math.random() * pool.length)];
          beginBattle(mob, floor.id);
          break;
        }
      }
      render();
      break;
    }
    case "event-continue": {
      view.eventResult = null;
      view.eventSelectedIndex = 0;
      render();
      break;
    }
    case "upgrade-item": {
      res = upgradeItem(el.dataset.uid, el.dataset.stat || null);
      toast(res.text, res.ok ? "ok" : "warn");
      render();
      break;
    }
    case "hall-tab": {
      const tab = el.dataset.tab === "training" ? "training" : "board";
      view.hallTab = tab;
      if (tab !== "board") view.shopTab = "buy";
      render();
      break;
    }
    case "shop-tab": {
      const tab = el.dataset.tab || "buy";
      const actionGrid = el.closest(".npc-action-grid");
      if (actionGrid) {
        actionGrid.querySelectorAll(".npc-action-btn").forEach((b) => b.classList.toggle("active", b === el));
      }
      if (view.shopTab === "sell" && tab !== "sell") view.sellSelection = [];
      view.shopTab = tab;
      view.activeShopNpc = el.dataset.npc || view.activeShopNpc;
      view.shopFilterSlot = "all";
      view.shopFilterType = "all";
      view.shopFilterStyle = null;
      view.shopFilterArmor = null;
      view.alchemyFilter = "all";
      render();
      break;
    }
    case "trade-filter": {
      view.tradeFilter = el.dataset.filter || "all";
      view.tradeSubFilter = "all";
      render();
      break;
    }
    case "trade-sub-filter": {
      view.tradeSubFilter = el.dataset.filter || "all";
      render();
      break;
    }
    case "alchemy-filter":
      view.alchemyFilter = el.dataset.filter || "all";
      render();
      break;
    case "shop-filter-slot":
      view.shopFilterSlot = el.dataset.slot || "all";
      view.shopFilterType = "all"; // при смене слота сбрасываем подкатегорию
      view.shopFilterStyle = null;
      view.shopFilterArmor = null;
      render();
      break;
    case "shop-filter-armor":
      view.shopFilterArmor = (el.dataset.armor && el.dataset.armor !== "all") ? el.dataset.armor : null;
      render();
      break;
    case "shop-filter-type":
      view.shopFilterType = el.dataset.type || "all";
      render();
      break;
    case "shop-filter-style": {
      const style = el.dataset.style || "";
      // Повторный клик по активному стилю снимает фильтр-сортировку.
      view.shopFilterStyle = view.shopFilterStyle === style ? null : style;
      render();
      break;
    }
    case "exchange-res": {
      res = exchangeResources(el.dataset.id);
      toast(res.text, res.ok ? "ok" : "warn");
      render();
      break;
    }
    case "salvage":
    case "inv-salvage": {
      res = salvageItem(el.dataset.uid || el.dataset.id);
      toast(res.text, res.ok ? "ok" : "warn");
      if (res.ok) view.invItemUid = null;
      render();
      break;
    }
    case "sell-toggle": {
      const id = el.dataset.id; if (!id) break;
      const idx = view.sellSelection.indexOf(id);
      if (idx >= 0) view.sellSelection.splice(idx, 1); else view.sellSelection.push(id);
      render();
      break;
    }
    case "sell-select-all": {
      const ids = Array.from(document.querySelectorAll('[data-act="sell-toggle"]'))
        .map((row) => row.dataset.id)
        .filter(Boolean);
      const picked = new Set(view.sellSelection || []);
      const allPicked = ids.length > 0 && ids.every((id) => picked.has(id));
      view.sellSelection = allPicked ? [] : ids;
      render();
      break;
    }
    case "sell-submit": {
      res = sellMultipleItems(view.sellSelection);
      view.sellSelection = [];
      toast(res.text, res.ok ? "ok" : "warn");
      if (res.ok && res.text.includes("Новый уровень")) { view.levelUp = state.level; Sfx.play("levelup"); }
      render();
      break;
    }
    case "buy-item": {
      const shop = el.dataset.shop || "forge";
      const item = ITEMS[id];
      if (!item) break;
      view.purchaseConfirm = { id, shop, name: item.name, price: priceFor(item, shop).price };
      render();
      break;
    }
    case "forge-tab": view.forgeTab = el.dataset.tab; render(); break;
    case "jewelry-tab": view.jewelryTab = el.dataset.tab; render(); break;
    case "alchemy-tab": view.alchemyTab = el.dataset.tab || "potions"; render(); break;
    case "training-tab": view.trainingTab = el.dataset.tab || "train"; render(); break;
    case "inventory-tab": view.inventoryTab = el.dataset.tab || "gear"; render(); break;
    case "talents-tab": view.talentsTab = el.dataset.tab; render(); break;
    case "learn-talent": res = learnTalent(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "claim-npc-quest": {
      res = claimNpcQuest(id);
      if (res.ok) {
        const q = state.weekQuests.list.find(x => x.id === id);
        if (q) res = { ...res, text: `${res.text} ${getRandomPhrase(q.npc, "quest_complete")}` };
      }
      toast(res.text, res.ok ? "ok" : "warn");
      if (res.ok && res.factionLevelUp) {
        toast(res.factionLevelUp.text, "ok");
        if (state.factionNotified && state.factionNotified[res.factionLevelUp.faction] !== undefined) {
          state.factionNotified[res.factionLevelUp.faction] = false;
          saveState();
        }
      }
      if (res.ok && res.text.includes("Новый уровень")) {
        view.levelUp = state.level;
        Sfx.play("levelup");
      }
      render();
      break;
    }
    case "quests-tab": {
      view.questsTab = el.dataset.tab === "story" ? "story" : "week";
      render();
      break;
    }
    case "accept-story-quest": {
      res = acceptStoryQuest(el.dataset.id);
      toast(res.text, res.ok ? "ok" : "warn");
      render();
      break;
    }
    case "claim-story-quest": {
      const def = STORY_QUEST_MAP[id];
      res = claimStoryQuest(id);
      if (res.ok) {
        if (def) res = { ...res, text: `${res.text} ${getRandomPhrase(def.npc, "quest_complete")}` };
        if (res.factionLevelUp && state.factionNotified && state.factionNotified[res.factionLevelUp.faction] !== undefined) {
          state.factionNotified[res.factionLevelUp.faction] = false;
          saveState();
        }
        if (res.text.includes("Новый уровень")) {
          view.levelUp = state.level;
          Sfx.play("levelup");
        }
      }
      toast(res.text, res.ok ? "ok" : "warn");
      render();
      break;
    }
    case "create-portrait": { const c = view.create; if (c && PORTRAIT_MAP[el.dataset.portrait]) { c.portrait = el.dataset.portrait; render(); } break; }
    case "create-archetype": { const c = view.create; if (c && ARCHETYPE_MAP[el.dataset.id]) { c.archetype = el.dataset.id; render(); } break; }
    case "create-attr": { const c = view.create; if (!c) break; const attr = el.dataset.attr; const delta = Number(el.dataset.delta); if (delta > 0 && c.points > 0) { c.attrs[attr]++; c.points--; } else if (delta < 0 && c.attrs[attr] > 1) { c.attrs[attr]--; c.points++; } render(); break; }
    case "create-reset": resetCreate(view.create?.name || "", view.create?.portrait || "m1", view.create?.archetype || null); render(); break;
    case "start-game": tryStartGame(); break;
    case "doll-slot": view.dollSlot = view.dollSlot === el.dataset.slot ? null : el.dataset.slot; view.invItemUid = null; render(); break;
    case "doll-close": view.dollSlot = null; Sfx.play("chest_close"); render(); break;
    case "doll-equip": res = equipItemToSlot(el.dataset.uid, el.dataset.slot); toast(res.text, res.ok ? "ok" : "warn"); if (res.ok) view.dollSlot = null; render(); break;
    case "doll-unequip": res = unequipSlot(el.dataset.slot); toast(res.text, res.ok ? "ok" : "warn"); if (res.ok) view.dollSlot = null; render(); break;
    case "inv-slot-click": view.invItemUid = view.invItemUid === el.dataset.uid ? null : el.dataset.uid; view.dollSlot = null; view.chestMenu = null; render(); break;
    case "chest-slot-click": view.chestMenu = el.dataset.type; view.invItemUid = null; view.dollSlot = null; render(); break;
    case "inv-select": {
      if (!Array.isArray(state.selectedItems)) state.selectedItems = [];
      const uid = el.dataset.uid;
      const idx = state.selectedItems.indexOf(uid);
      if (idx >= 0) state.selectedItems.splice(idx, 1);
      else state.selectedItems.push(uid);
      render();
      break;
    }
    case "inv-sell-selected": {
      const list = Array.isArray(state.selectedItems) ? state.selectedItems.slice() : [];
      if (!list.length) break;
      const res = sellMultipleItems(list);
      state.selectedItems = [];
      toast(res.text, res.ok ? "ok" : "warn");
      render();
      break;
    }
    case "inv-menu-close": view.invItemUid = null; Sfx.play("chest_close"); render(); break;
    case "chest-menu-close": view.chestMenu = null; Sfx.play("chest_close"); render(); break;
    case "inv-equip": res = equipItem(el.dataset.uid); toast(res.text, res.ok ? "ok" : "warn"); if (res.ok) view.invItemUid = null; render(); break;
    case "inv-filter": view.invFilter = el.dataset.filter || "all"; render(); break;
    case "add-attr": res = addAttr(el.dataset.attr); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "title-open": view.titleModal = true; render(); break;
    case "achievements-open": view.achievementsOpen = true; render(); break;
    case "achievements-close": view.achievementsOpen = false; Sfx.play("chest_close"); render(); break;
    case "abilities-open": view.abilitiesOpen = true; render(); break;
    case "abilities-close": view.abilitiesOpen = false; Sfx.play("chest_close"); render(); break;
    case "talents-open": view.talentsModal = true; render(); break;
    case "talents-close": view.talentsModal = false; Sfx.play("chest_close"); render(); break;
    case "title-close": view.titleModal = false; Sfx.play("chest_close"); render(); break;
    case "title-pick": {
      const res = selectTitle(el.dataset.title);
      toast(res.text, res.ok ? "ok" : "warn");
      view.titleModal = false;
      render();
      break;
    }
    case "title-clear": state.currentTitle = null; saveState(); view.titleModal = false; toast("Титул снят.", "ok"); render(); break;
    case "hotel-rest": res = hotelRest(); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "companion": res = hireCompanion(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "companion-talk": {
      const c = COMPANION_MAP[id];
      if (!c) break;
      startNpcInteraction(c.id);
      render();
      break;
    }
    case "train": res = trainAttr(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "hunt-accept": res = acceptWeekQuest(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "hunt-claim": res = claimNpcQuest(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "accept-all-quests": res = acceptAllQuests(); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "claim-all-quests": res = claimAllQuests(); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "chest-open": {
      const type = el.dataset.type || "common";
      const amount = el.dataset.amount === "all" ? "all" : el.dataset.amount || "1";
      const chestRes = openChests(type, amount);
      if (chestRes.ok) {
        if (chestRes.opened > 1) {
          // Массовое открытие: закрытые карточки, которые игрок открывает сам.
          const flatItems = chestRes.results.flatMap((r) => r.entries || []);
          view.chestMassResults = flatItems;
          view.chestMassRevealed = new Array(flatItems.length).fill(false);
          view.chestMassOpened = chestRes.opened;
          view.chestReveal = null;
        } else {
          // Один сундук: пошаговая FIFA-рулетка из 4 шагов.
          const entry = chestRes.results[0]?.entries?.[0] || null;
          const inst = entry?.uid ? getInstance(entry.uid) : null;
          const item = entry
            ? { ...entry, rarity: inst?.rarity || "common" }
            : { name: "Пусто", icon: CHEST_TYPES[type]?.icon || "", amount: 1, kind: "empty", rarity: "common" };
          view.chestReveal = { item, step: 0, maxSteps: 4, animating: false };
          view.chestMassResults = null;
          view.chestMassRevealed = [];
          view.chestMassOpened = 0;
        }
        Sfx.play("chest");
      } else {
        toast("Нет сундуков такого типа.", "warn");
      }
      view.chestMenu = null;
      render();
      break;
    }
    // Клик по самой карточке: листает шаги, а на последнем — забирает лут.
    case "chest-card-click":
    case "chest-reveal-next": {
      const reveal = view.chestReveal;
      if (!reveal || reveal.animating) return;
      const maxSteps = Math.max(1, Number(reveal.maxSteps) || 4);
      if (reveal.step < maxSteps) advanceChestReveal();
      else if (act === "chest-card-click") closeChestReveal();
      break;
    }
    case "chest-reveal-close": {
      closeChestReveal();
      break;
    }
    case "mass-card-flip": {
      const index = Number(el.dataset.index);
      if (!Number.isInteger(index) || index < 0 || !Array.isArray(view.chestMassResults)) break;
      if (!Array.isArray(view.chestMassRevealed)) view.chestMassRevealed = [];
      view.chestMassRevealed[index] = true;
      const card = document.querySelector(`.mass-card-wrapper[data-index="${index}"]`);
      if (card && typeof renderMassChestCard === "function") {
        card.outerHTML = renderMassChestCard(view.chestMassResults[index], index);
      }
      break;
    }
    case "mass-reveal-all": {
      if (!Array.isArray(view.chestMassResults)) break;
      view.chestMassRevealed = view.chestMassResults.map(() => true);
      const grid = document.querySelector(".mass-loot-grid");
      if (grid && typeof renderMassChestGrid === "function") {
        grid.innerHTML = renderMassChestGrid();
      }
      document.querySelector('[data-act="mass-reveal-all"]')?.remove();
      break;
    }
    case "mass-chest-close": {
      view.chestMassResults = null;
      view.chestMassRevealed = [];
      view.chestMassOpened = 0;
      saveState();
      render();
      break;
    }
    case "chest-result-close": view.chestResults = null; render(); break;
    case "buy": {
      const shop = el.dataset.shop || "forge";
      const item = ITEMS[id];
      if (!item) break;
      view.purchaseConfirm = { id, shop, name: item.name, price: priceFor(item, shop).price };
      render();
      break;
    }
    case "buy-premium": {
      res = buyItem(id, "forge", Number(el.dataset.price), el.dataset.rarity);
      toast(res.text, res.ok ? "ok" : "warn");
      render();
      break;
    }
    case "confirm-buy": {
      const pc = view.purchaseConfirm;
      if (!pc) break;
      let res;
      if (pc.npcId === "arthur") {
        res = buyFromTrader(pc.id);
        if (res.ok) {
          view.traderStock = (view.traderStock || []).filter((entry) => (entry.kind === "gear" ? entry.uid : entry.id) !== pc.id);
        }
      } else {
        res = buyItem(pc.id, pc.shop);
      }
      view.purchaseConfirm = null;
      toast(res.text, res.ok ? "ok" : "warn");
      render();
      break;
    }
    case "cancel-buy": {
      view.purchaseConfirm = null;
      render();
      break;
    }
    case "craft": res = (id === CHEST_SCRAP_CRAFT_ID) ? craftChestFromScrap() : craftItem(id); toast(res.text, res.ok ? "ok" : "warn"); if (res.ok) Sfx.play("forge_craft"); render(); break;
    case "sell": res = sellItem(el.dataset.uid); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "sell-potion": res = sellPotion(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "drink": res = drinkPotion(id); toast(res.text, res.ok ? "ok" : "warn"); if (res.ok) Sfx.play("potion"); render(); break;
    
    // БОЕВЫЕ ДЕЙСТВИЯ С ТРЯСКОЙ
    case "drink-battle": 
      view.battleModal = null;
      shake();
      doExchange("heal", id);
      render();
      break;
    case "use-battle-item": 
      view.battleModal = null;
      shake();
      doExchange("item", id); 
      render();
      break;
    case "battle-left-tab": pauseCombo(); view.battleModal = el.dataset.tab; render(); break;
    case "battle-modal-close": view.battleModal = null; resumeCombo(); Sfx.play("chest_close"); render(); break;
    case "sell-resource": res = sellResource(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "fight": startBattle(Number(el.dataset.floor), el.dataset.mob); break;
    case "quick-fight": startQuickFight(Number(el.dataset.floor) || state.maxFloor); break;
    case "arena-leave": leaveArena(); break;
    case "select-zone":
      view.selectedZone = Math.max(1, Math.min(5, Number(el.dataset.zone) || 1));
      render();
      break;
    case "log-prev":
    case "log-next":
      if (cycleEventLog(act === "log-prev" ? -1 : 1)) render();
      break;
    case "explore": {
      const zone = Number(el.dataset.zone) || 1;
      view.selectedZone = zone;
      const res = exploreFloor(Number(el.dataset.floor) || state.maxFloor, zone);
      if (!res.ok) { toast(res.text, "warn"); break; }

      // Карусель журнала: каждое исследование попадает в историю.
      pushEventLog("Исследование", res.text);

      if (state.activeEvent || state.activeFloorEvent) {
        view.eventResult = null;
        view.eventSelectedIndex = 0;
        render();
        break;
      }

      // Бой начинается сразу, без промежуточного окна «Находка».
      if (res.encounter) {
        const floor = FLOORS.find((f) => f.id === res.encounter.floorId);
        const def = floor ? floor.mobs[res.encounter.mobIndex] : null;
        if (floor && def) { beginBattle(def, floor.id); break; }
      }

      if (res.scene) { render(); break; }

      // Обычный текст исследования живёт в нижней панели до «Продолжить».
      pushEventResult("🧭", "Исследование", res.text, "ok");
      render();
      break;
    }
    case "seek-fight": {
      const floor = FLOORS.find((f) => f.id === Number(el.dataset.floor));
      if (floor && floor.mobs.length) startBattle(floor.id, Math.floor(Math.random() * floor.mobs.length));
      break;
    }
    case "auto-explore": startAutoExplore(Number(el.dataset.floor) || state.maxFloor, view.autoExploreMode === "safe", Number(view.selectedZone) || 1); break;
    case "auto-mode": {
      const m = el.dataset.mode === "fight" ? "fight" : "safe";
      if (view.autoExploreMode !== m) { view.autoExploreMode = m; render(); }
      break;
    }
    case "auto-stop": stopAutoExplore("Авто-исследование остановлено."); break;
    case "scene-action": resolveSceneAction(el.dataset.action); break;
    case "scene-backdrop": resolveSceneAction("leave"); break;
    case "floor-event-action": resolveFloorEventAction(el.dataset.event, el.dataset.action); break;
    case "hunter-enc-action": resolveHunterEncounterAction(el.dataset.enc, el.dataset.action); break;
    
    case "toggle-log":
      view.logExpanded = view.logExpanded === false;
      render();
      break;

    // БОЕВЫЕ ДЕЙСТВИЯ С ТРЯСКОЙ
    case "skill":
      view.battleModal = null;
      shake();
      // В Real-Time навык применяется сразу и не запускает старые фазы хода.
      doExchange({ type: "skill", id: el.dataset.id });
      break;
    
    // Экран подготовки к бою.
    case "prebattle-start":
      if (view.preBattle && view.battle && !view.battle.over) {
        view.preBattle = false;
        startDuel();
        render();
      }
      break;
    case "prebattle-flee":
      if (view.preBattle && view.battle && !view.battle.boss) {
        view.preBattle = false;
        doExchange({ type: "flee" });
        render();
      }
      break;

    // Боевые слоты оружия (герой).
    case "battle-weapon-slot":
      if (view.battle && !view.battle.over && view.duelActive && !view.battle.stunned) {
        switchBattleWeapon(Number(el.dataset.slot));
      }
      break;
    case "weapon-slot-open": view.weaponSlotPicker = Number(el.dataset.slot); render(); break;
    case "weapon-slot-close": view.weaponSlotPicker = null; render(); break;
    case "weapon-slot-assign": {
      const slotIdx = Number(el.dataset.slot);
      const inst = getInstance(el.dataset.uid);
      const item = inst ? ITEMS[inst.id] : null;
      if (!item || item.slot !== "mainhand" || slotIdx < 0 || slotIdx > 2) {
        toast("Это оружие нельзя поставить в боевой слот.", "warn");
        break;
      }
      if (!Array.isArray(state.weaponSlots)) state.weaponSlots = [null, null, null];
      state.weaponSlots[slotIdx] = inst.uid;
      saveState();
      view.weaponSlotPicker = null;
      toast(`Слот ${slotIdx + 1}: ${getItemDisplayName(inst)}.`, "ok");
      render();
      break;
    }
    case "weapon-slot-clear": {
      const slotIdx = Number(el.dataset.slot);
      if (Array.isArray(state.weaponSlots) && slotIdx >= 0 && slotIdx <= 2) {
        state.weaponSlots[slotIdx] = null;
        saveState();
      }
      view.weaponSlotPicker = null;
      render();
      break;
    }

    case "switch-weapon": pauseCombo(); view.battleModal = null; view.weaponSwap = true; render(); break;
    case "weapon-swap-close": view.weaponSwap = false; resumeCombo(); render(); break;
    case "equip-in-battle": {
      const inst = getInstance(el.dataset.uid);
      if (inst) {
        const result = equipItemToSlot(inst.uid, "mainhand");
        if (result.ok) {
          view.weaponSwap = false;
          shake();
          doExchange("pass");
        } else {
          toast(result.text, "warn");
        }
      }
      break;
    }
    
    case "flee": doExchange("flee"); break;
    case "result-continue": {
      const victory = view.summary?.victory;
      const fled = view.summary?.fled === true;
      const ambush = victory ? view.ambush : null;
      duelStopTimer();
      view.duelActive = false;
      view.battle = null; view.summary = null; view.battleModal = null;
      view.preBattle = false;
      view.comboState = null;
      view.comboPaused = null;
      view.typingState = null;
      view.typingPaused = null;
      if (fled) {
        view.ambush = null;
        view.sceneGroup = null; view.sceneGroupFloorId = null;
        if (view.autoExplore) stopAutoExplore("Вы сбежали. Авто-исследование остановлено.");
        view.screen = view.currentFloor ? "floor" : "tower";
        saveState();
        render();
        break;
      }
      if (ambush) {
        const floor = FLOORS.find((f) => f.id === ambush.floorId);
        const def = floor ? floor.mobs[ambush.nextMobIndex] : null;
        view.ambush = null;
        if (def) { beginBattle(def, floor.id, { ambush: true }); break; }
      }
      view.ambush = null;
      if (victory) {
        if (view.sceneGroup && view.sceneGroup.length) {
          const gFloor = FLOORS.find((f) => f.id === view.sceneGroupFloorId);
          const nextIndex = view.sceneGroup.shift();
          const def = gFloor ? gFloor.mobs[nextIndex] : null;
          if (def) { beginBattle(def, gFloor.id); break; }
          view.sceneGroup = null; view.sceneGroupFloorId = null;
        }
        if (view.autoExplore) scheduleAutoExplore(2100);
        if (view.currentFloor) {
          view.screen = "floor";
        } else {
          view.screen = "tower";
        }
      } else {
        view.sceneGroup = null; view.sceneGroupFloorId = null;
        view.screen = "hub";
        view.currentFloor = null;
        state.phase = TIME_PHASES.length - 1;
        endTrip();
        const st = stats();
        state.hp = st.maxHp;
        state.mana = st.maxMana;
        state.energy = st.maxEnergy;
        if (view.autoExplore) stopAutoExplore("Вы погибли. Авто-исследование остановлено.");
      }
      render();
      break;
    }
    case "dev-cheat":
      if (state) {
        state.level = 99;
        state.xp = 0;
        state.points = 500;
        state.talentPoints = 50;
        state.attrs = { str: 50, agi: 50, end: 50, int: 50 };
        state.gold = 999999;
        state.resources = { iron_ore: 999, leather: 999, steel: 999, cold_iron_ingot: 999, wood: 999, cloth: 999 };
        state.maxFloor = 5;
        state.cleared = { 1: true, 2: true, 3: true, 4: true };
        state.chests = { common: 50, elite: 30, abyss: 10 };
        state.potions = { hp_small: 10, hp_big: 10, mana_small: 10, oil_fire: 10, oil_ice: 10, oil_poison: 10, oil_blood: 10 };
        invalidateStats();
        const st = stats();
        state.hp = st.maxHp;
        state.mana = st.maxMana;
        saveState();
        render();
        toast("Dev-режим активирован: 99 уровень, 999999 золота, все этажи открыты, выдано 90 сундуков и масла.", "ok");
      }
      break;
    case "reset": if (platform.dialog.confirm("Сбросить прогресс?")) { resetState(); view.battle = null; view.summary = null; view.create = null; view.ambush = null; view.sceneGroup = null; view.sceneGroupFloorId = null; view.autoExplore = null; view.autoExploreMode = "safe"; view.dollSlot = null; view.invItemUid = null; view.invFilter = "all"; view.invSearch = ""; view.shopFilterSlot = "all"; view.shopFilterType = "all"; view.shopFilterStyle = null; view.screen = "hub"; render(); } break;
    default: break;
  }
}

// Открыто ли поверх экрана модальное окно. Блокирует глобальную навигацию
// (C/J/M/H/B), чтобы хоткеи не срабатывали под диалогом или инвентарём.
function anyModalOpen() {
  return Boolean(
    view.settingsOpen || view.titleModal || view.achievementsOpen || view.abilitiesOpen
    || view.talentsModal || view.questsOpen || view.bestiaryOpen || view.companionInfo
    || view.purchaseConfirm || view.weaponSwap || view.levelUp || view.traderStock
    || view.npcInteraction || view.chestResults || view.chestReveal || view.chestMassResults
    || view.trainingQTE || view.battleModal
    || view.dollSlot || view.invItemUid || view.chestMenu
    || (view.weaponSlotPicker !== null && view.weaponSlotPicker !== undefined)
    || state.activeEvent || state.activeFloorEvent || state.activeSceneId
    || view.eventResult
  );
}

function handleKey(event) {
  if (!state) return;
  if (!state.created) { if (event.key === "Enter" && view.create) tryStartGame(); return; }
  const isEscape = event.key === "Escape";
  // Хоткеи не перехватывают ввод в текстовых полях. Esc оставляем рабочим,
  // чтобы окно можно было закрыть прямо с ползунка или поля.
  if (!isEscape && event.target?.closest?.("input, textarea, select")) return;

  const confirmKey = event.code === "Space" || event.key === " " || event.key === "Enter" || event.code === "NumpadEnter";

  // ── Нижняя панель событий: 1/2/3 выбирают вариант, Enter/Space — подтверждают ──
  const eventSheet = document.querySelector(".event-bottom-sheet");
  if (eventSheet) {
    const continueBtn = eventSheet.querySelector('[data-act="event-continue"]');
    if (continueBtn) {
      if (confirmKey) { event.preventDefault(); continueBtn.click(); return; }
    } else {
      const buttons = Array.from(eventSheet.querySelectorAll(".event-actions button:not([disabled])"));
      if (buttons.length) {
        const selectEvent = (idx) => {
          view.eventSelectedIndex = idx;
          buttons.forEach((b, i) => b.classList.toggle("kbd-selected", i === idx));
          buttons[idx]?.scrollIntoView({ block: "nearest" });
        };
        const digit = /^[1-9]$/.test(event.key || "") ? Number(event.key) - 1 : -1;
        if (digit >= 0 && digit < buttons.length) {
          event.preventDefault();
          selectEvent(digit);
          return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const cur = Math.max(0, Math.min(buttons.length - 1, Number(view.eventSelectedIndex) || 0));
          selectEvent(event.key === "ArrowDown" ? (cur + 1) % buttons.length : (cur - 1 + buttons.length) % buttons.length);
          return;
        }
        if (confirmKey) {
          event.preventDefault();
          // Enter/Space всегда подтверждают первый вариант в нижней панели.
          selectEvent(0);
          buttons[0].click();
          return;
        }
      }
    }
  }

  // ── Диалоги: навигация стрелками вверх/вниз и выбор по Enter/Space ─────────
  const dialogBottom = document.querySelector(".mnb-dialog-bottom");
  if (dialogBottom) {
    const buttons = Array.from(dialogBottom.querySelectorAll("button:not([disabled])"));
    if (buttons.length) {
      const selectDialog = (idx) => {
        view.dialogSelectedIndex = idx;
        buttons.forEach((b, i) => b.classList.toggle("kbd-selected", i === idx));
        buttons[idx]?.scrollIntoView({ block: "nearest" });
      };
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const cur = Math.max(0, Math.min(buttons.length - 1, Number(view.dialogSelectedIndex) || 0));
        selectDialog(event.key === "ArrowDown" ? (cur + 1) % buttons.length : (cur - 1 + buttons.length) % buttons.length);
        return;
      }
      if (confirmKey) {
        event.preventDefault();
        const cur = Math.max(0, Math.min(buttons.length - 1, Number(view.dialogSelectedIndex) || 0));
        buttons[cur].click();
        return;
      }
    }
  }

  // ── Экран этажа: стрелки/W/S переключают выбранную зону ─────────────────
  const zonePrev = event.key === "ArrowUp" || event.code === "KeyW";
  const zoneNext = event.key === "ArrowDown" || event.code === "KeyS";
  if (view.screen === "floor" && !anyModalOpen() && (zonePrev || zoneNext)) {
    event.preventDefault();
    const cur = Math.max(1, Math.min(5, Number(view.selectedZone) || 1));
    const next = zoneNext ? Math.min(5, cur + 1) : Math.max(1, cur - 1);
    if (next !== cur) { view.selectedZone = next; render(); }
    return;
  }

  // ── Экран этажа: E запускает исследование выбранной зоны ────────────────
  const isExploreKey = event.code === "KeyE" || event.key === "e" || event.key === "E"
    || event.key === "у" || event.key === "У";
  if (isExploreKey && view.screen === "floor" && !anyModalOpen() && Number(view.eventLogIndex) < 0
      && !state.activeEvent && !state.activeFloorEvent && !view.eventResult) {
    const exploreBtn = document.querySelector('.zone-row.active button[data-act="explore"]');
    if (exploreBtn && !exploreBtn.disabled) {
      event.preventDefault();
      exploreBtn.click();
      return;
    }
  }

  // ── Журнал событий на этаже: ← / → листают карусель ─────────────────────
  if (view.screen === "floor" && document.querySelector(".event-bottom-sheet")
      && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
    event.preventDefault();
    if (cycleEventLog(event.key === "ArrowLeft" ? -1 : 1)) render();
    return;
  }

  // ── Уровень 1: универсальное подтверждение Space/Enter ────────────────
  const isConfirm = event.code === "Space" || event.key === " " || event.key === "Enter" || event.code === "NumpadEnter";
  if (isConfirm) {
    event.preventDefault();
    // Массовое открытие: закрывает окно «Забрать всё».
    if (view.chestMassResults) {
      document.querySelector('[data-act="mass-chest-close"]')?.click();
      return;
    }
    // FIFA-карточка: прокручивает шаги, но не быстрее анимации.
    if (view.chestReveal) {
      if (view.chestReveal.animating) return;
      const btn = document.querySelector('[data-act="chest-card-click"], [data-act="chest-reveal-next"], [data-act="chest-reveal-close"]');
      if (btn) btn.click();
      return;
    }
    const resultBtn = document.querySelector('[data-act="result-continue"]');
    if (resultBtn) { resultBtn.click(); return; }
    const levelupBtn = document.querySelector('[data-act="levelup-close"]');
    if (levelupBtn) { levelupBtn.click(); return; }
    const eventActions = document.querySelector(".event-actions");
    if (eventActions) {
      const buttons = eventActions.querySelectorAll("button:not([disabled])");
      if (buttons.length) { buttons[0].click(); return; }
    }
    const dialogBottom = document.querySelector(".mnb-dialog-bottom");
    if (dialogBottom) {
      const buttons = dialogBottom.querySelectorAll("button");
      if (buttons.length === 1) { buttons[0].click(); return; }
    }
    return;
  }

  // ── Уровень 1: Esc закрывает окна и модалки ───────────────────────────
  if (isEscape) {
    const closeModal = (fn) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      fn();
      Sfx.play("chest_close");
      render();
    };
    if (view.chestReveal) { closeModal(() => { view.chestReveal = null; }); return; }
    if (view.chestMenu) { closeModal(() => { view.chestMenu = null; }); return; }
    if (view.settingsOpen) { closeModal(() => { view.settingsOpen = false; }); return; }
    if (view.titleModal) { closeModal(() => { view.titleModal = false; }); return; }
    if (view.achievementsOpen) { closeModal(() => { view.achievementsOpen = false; }); return; }
    if (view.talentsModal) { closeModal(() => { view.talentsModal = false; }); return; }
    if (view.questsOpen) { closeModal(() => { view.questsOpen = false; }); return; }
    if (view.bestiaryOpen) { closeModal(() => { view.bestiaryOpen = false; }); return; }
    if (view.abilitiesOpen) { closeModal(() => { view.abilitiesOpen = false; }); return; }
    if (view.companionInfo) { closeModal(() => { view.companionInfo = null; }); return; }
    if (view.purchaseConfirm) { closeModal(() => { view.purchaseConfirm = null; }); return; }
    if (view.chestResults) { closeModal(() => { view.chestResults = null; }); return; }
    if (view.npcInteraction) {
      closeModal(() => {
        if (typeof closeNpcInteraction === "function") closeNpcInteraction();
        else view.npcInteraction = null;
      });
      return;
    }
    if (view.weaponSlotPicker !== null && view.weaponSlotPicker !== undefined) { closeModal(() => { view.weaponSlotPicker = null; }); return; }
    if (view.dollSlot || view.invItemUid) { closeModal(() => { view.dollSlot = null; view.invItemUid = null; }); return; }
    // Ничего не открыто и игрок вне боя — Esc открывает настройки.
    if (!anyModalOpen() && view.screen !== "battle") {
      event.preventDefault();
      event.stopImmediatePropagation();
      view.settingsOpen = true;
      render();
      return;
    }
  }

  // ── Уровень 2: глобальная навигация вне боя ───────────────────────────
  if (view.screen !== "battle" && !anyModalOpen() && !event.ctrlKey && !event.altKey && !event.metaKey) {
    if (event.code === "KeyC") { event.preventDefault(); go("hero"); return; }
    if (event.code === "KeyJ") { event.preventDefault(); view.questsOpen = true; render(); return; }
    if (event.code === "KeyM") {
      if (view.screen !== "tower") { event.preventDefault(); go("tower"); }
      return;
    }
    if (event.code === "KeyH") { event.preventDefault(); go("hub"); return; }
    if (event.code === "KeyB") { event.preventDefault(); view.bestiaryOpen = true; render(); return; }
    if (event.code === "KeyR") { event.preventDefault(); document.querySelector('[data-act="rest"]')?.click(); return; }
  }

  if (view.screen !== "battle" || !view.battle || view.battle.over) return;
}

// ── Кастомные тултипы (вместо нативных title) ──────────────────────────────
// Один общий элемент на документ: переиспользуем его, чтобы не плодить DOM.
function tooltipEl() {
  let el = document.getElementById("custom-tooltip");
  if (!el) {
    el = document.createElement("div");
    el.id = "custom-tooltip";
    el.className = "custom-tooltip";
    el.setAttribute("role", "tooltip");
    document.body.appendChild(el);
  }
  return el;
}

// Позиционирование у курсора с учётом границ окна.
function positionTooltip(el, event) {
  const margin = 10;
  const x = event.clientX + 15;
  const y = event.clientY + 15;
  el.style.left = Math.max(margin, Math.min(x, window.innerWidth - el.offsetWidth - margin)) + "px";
  el.style.top = Math.max(margin, Math.min(y, window.innerHeight - el.offsetHeight - margin)) + "px";
}

// htmlContent — готовая HTML-разметка подсказки (см. .tt-* в style.css).
function showTooltip(htmlContent, event) {
  if (!htmlContent) return;
  const el = tooltipEl();
  el.innerHTML = htmlContent;
  el.classList.toggle("tooltip-wide", htmlContent.includes("tooltip-compare-container"));
  el.style.display = "block";
  positionTooltip(el, event);
}

function hideTooltip() {
  const el = document.getElementById("custom-tooltip");
  if (el) el.style.display = "none";
}

// Глобальные обработчики: любой элемент с data-tooltip получает подсказку.
function bindTooltips() {
  let activeTarget = null;
  document.addEventListener("mouseover", (e) => {
    const target = e.target.closest?.("[data-tooltip]");
    if (!target) return;
    // Переход внутри того же элемента (например, на <img>) не перезапускает подсказку.
    if (target === activeTarget) return;
    activeTarget = target;
    showTooltip(target.dataset.tooltip, e);
  });
  document.addEventListener("mousemove", (e) => {
    const el = document.getElementById("custom-tooltip");
    if (el && el.style.display === "block") positionTooltip(el, e);
  });
  document.addEventListener("mouseout", (e) => {
    const target = e.target.closest?.("[data-tooltip]");
    if (!target) return;
    // Курсор остался внутри подсказочного элемента — не мигаем.
    if (e.relatedTarget && target.contains(e.relatedTarget)) return;
    activeTarget = null;
    hideTooltip();
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindTooltips);
else bindTooltips();
