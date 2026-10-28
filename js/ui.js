const view = {
  screen: "hub", battle: null, attackZone: "chest", attackStyle: "slashing", blocks: ["head", "chest"],
  summary: null, create: null, forgeTab: "held", jewelryTab: "jewelry", talentsTab: "war",
  questsOpen: false, bestiaryOpen: false,
  currentFloor: null,
  levelUp: null,
  dollSlot: null, tripActive: false,
  sceneGroup: null, sceneGroupFloorId: null, autoExplore: null,
  autoExploreMode: "safe",
  npcShopOpen: false, traderStock: null,
  talkNpc: null, talkNpcText: null,
  shopTab: null, sellSelection: [], activeShopNpc: null, shopNpcPhrase: null,
  trainingTab: "train",
  inventoryTab: "gear",
  invItemUid: null,
  invFilter: "all",
  invSearch: "",
  alchemyTab: "potions",
  heroBackScreen: "hub",
  ambush: null,
  storyJustPlayed: false,
  exploreResult: null,
};

let toastTimer = null;

function esc(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function bar(cls, value, max) { const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100)); return `<div class="bar ${cls}"><span style="width:${pct}%"></span></div>`; }
function toast(text, kind = "info") { const el = document.getElementById("toast"); if (!el) return; el.textContent = text; el.className = `toast show ${kind}`; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.className = "toast"; }, 2400); }

function iconHtml(icon, size = 32, fit = "contain") {
  const resolved = resolveIcon(icon);
  if (!resolved) return "";
  if (resolved.startsWith("assets/")) {
    return `<img src="${resolved}" class="game-icon" style="width:${size}px;height:${size}px;object-fit:${fit};" alt="" onerror="this.style.display='none'">`;
  }
  return `<span style="font-size:${Math.round(size * 0.8)}px;line-height:1;vertical-align:middle;">${resolved}</span>`;
}

const ATTR_LABEL = { str: "Сила", end: "Выносливость", agi: "Ловкость", int: "Интеллект" };

function itemStats(item, inst = null) {
  const s = inst ? getInstanceStats(inst) : item;
  const out = [];
  if (s.atk) out.push(`⚔ +${s.atk}`);
  if (s.def) out.push(`🛡 +${s.def}`);
  if (s.hp) out.push(`❤ +${s.hp}`);
  if (s.mana) out.push(`🔷 +${s.mana} маны`);
  if (s.crit) out.push(`🎯 +${s.crit}%`);
  if (s.dodge) out.push(`💨 +${s.dodge}%`);
  if (s.block) out.push(`🧱 +${s.block} зона блока`);
  return out;
}

function damageStatsHtml(item, inst = null) {
  const s = inst ? getInstanceStats(inst) : item;
  const dmg = s.damage;
  if (!dmg) return "";

  const styles = [];
  if (dmg.slashing > 0) styles.push({ name: "Рубящий", val: dmg.slashing });
  if (dmg.piercing > 0) styles.push({ name: "Колющий", val: dmg.piercing });
  if (dmg.bludgeoning > 0) styles.push({ name: "Дробящий", val: dmg.bludgeoning });

  if (!styles.length) return "";

  const rows = styles.map(st => `
    <div style="display: flex; justify-content: space-between; max-width: 140px; font-size: 12px; color: var(--dim); margin-top: 4px;">
      <span>${st.name}:</span>
      <b style="color: #d1c0aa;">${st.val}</b>
    </div>
  `).join("");

  return `<div style="margin-top: 8px; border-top: 1px dashed var(--line); padding-top: 6px;">${rows}</div>`;
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
  let html = chips.length ? chips.map((c) => `<span class="chip">${c}</span>`).join("") : `<span class="chip dim">без бонусов</span>`;
  if (inst && inst.affix) {
    for (const b of inst.affix.bonuses || []) {
      if (ATTR_LABEL[b.id]) html += `<span class="chip affix">${ATTR_LABEL[b.id]} +${b.value}</span>`;
    }
  }
  if (inst && inst.unique) {
    const eff = UNIQUE_EFFECTS.find((u) => u.id === inst.unique);
    if (eff) html += `<span class="chip unique">✨ ${eff.name}</span>`;
  }
  return html;
}

function copiesOf(id) { return state.owned.filter((inst) => inst.id === id); }
function equippedUidOf(id) {
  for (const [slot, uid] of Object.entries(state.equipped)) {
    const inst = uid ? getInstance(uid) : null;
    if (inst && inst.id === id) return { slot, uid };
  }
  return null;
}

function priceFor(item, shop = "forge") {
  const discount = shop === "alchemy" ? alchemyDiscountToday() : shop === "forge" ? forgeDiscountToday() : 0;
  const price = Math.max(1, Math.round(item.price * (1 - discount)));
  return { price, old: item.price, hasDiscount: discount > 0 };
}

function priceHtml(item, shop = "forge") { const p = priceFor(item, shop); if (!p.hasDiscount) return `${p.price} 💰`; return `<s class="price-old">${p.old} 💰</s> <b class="price-new">${p.price} 💰</b>`; }
function battleActive() { return view.screen === "battle" && view.battle && !view.battle.over; }

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

function resetCreate(name = "", portrait = "m1", archetype = null) {
  view.create = { name, portrait: PORTRAIT_MAP[portrait] ? portrait : "m1", archetype: ARCHETYPE_MAP[archetype] ? archetype : null, attrs: { str: 1, agi: 1, end: 1, int: 1 }, points: START_ATTR_POINTS };
}

function createHtml() {
  const c = view.create; const portrait = PORTRAIT_MAP[c.portrait] || PORTRAITS[0]; const archetype = ARCHETYPE_MAP[c.archetype] || null;
  const preview = previewStats(c.attrs, c.archetype); const canStart = c.points === 0 && Boolean(archetype);
  
  const rows = ATTR_INFO.map((attr) => `
    <div class="attr-row">
      <div class="attr-info"><b>${attr.name}</b><span class="hint">${attr.effect}</span></div>
      <div class="attr-controls">
        <button class="attr-btn" data-act="create-attr" data-attr="${attr.id}" data-delta="-1" ${c.attrs[attr.id] <= 1 ? "disabled" : ""} type="button">−</button>
        <span class="attr-value">${c.attrs[attr.id]}</span>
        <button class="attr-btn" data-act="create-attr" data-attr="${attr.id}" data-delta="1" ${c.points <= 0 ? "disabled" : ""} type="button">+</button>
      </div>
    </div>
  `).join("");

  const archetypeCards = ARCHETYPES.map((a) => {
    const equipStats = (a.startEquipment || []).map(id => {
      const item = ITEMS[id];
      if (!item) return "";
      const stats = [];
      if (item.atk) stats.push(`⚔ +${item.atk}`);
      if (item.def) stats.push(`🛡 +${item.def}`);
      if (item.hp) stats.push(`❤ +${item.hp}`);
      if (item.block) stats.push(`🧱 +${item.block}`);
      return `${item.name}${stats.length ? ` (${stats.join(", ")})` : ""}`;
    }).filter(Boolean).join(", ");

    return `
      <button class="archetype-card${c.archetype === a.id ? " selected" : ""}" data-act="create-archetype" data-id="${a.id}" type="button" title="${esc(equipStats)}">
        <span class="archetype-body"><b>${a.name}</b><span>${a.desc}</span></span>
      </button>
    `;
  }).join("");

  const startLabel = c.points > 0 ? `Распределите ещё ${c.points}` : !archetype ? "Выберите архетип" : "Начать путь";

  const startEquipmentIds = (archetype && Array.isArray(archetype.startEquipment)) 
    ? archetype.startEquipment 
    : ["rusty_knife", "rags", "worn_hood", "patched_pants", "worn_boots"];
    
  const startEquipmentChips = startEquipmentIds.map(id => {
    const item = ITEMS[id];
    if (!item) return "";
    const stats = [];
    if (item.atk) stats.push(`⚔ +${item.atk}`);
    if (item.def) stats.push(`🛡 +${item.def}`);
    if (item.hp) stats.push(`❤ +${item.hp}`);
    if (item.mana) stats.push(`🔷 +${item.mana} маны`);
    if (item.crit) stats.push(`🎯 +${item.crit}%`);
    if (item.dodge) stats.push(`💨 +${item.dodge}%`);
    if (item.block) stats.push(`🧱 +${item.block} зона блока`);
    const title = stats.length ? ` title="${esc(stats.join(", "))}"` : "";
    return `<span class="chip"${title}>${iconHtml(item.icon, 16)} ${item.name}</span>`;
  }).join("");

  return `
    <div class="create-bg"></div>
    <section class="create">
      <div class="create-head">
        <p class="eyebrow">Перед подъёмом</p><h1>Кто войдёт в Башню?</h1>
        <p class="lead">Все начинают с равных атрибутов и десяти свободных очков. Архетип задаёт стиль боя и выбирается только здесь.</p>
      </div>
      <div class="create-grid">
        <section class="panel">
          <div class="field"><label for="hero-name">Имя героя</label><input class="name-input" id="hero-name" type="text" maxlength="20" data-role="create-name" autocomplete="off" spellcheck="false" placeholder="Странник" value="${esc(c.name)}"></div>
          <div class="field"><label>Портрет</label><div class="portrait-picker">${PORTRAITS.map((p) => `<button class="portrait-option${p.id === c.portrait ? " selected" : ""}" data-act="create-portrait" data-portrait="${p.id}" type="button"><img src="${p.src}" alt=""></button>`).join("")}</div></div>
          <div class="field"><label>Архетип</label><div class="archetype-grid">${archetypeCards}</div></div>
          <div class="points-bar"><span>Свободных очков</span><b>${c.points} / ${START_ATTR_POINTS}</b></div>
          <div class="attr-list">${rows}</div>
          <div class="create-actions">
            <button class="btn ghost" data-act="create-reset" type="button">Сбросить</button>
            <button class="btn primary big" data-act="start-game" type="button" ${canStart ? "" : "disabled"}>${startLabel}</button>
          </div>
        </section>
        <section class="panel preview-panel">
          <div class="preview-portrait"><img src="${portrait.src}" alt="${esc(portrait.name)}"><div class="preview-portrait-caption"><b>${esc(c.name || "Странник")}</b></div></div>
          <div class="preview-archetype${archetype ? "" : " empty"}">${archetype ? `<span class="preview-archetype-head"><b>${archetype.name}</b></span><span>${archetype.desc}</span>` : `<span>Архетип не выбран</span>`}</div>
          <h2 class="group-title">Что получится</h2>
          <div class="stat-grid">
            <div class="stat-box"><span>HP</span><b>${preview.maxHp}</b></div><div class="stat-box"><span>Мана</span><b>${preview.maxMana}</b></div>
            <div class="stat-box"><span>Урон</span><b>${preview.atk}</b></div><div class="stat-box"><span>Защита</span><b>${preview.def}</b></div>
            <div class="stat-box"><span>Уворот</span><b>${preview.dodge}%</b></div><div class="stat-box"><span>Крит</span><b>${preview.crit}%</b></div>
            <div class="stat-box"><span>Зон блока</span><b>${preview.blockZones}</b></div><div class="stat-box"><span>Кураж за удар</span><b>+${archetype ? archetype.mods.ragePerHit : BASE_ARCHETYPE_MODS.ragePerHit}</b></div>
          </div>
          <div class="field" style="margin-top: 20px;">
            <label>Стартовое снаряжение</label>
            <div class="chips">${startEquipmentChips}</div>
          </div>
        </section>
      </div>
    </section>
  `;
}

