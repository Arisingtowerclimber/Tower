const SAVE_KEY = "safe-zone-tower-v2";
const SAVE_VERSION = 9;
const OLD_SLOT_MAP = { weapon: "mainhand", armor: "chest", shield: "offhand" };
const BASE_STATS = { hp: 140, mana: 40, damage: 5, dodgeCap: 35, critCap: 60 };
// Версия формата недельных заказов. v2: доска и журнал читают один список
// state.weekQuests.list (kill-заказ Ивана + контракты доски + заказы NPC).
const WEEK_QUEST_FORMAT = 2;

// Абстракция хранилища — единая точка через js/platform.js (localStorage).
// Порт на Electron/Capacitor подменяет только platform.storage.
const storage = platform.storage;

// Сбрасывает кэш stats(). Вызывается из всех механик, меняющих атрибуты,
// экипировку, таланты, компаньона, дебаффы и уровень.
function invalidateStats() {
  if (!state) return;
  state._statsRev = (state._statsRev || 0) + 1;
  state._statsCache = null;
}

let state = null;

function defaultState() {
  let uid = 0;
  const inst = (id) => ({ uid: `item_${++uid}`, id, durability: DURABILITY_MAX, rarity: "common", affix: null, unique: null, upgrade: null });
  const owned = [inst("rusty_knife"), inst("rags"), inst("worn_hood"), inst("patched_pants"), inst("worn_boots")];
  const uidOf = (id) => owned.find((x) => x.id === id).uid;
  
  return {
    version: SAVE_VERSION, created: false, name: "Странник", portrait: "m1", gender: "male", archetype: null,
    level: 1, xp: 0, points: 0, attrs: { str: 1, agi: 1, end: 1, int: 1 },
    gold: 60, hp: BASE_STATS.hp + 2, mana: BASE_STATS.mana + 2, energy: EXPLORATION_MAX,
    phase: 0, day: 1, companion: null, companionDay: 0,
    affinity: Object.fromEntries(COMPANIONS.map((c) => [c.id, 0])),
    hireDiscounts: {},
    companionBuffs: [],
    potions: { hp_small: 2, hp_big: 0, mana_small: 1 },
    equipped: { 
      head: uidOf("worn_hood"), neck: null, shoulder: null, back: null, 
      chest: uidOf("rags"), wrist: null, hands: null, waist: null, 
      legs: uidOf("patched_pants"), feet: uidOf("worn_boots"), 
      ring1: null, ring2: null, trinket1: null, trinket2: null, 
      mainhand: uidOf("rusty_knife"), offhand: null 
    },
    owned, nextUid: uid + 1, maxFloor: 1, cleared: {}, floorProgress: {}, activeSceneId: null, activeSceneFloorId: null, activeNpcId: null, kills: 0, bestiary: {},
    activeEvent: null, tempDebuffs: [], eventCooldown: 0,
    killCount: {}, bestiaryKills: {}, weekQuests: { weekStartDay: 0, format: WEEK_QUEST_FORMAT, list: [] },
    unlockedAchievements: [], currentTitle: null, critCount: 0, brinkSurvived: false,
    contractsDone: 0,
    trainingCount: { drill: 0, sparring: 0, heavy_lifting: 0 },
    abilities: { preciseStrike: false, parry: false },
    activeStoryQuests: [], completedStoryQuests: [],
    resources: {},
    knownRecipes: [],
    talentPoints: 0, talents: {},
    npcDialogueIndex: {},
    reputation: Object.fromEntries(FACTIONS.map((f) => [f.id, 0])),
    factionNotified: Object.fromEntries(FACTIONS.map((f) => [f.id, false])),
    factionPerksUnlocked: Object.fromEntries(FACTIONS.map((f) => [f.id, false])),
    dialogTopicsSeen: {},
    dialogFlags: {},
    npcMood: {},
  };
}

function migrateSave(saved, fromVersion) {
  let version = Number.isFinite(fromVersion) ? fromVersion : 1;
  if (version < 2) { if (saved.mana === undefined) saved.mana = Number.isFinite(saved.energy) ? saved.energy : undefined; saved.energy = undefined; version = 2; }
  if (version < 3) version = 3;
  if (version < 4) version = 4;
  if (version < 5) version = 5;
  if (version < 6) version = 6;
  if (version < 7) version = 7;
  if (version < 8) version = 8;
  // v9: бронза переименована в «холодное железо». Переносим старые id,
  // чтобы игроки не потеряли снаряжение, рецепты и слитки.
  if (version < 9) {
    const renameColdIron = (id) => {
      if (typeof id !== "string") return id;
      if (id.startsWith("recipe_bronze_")) return `recipe_cold_iron_${id.slice(14)}`;
      if (id.startsWith("bronze_")) return `cold_iron_${id.slice(7)}`;
      return id;
    };
    if (Array.isArray(saved.owned)) {
      saved.owned = saved.owned.map((entry) => {
        if (typeof entry === "string") return renameColdIron(entry);
        if (entry && typeof entry === "object" && typeof entry.id === "string") return { ...entry, id: renameColdIron(entry.id) };
        return entry;
      });
    }
    if (saved.equipped && typeof saved.equipped === "object" && !Array.isArray(saved.equipped)) {
      for (const slot of Object.keys(saved.equipped)) saved.equipped[slot] = renameColdIron(saved.equipped[slot]);
    }
    if (Array.isArray(saved.knownRecipes)) saved.knownRecipes = saved.knownRecipes.map(renameColdIron);
    if (saved.resources && typeof saved.resources === "object" && !Array.isArray(saved.resources)) {
      for (const resId of Object.keys(saved.resources)) {
        if (!resId.startsWith("bronze_")) continue;
        const nextId = renameColdIron(resId);
        saved.resources[nextId] = (Number(saved.resources[nextId]) || 0) + (Number(saved.resources[resId]) || 0);
        delete saved.resources[resId];
      }
    }
    version = 9;
  }
  saved.version = version;
  return saved;
}

// Приводит карту «фракция → значение» к значимому виду: числа — это репутация,
// булевы — флаги (уведомления/перки). Всё постороннее отбрасывается.
function normalizeFactionMap(raw, fill) {
  const out = {};
  for (const f of FACTIONS) {
    const v = raw && typeof raw === "object" && !Array.isArray(raw) ? raw[f.id] : undefined;
    if (typeof fill === "boolean") out[f.id] = typeof v === "boolean" ? v : false;
    else if (typeof fill === "string") out[f.id] = typeof v === "string" ? v : fill;
    else out[f.id] = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : (Number.isFinite(fill) ? fill : 0);
  }
  return out;
}

// Приводит репутацию/флаги фракций из сейва к дефолтам без миграции версии:
// свежие поля просто дополняются из defaultState, а мусор отбрасывается.
function normalizeFactionFields() {
  state.reputation = normalizeFactionMap(state.reputation, 0);
  state.factionNotified = normalizeFactionMap(state.factionNotified, false);
  state.factionPerksUnlocked = normalizeFactionMap(state.factionPerksUnlocked, false);
  // «Уважаемый» (тир 2) открывает перки фракции: улучшение вещей и т.п.
  for (const f of FACTIONS) {
    state.factionPerksUnlocked[f.id] = state.reputation[f.id] >= FACTION_TIERS[2].min;
  }
}

// Валидация записи улучшения предмета (Этап 2): { level, stat }.
// Всё лишнее — мусор, ключи стата вне ветки отбрасываются.
function normalizeUpgrade(raw, item) {
  const path = upgradePathForItem(item);
  if (!path || !raw || typeof raw !== "object") return null;
  const level = Number(raw.level);
  if (!Number.isFinite(level) || level <= 0) return null;
  const clamped = Math.min(UPGRADE_MAX_LEVEL, Math.floor(level));
  let stat = null;
  if (path.id === "jewelry") stat = raw.stat === "dodge" ? "dodge" : "crit";
  return { level: clamped, stat };
}

// ── Темы разговоров NPC (Этап 3) ───────────────────────────────────────────
// Репутация фракции NPC для порогов тем; у NPC без фракции (стелла, иван)
// порог по репутации считается пройденным.
function topicNpcRep(npcId) {
  const factionId = FACTION_BY_NPC[npcId];
  if (!factionId) return Infinity;
  return state.reputation ? (state.reputation[factionId] || 0) : 0;
}

function topicAvailable(topic, npcId) {
  if (!topic) return false;
  const minRep = Number.isFinite(topic.minRep) ? topic.minRep : 0;
  const minFloor = Number.isFinite(topic.minFloor) ? topic.minFloor : 1;
  return topicNpcRep(npcId) >= minRep && (state.maxFloor || 1) >= minFloor;
}

// ── Эффекты диалоговых опций (Блок 2) ───────────────────────────────────────
// effects: { gold, rep, flag, item }. rep идёт фракции NPC; у Ивана и Тимми
// это Гильдия Охотников. Флаг — строка в state.dialogFlags, item — id предмета.
function applyDialogEffects(effects, npcId) {
  if (!effects || typeof effects !== "object") return { ok: true, text: "" };
  const notes = [];

  const gold = Number(effects.gold);
  if (Number.isFinite(gold) && gold !== 0) {
    state.gold = Math.max(0, state.gold + gold);
    notes.push(`${gold > 0 ? "+" : ""}${gold} золота`);
  }

  const rep = Number(effects.rep);
  if (Number.isFinite(rep) && rep !== 0) {
    const factionId = FACTION_BY_NPC[npcId] || (npcId === "ivan" || npcId === "timmy" ? "hunters" : null);
    if (factionId && FACTION_MAP[factionId]) {
      state.reputation[factionId] = Math.max(0, (state.reputation[factionId] || 0) + rep);
      notes.push(`${rep > 0 ? "+" : ""}${rep} реп. ${FACTION_MAP[factionId].name}`);
    }
  }

  if (typeof effects.flag === "string" && effects.flag) {
    state.dialogFlags[effects.flag] = true;
    notes.push(`флаг «${effects.flag}»`);
  }

  const affinityTarget = effects.companionId || (COMPANION_MAP[npcId] ? npcId : null);
  const affinity = Number(effects.affinity);
  if (affinityTarget && Number.isFinite(affinity) && affinity !== 0) {
    const result = addAffinity(affinityTarget, affinity, { silent: true });
    if (result) notes.push(`${result.gained > 0 ? "+" : ""}${result.gained} привязанности`);
  }

  const hireDiscount = Number(effects.hireDiscount);
  if (affinityTarget && Number.isFinite(hireDiscount) && hireDiscount > 0) {
    state.hireDiscounts = state.hireDiscounts || {};
    state.hireDiscounts[affinityTarget] = Math.max(state.hireDiscounts[affinityTarget] || 0, Math.min(0.5, hireDiscount));
    notes.push(`скидка на найм ${Math.round(state.hireDiscounts[affinityTarget] * 100)}%`);
  }

  if (typeof effects.item === "string" && ITEMS[effects.item]) {
    addItemInstance(effects.item, DURABILITY_MAX, "common");
    notes.push(`получен предмет: ${ITEMS[effects.item].name}`);
  }

  if (notes.length) saveState();
  return { ok: true, text: notes.join(", ") };
}

// ── Условия диалоговых опций ───────────────────────────────────────────────
// requires: { bossKilled, bossNotKilled, bossKilledCount, maxFloor, minGold, flag, notFlag, anyBossKilled }.
// bossKilled принимает id босса: проверяем state.cleared по этажу этого босса.
function dialogBossKilled(bossId) {
  if (!bossId) return false;
  const floor = FLOORS.find((f) => f.boss && f.boss.id === bossId);
  if (floor) return Boolean(state.cleared && state.cleared[floor.id]);
  return Boolean(state.bestiaryKills && state.bestiaryKills[bossId]);
}

function dialogRequiresMet(requires) {
  if (!requires || typeof requires !== "object") return true;
  if (requires.bossKilled && !dialogBossKilled(requires.bossKilled)) return false;
  if (requires.bossNotKilled && dialogBossKilled(requires.bossNotKilled)) return false;
  if (Number.isFinite(requires.bossKilledCount)) {
    const cleared = Object.keys(state.cleared || {}).length;
    if (cleared < requires.bossKilledCount) return false;
  }
  if (Number.isFinite(requires.maxFloor) && (state.maxFloor || 1) < requires.maxFloor) return false;
  if (Number.isFinite(requires.minGold) && (state.gold || 0) < requires.minGold) return false;
  const flags = state.dialogFlags || {};
  if (requires.flag && !flags[requires.flag]) return false;
  if (requires.notFlag && flags[requires.notFlag]) return false;
  if (requires.anyBossKilled && !Object.keys(state.cleared || {}).length) return false;
  return true;
}

// Улучшение предмета (Этап 2): списывает материалы фракционной наковальни
// и золото, повышает уровень улучшения. Требует тир «Уважаемый» фракции.
function upgradeItem(uid, stat = null) {
  const inst = getInstance(uid);
  if (!inst) return { ok: false, text: "Предмет не найден." };
  const item = ITEMS[inst.id];
  if (!item) return { ok: false, text: "Предмет не найден." };
  const path = upgradePathForItem(item);
  if (!path) return { ok: false, text: "Этот предмет нельзя улучшить." };

  const factionId = UPGRADE_FACTION[path.id];
  const faction = FACTION_MAP[factionId];
  if (!state.factionPerksUnlocked || !state.factionPerksUnlocked[factionId]) {
    return { ok: false, text: `${faction.name} ещё не доверяет вам — нужен тир «${FACTION_TIERS[2].name}» (${FACTION_TIERS[2].min} репутации, ежедневные заказы ${faction.npc === "elain" ? "Элейн" : faction.npc === "elize" ? "Элизы" : "Рона"}).` };
  }

  const up = normalizeUpgrade(inst.upgrade, item) || { level: 0, stat: null };
  if (up.level >= UPGRADE_MAX_LEVEL) return { ok: false, text: "Максимальный уровень улучшения достигнут." };

  // Ювелирная ветка: выбор стата применяется ко всем уровням улучшения,
  // поэтому его можно менять — это просто другая раскладка тех же бонусов.
  let chosen = null;
  if (path.id === "jewelry") {
    chosen = stat === "dodge" ? "dodge" : stat === "crit" ? "crit" : (up.stat || "crit");
  }

  const step = up.level; // материалы и цена шага level → level+1
  const missing = [];
  const goldCost = UPGRADE_GOLD_COST[step];
  if (state.gold < goldCost) missing.push(`золото ${state.gold}/${goldCost} 💰`);
  for (const [resId, need] of Object.entries(path.materials[step])) {
    const have = state.resources[resId] || 0;
    if (have < need) {
      const res = ALL_RESOURCES.find((r) => r.id === resId);
      missing.push(`${res ? res.name : resId} ${have}/${need}`);
    }
  }
  if (missing.length) return { ok: false, text: `Не хватает: ${missing.join(", ")}.` };

  for (const [resId, need] of Object.entries(path.materials[step])) {
    state.resources[resId] = Math.max(0, (state.resources[resId] || 0) - need);
  }
  state.gold -= goldCost;
  inst.upgrade = { level: up.level + 1, stat: chosen };

  const oldStats = stats();
  invalidateStats();
  applyVitalsDelta(oldStats, stats());
  saveState();

  const gains = path.id === "jewelry"
    ? { [inst.upgrade.stat === "dodge" ? "dodge" : "crit"]: inst.upgrade.stat === "dodge" ? UPGRADE_PER_LEVEL.jewelry.dodge : UPGRADE_PER_LEVEL.jewelry.crit }
    : UPGRADE_PER_LEVEL[path.id];
  const gainText = Object.entries(gains).map(([k, v]) => `+${v * inst.upgrade.level} ${UPGR_STAT_LABEL[k] || k}`).join(", ");
  return { ok: true, text: `Улучшено: ${item.name} ${inst.upgrade.stat ? `${UPGR_STAT_LABEL[inst.upgrade.stat === "dodge" ? "dodge" : "crit"]} ` : ""}+${inst.upgrade.level} (${gainText}). Цена: ${goldCost} 💰.` };
}

