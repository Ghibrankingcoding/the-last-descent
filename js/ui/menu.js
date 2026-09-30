/* Catatan, kredit, reset, dan mulai game baru. */

function showNotes() {
  const notes = state.notes.length
    ? state.notes.map((note, index) => `${index + 1}. ${note}`).join("\n")
    : "Belum ada catatan. Selesaikan Trial untuk mendapat pesan dari nenek.";
  openModal("Catatan Nenek", "Pesan Perjalanan", notes);
}

function showSettings() {
  openSettingsPanel();
}

function showCredits() {
  el.creditsOverlay.classList.remove("hidden");
  el.creditsOverlay.setAttribute("aria-hidden", "false");
  el.mainMenu.setAttribute("inert", "");
  el.mainMenu.setAttribute("aria-hidden", "true");
  window.setTimeout(() => el.closeCredits.focus(), 0);
}

function closeCredits() {
  if (el.creditsOverlay.classList.contains("hidden")) return;
  el.creditsOverlay.classList.add("hidden");
  el.creditsOverlay.setAttribute("aria-hidden", "true");
  el.mainMenu.removeAttribute("inert");
  el.mainMenu.setAttribute("aria-hidden", "false");
  el.menuCredits.focus();
}

function reset(clearCurrentSave = false) {
  state.current = 0;
  state.mapPosition = 0;
  state.mapX = mapPositions[0].x;
  state.mapY = mapPositions[0].y;
  state.mapProgress = 0;
  state.sideArea = 0;
  state.sideWorldVersion = 3;
  state.sideX = 210;
  state.sideY = getSideGroundY() - sideWorld.playerHeight;
  state.sideVX = 0;
  state.sideVY = 0;
  state.hpUnits = maxHpUnits;
  state.hpSystemVersion = 2;
  state.lives = maxChances;
  state.completed = [];
  state.inventory = [];
  state.notes = [];
  state.mapPieces = 0;
  state.housePhase = "inside";
  state.houseMaterials = [];
  state.natureInspected = false;
  state.natureMaterials = [];
  state.natureBridgeCrafted = false;
  state.natureBridgeInstalled = false;
  state.lightDoorInspected = false;
  state.lightFragments = [];
  state.lightDoorPhase = "closed";
  state.lightDoorFlowVersion = currentLightDoorFlowVersion;
  state.heritageDoorInspected = false;
  state.heritageMaterials = [];
  state.heritageDoorPhase = "closed";
  state.heritageDoorFlowVersion = currentHeritageDoorFlowVersion;
  state.ended = false;
  state.endingGood = null;
  state.slotId = clearCurrentSave ? null : state.slotId;
  state.updatedAt = null;
  postTrialExitArea = null;
  if (clearCurrentSave) localStorage.removeItem(saveKey);
  closeModal();
  render();
}

function startNewGame() {
  stopGoodEndingSequence();
  reset(true);
  state.slotId = `save-${Date.now()}`;
  saveGame();
  showPrologue();
}
