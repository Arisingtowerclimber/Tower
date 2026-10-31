// Файл содержит интерфейс мира, этажей, событий, диалогов и модальных окон.

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
      <div class="vital"><div class="vital-top"><span><img src="assets/ui/stats/icon_hp.png" style="width: 16px; height: 16px; object-fit: contain; vertical-align: middle; margin-right: 4px;">HP</span><b>${state.hp}<i>/${st.maxHp}</i></b></div>${bar("hp", state.hp, st.maxHp)}</div>
      <div class="vital"><div class="vital-top"><span><img src="assets/ui/stats/icon_mana.png" style="width: 16px; height: 16px; object-fit: contain; vertical-align: middle; margin-right: 4px;">МАНА</span><b>${state.mana}<i>/${st.maxMana}</i></b></div>${bar("mana", state.mana, st.maxMana)}</div>
      <div class="vital energy-vital"><div class="vital-top"><span><img src="assets/ui/stats/icon_energy.png" style="width: 16px; height: 16px; object-fit: contain; vertical-align: middle; margin-right: 4px;">ЭНЕРГИЯ</span><b>${state.energy}<i>/${st.maxEnergy}</i></b></div>${bar("energy", state.energy, st.maxEnergy)}</div>
      <div class="pill gold"><img src="assets/ui/stats/icon_gold.png" style="width: 18px; height: 18px; object-fit: contain; vertical-align: middle; margin-right: 4px;" alt="Золото"><b>${state.gold}</b></div><div class="pill">УР <b>${state.level}</b></div>
      ${state.points > 0 ? `<button class="pill gold points" data-act="goto" data-screen="hero" type="button">+<b>${state.points}</b></button>` : ""}
      <div class="pill">ЭТАЖ <b>${state.maxFloor}/5</b></div>
      ${shopFactionPill()}
      <div class="pill time event-pill${phase.towerOpen ? "" : " night"}" data-tip="${event ? `${event.icon} ${event.name}: ${esc(event.desc)}` : "Сегодня обычный день — событий нет"}">${phase.icon} <b>${phase.name}</b> · ${calendarLabel()}</div>
      ${weeklyPill}
    </div>
    <nav class="topnav${lockNav}">
      <button class="nav-btn icon-btn rest-btn" data-act="rest" type="button" data-tooltip="Отдых<br><kbd>R</kbd>"><img src="assets/ui/topbar/icon_rest.png" style="width: 24px; height: 24px; object-fit: contain; display: block;" alt="Отдых"></button>
      <button class="nav-btn icon-btn${hasRewards ? " ok" : ""}" data-act="quests-open" type="button" data-tooltip="Журнал заданий<br><kbd>J</kbd>"><img src="assets/ui/topbar/icon_journal.png" style="width: 24px; height: 24px; object-fit: contain; display: block;" alt="Журнал"></button>
      <button class="nav-btn icon-btn" data-act="bestiary-open" type="button" data-tooltip="Бестиарий<br><kbd>B</kbd>"><img src="assets/ui/topbar/icon_bestiary.png" style="width: 24px; height: 24px; object-fit: contain; display: block;" alt="Бестиарий"></button>
      <button class="nav-btn icon-btn" data-act="goto" data-screen="hero" type="button" data-tooltip="Герой<br><kbd>C</kbd>"><img src="assets/ui/topbar/icon_hero.png" style="width: 24px; height: 24px; object-fit: contain; display: block;" alt="Герой"></button>
      <button class="nav-btn icon-btn" data-act="goto" data-screen="hub" type="button" data-tooltip="В город<br><kbd>H</kbd>"><img src="assets/ui/topbar/icon_hub.png" style="width: 24px; height: 24px; object-fit: contain; display: block;" alt="Хаб"></button>
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
      ${lastBattleLogHtml()}
    </section>
  `;
}

const COMPANION_BATTLE_TEXT = {
  heal: "Лечит героя в бою",
  stun: "Оглушает врага",
  strike: "Наносит удар по врагу",
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
          <span class="price">${q.gold} · ✦ ${q.xp}</span>
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
              <h3 style="margin: 0;">${esc(def.title)}</h3>
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
        <button class="shop-tab${tab === "week" ? " active" : ""}" data-act="quests-tab" data-tab="week" type="button">Недельные</button>
        <button class="shop-tab${tab === "story" ? " active" : ""}" data-act="quests-tab" data-tab="story" type="button">Сюжетные</button>
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
      <p class="settings-help"><b>Глобальные:</b></p>
      <p class="settings-help"><kbd>C</kbd> — Герой (инвентарь)</p>
      <p class="settings-help"><kbd>J</kbd> — Журнал заданий</p>
      <p class="settings-help"><kbd>M</kbd> — Башня</p>
      <p class="settings-help"><kbd>H</kbd> — Йорстед (город)</p>
      <p class="settings-help"><kbd>B</kbd> — Бестиарий</p>
      <p class="settings-help"><kbd>Space</kbd> / <kbd>Enter</kbd> — Подтвердить / Далее</p>
      <p class="settings-help"><kbd>Esc</kbd> — Закрыть окно / Назад</p>
      <br>
      <p class="settings-help"><b>В бою:</b></p>
      <p class="settings-help"><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> — Смена оружия</p>
      <p class="settings-help"><kbd>Shift</kbd> + <kbd>1-4</kbd> — Нанести масло</p>
      <p class="settings-help"><kbd>Esc</kbd> — Тактическая пауза (Расходники)</p>
    `;
  }

  return `
    <div class="settings-backdrop" data-act="settings-close"></div>
    <div class="settings-modal" role="dialog" aria-label="Настройки">
      <div class="settings-head">
        <h3>Настройки</h3>
        <button class="settings-close" data-act="settings-close" type="button">✕</button>
      </div>
      <div class="settings-body">
        <aside class="settings-sidebar">
          ${tabBtn("audio", "Звук")}
          ${tabBtn("ui", "Интерфейс")}
          ${tabBtn("controls", "Управление")}
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
          <b class="bestiary-name">${def.name}</b>
          <p class="bestiary-desc">${def.desc || ""}</p>
          <div class="bestiary-chips">
            <span class="mob-stat-chip hp">${def.hp}</span>
            <span class="mob-stat-chip atk">${def.atk}</span>
            <span class="mob-stat-chip def">${def.def}</span>
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
        <h3>Бестиарий (${knownCount}/${total})</h3>
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


function towerHtml() {
  const reason = towerClosedReason();

  const floors = FLOORS.map((floor) => {
    const locked = floor.id > state.maxFloor;
    const cleared = Boolean(state.cleared[floor.id]);

    return `
      <article class="floor-card${locked ? " locked" : ""}${cleared ? " cleared" : ""}" 
               style="position: relative; overflow: hidden; min-height: 250px; border: 1px solid var(--line); border-radius: 16px; padding: 0;">
        
         <div style="position: absolute; inset: 0; background-image: url('${floor.cardImg || floor.bg || "assets/backgrounds/tower.webp"}'); background-size: cover; background-position: center; z-index: 0; ${locked ? 'filter: grayscale(1) brightness(0.85);' : 'filter: brightness(0.85);'}"></div>
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
              ? `<span class="badge" style="border-color: var(--blood); color: var(--blood);">Запечатан</span>`
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

  const zones = ZONE_NAMES[floor.id] || ["Зона 1", "Зона 2", "Зона 3", "Зона 4", "Зона 5"];
  const zoneDescs = ["Легкие враги", "Средние враги", "Сильные враги", "Элитные враги", "Смертельная зона"];

  const selectedZone = Math.max(1, Math.min(5, Number(view.selectedZone) || 1));
  const zoneRows = zones.map((name, index) => {
    const zoneId = index + 1;
    const requiredProgress = index * 20; // 0%, 20%, 40%, 60%, 80%
    const isLocked = progress < requiredProgress;
    const desc = zoneDescs[index] || "Неизвестно";
    const activeClass = zoneId === selectedZone ? " active" : "";

    if (isLocked) {
      return '<div class="zone-row locked' + activeClass + '">' +
        '<div class="zone-row-info">' +
        '<span class="zone-row-title">' + name + ' (Заблокировано)</span>' +
        '<span class="zone-row-desc">Требуется исследовать этаж на ' + requiredProgress + '%</span>' +
        '</div>' +
        '<div class="zone-row-action"><span style="color:var(--dim); font-size:20px;">🔒</span></div>' +
        '</div>';
    }

    return '<div class="zone-row zone-' + zoneId + activeClass + '" data-act="select-zone" data-zone="' + zoneId + '" role="button" tabindex="0">' +
      '<div class="zone-row-info">' +
      '<span class="zone-row-title">' + name + '</span>' +
      '<span class="zone-row-desc">' + desc + '</span>' +
      '</div>' +
      '<div class="zone-row-action">' +
      '<span class="zone-row-cost">1 ⚡</span>' +
      '<button class="btn small primary" data-act="explore" data-floor="' + floor.id + '" data-zone="' + zoneId + '" ' + (canFight ? "" : "disabled") + ' type="button">Исследовать</button>' +
      '</div>' +
      '</div>';
  }).join('');

  const exploreActions = '<div class="zone-list">' + zoneRows + '</div>' +
    '<div style="display:flex; gap:10px; align-items:center; justify-content:flex-end; flex-wrap:wrap; padding-top:15px; margin-top:10px; border-top: 1px solid rgba(255,255,255,0.05);">' +
    ((!explored || cleared) ? autoBlock : "") + '</div>';

  const autoPanel = view.autoExplore ? `
    <div style="margin-top: 15px; border: 1px solid var(--line); border-radius: 10px; background: rgba(0,0,0,0.25); padding: 12px 14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
        <b style="font-size:14px; color: var(--gold2);">Авто-исследование: ${view.autoExplore.avoidDanger ? "Скрытный" : "Боевой"}${battleActive() ? ` <span style="color: var(--gold);">(пауза на бой)</span>` : ""}</b>
        <button class="btn small danger" data-act="auto-stop" type="button">Стоп</button>
      </div>
      <div style="margin-top:10px; background:#0b0b0d; border:1px solid var(--line); border-radius:8px; padding:8px 10px; max-height:120px; overflow-y:auto; font-family: Consolas, 'Courier New', monospace; font-size:12px; line-height:1.7; color:#8fd98f;">
        ${view.autoExplore.log.length ? view.autoExplore.log.slice(-7).map(line => `<div>${line}</div>`).join("") : `<div style="color:#5a5a5a;">Ожидание…</div>`}
      </div>
    </div>
  ` : "";

  const exploreBlock = `
    <div class="explore-block" style="padding: 20px; border-radius: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--line); margin-bottom: 20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:15px; flex-wrap:wrap;">
        <div style="display:flex; flex-direction:column; gap:4px;">
          <b style="font-size: 18px; color: var(--gold2);">Выберите зону для исследования</b>
          <span class="explore-hint">↑ / ↓ — выбрать зону · <b class="explore-key">E</b> — исследовать</span>
        </div>
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
              <span class="mob-stat-chip hp" style="font-size: 13px; padding: 5px 12px;">${floor.boss.hp} HP</span>
              <span class="mob-stat-chip atk" style="font-size: 13px; padding: 5px 12px;">${floor.boss.atk}</span>
              <span class="mob-stat-chip def" style="font-size: 13px; padding: 5px 12px;">${floor.boss.def}</span>
            </div>
          </div>
          <button class="btn primary" data-act="fight" data-floor="${floor.id}" data-mob="boss" ${canFight ? "" : "disabled"} type="button" style="font-size: 14px; padding: 10px 16px;">Атаковать Босса</button>
          ${cleared
            ? `<span class="badge elite" style="padding: 8px 14px;">Повержен — можно снова</span>`
            : `<span class="badge elite" style="padding: 8px 14px;">Босс пробуждён</span>`}
        </div>` : ""}
      </article>
    </div>
    ${lastBattleLogHtml()}
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

