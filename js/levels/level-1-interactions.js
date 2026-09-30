/* Interaksi area Rumah untuk Level 1. */

function getHouseInteraction() {
  if (state.sideArea !== 0 || state.housePhase !== "inside") return null;
  const materials = [
    { name: "Kayu", x: 360 },
    { name: "Kain", x: 660 },
    { name: "Minyak", x: 960 },
    { name: "Percikan", x: 1260 }
  ];
  const target = materials.find((item) => !state.houseMaterials.includes(item.name) && Math.abs(state.sideX - item.x) < 76);
  if (target) return { type: "material", ...target };
  if (Math.abs(state.sideX - 1550) < 100) {
    return { type: "table", ready: state.houseMaterials.length === materials.length };
  }
  return null;
}

function showHouseInteraction(interaction) {
  if (state.completed.includes(0)) {
    const area = getTrialArea(0);
    el.mapPopupKicker.textContent = "Level 1 - Trial of Fire";
    el.mapPopupTitle.textContent = area.object;
    el.mapPopupText.textContent = `${area.popup}. Raka sudah menyelesaikan misi ini.`;
    el.mapPopupStart.textContent = "MISI SELESAI";
    el.mapPopupStart.disabled = true;
    el.mapPopupStart.onclick = null;
    el.mapPopupNote.textContent = "Misi ini sudah selesai dan tidak dapat diulang.";
    el.mapPopupNote.classList.remove("hidden");
    el.mapPopup.classList.add("mission-complete");
    el.mapPopup.classList.remove("hidden");
    return;
  }

  const isTable = interaction.type === "table";
  el.mapPopup.classList.remove("mission-complete");
  el.mapPopupKicker.textContent = isTable ? "Meja Crafting" : "Bahan Obor";
  el.mapPopupTitle.textContent = isTable ? "Susun bahan di meja" : interaction.name;
  el.mapPopupText.textContent = isTable
    ? interaction.ready
      ? "Semua bahan sudah terkumpul. Tekan E untuk membuka meja crafting."
      : `Meja bisa diperiksa sekarang, tetapi Obor belum dapat dibuat. Bahan terkumpul ${state.houseMaterials.length}/4.`
    : `Tekan E untuk mengambil ${interaction.name.toLowerCase()}.`;
  el.mapPopupStart.textContent = isTable ? interaction.ready ? "TEKAN E / CRAFT" : "TEKAN E / PERIKSA" : "TEKAN E / AMBIL";
  el.mapPopupStart.disabled = false;
  el.mapPopupStart.onclick = () => useHouseInteraction(interaction);
  el.mapPopupNote.textContent = "";
  el.mapPopupNote.classList.add("hidden");
  el.mapPopup.classList.remove("hidden");
}

function showCraftingDeniedPopup(materialCount = state.houseMaterials.length) {
  const hasMaterials = materialCount > 0;
  const title = hasMaterials ? "Barang Anda Kurang" : "Barang Anda Tidak Ada";
  const message = hasMaterials
    ? `Bahan Obor baru terkumpul ${materialCount}/4. Lengkapi Kayu, Kain, Minyak, dan Percikan sebelum crafting.`
    : "Inventori bahan Obor masih kosong. Cari Kayu, Kain, Minyak, dan Percikan di dalam rumah terlebih dahulu.";
  const materials = ["Kayu", "Kain", "Minyak", "Percikan"];

  playErrorSound();
  openModal(
    "Crafting Ditolak",
    title,
    message,
    `<div class="crafting-denied-card">
      <strong>${materialCount}/4 BAHAN TERKUMPUL</strong>
      <div class="denied-materials">
        ${materials.map((item) => {
          const owned = state.houseMaterials.includes(item);
          return `<span class="${owned ? "owned" : "missing"}">
            <img src="${toolAssets[item]}" alt="${item}" />
            <b>${item}</b><small>${owned ? "Sudah ada" : "Belum ada"}</small>
          </span>`;
        }).join("")}
      </div>
      <button class="primary" id="closeCraftingDenied">KEMBALI CARI BAHAN</button>
    </div>`,
    "crafting-denied-modal"
  );
  document.getElementById("closeCraftingDenied").addEventListener("click", closeModal);
}

function useHouseInteraction(interaction = activeHouseInteraction) {
  if (!interaction) return;
  if (interaction.type === "material") {
    if (!state.houseMaterials.includes(interaction.name)) {
      state.houseMaterials.push(interaction.name);
      playItemPickupSound();
      saveGame();
    }
    hideMapPopup();
    activeHouseInteraction = null;
    updateSideArea();
    return;
  }
  hideMapPopup();
  if (state.completed.includes(0)) {
    showWitchDialog("Trial of Fire sudah selesai dan tidak dapat diulang. Lanjutkan perjalanan ke kanan.");
    return;
  }
  if (!interaction.ready) {
    showCraftingDeniedPopup();
    return;
  }
  playObjectInteractionSound();
  fireTrial();
}
