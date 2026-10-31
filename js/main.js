document.addEventListener("click", onClick);
document.addEventListener("keydown", handleKey);
document.addEventListener("input", onInput);

// ── БОЕВОЕ УПРАВЛЕНИЕ: WASD / СТРЕЛКИ, 1–3, ESC ──────────
// Пока активно окно комбо, ввод принимается и со стрелок, и с WASD.
// event.code не зависит от CapsLock/Shift и раскладки клавиатуры.
const COMBO_KEY_ALIASES = {
  ArrowUp: "ArrowUp", ArrowDown: "ArrowDown", ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight",
  KeyW: "ArrowUp", KeyA: "ArrowLeft", KeyS: "ArrowDown", KeyD: "ArrowRight",
  w: "ArrowUp", a: "ArrowLeft", s: "ArrowDown", d: "ArrowRight",
};

const WEAPON_SLOT_KEYS = {
  Digit1: 0, Digit2: 1, Digit3: 2,
  Numpad1: 0, Numpad2: 1, Numpad3: 2,
};

// Shift + 1–4: наложение масел (доступно после открытия аффиксов).
const OIL_SLOT_KEYS = {
  Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3,
  Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3,
};
const OIL_ITEM_IDS = ["oil_fire", "oil_ice", "oil_poison", "oil_blood"];

// 1–4 в нижней панели события: сразу выбирают соответствующий вариант.
const EVENT_OPTION_KEYS = {
  Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3,
  Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3,
};

function handleEventHotkey(event) {
  if (typeof state === "undefined" || !state) return false;
  const hasActiveEvent = state.activeEvent || state.activeFloorEvent || state.activeSceneId
    || (typeof view !== "undefined" && view && view.exploreResult);
  if (!hasActiveEvent) return false;
  if (event.target?.closest?.("input, textarea, select")) return false;

  const index = EVENT_OPTION_KEYS[event.code];
  if (index === undefined) return false;

  const button = document.querySelectorAll(".event-actions button, .result-card .btn")[index];
  if (!button || button.disabled) return false;

  event.preventDefault();
  button.click();
  return true;
}

function applyBattleOil(index) {
  const oilId = OIL_ITEM_IDS[index];
  if (!oilId) return;
  const byId = document.querySelector(`[data-act="apply-oil"][data-id="${oilId}"]`);
  if (byId) { byId.click(); return; }
  const buttons = document.querySelectorAll('[data-act="apply-oil"]');
  if (buttons[index]) { buttons[index].click(); return; }
  if (typeof toast === "function") toast("Масло недоступно.", "warn");
}

