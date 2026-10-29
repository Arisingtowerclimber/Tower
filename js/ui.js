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
  talkNpc: null, talkNpcText: null,
  shopTab: "buy", sellSelection: [], activeShopNpc: null, shopNpcPhrase: null, shopFilterArmor: null,
  trainingTab: "train",
  inventoryTab: "gear",
  invItemUid: null,
  invFilter: "all",
  invSearch: "",
  alchemyTab: "potions", alchemyFilter: "all",
  heroBackScreen: "hub",
  ambush: null,
  storyJustPlayed: false,
  exploreResult: null,
  weaponSwap: false,
  battleModal: null,
  titleModal: false,
  talentsModal: false,
  settingsOpen: false, settingsTab: "audio",
  shopFilterSlot: "all", shopFilterType: "all", shopFilterStyle: null,
};

let toastTimer = null;
let invFilterCache = { key: "", list: [] };

function esc(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
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
function iconFallbackEmoji(resolved) {
  const m = /([^/]+)\.(webp|png|jpe?g|svg)(\?|$)/i.exec(resolved);
  const fileId = m ? m[1] : null;
  const itemId = fileId && ICON_ITEM_BY_FILE[fileId] ? ICON_ITEM_BY_FILE[fileId] : fileId;
  const item = itemId && ITEMS[itemId] ? ITEMS[itemId] : null;
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
    name: "",
  };
}

function createHtml() {
  const c = view.create;
  const step = BACKGROUND_STEPS[c.step];
  const totalSteps = BACKGROUND_STEPS.length;
  const isLastStep = c.step >= totalSteps - 1;
  const portrait = PORTRAIT_MAP[c.portrait] || PORTRAITS[0];

  if (c.step >= totalSteps) {
    return createSummaryHtml(c, portrait);
  }

  const progress = ((c.step + 1) / totalSteps) * 100;
  
  const optionsHtml = step.options.map((opt) => {
    const selected = c.answers[step.id] === opt.id;
    return `
      <button class="archetype-card${selected ? " selected" : ""}" data-act="bio-option" data-step="${step.id}" data-option="${opt.id}" type="button">
        <span class="archetype-icon">${opt.icon || "•"}</span>
        <span class="archetype-body">
          <b>${opt.label}</b>
          <span>${opt.desc}</span>
        </span>
      </button>
    `;
  }).join("");

  return `
    <div class="create-bg"></div>
    <section class="create">
      <div class="create-head">
        <p class="eyebrow">Перед подъёмом · Шаг ${c.step + 1} из ${totalSteps}</p>
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
            ${c.answers[step.id] ? `<button class="btn primary" data-act="bio-next" type="button">${isLastStep ? "К сводке →" : "Далее →"}</button>` : `<button class="btn" type="button" disabled>Выберите вариант</button>`}
          </div>
        </section>
      </div>
    </section>
  `;
}
function createSummaryHtml(c, portrait) {
  const attrs = { str: 1, agi: 1, end: 1, int: 1 };
  let bonusGold = 0;
  const equipmentIds = [];
  const potionsCount = {};

  for (const step of BACKGROUND_STEPS) {
    const optionId = c.answers[step.id];
    if (!optionId) continue;
    const opt = step.options.find((o) => o.id === optionId);
    if (!opt || !opt.effects) continue;
    const eff = opt.effects;
    for (const a of ["str", "agi", "end", "int"]) if (eff[a]) attrs[a] += Math.min(4, eff[a]);
    if (eff.gold) bonusGold += eff.gold;
    if (Array.isArray(eff.equipment)) equipmentIds.push(...eff.equipment);
    if (Array.isArray(eff.potions)) for (const p of eff.potions) potionsCount[p] = (potionsCount[p] || 0) + 1;
  }

  const arch = ARCHETYPE_MAP[c.archetype];
  if (arch && Array.isArray(arch.startEquipment)) {
    for (const id of arch.startEquipment) {
      const item = ITEMS[id];
      if (!item) continue;
      const alreadyHasSlot = equipmentIds.some((eqId) => {
        const eq = ITEMS[eqId];
        return eq && eq.slot === item.slot && item.slot !== "ring" && item.slot !== "trinket";
      });
      if (!alreadyHasSlot) equipmentIds.push(id);
    }
  }

  const preview = previewStats(attrs, c.archetype);
  const equipmentChips = equipmentIds.map((id) => {
    const item = ITEMS[id];
    if (!item) return "";
    return `<span class="chip">${iconHtml(item.icon, 16)} ${item.name}</span>`;
  }).join("");

  const potionChips = Object.entries(potionsCount).map(([id, count]) => {
    const item = ITEMS[id];
    if (!item) return "";
    return `<span class="chip">${iconHtml(item.icon, 16)} ${item.name} ×${count}</span>`;
  }).join("");

  const archetypeCards = ARCHETYPES.map((a) => `
    <button class="archetype-card${c.archetype === a.id ? " selected" : ""}" data-act="bio-archetype" data-id="${a.id}" type="button">
      <span class="archetype-icon">${a.icon}</span>
      <span class="archetype-body"><b>${a.name}</b><span>${a.desc}</span></span>
    </button>
  `).join("");

  const canStart = Boolean(c.archetype) && Boolean(c.name.trim() || "Странник");

  return `
    <div class="create-bg"></div>
    <section class="create">
      <div class="create-head">
        <p class="eyebrow">Шаг ${BACKGROUND_STEPS.length + 1} из ${BACKGROUND_STEPS.length + 1} · Сводка</p>
        <h1>Ваш герой</h1>
        <p class="lead">Проверьте биографию и выберите архетип.</p>
      </div>
      <div class="create-grid">
        <section class="panel">
          <div class="field"><label for="hero-name">Имя героя</label><input class="name-input" id="hero-name" type="text" maxlength="20" data-role="create-name" autocomplete="off" spellcheck="false" placeholder="Странник" value="${esc(c.name)}"></div>

          <div class="field"><label>Портрет</label><div class="portrait-picker">${PORTRAITS.map((p) => `<button class="portrait-option${p.id === c.portrait ? " selected" : ""}" data-act="bio-portrait" data-id="${p.id}" type="button" style="aspect-ratio: 1 / 1;" title="${esc(p.name)}"><img src="${p.src}" alt="${esc(p.name)}"></button>`).join("")}</div></div>
          
          <div class="preview-portrait" style="margin-bottom: 20px;">
            <img src="${portrait.src}" alt="${esc(c.name || "Странник")}">
            <div class="preview-portrait-caption"><b>${esc(c.name || "Странник")}</b></div>
          </div>

          <h2 class="group-title">Итоговые атрибуты</h2>
          <div class="attr-list">
            ${ATTR_INFO.map((a) => `<div class="attr-row"><div class="attr-info"><b>${a.name}</b><span class="hint">${a.effect}</span></div><div class="attr-controls"><span class="attr-value">${attrs[a.id]}</span></div></div>`).join("")}
          </div>

          <div class="field" style="margin-top: 16px;">
            <label>Стартовое снаряжение</label>
            <div class="chips">${equipmentChips || `<span class="chip dim">Пусто</span>`}</div>
          </div>

          ${potionChips ? `<div class="field"><label>Зелья</label><div class="chips">${potionChips}</div></div>` : ""}
          
          <div class="points-bar" style="margin-top: 16px;">
            <span>Стартовое золото</span>
            <b>${60 + bonusGold} 💰</b>
          </div>
        </section>

        <section class="panel">
          <h2 class="group-title">Выбор архетипа</h2>
          <div class="archetype-grid">${archetypeCards}</div>
          
          <div class="stat-grid" style="margin-top: 20px; grid-template-columns: repeat(2, 1fr);">
            <div class="stat-box"><span>HP</span><b>${preview.maxHp}</b></div>
            <div class="stat-box"><span>Мана</span><b>${preview.maxMana}</b></div>
            <div class="stat-box"><span>Урон</span><b>${preview.atk}</b></div>
            <div class="stat-box"><span>Защита</span><b>${preview.def}</b></div>
          </div>

          <div class="create-actions" style="margin-top: 20px;">
            <button class="btn ghost" data-act="bio-back" type="button">← Назад к биографии</button>
            <button class="btn primary big" data-act="start-game" type="button" ${canStart ? "" : "disabled"}>${canStart ? "Начать путь" : "Введите имя и выберите архетип"}</button>
          </div>
        </section>
      </div>
    </section>
  `;
}