function loadState() {
  let raw = null;
  try {
    raw = storage.get(SAVE_KEY);
    if (!raw) { state = defaultState(); return { ok: true, empty: true }; }
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      throw new Error("Некорректный формат сохранения");
    }
    const defaults = defaultState();
    migrateSave(saved, saved.version);

    const equipped = { ...defaults.equipped };
    for (const [slot, id] of Object.entries(saved.equipped || {})) {
      const target = OLD_SLOT_MAP[slot] || slot;
      if (target in equipped) equipped[target] = id;
    }
    const potions = { ...defaults.potions, ...(saved.potions || {}) };
    if (potions.energy_small) { potions.mana_small = (potions.mana_small || 0) + potions.energy_small; delete potions.energy_small; }

    state = { ...defaults, ...saved, version: SAVE_VERSION, attrs: { ...defaults.attrs, ...(saved.attrs || {}) }, potions, equipped, cleared: saved.cleared || {}, floorProgress: saved.floorProgress || {}, resources: saved.resources || {} };
    
    const sceneFloor = FLOORS.find((f) => f.id === state.activeSceneFloorId);
    const sceneOk = sceneFloor && (FLOOR_SCENES[sceneFloor.id] || []).some((s) => s.id === state.activeSceneId);
    if (!sceneOk) { state.activeSceneId = null; state.activeSceneFloorId = null; }
    if (state.activeNpcId === "trader") state.activeNpcId = "arthur";
    if (state.activeNpcId && !NPCS[state.activeNpcId]) state.activeNpcId = null;
    delete state.debuff; // устаревшая система атмосферных дебаффов (заменена на tempDebuffs)
    if (!Array.isArray(state.tempDebuffs)) state.tempDebuffs = [];
    state.tempDebuffs = state.tempDebuffs.filter((d) => d && typeof d === "object" && Number.isFinite(d.days) && d.days > 0);
    state.activeEvent = state.activeEvent && typeof state.activeEvent === "object" && state.activeEvent.id ? state.activeEvent : null;
    state.eventCooldown = Number.isFinite(state.eventCooldown) ? Math.max(0, state.eventCooldown) : 0;

    state.mana = Number.isFinite(state.mana) ? state.mana : defaults.mana;
    state.energy = Number.isFinite(state.energy) ? state.energy : EXPLORATION_MAX;
    state.phase = Number.isFinite(saved.phase) ? Math.max(0, Math.min(TIME_PHASES.length - 1, saved.phase)) : defaults.phase;
    state.day = Number.isFinite(saved.day) ? Math.max(1, saved.day) : defaults.day;
    state.companion = COMPANION_MAP[state.companion] ? state.companion : null;
    state.companionDay = Number.isFinite(state.companionDay) ? state.companionDay : 0;
    state.affinity = { ...defaults.affinity };
    const savedAffinity = saved.affinity && typeof saved.affinity === "object" && !Array.isArray(saved.affinity) ? saved.affinity : {};
    for (const id of Object.keys(state.affinity)) {
      const value = Number(savedAffinity[id]);
      state.affinity[id] = Number.isFinite(value) ? Math.max(0, Math.min(1000, Math.floor(value))) : 0;
    }
    state.hireDiscounts = {};
    const savedDiscounts = saved.hireDiscounts && typeof saved.hireDiscounts === "object" ? saved.hireDiscounts : {};
    for (const [id, value] of Object.entries(savedDiscounts)) {
      const n = Number(value);
      if (COMPANION_MAP[id] && Number.isFinite(n) && n > 0) state.hireDiscounts[id] = Math.min(0.5, n);
    }
    state.companionBuffs = Array.isArray(saved.companionBuffs)
      ? saved.companionBuffs.filter((b) => b && typeof b === "object" && b.stat && Number.isFinite(b.mult) && Number.isFinite(b.days) && b.days > 0)
      : [];
    if (!PORTRAIT_MAP[state.portrait]) state.portrait = "m1";
    state.archetype = ARCHETYPE_MAP[state.archetype] ? state.archetype : null;

    state.talentPoints = Number.isFinite(state.talentPoints) ? Math.max(0, state.talentPoints) : 0;
    state.talents = {};
    const savedTalents = saved.talents && typeof saved.talents === "object" ? saved.talents : {};
    for (const [id, rank] of Object.entries(savedTalents)) {
      const t = TALENT_MAP[id];
      if (!t) continue;
      state.talents[id] = Math.max(0, Math.min(t.maxRank, Number(rank) || 0));
    }

    // Тренировки и освоенные QTE-способности. Старые сейвы получают дефолты.
    state.trainingCount = { ...defaults.trainingCount, ...(saved.trainingCount && typeof saved.trainingCount === "object" ? saved.trainingCount : {}) };
    for (const id of Object.keys(defaults.trainingCount)) {
      const n = Number(state.trainingCount[id]);
      state.trainingCount[id] = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    }
    state.abilities = { ...defaults.abilities, ...(saved.abilities && typeof saved.abilities === "object" ? saved.abilities : {}) };
    for (const id of Object.keys(defaults.abilities)) state.abilities[id] = state.abilities[id] === true;

    state.npcDialogueIndex = state.npcDialogueIndex && typeof state.npcDialogueIndex === "object" ? state.npcDialogueIndex : {};

    normalizeFactionFields();
    state.dialogTopicsSeen = state.dialogTopicsSeen && typeof state.dialogTopicsSeen === "object" && !Array.isArray(state.dialogTopicsSeen) ? state.dialogTopicsSeen : {};
    state.dialogFlags = state.dialogFlags && typeof state.dialogFlags === "object" && !Array.isArray(state.dialogFlags) ? state.dialogFlags : {};
    state.npcMood = state.npcMood && typeof state.npcMood === "object" && !Array.isArray(state.npcMood) ? state.npcMood : {};

    if (!Array.isArray(state.owned)) state.owned = [];
    if (state.owned.some((x) => typeof x === "string")) {
      const oldDurability = state.durability || {};
      const ids = state.owned.filter((x) => typeof x === "string" && ITEMS[x]);
      for (const val of Object.values(state.equipped)) {
        if (typeof val === "string" && ITEMS[val] && !ids.includes(val)) ids.push(val);
      }
      state.owned = ids.map((id) => ({ uid: generateUid(), id, durability: Number.isFinite(oldDurability[id]) ? oldDurability[id] : DURABILITY_MAX }));
      for (const slot of Object.keys(state.equipped)) {
        const val = state.equipped[slot];
        if (!val) continue;
        const inst = state.owned.find((x) => x.id === val);
        state.equipped[slot] = inst ? inst.uid : null;
      }
    }

    const seenUids = new Set();
    state.owned = state.owned
      .filter((inst) => inst && typeof inst === "object" && ITEMS[inst.id])
      .map((inst) => {
        if (typeof inst.uid !== "string" || !inst.uid || seenUids.has(inst.uid)) inst.uid = generateUid();
        seenUids.add(inst.uid);
        const rarity = inst.rarity && RARITY_TIERS[inst.rarity] ? inst.rarity : "common";
        let affix = null;
        if (inst.affix && AFFIXES.some((a) => a.id === inst.affix.id) && Array.isArray(inst.affix.bonuses)) {
          const bonuses = inst.affix.bonuses
            .filter((b) => b && typeof b.id === "string" && Number.isFinite(b.value))
            .map((b) => ({ id: b.id, value: b.value }));
          if (bonuses.length) affix = { id: inst.affix.id, name: String(inst.affix.name || ""), bonuses };
        }
        const unique = rarity === "legendary" && UNIQUE_EFFECTS.some((u) => u.id === inst.unique) ? inst.unique : null;
        return { uid: inst.uid, id: inst.id, durability: Number.isFinite(inst.durability) ? inst.durability : DURABILITY_MAX, rarity, affix, unique, upgrade: normalizeUpgrade(inst.upgrade, ITEMS[inst.id]) };
      });
      
    for (const slot of Object.keys(state.equipped)) {
      const uid = state.equipped[slot];
      if (uid && !getInstance(uid)) state.equipped[slot] = null;
    }
    
    delete state.durability;
    
    state.nextUid = state.owned.reduce((max, inst) => {
      const n = Number(String(inst.uid).replace(/^item_/, ""));
      return Number.isFinite(n) && n + 1 > max ? n + 1 : max;
    }, Number.isFinite(state.nextUid) ? state.nextUid : 1);

    state.knownRecipes = Array.isArray(state.knownRecipes) ? [...new Set(state.knownRecipes.filter((id) => RECIPE_MAP[id]))] : [];
    state.killCount = state.killCount || {};
    state.bestiary = state.bestiary && typeof state.bestiary === "object" ? state.bestiary : {};
    // Счётчики убийств для бестиария и достижений.
    state.bestiaryKills = {};
    const savedKills = saved.bestiaryKills && typeof saved.bestiaryKills === "object" ? saved.bestiaryKills : {};
    for (const [mobId, count] of Object.entries(savedKills)) {
      const n = Math.max(0, Math.floor(Number(count) || 0));
      if (n > 0) state.bestiaryKills[String(mobId)] = n;
    }
    // Достижения: список открытых id + счётчики для условий.
    state.unlockedAchievements = Array.isArray(state.unlockedAchievements)
      ? [...new Set(state.unlockedAchievements.filter((id) => ACHIEVEMENT_MAP[id]))]
      : [];
    state.critCount = Number.isFinite(state.critCount) ? Math.max(0, Math.floor(state.critCount)) : 0;
    state.brinkSurvived = Boolean(state.brinkSurvived);
    // Титул: только открытый титул, иначе сбрасываем.
    state.currentTitle = unlockedTitles(state).some((a) => a.title === state.currentTitle) ? state.currentTitle : null;

    // Счётчик выполненных контрактов доски (сами контракты живут
    // в state.weekQuests.list — едином списке для доски и журнала).
    state.contractsDone = Number.isFinite(state.contractsDone) ? Math.max(0, Math.floor(state.contractsDone)) : 0;

    if (!state.weekQuests || typeof state.weekQuests !== "object" || !Array.isArray(state.weekQuests.list)) {
      state.weekQuests = { weekStartDay: 0, format: WEEK_QUEST_FORMAT, list: [] };
    }
    state.weekQuests.weekStartDay = Number.isFinite(state.weekQuests.weekStartDay) ? state.weekQuests.weekStartDay : 0;
    // Старый формат (отдельный state.huntContracts) перегенерируется
    // в ensureWeekQuests() ниже.
    state.weekQuests.format = Number.isFinite(state.weekQuests.format) ? state.weekQuests.format : 0;
    delete state.huntContracts;
    // Сюжетные квесты: активные — { id, progress, status }, завершённые — идентификаторы.
    if (!Array.isArray(state.activeStoryQuests)) state.activeStoryQuests = [];
    state.activeStoryQuests = state.activeStoryQuests
      .filter((q) => q && typeof q === "object" && STORY_QUEST_MAP[q.id])
      .map((q) => {
        const def = STORY_QUEST_MAP[q.id];
        const target = def.objectives.kill ? 1 : def.objectives.count;
        const progress = Number.isFinite(q.progress) ? Math.max(0, Math.min(target, Math.floor(q.progress))) : 0;
        return { id: q.id, progress, status: q.status === "done" || q.status === "claimed" ? q.status : "active" };
      });
    if (!Array.isArray(state.completedStoryQuests)) state.completedStoryQuests = [];
    state.completedStoryQuests = state.completedStoryQuests.filter((id) => STORY_QUEST_MAP[id]);
    delete state.quests;
    delete state.npcQuests;
    ensureWeekQuests();
    return { ok: true };
  } catch (err) {
    // Сырой текст сохранения возвращается наверх: main.js успевает сделать
    // backup до того, как saveState() перезапишет повреждённый слот.
    state = defaultState();
    return { ok: false, raw, error: String(err && err.message ? err.message : err) };
  }
}

function saveState() {
  try {
    // _craftPity и _hunterBattle — внутрисессионные (сбрасываются при перезагрузке).
    storage.set(SAVE_KEY, JSON.stringify(state, (key, value) => (key === "_statsCache" || key === "_statsRev" || key === "_invRev" || key === "_craftPity" || key === "_hunterBattle" ? undefined : value)));
  } catch (err) {}
}
function resetState() { state = defaultState(); saveState(); }
function getEquippedItem(slot) {
  const uid = state.equipped[slot];
  if (!uid) return null;
  const inst = getInstance(uid);
  return inst ? { ...inst, item: ITEMS[inst.id] } : null;
}

function getInstance(uid) { return state.owned.find((inst) => inst.uid === uid) || null; }

function addItemInstance(id, durability = DURABILITY_MAX, rarity = null) {
  const itemRarity = rarity && RARITY_TIERS[rarity] ? rarity : rollRarity();
  const inst = { uid: generateUid(), id, durability, rarity: itemRarity, affix: generateAffix(itemRarity), unique: null, upgrade: null };
  if (itemRarity === "legendary" && UNIQUE_EFFECTS.length) {
    inst.unique = UNIQUE_EFFECTS[Math.floor(Math.random() * UNIQUE_EFFECTS.length)].id;
  }
  state.owned.push(inst);
  invalidateStats();
  return inst;
}

function rollRarity(bonus = 0) {
  const r = Math.random() - bonus;
  const p1 = RARITY_TIERS.legendary.chance;
  const p2 = p1 + RARITY_TIERS.epic.chance;
  const p3 = p2 + RARITY_TIERS.rare.chance;
  const p4 = p3 + RARITY_TIERS.uncommon.chance;
  if (r < p1) return "legendary";
  if (r < p2) return "epic";
  if (r < p3) return "rare";
  if (r < p4) return "uncommon";
  return "common";
}

