// Бой в духе «Бойцовского клуба»: размен ударами.
// Оба бойца одновременно выбирают зону удара и зоны блока.

function rnd(min, max) {
  return min + Math.random() * (max - min);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
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
    turn: 0,
    log: [],
    over: false,
    floorId,
    floorBg: floor ? floor.bg : "assets/backgrounds/floor1.webp",
    boss: Boolean(enemyDef.boss),
    lastPlayerAttack: null,
    staggered: false,
    tripped: false,
    riskyMiss: false,
    secondWindUsed: false,
    enemyBlockHistory: [],
    enemyAttackHistory: [],
    playerBlocksHistory: [], // <--- ДОБАВЛЕНО
    playerDebuffs: [],
    monkStance: MONK_DEFAULT_STANCE,
    skillCd: {}, // откат активных навыков: { talentId: ходов до готовности }
  };
  
  const label = variationLabel(enemy);
  if (label) battleLog(battle, `${enemy.name} — ${label}`, "info");
  if (enemy.weaponId) battleLog(battle, `${enemy.name} достаёт ${ITEMS[enemy.weaponId].name}!`, "warn");
  return battle;
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
  
  const safeSlots = ["mainhand", "chest"];
  const vulnerableSlots = Object.keys(state.equipped).filter(slot => 
    state.equipped[slot] && !safeSlots.includes(slot)
  );
  
  if (vulnerableSlots.length > 0) {
    const randomSlot = vulnerableSlots[Math.floor(Math.random() * vulnerableSlots.length)];
    const lostUid = state.equipped[randomSlot];
    const lostInst = state.owned.find(i => i.uid === lostUid);
    
    if (lostInst) {
      const itemName = getItemDisplayName(lostInst);
      state.owned = state.owned.filter(i => i.uid !== lostUid);
      state.equipped[randomSlot] = null;
      lostItemsText += ` Вы потеряли надетый предмет: ${itemName}.`;
    }
  }

  const fresh = stats();
  state.hp = fresh.maxHp;
  state.mana = fresh.maxMana;
  
  battleLog(battle, `Тьма смыкается. Йорстед возвращает вас к жизни, но вы теряете день.${lostItemsText}`, "lose");
  saveState();
  return { defeat: true, enemyName: e.name, lostGold: lost, lostItemsText };
}

function chooseEnemyAction(battle, lastPlayerAttack) {
  const prefers = battle.enemy.prefers || [];
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
  const blockCount = battle.boss ? 2 : 1;
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
  // Прогноз тоже учитывает уязвимость моба.
  if (Array.isArray(e.weakTo) && e.weakTo.includes(actualStyle)) avg = Math.max(1, Math.round(avg * WEAKNESS_DAMAGE_MULT));
  return avg;
}

