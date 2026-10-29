document.addEventListener("click", onClick);
document.addEventListener("keydown", handleKey);
document.addEventListener("input", onInput);

// ── УПРАВЛЕНИЕ МУЗЫКОЙ ──────────────────────────────────────
const MUSIC_VOLUME_KEY = "tower_music_volume";
const MUSIC_ON_KEY = "tower_music_on";

function getAudio() { return platform.dom.byId("bg-music"); }

function updateMusicUI() {
  const btn = platform.dom.byId("music-toggle");
  if (!btn) return;
  
  const isOn = platform.storage.get(MUSIC_ON_KEY) !== "false";
  btn.textContent = isOn ? "🎵" : "🔇";
}

function applyMusicSettings() {
  const audio = getAudio();
  if (!audio) return;

  const savedVol = platform.storage.get(MUSIC_VOLUME_KEY);
  platform.audio.setVolume(audio, savedVol !== null ? parseFloat(savedVol) : 0.3);

  const isOn = platform.storage.get(MUSIC_ON_KEY) !== "false";
  audio.muted = !isOn;

  const slider = platform.dom.byId("music-volume");
  if (slider && savedVol !== null) {
    slider.value = savedVol;
  }
  
  updateMusicUI();
}

function tryStartMusic() {
  const audio = getAudio();
  if (!audio) return;
  
  const isOn = platform.storage.get(MUSIC_ON_KEY) !== "false";
  if (isOn) platform.audio.play(audio);
  document.removeEventListener("pointerdown", tryStartMusic);
  document.removeEventListener("keydown", tryStartMusic);
}
document.addEventListener("pointerdown", tryStartMusic);
document.addEventListener("keydown", tryStartMusic);

document.addEventListener("click", (e) => {
  const btn = e.target.closest("#music-toggle");
  if (!btn) return;
  
  const audio = getAudio();
  if (!audio) return;

  const isOn = platform.storage.get(MUSIC_ON_KEY) !== "false";
  
  if (isOn) {
    platform.audio.pause(audio);
    platform.storage.set(MUSIC_ON_KEY, "false");
  } else {
    audio.muted = false;
    platform.audio.play(audio);
    platform.storage.set(MUSIC_ON_KEY, "true");
  }
  updateMusicUI();
});

document.addEventListener("input", (e) => {
  if (e.target.id !== "music-volume") return;
  
  const audio = getAudio();
  const val = parseFloat(e.target.value);
  
  if (audio) {
    platform.audio.setVolume(audio, val);
    platform.storage.set(MUSIC_VOLUME_KEY, val);
    
    if (audio.paused && val > 0) {
      audio.muted = false;
      platform.audio.play(audio);
      platform.storage.set(MUSIC_ON_KEY, "true");
      updateMusicUI();
    }
  }
});

document.addEventListener("DOMContentLoaded", applyMusicSettings);
setTimeout(applyMusicSettings, 100);


// ── ИНИЦИАЛИЗАЦИЯ ИГРЫ ──────────────────────────────────────
function init() {
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

  render();
}

init();