function generateAffix(rarity) {
  if (rarity === "common" || !AFFIXES.length) return null;
  const tier = RARITY_TIERS[rarity] || RARITY_TIERS.common;
  const affix = AFFIXES[Math.floor(Math.random() * AFFIXES.length)];
  const count = Math.max(1, tier.bonusCount || 1);
  const bonuses = [];
  for (let i = 0; i < count; i++) {
    const spec = affix.stats[Math.floor(Math.random() * affix.stats.length)];
    const value = spec.min + Math.floor(Math.random() * (spec.max - spec.min + 1));
    const existing = bonuses.find((b) => b.id === spec.id);
    if (existing) existing.value += value;
    else bonuses.push({ id: spec.id, value });
  }
  return { id: affix.id, name: affix.name, bonuses };
}

function getInstanceStats(instance) {
  const item = instance ? ITEMS[instance.id] : null;
  const out = { atk: 0, def: 0, hp: 0, mana: 0, crit: 0, dodge: 0, block: 0, str: 0, end: 0, agi: 0, int: 0 };
  if (!item) return out;
  const tier = RARITY_TIERS[instance.rarity] || RARITY_TIERS.common;
  const mult = tier.mult || 1;
  for (const key of ["atk", "def", "hp", "mana", "crit", "dodge"]) {
    if (item[key]) out[key] = Math.round(item[key] * mult);
  }
  if (item.damage) {
    out.damage = {};
    for (const style of STYLE_ORDER) {
      out.damage[style] = Math.max(0, Math.round((item.damage[style] || 0) * mult));
    }
  }
  out.block = item.block || 0;
  if (instance.affix && Array.isArray(instance.affix.bonuses)) {
    for (const b of instance.affix.bonuses) {
      if (b && b.id in out && Number.isFinite(b.value)) out[b.id] += Math.round(b.value * mult);
    }
  }
  // Бонусы улучшения (Этап 2) — плоские, не зависят от редкости.
  const path = upgradePathForItem(item);
  if (path && instance.upgrade) {
    const level = Number(instance.upgrade.level) || 0;
    if (level > 0) {
      // Ювелирная ветка: stat определяет, что растёт за ВСЕ уровни —
      // крит (+2/ур) или уворот (+1/ур). Прочее: атака/защита ветки.
      const gains = path.id === "jewelry"
        ? { [instance.upgrade.stat === "dodge" ? "dodge" : "crit"]: instance.upgrade.stat === "dodge" ? UPGRADE_PER_LEVEL.jewelry.dodge : UPGRADE_PER_LEVEL.jewelry.crit }
        : UPGRADE_PER_LEVEL[path.id];
      for (const [statKey, perLevel] of Object.entries(gains)) {
        out[statKey] += perLevel * level;
      }
    }
  }
  if (instance.unique === "swift") out.dodge += 5;
  if (instance.unique === "lucky") out.crit += 5;
  return out;
}

function equippedUniques() {
  const ids = [];
  for (const uid of Object.values(state.equipped)) {
    const inst = uid ? getInstance(uid) : null;
    if (inst && inst.unique && !isBroken(inst)) ids.push(inst.unique);
  }
  return ids;
}

function generateUid() {
  state.nextUid = Number.isFinite(state?.nextUid) ? state.nextUid : 1;
  let uid;
  do { uid = `item_${state.nextUid++}`; } while (state.owned?.some((inst) => inst.uid === uid));
  return uid;
}

function durabilityOf(inst) { return inst && Number.isFinite(inst.durability) ? inst.durability : DURABILITY_MAX; }
function isBroken(inst) { return false; }

function wearEquipment(amount = DURABILITY_LOSS_PER_FIGHT) {
  return [];
}

function gearBonuses() {
  const total = { atk: 0, def: 0, hp: 0, mana: 0, crit: 0, dodge: 0, block: 0, str: 0, end: 0, agi: 0, int: 0 };
  for (const [slotId, uid] of Object.entries(state.equipped)) {
    const inst = uid ? getInstance(uid) : null;
    if (!inst || isBroken(inst)) continue;
    const s = getInstanceStats(inst);
    for (const key of Object.keys(total)) {
      let value = s[key] || 0;
      if (key === "atk" && slotId === "offhand" && ITEMS[inst.id]?.slot === "mainhand") value *= 0.5;
      total[key] += value;
    }
  }
  return total;
}

// ── Бонусы активных сетов и пар ────────────────────────────────────────────
// Пороги брони: 2/4/6/8 слотов; пар: 2/2. Считаем надетые id (Set — чтобы
// два одинаковых кольца не закрывали пару), битые вещи не в счёт, как в
// gearBonuses(). Возвращает активные сеты и сумму бонусов.
const SET_BONUS_KEYS = ["dodge", "blockZones", "maxHpMult", "maxHpFlat", "damageReduction", "crit", "atkMult", "lifesteal", "goldBonus", "lootChance", "manaBonus", "hpRegen", "def", "counterBonus"];

function activeSetBonuses() {
  const totals = {};
  for (const key of SET_BONUS_KEYS) totals[key] = (key === "maxHpMult" || key === "atkMult") ? 1 : 0;
  const activeSets = [];
  if (typeof SETS === "undefined" || !state || !state.equipped) return { activeSets, ...totals };

  const wornIds = new Set();
  for (const uid of Object.values(state.equipped)) {
    if (!uid) continue;
    const inst = getInstance(uid);
    if (!inst || isBroken(inst)) continue;
    wornIds.add(inst.id);
  }

  for (const [setId, set] of Object.entries(SETS)) {
    if (!set || !Array.isArray(set.items) || !set.items.length) continue;
    let count = 0;
    for (const itemId of set.items) if (wornIds.has(itemId)) count++;
    if (count < 2) continue;
    const reached = Object.keys(set.bonuses || {})
      .map(Number)
      .filter((threshold) => count >= threshold)
      .sort((a, b) => a - b);
    for (const threshold of reached) {
      for (const [key, value] of Object.entries(set.bonuses[threshold] || {})) {
        if (!(key in totals) || !Number.isFinite(value)) continue;
        if (key === "maxHpMult" || key === "atkMult") totals[key] *= value;
        else totals[key] += value;
      }
    }
    activeSets.push({
      id: setId,
      name: set.name,
      type: set.type || null,
      pair: Boolean(set.pair),
      tier: set.tier || 1,
      count,
      size: set.items.length,
      threshold: reached.length ? reached[reached.length - 1] : 0,
      nextThreshold: Object.keys(set.bonuses || {}).map(Number).sort((a, b) => a - b).find((t) => count < t) || null,
    });
  }
  return { activeSets, ...totals };
}
if (typeof window !== "undefined") window.activeSetBonuses = activeSetBonuses;

function activeCompanion() {
  if (!state || !state.companion) return null;
  return COMPANION_MAP[state.companion] || null;
}

// Компаньоны остаются с героем, пока он платит ежедневное жалование.
function companionExpiryDay() { return 0; }
function companionDaysLeft() { return 0; }
function expireCompanion() { return false; }

function companionAffinityInfo(companionId) {
  const companion = COMPANION_MAP[companionId];
  const levels = companion && Array.isArray(companion.affinityLevels) && companion.affinityLevels.length
    ? companion.affinityLevels
    : COMPANION_AFFINITY_LEVELS;
  const value = Math.max(0, Math.min(1000, Number(state.affinity?.[companionId]) || 0));
  let index = 0;
  for (let i = 0; i < levels.length; i += 1) {
    if (value >= levels[i].min) index = i;
  }
  const rank = levels[index] || levels[0];
  const next = levels[index + 1] || null;
  const span = next ? Math.max(1, next.min - rank.min) : 1;
  const percent = next ? Math.max(0, Math.min(100, Math.round(((value - rank.min) / span) * 100))) : 100;
  return { value, rank, index, next, nextMin: next ? next.min : null, percent };
}

function companionAffinityLevel(companionId) {
  return companionAffinityInfo(companionId).rank;
}

const AFFINITY_ACCUSATIVE = {
  "Незнакомка": "Незнакомкой",
  "Подруга": "Подругой",
  "Близкая": "Близкой",
  "Родная душа": "Родной душой",
};

function addAffinity(companionId, amount, opts = {}) {
  const companion = COMPANION_MAP[companionId];
  if (!companion || !Number.isFinite(Number(amount))) return null;
  if (!state.affinity || typeof state.affinity !== "object") state.affinity = {};
  const before = companionAffinityInfo(companionId);
  const value = Math.max(0, Math.min(1000, before.value + Math.round(Number(amount))));
  state.affinity[companionId] = value;
  invalidateStats();
  const after = companionAffinityInfo(companionId);
  if (!opts.silent && after.index > before.index && typeof toast === "function") {
    const accusative = AFFINITY_ACCUSATIVE[after.rank.name] || after.rank.name;
    toast(`${companion.name} теперь считает вас ${accusative}!`, "ok");
  }
  return { before, after, gained: value - before.value, levelUp: after.index > before.index };
}

function companionHireCost(companionId) {
  const companion = COMPANION_MAP[companionId];
  if (!companion) return { base: 0, price: 0, discount: 0, affinityDiscount: 0 };
  const base = (Number(companion.baseHireCost) || 500) + (Math.max(1, state.level) - 1) * 50;
  const weekly = typeof companionDiscountToday === "function" ? companionDiscountToday() : 0;
  const affinityDiscount = Math.max(0, Number(state.hireDiscounts?.[companionId]) || 0);
  const discount = Math.min(0.5, weekly + affinityDiscount);
  return { base, price: Math.max(1, Math.round(base * (1 - discount))), discount, affinityDiscount, weekly };
}

function companionWage(companionId) {
  const companion = COMPANION_MAP[companionId];
  if (!companion) return 0;
  const level = companionAffinityLevel(companionId);
  return Math.max(1, Math.round((Number(companion.dailyWage) || 50) * (Number(level.wageMult) || 1)));
}

function companionMultipliers() {
  const companion = activeCompanion();
  if (!companion) return { hp: 1, mana: 1, damage: 1 };
  const bonus = Number(companionAffinityLevel(companion.id).bonus) || 0;
  if (companion.buff === "hp") return { hp: 1.1 + bonus, mana: 1, damage: 1 };
  if (companion.buff === "mana") return { hp: 1, mana: 1.1 + bonus, damage: 1 };
  if (companion.buff === "damage") return { hp: 1, mana: 1, damage: 1.1 + bonus };
  if (companion.buff === "hybrid") return { hp: 1.05 + bonus, mana: 1 + bonus, damage: 1.05 + bonus };
  return { hp: 1, mana: 1, damage: 1 };
}

function companionBuffMultiplier(stat) {
  let mult = 1;
  for (const buff of state.companionBuffs || []) {
    if (buff && buff.stat === stat && Number.isFinite(buff.mult) && buff.days > 0) mult *= buff.mult;
  }
  return mult;
}

// Уникальные баффы компаньонов: еда Миры, песня Альвы, снаряжение Сольвейг.
function applyCompanionBuff(kind) {
  const companion = activeCompanion();
  if (!companion) return null;
  const randomOf = (list) => list[Math.floor(Math.random() * list.length)];
  let stat = null;
  let mult = 1.2;
  let label = "";
  if (kind === "mira_food") {
    stat = randomOf(["str", "end", "agi"]);
    label = `+20% к ${stat === "str" ? "силе" : stat === "end" ? "выносливости" : "ловкости"}`;
  } else if (kind === "alva_song") {
    stat = randomOf(["maxHp", "maxMana"]);
    label = stat === "maxHp" ? "+20% к максимуму HP" : "+20% к максимуму маны";
  } else if (kind === "solveig_gear") {
    stat = state.archetype === "monk" ? "def" : randomOf(["damage", "def"]);
    mult = 1.05;
    label = stat === "damage" ? "+5% к урону" : "+5% к защите";
  } else {
    return null;
  }
  const id = `${kind}:${stat}`;
  state.companionBuffs = (state.companionBuffs || []).filter((buff) => buff.id !== id);
  state.companionBuffs.push({ id, source: kind, stat, mult, label, days: 1 });
  invalidateStats();
  return { companion, stat, mult, label, text: `${companion.name}: ${label} на день.` };
}

function tickCompanionBuffs() {
  if (!Array.isArray(state.companionBuffs)) { state.companionBuffs = []; return; }
  state.companionBuffs = state.companionBuffs
    .map((buff) => ({ ...buff, days: (Number(buff.days) || 1) - 1 }))
    .filter((buff) => buff.days > 0);
  invalidateStats();
}

// Ежедневное жалование. Если золота не хватает — компаньон уходит.
function chargeCompanionWage() {
  const companion = activeCompanion();
  if (!companion) return { paid: false, left: false, wage: 0 };
  const wage = companionWage(companion.id);
  if ((state.gold || 0) >= wage) {
    state.gold -= wage;
    if (typeof toast === "function") toast(`${companion.name}: ${wage} 💰 жалования.`, "info");
    return { paid: true, left: false, wage };
  }
  state.companion = null;
  state.companionDay = 0;
  state.companionBuffs = [];
  invalidateStats();
  if (typeof toast === "function") toast(`${companion.name} уходит: нечем платить ${wage} 💰.`, "warn");
  return { paid: false, left: true, wage };
}

function archetypeMods(archetypeId = state?.archetype) {
  return ARCHETYPE_MAP[archetypeId]?.mods || BASE_ARCHETYPE_MODS;
}

// ── Достижения (глобальные пассивные бонусы) ────────────────────────────────
// Сумма бонусов обычных (не-титульных) ачивок для stats() и rollDrops.
// Титулы (поле `race`) сюда не попадают — их бонусы считает titleBonusVsMob.
function achievementBonuses(s = state) {
  const out = { atk: 0, crit: 0, dodge: 0, hp: 0, loot: 0 };
  const unlocked = (s && s.unlockedAchievements) || [];
  for (const id of unlocked) {
    const ach = ACHIEVEMENT_MAP[id];
    if (!ach || !ach.bonus || typeof ach.bonus !== "object") continue;
    if (ach.race) continue; // титулы: только против своей расы
    for (const [key, value] of Object.entries(ach.bonus)) {
      if (key in out && Number.isFinite(value)) out[key] += value;
    }
  }
  return out;
}

// Открытые титулы (достижения с полем `title`).
function unlockedTitles(s = state) {
  const unlocked = (s && s.unlockedAchievements) || [];
  return ACHIEVEMENTS.filter((a) => a.title && unlocked.includes(a.id));
}