function tryStartGame() {
  const c = view.create; if (!c) return;
  if (c.points > 0) { toast(`Распределите ещё ${c.points} очк.`, "warn"); return; }
  if (!ARCHETYPE_MAP[c.archetype]) { toast("Выберите архетип.", "warn"); return; }
  createHero(c.name, c.attrs, c.portrait, c.archetype); view.create = null; view.screen = "hub"; view.summary = null; render(); toast(`Добро пожаловать, ${state.name}.`, "ok");
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

  return `
    <button class="brand" data-act="goto" data-screen="hub" type="button"><span class="brand-text"><b>ВОСХОЖДЕНИЕ</b></span></button>
    <div class="vitals">
      <div class="vital"><div class="vital-top"><span>HP</span><b>${state.hp}<i>/${st.maxHp}</i></b></div>${bar("hp", state.hp, st.maxHp)}</div>
      <div class="vital"><div class="vital-top"><span>МАНА</span><b>${state.mana}<i>/${st.maxMana}</i></b></div>${bar("mana", state.mana, st.maxMana)}</div>
      <div class="vital energy-vital"><div class="vital-top"><span>ЭНЕРГИЯ</span><b>${state.energy}<i>/${st.maxEnergy}</i></b></div>${bar("energy", state.energy, st.maxEnergy)}</div>
      <div class="pill gold"><span>💰</span><b>${state.gold}</b></div><div class="pill">УР <b>${state.level}</b></div>
      ${state.points > 0 ? `<button class="pill gold points" data-act="goto" data-screen="hero" type="button">+<b>${state.points}</b></button>` : ""}
      <div class="pill">ЭТАЖ <b>${state.maxFloor}/5</b></div>
      <div class="pill time event-pill${phase.towerOpen ? "" : " night"}" data-tip="${event ? `${event.icon} ${event.name}: ${esc(event.desc)}` : "Сегодня обычный день — событий нет"}">${phase.icon} <b>${phase.name}</b> · ${calendarLabel()}</div>
      ${weeklyPill}
    </div>
    <nav class="topnav${lockNav}">
      <button class="nav-btn icon-btn${hasRewards ? " ok" : ""}" data-act="quests-open" type="button" title="Журнал заданий">📋</button>
      <button class="nav-btn icon-btn" data-act="bestiary-open" type="button" title="Бестиарий">📖</button>
      <button class="nav-btn icon-btn" data-act="goto" data-screen="hero" type="button" title="Меню Героя">👤</button>
      <button class="nav-btn icon-btn" data-act="goto" data-screen="hub" type="button" title="Вернуться в Йорстед">🏰</button>
    </nav>
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
          <img class="loc-image" src="assets/backgrounds/training.webp" onerror="this.style.display='none'" alt="">
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

function npcDialogueBar(npcId, buyLabel, sellLabel) {
  const tab = view.shopTab;
  const npcName = NPC_NAMES[npcId] || npcId;
  
  const storyIndex = state.npcDialogueIndex[npcId] || 0;
  const storyArr = DIALOGS[npcId]?.story;
  const currentSlide = (!view.storyJustPlayed && Array.isArray(storyArr)) ? storyArr[storyIndex] : null;

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
            <button class="btn ghost" data-act="story-leave" data-npc="${npcId}" type="button" style="align-self: flex-start; margin-top: 8px;">Уйти</button>
          </div>
        </div>
      </div>
    `;
  }

  const phrase = view.shopNpcPhrase || getRandomPhrase(npcId, "greetings");
  
  const btn = (tabId, label) =>
    `<button class="shop-tab${tab === tabId ? " active" : ""}" data-act="shop-tab" data-tab="${tabId}" data-npc="${npcId}" type="button" style="text-align: center;">${label}</button>`;
    
  return `
    <div class="npc-dialogue-bar">
      <img class="npc-portrait" src="${npcPortraitSrc(npcId)}" alt="${esc(npcName)}" style="background-color: #171210;">
      <div class="npc-dialogue-text" style="display: flex; flex-direction: column; justify-content: flex-start; padding-top: 4px;">
        <p class="npc-name" style="margin-top: 0;">${esc(npcName)}</p>
        <p class="npc-dialogue">«${esc(phrase)}»</p>
      </div>
      <div class="npc-dialogue-actions">
        ${btn("buy", buyLabel)}
        ${sellLabel ? btn("sell", sellLabel) : ""}
        ${btn("quests", "📜 Есть задания?")}
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

  const potionRows = acceptsPotions
    ? Object.values(ITEMS).filter((i) => i.type === "potion" && (state.potions[i.id] || 0) > 0).map((item) => {
    const id = item.id; const count = state.potions[id];
    const price = sellPrice(item) * count;
    return `<label class="sell-row${sel.has(id) ? " picked" : ""}" data-act="sell-toggle" data-id="${id}" data-shop="${shopName}">
      <input type="checkbox" ${sel.has(id) ? "checked" : ""} type="button">
      <span class="sell-icon">${iconHtml(item.icon, 28)}</span>
      <span class="sell-name">${item.name} ×${count}</span>
      <span class="price">${price} 💰</span>
    </label>`;
  }).join("") : "";

  const gearRows = acceptsGear
    ? state.owned.filter((inst) => !isEquipped(inst.uid) && !(ITEMS[inst.id]?.type === "potion") && gearOk(ITEMS[inst.id]?.slot)).map((inst) => {
    const item = ITEMS[inst.id]; if (!item) return "";
    const price = sellPrice(item, inst);
    return `<label class="sell-row${sel.has(inst.uid) ? " picked" : ""}" data-act="sell-toggle" data-id="${inst.uid}" data-shop="${shopName}">
      <input type="checkbox" ${sel.has(inst.uid) ? "checked" : ""}>
      <span class="sell-icon">${iconHtml(item.icon, 28)}</span>
      <span class="sell-name">${getItemDisplayName(inst)}<i class="hint"> · прочность ${durabilityOf(inst)}</i></span>
      <span class="price">${price} 💰</span>
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
  return `
    <section class="shop-group">
      <h2 class="group-title">💰 Скупка <span class="hint">— отмечайте всё лишнее, продажа одним кликом</span></h2>
      <div class="sell-grid">
        ${gearRows ? `<h3 class="group-title">Снаряжение</h3>${gearRows}` : ""}
        ${potionRows ? `<h3 class="group-title">Зелья</h3>${potionRows}` : ""}
      </div>
      <div class="repair-all">
        <span class="price">Итого: ${total} 💰</span>
        <button class="btn primary" data-act="sell-submit" data-shop="${shopName}" ${sel.size ? "" : "disabled"} type="button">Продать выбранное (${total} 💰)</button>
      </div>
    </section>
  `;
}