// Единственный глобальный обработчик боевых клавиш (буквы KeyA–KeyZ,
// цифры слотов, Escape). Защита от повторной подписки при двойной загрузке.
function handleBattleKeydown(event) {
  if (event.target?.closest?.("input, textarea, select")) return;
  if (typeof view === "undefined") return;
  if (handleEventHotkey(event)) return;

  if (view.tutorialQte) {
    if (typeof view.tutorialStep !== "number") view.tutorialStep = 0;
    if (event.key && event.key.length === 1 && event.key !== " ") {
      const qte = view.tutorialQte;
      const ch = event.key.toUpperCase();
      const nextChar = qte.word[qte.typed.length];
      if (ch === nextChar) {
        qte.typed += ch;
        if (qte.typed === qte.word) {
          view.tutorialStep += 1;
          if (view.tutorialStep < 3) {
            // Слово набрано, но обучение продолжается: даём следующее слово.
            const pool = ["УДАР", "ВЗМАХ", "БЛОК"];
            const words = Array.isArray(qte.words) && qte.words.length ? qte.words : pool;
            let nextWord = words[view.tutorialStep] || pool[Math.floor(Math.random() * pool.length)];
            if (nextWord === qte.word) nextWord = pool.find((w) => w !== qte.word) || nextWord;
            qte.word = nextWord;
            qte.wordIndex = view.tutorialStep;
            qte.completed = view.tutorialStep;
            qte.typed = "";
            qte.timeLeft = 10.0;
            if (typeof updateTutorialQteDisplay === "function") updateTutorialQteDisplay(true);
            else render();
            return;
          }
          // Три слова напечатаны: не выбрасываем в хаб, а открываем диалог Ивана.
          view.tutorialStep = 0;
          view.tutorialQte = null;
          completeTutorial();
          view.npcInteraction = { npcId: "ivan", mode: "dialog", node: "tutorial_done_dialog" };
          render();
          return;
        }
        if (typeof updateTutorialQteDisplay === "function") updateTutorialQteDisplay(false);
        else render();
        return;
      }
      // Неверная буква — просто игнорируем, без перерисовки экрана.
      return;
    }
  }

  // Мини-игра тренировки: печать слова. Успех — completeTraining(true),
  // ошибка — травма и completeTraining(false).
  if (view.trainingQTE) {
    if (event.repeat) return;
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const key = event.key || "";
    if (key.length !== 1 || !key.trim()) return;
    const qte = view.trainingQTE;
    const word = String(qte.word || "");
    const expected = word[String(qte.typed || "").length];
    if (expected === undefined) return;
    event.preventDefault();
    if (key.toUpperCase() !== String(expected).toUpperCase()) {
      stopQteLoop();
      completeTraining(false);
      return;
    }
    qte.typed = String(qte.typed || "") + expected;
    if (qte.typed.length >= word.length) {
      stopQteLoop();
      completeTraining(true);
    } else {
      updateTrainingQteDisplay();
    }
    return;
  }

  const inBattle = view.screen === "battle" && view.battle && !view.battle.over && !view.summary;

  // Экран подготовки: Enter/Space начинает бой, Esc — побег (кроме босса).
  if (inBattle && view.preBattle) {
    if (event.code === "Enter" || event.code === "Space" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      view.preBattle = false;
      startDuel();
      render();
      return;
    }
    if (event.code === "Escape" || event.key === "Escape") {
      if (view.battle.boss) return;
      event.preventDefault();
      view.preBattle = false;
      doExchange({ type: "flee" });
      render();
      return;
    }
    return;
  }

  // Escape в бою — тактическая пауза: закрывает/открывает окно расходников.
  // Остальные модалки закрывает handleKey(), бой при этом не прерываем.
  const arenaBattle = Boolean(view.arenaState && view.arenaState.active && view.screen === "battle");
  if ((inBattle || arenaBattle) && (event.code === "Escape" || event.key === "Escape")) {
    if (view.settingsOpen || view.questsOpen || view.titleModal || view.achievementsOpen || view.talentsModal || view.bestiaryOpen) return;
    event.preventDefault();
    // Esc — тактическая пауза: закрывает открытое окно расходников,
    // а если оно закрыто — открывает его.
    if (view.battleModal) {
      view.battleModal = null;
      resumeCombo();
      Sfx.play("chest_close");
      render();
      return;
    }
    view.battleModal = "potions";
    pauseCombo();
    render();
    return;
  }

  // Shift + 1–4: наложение масел (после открытия аффиксов).
  if (inBattle && event.shiftKey && typeof state !== "undefined" && state.affixesUnlocked === true) {
    const oilIndex = OIL_SLOT_KEYS[event.code];
    if (oilIndex !== undefined) {
      event.preventDefault();
      applyBattleOil(oilIndex);
      return;
    }
  }

  // 1/2/3 без Shift: смена оружия в Real-Time дуэли.
  if (inBattle && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
    const slot = WEAPON_SLOT_KEYS[event.code];
    if (slot !== undefined) {
      event.preventDefault();
      switchBattleWeapon(slot);
      return;
    }
  }

  // Real-Time дуэль: буква уходит в слот атаки или защиты по «умному вводу».
  if (inBattle && view.duelActive && view.battle && !view.preBattle && !view.summary) {
    let letter = null;
    if (event.key && event.key.length === 1 && event.key !== " ") {
      letter = event.key.toUpperCase();
    } else if (event.code && /^Key[A-Z]$/.test(event.code)) {
      letter = event.code.slice(3);
    }
    if (letter) {
      event.preventDefault();
      if (event.repeat) return;
      duelTypeLetter(letter);
      return;
    }
  }

  // Старая «Боевая печать» оставлена только для совместимости навыков.
  if (inBattle && view.typingState) {
    let letter = null;
    if (event.code && /^Key[A-Z]$/.test(event.code)) letter = event.code.slice(3);
    else if (event.key && /^[a-zA-Z]$/.test(event.key)) letter = event.key.toUpperCase();
    if (letter) {
      event.preventDefault();
      if (event.repeat) return;
      const typing = view.typingState;
      // После опечатки ввод игнорируется до завершения провала.
      if (typing.failed) return;
      const expected = typing.word[typing.typed.length];
      if (letter === expected) {
        typing.typed += letter;
        if (typing.typed.length >= typing.word.length) resolveTyping(true);
        else updateTypingDisplay();
      } else {
        // Буква не подошла к слову атаки — проверяем, не начало ли это
        // слова приёма из блока «ДОСТУПНЫЕ ПРИЁМЫ».
        if (typing.mode === "attack") {
          const candidate = String(typing.typed || "") + letter;
          const entry = matchSkillTyping(candidate);
          if (entry && startSkillTypingFromAttack(entry, candidate)) {
            render();
            return;
          }
        }
        // Неверная буква — показываем её красной и проваливаем слово.
        typing.failed = true;
        typing.wrongIndex = typing.typed.length;
        typing.typed += letter;
        typing.failDelay = 0.15;
        updateTypingDisplay();
      }
      return;
    }
  }

  if (!view.comboState) return;

  const codeKey = COMBO_KEY_ALIASES[event.code];
  const charKey = COMBO_KEY_ALIASES[event.key] || COMBO_KEY_ALIASES[String(event.key).toLowerCase()];
  const key = codeKey || charKey;
  if (!key) return;
  event.preventDefault();

  const combo = view.comboState;
  const expected = combo.target[combo.current.length];
  const normalOk = key === expected;

  // Проверяем ввод по комбинациям всех доступных навыков.
  let completedSkill = null;
  let anySkillProgress = false;
  for (const entry of combo.skills || []) {
    const progress = combo.skillProgresses[entry.id] || 0;
    if (entry.combo[progress] !== key) continue;
    combo.skillProgresses[entry.id] = progress + 1;
    anySkillProgress = true;
    if (progress + 1 >= entry.combo.length) completedSkill = entry;
  }
  if (combo.skill) combo.skillProgress = combo.skillProgresses[combo.skill.id] || 0;

  // Символ не подошёл ни к обычной атаке, ни к комбинации навыка.
  if (!normalOk && !anySkillProgress) {
    const skillStarted = (combo.skills || []).some((entry) => (combo.skillProgresses[entry.id] || 0) > 0);
    if (skillStarted) failSkillCombo();
    else resolveCombo(false);
    return;
  }

  if (normalOk) combo.current.push(key);

  // Комбинация навыка собрана полностью.
  if (completedSkill) {
    resolveSkillCombo(completedSkill.id);
    return;
  }

  if (combo.current.length >= combo.target.length) { resolveCombo(true); return; }
  updateComboArrows();
}

