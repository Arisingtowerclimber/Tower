const SAVE_KEY = "safe-zone-tower-v2";
const SAVE_VERSION = 8;
const OLD_SLOT_MAP = { weapon: "mainhand", armor: "chest", shield: "offhand" };
const BASE_STATS = { hp: 140, mana: 40, damage: 5, dodgeCap: 35, critCap: 60 };

let state = null;

function defaultState() {
  let uid = 0;
  const inst = (id) => ({ uid: `item_${++uid}`, id, durability: DURABILITY_MAX, rarity: "common", affix: null, unique: null });
  const owned = [inst("rusty_knife"), inst("rags"), inst("worn_hood"), inst("patched_pants"), inst("worn_boots")];
  const uidOf = (id) => owned.find((x) => x.id === id).uid;
  
  return {
    version: SAVE_VERSION, created: false, name: "Странник", portrait: "m1", archetype: null,
    level: 1, xp: 0, points: 0, attrs: { str: 1, agi: 1, end: 1, int: 1 },
    gold: 60, hp: BASE_STATS.hp + 2, mana: BASE_STATS.mana + 2, energy: EXPLORATION_MAX,
    phase: 0, day: 1, companion: null, companionDay: 0,
    potions: { hp_small: 2, hp_big: 0, mana_small: 1 },
    equipped: { 
      head: uidOf("worn_hood"), neck: null, shoulder: null, back: null, 
      chest: uidOf("rags"), wrist: null, hands: null, waist: null, 
      legs: uidOf("patched_pants"), feet: uidOf("worn_boots"), 
      ring1: null, ring2: null, trinket1: null, trinket2: null, 
      mainhand: uidOf("rusty_knife"), offhand: null 
    },
    owned, nextUid: uid + 1, maxFloor: 1, cleared: {}, kills: 0,
    killCount: {}, quests: { day: 0, list: [], claimed: [] },
    resources: {},
    knownRecipes: [],
    npcQuests: { day: 0, list: [] },
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
  saved.version = version;
  return saved;
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) { state = defaultState(); return; }
    const saved = JSON.parse(raw);
    const defaults = defaultState();
    migrateSave(saved, saved.version);

    const equipped = { ...defaults.equipped };
    for (const [slot, id] of Object.entries(saved.equipped || {})) {
      const target = OLD_SLOT_MAP[slot] || slot;
      if (target in equipped) equipped[target] = id;
    }
    const potions = { ...defaults.potions, ...(saved.potions || {}) };
    if (potions.energy_small) { potions.mana_small = (potions.mana_small || 0) + potions.energy_small; delete potions.energy_small; }

    state = { ...defaults, ...saved, version: SAVE_VERSION, attrs: { ...defaults.attrs, ...(saved.attrs || {}) }, potions, equipped, cleared: saved.cleared || {}, resources: saved.resources || {} };

    state.mana = Number.isFinite(state.mana) ? state.mana : defaults.mana;
    state.energy = Number.isFinite(state.energy) ? state.energy : EXPLORATION_MAX;
    state.phase = Number.isFinite(saved.phase) ? Math.max(0, Math.min(TIME_PHASES.length - 1, saved.phase)) : defaults.phase;
    state.day = Number.isFinite(saved.day) ? Math.max(1, saved.day) : defaults.day;
    state.companion = COMPANION_MAP[state.companion] ? state.companion : null;
    state.companionDay = Number.isFinite(state.companionDay) ? state.companionDay : 0;
    if (!PORTRAIT_MAP[state.portrait]) state.portrait = "m1";
    state.archetype = ARCHETYPE_MAP[state.archetype] ? state.archetype : null;

    // ── Инвентарь: UID-экземпляры ──────────────────────────────────────────
    if (!Array.isArray(state.owned)) state.owned = [];
    // Миграция старого формата (v6 и ниже): owned — массив id, прочность в карте state.durability.
    if (state.owned.some((x) => typeof x === "string")) {
      const oldDurability = state.durability || {};
      const ids = state.owned.filter((x) => typeof x === "string" && ITEMS[x]);
      // Надетые id из старого формата тоже превращаем в экземпляры.
      for (const val of Object.values(state.equipped)) {
        if (typeof val === "string" && ITEMS[val] && !ids.includes(val)) ids.push(val);
      }
      state.owned = ids.map((id) => ({ uid: generateUid(), id, durability: Number.isFinite(oldDurability[id]) ? oldDurability[id] : DURABILITY_MAX }));
      // Слоты хранили id — заменяем на uid первого экземпляра с этим id.
      for (const slot of Object.keys(state.equipped)) {
        const val = state.equipped[slot];
        if (!val) continue;
        const inst = state.owned.find((x) => x.id === val);
        state.equipped[slot] = inst ? inst.uid : null;
      }
    }
    // Нормализация нового формата: валидные id, конечная прочность, уникальные uid.
    // v8: у каждого экземпляра есть rarity, affix и unique; старые экземпляры (v7 и ниже) — common без аффиксов.
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
        return { uid: inst.uid, id: inst.id, durability: Number.isFinite(inst.durability) ? inst.durability : DURABILITY_MAX, rarity, affix, unique };
      });
    // Слоты ссылаются только на существующие экземпляры.
    for (const slot of Object.keys(state.equipped)) {
      const uid = state.equipped[slot];
      if (uid && !getInstance(uid)) state.equipped[slot] = null;
    }
    delete state.durability;
    // Счётчик uid выводим из уже выданных номеров, чтобы не было коллизий.
    state.nextUid = state.owned.reduce((max, inst) => {
      const n = Number(String(inst.uid).replace(/^item_/, ""));
      return Number.isFinite(n) && n + 1 > max ? n + 1 : max;
    }, Number.isFinite(state.nextUid) ? state.nextUid : 1);

    state.knownRecipes = Array.isArray(state.knownRecipes) ? [...new Set(state.knownRecipes.filter((id) => RECIPE_MAP[id]))] : [];

    state.killCount = state.killCount || {};
    state.quests = state.quests && typeof state.quests === "object" ? state.quests : { day: 0, list: [], claimed: [] };
    state.quests.list = Array.isArray(state.quests.list) ? state.quests.list : [];
    state.quests.claimed = Array.isArray(state.quests.claimed) ? state.quests.claimed : [];
    
    state.npcQuests = state.npcQuests && typeof state.npcQuests === "object" ? state.npcQuests : { day: 0, list: [] };
    state.npcQuests.list = Array.isArray(state.npcQuests.list) ? state.npcQuests.list : [];

    const validResIds = new Set(ALL_RESOURCES.map(r => r.id));
    const hasInvalidNpcQuests = state.npcQuests.list.some(q => !validResIds.has(q.resId));
    if (hasInvalidNpcQuests) {
      generateNpcQuests();
      saveState();
    }
  } catch (err) { state = defaultState(); }
}

