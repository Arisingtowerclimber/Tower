const view = {
  screen: "hub", battle: null, attackZone: "chest", attackStyle: "slashing", blocks: ["head", "chest"],
  summary: null, create: null, forgeTab: "held", jewelryTab: "jewelry", talentsTab: "war",
  questsOpen: false, bestiaryOpen: false, bestiaryFilter: "all",
  timmyTip: null,
  currentFloor: null,
  levelUp: null,
  dollSlot: null, tripActive: false,
  sceneGroup: null, sceneGroupFloorId: null, autoExplore: null,
  autoExploreMode: "safe",
  npcShopOpen: false, traderStock: null,
  npcInteraction: null,
  tradeFilter: "all",
  tradeSubFilter: "all",
  purchaseConfirm: null,
  shopTab: "buy", sellSelection: [], activeShopNpc: null, shopNpcPhrase: null, shopFilterArmor: null,
  companionInfo: null,
  trainingTab: "train",
  hallTab: "board",
  inventoryTab: "gear",
  invItemUid: null,
  invFilter: "all",
  invSearch: "",
  alchemyTab: "potions", alchemyFilter: "all",
  heroBackScreen: "hub",
  ambush: null,
  storyJustPlayed: false,
  introPending: false,
  exploreResult: null,
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
// Таймеры окон тикают setInterval раз в 100 мс и обновляют только полоску.
// Указатель «Точного удара» тоже двигается в этом тике.
const QTE_CRIT_TIME = 3.0;
const QTE_PARRY_TIME = 2.0;
const QTE_TRAINING_TIME = 6.0;
const QTE_TICK_MS = 100;
let qteInterval = null;
let qteCursorPos = 0;
let qteCursorDir = 1;
let qteRunnerPos = 0;
let qteRunnerDir = 1;

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
function battleActive() { return view.screen === "battle" && view.battle && !view.battle.over; }

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

function resetCreate() {
  view.create = {
    step: 0,
    answers: {},
    archetype: null,
    portrait: "m1",
    gender: "male",
    name: "",
  };
}

// Сводка эффектов варианта биографии: { str: 1, hp: 10 } → "💪 +1 Сила · ❤️ +10 HP".
function formatEffects(effects) {
  if (!effects || typeof effects !== "object") return "";
  const parts = [];
  const push = (icon, value, label, hint = "") => {
    if (!Number.isFinite(value) || value === 0) return;
    const sign = value > 0 ? "+" : "";
    parts.push(`${icon} ${sign}${value}${label ? ` ${label}` : ""}${value > 0 ? hint : ""}`);
  };
  const end = Number(effects.end);
  const int = Number(effects.int);
  push("💪", Number(effects.str), "Сила");
  push("🏃", Number(effects.agi), "Ловкость");
  push("🛡️", end, "Выносливость", end > 0 ? ` (+${end * 10} HP)` : "");
  push("🧠", int, "Интеллект", int > 0 ? ` (+${int * 10} маны)` : "");
  push("❤️", Number(effects.hp), "HP");
  push("🔷", Number(effects.mana), "маны");
  push("💰", Number(effects.gold), "золота");
  const potions = Number(effects.potions);
  if (Number.isFinite(potions) && potions !== 0) {
    const n = Math.abs(potions);
    const word = n % 10 === 1 && n % 100 !== 11
      ? "зелье"
      : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "зелья" : "зелий");
    parts.push(`🧪 ${potions > 0 ? "+" : ""}${potions} ${word}`);
  }
  return parts.join(" · ");
}

function createHtml() {
  const c = view.create;
  const totalSteps = BACKGROUND_STEPS.length;
  const genderPortraits = PORTRAITS.filter((p) => p.gender === c.gender);
  const chosenPortrait = PORTRAIT_MAP[c.portrait];
  const portrait = chosenPortrait && chosenPortrait.gender === c.gender
    ? chosenPortrait
    : (genderPortraits[0] || PORTRAITS[0]);

  if (c.step >= totalSteps) {
    return createSummaryHtml(c, portrait);
  }

  const step = BACKGROUND_STEPS[c.step];
  const isArchetype = step.id === "archetype";
  const options = isArchetype
    ? ARCHETYPES
    : (step.optionsByArchetype ? step.optionsByArchetype[c.archetype] || [] : step.options || []);
  const progress = ((c.step + 1) / (totalSteps + 1)) * 100;
  const isLastStep = c.step >= totalSteps - 1;

  const optionsHtml = options.map((opt) => {
    const selected = isArchetype ? c.archetype === opt.id : c.answers[step.id] === opt.id;
    const effects = isArchetype ? null : opt.effects;
    const action = isArchetype
      ? `data-act="bio-archetype" data-id="${opt.id}"`
      : `data-act="bio-option" data-step="${step.id}" data-option="${opt.id}"`;
    return `
      <button class="archetype-card${selected ? " selected" : ""}" ${action} type="button">
        <span class="archetype-body">
          <b>${opt.label || opt.name}</b>
          <span>${opt.desc}</span>
          ${effects ? `<span class="effect-summary">${formatEffects(effects)}</span>` : ""}
        </span>
      </button>
    `;
  }).join("");

  const canAdvance = isArchetype ? Boolean(c.archetype) : Boolean(c.answers[step.id]);

  return `
    <div class="create-bg"></div>
    <section class="create">
      <div class="create-head create-panel">
        <p class="eyebrow">Перед подъёмом · Шаг ${c.step + 1} из ${totalSteps + 1}</p>
        ${step.lore ? `<p class="lore">${esc(step.lore)}</p>` : ""}
        <h1>${step.title}</h1>
        <p class="lead">${step.text}</p>
        <div class="bar xp" style="margin-top: 16px; height: 4px;">
          <span style="width: ${progress}%"></span>
        </div>
      </div>
      <div class="create-grid" style="grid-template-columns: 1fr;">
        <section class="panel">
          <div class="archetype-grid">${optionsHtml}</div>
          <div class="create-actions" style="margin-top: 20px; flex-direction: row; gap: 10px;">
            ${c.step > 0 ? `<button class="btn ghost" data-act="bio-back" type="button">← Назад</button>` : `<button class="btn ghost" data-act="create-reset" type="button">Сбросить</button>`}
            ${canAdvance ? `<button class="btn primary" data-act="bio-next" type="button">${isLastStep ? "К имени и портрету →" : "Далее →"}</button>` : `<button class="btn" type="button" disabled>${isArchetype ? "Выберите архетип" : "Выберите вариант"}</button>`}
          </div>
        </section>
      </div>
    </section>
  `;
}

function createSummaryHtml(c, portrait) {
  const attrs = { str: 1, agi: 1, end: 1, int: 1 };
  let bonusGold = 0;
  let bonusPotions = 0;
  const pathChips = [];
  const genderPortraits = PORTRAITS.filter((p) => p.gender === c.gender);
  const selectedPortrait = genderPortraits.some((p) => p.id === c.portrait) ? c.portrait : (genderPortraits[0] || portrait).id;
  const previewPortrait = PORTRAIT_MAP[selectedPortrait] || portrait;

  for (const step of BACKGROUND_STEPS) {
    if (step.id === "archetype") continue;
    const optionId = c.answers[step.id];
    if (!optionId) continue;
    const pool = step.optionsByArchetype ? step.optionsByArchetype[c.archetype] || [] : step.options || [];
    const opt = pool.find((o) => o.id === optionId);
    if (!opt) continue;
    pathChips.push(`<span class="chip">${esc(opt.label)}</span>`);
    const eff = opt.effects || {};
    for (const a of ["str", "agi", "end", "int"]) {
      if (eff[a]) attrs[a] += Math.min(4, Math.max(0, Number(eff[a]) || 0));
    }
    if (eff.gold) bonusGold += Number(eff.gold) || 0;
    if (Number.isFinite(Number(eff.potions))) bonusPotions += Math.max(0, Number(eff.potions));
    else if (Array.isArray(eff.potions)) bonusPotions += eff.potions.length;
  }

  const arch = ARCHETYPE_MAP[c.archetype];
  const equipmentIds = arch && Array.isArray(arch.startEquipment) ? arch.startEquipment.filter((id) => ITEMS[id]) : [];
  const equipmentChips = equipmentIds.map((id) => {
    const item = ITEMS[id];
    return `<span class="chip">${iconHtml(item.icon, 16)} ${item.name}</span>`;
  }).join("");

  const preview = previewStats(attrs, c.archetype);
  const canStart = Boolean(arch);

  return `
    <div class="create-bg"></div>
    <section class="create">
      <div class="create-head create-panel">
        <p class="eyebrow">Шаг ${BACKGROUND_STEPS.length + 1} из ${BACKGROUND_STEPS.length + 1} · Имя и портрет</p>
        <h1>Ваш герой</h1>
        <p class="lead">Остался последний штрих: имя и лицо.</p>
      </div>
      <div class="create-grid">
        <section class="panel">
          <div class="field"><label>Пол</label><div class="gender-toggle"><button class="btn${c.gender === "male" ? " selected" : ""}" data-act="bio-gender" data-id="male" type="button">Мужчина</button><button class="btn${c.gender === "female" ? " selected" : ""}" data-act="bio-gender" data-id="female" type="button">Женщина</button></div></div>

          <div class="field"><label>Портрет</label><div class="portrait-picker" style="--portrait-count:${Math.max(1, genderPortraits.length)};">${genderPortraits.map((p) => `<button class="portrait-option${p.id === selectedPortrait ? " selected" : ""}" data-act="bio-portrait" data-id="${p.id}" type="button" title="${esc(p.name)}"><img src="${p.src}" alt="${esc(p.name)}"></button>`).join("")}</div></div>

          <div class="field"><label>Пройденный путь</label><div class="chips">${pathChips.length ? pathChips.join("") : `<span class="chip dim">Биография не выбрана</span>`}</div></div>

          <h2 class="group-title">Итоговые атрибуты</h2>
          <div class="attr-list">
            ${ATTR_INFO.map((a) => `<div class="attr-row"><div class="attr-info"><b>${a.name}</b><span class="hint">${a.effect}</span></div><div class="attr-controls"><span class="attr-value">${attrs[a.id]}</span></div></div>`).join("")}
          </div>

          <div class="field" style="margin-top: 16px;">
            <label>Стартовое снаряжение</label>
            <div class="chips">${equipmentChips || `<span class="chip dim">Пусто</span>`}</div>
          </div>

          ${bonusPotions > 0 ? `<div class="field"><label>Зелья</label><div class="chips"><span class="chip">🧪 Зелья ×${bonusPotions}</span></div></div>` : ""}

          <div class="points-bar" style="margin-top: 16px;">
            <span>Стартовое золото</span>
            <b>${60 + bonusGold} 💰</b>
          </div>
        </section>

        <section class="panel">
          <div class="preview-portrait">
            <img src="${previewPortrait.src}" alt="${esc(c.name || "Странник")}">
          </div>

          <div class="field preview-name-field">
            <label for="hero-name">Имя героя</label>
            <input class="name-input" id="hero-name" type="text" maxlength="20" data-role="create-name" autocomplete="off" spellcheck="false" placeholder="Странник" value="${esc(c.name)}">
          </div>

          ${arch ? `<div class="preview-archetype">
            <div class="preview-archetype-head"><b>${arch.name}</b></div>
            <span>${arch.desc}</span>
          </div>` : `<div class="preview-archetype empty"><b>Архетип не выбран</b><span>Вернитесь на первый шаг.</span></div>`}

          <div class="stat-grid" style="margin-top: 20px; grid-template-columns: repeat(2, 1fr);">
            <div class="stat-box"><span>HP</span><b>${preview.maxHp}</b></div>
            <div class="stat-box"><span>Мана</span><b>${preview.maxMana}</b></div>
            <div class="stat-box"><span>Урон</span><b>${preview.atk}</b></div>
            <div class="stat-box"><span>Защита</span><b>${preview.def}</b></div>
          </div>

          <div class="create-actions" style="margin-top: 20px;">
            <button class="btn ghost" data-act="bio-back" type="button">← Назад к мотиву</button>
            <button class="btn primary big" data-act="start-game" type="button" ${canStart ? "" : "disabled"}>${canStart ? "Начать путь" : "Выберите архетип"}</button>
          </div>
        </section>
      </div>
    </section>
  `;
}

