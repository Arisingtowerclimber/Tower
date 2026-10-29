// ── Платформенный слой ──────────────────────────────────────────────────────
// Загружается ПЕРВЫМ. Все обращения к localStorage/document/window.confirm
// по возможности идут через platform.*, чтобы порт на Electron/Capacitor
// сводился к подмене реализаций ниже.
//
// TODO(electron): platform.storage = { get: (k) => ipcRenderer.invoke("storage:get", k), ... };
// TODO(electron): platform.audio = { ... } через IPC к главному процессу.
// TODO(electron): platform.dialog.confirm = (msg) => ipcRenderer.invoke("dialog:confirm", msg);
// TODO(electron): platform.url.getParam = (name) => new URLSearchParams(location.search).get(name);
// TODO(electron): platform.dom.byId = (id) => document.getElementById(id);
//
// TODO(capacitor): platform.storage на @capacitor/preferences (async API).
// TODO(capacitor): platform.audio на @capacitor-community/native-audio.
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
