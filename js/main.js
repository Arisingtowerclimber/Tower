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
  
  // Если в localStorage стоит "false" — значит выключено. Иначе — включено.
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

// Автозапуск при первом клике (браузеры требуют взаимодействия)
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

// Клик по кнопке (иконке ноты) — вкл/выкл
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

// Движение ползунка громкости
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

// Применяем настройки при старте
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

  // Прямые ссылки на экраны нужны только уже созданному герою.
  if (state.created) {
    const requested = new URLSearchParams(location.search).get("screen");
    if (["hub", "forge", "alchemy", "jewelry", "hotel", "hero", "tower"].includes(requested)) {
      view.screen = requested;
      if (requested === "tower") {
        // Прямая ссылка не должна открывать Башню ночью или без энергии.
        if (towerClosedReason()) view.screen = "hub";
        else view.tripActive = true;
      }
    }
  }

  render();
}
function preloadImages() {
  // Собираем пути ко всем фонам и портретам. Только реально существующие файлы
  // (в assets/ всё в .webp): несуществующие пути дают 404 на GitHub Pages.
  const imagesToPreload = [
    // Фоны хаба (все время суток)
    "assets/backgrounds/hub_morning.webp",
    "assets/backgrounds/hub_day.webp",
    "assets/backgrounds/hub_evening.webp",
    "assets/backgrounds/hub_night.webp",
    // Фоны локаций и экранов
    "assets/backgrounds/market.webp",
    "assets/backgrounds/forge.webp",
    "assets/backgrounds/jewelry.webp",
    "assets/backgrounds/hero-screen.webp",
    "assets/backgrounds/create-bg.webp",
    // Фоны этажей Башни
    "assets/backgrounds/duskwood.webp",
    "assets/backgrounds/crypt.webp",
    // Портреты (грузятся при заходе в гостиницу)
    "assets/portraits/mira.webp",
    "assets/portraits/alva.webp",
    "assets/portraits/solveig.webp",
    "assets/portraits/ron.webp",
  ];

  // Создаем виртуальные теги img — браузер скачает их в кэш, но на экране не покажет
  imagesToPreload.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}


init();