function tryStartGame() {
  const c = view.create; if (!c) return;
  if (!ARCHETYPE_MAP[c.archetype]) { toast("Выберите архетип.", "warn"); return; }
  createHero(c.answers, c.archetype, c.portrait, c.name, c.gender);
  view.create = null; view.screen = "hub"; view.summary = null;
  // Вступительная сцена с Тимми — сразу на первом экране хаба.
  view.introPending = true;
  view.npcInteraction = { npcId: "timmy", mode: "dialog", node: "intro_start" };
  render();
  toast(`Добро пожаловать, ${state.name}.`, "ok");
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

function topbarHtml(st) {
  const hpPct = Math.round((state.hp / st.maxHp) * 100); const manaPct = Math.round((state.mana / st.maxMana) * 100);
  const phase = phaseInfo(); const event = todaysEvent(); const lockNav = battleActive() ? " locked" : "";

  ensureWeekQuests();

  const wqDone = state.weekQuests.list.filter((q) => q.status === "claimed" || q.status === "done").length;
  const wqTotal = state.weekQuests.list.length;

  const weeklyPill = wqTotal > 0
    ? `<button class="pill${wqDone > 0 ? " ok" : ""}" data-act="quests-open" type="button" title="Недельные заказы">📦 <b>${wqDone}/${wqTotal}</b></button>`
    : "";

  const hasRewards = wqDone > 0;

  // Активные временные дебаффы (от событий) — статус-стрип с оставшимися днями.
  const debuffIcons = { injury: "🤕", slept_rough: "🪨" };
  const debuffs = (state.tempDebuffs || []).map((d) =>
    `<span class="debuff-pill" title="${esc(d.desc || d.name)}">${d.icon || debuffIcons[d.id] || "⚠"} ${d.name} · ${d.days} дн.</span>`
  ).join("");
  const debuffStrip = debuffs ? `<div class="debuff-strip">${debuffs}</div>` : "";

  return `
    <button class="brand" data-act="goto" data-screen="hub" type="button"><span class="brand-text"><b>ВОСХОЖДЕНИЕ</b></span></button>
    <div class="vitals">
      <div class="vital"><div class="vital-top"><span>HP</span><b>${state.hp}<i>/${st.maxHp}</i></b></div>${bar("hp", state.hp, st.maxHp)}</div>
      <div class="vital"><div class="vital-top"><span>МАНА</span><b>${state.mana}<i>/${st.maxMana}</i></b></div>${bar("mana", state.mana, st.maxMana)}</div>
      <div class="vital energy-vital"><div class="vital-top"><span>ЭНЕРГИЯ</span><b>${state.energy}<i>/${st.maxEnergy}</i></b></div>${bar("energy", state.energy, st.maxEnergy)}</div>
      <div class="pill gold"><span>💰</span><b>${state.gold}</b></div><div class="pill">УР <b>${state.level}</b></div>
      ${state.points > 0 ? `<button class="pill gold points" data-act="goto" data-screen="hero" type="button">+<b>${state.points}</b></button>` : ""}
      <div class="pill">ЭТАЖ <b>${state.maxFloor}/5</b></div>
      ${shopFactionPill()}
      <div class="pill time event-pill${phase.towerOpen ? "" : " night"}" data-tip="${event ? `${event.icon} ${event.name}: ${esc(event.desc)}` : "Сегодня обычный день — событий нет"}">${phase.icon} <b>${phase.name}</b> · ${calendarLabel()}</div>
      ${weeklyPill}
    </div>
    <nav class="topnav${lockNav}">
      <button class="nav-btn icon-btn rest-btn" data-act="rest" type="button" data-tooltip="Отдых (+3 энергии)">⚡</button>
      <button class="nav-btn icon-btn${hasRewards ? " ok" : ""}" data-act="quests-open" type="button" data-tooltip="Журнал">📋</button>
      <button class="nav-btn icon-btn" data-act="bestiary-open" type="button" data-tooltip="Бестиарий">📖</button>
      <button class="nav-btn icon-btn" data-act="goto" data-screen="hero" type="button" data-tooltip="Герой">👤</button>
      <button class="nav-btn icon-btn" data-act="goto" data-screen="hub" type="button" data-tooltip="Вернуться в Йорстед">🏰</button>
    </nav>
    ${debuffStrip}
  `;
}

function hubHtml(st) {
  const bossDead = Object.keys(state.cleared).length;
  const phase = phaseInfo();
  const companion = activeCompanion();
  const closed = towerClosedReason();
  const event = todaysEvent();

  let bgImage = "assets/backgrounds/hub_day.webp";
  if (state.phase === 0) bgImage = "assets/backgrounds/hub_morning.webp";
  else if (state.phase === 1) bgImage = "assets/backgrounds/hub_day.webp";
  else if (state.phase === 2) bgImage = "assets/backgrounds/hub_evening.webp";
  else if (state.phase === 3) bgImage = "assets/backgrounds/hub_night.webp";

  return `
    <div class="screen-bg" style="background-image: url('${bgImage}');"><div class="bg-overlay"></div></div>
    <section class="hub">
      <div class="hub-head">
        <img src="assets/backgrounds/hub.webp" class="hub-image" onerror="this.style.display='none'" alt="">
        <div class="hub-head-text">
          <div class="hub-head-copy">
            <h1>Йорстед</h1>
            <p class="lead">Йорстед - один из древних городов-крепостей человечества и единственное безопасное место в округе.</p>
          </div>
        </div>
      </div>

      ${companion ? `
        <div class="hub-status-row">
          <button class="companion-pill" data-act="companion-info" data-id="${companion.id}" type="button" title="Рассказать о спутнице">
            <span class="companion-pill-label">Спутница</span>
            <b>${companion.icon} ${esc(companion.name)}</b>
          </button>
        </div>
      ` : ""}

            <div class="locations">
        <button class="loc-card${isNight() ? " locked" : ""}" data-act="goto" data-screen="market" type="button">
          <img class="loc-image" src="assets/backgrounds/market.webp" onerror="this.style.display='none'" alt="">
          <div class="loc-content">
            <span class="loc-body">
              <span class="loc-kicker">${isNight() ? "Закрыто до утра" : "Снаряжение и зелья"}</span>
              <span class="loc-title">Торговая площадь</span>
              <span class="loc-desc">Кузница, Лавка Алхимика и Ювелир.</span>
            </span>
            <span class="loc-cta">${isNight() ? "Спит" : "Войти →"}</span>
          </div>
        </button>

        <button class="loc-card hotel" data-act="goto" data-screen="hotel" type="button">
          <img class="loc-image" src="assets/backgrounds/hotel.webp" onerror="this.style.display='none'" alt="">
          <div class="loc-content">
            <span class="loc-body">
              <span class="loc-kicker">Номер и спутницы</span>
              <span class="loc-title">Гостиница</span>
            </span>
            <span class="loc-cta">Войти →</span>
          </div>
        </button>

        <button class="loc-card${isNight() ? " locked" : ""}" data-act="goto" data-screen="training" type="button">
          <img class="loc-image" src="assets/backgrounds/hunters_hall.webp" onerror="this.style.display='none'" alt="">
          <div class="loc-content">
            <span class="loc-body">
              <span class="loc-kicker">${isNight() ? "Закрыто до утра" : "Тренировки и Задания"}</span>
              <span class="loc-title">Зал Охотников</span>
            </span>
            <span class="loc-cta">${isNight() ? "Спит" : "Войти →"}</span>
          </div>
        </button>

        <button class="loc-card tower${closed ? " locked" : ""}" data-act="goto" data-screen="tower" type="button">
          <img class="loc-image" src="assets/backgrounds/tower.webp" onerror="this.style.display='none'" alt="">
          <div class="loc-content">
            <span class="loc-body">
              <span class="loc-kicker">${closed ? "Проход закрыт" : `Боссов повержено: ${bossDead}/5`}</span>
              <span class="loc-title">${closed ? "Дорога до Башни слишком опасна" : "Башня"}</span>
            </span>
            <span class="loc-cta">${closed ? "До утра" : "Войти →"}</span>
          </div>
        </button>
      </div>
    </section>
  `;
}

const COMPANION_BATTLE_TEXT = {
  heal: "🌿 Лечит героя в бою",
  stun: "🎼 Оглушает врага",
  strike: "🗡️ Наносит удар по врагу",
};

// Карточка спутницы по клику на плашку в хабе: портрет, роль, описание,
// ранг отношений и боевое действие.
function renderCompanionInfoModal() {
  const companion = COMPANION_MAP[view.companionInfo];
  if (!companion) return "";
  const info = companionAffinityInfo(companion.id);
  const active = state.companion === companion.id;
  const nextText = info.next ? `${info.value} / ${info.next.min}` : `${info.value} / максимум`;
  const battleText = COMPANION_BATTLE_TEXT[companion.battleAction] || "Помогает в бою";

  return `
    <div class="result-overlay" data-act="companion-info-close" style="z-index: 190;">
      <div class="result-card companion-modal" data-act="companion-info-stop" style="max-width: 560px; text-align: left;">
        <div class="companion-modal-head">
          <img src="${npcPortraitSrc(companion.id)}" alt="${esc(companion.name)}">
          <div>
            <span class="companion-modal-kicker">Спутница</span>
            <h2>${esc(companion.name)}</h2>
            <span class="hint">${esc(companion.role)}${active ? " · сейчас с вами" : ""}</span>
          </div>
        </div>
        <p class="companion-modal-desc">${esc(genderText(companion.desc || ""))}</p>
        <div class="companion-modal-block">
          <div class="companion-modal-row"><b>Ранг Affinity</b><span>${esc(info.rank.name)}</span></div>
          <div class="bar"><span style="width:${info.percent}%"></span></div>
          <div class="hint">${nextText}</div>
        </div>
        <div class="companion-modal-block">
          <div class="companion-modal-row"><b>Боевые действия</b></div>
          <p class="companion-modal-action">${battleText}</p>
        </div>
        <div class="companion-modal-foot">
          <button class="btn primary" data-act="companion-info-close" type="button">Закрыть</button>
        </div>
      </div>
    </div>
  `;
}

const SHOP_NPCS = { forge: "ron", alchemy: "elain", jewelry: "elize", hotel: "stella", training: "ivan" };
const CRAFT_NPC_STATIONS = { ron: "forge", elain: "alchemy", elize: "jewelry" };

function npcStorySlide(npcId) {
  const storyArr = DIALOGS[npcId]?.story;
  const storyIndex = state.npcDialogueIndex[npcId] || 0;
  return (!view.storyJustPlayed && Array.isArray(storyArr)) ? storyArr[storyIndex] : null;
}

function npcDialogueBar(npcId, buyLabel, sellLabel, extraAction = "", portraitClass = "") {
  const tab = view.shopTab;
  const npcName = NPC_NAMES[npcId] || npcId;
  const phrase = view.shopNpcPhrase || getRandomPhrase(npcId, "greetings");
  
  const btn = (tabId, label) =>
    `<button class="shop-tab npc-action-btn${tab === tabId ? " active" : ""}" data-act="shop-tab" data-tab="${tabId}" data-npc="${npcId}" type="button">${label}</button>`;
  const craftStation = CRAFT_NPC_STATIONS[npcId];
  const craftBtn = craftStation && getRecipes(craftStation).length ? btn("craft", "Крафт") : "";
  // Разговор — единственный вход в сюжетные задания NPC. У Ивана кнопка
  // оформлена так же, как у Тимми в Зале Охотников.
  const talkBtn = npcId === "ivan"
    ? `<button class="btn small primary" data-act="npc-talk" data-npc="${npcId}" type="button">💬 Поговорить</button>`
    : `<button class="shop-tab npc-action-btn" data-act="npc-talk" data-npc="${npcId}" type="button">Поговорить</button>`;

  // У Стеллы группа «Торговля» на самом деле — кнопка «Спутницы», поэтому
  // заголовок торговли ей не нужен; сама кнопка остаётся.
  const actionGroups = [
    { title: npcId === "stella" ? "" : "Торговля", items: [buyLabel ? btn("buy", buyLabel) : "", sellLabel ? btn("sell", sellLabel) : ""] },
    { title: "Мастерская", items: [
      craftBtn,
      FACTION_BY_NPC[npcId] ? btn("upgrade", "Улучшить") : "",
      npcId === "ron" ? btn("exchange", "Обмен") : "",
    ] },
    { title: "Информация", items: [
      npcId === "ivan" || npcId === "stella" ? "" : btn("quests", "Есть задания?"),
      talkBtn,
    ] },
  ];
  const actionsHtml = actionGroups.map((group) => {
    const items = group.items.filter(Boolean);
    if (!items.length) return "";
    const titleHtml = group.title ? `<span class="npc-action-group-title">${group.title}</span>` : "";
    return `${titleHtml}${items.join("")}`;
  }).join("");

  return `
    <div class="npc-dialogue-bar">
      <div class="npc-dialogue-main">
        <img class="npc-portrait ${portraitClass}" src="${npcPortraitSrc(npcId)}" alt="${esc(npcName)}" style="background-color: #171210;">
        <div class="npc-dialogue-text">
          <p class="npc-name" style="margin-top: 0;">${esc(npcName)}</p>
          <p class="npc-dialogue">«${esc(phrase)}»</p>
        </div>
      </div>
      <div class="npc-action-grid">
        ${extraAction ? `<div class="npc-action-featured">${extraAction}</div>` : ""}
        ${actionsHtml}
      </div>
    </div>
  `;
}

function sellPanelHtml(shopName) {
  const npc = view.activeShopNpc || SHOP_NPCS[shopName] || shopName;
  const sel = new Set(view.sellSelection || []);
  const jewelrySlots = new Set(["neck", "ring", "trinket"]);
  const acceptsPotions = npc === "elain";
  const acceptsGear = npc === "ron" || npc === "elize";
  const gearOk = (slot) => npc === "ron" ? !jewelrySlots.has(slot) : jewelrySlots.has(slot);

  if (!acceptsPotions && !acceptsGear) {
    return `<section class="shop-group"><h2 class="group-title">🧾 Скупка</h2><p class="empty">Мне это не интересно.</p></section>`;
  }

  const potionIds = [];
  const potionRows = acceptsPotions
    ? Object.values(ITEMS).filter((i) => i.type === "potion" && (state.potions[i.id] || 0) > 0).map((item) => {
    const id = item.id; const count = state.potions[id];
    potionIds.push(id);
    const price = sellPrice(item) * count;
    return `<label class="sell-row${sel.has(id) ? " picked" : ""}" data-act="sell-toggle" data-id="${id}" data-shop="${shopName}">
      <input type="checkbox" ${sel.has(id) ? "checked" : ""}>
      <span class="sell-icon">${iconHtml(item.icon, 28)}</span>
      <span class="sell-name">${item.name} ×${count}</span>
      <span class="price">${price} 💰</span>
    </label>`;
  }).join("") : "";

  const gearIds = [];
  const gearRows = acceptsGear
    ? state.owned.filter((inst) => !isEquipped(inst.uid) && !(ITEMS[inst.id]?.type === "potion") && gearOk(ITEMS[inst.id]?.slot)).map((inst) => {
    const item = ITEMS[inst.id]; if (!item) return "";
    gearIds.push(inst.uid);
    const price = sellPrice(item, inst);
    return `<label class="sell-row${sel.has(inst.uid) ? " picked" : ""}" data-act="sell-toggle" data-id="${inst.uid}" data-shop="${shopName}">
      <input type="checkbox" ${sel.has(inst.uid) ? "checked" : ""}>
      <span class="sell-icon">${iconHtml(item.icon, 28)}</span>
      <span class="sell-name">${getItemDisplayName(inst)}<i class="hint"> · прочность ${durabilityOf(inst)}</i></span>
      <span class="price">${price} 💰</span>
      <button class="btn small ghost" data-act="salvage" data-uid="${inst.uid}" ${RECIPES.some((r) => r.result === item.id) ? "" : "disabled"} title="Разобрать: вернуть половину материалов рецепта" type="button">🔨</button>
    </label>`;
  }).join("") : "";

  let total = 0;
  for (const id of sel) {
    const inst = getInstance(id);
    if (inst) { const item = ITEMS[inst.id]; if (item && !isEquipped(inst.uid) && acceptsGear && gearOk(item.slot)) total += sellPrice(item, inst); continue; }
    const item = ITEMS[id];
    if (item && item.type === "potion" && acceptsPotions) total += sellPrice(item) * (state.potions[id] || 0);
  }

  const empty = !potionRows && !gearRows;
  if (empty) return `<section class="shop-group"><h2 class="group-title">🧾 Скупка</h2><p class="empty">Мне это не интересно.</p></section>`;

  const sellableIds = [...gearIds, ...potionIds];
  const allSelected = sellableIds.length > 0 && sellableIds.every((id) => sel.has(id));

  return `
    <section class="shop-group">
      <div class="sell-head">
        <h2 class="group-title">💰 Скупка <span class="hint">— отмечайте всё лишнее, продажа одним кликом</span></h2>
        <button class="btn small ghost" data-act="sell-select-all" data-shop="${shopName}" type="button">${allSelected ? "Снять выбор" : "Выбрать всё"}</button>
      </div>
      <div class="sell-grid">
        ${gearRows ? `<h3 class="group-title">Снаряжение</h3>${gearRows}` : ""}
        ${potionRows ? `<h3 class="group-title">Зелья</h3>${potionRows}` : ""}
      </div>
      <div class="repair-all">
        <span class="price">Итого: ${total} 💰</span>
        <button class="btn primary" data-act="sell-submit" data-shop="${shopName}" ${sel.size ? "" : "disabled"} type="button">Продать всё выбранное (${total} 💰)</button>
      </div>
    </section>
  `;
}

function marketHtml() {
  return `<div class="screen-bg" style="background-image: url('assets/backgrounds/market.webp');"><div class="bg-overlay"></div></div>
    ${subHeader("Торговая площадь", "Здесь торгуют, куют и варят", "hub", "← В Йорстед")}
    <div class="locations market-list">
      <button class="loc-card" data-act="goto" data-screen="forge" type="button"><img class="loc-image" src="assets/backgrounds/forge.webp" onerror="this.style.display='none'"><div class="loc-content">
        <span class="loc-body">
          <span class="loc-kicker">Оружие и броня</span>
          <span class="loc-title">Кузница</span>
          <span class="loc-desc">Кузница стоит на окраине города, там, где запах дыма не столь заметен. Здание низкое, приземистое, сложенное из грубого серого камня, подогнанные так плотно, что между ними не просунуть и лезвие ножа — характерная гномская работа. Над дверью висит выкованная из чёрного железа вывеска: молот на фоне горного пика, и гордая надпись "Друг гномов".</span>
        </span>
        <span class="loc-cta">Войти →</span>
      </button>
      
      <button class="loc-card" data-act="goto" data-screen="alchemy" type="button">
        <img class="loc-image" src="assets/backgrounds/alchemy.webp" onerror="this.style.display='none'">
        <div class="loc-content">
          <span class="loc-body">
            <span class="loc-kicker">Зелья и настои</span>
            <span class="loc-title">Лавка Алхимика</span>
            <span class="loc-desc">Лавка прячется в одном из узких переулков старого города, там, где туман стелется по булыжникам даже в ясные дни. На вывеске красуется изумительная серебряная вывеска. Возле лавки вечно витает травянистый запах, даже вдох которого, кажется, исцеляет.</span>
          </span>
          <span class="loc-cta">Войти →</span>
        </div>
      </button>
      
      <button class="loc-card" data-act="goto" data-screen="jewelry" type="button">
        <img class="loc-image" src="assets/backgrounds/jewelry.webp" onerror="this.style.display='none'">
        <div class="loc-content">
          <span class="loc-body">
            <span class="loc-kicker">Кольца, ожерелья, аксессуары</span>
            <span class="loc-title">Ювелирная лавка</span>
            <span class="loc-desc">Скромная на первый взгляд лавка ютится в самом сердце старого квартала, но первое впечатление обманчиво. Над входом висит вывеска — не обычная доска, а настоящая ветвь из серебра, на которой красуется огромный изумруд, переливающийся лучами солнца даже при полной темноте. Окна лавки всегда затянуты лёгкой дымкой — хозяйка не любит, чтобы прохожие заглядывали внутрь без приглашения.</span>
          </span>
          <span class="loc-cta">Войти →</span>
        </div>
      </button>
    </div>
  `;
}

function affinityBarHtml(companionId) {
  const companion = COMPANION_MAP[companionId];
  if (!companion) return "";
  const info = companionAffinityInfo(companionId);
  const nextText = info.next ? `${info.value} / ${info.next.min}` : `${info.value} / максимум`;
  return `<div style="margin-top:10px;">
    <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:var(--gold2);">
      <b>${companion.icon} ${esc(companion.name)}</b><span>${esc(info.rank.name)}</span>
    </div>
    <div class="bar" style="height:6px; margin-top:5px;"><span style="width:${info.percent}%"></span></div>
    <div style="display:flex; justify-content:space-between; gap:8px; margin-top:4px; font-size:11px; opacity:.8;">
      <span>${nextText}</span><span>${companionWage(companionId)} 💰/день</span>
    </div>
  </div>`;
}

function hotelHtml() {
  const companion = activeCompanion();
  const canHotel = state.gold >= HOTEL_PRICE;
  // Компактная горизонтальная карточка: только портрет, имя, роль и диалог.
  // Найм — через диалог «Поговорить»; пассивных баффов и цены в карточке нет.
  const cards = COMPANIONS.map((c) => {
    const active = companion?.id === c.id;
    return `<article class="companion-row${active ? " active" : ""}">
      <img class="companion-portrait" src="${npcPortraitSrc(c.id)}" alt="${esc(c.name)}">
      <div class="companion-info">
        <h3>${esc(c.name)}</h3>
        <span class="companion-role">${esc(c.role)}</span>
      </div>
      <div class="companion-actions">
        <button class="btn small ghost" data-act="npc-talk" data-npc="${c.id}" type="button">Поговорить</button>
      </div>
    </article>`;
  }).join("");
  const companionNote = companion
    ? `<div class="companion-note">${iconHtml(companion.icon, 20)} <span><b>${companion.name}</b>: ${companionAffinityInfo(companion.id).rank.name}. Жалование ${companionWage(companion.id)} 💰/день.</span></div>`
    : `<div class="companion-note">💞 Компаньон остаётся с вами, пока вы платите жалование. Отношения растут в боях и событиях.</div>`;

  const tab = view.shopTab === "quests" ? "quests" : "buy";
  const content =
    tab === "quests"
      ? npcQuestHtml("stella")
      : `<h2 class="group-title">Спутницы</h2>${companionNote}<div class="companion-grid">${cards}</div>`;

  return `
    <div class="screen-bg" style="background-image: url('assets/backgrounds/hotel.webp');"><div class="bg-overlay"></div></div>
    ${subHeader("Гостиница", "Тёплый свет и чужие истории", "hub", "← В Йорстед")}
    ${npcDialogueBar("stella", "Спутницы", "", `<button class="btn primary" data-act="hotel-rest" type="button" ${canHotel ? "" : "disabled"}>Снять номер · ${HOTEL_PRICE} 💰</button>`)}
    ${content}
  `;
}

function trainingAvailability(training) {
  const cap = Number(training.cap) || 10;
  const count = state.trainingCount?.[training.id] || 0;
  if (state.phase === 3) return { ok: false, reason: "Иван спит" };
  if (count >= cap) return { ok: false, reason: `Потолок (${cap})` };
  if (state.energy < TRAINING_ENERGY_COST) return { ok: false, reason: `Нужно ${TRAINING_ENERGY_COST} ⚡` };
  return { ok: true, reason: "" };
}

function trainingHtml() {
  const hallTab = view.hallTab === "training" ? "training" : "board";
  const tabBtn = (tabId, label) =>
    `<button class="shop-tab npc-action-btn${hallTab === tabId ? " active" : ""}" data-act="hall-tab" data-tab="${tabId}" type="button">${label}</button>`;
  const hallTabs = `<div class="hall-tabs">${tabBtn("training", "💪 Тренировки")}${tabBtn("board", "📋 Задания")}</div>`;

  // Баннер «Иван отдыхает» — только ночью (phase 3). Утром/днём/вечером тренировки идут.
  const warning = state.phase === 3
    ? `<div class="banner warn-banner">🌙 Сейчас ночь. Иван уже спит — приходите утром.</div>`
    : (state.energy < TRAINING_ENERGY_COST ? `<div class="banner warn-banner">⚡ Не хватает энергии.</div>` : `<div class="banner">⏳ Тренировка занимает фазу: утро → день → вечер.</div>`);

  const trainingCards = TRAININGS.map((t) => {
    const avail = trainingAvailability(t);
    const cap = Number(t.cap) || 10;
    const stat = t.stat || t.attr;
    const current = state.attrs[stat];
    const count = state.trainingCount?.[t.id] || 0;
    const attrName = ATTR_INFO.find((a) => a.id === stat).name;
    const pct = Math.max(0, Math.min(100, Math.round((count / cap) * 100)));
    const cost = `<span class="price">⚡ ${TRAINING_ENERGY_COST} · ⏳ ${TRAINING_PHASES} фаза · риск ${Math.round((t.risk || 0) * 100)}%</span>`;
    return `<article class="training-card${avail.ok ? "" : " disabled"}">
      <div class="training-head"><span class="training-icon">${t.icon}</span><div class="training-name"><h3>${t.name}</h3><span class="training-effect">${esc(t.effect || "")}</span></div></div>
      <p class="item-desc">${t.desc}</p>
      <div class="training-progress">
        <span class="training-attr">${attrName}: ${current} · курс ${count} / ${cap}</span>
        <div class="bar training-bar"><span style="width:${pct}%"></span></div>
      </div>
      <div class="training-foot">${cost}<button class="btn small${avail.ok ? " primary" : ""}" data-act="train" data-id="${t.id}" ${avail.ok ? "" : "disabled"} type="button">${avail.ok ? "Тренироваться" : avail.reason}</button></div>
    </article>`;
  }).join("");

  // Центральная колонка: доска контрактов либо тренировочный зал.
  const boardSection = hallTab === "board"
    ? huntBoardHtml()
    : "";
  const trainingSection = hallTab === "training"
    ? `<section class="shop-group training-section">
        <h2 class="group-title">💪 Тренировочный зал</h2>
        <div class="training-grid">${trainingCards}</div>
      </section>`
    : "";

  return `
    <div class="screen-bg hall-bg" style="background-image: url('assets/backgrounds/hunters_hall.webp');"><div class="bg-overlay"></div></div>
    ${subHeader("Зал Охотников", "Место сбора авантюристов", "hub")}
    <div class="hall-npcs">
      ${npcDialogueBar("ivan", "", "")}
      ${timmyCardHtml()}
    </div>
    <div class="hall-shell">
      <div class="hall-nav">
        ${hallTabs}
      </div>
      <div class="hall-layout">
        <div class="hall-content">
          ${hallTab === "training" ? warning : ""}
          ${boardSection}
          ${trainingSection}
        </div>
        ${hunterStatsHtml()}
      </div>
    </div>
  `;
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

function huntBoardHtml() {
  ensureWeekQuests();
  // Доска и журнал — один и тот же state.weekQuests.list.
  const cards = state.weekQuests.list
    .filter((q) => q.type === "kill" || q.type === "hunt")
    .map((q) => {
      const isWeekly = q.type === "kill";
      const title = isWeekly ? "Недельный заказ Ивана" : "Контракт на охоту";
      const goal = `Истребить ${q.target} × ${q.mobName || findMobName(q.mobId)} — ${huntFloorName(q.floorId)}`;
      const pct = Math.max(0, Math.min(100, Math.round((q.progress / q.target) * 100)));

      let button;
      if (q.status === "offered") button = `<button class="btn small primary" data-act="hunt-accept" data-id="${q.id}" type="button">Взять</button>`;
      else if (q.status === "active") button = `<button class="btn small" disabled type="button">В работе (${q.progress}/${q.target})</button>`;
      else if (q.status === "done") button = `<button class="btn small primary" data-act="hunt-claim" data-id="${q.id}" type="button">Сдать</button>`;
      else button = `<button class="btn small" disabled type="button">Сдано</button>`;

      const badge = isWeekly
        ? `<span class="badge board-badge weekly">📌 Заказ недели</span>`
        : `<span class="badge board-badge">📌 Контракт</span>`;

      return `<article class="contract-card${isWeekly ? " weekly" : ""}${q.status === "claimed" ? " claimed" : q.status === "done" ? " done" : ""}">
      <div class="contract-pin" aria-hidden="true"></div>
      <div class="contract-head">
        <span class="contract-icon">${iconHtml(q.mobIcon || findMobIcon(q.mobId), 36)}</span>
        <div>
          <span class="contract-kicker">${isWeekly ? "От капитана" : "Доска Гильдии"}</span>
          <h3>${esc(title)}</h3>
        </div>
        ${badge}
      </div>
      <p class="contract-goal">🎯 ${esc(goal)}</p>
      <p class="item-desc">${esc(q.desc || "")}</p>
      <div class="contract-progress">
        <div class="bar"><span style="width:${pct}%"></span></div>
        <span class="quest-count">${q.progress} / ${q.target}</span>
      </div>
      <div class="contract-foot">
        <span class="price">💰 ${q.gold} · ✦ ${q.xp} · 🏹 +${q.rep || 1} реп.</span>
        ${button}
      </div>
    </article>`;
    }).join("");

  return `
    <section class="shop-group hunt-board">
      <div class="hunt-board-head">
        <h2 class="group-title">📋 Доска объявлений</h2>
        <span class="hint">Награда: золото и репутация Гильдии Охотников 🏹</span>
      </div>
      <div class="contract-grid">${cards}</div>
    </section>
  `;
}

// ── Статистика охотника («Мои свершения») ──────────────────────────────────
function hunterStatsHtml() {
  const weapon = getEquippedItem("mainhand");
  const weaponName = weapon && weapon.item ? weapon.item.name : "Кулаки";
  const rows = [
    { icon: "⚔️", label: "Убито мобов", value: String(state.kills || 0) },
    { icon: "👑", label: "Повержено боссов", value: `${Object.keys(state.cleared).length} из 5` },
    { icon: "🗡️", label: "Любимое оружие", value: weaponName },
    { icon: "📜", label: "Выполнено контрактов", value: String(state.contractsDone || 0) },
  ];
  return `
    <section class="shop-group hall-stats">
      <h2 class="group-title">🏆 Мои свершения</h2>
      <div class="hall-stats-list">
        ${rows.map((r) => `<div class="hall-stat-row"><span class="hall-stat-icon">${r.icon}</span><span class="hall-stat-label">${r.label}</span><b class="hall-stat-value">${esc(r.value)}</b></div>`).join("")}
      </div>
    </section>
  `;
}

// ── Тимми, молодой охотник ─────────────────────────────────────────────────
// Совет выбирается случайно из доступных для текущего прогресса (maxFloor).
function timmyTipsForProgress() {
  const maxFloor = Math.max(1, state.maxFloor || 1);
  return HUNTER_TIPS.filter((tip) => maxFloor >= tip.minFloor).map((tip) => tip.text);
}

function randomTimmyTip() {
  const tips = timmyTipsForProgress();
  return tips.length ? tips[Math.floor(Math.random() * tips.length)] : "Пока нечему учить. Возвращайся, когда выйдешь на новый этаж.";
}

function timmyCardHtml() {
  return `
    <aside class="npc-dialogue-bar timmy-card">
      <div class="npc-dialogue-main">
        <img class="npc-portrait" src="${npcPortraitSrc("timmy")}" alt="Тимми" onerror="this.style.display='none'">
        <div class="npc-dialogue-text">
          <p class="npc-name">Тимми</p>
          <p class="npc-role">Молодой охотник</p>
          <p class="npc-dialogue timmy-desc">Знает слабости всех тварей Башни. Или думает, что знает.</p>
        </div>
      </div>
      <div class="timmy-info-block">
        <span class="npc-action-group-title">Информация</span>
        <button class="btn small primary" data-act="npc-talk" data-npc="timmy" type="button">💬 Поговорить</button>
      </div>
    </aside>
  `;
}

// Модалка совета удалена: отдельных окон с советами больше нет, все реплики
// Тимми идут через диалоговое дерево.

function questsModalHtml() {
  ensureWeekQuests();
  const tab = view.questsTab === "story" ? "story" : "week";
  const list = state.weekQuests.list || [];

  const npcName = (id) => NPC_NAMES[id] || id;
  const questGiver = (q) => (q.type === "hunt" ? "Гильдия Охотников" : (NPC_NAMES[q.npc] || q.npc || "Гильдия Охотников"));
  
  const cards = list.map((q) => {
    const title = q.type === "kill"
      ? `Убить: ${q.mobName}`
      : q.type === "hunt"
        ? `Истребить: ${q.mobName}`
        : `Собрать: ${q.resName}`;

    let statusHtml = `<span class="badge">Предложение недели</span>`;
    if (q.status === "active") statusHtml = `<span class="badge">В работе</span>`;
    else if (q.status === "done") statusHtml = `<span class="badge" style="border-color: var(--gold); color: var(--gold);">Готово (сдать: ${esc(questGiver(q).split(",")[0])})</span>`;
    else if (q.status === "claimed") statusHtml = `<span class="badge" style="border-color: var(--line2); color: var(--dim);">Получено</span>`;

    return `
      <article class="quest-card quest-card-wide${q.status === "claimed" ? " claimed" : q.status === "done" ? " done" : ""}">
        <div class="quest-body">
          <div class="quest-info">
            <div class="quest-title" style="display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: baseline;">
              <h3 style="margin: 0;">${title}</h3>
              <span class="hint" style="white-space: nowrap;">Наниматель: <b>${esc(questGiver(q))}</b></span>
            </div>
          </div>
          <div class="quest-progress-wrap">
            <div class="bar"><span style="width:${Math.min(100, Math.round((q.progress / q.target) * 100))}%"></span></div>
            <span class="quest-count">${q.progress} / ${q.target}</span>
          </div>
        </div>
        <div class="quest-side" style="min-width: 160px;">
          <span class="price">💰 ${q.gold} · ✦ ${q.xp}</span>
          ${statusHtml}
        </div>
      </article>
    `;
  }).join("");

  const weekCards = `
    <div class="quest-grid" style="grid-template-columns: 1fr; gap: 8px;">
      ${cards || `<p class="empty">На этой неделе предложений нет.</p>`}
    </div>
  `;

  // Вкладка «Сюжетные»: статус каждого сюжетного задания.
  const storyCards = STORY_QUESTS.map((def) => {
    const entry = state.activeStoryQuests.find((a) => a.id === def.id);
    const done = state.completedStoryQuests.includes(def.id);
    const target = storyQuestTarget(def);
    const progress = done ? target : (entry ? storyQuestProgress(entry).progress : 0);
    const pct = Math.round((progress / target) * 100);

    let statusHtml = `<span class="badge">Забрать у NPC</span>`;
    if (entry) statusHtml = progress >= target
      ? `<span class="badge" style="border-color: var(--gold); color: var(--gold);">Готово (сдать: ${esc(npcName(def.npc).split(",")[0])})</span>`
      : `<span class="badge">В работе</span>`;
    else if (done) statusHtml = `<span class="badge" style="border-color: var(--line2); color: var(--dim);">Выполнено</span>`;

    return `
      <article class="quest-card quest-card-wide${done ? " claimed" : entry && progress >= target ? " done" : ""}">
        <div class="quest-body">
          <div class="quest-info">
            <div class="quest-title" style="display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: baseline;">
              <h3 style="margin: 0;">📖 ${esc(def.title)}</h3>
              <span class="hint" style="white-space: nowrap;">Дает: <b>${esc(npcName(def.npc))}</b></span>
            </div>
            <span class="hint">${storyQuestObjectivesText(def)} · Награда: ${storyQuestRewardText(def)}</span>
          </div>
          <div class="quest-progress-wrap">
            <div class="bar"><span style="width:${pct}%"></span></div>
            <span class="quest-count">${progress} / ${target}</span>
          </div>
        </div>
        <div class="quest-side" style="min-width: 160px;">
          ${statusHtml}
        </div>
      </article>
    `;
  }).join("");

  const content = tab === "week"
    ? weekCards
    : `<div class="quest-grid" style="grid-template-columns: 1fr; gap: 8px;">${storyCards}</div>`;
  const tabLabel = tab === "week" ? "Недельные заказы" : "Сюжетные задания";
  const hint = tab === "week"
    ? `<p class="hint" style="margin: 0 0 12px;">Заказы выдаются в понедельник утром, до конца недели. Заказы NPC берутся лично, контракты — на Доске объявлений в Зале Охотников.</p>`
    : `<p class="hint" style="margin: 0 0 12px;">Главные задания истории. Взять и сдать — лично у NPC; заблокировано, пока не достигнут нужный этаж.</p>`;

  return `
    <div class="doll-menu-backdrop" data-act="quests-close"></div>
    <div class="doll-menu quest-modal" role="dialog">
      <div class="doll-menu-head">
        <h3>Журнал · ${tabLabel}</h3>
        <button class="doll-menu-close" data-act="quests-close" type="button">✕</button>
      </div>
      <div class="shop-tabs" style="margin-bottom: 12px;">
        <button class="shop-tab${tab === "week" ? " active" : ""}" data-act="quests-tab" data-tab="week" type="button">📅 Недельные</button>
        <button class="shop-tab${tab === "story" ? " active" : ""}" data-act="quests-tab" data-tab="story" type="button">📜 Сюжетные</button>
      </div>
      ${hint}
      ${content}
    </div>
  `;
}

// ── Модальное окно Настроек (Этап 7) ───────────────────────────────────────
// Табы: audio (звук), ui (интерфейс), controls (управление).
function settingsModalHtml() {
  const tab = view.settingsTab || "audio";
  const musicVol = LocationAudio.getVolumeMusic();
  const ambientVol = LocationAudio.getVolumeAmbient();

  const tabBtn = (id, label) =>
    `<button class="settings-tab${tab === id ? " active" : ""}" data-act="settings-tab" data-tab="${id}" type="button">${label}</button>`;

  let content = "";
  if (tab === "audio") {
    content = `
      <div class="settings-row">
        <label for="music-volume">Музыка</label>
        <input type="range" id="music-volume" min="0" max="1" step="0.01" value="${musicVol}">
        <span class="settings-val" data-role="music-volume-label">${Math.round(musicVol * 100)}%</span>
      </div>
      <div class="settings-row">
        <label for="ambient-volume">Амбиент</label>
        <input type="range" id="ambient-volume" min="0" max="1" step="0.05" value="${ambientVol}">
        <span class="settings-val" data-role="ambient-volume-label">${Math.round(ambientVol * 100)}%</span>
      </div>
      <div class="settings-row">
        <label>Звуки (SFX)</label>
        <input type="range" min="0" max="1" step="0.05" value="${Sfx.getVolume()}" data-role="sfx-volume">
        <span class="settings-val" data-role="sfx-volume-label">${Math.round(Sfx.getVolume() * 100)}%</span>
      </div>
      <div class="settings-row" style="justify-content: flex-start;">
        <button class="btn small" data-act="test-sound" type="button">Проверить звук</button>
      </div>
    `;
  } else if (tab === "ui") {
    content = `<p class="settings-stub">В разработке</p>`;
  } else {
    content = `
      <p class="settings-help">Хоткеи боя:</p>
      <p class="settings-help"><b>1–5</b> — выбрать зону удара</p>
      <p class="settings-help"><b>Shift + 1–5</b> — включить/выключить зону блока</p>
    `;
  }

  return `
    <div class="settings-backdrop" data-act="settings-close"></div>
    <div class="settings-modal" role="dialog" aria-label="Настройки">
      <div class="settings-head">
        <h3>⚙️ Настройки</h3>
        <button class="settings-close" data-act="settings-close" type="button">✕</button>
      </div>
      <div class="settings-body">
        <aside class="settings-sidebar">
          ${tabBtn("audio", "🔊 Звук")}
          ${tabBtn("ui", "🖥 Интерфейс")}
          ${tabBtn("controls", "⌨ Управление")}
        </aside>
        <div class="settings-content">${content}</div>
      </div>
    </div>
  `;
}

function bestiaryModalHtml() {
  const filter = view.bestiaryFilter || "all";
  const killsOf = (id) => (state.bestiaryKills || {})[id] || 0;
  const REVEAL_KILLS = 5; // после 5 убийств бестиарий раскрывает слабость и дроп

  // Имя дропа: сначала ресурс, затем предмет.
  const dropName = (drop) => {
    const res = ALL_RESOURCES.find((r) => r.id === drop.id);
    if (res) return `${iconHtml(res.icon, 14)} ${res.name}`;
    const item = ITEMS[drop.id];
    if (item) return `${iconHtml(item.icon, 14)} ${item.name}`;
    return drop.id;
  };

  const cards = FLOORS.flatMap((floor) => {
    const bossDefeated = Boolean(state.cleared[floor.id]);
    const entries = [...floor.mobs.map((def) => ({ def, floor, isBoss: false })), { def: floor.boss, floor, isBoss: true }];
    return entries.filter(({ def, isBoss }) => {
      const known = isBoss ? bossDefeated : Boolean(state.bestiary[def.id]);
      if (filter === "boss") return isBoss;
      if (filter === "unknown") return !known && !isBoss;
      if (filter === "defeated") return known && !isBoss;
      return true;
    }).map(({ def, floor, isBoss }) => {
      const known = isBoss ? bossDefeated : Boolean(state.bestiary[def.id]);
      if (!known) {
        return `
          <article class="bestiary-card unknown${isBoss ? " boss" : ""}">
            <span class="bestiary-icon">${iconHtml(def.icon, 44)}</span>
            <b class="bestiary-name">???</b>
            <p class="bestiary-desc">${isBoss ? "Хозяин этажа. Имя откроется после победы." : "Вы еще не встречали это существо"}</p>
            <span class="hint">Этаж ${floor.id}</span>
          </article>`;
      }
      const kills = killsOf(def.id);
      const revealLore = kills >= REVEAL_KILLS;
      const drops = Array.isArray(def.drops) ? def.drops : [];
      const dropsText = drops.map(dropName).join(", ") || "—";
      return `
        <article class="bestiary-card${isBoss ? " boss" : ""}">
          <span class="bestiary-icon">${iconHtml(def.icon, 44)}</span>
          <b class="bestiary-name">${def.name}${isBoss ? " 👑" : ""}</b>
          <p class="bestiary-desc">${def.desc || ""}</p>
          <div class="bestiary-chips">
            <span class="mob-stat-chip hp">❤ ${def.hp}</span>
            <span class="mob-stat-chip atk">⚔ ${def.atk}</span>
            <span class="mob-stat-chip def">🛡 ${def.def}</span>
          </div>
          <div class="bestiary-lore hint" style="margin-top: 6px; line-height: 1.5;${revealLore ? "" : " opacity: 0.7;"}">
            <b style="color: var(--gold);">Убито: ${kills} раз</b>${revealLore ? "" : ` · раскроет тайны на ${REVEAL_KILLS}-й победе`}
          </div>
          ${revealLore ? `
            <div class="bestiary-lore hint" style="margin-top: 4px; line-height: 1.5;">
              <span style="color: var(--gold2);">Дроп:</span> ${dropsText}
            </div>` : ""}
          <span class="hint">Этаж ${floor.id}</span>
        </article>`;
    });
  }).join("");

  const filterBtn = (id, label) => `
    <button class="shop-tab${filter === id ? " active" : ""}" data-act="bestiary-filter" data-filter="${id}" type="button">${label}</button>
  `;

  const total = FLOORS.reduce((n, f) => n + f.mobs.length + 1, 0);
  const knownCount = FLOORS.reduce((n, f) => n + f.mobs.filter((m) => state.bestiary[m.id]).length + (state.cleared[f.id] ? 1 : 0), 0);

  return `
    <div class="doll-menu-backdrop" data-act="bestiary-close"></div>
    <div class="doll-menu quest-modal" role="dialog">
      <div class="doll-menu-head">
        <h3>📖 Бестиарий (${knownCount}/${total})</h3>
        <button class="doll-menu-close" data-act="bestiary-close" type="button">✕</button>
      </div>
      <p class="hint" style="margin: 0 0 12px;">Обычные существа открываются при первой встрече в бою; имя босса — после победы над ним. Пять побед над одним врагом раскрывают его слабость и дроп.</p>
      <div class="shop-tabs" style="margin-bottom: 12px;">
        ${filterBtn("all", "Все")}
        ${filterBtn("defeated", "Побежденные")}
        ${filterBtn("unknown", "Неизвестные")}
        ${filterBtn("boss", "Боссы")}
      </div>
      <div class="bestiary-grid">${cards}</div>
    </div>
  `;
}

function npcQuestHtml(npcId) {
  ensureWeekQuests();
  const q = state.weekQuests.list.find((x) => x.npc === npcId);
  const npcName = NPC_NAMES[npcId] || npcId;
  if (!q) return `<p class="empty">На этой неделе у меня для вас ничего нет.</p>`;

  let title, subjectIcon, countText, pct;
  if (q.type === "kill") {
    title = `Убить: ${q.mobName}`;
    subjectIcon = q.mobIcon;
    pct = Math.round((q.progress / q.target) * 100);
    countText = `${q.progress} / ${q.target}`;
  } else {
    const res = ALL_RESOURCES.find((r) => r.id === q.resId);
    if (!res) return `<p class="empty">На этой неделе у меня для вас ничего нет.</p>`;
    title = `Собрать: ${res.name}`;
    subjectIcon = res.icon;
    pct = Math.round((q.progress / q.target) * 100);
    countText = `${q.progress} / ${q.target}`;
  }

  let button;
  if (q.status === "offered") button = `<button class="btn small primary" data-act="accept-week-quest" data-npc="${npcId}" type="button" style="white-space: nowrap;">Взять задание</button>`;
  else if (q.status === "active") button = `<button class="btn small" disabled type="button" style="white-space: nowrap;">В работе</button>`;
  else if (q.status === "done") button = `<button class="btn small primary" data-act="claim-npc-quest" data-id="${q.id}" type="button" style="white-space: nowrap;">Сдать</button>`;
  else button = `<button class="btn small" disabled type="button" style="white-space: nowrap;">Получено</button>`;

  const statusBadge = q.status === "claimed"
    ? `<span class="badge" style="border-color: var(--line2); color: var(--dim);">Получено</span>`
    : q.status === "done"
      ? `<span class="badge" style="border-color: var(--gold); color: var(--gold);">Готово</span>`
      : q.status === "active"
        ? `<span class="badge">В работе</span>`
        : `<span class="badge">Предложение недели</span>`;

  return `
    <section class="shop-group" style="width: 100%; max-width: 100%;">
      <article class="quest-card quest-card-wide${q.status === "claimed" ? " claimed" : q.status === "done" ? " done" : ""}" style="display: flex; flex-wrap: wrap; width: 100%; align-items: center; gap: 16px;">
        
        <div class="quest-icon-wrap" style="flex-shrink: 0;">
          <span class="quest-icon">${iconHtml(subjectIcon, 32)}</span>
        </div>
        
        <div style="flex: 1 1 200px; min-width: 0; display: flex; flex-direction: column; gap: 8px;">
          <div class="quest-title" style="display: flex; flex-wrap: wrap; gap: 4px 12px; align-items: baseline;">
            <h3 style="margin: 0; font-size: 15px;">${title}</h3>
            <span class="hint" style="white-space: nowrap; font-size: 12px;">Дал: <b>${esc(npcName)}</b></span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
            <div class="bar" style="flex: 1; height: 8px; margin: 0;">
              <span style="width:${pct}%"></span>
            </div>
            <span class="quest-count" style="font-size: 11px; white-space: nowrap;">${countText}</span>
          </div>
        </div>

        <div style="flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; margin-left: auto;">
          <span class="price" style="font-size: 13px; white-space: nowrap;">💰 ${q.gold} · ✦ ${q.xp}${q.potions > 0 ? ` · 🧪 +${q.potions}` : ""}</span>
          ${statusBadge}
          ${button}
        </div>

      </article>
    </section>
  `;
}

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

function storyQuestPanelHtml(npcId) {
  const npcName = NPC_NAMES[npcId] || npcId;
  const wrap = (inner) => `<section class="shop-group" style="width: 100%; max-width: 100%;">${inner}</section>`;

  const def = availableStoryQuestForNpc(npcId);
  const entry = activeStoryQuestForNpc(npcId);

  // Уже выполнено: карточка с финальным статусом.
  const completed = STORY_QUESTS.filter((q) => q.npc === npcId && state.completedStoryQuests.includes(q.id));
  if (!def && !entry) {
    if (completed.length) {
      return wrap(`<article class="quest-card quest-card-wide claimed">
        <div class="quest-body"><div class="quest-info">
          <div class="quest-title" style="display:flex; flex-wrap:wrap; gap:4px 8px; align-items:baseline;">
            <h3 style="margin:0;">📖 ${esc(completed[0].title)}</h3>
            <span class="hint">Дал: <b>${esc(npcName)}</b></span>
          </div>
        </div></div>
        <div class="quest-side" style="min-width:160px;">
          <span class="badge" style="border-color: var(--line2); color: var(--dim);">Выполнено</span>
        </div>
      </article>`);
    }
    return wrap(`<p class="empty">Сюжетных заданий у меня для вас нет.</p>`);
  }

  // Доступно новое задание.
  if (def) {
    return wrap(`<article class="quest-card quest-card-wide">
      <div class="quest-body">
        <div class="quest-info">
          <div class="quest-title" style="display:flex; flex-wrap:wrap; gap:4px 8px; align-items:baseline;">
            <h3 style="margin:0;">📖 ${esc(def.title)}</h3>
            <span class="hint">Дает: <b>${esc(npcName)}</b></span>
          </div>
          <p class="item-desc">${esc(def.text)}</p>
          <div class="chips">
            <span class="chip">${storyQuestObjectivesText(def)}</span>
            <span class="chip">Награда: ${storyQuestRewardText(def)}</span>
          </div>
        </div>
      </div>
      <div class="quest-side" style="min-width:140px;">
        <button class="btn small primary" data-act="accept-story-quest" data-id="${def.id}" type="button" style="white-space: nowrap;">Взять задание</button>
      </div>
    </article>`);
  }

  // Задание в работе (возможно, готово к сдаче).
  const qdef = STORY_QUEST_MAP[entry.id];
  const { progress, target } = storyQuestProgress(entry);
  const pct = Math.round((progress / target) * 100);
  const done = progress >= target;
  const button = done
    ? `<button class="btn small primary" data-act="claim-story-quest" data-id="${entry.id}" type="button" style="white-space: nowrap;">Сдать</button>`
    : `<button class="btn small" disabled type="button" style="white-space: nowrap;">В работе</button>`;
  return wrap(`<article class="quest-card quest-card-wide${done ? " done" : ""}">
    <div class="quest-body">
      <div class="quest-info">
        <div class="quest-title" style="display:flex; flex-wrap:wrap; gap:4px 8px; align-items:baseline;">
          <h3 style="margin:0;">📖 ${esc(qdef.title)}</h3>
          <span class="hint">Дал: <b>${esc(npcName)}</b></span>
        </div>
        <div style="display:flex; align-items:center; gap:10px; width:100%;">
          <div class="bar" style="flex:1; height:8px; margin:0;"><span style="width:${pct}%"></span></div>
          <span class="quest-count" style="font-size:12px; white-space:nowrap;">${progress} / ${target}</span>
        </div>
      </div>
    </div>
    <div class="quest-side" style="min-width:140px;">
      <span class="price">${storyQuestRewardText(qdef)}</span>
      ${button}
    </div>
  </article>`);
}

// группы слотов для верхней панели фильтров магазина (Этап 8)
const SHOP_SLOT_GROUPS = [
  { id: "weapon", name: "Оружие", slots: ["mainhand", "offhand"] },
  { id: "armor", name: "Броня", slots: ["head", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet"] },
  { id: "jewelry", name: "Украшения", slots: ["neck", "ring", "trinket"] },
];

function shopItemsHtml(tabs, activeId, shopName) {
  const activeTab = tabs.find((t) => t.id === activeId) || tabs[0];

  const slotFilter = view.shopFilterSlot || "all";
  const typeFilter = view.shopFilterType || "all";

  // Ассортимент магазина целиком (все вкладки): первая строка фильтров
  // общая, поэтому выбранная группа слотов работает с любой вкладки.
  const shopSlots = new Set(tabs.flatMap((t) => t.slots));
  const shopItems = Object.values(ITEMS).filter((i) => shopSlots.has(i.slot) && i.price > 0 && shopFloorFor(i) <= state.maxFloor);

  // Группа «Украшения» — только в ювелирной лавке, в Кузнице её нет.
  const slotGroups = shopName === "jewelry"
    ? SHOP_SLOT_GROUPS
    : SHOP_SLOT_GROUPS.filter((g) => g.id !== "jewelry");

  // Верхняя панель: группы слотов, по которым вообще есть товар.
  const presentGroups = slotGroups.filter((g) => g.slots.some((s) => shopSlots.has(s) && shopItems.some((i) => i.slot === s)));
  const filtersHtml = `
    <div class="shop-filters">
      <button class="shop-filter-btn${slotFilter === "all" ? " active" : ""}" data-act="shop-filter-slot" data-slot="all" type="button">Все</button>
      ${presentGroups.map((g) =>
        `<button class="shop-filter-btn${slotFilter === g.id ? " active" : ""}" data-act="shop-filter-slot" data-slot="${g.id}" type="button">${g.name}</button>`
      ).join("")}
    </div>
  `;

  // Слот-препикат: выбранная группа перекрывает текущую вкладку,
  // «Все» показывает ассортимент активной вкладки (как раньше).
  const group = slotGroups.find((g) => g.id === slotFilter);
  const candidates = group ? shopItems.filter((i) => group.slots.includes(i.slot)) : shopItems.filter((i) => activeTab.slots.includes(i.slot));

  // Вторая строка (только для Оружия): 1H / 2H.
  const typeBtn = (id, label) =>
    `<button class="shop-filter-btn${typeFilter === id ? " active" : ""}" data-act="shop-filter-type" data-type="${id}" type="button">${label}</button>`;
  const handedSet = new Set(candidates.filter((i) => i.handed).map((i) => i.handed));
  const handedButtons = ["1h", "2h"].filter((h) => handedSet.has(h)).map((h) => typeBtn(h, h.toUpperCase()));
  const subHtml = slotFilter === "weapon" && handedButtons.length
    ? `<div class="shop-filters shop-filter-sub">
         <button class="shop-filter-btn${typeFilter === "all" ? " active" : ""}" data-act="shop-filter-type" data-type="all" type="button">Все</button>
         ${handedButtons.join("")}
       </div>`
    : "";

  const typeOk = (item) => {
    if (typeFilter === "all") return true;
    return item.handed === typeFilter;
  };

  // Вторая строка для Брони: фильтр по типу брони.
  const armorFilter = view.shopFilterArmor || null;
  const armorBtn = (id, label) =>
    `<button class="shop-filter-btn${(armorFilter || "all") === id ? " active" : ""}" data-act="shop-filter-armor" data-armor="${id}" type="button">${label}</button>`;
  const armorRowHtml = slotFilter === "armor"
    ? `<div class="shop-filters shop-filter-sub">
         ${armorBtn("all", "Все")}
         ${["cloth", "leather", "chain", "plate"].map((a) => armorBtn(a, ARMOR_TYPE_NAMES[a])).join("")}
       </div>`
    : "";

  // Третья строка (только для Оружия): сортировка по типу урона. Активный стиль
  // оставляет только оружие с уроном этого типа и сортирует его по убыванию.
  const styleFilter = view.shopFilterStyle || null;
  const styleRowHtml = slotFilter === "weapon"
    ? `<div class="shop-filters shop-filter-sub">
         ${STYLE_ORDER.map((st) =>
           `<button class="shop-filter-btn${styleFilter === st ? " active" : ""}" data-act="shop-filter-style" data-style="${st}" type="button">${STYLE_NAMES[st] || st}</button>`
         ).join("")}
       </div>`
    : "";
  let effective = candidates;
  if (slotFilter === "armor" && armorFilter) {
    effective = effective.filter((i) => i.armorType === armorFilter);
  }
  if (styleFilter) {
    effective = effective
      .filter((i) => (i.damage?.[styleFilter] || 0) > 0)
      .sort((a, b) => (b.damage[styleFilter] || 0) - (a.damage[styleFilter] || 0));
  }

  // Рендер: горизонтальные карточки (иконка | текст и статы | кнопка покупки).
  // Слоты рендерим по объёму фильтра: выбранная группа — по её слотам,
  // иначе по активной вкладке.
  const renderSlots = group ? group.slots : activeTab.slots;
  const sections = renderSlots.map((slot) => {
    const items = effective.filter((i) => i.slot === slot && typeOk(i));
    if (!items.length) return "";
    const rows = items.map((item) => {
      const copies = copiesOf(item.id);
      const equippedInfo = equippedUidOf(item.id);
      const p = priceFor(item, shopName);
      const canBuy = state.gold >= p.price;

      let label = `Купить · ${p.price} 💰`;
      if (!canBuy) label = `Нужно ${p.price} 💰`;

      const countChip = copies.length ? `<span class="chip ok">В сумке: ${copies.length}</span>` : "";
      const equippedChip = equippedInfo ? `<span class="chip ok">Надето: ${SLOT_NAME[equippedInfo.slot] || equippedInfo.slot}</span>` : "";
      const durChips = copies.map((inst) => durabilityChip(inst)).join("");
      const shopTooltip = itemTooltipHtml(item);
      const rowTitle = shopTooltip ? ` data-tooltip="${esc(shopTooltip)}"` : "";

      return `<article class="gear-row${copies.length ? " owned" : ""}${item.rarity && item.rarity !== "common" && RARITY_TIERS[item.rarity] ? ` rarity-${item.rarity}` : ""}"${rowTitle}>
        <div class="gear-row-icon">${iconHtml(item.icon, 34)}</div>
        <div class="gear-row-main">
          <h3>${item.name}</h3>
          <p class="item-desc">${item.desc}</p>
          <div class="chips">${statsChips(item)}${countChip}${equippedChip}${durChips}</div>
        </div>
        <div class="gear-row-side">
          <button class="btn small" data-act="buy" data-id="${item.id}" data-shop="${shopName}" ${canBuy ? "" : "disabled"} type="button">${label}</button>
        </div>
      </article>`;
    }).join("");
    return `<section class="shop-group"><h2 class="group-title">${SLOT_ICON[slot] || ""} ${SLOT_NAME[slot]}</h2><div class="gear-rows">${rows}</div></section>`;
  }).join("");

  // Панель фильтров — одна, над всеми секциями слотов (и она не исчезает
  // при пустом результате, иначе из фильтра не выбраться).
  const panel = `<section class="shop-group">${filtersHtml}${subHtml}${armorRowHtml}${styleRowHtml}</section>`;
  return panel + (sections || `<section class="shop-group"><p class="empty">Под этот фильтр товаров нет.</p></section>`);
}

function materialChipHtml(resId, need) {
  const res = ALL_RESOURCES.find((r) => r.id === resId);
  const have = state.resources[resId] || 0;
  const enough = have >= need;
  return `<span class="chip material${enough ? " ok" : " lack"}">${iconHtml(res ? res.icon : "❔", 16)} ${res ? res.name : resId} ${have}/${need}</span>`;
}

// ── Панель улучшения предметов (Этап 2) ────────────────────────────────────
// Кузница (ron): ветки weapon + armor. Ювелирная лавка (elize): jewelry,
// выбор стата «Крит» или «Уворот». У Алхимика (elain) наковальни нет — заглушка.
function upgradePanelHtml() {
  if (view.screen === "alchemy") {
    // Улучшение зелий (Этап 9): доступ открывается на тире «Уважаемый»
    // фракции алхимиков, сам механизм пока в разработке.
    const faction = FACTION_MAP["alchemists"];
    const rep = state.reputation ? (state.reputation["alchemists"] || 0) : 0;
    const unlocked = rep >= FACTION_TIERS[2].min;
    return `<section class="shop-group"><h2 class="group-title">⚗️ Улучшение зелий</h2>${
      unlocked
        ? `<p class="settings-stub">В разработке. Скоро здесь можно будет улучшать зелья</p>`
        : `<p class="settings-stub">🔒 Требуется репутация «Уважаемый» (${FACTION_TIERS[2].min} заказов) у ${faction ? faction.name : "Цеха алхимиков"}. Сейчас: ${rep}</p>`
    }</section>`;
  }

  const pathIds = view.screen === "forge" ? ["weapon", "armor"] : ["jewelry"];
  const pathBlocks = pathIds.map((pathId) => {
    const path = UPGRADE_PATHS[pathId];
    const factionId = UPGRADE_FACTION[pathId];
    const faction = FACTION_MAP[factionId];
    const unlocked = typeof canUpgradeItems === "function" ? canUpgradeItems(factionId) : false;
    const rep = state.reputation[factionId] || 0;

    const cards = state.owned.filter((inst) => inst && upgradePathForItem(ITEMS[inst.id])?.id === pathId).map((inst) => {
      const item = ITEMS[inst.id];
      const up = inst.upgrade || { level: 0, stat: null };
      const maxed = up.level >= UPGRADE_MAX_LEVEL;
      const step = up.level;
      const goldCost = UPGRADE_GOLD_COST[step];
      const chipsHtml = up.level > 0
        ? (path.id === "jewelry" && up.stat === "dodge" ? { dodge: UPGRADE_PER_LEVEL.jewelry.dodge } : UPGRADE_PER_LEVEL[path.id])
        : null;
      const gainChip = chipsHtml ? Object.entries(chipsHtml).map(([k, v]) => `<span class="chip ok">${UPGR_STAT_LABEL[k] || k} +${v * up.level}</span>`).join("") : "";      const nextHtml = maxed
        ? `<span class="chip">Максимум +${UPGRADE_MAX_LEVEL}</span>`
        : `<div class="chips recipe-materials">${materialChipHtmlEx(path.materials[step])}<span class="chip${state.gold >= goldCost ? " ok" : " lack"}">💰 ${goldCost}</span></div>`;
      const statChoice = path.id === "jewelry"
        ? `<div class="stack-buttons">
             ${["crit", "dodge"].map((s) => `<button class="btn small${s === "crit" ? " primary" : ""}" data-act="upgrade-item" data-uid="${inst.uid}" data-stat="${s}" type="button" ${(unlocked && !maxed) ? "" : "disabled"}>${UPGR_STAT_LABEL[s]} +${UPGRADE_PER_LEVEL.jewelry[s]}%/ур</button>`).join("")}
           </div>`
        : `<button class="btn small primary" data-act="upgrade-item" data-uid="${inst.uid}" type="button" ${unlocked && !maxed ? "" : "disabled"}>Улучшить${maxed ? " — максимум" : ""}</button>`;
      return `<article class="gear-card upgrade-card">
        <div class="gear-card-head">
          <div class="item-icon">${iconHtml(item.icon, 48)}</div>
          <div class="gear-card-info">
            <h3>${item.name}${up.level > 0 ? ` <em class="up-level">+${up.level}</em>` : ""}</h3>
            <p class="item-desc">${item.desc}</p>
            <div class="chips">${statsChips(item)}${gainChip}</div>
            ${nextHtml}
          </div>
        </div>
        <div class="gear-card-foot">${statChoice}</div>
      </article>`;
    }).join("");

    return `<section class="shop-group">
      <h2 class="group-title">${path.icon} ${path.name}${unlocked ? "" : ` <span class="hint">🔒 ${FACTION_MAP[factionId]?.npc ? NPC_NAMES[FACTION_MAP[factionId].npc] : faction.name}: нужен уровень «${NPC_AFFINITY_TIERS[2].name}» (${NPC_AFFINITY_TIERS[2].min} отношения)</span>`}</h2>
      <p class="hint">За каждый уровень улучшения: ${path.id === "weapon" ? "Атака +5" : path.id === "armor" ? "Защита +2" : "Крит +2 или Уворот +1 (на выбор)"}. Материалы — из походов на нижние этажи Башни.</p>
      <div class="item-grid">${cards || `<p class="empty">Подходящих предметов нет.</p>`}</div>
    </section>`;
  }).join("");

  return pathBlocks;
}

// Материальные чипы для произвольной карты материалов { resId: need }.
function materialChipHtmlEx(materials) {
  return Object.entries(materials).map(([resId, need]) => materialChipHtml(resId, need)).join("");
}

function craftPanelHtml(station) {
  const known = new Set(Array.isArray(state.knownRecipes) ? state.knownRecipes : []);
  const recipes = getRecipes(station).filter((recipe) => known.has(recipe.id));

  if (!recipes.length) {
    return `<section class="shop-group"><h2 class="group-title">📜 Крафт</h2><p class="empty">Вы ещё не нашли ни одного рецепта. Побеждайте мобов и боссов Башни — с них выпадают чертежи.</p></section>`;
  }

  const cards = recipes.map((recipe) => {
    const item = ITEMS[recipe.result];
    const copies = copiesOf(recipe.result);
    const enough = Object.entries(recipe.materials).every(([resId, need]) => (state.resources[resId] || 0) >= need);
    const chips = Object.entries(recipe.materials).map(([resId, need]) => materialChipHtml(resId, need)).join("");
    const countChip = copies.length ? `<span class="chip ok">В сумке: ${copies.length}</span>` : "";
    const durChips = copies.map((inst) => durabilityChip(inst)).join("");
    return `<article class="gear-card recipe-card${copies.length ? " owned" : ""}">
      <div class="gear-card-head">
        <div class="item-icon">${iconHtml(item ? item.icon : "❔", 48)}</div>
        <div class="gear-card-info">
          <h3>${recipe.desc}</h3>
          <p class="item-desc">${item ? item.desc : ""}</p>
          <div class="chips">${item ? statsChips(item) : ""}${countChip}${durChips}</div>
          <div class="chips recipe-materials">${chips}</div>
        </div>
      </div>
      <div class="gear-card-foot">
        <span class="price">📜 Рецепт</span>
        <button class="btn small${enough ? " primary" : ""}" data-act="craft" data-id="${recipe.id}" ${enough ? "" : "disabled"} type="button">Создать</button>
      </div>
    </article>`;
  }).join("");

  return `<section class="shop-group"><h2 class="group-title">📜 Крафт</h2><p class="hint">Крафт не требует золота — только материалы из походов. Каждый крафт создаёт новый экземпляр предмета со своей прочностью.</p><div class="item-grid">${cards}</div></section>`;
}

function forgeHtml() {
  const interactionPage = shopInteractionPageHtml("ron", "forge");
  if (interactionPage) return interactionPage;
  const tab = view.shopTab || "buy";
  const content =
    tab === "sell" ? sellPanelHtml("forge")
    : tab === "quests" ? npcQuestHtml("ron")
    : tab === "exchange" ? exchangePanelHtml()
    : tab === "craft" ? craftPanelHtml("forge")
    : tab === "upgrade" ? upgradePanelHtml()
    : tab === "buy" ? shopItemsHtml(
        [{ id: "held", name: "Оружие и доспехи", slots: ["mainhand", "offhand", "head", "neck", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet"] }],
        "held", "forge")
    : "";

  return `<div class="screen-bg" style="background-image: url('assets/backgrounds/forge.webp');"><div class="bg-overlay"></div></div>
    ${subHeader("Кузница", "Оружие и броня", "market", "← Назад")}
    ${npcDialogueBar("ron", "Купить", "Хочу продать")}
    ${content}
  `;
}

function jewelryHtml() {
  const interactionPage = shopInteractionPageHtml("elize", "jewelry");
  if (interactionPage) return interactionPage;
  const tab = view.shopTab || "buy";
  const content =
    tab === "sell" ? sellPanelHtml("jewelry")
    : tab === "quests" ? npcQuestHtml("elize")
    : tab === "craft" ? craftPanelHtml("jewelry")
    : tab === "upgrade" ? upgradePanelHtml()
    : tab === "buy" ? shopItemsHtml([{ id: "jewelry", name: "Украшения", slots: ["neck", "ring", "trinket"] }], "jewelry", "jewelry")
    : "";

  return `
    <div class="screen-bg" style="background-image: url('assets/backgrounds/jewelry.webp');"><div class="bg-overlay"></div></div>
    ${subHeader("Ювелирная лавка", "Тонкая работа", "market", "← Назад")}
    ${npcDialogueBar("elize", "Купить", "Хочу продать")}
    ${content}
  `;
}

function alchemyHtml() {
  const interactionPage = shopInteractionPageHtml("elain", "alchemy");
  if (interactionPage) return interactionPage;
  const tab = view.shopTab || "buy";
  let content = "";
  
  if (tab === "sell") {
    content = sellPanelHtml("alchemy");
  } else if (tab === "quests") {
    content = npcQuestHtml("elain");
  } else if (tab === "craft") {
    content = craftPanelHtml("alchemy");
  } else if (tab === "upgrade") {
    content = upgradePanelHtml();
  } else if (tab === "buy") {
    const filter = view.alchemyFilter || "all";
    const allPotions = Object.values(ITEMS).filter((i) => i.slot === "potion");
    const items = allPotions.filter((item) => {
      if (filter === "heal") return item.effect === "hp";
      if (filter === "mana") return item.effect === "mana";
      if (filter === "combat") return item.type === "combat";
      return true;
    });
    const filters = `<div class="shop-filters">
      <button class="shop-tab ${view.alchemyFilter === "all" ? "active" : ""}" data-act="alchemy-filter" data-filter="all" type="button">Все</button>
      <button class="shop-tab ${view.alchemyFilter === "heal" ? "active" : ""}" data-act="alchemy-filter" data-filter="heal" type="button">Лечение</button>
      <button class="shop-tab ${view.alchemyFilter === "mana" ? "active" : ""}" data-act="alchemy-filter" data-filter="mana" type="button">Мана</button>
      <button class="shop-tab ${view.alchemyFilter === "combat" ? "active" : ""}" data-act="alchemy-filter" data-filter="combat" type="button">Боевые</button>
    </div>`;
    const rows = items.map((item) => {
      const count = state.potions[item.id] || 0;
      const p = priceFor(item, "alchemy");
      return `<article class="gear-row${count > 0 ? " owned" : ""}">
        <div class="gear-row-icon">${iconHtml(item.icon, 34)}</div>
        <div class="gear-row-main">
          <h3>${item.name}</h3>
          <p class="item-desc">${item.desc}</p>
          <div class="chips"><span class="chip">В сумке: ${count}</span></div>
        </div>
        <div class="gear-row-side">
          <button class="btn small" data-act="buy-item" data-id="${item.id}" data-shop="alchemy" ${state.gold < p.price ? "disabled" : ""} type="button">Купить · ${p.price} 💰</button>
        </div>
      </article>`;
    }).join("");
    content = `<section class="shop-group">${filters}<div class="gear-rows">${rows || `<p class="empty">Под этот фильтр товаров нет.</p>`}</div></section>`;
  } else {
    content = `<div class="empty" style="padding: 40px 20px; text-align: center; font-style: italic;">Выберите действие в диалоге с Элейн.</div>`;
  }

  return `
    <div class="screen-bg" style="background-image: url('assets/backgrounds/alchemy.webp');"><div class="bg-overlay"></div></div>
    ${subHeader("Лавка Алхимика", "Зелья и настои", "market", "← Назад")}
    ${npcDialogueBar("elain", "Купить", "Хочу продать")}
    ${content}
  `;
}

const DOLL_LEFT = ["head", "neck", "shoulder", "back", "chest", "wrist", "hands", "waist"];
const DOLL_RIGHT = ["legs", "feet", "ring1", "ring2", "trinket1", "trinket2", "mainhand", "offhand"];

function dollSlotHtml(slotId, readOnly = false) {
  const slot = SLOTS.find((s) => s.id === slotId); if (!slot) return "";
  const eq = getEquippedItem(slotId);
  const item = eq ? eq.item : null;
  const open = !readOnly && view.dollSlot === slotId;
  const broken = eq && isBroken(eq);
  const rarityClass = eq && eq.rarity !== "common" ? ` rarity-${eq.rarity}` : "";

  // Подсказка слота: имя, статы, сет и его активные/следующие бонусы.
  const tooltip = item
    ? itemTooltipHtml(item, eq)
    : `<div class="tt-title">${esc(slot.name)}</div><div class="tt-negative">Пусто</div>`;
  const tooltipAttr = `data-tooltip="${esc(tooltip)}"`;

  // Только картинка предмета: эмодзи-заглушки в слотах больше не выводим.
  const iconSrc = item ? resolveIcon(item.icon) : "";
  const icon = iconSrc.startsWith("assets/")
    ? `<img class="slot-img" src="${iconSrc}" alt="${esc(item.name)}" onerror="this.remove()">`
    : "";

  const actionAttr = readOnly ? "disabled" : `data-act="doll-slot" data-slot="${slot.id}"`;
  return `<div class="doll-slot-wrapper">
    <span class="slot-label">${esc(slot.name)}</span>
    <button class="doll-slot${item ? " filled" : ""}${open ? " open" : ""}${broken ? " broken" : ""}${rarityClass}" ${actionAttr} type="button" ${tooltipAttr}>${icon}</button>
  </div>`;
}
function paperDollHtml(readOnly = false) {
  const left = DOLL_LEFT.map((slotId) => dollSlotHtml(slotId, readOnly)).join("");
  const right = DOLL_RIGHT.map((slotId) => dollSlotHtml(slotId, readOnly)).join("");
  const count = Object.values(state.equipped).filter(Boolean).length;
  const actions = readOnly ? "" : `<div class="doll-actions"><button class="btn small primary" data-act="talents-open" type="button">🌟 Таланты</button><button class="btn small ghost" data-act="abilities-open" type="button">🌟 Умения</button><button class="btn small ghost" data-act="title-open" type="button">👑 Сменить титул</button><button class="btn small ghost" data-act="achievements-open" type="button">🏆 Достижения</button></div>`;
  return `<div class="paper-doll"><div class="doll-col doll-left">${left}</div><div class="doll-center"><div class="doll-figure"><img src="${portraitSrc(state.portrait)}" alt=""></div><div class="doll-name"><b>${esc(state.name)}</b>${state.currentTitle ? `<span class="hero-title">${esc(state.currentTitle)}</span>` : ""}<span>УР ${state.level} · надето ${count} / ${SLOTS.length}</span>${actions}</div></div><div class="doll-col doll-right">${right}</div></div>`;
}

// Полная кукла для центральной колонки торговли: все 16 слотов, но без
// кнопок талантов/титулов и с отключёнными слотами (только просмотр).
function tradeDollHtml() {
  return `<div class="trade-doll">${paperDollHtml(true)}</div>`;
}

function dollMenuHtml() {
  if (!view.dollSlot) return "";
  const slot = SLOTS.find((s) => s.id === view.dollSlot); if (!slot) return "";
  const items = state.owned
    .filter((inst) => ITEMS[inst.id] && canEquipInSlot(ITEMS[inst.id], slot.id))
    .sort((a, b) => itemScore(ITEMS[b.id], slot.id, b) - itemScore(ITEMS[a.id], slot.id, a));
  const current = getEquippedItem(slot.id);
  const offhandNote = state.archetype === "assassin" && slot.id === "offhand"
    ? `<p class="hint doll-menu-hint">Оружие в левой руке даёт 50% урона.</p>`
    : "";
  const rows = items.map((inst) => {
    const item = ITEMS[inst.id];
    const equippedAt = Object.keys(state.equipped).find((s) => state.equipped[s] === inst.uid);
    const isEquipped = equippedAt === slot.id;
    return `<button class="doll-item${isEquipped ? " equipped" : ""}${rarityClass(inst)}" data-act="doll-equip" data-uid="${inst.uid}" data-slot="${slot.id}" type="button"><span class="item-icon">${iconHtml(item.icon, 32)}</span><span class="doll-item-body"><span class="doll-item-name">${getItemDisplayName(inst)}</span><span class="chips">${statsChips(item, inst)}</span>${isEquipped ? `<span class="doll-item-status">✓ Надето</span>` : ""}</span></button>`;
  }).join("");
  return `<div class="doll-menu-backdrop" data-act="doll-close"></div><div class="doll-menu" role="dialog"><div class="doll-menu-head"><h3>${slot.name}</h3><button class="doll-menu-close" data-act="doll-close" type="button">✕</button></div>${offhandNote}<div class="doll-menu-list">${rows}</div>${current ? `<div class="doll-menu-foot"><button class="btn small ghost" data-act="doll-unequip" data-slot="${slot.id}" type="button">Снять «${getItemDisplayName(current)}»</button></div>` : ""}</div>`;
}

function invMenuHtml() {
  if (!view.invItemUid) return "";
  const inst = getInstance(view.invItemUid);
  if (!inst || isEquipped(inst.uid)) return "";
  const item = ITEMS[inst.id]; if (!item) return "";
  const slots = slotsForItem(item);
  const canEquip = slots.length > 0;
  const tier = RARITY_TIERS[inst.rarity] || RARITY_TIERS.common;
  const slotNote = canEquip
    ? `<p class="hint">Слоты: ${slots.map((s) => SLOT_NAME[s] || s).join(", ")}.</p>`
    : `<p class="hint">Для этого предмета нет слота.</p>`;
  const salvageable = item.slot !== "potion" && RECIPES.some((r) => r.result === inst.id);
  return `<div class="doll-menu-backdrop" data-act="inv-menu-close"></div><div class="doll-menu" role="dialog"><div class="doll-menu-head"><h3>Предмет</h3><button class="doll-menu-close" data-act="inv-menu-close" type="button">✕</button></div><div class="inv-menu-preview">${iconHtml(item.icon, 40)}<span class="inv-menu-info"><b>${getItemDisplayName(inst)}</b><span class="chips"><span class="chip" style="border-color:${tier.color};color:${tier.color};">${tier.name}</span>${statsChips(item, inst)}</span><span class="hint">${item.desc}</span></span></div>${slotNote}<div class="inv-menu-actions"><button class="btn small" data-act="inv-equip" data-uid="${inst.uid}" ${canEquip ? "" : "disabled"} type="button">Надеть</button><button class="btn small ghost" data-act="inv-salvage" data-uid="${inst.uid}" ${salvageable ? "" : "disabled"} title="${salvageable ? "Разобрать: вернуть половину материалов рецепта" : "Нет рецепта — разобрать нельзя"}" type="button">🔨 Разобрать</button></div></div>`;
}

// ── Обмен ресурсов (Этап 3): 50 ресурсов 1-го этажа → 1 редкий ─────────────
function exchangePanelHtml() {
  const tRes = ALL_RESOURCES.find((r) => r.id === EXCHANGE_TARGET_RES);
  const rows = (FLOOR_RESOURCES[1] || []).map((res) => {
    const have = state.resources[res.id] || 0;
    const ok = have >= EXCHANGE_AMOUNT;
    return `<div class="resource-row"><span>${iconHtml(res.icon, 24)} <b>${res.name}</b> <span class="chip">×${have}</span></span>
      <button class="btn small primary" data-act="exchange-res" data-id="${res.id}" ${ok ? "" : "disabled"} type="button">Обменять ${EXCHANGE_AMOUNT} → 1 ${tRes ? tRes.name : EXCHANGE_TARGET_RES}</button></div>`;
  }).join("");
  return `<section class="shop-group">
    <h2 class="group-title">🔁 Обмен</h2>
    <p class="hint">Хлам с первого этажа годится только в переплавку: ${EXCHANGE_AMOUNT} единиц любого ресурса — и Рон отдаст ${tRes ? tRes.name.toLowerCase() : "редкий ресурс"} ×1.</p>
    <div class="resource-list">${rows}</div>
  </section>`;
}

function buybackPanelHtml(shop) {
  if (shop === "alchemy") {
    const potionItems = Object.values(ITEMS).filter((i) => i.type === "potion" && (state.potions[i.id] || 0) > 0);
    const instanced = state.owned.filter((inst) => !isEquipped(inst.uid) && ITEMS[inst.id]?.slot === "potion");

    const potionRows = potionItems.map((item) =>
      `<div class="resource-row"><span>${iconHtml(item.icon, 24)} <b>${item.name}</b> <span class="chip">×${state.potions[item.id]}</span></span><button class="btn small ghost" data-act="sell-potion" data-id="${item.id}" type="button">Продать 1 (+${sellPrice(item)} 💰)</button></div>`
    );

    const instancedRows = instanced.map((inst) => {
      const item = ITEMS[inst.id];
      return `<div class="resource-row${rarityClass(inst)}"><span>${iconHtml(item.icon, 24)} <b>${getItemDisplayName(inst)}</b> ${durabilityChip(inst)}</span><button class="btn small ghost" data-act="sell" data-uid="${inst.uid}" type="button">Продать (+${sellPrice(item, inst)} 💰)</button></div>`;
    });

    const rows = [...potionRows, ...instancedRows];

    return `<section class="shop-group"><h2 class="group-title">🧪 Скупка зелий</h2>${rows.length ? `<div class="resource-list">${rows.join("")}</div>` : `<p class="empty">Нечего продавать.</p>`}</section>`;
  }

  const slots = shop === "jewelry" ? ["neck", "ring", "trinket"] : ["mainhand", "offhand", "head", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet"];
  const rows = state.owned
    .filter((inst) => !isEquipped(inst.uid) && slots.includes(ITEMS[inst.id]?.slot))
    .map((inst) => {
      const item = ITEMS[inst.id];
      return `<div class="resource-row${rarityClass(inst)}"><span>${iconHtml(item.icon, 24)} <b>${getItemDisplayName(inst)}</b> ${durabilityChip(inst)}</span><button class="btn small ghost" data-act="sell" data-uid="${inst.uid}" type="button">Продать (+${sellPrice(item, inst)} 💰)</button></div>`;
    });

  return `<section class="shop-group"><h2 class="group-title">${shop === "jewelry" ? "💍" : "⚔"} Скупка снаряжения</h2>${rows.length ? `<div class="resource-list">${rows.join("")}</div>` : `<p class="empty">Нечего продавать.</p>`}</section>`;
}

function talentsHtml() {
  const points = state.talentPoints || 0;
  const activeTab = view.talentsTab || "war";

  const tabsHtml = `
    <div class="shop-tabs" style="margin-bottom: 20px;">
      ${TALENT_BRANCHES.map(branch => `
        <button class="shop-tab${activeTab === branch.id ? " active" : ""}" data-act="talents-tab" data-tab="${branch.id}" type="button">
          ${branch.name}
        </button>
      `).join("")}
    </div>
  `;

  const branch = TALENT_BRANCHES.find(b => b.id === activeTab) || TALENT_BRANCHES[0];
  
  const branchTalents = TALENTS.filter((t) => t.branch === branch.id);
  const lines = [];
  for (let i = 0; i < branchTalents.length; i += 4) {
    lines.push(branchTalents.slice(i, i + 4));
  }

  const cards = lines.map((lineTalents, lineIndex) => {
    let previousLineMaxed = true;
    if (lineIndex > 0) {
      const prevLine = lines[lineIndex - 1];
      previousLineMaxed = prevLine.every(t => ((state.talents || {})[t.id] || 0) >= t.maxRank);
    }

    return lineTalents.map((t) => {
      const rank = (state.talents || {})[t.id] || 0;
      const maxed = rank >= t.maxRank;
      const canLearn = !maxed && points > 0 && previousLineMaxed;
      const rankHtml = Array.from({ length: t.maxRank }, (_, i) => `<span class="pip${i < rank ? " on" : ""}"></span>`).join("");
      
      const cardClass = maxed ? " claimed" : canLearn ? " done" : "";
      
      let actionButton;
      if (maxed) {
        actionButton = `<button class="btn small" disabled type="button">Изучен</button>`;
      } else if (!previousLineMaxed) {
        actionButton = `<div class="hint" style="text-align: right; line-height: 1.2; font-size: 11px; color: #c2483c;">Раскройте предыдущую линию до максимума</div>`;
      } else {
        actionButton = `<button class="btn small${canLearn ? " primary" : ""}" data-act="learn-talent" data-id="${t.id}" ${canLearn ? "" : "disabled"} type="button">Изучить</button>`;
      }

      return `
        <article class="quest-card talent-card${cardClass}" style="opacity: ${!previousLineMaxed && !maxed ? 0.6 : 1};">
          <div class="quest-head">
            <div class="quest-title">
              <h3>${t.name}</h3>
              <span class="hint">${t.desc}</span>
            </div>
          </div>
          <div class="quest-progress"><div class="rage"><span class="rage-label">Ранг</span>${rankHtml}</div></div>
          <div class="quest-foot">
            <span class="price">${rank}/${t.maxRank}</span>
            ${actionButton}
          </div>
        </article>
      `;
    }).join("");
  }).join("");

  return `
    <div class="banner" style="margin-bottom: 12px;">🌟 Свободных очков таланта: <b>${points}</b> · +1 каждые 3 уровня</div>
    ${tabsHtml}
    <div class="quest-grid" style="grid-template-columns: 1fr; gap: 10px;">${cards}</div>
  `;
}

function achievementsHtml() {
  const unlockedIds = state.unlockedAchievements || [];
  const cards = ACHIEVEMENTS.map((ach) => {
    const unlocked = unlockedIds.includes(ach.id);
    const [have, need] = ach.progress ? ach.progress(state) : [unlocked ? 1 : 0, 1];
    const pct = Math.max(0, Math.min(100, Math.round((have / Math.max(1, need)) * 100)));
    const style = unlocked
      ? "border-color: var(--gold); box-shadow: 0 0 14px rgba(217, 169, 75, 0.18);"
      : "filter: grayscale(1); opacity: 0.8;";
    const titleColor = unlocked ? "var(--gold)" : "inherit";
    const foot = unlocked
      ? `<span class="price" style="color: var(--gold);">✅ Получено</span>`
      : `<span class="price">${esc(String(have))}/${esc(String(need))}</span>`;
    return `
      <article class="quest-card achievement-card" style="${style}">
        <div class="quest-head">
          <div class="quest-title" style="display: flex; gap: 10px; align-items: flex-start;">
            <span style="font-size: 26px; line-height: 1;">${ach.icon}</span>
            <div>
              <h3 style="color: ${titleColor}; margin: 0 0 2px 0;">${ach.name}</h3>
              <span class="hint">${ach.desc}</span>
            </div>
          </div>
        </div>
        ${unlocked ? "" : `
          <div class="quest-progress">${bar("xp", have, need)}</div>
          <div class="hint" style="margin: 4px 0 8px 0;">Прогресс: ${pct}%</div>`}
        <div class="quest-foot">${foot}</div>
      </article>
    `;
  }).join("");

  return `
    <div class="banner" style="margin-bottom: 12px;">🏆 Открыто достижений: <b>${unlockedIds.length} / ${ACHIEVEMENTS.length}</b> · бонусы добавляются к статам героя</div>
    <div class="quest-grid" style="grid-template-columns: 1fr; gap: 10px;">${cards}</div>
  `;
}

function heroInventoryHtml() {
   if (view.inventoryTab === "talents") return talentsHtml();
   if (view.inventoryTab === "potions") {
    const potions = Object.values(ITEMS).filter((i) => i.type === "potion" && (state.potions[i.id] || 0) > 0);

    if (!potions.length) return `<p class="empty">В сумке нет зелий.</p>`;

    const rows = potions.map((item) => {
      const count = state.potions[item.id] || 0;
      const st = stats();
      const isFull = item.effect === "hp" ? state.hp >= st.maxHp : state.mana >= st.maxMana;

      return `
        <div class="resource-row" style="padding: 12px; margin-bottom: 8px; align-items: center;">
          <span style="display: flex; align-items: center; gap: 10px;">
            ${iconHtml(item.icon, 24)} 
            <b>${item.name}</b> 
            <span class="chip">×${count}</span>
            <span class="hint" style="margin-left: 10px;">${item.desc}</span>
          </span>
          <button class="btn small${isFull ? " ghost" : " primary"}" data-act="drink" data-id="${item.id}" ${isFull ? "disabled" : ""} type="button">
            ${isFull ? "Полон" : "Выпить"}
          </button>
        </div>
      `;
    }).join("");

    return `<div class="resource-list">${rows}</div>`;
  }
  if (view.inventoryTab === "gear") {
    // Мультивыбор для продажи: uid'ы живут в state, поэтому выбор переживает
    // перерисовки и смену фильтра.
    if (!Array.isArray(state.selectedItems)) state.selectedItems = [];
    const selectedSet = new Set(state.selectedItems);
    const bag = state.owned.slice().sort((a, b) => (isEquipped(a.uid) ? 0 : 1) - (isEquipped(b.uid) ? 0 : 1));
    if (!bag.length) return `<p class="empty">Инвентарь пуст.</p>`;
    const q = view.invSearch.trim().toLowerCase();
    // Кэш фильтрации: пересчитываем только при смене фильтра/поиска/сумки.
    // TODO(review): equipped-сигнатура добавлена, чтобы экипировка не оставляла
    // в кэше уже надетые предметы (owned.length при этом не меняется).
    const equippedSig = Object.values(state.equipped).join(",");
    const cacheKey = `${view.invFilter}|${view.invSearch}|${state.owned.length}|${equippedSig}|${state._invRev || 0}`;
    let filtered;
    if (invFilterCache.key === cacheKey) {
      filtered = invFilterCache.list;
    } else {
      filtered = bag.filter((inst) => {
        const item = ITEMS[inst.id]; if (!item) return false;
        if (view.invFilter === "weapon" && item.slot !== "mainhand" && item.slot !== "offhand") return false;
        if (view.invFilter === "armor" && !["head", "neck", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet"].includes(item.slot)) return false;
        if (view.invFilter === "jewelry" && !["ring", "trinket"].includes(item.slot)) return false;
        if (q && !getItemDisplayName(inst).toLowerCase().includes(q)) return false;
        return true;
      });
      invFilterCache = { key: cacheKey, list: filtered };
    }
    const filters = `
      <div class="inv-filters">
        <button class="inv-filter${view.invFilter === "all" ? " active" : ""}" data-act="inv-filter" data-filter="all" type="button">Всё</button>
        <button class="inv-filter${view.invFilter === "weapon" ? " active" : ""}" data-act="inv-filter" data-filter="weapon" type="button">Оружие</button>
        <button class="inv-filter${view.invFilter === "armor" ? " active" : ""}" data-act="inv-filter" data-filter="armor" type="button">Броня</button>
        <button class="inv-filter${view.invFilter === "jewelry" ? " active" : ""}" data-act="inv-filter" data-filter="jewelry" type="button">Украшения</button>
        <input class="inv-search" type="text" placeholder="Поиск..." value="${esc(view.invSearch)}" data-role="inv-search" autocomplete="off" spellcheck="false">
      </div>`;
    if (!filtered.length) return `${filters}<p class="empty">Ничего не найдено.</p><div class="inv-count">Показано: 0 из ${bag.length}</div>`;
    const slots = filtered.map((inst) => {
      const item = ITEMS[inst.id]; if (!item) return "";
      const equipped = isEquipped(inst.uid);
      const tier = RARITY_TIERS[inst.rarity] || RARITY_TIERS.common;
      const affixLine = (inst.affix?.bonuses || []).filter((b) => ATTR_LABEL[b.id]).map((b) => `${ATTR_LABEL[b.id]} +${b.value}`).join(", ");
      const eff = inst.unique ? UNIQUE_EFFECTS.find((u) => u.id === inst.unique) : null;
      const extra = [
        `<div class="tt-set">${esc(tier.name)}</div>`,
        affixLine ? `<div class="tt-stat">${esc(affixLine)}</div>` : "",
        eff ? `<div class="tt-set-active">${esc(eff.name)}: ${esc(eff.desc)}</div>` : "",
      ];
      const tooltip = itemTooltipHtml(item, inst, extra);
      const checked = selectedSet.has(inst.uid);
      return `<div class="inv-cell${checked ? " selected" : ""}">
        <input class="inv-check" type="checkbox" data-act="inv-select" data-uid="${inst.uid}" ${checked ? "checked" : ""} ${equipped ? "disabled" : ""} aria-label="${equipped ? "Надетый предмет продать нельзя" : "Выбрать предмет для продажи"}">
        <button class="inv-slot${equipped ? " equipped-item" : ""}${rarityClass(inst)}" data-act="inv-slot-click" data-uid="${inst.uid}" type="button" data-tooltip="${esc(tooltip)}">${iconHtml(item.icon, 40)}${equipped ? `<span class="equipped-badge">Надето</span>` : ""}</button>
      </div>`;
    }).join("");
    // Итог по выбранным: снаряжение, которое реально можно продать (не надето).
    const sellable = (Array.isArray(state.selectedItems) ? state.selectedItems : [])
      .map((uid) => getInstance(uid))
      .filter((inst) => inst && ITEMS[inst.id] && !isEquipped(inst.uid));
    const sellTotal = sellable.reduce((sum, inst) => sum + sellPrice(ITEMS[inst.id], inst), 0);
    const bulkBar = `<div class="inv-bulk">
      <span class="inv-bulk-count">Выбрано: ${sellable.length}</span>
      <button class="btn small primary" data-act="inv-sell-selected" type="button" ${sellable.length ? "" : "disabled"}>Продать выбранное (${sellTotal} 💰)</button>
    </div>`;
    return `${filters}<div class="inventory-grid">${slots}</div>${bulkBar}<div class="inv-count">Показано: ${filtered.length} из ${bag.length}</div><p class="hint">Кликните по предмету в сумке, чтобы надеть его. Продать снаряжение можно у торговцев: Рон — оружие и броня, Элиза — украшения, Элейн — зелья.</p>`;
  }

  if (view.inventoryTab === "resources") {
    const rows = ALL_RESOURCES.map((res) => {
      const amount = state.resources[res.id] || 0;
      if (amount <= 0) return "";
      return `<div class="resource-row"><span>${iconHtml(res.icon, 24)} ${res.name} ×${amount}</span><button class="btn small ghost" data-act="sell-resource" data-id="${res.id}" type="button">Продать всё (${amount * res.sellPrice} 💰)</button></div>`;
    }).join("");
    return `<div class="resource-list">${rows || `<p class="empty">Пусто. Ищите припасы в Башне.</p>`}</div>`;
  }

  if (view.inventoryTab === "recipes") {
    const known = new Set(Array.isArray(state.knownRecipes) ? state.knownRecipes : []);
    const recipes = RECIPES.filter((recipe) => known.has(recipe.id));
    if (!recipes.length) return `<p class="empty">Рецепты ещё не найдены. Чертежи выпадают с мобов и боссов Башни.</p>`;
    return `<div class="known-recipes">${recipes.map((recipe) => `<div class="recipe-note"><span class="recipe-note-name">📜 <b>${recipe.desc}</b></span><span class="hint">${recipe.station === "forge" ? "Кузница" : "Ювелирная лавка"} · этаж ${recipe.floor}</span></div>`).join("")}</div>`;
  }

  return `<p class="hint">Снаряжение отображается на портрете. Кликните по слоту, чтобы сменить предмет.</p>`;
}

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

function heroHtml(st) {
  const xpMax = xpNeeded(state.level); const xpPct = Math.round((state.xp / xpMax) * 100);
  const companion = activeCompanion(); const archetype = ARCHETYPE_MAP[state.archetype] || null;
  const potionChips = Object.values(ITEMS).filter((i) => i.slot === "potion" && (state.potions[i.id] || 0) > 0).map((i) => `<button class="btn tiny ghost" data-act="drink" data-id="${i.id}" type="button">${iconHtml(i.icon, 16)} ${i.name} ×${state.potions[i.id]}</button>`).join("") || `<span class="empty">Зелий нет.</span>`;
  const counterFormatted = Math.round(st.counter * 10) / 10;

  // Освоенные QTE-способности и активные дебаффы.
  const learnedAbilities = [];
  if (state.abilities?.preciseStrike) learnedAbilities.push("Точный удар");
  if (state.abilities?.parry) learnedAbilities.push("Парирование");
  const abilitiesHtml = learnedAbilities.length
    ? `<div class="ability-badges"><span class="badge">✨ Освоено: ${learnedAbilities.join(", ")}</span></div>`
    : "";
  const DEBUFF_ICONS = { injury: "🤕", slept_rough: "🪨" };
  const heroDebuffs = (state.tempDebuffs || []).map((d) =>
    `<span class="debuff-pill" title="${esc(d.desc || d.name)}">${d.icon || DEBUFF_ICONS[d.id] || "⚠"} ${esc(d.name)} · ${d.days} дн.</span>`
  ).join("");
  const heroDebuffsHtml = heroDebuffs ? `<div class="debuff-strip hero-debuffs">${heroDebuffs}</div>` : "";

  return `
    <div class="hero-bg"><div class="bg-overlay"></div></div>
    ${subHeader(
      "Герой",
      `${esc(state.name)} — искатель Башни`,
      view.heroBackScreen || (view.tripActive ? "tower" : "hub"),
      view.heroBackScreen === "hub" ? "← В Йорстед" :
      view.heroBackScreen === "market" ? "← На Торговую площадь" :
      view.heroBackScreen === "forge" ? "← В Кузницу" :
      view.heroBackScreen === "alchemy" ? "← К Алхимику" :
      view.heroBackScreen === "jewelry" ? "← К Ювелиру" :
      view.heroBackScreen === "hotel" ? "← В Гостиницу" :
      view.heroBackScreen === "training" ? "← В Зал Охотников" :
      view.heroBackScreen === "tower" ? "← Назад в Башню" :
      "← Назад"
    )}
    <div class="hero-grid">
      <section class="panel">
        <div class="level-row"><div><div class="big-level">${state.level}</div></div><div class="xp-wrap"><div class="xp-top"><span>Опыт</span><b>${state.xp} / ${xpMax}</b></div><div class="bar xp"><span style="width:${xpPct}%"></span></div></div></div>
        <div class="stat-grid">
          <div class="stat-box"><span>HP</span><b>${state.hp} / ${st.maxHp}</b></div><div class="stat-box"><span>Мана</span><b>${state.mana} / ${st.maxMana}</b></div>
          <div class="stat-box"><span>Урон</span><b>${st.atk}</b></div><div class="stat-box"><span>Защита</span><b>${st.def}</b></div>
          <div class="stat-box"><span>Уворот</span><b>${st.dodge}%</b></div><div class="stat-box"><span>Крит</span><b>${st.crit}%</b></div>
          <div class="stat-box"><span>Контр</span><b>${counterFormatted}%</b></div><div class="stat-box"><span>Зон блока</span><b>${st.blockZones}</b></div>
        </div>
        ${abilitiesHtml}
        ${heroDebuffsHtml}
        ${archetype ? `<div class="archetype-note">${iconHtml(archetype.icon, 20)} <span><b>${archetype.name}</b>: ${archetype.desc}</span></div>` : ""}
        ${companion ? `<div class="companion-note">${iconHtml(companion.icon, 20)} <span><b>${companion.name}</b>: ${companionAffinityInfo(companion.id).rank.name}. Жалование ${companionWage(companion.id)} 💰/день.</span></div>${affinityBarHtml(companion.id)}` : ""}
        <div class="attr-head"><h2 class="group-title">Атрибуты</h2></div>
        <div class="attr-list hero">${ATTR_INFO.map((attr) => { const gearBonus = st.gearAttrs?.[attr.id] || 0; return `<div class="attr-row"><div class="attr-info"><b>${attr.name}</b><span class="hint">${attr.effect}</span></div><div class="attr-controls"><span class="attr-value">${st.attrs[attr.id]}${gearBonus ? `<i class="attr-gear" title="От снаряжения">+${gearBonus}</i>` : ""}</span><button class="attr-btn" data-act="add-attr" data-attr="${attr.id}" ${state.points <= 0 ? "disabled" : ""} type="button">+</button></div></div>`; }).join("")}</div>
      </section>

      <section class="panel doll-panel">
        <div class="doll-stage">${paperDollHtml()}</div>
        ${dollMenuHtml()}
        ${invMenuHtml()}
        
        <div style="margin-top: 20px;">
          <div class="shop-tabs" style="margin-bottom:10px;">
            <button class="shop-tab${view.inventoryTab === "gear" ? " active" : ""}" data-act="inventory-tab" data-tab="gear" type="button">Снаряжение</button>
            <button class="shop-tab${view.inventoryTab === "resources" ? " active" : ""}" data-act="inventory-tab" data-tab="resources" type="button">Материалы</button>
            <button class="shop-tab${view.inventoryTab === "recipes" ? " active" : ""}" data-act="inventory-tab" data-tab="recipes" type="button">Рецепты</button>
            <button class="shop-tab${view.inventoryTab === "potions" ? " active" : ""}" data-act="inventory-tab" data-tab="potions" type="button">Зелья</button>
          </div>

          ${heroInventoryHtml()}
        </div>
      </section>
    </div>
    <div class="danger-zone"><button class="btn tiny danger" data-act="reset" type="button">Сбросить прогресс</button><button class="btn tiny danger" data-act="dev-cheat" type="button" style="opacity: 0.5; margin-left: 10px;">Dev: Макс. Уровень</button></div>
  `;
}

function towerHtml() {
  const reason = towerClosedReason();

  const floors = FLOORS.map((floor) => {
    const locked = floor.id > state.maxFloor;
    const cleared = Boolean(state.cleared[floor.id]);

    return `
      <article class="floor-card${locked ? " locked" : ""}${cleared ? " cleared" : ""}" 
               style="position: relative; overflow: hidden; min-height: 250px; border: 1px solid var(--line); border-radius: 16px; padding: 0;">
        
         <div style="position: absolute; inset: 0; background-image: url('${floor.cardImg || floor.bg || "assets/backgrounds/tower.webp"}'); background-size: cover; background-position: center; z-index: 0; ${locked ? 'filter: grayscale(1) brightness(0.6);' : 'filter: brightness(0.6);'}"></div>
        <div class="bg-overlay"></div>
        
        <div style="position: relative; z-index: 1; background: linear-gradient(90deg, rgba(10, 8, 7, 0.05) 0%, rgba(10, 8, 7, 0.00) 100%); height: 100%; padding: 32px 36px; display: flex; flex-direction: column; justify-content: center;">
          
          <span class="loc-kicker" style="color: var(--gold); font-size: 11px; letter-spacing: 0.1em;">
            ЭТАЖ ${floor.id} ${locked ? "· ЗАПЕЧАТАН" : cleared ? "· ПРОЙДЕН" : ""}
          </span>
          
          <h2 style="font-size: 28px; margin: 6px 0 10px 0; color: var(--gold2); text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${floor.name}</h2>
          
          <p class="item-desc floor-desc">
            ${floor.desc}
          </p>

          <div>
            ${locked
              ? `<span class="badge" style="border-color: var(--blood); color: var(--blood);">🔒 Запечатан</span>`
              : `<button class="btn primary" data-act="floor-open" data-floor="${floor.id}" type="button">Войти на этаж →</button>`}
          </div>
          
        </div>
      </article>
    `;
  }).join("");

  return `
    <div class="screen-bg" style="background-image: url('assets/backgrounds/tower.webp');"><div class="bg-overlay"></div></div>
    ${subHeader("Башня", "Поход в неизвестность", "hub", "← В Йорстед")}
    ${reason ? `<div class="banner warn-banner">${reason}</div>` : ""}
    
    <div class="floors">
      ${floors}
    </div>
  `;
}

function floorHtml() {
  const floor = FLOORS.find((f) => f.id === view.currentFloor);
  if (!floor) return towerHtml();

  const canFight = !isNight() && state.energy >= FIGHT_ENERGY_COST;
  const reason = towerClosedReason();

  const potionsHtml = Object.values(ITEMS).filter(i => i.slot === "potion" && i.type === "potion" && (state.potions[i.id] || 0) > 0).map(i => {
    const full = i.effect === "hp" ? state.hp >= stats().maxHp : state.mana >= stats().maxMana;
    return `<button class="btn small ghost" data-act="drink" data-id="${i.id}" ${full ? "disabled" : ""} type="button">${iconHtml(i.icon, 16)} ${i.name} ×${state.potions[i.id]}</button>`;
  }).join("");

  const towerControls = `
    <div class="tower-controls" style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid var(--line);">
      <button class="btn primary" data-act="rest" type="button">${isNight() ? "Дождаться утра" : "Отдых · +3 энергии"}</button>
      ${potionsHtml ? `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-left: auto;">${potionsHtml}</div>` : ""}
    </div>
  `;

  const progress = Math.min(100, state.floorProgress?.[floor.id] || 0);
  const explored = progress >= 100;
  const cleared = Boolean(state.cleared[floor.id]);

  const autoReady = canFight && !view.autoExplore && (view.screen !== "battle");
  const modeSafe = view.autoExploreMode !== "fight";

  const autoBlock = `
    <div style="display:flex; gap:6px; align-items:stretch;">
      <button class="btn" data-act="auto-explore" data-floor="${floor.id}" ${autoReady ? "" : "disabled"} type="button" style="font-size: 14px; padding: 10px 16px;">Авто-исследование</button>
      
      <div style="display:flex; flex-direction:column; gap:4px; justify-content:space-between;">
        <button class="btn ${modeSafe ? "primary" : "ghost"}" data-act="auto-mode" data-mode="safe" ${view.autoExplore ? "disabled" : ""} type="button" style="font-size: 11px; padding: 0 12px; flex:1; min-height:0;" title="Избегать все бои">Скрытный</button>
        <button class="btn ${modeSafe ? "ghost" : "danger"}" data-act="auto-mode" data-mode="fight" ${view.autoExplore ? "disabled" : ""} type="button" style="font-size: 11px; padding: 0 12px; flex:1; min-height:0;" title="Принимать любые возможные сражения">Боевой</button>
      </div>
    </div>
  `;

  const exploreActions = explored
    ? `${cleared ? `<button class="btn ghost" data-act="seek-fight" data-floor="${floor.id}" ${canFight ? "" : "disabled"} type="button" style="font-size: 14px; padding: 10px 16px;">⚔ Искать боя</button>
       ${autoBlock}` : ""}`
    : `<div style="display:flex; gap:8px; align-items:stretch; flex-wrap:wrap;">
         <button class="btn primary" data-act="explore" data-floor="${floor.id}" ${canFight ? "" : "disabled"} type="button" style="font-size: 14px; padding: 10px 16px;">Исследовать (1 ⚡)</button>
         ${autoBlock}
       </div>`;

  const autoPanel = view.autoExplore ? `
    <div style="margin-top: 15px; border: 1px solid var(--line); border-radius: 10px; background: rgba(0,0,0,0.25); padding: 12px 14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
        <b style="font-size:14px; color: var(--gold2);">Авто-исследование: ${view.autoExplore.avoidDanger ? "Скрытный" : "Боевой"}${battleActive() ? ` <span style="color: var(--gold);">(пауза на бой)</span>` : ""}</b>
        <button class="btn small danger" data-act="auto-stop" type="button">⏹ Стоп</button>
      </div>
      <div style="margin-top:10px; background:#0b0b0d; border:1px solid var(--line); border-radius:8px; padding:8px 10px; max-height:120px; overflow-y:auto; font-family: Consolas, 'Courier New', monospace; font-size:12px; line-height:1.7; color:#8fd98f;">
        ${view.autoExplore.log.length ? view.autoExplore.log.slice(-7).map(line => `<div>${line}</div>`).join("") : `<div style="color:#5a5a5a;">Ожидание…</div>`}
      </div>
    </div>
  ` : "";

  const exploreBlock = `
    <div class="explore-block" style="padding: 20px; border-radius: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--line); margin-bottom: 20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:15px; flex-wrap:wrap;">
        <b style="font-size: 18px; color: var(--gold2);">🔎 Исследование этажа</b>
        <span style="color: var(--dim); font-size: 14px;">Исследовано: <b style="color: var(--gold2);">${progress}%</b></span>
      </div>
      ${bar("xp", progress, 100)}
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top: 15px; align-items:center;">${exploreActions}</div>
      ${autoPanel}
    </div>
  `;

  return `
    <div class="screen-bg" style="background-image: url('${floor.bg || "assets/backgrounds/tower.webp"}');"><div class="bg-overlay"></div></div>
    ${subHeader(`Этаж ${floor.id}: ${floor.name}`, floor.subtitle, "tower", "← Назад к этажам")}
    <p class="lead" style="margin-bottom: 20px;">${floor.desc || ""}</p>
    ${towerControls}
    
    ${reason ? `<div class="banner warn-banner">${reason}</div>` : ""}
    
    <div class="floors">
      <article class="floor-card${cleared ? " cleared" : ""}">
        <div class="floor-head"><div><h2>Исследование</h2></div></div>
        ${exploreBlock}
        
        ${explored ? `
        <div class="boss-row" style="margin-top: 5px; padding: 20px; border-radius: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--blood); display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
          <span class="mob-icon boss-icon" style="width: 80px; height: 80px; flex: 0 0 80px; font-size: 40px; background: #1c1511; border-radius: 12px; border: 1px solid var(--blood); display: grid; place-items: center;">
            ${iconHtml(floor.boss.icon, 64)}
          </span>
          <div class="mob-info" style="flex: 1; min-width: 220px;">
            <b style="font-size: 20px; color: #ff6b6b;">${floor.boss.name}</b>
            <div class="mob-stats-container" style="margin-top: 8px;">
              <span class="mob-stat-chip hp" style="font-size: 13px; padding: 5px 12px;">❤ ${floor.boss.hp} HP</span>
              <span class="mob-stat-chip atk" style="font-size: 13px; padding: 5px 12px;">⚔ ${floor.boss.atk}</span>
              <span class="mob-stat-chip def" style="font-size: 13px; padding: 5px 12px;">🛡 ${floor.boss.def}</span>
            </div>
          </div>
          <button class="btn primary" data-act="fight" data-floor="${floor.id}" data-mob="boss" ${canFight ? "" : "disabled"} type="button" style="font-size: 14px; padding: 10px 16px;">🗡 Атаковать Босса</button>
          ${cleared
            ? `<span class="badge elite" style="padding: 8px 14px;">⚠ Повержен — можно снова</span>`
            : `<span class="badge elite" style="padding: 8px 14px;">⚠ Босс пробуждён</span>`}
        </div>` : ""}
      </article>
    </div>
  `;
}

function exploreResultModalHtml() {
  const res = view.exploreResult;
  if (!res) return "";

  let title = "Событие";
  let icon = "❓";
  let color = "var(--gold2)";

  if (res.type === "loot") {
    title = "Находка";
    icon = "📦";
    color = "#a9d3b1";
  } else if (res.type === "nothing") {
    title = "Тишина";
    icon = "🌲";
    color = "var(--dim)";
  }

  return `
    <div class="result-overlay" style="z-index: 190;">
      <div class="result-card" style="max-width: 500px;">
        <h2 style="color: ${color}; font-size: 24px;">${icon} ${title}</h2>
        <p style="font-size: 15px; line-height: 1.55; margin: 15px 0 25px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; border: 1px solid var(--line);">
          ${esc(res.text)}
        </p>
        <button class="btn primary" data-act="explore-result-continue" type="button" style="width: 100%;">Продолжить</button>
      </div>
    </div>
  `;
}

// Реплика активного компаньона на событие. Возвращает готовую строку или "".
// Одна и та же реплика для одного и того же key (без мигания при ререндере).
function companionReaction(type, key = "") {
  if (typeof activeCompanion !== "function") return "";
  const companion = activeCompanion();
  if (!companion) return "";
  const set = COMPANION_REACTIONS[companion.id];
  if (!set) return "";
  const lines = set[type] || set.explore;
  if (!Array.isArray(lines) || !lines.length) return "";
  const seed = String(key || type).split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return `${companion.icon} ${companion.name}: «${genderText(lines[seed % lines.length])}»`;
}

// Модалка процедурного события: заглушка-картинка, заголовок, текст и кнопки выбора.
function renderEventModal(event) {
  if (!event) return "";
  const reaction = companionReaction(event.type || "explore", event.id);
  const actions = (event.options || []).map((o) =>
    `<button class="btn primary" data-act="event-action" data-event="${event.id}" data-option="${o.id}" type="button" style="flex:1; min-width:160px;">${o.label}</button>`
  ).join("");
  return `
    <div class="result-overlay" style="z-index: 195;">
      <div class="result-card" style="max-width: 520px;">
        <div class="event-image" aria-hidden="true">${event.icon || "❓"}</div>
        <h2 style="color: var(--gold2); font-size: 24px; margin: 16px 0 4px;">${event.icon || ""} ${event.name}</h2>
        <p style="font-size: 15px; line-height: 1.55; margin: 12px 0 20px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; border: 1px solid var(--line);">${esc(event.text)}</p>
        ${reaction ? `<p class="companion-reaction">${esc(reaction)}</p>` : ""}
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">${actions}</div>
      </div>
    </div>
  `;
}

// ── Спонтанные события этажей (Блок 6) ──────────────────────────────────────
// Вход: state.activeFloorEvent = { eventId, floorId, encounter? }.
// В отличие от renderEventModal кнопки = сразу выбор действий (не success/fail).
function renderFloorEventModal(fe) {
  if (!fe) return "";
  // Открытый охотник — рисуем диалог охотника поверх.
  if (fe.encounter) return renderHunterEncounterModal(fe);
  const event = FLOOR_EVENTS[fe.eventId];
  if (!event) return "";
  const reaction = companionReaction(event.type || "explore", `${event.id}:${fe.floorId}`);
  const actions = (event.actions || []).map((a) =>
    `<button class="btn primary" data-act="floor-event-action" data-event="${event.id}" data-action="${a.id}" type="button" style="flex:1; min-width:160px;">${a.label}</button>`
  ).join("");
  return `
    <div class="result-overlay" style="z-index: 195;">
      <div class="result-card" style="max-width: 520px;">
        <div class="event-image" aria-hidden="true">${event.icon || "❓"}</div>
        <h2 style="color: var(--gold2); font-size: 24px; margin: 16px 0 4px;">${event.icon || ""} ${event.title}</h2>
        <p style="font-size: 15px; line-height: 1.55; margin: 12px 0 20px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; border: 1px solid var(--line);">${esc(event.text)}</p>
        ${reaction ? `<p class="companion-reaction">${esc(reaction)}</p>` : ""}
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">${actions}</div>
      </div>
    </div>
  `;
}

// Диалог встречи с охотником Гильдии: помочь / убить / оставить в покое.
function renderHunterEncounterModal(fe) {
  const enc = (HUNTER_ENCOUNTERS || []).find((h) => h.id === fe.encounter);
  if (!enc) return "";
  const hint = enc.helpNeed ? (enc.helpNeed.potion ? "Помощь стоит лечащего зелья." : "Помощь стоит одного ресурса.") : "Помощь — за просто так.";
  const actions = [
    { id: "help", label: "🧪 Помочь" },
    { id: "kill", label: "🗡 Убить" },
    { id: "leave", label: "🚶 Оставить в покое" },
  ].map((a) =>
    `<button class="btn primary" data-act="hunter-enc-action" data-enc="${enc.id}" data-action="${a.id}" type="button" style="flex:1; min-width:150px;">${a.label}</button>`
  ).join("");
  return `
    <div class="result-overlay" style="z-index: 195;">
      <div class="result-card" style="max-width: 520px;">
        <div class="event-image" aria-hidden="true">${enc.icon || "🏹"}</div>
        <h2 style="color: var(--gold2); font-size: 24px; margin: 16px 0 4px;">${enc.icon || ""} ${enc.name}</h2>
        <p style="font-size: 15px; line-height: 1.55; margin: 12px 0 20px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; border: 1px solid var(--line);">${esc(enc.text)}</p>
        <p style="font-size: 13px; color: rgba(220, 205, 175, 0.75); margin: -8px 0 16px;">${esc(hint)}</p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">${actions}</div>
      </div>
    </div>
  `;
}

// Единый размер кнопок боевого интерфейса: одинаковая высота, ширина и центрированный текст.
const BATTLE_BTN_STYLE = "height: 44px; min-height: 44px; max-height: 44px; width: 100%; box-sizing: border-box; padding: 0 8px; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 13px; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";

function zoneButtons() {
  const st = stats();
  return {
    attack: ZONES.map((z) => {
      const tip = z.tip ? ` title="${esc(z.tip)}"` : "";
      return `<button class="zone attack${view.attackZone === z.id ? " selected" : ""}" data-act="attack-zone" data-zone="${z.id}" type="button"${tip}>${z.name}</button>`;
    }).join(""),
    block: ZONES.map((z) => {
      return `<button class="zone block${view.blocks.includes(z.id) ? " selected" : ""}" data-act="block-zone" data-zone="${z.id}" type="button">${z.name}</button>`;
    }).join(""),
    limit: st.blockZones
  };
}

function weaponSwapHtml() {
  if (!view.weaponSwap) return "";
  
  const weapons = state.owned.filter(inst => {
    const item = ITEMS[inst.id];
    return item && item.slot === "mainhand";
  });
  
  const rows = weapons.map(inst => {
    const item = ITEMS[inst.id];
    const isEquipped = state.equipped.mainhand === inst.uid;
    return `<button class="doll-item${isEquipped ? " equipped" : ""}" data-act="equip-in-battle" data-uid="${inst.uid}" type="button" ${isEquipped ? "disabled" : ""}>
      <span class="item-icon">${iconHtml(item.icon, 32)}</span>
      <span class="doll-item-body">
        <span class="doll-item-name">${getItemDisplayName(inst)}</span>
        <span class="chips">${statsChips(item, inst)}</span>
      </span>
    </button>`;
  }).join("");
  
  return `
    <div class="doll-menu-backdrop" data-act="weapon-swap-close"></div>
    <div class="doll-menu" role="dialog">
      <div class="doll-menu-head">
        <h3>Сменить оружие</h3>
        <button class="doll-menu-close" data-act="weapon-swap-close" type="button">✕</button>
      </div>
      <p class="hint" style="margin-bottom: 10px;">Смена оружия потратит ход: вы не будете атаковать, а враг ударит.</p>
      <div class="doll-menu-list">${rows || `<p class="empty">Нет другого оружия в сумке.</p>`}</div>
    </div>
  `;
}

function hasReadySkill(battle) {
  const b = battle || view.battle;
  if (!b) return false;
  const cd = b.skillCd || {};
  return TALENTS.some((t) => t.active && ((state.talents || {})[t.id] || 0) > 0
    && state.mana >= t.skill.manaCost
    && (!t.skill.rageCost || b.rage >= t.skill.rageCost)
    && (cd[t.id] || 0) <= 0);
}

function battleHtml(st) {
  const battle = view.battle; 
  const enemy = battle.enemy; 
  const bgImage = FLOORS.find(f => f.id === battle.floorId)?.bg || "assets/backgrounds/tower.webp";
  const zones = zoneButtons(); 
  const ragePct = Math.min(100, (battle.rage / 5) * 100);

  const mainInst = state.equipped.mainhand ? getInstance(state.equipped.mainhand) : null;
  const playerWeapon = mainInst ? ITEMS[mainInst.id] : null;
  const playerArmorType = state.equipped.chest ? ITEMS[getInstance(state.equipped.chest)?.id]?.armorType : null;

  let playerWeaponTitle = "Без оружия";
  if (playerWeapon) {
    const styles = [];
    if (playerWeapon.damage?.slashing > 0) styles.push(`рубящий ${playerWeapon.damage.slashing}`);
    if (playerWeapon.damage?.piercing > 0) styles.push(`колющий ${playerWeapon.damage.piercing}`);
    if (playerWeapon.damage?.bludgeoning > 0) styles.push(`дробящий ${playerWeapon.damage.bludgeoning}`);
    playerWeaponTitle = styles.length ? `Урон: ${styles.join(", ")}` : "Нет урона";
  }

  let playerArmorTitle = "Без брони";
  if (playerArmorType) {
    const mults = ARMOR_STYLE_MULT;
    const mods = [];
    mods.push(`Колющий: ${Math.round(mults.piercing[playerArmorType] * 100)}%`);
    mods.push(`Рубящий: ${Math.round(mults.slashing[playerArmorType] * 100)}%`);
    mods.push(`Дробящий: ${Math.round(mults.bludgeoning[playerArmorType] * 100)}%`);
    playerArmorTitle = `Получаемый урон: ${mods.join(", ")}`;
  }

  // Мини-список брони по зонам: «Голова: Латы | Грудь: Латы | Пояс: Ткань | Ноги: Кожа».
  const zoneArmorList = ["head", "chest", "waist", "legs"].map((slot) => {
    const inst = state.equipped[slot] ? getInstance(state.equipped[slot]) : null;
    const type = (inst && ITEMS[inst.id] && ITEMS[inst.id].armorType) || "cloth";
    return `${SLOT_NAME[slot]}: ${ARMOR_TYPE_NAMES[type] || type}`;
  }).join(" | ");

  // Полоски маны и куража врага видны всегда — по ним читается готовность
  // моба к «Тяжёлому удару».
  // Бейдж ярости: виден при 3+ куража, после «Тяжёлого удара» скрывается.
  const enemyEnraged = (battle.enemy.rage || 0) >= 3;
  const enemyRageBadge = `<span class="chip" data-role="enemy-rage-badge" title="Моб в ярости: следующий удар будет сокрушительным" style="border-color:#c2483c; color:#ff7b6b; background:rgba(194,72,60,0.15);${enemyEnraged ? "" : " display:none;"}">⚠️ В ЯРОСТИ</span>`;

  // Бейджи врага выносим отдельным рядом под именем, чтобы не раздувать строку с названием.
  const enemyBadges = [
    enemy.rarity === "rare" ? `<span class="chip" style="border-color: #d9a94b; color: #d9a94b;" title="Редкий враг">Редкий</span>` : "",
    enemy.rarity === "elite" ? `<span class="chip" style="border-color: #c2483c; color: #c2483c;" title="Элитный враг">Элитный</span>` : "",
    enemy.modifier ? `<span class="chip" style="cursor: help;" title="${MOB_MODIFIERS[enemy.modifier].desc}">${MOB_MODIFIERS[enemy.modifier].name}</span>` : "",
    enemy.ability ? `<span class="chip" style="cursor: help;" title="${MOB_ABILITY_INFO[enemy.ability].desc}">${MOB_ABILITY_INFO[enemy.ability].name}</span>` : "",
    enemyRageBadge,
  ].filter(Boolean).join("");

  const enemyWeapon = enemy.weaponId ? ITEMS[enemy.weaponId] : null;
  let enemyWeaponTitle = "Без оружия";
  if (enemyWeapon) {
    const styles = [];
    if (enemyWeapon.damage?.slashing > 0) styles.push(`рубящий ${enemyWeapon.damage.slashing}`);
    if (enemyWeapon.damage?.piercing > 0) styles.push(`колющий ${enemyWeapon.damage.piercing}`);
    if (enemyWeapon.damage?.bludgeoning > 0) styles.push(`дробящий ${enemyWeapon.damage.bludgeoning}`);
    enemyWeaponTitle = styles.length ? `Урон: ${styles.join(", ")}` : "Нет урона";
  }

  let enemyArmorTitle = "Без брони";
  if (enemy.armorType) {
    const mults = ARMOR_STYLE_MULT;
    const mods = [];
    mods.push(`Колющий: ${Math.round(mults.piercing[enemy.armorType] * 100)}%`);
    mods.push(`Рубящий: ${Math.round(mults.slashing[enemy.armorType] * 100)}%`);
    mods.push(`Дробящий: ${Math.round(mults.bludgeoning[enemy.armorType] * 100)}%`);
    enemyArmorTitle = `Получаемый урон: ${mods.join(", ")}`;
  }

  const styleButtonsHtml = state.archetype === "monk"
    ? MONK_STANCES.map((stance) => {
        const sel = (battle.monkStance || MONK_DEFAULT_STANCE) === stance.id ? " selected" : "";
        return `<button class="zone attack${sel}" data-act="monk-stance" data-stance="${stance.id}" type="button" title="${esc(stance.desc)}" style="flex: 1;">${stance.name}</button>`;
      }).join("")
    : STYLE_ORDER.map((s) => {
        const value = weaponStyleValue(playerWeapon, s, mainInst);
        const disabled = value <= 0;
        const activeStyle = (weaponStyleValue(playerWeapon, view.attackStyle, mainInst) || 0) > 0 ? view.attackStyle : weaponBestStyle(playerWeapon, mainInst);
        const sel = activeStyle === s ? " selected" : "";
        return `<button class="zone attack${sel}" data-act="attack-style" data-style="${s}" ${disabled ? "disabled" : ""} type="button" style="flex: 1;">${STYLE_NAMES[s]}</button>`;
      }).join("");

  const log = battle.log.slice(-18).map((entry) => `<div class="log-line ${entry.cls}">${esc(entry.text)}</div>`).join("");
  const companionBattleType = battle.over
    ? (view.summary ? (view.summary.victory ? "victory" : "defeat") : (battle.hp <= 0 ? "victory" : "defeat"))
    : (battle.turn === 0 ? "fight_start" : "");
  const battleReaction = companionBattleType ? companionReaction(companionBattleType, `${battle.enemy.id}:${battle.turn}`) : "";
  const activeZoneTip = ZONE_MAP[view.attackZone]?.tip || "";
  const currentStyle = state.archetype === "monk" ? battle.monkStance : view.attackStyle;
  const estimatedDmg = estimateDamage(state, battle, view.attackZone, currentStyle, mainInst);
  const controls = battle.over ? "" : `
    <div class="combat-deck">
      
      <!-- ЛЕВАЯ КОЛОНКА: Удар -->
      <div class="deck-col">
        <div class="deck-title">Удар</div>
        <div class="zones">${zones.attack}</div>
        <div class="deck-style-row">${styleButtonsHtml}</div>
        <div class="deck-tip hint">${activeZoneTip ? esc(activeZoneTip) : "&nbsp;"}</div>
      </div>

      <!-- ЦЕНТР: Блок и приёмы/расходники -->
      <div class="deck-col">
        <div class="deck-title">Блок (${zones.limit})</div>
        <div class="zones">${zones.block}</div>
        <div class="deck-tabs deck-actions">
          <button class="deck-tab${hasReadySkill(battle) ? " ready" : ""}" data-act="battle-left-tab" data-tab="abilities" type="button" style="${BATTLE_BTN_STYLE}">Приёмы</button>
          <button class="deck-tab" data-act="battle-left-tab" data-tab="items" type="button" style="${BATTLE_BTN_STYLE}">Расходники</button>
        </div>
      </div>

      <!-- ПРАВАЯ КОЛОНКА: Прогноз и Размен -->
      <div class="deck-col">
        <div class="deck-title">Прогноз</div>
        <div class="zones" style="display: flex !important; height: 44px !important;">
          <div class="deck-forecast" data-role="battle-forecast" style="flex: 1 !important; height: 100% !important; display: flex !important; align-items: center !important; justify-content: center !important;">⚔ ~${estimatedDmg} <span style="font-size: 11px; color: var(--dim); margin-left: 6px;">(${STYLE_NAMES[currentStyle]})</span></div>
        </div>
        <div class="deck-tabs">
          <button class="btn primary deck-btn" data-act="exchange" type="button" style="flex: 1 !important; height: 100% !important;">РАЗМЕН</button>
        </div>
        <div class="deck-tip hint">&nbsp;</div>
      </div>

    </div>
  `;

  return `
    <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-image: linear-gradient(rgba(10, 8, 7, 0.5), rgba(10, 8, 7, 0.5)), url('${bgImage}'); background-size: cover; background-position: center; z-index: 0; pointer-events: none;"></div>
    <section class="battle" style="position: relative; z-index: 1; display: flex; flex-direction: column; height: 100vh; padding: 10px 20px; box-sizing: border-box;">
      
      ${battle.ambush ? `<div class="banner warn-banner">🔪 ${AMBUSH_TEXT}</div>` : ""}
      
      <!-- ВЕРХ: Статы -->
      <div class="fighters" style="margin-bottom: 10px;">
        <article class="fighter hero-fighter">
          <div class="fighter-avatar portrait" style="width: 80px; height: 80px; border-radius: 10px; overflow: hidden; flex-shrink: 0;">
            <img src="${portraitSrc(state.portrait)}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div class="fighter-body" style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
            <div class="fighter-name" style="font-size: 16px; margin-bottom: 6px;">${esc(state.name)}${state.currentTitle ? `, ${esc(state.currentTitle)}` : ""} <span class="muted">УР ${state.level}</span></div>
            ${bar("hp", state.hp, st.maxHp, "hero-hp")}
            ${bar("mana", state.mana, st.maxMana, "hero-mana")}
            <div class="bar rage-bar" data-role="rage-bar" style="margin-top: 4px;"><span style="width:${Math.min(100, (battle.rage / 5) * 100)}%"></span></div>
            <div class="fighter-numbers" style="font-size: 11px; margin-top: 6px; display: flex; gap: 12px; flex-wrap: wrap;">
              <span data-role="hero-hp-text">${state.hp}/${st.maxHp} HP</span>
              <span data-role="hero-mana-text">${state.mana}/${st.maxMana} MP</span>
              <span data-role="rage-text">Кураж: ${battle.rage}/5</span>
              <span title="${playerArmorTitle}" style="border-bottom: 1px dotted var(--dim); cursor: help; font-size: 10px;">${zoneArmorList}</span>
              <span title="${playerWeaponTitle}" style="border-bottom: 1px dotted var(--dim); cursor: help;">Оружие: ${playerWeapon ? playerWeapon.name : "Кулаки"}</span>
            </div>
          </div>
        </article>
        <div class="vs" style="align-self: center; font-size: 24px; color: var(--gold2);">VS</div>
        <article class="fighter enemy-fighter${battle.hp <= 0 ? " dead" : ""}">
          <div class="fighter-avatar" style="width: 80px; height: 80px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: #1c1511;">
            <img src="${resolveIcon(enemy.icon)}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div class="fighter-body" style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
            <div class="fighter-name" style="font-size: 16px; margin-bottom: 4px;">${enemy.name}</div>
            ${enemyBadges ? `<div class="enemy-badges">${enemyBadges}</div>` : ""}
            ${bar("hp enemy", battle.hp, battle.maxHp, "enemy-hp")}
            ${bar("mana", battle.enemy.mana || 0, battle.enemy.maxMana || 1, "enemy-mana")}
            ${bar("rage", battle.enemy.rage || 0, battle.enemy.maxRage || 5, "enemy-rage")}
            <div class="fighter-numbers" style="font-size: 11px; margin-top: 6px; display: flex; gap: 4px 12px; flex-wrap: wrap; align-items: center;">
              <span data-role="enemy-hp-text">${battle.hp}/${battle.maxHp} HP</span>
              <span title="Базовый урон врага">Урон: ${enemy.atk}</span>
              <span title="Базовые доспехи, снижающие урон">Защита: ${enemy.def}</span>
              <span title="${enemyArmorTitle}" style="border-bottom: 1px dotted var(--dim); cursor: help;">Броня: ${ARMOR_TYPE_NAMES[enemy.armorType] || "Нет"}</span>
              <span title="${enemyWeaponTitle}" style="border-bottom: 1px dotted var(--dim); cursor: help;">Оружие: ${enemyWeapon ? enemyWeapon.name : "Кулаки"}</span>
            </div>
          </div>
        </article>
      </div>

      <!-- ЦЕНТР: Лог боя -->
      <div class="battle-log" id="battle-log" data-role="battle-log" style="flex: 1; max-height: none; margin-bottom: 10px; overflow-y: auto;">
        ${battleReaction ? `<div class="companion-reaction" style="margin-bottom: 8px;">${esc(battleReaction)}</div>` : ""}
        ${log || `<div class="log-line info">Выберите зону удара и зоны блока, затем нажмите «Размен».</div>`}
      </div>

      <!-- НИЗ: Панель управления -->
      ${controls}

      ${battle.over ? "" : `<div style="width: 100%; margin-top: 10px;"><button class="btn ghost" data-act="flee" type="button" style="width: 100%; height: 44px;">Сбежать</button></div>`}

      ${resultHtml()}
    </section>
    ${view.battleModal ? battleModalHtml() : ""}
  `;
}

// Контекстное окно боевых действий: «Приёмы» и «Расходники» (Этап 9).
// Открывается поверх боя, закрывается по фону/крестику или после действия.
function battleModalHtml() {
  const battle = view.battle;
  if (!battle || !view.battleModal) return "";

  const isAbilities = view.battleModal === "abilities";
  const title = isAbilities ? "Приёмы" : "Расходники";

  const card = ({ act, id, icon, name, meta, count, disabled = false }) => `
    <button class="battle-modal-card" data-act="${act}"${id ? ` data-id="${id}"` : ""} ${disabled ? "disabled" : ""} type="button">
      <span class="battle-modal-icon">${icon}</span>
      <span class="battle-modal-card-body">
        <span class="battle-modal-card-name">${name}</span>
        ${meta ? `<span class="battle-modal-card-meta">${meta}</span>` : ""}
      </span>
      ${count !== undefined ? `<span class="battle-modal-card-count">×${count}</span>` : ""}
    </button>
  `;

  let body = "";
  let tip = "";

  if (isAbilities) {
    const techReady = battle.rage >= 3 && state.mana >= TECH_COST;

    // Изученные активные навыки: проверяем ману, кураж и откат.
    const learnedSkills = TALENTS.filter((t) => t.active && ((state.talents || {})[t.id] || 0) > 0);
    const skillCards = learnedSkills.map((t) => {
      const cd = (battle.skillCd || {})[t.id] || 0;
      const ready = state.mana >= t.skill.manaCost
        && (!t.skill.rageCost || battle.rage >= t.skill.rageCost)
        && cd <= 0;
      const metaParts = [`Мана ${state.mana}/${t.skill.manaCost}`];
      if (t.skill.rageCost) metaParts.push(`Кураж ${battle.rage}/${t.skill.rageCost}`);
      if (cd > 0) metaParts.push(`Откат: ${cd} х.`);
      return card({
        act: "skill",
        id: t.id,
        icon: t.skill.icon || "✨",
        name: esc(t.skill.name),
        meta: metaParts.join(" · "),
        disabled: !ready,
      });
    });

    body = [
      card({
        act: "tech",
        icon: "💥",
        name: "Тяжёлый удар",
        meta: `Кураж ${battle.rage}/3 · Мана ${state.mana}/${TECH_COST}`,
        disabled: !techReady,
      }),
      ...skillCards,
      card({
        act: "switch-weapon",
        icon: "🔄",
        name: "Сменить оружие",
        meta: "Потратит ход: вы не атакуете, враг ударит.",
      }),
    ].join("");
    tip = skillCards.length ? "" : "Активные навыки появляются здесь после изучения в ветке талантов.";
  } else {
    const potionItems = Object.values(ITEMS).filter((i) => i.slot === "potion" && i.type === "potion" && (state.potions[i.id] || 0) > 0);
    const battleItems = Object.values(ITEMS).filter((i) => i.slot === "potion" && i.type === "combat" && (state.potions[i.id] || 0) > 0);
    const potionCards = potionItems.map((i) => card({
      act: "drink-battle",
      id: i.id,
      icon: iconHtml(i.icon, 24),
      name: esc(i.name),
      meta: esc(i.desc || ""),
      count: state.potions[i.id],
      disabled: !canDrinkPotion(i.id),
    }));
    const itemCards = battleItems.map((i) => card({
      act: "use-battle-item",
      id: i.id,
      icon: iconHtml(i.icon, 24),
      name: esc(i.name),
      meta: esc(i.desc || ""),
      count: state.potions[i.id],
    }));

    body = potionCards.concat(itemCards).join("")
      || `<p class="battle-modal-empty">Нет расходников</p>`;
    tip = "Расходник заменит вашу атаку, но вы сохраните блок.";
  }

  return `
    <div class="battle-modal-backdrop" data-act="battle-modal-close"></div>
    <div class="battle-modal" role="dialog" aria-label="${title}">
      <div class="battle-modal-head">
        <h3>${title}</h3>
        <button class="battle-modal-close" data-act="battle-modal-close" type="button">✕</button>
      </div>
      <div class="battle-modal-body">${body}</div>
      ${tip ? `<p class="battle-modal-tip">${tip}</p>` : ""}
    </div>
  `;
}

// ── QTE-модалки ────────────────────────────────────────────────────────────
function renderCritModal() {
  const w = view.battle && view.battle.critWindow;
  if (!w) return "";
  return `
    <div class="qte-modal" role="dialog" aria-label="Точный удар">
      <div class="qte-card">
        <h2 class="qte-title">ТОЧНЫЙ УДАР!</h2>
        <p class="qte-subtitle">Остановите указатель в зелёной зоне</p>
        <div class="crit-scale">
          <div class="crit-cursor" data-role="crit-cursor" style="left:0%"></div>
        </div>
        <div class="crit-legend"><span>×1.3</span><span>×1.6</span><span>×1.9</span><span>×1.6</span><span>×1.3</span></div>
        <div class="qte-timer-bar"><span class="qte-timer-fill" data-role="qte-timer-fill" style="width:100%"></span></div>
        <button class="parry-btn qte-stop-btn" data-act="crit-stop" type="button">Стоп!</button>
      </div>
    </div>`;
}

function renderParryModal() {
  const w = view.battle && view.battle.parryWindow;
  if (!w) return "";
  return `
    <div class="qte-modal" role="dialog" aria-label="Парирование">
      <div class="qte-card parry-card">
        <h2 class="qte-title parry-title">ПАРИРУЙ!</h2>
        <p class="qte-subtitle">Удар в «${esc(w.zone || "")}»!</p>
        <div class="qte-timer-bar"><span class="qte-timer-fill" data-role="qte-timer-fill" style="width:100%"></span></div>
        <button class="parry-btn" data-act="parry-block" type="button">Блок</button>
      </div>
    </div>`;
}

function renderTrainingQte() {
  const qte = view.trainingQTE;
  if (!qte) return "";
  const training = TRAINING_MAP[qte.trainingId];
  if (!training) return "";
  if (training.qteType === "rhythm") return renderRhythmQte(training);
  const total = Array.isArray(qte.sequence) && qte.sequence.length ? qte.sequence.length : 3;
  const step = Math.max(0, Math.min(total, Number(qte.currentStep) || 0));
  const dots = Array.from({ length: total }, (_, i) =>
    `<span class="qte-step${i < step ? " done" : ""}" data-step="${i}"></span>`
  ).join("");
  const pct = Math.max(0, Math.min(100, ((Number(qte.timeLeft) || 0) / QTE_TRAINING_TIME) * 100));
  const button = (move, label) =>
    `<button class="btn primary" data-act="training-qte" data-move="${move}" type="button" style="flex:1;min-height:48px;">${label}</button>`;
  return `
    <div class="qte-modal" role="dialog" aria-label="Тренировка">
      <div class="qte-card">
        <h2 class="qte-title">Тренировка: ${esc(training.name)}</h2>
        <p class="qte-subtitle">Повтори движение: влево → вправо → удар</p>
        <div class="qte-steps" data-role="qte-steps">${dots}</div>
        <div class="qte-timer-bar"><span class="qte-timer-fill" data-role="qte-timer-fill" style="width:${pct}%"></span></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${button("left", "Влево")}
          ${button("right", "Вправо")}
          ${button("strike", "Удар")}
        </div>
      </div>
    </div>`;
}

// «Полоса препятствий»: ритм-QTE. Бегунок ходит по шкале, в центре — зелёная
// зона. Прыжок в этой зоне — успех, любой другой клик или таймаут — провал.
function renderRhythmQte(training) {
  const qte = view.trainingQTE;
  if (!qte) return "";
  const pct = Math.max(0, Math.min(100, ((Number(qte.timeLeft) || 0) / QTE_TRAINING_TIME) * 100));
  return `
    <div class="qte-modal" role="dialog" aria-label="Полоса препятствий">
      <div class="qte-card">
        <h2 class="qte-title">${esc(training.name)}</h2>
        <p class="qte-subtitle">Прыгай, когда бегунок в зелёной зоне</p>
        <div class="rhythm-scale">
          <div class="rhythm-zone"></div>
          <div class="rhythm-runner" data-role="rhythm-runner" style="left:0%"></div>
        </div>
        <div class="qte-timer-bar"><span class="qte-timer-fill" data-role="qte-timer-fill" style="width:${pct}%"></span></div>
        <button class="parry-btn qte-stop-btn" data-act="rhythm-jump" type="button">Прыжок!</button>
      </div>
    </div>`;
}

// Точечное обновление шага тренировки: без render() и без пересоздания
// модалки, чтобы она не мигала и не перезапускала анимацию появления.
function updateTrainingQteStep(qte) {
  const box = document.querySelector('[data-role="qte-steps"]');
  if (!box) return;
  const step = Number(qte.currentStep) || 0;
  box.querySelectorAll(".qte-step").forEach((el, i) => {
    el.classList.toggle("done", i < step);
  });
}

function stopQteLoop() {
  if (qteInterval !== null) {
    clearInterval(qteInterval);
    qteInterval = null;
  }
}

function updateQteTimer(ratio) {
  const fill = document.querySelector('.qte-timer-fill');
  if (fill) fill.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;
}

function ensureQteLoop() {
  if (qteInterval !== null) return;
  const battle = view.battle;
  const battleQte = battle && !battle.over && !view.summary && view.screen === "battle"
    && (battle.critWindow || battle.parryWindow);
  if (!view.trainingQTE && !battleQte) return;

  qteCursorPos = 0;
  qteCursorDir = 1;
  qteRunnerPos = 0;
  qteRunnerDir = 1;

  qteInterval = setInterval(() => {
    const dt = QTE_TICK_MS / 1000;

    // Тренировка: общий таймер на 6 секунд. Для «Полосы препятствий»
    // дополнительно двигаем бегунок (полный проход шкалы — 3 секунды).
    if (view.trainingQTE) {
      const q = view.trainingQTE;
      q.timeLeft = (Number(q.timeLeft) || 0) - dt;
      updateQteTimer(q.timeLeft / QTE_TRAINING_TIME);
      const training = TRAINING_MAP[q.trainingId];
      if (training && training.qteType === "rhythm") {
        qteRunnerPos += qteRunnerDir * dt / 3;
        if (qteRunnerPos >= 1) { qteRunnerPos = 1; qteRunnerDir = -1; }
        else if (qteRunnerPos <= 0) { qteRunnerPos = 0; qteRunnerDir = 1; }
        const runner = document.querySelector('[data-role="rhythm-runner"]');
        if (runner) runner.style.left = `${qteRunnerPos * 100}%`;
      }
      if (q.timeLeft <= 0) {
        stopQteLoop();
        completeTraining(false);
      }
      return;
    }

    const b = view.battle;
    if (!b) { stopQteLoop(); return; }

    if (b.critWindow) {
      b.critWindow.timeLeft -= dt;
      qteCursorPos += qteCursorDir * dt * 0.9;
      if (qteCursorPos >= 1) { qteCursorPos = 1; qteCursorDir = -1; }
      else if (qteCursorPos <= 0) { qteCursorPos = 0; qteCursorDir = 1; }
      const cursor = document.querySelector('[data-role="crit-cursor"]');
      if (cursor) cursor.style.left = `${qteCursorPos * 100}%`;
      updateQteTimer(b.critWindow.timeLeft / QTE_CRIT_TIME);
      if (b.critWindow.timeLeft <= 0) {
        stopQteLoop();
        resolveCritTimeout();
      }
    } else if (b.parryWindow) {
      b.parryWindow.timeLeft -= dt;
      updateQteTimer(b.parryWindow.timeLeft / QTE_PARRY_TIME);
      if (b.parryWindow.timeLeft <= 0) {
        stopQteLoop();
        resolveParryTimeout();
      }
    } else {
      stopQteLoop();
    }
  }, QTE_TICK_MS);
}

// Общий финиш QTE: победа/поражение и полный render.
function settleQte() {
  stopQteLoop();
  const battle = view.battle;
  if (battle && battle.hp <= 0 && !battle.over) {
    view.summary = finishVictory(state, battle);
  } else if (battle && state.hp <= 0 && !battle.over) {
    view.summary = defeatSummary(state, battle, battle.enemy);
  }

  // Бой продолжается: убираем модалку и обновляем только боевые элементы.
  // Полный render() здесь пересоздавал весь экран и давал заметное моргание.
  if (!view.summary && view.screen === "battle" && battle) {
    document.querySelector(".qte-modal")?.remove();
    renderBattle();
    return;
  }
  render();
}

function resolveCritStop() {
  const battle = view.battle;
  const w = battle && battle.critWindow;
  if (!w) return;
  const pos = qteCursorPos;
  const mult = pos >= 0.42 && pos <= 0.58 ? 1.9 : (pos >= 0.25 && pos <= 0.75 ? 1.6 : 1.3);
  const damage = Math.max(1, Math.round((Number(w.damageBase) || 0) * mult));
  battle.hp = Math.max(0, battle.hp - damage);
  gainEnemyRage(battle);
  battle.critWindow = null;
  battleLog(battle, `Точный удар! (x${mult.toFixed(1)}) — ${damage} урона.`, "crit");
  settleQte();
}

function resolveCritTimeout() {
  const battle = view.battle;
  const w = battle && battle.critWindow;
  if (!w) return;
  const damage = Math.max(1, Math.round(Number(w.damageBase) || 0));
  battle.hp = Math.max(0, battle.hp - damage);
  gainEnemyRage(battle);
  battle.critWindow = null;
  battleLog(battle, `Указатель остановился сам — удар вышел неточным: ${damage} урона.`, "hit");
  settleQte();
}

function resolveParryClick() {
  const battle = view.battle;
  const w = battle && battle.parryWindow;
  if (!w) return;
  const damage = Math.max(1, Math.round((Number(w.damageBase) || 0) * 0.5));
  state.hp = Math.max(0, state.hp - damage);
  battle.rage = Math.min(5, battle.rage + 1);
  battle.parryWindow = null;
  battleLog(battle, `Вы парировали! +1 кураж. Урон снижен до ${damage}.`, "block");
  settleQte();
}

function resolveParryTimeout() {
  const battle = view.battle;
  const w = battle && battle.parryWindow;
  if (!w) return;
  const damage = Math.max(1, Math.round(Number(w.damageBase) || 0));
  state.hp = Math.max(0, state.hp - damage);
  battle.parryWindow = null;
  battleLog(battle, `Парирование не удалось: ${damage} урона.`, "enemy");
  settleQte();
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
    const num = (line.text.match(/\d+/) || ["?"])[0];
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
  // Если после размена открылось окно QTE — нужен полный рендер с модалкой.
  if (battle.critWindow || battle.parryWindow) { render(); return; }
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

  const forecast = document.querySelector('[data-role="battle-forecast"]');
  if (forecast) {
    const mainInst = state.equipped.mainhand ? getInstance(state.equipped.mainhand) : null;
    const currentStyle = state.archetype === "monk" ? battle.monkStance : view.attackStyle;
    forecast.innerHTML = `⚔ ~${estimateDamage(state, battle, view.attackZone, currentStyle, mainInst)} <span style="font-size: 11px; color: var(--dim); margin-left: 6px;">(${STYLE_NAMES[currentStyle]})</span>`;
  }

  const topbar = platform.dom.byId("topbar");
  if (topbar) topbar.innerHTML = topbarHtml(st);

  const prevLog = view.prevLog || 0;
  const newLines = battle.log.length > prevLog ? battle.log.slice(prevLog) : [];
  const logEl = document.querySelector('[data-role="battle-log"]');
  if (logEl) {
    logEl.innerHTML = battle.log.slice(-18).map((entry) => `<div class="log-line ${entry.cls}">${esc(entry.text)}</div>`).join("")
      || `<div class="log-line info">Выберите зону удара и зоны блока, затем нажмите «Размен».</div>`;
    logEl.scrollTop = logEl.scrollHeight;
  }
  view.prevLog = battle.log.length;

  document.querySelector(".dmg-overlay")?.remove();
  const popups = battlePopupsHtml(newLines);
  if (popups) document.body.insertAdjacentHTML("beforeend", popups);
}

function levelUpModalHtml() {
  const level = view.levelUp;
  if (!level) return "";

  return `
    <div class="result-overlay" style="z-index: 200;">
      <div class="result-card levelup-card" data-act="levelup-close" style="cursor: pointer;">
        <h2 style="color: var(--gold2); font-size: 32px; text-shadow: 0 0 20px rgba(223, 184, 108, 0.5);">Новый уровень!</h2>
        <p style="font-size: 18px; margin-bottom: 20px;">Вы достигли <b>${level}</b> уровня.</p>
        
        <div style="font-size: 15px; color: var(--text); margin-bottom: 25px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; border: 1px solid var(--line);">
          Получено <b style="color: var(--gold2);">+3 очка атрибутов</b>.<br>
          <span style="color: var(--dim); font-size: 13px;">Распределите их в меню «Герой».</span>
        </div>
        
        <button class="btn primary big" data-act="levelup-close" type="button" style="width: 100%;">Продолжить</button>
      </div>
    </div>
  `;
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
  if (view.levelUp) html += levelUpModalHtml();
  if (state.activeSceneId && view.screen !== "battle") html += sceneModalHtml();
  if (state.activeNpcId && view.screen !== "battle" && !view.npcInteraction) html += traderDialogHtml();
  if (state.activeEvent && !state.activeNpcId && !state.activeSceneId && view.screen !== "battle") html += renderEventModal(state.activeEvent);
  if (state.activeFloorEvent && !state.activeEvent && !state.activeNpcId && !state.activeSceneId && view.screen !== "battle") html += renderFloorEventModal(state.activeFloorEvent);
  
  if (view.exploreResult) html += exploreResultModalHtml();
  
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
  
  const prevLog = view.prevLog || 0;
  const newLines = view.battle && view.battle.log.length > prevLog ? view.battle.log.slice(prevLog) : [];
  if (view.battle) view.prevLog = view.battle.log.length;
  html += battlePopupsHtml(newLines);
  if (view.screen === "battle" && (!view.battle || view.battle.turn === 0)) view.prevLog = 0;

  // QTE поверх боя: сначала критический удар, затем парирование.
  if (view.screen === "battle" && view.battle && !view.battle.over && !view.summary) {
    if (view.battle.critWindow) html += renderCritModal();
    else if (view.battle.parryWindow) html += renderParryModal();
  }

  // QTE тренировки: модалка живёт поверх экрана Зала Охотников.
  if (view.trainingQTE) html += renderTrainingQte();

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

  updateLocationAudio(view.screen, view.currentFloor, view.battle);
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
  const st = stats();
  if (def && def.id && !state.bestiary[def.id]) { state.bestiary[def.id] = true; saveState(); }
  view.tripActive = true;
  view.battle = createBattle(def, floorId);
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
  view.blocks = ZONES.slice(0, Math.min(st.blockZones, ZONES.length)).map((z) => z.id);
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

function sceneModalHtml() {
  const floor = FLOORS.find((f) => f.id === state.activeSceneFloorId);
  const scene = floor ? (FLOOR_SCENES[floor.id] || []).find((s) => s.id === state.activeSceneId) : null;
  if (!scene) return "";
  const actions = scene.actions.map((a) =>
    `<button class="btn primary" data-act="scene-action" data-action="${a.id}" type="button" style="flex:1; min-width:180px;">${a.label}</button>`
  ).join("");
  return `
    <div class="result-overlay" data-act="scene-backdrop" style="z-index: 190;">
      <div class="result-card">
        <h2 style="color: var(--gold2); font-size: 26px;">🎬 ${scene.title}</h2>
        <p style="font-size: 15px; line-height: 1.55; margin: 15px 0 20px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; border: 1px solid var(--line);">${scene.text}</p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">${actions}</div>
      </div>
    </div>
  `;
}

const NPC_TALK_TARGETS = {
  ron:     { screen: "forge",    tabField: "forgeTab",    shopLabel: "Показать товары" },
  elain:   { screen: "alchemy",  tabField: "alchemyTab",  shopLabel: "Показать товары" },
  elize:   { screen: "jewelry",  tabField: "jewelryTab",  shopLabel: "Показать товары" },
  stella:  { screen: "hotel",    tabField: null,          shopLabel: "Снять номер" },
  ivan:    { screen: "training", tabField: "trainingTab", shopLabel: "Тренировки", shopTab: "train" },
  timmy:   { screen: "training", tabField: "trainingTab", shopLabel: "Спросить совет", shopTab: "train" },
  arthur:  { screen: "market",   tabField: null,          shopLabel: "Показать товары" },
  // Компаньоны: найм идёт через hire-диалоги, а не через лавку.
  mira:    { screen: "hotel",    tabField: null,          shopLabel: "Нанять" },
  alva:    { screen: "hotel",    tabField: null,          shopLabel: "Нанять" },
  solveig: { screen: "hotel",    tabField: null,          shopLabel: "Нанять" },
};

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

const NPC_TALK_PLACE = { ron: "Кузница", elain: "Лавка Алхимика", elize: "Ювелирная лавка", stella: "Гостиница «Усталый путник»", ivan: "Зал Охотников", timmy: "Зал Охотников", arthur: "Торговая площадь", mira: "Гостиница «Усталый путник»", alva: "Гостиница «Усталый путник»", solveig: "Гостиница «Усталый путник»" };
function firstMeetModalHtml(npcId) {
  const set = DIALOGS[npcId];
  if (!set || !set.story) return "";
  
  const index = state.npcDialogueIndex[npcId] || 0;
  const met = set.story[index];
  if (!met) return "";
  
  return `
    <div class="result-overlay" style="z-index: 195;">
      <div class="result-card" style="max-width: 550px; text-align: left;">
        <div style="display:flex; gap:15px; align-items:center; margin-bottom: 15px;">
          <img src="${npcPortraitSrc(npcId)}" alt="" style="width:64px; height:64px; border-radius:10px; border:1px solid var(--gold); object-fit:cover;" onerror="this.outerHTML='<b style=font-size:40px>🧙</b>'">
          <div>
            <h3 style="margin:0; color:var(--gold2); font-size: 18px;">${NPC_NAMES[npcId].split(",")[0]}</h3>
            <span class="hint">Диалог</span>
          </div>
        </div>
        
        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--line); border-radius: 10px; padding: 15px; margin-bottom: 20px;">
          <p style="color: #e2e8f0; font-style: italic; margin-bottom: 12px; line-height: 1.5;">«${esc(genderText(met.npc))}»</p>
          <p style="color: var(--gold2); font-weight: bold; line-height: 1.5;">Вы: «${esc(genderText(met.player))}»</p>
        </div>

        <button class="btn primary" data-act="story-choice" data-npc="${npcId}" type="button" style="width: 100%;">Продолжить</button>
        <button class="btn ghost" data-act="npc-talk-topics" data-npc="${npcId}" data-from="meet" type="button" style="width: 100%; margin-top: 8px;">Поболтать</button>
      </div>
    </div>
  `;
}
// ── Единая state machine общения с NPC ───────────────────────────────────────
// view.npcInteraction = { npcId, mode: "dialog" | "trade" | "craft", node }
// Это единственный источник истины: старые talkNpc/tradeMode удалены.
const MNB_TRADE_NPCS = { ron: "forge", elain: "alchemy", elize: "jewelry", arthur: "market" };
const MNB_CRAFT_NPCS = { ron: "forge", elain: "alchemy", elize: "jewelry" };
// Виртуальный узел диалога для списка тем: не хранится в DIALOG_TREES,
// а собирается из DIALOG_BRANCHES прямо в диалоговом окне.
const DIALOG_TOPICS_NODE = "lore_menu";

function startNpcInteraction(npcId, node = "start") {
  const comp = COMPANION_MAP[npcId];
  view.hiringCompanion = comp ? comp.id : null;
  view.tradeFilter = "all";
  view.tradeSubFilter = "all";
  view.npcInteraction = {
    npcId,
    mode: "dialog",
    node: comp ? (comp.hireDialog || `hire_${comp.id}`) : node,
  };
  view.timmyTip = null;
}

function closeNpcInteraction() {
  view.npcInteraction = null;
  view.hiringCompanion = null;
}

function interactionNode(npcId) {
  const tree = DIALOG_TREES[npcId];
  if (!tree) return null;
  const current = view.npcInteraction;
  const nodeId = current && current.npcId === npcId && current.node && tree[current.node]
    ? current.node
    : (current && current.npcId === npcId && current.node === DIALOG_TOPICS_NODE ? DIALOG_TOPICS_NODE : "start");
  if (nodeId === DIALOG_TOPICS_NODE) return dialogTopicsNode(npcId);
  let node = tree[nodeId] || tree.start;
  if (node && node.requires && !dialogRequiresMet(node.requires)) node = tree.start;
  return node;
}

// Возврат из торговли/крафта в диалог с сохранением текущей реплики.
function interactionBackToDialog() {
  if (!view.npcInteraction) return;
  view.npcInteraction.mode = "dialog";
  if (!view.npcInteraction.node) view.npcInteraction.node = "start";
}

// «Открыть услугу» (гостиница/тренировки): закрывает диалог и уводит на экран.
function openDialogShop(npcId) {
  const target = NPC_TALK_TARGETS[npcId];
  const screen = target?.screen || (npcId === "timmy" ? "training" : npcId === "arthur" ? "market" : null);
  if (!screen) {
    toast("Здесь нечем торговать.", "warn");
    return;
  }
  if (isNight() && ["forge", "alchemy", "jewelry", "training"].includes(screen)) {
    toast("Ночью эта локация закрыта. Дождитесь утра.", "warn");
    return;
  }
  const phrase = getRandomPhrase(npcId, "shop_open");
  if (phrase) toast(phrase, "ok");
  closeNpcInteraction();
  if (target?.tabField) view[target.tabField] = target.shopTab || "quests";
  go(screen);
}

// action: "open_trade" — переключаем режим, узел диалога сохраняется.
function openDialogTrade(npcId) {
  if (!MNB_TRADE_NPCS[npcId]) {
    toast("Здесь нечем торговать.", "warn");
    return;
  }
  if (!view.npcInteraction || view.npcInteraction.npcId !== npcId) {
    startNpcInteraction(npcId, "start");
  }
  view.hiringCompanion = null;
  view.npcInteraction.mode = "trade";
  if (npcId === "arthur" && !view.traderStock) view.traderStock = getTraderInventory();
  render();
}

// action: "open_craft" — тот же узел, но режим крафта.
function openDialogCraft(npcId) {
  if (!MNB_CRAFT_NPCS[npcId]) {
    toast("Здесь нечего создавать.", "warn");
    return;
  }
  if (!view.npcInteraction || view.npcInteraction.npcId !== npcId) {
    startNpcInteraction(npcId, "start");
  }
  view.hiringCompanion = null;
  view.npcInteraction.mode = "craft";
  render();
}

function mnbNpcGold(npcId) {
  const seed = { ron: 800, elain: 600, elize: 1000, arthur: 1200 }[npcId] || 500;
  return seed + Math.max(0, (state.maxFloor || 1) - 1) * 100;
}

function mnbNpcGoods(npcId) {
  if (npcId === "arthur") {
    if (!view.traderStock) view.traderStock = getTraderInventory();
    return (view.traderStock || []).map((entry) => {
      const item = entry.kind === "gear" ? ITEMS[entry.inst?.id] : ITEMS[entry.id];
      const name = entry.kind === "gear" && entry.inst ? getItemDisplayName(entry.inst) : entry.name;
      return {
        key: entry.kind === "gear" ? entry.uid : entry.id,
        name: name || item?.name || "Товар",
        icon: item?.icon || entry.icon || "❔",
        price: entry.price,
        canBuy: state.gold >= entry.price,
        item,
        inst: entry.kind === "gear" ? entry.inst : null,
        category: tradeItemCategory(item),
      };
    });
  }

  const shopName = { ron: "forge", elain: "alchemy", elize: "jewelry" }[npcId];
  if (!shopName) return [];

  const slots = npcId === "ron"
    ? new Set(["mainhand", "offhand", "head", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet"])
    : npcId === "elize"
      ? new Set(["neck", "ring", "trinket"])
      : null;

  let pool = Object.values(ITEMS).filter((item) => {
    if (!item.price || item.price <= 0) return false;
    if (npcId === "elain") return item.slot === "potion";
    return item.slot && slots.has(item.slot) && shopFloorFor(item) <= state.maxFloor;
  });

  if (npcId === "elain") pool.sort((a, b) => (a.price || 0) - (b.price || 0));
  else pool.sort((a, b) => (a.price || 0) - (b.price || 0));

  return pool.map((item) => {
    const priced = priceFor(item, shopName);
    return {
      key: item.id,
      name: item.name,
      icon: item.icon,
      price: priced.price,
      canBuy: state.gold >= priced.price,
      item,
      inst: null,
      category: tradeItemCategory(item),
    };
  });
}

function mnbPlayerGoods(npcId) {
  const rows = [];
  const jewelrySlots = new Set(["neck", "ring", "trinket"]);
  const acceptsPotions = npcId === "elain" || npcId === "arthur";
  const acceptsGear = npcId !== "elain";

  if (acceptsPotions) {
    Object.values(ITEMS)
      .filter((item) => item.type === "potion" && (state.potions[item.id] || 0) > 0)
      .forEach((item) => {
        rows.push({
          key: item.id,
          kind: "potion",
          name: `${item.name} ×${state.potions[item.id]}`,
          icon: item.icon,
          price: sellPrice(item),
          item,
          inst: null,
          category: "consumable",
        });
      });
  }

  if (acceptsGear) {
    state.owned.filter((inst) => !isEquipped(inst.uid)).forEach((inst) => {
      const item = ITEMS[inst.id];
      if (!item || item.type === "potion" || !item.slot) return;
      const isJewelry = jewelrySlots.has(item.slot);
      if (npcId === "ron" && isJewelry) return;
      if (npcId === "elize" && !isJewelry) return;
      rows.push({
        key: inst.uid,
        kind: "gear",
        name: getItemDisplayName(inst),
        icon: item.icon,
        price: sellPrice(item, inst),
        item,
        inst,
        category: tradeItemCategory(item),
      });
    });
  }

  return rows;
}

const TRADE_FILTERS = [
  { id: "all", name: "Все" },
  { id: "weapon", name: "Оружие" },
  { id: "armor", name: "Броня" },
  { id: "consumable", name: "Расходники" },
];
// Подкатегории: показываются только для оружия и брони.
const TRADE_SUBFILTERS = {
  weapon: [
    { id: "all", name: "Все" },
    { id: "sword", name: "Мечи" },
    { id: "axe", name: "Топоры" },
    { id: "mace", name: "Молоты" },
    { id: "spear", name: "Копья" },
  ],
  armor: [
    { id: "all", name: "Все" },
    { id: "cloth", name: "Ткань" },
    { id: "leather", name: "Кожа" },
    { id: "chain", name: "Кольчуга" },
    { id: "plate", name: "Латы" },
  ],
};
const TRADE_ARMOR_SLOTS = new Set(["head", "neck", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet", "ring", "trinket"]);

function tradeItemCategory(item) {
  if (!item) return "all";
  if (item.slot === "potion" || item.type === "potion") return "consumable";
  if (item.slot === "mainhand" || item.slot === "offhand") return "weapon";
  if (TRADE_ARMOR_SLOTS.has(item.slot)) return "armor";
  return "all";
}

// Надетый экземпляр в том же слоте (для кольца/аксессуара проверяем ring1/ring2).
function tradeEquippedInstance(item) {
  if (!item || !item.slot) return null;
  const direct = state.equipped[item.slot];
  if (direct) return getInstance(direct);
  for (const slot of slotsForItem(item)) {
    const inst = getInstance(state.equipped[slot]);
    if (inst) return inst;
  }
  return null;
}

// Тултип предмета: без надетой альтернативы — обычная карточка, с ней —
// два блока рядом (магазинный слева, надетый справа).
function renderTradeTooltip(item, equippedItem = null) {
  if (!item) return "";
  if (!equippedItem) return itemTooltipHtml(item);
  const equippedInst = equippedItem;
  const equippedDef = equippedItem.item || ITEMS[equippedItem.id];
  if (!equippedDef) return itemTooltipHtml(item);
  return `<div class="tooltip-compare-container">
    <div class="tooltip-item"><div class="tt-source">Магазинный</div>${itemTooltipHtml(item)}</div>
    <div class="tooltip-item"><div class="tt-source">Надетый</div>${itemTooltipHtml(equippedDef, equippedInst)}</div>
  </div>`;
}

function tradeFilterPanelHtml() {
  const active = view.tradeFilter || "all";
  const main = `<div class="mnb-trade-filters">
    ${TRADE_FILTERS.map((f) => `<button class="shop-tab${active === f.id ? " active" : ""}" data-act="trade-filter" data-filter="${f.id}" type="button">${f.name}</button>`).join("")}
  </div>`;
  return main + tradeSubFilterPanelHtml();
}

// Подфильтры «Мечи/Топоры/...» и «Ткань/Кожа/...» — вторая строка под основной панелью.
function tradeSubFilterPanelHtml() {
  const filter = view.tradeFilter || "all";
  const subs = TRADE_SUBFILTERS[filter];
  if (!subs) return "";
  const active = view.tradeSubFilter || "all";
  return `<div class="mnb-trade-filters mnb-trade-subfilters">
    ${subs.map((f) => `<button class="shop-tab${active === f.id ? " active" : ""}" data-act="trade-sub-filter" data-filter="${f.id}" type="button">${f.name}</button>`).join("")}
  </div>`;
}

function mnbTradeItemHtml(entry, npcId, side) {
  const act = side === "left" ? "mnb-trade-buy" : "mnb-trade-sell";
  const disabled = side === "left" && entry.canBuy === false ? " disabled" : "";
  const kind = entry.kind ? ` data-kind="${esc(entry.kind)}"` : "";
  const priceText = side === "left" && entry.canBuy === false ? `Нужно ${entry.price}` : `${entry.price} 💰`;
  const item = entry.item || ITEMS[entry.key] || null;
  const tooltip = side === "left"
    ? renderTradeTooltip(item, tradeEquippedInstance(item))
    : (item ? itemTooltipHtml(item, entry.inst || null) : "");
  const tooltipAttr = tooltip ? ` data-tooltip="${esc(tooltip)}"` : "";
  return `<div class="mnb-trade-item${disabled}" data-act="${act}" data-npc="${npcId}" data-key="${esc(entry.key)}"${kind}${tooltipAttr} role="button" tabindex="0">
    <span class="mnb-trade-item-name">${iconHtml(entry.icon, 22)}<span>${esc(entry.name)}</span></span>
    <span class="mnb-trade-item-price">${priceText}</span>
  </div>`;
}

function mnbTradeHtml(npcId) {
  const npcName = NPC_NAMES[npcId] || npcId;
  const filter = view.tradeFilter || "all";
  const sub = view.tradeSubFilter || "all";
  const typeKey = filter === "weapon" ? "weaponType" : filter === "armor" ? "armorType" : null;
  const matches = (entry) => {
    if (filter !== "all" && entry.category !== filter) return false;
    if (sub === "all" || !typeKey) return true;
    const item = entry.item || ITEMS[entry.key];
    return !!item && item[typeKey] === sub;
  };
  const npcGoods = mnbNpcGoods(npcId).filter(matches);
  const playerGoods = mnbPlayerGoods(npcId).filter(matches);
  const leftHtml = npcGoods.length
    ? npcGoods.map((entry) => mnbTradeItemHtml(entry, npcId, "left")).join("")
    : `<div class="mnb-trade-empty">Под этот фильтр товаров нет.</div>`;
  const rightHtml = playerGoods.length
    ? playerGoods.map((entry) => mnbTradeItemHtml(entry, npcId, "right")).join("")
    : `<div class="mnb-trade-empty">Под этот фильтр нечего продать.</div>`;

  return `${tradeFilterPanelHtml()}
  <div class="mnb-trade-wrapper" data-npc="${npcId}">
    <div class="mnb-trade-col left">
      <div class="mnb-trade-col-title">Товары · ${esc(npcName.split(",")[0])}</div>
      ${leftHtml}
    </div>
    <div class="mnb-trade-col center">
      ${tradeDollHtml()}
      <div class="mnb-trade-gold">Ваше золото: <b>${Math.floor(state.gold || 0)}</b> 💰</div>
      <button class="btn mnb-trade-close" data-act="interaction-back" type="button">← Назад к разговору</button>
    </div>
    <div class="mnb-trade-col right">
      <div class="mnb-trade-col-title">Ваши товары</div>
      ${rightHtml}
    </div>
  </div>`;
}

function mnbTradePageHtml(npcId) {
  return `<div class="mnb-trade-page">
      ${mnbTradeHtml(npcId)}
    </div>`;
}

// ── Крафт в том же трёхколоночном стиле, что и торговля ─────────────────────
function mnbCraftRowsHtml(station) {
  const known = new Set(Array.isArray(state.knownRecipes) ? state.knownRecipes : []);
  const recipes = getRecipes(station).filter((recipe) => known.has(recipe.id));
  if (!recipes.length) {
    return `<div class="mnb-trade-empty">Вы ещё не нашли ни одного рецепта. Побеждайте мобов и боссов Башни — с них выпадают чертежи.</div>`;
  }
  return recipes.map((recipe) => {
    const item = ITEMS[recipe.result];
    const copies = copiesOf(recipe.result);
    const enough = Object.entries(recipe.materials).every(([resId, need]) => (state.resources[resId] || 0) >= need);
    const countChip = copies.length ? `<span class="chip ok">В сумке: ${copies.length}</span>` : "";
    return `<article class="mnb-craft-row${enough ? "" : " lack"}">
      <div class="mnb-craft-icon">${iconHtml(item ? item.icon : "❔", 30)}</div>
      <div class="mnb-craft-main">
        <div class="mnb-craft-name">${esc(recipe.desc)}</div>
        <div class="mnb-craft-materials">${materialChipHtmlEx(recipe.materials)}${countChip}</div>
      </div>
      <button class="btn mnb-craft-btn" data-act="craft" data-id="${recipe.id}" ${enough ? "" : "disabled"} type="button">Создать</button>
    </article>`;
  }).join("");
}

function mnbCraftMaterialsHtml(station) {
  const known = new Set(Array.isArray(state.knownRecipes) ? state.knownRecipes : []);
  const recipes = getRecipes(station).filter((recipe) => known.has(recipe.id));
  const ids = [];
  for (const recipe of recipes) {
    for (const resId of Object.keys(recipe.materials)) if (!ids.includes(resId)) ids.push(resId);
  }
  if (!ids.length) return `<div class="mnb-trade-empty">Материалов пока нет.</div>`;
  const visible = ids.filter((resId) => (state.resources[resId] || 0) > 0);
  return (visible.length ? visible : ids).map((resId) => {
    const res = ALL_RESOURCES.find((r) => r.id === resId);
    return `<div class="mnb-craft-res"><span>${iconHtml(res ? res.icon : "❔", 18)} ${esc(res ? res.name : resId)}</span><b>${state.resources[resId] || 0}</b></div>`;
  }).join("");
}

function mnbCraftHtml(npcId) {
  const station = MNB_CRAFT_NPCS[npcId];
  return `<div class="mnb-trade-wrapper mnb-craft-wrapper" data-npc="${npcId}">
    <div class="mnb-trade-col left">
      <div class="mnb-trade-col-title">Материалы</div>
      ${mnbCraftMaterialsHtml(station)}
    </div>
    <div class="mnb-trade-col center">
      <img class="trade-npc-portrait" src="assets/misc/anvil.webp" alt="Наковальня" onerror="this.style.display='none'">
      <button class="btn mnb-trade-close" data-act="interaction-back" type="button">← Назад к разговору</button>
    </div>
    <div class="mnb-trade-col right">
      <div class="mnb-trade-col-title">Рецепты · Крафт</div>
      ${mnbCraftRowsHtml(station)}
    </div>
  </div>`;
}

// Экран лавки целиком: либо диалог, либо торговля, либо крафт. Товарный UI
// в этих режимах не рендерится вообще, поэтому кнопки не перекрывают пергамент.
const SHOP_INTERACTION_META = {
  forge: { npcId: "ron", title: "Кузница", subtitle: "Оружие и броня" },
  alchemy: { npcId: "elain", title: "Лавка Алхимика", subtitle: "Зелья и травы" },
  jewelry: { npcId: "elize", title: "Ювелирная лавка", subtitle: "Тонкая работа" },
};

function shopInteractionPageHtml(npcId, screen) {
  const current = view.npcInteraction;
  if (!current || current.npcId !== npcId) return "";
  const node = interactionNode(npcId);
  if (!node) return "";
  const meta = SHOP_INTERACTION_META[screen] || { title: "Лавка", subtitle: "" };

  let body;
  if (current.mode === "trade") {
    body = mnbTradePageHtml(npcId);
  } else if (current.mode === "craft") {
    body = `<div class="mnb-trade-page">
        <div class="mnb-trade-page-head"><h2>Крафт</h2><span class="hint">${esc(NPC_NAMES[npcId] || npcId)}</span></div>
        ${mnbCraftHtml(npcId)}
      </div>`;
  } else {
    body = dialogSceneHtml(npcId, node);
  }

  const bg = ["forge", "alchemy", "jewelry"].includes(screen) ? screen : "hub";
  // В торговле верхняя шапка лавки заменяется единым заголовком над фильтрами.
  const isTrade = current.mode === "trade";
  const headTitle = isTrade ? `Торговля · ${NPC_NAMES[npcId] || npcId}` : meta.title;
  const headSubtitle = isTrade ? "" : meta.subtitle;
  return `<div class="screen-bg" style="background-image: url('assets/backgrounds/${bg}.webp');"><div class="bg-overlay"></div></div>
    ${subHeader(headTitle, headSubtitle, "market", "← Назад")}
    <div class="mnb-interaction-page">${body}</div>`;
}

// Для NPC вне лавок (площадь, гостиница, Зал) диалог/торговля/крафт
// показываются модальным слоем поверх текущего экрана.
function interactionOverlayHtml(npcId) {
  const current = view.npcInteraction;
  if (!current || current.npcId !== npcId) return "";
  const node = interactionNode(npcId);
  if (!node) return "";

  if (current.mode === "dialog") return dialogSceneHtml(npcId, node, { modal: true });

  const head = `<div class="mnb-interaction-modal-head"><h2>${current.mode === "craft" ? "Крафт" : "Торговля"}</h2><span class="hint">${esc(NPC_NAMES[npcId] || npcId)}</span></div>`;
  const body = current.mode === "craft" ? mnbCraftHtml(npcId) : mnbTradeHtml(npcId);
  return `<div class="result-overlay mnb-interaction-overlay" data-act="npc-talk-backdrop" style="z-index: 185;">
      <div class="mnb-interaction-modal" data-act="interaction-noop">${head}${body}</div>
    </div>`;
}

// ── Подтверждение покупки ──────────────────────────────────────────────────
// Модалка поверх торговли: покупка происходит только после «Купить».
function renderPurchaseConfirmModal() {
  const pc = view.purchaseConfirm;
  if (!pc) return "";
  return `<div class="result-overlay purchase-confirm-overlay" data-act="cancel-buy" style="z-index: 200;">
    <div class="result-card confirm-modal" data-act="interaction-noop" role="dialog" aria-modal="true" aria-labelledby="purchase-confirm-title">
      <h2 id="purchase-confirm-title">Подтверждение</h2>
      <p class="confirm-text">Вы уверены, что хотите купить <b>${esc(pc.name)}</b> за <b>${pc.price} 💰</b>?</p>
      <div class="confirm-actions">
        <button class="btn primary" data-act="confirm-buy" type="button">Купить</button>
        <button class="btn ghost" data-act="cancel-buy" type="button">Отмена</button>
      </div>
    </div>
  </div>`;
}

// Приоритеты кнопок диалога: главные действия всегда сверху, «Уйти» — снизу.
// 1 — торговля, 2 — крафт, 3 — задания, 5 — обычные темы (лор, похвала,
// оскорбления), 8 — «Поболтать», 10 — выход из диалога.
// Похвала и оскорбление имеют 3-дневный кулдаун на каждого NPC.
function dialogOptionCooldownTag(opt) {
  const label = String(opt?.label || "").toLowerCase();
  const flag = String(opt?.effects?.flag || "");
  const rep = Number(opt?.effects?.rep);
  const positive = Number.isFinite(rep) && rep > 0;
  const negative = Number.isFinite(rep) && rep < 0;
  if ((opt?.next === "insult" && negative) || flag.endsWith("_insulted") || label.includes("ты хлам") || label.includes("оскорб")) return "insult";
  if ((opt?.next === "praise" && positive) || flag.endsWith("_praised") || label.includes("ты лучший")) return "praise";
  return null;
}

function dialogOptionOnCooldown(npcId, opt) {
  const tag = dialogOptionCooldownTag(opt);
  if (!tag) return false;
  const last = Number(state.dialogCooldowns?.[`${npcId}_${tag}`]);
  if (!Number.isFinite(last)) return false;
  return (state.day - last) < 3;
}

function getOptionPriority(opt) {
  const label = String(opt?.label || "").toLowerCase();
  if (opt?.action === "open_shop" || opt?.action === "open_trade" || label.includes("показать товары")) return 1;
  if (opt?.action === "open_craft" || label.includes("крафт")) return 2;
  if (opt?.action === "open_quests" || label.includes("взять задание") || label.includes("задания") || label.includes("сюжет") || opt?.next === "story_offer") return 3;
  if (label.includes("поболтать") || opt?.next === DIALOG_TOPICS_NODE) return 8;
  if (opt?.next === null) return 10;
  return 5;
}

function dialogOptionsHtml(npcId, node, extras = []) {
  // Скрытые опции (requires) не показываем, но сохраняем исходный индекс:
  // обработчик dialog-option ищет опцию по data-option в полном массиве.
  const entries = (node.options || [])
    .map((opt, index) => ({ opt, index }))
    .filter(({ opt }) => dialogRequiresMet(opt.requires) && !dialogOptionOnCooldown(npcId, opt));

  const isLeave = ({ opt }) => String(opt.label || "").includes("Уйти");
  const optionHtml = ({ opt, index }) => {
    const moodClass = opt.mood === "good" ? " mood-good" : opt.mood === "bad" ? " mood-bad" : " mood-neutral";
    return `<button class="btn dialog-option mnb-option-btn${moodClass}" data-act="dialog-option" data-npc="${npcId}" data-option="${index}" data-index="${index}" type="button">${esc(genderText(opt.label))}</button>`;
  };

  // «Уйти» всегда ровно одна кнопка и всегда последняя в списке.
  // Запасную «Уйти» добавляем только в корневом узле: в остальных узлах
  // навигация идёт через «← Назад», а не через выход из диалога.
  const regular = entries.filter((entry) => !isLeave(entry));
  const leave = entries.filter(isLeave).slice(-1)[0];
  // Сортируем стабильно: при равном приоритете сохраняется исходный порядок
  // из data.js (order = индекс опции), а динамические кнопки идут после них.
  const rows = [
    ...regular.map((entry) => ({ priority: getOptionPriority(entry.opt), order: entry.index, html: optionHtml(entry) })),
    ...extras.map((entry, i) => ({ priority: entry.priority, order: 1000 + i, html: entry.html })),
  ].sort((a, b) => a.priority - b.priority || a.order - b.order);
  const html = rows.map((row) => row.html);
  const tree = DIALOG_TREES[npcId];
  const isRoot = !tree || node === tree.start;
  if (leave) html.push(optionHtml(leave));
  else if (isRoot) html.push(`<button class="btn dialog-option mnb-option-btn mood-neutral" data-act="npc-talk-close" data-npc="${npcId}" type="button">Уйти</button>`);
  return html.join("");
}

function dialogActionParts(npcId) {
  ensureWeekQuests();
  const q = state.weekQuests.list.find((x) => x.npc === npcId);
  let questButton = "";
  if (q) {
    if (q.status === "offered") questButton = `<button class="btn mnb-option-btn" data-act="npc-talk-quest" data-npc="${npcId}" type="button">Взять задание</button>`;
    else if (q.status === "active") questButton = `<button class="btn mnb-option-btn" disabled type="button">Задание в работе</button>`;
    else if (q.status === "done") questButton = `<button class="btn mnb-option-btn" data-act="claim-npc-quest" data-id="${q.id}" type="button">Сдать задание</button>`;
  }
  const topicsButton = DIALOG_BRANCHES[npcId] && DIALOG_BRANCHES[npcId].length
    ? `<button class="btn mnb-option-btn" data-act="npc-talk-topics" data-npc="${npcId}" type="button">Поболтать</button>`
    : "";

  // Сдача сюжетного задания тоже идёт через диалог: отдельной панели «Сюжет» больше нет.
  let storyActionBtn = "";
  const storyEntry = activeStoryQuestForNpc(npcId);
  if (storyEntry) {
    const def = STORY_QUEST_MAP[storyEntry.id];
    if (def) {
      const { progress, target } = storyQuestProgress(storyEntry);
      storyActionBtn = progress >= target
        ? `<button class="btn mnb-option-btn" data-act="claim-story-quest" data-id="${storyEntry.id}" type="button">📜 Сдать: ${esc(def.title)}</button>`
        : `<button class="btn mnb-option-btn" disabled type="button">📜 В работе: ${esc(def.title)} (${progress}/${target})</button>`;
    }
  }

  return { questButton, topicsButton, storyActionBtn };
}

function dialogTopicsNode() {
  return { topicsMenu: true, text: "О чём поговорим?", options: [] };
}

// Список тем живёт внутри того же диалогового окна, без отдельной модалки.
function dialogTopicsHtml(npcId) {
  const topics = DIALOG_BRANCHES[npcId] || [];
  const seen = state.dialogTopicsSeen || {};
  const shownReply = view.topicReply && view.topicReply.npc === npcId ? view.topicReply : null;
  const rows = topics.map((topic) => {
    const open = topicAvailable(topic, npcId);
    const fresh = !seen[npcId + ":" + topic.id];
    const lockHint = open
      ? (fresh ? " · новое" : "")
      : (Number.isFinite(topic.minRep) && topicNpcRep(npcId) < topic.minRep
        ? ` · 🔒 нужно отношение ${topic.minRep}`
        : ` · 🔒 нужен этаж ${topic.minFloor}`);
    return `<button class="btn mnb-option-btn${open ? "" : " mood-neutral"}" data-act="topic-open" data-npc="${npcId}" data-topic="${topic.id}" ${open ? "" : "disabled"} type="button" style="text-align:left;">
      ${esc(topic.title)}${lockHint ? `<span class="hint">${lockHint}</span>` : ""}
    </button>`;
  }).join("");

  const reply = shownReply
    ? `<div class="mnb-topic-reply"><p>«${esc(shownReply.reply)}»</p><span class="hint">${esc((DIALOG_BRANCHES[npcId] || []).find((t) => t.id === shownReply.topic)?.title || "")}</span></div>`
    : "";

  return `${reply}<div class="mnb-topic-list">${rows}</div>
    <button class="btn mnb-option-btn" data-act="dialog-topics-back" data-npc="${npcId}" type="button">← Назад</button>`;
}

// Единая кинематографичная сцена диалога: портрет слева, реплика и варианты
// ответов справа. Используется и в полосе лавки, и в модальном окне.
function dialogSceneHtml(npcId, node, { modal = false } = {}) {
  const npcName = NPC_NAMES[npcId] || npcId;
  const mood = state.npcMood?.[npcId];
  const moodLabel = mood === "good" ? "расположен" : mood === "bad" ? "недоволен" : "";
  const nodeText = node.tip === "timmy" ? (view.timmyTip || randomTimmyTip()) : node.text;
  const { questButton, topicsButton, storyActionBtn } = dialogActionParts(npcId);
  // Кнопки, которые не лежат в node.options, участвуют в общей сортировке:
  // задания — приоритет 3, «Поболтать» — 8.
  const actionExtras = [
    ...(storyActionBtn ? [{ html: storyActionBtn, priority: 3 }] : []),
    ...(questButton ? [{ html: questButton, priority: 3 }] : []),
    ...(topicsButton ? [{ html: topicsButton, priority: 8 }] : []),
  ];
  const bottomHtml = node.topicsMenu
    ? dialogTopicsHtml(npcId)
    : dialogOptionsHtml(npcId, node, actionExtras);

  // Универсальный диалог в духе Mount & Blade: слева портрет, справа
  // пергамент с репликой, снизу — вертикальный список вариантов.
  const scene = `
    <div class="mnb-dialog-wrapper" data-act="interaction-noop">
      <div class="mnb-dialog-top">
        <img class="mnb-portrait" src="${npcPortraitSrc(npcId)}" alt="${esc(npcName)}" onerror="this.outerHTML='<b style=font-size:72px>🧙</b>'">
        <div class="mnb-parchment">
          <div class="mnb-npc-name">${esc(npcName)}${moodLabel ? ` · ${moodLabel}` : ""}</div>
          <div class="mnb-text">«${esc(genderText(nodeText || ""))}»</div>
        </div>
        <img class="mnb-portrait mnb-hero-portrait" src="${portraitSrc(state.portrait)}" alt="${esc(state.name)}" onerror="this.outerHTML='<b style=font-size:72px>🧍</b>'">
      </div>
      <div class="mnb-dialog-bottom">
        ${bottomHtml}
      </div>
    </div>
  `;
  if (!modal) return scene;
  return `<div class="result-overlay mnb-dialog-overlay" data-act="npc-talk-backdrop" style="z-index: 184;">${scene}</div>`;
}

function traderDialogHtml() {  const npc = NPCS[state.activeNpcId];
  if (!npc) return "";

  const storyIndex = state.npcDialogueIndex[npc.id] || 0;
  const storyArr = DIALOGS[npc.id]?.story;
  
  // Если магазин уже открыт, мы игнорируем слайды и показываем товары
  const currentSlide = (!view.npcShopOpen && !view.storyJustPlayed && Array.isArray(storyArr)) ? storyArr[storyIndex] : null;

  const portrait = `<img src="${npcPortraitSrc(npc.portrait)}" alt="${npc.name}" style="width:84px; height:84px; flex:0 0 84px; border-radius:12px; object-fit:cover; border:1px solid var(--gold); background:#1c1511;" onerror="this.outerHTML='<b style=font-size:52px>🧙</b>'">`;

  if (currentSlide) {
    const optionsHtml = currentSlide.options.map((opt, idx) => 
      `<button class="btn primary" data-act="story-choice-trader" data-npc="${npc.id}" data-choice="${idx}" type="button" style="margin-bottom: 8px; text-align: left; width: 100%;">${esc(genderText(opt.text))}</button>`
    ).join("");

    return `
      <div class="result-overlay" style="z-index: 185;">
        <div class="result-card" style="max-width: 550px; text-align: left;">
          <div style="display:flex; gap:15px; align-items:center; margin-bottom: 15px;">
            ${portrait}
            <div>
              <h2 style="color:var(--gold2); font-size:22px; margin:0;">${npc.name}</h2>
            </div>
          </div>
          
          <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--line); border-radius: 10px; padding: 15px; margin-bottom: 20px;">
            <p style="color: #e2e8f0; font-style: italic; line-height: 1.5;">«${esc(genderText(currentSlide.npc))}»</p>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${optionsHtml}
            <button class="btn ghost" data-act="npc-action" data-npc-action="leave" type="button" style="align-self: flex-start; margin-top: 8px;">Уйти</button>
          </div>
        </div>
      </div>
    `;
  }

  let shopHtml = "";
  if (view.npcShopOpen) {
    const rows = (view.traderStock || []).map((entry) => {
      const label = entry.kind === "gear"
        ? `${ITEMS[entry.inst.id].name}` 
        : `${entry.icon} ${entry.name}`;
      const afford = state.gold >= entry.price;
      return `<div class="trader-row">
        <span class="trader-row-label">${label}</span>
        <b class="trader-row-price">${entry.price} 💰</b>
        <div class="trader-row-actions">
          <button class="btn small ghost" data-act="npc-action" data-npc-action="steal" data-id="${entry.kind === "gear" ? entry.uid : entry.id}" type="button" title="Шанс зависит от Ловкости. Провал: страж заберёт 20% золота и выставит за дверь.">🫳 Украсть</button>
          <button class="btn small primary" data-act="npc-action" data-npc-action="buy" data-id="${entry.kind === "gear" ? entry.uid : entry.id}" ${afford ? "" : "disabled"} type="button">Купить</button>
        </div>
      </div>`;
    }).join("");
    shopHtml = `
      <div style="display:flex; flex-direction:column; gap:8px; margin:15px 0 8px;">${rows}</div>
      <p style="color:var(--dim); font-size:12px; margin:0 0 15px;">Цены странствующего: базовая ×3. У вас: <b style="color:var(--gold2);">${state.gold} 💰</b></p>`;
  }

  const options = Array.isArray(npc.options) ? npc.options : [];
  const buttonsHtml = options.map((opt) => {
    const primary = opt.id === "show-goods";
    return `<button class="btn${primary ? " primary" : " ghost"}" data-act="npc-action" data-npc-action="${opt.id}" type="button">${esc(opt.label)}</button>`;
  }).join("") || `<button class="btn ghost" data-act="npc-action" data-npc-action="leave" type="button">🚶 Уйти</button>`;

  return `
    <div class="result-overlay" data-act="npc-backdrop" style="z-index: 185;">
      <div class="result-card">
        <div style="display:flex; gap:15px; align-items:center; text-align:left;">
          ${portrait}
          <div>
            <h2 style="color:var(--gold2); font-size:22px; margin:0 0 8px;">${npc.name}</h2>
            <p style="color:var(--dim); font-size:14px; margin:0; line-height:1.5;">${npc.text}</p>
          </div>
        </div>
        ${shopHtml}
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top: 15px;">
          ${buttonsHtml}
        </div>
      </div>
    </div>
  `;
}
function talentsModalHtml() {
  return `
    <div class="settings-backdrop" data-act="talents-close"></div>
    <div class="settings-modal talents-modal" role="dialog" aria-label="Таланты">
      <div class="settings-head">
        <h3>🌟 Таланты</h3>
        <button class="settings-close" data-act="talents-close" type="button">✕</button>
      </div>
      <div class="talents-modal-body">${talentsHtml()}</div>
    </div>
  `;
}
function titleModalHtml() {
  const titles = unlockedTitles(state);
  const current = state.currentTitle || null;
  const rows = titles.map((ach) => {
    const active = ach.title === current;
    return `<button class="title-option${active ? " active" : ""}" data-act="title-pick" data-title="${esc(ach.title)}" type="button">
      <span class="title-option-icon">${ach.icon}</span>
      <span class="title-option-body">
        <span class="title-option-name">${esc(ach.title)}</span>
        <span class="title-option-desc">${esc(ach.desc)}</span>
      </span>
      ${active ? `<span class="title-option-check">✓</span>` : ""}
    </button>`;
  }).join("");

  return `
    <div class="result-overlay" data-act="title-close" style="z-index: 186;">
      <div class="result-card title-modal">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom: 14px;">
          <h2 style="color: var(--gold2); font-size: 20px; margin: 0;">Сменить титул</h2>
          <button class="btn tiny ghost" data-act="title-close" type="button">✕</button>
        </div>
        <p class="hint" style="margin: 0 0 12px;">Титулы открываются за убийства. Можно носить только один — он даёт бонусы против своей расы.</p>
        <div class="title-list">${rows || `<p class="empty">Пока нет открытых титулов. Убивайте гоблинов, кобольдов и нежить, чтобы открыть их.</p>`}</div>
        ${current ? `<button class="btn ghost" data-act="title-clear" type="button" style="width:100%; margin-top:12px;">Снять титул</button>` : ""}
      </div>
    </div>
  `;
}

function renderAchievementsModal() {
  return `
    <div class="result-overlay" data-act="achievements-close" style="z-index: 186;">
      <div class="result-card achievements-modal">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom: 14px;">
          <h2 style="color: var(--gold2); font-size: 20px; margin: 0;">🏆 Достижения</h2>
          <button class="btn tiny ghost" data-act="achievements-close" type="button">✕</button>
        </div>
        <div class="achievements-modal-body">${achievementsHtml()}</div>
        <button class="btn ghost" data-act="achievements-close" type="button" style="width:100%; margin-top:12px;">Закрыть</button>
      </div>
    </div>
  `;
}

function renderAbilitiesModal() {
  const learned = [];
  if (state.abilities?.parry) {
    learned.push({
      icon: "🛡️",
      name: "Парирование",
      desc: "При уклонении есть шанс парировать удар и открыть окно для контратаки.",
    });
  }
  if (state.abilities?.preciseStrike) {
    learned.push({
      icon: "🎯",
      name: "Точный удар",
      desc: "Критический удар превращается в QTE: остановите указатель в зелёной зоне, чтобы добить врага.",
    });
  }
  const body = learned.length
    ? `<div class="abilities-grid">${learned.map((a) => `
        <article class="ability-card">
          <span class="ability-card-icon">${a.icon}</span>
          <div class="ability-card-body">
            <b class="ability-card-name">${a.name}</b>
            <span class="ability-card-desc">${a.desc}</span>
          </div>
        </article>`).join("")}</div>`
    : `<p class="empty ability-empty">Вы ещё не освоили ни одного умения. Тренируйтесь у Ивана.</p>`;

  return `
    <div class="result-overlay" data-act="abilities-close" style="z-index: 186;">
      <div class="result-card abilities-modal">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom: 14px;">
          <h2 style="color: var(--gold2); font-size: 20px; margin: 0;">🌟 Умения</h2>
          <button class="btn tiny ghost" data-act="abilities-close" type="button">✕</button>
        </div>
        <div class="abilities-modal-body">
          <div class="banner" style="margin-bottom: 10px;">Освоено умений: <b>${learned.length} / 2</b></div>
          ${body}
        </div>
        <button class="btn ghost" data-act="abilities-close" type="button" style="width:100%; margin-top:12px;">Закрыть</button>
      </div>
    </div>
  `;
}

function setAttackZone(zone) { 
  if (!ZONE_NAME[zone]) return; 
  view.attackZone = zone; 
  render(); 
}

function toggleBlock(zone) { 
  if (!ZONE_NAME[zone]) return; 
  const limit = stats().blockZones; 
  if (view.blocks.includes(zone)) {
    view.blocks = view.blocks.filter((z) => z !== zone); 
  } else if (view.blocks.length >= limit) { 
    toast(`Максимум ${limit} зон.`, "warn"); 
    return; 
  } else { 
    view.blocks = [...view.blocks, zone]; 
  } 
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
      res = freeRest();
      if (isNight()) {
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
      const r = acceptWeekQuest(npcId);
      toast(r.text, r.ok ? "ok" : "warn");
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
    case "story-choice-trader": {
      const npcId = el.dataset.npc;
      if (npcId) {
        state.npcDialogueIndex[npcId] = (state.npcDialogueIndex[npcId] || 0) + 1;
        saveState();
        view.npcShopOpen = true; 
        if (!view.traderStock) view.traderStock = getTraderInventory(); 
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
      const gained = applyEventEffects(result.effects, state, st);
      state.activeEvent = null;
      saveState();
      const suffix = gained.length ? ` ${gained.join(", ")}` : "";
      toast(`${result.text}${suffix}`, result.success ? "ok" : "warn");
      render();
      break;
    }
    case "explore-result-continue": {
      const res = view.exploreResult;
      view.exploreResult = null;

      if (res.encounter) {
        const floor = FLOORS.find((f) => f.id === res.encounter.floorId);
        const def = floor ? floor.mobs[res.encounter.mobIndex] : null;
        if (def) { beginBattle(def, floor.id); break; }
      }

      if (res.scene) {
        render(); 
        break;
      }

      if (view.autoExplore) {
        view.autoExplore.timer = setTimeout(autoExploreLoop, 2100);
      }
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
    case "inv-slot-click": view.invItemUid = view.invItemUid === el.dataset.uid ? null : el.dataset.uid; view.dollSlot = null; render(); break;
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
    case "rest":
      res = freeRest();
      if (isNight()) {
        view.screen = "hub";
        view.tripActive = false;
        toast("Ночь. Вы покидаете Башню.", "warn");
      } else {
        toast(res.text, res.ok ? "ok" : "warn");
      }
      render();
      break;
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
    case "buy": {
      const shop = el.dataset.shop || "forge";
      const item = ITEMS[id];
      if (!item) break;
      view.purchaseConfirm = { id, shop, name: item.name, price: priceFor(item, shop).price };
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
    case "craft": res = craftItem(id); toast(res.text, res.ok ? "ok" : "warn"); if (res.ok) Sfx.play("forge_craft"); render(); break;
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
    case "battle-left-tab": view.battleModal = el.dataset.tab; render(); break;
    case "battle-modal-close": view.battleModal = null; Sfx.play("chest_close"); render(); break;
    case "sell-resource": res = sellResource(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "fight": startBattle(Number(el.dataset.floor), el.dataset.mob); break;
    case "explore": {
      const res = exploreFloor(Number(el.dataset.floor) || state.maxFloor);
      if (!res.ok) { toast(res.text, "warn"); break; }

      if (state.activeEvent) { render(); break; }

      if (res.encounter || res.scene) {
        view.exploreResult = { 
          type: "loot", 
          encounter: res.encounter?.mobIndex !== undefined ? res.encounter : null, 
          scene: res.scene, 
          text: res.text 
        };
        render();
        break;
      }

      view.exploreResult = { type: "loot", text: res.text };
      render();
      break;
    }
    case "seek-fight": {
      const floor = FLOORS.find((f) => f.id === Number(el.dataset.floor));
      if (floor && floor.mobs.length) startBattle(floor.id, Math.floor(Math.random() * floor.mobs.length));
      break;
    }
    case "auto-explore": startAutoExplore(Number(el.dataset.floor) || state.maxFloor, view.autoExploreMode === "safe"); break;
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
    case "npc-action": {
      const act = el.dataset.npcAction;
      if (act === "buy") {
        const res = buyFromTrader(id, view);
        toast(res.text, res.ok ? "ok" : "warn");
        if (res.ok) {
          if (view.traderStock) {
            const bought = view.traderStock.find((e) => (e.kind === "gear" ? e.uid : e.id) === id);
            if (bought) bought.sold = true;
            view.traderStock = view.traderStock.filter((e) => (e.kind === "gear" ? e.uid : e.id) !== id);
          }
          closeNpcDialog();
        }
        break;
      }
      
      if (act === "steal") {
        const r = trySteal(id, view.traderStock);
        toast(r.text, r.ok ? "ok" : "warn");
        if (r.ok && view.traderStock) {
          view.traderStock = view.traderStock.filter((e) => (e.kind === "gear" ? e.uid : e.id) !== id);
        }
        if (!r.ok && r.fail) {
          // Стража: выброшен из лавки, ассортимент попутчиков пропадает.
          view.traderStock = null;
          view.npcShopOpen = false;
          closeNpcDialog();
          break;
        }
        render();
        break;
      }
      
      if (act === "leave") {
        closeNpcDialog();
        break;
      }
      
      const res = applyNpcAction(act, state.activeNpcId, view);
      if (act !== "show-goods") toast(res.text, res.ok ? "ok" : "warn");
      render();
      break;
    }
    case "npc-backdrop": closeNpcDialog(); break;
    
    case "attack-zone": setAttackZone(el.dataset.zone); break;
    case "attack-style": if (STYLE_ORDER.includes(el.dataset.style)) { view.attackStyle = el.dataset.style; render(); } break;
    case "monk-stance": if (view.battle && MONK_STANCES.some((s) => s.id === el.dataset.stance)) { view.battle.monkStance = el.dataset.stance; render(); } break;
    case "block-zone": toggleBlock(el.dataset.zone); break;
    
    // QTE-реакции
    case "crit-stop": resolveCritStop(); break;
    case "parry-block": resolveParryClick(); break;
    case "training-qte": {
      const qte = view.trainingQTE;
      if (!qte) break;
      const expected = Array.isArray(qte.sequence) ? qte.sequence[qte.currentStep] : null;
      if (el.dataset.move !== expected) {
        stopQteLoop();
        completeTraining(false);
        break;
      }
      qte.currentStep += 1;
      if (qte.currentStep >= qte.sequence.length) {
        stopQteLoop();
        completeTraining(true);
      } else {
        // Только точки шага: модалка и таймер продолжают жить без render().
        updateTrainingQteStep(qte);
      }
      break;
    }
    case "rhythm-jump": {
      if (!view.trainingQTE) break;
      stopQteLoop();
      // Зелёная зона занимает центральные 20% шкалы (40–60%).
      const inZone = qteRunnerPos >= 0.4 && qteRunnerPos <= 0.6;
      completeTraining(inZone);
      break;
    }

    // БОЕВЫЕ ДЕЙСТВИЯ С ТРЯСКОЙ
    case "exchange": 
      shake();
      doExchange("attack"); 
      break;
    case "tech": 
      view.battleModal = null;
      shake();
      doExchange("tech"); 
      render();
      break;
    case "skill":
      view.battleModal = null;
      shake();
      doExchange("skill", el.dataset.id);
      break;
    
    case "switch-weapon": view.battleModal = null; view.weaponSwap = true; render(); break;
    case "weapon-swap-close": view.weaponSwap = false; render(); break;
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
      view.battle = null; view.summary = null; view.battleModal = null;
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
        if (view.autoExplore) view.autoExplore.timer = setTimeout(autoExploreLoop, 2100);
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
        invalidateStats();
        const st = stats();
        state.hp = st.maxHp;
        state.mana = st.maxMana;
        saveState();
        render();
        toast("Dev-режим активирован: 99 уровень, 999999 золота, все этажи открыты.", "ok");
      }
      break;
    case "reset": if (platform.dialog.confirm("Сбросить прогресс?")) { resetState(); view.battle = null; view.summary = null; view.create = null; view.ambush = null; view.sceneGroup = null; view.sceneGroupFloorId = null; view.autoExplore = null; view.autoExploreMode = "safe"; view.dollSlot = null; view.invItemUid = null; view.invFilter = "all"; view.invSearch = ""; view.shopFilterSlot = "all"; view.shopFilterType = "all"; view.shopFilterStyle = null; view.screen = "hub"; render(); } break;
    default: break;
  }
}


function handleKey(event) {
  if (!state) return;
  if (!state.created) { if (event.key === "Enter" && view.create) tryStartGame(); return; }
  // ESC закрывает настройки и модалки — до проверки фокуса, чтобы работало с ползунка.
  if (event.key === "Escape") {
    if (view.settingsOpen) { view.settingsOpen = false; Sfx.play("chest_close"); render(); return; }
    if (view.titleModal) { view.titleModal = false; Sfx.play("chest_close"); render(); return; }
    if (view.achievementsOpen) { view.achievementsOpen = false; Sfx.play("chest_close"); render(); return; }
    if (view.talentsModal) { view.talentsModal = false; Sfx.play("chest_close"); render(); return; }
    if (view.questsOpen) { view.questsOpen = false; Sfx.play("chest_close"); render(); return; }
  }
  if (event.target?.closest?.("input, textarea, select")) return;
  if (event.key === "Escape" && (view.dollSlot || view.invItemUid)) { view.dollSlot = null; view.invItemUid = null; Sfx.play("chest_close"); render(); return; }
  if (view.summary && event.key === "Enter") { document.querySelector('[data-act="result-continue"]')?.click(); return; }
  if (view.screen !== "battle" || !view.battle || view.battle.over) return;
  const match = /^(?:Digit|Numpad)([1-5])$/.exec(event.code); 
  if (match) { 
    const zone = ZONES[Number(match[1]) - 1].id; 
    if (event.shiftKey) toggleBlock(zone); 
    else setAttackZone(zone); 
    return; 
  }
  if (event.key === "Enter") doExchange("attack");
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