// ── Единая нижняя панель событий (Bottom Sheet + журнал) ────────────────────
// Верхние модалки события больше не рисуются: всё живёт в одной панели.
// Результат действия не улетает тостом, а висит здесь до кнопки «Продолжить».
function pushEventResult(icon, title, text, tone = "ok") {
  const entry = {
    icon: icon || "",
    title: title || "Событие",
    text: String(text || ""),
    tone: tone === "warn" ? "warn" : "ok",
  };
  view.eventJournal = Array.isArray(view.eventJournal) ? view.eventJournal : [];
  view.eventJournal.push(entry);
  if (view.eventJournal.length > 40) view.eventJournal.splice(0, view.eventJournal.length - 40);
  view.eventResult = entry;
  view.eventSelectedIndex = 0;
  return entry;
}

// История для карусели журнала: последние 20 исследований, без скролла.
function pushEventLog(title, text) {
  view.eventLog = Array.isArray(view.eventLog) ? view.eventLog : [];
  view.eventLog.push({ title: title || "Исследование", text: String(text || "") });
  if (view.eventLog.length > 20) view.eventLog.splice(0, view.eventLog.length - 20);
  view.eventLogIndex = -1;
}

// Перелистывание карусели. -1 — реальное время, 0..len-1 — история.
function cycleEventLog(dir) {
  const log = Array.isArray(view.eventLog) ? view.eventLog : [];
  if (!log.length) return false;
  const len = log.length;
  let cur = Number(view.eventLogIndex);
  if (!Number.isFinite(cur) || cur < -1) cur = -1;
  let next;
  if (dir < 0) next = cur <= 0 ? (cur === -1 ? len - 1 : -1) : cur - 1;
  else next = cur === -1 ? 0 : (cur >= len - 1 ? -1 : cur + 1);
  view.eventLogIndex = next;
  return true;
}

