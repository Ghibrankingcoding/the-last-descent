/* Save slot, load game, dan daftar riwayat save. */

function isFinishedSaveSlot(slot) {
  return Boolean(slot)
    && (slot.ended === true || typeof slot.endingGood === "boolean");
}

function removeFinishedGameSave(slotId = state.slotId) {
  const remainingSlots = getSaveSlots().filter((slot) => (
    slot.slotId !== slotId && !isFinishedSaveSlot(slot)
  ));
  localStorage.setItem(saveSlotsKey, JSON.stringify(remainingSlots.slice(0, 30)));
  localStorage.removeItem(saveKey);
  syncContinueButton();
}

function saveGame() {
  if (state.ended || typeof state.endingGood === "boolean") {
    removeFinishedGameSave();
    return;
  }
  syncLegacyLives();
  state.hpSystemVersion = 2;
  state.sideWorldVersion = 3;
  state.lightDoorFlowVersion = currentLightDoorFlowVersion;
  state.heritageDoorFlowVersion = currentHeritageDoorFlowVersion;
  state.updatedAt = new Date().toISOString();
  state.slotId = state.slotId || `save-${Date.now()}`;
  const snapshot = cloneState();
  localStorage.setItem(saveKey, JSON.stringify(snapshot));
  const slots = getSaveSlots().filter((slot) => slot.slotId !== snapshot.slotId);
  slots.unshift(snapshot);
  localStorage.setItem(saveSlotsKey, JSON.stringify(slots.slice(0, 30)));
  syncContinueButton();
}

function isValidSaveSlot(slot) {
  return Boolean(slot)
    && typeof slot === "object"
    && !isFinishedSaveSlot(slot)
    && Number.isFinite(Number(slot.current))
    && Number(slot.current) >= 0
    && Number(slot.current) < trials.length
    && Array.isArray(slot.completed);
}

function syncContinueButton() {
  const hasSave = getSaveSlots().some(isValidSaveSlot);
  el.menuLoad.disabled = !hasSave;
  el.menuLoad.setAttribute("aria-disabled", String(!hasSave));
  el.menuLoad.title = hasSave ? "Pilih save untuk dilanjutkan" : "Belum ada save game";
  el.menuLoad.classList.toggle("unavailable", !hasSave);
}

function getSaveSlots() {
  let slots = [];
  try {
    slots = JSON.parse(localStorage.getItem(saveSlotsKey) || "[]");
  } catch (error) {
    slots = [];
  }

  const legacy = localStorage.getItem(saveKey);
  if (legacy) {
    try {
      const legacyState = JSON.parse(legacy);
      if (isFinishedSaveSlot(legacyState)) {
        localStorage.removeItem(saveKey);
      } else if (!slots.length) {
        legacyState.slotId = legacyState.slotId || `save-${Date.now()}`;
        legacyState.updatedAt = legacyState.updatedAt || new Date().toISOString();
        slots = [legacyState];
        localStorage.setItem(saveSlotsKey, JSON.stringify(slots));
      }
    } catch (error) {
      localStorage.removeItem(saveKey);
    }
  }

  if (!Array.isArray(slots)) return [];
  const normalized = slots
    .filter((slot) => !isFinishedSaveSlot(slot))
    .map((slot, index) => ({
      ...slot,
      slotId: slot.slotId || `save-${slot.updatedAt || Date.now()}-${index}`,
      updatedAt: slot.updatedAt || new Date().toISOString()
    }));
  localStorage.setItem(saveSlotsKey, JSON.stringify(normalized));
  return normalized;
}

function formatSaveTime(value) {
  if (!value) return "Belum ada waktu save";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function renderSaveList(slots = getSaveSlots()) {
  const validSlots = slots.filter(isValidSaveSlot);
  const visibleSlots = validSlots.slice(0, visibleSaveCount);
  const hasExtraSaves = validSlots.length > 5;
  const isExpanded = visibleSaveCount > 5;
  el.saveList.innerHTML = visibleSlots.length
    ? visibleSlots
      .map((slot) => {
        const trial = trials[slot.current] || trials[0];
        const completeCount = Array.isArray(slot.completed) ? slot.completed.length : 0;
        const savedHpUnits = Number.isFinite(Number(slot.hpUnits))
          ? Number(slot.hpSystemVersion) >= 2
            ? clampHpUnits(slot.hpUnits)
            : clampHpUnits(Math.ceil(Number(slot.hpUnits) / 2))
          : clampHpUnits((Number(slot.lives) || maxChances) * hpUnitsPerChance);
        const savedHealth = getHealthState(savedHpUnits);
        return `<button class="save-card" data-slot="${slot.slotId}">
            <strong>${trial.place} - Level ${Number(slot.current || 0) + 1}</strong>
            <span>${completeCount}/5 misi selesai | Peta ${slot.mapPieces || 0}/5 | HP ${savedHealth.activeHp}/${hpUnitsPerChance} &times;${savedHealth.chances} | ${formatSaveTime(slot.updatedAt)}</span>
          </button>`;
      })
      .join("")
    : `<p class="empty-save">Belum ada history save. Tekan START GAME dulu untuk mulai perjalanan baru.</p>`;

  el.showMoreSaves.hidden = !hasExtraSaves;
  if (hasExtraSaves) {
    const extraCount = validSlots.length - 5;
    el.showMoreSaves.classList.toggle("expanded", isExpanded);
    el.showMoreSaves.setAttribute("aria-expanded", String(isExpanded));
    el.showMoreSaves.innerHTML = `<span>${isExpanded ? "TUTUP SAVE TAMBAHAN" : `TAMPILKAN LEBIH BANYAK (${extraCount})`}</span><i class="save-toggle-arrow" aria-hidden="true"></i>`;
  }

  document.querySelectorAll(".save-card").forEach((button) => {
    button.addEventListener("click", () => loadGame(button.dataset.slot));
  });
}

function showLoadPanel() {
  visibleSaveCount = 5;
  renderSaveList();
  el.loadOverlay.classList.remove("hidden");
}

function closeLoadPanel() {
  el.loadOverlay.classList.add("hidden");
}

function loadGame(slotId) {
  const saved = getSaveSlots().find((slot) => slot.slotId === slotId);
  if (!saved) {
    closeLoadPanel();
    openModal("Load Game", "Save Tidak Ditemukan", "History save itu tidak bisa dibaca. Pilih save lain atau mulai game baru.");
    return;
  }

  try {
    normalizeLoadedState(saved);
    // Tulis kembali hasil normalisasi supaya save lama yang inkonsisten
    // langsung diperbaiki permanen setelah berhasil dimuat.
    saveGame();
    hideMenu();
    hidePrologue();
    closeLoadPanel();
    closeModal();
    render();
    if (state.ended) {
      showEnding(state.endingGood !== false);
      return;
    }
    showMap(true);
  } catch (error) {
    closeLoadPanel();
    openModal("Load Game", "Save Rusak", "Data save tidak bisa dibaca. Mulai permainan baru dari menu utama.");
  }
}
