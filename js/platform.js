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
    cache: {}, // id → Audio

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

    volume: 0.5,
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
// Громкость хранится в platform.storage ("tower_sfx_volume"), дефолт 0.5.
// setVolume обновляет и текущее значение, и слайдер при следующем рендере.
const Sfx = {
  STORAGE_KEY: "tower_sfx_volume",

  init() {
    const raw = platform.storage.get(this.STORAGE_KEY);
    platform.sfx.volume = raw === null ? 0.5 : Math.max(0, Math.min(1, Number(raw) || 0));
  },

  getVolume() { return platform.sfx.volume; },

  setVolume(v) {
    const value = Math.max(0, Math.min(1, Number(v) || 0));
    platform.sfx.volume = value;
    platform.storage.set(this.STORAGE_KEY, String(value));
  },

  preload(ids) { platform.sfx.preload(ids); },

  play(id, opts = {}) { platform.sfx.play(id, opts); },
};