function eventJournalHtml(skipLast = false) {
  const all = Array.isArray(view.eventJournal) ? view.eventJournal : [];
  const entries = skipLast ? all.slice(0, -1) : all;
  if (!entries.length) return "";
  const rows = entries.slice().reverse().map((entry) => `
    <div class="event-journal-entry ${entry.tone === "warn" ? "warn" : "ok"}">
      <span class="event-journal-icon">${esc(entry.icon || "•")}</span>
      <div class="event-journal-body">
        <b>${esc(entry.title)}</b>
        <span>${esc(entry.text)}</span>
      </div>
    </div>`).join("");
  return `
    <div class="event-journal">
      <div class="event-journal-title">Журнал событий</div>
      <div class="event-journal-scroll">${rows}</div>
    </div>`;
}

// Кнопки событий и сцен — строго текстовые, без эмодзи.
function stripEmoji(text) {
  return String(text == null ? "" : text)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}]/gu, "")
    .replace(/\s+([,.:;!?)\]])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function eventOptionButton({ act, attrs, index, label }) {
  const selected = index === (Number(view.eventSelectedIndex) || 0) ? " kbd-selected" : "";
  const clean = stripEmoji(label);
  return `<button class="btn primary event-option${selected}" data-act="${act}" ${attrs} type="button" aria-keyshortcuts="${index + 1}"><span class="event-key">[${index + 1}]</span><span>${clean}</span></button>`;
}