function exchange(state, battle, action, weaponInst = null) {
  if (!battle || battle.over) return { error: "Бой уже закончился." };

  const st = stats();
  const e = battle.enemy;
  const uniques = equippedUniques();
  const blocks = Array.isArray(action.blocks) ? action.blocks : [];
  const enemyAction = chooseEnemyAction(battle, battle.lastPlayerAttack);

  if (!Array.isArray(battle.enemyBlockHistory)) battle.enemyBlockHistory = [];
  battle.enemyBlockHistory.push([...enemyAction.blocks]);
  if (battle.enemyBlockHistory.length > 8) battle.enemyBlockHistory.shift();
  
  if (!Array.isArray(battle.enemyAttackHistory)) battle.enemyAttackHistory = [];
  battle.enemyAttackHistory.push(enemyAction.attack);
  if (battle.enemyAttackHistory.length > 8) battle.enemyAttackHistory.shift();

  // --- ДОБАВЛЕНО: история блоков игрока ---
  if (!Array.isArray(battle.playerBlocksHistory)) battle.playerBlocksHistory = [];
  battle.playerBlocksHistory.push([...blocks]);
  if (battle.playerBlocksHistory.length > 8) battle.playerBlocksHistory.shift();
  // -----------------------------------------

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
  }

  if ((st.hpRegen || 0) > 0 && state.hp > 0) {
    const regen = Math.min(st.hpRegen, st.maxHp - state.hp);
    if (regen > 0) {
      state.hp += regen;
      battleLog(battle, `Регенерация: +${regen} HP.`, "heal");
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
  } else if (action.type === "pass") {
    battleLog(battle, "Вы меняете оружие.", "info");
  } else {
    const tech = action.type === "tech";
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

    if (tech) {
      if (battle.rage < 3) return { error: "Нужно 3 единицы куража." };
      if (state.mana < TECH_COST) return { error: "Не хватает маны на приём." };
      battle.rage -= 3;
      state.mana -= TECH_COST;
    }

    const zone = ZONE_MAP[action.zone];
    const zoneName = zone.name;
    const skillEffect = skillInfo ? skillInfo.talent.skill.effect : null;
    const skillUnblockable = skillEffect === "fury" || skillEffect === "aim"; // «в 2 зоны»: блок не помогает
    const blocked = !tech && !skillUnblockable && !battle.staggered && enemyAction.blocks.includes(action.zone);

    if (blocked) {
      battleLog(battle, `Удар в «${zoneName}» — ${e.name} успевает закрыться.`, "block");
      Sfx.play("block");
      if (zone.risk && Math.random() < zone.risk) {
        battle.riskyMiss = true;
      }
    } else if (!tech && (e.dodgeBonus || 0) > 0 && Math.random() * 100 < e.dodgeBonus) {
      battleLog(battle, `${e.name} уклоняется от удара в «${zoneName}».`, "miss");
      Sfx.play("miss");
    } else {
      const power = tech || skillEffect === "fury" ? 1.8 : 1;
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
      const critChance = st.crit + (tech ? 0 : (zone.critBonus || 0));
      // навык «Точный выстрел» гарантирует крит, приём криту не мешает
      const crit = tech ? false : (skillEffect === "aim" ? true : Math.random() * 100 < critChance);
      if (crit) base *= 1.7;

      const pierce = (zone.armorPierce || 0) + (st.armorPierce || 0) / 100;
      const effectiveDef = e.def * (1 - pierce);
      let damage = Math.max(1, Math.round(base - effectiveDef * 0.6));

      // Уязвимость моба: стили из e.weakTo мнóжат итоговый урон на 1.25.
      let weaknessMark = "";
      if (Array.isArray(e.weakTo) && e.weakTo.includes(style)) {
        damage = Math.max(1, Math.round(damage * WEAKNESS_DAMAGE_MULT));
        weaknessMark = " — уязвим!";
      }

      battle.hp = Math.max(0, battle.hp - damage);
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
        `Удар в «${zoneName}» (${STYLE_NAMES[style]})${suffix}: ${damage} урона (${ARMOR_TYPE_NAMES[armorType]} x${armorMult})${weaknessMark}.`,
        crit ? "crit" : "hit"
      );
      Sfx.play(crit ? "crit" : "hit");

      if (!tech && zone.staggerChance && Math.random() < zone.staggerChance) {
        battle.staggered = true;
        battleLog(battle, `${e.name} теряет стойку — следующий блок пропущен.`, "info");
      }
      if (!tech && zone.tripChance && Math.random() < zone.tripChance) {
        battle.tripped = true;
        battleLog(battle, `${e.name} спотыкается — ответный удар пропущен.`, "info");
      }
    }

    battle.lastPlayerAttack = action.zone;
    } // конец ветки удара (обычная атака / приём / навык-удар)
  }

  battle.staggered = false;

  if (battle.hp > 0) {
    if (battle.tripped) {
      battleLog(battle, `${e.name} всё ещё поднимается — вы получаете передышку.`, "info");
      battle.tripped = false;
    } else if (battle.riskyMiss) {
      let base = e.atk * rnd(1.0, 1.2);
      base -= Math.min(st.def * 0.8, base * DEFENSE_CAP);
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
    } else {
      const playerBlocked = blocks.includes(enemyAction.attack);
      const enemyZone = ZONE_NAME[enemyAction.attack];

      if (playerBlocked) {
        // Кураж за блок: закрыли зону, куда бьёт враг — +1 кураж поверх урона.
        // Мимо (блок в пустую зону) — куража нет.
        battle.rage = Math.min(5, battle.rage + 1);
        battleLog(battle, `${e.name} бьёт в «${enemyZone}» — вы блокируете. +1 кураж.`, "block");
        Sfx.play("block");

        if (state.archetype === "guardian") {
          const retaliation = Math.max(2, Math.round(e.atk * (st.mods?.blockCounter || 0.1)));
          battle.hp = Math.max(0, battle.hp - retaliation);
          battleLog(battle, `Страж отвечает на блок: ${e.name} теряет ${retaliation} HP.`, "hit");
        }
      } else if (Math.random() * 100 < st.dodge) {
        battleLog(battle, `${e.name} бьёт в «${enemyZone}», но вы уходите в сторону.`, "miss");
        Sfx.play("miss");
        
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
        let base = e.atk * rnd(0.85, 1.15);
        base -= Math.min(st.def * 0.8, base * DEFENSE_CAP);
        if ((e.enrage || e.ability === "rage") && battle.hp / battle.maxHp < 0.3) base *= 1.3;
        if (state.archetype === "guardian") base *= (st.mods?.dmgTakenMult || 1);
        const damage = Math.max(2, Math.round(base));
        state.hp = Math.max(0, state.hp - damage);
        battleLog(battle, `${e.name} бьёт в «${enemyZone}»: ${damage} урона.`, "enemy");
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

  state.mana = Math.min(st.maxMana, state.mana + MANA_REGEN);

  // Тик откатов активных навыков: −1 ход за размен.
  if (battle.skillCd) {
    for (const id of Object.keys(battle.skillCd)) {
      if (battle.skillCd[id] > 0) battle.skillCd[id] -= 1;
    }
  }

  battle.turn += 1;

  const brokenGear = wearEquipment();
  if (brokenGear.length) {
    const names = brokenGear.map((inst) => getItemDisplayName(inst)).join(", ");
    battleLog(battle, `Сломалось: ${names}.`, "warn");
  }

  let summary = null;

  if (battle.hp <= 0) {
    battle.over = true;
    state.kills = (state.kills || 0) + 1;
    // Бестиарий: сколько раз убит каждый конкретный моб (и боссы тоже).
    state.bestiaryKills = state.bestiaryKills || {};
    state.bestiaryKills[e.id] = (state.bestiaryKills[e.id] || 0) + 1;
    checkQuestProgress(e.id);

    const goldMult = goldMultToday();
    const xpMult = xpMultToday();
    const rarityGold = e.rarity === "elite" ? ELITE_REWARDS.goldMult : e.rarity === "rare" ? RARE_REWARDS.goldMult : 1;
    const rarityXp = e.rarity === "elite" ? ELITE_REWARDS.xpMult : e.rarity === "rare" ? RARE_REWARDS.xpMult : 1;
    const gold = Math.max(1, Math.floor(e.gold * GOLD_DROP_MULT * goldMult * rarityGold));
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

    summary = {
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
  } else if (state.hp <= 0) {
    summary = defeatSummary(state, battle, e);
  }

  return { ok: true, summary };
}