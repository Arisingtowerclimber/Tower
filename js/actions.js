// ── Игровые действия ────────────────────────────────────────────────────────
// Загружается после ui.js и перед main.js. Бизнес-логика не трогает DOM,
// localStorage и window: только state/combat/events + глобальные хуки ui.js
// (render, toast, battleShake).
// TODO(review): при переходе на ES-модули заменить глобальные хуки на импорт.

function startBattle(floorId, mobKey) {
  const floor = FLOORS.find((f) => f.id === floorId); if (!floor) return; const def = mobKey === "boss" ? floor.boss : floor.mobs[Number(mobKey)]; if (!def) return;
  const spend = spendFightEnergy(); if (!spend.ok) { toast(spend.text, "warn"); render(); return; }
  Sfx.play("footstep_jump");
  if (mobKey === "boss") Sfx.play("portcullis");
  beginBattle(def, floor.id);
  if (!def.boss && Math.random() < AMBUSH_CHANCE) {
    view.ambush = { floorId: floor.id, nextMobIndex: ambushMobIndex(floor, Number(mobKey)) };
  }
}

function doExchange(type, potionId) {
  if (!view.battle || view.battle.over) return;

  const logBefore = view.battle.log.length;

  const mainInst = state.equipped.mainhand ? getInstance(state.equipped.mainhand) : null;

  const result = exchange(state, view.battle, { 
    type, 
    zone: view.attackZone, 
    blocks: view.blocks, 
    style: view.attackStyle, 
    id: potionId 
  }, mainInst);
  
  if (result.error) { 
    toast(result.error, "warn"); 
    return; 
  } 
  
  // Крит в размене — трясём контейнер боя (Этап 4).
  if (view.battle.log.slice(logBefore).some((l) => l.cls === "crit")) {
    shakeBattleContainer();
  }

  if (result.summary) { 
    view.summary = result.summary;
    // Дроп дневника с убитого охотника (Блок 6): при победе с state._hunterBattle.
    // Не победа (поражение/бегство) — флаг продратившегося боя сбрасываем.
    if (!result.summary.victory) state._hunterBattle = null;
    if (result.summary.victory && state._hunterBattle) {
      const enc = HUNTER_ENCOUNTERS.find((h) => h.id === state._hunterBattle.encId);
      const dropId = enc ? enc.killDrop : null;
      if (dropId) {
        const already = state.owned.some((it) => it && (typeof it === "object" ? it.id === dropId : it === dropId));
        if (already) {
          state.gold += 25;
          toast(`Из вещей охотника — дневник этого этажа, он у вас уже есть. Продан за 25 💰.`, "ok");
        } else {
          addItemInstance(dropId, DURABILITY_MAX, "common");
          toast(`Из вещей охотника выпадает «${ITEMS[dropId].name}».`, "ok");
        }
      }
      state._hunterBattle = null;
    }
    // Звуковые эффекты исхода боя (Этап 4): победа/поражение + лут/уровень.
    if (result.summary.victory) {
      Sfx.play("victory");
      if (Array.isArray(result.summary.loot) && result.summary.loot.length) Sfx.play("chest");
      if (Array.isArray(result.summary.levels) && result.summary.levels.length) Sfx.play("levelup");
    } else {
      Sfx.play("defeat");
    }
    render(); 
    return;
  } 
  renderBattle();
}

