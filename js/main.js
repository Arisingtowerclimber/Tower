document.addEventListener("click", onClick);
document.addEventListener("keydown", handleKey);
document.addEventListener("input", onInput);

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