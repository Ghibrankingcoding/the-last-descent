/* Interaksi batu simbol untuk Level 4. */

function hasAllHeritageMaterials() {
  return heritageCollectibles.length > 0
    && heritageCollectibles.every((item) => state.heritageMaterials.includes(item.name));
}

function isHeritageTrialUnlocked() {
  return Number(state.heritageDoorFlowVersion) === currentHeritageDoorFlowVersion
    && state.heritageDoorInspected
    && hasAllHeritageMaterials();
}

function getHeritageInteraction() {
  if (
    state.sideArea !== 3
    || state.completed.includes(3)
    || Number(state.heritageDoorFlowVersion) !== currentHeritageDoorFlowVersion
    || !state.heritageDoorInspected
  ) return null;
  const target = heritageCollectibles.find((item) => (
    !state.heritageMaterials.includes(item.name)
    && Math.abs(state.sideX - item.x) < 66
  ));
  return target ? { type: "heritage-material", ...target } : null;
}

function inspectHeritageDoor() {
  if (state.heritageDoorInspected) return;
  state.heritageDoorFlowVersion = currentHeritageDoorFlowVersion;
  state.heritageDoorInspected = true;
  // Batu belum berada di jalan sebelum pintu diperiksa. Pemeriksaan pertama
  // inilah yang mengaktifkan delapan batu simbol di sepanjang lembah.
  state.heritageMaterials = [];
  activeSideTrigger = 3;
  hideMapPopup();
  playObjectInteractionSound();
  saveGame();
  updateSideArea();
  showRakaDialog("Pintu kuno ini tidak bisa dibuka. Delapan relung simbolnya kosong—aku harus kembali menyusuri lembah dan mencari semua batu simbol terlebih dahulu.");
}

function showHeritageInteraction(interaction) {
  el.mapPopup.classList.remove("mission-complete");
  el.mapPopupKicker.textContent = "Batu Simbol Leluhur";
  el.mapPopupTitle.textContent = `Batu ${interaction.name}`;
  el.mapPopupText.textContent = `Tekan E untuk mengambil Batu ${interaction.name} dan menyimpannya untuk pintu kuno.`;
  el.mapPopupStart.textContent = "TEKAN E / AMBIL";
  el.mapPopupStart.disabled = false;
  el.mapPopupStart.onclick = () => useHeritageInteraction(interaction);
  el.mapPopupNote.textContent = `${state.heritageMaterials.length}/${heritageCollectibles.length} batu sudah terkumpul`;
  el.mapPopupNote.classList.remove("hidden");
  el.mapPopup.classList.remove("hidden");
}

function useHeritageInteraction(interaction = activeHeritageInteraction) {
  if (!interaction || interaction.type !== "heritage-material") return;
  if (!state.heritageMaterials.includes(interaction.name)) {
    state.heritageMaterials.push(interaction.name);
    playItemPickupSound();
    saveGame();
  }
  hideMapPopup();
  activeHeritageInteraction = null;
  updateSideArea();
  if (hasAllHeritageMaterials()) {
    showRakaDialog("Semua batu simbol sudah terkumpul. Sekarang aku harus kembali ke pintu kuno untuk menyusun kedelapan simbolnya.");
  }
}

function showHeritageDeniedPopup(materialCount = state.heritageMaterials.length) {
  const doorInspected = state.heritageDoorInspected;
  const hasMaterials = materialCount > 0;
  const title = !doorInspected
    ? "Periksa Pintunya Terlebih Dahulu"
    : hasMaterials ? "Batu Simbol Belum Lengkap" : "Batu Simbol Belum Ditemukan";
  const names = heritageCollectibles.map((item) => item.name).join(", ");
  const message = !doorInspected
    ? "Pergi ke pintu kuno di ujung kanan dan periksa pintunya. Batu simbol baru akan terlihat setelah Raka mengetahui bahwa relung pintunya kosong."
    : hasMaterials
      ? `Batu simbol baru terkumpul ${materialCount}/${heritageCollectibles.length}. Lengkapi Batu ${names} sebelum menyusun pintu.`
      : `Pintu sudah diperiksa. Cari Batu ${names} yang kini terlihat di sepanjang lembah.`;

  playErrorSound();
  openModal(
    "Pintu Batu Kuno Terkunci",
    title,
    message,
    `<div class="crafting-denied-card heritage-denied-card">
      <strong>${materialCount}/${heritageCollectibles.length} BATU TERKUMPUL</strong>
      <div class="denied-materials">
        ${heritageCollectibles.map((item) => {
          const owned = state.heritageMaterials.includes(item.name);
          return `<span class="${owned ? "owned" : "missing"}">
            <img src="${heritageAssets[item.name]}" alt="Batu ${item.name}" />
            <b>${item.name}</b><small>${owned ? "Sudah ada" : "Belum ada"}</small>
          </span>`;
        }).join("")}
      </div>
      <button class="primary" id="closeHeritageDenied">KEMBALI CARI BATU</button>
    </div>`,
    "crafting-denied-modal heritage-denied-modal"
  );
  document.getElementById("closeHeritageDenied").addEventListener("click", () => {
    closeModal();
    activeSideTrigger = null;
    updateSideTrigger();
  });
}