function saveState() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (err) {} }
function resetState() { state = defaultState(); saveState(); }
// Экземпляр-обёртка надетого: { uid, id, durability, item } или null.
function getEquippedItem(slot) {
  const uid = state.equipped[slot];
  if (!uid) return null;
  const inst = getInstance(uid);
  return inst ? { ...inst, item: ITEMS[inst.id] } : null;
}

// Экземпляр по UID из state.owned.
function getInstance(uid) { return state.owned.find((inst) => inst.uid === uid) || null; }

// Создаёт и добавляет новый экземпляр предмета. Единственная точка появления вещей.
// rarity: "common"…"legendary" или null — тогда редкость роллится.
function addItemInstance(id, durability = DURABILITY_MAX, rarity = null) {
  const itemRarity = rarity && RARITY_TIERS[rarity] ? rarity : rollRarity();
  const inst = { uid: generateUid(), id, durability, rarity: itemRarity, affix: generateAffix(itemRarity), unique: null };
  if (itemRarity === "legendary" && UNIQUE_EFFECTS.length) {
    inst.unique = UNIQUE_EFFECTS[Math.floor(Math.random() * UNIQUE_EFFECTS.length)].id;
  }
  state.owned.push(inst);
  return inst;
}

// Ролл редкости предмета: бонус сдвигает бросок в сторону редких тиров.
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

// Аффикс предмета: случайная тема + bonusCount роллов среди статов аффикса (повторы суммируются).
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

// Итоговые статы экземпляра: базовые статы × множитель редкости + бонусы аффикса + уникальный эффект.
// Атрибуты (str/end/agi/int) в базе предметов не хранятся — только из аффиксов.
function getInstanceStats(instance) {
  const item = instance ? ITEMS[instance.id] : null;
  const out = { atk: 0, def: 0, hp: 0, mana: 0, crit: 0, dodge: 0, block: 0, str: 0, end: 0, agi: 0, int: 0 };
  if (!item) return out;
  const tier = RARITY_TIERS[instance.rarity] || RARITY_TIERS.common;
  const mult = tier.mult || 1;
  for (const key of ["atk", "def", "hp", "mana", "crit", "dodge"]) {
    if (item[key]) out[key] = Math.round(item[key] * mult);
  }
  // Зоны блока не масштабируем: щит ×1.8 давал бы лишние зоны.
  out.block = item.block || 0;
  if (instance.affix && Array.isArray(instance.affix.bonuses)) {
    for (const b of instance.affix.bonuses) {
     if (b && b.id in out && Number.isFinite(b.value)) out[b.id] += Math.round(b.value * mult);
    }
  }
  if (instance.unique === "swift") out.dodge += 5;
  if (instance.unique === "lucky") out.crit += 5;
  return out;
}

// Уникальные эффекты надетых целых предметов (для боевых механик).
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

