/* Gameplay Level 2 - Trial of Nature. */

function natureTrial() {
  if (state.completed.includes(1)) return;
  if (!state.natureInspected || state.natureMaterials.length < 2 || state.natureBridgeCrafted) {
    showRakaDialog(state.natureBridgeCrafted
      ? "Jembatannya sudah selesai. Aku harus membawanya ke tepi jurang dan memasangnya dengan E."
      : "Aku belum bisa merakit jembatan. Jurang harus diperiksa dan semua bahan harus dikumpulkan lebih dahulu.");
    return;
  }
  const correct = ["Pilin Serat", "Kayu Jembatan", "Ikat Rangka", "Jembatan Jadi"];
  const picked = [];
  openModal(
    "Hutan",
    "Merakit Jembatan Jurang",
    "Raka merakit jembatan di atas tanah datar menggunakan serat tumbuhan dan kayu yang telah dikumpulkan.",
    `<div class="level-hud">
      <span>Level 2</span>
      <strong>Jurang Hutan</strong>
      <span>Trial of Nature</span>
    </div>
    <div class="bridge-craft-workshop">
      <div class="bridge-collected-materials" aria-label="Bahan yang sudah dikumpulkan">
        <span><img src="${natureAssets["Serat Tumbuhan"]}" alt="Serat Tumbuhan" /><b>Serat Tumbuhan</b></span>
        <span><img src="${natureAssets["Kayu Jembatan"]}" alt="Kayu Jembatan" /><b>Kayu Jembatan</b></span>
      </div>
      <div class="bridge-crafting-ground">
        <div class="bridge-process-track" id="natureSteps" aria-label="Drop zone urutan pembuatan jembatan">
          ${correct.map((item, index) => `<div class="bridge-drop-slot" data-index="${index}" data-expected="${item}">
            <small>${index + 1}</small><span>Seret langkah ${index + 1} ke sini</span>
          </div>`).join("")}
        </div>
        <div class="bridge-choice-grid" id="bridgeChoices">
          ${["Kayu Jembatan", "Pilin Serat", "Jembatan Jadi", "Ikat Rangka"]
      .map((item) => `<button class="nature-choice" draggable="true" data-choice="${item}" aria-label="Seret ${item} ke slot urutan" title="Seret ${item} ke slot urutan">
              <img src="${natureAssets[item]}" alt="${item}" /><span>${item}</span>
            </button>`).join("")}
        </div>
        <div class="bridge-result" id="bridgeResult" aria-hidden="true">
          <img src="${natureAssets["Jembatan Jadi"]}" alt="Jembatan kayu selesai" />
          <strong>Jembatan Selesai</strong>
        </div>
      </div>
      <button class="primary bridge-return" id="bridgeReturn" disabled>SELESAIKAN URUTAN CRAFTING</button>
    </div>
    <p class="feedback">Drag bahan ke slot secara berurutan: pilin serat, susun kayu, ikat rangka, lalu selesaikan jembatan. Klik biasa tidak memasang bahan.</p>`,
    "level-screen nature-level"
  );
  const steps = document.getElementById("natureSteps");
  const feedback = document.querySelector(".feedback");
  const result = document.getElementById("bridgeResult");
  const returnButton = document.getElementById("bridgeReturn");
  function placeBridgeStep(choice, button, requestedSlot) {
    const nextIndex = picked.length;
    const expected = correct[nextIndex];
    const expectedSlot = steps.querySelector(`.bridge-drop-slot[data-index="${nextIndex}"]`);
    if (!expectedSlot || !expected) return;

    if (choice !== expected || requestedSlot !== expectedSlot) {
      const wrongSlot = requestedSlot || expectedSlot;
      const message = `Urutan belum tepat. Langkah berikutnya adalah ${expected}.`;
      wrongSlot.classList.add("wrong");
      setTimeout(() => wrongSlot.classList.remove("wrong"), 420);
      applyMissionTimePenalty(3, message);
      return;
    }

    picked.push(choice);
    playCraftingSound(picked.length, picked.length === correct.length);
    button.disabled = true;
    button.draggable = false;
    button.classList.add("used");
    expectedSlot.classList.add("filled");
    expectedSlot.innerHTML = `<small>${nextIndex + 1}</small><img src="${natureAssets[choice]}" alt="" /><b>${choice}</b>`;
    feedback.textContent = `Proses jembatan: ${picked.join(" -> ")}`;
    if (picked.length !== correct.length) return;

    stopMissionTimer();
    state.natureBridgeCrafted = true;
    if (!state.inventory.includes("Jembatan")) state.inventory.push("Jembatan");
    result.classList.add("revealed");
    result.setAttribute("aria-hidden", "false");
    returnButton.disabled = false;
    returnButton.textContent = "BAWA JEMBATAN KE JURANG";
    feedback.textContent = "Jembatan selesai. Bawa hasil crafting ini ke tepi jurang lalu tekan E untuk memasangnya.";
    playPuzzleSuccessSound();
    saveGame();
  }

  document.querySelectorAll(".nature-choice").forEach((button) => {
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", button.dataset.choice);
    });
  });

  document.querySelectorAll(".bridge-drop-slot").forEach((slot) => {
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("ready");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("ready"));
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      slot.classList.remove("ready");
      const choice = event.dataTransfer.getData("text/plain");
      const button = document.querySelector(`.nature-choice[data-choice="${choice}"]`);
      if (button && !button.disabled) placeBridgeStep(choice, button, slot);
    });
  });
  returnButton.addEventListener("click", () => {
    if (!state.natureBridgeCrafted) return;
    closeModal();
    renderMap();
  });
  startMissionTimer(1, 30);
}

function installNatureBridge() {
  if (state.sideArea !== 1 || !state.natureBridgeCrafted || state.natureBridgeInstalled) return;
  hideMapPopup();
  playObjectInteractionSound();
  showSceneLoading("Sedang memasang jembatan di atas jurang...", () => {
    state.natureBridgeInstalled = true;
    renderMap();
    completeTrial("Jembatan kayu berhasil dipasang dan jalur menuju air terjun kini terbuka.");
  });
}
