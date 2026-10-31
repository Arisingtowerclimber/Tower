// Файл содержит интерфейс магазинов, инвентаря, куклы экипировки и крафта.

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
    ? `<button class="btn small primary" data-act="npc-talk" data-npc="${npcId}" type="button">Поговорить</button>`
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
    return `<section class="shop-group"><h2 class="group-title">Скупка</h2><p class="empty">Мне это не интересно.</p></section>`;
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
      <span class="price">${price}</span>
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
      <span class="price">${price}</span>
      <button class="btn small ghost" data-act="salvage" data-uid="${inst.uid}" ${RECIPES.some((r) => r.result === item.id) ? "" : "disabled"} title="Разобрать: вернуть половину материалов рецепта" type="button">Разобрать</button>
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
  if (empty) return `<section class="shop-group"><h2 class="group-title">Скупка</h2><p class="empty">Мне это не интересно.</p></section>`;

  const sellableIds = [...gearIds, ...potionIds];
  const allSelected = sellableIds.length > 0 && sellableIds.every((id) => sel.has(id));

  return `
    <section class="shop-group">
      <div class="sell-head">
        <h2 class="group-title">Скупка <span class="hint">— отмечайте всё лишнее, продажа одним кликом</span></h2>
        <button class="btn small ghost" data-act="sell-select-all" data-shop="${shopName}" type="button">${allSelected ? "Снять выбор" : "Выбрать всё"}</button>
      </div>
      <div class="sell-grid">
        ${gearRows ? `<h3 class="group-title">Снаряжение</h3>${gearRows}` : ""}
        ${potionRows ? `<h3 class="group-title">Зелья</h3>${potionRows}` : ""}
      </div>
      <div class="repair-all">
        <span class="price">Итого: ${total}</span>
        <button class="btn primary" data-act="sell-submit" data-shop="${shopName}" ${sel.size ? "" : "disabled"} type="button">Продать всё выбранное (${total})</button>
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
      <span>${nextText}</span><span>${companionWage(companionId)}/день</span>
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
    ? `<div class="companion-note">${iconHtml(companion.icon, 20)} <span><b>${companion.name}</b>: ${companionAffinityInfo(companion.id).rank.name}. Жалование ${companionWage(companion.id)}/день.</span></div>`
    : `<div class="companion-note">Компаньон остаётся с вами, пока вы платите жалование. Отношения растут в боях и событиях.</div>`;

  const tab = view.shopTab === "quests" ? "quests" : "buy";
  const content =
    tab === "quests"
      ? npcQuestHtml("stella")
      : `<h2 class="group-title">Спутницы</h2>${companionNote}<div class="companion-grid">${cards}</div>`;

  return `
    <div class="screen-bg" style="background-image: url('assets/backgrounds/hotel.webp');"><div class="bg-overlay"></div></div>
    ${subHeader("Гостиница", "Тёплый свет и чужие истории", "hub", "← В Йорстед")}
    ${npcDialogueBar("stella", "Спутницы", "", `<button class="btn primary" data-act="hotel-rest" type="button" ${canHotel ? "" : "disabled"}>Снять номер · ${HOTEL_PRICE}</button>`)}
    ${content}
  `;
}

function trainingHtml() {
  const tutorialProgress = Number(state.tutorialProgress) || 0;
  const boardLocked = tutorialProgress < 2;
  if (boardLocked && view.hallTab === "board") view.hallTab = "training";
  const hallTab = view.hallTab === "training" ? "training" : "board";
  const tabBtn = (tabId, label) => {
    const locked = boardLocked && tabId === "board";
    return `<button class="shop-tab npc-action-btn${hallTab === tabId ? " active" : ""}" data-act="hall-tab" data-tab="${tabId}" type="button"${locked ? ` disabled style="opacity: 0.5; cursor: not-allowed;" title="Доступно после курса новичка"` : ""}>${label}</button>`;
  };
  const hallTabs = `<div class="hall-tabs">${tabBtn("training", "Тренировки")}${tabBtn("board", "Задания")}</div>`;

  // Баннер «Иван отдыхает» — только ночью (phase 3). Утром/днём/вечером тренировки идут.
  const warning = state.phase === 3
    ? `<div class="banner warn-banner">Сейчас ночь. Иван уже спит — приходите утром.</div>`
    : (state.energy < TRAINING_ENERGY_COST ? `<div class="banner warn-banner">Не хватает энергии.</div>` : `<div class="banner">Тренировка занимает фазу: утро → день → вечер.</div>`);

  const tutorialCard = `<div class="training-card"><h3>Курс новичка</h3><p>Иван ждет, чтобы проверить вашу стойку и реакцию.</p><button class="btn primary" data-act="start-tutorial-qte" type="button">Начать тренировку</button></div>`;
  const tutorialLockBanner = `<div class="banner">Сначала поговорите с Иваном.</div>`;
  const trainingCards = tutorialProgress === 1
    ? tutorialCard
    : tutorialProgress === 0
      ? tutorialLockBanner
      : TRAININGS.map((t) => {
    const avail = trainingAvailability(t);
    const cap = Number(t.cap) || 10;
    const stat = t.stat || t.attr;
    const current = state.attrs[stat];
    const count = state.trainingCount?.[t.id] || 0;
    const attrName = ATTR_INFO.find((a) => a.id === stat).name;
    const pct = Math.max(0, Math.min(100, Math.round((count / cap) * 100)));
    const cost = `<span class="price">${TRAINING_ENERGY_COST} · ${TRAINING_PHASES} фаза · риск ${Math.round((t.risk || 0) * 100)}%</span>`;
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
  const tutorialBanner = tutorialProgress === 1
    ? `<div class="banner warn-banner">Пройдите курс новичка, чтобы открыть доступ к заданиям.</div>`
    : "";
  const trainingSection = hallTab === "training"
    ? `<section class="shop-group training-section">
        <h2 class="group-title">Тренировочный зал</h2>
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
          ${hallTab === "training" ? `${tutorialBanner}${warning}` : ""}
          ${boardSection}
          ${trainingSection}
        </div>
        ${hunterStatsHtml()}
      </div>
    </div>
    ${tutorialQteModalHtml()}
  `;
}

function huntBoardHtml() {
  ensureWeekQuests();
  // Доска и журнал — один и тот же state.weekQuests.list. На доске висят и
  // ресурсные заказы NPC (Рон, Элейн, Элиза): у них «Заказчик» — сам заказчик.
  const customer = (q) => {
    if (q.type === "kill") return { name: "Иван", icon: "" };
    if (q.type === "hunt") return { name: "Гильдия Охотников", icon: "" };
    const icons = { ron: "", elain: "", elize: "" };
    return { name: NPC_NAMES[q.npc] ? NPC_NAMES[q.npc].split(",")[0] : (q.npc || "—"), icon: icons[q.npc] || "" };
  };

  const cards = state.weekQuests.list
    .filter((q) => q.type === "kill" || q.type === "hunt" || q.type === "resource")
    .map((q) => {
      const isWeekly = q.type === "kill";
      const isResource = q.type === "resource";
      const who = customer(q);
      const title = isResource
        ? `Собрать: ${q.resName}`
        : isWeekly
          ? "Недельный заказ Ивана"
          : "Контракт на охоту";
      const goal = isResource
        ? `Сдать ${q.resName} × ${q.target}`
        : `Истребить ${q.target} × ${q.mobName || findMobName(q.mobId)} — ${huntFloorName(q.floorId)}`;
      const pct = Math.max(0, Math.min(100, Math.round((q.progress / q.target) * 100)));
      const subjectIcon = isResource ? (q.resIcon || "") : (q.mobIcon || findMobIcon(q.mobId));

      let button;
      if (q.status === "offered") button = `<button class="btn small primary" data-act="hunt-accept" data-id="${q.id}" type="button">Взять</button>`;
      else if (q.status === "active") button = `<button class="btn small" disabled type="button">В работе (${q.progress}/${q.target})</button>`;
      else if (q.status === "done") button = `<button class="btn small primary" data-act="hunt-claim" data-id="${q.id}" type="button">Сдать</button>`;
      else button = `<button class="btn small" disabled type="button">Сдано</button>`;

      const badge = isWeekly
        ? `<span class="badge board-badge weekly">Заказ недели</span>`
        : isResource
          ? `<span class="badge board-badge">Заказ NPC</span>`
          : `<span class="badge board-badge">Контракт</span>`;

      return `<article class="contract-card${isWeekly ? " weekly" : ""}${q.status === "claimed" ? " claimed" : q.status === "done" ? " done" : ""}">
      <div class="contract-pin" aria-hidden="true"></div>
      <div class="contract-head">
        <span class="contract-icon">${iconHtml(subjectIcon, 36)}</span>
        <div>
          <span class="contract-kicker">${isWeekly ? "От капитана" : isResource ? "Личный заказ" : "Доска Гильдии"}</span>
          <h3>${esc(title)}</h3>
        </div>
        ${badge}
      </div>
      <p class="contract-customer">${who.icon} Заказчик: <b>${esc(who.name)}</b></p>
      <p class="contract-goal">${esc(goal)}</p>
      <p class="item-desc">${esc(q.desc || "")}</p>
      <div class="contract-progress">
        <div class="bar"><span style="width:${pct}%"></span></div>
        <span class="quest-count">${q.progress} / ${q.target}</span>
      </div>
      <div class="contract-foot">
        <span class="price">${q.gold} · ✦ ${q.xp}</span>
        ${button}
      </div>
    </article>`;
    }).join("");

  const offeredCount = state.weekQuests.list.filter((q) => q.status === "offered").length;
  const doneCount = state.weekQuests.list.filter((q) => q.status === "done").length;

  return `
    <section class="shop-group hunt-board">
      <div class="hunt-board-head">
        <h2 class="group-title">Доска объявлений</h2>
        <span class="hint">Награда: золото, репутация Гильдии Охотников и сундуки</span>
        <div class="board-mass">
          <button class="btn primary" data-act="accept-all-quests" type="button" ${offeredCount ? "" : "disabled"}>Взять все доступные (${offeredCount})</button>
          <button class="btn primary" data-act="claim-all-quests" type="button" ${doneCount ? "" : "disabled"}>Сдать все готовые (${doneCount})</button>
        </div>
      </div>
      <div class="contract-grid">${cards}</div>
    </section>
  `;
}

function hunterStatsHtml() {
  const weapon = getEquippedItem("mainhand");
  const weaponName = weapon && weapon.item ? weapon.item.name : "Кулаки";
  const rows = [
    { icon: "", label: "Убито мобов", value: String(state.kills || 0) },
    { icon: "", label: "Повержено боссов", value: `${Object.keys(state.cleared).length} из 5` },
    { icon: "", label: "Любимое оружие", value: weaponName },
    { icon: "", label: "Выполнено контрактов", value: String(state.contractsDone || 0) },
  ];
  return `
    <section class="shop-group hall-stats">
      <h2 class="group-title">Мои свершения</h2>
      <div class="hall-stats-list">
        ${rows.map((r) => `<div class="hall-stat-row"><span class="hall-stat-icon">${r.icon}</span><span class="hall-stat-label">${r.label}</span><b class="hall-stat-value">${esc(r.value)}</b></div>`).join("")}
      </div>
    </section>
  `;
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
        <button class="btn small primary" data-act="npc-talk" data-npc="timmy" type="button">Поговорить</button>
      </div>
    </aside>
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
          <span class="price" style="font-size: 13px; white-space: nowrap;">${q.gold} · ✦ ${q.xp}${q.potions > 0 ? ` · +${q.potions}` : ""}</span>
          ${statusBadge}
          ${button}
        </div>

      </article>
    </section>
  `;
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
            <h3 style="margin:0;">${esc(completed[0].title)}</h3>
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
            <h3 style="margin:0;">${esc(def.title)}</h3>
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
          <h3 style="margin:0;">${esc(qdef.title)}</h3>
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

      let label = `Купить · ${p.price}`;
      if (!canBuy) label = `Нужно ${p.price}`;

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

  // Премиум-сток Рона: генерируется один раз при входе в магазин (и при смене
  // этажа), чтобы товары не «прыгали» после каждой покупки или перерисовки.
  let premiumHtml = "";
  if (shopName === "forge") {
    if (!view.premiumStock || view.premiumStock.floor !== state.maxFloor) {
      view.premiumStock = { floor: state.maxFloor, items: generatePremiumStock(state.maxFloor) };
    }
    const stock = view.premiumStock.items || [];
    const premiumRows = stock.map(({ item, rarity, price }) => {
      const tier = RARITY_TIERS[rarity] || RARITY_TIERS.common;
      const canBuy = state.gold >= price;
      return `<article class="gear-row rarity-${rarity}">
        <div class="gear-row-icon">${iconHtml(item.icon, 34)}</div>
        <div class="gear-row-main">
          <h3>${item.name} <span class="chip" style="border-color:${tier.color};color:${tier.color};">${tier.name}</span></h3>
          <p class="item-desc">${item.desc}</p>
          <div class="chips">${statsChips(item)}</div>
        </div>
        <div class="gear-row-side">
          <button class="btn small primary" data-act="buy-premium" data-id="${item.id}" data-price="${price}" data-rarity="${rarity}" ${canBuy ? "" : "disabled"} type="button">Купить за ${price} 💰</button>
        </div>
      </article>`;
    }).join("");
    premiumHtml = `<section class="shop-group">
      <h2 class="group-title">Случайный товар (Оверпрайс)</h2>
      <p class="hint">Рон придерживает для вас пару особенных вещей — редкость случайна, цена втрое выше обычной.</p>
      <div class="gear-rows">${premiumRows}</div>
    </section>`;
  }

  return panel + premiumHtml + (sections || `<section class="shop-group"><p class="empty">Под этот фильтр товаров нет.</p></section>`);
}