function tryStartGame() {
  const c = view.create; if (!c) return;
  if (!ARCHETYPE_MAP[c.archetype]) { toast("Выберите архетип.", "warn"); return; }
  createHero(c.answers, c.archetype, c.portrait, c.name);
  view.create = null; view.screen = "hub"; view.summary = null; render();
  toast(`Добро пожаловать, ${state.name}.`, "ok");
}

// ── Репутация фракций (Этап 1) ─────────────────────────────────────────────
// Пилюля фракции в топбаре — только на экранах лавок (кузница/алхимик/ювелир).
function shopFactionPill() {
  const factionId = SHOP_FACTION[view.screen];
  if (!factionId) return "";
  const faction = FACTION_MAP[factionId];
  if (!faction) return "";
  const rep = state.reputation ? (state.reputation[factionId] || 0) : 0;
  const fi = factionTier(rep);
  const tip = `${faction.name}: репутация ${rep}, тир «${fi.tier.name}»${fi.tier.discount > 0 ? `, скидка ${Math.round(fi.tier.discount * 100)}%` : ""}`;
  return `<div class="pill faction" data-tip="${esc(tip)}">${faction.icon} <b>${faction.name} · ${rep}</b></div>`;
}

// Блок «Репутация» в меню Героя: тиры, скидки и прогресс до следующего тира.
function factionReputationHtml() {
  const rep = state.reputation || {};
  return FACTIONS.map((f) => {
    const value = rep[f.id] || 0;
    const fi = factionTier(value);
    const progress = fi.next
      ? Math.round(((value - fi.tier.min) / (fi.next.min - fi.tier.min)) * 100)
      : 100;
    const hint = fi.next
      ? `до «${fi.next.name}» ещё ${fi.next.min - value} реп.`
      : "максимальный тир";
    return `
      <div class="faction-row">
        <div class="faction-top"><b>${f.icon} ${f.name}</b><span class="hint">${fi.tier.name} · скидка ${Math.round(fi.tier.discount * 100)}% · ${hint}</span></div>
        ${bar("rep", value - fi.tier.min, fi.next ? fi.next.min - fi.tier.min : Math.max(1, value))}
      </div>`;
  }).join("");
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
  const debuffs = (state.tempDebuffs || []).map((d) =>
    `<span class="debuff-pill" title="${esc(d.desc || d.name)}">${d.icon || "⚠"} ${d.name} · ${d.days} дн.</span>`
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
      <button class="nav-btn icon-btn${hasRewards ? " ok" : ""}" data-act="quests-open" type="button" title="Журнал заданий">📋</button>
      <button class="nav-btn icon-btn" data-act="bestiary-open" type="button" title="Бестиарий">📖</button>
      <button class="nav-btn icon-btn" data-act="settings-open" type="button" title="Настройки">⚙️</button>
      <button class="nav-btn icon-btn" data-act="goto" data-screen="hero" type="button" title="Меню Героя">👤</button>
      <button class="nav-btn icon-btn" data-act="goto" data-screen="hub" type="button" title="Вернуться в Йорстед">🏰</button>
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
    <div class="screen-bg" style="background-image: url('${bgImage}');"></div>
    <section class="hub">
      <div class="hub-head">
        <img src="assets/backgrounds/hub.webp" class="hub-image" onerror="this.style.display='none'" alt="">
        <div class="hub-head-text">
          <h1>Йорстед</h1>
          <p class="lead">Йорстед - один из древних городов-крепостей человечества и единственное безопасное место в округе.</p>
        </div>
      </div>

      <div style="display: flex; gap: 10px; margin-bottom: 18px; align-items: center; flex-wrap: wrap;">
        <button class="btn primary" data-act="rest" type="button">
          ${isNight() ? "🌙 Дождаться утра" : "⚡ Отдых · +3 энергии"}
        </button>
        ${companion ? `
          <div class="status-item buff" style="margin: 0; padding: 8px 12px;">
            <span>Спутница</span>
            <b>${companion.icon} ${companion.name}</b>
            <small>${companion.buffText} · ещё ${companionDaysLeft()} дн.</small>
          </div>
        ` : ""}
      </div>

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

const SHOP_NPCS = { forge: "ron", alchemy: "elain", jewelry: "elize", hotel: "stella", training: "ivan" };
const CRAFT_NPC_STATIONS = { ron: "forge", elain: "alchemy", elize: "jewelry" };

function npcStorySlide(npcId) {
  const storyArr = DIALOGS[npcId]?.story;
  const storyIndex = state.npcDialogueIndex[npcId] || 0;
  return (!view.storyJustPlayed && Array.isArray(storyArr)) ? storyArr[storyIndex] : null;
}

function npcDialogueBar(npcId, buyLabel, sellLabel, extraAction = "") {
  const tab = view.shopTab;
  const npcName = NPC_NAMES[npcId] || npcId;
  
  const currentSlide = npcStorySlide(npcId);

  if (currentSlide) {
    const optionsHtml = currentSlide.options.map((opt, idx) => 
      `<button class="btn primary" data-act="story-choice" data-npc="${npcId}" data-choice="${idx}" type="button" style="margin-bottom: 8px; text-align: left; width: 100%;">${esc(opt.text)}</button>`
    ).join("");

    return `
      <div class="npc-dialogue-bar" style="display: flex; flex-direction: row; align-items: stretch; gap: 20px; background: rgba(20, 16, 14, 0.95); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <img class="npc-portrait" src="${npcPortraitSrc(npcId)}" alt="${esc(npcName)}" style="width: 150px; height: 150px; flex-shrink: 0; object-fit: cover; border-radius: 12px; border: 2px solid var(--gold);">
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <p class="npc-name" style="margin: 0 0 10px 0; font-size: 1.1rem; color: var(--gold2); text-transform: uppercase; letter-spacing: 0.05em;">${esc(npcName)}</p>
            <p class="npc-dialogue" style="margin: 0; font-style: italic; font-size: 1.05rem; line-height: 1.5; color: #e2e8f0;">«${esc(currentSlide.npc)}»</p>
          </div>
          <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 8px;">
            ${optionsHtml}
            <button class="btn ghost" data-act="story-leave" data-npc="${npcId}" type="button" style="width: 100%; text-align: left;">Уйти</button>
          </div>
        </div>
      </div>
    `;
  }

  const phrase = view.shopNpcPhrase || getRandomPhrase(npcId, "greetings");
  
  const btn = (tabId, label) =>
    `<button class="shop-tab${tab === tabId ? " active" : ""}" data-act="shop-tab" data-tab="${tabId}" data-npc="${npcId}" type="button" style="text-align: center;">${label}</button>`;
  const craftStation = CRAFT_NPC_STATIONS[npcId];
  const craftBtn = craftStation && getRecipes(craftStation).length ? btn("craft", "📜 Крафт") : "";
    
  return `
    <div class="npc-dialogue-bar">
      <img class="npc-portrait" src="${npcPortraitSrc(npcId)}" alt="${esc(npcName)}" style="background-color: #171210;">
      <div class="npc-dialogue-text" style="display: flex; flex-direction: column; justify-content: flex-start; padding-top: 4px;">
        <p class="npc-name" style="margin-top: 0;">${esc(npcName)}</p>
        <p class="npc-dialogue">«${esc(phrase)}»</p>
      </div>
      <div class="npc-dialogue-actions">
        ${extraAction}
        ${btn("buy", buyLabel)}
        ${sellLabel ? btn("sell", sellLabel) : ""}
        ${craftBtn}
        ${FACTION_BY_NPC[npcId] ? btn("upgrade", "🔧 Улучшить") : ""}
        ${npcId === "ron" ? btn("exchange", "🔁 Обмен") : ""}
        ${npcId === "ivan" ? "" : btn("quests", "📜 Есть задания?")}
        ${storyQuestBarBtn(npcId)}
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
  return `<div class="screen-bg" style="background-image: url('assets/backgrounds/market.webp');"></div>
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

function hotelHtml() {
  const companion = activeCompanion(); const daysLeft = companionDaysLeft();
  const canHotel = state.gold >= HOTEL_PRICE; const discount = companionDiscountToday();
  const companionPrice = Math.max(1, Math.round(COMPANION_PRICE * (1 - discount)));
  const cards = COMPANIONS.map((c) => {
    const active = companion?.id === c.id; const price = Math.max(1, Math.round(c.price * (1 - discount))); const canPay = state.gold >= price;
    const action = active
      ? `<button class="btn small primary" type="button" disabled>С вами ещё ${daysLeft} дн.</button>`
      : `<button class="btn small" data-act="companion" data-id="${c.id}" ${canPay ? "" : "disabled"} type="button">${companion ? "Сменить" : "Нанять"} на ${COMPANION_BUFF_DAYS} дня</button>`;
    return `<article class="companion-card${active ? " active" : ""}"><div class="companion-head"><img class="companion-portrait" src="${c.src || npcPortraitSrc(c.id)}" alt=""><div class="companion-name"><h3>${c.name}</h3><span class="companion-role">${c.role}</span><span class="companion-buff">${c.buffText}</span></div></div>${active ? `<span class="badge">Сейчас с вами</span>` : ""}<p class="item-desc">${c.desc}</p><div class="companion-foot"><span class="price">${price} 💰</span>${action}</div></article>`;
  }).join("");
  const companionNote = companion
    ? `<div class="companion-note">${iconHtml(companion.icon, 20)} <span><b>${companion.name}</b>: ${companion.buffText}. Осталось ${daysLeft} дн. Найм не сдвигает время.</span></div>`
    : `<div class="companion-note">💞 Бафф действует ${COMPANION_BUFF_DAYS} дня и не сдвигает время. Активна только одна спутница.</div>`;

  const tab = view.shopTab === "quests" ? "quests" : view.shopTab === "story" ? "story" : "buy";
  const content =
    tab === "quests"
      ? npcQuestHtml("stella")
      : tab === "story"
        ? storyQuestPanelHtml("stella")
        : `<h2 class="group-title">Спутницы</h2>${companionNote}<div class="companion-grid">${cards}</div>`;

  return `
    <div class="screen-bg" style="background-image: url('assets/backgrounds/hotel.webp');"></div>
    ${subHeader("Гостиница", "Тёплый свет и чужие истории", "hub", "← В Йорстед")}
    ${npcDialogueBar("stella", "Спутницы", "", `<button class="btn primary" data-act="hotel-rest" type="button" ${canHotel ? "" : "disabled"}>Снять номер · ${HOTEL_PRICE} 💰</button>`)}
    ${content}
  `;
}

function trainingAvailability(training) {
  if (state.phase !== 0) return { ok: false, reason: "Только утром" };
  if (state.energy < TRAINING_ENERGY_COST) return { ok: false, reason: `Нужно ${TRAINING_ENERGY_COST} ⚡` };
  const cap = trainingCap(state.level); if (state.attrs[training.attr] >= cap) return { ok: false, reason: `Максимум (${cap})` };
  return { ok: true, reason: "" };
}

function trainingHtml() {
  const cap = trainingCap(state.level);
  const warning = state.phase === 0
    ? (state.energy < TRAINING_ENERGY_COST ? `<div class="banner warn-banner">⚡ Не хватает энергии.</div>` : `<div class="banner">⏳ Тренировка занимает весь день.</div>`)
    : `<div class="banner warn-banner">🌙 Сейчас не утро.</div>`;

  const trainingCards = TRAININGS.map((t) => {
    const avail = trainingAvailability(t);
    const current = state.attrs[t.attr];
    const attrName = ATTR_INFO.find((a) => a.id === t.attr).name;
    const pct = Math.max(0, Math.min(100, Math.round((current / cap) * 100)));
    const cost = `<span class="price">⚡ ${TRAINING_ENERGY_COST} · ⏳ ${TRAINING_PHASES} фазы</span>`;
    return `<article class="training-card${avail.ok ? "" : " disabled"}">
      <div class="training-head"><span class="training-icon">${t.icon}</span><div class="training-name"><h3>${t.name}</h3><span class="training-effect">${esc(t.effect || "")}</span></div></div>
      <p class="item-desc">${t.desc}</p>
      <div class="training-progress">
        <span class="training-attr">${attrName}: ${current} / ${cap}</span>
        <div class="bar training-bar"><span style="width:${pct}%"></span></div>
      </div>
      <div class="training-foot">${cost}<button class="btn small${avail.ok ? " primary" : ""}" data-act="train" data-id="${t.id}" ${avail.ok ? "" : "disabled"} type="button">${avail.ok ? "Тренироваться" : avail.reason}</button></div>
    </article>`;
  }).join("");

  return `
    <div class="screen-bg hall-bg" style="background-image: url('assets/backgrounds/hunters_hall.webp');"></div>
    ${subHeader("Зал Охотников", "Место сбора авантюристов", "hub")}
    <div class="hall-npcs">
      ${npcDialogueBar("ivan", "Тренировки", "")}
      ${timmyCardHtml()}
    </div>
    ${warning}
    ${view.shopTab === "story" ? storyQuestPanelHtml("ivan") : ""}
    ${huntBoardHtml()}
    <div class="hall-lower">
      <section class="shop-group training-section">
        <h2 class="group-title">💪 Тренировочный зал</h2>
        <div class="training-grid">${trainingCards}</div>
      </section>
      ${hunterStatsHtml()}
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
    <aside class="hall-npc timmy-card">
      <img class="timmy-portrait" src="${npcPortraitSrc("timmy")}" alt="Тимми" onerror="this.style.display='none'">
      <div class="timmy-info">
        <p class="timmy-name">Тимми, молодой охотник</p>
        <p class="hint">Знает слабости всех тварей Башни. Или думает, что знает.</p>
        <button class="btn small primary" data-act="timmy-open" type="button">💬 Спросить совет</button>
      </div>
    </aside>
  `;
}

function timmyModalHtml() {
  return `
    <div class="doll-menu-backdrop" data-act="timmy-close"></div>
    <div class="doll-menu quest-modal timmy-modal" role="dialog">
      <div class="doll-menu-head">
        <h3>💬 Совет Тимми</h3>
        <button class="doll-menu-close" data-act="timmy-close" type="button">✕</button>
      </div>
      <div class="timmy-modal-body">
        <img class="timmy-portrait" src="${npcPortraitSrc("timmy")}" alt="" onerror="this.style.display='none'">
        <p class="npc-dialogue">«${esc(view.timmyTip || randomTimmyTip())}»</p>
      </div>
      <button class="btn small ghost" data-act="timmy-open" type="button" style="margin-top: 12px;">🔄 Спросить ещё</button>
    </div>
  `;
}

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
  const savedMusic = platform.storage.get("tower_music_volume");
  const musicVol = savedMusic !== null && savedMusic !== undefined && savedMusic !== "" ? parseFloat(savedMusic) : 0.3;

  const tabBtn = (id, label) =>
    `<button class="settings-tab${tab === id ? " active" : ""}" data-act="settings-tab" data-tab="${id}" type="button">${label}</button>`;

  let content = "";
  if (tab === "audio") {
    content = `
      <div class="settings-row">
        <label for="music-volume">Музыка</label>
        <input type="range" id="music-volume" min="0" max="1" step="0.01" value="${musicVol}">
        <span class="settings-val">${Math.round(musicVol * 100)}%</span>
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
      const weakText = Array.isArray(def.weakTo) && def.weakTo.length
        ? def.weakTo.map((s) => STYLE_NAMES[s] || s).join(", ")
        : "—";
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
              <span style="color: var(--gold2);">Слабость:</span> ${weakText}<br>
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

// Кнопка «📖 Сюжет» в полосе диалога NPC — только если есть сюжетное задание.
function storyQuestBarBtn(npcId) {
  if (!availableStoryQuestForNpc(npcId) && !activeStoryQuestForNpc(npcId)) return "";
  const inWork = !!activeStoryQuestForNpc(npcId);
  return `<button class="shop-tab" data-act="shop-tab" data-tab="story" data-npc="${npcId}" type="button" style="text-align: center;">📖 Сюжет${inWork ? " ✓" : ""}</button>`;
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

      return `<article class="gear-row${copies.length ? " owned" : ""}${item.rarity && item.rarity !== "common" && RARITY_TIERS[item.rarity] ? ` rarity-${item.rarity}` : ""}">
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
    const unlocked = !!(state.factionPerksUnlocked && state.factionPerksUnlocked[factionId]);
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
      <h2 class="group-title">${path.icon} ${path.name}${unlocked ? "" : ` <span class="hint">🔒 ${faction.name}: нужен тир «${FACTION_TIERS[2].name}» (реп. ${FACTION_TIERS[2].min}, сейчас ${rep})</span>`}</h2>
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
  const tab = view.shopTab || "buy";
  const content =
    tab === "sell" ? sellPanelHtml("forge")
    : tab === "quests" ? npcQuestHtml("ron")
    : tab === "story" ? storyQuestPanelHtml("ron")
    : tab === "exchange" ? exchangePanelHtml()
    : tab === "craft" ? craftPanelHtml("forge")
    : tab === "upgrade" ? upgradePanelHtml()
    : tab === "buy" ? shopItemsHtml(
        [{ id: "held", name: "Оружие и доспехи", slots: ["mainhand", "offhand", "head", "neck", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet"] }],
        "held", "forge")
    : "";

  return `<div class="screen-bg" style="background-image: url('assets/backgrounds/forge.webp');"></div>
    ${subHeader("Кузница", "Оружие и броня", "market", "← Назад")}
    ${npcDialogueBar("ron", "🛒 Купить", "💰 Хочу продать")}
    ${npcStorySlide("ron") ? "" : `<div class="shop-grid"><div class="shop-main">${content}</div></div>`}
  `;
}

function jewelryHtml() {
  const tab = view.shopTab || "buy";
  const content =
    tab === "sell" ? sellPanelHtml("jewelry")
    : tab === "quests" ? npcQuestHtml("elize")
    : tab === "story" ? storyQuestPanelHtml("elize")
    : tab === "craft" ? craftPanelHtml("jewelry")
    : tab === "upgrade" ? upgradePanelHtml()
    : tab === "buy" ? shopItemsHtml([{ id: "jewelry", name: "Украшения", slots: ["neck", "ring", "trinket"] }], "jewelry", "jewelry")
    : "";

  return `
    <div class="screen-bg" style="background-image: url('assets/backgrounds/jewelry.webp');"></div>
    ${subHeader("Ювелирная лавка", "Тонкая работа", "market", "← Назад")}
    ${npcDialogueBar("elize", "🛒 Купить", "💰 Хочу продать")}
    ${npcStorySlide("elize") ? "" : `<div class="shop-grid"><div class="shop-main">${content}</div></div>`}
  `;
}

function alchemyHtml() {
  const tab = view.shopTab || "buy";
  let content = "";
  
  if (tab === "sell") {
    content = sellPanelHtml("alchemy");
  } else if (tab === "quests") {
    content = npcQuestHtml("elain");
  } else if (tab === "story") {
    content = storyQuestPanelHtml("elain");
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
    <div class="screen-bg" style="background-image: url('assets/backgrounds/alchemy.webp');"></div>
    ${subHeader("Лавка Алхимика", "Зелья и настои", "market", "← Назад")}
    ${npcDialogueBar("elain", "🛒 Купить", "💰 Хочу продать")}
    ${npcStorySlide("elain") ? "" : `<div class="shop-grid single"><div class="shop-main">${content}</div></div>`}
  `;
}

const DOLL_LEFT = ["head", "neck", "shoulder", "back", "chest", "wrist", "hands", "waist"];
const DOLL_RIGHT = ["legs", "feet", "ring1", "ring2", "trinket1", "trinket2", "mainhand", "offhand"];

function dollSlotHtml(slotId) {
  const slot = SLOTS.find((s) => s.id === slotId); if (!slot) return "";
  const eq = getEquippedItem(slotId);
  const item = eq ? eq.item : null;
  const open = view.dollSlot === slotId;
  const broken = eq && isBroken(eq);
  const rarityClass = eq && eq.rarity !== "common" ? ` rarity-${eq.rarity}` : "";

  let title = "";
  if (item) {
    const stats = itemStats(eq.item, eq).join(", ");
    const affix = eq.affix ? ` (${eq.affix.name})` : "";
    
    // Подсказка слота: имя + статы (разбивку по стилям itemStats отдаёт сам).
    title = `title="${item.name}${affix}${stats ? ` — ${stats}` : ""}"`;
  } else {
    title = `title="${slot.name}: пусто"`;
  }

  return `<button class="doll-slot${item ? " filled" : ""}${open ? " open" : ""}${broken ? " broken" : ""}${rarityClass}" data-act="doll-slot" data-slot="${slot.id}" type="button" ${title}><span class="slot-glyph">${iconHtml(item ? item.icon : slot.icon, 24)}</span><span class="slot-caption">${slot.name}</span></button>`;
}
function paperDollHtml() {
  const left = DOLL_LEFT.map(dollSlotHtml).join(""); const right = DOLL_RIGHT.map(dollSlotHtml).join(""); const count = Object.values(state.equipped).filter(Boolean).length;
  return `<div class="paper-doll"><div class="doll-col">${left}</div><div class="doll-center"><div class="doll-figure"><img src="${portraitSrc(state.portrait)}" alt=""></div><div class="doll-name"><b>${esc(state.name)}</b>${state.currentTitle ? `<span class="hero-title">${esc(state.currentTitle)}</span>` : ""}<span>УР ${state.level} · надето ${count} / ${SLOTS.length}</span><div class="doll-actions"><button class="btn small primary" data-act="talents-open" type="button">🌟 Таланты</button><button class="btn small ghost" data-act="title-open" type="button">👑 Сменить титул</button></div></div></div><div class="doll-col">${right}</div></div>`;
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
   if (view.inventoryTab === "achievements") return achievementsHtml();
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
      const statLine = itemStats(item, inst).join(", ");
      const affixLine = (inst.affix?.bonuses || []).filter((b) => ATTR_LABEL[b.id]).map((b) => `${ATTR_LABEL[b.id]} +${b.value}`).join(", ");
      const eff = inst.unique ? UNIQUE_EFFECTS.find((u) => u.id === inst.unique) : null;
      let title = `${getItemDisplayName(inst)} (${tier.name})`;
      if (statLine) title += ` — ${statLine}`;
      if (affixLine) title += `, ${affixLine}`;
      if (eff) title += `. ✨ ${eff.name}: ${eff.desc}`;
      return `<button class="inv-slot${equipped ? " equipped-item" : ""}${rarityClass(inst)}" data-act="inv-slot-click" data-uid="${inst.uid}" type="button" title="${esc(title)}">${iconHtml(item.icon, 40)}${equipped ? `<span class="equipped-badge">Надето</span>` : ""}</button>`;
    }).join("");
    return `${filters}<div class="inventory-grid">${slots}</div><div class="inv-count">Показано: ${filtered.length} из ${bag.length}</div><p class="hint">Кликните по предмету в сумке, чтобы надеть его. Продать снаряжение можно у торговцев: Рон — оружие и броня, Элиза — украшения, Элейн — зелья.</p>`;
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

function heroHtml(st) {
  const xpMax = xpNeeded(state.level); const xpPct = Math.round((state.xp / xpMax) * 100);
  const companion = activeCompanion(); const archetype = ARCHETYPE_MAP[state.archetype] || null;
  const potionChips = Object.values(ITEMS).filter((i) => i.slot === "potion" && (state.potions[i.id] || 0) > 0).map((i) => `<button class="btn tiny ghost" data-act="drink" data-id="${i.id}" type="button">${iconHtml(i.icon, 16)} ${i.name} ×${state.potions[i.id]}</button>`).join("") || `<span class="empty">Зелий нет.</span>`;
  const counterFormatted = Math.round(st.counter * 10) / 10;

  return `
    <div class="hero-bg"></div>
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
        ${archetype ? `<div class="archetype-note">${iconHtml(archetype.icon, 20)} <span><b>${archetype.name}</b>: ${archetype.desc}</span></div>` : ""}
        ${companion ? `<div class="companion-note">${iconHtml(companion.icon, 20)} <span><b>${companion.name}</b>: ${companion.buffText}. Осталось ${companionDaysLeft()} дн.</span></div>` : ""}
        <div class="attr-head"><h2 class="group-title">Репутация</h2></div>
        <div class="faction-list">${factionReputationHtml()}</div>
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
            <button class="shop-tab${view.inventoryTab === "achievements" ? " active" : ""}" data-act="inventory-tab" data-tab="achievements" type="button">🏆 Достижения</button>
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
    <div class="screen-bg" style="background-image: url('assets/backgrounds/tower.webp');"></div>
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
    <div class="screen-bg" style="background-image: url('${floor.bg || "assets/backgrounds/tower.webp"}');"></div>
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

// Модалка процедурного события: заглушка-картинка, заголовок, текст и кнопки выбора.
function renderEventModal(event) {
  if (!event) return "";
  const actions = (event.options || []).map((o) =>
    `<button class="btn primary" data-act="event-action" data-event="${event.id}" data-option="${o.id}" type="button" style="flex:1; min-width:160px;">${o.label}</button>`
  ).join("");
  return `
    <div class="result-overlay" style="z-index: 195;">
      <div class="result-card" style="max-width: 520px;">
        <div class="event-image" aria-hidden="true">${event.icon || "❓"}</div>
        <h2 style="color: var(--gold2); font-size: 24px; margin: 16px 0 4px;">${event.icon || ""} ${event.name}</h2>
        <p style="font-size: 15px; line-height: 1.55; margin: 12px 0 20px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; border: 1px solid var(--line);">${esc(event.text)}</p>
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

  const enemyManaInactive = !(battle.enemy.maxMana > 0);
  const enemyRageInactive = enemy.rarity === "common" || !(battle.enemy.maxRage > 0);

  // Уязвимость врага: читаемые названия стилей из STYLE_NAMES.
  const enemyWeakText = Array.isArray(enemy.weakTo) && enemy.weakTo.length
    ? enemy.weakTo.map((s) => STYLE_NAMES[s] || s).join(", ")
    : "";

  // Бейджи врага выносим отдельным рядом под именем, чтобы не раздувать строку с названием.
  const enemyBadges = [
    enemy.rarity === "rare" ? `<span class="chip" style="border-color: #d9a94b; color: #d9a94b;" title="Редкий враг">Редкий</span>` : "",
    enemy.rarity === "elite" ? `<span class="chip" style="border-color: #c2483c; color: #c2483c;" title="Элитный враг">Элитный</span>` : "",
    enemy.modifier ? `<span class="chip" style="cursor: help;" title="${MOB_MODIFIERS[enemy.modifier].desc}">${MOB_MODIFIERS[enemy.modifier].name}</span>` : "",
    enemy.ability ? `<span class="chip" style="cursor: help;" title="${MOB_ABILITY_INFO[enemy.ability].desc}">${MOB_ABILITY_INFO[enemy.ability].name}</span>` : "",
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
        <article class="fighter enemy-fighter">
          <div class="fighter-avatar" style="width: 80px; height: 80px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: #1c1511;">
            <img src="${resolveIcon(enemy.icon)}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div class="fighter-body" style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
            <div class="fighter-name" style="font-size: 16px; margin-bottom: 4px;">${enemy.name}</div>
            ${enemyBadges ? `<div class="enemy-badges">${enemyBadges}</div>` : ""}
            ${bar("hp enemy", battle.hp, battle.maxHp, "enemy-hp")}
            ${bar("mana" + (enemyManaInactive ? " inactive" : ""), battle.enemy.mana || 0, battle.enemy.maxMana || 1)}
            ${bar("rage" + (enemyRageInactive ? " inactive" : ""), battle.enemy.rage || 0, battle.enemy.maxRage || 5)}
            <div class="fighter-numbers" style="font-size: 11px; margin-top: 6px; display: flex; gap: 4px 12px; flex-wrap: wrap; align-items: center;">
              <span data-role="enemy-hp-text">${battle.hp}/${battle.maxHp} HP</span>
              <span title="Базовый урон врага">Урон: ${enemy.atk}</span>
              <span title="Базовые доспехи, снижающие урон">Защита: ${enemy.def}</span>
              <span title="${enemyArmorTitle}" style="border-bottom: 1px dotted var(--dim); cursor: help;">Броня: ${ARMOR_TYPE_NAMES[enemy.armorType] || "Нет"}</span>
              <span title="${enemyWeaponTitle}" style="border-bottom: 1px dotted var(--dim); cursor: help;">Оружие: ${enemyWeapon ? enemyWeapon.name : "Кулаки"}</span>
              ${enemyWeakText ? `<span class="chip weak-chip" title="Стиль удара, к которому враг уязвим (урон ×1.25)">Уязвим к: ${enemyWeakText}</span>` : ""}
            </div>
          </div>
        </article>
      </div>

      <!-- ЦЕНТР: Лог боя -->
      <div class="battle-log" id="battle-log" data-role="battle-log" style="flex: 1; max-height: none; margin-bottom: 10px; overflow-y: auto;">
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

function resultHtml() {
  const summary = view.summary;
  if (!summary) return "";

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
  return `<div class="subhead"><button class="btn tiny" data-act="goto" data-screen="${backScreen}" type="button">${backLabel}</button><div><h1>${title}</h1><p class="muted">${subtitle}</p></div></div>`;
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
  const st = stats();

  const setBar = (role, value, max) => {
    const el = document.querySelector(`[data-role="${role}"] span`);
    if (el) el.style.width = `${Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))}%`;
  };
  setBar("hero-hp", state.hp, st.maxHp);
  setBar("hero-mana", state.mana, st.maxMana);
  setBar("rage-bar", battle.rage, 5);
  setBar("enemy-hp", battle.hp, battle.maxHp);

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
  const screen = platform.dom.byId("screen"); const topbar = platform.dom.byId("topbar");
  if (!state.created) { 
    if (!view.create) resetCreate(); 
    topbar.innerHTML = ""; topbar.hidden = true; 
    screen.innerHTML = createHtml(); screen.dataset.screen = "create"; 
    return; 
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
  if (view.timmyTip) html += timmyModalHtml();
  if (view.settingsOpen) html += settingsModalHtml();
  if (view.titleModal) html += titleModalHtml();
  if (view.talentsModal) html += talentsModalHtml();
  if (view.weaponSwap) html += weaponSwapHtml();
  if (view.levelUp) html += levelUpModalHtml();
  if (state.activeSceneId && view.screen !== "battle") html += sceneModalHtml();
  if (state.activeNpcId && view.screen !== "battle") html += traderDialogHtml();
  if (state.activeEvent && !state.activeNpcId && !state.activeSceneId && view.screen !== "battle") html += renderEventModal(state.activeEvent);
  
  if (view.exploreResult) html += exploreResultModalHtml();
  
  if (view.talkNpc) {
    if (!state.npcDialogueIndex) state.npcDialogueIndex = {};
    const index = state.npcDialogueIndex[view.talkNpc] || 0;
    const hasStory = DIALOGS[view.talkNpc]?.story?.[index];
    
    if (hasStory) {
      html += firstMeetModalHtml(view.talkNpc);
    } else {
      html += npcDialogHtml(view.talkNpc);
    }
  }

  if (view.topicsNpc) html += npcTopicsModalHtml(view.topicsNpc);

  if (view.bestiaryOpen) html += bestiaryModalHtml();
  
  const prevLog = view.prevLog || 0;
  const newLines = view.battle && view.battle.log.length > prevLog ? view.battle.log.slice(prevLog) : [];
  if (view.battle) view.prevLog = view.battle.log.length;
  html += battlePopupsHtml(newLines);
  if (view.screen === "battle" && (!view.battle || view.battle.turn === 0)) view.prevLog = 0;

  screen.innerHTML = html;
  screen.dataset.screen = view.screen; 
  
  if (view.screen === "battle") requestAnimationFrame(scrollLog);
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
    Sfx.play("hit", { volume: Sfx.getVolume() });
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
};

const NPC_NAMES = { ron: "Рон, кузнец", elain: "Элейн, алхимик", elize: "Элиза, ювелир", stella: "Стелла, хозяйка гостиницы", ivan: "Иван, Капитан" };

function getRandomPhrase(npcId, phraseType) {
  const set = DIALOGS[npcId];
  const phrase = set ? set[phraseType] : null;
  if (Array.isArray(phrase) && phrase.length) return phrase[Math.floor(Math.random() * phrase.length)];
  return phrase || "";
}

const NPC_TALK_PLACE = { ron: "Кузница", elain: "Лавка Алхимика", elize: "Ювелирная лавка", stella: "Гостиница «Усталый путник»", ivan: "Зал Охотников" };
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
          <p style="color: #e2e8f0; font-style: italic; margin-bottom: 12px; line-height: 1.5;">«${met.npc}»</p>
          <p style="color: var(--gold2); font-weight: bold; line-height: 1.5;">Вы: «${met.player}»</p>
        </div>

        <button class="btn primary" data-act="story-choice" data-npc="${npcId}" type="button" style="width: 100%;">Продолжить</button>
        <button class="btn ghost" data-act="npc-talk-topics" data-npc="${npcId}" data-from="meet" type="button" style="width: 100%; margin-top: 8px;">🗣 Поболтать</button>
      </div>
    </div>
  `;
}
// Кнопка «📖 Сюжет» в модалке разговора: открывает экран NPC на вкладке story.
function storyQuestTalkBtnHtml(npcId) {
  if (!availableStoryQuestForNpc(npcId) && !activeStoryQuestForNpc(npcId)) return "";
  return `<button class="btn ghost" data-act="npc-talk-story" data-npc="${npcId}" type="button">📖 Сюжет</button>`;
}

function npcDialogHtml(npcId) {
  const target = NPC_TALK_TARGETS[npcId];
  if (!target) return "";
  const dialogue = view.talkNpcText || getRandomPhrase(npcId, "greetings");
  ensureWeekQuests();
  const q = state.weekQuests.list.find((x) => x.npc === npcId);

  let questButton = "";
  if (q) {
    if (q.status === "offered") questButton = `<button class="btn small primary" data-act="npc-talk-quest" data-npc="${npcId}" type="button">Взять задание</button>`;
    else if (q.status === "active") questButton = `<button class="btn small" disabled type="button">Задание в работе</button>`;
    else if (q.status === "done") questButton = `<button class="btn small primary" data-act="claim-npc-quest" data-id="${q.id}" type="button">Сдать задание</button>`;
  }

  return `
    <div class="result-overlay" data-act="npc-talk-backdrop" style="z-index: 184;">
      <div class="result-card">
        <div style="display:flex; gap:15px; align-items:center; text-align:left;">
          <img src="${npcPortraitSrc(npcId)}" alt="${NPC_NAMES[npcId]}" style="width:84px; height:84px; flex:0 0 84px; border-radius:12px; object-fit:cover; border:1px solid var(--gold); background:#1c1511;" onerror="this.outerHTML='<b style=font-size:52px>🧙</b>'">
          <div>
            <h2 style="color:var(--gold2); font-size:22px; margin:0 0 8px;">${NPC_TALK_PLACE[npcId]}</h2>
            <p style="font-size:14px; margin:0; line-height:1.5;">«${esc(dialogue)}»</p>
          </div>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:15px;">
          <button class="btn primary" data-act="npc-talk-shop" data-npc="${npcId}" type="button">${target.shopLabel}</button>
          ${questButton}
          ${storyQuestTalkBtnHtml(npcId)}
          ${DIALOG_BRANCHES[npcId] && DIALOG_BRANCHES[npcId].length ? `<button class="btn ghost" data-act="npc-talk-topics" data-npc="${npcId}" type="button">🗣 Поболтать</button>` : ""}
          <button class="btn ghost" data-act="npc-talk-close" data-npc="${npcId}" type="button">Уйти</button>
        </div>
      </div>
    </div>
  `;
}

// ── Модалка «Поболтать» (Этап 3) ───────────────────────────────────────────
// z-index 186 — выше диалога NPC (184) и first-meet-модалки (195 → topicsFromFirstMeet).
function npcTopicsModalHtml(npcId) {
  const topics = DIALOG_BRANCHES[npcId] || [];
  if (!topics.length) return "";
  const seen = state.dialogTopicsSeen || {};
  const shownReply = view.topicReply && view.topicReply.npc === npcId ? view.topicReply : null;
  const zIndex = view.topicsFromFirstMeet ? 196 : 186;

  const rows = topics.map((topic) => {
    const open = topicAvailable(topic, npcId);
    const key = npcId + ":" + topic.id;
    const fresh = !seen[key];
    const lockHint = open
      ? (fresh ? "новое" : "")
      : (Number.isFinite(topic.minRep) && topicNpcRep(npcId) < topic.minRep
        ? `🔒 нужен тир «${factionTier(topic.minRep).tier.name}» (${topic.minRep} реп.)`
        : `🔒 нужен этаж ${topic.minFloor}`);
    return `<button class="btn small${open ? (fresh ? " primary" : " ghost") : " ghost"}" data-act="topic-open" data-npc="${npcId}" data-topic="${topic.id}" ${open ? "" : "disabled"} type="button" style="text-align: left;">
      ${esc(topic.title)}${lockHint ? ` <span class="hint">${lockHint}</span>` : ""}
    </button>`;
  }).join("");

  return `
    <div class="result-overlay" data-act="npc-talk-topics-close" style="z-index: ${zIndex};">
      <div class="result-card" style="max-width: 550px; text-align: left;">
        <div style="display:flex; gap:15px; align-items:center; margin-bottom: 12px;">
          <img src="${npcPortraitSrc(npcId)}" alt="" style="width:64px; height:64px; border-radius:10px; border:1px solid var(--gold); object-fit:cover;" onerror="this.outerHTML='<b style=font-size:40px>🧙</b>'">
          <div>
            <h3 style="margin:0; color:var(--gold2); font-size: 18px;">${esc(NPC_NAMES[npcId] || npcId)}</h3>
            <span class="hint">О чём поговорим?</span>
          </div>
        </div>
        ${shownReply ? `<div style="background: rgba(0,0,0,0.3); border: 1px solid var(--line); border-radius: 10px; padding: 12px 15px; margin-bottom: 14px;">
          <p style="color: #e2e8f0; font-style: italic; margin: 0 0 6px;">«${esc(shownReply.reply)}»</p>
          <span class="hint">${esc((DIALOG_BRANCHES[npcId] || []).find((t) => t.id === shownReply.topic)?.title || "")}</span>
        </div>` : ""}
        <div style="display: flex; flex-direction: column; gap: 8px;">${rows}</div>
        <button class="btn ghost" data-act="npc-talk-topics-close" data-npc="${npcId}" type="button" style="width: 100%; margin-top: 12px;">Назад</button>
      </div>
    </div>
  `;
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
      `<button class="btn primary" data-act="story-choice-trader" data-npc="${npc.id}" data-choice="${idx}" type="button" style="margin-bottom: 8px; text-align: left; width: 100%;">${esc(opt.text)}</button>`
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
            <p style="color: #e2e8f0; font-style: italic; line-height: 1.5;">«${esc(currentSlide.npc)}»</p>
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
  const el = event.target.closest("[data-act]"); 
  if (!el || el.disabled) return; 
  event.preventDefault();
  
  const act = el.dataset.act; const id = el.dataset.id; let res;
  
  // Вспомогательная функция для тряски экрана
  const shake = () => {
    const screen = document.querySelector(".battle-screen");
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
    case "bio-archetype": {
      const c = view.create;
      if (!c) break;
      c.archetype = el.dataset.id;
      render();
      break;
    }
    case "rest":
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
    case "quests-close": view.questsOpen = false; render(); break;
    case "settings-open": view.settingsOpen = true; render(); break;
    case "settings-close": view.settingsOpen = false; render(); break;
    case "settings-tab": view.settingsTab = el.dataset.tab || "audio"; render(); break;
    case "test-sound": Sfx.play("open"); break;
    case "bestiary-open": view.bestiaryOpen = true; render(); break;
    case "bestiary-close": view.bestiaryOpen = false; render(); break;
    case "bestiary-filter":
      if (["all", "defeated", "unknown", "boss"].includes(el.dataset.filter)) { view.bestiaryFilter = el.dataset.filter; render(); }
      break;
    case "levelup-close": view.levelUp = null; render(); break;
    case "goto":
      if (el.dataset.screen === "tower") view.currentFloor = null;
      go(el.dataset.screen);
      break;
    case "npc-talk":
      if (NPC_TALK_TARGETS[el.dataset.npc]) { view.talkNpc = el.dataset.npc; view.talkNpcText = getRandomPhrase(el.dataset.npc, "greetings"); render(); }
      break;
    case "npc-talk-backdrop": view.talkNpc = null; view.talkNpcText = null; render(); break;
    case "npc-talk-topics": {
      view.topicsNpc = el.dataset.npc || null;
      view.topicReply = null;
      view.topicsFromFirstMeet = el.dataset.from === "meet";
      render();
      break;
    }
    case "npc-talk-topics-close": {
      view.topicsNpc = null; view.topicReply = null; view.topicsFromFirstMeet = false;
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
      const npc = view.talkNpc;
      view.talkNpc = null; view.talkNpcText = null; render();
      if (npc) toast(getRandomPhrase(npc, "farewell"), "ok");
      break;
    }
    case "npc-talk-shop": {
      const npcId = el.dataset.npc; const target = NPC_TALK_TARGETS[npcId];
      if (!target) break;
      if (isNight() && ["forge", "alchemy", "jewelry", "training"].includes(target.screen)) { toast("Ночью эта локация закрыта. Дождитесь утра.", "warn"); break; }
      toast(getRandomPhrase(npcId, "shop_open"), "ok");
      view.talkNpc = null; view.talkNpcText = null;
      if (target.tabField) view[target.tabField] = target.shopTab || "quests";
      go(target.screen);
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
    case "shop-tab": {
      const tab = el.dataset.tab || "buy";
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
      res = buyItem(id, shop);
      toast(res.text, res.ok ? "ok" : "warn");
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
    case "npc-talk-story": {
      const npcId = el.dataset.npc;
      const target = NPC_TALK_TARGETS[npcId];
      if (!target) break;
      view.talkNpc = null; view.talkNpcText = null;
      view.shopTab = "story";
      go(target.screen);
      break;
    }
    case "create-portrait": { const c = view.create; if (c && PORTRAIT_MAP[el.dataset.portrait]) { c.portrait = el.dataset.portrait; render(); } break; }
    case "create-archetype": { const c = view.create; if (c && ARCHETYPE_MAP[el.dataset.id]) { c.archetype = el.dataset.id; render(); } break; }
    case "create-attr": { const c = view.create; if (!c) break; const attr = el.dataset.attr; const delta = Number(el.dataset.delta); if (delta > 0 && c.points > 0) { c.attrs[attr]++; c.points--; } else if (delta < 0 && c.attrs[attr] > 1) { c.attrs[attr]--; c.points++; } render(); break; }
    case "create-reset": resetCreate(view.create?.name || "", view.create?.portrait || "m1", view.create?.archetype || null); render(); break;
    case "start-game": tryStartGame(); break;
    case "doll-slot": view.dollSlot = view.dollSlot === el.dataset.slot ? null : el.dataset.slot; view.invItemUid = null; render(); break;
    case "doll-close": view.dollSlot = null; render(); break;
    case "doll-equip": res = equipItemToSlot(el.dataset.uid, el.dataset.slot); toast(res.text, res.ok ? "ok" : "warn"); if (res.ok) view.dollSlot = null; render(); break;
    case "doll-unequip": res = unequipSlot(el.dataset.slot); toast(res.text, res.ok ? "ok" : "warn"); if (res.ok) view.dollSlot = null; render(); break;
    case "inv-slot-click": view.invItemUid = view.invItemUid === el.dataset.uid ? null : el.dataset.uid; view.dollSlot = null; render(); break;
    case "inv-menu-close": view.invItemUid = null; render(); break;
    case "inv-equip": res = equipItem(el.dataset.uid); toast(res.text, res.ok ? "ok" : "warn"); if (res.ok) view.invItemUid = null; render(); break;
    case "inv-filter": view.invFilter = el.dataset.filter || "all"; render(); break;
    case "add-attr": res = addAttr(el.dataset.attr); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "title-open": view.titleModal = true; render(); break;
    case "talents-open": view.talentsModal = true; render(); break;
    case "talents-close": view.talentsModal = false; render(); break;
    case "title-close": view.titleModal = false; render(); break;
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
    case "train": res = trainAttr(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "hunt-accept": res = acceptWeekQuest(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "hunt-claim": res = claimNpcQuest(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "timmy-open": view.timmyTip = randomTimmyTip(); render(); break;
    case "timmy-close": view.timmyTip = null; render(); break;
    case "buy": res = buyItem(id, el.dataset.shop || "forge"); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "craft": res = craftItem(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
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
    case "battle-modal-close": view.battleModal = null; render(); break;
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
    
    case "flee": view.battle = null; view.summary = null; view.ambush = null; view.battleModal = null; view.sceneGroup = null; view.sceneGroupFloorId = null; view.screen = "tower"; if (view.autoExplore) stopAutoExplore("Отступление: авто-исследование остановлено."); saveState(); render(); break;
    case "result-continue": {
      const victory = view.summary?.victory;
      const ambush = victory ? view.ambush : null;
      view.battle = null; view.summary = null; view.battleModal = null;
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
  if (event.target?.closest?.("input, textarea, select")) return;
  if (event.key === "Escape" && (view.dollSlot || view.invItemUid)) { view.dollSlot = null; view.invItemUid = null; render(); return; }
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
