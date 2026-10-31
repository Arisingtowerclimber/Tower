// Файл содержит интерфейс и логику Real-Time боя.

function battleActive() { return view.screen === "battle" && view.battle && !view.battle.over; }

// Единый размер кнопок боевого интерфейса: одинаковая высота, ширина и центрированный текст.
const BATTLE_BTN_STYLE = "height: 44px; min-height: 44px; max-height: 44px; width: 100%; box-sizing: border-box; padding: 0 8px; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 13px; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";

function weaponSwapHtml() {
  if (!view.weaponSwap) return "";
  
  const weapons = state.owned.filter(inst => {
    const item = ITEMS[inst.id];
    return item && item.slot === "mainhand";
  });
  
  const rows = weapons.map(inst => {
    const item = ITEMS[inst.id];
    const isEquipped = state.equipped.mainhand === inst.uid;
    return `<button class="doll-item${isEquipped ? " equipped" : ""}" data-act="equip-in-battle" data-uid="${inst.uid}" type="button" ${isEquipped ? "disabled" : ""}>
      <span class="item-icon">${iconHtml(item.icon, 32)}</span>
      <span class="doll-item-body">
        <span class="doll-item-name">${getItemDisplayName(inst)}</span>
        <span class="chips">${statsChips(item, inst)}</span>
      </span>
    </button>`;
  }).join("");
  
  return `
    <div class="doll-menu-backdrop" data-act="weapon-swap-close"></div>
    <div class="doll-menu" role="dialog">
      <div class="doll-menu-head">
        <h3>Сменить оружие</h3>
        <button class="doll-menu-close" data-act="weapon-swap-close" type="button">✕</button>
      </div>
      <p class="hint" style="margin-bottom: 10px;">Смена оружия потратит ход: вы не будете атаковать, а враг ударит.</p>
      <div class="doll-menu-list">${rows || `<p class="empty">Нет другого оружия в сумке.</p>`}</div>
    </div>
  `;
}

function hasReadySkill(battle) {
  const b = battle || view.battle;
  if (!b) return false;
  const cd = b.skillCd || {};
  return TALENTS.some((t) => t.active && ((state.talents || {})[t.id] || 0) > 0
    && state.mana >= t.skill.manaCost
    && (!t.skill.rageCost || b.rage >= t.skill.rageCost)
    && (cd[t.id] || 0) <= 0);
}

// Кнопка-раскладушка лога: состояние живёт в view.logExpanded.
function battleLogToggleHtml() {
  const expanded = view.logExpanded !== false;
  return `<button class="btn tiny ghost battle-log-toggle" data-act="toggle-log" type="button">Лог боя [${expanded ? "Свернуть" : "Развернуть"}]</button>`;
}

// Запоминаем лог завершённого боя для показа в хабе и на этаже.
function captureLastBattleLog() {
  if (!view.battle || !Array.isArray(view.battle.log) || !view.battle.log.length) return;
  view.lastBattleLog = view.battle.log.map((entry) => ({ text: entry.text, cls: entry.cls }));
}

function lastBattleLogHtml() {
  const log = Array.isArray(view.lastBattleLog) ? view.lastBattleLog : [];
  if (!log.length) return "";
  const expanded = view.logExpanded !== false;
  const lines = log.slice(-18).map((entry) =>
    `<div class="log-line ${entry.cls || "info"}">${esc(entry.text || "")}</div>`
  ).join("");
  return `
    <div class="last-battle-log">
      ${battleLogToggleHtml()}
      <div class="battle-log${expanded ? "" : " collapsed"}" data-role="last-battle-log">
        <div class="last-battle-log-title">Прошлый бой</div>
        ${lines}
      </div>
    </div>`;
}

// Слово печати над портретом: набранные буквы зелёные, оставшиеся — белые.
// Полоска таймера и подпись окрашены в цвет фазы (атака — зелёный, защита — красный).
// Подсказка типа атаки: цвет и текст зависят от стиля текущего оружия.
const TYPING_STYLE_HINTS = {
  slashing: "РУБЯЩИЙ УДАР",
  piercing: "КОЛЮЩИЙ УДАР",
  bludgeoning: "ДРОБЯЩИЙ УДАР",
};

// Разметка слова: набранное зелёным, ошибка красным, аффикс-приставка —
// фиолетовым. Приставка хранится без пробела, но на экране отделяется пробелом.
function typingWordTextHtml(typing) {
  const word = String(typing.word || "");
  const typed = String(typing.typed || "");
  const affixLen = Math.max(0, Math.min(word.length, String(typing.affix || "").length));
  const wrongIndex = typing.failed === true ? Number(typing.wrongIndex) : -1;
  let html = "";
  for (let i = 0; i < word.length; i += 1) {
    if (affixLen > 0 && i === affixLen) html += " ";
    let cls = "rest";
    if (wrongIndex === i) cls = "wrong";
    else if (i < typed.length) cls = i < affixLen ? "affix-typed" : "typed";
    else if (i < affixLen) cls = "affix-rest";
    html += `<span class="${cls}">${esc(word[i])}</span>`;
  }
  return html;
}

function typingWordHtml(mode) {
  const typing = view.typingState;
  if (!typing) return "";
  // Пока игрок печатает приём, слово обычной атаки остаётся на экране,
  // но гаснет, чтобы не путать два слова.
  if (mode === "attack" && typing.mode === "skill" && typing.attackWord) {
    const attackLabel = typing.attackIsCritWord
      ? "КРИТ!"
      : (TYPING_STYLE_HINTS[typing.attackStyle] || "УДАР");
    const attackStyleClass = ` style-${typing.attackStyle || "slashing"}`;
    const attackState = {
      word: typing.attackWord,
      typed: typing.attackTyped || "",
      affix: typing.attackAffix || "",
      failed: false,
    };
    return `
      <div class="typing-word attack dimmed${attackStyleClass}" data-role="typing-word-dimmed" aria-hidden="true">
        <span class="typing-word-label">${attackLabel}</span>
        <span class="typing-word-text">${typingWordTextHtml(attackState)}</span>
      </div>`;
  }
  if (typing.mode !== mode) return "";
  const timeLimit = Number(typing.timeLimit) > 0 ? Number(typing.timeLimit) : TYPING_TIME;
  const pct = Math.max(0, Math.min(100, (typing.timeLeft / timeLimit) * 100));
  const baseLabel = mode === "attack"
    ? (TYPING_STYLE_HINTS[typing.style] || "УДАР")
    : mode === "defense" ? "ЗАЩИТА" : "ПРИЁМ";
  const label = mode === "attack" && typing.isCritWord ? `КРИТ! ${baseLabel}` : baseLabel;
  const styleClass = mode === "attack" ? ` style-${typing.style || "slashing"}` : "";
  const critClass = mode === "attack" && typing.isCritWord ? " crit-word" : "";
  const affixClass = mode === "attack" && typing.hasAffix ? " has-affix" : "";
  return `
    <div class="typing-word ${mode}${styleClass}${critClass}${affixClass}${typing.failed ? " failed" : ""}" data-role="typing-word" aria-live="polite">
      <span class="typing-word-label">${label}</span>
      <span class="typing-word-text">${typingWordTextHtml(typing)}</span>
      <span class="typing-word-timer"><span class="typing-word-fill" data-role="typing-timer-fill" style="width:${pct}%"></span></span>
    </div>`;
}