function materialChipHtml(resId, need) {
  const res = ALL_RESOURCES.find((r) => r.id === resId);
  const have = state.resources[resId] || 0;
  const enough = have >= need;
  return `<span class="chip material${enough ? " ok" : " lack"}">${iconHtml(res ? res.icon : "", 16)} ${res ? res.name : resId} ${have}/${need}</span>`;
}

function upgradePanelHtml() {
  if (view.screen === "alchemy") {
    // Улучшение зелий (Этап 9): доступ открывается на тире «Уважаемый»
    // фракции алхимиков, сам механизм пока в разработке.
    const faction = FACTION_MAP["alchemists"];
    const rep = state.reputation ? (state.reputation["alchemists"] || 0) : 0;
    const unlocked = rep >= FACTION_TIERS[2].min;
    return `<section class="shop-group"><h2 class="group-title">Улучшение зелий</h2>${
      unlocked
        ? `<p class="settings-stub">В разработке. Скоро здесь можно будет улучшать зелья</p>`
        : `<p class="settings-stub">Требуется репутация «Уважаемый» (${FACTION_TIERS[2].min} заказов) у ${faction ? faction.name : "Цеха алхимиков"}. Сейчас: ${rep}</p>`
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
        : `<div class="chips recipe-materials">${materialChipHtmlEx(path.materials[step])}<span class="chip${state.gold >= goldCost ? " ok" : " lack"}">${goldCost}</span></div>`;
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
      <h2 class="group-title">${path.icon} ${path.name}${unlocked ? "" : ` <span class="hint">${FACTION_MAP[factionId]?.npc ? NPC_NAMES[FACTION_MAP[factionId].npc] : faction.name}: нужен уровень «${NPC_AFFINITY_TIERS[2].name}» (${NPC_AFFINITY_TIERS[2].min} отношения)</span>`}</h2>
      <p class="hint">За каждый уровень улучшения: ${path.id === "weapon" ? "Атака +5" : path.id === "armor" ? "Защита +2" : "Крит +2 или Уворот +1 (на выбор)"}. Материалы — из походов на нижние этажи Башни.</p>
      <div class="item-grid">${cards || `<p class="empty">Подходящих предметов нет.</p>`}</div>
    </section>`;
  }).join("");

  return pathBlocks;
}