if (!window.__towerBattleKeydownBound) {
  window.__towerBattleKeydownBound = true;
  document.addEventListener("keydown", handleBattleKeydown);
}

// ── УПРАВЛЕНИЕ МУЗЫКОЙ И АМБИЕНТОМ ─────────────────────────
const MUSIC_VOLUME_KEY = "tower_music_volume";
const AMBIENT_VOLUME_KEY = "tower_ambient_volume";
const MUSIC_ON_KEY = "tower_music_on";

function getAudio() { return platform.dom.byId("bg-music"); }

// Чтение громкости из localStorage с дефолтом и клампом 0..1.
function readStoredVolume(key, fallback) {
  const raw = platform.storage.get(key);
  if (raw === null || raw === "") return fallback;
  const val = parseFloat(raw);
  return Number.isFinite(val) ? Math.max(0, Math.min(1, val)) : fallback;
}

function applyAudioSettings() {
  LocationAudio.init();

  const musicVol = readStoredVolume(MUSIC_VOLUME_KEY, 0.05);
  const ambientVol = readStoredVolume(AMBIENT_VOLUME_KEY, 0.1);
  const isOn = platform.storage.get(MUSIC_ON_KEY) !== "false";

  LocationAudio.setMusicVolume(isOn ? musicVol : 0);
  LocationAudio.setAmbientVolume(ambientVol);

  // Старый одиночный <audio id="bg-music"> больше не используется:
  // музыкой и амбиентом управляет LocationAudio.
  const legacy = getAudio();
  if (legacy) platform.audio.pause(legacy);

  const musicSlider = platform.dom.byId("music-volume");
  if (musicSlider) musicSlider.value = String(LocationAudio.getVolumeMusic());
  const ambientSlider = platform.dom.byId("ambient-volume");
  if (ambientSlider) ambientSlider.value = String(LocationAudio.getVolumeAmbient());
}

