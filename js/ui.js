const view = {
  screen: "hub", battle: null, attackZone: "chest", blocks: ["head", "chest"],
  summary: null, create: null, forgeTab: "held", jewelryTab: "jewelry",
  questsOpen: false,
  currentFloor: null,
  dollSlot: null, tripActive: false, farm: null,
  trainingTab: "train",
  inventoryTab: "gear",
  invItemUid: null,
  invFilter: "all",
  invSearch: "",
  alchemyTab: "potions",
  heroBackScreen: "hub",
  ambush: null,
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

// Подписи атрибутов для чипов аффиксов.
const ATTR_LABEL = { str: "Сила", end: "Выносливость", agi: "Ловкость", int: "Интеллект" };

function itemStats(item) {
  const out = [];
  if (item.atk) out.push(`⚔ +${item.atk}`); if (item.def) out.push(`🛡 +${item.def}`); if (item.hp) out.push(`❤ +${item.hp}`);
  if (item.mana) out.push(`🔷 +${item.mana} маны`); if (item.crit) out.push(`🎯 +${item.crit}%`); if (item.dodge) out.push(`💨 +${item.dodge}%`); if (item.block) out.push(`🧱 +${item.block} зона блока`);
  return out;
}

// Полное имя экземпляра с аффиксом: «Железный меч Медведя». Редкость видна по цвету рамки и в тултипе.
function getItemDisplayName(instance) {
  const item = instance ? ITEMS[instance.id] : null;
  if (!item) return "Предмет";
  return instance.affix?.name ? `${item.name} ${instance.affix.name}` : item.name;
}

// Класс окрашивания рамки по редкости; common остаётся с дефолтной рамкой.
function rarityClass(instance) {
  const r = instance?.rarity;
  return r && r !== "common" && RARITY_TIERS[r] ? ` rarity-${r}` : "";
}

function durabilityChip() { return ""; }
function statsChips(item, inst = null) {
  const s = inst ? getInstanceStats(inst) : item;
  const chips = itemStats(s);
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

// Экземпляры конкретного предмета и его надетость (по UID).
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
  const gear = gearBonuses(); // базовые бонусы (обычно пусто на экране создания)
  
  // Добавляем бонусы от стартового снаряжения архетипа
  const arch = ARCHETYPE_MAP[archetypeId];
  if (arch && Array.isArray(arch.startEquipment)) {
    const eq = {}; // виртуальная экипировка: слот -> id
    for (const id of arch.startEquipment) {
      const item = ITEMS[id];
      if (!item) continue;
      
      // Ищем свободный слот (или основной, если предмет туда подходит)
      let slot = null;
      if (item.slot === "mainhand" || item.slot === "offhand") {
        // Для оружия: сначала правая рука, потом левая
        if (!eq.mainhand) slot = "mainhand";
        else if (!eq.offhand) slot = "offhand";
        else slot = "mainhand"; // если обе заняты, перезаписываем правую
      } else if (item.slot === "ring") {
        if (!eq.ring1) slot = "ring1"; else slot = "ring2";
      } else if (item.slot === "trinket") {
        if (!eq.trinket1) slot = "trinket1"; else slot = "trinket2";
      } else {
        slot = item.slot;
      }
      
      if (slot) eq[slot] = id;
    }
    
    // Применяем бонусы
    for (const [slot, id] of Object.entries(eq)) {
      const item = ITEMS[id];
      if (!item) continue;
      
      let atkMult = 1;
      // Левая рука с оружием (mainhand) даёт только 50% урона (только для Убийцы)
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
    atk: Math.ceil((BASE_STATS.damage + a.str * 2 + gear.atk) * mods.atk),
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
      <span class="archetype-icon">${a.icon}</span>
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
          <div class="preview-archetype${archetype ? "" : " empty"}">${archetype ? `<span class="preview-archetype-head">${archetype.icon} <b>${archetype.name}</b></span><span>${archetype.desc}</span>` : `<span>Архетип не выбран</span>`}</div>
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
  
  ensureQuests();
  const qDone = state.quests.list.filter(q => q.done && !state.quests.claimed.includes(q.id)).length;
  const qTotal = state.quests.list.length;
  const questPill = qTotal > 0 ? `<button class="pill" data-act="quests-open" type="button" title="Ежедневные задания">📋 <b>${qDone}/${qTotal}</b></button>` : "";

  return `
    <button class="brand" data-act="goto" data-screen="hub" type="button"><span class="brand-text"><b>ВОСХОЖДЕНИЕ</b></span></button>
    <div class="vitals">
      <div class="vital"><div class="vital-top"><span>HP</span><b>${state.hp}<i>/${st.maxHp}</i></b></div>${bar("hp", state.hp, st.maxHp)}</div>
      <div class="vital"><div class="vital-top"><span>МАНА</span><b>${state.mana}<i>/${st.maxMana}</i></b></div>${bar("mana", state.mana, st.maxMana)}</div>
      <div class="vital energy-vital"><div class="vital-top"><span>ЭНЕРГИЯ</span><b>${state.energy}<i>/${st.maxEnergy}</i></b></div>${bar("energy", state.energy, st.maxEnergy)}</div>
      <div class="pill gold"><span>💰</span><b>${state.gold}</b></div><div class="pill">УР <b>${state.level}</b></div>
      ${state.points > 0 ? `<button class="pill gold points" data-act="goto" data-screen="hero" type="button">+<b>${state.points}</b></button>` : ""}
      <div class="pill">ЭТАЖ <b>${state.maxFloor}/5</b></div>
      <div class="pill time${phase.towerOpen ? "" : " night"}">${phase.icon} <b>${phase.name}</b> · ${calendarLabel()}</div>
            <div class="pill event" ${event ? `title="${esc(event.desc)}"` : ""}>
        ${event ? event.icon : "·"} <b>${event ? event.name : "—"}</b>
      </div>
      ${questPill}
    </div>
    <nav class="topnav${lockNav}"><button class="nav-btn" data-act="goto" data-screen="hero" type="button">Герой</button><button class="nav-btn" data-act="goto" data-screen="hub" type="button">Йорстед</button></nav>
  `;
}

function hubHtml(st) {
  const bossDead = Object.keys(state.cleared).length;
  const phase = phaseInfo();
  const companion = activeCompanion();
  const closed = towerClosedReason();
  const event = todaysEvent();

  // Выбор фона по времени суток
  let bgImage = "assets/backgrounds/hub_day.webp"; // по умолчанию день
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

      ${isNight() ? `<div class="banner night-banner">🌙 Ночь. Башня закрыта до утра.</div>` : ""}

      <div class="locations">
        <button class="loc-card" data-act="goto" data-screen="market" type="button">
          <img class="loc-image" src="assets/backgrounds/market.webp" onerror="this.style.display='none'" alt="">
          <div class="loc-content">
            <span class="loc-body">
              <span class="loc-kicker">Снаряжение и зелья</span>
              <span class="loc-title">Торговая площадь</span>
              <span class="loc-desc">Кузница, Лавка Алхимика и Ювелир.</span>
            </span>
            <span class="loc-cta">Войти →</span>
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

        <button class="loc-card" data-act="goto" data-screen="training" type="button">
          <img class="loc-image" src="assets/backgrounds/training.webp" onerror="this.style.display='none'" alt="">
          <div class="loc-content">
            <span class="loc-body">
              <span class="loc-kicker">Тренировки и Задания</span>
              <span class="loc-title">Зал Охотников</span>
            </span>
            <span class="loc-cta">Войти →</span>
          </div>
        </button>

        <button class="loc-card tower${closed ? " locked" : ""}" data-act="goto" data-screen="tower" type="button">
          <img class="loc-image" src="assets/backgrounds/tower.webp" onerror="this.style.display='none'" alt="">
          <div class="loc-content">
            <span class="loc-body">
              <span class="loc-kicker">${closed ? "Проход закрыт" : `Боссов повержено: ${bossDead}/5`}</span>
              <span class="loc-title">${closed ? "Башня спит" : "Башня"}</span>
            </span>
            <span class="loc-cta">${closed ? "До утра" : "Войти →"}</span>
          </div>
        </button>
      </div>
    </section>
  `;
}

function marketHtml() {
  return `<div class="screen-bg" style="background-image: ="assets/backgrounds/market.webp');"></div>
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
    
  return `
    <div class="screen-bg" style="background-image: ="assets/backgrounds/hotel.webp');"></div>
    ${subHeader("Гостиница", "Тёплый свет и чужие истории", "hub", "← В Йорстед")}
    <img src="assets/backgrounds/hotel.webp" class="shop-banner" onerror="this.style.display='none'">
    <div class="hotel-status">
      <span>🛏️ Номер: ${HOTEL_PRICE} 💰 · до утра</span>
      <span>💞 Спутница: ${companionPrice} 💰 · ${COMPANION_BUFF_DAYS} дня</span>
      <span>⏳ Найм не сдвигает время</span>
    </div>
    <section class="hotel-rest"><div class="hotel-rest-icon">🛏️</div><div class="hotel-rest-body"><h2>Снять номер</h2><p>Полностью восстановит HP, ману и энергию и перенесёт на утро следующего дня.</p></div><div class="hotel-rest-buy"><span class="price">${HOTEL_PRICE} 💰</span><button class="btn primary" data-act="hotel-rest" type="button" ${canHotel ? "" : "disabled"}>Снять номер</button></div></section>
    <h2 class="group-title">Спутницы</h2>
    ${companionNote}
    <div class="companion-grid">${cards}</div>
  `;
}

function trainingTabsHtml(active) {
  return `
    <div class="shop-tabs">
      <button class="shop-tab${active === "train" ? " active" : ""}" data-act="training-tab" data-tab="train" type="button">Тренировки</button>
      <button class="shop-tab${active === "quests" ? " active" : ""}" data-act="training-tab" data-tab="quests" type="button">Задания</button>
    </div>
  `;
}

function trainingAvailability(training) {
  if (state.phase !== 0) return { ok: false, reason: "Только утром" };
  if (state.energy < TRAINING_ENERGY_COST) return { ok: false, reason: `Нужно ${TRAINING_ENERGY_COST} ⚡` };
  const cap = trainingCap(state.level); if (state.attrs[training.attr] >= cap) return { ok: false, reason: `Максимум (${cap})` };
  return { ok: true, reason: "" };
}

function trainingHtml() {
  const tab = view.trainingTab || "train";
  if (tab === "quests") return trainingQuestsHtml();

  const cap = trainingCap(state.level); const isMorning = state.phase === 0;
  const cards = TRAININGS.map((t) => {
    const avail = trainingAvailability(t); const current = state.attrs[t.attr]; const atCap = current >= cap;
    return `<article class="training-card${avail.ok ? "" : " disabled"}"><div class="training-head"><span class="training-icon">${t.icon}</span><div class="training-name"><h3>${t.name}</h3><span class="training-attr">${ATTR_INFO.find((a) => a.id === t.attr).name}: ${current} / ${cap}</span></div></div><p class="item-desc">${t.desc}</p><div class="training-foot"><button class="btn small${avail.ok ? " primary" : ""}" data-act="train" data-id="${t.id}" ${avail.ok ? "" : "disabled"} type="button">${avail.ok ? `Тренироваться` : avail.reason}</button></div></article>`;
  }).join("");
  const warning = !isMorning ? `<div class="banner warn-banner">🌙 Сейчас не утро.</div>` : state.energy < TRAINING_ENERGY_COST ? `<div class="banner warn-banner">⚡ Не хватает энергии.</div>` : `<div class="banner">⏳ Тренировка занимает весь день.</div>`;
  
   return `
    <div class="screen-bg" style="background-image: ="assets/backgrounds/training.webp');"></div>
    ${subHeader("Зал Охотников", "Место сбора авантюристов", "hub")}${trainingTabsHtml("train")}${warning}<div class="training-grid">${cards}</div>
  `;
}

function trainingQuestsHtml() {
  ensureQuests();
  const list = state.quests.list;
  if (!list.length) {
    return `${subHeader("Зал Охотников", "Место сбора авантюристов", "hub")}${trainingTabsHtml("quests")}<p class="empty">Сегодня заданий нет.</p>`;
  }

  const cards = list.map((q) => {
    const claimed = state.quests.claimed.includes(q.id);
    const canClaim = q.done && !claimed;
    const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
    return `
      <article class="quest-card${claimed ? " claimed" : q.done ? " done" : ""}">
        <div class="quest-head">
          <span class="quest-icon">${iconHtml(q.mobIcon, 32)}</span>
          <div class="quest-title">
            <h3>Убить: ${q.mobName}</h3>
            <span class="hint">Этаж ${q.floorId} · цель ${q.target}</span>
          </div>
          ${claimed ? `<span class="badge">Получено</span>` : q.done ? `<span class="badge">Готово</span>` : ""}
        </div>
        <div class="quest-progress">
          <div class="bar"><span style="width:${pct}%"></span></div>
          <span class="quest-count">${q.progress} / ${q.target}</span>
        </div>
        <div class="quest-foot">
          <span class="price">💰 ${q.gold} · ✦ ${q.xp}</span>
          <button class="btn small${canClaim ? " primary" : ""}" data-act="claim-quest" data-id="${q.id}"
            ${canClaim ? "" : "disabled"} type="button">
            ${claimed ? "Получено" : q.done ? "Забрать" : "В процессе"}
          </button>
        </div>
      </article>
    `;
  }).join("");

  return `
    ${subHeader("Зал Охотников", "Место сбора авантюристов", "hub")}
    ${trainingTabsHtml("quests")}
    <div class="quest-grid">${cards}</div>
    <p class="hint">Задания обновляются с началом нового дня. Цель — 3 убийства указанного моба.</p>
  `;
}
function questsModalHtml() {
  ensureQuests();
  const list = state.quests.list;
  
  // Собираем и ежедневные, и NPC-квесты
  const dailyCards = list.map((q) => {
    const claimed = state.quests.claimed.includes(q.id);
    const canClaim = q.done && !claimed;
    const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
    return `
      <article class="quest-card${claimed ? " claimed" : q.done ? " done" : ""}">
        <div class="quest-head">
          <span class="quest-icon">${iconHtml(q.mobIcon, 32)}</span>
          <div class="quest-title">
            <h3>Убить: ${q.mobName}</h3>
            <span class="hint">Этаж ${q.floorId} · цель ${q.target}</span>
          </div>
          ${claimed ? `<span class="badge">Получено</span>` : q.done ? `<span class="badge">Готово</span>` : ""}
        </div>
        <div class="quest-progress">
          <div class="bar"><span style="width:${pct}%"></span></div>
          <span class="quest-count">${q.progress} / ${q.target}</span>
        </div>
        <div class="quest-foot">
          <span class="price">💰 ${q.gold} · ✦ ${q.xp}</span>
          <button class="btn small${canClaim ? " primary" : ""}" data-act="claim-quest" data-id="${q.id}"
            ${canClaim ? "" : "disabled"} type="button">
            ${claimed ? "Получено" : q.done ? "Забрать" : "В процессе"}
          </button>
        </div>
      </article>
    `;
  }).join("");

  const npcCards = state.npcQuests.list.filter(q => !q.claimed).map((q) => {
    const res = ALL_RESOURCES.find(r => r.id === q.resId);
    if (!res) return "";
    const have = state.resources[q.resId] || 0;
    const pct = Math.min(100, Math.round((have / q.target) * 100));
    const canClaim = have >= q.target;
    return `
      <div class="quest-card">
        <div class="quest-head">
          <span class="quest-icon">${iconHtml(res.icon, 32)}</span>
          <div class="quest-title">
            <h3>Собрать: ${res.name}</h3>
            <span class="hint">Нужно ${q.target} шт. (в сумке: ${have})</span>
          </div>
        </div>
        <div class="quest-progress">
          <div class="bar"><span style="width:${pct}%"></span></div>
          <span class="quest-count">${have} / ${q.target}</span>
        </div>
        <div class="quest-foot">
          <span class="price">💰 ${q.gold} · ✦ ${q.xp}</span>
          <button class="btn small${canClaim ? " primary" : ""}" data-act="claim-npc-quest" data-id="${q.id}"
            ${canClaim ? "" : "disabled"} type="button">
            ${canClaim ? "Сдать" : "Не хватает"}
          </button>
        </div>
      </div>
    `;
  }).join("");

  const hasAny = dailyCards || npcCards;

  return `
    <div class="doll-menu-backdrop" data-act="quests-close"></div>
    <div class="doll-menu" role="dialog" style="max-width: 500px; max-height: 80vh; overflow-y: auto;">
      <div class="doll-menu-head">
        <h3>Задания</h3>
        <button class="doll-menu-close" data-act="quests-close" type="button">✕</button>
      </div>
      <div class="quest-grid" style="grid-template-columns: 1fr;">
        ${hasAny ? dailyCards + npcCards : `<p class="empty">Все задания выполнены!</p>`}
      </div>
    </div>
  `;
}

function npcQuestHtml(npcId) {
  ensureNpcQuests();
  const quests = state.npcQuests.list.filter(q => q.npc === npcId);
  if (!quests.length) return "";
  
  const cards = quests.map(q => {
    const res = ALL_RESOURCES.find(r => r.id === q.resId);
    if (!res) return "";
    
    const have = state.resources[q.resId] || 0;
    const pct = Math.min(100, Math.round((have / q.target) * 100));
    const canClaim = have >= q.target && !q.claimed;
    return `
      <div class="quest-card" style="margin-top:10px;">
        <div class="quest-head">
          <span class="quest-icon">${iconHtml(res.icon, 32)}</span>
          <div class="quest-title">
            <h3>Собрать: ${res.name}</h3>
            <span class="hint">Нужно ${q.target} шт. (в сумке: ${have})</span>
          </div>
          ${q.claimed ? `<span class="badge">Получено</span>` : ""}
        </div>
        <div class="quest-progress">
          <div class="bar"><span style="width:${pct}%"></span></div>
          <span class="quest-count">${have} / ${q.target}</span>
        </div>
        <div class="quest-foot">
          <span class="price">💰 ${q.gold} · ✦ ${q.xp}</span>
          <button class="btn small${canClaim ? " primary" : ""}" data-act="claim-npc-quest" data-id="${q.id}"
            ${canClaim ? "" : "disabled"} type="button">
            ${q.claimed ? "Получено" : canClaim ? "Сдать" : "Не хватает"}
          </button>
        </div>
      </div>
    `;
  }).join("");
  return cards;
}

function repairPanelHtml() {
  const items = state.owned.filter((inst) => ITEMS[inst.id]?.price > 0).sort((a, b) => durabilityOf(a) - durabilityOf(b));
  if (!items.length) return `<p class="empty">Пока нечего чинить.</p>`;
  const total = items.reduce((sum, inst) => sum + repairCost(inst), 0);
  const cards = items.map((inst) => {
    const item = ITEMS[inst.id];
    const d = durabilityOf(inst); const cost = repairCost(inst); const need = cost > 0;
    return `<article class="gear-card${d <= 0 ? " broken" : ""}${rarityClass(inst)}"><div class="gear-card-head"><div class="item-icon">${iconHtml(item.icon, 32)}</div><div class="gear-card-info"><h3>${getItemDisplayName(inst)}</h3><div class="chips">${durabilityChip(inst) || `<span class="chip ok">🔧 ${DURABILITY_MAX}/${DURABILITY_MAX}</span>`}</div></div></div><div class="gear-card-foot"><span class="price">${need ? `${cost} 💰` : "—"}</span><button class="btn small" data-act="repair" data-uid="${inst.uid}" ${!need || state.gold < cost ? "disabled" : ""} type="button">${need ? "Починить" : "Цел"}</button></div></article>`;
  }).join("");
  return `<section class="shop-group"><h2 class="group-title">🔧 Ремонт</h2><div class="item-grid">${cards}</div><div class="repair-all"><span class="price">Итого: ${total} 💰</span><button class="btn primary" data-act="repair-all" type="button" ${total <= 0 || state.gold < total ? "disabled" : ""}>Починить всё</button></div></section>`;
}

function shopTabsHtml(tabs, activeId, actName) {
  return tabs.map((tab) => `<button class="shop-tab${tab.id === activeId ? " active" : ""}" data-act="${actName}" data-tab="${tab.id}" type="button">${tab.name}</button>`).join("");
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
      // Дубликаты разрешены: кнопка покупки активна всегда, копии показываем чипами.
      let label = `Купить · ${p.price} 💰`; if (!canBuy) label = `Нужно ${p.price} 💰`;
      const countChip = copies.length ? `<span class="chip ok">В сумке: ${copies.length}</span>` : "";
      const equippedChip = equippedInfo ? `<span class="chip ok">Надето: ${SLOT_NAME[equippedInfo.slot] || equippedInfo.slot}</span>` : "";
      const durChips = copies.map((inst) => durabilityChip(inst)).join("");
      return `<article class="gear-card${copies.length ? " owned" : ""}"><div class="gear-card-head"><div class="item-icon">${iconHtml(item.icon, 48)}</div><div class="gear-card-info"><h3>${item.name}</h3><p class="item-desc">${item.desc}</p><div class="chips">${statsChips(item)}${countChip}${equippedChip}${durChips}</div></div></div><div class="gear-card-foot"><span class="price">${priceHtml(item, shopName)}</span><button class="btn small" data-act="buy" data-id="${item.id}" data-shop="${shopName}" ${canBuy ? "" : "disabled"} type="button">${label}</button></div></article>`;
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
    // Каждый крафт создаёт новый экземпляр — кнопка всегда «Создать».
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
  const activeTab = FORGE_TABS.find((t) => t.id === view.forgeTab) || FORGE_TABS[0];
  const tabs = shopTabsHtml(FORGE_TABS, activeTab.id, "forge-tab");
  const stock = activeTab.id === "craft" ? craftPanelHtml("forge") : activeTab.id === "buyback" ? buybackPanelHtml("forge") : shopItemsHtml(FORGE_TABS, activeTab.id, "forge");

  const greeting = `
    <div class="npc-greeting" style="display:flex;flex-direction:row;align-items:flex-start;gap:1.5rem;background:rgba(255,255,255,0.05);border-radius:12px;padding:1.5rem;margin-bottom:2rem;border:1px solid rgba(255,255,255,0.1);">
      <img src="${npcPortraitSrc("ron")}" alt="Кузнец" class="npc-portrait"
        style="width:150px;height:150px;object-fit:cover;border-radius:8px;border:2px solid #f59e0b;flex-shrink:0;background-color:#1e1b2e;"
        onerror="this.src='assets/portraits/placeholder.webp'">
      <div class="npc-text" style="display:flex;flex-direction:column;justify-content:flex-start;flex:1;">
        <p class="npc-name" style="font-weight:bold;color:#f59e0b;margin:0 0 0.5rem 0;font-size:1.1rem;text-transform:uppercase;letter-spacing:0.05em;">Рон, кузнец</p>
        <p class="npc-dialogue" style="margin:0;line-height:1.6;font-style:italic;color:#e2e8f0;font-size:1.05rem;">«Добро пожаловать в мою кузницу. Здесь куют не только сталь, но и судьбы. Выбирай снаряжение с умом: хороший доспех спасёт жизнь, а плохой — лишь добавит вес. Снятые вещи можешь продать мне за полцены.»</p>
      </div>
    </div>
  `;

  return `<div class="screen-bg" style="background-image: ="assets/backgrounds/forge.webp');"></div>
    ${subHeader("Кузница", "Оружие и броня", "market", "← Назад")}
    ${greeting}
    <div class="shop-tabs">${tabs}</div>
    <div class="shop-grid"><div class="shop-main">${stock}</div></div>
    ${npcQuestHtml("ron")}
  `;
}

function jewelryHtml() {
  const activeTab = JEWELRY_TABS.find((t) => t.id === view.jewelryTab) || JEWELRY_TABS[0];
  const tabs = shopTabsHtml(JEWELRY_TABS, activeTab.id, "jewelry-tab");
  const stock = activeTab.id === "craft" ? craftPanelHtml("jewelry") : activeTab.id === "buyback" ? buybackPanelHtml("jewelry") : shopItemsHtml(JEWELRY_TABS, activeTab.id, "jewelry");

  const greeting = `
    <div class="npc-greeting" style="display:flex;flex-direction:row;align-items:flex-start;gap:1.5rem;background:rgba(255,255,255,0.05);border-radius:12px;padding:1.5rem;margin-bottom:2rem;border:1px solid rgba(255,255,255,0.1);">
      <img src="${npcPortraitSrc("elize")}" alt="Элиза, ювелир" class="npc-portrait"
        style="width:150px;height:150px;object-fit:cover;border-radius:8px;border:2px solid #22d3ee;flex-shrink:0;background-color:#1e1b2e;"
        onerror="this.src='assets/portraits/placeholder.webp'">
      <div class="npc-text" style="display:flex;flex-direction:column;justify-content:flex-start;flex:1;">
        <p class="npc-name" style="font-weight:bold;color:#67e8f9;margin:0 0 0.5rem 0;font-size:1.1rem;text-transform:uppercase;letter-spacing:0.05em;">Элиза, ювелир</p>
        <p class="npc-dialogue" style="margin:0;line-height:1.6;font-style:italic;color:#e2e8f0;font-size:1.05rem;">«Камень без оправы — просто камень. Принеси мне осколок — и я сделаю из него искусство, достойное королей. А если у тебя есть что-то лишнее — я всегда готова обменять его на звонкую монету.»</p>
      </div>
    </div>
  `;

  return `
    <div class="screen-bg" style="background-image: ="assets/backgrounds/jewelry.webp');"></div>
    ${subHeader("Ювелирная лавка", "Тонкая работа", "market", "← Назад")}
    ${greeting}
    <div class="shop-tabs">${tabs}</div>
    <div class="shop-grid"><div class="shop-main">${stock}</div></div>
    ${npcQuestHtml("elize")}
  `;
}

function alchemyHtml() {
  const activeTab = view.alchemyTab === "buyback" ? "buyback" : "potions";
  const tabs = shopTabsHtml([{ id: "potions", name: "Зелья" }, { id: "buyback", name: "Скупка" }], activeTab, "alchemy-tab");
  const cards = Object.values(ITEMS).filter((i) => i.slot === "potion").map((item) => {
    const count = state.potions[item.id] || 0; const full = item.effect === "hp" ? state.hp >= stats().maxHp : state.mana >= stats().maxMana; const p = priceFor(item, "alchemy");
    return `<article class="item-card potion"><div class="item-icon big">${iconHtml(item.icon, 48)}</div><div class="item-main"><h3>${item.name}</h3><p class="item-desc">${item.desc}</p><div class="chips"><span class="chip">В сумке: ${count}</span></div></div><div class="item-buy"><span class="price">${priceHtml(item, "alchemy")}</span><div class="stack-buttons"><button class="btn small" data-act="buy" data-id="${item.id}" data-shop="alchemy" ${state.gold < p.price ? "disabled" : ""} type="button">Купить</button><button class="btn small ghost" data-act="drink" data-id="${item.id}" ${count <= 0 || full ? "disabled" : ""} type="button">Выпить</button></div></div></article>`;
  }).join("");
  const body = activeTab === "buyback" ? buybackPanelHtml("alchemy") : cards;

  const greeting = `
    <div class="npc-greeting" style="display:flex;flex-direction:row;align-items:flex-start;gap:1.5rem;background:rgba(255,255,255,0.05);border-radius:12px;padding:1.5rem;margin-bottom:2rem;border:1px solid rgba(255,255,255,0.1);">
      <img src="${npcPortraitSrc("elain")}" alt="Элейн, хозяйка лавки" class="npc-portrait"
        style="width:150px;height:150px;object-fit:cover;border-radius:8px;border:2px solid #8b5cf6;flex-shrink:0;background-color:#1e1b2e;"
        onerror="this.src='assets/portraits/placeholder.webp'">
      <div class="npc-text" style="display:flex;flex-direction:column;justify-content:flex-start;flex:1;">
        <p class="npc-name" style="font-weight:bold;color:#a78bfa;margin:0 0 0.5rem 0;font-size:1.1rem;text-transform:uppercase;letter-spacing:0.05em;">Элейн, хозяйка лавки</p>
        <p class="npc-dialogue" style="margin:0;line-height:1.6;font-style:italic;color:#e2e8f0;font-size:1.05rem;">«Добро пожаловать, путник. Мои зелья всегда наивысшего качества. Если раны воспалились или мана на исходе — ты по адресу. Но помни: в бою глоток зелья заменяет удар, так что выбирай момент с умом. А старые зелья выкупаю за полцены — не пропадать же добру.»</p>
      </div>
    </div>
  `;

  return `
    <div class="screen-bg" style="background-image: ="assets/backgrounds/alchemy.webp');"></div>
    ${subHeader("Лавка Алхимика", "Зелья и настои", "market", "← Назад")}
    ${greeting}
    <div class="shop-tabs">${tabs}</div>
    <div class="shop-grid single"><div class="shop-main">${body}</div></div>
    ${npcQuestHtml("elain")}
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
  return `<button class="doll-slot${item ? " filled" : ""}${open ? " open" : ""}${broken ? " broken" : ""}${rarityClass}" data-act="doll-slot" data-slot="${slot.id}" type="button"><span class="slot-glyph">${iconHtml(item ? item.icon : slot.icon, 24)}</span><span class="slot-caption">${slot.name}</span></button>`;
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

// Мини-меню предмета из сумки (сетка инвентаря): надеть или продать.
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

// Вкладка «Скупка» в магазине: выкуп подходящих товаров за половину цены.
// shop: "forge" — оружие и броня, "jewelry" — амулеты, кольца, аксессуары, "alchemy" — зелья.
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

function heroInventoryHtml() {
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
      const statLine = itemStats(getInstanceStats(inst)).join(", ");
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
    <div class="hero-bg"></div> <!-- ДОБАВЛЕНА СТРОКА С ФОНОМ -->
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
        <div class="doll-stage">${paperDollHtml()}</div>
        ${dollMenuHtml()}
        ${invMenuHtml()}
        
        <div style="margin-top: 20px;">
          <div class="shop-tabs" style="margin-bottom:10px;">
            <button class="shop-tab${view.inventoryTab === "gear" ? " active" : ""}" data-act="inventory-tab" data-tab="gear" type="button">Снаряжение</button>
            <button class="shop-tab${view.inventoryTab === "resources" ? " active" : ""}" data-act="inventory-tab" data-tab="resources" type="button">Материалы</button>
            <button class="shop-tab${view.inventoryTab === "recipes" ? " active" : ""}" data-act="inventory-tab" data-tab="recipes" type="button">Рецепты</button>
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
      <article class="floor-card${locked ? " locked" : ""}${cleared ? " cleared" : ""}">
        <div class="floor-head">
          <span class="floor-icon">${locked ? "🔒" : floor.icon}</span>
          <div>
            <h2>Этаж ${floor.id}: ${floor.name}</h2>
            <p class="muted">${floor.subtitle}</p>
          </div>
          ${cleared ? `<span class="badge">Пройден</span>` : ""}
        </div>
        ${locked 
          ? `<p class="locked-note">Запечатан. Победите босса предыдущего этажа.</p>` 
          : `<button class="btn primary" data-act="floor-open" data-floor="${floor.id}" type="button">Войти на этаж</button>`}
      </article>
    `;
  }).join("");

  return `
    <div class="screen-bg" style="background-image: ="assets/backgrounds/tower.webp');"></div>
    ${subHeader("Башня", "Поход в неизвестность", "hub", "← В Йорстед")}
    ${reason ? `<div class="banner warn-banner">${reason}</div>` : ""}
    <div class="floors">${floors}</div>
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

  const mobs = floor.mobs.map((mob, index) => {
    const isFarming = view.farm && view.farm.floorId === floor.id && view.farm.mobIndex === index;
    const farmBtn = isFarming 
      ? `<button class="btn small danger" data-act="farm-stop" type="button">⏹ Стоп</button>` 
      : `<button class="btn small ghost" data-act="farm" data-floor="${floor.id}" data-mob="${index}" ${canFight ? "" : "disabled"} type="button">⏩ Фарм</button>`;
    return `
      <div class="mob-row">
        <span class="mob-icon">${iconHtml(mob.icon, 32)}</span>
        <div class="mob-info"><b>${mob.name}</b><span class="muted">${mob.hp} HP · ⚔ ${mob.atk} · 🛡 ${mob.def}</span></div>
        <div class="mob-actions">
          <button class="btn small" data-act="fight" data-floor="${floor.id}" data-mob="${index}" ${canFight ? "" : "disabled"} type="button">Бой</button>
          ${farmBtn}
        </div>
      </div>
    `;
  }).join("");

  const gatherBtn = `
    <div style="margin-top:10px; padding:10px; background:rgba(255,255,255,0.03); border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
      <span>Поиск припасов (1–3 шт.)</span>
      <button class="btn small ghost" data-act="gather" data-floor="${floor.id}" ${canFight ? "" : "disabled"} type="button">Искать · 1 ⚡</button>
    </div>
  `;

  return `
    <div class="screen-bg" style="background-image: url('${floor.bg || "assets/backgrounds/tower.webp"}');"></div>
    ${subHeader(`Этаж ${floor.id}: ${floor.name}`, floor.subtitle, "tower", "← Назад к этажам")}
    <p class="lead" style="margin-bottom: 20px;">${floor.desc || ""}</p>
    ${towerControls}
    ${view.farm ? `
      <div class="banner farm-banner" style="display:flex; flex-direction:column; gap:10px; align-items:stretch;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b>⏩ Идет фарм: ${floor.mobs[view.farm.mobIndex]?.name}</b>
          <button class="btn small danger" data-act="farm-stop" type="button">⏹ Остановить</button>
        </div>
        <div class="farm-log" style="background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; max-height:150px; overflow-y:auto; font-size:0.85rem; font-family:monospace;">
          ${view.farm.log.length > 0 ? view.farm.log.slice(-5).map(line => `<div>${line}</div>`).join("") : "<div>Ожидание боя...</div>"}
        </div>
      </div>
    ` : ""}
    ${reason ? `<div class="banner warn-banner">${reason}</div>` : ""}
    <div class="floors">
      <article class="floor-card${state.cleared[floor.id] ? " cleared" : ""}">
        <div class="floor-head"><span class="floor-icon">${floor.icon}</span><div><h2>Противники</h2></div></div>
        <div class="mobs">${mobs}</div>
        <div class="boss-row">
          <span class="mob-icon boss-icon">${iconHtml(floor.boss.icon, 48)}</span>
          <div class="mob-info"><b>${floor.boss.name}</b><span class="muted">${floor.boss.hp} HP · ⚔ ${floor.boss.atk} · 🛡 ${floor.boss.def}</span></div>
          <button class="btn small primary" data-act="fight" data-floor="${floor.id}" data-mob="boss" ${canFight ? "" : "disabled"} type="button">Босс</button>
        </div>
        ${gatherBtn}
      </article>
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

// Значки вариации противника: редкость, модификатор, способность.
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
  const zones = zoneButtons(); 
  const counterFormatted = Math.round(st.counter * 10) / 10;
  
  const ragePips = Array.from({ length: 5 }, (_, i) =>
    `<span class="pip${i < battle.rage ? " on" : ""}"></span>`
  ).join("");

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
      </div>
      <div class="control-group">
        <h3>Что блокировать</h3>
        <div class="zones">${zones.block}</div>
      </div>
      <div class="battle-actions">
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
    <section class="battle">
      <div class="battle-top">
        <span class="eyebrow">Этаж ${battle.floorId} · размен ${battle.turn + 1} · ⚡ ${state.energy}/${st.maxEnergy}</span>
        <h1>${battle.boss ? "Босс" : "Схватка"} · ${enemy.name}</h1>
        ${enemyStatusHtml(enemy)}
      </div>

      ${battle.ambush ? `<div class="banner warn-banner">🔪 ${AMBUSH_TEXT}</div>` : ""}

      <div class="fighters">
        <article class="fighter hero-fighter">
          <div class="fighter-avatar portrait">
            <img src="${portraitSrc(state.portrait)}" alt="${esc(state.name)}">
          </div>
          <div class="fighter-body">
            <div class="fighter-name">${esc(state.name)} <span class="muted">УР ${state.level}</span></div>
            ${bar("hp", state.hp, st.maxHp)}
            ${bar("mana", state.mana, st.maxMana)}
            <div class="fighter-numbers"><span>${state.hp} / ${st.maxHp} HP</span><span>${state.mana} / ${st.maxMana} маны</span></div>
            <div class="rage"><span class="rage-label">Кураж</span>${ragePips}</div>
            <div class="fighter-sub">⚔ ${st.atk} · 🛡 ${st.def} · 🎯 ${st.crit}% · 💨 ${st.dodge}% · ⚡ ${counterFormatted}% контр</div>
          </div>
        </article>

        <div class="vs">VS</div>

        <article class="fighter enemy-fighter${battle.hp <= 0 ? " dead" : ""}">
          <div class="fighter-avatar">${iconHtml(enemy.icon, 64)}</div>
          <div class="fighter-body">
            <div class="fighter-name">${enemy.name} ${battle.boss ? `<span class="badge boss">Босс</span>` : ""}</div>
            ${bar("hp enemy", battle.hp, battle.maxHp)}
            <div class="fighter-numbers"><span>${battle.hp} / ${battle.maxHp} HP</span></div>
            <div class="fighter-sub">${enemy.desc}</div>
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

  return `<div class="result-overlay">
    <div class="result-card lose">
      <h2>Поражение</h2>
      <button class="btn primary" data-act="result-continue" type="button">В Йорстед</button>
    </div>
  </div>`;
}

function subHeader(title, subtitle, backScreen, backLabel = "← Назад") {
  return `<div class="subhead"><button class="btn tiny ghost" data-act="goto" data-screen="${backScreen}" type="button">${backLabel}</button><div><h1>${title}</h1><p class="muted">${subtitle}</p></div><div class="subhead-gold">💰 <b>${state.gold}</b></div></div>`;
}

function scrollLog() { const log = document.getElementById("battle-log"); if (log) log.scrollTop = log.scrollHeight; }

function render() {
  const screen = document.getElementById("screen"); const topbar = document.getElementById("topbar");
  if (!state.created) { if (!view.create) resetCreate(); topbar.innerHTML = ""; topbar.hidden = true; screen.innerHTML = createHtml(); screen.dataset.screen = "create"; return; }
  topbar.hidden = false; const st = stats(); topbar.innerHTML = topbarHtml(st); let html = "";
  switch (view.screen) {
    case "floor": html = floorHtml(); break;
    case "hub": html = hubHtml(st); break; case "market": html = marketHtml(); break; case "forge": html = forgeHtml(); break; case "alchemy": html = alchemyHtml(); break;
    case "jewelry": html = jewelryHtml(); break; case "hotel": html = hotelHtml(); break; case "training": html = trainingHtml(); break; case "hero": html = heroHtml(st); break;
    case "tower": html = towerHtml(); break; case "battle": html = battleHtml(st); break; default: html = hubHtml(st);
  }
    if (view.questsOpen) html += questsModalHtml();
  screen.innerHTML = html; screen.dataset.screen = view.screen; if (view.screen === "battle") requestAnimationFrame(scrollLog);
}

function startBattle(floorId, mobKey) {
  const floor = FLOORS.find((f) => f.id === floorId); if (!floor) return; const def = mobKey === "boss" ? floor.boss : floor.mobs[Number(mobKey)]; if (!def) return;
  const spend = spendFightEnergy(); if (!spend.ok) { toast(spend.text, "warn"); render(); return; }
  beginBattle(def, floor.id);
  // Засада: только в обычном бою, не с боссом.
  if (!def.boss && Math.random() < AMBUSH_CHANCE) {
    view.ambush = { floorId: floor.id, nextMobIndex: ambushMobIndex(floor, Number(mobKey)) };
  }
}

// Общая точка входа в бой: строит баттл и настраивает экран.
function beginBattle(def, floorId, opts = {}) {
  const st = stats();
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
  const result = exchange(state, view.battle, { type, zone: view.attackZone, blocks: view.blocks, id: potionId });
  if (result.error) { toast(result.error, "warn"); return; } if (result.summary) view.summary = result.summary; render();
}

function endTrip() { if (!view.tripActive) return; view.tripActive = false; advancePhase(); }

function go(screen) {
  if (!state.created) return;
  if (view.farm) stopFarm("Фарм остановлен.");
  if (battleActive()) { toast("Сначала завершите бой.", "warn"); return; }
  if (screen === "hero" && view.screen !== "hero") {
    view.heroBackScreen = view.screen;
  }
  if (screen === "tower") { const reason = towerClosedReason(); if (reason) { toast(reason, "warn"); return; } }
  
  const leavingTower = view.tripActive && (view.screen === "tower" || view.screen === "battle") && screen !== "tower" && screen !== "battle" && screen !== "hero";
  
  if (leavingTower) endTrip();
  // Уход с экрана боя отменяет ждущую засаду — как побег.
  view.ambush = null;
  view.screen = screen;
  view.dollSlot = null;
  view.invItemUid = null;
  if (screen === "tower") view.tripActive = true;
  if (screen !== "battle") view.summary = null;
  render();
}

function setAttackZone(zone) { if (!ZONE_NAME[zone]) return; view.attackZone = zone; render(); }
function toggleBlock(zone) { if (!ZONE_NAME[zone]) return; const limit = stats().blockZones; if (view.blocks.includes(zone)) view.blocks = view.blocks.filter((z) => z !== zone); else if (view.blocks.length >= limit) { toast(`Максимум ${limit} зон.`, "warn"); return; } else { view.blocks = [...view.blocks, zone]; } render(); }

function handleKey(event) {
  if (!state) return; if (!state.created) { if (event.key === "Enter" && view.create) tryStartGame(); return; }
  if (event.target?.closest?.("input, textarea, select")) return;
  if (event.key === "Escape" && (view.dollSlot || view.invItemUid)) { view.dollSlot = null; view.invItemUid = null; render(); return; }
  if (view.summary && event.key === "Enter") { document.querySelector('[data-act="result-continue"]')?.click(); return; }
  if (view.screen !== "battle" || !view.battle || view.battle.over) return;
  const match = /^(?:Digit|Numpad)([1-5])$/.exec(event.code); if (match) { const zone = ZONES[Number(match[1]) - 1].id; if (event.shiftKey) toggleBlock(zone); else setAttackZone(zone); return; }
  if (event.key === "Enter") doExchange("attack");
}

function onInput(event) {
  const el = event.target;
  if (el?.dataset?.role === "create-name" && view.create) { view.create.name = el.value; const caption = document.querySelector(".preview-portrait-caption b"); if (caption) caption.textContent = el.value.trim() || "Странник"; return; }
  // Поиск в инвентаре: render() пересобирает DOM, поэтому после него возвращаем фокус и курсор в поле.
  if (el?.dataset?.role === "inv-search") {
    view.invSearch = el.value;
    const pos = el.selectionStart;
    render();
    const input = document.querySelector('[data-role="inv-search"]');
    if (input) { input.focus(); try { input.setSelectionRange(pos, pos); } catch { /* не критично */ } }
  }
}

function startFarm(floorId, mobIndex) {
  const floor = FLOORS.find((f) => f.id === floorId); if (!floor) return; const mob = floor.mobs[mobIndex]; if (!mob) return;
  if (state.energy < FIGHT_ENERGY_COST) { toast("Энергия на исходе.", "warn"); return; }
  view.farm = { floorId, mobIndex, timer: null, log: [] }; toast(`Начат фарм: ${mob.name}`, "info"); render(); view.farm.timer = setTimeout(() => { if (view.farm) farmTick(); }, 100);
}

function farmTick() {
  if (!view.farm) return; const floor = FLOORS.find(f => f.id === view.farm.floorId); const mob = floor?.mobs[view.farm.mobIndex]; if (!mob) { stopFarm("Ошибка."); return; }
  if (state.energy < FIGHT_ENERGY_COST) { stopFarm("Энергия на исходе."); return; }
  const result = simulateFarmBattle(mob); view.farm.log.push(`[${new Date().toLocaleTimeString()}] ${result.text}`); render();
  if (!result.ok) { stopFarm(result.text); return; }
  view.farm.timer = setTimeout(farmTick, 1500);
}

function stopFarm(reason) { if (!view.farm) return; clearTimeout(view.farm.timer); view.farm = null; if (reason) toast(reason, "warn"); render(); }

function onClick(event) {
  const el = event.target.closest("[data-act]"); if (!el || el.disabled) return; event.preventDefault();
  const act = el.dataset.act; const id = el.dataset.id; let res;
  switch (act) {
    case "floor-open": view.currentFloor = Number(el.dataset.floor); view.screen = "floor"; render(); break;
    case "quests-open": view.questsOpen = true; render(); break;
    case "quests-close": view.questsOpen = false; render(); break;
    case "goto":
      if (el.dataset.screen === "tower") view.currentFloor = null;
      go(el.dataset.screen);
      break;
    case "forge-tab": view.forgeTab = el.dataset.tab; render(); break;
    case "jewelry-tab": view.jewelryTab = el.dataset.tab; render(); break;
    case "alchemy-tab": view.alchemyTab = el.dataset.tab || "potions"; render(); break;
    case "training-tab": view.trainingTab = el.dataset.tab || "train"; render(); break;
    case "inventory-tab": view.inventoryTab = el.dataset.tab || "gear"; render(); break;
    case "claim-quest": res = claimQuest(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
    case "claim-npc-quest": res = claimNpcQuest(id); toast(res.text, res.ok ? "ok" : "warn"); render(); break;
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
    case "gather":
       res = gatherResource(Number(el.dataset.floor) || state.maxFloor);
      toast(res.text, res.ok ? "ok" : "warn");
      if (res.encounter) {
        const floor = FLOORS.find(f => f.id === res.encounter.floorId);
        const def = floor ? floor.mobs[res.encounter.mobIndex] : null;
        if (def) {
          beginBattle(def, floor.id);
          view.ambush = res.encounter.ambush || null;
        } else {
          render();
        }
      } else {
        render();
      }
      break;
    case "fight": startBattle(Number(el.dataset.floor), el.dataset.mob); break;
    case "farm": startFarm(Number(el.dataset.floor), Number(el.dataset.mob)); break;
    case "farm-stop": stopFarm("Фарм остановлен."); break;
    case "attack-zone": setAttackZone(el.dataset.zone); break;
    case "block-zone": toggleBlock(el.dataset.zone); break;
    case "exchange": doExchange("attack"); break;
    case "tech": doExchange("tech"); break;
    case "flee": view.battle = null; view.summary = null; view.ambush = null; saveState(); view.screen = "tower"; render(); break;
    case "result-continue": {
      const victory = view.summary?.victory;
      const ambush = victory ? view.ambush : null;
      view.battle = null; view.summary = null;
      if (ambush) {
        // Второй бой засады бесплатный: энергия не тратится.
        const floor = FLOORS.find((f) => f.id === ambush.floorId);
        const def = floor ? floor.mobs[ambush.nextMobIndex] : null;
        view.ambush = null;
        if (def) { beginBattle(def, floor.id, { ambush: true }); break; }
      }
      view.ambush = null;
      if (victory) view.screen = "tower";
      else { view.screen = "hub"; endTrip(); }
      render();
      break;
    }
    case "reset": if (confirm("Сбросить прогресс?")) { resetState(); view.battle = null; view.summary = null; view.create = null; view.ambush = null; view.dollSlot = null; view.invItemUid = null; view.invFilter = "all"; view.invSearch = ""; view.screen = "hub"; render(); } break;
    default: break;
  }
}