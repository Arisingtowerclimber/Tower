// Файл содержит экраны создания персонажа (выбор биографии, архетипа, портрета).

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