// Отдельный блок приёмов в фазу атаки: слова не смешиваются с обычным ударом.
// Пока куража меньше 3, вместо слов показывается заглушка.
function skillWordsHtml() {
  const battle = view.battle;
  const typing = view.typingState;
  if (!battle || battle.over || !typing) return "";
  const inAttackPhase = typing.mode === "attack"
    || (typing.mode === "skill" && Boolean(typing.attackWord));
  if (!inAttackPhase) return "";

  const entries = skillTypingEntries();
  if (!entries.length) return "";

  const ready = readySkillTypingEntries();
  let body = "";
  if (battle.rage < 3) {
    body = `<span class="skill-words-empty">Кураж не накоплен: ${battle.rage}/3</span>`;
  } else if (!ready.length) {
    const allOnCd = entries.every((e) => e.cd > 0);
    body = `<span class="skill-words-empty">${allOnCd ? "Все приёмы на откате" : "Не хватает маны"}</span>`;
  } else {
    body = ready.map((e) => {
      const active = typing.mode === "skill" && typing.skillId === e.id;
      const typed = active ? String(typing.typed || "") : "";
      const meta = [`${e.manaCost} MP`];
      if (e.rageCost) meta.push(`${e.rageCost} куража`);
      return `
        <div class="skill-word-chip${active ? " active" : ""}" data-role="skill-word-chip" data-skill-id="${esc(e.id)}" title="Начните печатать слово приёма">
          <span class="skill-word-icon">${e.icon}</span>
          <span class="skill-word-body">
            <span class="skill-word-name">${esc(e.name)}</span>
            <span class="skill-word-text"><span class="skill-word-typed">${esc(typed)}</span><span class="skill-word-rest">${esc(e.word.slice(typed.length))}</span></span>
          </span>
          <span class="skill-word-meta">${meta.join(" · ")}</span>
        </div>`;
    }).join("");
  }

  return `
    <div class="skill-words" data-role="skill-words">
      <div class="skill-words-title">ДОСТУПНЫЕ ПРИЁМЫ</div>
      <div class="skill-words-list">${body}</div>
    </div>`;
}

// Три боевых слота оружия рядом с портретом героя. Активный слот — золотая рамка.
function battleWeaponSlotsHtml() {
  const slots = Array.isArray(state.weaponSlots) ? state.weaponSlots : [null, null, null];
  const activeUid = state.equipped.mainhand;
  const cells = [0, 1, 2].map((i) => {
    const uid = slots[i];
    const inst = uid ? getInstance(uid) : null;
    const item = inst ? ITEMS[inst.id] : null;
    if (!item) {
      return `<button class="battle-weapon-slot empty" data-act="battle-weapon-slot" data-slot="${i}" data-tooltip="Слот ${i + 1}: пусто<br><kbd>${i + 1}</kbd>" type="button"><span class="battle-weapon-slot-key">${i + 1}</span></button>`;
    }
    const active = Boolean(uid && activeUid === uid);
    return `<button class="battle-weapon-slot filled${active ? " active" : ""}" data-act="battle-weapon-slot" data-slot="${i}" data-tooltip="Слот ${i + 1}: ${esc(item.name)}${active ? " (надето)" : ""}<br><kbd>${i + 1}</kbd>" type="button">
      <span class="battle-weapon-slot-key">${i + 1}</span>
      <img src="${resolveIcon(item.icon)}" alt="">
    </button>`;
  }).join("");
  return `<div class="battle-weapon-slots" data-role="battle-weapon-slots">${cells}</div>`;
}

// ── Real-Time дуэль: слоты слов, замах, равновесие ─────────────────────────
// Разметка букв слова: введённые — цветные, остальные — полупрозрачные.
function duelWordMarkup(word, typed, { affixLen = 0, crit = false, combo = false } = {}) {
  const w = String(word || "");
  const t = String(typed || "");
  let html = "";
  for (let i = 0; i < w.length; i += 1) {
    const ch = w[i];
    if (ch === " ") { html += " "; continue; }
    let cls = "rest";
    if (i < t.length) {
      if (i < affixLen) cls = "affix-typed";
      else if (combo) cls = "combo-typed";
      else if (crit) cls = "crit-typed";
      else cls = "typed";
    } else if (i < affixLen) {
      cls = "affix-rest";
    }
    html += `<span class="${cls}">${esc(ch)}</span>`;
  }
  return html;
}

function duelAttackSlotHtml(battle) {
  const combo = battle.stunned === true;
  const crit = !combo && battle.attackIsCrit === true;
  const typed = combo ? (battle.comboTyped || "") : (battle.attackTyped || "");
  const word = combo ? (battle.comboWord || "CRUSHING SMASH") : (battle.attackWord || "");
  const active = combo || battle.activeSlot === "attack";
  const affixLen = (!combo && battle.attackHasAffix) ? String(battle.attackAffix || "").length : 0;
  const comboPct = combo ? Math.max(0, Math.min(100, ((Number(battle.comboTimeLeft) || 0) / 3) * 100)) : 100;
  const label = combo ? "КОМБО!" : (crit ? "АТАКА · КРИТ" : (battle.attackHasAffix ? "АТАКА · АФФИКС" : "АТАКА"));
  return `
    <div class="duel-slot attack${active ? " active" : ""}${combo ? " combo" : ""}${crit ? " crit" : ""}" data-role="duel-slot" data-slot="attack">
      <span class="duel-slot-label">${label}</span>
      <div class="typing-word-container">
        <span class="duel-word${!combo && battle.attackGlitch ? " glitch" : ""}" data-role="duel-attack-word">${word ? duelWordMarkup(word, typed, { affixLen, crit, combo }) : "—"}</span>
      </div>
      <span class="duel-slot-timer"><span class="duel-slot-fill" data-role="combo-timer-fill" style="width:${comboPct}%"></span></span>
      <span class="duel-slot-hint" data-role="combo-seconds">${combo ? Math.max(0, Number(battle.comboTimeLeft) || 0).toFixed(1) + " с" : "печатайте — бейте"}</span>
    </div>`;
}

