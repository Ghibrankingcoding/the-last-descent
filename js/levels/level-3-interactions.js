/* Pemeriksaan pintu dan pengambilan pecahan kaca untuk Level 3. */

function hasAllLightFragments() {
  return lightCollectibles.length > 0
    && lightCollectibles.every((item) => state.lightFragments.includes(item.name));
}

function isLightTrialUnlocked() {
  return Number(state.lightDoorFlowVersion) === currentLightDoorFlowVersion
    && state.lightDoorInspected
    && hasAllLightFragments();
}

function getLightInteraction() {
  if (
    state.sideArea !== 2
    || state.completed.includes(2)
    || Number(state.lightDoorFlowVersion) !== currentLightDoorFlowVersion
    || !state.lightDoorInspected
  ) return null;
  const target = lightCollectibles.find((item) => (
    !state.lightFragments.includes(item.name)
    && Math.abs(state.sideX - item.x) < 70
  ));
  return target ? { type: "light-fragment", ...target } : null;
}

function showLightInteraction(interaction) {
  el.mapPopup.classList.remove("mission-complete");
  el.mapPopupKicker.textContent = "Pecahan Kaca";
  el.mapPopupTitle.textContent = interaction.name;
  el.mapPopupText.textContent = `Tekan E untuk mengambil ${interaction.name.toLowerCase()} dan membawanya kembali ke Pintu Cahaya.`;
  el.mapPopupStart.textContent = "TEKAN E / AMBIL";
  el.mapPopupStart.disabled = false;
  el.mapPopupStart.onclick = () => useLightInteraction(interaction);
  el.mapPopupNote.textContent = `${state.lightFragments.length}/${lightCollectibles.length} pecahan sudah terkumpul`;
  el.mapPopupNote.classList.remove("hidden");
  el.mapPopup.classList.remove("hidden");
}

function useLightInteraction(interaction = activeLightInteraction) {
  if (!interaction || interaction.type !== "light-fragment") return;
  if (!state.lightFragments.includes(interaction.name)) {
    state.lightFragments.push(interaction.name);
    playItemPickupSound();
    saveGame();
  }
  hideMapPopup();
  activeLightInteraction = null;
  updateSideArea();
  if (hasAllLightFragments()) {
    showRakaDialog("Semua pecahan kaca sudah terkumpul. Sekarang aku harus kembali ke Pintu Cahaya dan menyusun arah pantulannya.");
  }
}

function inspectLightDoor() {
  if (state.lightDoorInspected) return;
  state.lightDoorFlowVersion = currentLightDoorFlowVersion;
  state.lightDoorInspected = true;
  // Jalan memang kosong sebelum pemeriksaan ini. Pecahan baru diaktifkan
  // setelah Raka mengetahui bahwa lima dudukan pada pintu masih kosong.
  state.lightFragments = [];
  activeSideTrigger = 2;
  hideMapPopup();
  playObjectInteractionSound();
  saveGame();
  updateSideArea();
  showRakaDialog("Pintu ini tidak bisa dibuka. Lima dudukan kacanya kosong—aku harus kembali menyusuri jalan dan mencari lima pecahan kaca terlebih dahulu.");
}

function showLightDeniedPopup(fragmentCount = state.lightFragments.length) {
  playErrorSound();
  openModal(
    "Pintu Cahaya Terkunci",
    fragmentCount > 0 ? "Pecahan Kaca Belum Lengkap" : "Pintu Belum Dapat Dibuka",
    state.lightDoorInspected
      ? `Baru ${fragmentCount}/${lightCollectibles.length} pecahan kaca yang ditemukan. Cari sisanya di sepanjang tepian sungai.`
      : "Periksa Pintu Cahaya di ujung jalan terlebih dahulu untuk mengetahui cara membukanya.",
    `<div class="crafting-denied-card">
      <strong>${fragmentCount}/${lightCollectibles.length} PECAHAN TERKUMPUL</strong>
      <div class="denied-materials">
        ${lightCollectibles.map((item) => {
          const owned = state.lightFragments.includes(item.name);
          return `<span class="${owned ? "owned" : "missing"}">
            <img src="${item.asset}" alt="${item.name}" />
            <b>${item.name}</b><small>${owned ? "Sudah ada" : "Belum ada"}</small>
          </span>`;
        }).join("")}
      </div>
      <button class="primary" id="closeLightDenied">KEMBALI KE JALAN</button>
    </div>`,
    "crafting-denied-modal"
  );
  document.getElementById("closeLightDenied").addEventListener("click", closeModal);
}