// Бонусы титулов против конкретного врага (по id моба). Проверка расы —
// строго по списку id: драконид не считается кобольдом и т.п.
function titleBonusVsMob(s, enemyId) {
  const out = { atk: 0, dmgPct: 0, crit: 0, dodge: 0 };
  const unlocked = (s && s.unlockedAchievements) || [];
  for (const id of unlocked) {
    const ach = ACHIEVEMENT_MAP[id];
    if (!ach || !ach.race || !ach.bonus) continue;
    const raceIds = ACH_RACE_IDS[ach.race];
    if (!raceIds || !raceIds.includes(enemyId)) continue;
    for (const [key, value] of Object.entries(ach.bonus)) {
      if (key in out && Number.isFinite(value)) out[key] += value;
    }
  }
  return out;
}

// Выбор носимого титула. Сохраняется строка названия в state.currentTitle.
function selectTitle(title) {
  const ach = unlockedTitles(state).find((a) => a.title === title);
  if (!ach) return { ok: false, text: "Этот титул ещё не открыт." };
  state.currentTitle = ach.title;
  saveState();
  return { ok: true, text: `Титул надет: «${ach.title}».` };
}

// Проверяет условия и выдаёт новые ачивки. Возвращает список открытых сейчас;
// вызывающий код (бой/уровень/крит) отвечает за тосты и saveState.
function checkAchievements(target = state) {
  if (!target || !target.unlockedAchievements) target.unlockedAchievements = [];
  const newly = [];
  for (const ach of ACHIEVEMENTS) {
    if (target.unlockedAchievements.includes(ach.id)) continue;
    let ok = false;
    try { ok = Boolean(ach.condition(target)); } catch (err) { ok = false; }
    if (ok) newly.push(ach);
  }
  if (newly.length) {
    for (const ach of newly) target.unlockedAchievements.push(ach.id);
    // Бонусы повышают maxHp/maxMana — даём прирост сразу, HP не теряем.
    if (target === state) {
      const before = stats();
      invalidateStats();
      applyVitalsDelta(before, stats());
    }
    // Тосты о новых ачивках. checkAchievements живёт в state.js без DOM,
    // поэтому печатаем через ui-хук, если он уже загружен.
    if (target === state && typeof toast === "function") {
      for (const ach of newly) toast(`🏆 Достижение получено: ${ach.name}!`, "ok");
    }
  }
  return newly;
}

function activeArchetype() {
  return state?.archetype ? ARCHETYPE_MAP[state.archetype] || null : null;
}

function stats() {
  if (state._statsCache && state._statsCache.rev === (state._statsRev || 0)) return state._statsCache.value;
  const gear = gearBonuses(); const companion = activeCompanion(); const mult = companionMultipliers();
  const setBonus = activeSetBonuses();
  const mods = archetypeMods();
  const ach = achievementBonuses();
  const tal = { atk: 0, crit: 0, def: 0, dodge: 0, hp: 0, hpRegen: 0, lootChance: 0, maxEnergy: 0, counterOnDodge: 0, armorPierce: 0, lifesteal: 0, secondWind: 0 };
  for (const [talentId, rank] of Object.entries(state.talents || {})) {
    const t = TALENT_MAP[talentId];
    if (!t || !rank || t.active) continue; // активные навыки — умения: пассивного стата не дают
    tal[t.stat] = (tal[t.stat] || 0) + t.value * rank;
  }
  const attrWithBuff = (value, stat) => Math.max(value, Math.ceil(value * companionBuffMultiplier(stat)));
  // «Сон на камнях»: −20% ко всем атрибутам ДО расчёта производных статов.
  const roughDebuff = (state.tempDebuffs || []).find((d) => d && d.id === "slept_rough");
  const roughMult = roughDebuff ? (Number(roughDebuff.statMult) || 0.8) : 1;
  const a = {
    str: Math.floor(attrWithBuff(state.attrs.str + (gear.str || 0), "str") * roughMult),
    agi: Math.floor(attrWithBuff(state.attrs.agi + (gear.agi || 0), "agi") * roughMult),
    end: Math.floor(attrWithBuff(state.attrs.end + (gear.end || 0), "end") * roughMult),
    int: Math.floor((state.attrs.int + (gear.int || 0)) * roughMult),
  };
  const chestInst = state.equipped.chest ? getInstance(state.equipped.chest) : null;
  const chestArmorType = chestInst ? ITEMS[chestInst.id]?.armorType : null;
  const mainInst = state.equipped.mainhand ? getInstance(state.equipped.mainhand) : null;
  const mainWeapon = mainInst ? ITEMS[mainInst.id] : null;

  const maxHp = Math.round((BASE_STATS.hp + a.end * 10 + gear.hp + tal.hp + ach.hp + setBonus.maxHpFlat) * mult.hp * mods.maxHp * setBonus.maxHpMult * companionBuffMultiplier("maxHp"));
  const maxMana = Math.round((BASE_STATS.mana + a.int * 10 + gear.mana + setBonus.manaBonus) * mult.mana * companionBuffMultiplier("maxMana"));
  let atkMult = mult.damage * mods.atk * tempDebuffMultiplier("damage") * setBonus.atkMult * companionBuffMultiplier("damage");
  if (state.archetype === "duelist" && mainWeapon?.handed === "1h") atkMult *= 1.3;
  const monkBonus = state.archetype === "monk" ? a.str * 1 + a.agi * 1 : 0;
  const atk = Math.ceil((BASE_STATS.damage + a.str * 1 + monkBonus + gear.atk + tal.atk + ach.atk) * atkMult);

  let def = Math.round((gear.def + tal.def + setBonus.def) * tempDebuffMultiplier("def") * companionBuffMultiplier("def"));
  if (state.archetype === "guardian" && chestArmorType === "cloth") def = Math.round(def * 0.9);
  let hpRegen = (tal.regen || 0) + setBonus.hpRegen;
  if (companion?.id === "mira") hpRegen += Math.max(1, Math.floor(maxHp * 0.02));

  const crit = Math.min(BASE_STATS.critCap, a.agi * AGILITY_CRIT_PERCENT + gear.crit + tal.crit + ach.crit + setBonus.crit);
  let dodge = Math.min(mods.dodgeCap, a.agi * AGILITY_DODGE_PERCENT + gear.dodge + tal.dodge + ach.dodge + setBonus.dodge);
  if (state.archetype === "assassin" && chestArmorType === "plate") dodge = Math.round(dodge * 0.8);
  const counter = Math.min(COUNTERATTACK_CAP, a.agi * AGILITY_COUNTER_PERCENT + setBonus.counterBonus);
  const blockZones = Math.min(ZONES.length, mods.blockZones + gear.block + setBonus.blockZones);
  const maxEnergy = EXPLORATION_MAX + (state.level - 1) + (tal.maxEnergy || 0);
  const result = { maxHp, maxMana, maxEnergy, atk, def, crit, dodge, counter, blockZones, ragePerHit: mods.ragePerHit, attrs: state.attrs, gearAttrs: { str: gear.str || 0, end: gear.end || 0, agi: gear.agi || 0, int: gear.int || 0 }, gear, companion, companionMult: mult, mods, archetype: activeArchetype(), chestArmorType, mainWeapon,
    hpRegen: hpRegen, counterOnDodge: tal.counterOnDodge || 0, lootChance: (tal.lootChance || 0) + ach.loot + setBonus.lootChance, armorPierce: round1(tal.armorPierce || 0), lifesteal: (tal.lifesteal || 0) + setBonus.lifesteal, secondWind: tal.secondWind || 0,
    setBonuses: setBonus.activeSets, goldBonus: setBonus.goldBonus, damageReduction: setBonus.damageReduction };
  state._statsCache = { rev: state._statsRev || 0, value: result };
  return result;
}

// Множитель активных временных дебаффов (kind: "damage" | "def").
function tempDebuffMultiplier(kind) {
  let mult = 1;
  for (const d of state.tempDebuffs || []) {
    const v = kind === "damage" ? d.damageMult : d.defMult;
    if (Number.isFinite(v)) mult *= v;
  }
  return mult;
}

// Тик дебаффов: уменьшает счётчик дней, удаляет истёкшие.
function tickTempDebuffs() {
  if (!Array.isArray(state.tempDebuffs)) state.tempDebuffs = [];
  state.tempDebuffs = state.tempDebuffs
    .map((d) => ({ ...d, days: (d.days || 1) - 1 }))
    .filter((d) => d.days > 0);
  invalidateStats();
}

function round1(v) { return Math.round(v * 10) / 10; }
function xpNeeded(level) { return 200 + (level - 1) * 40; }
function clampVitals() { const st = stats(); state.hp = Math.max(0, Math.min(state.hp, st.maxHp)); state.mana = Math.max(0, Math.min(state.mana, st.maxMana)); state.energy = Math.max(0, Math.min(state.energy, st.maxEnergy)); }

function applyVitalsDelta(oldStats, newStats) {
  const hpDiff = newStats.maxHp - oldStats.maxHp; const manaDiff = newStats.maxMana - oldStats.maxMana;
  if (hpDiff > 0) state.hp = Math.min(newStats.maxHp, state.hp + hpDiff);
  if (manaDiff > 0) state.mana = Math.min(newStats.maxMana, state.mana + manaDiff);
  clampVitals();
}

function createHero(biography, archetypeId, portrait = "m1", name = "", gender = "male") {
  state.name = (name || "").trim().slice(0, 20) || "Странник";
  state.portrait = PORTRAIT_MAP[portrait] ? portrait : "m1";
  state.gender = gender === "female" ? "female" : "male";
  state.archetype = ARCHETYPE_MAP[archetypeId] ? archetypeId : null;

  state.attrs = { str: 1, agi: 1, end: 1, int: 1 };
  let bonusGold = 0;
  let bonusHp = 0;
  let bonusMana = 0;
  let bonusPotions = 0;

  if (biography && typeof biography === "object") {
    for (const step of BACKGROUND_STEPS) {
      if (step.id === "archetype") continue;
      const optionId = biography[step.id];
      if (!optionId) continue;
      const pool = step.optionsByArchetype
        ? step.optionsByArchetype[state.archetype] || []
        : step.options || [];
      const option = pool.find((o) => o.id === optionId);
      if (!option || !option.effects) continue;
      const eff = option.effects;

      for (const attr of ["str", "agi", "end", "int"]) {
        if (!eff[attr]) continue;
        state.attrs[attr] += Math.min(4, Math.max(0, Number(eff[attr]) || 0));
      }
      if (eff.gold) bonusGold += Number(eff.gold) || 0;
      if (eff.hp) bonusHp += Number(eff.hp) || 0;
      if (eff.mana) bonusMana += Number(eff.mana) || 0;
      // Новый формат — числом (+1 зелье), старый массив id поддержан для сейвов.
      if (Number.isFinite(Number(eff.potions))) {
        bonusPotions += Math.max(0, Number(eff.potions));
      } else if (Array.isArray(eff.potions)) {
        bonusPotions += eff.potions.length;
      }
    }
  }

  // Стартовое снаряжение — только из архетипа, биография вещей не даёт.
  const arch = ARCHETYPE_MAP[state.archetype];
  const startEquipmentIds = arch && Array.isArray(arch.startEquipment)
    ? arch.startEquipment.filter((id) => ITEMS[id])
    : [];

  state.owned = [];
  state.nextUid = 1;
  state.equipped = {
    head: null, neck: null, shoulder: null, back: null,
    chest: null, wrist: null, hands: null, waist: null,
    legs: null, feet: null, ring1: null, ring2: null,
    trinket1: null, trinket2: null, mainhand: null, offhand: null
  };

  for (const id of startEquipmentIds) {
    const item = ITEMS[id];
    if (!item) continue;
    const inst = { uid: generateUid(), id, durability: DURABILITY_MAX, rarity: "common", affix: null, unique: null, upgrade: null };
    state.owned.push(inst);
    const slot = targetSlotFor(item, inst);
    if (slot) state.equipped[slot] = inst.uid;
  }

  state.gold = 60 + bonusGold;
  state.potions = { hp_small: bonusPotions, hp_big: 0, mana_small: 0 };
  state.created = true;
  state.points = 0;
  state.phase = 0;
  state.day = 1;
  state.companion = null;
  state.companionDay = 0;
  state.affinity = Object.fromEntries(COMPANIONS.map((c) => [c.id, 0]));
  state.hireDiscounts = {};
  state.companionBuffs = [];
  state.energy = EXPLORATION_MAX;

  invalidateStats();
  const st = stats();
  state.hp = st.maxHp + bonusHp;
  state.mana = st.maxMana + bonusMana;
  clampVitals();

  state.weekQuests = { weekStartDay: 0, format: WEEK_QUEST_FORMAT, list: [] };
  ensureWeekQuests(true);
  saveState();
}

function addAttr(attr) {
  if (!(attr in state.attrs)) return { ok: false, text: "Неизвестный атрибут." };
  if (state.points <= 0) return { ok: false, text: "Нет свободных очков." };
  const oldStats = stats(); state.attrs[attr] += 1; state.points -= 1; invalidateStats(); const newStats = stats();
  applyVitalsDelta(oldStats, newStats); saveState();
  return { ok: true, text: `Атрибут повышен. Осталось очков: ${state.points}.` };
}

function gainXp(amount) {
  const result = { levels: [], xp: amount, points: 0, talentPoints: 0 }; state.xp += amount;
  while (state.xp >= xpNeeded(state.level)) {
    state.xp -= xpNeeded(state.level); state.level += 1; state.points += LEVEL_ATTR_POINTS; result.points += LEVEL_ATTR_POINTS; result.levels.push(state.level);
    if (state.level % 3 === 0) { state.talentPoints = (state.talentPoints || 0) + 1; result.talentPoints += 1; }
  }
  if (result.levels.length) { invalidateStats(); const st = stats(); state.hp = st.maxHp; state.mana = st.maxMana; checkAchievements(state); }
  return result;
}

function learnTalent(talentId) {
  const talent = TALENT_MAP[talentId];
  if (!talent) return { ok: false, text: "Талант не найден." };
  const rank = (state.talents ||= {})[talentId] || 0;
  if (rank >= talent.maxRank) return { ok: false, text: `«${talent.name}» изучен на максимум.` };
  if (!Number.isFinite(state.talentPoints) || state.talentPoints <= 0) return { ok: false, text: "Нет очков таланта. Они даются каждые 3 уровня." };
  state.talentPoints -= 1;
  const oldStats = stats();
  state.talents[talentId] = rank + 1;
  invalidateStats();
  applyVitalsDelta(oldStats, stats()); saveState();
  return { ok: true, text: `Талант «${talent.name}» изучен: ранг ${state.talents[talentId]}/${talent.maxRank}.` };
}

function weekAnchorDay(day = state.day) {
  const wd = calendarInfo(day).weekdayIndex;
  return Math.max(1, day - wd);
}