// Состояние моба над карточкой: ВОССТАНОВЛЕНИЕ (серый) / ЗАМАХ / ОГЛУШЁН.
function duelMobStateHtml(battle) {
  const rec = Number(battle.enemyRecoveryTimer) || 0;
  let text = "ЗАМАХ";
  let cls = "windup";
  if (battle.stunned) { text = "ОГЛУШЁН"; cls = "stun"; }
  else if (rec > 0) { text = "ВОССТАНОВЛЕНИЕ"; cls = "recovery"; }
  return `<span class="windup-label ${cls}" data-role="windup-label">${text}</span>`;
}

function duelDefenseSlotHtml(battle) {
  const word = battle.stunned ? "" : (battle.defenseWord || "");
  const typed = battle.stunned ? "" : (battle.defenseTyped || "");
  const active = !battle.stunned && battle.activeSlot === "defense";
  const pct = battle.enemyWindup > 0
    ? Math.max(0, Math.min(100, ((Number(battle.enemyTimeLeft) || 0) / battle.enemyWindup) * 100))
    : 0;
  return `
    <div class="duel-slot defense${active ? " active" : ""}${word ? "" : " empty"}" data-role="duel-slot" data-slot="defense">
      <span class="duel-slot-label">ЗАЩИТА</span>
      <div class="typing-word-container">
        ${word
          ? `<span class="duel-word${battle.defenseGlitch ? " glitch" : ""}" data-role="duel-defense-word">${duelWordMarkup(word, typed)}</span>`
          : `<span class="duel-word empty" data-role="duel-defense-word">—</span>`}
      </div>
      <span class="duel-slot-timer"><span class="duel-slot-fill" data-role="defense-timer-fill" style="width:${pct}%"></span></span>
      <span class="duel-slot-hint" data-role="defense-seconds">${word ? Math.max(0, Number(battle.enemyTimeLeft) || 0).toFixed(1) + " с" : "нет замаха"}</span>
    </div>`;
}

function duelPanelHtml() {
  const battle = view.battle;
  if (!battle) return "";
  return `<div class="duel-center" data-role="duel-center">${duelAttackSlotHtml(battle)}${duelDefenseSlotHtml(battle)}</div>`;
}

// Точечное обновление слов в слотах без полного render().
function duelUpdateWords() {
  const battle = view.battle;
  if (!battle) return;
  const combo = battle.stunned === true;
  const atkEl = document.querySelector('[data-role="duel-attack-word"]');
  if (atkEl) {
    const affixLen = (!combo && battle.attackHasAffix) ? String(battle.attackAffix || "").length : 0;
    const shownWord = combo ? battle.comboWord : battle.attackWord;
    atkEl.innerHTML = shownWord
      ? duelWordMarkup(shownWord, combo ? battle.comboTyped : battle.attackTyped, { affixLen, crit: battle.attackIsCrit, combo })
      : "—";
    atkEl.classList.toggle("glitch", !combo && battle.attackGlitch === true);
  }
  const defEl = document.querySelector('[data-role="duel-defense-word"]');
  if (defEl) {
    defEl.innerHTML = battle.defenseWord
      ? duelWordMarkup(battle.defenseWord, battle.defenseTyped)
      : "—";
    defEl.classList.toggle("glitch", Boolean(battle.defenseWord) && battle.defenseGlitch === true);
  }
  document.querySelectorAll('[data-role="duel-slot"]').forEach((el) => {
    const slot = el.dataset.slot;
    el.classList.toggle("active", combo ? slot === "attack" : battle.activeSlot === slot);
    if (slot === "defense") el.classList.toggle("empty", !battle.defenseWord);
  });
}

// Точечное обновление полосок замаха/защиты/комбо.
function duelUpdateBars() {
  const battle = view.battle;
  if (!battle) return;
  const setWidth = (role, pct) => {
    const el = document.querySelector(`[data-role="${role}"]`);
    if (el) el.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  };
  const rec = Number(battle.enemyRecoveryTimer) || 0;
  const windupPct = rec > 0
    ? 0
    : (battle.enemyWindup > 0
      ? ((Number(battle.enemyTimeLeft) || 0) / battle.enemyWindup) * 100
      : 0);
  setWidth("windup-fill", windupPct);
  setWidth("defense-timer-fill", windupPct);
  if (battle.stunned) {
    setWidth("combo-timer-fill", ((Number(battle.comboTimeLeft) || 0) / 3) * 100);
  }
  // Метка состояния над мобом: ВОССТАНОВЛЕНИЕ / ЗАМАХ / ОГЛУШЁН.
  const mobState = document.querySelector('[data-role="windup-label"]');
  if (mobState) {
    if (battle.stunned) { mobState.textContent = "ОГЛУШЁН"; mobState.className = "windup-label stun"; }
    else if (rec > 0) { mobState.textContent = "ВОССТАНОВЛЕНИЕ"; mobState.className = "windup-label recovery"; }
    else { mobState.textContent = "ЗАМАХ"; mobState.className = "windup-label windup"; }
  }
  const windupText = document.querySelector('[data-role="windup-seconds"]');
  if (windupText) windupText.textContent = battle.stunned ? "ОГЛУШЁН" : (rec > 0 ? `${rec.toFixed(1)} с` : `${Math.max(0, Number(battle.enemyTimeLeft) || 0).toFixed(1)} с`);
  const defText = document.querySelector('[data-role="defense-seconds"]');
  if (defText) defText.textContent = battle.stunned ? "—" : (battle.defenseWord ? `${Math.max(0, Number(battle.enemyTimeLeft) || 0).toFixed(1)} с` : "нет замаха");
  const comboText = document.querySelector('[data-role="combo-seconds"]');
  if (comboText) comboText.textContent = battle.stunned ? `${Math.max(0, Number(battle.comboTimeLeft) || 0).toFixed(1)} с` : "печатайте — бейте";
}

function duelStopTimer() {
  if (view.duelTimer) {
    clearInterval(view.duelTimer);
    view.duelTimer = null;
  }
  if (view.battle && view.battle.enemyTimer) {
    clearInterval(view.battle.enemyTimer);
    view.battle.enemyTimer = null;
  }
}

