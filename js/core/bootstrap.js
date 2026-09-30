/* Event listener global dan pemanggilan awal aplikasi. */

function returnToLobbyAfterEnding() {
  stopGoodEndingSequence();
  closeModal();
  hideMap();
  showMenu();
}

el.menuStart.addEventListener("click", () => {
  resumeAudio();
  startNewGame();
});
el.startupLoader?.addEventListener("pointerdown", primeStartupMenuMusicFromGesture, { once: true });
el.startupFullscreenPrompt?.addEventListener("click", async () => {
  primeStartupMenuMusicFromGesture();
  await setFullscreen(true);
  syncStartupFullscreenPrompt();
});
el.menuSettings.addEventListener("click", showSettings);
el.menuLoad.addEventListener("click", () => {
  resumeAudio();
  showLoadPanel();
});
el.menuCredits.addEventListener("click", showCredits);
el.mapSettings.addEventListener("click", showSettings);
el.hubSettings.addEventListener("click", showSettings);
el.hubContinueEnding?.addEventListener("click", () => showEnding(true));
el.resumeGame.addEventListener("click", closePausePanel);
el.pauseSettings.addEventListener("click", openSettingsPanel);
el.pauseExit.addEventListener("click", showExitConfirm);
el.prologueSkip.addEventListener("click", skipPrologue);
el.prologueNext.addEventListener("click", nextPrologue);
el.startTrial.addEventListener("click", startTrial);
el.noteButton.addEventListener("click", showNotes);
el.resetButton.addEventListener("click", () => reset(true));
el.closeModal.addEventListener("click", closeModal);
el.mainVolumeSlider.addEventListener("input", () => setMainVolume(Number(el.mainVolumeSlider.value) / 100));
el.sfxVolumeSlider.addEventListener("input", () => setSfxVolume(Number(el.sfxVolumeSlider.value) / 100));
el.dialogueSpeedSelect.addEventListener("change", () => setDialogueSpeed(el.dialogueSpeedSelect.value));
el.tutorialHintToggle.addEventListener("click", () => setTutorialHints(!tutorialHintsEnabled));
el.screenShakeToggle.addEventListener("click", () => setScreenShake(!screenShakeEnabled));
el.muteAllToggle.addEventListener("click", () => setMuteAll(!muteAll));
el.fullscreenToggle.addEventListener("click", () => {
  const isFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  setFullscreen(!isFullscreen);
});
el.closeSettings.addEventListener("click", closeSettingsPanel);
el.exitToMenu.addEventListener("click", () => {
  showExitConfirm();
});
el.settingsOverlay.addEventListener("click", (event) => {
  if (event.target === el.settingsOverlay) closeSettingsPanel();
});
el.closeCredits.addEventListener("click", closeCredits);
el.creditsOverlay.addEventListener("click", (event) => {
  if (event.target === el.creditsOverlay) closeCredits();
});
el.cancelExit.addEventListener("click", closeExitConfirm);
el.confirmExit.addEventListener("click", () => {
  closeSettingsPanel();
  exitToMenu();
});
el.confirmOverlay.addEventListener("click", (event) => {
  if (event.target === el.confirmOverlay) closeExitConfirm();
});
el.mapPopupClose.addEventListener("click", hideMapPopup);
el.closeLoad.addEventListener("click", closeLoadPanel);
el.showMoreSaves.addEventListener("click", () => {
  const slots = getSaveSlots();
  const isExpanded = visibleSaveCount > 5;
  visibleSaveCount = isExpanded ? 5 : slots.length;
  renderSaveList();
  el.saveList.scrollTo({
    top: isExpanded ? 0 : Math.min(el.saveList.scrollHeight, 5 * 104),
    behavior: "smooth"
  });
});
el.loadOverlay.addEventListener("click", (event) => {
  if (event.target === el.loadOverlay) closeLoadPanel();
});
el.modal.addEventListener("click", (event) => {
  if (event.target === el.modal && !isLockedModal()) closeModal();
});
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === "f" && !event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey) {
    event.preventDefault();
    const isFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    setFullscreen(!isFullscreen);
    return;
  }
  if (!el.creditsOverlay.classList.contains("hidden") && key === "escape") {
    event.preventDefault();
    closeCredits();
    return;
  }
  if ((key === "f2" || event.code === "F2") && !event.repeat) {
    event.preventDefault();
    toggleCollisionDebug();
    return;
  }
  const prologueCanAdvance = !el.prologue.classList.contains("hidden")
    && el.settingsOverlay.classList.contains("hidden")
    && el.pauseOverlay.classList.contains("hidden")
    && el.loadOverlay.classList.contains("hidden")
    && el.confirmOverlay.classList.contains("hidden");
  if (prologueCanAdvance && (key === " " || event.code === "Space") && ![el.prologueNext, el.prologueSkip].includes(document.activeElement)) {
    event.preventDefault();
    return;
  }
  if (el.worldMap.classList.contains("hidden") || !el.modal.classList.contains("hidden") || !el.settingsOverlay.classList.contains("hidden") || !el.pauseOverlay.classList.contains("hidden") || !el.loadOverlay.classList.contains("hidden") || !el.confirmOverlay.classList.contains("hidden")) return;
  if (key === "escape") {
    event.preventDefault();
    openPausePanel();
    return;
  }
  if (!el.worldMap.classList.contains("side-level-active")) return;
  if (activeWitchDialog && ["e", "enter"].includes(key)) {
    event.preventDefault();
    closeWitchDialog();
    return;
  }
  if (key === "e" && activeSideTrigger !== null) {
    const index = activeSideTrigger;
    if (index === state.current && !state.completed.includes(index)) {
      event.preventDefault();
      useSideTrialTrigger(index);
    }
    return;
  }
  if (key === "e" && activeHouseInteraction) {
    event.preventDefault();
    useHouseInteraction();
    return;
  }
  if (key === "e" && activeForestInteraction) {
    event.preventDefault();
    useForestInteraction();
    return;
  }
  if (key === "e" && activeLightInteraction) {
    event.preventDefault();
    useLightInteraction();
    return;
  }
  if (key === "e" && activeHeritageInteraction) {
    event.preventDefault();
    useHeritageInteraction();
    return;
  }
  if (["arrowright", "arrowleft", "d", "a"].includes(key)) {
    event.preventDefault();
    if (!suppressedMapKeys.has(key)) mapKeys.add(key);
  }
});
window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  const prologueCanAdvance = !el.prologue.classList.contains("hidden")
    && el.settingsOverlay.classList.contains("hidden")
    && el.pauseOverlay.classList.contains("hidden")
    && el.loadOverlay.classList.contains("hidden")
    && el.confirmOverlay.classList.contains("hidden");
  if (prologueCanAdvance && (key === " " || event.code === "Space")) {
    if (![el.prologueNext, el.prologueSkip].includes(document.activeElement)) {
      event.preventDefault();
      nextPrologue();
    }
    return;
  }
  mapKeys.delete(key);
  suppressedMapKeys.delete(key);
});