function go(screen) {
  if (!state.created) return;
  
  if (!state.npcDialogueIndex) state.npcDialogueIndex = {};

  const shopNpc = SHOP_NPCS[screen];
  
  if (shopNpc) {
    if (view.activeShopNpc !== shopNpc) { 
      view.activeShopNpc = shopNpc; 
      view.sellSelection = []; 
      view.shopTab = "buy"; 
      view.shopFilterSlot = "all";
      view.shopFilterType = "all";
      view.shopFilterStyle = null;
      view.shopFilterArmor = null;
    }
    view.shopNpcPhrase = getRandomPhrase(shopNpc, "greetings");
    view.storyJustPlayed = false;
  } else {
    view.activeShopNpc = null; 
    view.sellSelection = []; 
    view.shopTab = "buy";
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

  // Смена локации — короткий «открытие» (Этап 4).
  Sfx.play("open");

  // Шаги и двери: уход из Йорстеда, вход в лавки, ворота Башни.
  const prevScreen = view.screen;
  // Переход в другую локацию закрывает открытое взаимодействие: диалог не
  // «переезжает» вместе с игроком и не всплывает в следующей лавке.
  if (prevScreen !== screen) {
    view.npcInteraction = null;
    view.hiringCompanion = null;
    view.companionInfo = null;
  }
  playFootstep(screen);
  if (prevScreen === "hub" && screen !== "hub") Sfx.play("door_close");
  if (["forge", "alchemy", "jewelry", "hotel"].includes(screen)) Sfx.play("door_open");
  if (screen === "tower") Sfx.play("gate_open");

  view.ambush = null;
  view.screen = screen;
  view.dollSlot = null;
  view.invItemUid = null;
  if (screen === "tower") view.tripActive = true;
  if (screen !== "battle") view.summary = null;

  // Вход в лавку сразу открывает диалог NPC в режиме "dialog". После «Уйти»
  // interaction = null, и рендерится обычный магазин.
  if (shopNpc && ["forge", "alchemy", "jewelry"].includes(screen)) {
    view.npcInteraction = { npcId: shopNpc, mode: "dialog", node: "start" };
  } else if (prevScreen !== screen) {
    view.npcInteraction = null;
  }
  
  render();
}

function startAutoExplore(floorId, avoidDanger) {
  if (view.autoExplore) return;
  const reason = towerClosedReason();
  if (reason) { toast(reason, "warn"); render(); return; }
  if (state.activeSceneId) { toast("Сначала разберитесь с активной сценой.", "warn"); render(); return; }
  if (state.activeNpcId) { toast("Сначала закончите разговор.", "warn"); render(); return; }
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

  // Процедурное событие — останавливаемся, чтобы игрок принял решение в модалке.
  if (state.activeEvent) {
    stopAutoExplore("Произошло событие. Авто-исследование остановлено.");
    render();
    return;
  }

  if (res.encounter || res.scene) {
    if (res.encounter && !avoidDanger) {
      view.exploreResult = { 
        type: "loot", 
        encounter: res.encounter, 
        scene: res.scene, 
        text: res.text 
      };
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
  } else if (type === "talk" && scene.talkOutcome) {
    // ── «Разговор» (Блок 7): награда без боя. Формат talkOutcome:
    // { gold, resource: [id,min,max], rep: [factionId, n], rumor }.
    const o = scene.talkOutcome;
    const parts = [o.text || "Разговор вышел полезным."];
    if (o.gold) {
      const g = Array.isArray(o.gold) ? o.gold[0] + Math.floor(Math.random() * (o.gold[1] - o.gold[0] + 1)) : o.gold;
      if (g > 0) { state.gold += g; parts.push(`+${g} 💰`); }
    }
    if (Array.isArray(o.resource)) {
      const [resId, min, max] = o.resource;
      const amount = min + Math.floor(Math.random() * (max - min + 1));
      state.resources[resId] = (state.resources[resId] || 0) + amount;
      weekQuestResourceGain(resId, amount);
      const res = ALL_RESOURCES.find((r) => r.id === resId);
      parts.push(`${res ? res.name : resId} ×${amount}`);
    }
    if (Array.isArray(o.rep)) {
      const repRes = addFactionRep(o.rep[0], o.rep[1]);
      if (repRes) {
        const faction = FACTION_MAP[o.rep[0]];
        parts.push(`Репутация ${faction ? faction.name.toLowerCase() : o.rep[0]}: +${o.rep[1]}`);
        if (repRes.factionLevelUp) toast(`Новый тир фракции «${repRes.factionLevelUp.name}»!`, "ok");
      }
    }
    if (o.rumor) parts.push(`Слух: «${o.rumor}»`);
    addProgress(3);
    closeScene();
    toast(parts.join(" "), "ok");
    render();
  } else if (type === "loot" && scene.lootOutcome) {
    // ── «Обобрать» (Блок 7): лут без боя, возможен риск. Формат lootOutcome:
    // { resource: [id,min,max], gold, risk, failText, skirmish: [группы], hp: [min,max] }.
    const o = scene.lootOutcome;
    const risk = Number.isFinite(o.risk) ? o.risk : 0;
    if (risk > 0 && Math.random() < risk) {
      closeScene();
      if (Array.isArray(o.skirmish)) {
        toast(o.failText || "Вы потревожили не то, что стоило.", "warn");
        startGroup(o.skirmish);
      } else {
        const dmg = Array.isArray(o.hp) ? o.hp[0] + Math.floor(Math.random() * (o.hp[1] - o.hp[0] + 1)) : 0;
        if (dmg > 0) state.hp = Math.max(1, state.hp - dmg);
        addProgress(1);
        saveState();
        toast(`${o.failText || "Добраться до лута не вышло."}${dmg ? ` −${dmg} HP` : ""}`, "warn");
        render();
      }
      return;
    }
    const parts = ["Вы обшарили место:"];
    if (Array.isArray(o.resource)) {
      const [resId, min, max] = o.resource;
      const amount = min + Math.floor(Math.random() * (max - min + 1));
      state.resources[resId] = (state.resources[resId] || 0) + amount;
      weekQuestResourceGain(resId, amount);
      const res = ALL_RESOURCES.find((r) => r.id === resId);
      parts.push(`${res ? res.name : resId} ×${amount}`);
    }
    if (o.gold) {
      const g = Array.isArray(o.gold) ? o.gold[0] + Math.floor(Math.random() * (o.gold[1] - o.gold[0] + 1)) : o.gold;
      if (g > 0) { state.gold += g; parts.push(`+${g} 💰`); }
    }
    if (Array.isArray(o.rep)) {
      const repRes = addFactionRep(o.rep[0], o.rep[1]);
      if (repRes) {
        const faction = FACTION_MAP[o.rep[0]];
        parts.push(`Репутация ${faction ? faction.name.toLowerCase() : o.rep[0]}: +${o.rep[1]}`);
        if (repRes.factionLevelUp) toast(`Новый тир фракции «${repRes.factionLevelUp.name}»!`, "ok");
      }
    }
    if (o.rumor) parts.push(`Слух: «${o.rumor}»`);
    addProgress(2);
    closeScene();
    toast(parts.join(" "), "ok");
    render();
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

// ── Спонтанные события этажей (Блок 6) ──────────────────────────────────────
// Вход: state.activeFloorEvent = { eventId, floorId } (ставит exploreFloor).
// Формат действий в data.js: action.outcomes — массив { chance, text, effects },
// chance складываются кумулятивно вверх до 1.
// Эффекты: gold(n|[min,max]), resource([id,min,max]), potion(id),
// rep([factionId, n]), rumor, diary(bool), hp([min,max] — урон), xp(n),
// skirmish([индексы мобов этажа] — бой с первым из списка).

// Кумулятивный выбор исхода действия (0.3/0.2/0.2/0.3 — как в data.js).
function pickFloorEventOutcome(outcomes) {
  const roll = Math.random();
  let cumulative = 0;
  for (const o of outcomes) {
    cumulative += o.chance;
    if (roll < cumulative) return o;
  }
  return outcomes[outcomes.length - 1];
}

function resolveFloorEventAction(eventId, actionId) {
  const fe = state.activeFloorEvent;
  if (!fe || fe.eventId !== eventId) return;
  const event = FLOOR_EVENTS[eventId];
  if (!event) { state.activeFloorEvent = null; saveState(); render(); return; }

  const rand = (v) => (Array.isArray(v) ? v[0] + Math.floor(Math.random() * (v[1] - v[0] + 1)) : v);
  const floor = FLOORS.find((f) => f.id === fe.floorId);

  const action = (event.actions || []).find((a) => a.id === actionId);
  if (!action) { state.activeFloorEvent = null; saveState(); toast("Действие недоступно.", "warn"); render(); return; }

  // Сундук: скрип открытия крышки.
  if (actionId === "open") Sfx.play("chest_open");

  // Живой охотник: «Подойти» открывает диалог HUNTER_ENCOUNTERS (событие не закрывается).
  if (event.type === "hunter" && actionId === "approach") {
    const enc = (HUNTER_ENCOUNTERS || []).find((h) => h.floors.includes(fe.floorId));
    if (!enc) { state.activeFloorEvent = null; saveState(); toast("Охотник уже ушёл.", "warn"); render(); return; }
    state.activeFloorEvent = { ...fe, encounter: enc.id };
    saveState();
    render();
    return;
  }

  // Действие без outcomes — «уйти/пройти мимо»: чистое завершение.
  const outcome = (action.outcomes || []).length ? pickFloorEventOutcome(action.outcomes) : { effects: {}, text: "" };
  const e = outcome.effects || {};
  const parts = [outcome.text || "Вы осмотрелись."].filter(Boolean);

  // Дневник этажа (труп/сундук): если он уже в инвентаре — золото вместо копии.
  if (e.diary) {
    const diaryId = floor ? FLOOR_DIARY[floor.id] : null;
    const already = diaryId && state.owned.some((it) => it && (typeof it === "object" ? it.id === diaryId : it === diaryId));
    if (diaryId && !already) {
      addItemInstance(diaryId, DURABILITY_MAX, "common");
      parts.push(`Найден дневник: «${ITEMS[diaryId] ? ITEMS[diaryId].name : diaryId}»`);
    } else if (diaryId) {
      state.gold += 25;
      parts.push("Такой дневник уже есть — обмениваем на 25 💰");
    }
  }
  if (e.gold) {
    const g = Math.max(0, rand(e.gold));
    if (g > 0) { state.gold += g; parts.push(`+${g} 💰`); }
  }
  if (Array.isArray(e.resource)) {
    const [resId, min, max] = e.resource;
    const amount = min + Math.floor(Math.random() * (max - min + 1));
    state.resources[resId] = (state.resources[resId] || 0) + amount;
    weekQuestResourceGain(resId, amount);
    const res = ALL_RESOURCES.find((r) => r.id === resId);
    parts.push(`${res ? res.name : resId} ×${amount}`);
  }
  if (e.potion) {
    state.potions = state.potions || {};
    state.potions[e.potion] = (state.potions[e.potion] || 0) + 1;
    parts.push(`${ITEMS[e.potion] ? ITEMS[e.potion].name : "Зелье"} 🧪`);
  }
  if (Array.isArray(e.rep)) {
    const repRes = addFactionRep(e.rep[0], e.rep[1]);
    if (repRes) {
      const faction = FACTION_MAP[e.rep[0]];
      parts.push(`Репутация ${faction ? faction.name.toLowerCase() : e.rep[0]}: +${e.rep[1]}`);
      if (repRes.factionLevelUp) toast(`Новый тир фракции «${repRes.factionLevelUp.name}»!`, "ok");
    }
  }
  if (e.rumor) parts.push(`Слух: «${e.rumor}»`);
  if (Number.isFinite(e.xp) && e.xp > 0) { gainXp(e.xp); parts.push(`+${e.xp} ✦`); }

  // Уникальные эффекты компаньонов: еда/песня/снаряжение и рост отношений.
  if (e.buff) {
    const buff = applyCompanionBuff(e.buff);
    if (buff) parts.push(buff.text);
  }
  if (Number.isFinite(e.affinity)) {
    const companionId = fe.companion || event.companion;
    const companion = COMPANION_MAP[companionId];
    const affinity = addAffinity(companionId, e.affinity);
    if (companion && affinity) parts.push(`${companion.name}: ${e.affinity > 0 ? "+" : ""}${e.affinity} привязанности`);
  }

  // Труп: если обыск что-то дал — щелчок замка/тайника.
  if (actionId === "search" && (e.diary || e.gold || e.potion || Array.isArray(e.resource))) {
    Sfx.play("lock_unlock");
  }

  state.activeFloorEvent = null;
  saveState();

  // Риск: бой с мобами этажа (первый из списка, остальные — продолжение через sceneGroup).
  if (Array.isArray(e.skirmish) && floor) {
    const group = e.skirmish.filter((i) => floor.mobs[i]);
    if (group.length) {
      toast(parts.join(" "), "warn");
      view.sceneGroup = group.slice(1);
      view.sceneGroupFloorId = floor.id;
      beginBattle(floor.mobs[group[0]], floor.id);
      return;
    }
  }

  // Риск: урон вне боя (не убивает: минимум 1 HP).
  if (Array.isArray(e.hp)) {
    const dmg = rand(e.hp);
    if (dmg > 0) { state.hp = Math.max(1, state.hp - dmg); parts.push(`−${dmg} HP`); }
  }

  const floorEventCls = parts.some((p) => p.includes("💰") || p.includes("×") || p.includes("🧪") || p.includes("✦")) ? "ok" : "warn";
  toast(parts.join(" "), floorEventCls);
  render();
}

// ── NPC-охотники (Блок 6): помощь / убийство / уход ─────────────────────────
function resolveHunterEncounterAction(encId, actionId) {
  const fe = state.activeFloorEvent;
  if (!fe || fe.encounter !== encId) return;
  const enc = (HUNTER_ENCOUNTERS || []).find((h) => h.id === encId);
  if (!enc) { state.activeFloorEvent = null; saveState(); render(); return; }
  const close = () => { state.activeFloorEvent = null; saveState(); };
  const rand = (v) => (Array.isArray(v) ? v[0] + Math.floor(Math.random() * (v[1] - v[0] + 1)) : v);

  if (actionId === "leave") {
    close();
    toast(`Вы оставляете «${enc.name}» в покое.`, "ok");
    render();
    return;
  }

  if (actionId === "help") {
    const parts = [enc.helpText || "Охотник благодарит вас."];
    // Требование помощи: любое лечащее зелье или конкретный ресурс.
    const need = enc.helpNeed;
    if (need) {
      if (need.potion) {
        const potionId = Object.keys(state.potions || {}).find((id) => (state.potions[id] || 0) > 0 && ITEMS[id] && ITEMS[id].type === "potion" && ITEMS[id].effect === "hp");
        if (!potionId) { toast("Помощь стоит лечащего зелья, а его нет.", "warn"); render(); return; }
        state.potions[potionId] -= 1;
        parts.push(`отдано ${ITEMS[potionId].name.toLowerCase()}`);
      } else if (need.resource) {
        const amount = need.amount || 1;
        if ((state.resources[need.resource] || 0) < amount) {
          const res = ALL_RESOURCES.find((r) => r.id === need.resource);
          toast(`Нужно ${amount} × ${res ? res.name : need.resource}, чтобы помочь.`, "warn");
          render();
          return;
        }
        state.resources[need.resource] -= amount;
        const res = ALL_RESOURCES.find((r) => r.id === need.resource);
        parts.push(`отдано ${amount} × ${res ? res.name : need.resource}`);
      }
    }
    if (enc.helpReward) {
      const r = enc.helpReward;
      if (r.gold) {
        const g = Math.max(0, rand(r.gold));
        if (g > 0) { state.gold += g; parts.push(`+${g} 💰`); }
      }
      if (Array.isArray(r.rep)) {
        const repRes = addFactionRep(r.rep[0], r.rep[1]);
        if (repRes) {
          const faction = FACTION_MAP[r.rep[0]];
          parts.push(`Репутация ${faction ? faction.name.toLowerCase() : r.rep[0]}: +${r.rep[1]}`);
          if (repRes.factionLevelUp) toast(`Новый тир фракции «${repRes.factionLevelUp.name}»!`, "ok");
        }
      }
    }
    close();
    if (enc.helpReward && enc.helpReward.rumor) parts.push(`Слух: «${enc.helpReward.rumor}»`);
    toast(parts.join(", ") + ".", "ok");
    render();
    return;
  }

  if (actionId === "kill") {
    const spend = spendFightEnergy();
    if (!spend.ok) { toast(spend.text, "warn"); render(); return; }
    const floor = FLOORS.find((f) => f.id === fe.floorId) || FLOORS.find((f) => f.id === enc.floors[0]);
    const mob = floor ? floor.mobs[0] : null;
    if (!mob) { close(); toast("Охотник скрылся в суматохе.", "warn"); render(); return; }
    // Клон дефа моба (beginBattle/createBattle могут мутировать): половина HP и опыта.
    const hunterHp = Math.max(1, Math.round(mob.hp * enc.killHpMult));
    const hunterDef = {
      ...mob,
      id: `hunter_${enc.id}`,
      name: enc.name,
      hp: hunterHp,
      maxHp: hunterHp,
      xp: Math.max(1, Math.round((mob.xp || 0) * enc.killHpMult)),
      gold: Math.round((mob.gold || 0) * 0.5),
      boss: false,
    };
    state._hunterBattle = { encId: enc.id, floorId: floor.id }; // дроп дневника — в doExchange
    toast(enc.killText || `${enc.name} поднимается против вас!`, "warn");
    close();
    beginBattle(hunterDef, floor.id);
  }
}

// view передаётся явно; параметр по умолчанию сохраняет совместимость с UI.
function buyFromTrader(entryId, viewRef = view) {
  const stock = (viewRef && viewRef.traderStock) || [];
  const entry = stock.find((e) => (e.kind === "gear" ? e.uid : e.id) === entryId);
  if (!entry) return { ok: false, text: "Товар уже продан." };
  if (state.gold < entry.price) return { ok: false, text: "Не хватает золота." };
  
  state.gold -= entry.price;
  let name;

  if (entry.kind === "potion") {
    state.potions[entry.id] = (state.potions[entry.id] || 0) + 1;
    name = ITEMS[entry.id].name;
  } else {
    const inst = getInstance(entry.inst.uid);
    if (inst) {
      // Роллим редкость при покупке
      const newRarity = rollRarity();
      inst.rarity = newRarity;
      inst.affix = generateAffix(newRarity);
      if (newRarity === "legendary" && UNIQUE_EFFECTS.length) {
        inst.unique = UNIQUE_EFFECTS[Math.floor(Math.random() * UNIQUE_EFFECTS.length)].id;
      }
      name = getItemDisplayName(inst);
    } else {
      name = ITEMS[entry.inst.id].name;
    }
  }
  state._invRev = (state._invRev || 0) + 1;
  saveState();
  return { ok: true, text: `Куплено: ${name} (−${entry.price} 💰).`, entryId };
}

function applyNpcAction(action, npcId, viewRef = view) {
  const npc = NPCS[npcId] || NPCS[state.activeNpcId];
  if (!npc) return { ok: false, text: "Здесь никого нет." };
  if (action === "show-goods") {
    if (!viewRef.traderStock) viewRef.traderStock = getTraderInventory();
    viewRef.npcShopOpen = true;
    return { ok: true, text: `${npc.name} раскладывает товар.` };
  }
  if (action === "leave") {
    closeNpcDialog();
    return { ok: true, text: "Вы откланялись." };
  }
  return { ok: false, text: "Неизвестное действие." };
}