function duelEnsureTimer() {
  const battle = view.battle;
  if (!battle || battle.over || battle.victoryPending || view.summary || !view.duelActive) return;
  if (view.screen !== "battle") return;
  if (battle.enemyTimer) return;
  view.duelTimer = setInterval(duelTick, 50);
  battle.enemyTimer = view.duelTimer;
}

// ГИПЕРАРМОР: удар игрока НЕ прерывает замах моба. Полоска продолжает тикать,
// моб добивает свой замах и бьёт даже получив урон (обмен ударами). Новый замах
// запускается только как страховка: моб не оглушён, замах отсутствует и
// окно восстановления не тикает.
function duelResumeOrBeginWindup(state, battle) {
  if (!battle || battle.over) return;
  if (battle.stunned) return;
  if ((Number(battle.enemyWindup) || 0) > 0) return; // замах продолжается
  if ((Number(battle.enemyRecoveryTimer) || 0) > 0) return; // окно восстановления
  duelBeginWindup(state, battle);
}

// Старт дуэли: слово атаки + окно восстановления моба. Заменяет старые фазы.
function startDuel() {
  const battle = view.battle;
  if (!battle || battle.over) return;
  clearTypingTimer();
  view.typingState = null;
  view.typingPaused = null;
  view.comboState = null;
  view.comboPaused = null;
  view.duelActive = true;
  battle.stunned = false;
  battle.balance = battle.maxBalance || 100;
  battle.round = 0;
  battle.activeSlot = "attack";
  battle.attackGlitch = false;
  battle.defenseGlitch = false;
  battle.defenseWord = "";
  battle.defenseTyped = "";
  battle.defenseAuto = "";
  duelNewAttackWord(state, battle);
  // Окно восстановления на старте дуэли: моб не начинает замах мгновенно,
  // у игрока есть время на первый удар.
  battle.enemyWindup = 0;
  battle.enemyTimeLeft = 0;
  battle.enemyRecoveryTimer = 2.0;
  duelEnsureTimer();
}

function duelPauseReason() {
  return view.preBattle || view.summary || view.battleModal || view.weaponSwap
    || view.settingsOpen || view.questsOpen || view.abilitiesOpen || view.talentsModal
    || view.titleModal || view.achievementsOpen || view.screen !== "battle";
}

function duelTick() {
  const battle = view.battle;
  if (!view.duelActive || !battle || battle.over || battle.victoryPending || !view.duelActive) {
    duelStopTimer();
    return;
  }
  if (duelPauseReason()) return;

  const dt = 0.05;
  if (battle.stunned) {
    battle.comboTimeLeft = Math.max(0, (Number(battle.comboTimeLeft) || 0) - dt);
    duelUpdateBars();
    if (battle.comboTimeLeft <= 0) duelComboFail();
    return;
  }

  // Окно восстановления моба: замах ещё не начался, у игрока время на атаку.
  const recovery = Number(battle.enemyRecoveryTimer) || 0;
  if (recovery > 0) {
    battle.enemyRecoveryTimer = Math.max(0, recovery - dt);
    duelUpdateBars();
    if (battle.enemyRecoveryTimer <= 0) {
      duelBeginWindup(state, battle);
      duelUpdateWords();
    }
    return;
  }

  battle.enemyTimeLeft = Math.max(0, (Number(battle.enemyTimeLeft) || 0) - dt);
  duelUpdateBars();
  if (battle.enemyTimeLeft <= 0) duelEnemyAttackNow();
}

function duelEnemyAttackNow() {
  const battle = view.battle;
  if (!battle || battle.over) return;
  const res = duelEnemyStrike(state, battle);
  battle.defenseWord = "";
  battle.defenseTyped = "";
  battle.defenseAuto = "";
  battle.activeSlot = "attack";
  // Эпизод обороны кончился ударом моба — генерируем НОВОЕ слово атаки.
  duelNewAttackWord(state, battle);

  if (res.defeat || state.hp <= 0) { duelDefeat(); return; }
  // Моб ударил — уходит в окно восстановления: время для ответной атаки.
  battle.enemyWindup = 0;
  battle.enemyTimeLeft = 0;
  battle.enemyRecoveryTimer = 1.5;
  render();
}

function duelBlockNow() {
  const battle = view.battle;
  if (!battle || battle.over || battle.victoryPending) return;
  duelPlayerBlock(state, battle);
  battle.defenseWord = "";
  battle.defenseTyped = "";
  battle.defenseAuto = "";
  battle.activeSlot = "attack";
  // Эпизод обороны кончился блоком — генерируем НОВОЕ слово атаки.
  duelNewAttackWord(state, battle);
  if (battle.hp <= 0) { duelVictorySoon(); return; }
  if (battle.stunned) { render(); return; }
  // Удачный блок срывает удар моба — он восстанавливается, у игрока окно.
  battle.enemyWindup = 0;
  battle.enemyTimeLeft = 0;
  // 1.5 базовых + 1.0 сек за успешный блок: защита отодвигает удар врага.
  battle.enemyRecoveryTimer = 2.5;
  render();
}

function duelAttackComplete() {
  const battle = view.battle;
  if (!battle || battle.over || battle.victoryPending) return;
  duelPlayerAttack(state, battle, {
    isCrit: battle.attackIsCrit === true,
    hasAffix: battle.attackHasAffix === true,
    affixType: battle.attackAffixType,
  });
  if (battle.hp <= 0) { duelVictorySoon(); return; }
  if (battle.stunned) { render(); return; }
  duelNewAttackWord(state, battle);
  // Гиперармор: не дергаем замах моба заново — он продолжает тикать.
  duelResumeOrBeginWindup(state, battle);
  render();
}

function duelComboSuccess() {
  const battle = view.battle;
  if (!battle || battle.over || battle.victoryPending) return;
  duelComboAttack(state, battle);
  if (battle.hp <= 0) { duelVictorySoon(); return; }
  duelNewAttackWord(state, battle);
  // Моб был оглушён — замах сброшен и удар пропущен: даём окно восстановления.
  battle.enemyWindup = 0;
  battle.enemyTimeLeft = 0;
  battle.enemyRecoveryTimer = 1.5;
  render();
}

function duelComboFail() {
  const battle = view.battle;
  if (!battle || battle.over) return;
  battleLog(battle, "Комбо сорвалось — моб приходит в себя.", "miss");
  duelRecover(battle);
  duelNewAttackWord(state, battle);
  battle.enemyWindup = 0;
  battle.enemyTimeLeft = 0;
  battle.enemyRecoveryTimer = 1.5;
  render();
}