function marketHtml() {
  return `<div class="screen-bg" style="background-image: url('assets/backgrounds/market.webp');"></div>
    ${subHeader("Торговая площадь", "Здесь торгуют, куют и варят", "hub", "← В Йорстед")}
    <div class="locations">
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

  const tab = view.shopTab === "quests" ? "quests" : "buy";
  const content =
    tab === "quests"
      ? npcQuestHtml("stella")
      : `<div class="hotel-status"><span>🛏️ Номер: ${HOTEL_PRICE} 💰 · до утра</span></div>
         <section class="hotel-rest"><div class="hotel-rest-icon">🛏️</div><div class="hotel-rest-body"><h2>Снять номер</h2><p>Полностью восстановит HP, ману и энергию и перенесёт на утро следующего дня.</p></div><div class="hotel-rest-buy"><span class="price">${HOTEL_PRICE} 💰</span><button class="btn primary" data-act="hotel-rest" type="button" ${canHotel ? "" : "disabled"}>Снять номер</button></div></section>
         <h2 class="group-title">Спутницы</h2>${companionNote}<div class="companion-grid">${cards}</div>`;

  return `
    <div class="screen-bg" style="background-image: url('assets/backgrounds/hotel.webp');"></div>
    ${subHeader("Гостиница", "Тёплый свет и чужие истории", "hub", "← В Йорстед")}
    ${npcDialogueBar("stella", "Снять номер", "")}
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
  const tab = view.shopTab === "quests" ? "quests" : "buy";
  const cap = trainingCap(state.level);
  const warning = state.phase === 0
    ? (state.energy < TRAINING_ENERGY_COST ? `<div class="banner warn-banner">⚡ Не хватает энергии.</div>` : `<div class="banner">⏳ Тренировка занимает весь день.</div>`)
    : `<div class="banner warn-banner">🌙 Сейчас не утро.</div>`;

  let content = "";
  if (tab === "quests") content = trainingQuestsListHtml();
  else if (tab === "buy") content = `${warning}<div class="training-grid">${TRAININGS.map((t) => {
    const avail = trainingAvailability(t); const current = state.attrs[t.attr]; const atCap = current >= cap;
    return `<article class="training-card${avail.ok ? "" : " disabled"}"><div class="training-head"><span class="training-icon">${t.icon}</span><div class="training-name"><h3>${t.name}</h3><span class="training-attr">${ATTR_INFO.find((a) => a.id === t.attr).name}: ${current} / ${cap}</span></div></div><p class="item-desc">${t.desc}</p><div class="training-foot"><button class="btn small${avail.ok ? " primary" : ""}" data-act="train" data-id="${t.id}" ${avail.ok ? "" : "disabled"} type="button">${avail.ok ? `Тренироваться` : avail.reason}</button></div></article>`;
  }).join("")}</div>`;

  return `
    <div class="screen-bg" style="background-image: url('assets/backgrounds/training.webp');"></div>
    ${subHeader("Зал Охотников", "Место сбора авантюристов", "hub")}
    ${npcDialogueBar("ivan", "Тренировки", "")}
    ${content}
  `;
}

function trainingQuestsListHtml() {
  return npcQuestHtml("ivan");
}

