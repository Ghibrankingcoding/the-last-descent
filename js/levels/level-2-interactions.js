/* Interaksi area Hutan untuk Level 2. */

function getForestInteraction() {
  if (state.sideArea !== 1 || state.completed.includes(1)) return null;
  if (!state.natureInspected && Math.abs(state.sideX - natureWorld.inspectX) < 74) {
    return { type: "inspect-chasm" };
  }
  if (!state.natureInspected) return null;

  const materials = [
    { name: "Serat Tumbuhan", x: natureWorld.fiberX },
    { name: "Kayu Jembatan", x: natureWorld.woodX }
  ];
  const target = materials.find((item) => !state.natureMaterials.includes(item.name) && Math.abs(state.sideX - item.x) < 76);
  if (target) return { type: "nature-material", ...target };

  if (!state.natureBridgeCrafted && state.natureMaterials.length === materials.length && Math.abs(state.sideX - natureWorld.craftX) < 92) {
    return { type: "nature-craft" };
  }
  if (state.natureBridgeCrafted && !state.natureBridgeInstalled && Math.abs(state.sideX - natureWorld.inspectX) < 78) {
    return { type: "install-bridge" };
  }
  return null;
}

function showForestInteraction(interaction) {
  const materialName = typeof interaction.name === "string" ? interaction.name : "Bahan Jembatan";
  const content = {
    "inspect-chasm": {
      kicker: "Level 2 - Jurang Hutan",
      title: "Periksa Jurang",
      text: "Jalan terputus dan Raka belum dapat menyeberang. Tekan E untuk memeriksa lebar jurang.",
      button: "TEKAN E / PERIKSA"
    },
    "nature-material": {
      kicker: "Bahan Jembatan",
      title: materialName,
      text: `Tekan E untuk mengambil ${materialName.toLowerCase()} dari sekitar hutan.`,
      button: "TEKAN E / AMBIL"
    },
    "nature-craft": {
      kicker: "Tempat Crafting",
      title: "Tanah Datar",
      text: "Serat dan kayu sudah lengkap. Rakit jembatan di atas tanah ini.",
      button: "TEKAN E / CRAFT"
    },
    "install-bridge": {
      kicker: "Level 2 - Jurang Hutan",
      title: "Pasang Jembatan",
      text: "Jembatan sudah siap. Tekan E untuk meletakkannya di atas jurang.",
      button: "TEKAN E / PASANG"
    }
  }[interaction.type];
  if (!content) return;
  el.mapPopup.classList.remove("mission-complete");
  el.mapPopupKicker.textContent = content.kicker;
  el.mapPopupTitle.textContent = content.title;
  el.mapPopupText.textContent = content.text;
  el.mapPopupStart.textContent = content.button;
  el.mapPopupStart.disabled = false;
  el.mapPopupStart.onclick = () => useForestInteraction(interaction);
  el.mapPopupNote.textContent = "";
  el.mapPopupNote.classList.add("hidden");
  el.mapPopup.classList.remove("hidden");
}

function useForestInteraction(interaction = activeForestInteraction) {
  if (!interaction) return;
  hideMapPopup();
  activeForestInteraction = null;

  if (interaction.type === "inspect-chasm") {
    state.natureInspected = true;
    playObjectInteractionSound();
    saveGame();
    updateSideArea();
    showRakaDialog("Jurang ini terlalu lebar untuk dilompati. Aku harus kembali mencari serat tumbuhan dan kayu, lalu merakit jembatan di tanah datar dekat sini.");
    return;
  }

  if (interaction.type === "nature-material") {
    if (!state.natureMaterials.includes(interaction.name)) {
      state.natureMaterials.push(interaction.name);
      playItemPickupSound();
      saveGame();
    }
    updateSideArea();
    if (state.natureMaterials.length === 2) {
      // Langsung perbarui zona interaksi. Dialog di titik ini sebelumnya dapat
      // menelan input arah dan menutupi petunjuk E untuk crafting.
      updateSideTrigger();
    }
    return;
  }

  if (interaction.type === "nature-craft") {
    playObjectInteractionSound();
    natureTrial();
    return;
  }

  if (interaction.type === "install-bridge") {
    installNatureBridge();
  }
}
