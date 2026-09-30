/* Pengaturan, fullscreen, pause, serta menu utama. */

function openSettingsPanel() {
  syncAudioSettingsUi();
  syncGameplaySettingsUi();
  applyGameplaySettings();
  syncFullscreenSetting();
  const isLobbySettings = !el.mainMenu.classList.contains("hidden") && el.worldMap.classList.contains("hidden") && el.modal.classList.contains("hidden");
  el.exitToMenu.hidden = isLobbySettings;
  el.settingsOverlay.classList.remove("hidden");
}

function syncBooleanSetting(toggle, value, enabled) {
  if (toggle) toggle.setAttribute("aria-checked", String(enabled));
  if (value) value.textContent = enabled ? "ON" : "OFF";
}

function syncGameplaySettingsUi() {
  if (el.dialogueSpeedSelect) el.dialogueSpeedSelect.value = dialogueSpeed;
  syncBooleanSetting(el.tutorialHintToggle, el.tutorialHintValue, tutorialHintsEnabled);
  syncBooleanSetting(el.screenShakeToggle, el.screenShakeValue, screenShakeEnabled);
}

function applyGameplaySettings() {
  document.body.classList.toggle("tutorial-hints-disabled", !tutorialHintsEnabled);
  document.body.classList.toggle("screen-shake-disabled", !screenShakeEnabled);
  if (el.mapGuide) el.mapGuide.setAttribute("aria-hidden", String(!tutorialHintsEnabled));
}

function setDialogueSpeed(nextSpeed) {
  if (!["slow", "normal", "fast"].includes(nextSpeed)) return;
  dialogueSpeed = nextSpeed;
  localStorage.setItem(dialogueSpeedKey, dialogueSpeed);
  syncGameplaySettingsUi();
}

function getDialogueTypewriterDelay() {
  return { slow: 42, normal: 24, fast: 12 }[dialogueSpeed] || 24;
}

function setTutorialHints(enabled) {
  tutorialHintsEnabled = Boolean(enabled);
  localStorage.setItem(tutorialHintKey, String(tutorialHintsEnabled));
  syncGameplaySettingsUi();
  applyGameplaySettings();
}

function setScreenShake(enabled) {
  screenShakeEnabled = Boolean(enabled);
  localStorage.setItem(screenShakeKey, String(screenShakeEnabled));
  syncGameplaySettingsUi();
  applyGameplaySettings();
}

function openPausePanel() {
  if (el.worldMap.classList.contains("hidden") && el.modal.classList.contains("hidden")) return;
  stopMapMovement(true);
  saveGame();
  el.pauseOverlay.classList.remove("hidden");
}

function closePausePanel() {
  el.pauseOverlay.classList.add("hidden");
  resetMapMovement();
}

function closeSettingsPanel() {
  el.settingsOverlay.classList.add("hidden");
}

function syncFullscreenSetting() {
  const isFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  el.fullscreenToggle.setAttribute("aria-checked", String(isFullscreen));
  el.fullscreenValue.textContent = isFullscreen ? "ON" : "OFF";
}

async function setFullscreen(nextFullscreen) {
  const root = document.documentElement;
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
  try {
    if (nextFullscreen && !fullscreenElement) {
      const requestFullscreen = root.requestFullscreen || root.webkitRequestFullscreen;
      if (requestFullscreen) await requestFullscreen.call(root);
    } else if (!nextFullscreen && fullscreenElement) {
      const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
      if (exitFullscreen) await exitFullscreen.call(document);
    }
  } catch (error) {
    console.warn("Fullscreen tidak dapat diubah oleh browser.", error);
  }
  syncFullscreenSetting();
}

function showExitConfirm() {
  el.confirmOverlay.classList.remove("hidden");
}

function closeExitConfirm() {
  el.confirmOverlay.classList.add("hidden");
}

function exitToMenu() {
  saveGame();
  closeModal();
  hideMapPopup();
  closePausePanel();
  closeExitConfirm();
  hidePrologue();
  hideMap();
  closeLoadPanel();
  showMenu();
  setAmbient("menu");
}

function showMenu() {
  hideMap();
  closePausePanel();
  closeLoadPanel();
  closeExitConfirm();
  el.mainMenu.classList.remove("hidden");
  document.body.classList.add("menu-open");
  syncMenuVideoPlayback();
  setAmbient("menu");
}

function hideMenu() {
  el.mainMenu.classList.add("hidden");
  document.body.classList.remove("menu-open");
  syncMenuVideoPlayback();
}

function syncMenuVideoPlayback() {
  if (!el.menuVideo) return;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const menuVisible = !el.mainMenu.classList.contains("hidden") && !document.body.classList.contains("startup-loading");
  if (!menuVisible || reduceMotion) {
    el.menuVideo.pause();
    return;
  }
  const playRequest = el.menuVideo.play();
  if (playRequest?.catch) playRequest.catch(() => { });
}