function questsModalHtml() {
  ensureWeekQuests();
  const list = state.weekQuests.list || [];

  const npcName = (id) => NPC_NAMES[id] || id;
  
  const cards = list.map((q) => {
    const title = q.type === "kill" ? `Убить: ${q.mobName}` : `Собрать: ${q.resName}`;

    let statusHtml = `<span class="badge">Предложение недели</span>`;
    if (q.status === "active") statusHtml = `<span class="badge">В работе</span>`;
    else if (q.status === "done") statusHtml = `<span class="badge" style="border-color: var(--gold); color: var(--gold);">Готово (сдать: ${esc(npcName(q.npc).split(",")[0])})</span>`;
    else if (q.status === "claimed") statusHtml = `<span class="badge" style="border-color: var(--line2); color: var(--dim);">Получено</span>`;

    return `
      <article class="quest-card quest-card-wide${q.status === "claimed" ? " claimed" : q.status === "done" ? " done" : ""}">
        <div class="quest-body">
          <div class="quest-info">
            <div class="quest-title" style="display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: baseline;">
              <h3 style="margin: 0;">${title}</h3>
              <span class="hint" style="white-space: nowrap;">Наниматель: <b>${esc(npcName(q.npc))}</b></span>
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

  return `
    <div class="doll-menu-backdrop" data-act="quests-close"></div>
    <div class="doll-menu quest-modal" role="dialog">
      <div class="doll-menu-head">
        <h3>Журнал · Недельные заказы</h3>
        <button class="doll-menu-close" data-act="quests-close" type="button">✕</button>
      </div>
      <p class="hint" style="margin: 0 0 12px;">Заказы выдаются в понедельник утром, до конца недели. Взять — у NPC лично.</p>
      <div class="quest-grid" style="grid-template-columns: 1fr; gap: 8px;">
        ${cards || `<p class="empty">На этой неделе предложений нет.</p>`}
      </div>
    </div>
  `;
}

function bestiaryModalHtml() {
  const cards = FLOORS.flatMap((floor) => {
    const bossDefeated = Boolean(state.cleared[floor.id]);
    const entries = [...floor.mobs.map((def) => ({ def, floor, isBoss: false })), { def: floor.boss, floor, isBoss: true }];
    return entries.map(({ def, floor, isBoss }) => {
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
          <span class="hint">Этаж ${floor.id}</span>
        </article>`;
    });
  }).join("");

  const total = FLOORS.reduce((n, f) => n + f.mobs.length + 1, 0);
  const knownCount = FLOORS.reduce((n, f) => n + f.mobs.filter((m) => state.bestiary[m.id]).length + (state.cleared[f.id] ? 1 : 0), 0);

  return `
    <div class="doll-menu-backdrop" data-act="bestiary-close"></div>
    <div class="doll-menu quest-modal" role="dialog">
      <div class="doll-menu-head">
        <h3>📖 Бестиарий (${knownCount}/${total})</h3>
        <button class="doll-menu-close" data-act="bestiary-close" type="button">✕</button>
      </div>
      <p class="hint" style="margin: 0 0 12px;">Обычные существа открываются при первой встрече в бою; имя босса — после победы над ним.</p>
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

function shopItemsHtml(tabs, activeId, shopName) {
  const activeTab = tabs.find((t) => t.id === activeId) || tabs[0];
  return activeTab.slots.map((slot) => {
    const items = Object.values(ITEMS).filter((i) => i.slot === slot && i.price > 0 && shopFloorFor(i) <= state.maxFloor);
    const cards = items.map((item) => {
      const copies = copiesOf(item.id);
      const equippedInfo = equippedUidOf(item.id);
      const p = priceFor(item, shopName);
      const canBuy = state.gold >= p.price;
      
      let label = `Купить · ${p.price} 💰`; 
      if (!canBuy) label = `Нужно ${p.price} 💰`;
      
      const countChip = copies.length ? `<span class="chip ok">В сумке: ${copies.length}</span>` : "";
      const equippedChip = equippedInfo ? `<span class="chip ok">Надето: ${SLOT_NAME[equippedInfo.slot] || equippedInfo.slot}</span>` : "";
      const durChips = copies.map((inst) => durabilityChip(inst)).join("");
      
      return `<article class="gear-card${copies.length ? " owned" : ""}">
        <div class="gear-card-head">
          <div class="item-icon">${iconHtml(item.icon, 48)}</div>
          <div class="gear-card-info">
            <h3>${item.name}</h3>
            <p class="item-desc">${item.desc}</p>
            <div class="chips">${statsChips(item)}${countChip}${equippedChip}${durChips}</div>
            ${damageStatsHtml(item)}
          </div>
        </div>
        <div class="gear-card-foot">
          <span class="price">${priceHtml(item, shopName)}</span>
          <button class="btn small" data-act="buy" data-id="${item.id}" data-shop="${shopName}" ${canBuy ? "" : "disabled"} type="button">${label}</button>
        </div>
      </article>`;
    }).join("");
    return `<section class="shop-group"><h2 class="group-title">${SLOT_ICON[slot] || ""} ${SLOT_NAME[slot]}</h2><div class="item-grid">${cards}</div></section>`;
  }).join("");
}

function materialChipHtml(resId, need) {
  const res = ALL_RESOURCES.find((r) => r.id === resId);
  const have = state.resources[resId] || 0;
  const enough = have >= need;
  return `<span class="chip material${enough ? " ok" : " lack"}">${iconHtml(res ? res.icon : "❔", 16)} ${res ? res.name : resId} ${have}/${need}</span>`;
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
  const tab = view.shopTab;
  const content =
    tab === "sell" ? sellPanelHtml("forge")
    : tab === "quests" ? npcQuestHtml("ron")
    : tab === "craft" ? craftPanelHtml("forge")
    : tab === "buy" ? [
        shopItemsHtml([{ id: "held", name: "Оружие и щиты", slots: ["mainhand", "offhand"] }], "held", "forge"),
        shopItemsHtml([{ id: "armor", name: "Доспехи", slots: ["head", "neck", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet"] }], "armor", "forge"),
      ].join("")
    : "";

  return `<div class="screen-bg" style="background-image: url('assets/backgrounds/forge.webp');"></div>
    ${subHeader("Кузница", "Оружие и броня", "market", "← Назад")}
    ${npcDialogueBar("ron", "🛒 Показать товары", "💰 Хочу продать")}
    <div class="shop-grid"><div class="shop-main">${content}</div></div>
  `;
}

function jewelryHtml() {
  const tab = view.shopTab;
  const content =
    tab === "sell" ? sellPanelHtml("jewelry")
    : tab === "quests" ? npcQuestHtml("elize")
    : tab === "craft" ? craftPanelHtml("jewelry")
    : tab === "buy" ? shopItemsHtml([{ id: "jewelry", name: "Украшения", slots: ["neck", "ring", "trinket"] }], "jewelry", "jewelry")
    : "";

  return `
    <div class="screen-bg" style="background-image: url('assets/backgrounds/jewelry.webp');"></div>
    ${subHeader("Ювелирная лавка", "Тонкая работа", "market", "← Назад")}
    ${npcDialogueBar("elize", "🛒 Показать товары", "💰 Хочу продать")}
    <div class="shop-grid"><div class="shop-main">${content}</div></div>
  `;
}

function alchemyHtml() {
  const tab = view.shopTab;
  let content = "";
  if (tab === "sell") content = sellPanelHtml("alchemy");
  else if (tab === "quests") content = npcQuestHtml("elain");
  else if (tab === "buy" || tab === null) {
    const cards = Object.values(ITEMS).filter((i) => i.slot === "potion").map((item) => {
      const count = state.potions[item.id] || 0;
      const full = item.effect === "hp" ? state.hp >= stats().maxHp : state.mana >= stats().maxMana;
      const p = priceFor(item, "alchemy");
      return `<article class="item-card potion"><div class="item-icon big">${iconHtml(item.icon, 48)}</div><div class="item-main"><h3>${item.name}</h3><p class="item-desc">${item.desc}</p><div class="chips"><span class="chip">В сумке: ${count}</span></div></div><div class="item-buy"><span class="price">${priceHtml(item, "alchemy")}</span><div class="stack-buttons"><button class="btn small" data-act="buy-item" data-id="${item.id}" data-shop="alchemy" ${state.gold < p.price ? "disabled" : ""} type="button">Купить</button><button class="btn small ghost" data-act="drink" data-id="${item.id}" ${count <= 0 || full ? "disabled" : ""} type="button">Выпить</button></div></div></article>`;
    }).join("");
    content = `<section class="shop-group"><div class="item-grid">${cards || `<p class="empty">Зелий нет.</p>`}</div></section>`;
  }

  return `
    <div class="screen-bg" style="background-image: url('assets/backgrounds/alchemy.webp');"></div>
    ${subHeader("Лавка Алхимика", "Зелья и настои", "market", "← Назад")}
    ${npcDialogueBar("elain", "🛒 Показать товары", "💰 Хочу продать")}
    <div class="shop-grid single"><div class="shop-main">${content}</div></div>
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
    title = `title="${item.name}${affix}${stats ? ` — ${stats}` : ""}"`;
  } else {
    title = `title="${slot.name}: пусто"`;
  }

  return `<button class="doll-slot${item ? " filled" : ""}${open ? " open" : ""}${broken ? " broken" : ""}${rarityClass}" data-act="doll-slot" data-slot="${slot.id}" type="button" ${title}><span class="slot-glyph">${iconHtml(item ? item.icon : slot.icon, 24)}</span><span class="slot-caption">${slot.name}</span></button>`;
}

function paperDollHtml() {
  const left = DOLL_LEFT.map(dollSlotHtml).join(""); const right = DOLL_RIGHT.map(dollSlotHtml).join(""); const count = Object.values(state.equipped).filter(Boolean).length;
  return `<div class="paper-doll"><div class="doll-col">${left}</div><div class="doll-center"><div class="doll-figure"><img src="${portraitSrc(state.portrait)}" alt=""></div><div class="doll-name"><b>${esc(state.name)}</b><span>УР ${state.level} · надето ${count} / ${SLOTS.length}</span></div></div><div class="doll-col">${right}</div></div>`;
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
    return `<button class="doll-item${equippedAt === slot.id ? " equipped" : ""}${rarityClass(inst)}" data-act="doll-equip" data-uid="${inst.uid}" data-slot="${slot.id}" type="button"><span class="item-icon">${iconHtml(item.icon, 32)}</span><span class="doll-item-body"><span class="doll-item-name">${getItemDisplayName(inst)}</span><span class="chips">${statsChips(item, inst)}</span></span></button>`;
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
  return `<div class="doll-menu-backdrop" data-act="inv-menu-close"></div><div class="doll-menu" role="dialog"><div class="doll-menu-head"><h3>Предмет</h3><button class="doll-menu-close" data-act="inv-menu-close" type="button">✕</button></div><div class="inv-menu-preview">${iconHtml(item.icon, 40)}<span class="inv-menu-info"><b>${getItemDisplayName(inst)}</b><span class="chips"><span class="chip" style="border-color:${tier.color};color:${tier.color};">${tier.name}</span>${statsChips(item, inst)}</span><span class="hint">${item.desc}</span></span></div>${slotNote}<div class="inv-menu-actions"><button class="btn small" data-act="inv-equip" data-uid="${inst.uid}" ${canEquip ? "" : "disabled"} type="button">Надеть</button></div></div>`;
}