function repairCost(inst) { const missing = DURABILITY_MAX - durabilityOf(inst); if (missing <= 0) return 0; return Math.max(1, Math.ceil(missing * REPAIR_COST_PER_POINT)); }

function repairItem(uid) {
  const inst = getInstance(uid);
  if (!inst) return { ok: false, text: "Предмета нет в инвентаре." };
  const item = ITEMS[inst.id];
  if (!item || item.price <= 0) return { ok: false, text: "Это нельзя починить." };
  const cost = repairCost(inst);
  if (cost <= 0) return { ok: false, text: "Предмет и так в порядке." };
  if (state.gold < cost) return { ok: false, text: `Нужно ${cost} 💰.` };
  state.gold -= cost; inst.durability = DURABILITY_MAX; saveState();
  return { ok: true, text: `Починено: ${item.name} (−${cost} 💰).` };
}

function repairAll() {
  const damaged = state.owned.filter((inst) => ITEMS[inst.id]?.price > 0 && durabilityOf(inst) < DURABILITY_MAX);
  const total = damaged.reduce((sum, inst) => sum + repairCost(inst), 0);
  if (!damaged.length) return { ok: false, text: "Нечего чинить." };
  if (state.gold < total) return { ok: false, text: `Нужно ${total} 💰.` };
  state.gold -= total; for (const inst of damaged) inst.durability = DURABILITY_MAX; saveState();
  return { ok: true, text: `Всё починено (−${total} 💰).` };
}

function gearBonuses() {
  const total = { atk: 0, def: 0, hp: 0, mana: 0, crit: 0, dodge: 0, block: 0, str: 0, end: 0, agi: 0, int: 0 };
  for (const [slotId, uid] of Object.entries(state.equipped)) {
    const inst = uid ? getInstance(uid) : null;
    if (!inst || isBroken(inst)) continue;
    const s = getInstanceStats(inst);
    for (const key of Object.keys(total)) {
      let value = s[key] || 0;
      // Убийца держит оружие в левой руке, но получает только половину его урона.
      if (key === "atk" && slotId === "offhand" && ITEMS[inst.id]?.slot === "mainhand") value *= 0.5;
      total[key] += value;
    }
  }
  return total;
}

function activeCompanion() {
  if (!state || !state.companion) return null;
  const lastDay = state.companionDay + COMPANION_BUFF_DAYS - 1;
  if (state.day < state.companionDay || state.day > lastDay) return null;
  return COMPANION_MAP[state.companion] || null;
}

function companionExpiryDay() { if (!state || !state.companion) return 0; return state.companionDay + COMPANION_BUFF_DAYS - 1; }
function companionDaysLeft() { if (!activeCompanion()) return 0; return companionExpiryDay() - state.day + 1; }
function expireCompanion() {
  if (state.companion && state.day > companionExpiryDay()) {
    state.companion = null; state.companionDay = 0;
    return true;
  }
  return false;
}
function companionMultipliers() { 
  const companion = activeCompanion(); 
  if (!companion) return { hp: 1, mana: 1, damage: 1 };
  if (companion.buff === "hp") return { hp: 1.1, mana: 1, damage: 1 };
  if (companion.buff === "mana") return { hp: 1, mana: 1.1, damage: 1 };
  if (companion.buff === "damage") return { hp: 1, mana: 1, damage: 1.1 };
  if (companion.buff === "hybrid") return { hp: 1.05, mana: 1, damage: 1.05 };
  return { hp: 1, mana: 1, damage: 1 };
}

function archetypeMods(archetypeId = state?.archetype) {
  return ARCHETYPE_MAP[archetypeId]?.mods || BASE_ARCHETYPE_MODS;
}

function activeArchetype() {
  return state?.archetype ? ARCHETYPE_MAP[state.archetype] || null : null;
}

function stats() {
  const gear = gearBonuses(); const companion = activeCompanion(); const mult = companionMultipliers();
  const mods = archetypeMods();
  // Атрибуты аффиксов складываются с атрибутами героя.
  const a = {
    str: state.attrs.str + (gear.str || 0),
    agi: state.attrs.agi + (gear.agi || 0),
    end: state.attrs.end + (gear.end || 0),
    int: state.attrs.int + (gear.int || 0),
  };
  const maxHp = Math.round((BASE_STATS.hp + a.end * 10 + gear.hp) * mult.hp * mods.maxHp);
  const maxMana = Math.round((BASE_STATS.mana + a.int * 10 + gear.mana) * mult.mana);
  const atk = Math.ceil((BASE_STATS.damage + a.str * 2 + gear.atk) * mult.damage * mods.atk);
  const def = gear.def;
  const crit = Math.min(BASE_STATS.critCap, a.agi * AGILITY_CRIT_PERCENT + gear.crit);
  const dodge = Math.min(mods.dodgeCap, a.agi * AGILITY_DODGE_PERCENT + gear.dodge);
  const counter = Math.min(COUNTERATTACK_CAP, a.agi * AGILITY_COUNTER_PERCENT);
  const blockZones = Math.min(ZONES.length, mods.blockZones + gear.block);
  // Запас энергии растёт с уровнем: 10 + (уровень − 1).
  const maxEnergy = EXPLORATION_MAX + (state.level - 1);
  return { maxHp, maxMana, maxEnergy, atk, def, crit, dodge, counter, blockZones, ragePerHit: mods.ragePerHit, attrs: state.attrs, gearAttrs: { str: gear.str || 0, end: gear.end || 0, agi: gear.agi || 0, int: gear.int || 0 }, gear, companion, companionMult: mult, mods, archetype: activeArchetype() };
}