function materialChipHtmlEx(materials) {
  return Object.entries(materials).map(([resId, need]) => materialChipHtml(resId, need)).join("");
}

function craftPanelHtml(station) {
  const known = new Set(Array.isArray(state.knownRecipes) ? state.knownRecipes : []);
  const recipes = getRecipes(station).filter((recipe) => known.has(recipe.id));

  if (!recipes.length) {
    return `<section class="shop-group"><h2 class="group-title">Крафт</h2><p class="empty">Вы ещё не нашли ни одного рецепта. Побеждайте мобов и боссов Башни — с них выпадают чертежи.</p></section>`;
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
        <div class="item-icon">${iconHtml(item ? item.icon : "", 48)}</div>
        <div class="gear-card-info">
          <h3>${recipe.desc}</h3>
          <p class="item-desc">${item ? item.desc : ""}</p>
          <div class="chips">${item ? statsChips(item) : ""}${countChip}${durChips}</div>
          <div class="chips recipe-materials">${chips}</div>
        </div>
      </div>
      <div class="gear-card-foot">
        <span class="price">Рецепт</span>
        <button class="btn small${enough ? " primary" : ""}" data-act="craft" data-id="${recipe.id}" ${enough ? "" : "disabled"} type="button">Создать</button>
      </div>
    </article>`;
  }).join("");

  return `<section class="shop-group"><h2 class="group-title">Крафт</h2><p class="hint">Крафт не требует золота — только материалы из походов. Каждый крафт создаёт новый экземпляр предмета со своей прочностью.</p><div class="item-grid">${cards}</div></section>`;
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
          <button class="btn small" data-act="buy-item" data-id="${item.id}" data-shop="alchemy" ${state.gold < p.price ? "disabled" : ""} type="button">Купить · ${p.price}</button>
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
  const actions = readOnly ? "" : `<div class="doll-actions"><button class="btn small primary" data-act="talents-open" type="button">Таланты</button><button class="btn small ghost" data-act="abilities-open" type="button">Умения</button><button class="btn small ghost" data-act="title-open" type="button">Сменить титул</button><button class="btn small ghost" data-act="achievements-open" type="button">Достижения</button></div>`;
  return `<div class="paper-doll"><div class="doll-col doll-left">${left}</div><div class="doll-center"><div class="doll-figure"><img src="${portraitSrc(state.portrait)}" alt=""></div><div class="doll-name"><b>${esc(state.name)}</b>${state.currentTitle ? `<span class="hero-title">${esc(state.currentTitle)}</span>` : ""}<span>УР ${state.level} · надето ${count} / ${SLOTS.length}</span>${actions}</div></div><div class="doll-col doll-right">${right}</div></div>`;
}

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
  return `<div class="doll-menu-backdrop" data-act="inv-menu-close"></div><div class="doll-menu" role="dialog"><div class="doll-menu-head"><h3>Предмет</h3><button class="doll-menu-close" data-act="inv-menu-close" type="button">✕</button></div><div class="inv-menu-preview">${iconHtml(item.icon, 40)}<span class="inv-menu-info"><b>${getItemDisplayName(inst)}</b><span class="chips"><span class="chip" style="border-color:${tier.color};color:${tier.color};">${tier.name}</span>${statsChips(item, inst)}</span><span class="hint">${item.desc}</span></span></div>${slotNote}<div class="inv-menu-actions"><button class="btn small" data-act="inv-equip" data-uid="${inst.uid}" ${canEquip ? "" : "disabled"} type="button">Надеть</button><button class="btn small ghost" data-act="inv-salvage" data-uid="${inst.uid}" ${salvageable ? "" : "disabled"} title="${salvageable ? "Разобрать: вернуть половину материалов рецепта" : "Нет рецепта — разобрать нельзя"}" type="button">Разобрать</button></div></div>`;
}

function exchangePanelHtml() {
  const tRes = ALL_RESOURCES.find((r) => r.id === EXCHANGE_TARGET_RES);
  const rows = (FLOOR_RESOURCES[1] || []).map((res) => {
    const have = state.resources[res.id] || 0;
    const ok = have >= EXCHANGE_AMOUNT;
    return `<div class="resource-row"><span>${iconHtml(res.icon, 24)} <b>${res.name}</b> <span class="chip">×${have}</span></span>
      <button class="btn small primary" data-act="exchange-res" data-id="${res.id}" ${ok ? "" : "disabled"} type="button">Обменять ${EXCHANGE_AMOUNT} → 1 ${tRes ? tRes.name : EXCHANGE_TARGET_RES}</button></div>`;
  }).join("");
  return `<section class="shop-group">
    <h2 class="group-title">Обмен</h2>
    <p class="hint">Хлам с первого этажа годится только в переплавку: ${EXCHANGE_AMOUNT} единиц любого ресурса — и Рон отдаст ${tRes ? tRes.name.toLowerCase() : "редкий ресурс"} ×1.</p>
    <div class="resource-list">${rows}</div>
  </section>`;
}

function buybackPanelHtml(shop) {
  if (shop === "alchemy") {
    const potionItems = Object.values(ITEMS).filter((i) => i.type === "potion" && (state.potions[i.id] || 0) > 0);
    const instanced = state.owned.filter((inst) => !isEquipped(inst.uid) && ITEMS[inst.id]?.slot === "potion");

    const potionRows = potionItems.map((item) =>
      `<div class="resource-row"><span>${iconHtml(item.icon, 24)} <b>${item.name}</b> <span class="chip">×${state.potions[item.id]}</span></span><button class="btn small ghost" data-act="sell-potion" data-id="${item.id}" type="button">Продать 1 (+${sellPrice(item)})</button></div>`
    );

    const instancedRows = instanced.map((inst) => {
      const item = ITEMS[inst.id];
      return `<div class="resource-row${rarityClass(inst)}"><span>${iconHtml(item.icon, 24)} <b>${getItemDisplayName(inst)}</b> ${durabilityChip(inst)}</span><button class="btn small ghost" data-act="sell" data-uid="${inst.uid}" type="button">Продать (+${sellPrice(item, inst)})</button></div>`;
    });

    const rows = [...potionRows, ...instancedRows];

    return `<section class="shop-group"><h2 class="group-title">Скупка зелий</h2>${rows.length ? `<div class="resource-list">${rows.join("")}</div>` : `<p class="empty">Нечего продавать.</p>`}</section>`;
  }

  const slots = shop === "jewelry" ? ["neck", "ring", "trinket"] : ["mainhand", "offhand", "head", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet"];
  const rows = state.owned
    .filter((inst) => !isEquipped(inst.uid) && slots.includes(ITEMS[inst.id]?.slot))
    .map((inst) => {
      const item = ITEMS[inst.id];
      return `<div class="resource-row${rarityClass(inst)}"><span>${iconHtml(item.icon, 24)} <b>${getItemDisplayName(inst)}</b> ${durabilityChip(inst)}</span><button class="btn small ghost" data-act="sell" data-uid="${inst.uid}" type="button">Продать (+${sellPrice(item, inst)})</button></div>`;
    });

  return `<section class="shop-group"><h2 class="group-title">Скупка снаряжения</h2>${rows.length ? `<div class="resource-list">${rows.join("")}</div>` : `<p class="empty">Нечего продавать.</p>`}</section>`;
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
    <div class="banner" style="margin-bottom: 12px;">Свободных очков таланта: <b>${points}</b> · +1 каждые 3 уровня</div>
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
      ? `<span class="price" style="color: var(--gold);">Получено</span>`
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
    <div class="banner" style="margin-bottom: 12px;">Открыто достижений: <b>${unlockedIds.length} / ${ACHIEVEMENTS.length}</b> · бонусы добавляются к статам героя</div>
    <div class="quest-grid" style="grid-template-columns: 1fr; gap: 10px;">${cards}</div>
  `;
}

function chestsInventoryHtml() {
  normalizeChests();
  const types = ["common", "elite", "abyss"];
  const owned = types.filter((type) => (state.chests[type] || 0) > 0);
  if (!owned.length) return `<p class="empty">В сумке нет сундуков. Они падают с мобов, элит и боссов.</p>`;
  const slots = owned.map((type) => {
    const def = CHEST_TYPES[type];
    const have = state.chests[type] || 0;
    return `<div class="inv-cell"><button class="inv-slot chest-slot" data-act="chest-slot-click" data-type="${type}" type="button" style="position: relative;">${iconHtml(def.icon, 40)}<span style="position: absolute; right: 6px; bottom: 6px; font-weight: 700;">×${have}</span></button></div>`;
  }).join("");
  return `<div class="inventory-grid chest-grid">${slots}</div><p class="hint">Кликните по сундуку, чтобы открыть один, десять или все сразу.</p>`;
}

function chestMenuHtml() {
  if (!view.chestMenu) return "";
  const type = view.chestMenu;
  const def = CHEST_TYPES[type];
  if (!def) return "";
  normalizeChests();
  const have = state.chests[type] || 0;
  const pityLeft = Math.max(0, CHEST_PITY_LIMIT - (state.chestPity || 0));
  const pityText = have || state.chestPity > 0
    ? (pityLeft === 0 ? "Гарантия редкой добычи!" : `До гарантии редкого: ${pityLeft}`)
    : "Открывайте сундуки, чтобы получить снаряжение.";
  return `<div class="doll-menu-backdrop" data-act="chest-menu-close"></div><div class="doll-menu" role="dialog"><div class="doll-menu-head"><h3>${def.name}</h3><button class="doll-menu-close" data-act="chest-menu-close" type="button">✕</button></div><div class="inv-menu-preview">${iconHtml(def.icon, 40)}<span class="inv-menu-info"><b>${def.name}</b><span class="chips"><span class="chip">В наличии: ${have}</span></span><span class="hint">${pityText}</span></span></div><div class="inv-menu-actions"><button class="btn small primary" data-act="chest-open" data-type="${type}" data-amount="1" ${have >= 1 ? "" : "disabled"} type="button">Открыть (1)</button><button class="btn small" data-act="chest-open" data-type="${type}" data-amount="10" ${have >= 1 ? "" : "disabled"} type="button">Открыть ×10</button><button class="btn small" data-act="chest-open" data-type="${type}" data-amount="all" ${have >= 1 ? "" : "disabled"} type="button">Открыть всё (${have})</button></div></div>`;
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
  if (view.inventoryTab === "chests") return chestsInventoryHtml();
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
      <button class="btn small primary" data-act="inv-sell-selected" type="button" ${sellable.length ? "" : "disabled"}>Продать выбранное (${sellTotal})</button>
    </div>`;
    return `${filters}<div class="inventory-grid">${slots}</div>${bulkBar}<div class="inv-count">Показано: ${filtered.length} из ${bag.length}</div><p class="hint">Кликните по предмету в сумке, чтобы надеть его. Продать снаряжение можно у торговцев: Рон — оружие и броня, Элиза — украшения, Элейн — зелья.</p>`;
  }

  if (view.inventoryTab === "resources") {
    const rows = ALL_RESOURCES.map((res) => {
      const amount = state.resources[res.id] || 0;
      if (amount <= 0) return "";
      return `<div class="resource-row"><span>${iconHtml(res.icon, 24)} ${res.name} ×${amount}</span><button class="btn small ghost" data-act="sell-resource" data-id="${res.id}" type="button">Продать всё (${amount * res.sellPrice})</button></div>`;
    }).join("");
    return `<div class="resource-list">${rows || `<p class="empty">Пусто. Ищите припасы в Башне.</p>`}</div>`;
  }

  if (view.inventoryTab === "recipes") {
    const known = new Set(Array.isArray(state.knownRecipes) ? state.knownRecipes : []);
    const recipes = RECIPES.filter((recipe) => known.has(recipe.id));
    if (!recipes.length) return `<p class="empty">Рецепты ещё не найдены. Чертежи выпадают с мобов и боссов Башни.</p>`;
    return `<div class="known-recipes">${recipes.map((recipe) => `<div class="recipe-note"><span class="recipe-note-name"><b>${recipe.desc}</b></span><span class="hint">${recipe.station === "forge" ? "Кузница" : "Ювелирная лавка"} · этаж ${recipe.floor}</span></div>`).join("")}</div>`;
  }

  return `<p class="hint">Снаряжение отображается на портрете. Кликните по слоту, чтобы сменить предмет.</p>`;
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
    ? `<div class="ability-badges"><span class="badge">Освоено: ${learnedAbilities.join(", ")}</span></div>`
    : "";
  const DEBUFF_ICONS = { injury: "", slept_rough: "" };
  const heroDebuffs = (state.tempDebuffs || []).map((d) =>
    `<span class="debuff-pill" title="${esc(d.desc || d.name)}">${d.icon || DEBUFF_ICONS[d.id] || ""} ${esc(d.name)} · ${d.days} дн.</span>`
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
        ${weaponSlotsHtml()}
        ${heroDebuffsHtml}
        ${archetype ? `<div class="archetype-note">${iconHtml(archetype.icon, 20)} <span><b>${archetype.name}</b>: ${archetype.desc}</span></div>` : ""}
        ${companion ? `<div class="companion-note">${iconHtml(companion.icon, 20)} <span><b>${companion.name}</b>: ${companionAffinityInfo(companion.id).rank.name}. Жалование ${companionWage(companion.id)}/день.</span></div>${affinityBarHtml(companion.id)}` : ""}
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
            <button class="shop-tab${view.inventoryTab === "chests" ? " active" : ""}" data-act="inventory-tab" data-tab="chests" type="button">Сундуки</button>
          </div>

          <div class="inventory-body">${heroInventoryHtml()}</div>
        </div>
      </section>
    </div>
    <div class="danger-zone"><button class="btn tiny danger" data-act="reset" type="button">Сбросить прогресс</button><button class="btn tiny danger" data-act="dev-cheat" type="button" style="opacity: 0.5; margin-left: 10px;">Dev: Макс. Уровень</button></div>
  `;
}

function weaponSlotsHtml() {
  const slots = Array.isArray(state.weaponSlots) ? state.weaponSlots : [null, null, null];
  const cards = [0, 1, 2].map((i) => {
    const inst = slots[i] ? getInstance(slots[i]) : null;
    const item = inst ? ITEMS[inst.id] : null;
    const inner = inst && item
      ? `<span style="display:flex; align-items:center; gap:6px; min-width:0;">${iconHtml(item.icon, 24)}<span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(getItemDisplayName(inst))}</span></span>`
      : `<span class="hint">Пусто · назначить</span>`;
    return `<button data-act="weapon-slot-open" data-slot="${i}" type="button" title="Назначить оружие в слот ${i + 1}" style="display:flex; align-items:center; gap:8px; min-width:0; width:100%; text-align:left; padding:9px 10px; border:1px solid var(--line); border-radius:10px; background:rgba(0,0,0,0.22); color:var(--text); cursor:pointer;">
      <b style="color:var(--gold2); font-size:16px; flex:0 0 auto;">${i + 1}</b>
      ${inner}
    </button>`;
  }).join("");
  return `<div style="margin-top: 16px;">
    <h2 class="group-title" style="font-size: 16px;">Боевые слоты (1, 2, 3)</h2>
    <p class="hint" style="margin: 4px 0 8px;">В фазе атаки клавиши 1/2/3 мгновенно меняют оружие. Смена оружия пропускает ваш удар — враг бьёт в ответ.</p>
    <div style="display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;">${cards}</div>
  </div>`;
}

function weaponSlotPickerHtml() {
  const idx = view.weaponSlotPicker;
  if (idx === null || idx === undefined) return "";
  const currentUid = Array.isArray(state.weaponSlots) ? state.weaponSlots[idx] : null;
  const weapons = state.owned.filter((inst) => ITEMS[inst.id] && ITEMS[inst.id].slot === "mainhand");
  const rows = weapons.map((inst) => {
    const item = ITEMS[inst.id];
    const inSlot = currentUid === inst.uid;
    const inHand = state.equipped.mainhand === inst.uid;
    return `<button class="doll-item${inSlot ? " equipped" : ""}" data-act="weapon-slot-assign" data-slot="${idx}" data-uid="${inst.uid}" type="button">
      <span class="item-icon">${iconHtml(item.icon, 32)}</span>
      <span class="doll-item-body">
        <span class="doll-item-name">${getItemDisplayName(inst)}</span>
        <span class="chips">${statsChips(item, inst)}</span>
        ${inSlot ? `<span class="doll-item-status">✓ В слоте</span>` : inHand ? `<span class="doll-item-status">В руке</span>` : ""}
      </span>
    </button>`;
  }).join("");
  return `
    <div class="doll-menu-backdrop" data-act="weapon-slot-close"></div>
    <div class="doll-menu" role="dialog">
      <div class="doll-menu-head">
        <h3>Боевой слот ${idx + 1}</h3>
        <button class="doll-menu-close" data-act="weapon-slot-close" type="button">✕</button>
      </div>
      <p class="hint" style="margin-bottom: 10px;">Выберите оружие из сумки. В бою оно будет доступно по клавише ${idx + 1}.</p>
      <div class="doll-menu-list">${rows || `<p class="empty">В сумке нет оружия для основной руки.</p>`}</div>
      ${currentUid ? `<div class="doll-menu-foot"><button class="btn small ghost" data-act="weapon-slot-clear" data-slot="${idx}" type="button">Очистить слот</button></div>` : ""}
    </div>`;
}

function talentsModalHtml() {
  return `
    <div class="settings-backdrop" data-act="talents-close"></div>
    <div class="settings-modal talents-modal" role="dialog" aria-label="Таланты">
      <div class="settings-head">
        <h3>Таланты</h3>
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
          <h2 style="color: var(--gold2); font-size: 20px; margin: 0;">Достижения</h2>
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
      icon: "",
      name: "Парирование",
      desc: "При уклонении есть шанс парировать удар и открыть окно для контратаки.",
    });
  }
  if (state.abilities?.preciseStrike) {
    learned.push({
      icon: "",
      name: "Точный удар",
      desc: "Критический удар превращается в QTE: остановите указатель в зелёной зоне, чтобы добить врага.",
    });
  }
  // Изученные активные навыки: показываем их боевые комбинации отдельной плашкой.
  const activeTalents = TALENTS.filter((t) => t.active && ((state.talents || {})[t.id] || 0) > 0);
  for (const t of activeTalents) {
    const wordsHtml = `<span style="color: var(--gold2);">${esc(skillWordForTalent(t))}</span>`;
    learned.push({
      icon: t.skill.icon || "",
      name: t.skill.name,
      desc: t.desc,
      comboHtml: wordsHtml,
    });
  }
  const totalAbilities = 2 + TALENTS.filter((t) => t.active).length;
  const body = learned.length
    ? `<div class="abilities-grid">${learned.map((a) => `
        <article class="ability-card">
          <span class="ability-card-icon">${a.icon}</span>
          <div class="ability-card-body">
            <b class="ability-card-name">${a.name}</b>
            <div class="ability-card-desc">${a.desc}</div>
            ${a.comboHtml ? `<div class="ability-combo-box">Печать: ${a.comboHtml}</div>` : ""}
          </div>
        </article>`).join("")}</div>`
    : `<p class="empty ability-empty">Вы ещё не освоили ни одного умения. Тренируйтесь у Ивана.</p>`;

  return `
    <div class="result-overlay" data-act="abilities-close" style="z-index: 186;">
      <div class="result-card abilities-modal">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom: 14px;">
          <h2 style="color: var(--gold2); font-size: 20px; margin: 0;">Умения</h2>
          <button class="btn tiny ghost" data-act="abilities-close" type="button">✕</button>
        </div>
        <div class="abilities-modal-body">
          <div class="banner" style="margin-bottom: 10px;">Освоено умений: <b>${learned.length} / ${totalAbilities}</b></div>
          ${body}
        </div>
        <button class="btn ghost" data-act="abilities-close" type="button" style="width:100%; margin-top:12px;">Закрыть</button>
      </div>
    </div>
  `;
}

function tutorialQteWordHtml(qte) {
  return String(qte.word || "").split("").map((char, i) => {
    const cls = i < qte.typed.length ? "typed" : "rest";
    return `<span class="${cls}">${esc(char)}</span>`;
  }).join("");
}

function tutorialQteModalHtml() {
  if (!view.tutorialQte) return "";
  const qte = view.tutorialQte;
  const words = Array.isArray(qte.words) && qte.words.length ? qte.words : [qte.word];
  const index = Math.max(0, Math.min(words.length - 1, Number(qte.wordIndex) || 0));
  const steps = words.map((_, i) =>
    `<span class="tutorial-qte-step${i < index ? " done" : ""}${i === index ? " active" : ""}"></span>`
  ).join("");

  return `
    <div class="result-overlay tutorial-qte-overlay" style="z-index: 200;">
      <div class="result-card tutorial-qte-card" style="max-width: 420px; text-align: center;">
        <h2 style="color: var(--gold2);">Курс новичка</h2>
        <p style="margin-bottom: 14px;">Иван: «Покажи, что умеешь. Напечатай три слова подряд!»</p>
        <div class="tutorial-qte-steps" data-role="tutorial-qte-steps">${steps}</div>
        <div class="tutorial-qte-counter" data-role="tutorial-qte-counter">Слово ${index + 1} из ${words.length}</div>
        <div class="duel-word tutorial-qte-word" data-role="tutorial-qte-word">${tutorialQteWordHtml(qte)}</div>
        <div class="duel-slot-timer tutorial-qte-timer" data-role="tutorial-qte-timer"><span class="duel-slot-fill" data-role="tutorial-qte-timer-fill" style="width: ${Math.max(0, Math.min(100, (qte.timeLeft / 10.0) * 100))}%;"></span></div>
      </div>
    </div>
  `;
}

// Точечное обновление без render(): буквы и смена слова не пересоздают
// модалку и не вызывают мигание экрана. При смене слова — мягкая анимация.
function updateTutorialQteDisplay(animateWord = false) {
  const qte = view.tutorialQte;
  if (!qte) return;
  const wordEl = document.querySelector('[data-role="tutorial-qte-word"]');
  if (wordEl) {
    wordEl.innerHTML = tutorialQteWordHtml(qte);
    if (animateWord) {
      wordEl.classList.remove("word-pop");
      void wordEl.offsetWidth;
      wordEl.classList.add("word-pop");
    }
  }
  const words = Array.isArray(qte.words) && qte.words.length ? qte.words : [qte.word];
  const index = Math.max(0, Math.min(words.length - 1, Number(qte.wordIndex) || 0));
  document.querySelectorAll('[data-role="tutorial-qte-steps"] .tutorial-qte-step').forEach((el, i) => {
    el.classList.toggle("done", i < index);
    el.classList.toggle("active", i === index);
  });
  const counter = document.querySelector('[data-role="tutorial-qte-counter"]');
  if (counter) counter.textContent = `Слово ${index + 1} из ${words.length}`;
  const timerFill = document.querySelector('[data-role="tutorial-qte-timer-fill"]');
  if (timerFill) timerFill.style.width = `${Math.max(0, Math.min(100, ((Number(qte.timeLeft) || 0) / 10.0) * 100))}%`;
}

// ── Пошаговое открытие сундука в стиле FIFA Ultimate Team ───────────────────
// Одна карточка: рубашка -> редкость -> категория -> тип -> полный предмет.
const FIFA_WEAPON_TYPES = { sword: "МЕЧ", axe: "ТОПОР", mace: "БУЛАВА", spear: "КОПЬЁ", claw: "КОГТИ" };
const FIFA_ARMOR_SLOTS = { head: "ШЛЕМ", shoulder: "НАПЛЕЧНИКИ", back: "ПЛАЩ", chest: "КИРАСА", wrist: "НАРУЧИ", hands: "ПЕРЧАТКИ", waist: "ПОЯС", legs: "ПОНОЖИ", feet: "САПОГИ" };
const FIFA_ACCESSORY_SLOTS = { neck: "ОЖЕРЕЛЬЕ", ring: "КОЛЬЦО", trinket: "АКСЕССУАР" };

function fifaItemCategoryName(item) {
  if (!item) return "ПРЕДМЕТ";
  if (item.kind === "resource") return "РЕСУРС";
  if (item.kind === "chest") return "СУНДУК";
  if (item.kind === "empty") return "ПУСТО";
  const def = item.id ? ITEMS[item.id] : null;
  if (!def) return "ПРЕДМЕТ";
  if (def.slot === "mainhand" || def.slot === "offhand") return "ОРУЖИЕ";
  if (["head", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet"].includes(def.slot)) return "БРОНЯ";
  if (["neck", "ring", "trinket"].includes(def.slot)) return "АКСЕССУАР";
  if (def.slot === "potion") return "ЗЕЛЬЕ";
  return "ПРЕДМЕТ";
}

function fifaItemTypeName(item) {
  if (!item) return "ПРЕДМЕТ";
  if (item.kind === "resource") return "РЕСУРС";
  if (item.kind === "chest") return "СУНДУК";
  if (item.kind === "empty") return "ПУСТО";
  const def = item.id ? ITEMS[item.id] : null;
  if (!def) return "ПРЕДМЕТ";
  if (def.slot === "mainhand" || def.slot === "offhand") {
    if (def.weaponType) return FIFA_WEAPON_TYPES[def.weaponType] || "ОРУЖИЕ";
    return def.slot === "offhand" ? "ЩИТ" : "ОРУЖИЕ";
  }
  if (FIFA_ARMOR_SLOTS[def.slot]) return FIFA_ARMOR_SLOTS[def.slot];
  if (FIFA_ACCESSORY_SLOTS[def.slot]) return FIFA_ACCESSORY_SLOTS[def.slot];
  if (def.slot === "potion") return "ЗЕЛЬЕ";
  return "ПРЕДМЕТ";
}

function renderFifaChestModal() {
  const reveal = view.chestReveal;
  if (!reveal) return "";
  return `<div class="fifa-card-overlay" role="dialog" aria-modal="true" aria-label="Открытие сундука">
    <div class="fifa-card-container">${renderFifaCardContent()}</div>
  </div>`;
}

// HTML только самой карточки — его можно точечно перерисовать без render().
function renderFifaCardContent() {
  const reveal = view.chestReveal;
  if (!reveal) return "";
  const item = reveal.item || {};
  const maxSteps = Math.max(1, Number(reveal.maxSteps) || 4);
  const step = Math.max(0, Math.min(maxSteps, Number(reveal.step) || 0));
  // До переворота карточка закрыта и всегда тёмная — редкость не выдаём раньше времени.
  const rarity = step === 0 ? "common" : (RARITY_TIERS[item.rarity] ? item.rarity : "common");
  const tier = RARITY_TIERS[rarity] || RARITY_TIERS.common;

  let body = "";

  if (step === 0) {
    body = `<div class="fifa-card-back">
      <span class="fifa-card-back-mark">?</span>
      <span class="fifa-card-back-caption">Сундук</span>
    </div>`;
  } else if (step === 1) {
    body = `<div class="fifa-card-reveal">
      <span class="fifa-card-rarity" style="color:${tier.color}; font-size: clamp(28px, 8vw, 44px);">${esc(tier.name)}</span>
    </div>`;
  } else if (step === 2) {
    body = `<div class="fifa-card-reveal">
      <span class="fifa-card-rarity" style="color:${tier.color}; font-size: clamp(28px, 8vw, 44px);">${esc(fifaItemCategoryName(item))}</span>
    </div>`;
  } else if (step === 3) {
    body = `<div class="fifa-card-reveal">
      <span class="fifa-card-rarity" style="color:${tier.color}; font-size: clamp(28px, 8vw, 44px);">${esc(fifaItemTypeName(item))}</span>
    </div>`;
  } else {
    const inst = item.uid ? getInstance(item.uid) : null;
    const def = item.id ? ITEMS[item.id] : null;
    const stats = def
      ? statsChips(def, inst)
      : `<span class="chip dim">×${item.amount || 1}</span>`;
    const bonuses = (inst?.affix?.bonuses || [])
      .filter((b) => ATTR_LABEL[b.id])
      .map((b) => `${ATTR_LABEL[b.id]} +${b.value}`)
      .join(", ");
    const affix = inst?.affix?.name
      ? `<div class="fifa-card-affix">Аффикс: ${esc(inst.affix.name)}${bonuses ? ` (${esc(bonuses)})` : ""}</div>`
      : "";
    const eff = inst?.unique ? UNIQUE_EFFECTS.find((u) => u.id === inst.unique) : null;
    const uniqueLine = eff ? `<div class="fifa-card-affix">${esc(eff.name)}: ${esc(eff.desc)}</div>` : "";
    body = `<div class="fifa-card-item">
      <div class="fifa-card-icon">${iconHtml(item.icon, 120)}</div>
      <h2>${esc(item.name || "Добыча")}</h2>
      <span class="fifa-card-type">${esc(fifaItemTypeName(item))}</span>
      <div class="fifa-card-stats">${stats}</div>
      ${affix}
      ${uniqueLine}
    </div>`;
  }

  const hint = step >= maxSteps ? "Нажмите, чтобы забрать" : "Нажмите, чтобы продолжить";

  return `<div class="fifa-card rarity-${rarity}${step === 0 ? " fifa-card-closed" : ""}" data-act="chest-card-click" style="cursor: pointer;">
    ${body}
    <span class="card-hint">${hint}</span>
  </div>`;
}

// Одна карточка массового открытия: рубашка или открытый предмет.
function renderMassChestCard(entry, index) {
  const revealed = Array.isArray(view.chestMassRevealed) && view.chestMassRevealed[index] === true;
  const inst = entry?.uid ? getInstance(entry.uid) : null;
  const rarity = inst?.rarity && RARITY_TIERS[inst.rarity] ? inst.rarity : "common";
  const tier = RARITY_TIERS[rarity] || RARITY_TIERS.common;
  const rarityCls = rarity !== "common" ? ` rarity-${rarity}` : "";

  if (!revealed) {
    return `<article class="mass-card-wrapper${rarityCls}" data-index="${index}" data-act="mass-card-flip" style="cursor: pointer;">
      <div class="mass-card-back">?</div>
    </article>`;
  }

  const def = entry?.id ? ITEMS[entry.id] : null;
  const amount = Number(entry?.amount) > 1 ? `<span class="amount">×${Number(entry.amount)}</span>` : "";
  const stats = def ? statsChips(def, inst) : "";
  return `<article class="mass-card-wrapper mass-card-opened${rarityCls}" data-index="${index}">
    <div class="mass-loot-card">
      ${iconHtml(entry?.icon || "", 48)}
      <span class="name" style="color:${tier.color}">${esc(entry?.name || "Предмет")}</span>
      <div class="mass-card-stats">${stats}</div>
      ${amount}
    </div>
  </article>`;
}

// HTML сетки массового открытия — используется и при полном рендере, и точечно.
function renderMassChestGrid() {
  const items = Array.isArray(view.chestMassResults) ? view.chestMassResults : [];
  return items.map((entry, index) => renderMassChestCard(entry, index)).join("") || `<p class="empty">Пусто</p>`;
}

// Массовое открытие: сетка закрытых карточек с подсветкой редкости.
function renderMassChestModal() {
  const items = Array.isArray(view.chestMassResults) ? view.chestMassResults : null;
  if (!items) return "";
  const opened = Math.max(0, Number(view.chestMassOpened) || 0);
  const revealed = Array.isArray(view.chestMassRevealed) ? view.chestMassRevealed : [];
  const hasHidden = items.some((_, index) => revealed[index] !== true);
  const revealAllBtn = hasHidden
    ? `<button class="btn mass-reveal-all" data-act="mass-reveal-all" type="button">Развернуть все</button>`
    : "";

  return `<div class="mass-loot-overlay" role="dialog" aria-modal="true" aria-label="Открытие сундуков">
    <div class="mass-loot-window">
      <h2 class="mass-loot-title">Открыто сундуков: ${opened}</h2>
      <div class="mass-loot-grid">${renderMassChestGrid()}</div>
      <div class="mass-loot-actions">
        ${revealAllBtn}
        <button class="btn primary mass-loot-close" data-act="mass-chest-close" type="button">Забрать всё</button>
      </div>
    </div>
  </div>`;
}