// Browser dapat kehilangan event keyup ketika fokus berpindah ke luar tab.
// Selalu buang input yang tertinggal agar Raka tidak bergerak tanpa perintah.
window.addEventListener("blur", resetMapMovement);
window.addEventListener("focus", resetMapMovement);
document.addEventListener("visibilitychange", () => {
  resetMapMovement();
});

document.getElementById("witchBubble")?.addEventListener("click", closeWitchDialog);
el.mapBackdrop.addEventListener("click", () => {
  if (activeWitchDialog) closeWitchDialog();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest?.("button");
  if (!button || button === el.startupFullscreenPrompt || button.disabled || button.matches('[draggable="true"]')) return;
  resumeAudio();
  playButtonClickSound();
}, true);

function handleViewportChange() {
  if (viewportSyncFrame) cancelAnimationFrame(viewportSyncFrame);
  viewportSyncFrame = requestAnimationFrame(() => {
    viewportSyncFrame = null;
    syncSideWorldViewport();
    if (!el.worldMap.classList.contains("hidden")) {
      if (el.worldMap.classList.contains("side-level-active")) {
        state.sideY = getSideGroundY() - sideWorld.playerHeight;
        renderMap();
      } else {
        renderHubMap();
      }
    }
  });
}

window.addEventListener("resize", handleViewportChange);
document.addEventListener("fullscreenchange", handleViewportChange);
document.addEventListener("fullscreenchange", syncFullscreenSetting);
document.addEventListener("fullscreenchange", syncStartupFullscreenPrompt);

initGame();
runStartupSequence();
stepMapMovement();