function xpNeeded(level) { return 200 + (level - 1) * 40; }
function clampVitals() { const st = stats(); state.hp = Math.max(0, Math.min(state.hp, st.maxHp)); state.mana = Math.max(0, Math.min(state.mana, st.maxMana)); state.energy = Math.max(0, Math.min(state.energy, st.maxEnergy)); }

function applyVitalsDelta(oldStats, newStats) {
  const hpDiff = newStats.maxHp - oldStats.maxHp; const manaDiff = newStats.maxMana - oldStats.maxMana;
  if (hpDiff > 0) state.hp = Math.min(newStats.maxHp, state.hp + hpDiff);
  if (manaDiff > 0) state.mana = Math.min(newStats.maxMana, state.mana + manaDiff);
  clampVitals();
}

function createHero(name, attrs, portrait = "m1", archetype = null) {
  state.name = (name || "").trim().slice(0, 20) || "Странник";
  state.portrait = PORTRAIT_MAP[portrait] ? portrait : "m1";
  state.archetype = ARCHETYPE_MAP[archetype] ? archetype : null;
  state.attrs = { str: attrs.str, agi: attrs.agi, end: attrs.end, int: attrs.int };
  state.created = true; 
  state.points = 0; 
  state.phase = 0; 
  state.day = 1; 
  state.companion = null; 
  state.companionDay = 0; 
  state.energy = EXPLORATION_MAX;

  // 1. Определяем стартовый набор (из архетипа или дефолтный)
  const arch = ARCHETYPE_MAP[state.archetype];
  const startIds = (arch && Array.isArray(arch.startEquipment)) 
    ? arch.startEquipment 
    : ["rusty_knife", "rags", "worn_hood", "patched_pants", "worn_boots"];

  // 2. Сбрасываем инвентарь и экипировку
  state.owned = [];
  state.nextUid = 1;
  state.equipped = { 
    head: null, neck: null, shoulder: null, back: null, 
    chest: null, wrist: null, hands: null, waist: null, 
    legs: null, feet: null, ring1: null, ring2: null, 
    trinket1: null, trinket2: null, mainhand: null, offhand: null 
  };

  // 3. Создаём экземпляры и надеваем их
  for (const id of startIds) {
    const item = ITEMS[id];
    if (!item) continue;
    
    const inst = { uid: generateUid(), id, durability: DURABILITY_MAX, rarity: "common", affix: null, unique: null };
    state.owned.push(inst);
    
    // Ищем лучший слот для предмета и надеваем
    const slot = targetSlotFor(item, inst);
    if (slot) state.equipped[slot] = inst.uid;
  }

  // 4. Обновляем статы и сохраняем
  const st = stats(); 
  state.hp = st.maxHp; 
  state.mana = st.maxMana; 
  generateQuests();
  generateNpcQuests();
  saveState();
}

function addAttr(attr) {
  if (!(attr in state.attrs)) return { ok: false, text: "Неизвестный атрибут." };
  if (state.points <= 0) return { ok: false, text: "Нет свободных очков." };
  const oldStats = stats(); state.attrs[attr] += 1; state.points -= 1; const newStats = stats();
  applyVitalsDelta(oldStats, newStats); saveState();
  return { ok: true, text: `Атрибут повышен. Осталось очков: ${state.points}.` };
}

function gainXp(amount) {
  const result = { levels: [], xp: amount, points: 0 }; state.xp += amount;
  while (state.xp >= xpNeeded(state.level)) { state.xp -= xpNeeded(state.level); state.level += 1; state.points += LEVEL_ATTR_POINTS; result.points += LEVEL_ATTR_POINTS; result.levels.push(state.level); }
  if (result.levels.length) { const st = stats(); state.hp = st.maxHp; state.mana = st.maxMana; }
  return result;
}

