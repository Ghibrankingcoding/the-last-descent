/* Modal gameplay, loading antar-scene, dan timer Trial. */

function isLevelVariant(variant) {
  return variant.includes("fire-level") || variant.includes("level-screen");
}

function openModal(kicker, title, text, content = "", variant = "") {
  stopMapMovement(true);
  stopMissionTimer();
  if (activeDodgeCleanup && !variant.includes("sound-level")) stopDodgeTrial();
  el.modalKicker.textContent = kicker;
  el.modalTitle.textContent = title;
  el.modalText.textContent = text;
  el.trialMount.innerHTML = `${isLevelVariant(variant) ? levelControlMarkup() : ""}${content}`;
  el.modalBox.className = `modal-box ${variant}`.trim();
  el.modal.classList.toggle("modal-fullscreen", ["fire-level", "level-screen", "level-transition", "ending-cinematic"].some((name) => variant.includes(name)));
  el.modal.classList.remove("hidden");
  attachLevelControls();
  renderAllHealthBars();
  if (isLevelVariant(variant)) setAmbientForLevel();
}

function closeModal() {
  const closedLevel = isLevelVariant(el.modalBox.className);
  stopMissionTimer();
  stopDodgeTrial();
  stopLevel5FamilyWalk();
  el.modal.classList.add("hidden");
  el.modal.classList.remove("modal-fullscreen");
  el.modalBox.className = "modal-box";
  // Modal sudah selesai; mulai sesi input baru agar tombol yang tertinggal
  // dari sebelum crafting tidak mengunci kontrol setelah kembali ke map.
  resetMapMovement();
  if (closedLevel && !el.worldMap.classList.contains("hidden")) setAmbientForMap();
}

function showSceneLoading(message, onComplete) {
  stopMapMovement(true);
  closeWitchDialog();
  if (sceneLoadingTimer) clearTimeout(sceneLoadingTimer);
  openModal(
    "Perjalanan Raka",
    "Memuat Area",
    message,
    `<div class="scene-loading-card" role="status" aria-live="polite">
      <img src="Assets TLD/background/logo_thelastdescent.png" alt="The Last Descent" />
      <span>Perjalanan Raka</span>
      <strong>${message}</strong>
      <div class="scene-loading-bar" aria-label="Memuat selama tiga detik"><i></i></div>
      <p>Menyiapkan latar dan jalur berikutnya...</p>
    </div>`,
    "level-transition scene-loading"
  );
  sceneLoadingTimer = setTimeout(() => {
    sceneLoadingTimer = null;
    closeModal();
    if (typeof onComplete === "function") onComplete();
  }, 3000);
}

function stopDodgeTrial() {
  if (!activeDodgeCleanup) return;
  activeDodgeCleanup();
  activeDodgeCleanup = null;
}

function isLockedModal() {
  return ["fire-level", "level-screen", "level-transition", "ending-cinematic"].some((name) => el.modalBox.classList.contains(name));
}

function levelControlMarkup() {
  return `<div class="level-controls">
    <div class="health-status level-health" id="levelHealth" aria-label="HP Raka"></div>
    <div class="mission-timer" id="missionTimer" hidden>
      <span>WAKTU</span><strong id="missionTimerValue">30</strong><small id="missionTimerUnit">detik</small>
    </div>
    <button class="level-control-button icon-button" id="levelSettings" aria-label="Settings" title="Settings">&#9881;</button>
  </div>`;
}

function attachLevelControls() {
  const settingsButton = document.getElementById("levelSettings");
  if (settingsButton) settingsButton.addEventListener("click", openSettingsPanel);
}

function clearMissionTimePenalty() {
  if (missionPenaltyFlashTimeout) clearTimeout(missionPenaltyFlashTimeout);
  if (missionPenaltyAlertTimeout) clearTimeout(missionPenaltyAlertTimeout);
  missionPenaltyFlashTimeout = null;
  missionPenaltyAlertTimeout = null;
  el.modal.classList.remove("time-penalty-flash");
  document.getElementById("missionTimePenalty")?.remove();
}

function stopMissionTimer() {
  if (activeMissionTimer) {
    clearInterval(activeMissionTimer.intervalId);
    if (activeMissionTimer.penaltyTimeoutId) clearTimeout(activeMissionTimer.penaltyTimeoutId);
    activeMissionTimer = null;
  }
  clearMissionTimePenalty();
}