// Карусель журнала: заголовок с навигацией, текущее событие или история.
function renderEventLogCarousel() {
  const log = Array.isArray(view.eventLog) ? view.eventLog : [];
  const historyIndex = Number(view.eventLogIndex);
  const inHistory = historyIndex >= 0 && log.length > 0;
  const index = inHistory ? Math.min(historyIndex, log.length - 1) : -1;

  const head = () => `
    <div class="event-log-head">
      <button class="event-log-nav" data-act="log-prev" type="button" aria-label="Предыдущее событие">←</button>
      <span class="event-log-head-gap" aria-hidden="true"></span>
      <button class="event-log-nav" data-act="log-next" type="button" aria-label="Следующее событие">→</button>
    </div>
  `;

  // Заголовок выносим в отдельную рамку над панелью, тело — в прокручиваемую область.
  // Тело панели всегда состоит из двух зон: текст (скроллится) и кнопки (прижаты к низу).
  const layout = (title, body = "", actions = "") => ({
    title: title || "Журнал событий",
    html: `<div class="event-scroll">${head()}${body}</div>` +
      `<div class="event-footer">${actions}</div>`,
  });

  // История: только запись журнала, кнопки выбора события скрыты.
  if (inHistory) {
    const entry = log[index] || { title: "Исследование", text: "" };
    return layout(entry.title || "Исследование",
      `<p class="event-result-text">${esc(entry.text)}</p>`);
  }

  // Режим реального времени: активное событие и его кнопки выбора.
  const proc = state.activeEvent;
  const floorEvent = state.activeFloorEvent;
  const result = view.eventResult;

  if (proc) {
    const reaction = companionReaction(proc.type || "explore", proc.id);
    const actions = (proc.options || []).map((o, i) => eventOptionButton({
      act: "event-action",
      attrs: `data-event="${proc.id}" data-option="${o.id}"`,
      index: i,
      label: esc(o.label),
    })).join("");
    return layout(proc.title || proc.name || "Событие",
      `<p>${esc(proc.text)}</p>` +
      (reaction ? `<p class="companion-reaction">${esc(reaction)}</p>` : ""),
      `<div class="event-actions">${actions}</div>`);
  }

  if (floorEvent && floorEvent.encounter) {
    const enc = (HUNTER_ENCOUNTERS || []).find((h) => h.id === floorEvent.encounter);
    if (enc) {
      const hint = enc.helpNeed
        ? (enc.helpNeed.potion ? "Помощь стоит лечащего зелья." : "Помощь стоит одного ресурса.")
        : "Помощь — за просто так.";
      const actions = [
        { id: "help", label: "Помочь" },
        { id: "kill", label: "Убить" },
        { id: "leave", label: "Оставить в покое" },
      ].map((a, i) => eventOptionButton({
        act: "hunter-enc-action",
        attrs: `data-enc="${enc.id}" data-action="${a.id}"`,
        index: i,
        label: a.label,
      })).join("");
      return layout(enc.name || enc.title || "Встреча",
        `<p>${esc(enc.text)}</p>` +
        `<p class="event-hint">${esc(hint)}</p>`,
        `<div class="event-actions">${actions}</div>`);
    }
  }

  if (floorEvent) {
    const event = FLOOR_EVENTS[floorEvent.eventId];
    if (event) {
      const reaction = companionReaction(event.type || "explore", `${event.id}:${floorEvent.floorId}`);
      const actions = (event.actions || []).map((a, i) => eventOptionButton({
        act: "floor-event-action",
        attrs: `data-event="${event.id}" data-action="${a.id}"`,
        index: i,
        label: esc(a.label),
      })).join("");
      return layout(event.title || event.name || "Событие",
        `<p>${esc(event.text)}</p>` +
        (reaction ? `<p class="companion-reaction">${esc(reaction)}</p>` : ""),
        `<div class="event-actions">${actions}</div>`);
    }
  }

  if (result) {
    return layout(result.title,
      `<p class="event-result-text ${result.tone === "warn" ? "event-fail" : "event-success"}">${esc(result.text)}</p>`,
      `<div class="event-actions"><button class="btn primary" data-act="event-continue" type="button">Продолжить</button></div>`);
  }

  return layout("Журнал событий");
}

