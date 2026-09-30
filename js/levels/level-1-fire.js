/* Gameplay Level 1 - Trial of Fire. */

function fireTrial() {
  if (state.completed.includes(0)) return;
  const correct = ["Kayu", "Kain", "Minyak", "Percikan"];
  const missingMaterials = correct.filter((item) => !state.houseMaterials.includes(item));
  if (missingMaterials.length) {
    showCraftingDeniedPopup(state.houseMaterials.length);
    return;
  }
  const placed = [];
  openModal(
    "Dalam Rumah Raka",
    "Meja Crafting Obor",
    "Seret bahan ke slot secara berurutan. Kayu, kain, dan minyak membentuk Obor Mati; setelah itu seret percikan untuk menyalakannya.",
    `<div class="level-hud">
      <span>Level 1</span>
      <strong>Rumah Raka</strong>
      <span>Trial of Fire</span>
    </div>
    <div class="crafting-pov two-stage-crafting">
      <div class="crafting-table-pov" aria-label="Meja crafting dilihat dari depan">
        <div class="crafting-materials" aria-label="Bahan di atas meja">
          ${correct.map((item) => `<button class="tool-item crafting-material" draggable="true" data-tool="${item}" aria-label="Seret ${item} ke slot crafting" title="Seret ${item} ke slot crafting">
            <img src="${toolAssets[item]}" alt="${item}" /><span>${item}</span>
          </button>`).join("")}
        </div>
        <div class="crafting-workflow">
          <section class="craft-stage base-torch-stage" id="baseTorchStage">
            <div class="craft-stage-heading"><span>TAHAP 1</span><strong>Rakit Obor Mati</strong></div>
            <div class="base-craft-slots" id="baseCraftSlots">
              ${correct.slice(0, 3).map((item, index) => `<div class="craft-slot" data-index="${index}" data-expected="${item}"><span>${index + 1}. ${item}</span></div>`).join("")}
            </div>
            <div class="stage-result unlit-torch-result" id="unlitTorchResult">
              <span>HASIL TAHAP 1</span>
              <img src="${toolAssets["Obor Mati"]}" alt="Obor Mati" />
              <strong>Obor Mati</strong>
            </div>
          </section>
          <section class="craft-stage ignition-stage locked" id="ignitionStage">
            <div class="craft-stage-heading"><span>TAHAP 2</span><strong>Nyalakan Obor</strong></div>
            <div class="ignition-combination">
              <div class="combined-torch-input">
                <img src="${toolAssets["Obor Mati"]}" alt="Obor Mati" /><span>Obor Mati</span>
              </div>
              <b>+</b>
              <div class="craft-slot ignition-slot" data-index="3" data-expected="Percikan"><span>4. Percikan</span></div>
              <b>&rarr;</b>
              <div class="lit-torch-result" id="litTorchResult">
                <img src="${rewardAssets.Obor}" alt="Obor Nyala" /><span>Obor Nyala</span>
              </div>
            </div>
          </section>
        </div>
      </div>
      <button class="primary craft-confirm" id="craftTorch" disabled>IKUTI URUTAN CRAFTING</button>
    </div>
    <p class="feedback">Drag ke slot dengan urutan: Kayu &rarr; Kain &rarr; Minyak &rarr; Percikan. Klik biasa tidak memasang bahan.</p>`,
    "fire-level"
  );

  const feedback = document.querySelector(".feedback");
  const craftButton = document.getElementById("craftTorch");
  const baseSlots = document.getElementById("baseCraftSlots");
  const unlitResult = document.getElementById("unlitTorchResult");
  const ignitionStage = document.getElementById("ignitionStage");
  const litResult = document.getElementById("litTorchResult");
  startMissionTimer(0, 30);

  function addTool(tool, source, requestedSlot = null) {
    const nextIndex = placed.length;
    const expected = correct[nextIndex];
    const slot = document.querySelector(`.craft-slot[data-index="${nextIndex}"]`);
    if (!slot || !expected) return;
    if (tool !== expected || (requestedSlot && requestedSlot !== slot)) {
      const wrongSlot = requestedSlot || slot;
      wrongSlot.classList.add("wrong");
      setTimeout(() => wrongSlot.classList.remove("wrong"), 420);
      const message = `Urutan salah. Bahan berikutnya harus ${expected}.`;
      feedback.textContent = `${message} Waktu berkurang 3 detik.`;
      applyMissionTimePenalty(3, message);
      return;
    }
    placed.push(tool);
    playCraftingSound(placed.length, placed.length === correct.length);
    source.disabled = true;
    source.classList.add("used");
    slot.classList.add("filled");
    slot.innerHTML = `<img src="${toolAssets[tool]}" alt="${tool}" /><span>${tool}</span>`;

    if (placed.length < 3) {
      feedback.textContent = `${placed.length}/3 bahan dasar terpasang. Berikutnya: ${correct[placed.length]}.`;
      return;
    }

    if (placed.length === 3) {
      baseSlots.classList.add("merged");
      unlitResult.classList.add("revealed");
      ignitionStage.classList.remove("locked");
      feedback.textContent = "Kayu, kain, dan minyak menyatu menjadi Obor Mati. Sekarang tambahkan Percikan.";
      return;
    }

    ignitionStage.classList.add("complete");
    unlitResult.classList.add("consumed");
    litResult.classList.add("revealed");
    craftButton.disabled = false;
    craftButton.textContent = "AMBIL OBOR NYALA";
    feedback.textContent = "Obor Mati terkena percikan dan berubah menjadi Obor Nyala.";
  }

  document.querySelectorAll(".tool-item").forEach((button) => {
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", button.dataset.tool);
    });
  });

  document.querySelectorAll(".craft-slot").forEach((slot) => {
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("ready");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("ready"));
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      slot.classList.remove("ready");
      const tool = event.dataTransfer.getData("text/plain");
      const source = document.querySelector(`.tool-item[data-tool="${tool}"]`);
      if (source && !source.disabled) addTool(tool, source, slot);
    });
  });

  craftButton.addEventListener("click", () => {
    if (placed.join("|") !== correct.join("|")) return;
    stopMissionTimer();
    craftButton.disabled = true;
    playPuzzleSuccessSound();
    if (!state.inventory.includes("Obor")) state.inventory.push("Obor");
    if (!state.completed.includes(0)) {
      state.completed.push(0);
      state.notes.push(trials[0].note);
      state.mapPieces += 1;
    }
    state.current = Math.max(state.current, 1);
    state.housePhase = "inside";
    saveGame();
    setTimeout(() => {
      showTorchRewardPopup();
    }, 620);
  });
}