function buybackPanelHtml(shop) {
  if (shop === "alchemy") {
    const potionItems = Object.values(ITEMS).filter((i) => i.type === "potion" && (state.potions[i.id] || 0) > 0);
    const instanced = state.owned.filter((inst) => !isEquipped(inst.uid) && ITEMS[inst.id]?.slot === "potion");
    const rows = [
      ...potionItems.map((item) => `<div class="resource-row"><span>${iconHtml(item.icon, 24)} <b>${item.name}</b> <span class="chip">×${state.potions[item.id]}</span></span><button class="btn small ghost" data-act="sell-potion" data-id="${item.id}" type="button">Продать 1 (+${sellPrice(item, inst)} 💰)</button></div>`),
      ...instanced.map((inst) => {
        const item = ITEMS[inst.id];
        return `<div class="resource-row${rarityClass(inst)}"><span>${iconHtml(item.icon, 24)} <b>${getItemDisplayName(inst)}</b> ${durabilityChip(inst)}</span><button class="btn small ghost" data-act="sell" data-uid="${inst.uid}" type="button">Продать (+${sellPrice(item, inst)} 💰)</button></div>`;
      }),
    ];
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
    const bag = state.owned.filter((inst) => !isEquipped(inst.uid));
    if (!bag.length) return `<p class="empty">Инвентарь пуст.</p>`;
    const q = view.invSearch.trim().toLowerCase();
    const filtered = bag.filter((inst) => {
      const item = ITEMS[inst.id]; if (!item) return false;
      if (view.invFilter === "weapon" && item.slot !== "mainhand" && item.slot !== "offhand") return false;
      if (view.invFilter === "armor" && !["head", "neck", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet"].includes(item.slot)) return false;
      if (view.invFilter === "jewelry" && !["ring", "trinket"].includes(item.slot)) return false;
      if (q && !getItemDisplayName(inst).toLowerCase().includes(q)) return false;
      return true;
    });
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
      const tier = RARITY_TIERS[inst.rarity] || RARITY_TIERS.common;
      const statLine = itemStats(item, inst).join(", ");
      const affixLine = (inst.affix?.bonuses || []).filter((b) => ATTR_LABEL[b.id]).map((b) => `${ATTR_LABEL[b.id]} +${b.value}`).join(", ");
      const eff = inst.unique ? UNIQUE_EFFECTS.find((u) => u.id === inst.unique) : null;
      let title = `${getItemDisplayName(inst)} (${tier.name})`;
      if (statLine) title += ` — ${statLine}`;
      if (affixLine) title += `, ${affixLine}`;
      if (eff) title += `. ✨ ${eff.name}: ${eff.desc}`;
      return `<button class="inv-slot${rarityClass(inst)}" data-act="inv-slot-click" data-uid="${inst.uid}" type="button" title="${esc(title)}">${iconHtml(item.icon, 40)}</button>`;
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
        <div class="attr-head"><h2 class="group-title">Атрибуты</h2></div>
        <div class="attr-list hero">${ATTR_INFO.map((attr) => { const gearBonus = st.gearAttrs?.[attr.id] || 0; return `<div class="attr-row"><div class="attr-info"><b>${attr.name}</b><span class="hint">${attr.effect}</span></div><div class="attr-controls"><span class="attr-value">${st.attrs[attr.id]}${gearBonus ? `<i class="attr-gear" title="От снаряжения">+${gearBonus}</i>` : ""}</span><button class="attr-btn" data-act="add-attr" data-attr="${attr.id}" ${state.points <= 0 ? "disabled" : ""} type="button">+</button></div></div>`; }).join("")}</div>
      </section>

      <section class="panel doll-panel">
        <div style="display: flex; justify-content: center; margin-bottom: 15px;">
          <button class="btn${view.inventoryTab === "talents" ? " primary" : " ghost"}" data-act="inventory-tab" data-tab="talents" type="button" style="min-width: 200px;">
            🌟 Таланты
          </button>
        </div>

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
    <div class="danger-zone"><button class="btn tiny danger" data-act="reset" type="button">Сбросить прогресс</button></div>
  `;
}

function towerHtml() {
  const reason = towerClosedReason();

  const floors = FLOORS.map((floor) => {
    const locked = floor.id > state.maxFloor;
    const cleared = Boolean(state.cleared[floor.id]);

    return `
      <article class="floor-card${locked ? " locked" : ""}${cleared ? " cleared" : ""}" 
               style="position: relative; overflow: hidden; min-height: 220px; border: 1px solid var(--line); border-radius: 16px; padding: 0;">
        
         <div style="position: absolute; inset: 0; background-image: url('${floor.cardImg || floor.bg || "assets/backgrounds/tower.webp"}'); background-size: cover; background-position: center; z-index: 0; ${locked ? 'filter: grayscale(1) brightness(0.6);' : 'filter: brightness(0.6);'}"></div>
        
        <div style="position: relative; z-index: 1; background: linear-gradient(90deg, rgba(10, 8, 7, 0.05) 0%, rgba(10, 8, 7, 0.00) 100%); height: 100%; padding: 24px; display: flex; flex-direction: column; justify-content: center;">
          
          <span class="loc-kicker" style="color: var(--gold); font-size: 11px; letter-spacing: 0.1em;">
            ЭТАЖ ${floor.id} ${locked ? "· ЗАПЕЧАТАН" : cleared ? "· ПРОЙДЕН" : ""}
          </span>
          
          <h2 style="font-size: 28px; margin: 6px 0 10px 0; color: var(--gold2); text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${floor.name}</h2>
          
          <p class="item-desc" style="color: #d1c0aa; font-size: 14px; line-height: 1.5; max-width: 600px; margin: 0 0 20px 0; font-style: italic;">
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
    
    <div class="floors" style="display: flex; flex-direction: column; gap: 20px; max-width: 900px; margin: 0 auto;">
      ${floors}
    </div>
  `;
}

function floorHtml() {
  const floor = FLOORS.find((f) => f.id === view.currentFloor);
  if (!floor) return towerHtml();

  const canFight = !isNight() && state.energy >= FIGHT_ENERGY_COST;
  const reason = towerClosedReason();

  const potionsHtml = Object.values(ITEMS).filter(i => i.slot === "potion" && (state.potions[i.id] || 0) > 0).map(i => {
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
    
    ${state.debuff ? `<div class="banner warn-banner">${state.debuff.icon} ${state.debuff.name}: ${state.debuff.desc} · боёв осталось: ${state.debuff.battles}</div>` : ""}
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

  if (res.type === "event") {
    title = res.ev.debuff.name;
    icon = res.ev.debuff.icon;
    color = "#e8b09a";
  } else if (res.type === "loot") {
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

function enemyStatusHtml(enemy) {
  const badges = [];
  if (enemy.rarity === "rare") badges.push(`<span class="badge rare">✦ Редкий</span>`);
  if (enemy.rarity === "elite") badges.push(`<span class="badge elite">★ Элитный</span>`);
  const chips = [];
  if (enemy.modifier) {
    const mod = MOB_MODIFIERS[enemy.modifier];
    if (mod) chips.push(`<span class="chip mod-chip" title="${esc(mod.desc)}">${mod.icon} ${mod.name} · ${mod.desc}</span>`);
  }
  if (enemy.ability) {
    const info = MOB_ABILITY_INFO[enemy.ability];
    if (info) chips.push(`<span class="chip ability-chip" title="${esc(info.desc)}">${info.icon} ${info.name}</span>`);
  }
  if (!badges.length && !chips.length) return "";
  return `<div class="enemy-status">${badges.join("")}${chips.join("")}</div>`;
}

function battleHtml(st) {
  const battle = view.battle; 
  const enemy = battle.enemy; 
  
  const currentFloorData = FLOORS.find(f => f.id === battle.floorId);
  const bgImage = currentFloorData && currentFloorData.bg ? currentFloorData.bg : "assets/backgrounds/tower.webp";

  const zones = zoneButtons(); 
  const counterFormatted = Math.round(st.counter * 10) / 10;
  
  const ragePips = Array.from({ length: 5 }, (_, i) =>
    `<span class="pip${i < battle.rage ? " on" : ""}"></span>`
  ).join("");

  const mainInst = state.equipped.mainhand ? getInstance(state.equipped.mainhand) : null;
  setActiveWeaponInstance(mainInst);
  const playerWeapon = mainInst ? ITEMS[mainInst.id] : null;
  
  const chestInst = state.equipped.chest ? getInstance(state.equipped.chest) : null;
  const playerArmorType = chestInst ? ITEMS[chestInst.id]?.armorType : null;

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

  const activeStyle = (weaponStyleValue(playerWeapon, view.attackStyle) || 0) > 0
    ? view.attackStyle
    : weaponBestStyle(playerWeapon);
  const styleButtonsHtml = STYLE_ORDER.map((s) => {
    const value = weaponStyleValue(playerWeapon, s);
    const disabled = value <= 0;
    const sel = activeStyle === s ? " selected" : "";
    const tip = disabled ? "Это оружие так не бьёт" : `Множитель стиля x${weaponStyleMult(playerWeapon, s).toFixed(2)}`;
    return `<button class="zone attack${sel}" data-act="attack-style" data-style="${s}" ${disabled ? "disabled" : ""} type="button" title="${tip}">${STYLE_ICONS[s]} ${STYLE_NAMES[s]}</button>`;
  }).join("");

  const log = battle.log.slice(-18).map((entry) =>
    `<div class="log-line ${entry.cls}">${esc(entry.text)}</div>`
  ).join("");

  const activeZoneTip = ZONE_MAP[view.attackZone]?.tip || "";

  const controls = battle.over ? "" : `
    <div class="controls">
      <div class="control-group">
        <h3>Куда бить</h3>
        <div class="zones">${zones.attack}</div>
        ${activeZoneTip ? `<div class="zone-tip hint">${esc(activeZoneTip)}</div>` : ""}
        <h3 style="margin-top: 12px;">Как бить</h3>
        <div class="zones" style="grid-template-columns: repeat(3, 1fr);">${styleButtonsHtml}</div>
      </div>
      <div class="control-group">
        <h3>Что блокировать</h3>
        <div class="zones">${zones.block}</div>
      </div>
      <div class="battle-actions">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px; background: var(--panel2); padding: 6px 10px; border-radius: 8px; border: 1px solid var(--line);">
          <span class="rage-label" style="font-size: 11px; margin: 0; color: var(--dim);">Кураж</span>
          <div class="rage" style="margin: 0;">${ragePips}</div>
        </div>
        <button class="btn primary big" data-act="exchange" type="button">Размен</button>
        <button class="btn tech" data-act="tech" type="button" ${battle.rage < 3 || state.mana < TECH_COST ? "disabled" : ""}>Приём</button>
        ${Object.values(ITEMS).filter(i => i.slot === "potion" && (state.potions[i.id] || 0) > 0).map(i => {
          const canDrink = canDrinkPotion(i.id);
          return `<button class="btn small ghost" data-act="drink" data-id="${i.id}" ${!canDrink ? "disabled" : ""} type="button">${iconHtml(i.icon, 16)} ${i.name} ×${state.potions[i.id]}</button>`;
        }).join("")}
        <button class="btn ghost" data-act="flee" type="button">Сбежать</button>
      </div>
    </div>
  `;

  return `
    <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-image: linear-gradient(rgba(10, 8, 7, 0.3), rgba(10, 8, 7, 0.3)), url('${bgImage}'); background-size: cover; background-position: center; z-index: 0; pointer-events: none;"></div>
    
    <section class="battle" style="position: relative; z-index: 1; padding-top: 10px;">
      
      ${battle.ambush ? `<div class="banner warn-banner">🔪 ${AMBUSH_TEXT}</div>` : ""}

      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="font-size: 36px; letter-spacing: 0.2em; color: ${battle.boss ? "#ff6b6b" : "var(--gold2)"}; text-shadow: 0 0 20px rgba(${battle.boss ? "255, 107, 107" : "217, 169, 75"}, 0.4); margin: 0;">
          ${battle.boss ? "БОСС" : "БОЙ"}
        </h1>
      </div>

      <div class="fighters">
        <!-- ГЕРОЙ -->
        <article class="fighter hero-fighter">
          <div class="fighter-avatar portrait" style="width: 120px; height: 120px; flex: 0 0 120px; border-radius: 12px; overflow: hidden; padding: 0;">
            <img src="${portraitSrc(state.portrait)}" alt="${esc(state.name)}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div class="fighter-body" style="display: flex; flex-direction: column; height: 100%;">
            
            <div style="margin-bottom: 8px;">
              <div class="fighter-name" style="margin: 0;">${esc(state.name)} <span class="muted">УР ${state.level}</span></div>
            </div>

            <div>
              ${bar("hp", state.hp, st.maxHp)}
              ${bar("mana", state.mana, st.maxMana)}
              <div class="fighter-numbers"><span>${state.hp} / ${st.maxHp} HP</span><span>${state.mana} / ${st.maxMana} маны</span></div>
            </div>

            <div style="margin-top: 8px; font-size: 12px; color: var(--dim);">
              Оружие: <span title="${esc(playerWeaponTitle)}" style="cursor: help; border-bottom: 1px dotted var(--dim); color: #d1c0aa;">${playerWeapon ? playerWeapon.name : "Кулаки"}</span><br>
              Броня: <span title="${esc(playerArmorTitle)}" style="cursor: help; border-bottom: 1px dotted var(--dim); color: #d1c0aa;">${ARMOR_TYPE_NAMES[playerArmorType] || "Нет"}</span>
            </div>

            <div class="mob-stats-container" style="margin-top: auto; padding-top: 10px;">
              <span class="mob-stat-chip atk" style="font-size: 13px; padding: 5px 12px;">⚔ ${st.atk}</span>
              <span class="mob-stat-chip def" style="font-size: 13px; padding: 5px 12px;">🛡 ${st.def}</span>
              <span class="mob-stat-chip" style="font-size: 13px; padding: 5px 12px; color: var(--dim); border-color: var(--line);">🎯 ${st.crit}%</span>
              <span class="mob-stat-chip" style="font-size: 13px; padding: 5px 12px; color: var(--dim); border-color: var(--line);">💨 ${st.dodge}%</span>
            </div>

          </div>
        </article>

        <div class="vs" style="align-self: center;">VS</div>

        <!-- ВРАГ -->
        <article class="fighter enemy-fighter${battle.hp <= 0 ? " dead" : ""}">
          <div class="fighter-avatar" style="width: 120px; height: 120px; flex: 0 0 120px; border-radius: 12px; background: #1c1511; border: 1px solid var(--line2); overflow: hidden; padding: 0;">
            <img src="${resolveIcon(enemy.icon)}" alt="" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div class="fighter-body" style="display: flex; flex-direction: column; height: 100%;">
            
            <div style="margin-bottom: 8px;">
              <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px;">
                <div class="fighter-name" style="margin: 0;">${enemy.name} ${battle.boss ? `<span class="badge boss">Босс</span>` : ""}</div>
                
                <div class="enemy-status" style="display: flex; gap: 4px; margin: 0;">
                  ${enemy.rarity === "rare" ? `<span class="chip rare" style="border-color: var(--gold); color: var(--gold); font-size: 10px; padding: 2px 6px;" title="Редкий враг">Редкий</span>` : ""}
                  ${enemy.rarity === "elite" ? `<span class="chip elite" style="border-color: #c2483c; color: #c2483c; font-size: 10px; padding: 2px 6px;" title="Элитный враг">Элитный</span>` : ""}
                  ${enemy.modifier ? `<span class="chip" style="font-size: 10px; padding: 2px 6px;" title="${MOB_MODIFIERS[enemy.modifier].desc}">${MOB_MODIFIERS[enemy.modifier].name}</span>` : ""}
                  ${enemy.ability ? `<span class="chip" style="font-size: 10px; padding: 2px 6px;" title="${MOB_ABILITY_INFO[enemy.ability].desc}">${MOB_ABILITY_INFO[enemy.ability].name}</span>` : ""}
                </div>
              </div>
            </div>

            <div>
              ${bar("hp enemy", battle.hp, battle.maxHp)}
              <div class="fighter-numbers"><span>${battle.hp} / ${battle.maxHp} HP</span></div>
            </div>

            <div style="margin-top: 8px; font-size: 12px; color: var(--dim);">
              Оружие: <span title="${esc(enemyWeaponTitle)}" style="cursor: help; border-bottom: 1px dotted var(--dim); color: #d1c0aa;">${enemyWeapon ? enemyWeapon.name : "Кулаки"}</span><br>
              Броня: <span title="${esc(enemyArmorTitle)}" style="cursor: help; border-bottom: 1px dotted var(--dim); color: #d1c0aa;">${ARMOR_TYPE_NAMES[enemy.armorType] || "Нет"}</span>
            </div>
            
            <div class="mob-stats-container" style="margin-top: auto; padding-top: 10px;">
              <span class="mob-stat-chip atk" style="font-size: 13px; padding: 5px 12px;">⚔ ${enemy.atk}</span>
              <span class="mob-stat-chip def" style="font-size: 13px; padding: 5px 12px;">🛡 ${enemy.def}</span>
            </div>

          </div>
        </article>
      </div>

      ${controls}

      <div class="battle-log" id="battle-log" aria-live="polite">
        ${log || `<div class="log-line info">Выберите зону удара и зоны блока, затем нажмите «Размен».</div>`}
      </div>

      ${resultHtml()}
    </section>
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
             ${loot.map((lootItem) => `
               <li${lootItem.kind === "recipe" ? ` class="loot-recipe"` : ""}>
                 ${iconHtml(lootItem.icon, 24)}
                 <span>${esc(lootItem.name)}</span>
                 ${lootItem.kind === "recipe" ? `<span class="badge">Рецепт</span>` : ""}
                 ${lootItem.amount > 1 ? `<b>×${lootItem.amount}</b>` : ""}
               </li>
             `).join("")}
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
      
      <div class="battle-log" style="text-align: left; height: 180px; margin-bottom: 20px; background: #0e0a08; border-color: #6a2a24;">
        ${log || `<div class="log-line info">Лог боя пуст.</div>`}
      </div>

      <button class="btn primary" data-act="result-continue" type="button">В Йорстед</button>
    </div>
  </div>`;
}

function subHeader(title, subtitle, backScreen, backLabel = "← Назад") {
  return `<div class="subhead"><button class="btn tiny ghost" data-act="goto" data-screen="${backScreen}" type="button">${backLabel}</button><div><h1>${title}</h1><p class="muted">${subtitle}</p></div><div class="subhead-gold">💰 <b>${state.gold}</b></div></div>`;
}

function scrollLog() { const log = document.getElementById("battle-log"); if (log) log.scrollTop = log.scrollHeight; }

function levelUpModalHtml() {
  const level = view.levelUp;
  if (!level) return "";

  return `
    <div class="result-overlay" data-act="levelup-close" style="z-index: 200;">
      <div class="result-card levelup-card">
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
  const screen = document.getElementById("screen"); const topbar = document.getElementById("topbar");
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
  if (view.levelUp) html += levelUpModalHtml();
  if (state.activeSceneId && view.screen !== "battle") html += sceneModalHtml();
  if (state.activeNpcId && view.screen !== "battle") html += traderDialogHtml();
  
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
  
  if (view.bestiaryOpen) html += bestiaryModalHtml();
  
  screen.innerHTML = html;
  screen.dataset.screen = view.screen; 
  
  if (view.screen === "battle") requestAnimationFrame(scrollLog);
}

function startBattle(floorId, mobKey) {
  const floor = FLOORS.find((f) => f.id === floorId); if (!floor) return; const def = mobKey === "boss" ? floor.boss : floor.mobs[Number(mobKey)]; if (!def) return;
  const spend = spendFightEnergy(); if (!spend.ok) { toast(spend.text, "warn"); render(); return; }
  beginBattle(def, floor.id);
  if (!def.boss && Math.random() < AMBUSH_CHANCE) {
    view.ambush = { floorId: floor.id, nextMobIndex: ambushMobIndex(floor, Number(mobKey)) };
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
  view.dollSlot = null;
  view.invItemUid = null;
  view.attackZone = "chest";
  view.blocks = ZONES.slice(0, Math.min(st.blockZones, ZONES.length)).map((z) => z.id);
  render();
}

function doExchange(type, potionId) {
  if (!view.battle || view.battle.over) return;
  const mainInst = state.equipped.mainhand ? getInstance(state.equipped.mainhand) : null;
  setActiveWeaponInstance(mainInst);
  const result = exchange(state, view.battle, { type, zone: view.attackZone, blocks: view.blocks, style: view.attackStyle, id: potionId });
  if (result.error) { toast(result.error, "warn"); return; } if (result.summary) view.summary = result.summary; render();
}

function endTrip() { if (!view.tripActive) return; view.tripActive = false; advancePhase(); }

function go(screen) {
  if (!state.created) return;
  
  if (!state.npcDialogueIndex) state.npcDialogueIndex = {};

  const shopNpc = SHOP_NPCS[screen];
  
  if (shopNpc) {
    if (view.activeShopNpc !== shopNpc) { 
      view.activeShopNpc = shopNpc; 
      view.sellSelection = []; 
      view.shopTab = null; 
    }
    view.shopNpcPhrase = getRandomPhrase(shopNpc, "greetings");
    view.talkNpcPhase = 0;
    view.storyJustPlayed = false;
  } else {
    view.activeShopNpc = null; 
    view.sellSelection = []; 
    view.shopTab = null;
  }
  
  if (view.autoExplore) stopAutoExplore("Авто-исследование остановлено.");
  if (battleActive()) { toast("Сначала завершите бой.", "warn"); return; }

  if (isNight() && ["market", "forge", "alchemy", "jewelry", "training"].includes(screen)) {
    toast("Ночью эта локация закрыта. Дождитесь утра.", "warn");
    return;
  }

  if (screen === "hero" && view.screen !== "hero") {
    view.heroBackScreen = view.screen;
  }

  if (screen === "tower") { 
    const reason = towerClosedReason(); 
    if (reason) { toast(reason, "warn"); return; } 
  }

  const leavingTower = view.tripActive && (view.screen === "tower" || view.screen === "battle") && screen !== "tower" && screen !== "battle" && screen !== "hero";
  if (leavingTower) endTrip();

  view.ambush = null;
  view.screen = screen;
  view.dollSlot = null;
  view.invItemUid = null;
  if (screen === "tower") view.tripActive = true;
  if (screen !== "battle") view.summary = null;
  
  render();
}

function onInput(event) {
  const el = event.target;
  if (el?.dataset?.role === "create-name" && view.create) { view.create.name = el.value; const caption = document.querySelector(".preview-portrait-caption b"); if (caption) caption.textContent = el.value.trim() || "Странник"; return; }
  if (el?.dataset?.role === "inv-search") {
    view.invSearch = el.value;
    const pos = el.selectionStart;
    render();
    const input = document.querySelector('[data-role="inv-search"]');
    if (input) { input.focus(); try { input.setSelectionRange(pos, pos); } catch { } }
  }
}

function startAutoExplore(floorId, avoidDanger) {
  if (view.autoExplore) return;
  const reason = towerClosedReason();
  if (reason) { toast(reason, "warn"); render(); return; }
  if (state.activeSceneId) { toast("Сначала разберитесь с активной сценой.", "warn"); render(); return; }
  if (state.activeNpcId) { toast("Сначала закончите разговор.", "warn"); render(); return; } // <-- Эта строка уже есть, проверь
  view.autoExplore = { floorId, avoidDanger, timer: null, log: [] };
  toast(avoidDanger ? "⏩ Авто-исследование: безопасный режим." : "⏩ Авто-исследование: боевой режим.", "info");
  render();
  view.autoExplore.timer = setTimeout(autoExploreLoop, 1200);
}

function autoExploreLoop() {
  const ae = view.autoExplore; if (!ae) return;
  if (battleActive()) return;
  if (view.exploreResult) return;
  if (isNight()) { stopAutoExplore("Наступила ночь. Авто-исследование остановлено."); return; }
  if (state.activeSceneId) resolveSceneAction("leave");
  if (!view.autoExplore) return;
  if (state.activeNpcId) applyNpcAction("leave", state.activeNpcId);
  if (!view.autoExplore) return;
  if (state.energy < FIGHT_ENERGY_COST) { stopAutoExplore("Энергия на исходе. Авто-исследование остановлено."); return; }
  autoExploreTick(ae.floorId, ae.avoidDanger);
  if (view.autoExplore) view.autoExplore.timer = setTimeout(autoExploreLoop, 2100);
}

function autoExploreTick(floorId, avoidDanger) {
  const ae = view.autoExplore; if (!ae) return;
  const floor = FLOORS.find((f) => f.id === floorId);
  if (!floor) { stopAutoExplore("Этаж не найден."); return; }
  const stamp = `[${new Date().toLocaleTimeString()}]`;

  if ((state.floorProgress[floorId] || 0) >= 100) {
    if (avoidDanger) { stopAutoExplore("Этаж пройден — исследовать нечего. В безопасном режиме здесь делать нечего."); return; }
    if (state.energy < FIGHT_ENERGY_COST) { stopAutoExplore("Энергия на исходе. Авто-исследование остановлено."); return; }
    const mobIndex = Math.floor(Math.random() * floor.mobs.length);
    ae.log.push(`${stamp} ⚔ Ищем боя: ${floor.mobs[mobIndex].name}.`);
    startBattle(floorId, mobIndex);
    return;
  }

  const res = exploreFloor(floorId);
  ae.log.push(`${stamp} ${res.text}`);
  if (ae.log.length > 30) ae.log.splice(0, ae.log.length - 30);
  toast(res.text, res.ok ? "ok" : "warn");
  if (!res.ok) { stopAutoExplore(); return; }

  // Если выпал NPC (Артур) — останавливаем авто-исследование, чтобы игрок мог поговорить
  if (res.npc) {
    stopAutoExplore("Появился странствующий торговец. Авто-исследование остановлено.");
    render();
    return;
  }

  if (res.encounter || res.scene || res.eventData) {
    if (res.encounter && !avoidDanger) {
      view.exploreResult = { 
        type: res.eventData ? "event" : "loot", 
        ev: res.eventData, 
        encounter: res.encounter, 
        scene: res.scene, 
        text: res.text 
      };
      render();
      return;
    } else if (res.eventData) {
      view.exploreResult = { type: "event", ev: res.eventData, text: res.text };
      render();
      return;
    } else if (res.scene) {
      // Если это сцена, мы должны остановить авто-режим, чтобы игрок её прошел
      stopAutoExplore("Наткнулись на сцену. Авто-исследование остановлено.");
      render();
      return;
    }
    ae.log.push(`${stamp} ⏭ Пропущено (безопасный режим).`);
  }
  render();
}

function stopAutoExplore(reason) {
  if (!view.autoExplore) return;
  clearTimeout(view.autoExplore.timer);
  view.autoExplore = null;
  if (reason) toast(reason, "warn");
  render();
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

function resolveSceneAction(type) {
  const floor = FLOORS.find((f) => f.id === state.activeSceneFloorId);
  const scene = floor ? (FLOOR_SCENES[floor.id] || []).find((s) => s.id === state.activeSceneId) : null;
  if (!scene || !floor) { state.activeSceneId = null; state.activeSceneFloorId = null; saveState(); render(); return; }

  const closeScene = () => { state.activeSceneId = null; state.activeSceneFloorId = null; saveState(); };
  const addProgress = (amount) => {
    state.floorProgress = state.floorProgress || {};
    state.floorProgress[floor.id] = Math.min(100, (state.floorProgress[floor.id] || 0) + amount);
  };
  const startGroup = (groupIndexes) => {
    view.sceneGroup = groupIndexes.slice(1);
    view.sceneGroupFloorId = floor.id;
    beginBattle(floor.mobs[groupIndexes[0]], floor.id);
  };

  if (type === "stealth") {
    if (Math.random() < 0.8) {
      addProgress(3);
      closeScene();
      toast(`Вы переждали в кустах, пока гоблины не ушли. Прогресс этажа: ${state.floorProgress[floor.id]}%.`, "ok");
      render();
    } else {
      closeScene();
      toast("Гоблин обернулся — вы замечены!", "warn");
      startGroup(scene.group);
    }
  } else if (type === "fight") {
    closeScene();
    startGroup(scene.group);
  } else if (type === "dig") {
    if (Math.random() < 0.6) {
      closeScene();
      const count = Math.min(scene.group.length, 1 + Math.floor(Math.random() * 3));
      toast(`Земля шевельнулась — поднимаются мертвецы (×${count})!`, "warn");
      startGroup(scene.group.slice(0, count));
    } else {
      const pool = FLOOR_RESOURCES[floor.id + 1] || FLOOR_RESOURCES[floor.id] || [];
      const res = pool[Math.floor(Math.random() * pool.length)];
      const amount = Math.floor(Math.random() * (res.maxAmount - res.minAmount + 1)) + res.minAmount;
      state.resources[res.id] = (state.resources[res.id] || 0) + amount;
      weekQuestResourceGain(res.id, amount);
      addProgress(1);
      closeScene();
      toast(`В земле нашлось: ${res.name} ×${amount}! Прогресс этажа: ${state.floorProgress[floor.id]}%.`, "ok");
      render();
    }
  } else {
    addProgress(1);
    closeScene();
    toast(`Вы обошли это место стороной. Прогресс этажа: ${state.floorProgress[floor.id]}%.`, "ok");
    render();
  }
}

function discardTraderStock() {
  if (!view.traderStock) return;
  for (const entry of view.traderStock) {
    if (entry.kind === "gear" && !entry.sold) {
      state.owned = state.owned.filter((i) => i.uid !== entry.uid);
    }
  }
  view.traderStock = null;
  view.npcShopOpen = false;
}

function closeNpcDialog() {
  discardTraderStock();
  state.activeNpcId = null;
  saveState();
  render();
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
      </div>
    </div>
  `;
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
          <button class="btn ghost" data-act="npc-talk-close" data-npc="${npcId}" type="button">Уйти</button>
        </div>
      </div>
    </div>
  `;
}

function traderDialogHtml() {
  const npc = NPCS[state.activeNpcId];
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
      return `<div style="display:flex; align-items:center; gap:10px; padding:9px 12px; border:1px solid var(--line); border-radius:8px; background:rgba(0,0,0,0.2);">
        <span style="flex:1; font-size:14px;">${label}</span>
        <b style="color:var(--gold2);">${entry.price} 💰</b>
        <button class="btn small primary" data-act="npc-action" data-npc-action="buy" data-id="${entry.kind === "gear" ? entry.uid : entry.id}" ${afford ? "" : "disabled"} type="button">Купить</button>
      </div>`;
    }).join("");
    shopHtml = `
      <div style="display:flex; flex-direction:column; gap:8px; margin:15px 0 8px;">${rows}</div>
      <p style="color:var(--dim); font-size:12px; margin:0 0 15px;">Цены странствующего: базовая ×3. У вас: <b style="color:var(--gold2);">${state.gold} 💰</b></p>`;
  }

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
          <button class="btn ghost" data-act="npc-action" data-npc-action="leave" type="button" style="flex:1;">Уйти</button>
        </div>
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
  switch (act) {
    case "floor-open": view.currentFloor = Number(el.dataset.floor); view.screen = "floor"; render(); break;
    case "quests-open": view.questsOpen = true; render(); break;
    case "quests-close": view.questsOpen = false; render(); break;
    case "bestiary-open": view.bestiaryOpen = true; render(); break;
    case "bestiary-close": view.bestiaryOpen = false; render(); break;
    case "levelup-close": view.levelUp = null; render(); break;
    case "goto":
      if (el.dataset.screen === "tower") view.currentFloor = null;
      go(el.dataset.screen);
      break;
    case "npc-talk":
      if (NPC_TALK_TARGETS[el.dataset.npc]) { view.talkNpc = el.dataset.npc; view.talkNpcText = getRandomPhrase(el.dataset.npc, "greetings"); render(); }
      break;
    case "npc-talk-backdrop": view.talkNpc = null; view.talkNpcText = null; render(); break;
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
    case "explore-result-continue": {
      const res = view.exploreResult;
      view.exploreResult = null;

      if (res.type === "event") {
        const ev = res.ev;
        state.debuff = { id: ev.debuff.id, name: ev.debuff.name, icon: ev.debuff.icon, mult: ev.debuff.mult, battles: ev.debuff.battles, desc: ev.debuff.desc };
        saveState();
      }

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
    case "shop-tab": {
      const tab = el.dataset.tab || "buy";
      const newTab = (view.shopTab === tab) ? null : tab;
      
      if (view.shopTab === "sell" && newTab !== "sell") view.sellSelection = [];
      view.shopTab = newTab;
      view.activeShopNpc = el.dataset.npc || view.activeShopNpc;
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
    case "sell-submit": {
      res = sellMultipleItems(view.sellSelection);
      view.sellSelection = [];
      toast(res.text, res.ok ? "ok" : "warn");
      if (res.ok && res.text.includes("Новый уровень")) view.levelUp = state.level;
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
      if (res.ok && res.text.includes("Новый уровень")) {
        view.levelUp = state.level;
      }
      render();
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
    case "repair": res = repairItem(el.dataset.uid); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "repair-all": res = repairAll(); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "train": res = trainAttr(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "buy": res = buyItem(id, el.dataset.shop || "forge"); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "craft": res = craftItem(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "sell": res = sellItem(el.dataset.uid); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "sell-potion": res = sellPotion(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "drink": res = drinkPotion(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "sell-resource": res = sellResource(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "fight": startBattle(Number(el.dataset.floor), el.dataset.mob); break;
    case "explore": {
      const res = exploreFloor(Number(el.dataset.floor) || state.maxFloor);
      if (!res.ok) { toast(res.text, "warn"); break; }

      if (res.encounter || res.scene || res.eventData) {
        view.exploreResult = { 
          type: res.eventData ? "event" : "loot", 
          ev: res.eventData, 
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
        const res = buyFromTrader(id);
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
      
      if (act === "leave") {
        closeNpcDialog();
        break;
      }
      
      const res = applyNpcAction(act, state.activeNpcId);
      if (act !== "show-goods") toast(res.text, res.ok ? "ok" : "warn");
      render();
      break;
    }
    case "npc-backdrop": closeNpcDialog(); break;
    
    case "attack-zone": setAttackZone(el.dataset.zone); break;
    case "attack-style": if (STYLE_ORDER.includes(el.dataset.style)) { view.attackStyle = el.dataset.style; render(); } break;
    case "block-zone": toggleBlock(el.dataset.zone); break;
    case "exchange": doExchange("attack"); break;
    case "tech": doExchange("tech"); break;
    
    case "flee": view.battle = null; view.summary = null; view.ambush = null; view.sceneGroup = null; view.sceneGroupFloorId = null; view.screen = "tower"; if (view.autoExplore) stopAutoExplore("Отступление: авто-исследование остановлено."); if (state.debuff) consumeBattleDebuff(); saveState(); render(); break;
    case "result-continue": {
      const victory = view.summary?.victory;
      const ambush = victory ? view.ambush : null;
      view.battle = null; view.summary = null;
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
      if (state.debuff) consumeBattleDebuff();
      render();
      break;
    }
    case "reset": if (confirm("Сбросить прогресс?")) { resetState(); view.battle = null; view.summary = null; view.create = null; view.ambush = null; view.sceneGroup = null; view.sceneGroupFloorId = null; view.autoExplore = null; view.autoExploreMode = "safe"; view.dollSlot = null; view.invItemUid = null; view.invFilter = "all"; view.invSearch = ""; view.screen = "hub"; render(); } break;
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