function showMissionTimerLocked(message = "Bahan belum lengkap") {
  const timer = document.getElementById("missionTimer");
  const value = document.getElementById("missionTimerValue");
  const unit = document.getElementById("missionTimerUnit");
  if (!timer || !value || !unit) return;
  timer.hidden = false;
  timer.classList.add("locked");
  value.textContent = "--";
  unit.textContent = message;
}

function startMissionTimer(trialIndex, durationSeconds = 30) {
  stopMissionTimer();
  const timer = document.getElementById("missionTimer");
  const value = document.getElementById("missionTimerValue");
  const unit = document.getElementById("missionTimerUnit");
  if (!timer || !value || !unit) return;

  const missionTimer = {
    trialIndex,
    remainingMs: durationSeconds * 1000,
    previousTime: performance.now(),
    intervalId: null,
    penaltyTimeoutId: null,
    expiring: false,
    lastTickSecond: durationSeconds
  };
  timer.hidden = false;
  timer.classList.remove("locked", "urgent");
  value.textContent = String(durationSeconds);
  unit.textContent = "detik";

  const updateTimer = () => {
    if (activeMissionTimer !== missionTimer || missionTimer.expiring) return;
    const now = performance.now();
    const paused = document.hidden
      || !el.settingsOverlay.classList.contains("hidden")
      || !el.pauseOverlay.classList.contains("hidden")
      || !el.confirmOverlay.classList.contains("hidden");
    if (paused) {
      missionTimer.previousTime = now;
      return;
    }

    missionTimer.remainingMs = Math.max(0, missionTimer.remainingMs - (now - missionTimer.previousTime));
    missionTimer.previousTime = now;
    const seconds = Math.ceil(missionTimer.remainingMs / 1000);
    value.textContent = String(seconds);
    timer.classList.toggle("urgent", seconds <= 10);
    if (seconds > 0 && seconds !== missionTimer.lastTickSecond) {
      missionTimer.lastTickSecond = seconds;
      playCountdownTick(seconds);
    }

    if (missionTimer.remainingMs <= 0) handleMissionTimeout(trialIndex);
  };

  activeMissionTimer = missionTimer;
  missionTimer.intervalId = setInterval(updateTimer, 100);
}

function showMissionTimePenalty(seconds, message) {
  clearMissionTimePenalty();
  void el.modal.offsetWidth;
  el.modal.classList.add("time-penalty-flash");

  const alert = document.createElement("div");
  alert.id = "missionTimePenalty";
  alert.className = "mission-time-penalty";
  alert.innerHTML = `<strong>-${seconds} DETIK</strong><span>${message}</span>`;
  el.modal.appendChild(alert);

  missionPenaltyFlashTimeout = setTimeout(() => {
    el.modal.classList.remove("time-penalty-flash");
    missionPenaltyFlashTimeout = null;
  }, 760);
  missionPenaltyAlertTimeout = setTimeout(() => {
    alert.remove();
    missionPenaltyAlertTimeout = null;
  }, 900);
}

function applyMissionTimePenalty(seconds = 3, message = "Urutan crafting salah") {
  const missionTimer = activeMissionTimer;
  if (!missionTimer || missionTimer.expiring) return;

  const value = document.getElementById("missionTimerValue");
  const timer = document.getElementById("missionTimer");
  missionTimer.remainingMs = Math.max(0, missionTimer.remainingMs - seconds * 1000);
  missionTimer.previousTime = performance.now();
  const remainingSeconds = Math.ceil(missionTimer.remainingMs / 1000);
  if (value) value.textContent = String(remainingSeconds);
  if (timer) timer.classList.toggle("urgent", remainingSeconds <= 10);
  playPuzzleFailureSound();
  showMissionTimePenalty(seconds, message);
  const feedback = document.querySelector(".feedback");
  if (feedback) feedback.textContent = `${message} Waktu -${seconds} detik. HP tidak berkurang.`;

  if (missionTimer.remainingMs <= 0) {
    missionTimer.expiring = true;
    missionTimer.penaltyTimeoutId = setTimeout(() => {
      if (activeMissionTimer === missionTimer) handleMissionTimeout(missionTimer.trialIndex);
    }, 650);
  }
}

function handleMissionTimeout(trialIndex) {
  if (state.completed.includes(trialIndex)) {
    stopMissionTimer();
    return;
  }
  stopMissionTimer();
  fail(`Waktu Trial ${trialIndex + 1} habis.`, trialIndex);
  if (state.lives <= 0) return;
  closeModal();
  render();
  showMap(false);
  if (el.hubMapInstruction) {
    el.hubMapInstruction.textContent = "Waktu habis. Klik bulatan lokasi yang menyala untuk mencoba Trial ini lagi.";
  }
}