// Умный ввод: первая буква решает, в какой слот она попадёт.
// Атака приоритетна, пока игрок сам не переключился на защиту.
function duelTypeLetter(letter) {
  const battle = view.battle;
  if (!battle || battle.over || view.preBattle || view.summary) return;
  const chStr = String(letter || "").toUpperCase();
  if (!chStr) return;

  if (battle.stunned) {
    const r = duelAdvanceWord(battle.comboWord, battle.comboTyped, chStr);
    if (!r.ok) { duelComboFail(); return; }
    battle.comboTyped = r.typed;
    if (r.complete) duelComboSuccess();
    else { duelUpdateWords(); duelUpdateBars(); }
    return;
  }

  const defNext = duelPeekChar(battle.defenseWord, battle.defenseTyped);
  const atkNext = duelPeekChar(battle.attackWord, battle.attackTyped);
  const defenseActive = battle.activeSlot === "defense";

  const matchAtk = (chStr === atkNext);
  const matchDef = (chStr === defNext);

  // Проверяем, является ли новая буква продолжением слова в ДРУГОМ слоте (с учетом уже набранных букв)
  const atkCandidate = (battle.attackTyped || "") + chStr;
  const defCandidate = (battle.defenseTyped || "") + chStr;

  const canSwitchToDef = !defenseActive && battle.attackTyped && battle.defenseWord && battle.defenseWord.startsWith(atkCandidate);
  const canSwitchBackToAtk = defenseActive && battle.defenseTyped && battle.attackWord && battle.attackWord.startsWith(defCandidate);

  if (canSwitchToDef) {
    // Переходим на защиту, перенося префикс атаки
    battle.activeSlot = "defense";
    battle.defenseTyped = atkCandidate;
    battle.attackWord = "";
    battle.attackTyped = "";
    battle.attackAuto = "";
    battleLog(battle, "Вы бросили атаку и перешли в глухую оборону!", "block");
    duelFlashDefenseSwitch();
    if (battle.defenseTyped.length >= battle.defenseWord.length) duelBlockNow();
    else { duelUpdateWords(); duelUpdateBars(); }
    return;
  }

  if (canSwitchBackToAtk) {
    // Переходим обратно на атаку (если была защита)
    battle.activeSlot = "attack";
    battle.attackTyped = defCandidate;
    battle.defenseWord = "";
    battle.defenseTyped = "";
    battle.defenseAuto = "";
    if (battle.attackTyped.length >= battle.attackWord.length) duelAttackComplete();
    else { duelUpdateWords(); duelUpdateBars(); }
    return;
  }

  let target = null;
  if (matchAtk && matchDef) {
    target = defenseActive ? "defense" : "attack";
  } else if (matchAtk) {
    target = "attack";
  } else if (matchDef) {
    target = "defense";
  }

  if (!target) {
    if (defenseActive) battle.defenseTyped = battle.defenseAuto || "";
    else battle.attackTyped = battle.attackAuto || "";
    duelUpdateWords();
    return;
  }

  if (target === "defense") {
    if (defenseActive) {
      const r = duelAdvanceWord(battle.defenseWord, battle.defenseTyped, chStr);
      if (!r.ok) return;
      battle.defenseTyped = r.typed;
      if (r.complete) duelBlockNow();
      else { duelUpdateWords(); duelUpdateBars(); }
      return;
    } else {
      battle.activeSlot = "defense";
      battle.attackWord = "";
      battle.attackTyped = "";
      battle.attackAuto = "";
      const r = duelAdvanceWord(battle.defenseWord, "", chStr);
      battle.defenseTyped = r.typed;
      battleLog(battle, "Вы бросили атаку и перешли в глухую оборону!", "block");
      duelFlashDefenseSwitch();
      if (r.complete) duelBlockNow();
      else { duelUpdateWords(); duelUpdateBars(); }
      return;
    }
  }

  if (!defenseActive) {
    const r = duelAdvanceWord(battle.attackWord, battle.attackTyped, chStr);
    if (!r.ok) return;
    battle.attackTyped = r.typed;
    if (r.complete) duelAttackComplete();
    else { duelUpdateWords(); duelUpdateBars(); }
    return;
  } else {
    battle.activeSlot = "attack";
    battle.defenseWord = "";
    battle.defenseTyped = "";
    battle.defenseAuto = "";
    const r = duelAdvanceWord(battle.attackWord, "", chStr);
    battle.attackTyped = r.typed;
    if (r.complete) duelAttackComplete();
    else { duelUpdateWords(); duelUpdateBars(); }
    return;
  }
}

// Микро-фидбек перехвата ввода атаки защитой: вспышка на слоте защиты.
function duelFlashDefenseSwitch() {
  Sfx.play("lock_unlock", { volume: (typeof Sfx.getVolume === "function" ? Sfx.getVolume() : 1) * 0.6 });
  const el = document.querySelector('[data-role="duel-slot"][data-slot="defense"]');
  if (!el) return;
  el.classList.remove("switch-flash");
  void el.offsetWidth; // перезапуск CSS-анимации
  el.classList.add("switch-flash");
  setTimeout(() => el.classList.remove("switch-flash"), 480);
}

// Смерть врага синхронизирована с UI: даём DOM отрисовать загоревшиеся буквы
// и полоску HP, и только затем показываем экран победы.
function duelVictorySoon() {
  const battle = view.battle;
  if (!battle || battle.over || battle.victoryPending) return;
  battle.victoryPending = true;
  duelStopTimer();
  render();
  setTimeout(() => {
    if (view.battle !== battle || battle.over) return;
    battle.victoryPending = false;
    duelVictory();
  }, 180);
}

function duelVictory() {
  const battle = view.battle;
  if (!battle || battle.over) return;
  duelStopTimer();
  const summary = finishVictory(state, battle);
  finalizeBattleResult(summary);
}

function duelDefeat() {
  const battle = view.battle;
  if (!battle || battle.over) return;
  duelStopTimer();
  const summary = defeatSummary(state, battle, battle.enemy);
  finalizeBattleResult(summary);
}

// Поддержка (зелья/навыки/смена оружия) не должна запускать старые фазы.
function duelOnRealtimeAction() {
  if (!view.duelActive || !view.battle || view.battle.over || view.summary) return;
  duelEnsureTimer();
  render();
}

// Строка статов моба (задача 6): СИЛ | ЛОВ | ИНТ | ЗАЩ.
// Стат выше соответствующего суммарного стата игрока подсвечивается красным.
function duelMobStatsHtml(enemy, st) {
  const playerStat = (key) =>
    Math.max(0, Number(st?.attrs?.[key]) || 0) + Math.max(0, Number(st?.gearAttrs?.[key]) || 0);
  const cell = (label, key) => {
    const v = Math.max(0, Number(enemy[key]) || 0);
    const cls = v > playerStat(key) ? ' class="stat-higher"' : "";
    return `<span${cls}>${label}: ${v}</span>`;
  };
  return `<div class="mob-stats">${cell("СИЛ", "str")} | ${cell("ЛОВ", "agi")} | ${cell("ИНТ", "int")} | ${cell("ЗАЩ", "def")}</div>`;
}

