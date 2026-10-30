// ── Платформенный слой ──────────────────────────────────────────────────────
// Загружается ПЕРВЫМ. Все обращения к localStorage/document/window.confirm
// по возможности идут через platform.*, чтобы порт на Electron/Capacitor
// сводился к подмене реализаций ниже.
//
// TODO(electron): platform.storage = { get: (k) => ipcRenderer.invoke("storage:get", k), ... };
// TODO(electron): platform.audio = { ... } через IPC к главному процессу.
// TODO(electron): Sfx — Web Audio внутри рендерера работает как есть; для
//   нативного звука заменить Sfx на ipcRenderer-плеер с локальными файлами.
// TODO(electron): platform.dialog.confirm = (msg) => ipcRenderer.invoke("dialog:confirm", msg);
// TODO(electron): platform.url.getParam = (name) => new URLSearchParams(location.search).get(name);
// TODO(electron): platform.dom.byId = (id) => document.getElementById(id);
//
// TODO(capacitor): platform.storage на @capacitor/preferences (async API).
// TODO(capacitor): platform.audio на @capacitor-community/native-audio.
// TODO(capacitor): Sfx — на мобильных HTMLAudio.play() требует жеста; при
//   проблемах автозагрузки перейти на native-audio с предзагрузкой Sfx.preload.
// TODO(capacitor): platform.dialog.confirm на @capacitor/dialog.
// TODO(capacitor): platform.url.getParam через App.getLaunchUrl().
// TODO(capacitor): platform.dom.byId оставить DOM-реализацией.

const platform = {
  storage: {
    get(key) { try { return localStorage.getItem(key); } catch (err) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (err) {} },
    remove(key) { try { localStorage.removeItem(key); } catch (err) {} },
  },

  audio: {
    play(audioEl) {
      if (!audioEl || typeof audioEl.play !== "function") return;
      const playPromise = audioEl.play();
      if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => {});
    },
    pause(audioEl) {
      if (audioEl && typeof audioEl.pause === "function") audioEl.pause();
    },
    setVolume(audioEl, volume) {
      if (audioEl) audioEl.volume = Math.max(0, Math.min(1, Number(volume) || 0));
    },
  },

  // Короткие звуковые эффекты (Этап 4). Каждый id — отдельный <audio>;
  // проще и надёжнее, чем WebAudio-decode, для Electron/Capacitor.
  sfx: {
    cache: {}, // id/path → Audio
    _missing: {}, // path → true, если файл не загрузился (чтобы не спамить 404)

    create(id) {
      const el = new Audio(`assets/sfx/${id}.mp3`);
      el.preload = "auto";
      return el;
    },

    preload(ids) {
      if (typeof Audio === "undefined") return;
      for (const id of ids) {
        if (!this.cache[id]) this.cache[id] = this.create(id);
      }
    },

    // Создаёт <audio> для конкретного пути и запоминает битые файлы.
    _createPath(path) {
      const el = new Audio(path);
      el.preload = "auto";
      el.addEventListener("error", () => {
        this._missing[path] = true;
        console.warn(`[sfx] Файл не найден или не загрузился: ${path}`);
      }, { once: true });
      return el;
    },

    // Предзагрузка по прямым путям (варианты из SOUND_VARIANTS).
    preloadPaths(paths) {
      if (typeof Audio === "undefined") return;
      for (const path of paths) {
        if (this._missing[path] || this.cache[path]) continue;
        this.cache[path] = this._createPath(path);
      }
    },

    // Проигрывает конкретный файл по пути (assets/sfx/...). Кеш — по пути,
    // чтобы разные варианты одного звука не перетирали друг друга.
    playPath(path, { volume = null, rate = null } = {}) {
      if (typeof Audio === "undefined" || !path) return;
      if (this._missing[path]) return;
      let el = this.cache[path];
      if (!el) {
        el = this._createPath(path);
        this.cache[path] = el;
      }
      if (this.volume !== null && this.volume !== undefined) el.volume = Math.max(0, Math.min(1, this.volume));
      if (volume !== null) el.volume = Math.max(0, Math.min(1, Number(volume) || 0));
      try { el.playbackRate = rate ? Math.max(0.25, Math.min(4, rate)) : 1; } catch (err) {}
      try { el.currentTime = 0; } catch (err) {}
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    },

    play(id, { volume = null, rate = null } = {}) {
      if (typeof Audio === "undefined") return;
      let el = this.cache[id];
      if (!el) { el = this.create(id); this.cache[id] = el; }
      if (this.volume !== null && this.volume !== undefined) el.volume = Math.max(0, Math.min(1, this.volume));
      if (volume !== null) el.volume = Math.max(0, Math.min(1, Number(volume) || 0));
      try { el.playbackRate = rate ? Math.max(0.25, Math.min(4, rate)) : 1; } catch (err) {}
      try { el.currentTime = 0; } catch (err) {}
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    },

    volume: 0.25,
  },

  dialog: {
    confirm(message) { return window.confirm(message); },
  },

  url: {
    getParam(name) { return new URLSearchParams(location.search).get(name); },
  },

  dom: {
    byId(id) { return document.getElementById(id); },
  },
};