function eventSheetHtml() {
  const onExploreScreen = view.screen === "floor" || view.screen === "tower";
  const hasContent = Boolean(state.activeEvent || state.activeFloorEvent || view.eventResult);
  // На экранах исследования панель присутствует всегда (пустая или с историей),
  // чтобы её появление не сдвигало интерфейс.
  if (!hasContent && !onExploreScreen) return "";
  const carousel = renderEventLogCarousel();
  return `
    <div class="event-bottom-sheet${view.eventResult && Number(view.eventLogIndex) < 0 ? " event-result-sheet" : ""}">
      <div class="event-log-title-badge"><span>${esc(carousel.title)}</span></div>
      <div class="event-content event-content-journal">${carousel.html}</div>
    </div>
  `;
}

// Диалог встречи с охотником Гильдии: помочь / убить / оставить в покое.
function renderHunterEncounterModal(fe) {
  const enc = (HUNTER_ENCOUNTERS || []).find((h) => h.id === fe.encounter);
  if (!enc) return "";
  const hint = enc.helpNeed ? (enc.helpNeed.potion ? "Помощь стоит лечащего зелья." : "Помощь стоит одного ресурса.") : "Помощь — за просто так.";
  const actions = [
    { id: "help", label: "Помочь" },
    { id: "kill", label: "Убить" },
    { id: "leave", label: "Оставить в покое" },
  ].map((a, i) =>
    `<button class="btn primary" data-act="hunter-enc-action" data-enc="${enc.id}" data-action="${a.id}" type="button" style="flex:1; min-width:150px;"><span class="event-key">[${i + 1}]</span>${stripEmoji(a.label)}</button>`
  ).join("");
  return `
    <div class="event-bottom-sheet">
      <div class="event-content">
        <h2>${esc(enc.name || enc.title || "")}</h2>
        <p>${esc(enc.text)}</p>
        <p style="font-size: 13px; color: rgba(220, 205, 175, 0.75); margin: -8px 0 16px;">${esc(hint)}</p>
        <div class="event-actions">${actions}</div>
      </div>
    </div>
  `;
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


function sceneModalHtml() {
  const floor = FLOORS.find((f) => f.id === state.activeSceneFloorId);
  const scene = floor ? (FLOOR_SCENES[floor.id] || []).find((s) => s.id === state.activeSceneId) : null;
  if (!scene) return "";
  const actions = scene.actions.map((a, i) =>
    `<button class="btn primary event-option" data-act="scene-action" data-action="${a.id}" type="button"><span class="event-key">[${i + 1}]</span><span>${esc(stripEmoji(a.label))}</span></button>`
  ).join("");
  return `
    <div class="event-bottom-sheet scene-bottom-sheet">
      <div class="event-content">
        <h2>${esc(scene.title)}</h2>
        <p>${esc(scene.text)}</p>
        <div class="event-actions">${actions}</div>
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
          <img src="${npcPortraitSrc(npcId)}" alt="" style="width:64px; height:64px; border-radius:10px; border:1px solid var(--gold); object-fit:cover;" onerror="this.outerHTML='<b style=font-size:40px></b>'">
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
  // Единая точка выхода: не трогаем экран, этаж и tripActive — их меняет
  // только навигация (go). Непроданный товар Артура возвращаем в никуда.
  const hadTraderStock = !!(view.traderStock && view.traderStock.length);
  if (typeof discardTraderStock === "function") discardTraderStock();
  if (hadTraderStock) saveState();
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
        icon: item?.icon || entry.icon || "",
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
  const priceText = side === "left" && entry.canBuy === false ? `Нужно ${entry.price}` : `${entry.price}`;
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
      <div class="mnb-trade-gold">Ваше золото: <b>${Math.floor(state.gold || 0)}</b></div>
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
  const chestRow = station === "forge"
    ? (() => {
      normalizeChests();
      const enough = Object.entries(CHEST_SCRAP_COST).every(([resId, need]) => (state.resources[resId] || 0) >= need);
      return `<article class="mnb-craft-row${enough ? "" : " lack"} chest-craft-row">
        <div class="mnb-craft-icon">${iconHtml(CHEST_TYPES.common.icon, 30)}</div>
        <div class="mnb-craft-main">
          <div class="mnb-craft-name">Обычный сундук — ларец из обрезков</div>
          <div class="mnb-craft-materials">${materialChipHtmlEx(CHEST_SCRAP_COST)}<span class="chip">Без чертежа</span></div>
        </div>
        <button class="btn mnb-craft-btn" data-act="craft" data-id="${CHEST_SCRAP_CRAFT_ID}" ${enough ? "" : "disabled"} type="button">Создать</button>
      </article>`;
    })()
    : "";
  const rowsInner = recipes.map((recipe) => {
    const item = ITEMS[recipe.result];
    const copies = copiesOf(recipe.result);
    const enough = Object.entries(recipe.materials).every(([resId, need]) => (state.resources[resId] || 0) >= need);
    const countChip = copies.length ? `<span class="chip ok">В сумке: ${copies.length}</span>` : "";
    return `<article class="mnb-craft-row${enough ? "" : " lack"}">
      <div class="mnb-craft-icon">${iconHtml(item ? item.icon : "", 30)}</div>
      <div class="mnb-craft-main">
        <div class="mnb-craft-name">${esc(recipe.desc)}</div>
        <div class="mnb-craft-materials">${materialChipHtmlEx(recipe.materials)}${countChip}</div>
      </div>
      <button class="btn mnb-craft-btn" data-act="craft" data-id="${recipe.id}" ${enough ? "" : "disabled"} type="button">Создать</button>
    </article>`;
  }).join("");
  if (!chestRow && !rowsInner) {
    return `<div class="mnb-trade-empty">Вы ещё не нашли ни одного рецепта. Побеждайте мобов и боссов Башни — с них выпадают чертежи.</div>`;
  }
  return chestRow + rowsInner;
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
    return `<div class="mnb-craft-res"><span>${iconHtml(res ? res.icon : "", 18)} ${esc(res ? res.name : resId)}</span><b>${state.resources[resId] || 0}</b></div>`;
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
      <p class="confirm-text">Вы уверены, что хотите купить <b>${esc(pc.name)}</b> за <b>${pc.price}</b>?</p>
      <div class="confirm-actions">
        <button class="btn primary" data-act="confirm-buy" type="button">Купить</button>
        <button class="btn ghost" data-act="cancel-buy" type="button">Отмена</button>
      </div>
    </div>
  </div>`;
}

// ── Сундуки (Гача): сводка выпавшего ───────────────────────────────────────
// 1–5 открытых сундуков — красивые карточки лута, 10+ — компактный список.
function renderLootSummary(results) {
  const opened = results.reduce((n, r) => n + 1, 0);
  const entries = results.flatMap((r) => r.entries || []);
  const cardView = opened <= 5;
  if (!entries.length) return `<p class="empty">Сундук оказался пуст. Случается.</p>`;

  if (cardView) {
    const cards = entries.map((entry) => {
      const rCls = entry.kind === "equipment" && entry.uid ? rarityClass(getInstance(entry.uid)).trim() : "";
      const subline = entry.kind === "equipment"
        ? "Снаряжение"
        : entry.kind === "resource" ? "Ресурс" : "Найдено";
      return `<div class="chest-loot-card${rCls ? ` ${rCls}` : ""}">
        <span class="chest-loot-icon">${iconHtml(entry.icon, 34)}</span>
        <span class="chest-loot-name">${esc(entry.name)}</span>
        ${entry.amount > 1 ? `<span class="chest-loot-amount">×${entry.amount}</span>` : ""}
        <span class="chest-loot-kind">${subline}</span>
      </div>`;
    }).join("");
    return `<div class="chest-loot-grid">${cards}</div>`;
  }

  const agg = new Map();
  for (const entry of entries) {
    const key = `${entry.kind}|${entry.name}`;
    const prev = agg.get(key) || { ...entry, amount: 0 };
    prev.amount += entry.amount;
    agg.set(key, prev);
  }
  const rows = Array.from(agg.values()).map((entry) => {
    const rCls = entry.kind === "equipment" && entry.uid ? rarityClass(getInstance(entry.uid)).trim() : "";
    return `<li${rCls ? ` class="${rCls}"` : ""}>${iconHtml(entry.icon, 20)} <span>${esc(entry.name)}</span> <b>×${entry.amount}</b></li>`;
  }).join("");
  return `<ul class="chest-loot-list">${rows}</ul>`;
}

function chestResultModalHtml() {
  const cr = view.chestResults;
  if (!cr) return "";
  const title = cr.opened > 1 ? `Открыто сундуков: ${cr.opened}` : "Сундук открыт";
  return `<div class="result-overlay chest-overlay" data-act="chest-result-close" style="z-index: 210;">
    <div class="result-card win chest-result-card" data-act="interaction-noop" role="dialog" aria-modal="true">
      <h2>${title}</h2>
      ${renderLootSummary(cr.results)}
      <button class="btn primary" data-act="chest-result-close" type="button">Отлично</button>
    </div>
  </div>`;
}

// Приоритеты кнопок диалога: главные действия всегда сверху, «Уйти» — снизу.// 1 — торговля, 2 — крафт, 3 — задания, 5 — обычные темы (лор, похвала,
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
  const label = String(opt?.label || "").trim().toLowerCase();
  // «Уйти» — всегда последняя кнопка, «← Назад» — предпоследняя.
  // Приоритет зависит только от подписи: опции с next: null/start не должны
  // случайно попадать вниз списка (например, «Понял.» или «Не сейчас.»).
  if (label.includes("уйти")) return 100;
  if (label.startsWith("←") || label.includes("назад")) return 90;
  if (opt?.action === "open_shop" || opt?.action === "open_trade" || label.includes("показать товары")) return 1;
  if (opt?.action === "open_craft" || label.includes("крафт")) return 2;
  if (opt?.action === "open_quests" || label.includes("взять задание") || label.includes("задания") || label.includes("сюжет") || opt?.next === "story_offer") return 3;
  if (label.includes("задать вопрос") || opt?.next === "ivan_lore") return 4;
  if (label.includes("поболтать") || opt?.next === DIALOG_TOPICS_NODE) return 8;
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
  // Узел с флагом noExtras скрывает все дополнительные кнопки (задания, темы, сюжет).
  const currentNode = interactionNode(npcId);
  if (currentNode && currentNode.noExtras) {
    return { questButton: "", topicsButton: "", storyActionBtn: "" };
  }
  ensureWeekQuests();
  const q = state.weekQuests.list.find((x) => x.npc === npcId);
  let questButton = "";
  let topicsButton = "";
  // У остальных NPC задания и темы убраны с главного экрана: они живут
  // в подменю «Задать вопрос» (узлы lore / check_quest).
  const inQuestSubtopic = view.npcInteraction
    && view.npcInteraction.npcId === npcId
    && view.npcInteraction.node === "check_quest";
  if (npcId === "ivan" || inQuestSubtopic) {
    // У Ивана квесты не показываем до конца обучения, даже если noExtras не задан.
    const hideQuest = npcId === "ivan" && state.tutorialProgress < 2;
    if (!hideQuest && q) {
      if (q.status === "offered") questButton = `<button class="btn mnb-option-btn" data-act="npc-talk-quest" data-npc="${npcId}" type="button">Про задание</button>`;
      else if (q.status === "active") questButton = `<button class="btn mnb-option-btn" disabled type="button">Задание в работе</button>`;
      else if (q.status === "done") questButton = `<button class="btn mnb-option-btn" data-act="claim-npc-quest" data-id="${q.id}" type="button">Сдать задание</button>`;
    }
    if (npcId === "ivan") {
      topicsButton = DIALOG_BRANCHES[npcId] && DIALOG_BRANCHES[npcId].length
        ? `<button class="btn mnb-option-btn" data-act="npc-talk-topics" data-npc="${npcId}" type="button">Поболтать</button>`
        : "";
    }
  }
  // У остальных NPC «Поболтать» теперь только в главном меню диалога:
  // в узлах-подменю эта кнопка больше не дублируется.
  if (!topicsButton) {
    const tree = DIALOG_TREES[npcId];
    const atRoot = !view.npcInteraction || view.npcInteraction.node === tree?.start;
    if (atRoot && DIALOG_BRANCHES[npcId] && DIALOG_BRANCHES[npcId].length) {
      topicsButton = `<button class="btn mnb-option-btn" data-act="npc-talk-topics" data-npc="${npcId}" type="button">Поболтать</button>`;
    }
  }

  // Сдача сюжетного задания тоже идёт через диалог: отдельной панели «Сюжет» больше нет.
  let storyActionBtn = "";
  const storyEntry = activeStoryQuestForNpc(npcId);
  if (storyEntry) {
    const def = STORY_QUEST_MAP[storyEntry.id];
    if (def) {
      const { progress, target } = storyQuestProgress(storyEntry);
      storyActionBtn = progress >= target
        ? `<button class="btn mnb-option-btn" data-act="claim-story-quest" data-id="${storyEntry.id}" type="button">Сдать: ${esc(def.title)}</button>`
        : `<button class="btn mnb-option-btn" disabled type="button">В работе: ${esc(def.title)} (${progress}/${target})</button>`;
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
        ? ` · нужно отношение ${topic.minRep}`
        : ` · нужен этаж ${topic.minFloor}`);
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
  // При смене узла сбрасываем клавиатурный курсор на первый вариант.
  const dialogKey = `${npcId}:${node.topicsMenu ? "topics" : node.text}`;
  if (view._dialogKey !== dialogKey) {
    view._dialogKey = dialogKey;
    view.dialogSelectedIndex = 0;
  }
  const mood = state.npcMood?.[npcId];
  const moodLabel = mood === "good" ? "расположен" : mood === "bad" ? "недоволен" : "";
  const nodeText = node.tip === "timmy" ? (view.timmyTip || randomTimmyTip()) : node.text;
  const { questButton, topicsButton, storyActionBtn } = dialogActionParts(npcId);
  // Кнопки, которые не лежат в node.options, участвуют в общей сортировке:
  // задания — приоритет 3, «Поболтать» — 8.
  let actionExtras = [];
  if (!node.noExtras) {
    actionExtras = [
      ...(storyActionBtn ? [{ html: storyActionBtn, priority: 3 }] : []),
      ...(questButton ? [{ html: questButton, priority: 3 }] : []),
      ...(topicsButton ? [{ html: topicsButton, priority: 8 }] : []),
    ];
  }
  const bottomHtml = node.topicsMenu
    ? dialogTopicsHtml(npcId)
    : dialogOptionsHtml(npcId, node, actionExtras);

  // Универсальный диалог в духе Mount & Blade: слева портрет, справа
  // пергамент с репликой, снизу — вертикальный список вариантов.
  const scene = `
    <div class="mnb-dialog-wrapper" data-act="interaction-noop">
      <div class="mnb-dialog-top">
        <img class="mnb-portrait" src="${npcPortraitSrc(npcId)}" alt="${esc(npcName)}" onerror="this.outerHTML='<b style=font-size:72px></b>'">
        <div class="mnb-parchment">
          <div class="mnb-npc-name">${esc(npcName)}${moodLabel ? ` · ${moodLabel}` : ""}</div>
          <div class="mnb-text">«${esc(genderText(nodeText || ""))}»</div>
        </div>
        <img class="mnb-portrait mnb-hero-portrait" src="${portraitSrc(state.portrait)}" alt="${esc(state.name)}" onerror="this.outerHTML='<b style=font-size:72px></b>'">
      </div>
      <div class="mnb-dialog-bottom">
        ${bottomHtml}
      </div>
    </div>
  `;
  if (!modal) return scene;
  return `<div class="result-overlay mnb-dialog-overlay" data-act="npc-talk-backdrop" style="z-index: 184;">${scene}</div>`;
}