function battleHtml(st) {
  const battle = view.battle; 
  const enemy = battle.enemy; 
  const bgImage = FLOORS.find(f => f.id === battle.floorId)?.bg || "assets/backgrounds/tower.webp";
  const ragePct = Math.min(100, (battle.rage / 5) * 100);
  // Бой занимает остаток экрана под шапкой: лог должен быть виден без прокрутки.
  const topbarEl = platform.dom.byId("topbar");
  const topbarH = topbarEl && !topbarEl.hidden ? topbarEl.offsetHeight + 52 : 0;
  const battleHeight = Math.max(420, window.innerHeight - topbarH);

  const mainInst = state.equipped.mainhand ? getInstance(state.equipped.mainhand) : null;
  const playerWeapon = mainInst ? ITEMS[mainInst.id] : null;
  const playerArmorType = state.equipped.chest ? ITEMS[getInstance(state.equipped.chest)?.id]?.armorType : null;

  let playerWeaponTitle = "Без оружия";
  if (playerWeapon) {
    const styles = [];
    if (playerWeapon.damage?.slashing > 0) styles.push(`рубящий ${playerWeapon.damage.slashing}`);
    if (playerWeapon.damage?.piercing > 0) styles.push(`колющий ${playerWeapon.damage.piercing}`);
    if (playerWeapon.damage?.bludgeoning > 0) styles.push(`дробящий ${playerWeapon.damage.bludgeoning}`);
    playerWeaponTitle = styles.length ? `Урон: ${styles.join(", ")}` : "Нет урона";
  }

  let playerArmorTitle = "Без брони";
  if (playerArmorType) {
    const mults = ARMOR_STYLE_MULT;
    const mods = [];
    mods.push(`Колющий: ${Math.round(mults.piercing[playerArmorType] * 100)}%`);
    mods.push(`Рубящий: ${Math.round(mults.slashing[playerArmorType] * 100)}%`);
    mods.push(`Дробящий: ${Math.round(mults.bludgeoning[playerArmorType] * 100)}%`);
    playerArmorTitle = `Получаемый урон: ${mods.join(", ")}`;
  }

  // Мини-список брони по зонам: «Голова: Латы | Грудь: Латы | Пояс: Ткань | Ноги: Кожа».
  const zoneArmorList = ["head", "chest", "waist", "legs"].map((slot) => {
    const inst = state.equipped[slot] ? getInstance(state.equipped[slot]) : null;
    const type = (inst && ITEMS[inst.id] && ITEMS[inst.id].armorType) || "cloth";
    return `${SLOT_NAME[slot]}: ${ARMOR_TYPE_NAMES[type] || type}`;
  }).join(" | ");

  // Полоски маны и куража врага видны всегда — по ним читается готовность
  // моба к «Тяжёлому удару».
  // Бейдж ярости: виден при 3+ куража, после «Тяжёлого удара» скрывается.
  const enemyEnraged = (battle.enemy.rage || 0) >= 3;
  const enemyRageBadge = `<span class="chip" data-role="enemy-rage-badge" title="Моб в ярости: следующий удар будет сокрушительным" style="border-color:#c2483c; color:#ff7b6b; background:rgba(194,72,60,0.15);${enemyEnraged ? "" : " display:none;"}">В ЯРОСТИ</span>`;

  // Бейджи врага выносим отдельным рядом под именем, чтобы не раздувать строку с названием.
  const enemyBadges = [
    enemy.rarity === "rare" ? `<span class="chip" style="border-color: #d9a94b; color: #d9a94b;" title="Редкий враг: повышенные награды и способность">✦ Редкий</span>` : "",
    enemy.rarity === "elite" ? `<span class="chip" style="border-color: #c2483c; color: #c2483c;" title="Элитный враг: повышенные награды и способность">★ Элитный</span>` : "",
    enemy.modifier ? `<span class="chip" style="cursor: help;" title="${MOB_MODIFIERS[enemy.modifier].desc}">${MOB_MODIFIERS[enemy.modifier].name}</span>` : "",
    enemy.ability ? `<span class="chip" style="cursor: help;" title="${MOB_ABILITY_INFO[enemy.ability].desc}">${MOB_ABILITY_INFO[enemy.ability].name}</span>` : "",
    enemyRageBadge,
  ].filter(Boolean).join("");

  const enemyWeapon = enemy.weaponId ? ITEMS[enemy.weaponId] : null;
  let enemyWeaponTitle = "Без оружия";
  if (enemyWeapon) {
    const styles = [];
    if (enemyWeapon.damage?.slashing > 0) styles.push(`рубящий ${enemyWeapon.damage.slashing}`);
    if (enemyWeapon.damage?.piercing > 0) styles.push(`колющий ${enemyWeapon.damage.piercing}`);
    if (enemyWeapon.damage?.bludgeoning > 0) styles.push(`дробящий ${enemyWeapon.damage.bludgeoning}`);
    enemyWeaponTitle = styles.length ? `Урон: ${styles.join(", ")}` : "Нет урона";
  }

  let enemyArmorTitle = "Без брони";
  if (enemy.armorType) {
    const mults = ARMOR_STYLE_MULT;
    const mods = [];
    mods.push(`Колющий: ${Math.round(mults.piercing[enemy.armorType] * 100)}%`);
    mods.push(`Рубящий: ${Math.round(mults.slashing[enemy.armorType] * 100)}%`);
    mods.push(`Дробящий: ${Math.round(mults.bludgeoning[enemy.armorType] * 100)}%`);
    enemyArmorTitle = `Получаемый урон: ${mods.join(", ")}`;
  }

  const log = battle.log.slice(-18).map((entry) => `<div class="log-line ${entry.cls}">${esc(entry.text)}</div>`).join("");
  const companionBattleType = battle.over
    ? (view.summary ? (view.summary.victory ? "victory" : "defeat") : (battle.hp <= 0 ? "victory" : "defeat"))
    : ((battle.round || 0) === 0 ? "fight_start" : "");
  const battleReaction = companionBattleType ? companionReaction(companionBattleType, `${battle.enemy.id}:${battle.round || 0}`) : "";
  const preBattleHtml = view.preBattle ? `
    <div class="prebattle-overlay" style="position: fixed; inset: 0; z-index: 160; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(8, 6, 5, 0.78); backdrop-filter: blur(3px);">
      <div class="prebattle-card" style="width: min(460px, 100%); border: 1px solid var(--line); border-radius: 18px; background: linear-gradient(160deg, rgba(31, 24, 19, 0.98), rgba(14, 10, 8, 0.98)); box-shadow: 0 24px 80px rgba(0,0,0,0.6); padding: 24px; text-align: center;">
        <div style="width: 150px; height: 150px; margin: 0 auto 16px; border-radius: 16px; overflow: hidden; border: 1px solid var(--line); background: #1c1511;">
          <img src="${resolveIcon(enemy.icon)}" alt="${esc(enemy.name)}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <h2 style="color: var(--gold2); font-size: 26px; margin: 0 0 8px;">${esc(enemy.name)}</h2>
        <p style="font-size: 16px; color: var(--text); margin: 0 0 6px;">Противник готовится к атаке!</p>
        ${battle.boss ? `<p style="font-size: 12px; color: #d97a6c; margin: 0 0 18px;">Босс не позволит сбежать.</p>` : `<p style="font-size: 12px; color: var(--dim); margin: 0 0 18px;">Можно отступить, но удар в спину неизбежен.</p>`}
        <button class="btn primary" data-act="prebattle-start" type="button" style="width: 100%; min-height: 48px; font-size: 16px; margin-bottom: 10px;">[ПРОБЕЛ] Начать бой</button>
        ${battle.boss ? "" : `<button class="btn ghost" data-act="prebattle-flee" type="button" style="width: 100%; min-height: 42px;">[Esc] Сбежать</button>`}
      </div>
    </div>
  ` : "";

  // Арена: счётчик волны и кнопка добровольного выхода.
  const arenaStrip = (view.arenaState && view.arenaState.active) ? `
    <div class="arena-strip" style="display:flex; justify-content:center; align-items:center; gap:10px; margin:0 0 8px; flex-wrap:wrap;">
      <span class="chip" data-role="arena-wave" style="border-color:#c2483c; color:#ffb3a3; background:rgba(120,30,30,0.28);">Арена · Волна: ${Math.max(1, Number(view.arenaState.wave) || 1)}</span>
      <button class="btn tiny ghost" data-act="arena-leave" type="button" title="Покинуть Арену (Esc)">Покинуть (Esc)</button>
    </div>` : "";
  const arenaNoticeHtml = view.arenaNotice ? `
    <div class="arena-notice" style="position:fixed; inset:0; display:flex; align-items:center; justify-content:center; z-index:150; pointer-events:none;">
      <div style="padding:18px 30px; border:1px solid #c2483c; border-radius:14px; background:linear-gradient(160deg, rgba(64,20,18,0.97), rgba(18,9,8,0.97)); color:#ffd2c8; font-size:20px; font-weight:800; letter-spacing:0.02em; box-shadow:0 14px 50px rgba(0,0,0,0.65); text-align:center;">${esc(view.arenaNotice.text)}</div>
    </div>` : "";

  return `
    <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-image: linear-gradient(rgba(10, 8, 7, 0.5), rgba(10, 8, 7, 0.5)), url('${bgImage}'); background-size: cover; background-position: center; z-index: 0; pointer-events: none;"></div>
    <section class="battle" style="position: relative; z-index: 1; display: flex; flex-direction: column; min-height: ${battleHeight}px; padding: 10px 20px; box-sizing: border-box;">
      ${arenaNoticeHtml}
      
      ${battle.ambush ? `<div class="banner warn-banner">${AMBUSH_TEXT}</div>` : ""}
      ${arenaStrip}
      
      <!-- ВЕРХ: Статы -->
      <div class="fighters" style="margin-bottom: 0;">
        <article class="fighter hero-fighter">
          <div class="fighter-avatar portrait" style="width: 80px; height: 80px; border-radius: 10px; overflow: hidden; flex-shrink: 0;">
            <img src="${portraitSrc(state.portrait)}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          ${battleWeaponSlotsHtml()}
          <div class="fighter-body" style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
            <div class="fighter-name" style="font-size: 16px; margin-bottom: 6px;">${esc(state.name)}${state.currentTitle ? `, ${esc(state.currentTitle)}` : ""} <span class="muted">УР ${state.level}</span></div>
            ${bar("hp", state.hp, st.maxHp, "hero-hp")}
            ${bar("mana", state.mana, st.maxMana, "hero-mana")}
            <div class="bar rage-bar" data-role="rage-bar" style="margin-top: 4px;"><span style="width:${Math.min(100, (battle.rage / 5) * 100)}%"></span></div>
            <div class="fighter-numbers" style="font-size: 11px; margin-top: 6px; display: flex; gap: 12px; flex-wrap: wrap;">
              <span data-role="hero-hp-text">${state.hp}/${st.maxHp} HP</span>
              <span data-role="hero-mana-text">${state.mana}/${st.maxMana} MP</span>
              <span data-role="rage-text">Кураж: ${battle.rage}/5</span>
              <span title="${playerArmorTitle}" style="border-bottom: 1px dotted var(--dim); cursor: help; font-size: 10px;">${zoneArmorList}</span>
              <span title="${playerWeaponTitle}" style="border-bottom: 1px dotted var(--dim); cursor: help;">Оружие: ${playerWeapon ? playerWeapon.name : "Кулаки"}</span>
            </div>
          </div>
        </article>
        ${duelPanelHtml()}
        <article class="fighter enemy-fighter${battle.hp <= 0 ? " dead" : ""}">
          <div class="windup-wrap" data-role="windup-wrap">
            ${duelMobStateHtml(battle)}
            <span class="windup-bar" data-role="windup-bar"><span class="windup-fill" data-role="windup-fill" style="width:${battle.enemyWindup > 0 ? Math.max(0, Math.min(100, ((battle.enemyTimeLeft || 0) / battle.enemyWindup) * 100)) : 0}%"></span></span>
            <span class="windup-seconds" data-role="windup-seconds">${battle.stunned ? "ОГЛУШЁН" : `${Math.max(0, Number(battle.enemyTimeLeft) || 0).toFixed(1)} с`}</span>
          </div>
          <div class="fighter-avatar" style="width: 80px; height: 80px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: #1c1511;">
            <img src="${resolveIcon(enemy.icon)}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div class="fighter-body" style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
            <div class="fighter-name" style="font-size: 16px; margin-bottom: 4px;">${enemy.name}</div>
            ${duelMobStatsHtml(enemy, st)}
            ${enemyBadges ? `<div class="enemy-badges">${enemyBadges}</div>` : ""}
            ${bar("hp enemy", battle.hp, battle.maxHp, "enemy-hp")}
            ${bar("mana", battle.enemy.mana || 0, battle.enemy.maxMana || 1, "enemy-mana")}
            ${bar("rage", battle.enemy.rage || 0, battle.enemy.maxRage || 5, "enemy-rage")}
            <div class="fighter-numbers" style="font-size: 11px; margin-top: 6px; display: flex; gap: 4px 12px; flex-wrap: wrap; align-items: center;">
              <span data-role="enemy-hp-text">${battle.hp}/${battle.maxHp} HP</span>
              <span title="Базовый урон врага">Урон: ${enemy.atk}</span>
              <span title="Базовые доспехи, снижающие урон">Защита: ${enemy.def}</span>
              <span title="${enemyArmorTitle}" style="border-bottom: 1px dotted var(--dim); cursor: help;">Броня: ${ARMOR_TYPE_NAMES[enemy.armorType] || "Нет"}</span>
              <span title="${enemyWeaponTitle}" style="border-bottom: 1px dotted var(--dim); cursor: help;">Оружие: ${enemyWeapon ? enemyWeapon.name : "Кулаки"}</span>
            </div>
          </div>
          <div class="balance-wrap" data-role="balance-wrap" title="Равновесие: блок −20, удар −10. На нуле моб оглушён.">
            <span class="balance-label">РАВНОВЕСИЕ</span>
            <span class="balance-bar" data-role="balance"><span class="balance-fill" data-role="balance-fill" style="width:${Math.max(0, Math.min(100, ((battle.balance ?? battle.maxBalance ?? 100) / Math.max(1, battle.maxBalance || 100)) * 100))}%"></span></span>
            <span class="balance-value" data-role="balance-text">${Math.max(0, Math.round(battle.balance ?? battle.maxBalance ?? 100))}</span>
          </div>
        </article>
      </div>


      <!-- НИЗ: компактный лог боя (3–4 строки) -->
      ${battleLogToggleHtml()}
      <div class="battle-log${view.logExpanded === false ? " collapsed" : ""}" id="battle-log" data-role="battle-log" style="height: 92px; min-height: 92px !important; max-height: 92px !important; flex: 0 0 auto !important; margin-bottom: 0 !important; overflow-y: auto;">
        ${battleReaction ? `<div class="companion-reaction" style="margin-bottom: 8px;">${esc(battleReaction)}</div>` : ""}
        ${log || `<div class="log-line info">Бой начинается — напечатайте слово для удара.</div>`}
      </div>

      ${resultHtml()}
      ${preBattleHtml}
    </section>
  `;
}