function generateQuests() {
  const available = QUEST_MOBS.filter((m) => m.floorId <= state.maxFloor);
  if (available.length < QUEST_COUNT) { state.quests = { day: state.day, list: [], claimed: [] }; return; }
  const pool = [...available]; const list = [];
  for (let i = 0; i < QUEST_COUNT && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const mob = pool.splice(idx, 1)[0];
    list.push({ id: `q_${state.day}_${i}`, mobId: mob.id, mobName: mob.name, mobIcon: mob.icon, floorId: mob.floorId, target: QUEST_TARGET, progress: 0, done: false, gold: Math.max(1, Math.floor(mob.gold * QUEST_TARGET * GOLD_DROP_MULT)), xp: Math.max(1, mob.xp * QUEST_TARGET) });
  }
  state.quests = { day: state.day, list, claimed: [] };
}

function ensureQuests() { if (!state.quests || state.quests.day !== state.day) generateQuests(); }
function checkQuestProgress(mobId) {
  ensureQuests(); let changed = false;
  for (const q of state.quests.list) { if (q.mobId === mobId && !q.done && q.progress < q.target) { q.progress += 1; if (q.progress >= q.target) q.done = true; changed = true; } }
  if (changed) saveState();
}
function claimQuest(id) {
  ensureQuests(); const q = state.quests.list.find((x) => x.id === id);
  if (!q) return { ok: false, text: "Задание не найдено." };
  if (!q.done) return { ok: false, text: "Задание ещё не выполнено." };
  if (state.quests.claimed.includes(id)) return { ok: false, text: "Награда уже получена." };
  state.gold += q.gold; const up = gainXp(q.xp); state.quests.claimed.push(id); saveState();
  const levelText = up.levels.length ? ` Новый уровень: ${up.levels.join(", ")}!` : "";
  return { ok: true, text: `Задание «${q.mobName}» выполнено: +${q.gold} 💰, +${q.xp} ✦.${levelText}` };
}

function generateNpcQuests() {
  const floorId = state.maxFloor;
  const resources = FLOOR_RESOURCES[floorId] || [];
  const list = resources.map((res, i) => {
    return { id: `nq_${state.day}_${i}`, npc: res.npc, resId: res.id, target: 3, progress: 0, claimed: false, gold: res.sellPrice * 3 * 3, xp: res.sellPrice * 2 * 5, potions: res.npc === "elain" ? 1 : 0 };
  });
  state.npcQuests = { day: state.day, list };
}

function ensureNpcQuests() { if (!state.npcQuests || state.npcQuests.day !== state.day) generateNpcQuests(); }