function tryStartMusic() {
  LocationAudio.init();

  const isOn = platform.storage.get(MUSIC_ON_KEY) !== "false";
  if (isOn) {
    // render() мог попытаться запустить треки до жеста пользователя —
    // возобновляем уже выбранные музыку и амбиент.
    if (LocationAudio._musicEl && LocationAudio._currentMusicId) platform.audio.play(LocationAudio._musicEl);
    if (LocationAudio._ambientEl && LocationAudio._currentAmbientId && AMBIENT_TRACKS[LocationAudio._currentAmbientId]) {
      platform.audio.play(LocationAudio._ambientEl);
    }
  }
  document.removeEventListener("pointerdown", tryStartMusic);
  document.removeEventListener("keydown", tryStartMusic);
}
document.addEventListener("pointerdown", tryStartMusic);
document.addEventListener("keydown", tryStartMusic);

document.addEventListener("input", (e) => {
  const id = e.target.id;
  if (id !== "music-volume" && id !== "ambient-volume") return;

  const val = parseFloat(e.target.value);
  if (!Number.isFinite(val)) return;

  if (id === "music-volume") {
    LocationAudio.setMusicVolume(val);
    platform.storage.set(MUSIC_VOLUME_KEY, String(val));
    platform.storage.set(MUSIC_ON_KEY, val > 0 ? "true" : "false");

    if (val > 0) {
      LocationAudio.init();
      if (LocationAudio._musicEl) platform.audio.play(LocationAudio._musicEl);
    }

    const label = document.querySelector('[data-role="music-volume-label"]');
    if (label) label.textContent = Math.round(val * 100) + "%";
    return;
  }

  LocationAudio.setAmbientVolume(val);
  platform.storage.set(AMBIENT_VOLUME_KEY, String(val));

  if (val > 0) {
    LocationAudio.init();
    if (LocationAudio._ambientEl && LocationAudio._currentAmbientId && AMBIENT_TRACKS[LocationAudio._currentAmbientId]) {
      platform.audio.play(LocationAudio._ambientEl);
    }
  }

  const label = document.querySelector('[data-role="ambient-volume-label"]');
  if (label) label.textContent = Math.round(val * 100) + "%";
});

document.addEventListener("DOMContentLoaded", applyAudioSettings);
setTimeout(applyAudioSettings, 100);


// ── ИНИЦИАЛИЗАЦИЯ ИГРЫ ──────────────────────────────────────
const SFX_IDS = [
  "hit_slash", "hit_blunt", "hit_crit_slash", "hit_crit_blunt",
  "hit_block", "hit_miss",
  "potion", "victory", "defeat", "levelup", "open", "chest", "event", "quest_complete",
  "footstep_dirt", "footstep_stone", "footstep_wood", "footstep_water",
  "footstep_jump", "footstep_land",
  "chest_open", "chest_close", "door_open", "door_close",
  "gate_open", "portcullis", "lock_unlock", "forge_craft"
];

function init() {
  if (location.protocol === "file:" || location.hostname === "localhost") validateData();
  Sfx.init();
  Sfx.preload(SFX_IDS);
  LocationAudio.init();

  const loaded = loadState();
  // Защита от потери прогресса: повреждённый/невалидный raw сохраняем
  // в отдельный ключ ДО первого saveState(), который перезапишет основной слот.
  if (loaded && loaded.ok === false && loaded.raw) {
    const backupKey = `${SAVE_KEY}.backup-${Date.now()}`;
    platform.storage.set(backupKey, loaded.raw);
    console.warn("Повреждённое сохранение скопировано в", backupKey, loaded.error);
  }
  clampVitals();
  saveState();

  const toastEl = document.createElement("div");
  toastEl.id = "toast";
  toastEl.className = "toast";
  toastEl.setAttribute("role", "status");
  document.body.appendChild(toastEl);

  if (state.created) {
    const requested = platform.url.getParam("screen");
    if (["hub", "forge", "alchemy", "jewelry", "hotel", "hero", "tower"].includes(requested)) {
      view.screen = requested;
      if (requested === "tower") {
        if (towerClosedReason()) view.screen = "hub";
        else view.tripActive = true;
      }
    }
  }

  // Восстановление вступительной сцены Тимми после перезагрузки: если
  // игрок обновил страницу посреди интро — открываем её снова.
  if (state.created && state.introPending && !view.npcInteraction) {
    view.npcInteraction = { npcId: "timmy", mode: "dialog", node: "intro_start" };
  }

  render();
}

init();