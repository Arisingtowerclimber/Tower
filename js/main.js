document.addEventListener("click", onClick);
document.addEventListener("keydown", handleKey);
document.addEventListener("input", onInput);

// ── УПРАВЛЕНИЕ МУЗЫКОЙ ──────────────────────────────────────
const MUSIC_VOLUME_KEY = "tower_music_volume";
const MUSIC_ON_KEY = "tower_music_on";

function getAudio() { return document.getElementById("bg-music"); }

function updateMusicUI() {
  const btn = document.getElementById("music-toggle");
  if (!btn) return;
  
  const isOn = localStorage.getItem(MUSIC_ON_KEY) !== "false";
  btn.textContent = isOn ? "🎵" : "🔇";
}

function applyMusicSettings() {
  const audio = getAudio();
  if (!audio) return;

  const savedVol = localStorage.getItem(MUSIC_VOLUME_KEY);
  audio.volume = savedVol !== null ? parseFloat(savedVol) : 0.3;

  const isOn = localStorage.getItem(MUSIC_ON_KEY) !== "false";
  audio.muted = !isOn;

  const slider = document.getElementById("music-volume");
  if (slider && savedVol !== null) {
    slider.value = savedVol;
  }
  
  updateMusicUI();
}

function tryStartMusic() {
  const audio = getAudio();
  if (!audio) return;
  
  const isOn = localStorage.getItem(MUSIC_ON_KEY) !== "false";
  if (isOn) {
    audio.play().catch(() => {});
  }
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

  const isOn = localStorage.getItem(MUSIC_ON_KEY) !== "false";
  
  if (isOn) {
    audio.pause();
    localStorage.setItem(MUSIC_ON_KEY, "false");
  } else {
    audio.muted = false;
    audio.play().catch(() => {});
    localStorage.setItem(MUSIC_ON_KEY, "true");
  }
  updateMusicUI();
});

document.addEventListener("input", (e) => {
  if (e.target.id !== "music-volume") return;
  
  const audio = getAudio();
  const val = parseFloat(e.target.value);
  
  if (audio) {
    audio.volume = val;
    localStorage.setItem(MUSIC_VOLUME_KEY, val);
    
    if (audio.paused && val > 0) {
      audio.muted = false;
      audio.play().catch(() => {});
      localStorage.setItem(MUSIC_ON_KEY, "true");
      updateMusicUI();
    }
  }
});

document.addEventListener("DOMContentLoaded", applyMusicSettings);
setTimeout(applyMusicSettings, 100);


// ── ИНИЦИАЛИЗАЦИЯ ИГРЫ ──────────────────────────────────────
function init() {
  loadState();
  clampVitals();
  saveState();

  const toastEl = document.createElement("div");
  toastEl.id = "toast";
  toastEl.className = "toast";
  toastEl.setAttribute("role", "status");
  document.body.appendChild(toastEl);

  if (state.created) {
    const requested = new URLSearchParams(location.search).get("screen");
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