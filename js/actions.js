// ── Игровые действия ────────────────────────────────────────────────────────
// Загружается после ui.js и перед main.js. Бизнес-логика не трогает DOM,
// localStorage и window: только state/combat/events + глобальные хуки ui.js
// (render, toast, battleShake).
// TODO(review): при переходе на ES-модули заменить глобальные хуки на импорт.

function startBattle(floorId, mobKey) {
  const floor = FLOORS.find((f) => f.id === floorId); if (!floor) return; const def = mobKey === "boss" ? floor.boss : floor.mobs[Number(mobKey)]; if (!def) return;
  const spend = spendFightEnergy(); if (!spend.ok) { toast(spend.text, "warn"); render(); return; }
  beginBattle(def, floor.id);
  if (!def.boss && Math.random() < AMBUSH_CHANCE) {
    view.ambush = { floorId: floor.id, nextMobIndex: ambushMobIndex(floor, Number(mobKey)) };
  }
}

function doExchange(type, potionId) {
  if (!view.battle || view.battle.over) return;

  battleShake();

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
  
  if (result.summary) { 
    view.summary = result.summary;
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

  // Смена локации — короткий «открытие» (Этап 4).
  Sfx.play("open");

  view.ambush = null;
  view.screen = screen;
  view.dollSlot = null;
  view.invItemUid = null;
  if (screen === "tower") view.tripActive = true;
  if (screen !== "battle") view.summary = null;
  
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