function ensureWeekQuests(force = false) {
  if (!state.weekQuests || !Array.isArray(state.weekQuests.list)) {
    state.weekQuests = { weekStartDay: 0, format: WEEK_QUEST_FORMAT, list: [] };
  }
  const anchor = weekAnchorDay();
  if (force || state.weekQuests.weekStartDay !== anchor || state.weekQuests.format !== WEEK_QUEST_FORMAT) {
    generateWeekQuests(anchor);
  }
}

function generateWeekQuests(anchor) {
  const floorId = Math.max(1, state.maxFloor);
  const floor = FLOORS.find((f) => f.id === floorId);
  const list = [];
  let index = 0;

  const addQuest = (q) => { list.push({ status: "offered", progress: 0, done: false, ...q }); };
  const mobIcon = (mobId) => {
    const mob = findMobDef(mobId);
    return mob ? mob.icon : "";
  };

  // Недельный заказ Ивана — ровно тот, что висит на доске. Доска и журнал
  // читают один и тот же объект из state.weekQuests.list.
  const weeklyPool = HUNT_CONTRACTS
    .filter((c) => c.type === "weekly" && c.floorId <= floorId)
    .sort((a, b) => b.floorId - a.floorId);
  const weekly = weeklyPool[0] || null;
  if (weekly) {
    addQuest({
      id: `wq_${anchor}_${index++}`,
      type: "kill", source: "board", npc: "ivan", floorId: weekly.floorId,
      contractId: weekly.id,
      mobId: weekly.mobId, mobName: findMobName(weekly.mobId), mobIcon: mobIcon(weekly.mobId),
      target: weekly.target,
      gold: weekly.gold,
      xp: weekly.xp,
      potions: 0,
      rep: weekly.rep || 2, faction: "hunters",
      desc: weekly.desc || "",
    });
  } else if (floor && floor.mobs?.length) {
    // Страховка, если для этажа нет шаблона недельного заказа.
    const mob = floor.mobs[Math.floor(Math.random() * floor.mobs.length)];
    addQuest({
      id: `wq_${anchor}_${index++}`,
      type: "kill", source: "board", npc: "ivan", floorId,
      mobId: mob.id, mobName: mob.name, mobIcon: mob.icon,
      target: 10,
      gold: Math.max(1, Math.floor(mob.gold * 10 * GOLD_DROP_MULT * 2)),
      xp: Math.max(1, Math.floor(mob.xp * 10 * 2)),
      potions: 0,
      rep: 1, faction: "hunters",
    });
  }

  // Контракты на охоту с доски — тоже часть единого списка.
  const huntPool = HUNT_CONTRACTS.filter((c) => c.type !== "weekly" && c.floorId <= floorId);
  const shuffled = [...huntPool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  for (const def of shuffled.slice(0, 2)) {
    addQuest({
      id: `wq_${anchor}_${index++}`,
      type: "hunt", source: "board", npc: null, floorId: def.floorId,
      contractId: def.id,
      mobId: def.mobId, mobName: findMobName(def.mobId), mobIcon: mobIcon(def.mobId),
      target: def.target,
      gold: def.gold,
      xp: def.xp,
      potions: 0,
      rep: def.rep || 1, faction: "hunters",
      desc: def.desc || "",
    });
  }

  for (const npc of ["ron", "elain", "elize"]) {
    const pool = (FLOOR_RESOURCES[floorId] || []).filter((r) => r.npc === npc);
    if (!pool.length) continue;
    const res = pool[Math.floor(Math.random() * pool.length)];
    addQuest({
      id: `wq_${anchor}_${index++}`,
      type: "resource", source: "npc", npc, floorId,
      resId: res.id, resName: res.name, resIcon: res.icon,
      target: 20,
      gold: res.sellPrice * 20 * 2,
      xp: Math.max(1, Math.floor(res.sellPrice * 20 * 1.2)),
      potions: npc === "elain" ? 2 : 0,
    });
  }

  state.weekQuests = { weekStartDay: anchor, format: WEEK_QUEST_FORMAT, list };
  saveState();
}

function acceptWeekQuest(npcOrId) {
  ensureWeekQuests();
  const q = state.weekQuests.list.find((x) => x.id === npcOrId) ||
    state.weekQuests.list.find((x) => x.npc === npcOrId);
  if (!q) return { ok: false, text: "Мне нечего вам предложить." };
  if (q.status !== "offered") return { ok: false, text: "Задание уже взято." };
  q.status = "active";
  saveState();
  const goal = q.type === "resource" ? `собрать ${q.resName}` : `истребить ${q.mobName}`;
  return { ok: true, text: `Задание принято: ${goal} ×${q.target}.` };
}

function checkQuestProgress(mobId) {
  ensureWeekQuests();
  let changed = false;
  // Единый список: и недельный заказ Ивана (kill), и контракты доски (hunt)
  // обновляются здесь — доска и журнал показывают один и тот же прогресс.
  for (const q of state.weekQuests.list) {
    if ((q.type === "kill" || q.type === "hunt") && q.status === "active" && q.mobId === mobId && q.progress < q.target) {
      q.progress += 1;
      if (q.progress >= q.target) { q.progress = q.target; q.done = true; q.status = "done"; }
      changed = true;
    }
  }
  if (changed) saveState();
  checkStoryQuestKill(mobId);
}

// ── Доска объявлений Зала Охотников ─────────────────────────────────────────
// Доска и журнал читают один и тот же state.weekQuests.list: type "kill" —
// недельный заказ Ивана, type "hunt" — контракты на охоту. Взять —
// acceptWeekQuest(id), прогресс — checkQuestProgress (выше), сдать —
// claimNpcQuest(id).

function huntFloorName(floorId) {
  const floor = FLOORS.find((f) => f.id === floorId);
  return floor ? floor.name : `этаж ${floorId}`;
}

function claimNpcQuest(id) {
  ensureWeekQuests();
  const q = state.weekQuests.list.find((x) => x.id === id);
  if (!q) return { ok: false, text: "Задание не найдено." };
  if (q.status === "claimed") return { ok: false, text: "Награда уже получена." };
  if (q.status !== "done") return { ok: false, text: "Задание ещё не выполнено." };

  if (q.type === "resource") {
    const have = state.resources[q.resId] || 0;
    if (have < q.target) return { ok: false, text: "Не хватает ресурсов." };
    state.resources[q.resId] = have - q.target;
  }

  q.status = "claimed";
  state.gold += q.gold;
  const up = gainXp(q.xp);
  if (q.potions > 0) state.potions["hp_small"] = (state.potions["hp_small"] || 0) + q.potions;
  if (q.source === "board") state.contractsDone = (state.contractsDone || 0) + 1;

  // Репутация: контракты доски — Гильдии Охотников, заказы NPC — своей
  // фракции. Размер награды берётся из q.rep (1 по умолчанию).
  const faction = (q.faction && FACTION_MAP[q.faction]) || factionForNpc(q.npc);
  const repGain = Number.isFinite(q.rep) ? q.rep : 1;
  let repNote = "";
  let factionLevelUp = null;
  if (faction) {
    const repBefore = state.reputation[faction.id] || 0;
    const tierBefore = factionTier(repBefore).tier;
    const repAfter = repBefore + repGain;
    state.reputation[faction.id] = repAfter;
    if (state.reputation[faction.id] >= FACTION_TIERS[2].min) state.factionPerksUnlocked[faction.id] = true;
    const tierAfter = factionTier(repAfter).tier;
    repNote = ` Репутация ${faction.name}: ${repAfter}.`;
    if (tierAfter !== tierBefore) {
      // Флаг «новость ещё не показана» — UI тост гасит его.
      state.factionNotified[faction.id] = true;
      factionLevelUp = {
        faction: faction.id,
        name: faction.name,
        icon: faction.icon,
        tier: tierAfter.name,
        text: `${faction.icon} ${faction.name}: новый тир «${tierAfter.name}» — скидка ${Math.round(tierAfter.discount * 100)}%!`,
      };
    }
  }

  saveState();
  const levelText = up.levels.length ? ` Новый уровень: ${up.levels.join(", ")}!` : "";
  return { ok: true, text: `Задание сдано: +${q.gold} 💰, +${q.xp} ✦${q.potions > 0 ? `, +${q.potions} 🧪` : ""}.${levelText}${repNote}`, factionLevelUp };
}

function weekQuestResourceGain(resId, amount) {
  ensureWeekQuests();
  let changed = false;
  for (const q of state.weekQuests.list) {
    if (q.type === "resource" && q.status === "active" && q.resId === resId && q.progress < q.target) {
      q.progress = Math.min(q.target, q.progress + amount);
      if (q.progress >= q.target) { q.done = true; q.status = "done"; }
      changed = true;
    }
  }
  if (changed) saveState();
  checkStoryQuestResource(resId, amount);
}

// ── Единый ход репутации фракции (Блок 6) ───────────────────────────────────
// Возвращает { rep, tierBefore, tierAfter, factionLevelUp } или null, если
// фракции нет. Флаг perk и «новость о тире» выставляются как в квестах.
function addFactionRep(factionId, amount) {
  const faction = FACTION_MAP[factionId];
  if (!faction || !Number.isFinite(amount) || amount === 0) return null;
  state.reputation = state.reputation || normalizeFactionMap({}, 0);
  const repBefore = state.reputation[factionId] || 0;
  const tierBefore = factionTier(repBefore).tier;
  state.reputation[factionId] = repBefore + amount;
  if (state.reputation[factionId] >= FACTION_TIERS[2].min) {
    state.factionPerksUnlocked = state.factionPerksUnlocked || {};
    state.factionPerksUnlocked[factionId] = true;
  }
  const tierAfter = factionTier(state.reputation[factionId]).tier;
  let factionLevelUp = null;
  if (tierAfter !== tierBefore) {
    // Флаг «новость ещё не показана» — UI-тост гасит его.
    state.factionNotified = state.factionNotified || {};
    state.factionNotified[factionId] = true;
    factionLevelUp = { faction: factionId, name: faction.name };
  }
  return { rep: state.reputation[factionId], tierBefore, tierAfter, factionLevelUp };
}

// ── Сюжетные квесты (Этап 2) ───────────────────────────────────────────────
// Активные хранятся как { id, progress, status } в state.activeStoryQuests;
// для ресурсных заданий прогресс считается напрямую из state.resources.

function findMobDef(mobId) {
  for (const f of FLOORS) {
    const mob = (f.mobs || []).find((m) => m.id === mobId);
    if (mob) return mob;
    if (f.boss && f.boss.id === mobId) return f.boss;
  }
  return null;
}

function findMobName(mobId) {
  const mob = findMobDef(mobId);
  return mob ? mob.name : mobId;
}

function findResName(resId) {
  for (const pool of Object.values(FLOOR_RESOURCES)) {
    const res = pool.find((x) => x.id === resId);
    if (res) return res.name;
  }
  return resId;
}

function storyQuestTarget(def) {
  return def.objectives.kill ? 1 : def.objectives.count;
}

function storyQuestProgress(entry) {
  const def = STORY_QUEST_MAP[entry.id];
  if (!def) return { progress: 0, target: 0 };
  const target = storyQuestTarget(def);
  const progress = def.objectives.kill
    ? Math.min(target, entry.progress || 0)
    : Math.min(target, state.resources[def.objectives.res] || 0);
  return { progress, target };
}

function availableStoryQuestForNpc(npcId) {
  return STORY_QUESTS.find((q) =>
    q.npc === npcId &&
    (state.maxFloor || 1) >= (q.reqFloor || 1) &&
    !state.completedStoryQuests.includes(q.id) &&
    !state.activeStoryQuests.some((a) => a.id === q.id)
  ) || null;
}

function activeStoryQuestForNpc(npcId) {
  return state.activeStoryQuests.find((a) => {
    const def = STORY_QUEST_MAP[a.id];
    return def && def.npc === npcId;
  }) || null;
}

function acceptStoryQuest(qId) {
  const def = STORY_QUEST_MAP[qId];
  if (!def) return { ok: false, text: "Задание не найдено." };
  if (state.completedStoryQuests.includes(qId)) return { ok: false, text: "Это задание уже выполнено." };
  if (state.activeStoryQuests.some((a) => a.id === qId)) return { ok: false, text: "Задание уже взято." };
  state.activeStoryQuests.push({ id: qId, progress: 0, status: "active" });
  saveState();
  const targetTxt = def.objectives.kill
    ? `убить: ${findMobName(def.objectives.kill)}`
    : `собрать ${findResName(def.objectives.res)} ×${def.objectives.count}`;
  return { ok: true, text: `Задание принято: ${targetTxt}.` };
}

function checkStoryQuestKill(mobId) {
  let changed = false;
  for (const entry of state.activeStoryQuests) {
    const def = STORY_QUEST_MAP[entry.id];
    if (!def || !def.objectives.kill || def.objectives.kill !== mobId) continue;
    if (entry.status !== "active" || entry.progress >= 1) continue;
    entry.progress = 1;
    entry.status = "done";
    changed = true;
  }
  if (changed) saveState();
}

function checkStoryQuestResource(resId, amount) {
  if (!amount) return;
  let changed = false;
  for (const entry of state.activeStoryQuests) {
    const def = STORY_QUEST_MAP[entry.id];
    if (!def || !def.objectives.res || def.objectives.res !== resId) continue;
    if (entry.status !== "active") continue;
    const target = def.objectives.count;
    const progress = Math.min(target, state.resources[resId] || 0);
    entry.status = progress >= target ? "done" : "active";
    changed = true;
  }
  if (changed) saveState();
}

function claimStoryQuest(qId) {
  const def = STORY_QUEST_MAP[qId];
  if (!def) return { ok: false, text: "Задание не найдено." };
  const entry = state.activeStoryQuests.find((a) => a.id === qId);
  if (!entry) return { ok: false, text: "Задание не взято." };
  if (entry.status === "claimed") return { ok: false, text: "Награда уже получена." };
  const { progress, target } = storyQuestProgress(entry);
  if (progress < target) return { ok: false, text: "Задание ещё не выполнено." };

  // Ресурсные задания списывают собранное.
  if (def.objectives.res) {
    state.resources[def.objectives.res] = Math.max(0, (state.resources[def.objectives.res] || 0) - target);
  }

  const reward = def.reward || {};
  state.gold += reward.gold || 0;
  const up = gainXp(reward.xp || 0);
  const texts = [`+${reward.gold || 0} 💰`, `+${reward.xp || 0} ✦`];

  if (reward.potions) {
    state.potions["hp_small"] = (state.potions["hp_small"] || 0) + reward.potions;
    texts.push(`+${reward.potions} 🧪`);
  }
  if (reward.item && ITEMS[reward.item]) {
    const item = ITEMS[reward.item];
    const count = reward.itemCount || 1;
    if (item.slot === "potion") {
      state.potions[reward.item] = (state.potions[reward.item] || 0) + count;
      texts.push(`${itemEmoji(item)} ${item.name} ×${count}`);
    } else {
      for (let i = 0; i < count; i++) addItemInstance(reward.item, DURABILITY_MAX, "rare");
      texts.push(`${itemEmoji(item)} ${item.name}${count > 1 ? ` ×${count}` : ""}`);
    }
  }
  if (reward.recipe && RECIPE_MAP[reward.recipe] && !state.knownRecipes.includes(reward.recipe)) {
    state.knownRecipes.push(reward.recipe);
    texts.push(`📜 Рецепт: ${RECIPE_MAP[reward.recipe].desc}`);
  }

  // Репутация фракции NPC (стелла/иван не состоят во фракциях).
  const faction = factionForNpc(def.npc);
  let repNote = "";
  let factionLevelUp = null;
  const repGain = reward.rep || 1;
  if (faction) {
    const repBefore = state.reputation[faction.id] || 0;
    const tierBefore = factionTier(repBefore).tier;
    const repAfter = repBefore + repGain;
    state.reputation[faction.id] = repAfter;
    if (state.reputation[faction.id] >= FACTION_TIERS[2].min) state.factionPerksUnlocked[faction.id] = true;
    const tierAfter = factionTier(repAfter).tier;
    repNote = ` Репутация ${faction.name}: ${repAfter}.`;
    if (tierAfter !== tierBefore) {
      state.factionNotified[faction.id] = true;
      factionLevelUp = {
        faction: faction.id,
        name: faction.name,
        icon: faction.icon,
        tier: tierAfter.name,
        text: `${faction.icon} ${faction.name}: новый тир «${tierAfter.name}» — скидка ${Math.round(tierAfter.discount * 100)}%!`,
      };
    }
  }

  entry.status = "claimed";
  state.activeStoryQuests = state.activeStoryQuests.filter((a) => a.id !== qId);
  state.completedStoryQuests.push(qId);
  saveState();
  const levelText = up.levels.length ? ` Новый уровень: ${up.levels.join(", ")}!` : "";
  return { ok: true, text: `Задание сдано: ${texts.join(", ")}. ${levelText}${repNote}`.trim(), factionLevelUp };
}

function exploreFloor(floorId) {
  if (typeof playFootstep === "function") playFootstep("floor", floorId);
  const reason = towerClosedReason();
  if (reason) return { ok: false, text: reason };

  const floor = FLOORS.find((f) => f.id === floorId);
  if (!floor) return { ok: false, text: "Этаж не найден." };
  if (state.activeSceneId) return { ok: false, text: "Сначала разберитесь с активной сценой." };
  if (state.activeNpcId) return { ok: false, text: "Сначала закончите разговор." };

  state.floorProgress = state.floorProgress || {};
  const progressBefore = state.floorProgress[floor.id] || 0;
  if (progressBefore >= 100) return { ok: false, text: "Этаж исследован полностью. Вызовите босса или ищите боя." };

  state.energy -= FIGHT_ENERGY_COST;
  state.floorProgress[floor.id] = progressBefore;

  // Процедурное событие: ~15% шанс, с кулдауном. Показываем модалку и прерываем исследование.
  const rolledEvent = rollEvent(floor.id, state);
  if (rolledEvent) {
    state.activeEvent = rolledEvent;
    saveState();
    return { ok: true, text: rolledEvent.text, event: true };
  }

  // Спонтанное событие этажа (Блок 6): ~15% шанс со своим кулдауном.
  // Разрывает обычное исследование и открывает модалку выбора действий.
  const floorEvent = rollFloorEvent(floor.id, state);
  if (floorEvent) {
    state.activeFloorEvent = { eventId: floorEvent.id, floorId: floor.id };
    saveState();
    return { ok: true, text: `Случайная встреча: «${floorEvent.title}».`, floorEvent: true };
  }

  // Уникальное событие компаньона: 10% за исследование.
  const companion = activeCompanion();
  if (companion && Math.random() < COMPANION_EVENT_CHANCE) {
    const pool = COMPANION_EVENTS.filter((e) => e.companion === companion.id);
    if (pool.length) {
      const ev = pool[Math.floor(Math.random() * pool.length)];
      state.activeFloorEvent = { eventId: ev.id, floorId: floor.id, companion: companion.id };
      saveState();
      return { ok: true, text: `${companion.icon} ${companion.name}: «${ev.title}»`, floorEvent: true };
    }
  }

  const gainProgress = (amount) => {
    state.floorProgress[floor.id] = Math.min(100, state.floorProgress[floor.id] + amount);
  };
  const progressText = () => ` Прогресс этажа: ${state.floorProgress[floor.id]}%.`;
  
  const rollChestLoot = () => {
    const pool = FLOOR_RESOURCES[floor.id] || [];
    if (!pool.length) return null;
    const res = pool[Math.floor(Math.random() * pool.length)];
    const amount = Math.floor(Math.random() * (res.maxAmount - res.minAmount + 1)) + res.minAmount;
    state.resources[res.id] = (state.resources[res.id] || 0) + amount;
    weekQuestResourceGain(res.id, amount);
    return `${res.name} ×${amount}`;
  };
  const randomMobIndex = () => Math.floor(Math.random() * floor.mobs.length);

  const roll = Math.random();
  let text = "";
  let encounter = null;
  let scene = false;
  let npc = false;

  if (roll < 0.20) {
    gainProgress(1);
    text = `Вы осторожно продвигаетесь.${progressText()}`;
  } else if (roll < 0.35) {
    const loot = rollChestLoot();
    gainProgress(2);
    text = loot ? `Вы нашли укрытый сундук: ${loot}.${progressText()}` : `Вы нашли укрытый сундук, но он пуст.${progressText()}`;
  } else if (roll < 0.50) {
    const loot = rollChestLoot();
    gainProgress(2);
    const mobIndex = randomMobIndex();
    encounter = { floorId: floor.id, mobIndex };
    text = `В сундуке ${loot ? `лежало: ${loot}. ` : "ничего. "}Но его охранял ${floor.mobs[mobIndex].name}!`;
  } else if (roll < 0.70) {
    gainProgress(1);
    const mobIndex = randomMobIndex();
    encounter = { floorId: floor.id, mobIndex };
    text = `На вас напал патруль: ${floor.mobs[mobIndex].name}!`;
  } else if (roll < 0.80) {
    if (Math.random() < 0.2 && NPCS.arthur) {
      state.activeNpcId = NPCS.arthur.id;
      npc = true;
      text = `Из тени вышел ${NPCS.arthur.name} и поманил вас пальцем.`;
    } else {
      gainProgress(1);
      text = `Вы осторожно продвигаетесь.${progressText()}`;
    }
  } else if (roll < 0.90) {
    const pool = FLOOR_SCENES[floor.id] || [];
    const picked = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    if (picked) {
      state.activeSceneId = picked.id;
      state.activeSceneFloorId = floor.id;
      scene = true;
      text = `Вы наткнулись на нечто: «${picked.title}».`;
    } else {
      text = "Вы наткнулись на развилку. Кажется, отсюда можно было уйти глубже.";
    }
  } else {
    gainProgress(1);
    text = `Вы осторожно продвигаетесь.${progressText()}`;
  }

  if (state.floorProgress[floor.id] >= 100 && progressBefore < 100) {
    text += " Этаж исследован полностью — босс пробудился!";
  }

  saveState();
  return { ok: true, text, encounter, scene, npc };
}

function getTraderInventory() {
  const stock = [
    { kind: "potion", id: "hp_small", name: ITEMS.hp_small.name, icon: itemEmoji(ITEMS.hp_small), price: Math.round(ITEMS.hp_small.price * TRADER_PRICE_MULT) },
    { kind: "potion", id: "mana_small", name: ITEMS.mana_small.name, icon: itemEmoji(ITEMS.mana_small), price: Math.round(ITEMS.mana_small.price * TRADER_PRICE_MULT) },
  ];
  
  // Берем только оружие и броню, доступные на текущем максимальном этаже
  const gearPool = Object.values(ITEMS).filter((i) => 
    i.slot && i.slot !== "potion" && Number.isFinite(i.price) && shopFloorFor(i) <= state.maxFloor
  );
  
  if (gearPool.length) {
    const pick = gearPool[Math.floor(Math.random() * gearPool.length)];
    // Создаем экземпляр с обычной редкостью (чтобы в магазине не было видно аффиксов)
    const inst = addItemInstance(pick.id, DURABILITY_MAX, "common");
    // Цена х3 от базовой
    const price = Math.round(pick.price * 3);
    stock.push({ kind: "gear", uid: inst.uid, inst, price });
  }
  return stock;
}

function sellResource(resId) {
  const res = ALL_RESOURCES.find(r => r.id === resId);
  if (!res) return { ok: false, text: "Такого ресурса нет." };
  const have = state.resources[resId] || 0;
  if (have <= 0) return { ok: false, text: "Нечего продавать." };

  const gold = have * res.sellPrice;
  state.gold += gold;
  state.resources[resId] = 0;
  saveState();

  return { ok: true, text: `Продано ${have} × ${res.name} за ${gold} 💰.` };
}

function phaseInfo() { return TIME_PHASES[state.phase] || TIME_PHASES[0]; }
function isNight() { return !phaseInfo().towerOpen; }
function phaseLabel() { const phase = phaseInfo(); return `${phase.icon} ${phase.name} · День ${state.day}`; }
function isLeapYear(year) { if (year % 400 === 0) return true; if (year % 100 === 0) return false; return year % 4 === 0; }
function daysInMonth(year, month) { if (month === 2) return isLeapYear(year) ? 29 : 28; const m = MONTHS[month - 1]; return m ? m.days : 30; }
function daysInYear(year) { return isLeapYear(year) ? 366 : 365; }

function calendarInfo(day = state.day) {
  let remaining = Math.max(0, day - 1); let year = CALENDAR_START.year; let month = CALENDAR_START.month; let dayOfMonth = CALENDAR_START.day;
  while (true) {
    const monthLen = daysInMonth(year, month); const leftInMonth = monthLen - dayOfMonth;
    if (remaining <= leftInMonth) { dayOfMonth += remaining; remaining = 0; break; }
    remaining -= leftInMonth + 1; dayOfMonth = 1; month += 1; if (month > 12) { month = 1; year += 1; }
  }
  const totalDays = day - 1; const weekdayIndex = (WEEKDAY_OF_START - 1 + totalDays) % 7; const weekday = WEEKDAYS[weekdayIndex];
  return { year, month, monthName: MONTHS[month - 1].name, monthShort: MONTHS[month - 1].short, dayOfMonth, weekday, weekdayIndex, day, isLeap: isLeapYear(year) };
}

function calendarLabel(day = state.day) { const c = calendarInfo(day); return `${c.dayOfMonth} ${c.monthName} ${c.year} · ${c.weekday.short}`; }
function calendarLongLabel(day = state.day) { const c = calendarInfo(day); return `${c.weekday.name}, ${c.dayOfMonth} ${c.monthName} ${c.year} года`; }

function advancePhase() {
  state.phase += 1;
  let nightMessage = null;

  // Наступление ночи: сон в гостинице восстанавливает полностью, сон
  // на улице — только половину и вешает дебафф «Сон на камнях».
  if (state.phase === 3) {
    const inHotel = typeof view !== "undefined" && view.screen === "hotel";
    if (inHotel) {
      const st = stats();
      state.hp = st.maxHp;
      state.mana = st.maxMana;
      state.energy = st.maxEnergy;
    } else {
      state.tempDebuffs = (state.tempDebuffs || []).filter((d) => d && d.id !== "slept_rough");
      state.tempDebuffs.push({
        id: "slept_rough",
        name: "Сон на камнях",
        icon: "🪨",
        // Ночь уже закончилась, а tickTempDebuffs() сработает при переходе
        // в утро. days: 2 → после тика останется 1 день действия.
        days: 2,
        desc: "-20% ко всем статам (Сила, Ловкость, Выносливость, Интеллект) на день.",
        statMult: 0.8,
      });
      invalidateStats();
      const st = stats();
      state.hp = Math.max(1, Math.round(st.maxHp * 0.5));
      state.mana = Math.round(st.maxMana * 0.5);
      state.energy = Math.max(1, Math.round(st.maxEnergy * 0.5));
      nightMessage = "Вы поспали на холодных камнях. Спина ноет, мышцы забиты.";
    }
  }

  if (state.phase >= TIME_PHASES.length) {
    state.phase = 0;
    state.day += 1;
    ensureWeekQuests();
    tickTempDebuffs();
    tickCompanionBuffs();
    chargeCompanionWage();
  }
  expireCompanion();
  invalidateStats();
  clampVitals(); saveState();
  if (nightMessage && typeof toast === "function") toast(nightMessage, "warn");
  return phaseInfo();
}

function towerClosedReason() {
  if (isNight()) return "Ночью Башня закрыта. Дождитесь утра в Йорстеде.";
  if (state.energy < FIGHT_ENERGY_COST) return "Энергия на исходе. Отдохните в Йорстеде или снимите номер в гостинице.";
  return null;
}

function freeRest() {
  const st = stats();
  const gain = FREE_REST_AMOUNT; const before = state.energy;
  state.energy = Math.min(st.maxEnergy, state.energy + gain); const phase = advancePhase(); const restored = state.energy - before;
  return { ok: true, restored, phase, text: restored > 0 ? `Отдых: +${restored} энергии. ${phase.icon} ${phase.name}, день ${state.day}.` : `Энергия уже полна. ${phase.icon} ${phase.name}, день ${state.day}.` };
}

function hotelRest() {
  if (state.gold < HOTEL_PRICE) return { ok: false, text: `Не хватает золота: нужно ${HOTEL_PRICE} 💰.` };
  state.gold -= HOTEL_PRICE; state.day += 1; state.phase = 0;
  expireCompanion();
  tickTempDebuffs();
  tickCompanionBuffs();
  chargeCompanionWage();
  const st = stats(); state.hp = st.maxHp; state.mana = st.maxMana; state.energy = st.maxEnergy;
  ensureWeekQuests(); saveState();
  return { ok: true, text: `Номер оплачен. HP, мана и энергия восстановлены. ${phaseLabel()}.` };
}

function hireCompanion(companionId) {
  const companion = COMPANION_MAP[companionId];
  if (!companion) return { ok: false, text: "Такой спутницы здесь нет." };
  const current = activeCompanion();
  if (current?.id === companion.id) return { ok: false, text: `${companion.name} уже с вами. Жалование: ${companionWage(companion.id)} 💰/день.` };
  const cost = companionHireCost(companion.id);
  if (state.gold < cost.price) return { ok: false, text: `Не хватает золота: нужно ${cost.price} 💰.` };
  // Найм теперь идёт через разговор: сначала условия, потом оплата.
  const dialogId = companion.hireDialog || `hire_${companion.id}`;
  if (typeof view !== "undefined") {
    view.hiringCompanion = companion.id;
    view.talkNpc = companion.id;
    view.talkNpcText = null;
    view.dialogNode = dialogId;
  }
  return { ok: true, companion, openDialog: true, dialogId, cost, text: `${companion.name} готова обсудить условия.` };
}

// Подтверждение найма после диалога. Списывает золото и активирует компаньона.
function finalizeCompanionHire(companionId) {
  const companion = COMPANION_MAP[companionId];
  if (!companion) return { ok: false, text: "Такой спутницы здесь нет." };
  const current = activeCompanion();
  if (current?.id === companion.id) return { ok: false, text: `${companion.name} уже с вами.` };
  const cost = companionHireCost(companion.id);
  if (state.gold < cost.price) return { ok: false, text: `Не хватает золота: нужно ${cost.price} 💰.` };
  const oldStats = stats();
  const previous = current;
  state.gold -= cost.price;
  state.companion = companion.id;
  state.companionDay = state.day;
  state.companionBuffs = [];
  if (state.hireDiscounts) delete state.hireDiscounts[companion.id];
  invalidateStats();
  applyVitalsDelta(oldStats, stats());
  saveState();
  const replaced = previous && previous.id !== companion.id ? ` ${previous.name} уступает место.` : "";
  const sale = cost.discount > 0 ? ` (скидка ${Math.round(cost.discount * 100)}%)` : "";
  return {
    ok: true,
    companion,
    text: `${companion.name} с вами. Жалование: ${companionWage(companion.id)} 💰/день.${replaced} Оплачено ${cost.price} 💰${sale}.`,
  };
}

function spendFightEnergy() {
  const reason = towerClosedReason(); if (reason) return { ok: false, text: reason };
  state.energy -= FIGHT_ENERGY_COST; saveState(); return { ok: true };
}

function canDrinkPotion(id) {
  const item = ITEMS[id]; if (!item || item.type !== "potion") return false;
  if ((state.potions[id] || 0) <= 0) return false;
  const st = stats(); if (item.effect === "hp" && state.hp >= st.maxHp) return false; if (item.effect === "mana" && state.mana >= st.maxMana) return false;
  return true;
}

function drinkPotion(id) {
  const item = ITEMS[id]; if (!item) return { ok: false, text: "Неизвестное зелье." };
  if ((state.potions[id] || 0) <= 0) return { ok: false, text: "Зелья не осталось." };
  const st = stats(); let healed = 0;
  if (item.effect === "hp") { healed = Math.min(item.amount, st.maxHp - state.hp); state.hp += healed; } else { healed = Math.min(item.amount, st.maxMana - state.mana); state.mana += healed; }
  if (healed <= 0) return { ok: false, text: "Показатель уже полон." };
  state.potions[id] -= 1; invalidateStats(); saveState();
  return { ok: true, healed, text: `${item.name}: +${healed} ${item.effect === "hp" ? "HP" : "маны"}.` };
}

function sellPotion(id) {
  const item = ITEMS[id]; if (!item || item.type !== "potion") return { ok: false, text: "Это не зелье." };
  if ((state.potions[id] || 0) <= 0) return { ok: false, text: "Зелья не осталось." };
  const price = sellPrice(item);
  state.potions[id] -= 1; state.gold += price; saveState();
  return { ok: true, text: `Продано: ${item.name} (+${price} золота).` };
}

function sellPrice(item, inst = null) {
  let base = item.price * 0.5;
  if (inst && inst.rarity) {
    const tier = RARITY_TIERS[inst.rarity];
    if (tier) base *= tier.sellMult || 1;
  }
  return Math.max(1, Math.floor(base));
}
function isEquipped(uid) { return Object.values(state.equipped).includes(uid); }

function rollRecipeDrop(floorId, isBoss = false, chance = 0.05) {
  if (!Array.isArray(state.knownRecipes)) state.knownRecipes = [];
  const depth = Number(floorId) || 1;
  const known = new Set(state.knownRecipes);
  const pool = RECIPES.filter((r) => r.floor <= depth && !known.has(r.id));
  if (!pool.length) return null;
  if (!isBoss && Math.random() >= chance) return null;

  const recipe = pool[Math.floor(Math.random() * pool.length)];
  state.knownRecipes.push(recipe.id);
  return recipe;
}

function rollDrops(enemyDef) {
  const loot = [];
  const floorId = enemyDef.floorId || state.maxFloor;
  const floorResources = FLOOR_RESOURCES[floorId] || [];
  let drops = Array.isArray(enemyDef?.drops) ? enemyDef.drops : [];
  const mobRarity = enemyDef?.rarity || "common";
  const lootMult = 1 + (stats().lootChance || 0) / 100;

  state.resources = state.resources || {};
  state.potions = state.potions || {};
  state.owned = state.owned || [];

  if (mobRarity === "elite") {
    const ownResources = drops.filter((d) => d.kind !== "item" && ALL_RESOURCES.some((r) => r.id === d.id));
    const pool = ownResources.length
      ? ownResources
      : (FLOOR_RESOURCES[enemyDef.floorId] || []).map((r) => ({ id: r.id, chance: 1, min: 1, max: 2 }));
    if (pool.length) {
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      drops = [...drops, { id: chosen.id, chance: 1, min: 1, max: 2 }];
    }
  }

  for (const drop of drops) {
    const chance = Number(drop.chance) || 0;
    if (Math.random() >= Math.min(1, chance * lootMult)) continue;

    const min = Math.max(1, Number(drop.min) || 1);
    const max = Math.max(min, Number(drop.max) || min);
    const amount = min + Math.floor(Math.random() * (max - min + 1));

    if (drop.kind !== "item" && ALL_RESOURCES.some((r) => r.id === drop.id)) {
      if (mobRarity === "common" && !enemyDef.boss && floorResources.length > 0) {
        const randomRes = floorResources[Math.floor(Math.random() * floorResources.length)];
        const resAmount = Math.floor(Math.random() * (randomRes.maxAmount - randomRes.minAmount + 1)) + randomRes.minAmount;
        state.resources[randomRes.id] = (state.resources[randomRes.id] || 0) + resAmount;
        weekQuestResourceGain(randomRes.id, resAmount);
        loot.push({
          id: randomRes.id,
          name: randomRes.name,
          icon: randomRes.icon,
          amount: resAmount,
          kind: "resource",
        });
      } else {
        const resource = ALL_RESOURCES.find((r) => r.id === drop.id);
        if (resource) {
          state.resources[drop.id] = (state.resources[drop.id] || 0) + amount;
          weekQuestResourceGain(drop.id, amount);
          loot.push({
            id: drop.id,
            name: resource.name,
            icon: resource.icon,
            amount,
            kind: "resource",
          });
        }
      }
      continue;
    }

    const item = ITEMS[drop.id];
    if (!item) {
      console.warn("Неизвестный id дропа:", drop.id);
      continue;
    }

    if (item.slot === "potion") {
      state.potions[drop.id] = (state.potions[drop.id] || 0) + amount;
      loot.push({
        id: drop.id,
        name: item.name,
        icon: item.icon,
        amount,
        kind: "potion",
      });
      continue;
    }

    for (let n = 0; n < amount; n++) {
      const itemRarity = rollRarity(mobRarity === "elite" ? ELITE_RARITY_BONUS : 0);
      const inst = addItemInstance(drop.id, DURABILITY_MAX, itemRarity);
      loot.push({
        uid: inst.uid,
        id: drop.id,
        name: getItemDisplayName(inst),
        icon: item.icon,
        amount: 1,
        kind: "equipment",
      });
    }
  }

  const recipeChance = mobRarity === "elite" ? ELITE_REWARDS.recipeChance : mobRarity === "rare" ? RARE_REWARDS.recipeChance : 0.05;
  const recipe = rollRecipeDrop(enemyDef?.floorId, Boolean(enemyDef?.boss), recipeChance);
  if (recipe) {
    loot.push({
      id: recipe.id,
      name: `Рецепт: ${recipe.desc}`,
      icon: "📜",
      amount: 1,
      kind: "recipe",
    });
  }

  return loot;
}

function lootLabel(entry) {
  return `${entry.name}${entry.amount > 1 ? ` ×${entry.amount}` : ""}`;
}

function lootText(loot) {
  return loot.map(lootLabel).join(", ");
}

function itemScore(item, slotId = null, instance = null) {
  if (!item) return -1;
  const s = instance ? getInstanceStats(instance) : item;
  const atk = s.atk || 0;
  const effectiveAtk = slotId === "offhand" && item.slot === "mainhand" ? atk * 0.5 : atk;
  const base = effectiveAtk * 2 + (s.def || 0) * 1.5 + (s.hp || 0) * 0.12 + (s.crit || 0) * 0.25 + (s.dodge || 0) * 0.25 + (s.mana || 0) * 0.12 + (s.block || 0) * 8
    + (s.str || 0) * 1.5 + (s.end || 0) * 0.25 + (s.agi || 0) * 0.5 + (s.int || 0) * 0.25;
  return instance && isBroken(instance) ? base * 0.3 : base;
}

function isShield(item) { return item?.slot === "offhand" && (item.block || 0) > 0; }

function canEquipInSlot(item, slotId) {
  if (!item || item.slot === "potion") return false;
  const slot = SLOTS.find((s) => s.id === slotId);
  if (!slot) return false;
  if (!slot.accepts.includes(item.slot)) return false;
  if (state?.archetype === "monk" && (slotId === "mainhand" || slotId === "offhand")) return false;
  if (state?.archetype === "assassin" && slotId === "offhand") {
    if (isShield(item)) return false;
    return item.slot === "mainhand" || item.slot === "offhand";
  }
  const mainUid = state?.equipped?.mainhand;
  const mainItem = mainUid ? ITEMS[getInstance(mainUid)?.id] : null;
  if (slotId === "offhand" && mainItem?.handed === "2h") {
    if (!(state?.archetype === "guardian" && mainItem.weaponType === "spear")) return false;
  }
  return true;
}

function slotsForItem(item) { return SLOTS.filter((s) => canEquipInSlot(item, s.id)).map((s) => s.id); }

function targetSlotFor(item, instance = null) {
  const candidates = slotsForItem(item); if (!candidates.length) return null;
  if (candidates.includes(item.slot)) {
    const native = item.slot;
    const eqInst = state.equipped[native] ? getInstance(state.equipped[native]) : null;
    if (!eqInst || itemScore(item, native, instance) > itemScore(ITEMS[eqInst.id], native, eqInst)) return native;
  }
  const empty = candidates.find((slot) => !state.equipped[slot]); if (empty) return empty;
  let weakest = candidates[0];
  for (const slot of candidates) {
    const a = state.equipped[slot] ? getInstance(state.equipped[slot]) : null;
    const b = state.equipped[weakest] ? getInstance(state.equipped[weakest]) : null;
    if (itemScore(a ? ITEMS[a.id] : null, slot, a) < itemScore(b ? ITEMS[b.id] : null, weakest, b)) weakest = slot;
  }
  return weakest;
}

// ── Цены лавок (Этап 1) ────────────────────────────────────────────────────
// Канонический priceFor.id — priceFor(item, shop) — считается только здесь.
// Дневная скидка рынка и репутационная скидка фракции учитываются по
// максимальной из двух (не складываются).
function factionDiscount(factionId) {
  if (!factionId) return 0;
  const rep = state && state.reputation ? (state.reputation[factionId] || 0) : 0;
  return factionTier(rep).tier.discount;
}

function priceFor(item, shop = "forge") {
  let discount = 0;
  if (shop === "alchemy") discount = alchemyDiscountToday();
  else if (shop === "forge") discount = forgeDiscountToday();
  const factionId = SHOP_FACTION[shop];
  if (factionId) discount = Math.max(discount, factionDiscount(factionId));
  const price = Math.max(1, Math.round(item.price * (1 - discount)));
  return { price, old: item.price, hasDiscount: discount > 0, discount };
}

function buyItem(id, shop = "forge") {
  const item = ITEMS[id]; if (!item) return { ok: false, text: "Товар не найден." };
  const p = priceFor(item, shop);
  const discount = p.discount;
  const price = p.price;
  if (state.gold < price) return { ok: false, text: "Не хватает золота." };

  if (item.slot === "potion") {
    state.gold -= price; state.potions[id] = (state.potions[id] || 0) + 1; saveState();
    const sale = discount > 0 ? ` (скидка ${Math.round(discount * 100)}%)` : "";
    return { ok: true, text: `Куплено: ${item.name} за ${price} 💰${sale}.` };
  }

  const oldStats = stats(); state.gold -= price;
  const inst = addItemInstance(id, DURABILITY_MAX, "common");
  const slot = targetSlotFor(item, inst);
  const eqInst = slot && state.equipped[slot] ? getInstance(state.equipped[slot]) : null;
  const better = slot && itemScore(item, slot, inst) > itemScore(eqInst ? ITEMS[eqInst.id] : null, slot, eqInst);
  if (better) state.equipped[slot] = inst.uid;
  invalidateStats();
  const newStats = stats(); applyVitalsDelta(oldStats, newStats); saveState();
  const sale = discount > 0 ? ` (скидка ${Math.round(discount * 100)}%)` : "";
  return { ok: true, text: better ? `Куплено и надето: ${getItemDisplayName(inst)} за ${price} 💰${sale} (${SLOT_NAME[slot]}).` : `Куплено: ${getItemDisplayName(inst)} за ${price} 💰${sale}. Наденьте в разделе «Герой».` };
}

function craftItem(recipeId) {
  const recipe = getRecipeById(recipeId);
  if (!recipe) return { ok: false, text: "Рецепт не найден." };
  if (!Array.isArray(state.knownRecipes) || !state.knownRecipes.includes(recipeId)) return { ok: false, text: "Этот рецепт ещё не изучен." };

  const item = ITEMS[recipe.result];
  if (!item) return { ok: false, text: "Предмет не найден." };

  state.resources = state.resources || {};
  const missing = [];
  for (const [resId, need] of Object.entries(recipe.materials)) {
    const have = state.resources[resId] || 0;
    if (have < need) {
      const res = ALL_RESOURCES.find((r) => r.id === resId);
      missing.push(`${res ? res.name : resId} ${have}/${need}`);
    }
  }
  if (missing.length) return { ok: false, text: `Не хватает материалов: ${missing.join(", ")}.` };

  for (const [resId, need] of Object.entries(recipe.materials)) {
    state.resources[resId] = Math.max(0, (state.resources[resId] || 0) - need);
  }

  const oldStats = stats();
  // ── Бонус редкости крафта (Блок 5) ──
  // База + шкала уровня + материалы (за каждый свыше двух) + фракционный бонус.
  const matsCount = Object.keys(recipe.materials || {}).length;
  let craftBonus = CRAFT_BASE_BONUS
    + (state.level - 1) * CRAFT_RARITY_BONUS_PER_LEVEL
    + Math.min(CRAFT_MATERIALS_BONUS_MAX, CRAFT_MATERIALS_BONUS * Math.max(0, matsCount - 2));
  const craftFactionId = SHOP_FACTION[recipe.station];
  if (craftFactionId && ((state.reputation || {})[craftFactionId] || 0) >= FACTION_TIERS[2].min) {
    craftBonus += CRAFT_FACTION_BONUS; // тир фракции не ниже «Уважаемого»
  }
  // Pity: 3 common подряд — четвёртый крафт гарантированно uncommon+.
  state._craftPity = state._craftPity || 0;
  let craftRarity;
  if (state._craftPity >= 3) {
    craftRarity = "uncommon";
    state._craftPity = 0;
  } else {
    craftRarity = rollRarity(craftBonus);
    state._craftPity = craftRarity === "common" ? state._craftPity + 1 : 0;
  }
  const inst = addItemInstance(recipe.result, DURABILITY_MAX, craftRarity);
  const slot = targetSlotFor(item, inst);
  const eqInst = slot && state.equipped[slot] ? getInstance(state.equipped[slot]) : null;
  const better = slot && itemScore(item, slot, inst) > itemScore(eqInst ? ITEMS[eqInst.id] : null, slot, eqInst);
  if (better) state.equipped[slot] = inst.uid;
  invalidateStats();
  const newStats = stats();
  applyVitalsDelta(oldStats, newStats);
  saveState();

  const rarityNote = inst.rarity !== "common" ? ` (${RARITY_TIERS[inst.rarity].name})` : "";
  return { ok: true, text: better ? `Создано и надето: ${getItemDisplayName(inst)}${rarityNote} (${SLOT_NAME[slot]}).` : `Создано: ${getItemDisplayName(inst)}${rarityNote}. Наденьте в разделе «Герой».` };
}

function equipItem(uid) {
  const inst = getInstance(uid);
  if (!inst) return { ok: false, text: "Предмета нет в инвентаре." };
  const item = ITEMS[inst.id]; if (!item || item.slot === "potion") return { ok: false, text: "Это нельзя надеть." };
  const slot = targetSlotFor(item, inst); if (!slot) return { ok: false, text: "Для этого предмета нет слота." };
  return equipItemToSlot(uid, slot);
}

function equipItemToSlot(uid, slotId) {
  const slot = SLOTS.find((s) => s.id === slotId);
  const inst = getInstance(uid); const item = inst ? ITEMS[inst.id] : null;
  if (!slot) return { ok: false, text: "Неизвестный слот." };
  if (!item || item.slot === "potion") return { ok: false, text: "Это нельзя надеть." };
  if (!canEquipInSlot(item, slotId)) {
    const reason = state?.archetype === "assassin" && isShield(item)
      ? "Убийца не может носить щиты."
      : `«${item.name}» не подходит для слота «${slot.name}».`;
    return { ok: false, text: reason };
  }
  if (state.equipped[slotId] === uid) return { ok: true, text: "Предмет уже надет." };

  const oldStats = stats(); const previous = state.equipped[slotId];
  const otherSlotId = Object.keys(state.equipped).find((key) => key !== slotId && state.equipped[key] === uid);
  if (otherSlotId) {
    const prevInst = previous ? getInstance(previous) : null;
    const prevItem = prevInst ? ITEMS[prevInst.id] : null;
    state.equipped[otherSlotId] = prevInst && prevItem && canEquipInSlot(prevItem, otherSlotId) ? previous : null;
  }
  state.equipped[slotId] = uid;
  let freedOffhand = false;
  if (slotId === "mainhand" && item.handed === "2h"
    && !(state.archetype === "guardian" && item.weaponType === "spear")
    && state.equipped.offhand) {
    state.equipped.offhand = null;
    freedOffhand = true;
  }
  invalidateStats();
  const newStats = stats(); applyVitalsDelta(oldStats, newStats); saveState();
  return { ok: true, text: `Надето: ${getItemDisplayName(inst)} (${slot.name}).${freedOffhand ? " Левая рука освобождена под двуручное оружие." : ""}` };
}

function unequipSlot(slot) {
  const eq = getEquippedItem(slot);
  if (!eq) return { ok: false, text: "Слот пуст." };
  const oldStats = stats(); state.equipped[slot] = null; invalidateStats(); const newStats = stats(); applyVitalsDelta(oldStats, newStats); saveState();
  return { ok: true, text: `Снято: ${getItemDisplayName(eq)} (${SLOT_NAME[slot] || slot}).` };
}

function sellItem(uid) {
  const inst = getInstance(uid);
  const item = inst ? ITEMS[inst.id] : null;
  if (!inst || !item) return { ok: false, text: "Предмета нет." };
  if (isEquipped(uid)) return { ok: false, text: "Сначала снимите предмет." };
  const price = sellPrice(item); state.owned = state.owned.filter((x) => x !== inst); state.gold += price; invalidateStats(); saveState();
  return { ok: true, text: `Продано: ${getItemDisplayName(inst)} (+${price} золота).` };
}

function sellMultipleItems(itemIds) {
  const list = Array.isArray(itemIds) ? itemIds : [];
  if (!list.length) return { ok: false, text: "Ничего не выбрано." };
  let total = 0; const skipped = [];
  const seen = new Set();

  for (const entry of list) {
    if (seen.has(entry)) continue;
    seen.add(entry);
    const inst = getInstance(entry);
    if (inst) {
      const item = ITEMS[inst.id];
      if (!item) { skipped.push("неизвестный предмет"); continue; }
      if (isEquipped(inst.uid)) { skipped.push("надетое"); continue; }
      total += sellPrice(item, inst);
      state.owned = state.owned.filter((x) => x !== inst);
      continue;
    }
    const item = ITEMS[entry];
    if (item && item.type === "potion") {
      const count = state.potions[entry] || 0;
      if (count <= 0) { skipped.push("пусто"); continue; }
      total += sellPrice(item) * count;
      state.potions[entry] = 0;
    } else {
      skipped.push("лишнее");
    }
  }

  if (total <= 0 && !skipped.length) return { ok: false, text: "Ничего не выбрано." };
  if (total <= 0) return { ok: false, text: "Продать не получилось: выбор не доступен." };
  state.gold = (state.gold || 0) + total;
  invalidateStats();
  saveState();
  const note = skipped.length ? ` (Пропущено: ${skipped.join(", ")})` : "";
  return { ok: true, text: `Продано на ${total} золота.${note}` };
}

// ── Разборка и обмен (Этап 3) ──────────────────────────────────────────────

// Разборка вещи на материалы: возвращает 50% ресурсов рецепта (с округлением вниз).
function salvageItem(uid) {
  const inst = getInstance(uid);
  const item = inst ? ITEMS[inst.id] : null;
  if (!inst || !item) return { ok: false, text: "Предмета нет." };
  if (item.slot === "potion") return { ok: false, text: "Зелья нельзя разобрать." };
  if (isEquipped(uid)) return { ok: false, text: "Сначала снимите предмет." };
  const recipe = RECIPES.find((r) => r.result === inst.id);
  if (!recipe) return { ok: false, text: "Эту вещь нельзя разобрать: рецепт неизвестен." };

  state.owned = state.owned.filter((x) => x !== inst);
  state.resources = state.resources || {};
  const gained = [];
  for (const [resId, need] of Object.entries(recipe.materials)) {
    const amount = Math.floor(need / 2);
    if (amount <= 0) continue;
    state.resources[resId] = (state.resources[resId] || 0) + amount;
    const res = ALL_RESOURCES.find((r) => r.id === resId);
    gained.push(`${res ? res.name : resId} ×${amount}`);
  }
  invalidateStats();
  saveState();
  const note = gained.length ? ` Получено: ${gained.join(", ")}.` : "Материалы не вернулись: рецепт слишком дешёвый.";
  return { ok: true, text: `Разобрано: ${getItemDisplayName(inst)}.${note}` };
}

// Обмен у Рона (Этап 3): 50 любых ресурсов 1-го этажа → 1 редкий ресурс.
function exchangeResources(resId) {
  const pool = FLOOR_RESOURCES[1] || [];
  if (!pool.some((r) => r.id === resId)) return { ok: false, text: "Обменять можно только ресурсы первого этажа." };
  if ((state.resources[resId] || 0) < EXCHANGE_AMOUNT) {
    const name = (pool.find((r) => r.id === resId) || {}).name || resId;
    return { ok: false, text: `${name}: нужно ${EXCHANGE_AMOUNT} штук, есть ${state.resources[resId] || 0}.` };
  }
  state.resources[resId] -= EXCHANGE_AMOUNT;
  state.resources[EXCHANGE_TARGET_RES] = (state.resources[EXCHANGE_TARGET_RES] || 0) + 1;
  saveState();
  const tRes = ALL_RESOURCES.find((r) => r.id === EXCHANGE_TARGET_RES);
  const srcRes = pool.find((r) => r.id === resId);
  return { ok: true, text: `Обмен совершён: ${srcRes ? srcRes.name : resId} ×${EXCHANGE_AMOUNT} → ${tRes ? tRes.name : EXCHANGE_TARGET_RES} ×1.` };
}

// Кража у странствующего торговца (Этап 3): шанс зависит от Ловкости,
// при провале страж забирает 20% золота и выставляет за дверь.
function trySteal(entryId, stock) {
  const entries = Array.isArray(stock) ? stock : [];
  const entry = entries.find((e) => (e.kind === "gear" ? e.uid : e.id) === entryId);
  if (!entry) return { ok: false, fail: false, text: "Этот товар уже исчез." };
  const agi = state.attrs.agi + (stats().gearAttrs?.agi || 0);
  const chance = Math.min(50, agi * 5);
  if (Math.random() >= chance / 100) {
    const penalty = Math.floor((state.gold || 0) * 0.2);
    state.gold = Math.max(0, (state.gold || 0) - penalty);
    saveState();
    return { ok: false, fail: true, penalty, text: `Стража схватила вас за руку! Утрачено ${penalty} 💰, торговец выставил вас за дверь.` };
  }
  let name;
  if (entry.kind === "potion") {
    state.potions = state.potions || {};
    state.potions[entry.id] = (state.potions[entry.id] || 0) + 1;
    name = ITEMS[entry.id] ? ITEMS[entry.id].name : entry.name;
  } else {
    // Снаряжение уже числится в инвентаре (выставляется на продажу экземпляром).
    name = entry.inst && ITEMS[entry.inst.id] ? ITEMS[entry.inst.id].name : "вещь";
  }
  state._invRev = (state._invRev || 0) + 1;
  saveState();
  return { ok: true, text: `Украдено: ${name}! Стража ничего не заметила.` };
}

function trainAttr(trainingId) {
  const training = TRAINING_MAP[trainingId];
  if (!training) return { ok: false, text: "Такой тренировки здесь нет." };
  if (!state.trainingCount) state.trainingCount = { drill: 0, sparring: 0, heavy_lifting: 0 };
  if (typeof view !== "undefined" && view.trainingQTE) {
    return { ok: false, text: "Иван: Сначала закончи текущую тренировку." };
  }
  if ((state.trainingCount[trainingId] || 0) >= (Number(training.cap) || 10)) {
    return { ok: false, text: "Иван: Хватит. Ты уже выжат." };
  }
  if (state.phase !== 0) return { ok: false, text: "Иван: Тренировки только утром." };
  if (state.energy < TRAINING_ENERGY_COST) return { ok: false, text: `Нужно ${TRAINING_ENERGY_COST} ⚡. Отдохните или сходите в Башню.` };

  // Статы и фаза теперь меняются только после QTE в completeTraining().
  state.energy -= TRAINING_ENERGY_COST;
  view.trainingQTE = {
    trainingId,
    sequence: ["left", "right", "strike"],
    currentStep: 0,
    timeLeft: 3.0,
  };
  saveState();
  if (typeof render === "function") render();
  return { ok: true, text: `Тренировка: ${training.name}. Соберись!` };
}

// Завершение QTE-тренировки. success=false — ошибка/таймер: травма,
// потеря HP и одной фазы, без прироста атрибута.
function completeTraining(success = true) {
  const qte = typeof view !== "undefined" ? view.trainingQTE : null;
  const trainingId = qte ? qte.trainingId : null;
  const training = TRAINING_MAP[trainingId];
  if (!training) {
    if (typeof view !== "undefined") view.trainingQTE = null;
    if (typeof render === "function") render();
    return { ok: false, text: "Тренировка не найдена." };
  }
  if (!state.trainingCount) state.trainingCount = { drill: 0, sparring: 0, heavy_lifting: 0 };
  if (!state.abilities) state.abilities = { preciseStrike: false, parry: false };

  const stat = training.stat || training.attr;
  const attrName = ATTR_INFO.find((a) => a.id === stat)?.name || stat;
  const notes = [];

  if (success) {
    const oldStats = stats();
    state.attrs[stat] += 1;
    state.trainingCount[trainingId] = (state.trainingCount[trainingId] || 0) + 1;
    invalidateStats();
    applyVitalsDelta(oldStats, stats());
    notes.push(`Тренировка завершена. ${training.name}: ${attrName} +1.`);

    // Курс из 10 занятий открывает боевую способность.
    if (state.trainingCount[trainingId] >= 10) {
      if (trainingId === "heavy_lifting" && !state.abilities.preciseStrike) {
        state.abilities.preciseStrike = true;
        notes.push('Вы освоили "Точный удар"!');
      }
      if (trainingId === "sparring" && !state.abilities.parry) {
        state.abilities.parry = true;
        notes.push("Вы освоили Парирование!");
      }
    }
  } else {
    state.hp = Math.max(1, state.hp - 20);
    state.tempDebuffs = state.tempDebuffs || [];
    state.tempDebuffs.push({ id: "injury", name: "Травма", icon: "🤕", days: 1, damageMult: 0.8, desc: "-20% к урону на день." });
    notes.push("Иван: Я же говорил, не лезь на рожон.");
  }

  // И успех, и провал сдвигают ровно одну фазу: утро → день.
  advancePhase();
  clampVitals();
  saveState();

  if (typeof view !== "undefined") view.trainingQTE = null;
  const text = notes.join(" ");
  if (typeof toast === "function" && text) toast(text, success ? "ok" : "warn");
  if (typeof render === "function") render();
  return { ok: success, injured: !success, text };
}

function makeCombatSandbox() {
  const st = stats();
  const sandbox = {
    hp: state.hp,
    mana: state.mana,
    maxHp: st.maxHp,
    maxMana: st.maxMana,
    atk: st.atk,
    def: st.def,
    crit: st.crit,
    dodge: st.dodge,
    counter: st.counter,
    blockZones: st.blockZones,
    archetype: state.archetype,
    attrs: { ...state.attrs },
    gearAttrs: { ...st.gearAttrs },
    equipped: { ...state.equipped },
    owned: state.owned.map(inst => ({ ...inst })),
    battle: null,
  };
  return sandbox;
}