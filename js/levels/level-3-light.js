/* Gameplay Level 3 - Trial of Light. */

function completeLightTrial() {
  stopMissionTimer();
  const trialIndex = 2;
  const trial = trials[trialIndex];
  playPuzzleSuccessSound();
  if (!state.completed.includes(trialIndex)) {
    state.completed.push(trialIndex);
    if (!state.inventory.includes(trial.reward)) state.inventory.push(trial.reward);
    state.notes.push(trial.note);
    if (trial.mapPiece) state.mapPieces += 1;
  }
  state.current = Math.max(state.current, trialIndex + 1);
  state.lightDoorPhase = "aligned";
  pendingWitchDialog = "";
  saveGame();
  render();
  renderMap();
  showScienceRewardPopup(
    trialIndex,
    trials[trialIndex + 1],
    "Kelima pecahan kaca berhasil mengarahkan pantulan cahaya menuju pintu batu."
  );
}

function lightTrial() {
  if (state.completed.includes(2)) return;
  if (!isLightTrialUnlocked()) {
    showLightDeniedPopup();
    return;
  }
  const angles = [45, -45, 45, -45, 45];
  const current = Array(lightAssets.length).fill(0);
  openModal(
    "Sungai dan Air Terjun",
    "Trial of Light",
    "Putar lima pecahan kaca sampai cahaya memantul berurutan menuju pintu batu.",
    `<div class="level-hud">
      <span>Level 3</span>
      <strong>Sungai dan Air Terjun</strong>
      <span>Trial of Light</span>
    </div>
    <div class="click-level light-craft">
      <div class="level-instruction">
        <h3>Susun Pantulan Lima Pecahan Kaca</h3>
        <p>Petunjuk pintu batu menunjukkan pola pantulan: kanan, kiri, kanan, kiri, kanan. Klik setiap pecahan sampai arahnya sesuai.</p>
        <div class="crystal-hint">
          ${angles.map((angle) => `<span>${angle === 45 ? "/" : "\\"}</span>`).join("")}
        </div>
      </div>
      <div class="light-panel">
        <div class="crystal-grid">
        ${current
      .map(
        (_, i) => `<button class="crystal" style="--angle: 0deg" data-i="${i}" aria-label="Pecahan kaca ${i + 1}">
              <img src="${lightAssets[i]}" alt="Pecahan kaca ${i + 1}" />
              <span>Pecahan ${i + 1}: -</span>
            </button>`
      )
      .join("")}
        </div>
        <button class="primary check-light" id="checkLight">LANJUT</button>
      </div>
    </div><p class="feedback">Target lima pecahan: / &nbsp; \\ &nbsp; / &nbsp; \\ &nbsp; /. Jawaban salah mengurangi waktu 4 detik; HP hanya berkurang 2 bar jika waktu habis.</p>`,
    "level-screen light-level"
  );
  const feedback = document.querySelector(".feedback");

  function labelFor(angle) {
    if (angle === 45) return "/";
    if (angle === -45) return "\\";
    return "-";
  }

  function updateLightFeedback() {
    feedback.textContent = `Posisi sekarang: ${current.map(labelFor).join("  ")}. Target: /  \\  /  \\  /.`;
  }

  document.querySelectorAll(".crystal").forEach((button) => {
    button.addEventListener("click", () => {
      const i = Number(button.dataset.i);
      current[i] = current[i] === 45 ? -45 : current[i] === -45 ? 0 : 45;
      button.style.setProperty("--angle", `${current[i]}deg`);
      playPuzzleStepSound(i + 1);
      button.querySelector("span").textContent = `Pecahan ${i + 1}: ${labelFor(current[i])}`;
      updateLightFeedback();
    });
  });
  document.getElementById("checkLight").addEventListener("click", () => {
    if (current.every((angle, j) => angle === angles[j])) {
      completeLightTrial();
      return;
    }
    const message = "Pantulan belum tepat. Susun lima pecahan menjadi: /  \\  /  \\  / lalu tekan LANJUT.";
    applyMissionTimePenalty(4, message);
  });
  startMissionTimer(2, 30);
}
