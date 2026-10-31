// Бой в духе «Бойцовского клуба»: размен ударами.
// Оба бойца одновременно выбирают зону удара и зоны блока.

function rnd(min, max) {
  return min + Math.random() * (max - min);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Зоны удара → слот экипировки, защищающий эту зону.
const ZONE_TO_SLOT = { head: "head", chest: "chest", belly: "chest", waist: "waist", legs: "legs" };

// Тип брони, прикрывающий конкретный слот (пустой слот считается тканью).
function equippedArmorTypeFor(state, slot) {
  const uid = state.equipped && state.equipped[slot];
  if (!uid) return "cloth";
  const inst = getInstance(uid);
  const item = inst ? ITEMS[inst.id] : null;
  return (item && item.armorType) || "cloth";
}

// Вариация моба: редкость, модификатор, способность.
// Боссы не модифицируются — возвращается копия без изменений.
function applyMobVariation(enemyDef) {
  const def = { ...enemyDef };

  if (def.boss) {
    def.rarity = "common";
    def.modifier = null;
    def.ability = null;
    return def;
  }

  const roll = Math.random();
  def.rarity = roll < ELITE_CHANCE ? "elite" : roll < ELITE_CHANCE + RARE_CHANCE ? "rare" : "common";

  // 1. Модификатор — ВСЕГДА (у всех обычных, редких и элитных)
  def.modifier = pick(Object.keys(MOB_MODIFIERS));
  const mod = MOB_MODIFIERS[def.modifier];
  mod.apply(def);
  def.maxHp = def.hp;
  def.name = `${mod.name} ${def.name}`;

  // 2. Способность — только у редких и элитных
  def.ability = def.rarity !== "common" ? pick(ABILITY_POOL) : null;

  return def;
}

// Читаемая метка вариации для логов и текста автофарма.
function variationLabel(enemy) {
  const parts = [];
  const rarity = RARITY_INFO[enemy.rarity];
  if (rarity && rarity.badge) parts.push(rarity.badge);
  if (enemy.modifier) {
    const mod = MOB_MODIFIERS[enemy.modifier];
    // Иконки модификаторов могут не отрисовываться (пустой квадратик из
    // неподдерживаемой эмодзи) — вместо них текстовая метка [Хилый].
    if (mod) parts.push(`[${mod.name}]`);
  }
  if (enemy.ability) {
    const info = MOB_ABILITY_INFO[enemy.ability];
    if (info) parts.push(`${info.icon} ${info.name}`);
  }
  return parts.join(" · ");
}

function createBattle(enemyDef, floorId) {
  const enemy = applyMobVariation(enemyDef);
  const floor = FLOORS.find(f => f.id === floorId);

  // Ресурсы моба: мана копится каждый ход, кураж — от полученных ударов.
  // На глубоких этажах запас маны больше, чтобы «Тяжёлый удар» был реальнее.
  enemy.mana = 0;
  enemy.maxMana = 20 + Math.max(0, (Number(floorId) || 1) - 1) * 5;
  enemy.rage = 0;
  enemy.maxRage = 5;
  
  if (Array.isArray(enemyDef.weapons) && enemyDef.weapons.length) {
    const weaponId = pick(enemyDef.weapons);
    const w = ITEMS[weaponId];
    if (w) {
      enemy.weaponId = weaponId;
      enemy.atk = Math.round(enemy.atk + w.atk * 0.25);
    }
  }
  
  const battle = {
    enemy,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    rage: 0,
    round: 0,
    log: [],
    over: false,
    floorId,
    floorBg: floor ? floor.bg : "assets/backgrounds/floor1.webp",
    boss: Boolean(enemyDef.boss),
    lastPlayerAttack: null,
    lastPlayerHit: null, // null — прошлого хода ещё не было
    playerDebuffs: [],
    monkStance: MONK_DEFAULT_STANCE,
    skillCd: {}, // откат активных навыков: { talentId: ходов до готовности }
    companionTurn: 0,
    alvaStunChance: 10,
    companionStunned: false,
    companionBlocked: false,
    // ── Real-Time дуэль ──────────────────────────────────────────────────
    balance: 100,          // Равновесие (Posture): 0 → оглушение
    maxBalance: 100,
    enemyWindup: 0,        // длительность текущего замаха, сек
    enemyTimeLeft: 0,      // сколько осталось до удара, сек
    enemyTimer: null,      // id интервала; владелец — ui.js
    enemyRecoveryTimer: 0, // окно восстановления моба до следующего замаха, сек
    stunned: false,
    comboWord: "",
    comboTyped: "",
    comboTimeLeft: 0,
    // Слоты слов
    attackWord: "SLASH",
    attackTyped: "",
    attackAuto: "",
    attackStyle: "slashing",
    attackIsCrit: false,
    attackHasAffix: false,
    attackAffix: "",
    attackAffixType: null,
    attackGlitch: false,  // INT моба выше — слово атаки «глючит»
    defenseGlitch: false, // то же для слова защиты
    defenseWord: "",
    defenseTyped: "",
    defenseAuto: "",
    activeSlot: "attack",
  };
  
  const label = variationLabel(enemy);
  if (label) battleLog(battle, `${enemy.name} — ${label}`, "info");
  if (enemy.weaponId) battleLog(battle, `${enemy.name} достаёт ${ITEMS[enemy.weaponId].name}!`, "warn");
  return battle;
}

// ══════════════════════════════════════════════════════════════════════════
// Real-Time дуэль: два слота слов, замах врага, Равновесие и статы.
// Все функции ниже меняют только state/battle и пишут в лог — DOM не трогают.
// ══════════════════════════════════════════════════════════════════════════

function duelAutoLetters(st) {
  // Автоввод первых букв отключен. Интеллект влияет на шанс выпадения аффиксов.
  return 0;
}

// Итоговый атрибут игрока: очки героя + бонусы снаряжения.
function duelTotalAttr(st, key) {
  return Math.max(0, Number(st?.attrs?.[key]) || 0) + Math.max(0, Number(st?.gearAttrs?.[key]) || 0);
}

// Стиль текущего оружия игрока (для слова, урона и звука).
function duelPlayerStyle(state, battle) {
  const mainInst = state.equipped.mainhand ? getInstance(state.equipped.mainhand) : null;
  const weapon = mainInst ? ITEMS[mainInst.id] : null;
  if (state.archetype === "monk" && !weapon) {
    return (battle && STYLE_ORDER.includes(battle.monkStance)) ? battle.monkStance : MONK_DEFAULT_STANCE;
  }
  return weapon ? weaponBestStyle(weapon, mainInst) : "slashing";
}

// Новое слово в СЛОТЕ АТАКИ. AGI повышает шанс длинного слова-крита,
// INT — автоматически введённые первые буквы. Аффикс даёт только масло.
function duelNewAttackWord(state, battle) {
  if (!battle || battle.over) return;
  const st = stats();
  const agi = Math.max(0, Number(st.attrs?.agi) || 0);
  const int = duelTotalAttr(st, "int");
  const mobInt = Math.max(0, Number(battle.enemy?.int) || 0);
  const style = duelPlayerStyle(state, battle);
  const critChance = 5 + agi * 1.0;
  // Чужой INT выше — на слове висит эффект ментального давления (красное
  // свечение), но сами буквы не меняются. Аффикс зависит только от масла.
  const glitchActive = mobInt > int;
  const isCrit = Math.random() * 100 < critChance;

  // Аффикс появляется ТОЛЬКО при нанесённом масле. Случайного ролла нет.
  let hasAffix = false;
  let affixType = null;

  if (battle.oilEffect && Number(battle.oilEffect.charges) > 0) {
    hasAffix = true;
    // Определяем текст аффикса в зависимости от типа масла
    const oilMap = {
      fire: "ОГНЕННЫЙ",
      ice: "ЛЕДЯНЫЙ",
      poison: "ЯДОВИТЫЙ",
      blood: "КРОВАВЫЙ"
    };
    const oilKind = String(battle.oilEffect.type || battle.oilEffect.id || "").toLowerCase().replace(/^oil_/, "");
    affixType = oilMap[oilKind] || "ОГНЕННЫЙ";

    // Тратим заряд масла
    battle.oilEffect.charges -= 1;
    if (battle.oilEffect.charges <= 0) {
      battle.oilEffect = null;
    }
  }

  const basePool = ATTACK_WORDS_BASE;
  const longPool = ATTACK_WORDS_LONG;
  const pool = isCrit && longPool.length ? longPool : (basePool.length ? basePool : longPool);
  const baseWord = pick(pool) || "SLASH";

  const affix = affixType ? `${String(affixType).trim()} ` : "";
  const word = affix + baseWord;
  battle.attackGlitch = glitchActive;
  const autoCount = Math.min(duelAutoLetters(st), Math.max(0, word.length - 1));
  let typed = word.slice(0, autoCount);
  // Пробелы вводить не нужно — они засчитываются автоматически.
  while (typed.length < word.length && word[typed.length] === " ") typed += " ";

  battle.attackWord = word;
  battle.attackTyped = typed;
  battle.attackAuto = typed;
  battle.attackStyle = style;
  battle.attackIsCrit = isCrit;
  battle.attackHasAffix = hasAffix && Boolean(affix.trim());
  battle.attackAffix = affix;
  battle.attackAffixType = affixType;
}

// Новое слово в СЛОТЕ ЗАЩИТЫ на текущий замах.
function duelNewDefenseWord(battle) {
  if (!battle || battle.over) return;
  const st = stats();
  const int = duelTotalAttr(st, "int");
  const mobInt = Math.max(0, Number(battle.enemy?.int) || 0);
  const glitchActive = mobInt > int;
  const rawWord = pick(DEFEND_WORDS) || "DODGE";
  const word = rawWord;
  const autoCount = Math.min(duelAutoLetters(st), Math.max(0, word.length - 1));
  battle.defenseGlitch = glitchActive;
  battle.defenseWord = word;
  battle.defenseTyped = word.slice(0, autoCount);
  battle.defenseAuto = battle.defenseTyped;
}

// Старт замаха: окно реакции на слово защиты зависит от AGI моба против AGI
// игрока (timeWindow = 2.0 + (agi игрока − agi моба) * 0.05, клэмп 0.8…4.0 c).
function duelBeginWindup(state, battle) {
  if (!battle || battle.over || battle.stunned) return;
  const st = stats();
  const agi = duelTotalAttr(st, "agi");
  const mobAgi = Math.max(0, Number(battle.enemy?.agi) || 0);
  const timeWindow = 2.0 + (agi - mobAgi) * 0.05;
  const duration = Math.max(0.8, Math.min(4.0, timeWindow));
  battle.enemyWindup = duration;
  battle.enemyTimeLeft = duration;
  battle.activeSlot = "attack";
  // Слово атаки могло быть убито переходом на защиту — новый замах всегда
  // начинается с чистым, свежим словом атаки.
  if (!battle.attackWord) duelNewAttackWord(state, battle);
  duelNewDefenseWord(battle);
}

// Следующая буква слова с пропуском пробелов.
function duelPeekChar(word, typed) {
  const w = String(word || "");
  let i = String(typed || "").length;
  while (i < w.length && w[i] === " ") i += 1;
  return i < w.length ? w[i].toUpperCase() : null;
}

// Ввод одной буквы в слово. Пробелы засчитываются сами.
function duelAdvanceWord(word, typed, letter) {
  const w = String(word || "");
  let next = String(typed || "");
  while (next.length < w.length && w[next.length] === " ") next += " ";
  if (next.length >= w.length) return { ok: true, complete: true, typed: next };
  if (w[next.length].toUpperCase() !== String(letter || "").toUpperCase()) {
    return { ok: false, complete: false, typed };
  }
  next += w[next.length];
  while (next.length < w.length && w[next.length] === " ") next += " ";
  return { ok: true, complete: next.length >= w.length, typed: next };
}

// Равновесие: 0 → моб оглушён, замах остановлен, в слоте атаки комбо-слово.
function duelStun(battle) {
  if (!battle || battle.stunned) return;
  battle.balance = 0;
  battle.stunned = true;
  battle.enemyTimeLeft = 0;
  battle.enemyWindup = 0;
  battle.comboWord = pick(COMBO_WORDS) || "CRUSHING SMASH";
  battle.comboTyped = "";
  battle.comboTimeLeft = 3.0;
  battle.attackWord = battle.comboWord;
  battle.attackTyped = "";
  battle.attackAuto = "";
  battle.attackIsCrit = false;
  battle.attackHasAffix = false;
  battle.attackAffix = "";
  battle.attackAffixType = null;
  battle.defenseWord = "";
  battle.defenseTyped = "";
  battle.defenseAuto = "";
  battle.activeSlot = "attack";
  battleLog(battle, `${battle.enemy.name} теряет равновесие — ОГЛУШЁН! Напечатайте комбо за 3 секунды!`, "crit");
}

// Моб приходит в себя: Равновесие восстанавливается, бой продолжается.
function duelRecover(battle) {
  if (!battle) return;
  battle.stunned = false;
  battle.balance = battle.maxBalance || 100;
  battle.comboWord = "";
  battle.comboTyped = "";
  battle.comboTimeLeft = 0;
  battleLog(battle, `${battle.enemy.name} приходит в себя. Равновесие восстановлено.`, "info");
}

function duelBalanceLoss(battle, amount) {
  if (!battle || battle.stunned) return;
  battle.balance = Math.max(0, (battle.balance || 0) - amount);
  if (battle.balance <= 0) duelStun(battle);
}

// Удар игрока по мобу. STR — базовый множитель урона, крит ×1.5,
// аффикс ×1.2, комбо ×2.5. Возвращает { damage, style, crit }.
// ЛОГИКА ПРЕРЫВАНИЯ: звонок сюда идёт только из duelAttackComplete после
// полного слова атаки. Бесшовный переход на защиту (duelTypeLetter) сбрасывает
// attackTyped до автобукв INT — слово больше не может досчитаться, поэтому
// отменённая атака урона не наносит, даже если не хватало одной буквы.
function duelPlayerAttack(state, battle, opts = {}) {
  if (!battle || battle.over) return { damage: 0, style: "slashing", crit: false };
  const st = stats();
  const e = battle.enemy;
  const style = battle.attackStyle || duelPlayerStyle(state, battle);
  const mainInst = state.equipped.mainhand ? getInstance(state.equipped.mainhand) : null;
  const weapon = mainInst ? ITEMS[mainInst.id] : null;
  const isMonkUnarmed = state.archetype === "monk" && !weapon;
  const styleMult = isMonkUnarmed ? MONK_UNARMED_STYLE_MULT : weaponStyleMult(weapon, style, mainInst);
  const armorType = e.armorType || "leather";
  const armorMult = ARMOR_STYLE_MULT[style][armorType] || 1;
  const pierce = (st.armorPierce || 0) / 100;

  let base = st.atk * styleMult * armorMult * rnd(0.9, 1.1);
  base -= e.def * (1 - pierce) * 0.6;
  const str = duelTotalAttr(st, "str");
  // Пробитие: разница СИЛ игрока и ЗАЩ моба даёт множитель урона (0.3x…2.5x).
  const strDiff = str - Math.max(0, Number(e.def) || 0);
  const damageMult = Math.max(0.3, Math.min(2.5, 1.0 + strDiff * 0.02));
  let damage = Math.max(1, Math.round(base * damageMult));
  if (strDiff < 0) battleLog(battle, "Удар вязнет в защите врага!", "warn");

  const achVs = achievementVsMobBonus(state, e.id);
  if (achVs.dmgPct) damage = Math.max(1, Math.round(damage * (1 + achVs.dmgPct / 100)));
  damage += achVs.flat;

  const isCrit = opts.isCombo !== true && opts.isCrit === true;
  const hasAffix = opts.isCombo !== true && opts.hasAffix === true;
  if (isCrit) damage = Math.round(damage * 1.5);
  if (hasAffix) damage = Math.round(damage * 1.2);
  if (opts.isCombo === true) damage = Math.round(damage * 2.5);
  damage = Math.max(1, damage);

  battle.hp = Math.max(0, battle.hp - damage);
  battle.round = (battle.round || 0) + 1;
  gainEnemyRage(battle);
  battle.lastPlayerHit = true;
  battle.rage = Math.min(5, battle.rage + (st.ragePerHit || 1));

  const uniques = equippedUniques();
  const lifestealPct = (uniques.includes("lifesteal") ? LIFESTEAL_PERCENT : 0) + (st.lifesteal || 0) / 100;
  if (lifestealPct > 0) {
    const healed = Math.min(st.maxHp - state.hp, Math.max(1, Math.round(damage * lifestealPct)));
    if (healed > 0) {
      state.hp += healed;
      battleLog(battle, `Вампиризм восстанавливает ${healed} HP.`, "heal");
    }
  }

  if (hasAffix) {
    const affixName = String(opts.affixType || battle.attackAffix || "АФФИКС").trim();
    const debuffId = affixName === "DEADLY" ? "poison" : "bleed";
    const dot = Math.max(1, Math.round(damage * 0.12));
    if (!Array.isArray(battle.enemyDebuffs)) battle.enemyDebuffs = [];
    const existing = battle.enemyDebuffs.find((d) => d.id === debuffId);
    if (existing) {
      existing.turns = Math.max(Number(existing.turns) || 0, 2);
      existing.damage = Math.max(Number(existing.damage) || 0, dot);
    } else {
      battle.enemyDebuffs.push({ id: debuffId, turns: 2, damage: dot });
    }
    battleLog(battle, `Аффикс «${affixName}»: ${debuffId === "poison" ? "яд" : "кровотечение"} — ${dot} урона.`, "warn");
  }

  const suffix = opts.isCombo === true ? " — КОМБО ×2.5!" : (isCrit ? " — КРИТ!" : "");
  battleLog(
    battle,
    `Удар (${STYLE_NAMES[style] || style})${suffix}: ${damage} урона (${ARMOR_TYPE_NAMES[armorType] || armorType} x${armorMult.toFixed(1)}).`,
    opts.isCombo === true || isCrit ? "crit" : "hit"
  );
  playHitSound(style, { isCrit: isCrit || opts.isCombo === true });
  if (isCrit || opts.isCombo === true) checkAchievements(state);

  // Равновесие снимает только полный ввод защиты (duelPlayerBlock): обычные
  // и случайные нажатия не должны сами по себе доводить моба до стана.
  return { damage, style, crit: isCrit || opts.isCombo === true };
}

// Успешный блок: урона нет, Равновесие −20, кураж +1.
function duelPlayerBlock(state, battle) {
  if (!battle || battle.over) return { stunned: false };
  const st = stats();
  battle.round = (battle.round || 0) + 1;
  battle.rage = Math.min(5, battle.rage + 1);
  battleLog(battle, `Вы блокируете удар ${battle.enemy.name}. +1 кураж.`, "block");
  Sfx.play("hit_block", { rate: COMBAT_HIT_RATE });

  if (state.archetype === "guardian") {
    const retaliation = Math.max(2, Math.round(battle.enemy.atk * (st.mods?.blockCounter || 0.1)));
    battle.hp = Math.max(0, battle.hp - retaliation);
    battleLog(battle, `Страж отвечает на блок: ${battle.enemy.name} теряет ${retaliation} HP.`, "hit");
  }

  duelBalanceLoss(battle, 20);
  // Успешная защита отодвигает следующий удар врага ещё на секунду.
  battle.enemyTimeLeft = Math.max(0, (Number(battle.enemyTimeLeft) || 0) + 1.0);
  return { stunned: battle.stunned === true };
}

// Удар моба по истечении замаха. Уворот/броня/шипы работают как раньше.
function duelEnemyStrike(state, battle) {
  if (!battle || battle.over) return { damage: 0, dodged: false, defeat: false };
  const st = stats();
  const e = battle.enemy;
  const uniques = equippedUniques();
  battle.round = (battle.round || 0) + 1;
  const zone = pick(ZONES);
  const zoneSlot = ZONE_TO_SLOT[zone.id] || "chest";
  const zoneArmorType = equippedArmorTypeFor(state, zoneSlot);
  const enemyWpn = e.weaponId ? ITEMS[e.weaponId] : null;
  const isNaturalAttack = !enemyWpn || enemyWpn.weaponType === "claw";
  const enemyStyle = isNaturalAttack ? (e.unarmedStyle || "bludgeoning") : weaponBestStyle(enemyWpn);
  const armorMult = ARMOR_STYLE_MULT[enemyStyle][zoneArmorType] || 1;

  const dodged = Math.random() * 100 < st.dodge;
  if (dodged) {
    battleLog(battle, `${e.name} бьёт в «${zone.name}», но вы уходите в сторону.`, "miss");
    Sfx.play("hit_miss", { rate: COMBAT_HIT_RATE });
    if ((st.counterOnDodge || 0) > 0) {
      const shadowDmg = Math.max(1, Math.round(st.atk * st.counterOnDodge - e.def * 0.3));
      battle.hp = Math.max(0, battle.hp - shadowDmg);
      battleLog(battle, `Талант «Тень»: контрудар! ${e.name} теряет ${shadowDmg} HP.`, "crit");
    }
    return { damage: 0, dodged: true, defeat: false };
  }

  let base = e.atk * rnd(0.85, 1.15) * armorMult;
  if ((e.enrage || e.ability === "rage") && battle.hp / battle.maxHp < 0.3) base *= 1.3;
  base -= Math.min(st.def * 0.8, base * DEFENSE_CAP);
  base *= 1 - Math.min(0.5, (st.damageReduction || 0) / 100);
  if (state.archetype === "guardian") base *= (st.mods?.dmgTakenMult || 1);
  const damage = Math.max(2, Math.round(base));
  state.hp = Math.max(0, state.hp - damage);
  battleLog(battle, `${e.name} бьёт в «${zone.name}» (${ARMOR_TYPE_NAMES[zoneArmorType]}, x${armorMult.toFixed(1)}): ${damage} урона.`, "enemy");
  playHitSound(enemyStyle, { isCrit: false });
  battle.lastPlayerHit = false;

  if (state.hp > 0 && state.hp <= Math.max(2, Math.round(st.maxHp * 0.05))) {
    if (!state.brinkSurvived) battleLog(battle, "Вы выживаете на последних каплях крови!", "warn");
    state.brinkSurvived = true;
    checkAchievements(state);
  }

  reflectThorns(battle, uniques, damage);

  if ((st.secondWind || 0) > 0 && state.hp > 0 && state.hp < st.maxHp * 0.2 && !battle.secondWindUsed) {
    battle.secondWindUsed = true;
    const healed = Math.min(st.maxHp - state.hp, Math.round(st.maxHp * 0.3));
    if (healed > 0) {
      state.hp += healed;
      battleLog(battle, `Талант «Невозгибимый»: +${healed} HP!`, "heal");
    }
  }

  if (e.ability === "vampire") {
    const healed = Math.max(1, Math.round(damage * VAMPIRE_HEAL_PERCENT));
    battle.hp = Math.min(battle.maxHp, battle.hp + healed);
    battleLog(battle, `${e.name} впитывает ${healed} HP.`, "heal");
  }
  if (e.ability === "poison") {
    if (battle.poisonImmune) {
      battleLog(battle, "Щит веры отражает яд!", "heal");
    } else {
      if (!Array.isArray(battle.playerDebuffs)) battle.playerDebuffs = [];
      const existing = battle.playerDebuffs.find((d) => d.id === "poison");
      if (existing) existing.turns = POISON_TURNS;
      else battle.playerDebuffs.push({ id: "poison", turns: POISON_TURNS });
      battleLog(battle, `${e.name} отравляет вас!`, "warn");
    }
  }

  return { damage, dodged: false, defeat: state.hp <= 0 };
}

// Комбо по оглушённому мобу: урон ×2.5, затем враг приходит в себя.
function duelComboAttack(state, battle) {
  if (!battle) return { damage: 0 };
  const res = duelPlayerAttack(state, battle, { isCombo: true });
  if (battle.hp > 0) duelRecover(battle);
  return res;
}

// Поражение: общая ветка для обычного размена и смерти от яда.
function defeatSummary(state, battle, e) {
  battle.over = true;
  const lost = Math.floor(state.gold * 0.15);
  state.gold = Math.max(0, state.gold - lost);
  
  let lostItemsText = "";

  const equippedUids = Object.values(state.equipped).filter(Boolean);
  const bagItems = state.owned.filter(inst => !equippedUids.includes(inst.uid));
  
  if (bagItems.length > 0) {
    state.owned = state.owned.filter(inst => equippedUids.includes(inst.uid));
    lostItemsText += ` Вы потеряли сумку со снаряжением (${bagItems.length} шт.).`;
  }

  const fresh = stats();
  state.hp = fresh.maxHp;
  state.mana = fresh.maxMana;
  
  battleLog(battle, `Тьма смыкается. Йорстед возвращает вас к жизни, но вы теряете день.${lostItemsText}`, "lose");
  saveState();
  return { defeat: true, enemyName: e.name, lostGold: lost, lostItemsText };
}

// ── Модификаторы урона/крита/уворота от титулов (по расе моба) ─────────────
// Бонусы применяются только если цель совпадает по расе (проверка id моба).
function achievementVsMobBonus(state, enemyId) {
  const b = titleBonusVsMob(state, enemyId);
  return {
    flat: b.atk || 0,       // плоский бонус урона
    dmgPct: b.dmgPct || 0,  // % урона
    crit: b.crit || 0,      // % крита
    dodge: b.dodge || 0,    // % уворота (защита против этой расы)
  };
}

function chooseEnemyAction(battle, lastPlayerAttack) {
  const prefers = battle.enemy.prefers || [];

  // Сильные мобы с canUseHeavyStrike копят кураж от ударов и ману каждый ход.
  // При 3+ куража и 6+ маны с шансом 50% бьют «Тяжёлым ударом» вместо
  // обычной атаки; иначе действуют по прежней логике.
  const e = battle.enemy;
  if (e.canUseHeavyStrike
    && (e.rage || 0) >= 3
    && (e.mana || 0) >= 6
    && Math.random() < 0.5) {
    const heavyZone = prefers.length ? pick(prefers) : pick(ZONES).id;
    return { action: "heavy_strike", attack: heavyZone, blocks: [] };
  }

  let attack = "";
  
  const playerBlocksHistory = battle.playerBlocksHistory || [];
  const lastBlocks = playerBlocksHistory.slice(-2);
  
  // Если игрок блокирует одну и ту же зону 2 раза подряд, моб бьет в другую
  if (lastBlocks.length === 2 && lastBlocks[0].length === 1 && lastBlocks[1].length === 1 && lastBlocks[0][0] === lastBlocks[1][0]) {
    const blockedZone = lastBlocks[0][0];
    const availableZones = ZONES.filter(z => z.id !== blockedZone).map(z => z.id);
    attack = pick(availableZones);
    battleLog(battle, `${battle.enemy.name} замечает вашу привычку блокировать «${ZONE_NAME[blockedZone]}».`, "warn");
  } else {
    attack = prefers.length && Math.random() < 0.65 ? pick(prefers) : pick(ZONES).id;
  }

  const blocks = [];
  const blockCount = Math.max(0, Math.min(ZONES.length, Number.isFinite(battle.enemy.blocks) ? battle.enemy.blocks : (battle.boss ? 2 : 1)));
  const adaptChance = (battle.boss ? 0.5 : 0.35) * (battle.enemy.ability === "adaptive" ? ADAPTIVE_MULT : 1);
  
  if (lastPlayerAttack && Math.random() < adaptChance) {
    blocks.push(lastPlayerAttack);
  }

  let guard = 0;
  while (blocks.length < blockCount && guard < 200) {
    guard += 1;
    const zone = pick(ZONES).id;
    if (!blocks.includes(zone)) blocks.push(zone);
  }
  
  return { attack, blocks };
}

function battleLog(battle, text, cls) {
  battle.log.push({ text, cls: cls || "info" });
}

// Моб злится, когда получает урон: +1 кураж за попадание игрока.
function gainEnemyRage(battle, amount = 1) {
  const enemy = battle && battle.enemy;
  if (!enemy) return;
  enemy.rage = Math.min(enemy.maxRage || 5, (enemy.rage || 0) + amount);
}

// ── Активные навыки (таланты с умениями) ─────────────────────────────────────
// Проверяет изученность, откат, ману и кураж; списывает стоимость и ставит
// откат. Возвращает { talent, error } — при ошибке бой продолжается без списаний.
function activateSkill(state, battle, talentId) {
  const talent = TALENT_MAP[talentId];
  const skill = talent && talent.active ? talent.skill : null;
  if (!skill) return { talent, error: "Неизвестный навык." };
  if (!((state.talents || {})[talentId])) return { talent, error: `Навык «${skill.name}» ещё не изучен. Он открывается в ветке талантов.` };
  battle.skillCd = battle.skillCd || {};
  if ((battle.skillCd[talentId] || 0) > 0) {
    return { talent, error: `«${skill.name}» будет готов через ${battle.skillCd[talentId]} х.` };
  }
  if (state.mana < skill.manaCost) return { talent, error: `Не хватает маны: ${state.mana}/${skill.manaCost}.` };
  if (skill.rageCost && battle.rage < skill.rageCost) return { talent, error: `Нужно ${skill.rageCost} ед. куража.` };

  state.mana -= skill.manaCost;
  if (skill.rageCost) battle.rage -= skill.rageCost;
  battle.skillCd[talentId] = skill.cooldown || 1;
  battleLog(battle, `Вы применяете навык «${skill.name}».`, "info");
  return { talent, error: null };
}

// Шипы: часть полученного урона возвращается атакующему.
function reflectThorns(battle, uniques, damage) {
  if (!uniques.includes("thorns")) return;
  const reflected = Math.max(1, Math.round(damage * THORNS_PERCENT));
  battle.hp = Math.max(0, battle.hp - reflected);
  battleLog(battle, `Шипы отражают ${reflected} урона.`, "hit");
}
// Базовая сила удара до вычета защиты. Вынесено, чтобы прогноз и размен
// считали урон по одной формуле.
function computeStrikeBase(st, { power = 1, zoneMult = 1, styleMult = 1, armorMult = 1, variance = 1 } = {}) {
  return st.atk * power * zoneMult * styleMult * armorMult * variance;
}

function estimateDamage(state, battle, zoneId, style, weaponInst = null) {
  if (!battle || battle.over) return 0;
  const st = stats();
  const e = battle.enemy;
  const zone = ZONE_MAP[zoneId];
  if (!zone) return 0;

  const mainInst = weaponInst !== undefined ? weaponInst : (state.equipped.mainhand ? getInstance(state.equipped.mainhand) : null);
  const weapon = mainInst ? ITEMS[mainInst.id] : null;
  
  // Проверяем, бьет ли оружие этим стилем, иначе берем лучший
  const isMonkUnarmed = state.archetype === "monk" && !weapon;
  const actualStyle = isMonkUnarmed
    ? (STYLE_ORDER.includes(style) ? style : "slashing")
    : (weaponStyleValue(weapon, style, mainInst) > 0 ? style : weaponBestStyle(weapon, mainInst));
  const styleMult = isMonkUnarmed ? MONK_UNARMED_STYLE_MULT : weaponStyleMult(weapon, actualStyle, mainInst);
  
  const armorType = e.armorType || "leather";
  const armorMult = ARMOR_STYLE_MULT[actualStyle][armorType] || 1;
  const zoneMult = zone.damageMult || 1;
  
  // Считаем средний урон (без учета крита и случайного разброса)
  const base = computeStrikeBase(st, { zoneMult, styleMult, armorMult });
  
  const pierce = (zone.armorPierce || 0) + (st.armorPierce || 0) / 100;
  const effectiveDef = e.def * (1 - pierce);

  let avg = Math.max(1, Math.round(base - effectiveDef * 0.6));
  // Прогноз учитывает бонусы титулов против этой расы.
  const achVs = achievementVsMobBonus(state, e.id);
  if (achVs.dmgPct) avg = Math.max(1, Math.round(avg * (1 + achVs.dmgPct / 100)));
  avg += achVs.flat;
  return avg;
}

// Звук попадания: стиль оружия → набор вариантов, крит — отдельный файл.
// Небольшое ускорение (1.1×) не даёт длинным файлам ударов наслаиваться
// в «кашу» при быстром вводе комбинаций.
const COMBAT_HIT_RATE = 1.1;

function playHitSound(style, { isCrit = false } = {}) {
  if (isCrit) {
    if (style === "bludgeoning") Sfx.play("hit_crit_blunt", { rate: COMBAT_HIT_RATE });
    else Sfx.play("hit_crit_slash", { rate: COMBAT_HIT_RATE });
    return;
  }
  const id = (style === "bludgeoning") ? "hit_blunt" : "hit_slash";
  Sfx.play(id, { rate: COMBAT_HIT_RATE });
}

function exchange(state, battle, action, weaponInst = null) {
  if (!battle || battle.over) return { error: "Бой уже закончился." };
  // «Боевая печать» идёт двумя раздельными разменами: attack — только удар
  // игрока, defense — только ответ врага. Остальные действия — одним разменом.
  const typingPhase = action && action.typingPhase;
  const typingAttackPhase = typingPhase === "attack";
  const typingDefensePhase = typingPhase === "defense";

  const wasStaggered = battle.staggered;
  battle.staggered = false;

  const st = stats();
  const e = battle.enemy;
  // Регенерация маны моба — раз за раунд, в фазе атаки.
  if (!typingDefensePhase) e.mana = Math.min(e.maxMana || 20, (e.mana || 0) + 1);
  const achVs = achievementVsMobBonus(state, e.id);
  const uniques = equippedUniques();
  // В фазе атаки враг ещё не действует: его ход рассчитывается в фазе защиты.
  const enemyAction = typingAttackPhase
    ? { blocks: [], attack: null, action: null, manaSpent: 0 }
    : chooseEnemyAction(battle, battle.lastPlayerAttack);
  if (!typingDefensePhase) battle.lastPlayerHit = false;

  if (!typingAttackPhase) {
    if (!Array.isArray(battle.enemyBlockHistory)) battle.enemyBlockHistory = [];
    battle.enemyBlockHistory.push([...enemyAction.blocks]);
    if (battle.enemyBlockHistory.length > 8) battle.enemyBlockHistory.shift();

    if (!Array.isArray(battle.enemyAttackHistory)) battle.enemyAttackHistory = [];
    battle.enemyAttackHistory.push(enemyAction.attack);
    if (battle.enemyAttackHistory.length > 8) battle.enemyAttackHistory.shift();
  }

  // Яды, кровотечения и регенерация тикают раз за раунд — в фазе атаки.
  // В фазе защиты это уже произошло, второй тик не нужен.
  if (!typingDefensePhase) {
    if (Array.isArray(battle.playerDebuffs) && battle.playerDebuffs.length) {
      const poison = battle.playerDebuffs.find((d) => d.id === "poison");
      if (poison) {
        let damage = Math.max(2, Math.round(e.atk * POISON_ATK_MULT));
        if (state.archetype === "guardian") damage = Math.round(damage * (st.mods?.dmgTakenMult || 1));
        state.hp = Math.max(0, state.hp - damage);
        poison.turns -= 1;
        if (poison.turns <= 0) battle.playerDebuffs = battle.playerDebuffs.filter((d) => d !== poison);
        battleLog(battle, `Яд разъедает раны: ${damage} урона.`, "warn");
      }
    }

    if (Array.isArray(battle.enemyDebuffs) && battle.enemyDebuffs.length) {
      const poison = battle.enemyDebuffs.find((d) => d.id === "poison");
      if (poison) {
        const damage = Number(poison.damage) || 5;
        battle.hp = Math.max(0, battle.hp - damage);
        poison.turns -= 1;
        if (poison.turns <= 0) battle.enemyDebuffs = battle.enemyDebuffs.filter((d) => d !== poison);
        battleLog(battle, `Яд разъедает врага на ${damage} урона!`, "warn");
      }
      const bleed = battle.enemyDebuffs.find((d) => d.id === "bleed");
      if (bleed) {
        const damage = Number(bleed.damage) || 3;
        battle.hp = Math.max(0, battle.hp - damage);
        bleed.turns -= 1;
        if (bleed.turns <= 0) battle.enemyDebuffs = battle.enemyDebuffs.filter((d) => d !== bleed);
        battleLog(battle, `Кровотечение наносит врагу ${damage} урона.`, "warn");
      }
    }

    if ((st.hpRegen || 0) > 0 && state.hp > 0) {
      const regen = Math.min(st.hpRegen, st.maxHp - state.hp);
      if (regen > 0) {
        state.hp += regen;
        battleLog(battle, `Регенерация: +${regen} HP.`, "heal");
      }
    }
  }

  if (state.hp <= 0) {
    return { ok: true, summary: defeatSummary(state, battle, e) };
  }

  if (action.type === "heal") {
    const potion = ITEMS[action.id];
    if (!potion || potion.type !== "potion") return { error: "Неизвестное зелье." };
    if ((state.potions[action.id] || 0) <= 0) return { error: "Зелья не осталось." };

    let healed = 0;
    if (potion.effect === "hp") {
      healed = Math.min(potion.amount, st.maxHp - state.hp);
      state.hp += healed;
    } else {
      healed = Math.min(potion.amount, st.maxMana - state.mana);
      state.mana += healed;
    }
    if (healed <= 0) return { error: "Показатель уже полон." };

    state.potions[action.id] -= 1;
    battleLog(
      battle,
      `Вы выпиваете «${potion.name}» и восстанавливаете ${healed} ${potion.effect === "hp" ? "HP" : "маны"}.`,
      "heal"
    );
  } else if (action.type === "item") {
    const item = ITEMS[action.id];
    if (!item || item.type !== "combat") return { error: "Неизвестный боевой предмет." };
    if ((state.potions[action.id] || 0) <= 0) return { error: "Предмет закончился." };
    if (item.effect !== "smoke" && item.effect !== "fire" && item.effect !== "poison") return { error: "Неизвестный эффект предмета." };

    state.potions[action.id] -= 1;

    if (item.effect === "poison") {
      battle.enemyDebuffs = battle.enemyDebuffs || [];
      battle.enemyDebuffs.push({ id: "poison", turns: Number(item.turns) || 3, damage: Number(item.damage) || 5 });
      battleLog(battle, "Вы разбили флакон с ядом!", "info");
    } else if (item.effect === "smoke") {
      battle.tripped = true;
      battleLog(battle, "Вы бросили дымовую бомбу. Враг дезориентирован!", "info");
    } else {
      const dmg = Number(item.damage) || 20;
      battle.hp = Math.max(0, battle.hp - dmg);
      battleLog(battle, `Греческий огонь опалил врага на ${dmg} урона!`, "crit");
    }
  } else if (action.type === "flee") {
    // Побег: игрок не бьёт и не блокирует, теряет 5 энергии.
    // Удар в спину можно УВЕРНУТЬСЯ (по статам dodge). Если увернулся —
    // враг бьёт в пустоту (enemyAction.attack = null), игрок сбегает целым.
    state.energy = Math.max(0, state.energy - 5);
    const dodgedBackstab = Math.random() * 100 < st.dodge;
    if (dodgedBackstab) {
      battleLog(battle, "Вы уворачиваетесь от удара в спину и сбегаете! (-5 энергии)", "info");
      enemyAction.attack = null; // отменяем атаку врага в этом ходу
    } else {
      battleLog(battle, "Вы пытаетесь сбежать, но получаете удар в спину! (-5 энергии)", "warn");
    }
  } else if (action.type === "pass") {
    battleLog(battle, "Вы меняете оружие.", "info");
  } else if (action.type === "defend") {
    // Защитный размен без удара игрока: смена оружия, провал комбинации
    // навыка или отдельная фаза защиты печати. Моб бьёт, игрок защищается.
    if (!typingDefensePhase) {
      battleLog(battle, "Вы прикрываетесь и ждёте ответного удара.", "info");
    }
  } else {
    const isSkill = action.type === "skill";
    let skillInfo = null;
    if (isSkill) {
      skillInfo = activateSkill(state, battle, action.id);
      if (skillInfo.error) return { error: skillInfo.error };
    }

    // «Щит веры» не требует зоны удара: лечение + иммунитет к яду.
    if (skillInfo && skillInfo.talent.skill.effect === "faith") {
      const heal = Math.min(st.maxHp - state.hp, Math.round(st.maxHp * 0.3));
      if (heal > 0) {
        state.hp += heal;
        battleLog(battle, `Щит веры заживляет раны: +${heal} HP.`, "heal");
      } else {
        battleLog(battle, "Щит веры окутывает вас сиянием — раны уже чисты.", "heal");
      }
      battle.poisonImmune = true;
      if (Array.isArray(battle.playerDebuffs) && battle.playerDebuffs.some((d) => d.id === "poison")) {
        battle.playerDebuffs = battle.playerDebuffs.filter((d) => d.id !== "poison");
        battleLog(battle, "Свет сжигает яд!", "heal");
      }
      battle.lastPlayerAttack = null;
    } else {
    if (!action.zone || !ZONE_NAME[action.zone]) return { error: "Выберите зону удара." };

    const zone = ZONE_MAP[action.zone];
    const zoneName = zone.name;
    const skillEffect = skillInfo ? skillInfo.talent.skill.effect : null;
    const skillUnblockable = skillEffect === "fury" || skillEffect === "aim"; // «в 2 зоны»: блок не помогает
    // Успешно введённое слово печати всегда пробивает блок и стан:
    // старые проверки зон/ошеломления больше не съедают урон.
    const typingSpeed = Number.isFinite(action.typingSpeed) ? action.typingSpeed : null;
    const typingAttack = typingSpeed !== null;
    const blocked = !typingAttack && !skillUnblockable && !wasStaggered && enemyAction.blocks.includes(action.zone);
    const enemyDodged = !typingAttack && (e.dodgeBonus || 0) > 0 && Math.random() * 100 < e.dodgeBonus;

    if (blocked) {
      battleLog(battle, `Удар в «${zoneName}» — ${e.name} успевает закрыться.`, "block");
      Sfx.play("hit_block", { rate: COMBAT_HIT_RATE });
      if (zone.risk && Math.random() < zone.risk) {
        battle.riskyMiss = true;
      }
    } else if (enemyDodged) {
      battleLog(battle, `${e.name} уклоняется от удара в «${zoneName}».`, "miss");
      Sfx.play("hit_miss", { rate: COMBAT_HIT_RATE });
    } else {
      const power = skillEffect === "fury" ? 1.8 : 1;
      const zoneMult = zone.damageMult || 1;
      const wanted = STYLE_ORDER.includes(action.style) ? action.style : "slashing";
      const mainInst = weaponInst !== undefined ? weaponInst : (state.equipped.mainhand ? getInstance(state.equipped.mainhand) : null);
      const weapon = mainInst ? ITEMS[mainInst.id] : null;
      const isMonkUnarmed = state.archetype === "monk" && !weapon;
      const style = isMonkUnarmed
        ? (STYLE_ORDER.includes(battle.monkStance) ? battle.monkStance : MONK_DEFAULT_STANCE)
        : (weaponStyleValue(weapon, wanted, mainInst) > 0 ? wanted : weaponBestStyle(weapon, mainInst));
      const styleMult = isMonkUnarmed ? MONK_UNARMED_STYLE_MULT : weaponStyleMult(weapon, style, mainInst);
      if (styleMult <= 0) return { error: "Это оружие не бьёт таким стилем." };

      const armorType = e.armorType || "leather";
      const armorMult = ARMOR_STYLE_MULT[style][armorType] || 1;

      let base = computeStrikeBase(st, { power, zoneMult, styleMult, armorMult, variance: rnd(0.9, 1.1) });
      const critChance = st.crit + achVs.crit + (zone.critBonus || 0);
      // «Боевая печать»: крит выпадает вместе с длинным словом (флаг isCrit),
      // поэтому случайный крит в этом режиме не бросается.
      const typingFailed = typingAttack && (action.typingAttackSuccess === false || typingSpeed >= 999);
      // навык «Точный выстрел» гарантирует крит; быстрое комбо тоже критует
      const crit = typingAttack
        ? (!typingFailed && action.isCrit === true)
        : ((action.comboFast === true || skillEffect === "aim")
          ? true
          : Math.random() * 100 < critChance);
      if (crit) {
        // В режиме печати множитель ×1.5 применяется к готовому урону ниже.
        if (!typingAttack) base *= 1.7;
        state.critCount = (state.critCount || 0) + 1;
      }

      const pierce = (zone.armorPierce || 0) + (st.armorPierce || 0) / 100;
      const effectiveDef = e.def * (1 - pierce);
      let damage = Math.max(1, Math.round(base - effectiveDef * 0.6));

      // Бонусы титулов против этой расы: % урона и плоский урон.
      if (achVs.dmgPct) damage = Math.max(1, Math.round(damage * (1 + achVs.dmgPct / 100)));
      damage += achVs.flat;

      // Провал комбо: удар всё равно проходит, но ослабленным.
      if (action.comboSuccess === false) {
        damage = Math.max(1, Math.round(damage * 0.3));
        battleLog(battle, "Вы сбились с ритма!", "warn");
      }

      // Медленный ввод комбо (меньше 1.5 с на таймере): −10% урона.
      if (action.comboSlow === true) {
        damage = Math.max(1, Math.round(damage * 0.9));
      }

      // «Боевая печать»: сила даёт множитель за быстрый ввод (<1.5 с),
      // длинное слово — крит ×1.5, аффикс — ×1.2 и эффект. Множители
      // перемножаются; провал/таймаут — 0 урона.
      if (typingAttack) {
        if (typingFailed) {
          damage = 0;
        } else {
          const str = Math.max(0, Number(st.attrs?.str) || 0);
          const speedMult = typingSpeed < 1.5 ? 1.0 + str * 0.02 : 1.0;
          const critMult = action.isCrit === true ? 1.5 : 1.0;
          const affixMult = action.hasAffix === true ? 1.2 : 1.0;
          damage = Math.max(1, Math.round(damage * speedMult * critMult * affixMult));
        }
      }

      if (damage <= 0) {
        // Провал печати: удар не нанесён, кураж и вампиризм не срабатывают.
        battle.lastPlayerHit = false;
        battleLog(battle, "Печать сбилась — удар ушёл в пустоту.", "miss");
        Sfx.play("hit_miss", { rate: COMBAT_HIT_RATE });
      } else {
        battle.hp = Math.max(0, battle.hp - damage);
        gainEnemyRage(battle);
        battle.lastPlayerHit = true;
        battle.rage = Math.min(5, battle.rage + (st.ragePerHit || 1));

        const lifestealPct = (uniques.includes("lifesteal") ? LIFESTEAL_PERCENT : 0) + (st.lifesteal || 0) / 100;
        if (lifestealPct > 0) {
          const healed = Math.min(st.maxHp - state.hp, Math.max(1, Math.round(damage * lifestealPct)));
          if (healed > 0) {
            state.hp += healed;
            battleLog(battle, `Вампиризм восстанавливает ${healed} HP.`, "heal");
          }
        }

        const suffix = crit ? ` — КРИТ В ${ZONE_ACCUSATIVE[action.zone] || zone.name.toUpperCase()}!` : "";
        battleLog(
          battle,
          `Удар в «${zoneName}» (${STYLE_NAMES[style]})${suffix}: ${damage} урона (${ARMOR_TYPE_NAMES[armorType]} x${armorMult.toFixed(1)}).`,
          crit ? "crit" : "hit"
        );

        // Аффикс усиливает удар и накладывает эффект: «DEADLY» — яд,
        // остальные приставки — кровотечение.
        if (action.hasAffix === true) {
          const affixName = String(action.affixType || "АФФИКС").trim();
          const debuffId = affixName === "DEADLY" ? "poison" : "bleed";
          const dot = Math.max(1, Math.round(damage * 0.12));
          if (!Array.isArray(battle.enemyDebuffs)) battle.enemyDebuffs = [];
          const existing = battle.enemyDebuffs.find((d) => d.id === debuffId);
          if (existing) {
            existing.turns = Math.max(Number(existing.turns) || 0, 2);
            existing.damage = Math.max(Number(existing.damage) || 0, dot);
          } else {
            battle.enemyDebuffs.push({ id: debuffId, turns: 2, damage: dot });
          }
          battleLog(
            battle,
            `Аффикс «${affixName}»: ${debuffId === "bleed" ? "кровотечение" : "яд"} — ${dot} урона 2 хода.`,
            "warn"
          );
        }

        if (crit) {
          // Крит-звук мог уже сыграть на последней стрелке быстрого комбо.
          if (!action.silentPlayerCrit) playHitSound(style, { isCrit: true });
        } else if (!action.silentPlayerHit) {
          // Обычный удар уже прозвучал на последней верной стрелке — не дублируем.
          playHitSound(style, { isCrit: false });
        }

        // Криты считаются на «Мастера клинка» — проверка ачивок прямо здесь.
        if (crit) checkAchievements(state);
      }

      if (zone.staggerChance && Math.random() < zone.staggerChance) {
        battle.staggered = true;
        battleLog(battle, `${e.name} теряет стойку — следующий блок пропущен.`, "info");
      }
      if (zone.tripChance && Math.random() < zone.tripChance) {
        battle.tripped = true;
        battleLog(battle, `${e.name} спотыкается — ответный удар пропущен.`, "info");
      }
    }

    battle.lastPlayerAttack = action.zone;
    } // конец ветки удара (обычная атака / приём / навык-удар)
  }

  // ── Действия компаньона (раз в ход) ──────────────────────────────────────
  const companion = activeCompanion();
  battle.companionStunned = false;
  battle.companionBlocked = false;
  if (companion && !typingDefensePhase && battle.hp > 0 && state.hp > 0) {
    battle.companionTurn = (battle.companionTurn || 0) + 1;
    if (companion.id === "mira" && battle.companionTurn % 3 === 0) {
      const heal = Math.min(st.maxHp - state.hp, Math.max(1, Math.round(st.maxHp * 0.1)));
      if (heal > 0) {
        state.hp += heal;
        battleLog(battle, `Мира перевязывает раны: +${heal} HP.`, "heal");
      } else {
        battleLog(battle, "Мира осматривает раны: они уже закрыты.", "info");
      }
    } else if (companion.id === "alva") {
      const chance = Math.min(100, battle.alvaStunChance || 10);
      if (Math.random() * 100 < chance) {
        battle.companionStunned = true;
        battle.alvaStunChance = 10;
        battleLog(battle, `Альва сбивает ${e.name} с ритма — враг пропускает удар.`, "block");
      } else {
        battle.alvaStunChance = Math.min(100, chance + 5);
      }
    } else if (companion.id === "solveig") {
      if (battle.companionTurn % 3 === 0) {
        const hit = Math.max(1, Math.round(st.atk * 0.5 - e.def * 0.3));
        battle.hp = Math.max(0, battle.hp - hit);
        battleLog(battle, `Сольвейг бьёт сбоку: ${e.name} теряет ${hit} HP.`, "hit");
      }
      if (battle.hp > 0 && Math.random() * 100 < 10) {
        battle.companionBlocked = true;
        battleLog(battle, "Сольвейг принимает удар на себя.", "block");
      }
    }
  }

  // Ответ врага — только в фазе защиты (или в обычном совместном размене).
  if (!typingAttackPhase && battle.hp > 0) {
    if (battle.companionStunned || battle.companionBlocked) {
      battleLog(battle, battle.companionStunned
        ? `${e.name} не успевает ответить.`
        : "Сольвейг закрывает вас — урона нет.", "block");
    } else if (battle.tripped) {
      battleLog(battle, `${e.name} всё ещё поднимается — вы получаете передышку.`, "info");
      battle.tripped = false;
    } else if (battle.riskyMiss) {
      let base = e.atk * rnd(1.0, 1.2);
      base -= Math.min(st.def * 0.8, base * DEFENSE_CAP);
      base *= 1 - Math.min(0.5, (st.damageReduction || 0) / 100);
      if (state.archetype === "guardian") base *= (st.mods?.dmgTakenMult || 1);
      const damage = Math.max(2, Math.round(base));
      state.hp = Math.max(0, state.hp - damage);
      battleLog(battle, `${e.name} ловит ваш промах: ${damage} урона.`, "enemy");
      reflectThorns(battle, uniques, damage);
      if (e.ability === "vampire") {
        const healed = Math.max(1, Math.round(damage * VAMPIRE_HEAL_PERCENT));
        battle.hp = Math.min(battle.maxHp, battle.hp + healed);
        battleLog(battle, `${e.name} впитывает ${healed} HP.`, "heal");
      }
      battle.riskyMiss = false;
    } else if (enemyAction.attack) {
      const heavyStrike = enemyAction.action === "heavy_strike";
      // Предупреждение о ярости: моб копит 3+ куража, и его следующий удар
      // будет сокрушительным. Бейдж в UI дублирует это состояние.
      if ((e.rage || 0) >= 3) {
        battleLog(battle, `⚠️ ${e.name} в ярости! Следующий удар будет сокрушительным!`, "warn");
      }
      if (heavyStrike) {
        e.rage = Math.max(0, (e.rage || 0) - 3);
        e.mana = Math.max(0, (e.mana || 0) - 6);
        battleLog(battle, `${e.name} использует Тяжёлый удар!`, "warn");
      }
      // Комбо защиты: успех — парирование (0 урона, +1 кураж),
      // провал — полный урон моба без уворота и парирования.
      const playerParried = action.defenseSuccess === true;
      const defenseFailed = action.defenseSuccess === false;
      const enemyZone = ZONE_NAME[enemyAction.attack];

      if (playerParried) {
        // Кураж за парирование: успешное комбо защиты даёт +1 кураж.
        battle.rage = Math.min(5, battle.rage + 1);
        battleLog(battle, `${e.name} бьёт в «${enemyZone}» — вы парируете. +1 кураж.`, "block");
        Sfx.play("hit_block", { rate: COMBAT_HIT_RATE });

        if (state.archetype === "guardian") {
          const retaliation = Math.max(2, Math.round(e.atk * (st.mods?.blockCounter || 0.1)));
          battle.hp = Math.max(0, battle.hp - retaliation);
          battleLog(battle, `Страж отвечает на парирование: ${e.name} теряет ${retaliation} HP.`, "hit");
        }
      } else if (!defenseFailed && Math.random() * 100 < st.dodge + achVs.dodge) {
        battleLog(battle, `${e.name} бьёт в «${enemyZone}», но вы уходите в сторону.`, "miss");
        Sfx.play("hit_miss", { rate: COMBAT_HIT_RATE });
        Sfx.play("footstep_land");
        
        if ((st.counterOnDodge || 0) > 0) {
          const shadowDmg = Math.max(1, Math.round(st.atk * st.counterOnDodge - e.def * 0.3));
          battle.hp = Math.max(0, battle.hp - shadowDmg);
          battleLog(battle, `Талант «Тень»: контрудар! ${e.name} теряет ${shadowDmg} HP.`, "crit");
        }

        if (Math.random() * 100 < st.counter) {
          const counterDmg = Math.max(1, Math.round(st.atk * 0.5 - e.def * 0.3));
          battle.hp = Math.max(0, battle.hp - counterDmg);
          battle.rage = Math.min(5, battle.rage + 1);
          battleLog(battle, `Контратака! ${e.name} теряет ${counterDmg} HP.`, "crit");
        }
      } else {
        const zoneSlot = ZONE_TO_SLOT[enemyAction.attack] || "chest";
        const zoneArmorType = equippedArmorTypeFor(state, zoneSlot);
        const enemyWpn = e.weaponId ? ITEMS[e.weaponId] : null;
        // Когти — это естественное оружие, а не сталь: урон считается как безоружный.
        const isNaturalAttack = !enemyWpn || enemyWpn.weaponType === "claw";
        const enemyStyle = isNaturalAttack
          ? (e.unarmedStyle || "bludgeoning")
          : weaponBestStyle(enemyWpn);
        const armorMult = ARMOR_STYLE_MULT[enemyStyle][zoneArmorType] || 1;

        let base = e.atk * rnd(0.85, 1.15) * armorMult;
        if (heavyStrike) base *= 1.5;
        base -= Math.min(st.def * 0.8, base * DEFENSE_CAP);
        base *= 1 - Math.min(0.5, (st.damageReduction || 0) / 100);
        if ((e.enrage || e.ability === "rage") && battle.hp / battle.maxHp < 0.3) base *= 1.3;
        if (state.archetype === "guardian") base *= (st.mods?.dmgTakenMult || 1);
        const damage = Math.max(2, Math.round(base));
        state.hp = Math.max(0, state.hp - damage);
        battleLog(battle, `${e.name} бьёт в «${enemyZone}» (${ARMOR_TYPE_NAMES[zoneArmorType]}, x${armorMult.toFixed(1)}): ${damage} урона.`, "enemy");
        playHitSound(enemyStyle, { isCrit: false });

        // На волоске от смерти: удар чуть не убил — счёт для «Бессмертного».
        if (state.hp > 0 && state.hp <= Math.max(2, Math.round(st.maxHp * 0.05))) {
          if (!state.brinkSurvived) battleLog(battle, "Вы выживаете на последних каплях крови!", "warn");
          state.brinkSurvived = true;
          checkAchievements(state);
        }

        reflectThorns(battle, uniques, damage);

        if ((st.secondWind || 0) > 0 && state.hp > 0 && state.hp < st.maxHp * 0.2 && !battle.secondWindUsed) {
          battle.secondWindUsed = true;
          const healed = Math.min(st.maxHp - state.hp, Math.round(st.maxHp * 0.3));
          if (healed > 0) {
            state.hp += healed;
            battleLog(battle, `Талант «Невозгибимый»: вы приходите в себя и восстанавливаете ${healed} HP!`, "heal");
          }
        }

        if (e.ability === "vampire") {
          const healed = Math.max(1, Math.round(damage * VAMPIRE_HEAL_PERCENT));
          battle.hp = Math.min(battle.maxHp, battle.hp + healed);
          battleLog(battle, `${e.name} впитывает ${healed} HP.`, "heal");
        }
        if (e.ability === "poison") {
          if (battle.poisonImmune) {
            battleLog(battle, "Щит веры отражает яд!", "heal");
          } else {
            if (!Array.isArray(battle.playerDebuffs)) battle.playerDebuffs = [];
            const existing = battle.playerDebuffs.find((d) => d.id === "poison");
            if (existing) {
              existing.turns = POISON_TURNS;
              battleLog(battle, `Яд обновлён: ещё ${POISON_TURNS} хода.`, "warn");
            } else {
              battle.playerDebuffs.push({ id: "poison", turns: POISON_TURNS });
              battleLog(battle, `${e.name} отравляет вас!`, "warn");
            }
          }
        }
      }
    }
  }

  // Конец раунда: мана, откаты, ход и износ снаряжения — только в фазе
  // защиты (или в обычном размене). В фазе атаки раунд ещё не закончен.
  if (!typingAttackPhase) {
    state.mana = Math.min(st.maxMana, state.mana + MANA_REGEN);

    // Тик откатов активных навыков: −1 ход за размен.
    if (battle.skillCd) {
      for (const id of Object.keys(battle.skillCd)) {
        if (battle.skillCd[id] > 0) battle.skillCd[id] -= 1;
      }
    }

    battle.round = (battle.round || 0) + 1;

    const brokenGear = wearEquipment();
    if (brokenGear.length) {
      const names = brokenGear.map((inst) => getItemDisplayName(inst)).join(", ");
      battleLog(battle, `Сломалось: ${names}.`, "warn");
    }
  }

  let summary = null;

  if (battle.hp <= 0 && action.type !== "flee") {
    summary = finishVictory(state, battle);
  } else if (state.hp <= 0) {
    summary = defeatSummary(state, battle, e);
  } else if (action.type === "flee") {
    battle.over = true;
    battleLog(battle, "Вы вырываетесь из боя.", "info");
    summary = { fled: true, enemyName: e.name };
  }

  return { ok: true, summary };
}

// Победа над мобом. Вынесено из exchange(), чтобы тот же расчёт наград
// могли использовать QTE-атаки, которые наносят урон после размена.
function finishVictory(state, battle) {
  const e = battle.enemy;
  const st = stats();
  const companion = activeCompanion();
  battle.over = true;
  state.kills = (state.kills || 0) + 1;
  if (companion) {
    const affinity = addAffinity(companion.id, 1);
    if (affinity) battleLog(battle, `${companion.name}: +1 привязанности.`, "info");
  }
  // Бестиарий: сколько раз убит каждый конкретный моб (и боссы тоже).
  state.bestiaryKills = state.bestiaryKills || {};
  state.bestiaryKills[e.id] = (state.bestiaryKills[e.id] || 0) + 1;
  // Достижения триггерятся на победу (счётчики убийств) — до saveState.
  checkAchievements(state);
  checkQuestProgress(e.id);

  const goldMult = goldMultToday();
  const xpMult = xpMultToday();
  const rarityGold = e.rarity === "elite" ? ELITE_REWARDS.goldMult : e.rarity === "rare" ? RARE_REWARDS.goldMult : 1;
  const rarityXp = e.rarity === "elite" ? ELITE_REWARDS.xpMult : e.rarity === "rare" ? RARE_REWARDS.xpMult : 1;
  const gold = Math.max(1, Math.floor(e.gold * GOLD_DROP_MULT * goldMult * rarityGold * (1 + (st.goldBonus || 0) / 100)));
  const xp = Math.max(1, Math.floor(e.xp * xpMult * rarityXp));

  state.gold += gold;
  const up = gainXp(xp);

  let unlock = null;
  if (battle.boss && !state.cleared[battle.floorId]) {
    state.cleared[battle.floorId] = true;
    if (state.maxFloor < 5) {
      state.maxFloor = Math.max(state.maxFloor, battle.floorId + 1);
      unlock = state.maxFloor;
    }
  }

  battleLog(battle, `${e.name} падает. Победа!`, "win");

  const loot = rollDrops(e);
  if (loot.length) {
    battleLog(battle, `Выпало: ${lootText(loot)}.`, "loot");
  }

  const summary = {
    victory: true,
    enemyName: e.name,
    gold,
    xp,
    loot,
    levels: up.levels,
    points: up.points,
    totalPoints: state.points,
    unlock,
    newLevel: state.level,
  };
  saveState();
  return summary;
}