// ── Sfx — фасад поверх platform.sfx ────────────────────────────────────────
// Громкость хранится в platform.storage ("tower_sfx_volume"), дефолт 0.15.
// setVolume обновляет и текущее значение, и слайдер при следующем рендере.
const Sfx = {
  STORAGE_KEY: "tower_sfx_volume",

  init() {
    const raw = platform.storage.get(this.STORAGE_KEY);
    // Пустой профиль — тихий дефолт 15%; сохранённое значение не перезаписываем.
    const value = raw === null || raw === "" ? 0.15 : parseFloat(raw);
    platform.sfx.volume = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.15;
  },

  getVolume() { return platform.sfx.volume; },

  setVolume(v) {
    const value = Math.max(0, Math.min(1, Number(v) || 0));
    platform.sfx.volume = value;
    platform.storage.set(this.STORAGE_KEY, String(value));
  },

  preload(ids) {
    const table = (typeof window !== "undefined" && window.SOUND_VARIANTS) || null;
    if (!table) { platform.sfx.preload(ids); return; }
    const paths = [];
    for (const id of ids) {
      const variants = table[id];
      if (Array.isArray(variants) && variants.length) paths.push(...variants);
    }
    platform.sfx.preloadPaths(paths);
  },

  _lastPlayed: null,

  play(id, opts = {}) {
    const variants = (typeof window !== "undefined" && window.SOUND_VARIANTS)
      ? window.SOUND_VARIANTS[id]
      : null;
    if (!Array.isArray(variants) || variants.length === 0) {
      console.warn(`[Sfx] Нет звука для id «${id}» (SOUND_VARIANTS пуст или не найден).`);
      return;
    }

    // Не играем один и тот же файл два раза подряд, если есть альтернативы.
    let pool = variants;
    if (variants.length > 1 && this._lastPlayed) {
      const filtered = variants.filter((path) => path !== this._lastPlayed);
      if (filtered.length) pool = filtered;
    }

    const path = pool[Math.floor(Math.random() * pool.length)];
    this._lastPlayed = path;
    platform.sfx.playPath(path, opts);
  },
};

// ── LocationAudio — музыка и амбиент локаций ───────────────────────────────
// Отдельные loop-плееры для музыки и эмбиента. Пути берутся из MUSIC_TRACKS /
// AMBIENT_TRACKS (data.js). Смена трека — только при смене id, чтобы render()
// не перезапускал звук на каждый ход.
const LocationAudio = {
  _musicEl: null,
  _ambientEl: null,
  _currentMusicId: null,
  _currentAmbientId: null,
  _volumeMusic: 0.05,
  _volumeAmbient: 0.1,

  init() {
    if (!this._musicEl) {
      this._musicEl = new Audio();
      this._musicEl.loop = true;
      this._musicEl.volume = this._volumeMusic;
    }
    if (!this._ambientEl) {
      this._ambientEl = new Audio();
      this._ambientEl.loop = true;
      this._ambientEl.volume = this._volumeAmbient;
    }
  },

  playMusic(id) {
    if (this._currentMusicId === id) return;
    const path = MUSIC_TRACKS[id];
    if (!path) return;
    this._currentMusicId = id;
    this._musicEl.src = path;
    this._musicEl.volume = this._volumeMusic;
    this._musicEl.play().catch(() => {});
  },

  playAmbient(id) {
    if (this._currentAmbientId === id) return;
    this._currentAmbientId = id;
    const path = AMBIENT_TRACKS[id];
    if (!path) {
      if (this._ambientEl) this._ambientEl.pause();
      return;
    }
    this._ambientEl.src = path;
    this._ambientEl.volume = this._volumeAmbient;
    this._ambientEl.play().catch(() => {});
  },

  setMusicVolume(v) {
    this._volumeMusic = Math.max(0, Math.min(1, Number(v) || 0));
    if (this._musicEl) this._musicEl.volume = this._volumeMusic;
  },

  getVolumeMusic() {
    return this._volumeMusic;
  },

  setAmbientVolume(v) {
    this._volumeAmbient = Math.max(0, Math.min(1, Number(v) || 0));
    if (this._ambientEl) this._ambientEl.volume = this._volumeAmbient;
  },

  getVolumeAmbient() {
    return this._volumeAmbient;
  }
};
window.LocationAudio = LocationAudio;