function gatherResource(floorId = state.maxFloor) {
  const reason = towerClosedReason();
  if (reason) return { ok: false, text: reason };

  state.energy -= FIGHT_ENERGY_COST;

  if (Math.random() < 0.20) {
    // Ищем моба на том этаже, где игрок нажал «Искать»
    const floor = FLOORS.find(f => f.id === floorId) || FLOORS[0];
    const mobIndex = Math.floor(Math.random() * floor.mobs.length);
    const mob = floor.mobs[mobIndex];
    
    const ambush = Math.random() < AMBUSH_GATHER_CHANCE
      ? { floorId: floor.id, nextMobIndex: ambushMobIndex(floor, mobIndex) }
      : null;
      
    saveState();
    return { ok: true, text: `На вас напал ${mob.name}!`, encounter: { floorId: floor.id, mobIndex, ambush } };
  }

  const resources = FLOOR_RESOURCES[floorId] || [];
  if (!resources.length) {
    saveState();
    return { ok: false, text: "Здесь нечего искать." };
  }

  const res = resources[Math.floor(Math.random() * resources.length)];
  const amount = Math.floor(Math.random() * (res.maxAmount - res.minAmount + 1)) + res.minAmount;

  state.resources[res.id] = (state.resources[res.id] || 0) + amount;

  ensureNpcQuests();
  for (const q of state.npcQuests.list) {
    if (q.resId === res.id && !q.claimed) q.progress += amount;
  }

  saveState();
  const icon = resolveIcon(res.icon);
  const shownIcon = icon && !String(icon).startsWith("assets/") ? `${icon} ` : "";
  return { ok: true, text: `Найдено: ${shownIcon}${res.name} ×${amount}.` };
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

function claimNpcQuest(id) {
  ensureNpcQuests();
  const q = state.npcQuests.list.find(x => x.id === id);
  if (!q) return { ok: false, text: "Задание не найдено." };
  if (q.claimed) return { ok: false, text: "Награда уже получена." };
  
  const have = state.resources[q.resId] || 0;
  if (have < q.target) return { ok: false, text: "Не хватает ресурсов." };

  state.resources[q.resId] -= q.target;
  q.claimed = true;
  state.gold += q.gold;
  const up = gainXp(q.xp);
  
  if (q.potions > 0) state.potions["hp_small"] = (state.potions["hp_small"] || 0) + q.potions;
  
  saveState();
  
  let rewardText = [];
  if (q.gold > 0) rewardText.push(`+${q.gold} 💰`);
  if (q.xp > 0) rewardText.push(`+${q.xp} ✦`);
  if (q.potions > 0) rewardText.push(`+${q.potions} 🧪`);
  
  return { ok: true, text: `Задание выполнено: ${rewardText.join(", ")}.` };
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
  if (state.phase >= TIME_PHASES.length) {
    state.phase = 0;
    state.day += 1;
    generateQuests();
    generateNpcQuests();
  }
  expireCompanion();
  clampVitals(); saveState(); return phaseInfo();
}

function towerClosedReason() {
  if (isNight()) return "Ночью Башня закрыта. Дождитесь утра в Йорстеде.";
  if (state.energy < FIGHT_ENERGY_COST) return "Энергия на исходе. Отдохните в Йорстеде или снимите номер в гостинице.";
  return null;
}

function freeRest() {
  // Отдых восстанавливает фиксированные FREE_REST_AMOUNT энергии, но не выше максимума.
  const st = stats();
  const gain = FREE_REST_AMOUNT; const before = state.energy;
  state.energy = Math.min(st.maxEnergy, state.energy + gain); const phase = advancePhase(); const restored = state.energy - before;
  return { ok: true, restored, phase, text: restored > 0 ? `Отдых: +${restored} энергии. ${phase.icon} ${phase.name}, день ${state.day}.` : `Энергия уже полна. ${phase.icon} ${phase.name}, день ${state.day}.` };
}

function hotelRest() {
  if (state.gold < HOTEL_PRICE) return { ok: false, text: `Не хватает золота: нужно ${HOTEL_PRICE} 💰.` };
  state.gold -= HOTEL_PRICE; state.day += 1; state.phase = 0;
  expireCompanion();
  const st = stats(); state.hp = st.maxHp; state.mana = st.maxMana; state.energy = st.maxEnergy;
  generateQuests(); generateNpcQuests(); saveState();
  return { ok: true, text: `Номер оплачен. HP, мана и энергия восстановлены. ${phaseLabel()}.` };
}

function hireCompanion(companionId) {
  const companion = COMPANION_MAP[companionId]; if (!companion) return { ok: false, text: "Такой спутницы здесь нет." };
  const current = activeCompanion();
  if (current?.id === companion.id) return { ok: false, text: `${companion.name} уже с вами. Осталось ${companionDaysLeft()} дн.` };
  const discount = companionDiscountToday(); const price = Math.max(1, Math.round(companion.price * (1 - discount)));
  if (state.gold < price) return { ok: false, text: `Не хватает золота: нужно ${price} 💰.` };
  const oldStats = stats(); const previous = current;
  state.gold -= price; state.companion = companion.id; state.companionDay = state.day; const newStats = stats();
  applyVitalsDelta(oldStats, newStats); saveState();
  const replaced = previous && previous.id !== companion.id ? ` ${previous.name} уступает место.` : "";
  const sale = discount > 0 ? ` (скидка ${Math.round(discount * 100)}%)` : "";
  return { ok: true, companion, text: `${companion.name} с вами. ${companion.buffText} на ${COMPANION_BUFF_DAYS} дня.${replaced} Оплачено ${price} 💰${sale}. Время не сдвинулось.` };
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
  state.potions[id] -= 1; saveState();
  return { ok: true, healed, text: `${item.name}: +${healed} ${item.effect === "hp" ? "HP" : "маны"}.` };
}

// Выкуп зелья в Лавке Алхимика за половину цены покупки.
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

// Рецепт выпадает с обычных мобов с заданным шансом, с боссов — гарантированно.
// chance зависит от редкости моба: 5% обычный, 15% редкий, 25% элитный.
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

// Общий ролл дропа: обычный бой и автофарм.
// mobRarity — редкость МОБА (common/rare/elite), не путать с редкостью предмета.
function rollDrops(enemyDef) {
  const loot = [];
  const floorId = enemyDef.floorId || state.maxFloor;
  const floorResources = FLOOR_RESOURCES[floorId] || [];
  let drops = Array.isArray(enemyDef?.drops) ? enemyDef.drops : [];
  const mobRarity = enemyDef?.rarity || "common";

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
    if (Math.random() >= chance) continue;

    const min = Math.max(1, Number(drop.min) || 1);
    const max = Math.max(min, Number(drop.max) || min);
    const amount = min + Math.floor(Math.random() * (max - min + 1));

    if (drop.kind !== "item" && ALL_RESOURCES.some((r) => r.id === drop.id)) {
      if (mobRarity === "common" && !enemyDef.boss && floorResources.length > 0) {
        const randomRes = floorResources[Math.floor(Math.random() * floorResources.length)];
        const resAmount = Math.floor(Math.random() * (randomRes.maxAmount - randomRes.minAmount + 1)) + randomRes.minAmount;
        state.resources[randomRes.id] = (state.resources[randomRes.id] || 0) + resAmount;
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
  if (state?.archetype === "assassin" && slotId === "offhand") {
    if (isShield(item)) return false;
    return item.slot === "mainhand" || item.slot === "offhand";
  }
  return slot.accepts.includes(item.slot);
}

function slotsForItem(item) { return SLOTS.filter((s) => canEquipInSlot(item, s.id)).map((s) => s.id); }

function targetSlotFor(item, instance = null) {
  const candidates = slotsForItem(item); if (!candidates.length) return null;
  // Сначала пробуем родной слот, если предмет там лучше текущего.
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

function buyItem(id, shop = "forge") {
  const item = ITEMS[id]; if (!item) return { ok: false, text: "Товар не найден." };
  let discount = 0;
  if (shop === "alchemy") discount = alchemyDiscountToday();
  else if (shop === "forge") discount = forgeDiscountToday();
  
  const price = Math.max(1, Math.round(item.price * (1 - discount)));
  if (state.gold < price) return { ok: false, text: "Не хватает золота." };

  if (item.slot === "potion") {
    state.gold -= price; state.potions[id] = (state.potions[id] || 0) + 1; saveState();
    const sale = discount > 0 ? ` (скидка ${Math.round(discount * 100)}%)` : "";
    return { ok: true, text: `Куплено: ${item.name} за ${price} 💰${sale}.` };
  }

  // Покупка всегда создаёт новый экземпляр — одинаковых вещей может быть несколько.
  // Магазинный товар всегда обычного качества: редкость роллится только с дропов и крафта.
  const oldStats = stats(); state.gold -= price;
  const inst = addItemInstance(id, DURABILITY_MAX, "common");
  const slot = targetSlotFor(item, inst);
  const eqInst = slot && state.equipped[slot] ? getInstance(state.equipped[slot]) : null;
  const better = slot && itemScore(item, slot, inst) > itemScore(eqInst ? ITEMS[eqInst.id] : null, slot, eqInst);
  if (better) state.equipped[slot] = inst.uid;
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

  // Крафт всегда создаёт новый экземпляр: одинаковых вещей может быть несколько,
  // у каждой — своя прочность и своя редкость (шансы растут с уровнем).
  const oldStats = stats();
  const inst = addItemInstance(recipe.result, DURABILITY_MAX, rollRarity((state.level - 1) * CRAFT_RARITY_BONUS_PER_LEVEL));
  const slot = targetSlotFor(item, inst);
  const eqInst = slot && state.equipped[slot] ? getInstance(state.equipped[slot]) : null;
  const better = slot && itemScore(item, slot, inst) > itemScore(eqInst ? ITEMS[eqInst.id] : null, slot, eqInst);
  if (better) state.equipped[slot] = inst.uid;
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
  state.equipped[slotId] = uid; const newStats = stats(); applyVitalsDelta(oldStats, newStats); saveState();
  return { ok: true, text: `Надето: ${getItemDisplayName(inst)} (${slot.name}).` };
}

function unequipSlot(slot) {
  const eq = getEquippedItem(slot);
  if (!eq) return { ok: false, text: "Слот пуст." };
  const oldStats = stats(); state.equipped[slot] = null; const newStats = stats(); applyVitalsDelta(oldStats, newStats); saveState();
  return { ok: true, text: `Снято: ${getItemDisplayName(eq)} (${SLOT_NAME[slot] || slot}).` };
}

function sellItem(uid) {
  const inst = getInstance(uid);
  const item = inst ? ITEMS[inst.id] : null;
  if (!inst || !item) return { ok: false, text: "Предмета нет." };
  if (isEquipped(uid)) return { ok: false, text: "Сначала снимите предмет." };
  const price = sellPrice(item); state.owned = state.owned.filter((x) => x !== inst); state.gold += price; saveState();
  return { ok: true, text: `Продано: ${getItemDisplayName(inst)} (+${price} золота).` };
}

function trainAttr(trainingId) {
  const training = TRAINING_MAP[trainingId]; if (!training) return { ok: false, text: "Такой тренировки здесь нет." };
  if (state.phase !== 0) return { ok: false, text: "Зал Охотников открыт только утром." };
  if (state.energy < TRAINING_ENERGY_COST) return { ok: false, text: `Нужно ${TRAINING_ENERGY_COST} ⚡. Отдохните или сходите в Башню.` };
  const attr = training.attr; const cap = trainingCap(state.level);
  if (state.attrs[attr] >= cap) return { ok: false, text: `${ATTR_INFO.find((a) => a.id === attr).name} уже на максимуме (${cap}) для ${state.level}-го уровня.` };

  const oldStats = stats(); state.energy -= TRAINING_ENERGY_COST; state.attrs[attr] += 1; const newStats = stats();
  const hpDiff = newStats.maxHp - oldStats.maxHp; const manaDiff = newStats.maxMana - oldStats.maxMana;
  if (hpDiff > 0) state.hp += hpDiff; if (manaDiff > 0) state.mana += manaDiff;
  for (let i = 0; i < TRAINING_PHASES; i += 1) advancePhase();
  clampVitals(); saveState();
  const attrName = ATTR_INFO.find((a) => a.id === attr).name;
  return { ok: true, text: `${training.name}: ${attrName} +1. День закончился, наступила ночь.` };
}

function simulateFarmBattle(mob, isBoss = false) {
  if (state.energy < FIGHT_ENERGY_COST) return { ok: false, text: "Энергия на исходе." };
  state.energy -= FIGHT_ENERGY_COST;

  const st = stats();
  let enemyHp = mob.hp;
  let playerHp = state.hp;
  let turns = 0;
  const maxTurns = 50;
  
  const logs = [];

  let dmgTakenMult = 1;
  let dmgDealtMult = 1;
  if (state.archetype === "assassin") dmgTakenMult = 0.6;
  if (state.archetype === "guardian") { dmgTakenMult = 0.9; dmgDealtMult = 0.9; }
  if (state.archetype === "berserker") dmgDealtMult = 1.2;

  while (turns < maxTurns && enemyHp > 0 && playerHp > 0) {
    turns++;
    
    // Ход игрока
    let playerDmg = Math.max(1, st.atk - Math.floor(mob.def * 0.5));
    playerDmg = Math.round(playerDmg * dmgDealtMult * (0.9 + Math.random() * 0.2));
    let isCrit = false;
    if (Math.random() * 100 < st.crit) { 
      playerDmg = Math.round(playerDmg * 1.7); 
      isCrit = true; 
    }
    enemyHp -= playerDmg;
    logs.push(`⚔ Вы бьёте ${mob.name} на ${playerDmg}${isCrit ? " (КРИТ!)" : ""}.`);

    if (enemyHp <= 0) break;

    // Ход врага
    if (Math.random() * 100 < st.dodge) {
      logs.push(`💨 Вы уклоняетесь от атаки ${mob.name}.`);
      if (Math.random() * 100 < st.counter) {
        let counterDmg = Math.max(1, Math.round(st.atk * 0.5 - mob.def * 0.3));
        enemyHp -= counterDmg;
        logs.push(`⚡ Контратака! ${mob.name} теряет ${counterDmg} HP.`);
      }
    } else {
      let enemyDmg = Math.max(1, mob.atk - Math.floor(st.def * 0.5));
      enemyDmg = Math.round(enemyDmg * dmgTakenMult * (0.85 + Math.random() * 0.3));
      playerHp -= enemyDmg;
      logs.push(`🩸 ${mob.name} бьёт вас на ${enemyDmg} урона.`);

      if (state.archetype === "guardian" && Math.random() < 0.3) {
        const retaliation = Math.max(1, Math.round(mob.atk * (st.mods?.blockCounter || 0.1)));
        enemyHp -= retaliation;
        logs.push(`🛡 Страж блокирует и отвечает: ${mob.name} теряет ${retaliation} HP.`);
      }
    }

    // Авто-питье зелий (ниже 40% HP)
    if (playerHp > 0 && playerHp < st.maxHp * 0.4) {
      if ((state.potions["hp_small"] || 0) > 0) {
        const heal = Math.min(100, st.maxHp - playerHp);
        playerHp += heal;
        state.potions["hp_small"] -= 1;
        logs.push(`🧪 Вы выпили Малое зелье лечения (+${heal} HP).`);
      } else if ((state.potions["hp_big"] || 0) > 0) {
        const heal = Math.min(225, st.maxHp - playerHp);
        playerHp += heal;
        state.potions["hp_big"] -= 1;
        logs.push(`⚗️ Вы выпили Большое зелье лечения (+${heal} HP).`);
      }
    }
  }

  const victory = enemyHp <= 0;
  const hpLeft = Math.max(1, playerHp);

  if (victory) {
    const gold = Math.max(1, Math.floor(mob.gold * GOLD_DROP_MULT * goldMultToday()));
    const xp = Math.max(1, Math.floor(mob.xp * xpMultToday()));
    state.gold += gold;
    const up = gainXp(xp);
    state.kills = (state.kills || 0) + 1;
    checkQuestProgress(mob.id);
    const loot = rollDrops(mob);
    state.hp = hpLeft;
    saveState();
    
    return { 
      ok: true, 
      loot, 
      logs: logs, 
      text: `Победа над ${mob.name}. +${gold} 💰, +${xp} ✦.${up.levels.length ? ` Новый уровень: ${up.levels.join(", ")}!` : ""}` 
    };
  } else {
    const lost = Math.floor(state.gold * 0.15);
    state.gold = Math.max(0, state.gold - lost);
    state.hp = st.maxHp;
    state.mana = st.maxMana;
    saveState();
    return { 
      ok: false, 
      logs: logs, 
      text: `Вы погибли в бою с ${mob.name}. Потеряно ${lost} золота.` 
    };
  }
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