// Контекстное окно боевых действий: «Приёмы» и «Расходники» (Этап 9).
// Открывается поверх боя, закрывается по фону/крестику или после действия.
function battleModalHtml() {
  const battle = view.battle;
  if (!battle || !view.battleModal) return "";

  const isAbilities = view.battleModal === "abilities";
  const title = isAbilities ? "Приёмы" : "Расходники";

  const card = ({ act, id, icon, name, meta, count, disabled = false }) => `
    <button class="battle-modal-card" data-act="${act}"${id ? ` data-id="${id}"` : ""} ${disabled ? "disabled" : ""} type="button">
      <span class="battle-modal-icon">${icon}</span>
      <span class="battle-modal-card-body">
        <span class="battle-modal-card-name">${name}</span>
        ${meta ? `<span class="battle-modal-card-meta">${meta}</span>` : ""}
      </span>
      ${count !== undefined ? `<span class="battle-modal-card-count">×${count}</span>` : ""}
    </button>
  `;

  let body = "";
  let tip = "";

  if (isAbilities) {
    // Изученные активные навыки: проверяем ману, кураж и откат.
    const learnedSkills = TALENTS.filter((t) => t.active && ((state.talents || {})[t.id] || 0) > 0);
    const skillCards = learnedSkills.map((t) => {
      const cd = (battle.skillCd || {})[t.id] || 0;
      const ready = state.mana >= t.skill.manaCost
        && (!t.skill.rageCost || battle.rage >= t.skill.rageCost)
        && cd <= 0;
      const metaParts = [`Мана ${state.mana}/${t.skill.manaCost}`];
      if (t.skill.rageCost) metaParts.push(`Кураж ${battle.rage}/${t.skill.rageCost}`);
      if (cd > 0) metaParts.push(`Откат: ${cd} х.`);
      return card({
        act: "skill",
        id: t.id,
        icon: t.skill.icon || "",
        name: esc(t.skill.name),
        meta: metaParts.join(" · "),
        disabled: !ready,
      });
    });

    body = [
      ...skillCards,
      card({
        act: "switch-weapon",
        icon: "",
        name: "Сменить оружие",
        meta: "Замах врага продолжит тикать.",
      }),
    ].join("");
    tip = skillCards.length ? "" : "Тяжёлые удары доступны только через умения. Изучите активные таланты в ветках.";
  } else {
    const potionItems = Object.values(ITEMS).filter((i) => i.slot === "potion" && i.type === "potion" && (state.potions[i.id] || 0) > 0);
    const battleItems = Object.values(ITEMS).filter((i) => i.slot === "potion" && i.type === "combat" && (state.potions[i.id] || 0) > 0);
    const potionCards = potionItems.map((i) => card({
      act: "drink-battle",
      id: i.id,
      icon: iconHtml(i.icon, 24),
      name: esc(i.name),
      meta: esc(i.desc || ""),
      count: state.potions[i.id],
      disabled: !canDrinkPotion(i.id),
    }));
    const itemCards = battleItems.map((i) => card({
      act: "use-battle-item",
      id: i.id,
      icon: iconHtml(i.icon, 24),
      name: esc(i.name),
      meta: esc(i.desc || ""),
      count: state.potions[i.id],
    }));

    body = potionCards.concat(itemCards).join("")
      || `<p class="battle-modal-empty">Нет расходников</p>`;
    tip = "Расходник заменит вашу атаку, но вы сохраните блок.";
  }

  return `
    <div class="battle-modal-backdrop" data-act="battle-modal-close"></div>
    <div class="battle-modal" role="dialog" aria-label="${title}">
      <div class="battle-modal-head">
        <h3>${title}</h3>
        <button class="battle-modal-close" data-act="battle-modal-close" type="button">✕</button>
      </div>
      <div class="battle-modal-body">${body}</div>
      ${tip ? `<p class="battle-modal-tip">${tip}</p>` : ""}
    </div>
  `;
}
