/* Normalisasi state dan kompatibilitas save lama. */

function normalizeLoadedState(nextState) {
  const hasStoredHp = Number.isFinite(Number(nextState?.hpUnits));
  const storedHpVersion = Number(nextState?.hpSystemVersion) || 0;
  const storedSideWorldVersion = Number(nextState?.sideWorldVersion) || 1;
  const storedLightDoorFlowVersion = Number(nextState?.lightDoorFlowVersion) || 0;
  const storedHeritageDoorFlowVersion = Number(nextState?.heritageDoorFlowVersion) || 0;
  const legacyLives = Number(nextState?.lives);
  Object.assign(state, nextState);
  state.current = Math.max(0, Math.min(trials.length - 1, Number(state.current) || 0));
  state.mapPosition = Math.max(0, Math.min(trials.length, Number(state.mapPosition ?? state.current + 1) || 0));
  state.mapX = Number(state.mapX) || 13;
  state.mapY = Number(state.mapY) || 74;
  state.mapProgress = Number(state.mapProgress) || 0;
  state.sideArea = Math.max(0, Math.min(sideAreas.length - 1, Number(state.sideArea) || 0));
  state.sideX = Math.max(80, Math.min(sideWorld.houseRouteWidth - 120, Number(state.sideX) || 210));
  state.sideY = getSideGroundY() - sideWorld.playerHeight;
  // Kecepatan adalah state sesaat dan tidak boleh ikut dipulihkan dari save.
  // Jika save dibuat ketika tombol arah masih ditekan, memulihkan sideVX akan
  // membuat Raka tampak berjalan sendiri setelah permainan dibuka kembali.
  state.sideVX = 0;
  state.sideVY = 0;
  state.hpUnits = hasStoredHp
    ? storedHpVersion >= 2
      ? clampHpUnits(nextState.hpUnits)
      : clampHpUnits(Math.ceil(Number(nextState.hpUnits) / 2))
    : clampHpUnits((Number.isFinite(legacyLives) && legacyLives >= 0 ? legacyLives : maxChances) * hpUnitsPerChance);
  state.hpSystemVersion = 2;
  syncLegacyLives();
  state.completed = Array.isArray(state.completed)
    ? [...new Set(state.completed.map(Number).filter((index) => Number.isInteger(index) && index >= 0 && index < trials.length))]
    : [];
  if (state.completed.includes(state.current) && state.completed.length < trials.length) {
    state.current = trials.findIndex((_, index) => !state.completed.includes(index));
  }
  state.inventory = Array.isArray(state.inventory) ? state.inventory : [];
  state.notes = Array.isArray(state.notes) ? state.notes : [];
  state.mapPieces = Math.max(state.completed.length, Math.max(0, Math.min(5, Number(state.mapPieces) || 0)));
  state.housePhase = ["inside", "route", "forest"].includes(state.housePhase)
    ? state.housePhase
    : ["outside", "entry"].includes(state.housePhase) ? "route" : "inside";
  if (storedSideWorldVersion < 2 && [1, 2].includes(state.sideArea)) {
    state.sideX = Math.round(state.sideX * getSideCoordinateScale(state.sideArea));
  }
  if (storedSideWorldVersion < 3 && [3, 4].includes(state.sideArea)) {
    state.sideX = Math.round(state.sideX * getSideCoordinateScale(state.sideArea));
  }
  state.sideWorldVersion = 3;
  state.sideX = Math.min(getSideWorldWidth() - 120, state.sideX);
  state.houseMaterials = Array.isArray(state.houseMaterials) ? state.houseMaterials : [];
  const natureLevelComplete = state.completed.includes(1);
  const invalidInstalledBridge = !natureLevelComplete && Boolean(state.natureBridgeInstalled);
  state.natureMaterials = Array.isArray(state.natureMaterials)
    ? [...new Set(state.natureMaterials.filter((item) => ["Serat Tumbuhan", "Kayu Jembatan"].includes(item)))]
    : [];

  if (natureLevelComplete) {
    state.natureInspected = true;
    state.natureMaterials = ["Serat Tumbuhan", "Kayu Jembatan"];
    state.natureBridgeCrafted = true;
    state.natureBridgeInstalled = true;
    if (!state.inventory.includes("Jembatan")) state.inventory.push("Jembatan");
  } else if (invalidInstalledBridge) {
    // Save lama sempat dapat tersimpan di antara pemasangan jembatan dan
    // completeTrial(). State itu menampilkan jembatan jadi tetapi menghapus
    // seluruh trigger Level 2. Mulai ulang misi Level 2 agar save bisa dimainkan.
    state.natureInspected = false;
    state.natureMaterials = [];
    state.natureBridgeCrafted = false;
    state.natureBridgeInstalled = false;
    if (state.current === 1) state.sideX = getSideAreaStartX(1);
    state.inventory = state.inventory.filter((item) => item !== "Jembatan");
  } else {
    state.natureInspected = Boolean(state.natureInspected);
    state.natureBridgeCrafted = Boolean(state.natureBridgeCrafted);
    state.natureBridgeInstalled = false;
    if (state.natureBridgeCrafted) {
      // Craft yang memang sudah selesai adalah checkpoint valid: pastikan
      // bahan dan trigger pemasangan ikut tersedia ketika save dimuat.
      state.natureInspected = true;
      state.natureMaterials = ["Serat Tumbuhan", "Kayu Jembatan"];
      if (!state.inventory.includes("Jembatan")) state.inventory.push("Jembatan");
    } else {
      state.inventory = state.inventory.filter((item) => item !== "Jembatan");
    }
  }
  const lightLevelComplete = state.completed.includes(2);
  const validLightFragments = new Set(lightCollectibles.map((item) => item.name));
  state.lightFragments = Array.isArray(state.lightFragments)
    ? [...new Set(state.lightFragments.filter((item) => validLightFragments.has(item)))]
    : [];

  if (lightLevelComplete) {
    state.lightDoorInspected = true;
    state.lightFragments = lightCollectibles.map((item) => item.name);
  } else if (storedLightDoorFlowVersion < currentLightDoorFlowVersion) {
    // Save lama dapat membawa flag pintu/kaca dari implementasi sebelum alur
    // interaksi dibuat. Reset hanya pra-misi Level 3, tanpa menghapus progres
    // level lain, supaya pemain kembali melihat jalan kosong dan wajib
    // memeriksa pintu sebelum pecahan kaca dimunculkan.
    state.lightDoorInspected = false;
    state.lightFragments = [];
    if (state.sideArea === 2) state.sideX = getSideAreaStartX(2);
  } else {
    state.lightDoorInspected = Boolean(state.lightDoorInspected);
    // Pecahan tidak mungkin sudah diambil sebelum pintu diperiksa.
    if (!state.lightDoorInspected) state.lightFragments = [];
  }
  state.lightDoorFlowVersion = currentLightDoorFlowVersion;
  // Cutscene tidak disimpan di tengah slide. Save Level 3 yang sudah selesai
  // selalu dilanjutkan pada area pintu terbuka.
  state.lightDoorPhase = lightLevelComplete ? "open" : "closed";

  const heritageLevelComplete = state.completed.includes(3);
  const validHeritageMaterials = new Set(heritageCollectibles.map((item) => item.name));
  state.heritageMaterials = Array.isArray(state.heritageMaterials)
    ? [...new Set(state.heritageMaterials.filter((item) => validHeritageMaterials.has(item)))]
    : [];

  if (heritageLevelComplete) {
    state.heritageDoorInspected = true;
    state.heritageMaterials = heritageCollectibles.map((item) => item.name);
  } else if (storedHeritageDoorFlowVersion < currentHeritageDoorFlowVersion) {
    // Terapkan ulang alur pintu Level 4 pada save lama: jalan harus kosong,
    // kemudian batu baru muncul setelah Raka memeriksa pintu kuno.
    state.heritageDoorInspected = false;
    state.heritageMaterials = [];
    if (state.sideArea === 3) state.sideX = getSideAreaStartX(3);
  } else {
    state.heritageDoorInspected = Boolean(state.heritageDoorInspected);
    if (!state.heritageDoorInspected) state.heritageMaterials = [];
  }
  state.heritageDoorFlowVersion = currentHeritageDoorFlowVersion;
  // Seperti Level 3, save Level 4 yang sudah selesai dilanjutkan dengan pintu terbuka.
  state.heritageDoorPhase = heritageLevelComplete ? "open" : "closed";
  state.ended = Boolean(state.ended);
  state.endingGood = typeof state.endingGood === "boolean"
    ? state.endingGood
    : state.ended ? state.completed.length === trials.length && state.hpUnits > 0 : null;
  state.slotId = state.slotId || `save-${Date.now()}`;
}
