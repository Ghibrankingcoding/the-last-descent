/* Pergerakan, collision, trigger, dan render peta. */

function updateSideAdvance() {
  const area = getSideArea();
  const worldWidth = getSideWorldWidth();
  if (state.sideArea === 0 && state.inventory.includes("Obor") && state.sideX >= worldWidth - 95) {
    if (state.housePhase === "inside") {
      transitionHouseScene("route", true);
      return;
    }
    if (state.housePhase === "route") {
      if (postTrialExitArea === 0) {
        finishPostTrialExitToHub(0);
        return;
      }
      showSceneLoading("Sedang melanjutkan perjalanan menuju Hutan Gelap...", () => {
        state.housePhase = "forest";
        state.sideArea = 1;
        state.sideX = getSideAreaStartX(1);
        state.sideY = getSideGroundY() - sideWorld.playerHeight;
        state.sideVX = 0;
        state.sideVY = 0;
        saveGame();
        prepareRakaSpawn();
        renderMap();
        showRakaDialog("Peta membawaku ke hutan ini. Aku harus mengikuti jalurnya dan berhati-hati pada jalan yang rusak setelah badai.");
      });
      return;
    }
  }
  const canAdvance = state.completed.includes(state.sideArea);
  if (!canAdvance) return;
  if ([2, 3].includes(state.sideArea) && !isSideDoorOpen()) return;
  const advanceX = [2, 3].includes(state.sideArea)
    ? sideAreas[state.sideArea].triggerX + 55
    : worldWidth - 95;
  if (state.sideX < advanceX) return;
  if (postTrialExitArea === state.sideArea) {
    finishPostTrialExitToHub(state.sideArea);
    return;
  }
  if (state.sideArea >= sideAreas.length - 1) return;
  const nextArea = sideAreas[state.sideArea + 1];
  showSceneLoading(`Sedang melanjutkan perjalanan menuju ${nextArea.name}...`, () => {
    state.sideArea += 1;
    state.sideX = getSideAreaStartX(state.sideArea);
    state.sideY = getSideGroundY() - sideWorld.playerHeight;
    state.sideVX = 0;
    state.sideVY = 0;
    activeSideTrigger = null;
    activeForestInteraction = null;
    activeLightInteraction = null;
    activeHeritageInteraction = null;
    hideMapPopup();
    playSuccessSound();
    saveGame();
    prepareRakaSpawn();
    renderMap();
    showWitchDialog(getSideArea().dialog);
  });
}

function finishPostTrialExitToHub(areaIndex) {
  if (postTrialExitArea !== areaIndex) return;
  postTrialExitArea = null;
  stopMapMovement(true);
  showSceneLoading("Membuka peta perjalanan menuju lokasi berikutnya...", () => {
    if (areaIndex === 0) state.housePhase = "forest";
    saveGame();
    showMap(false);
    if (el.hubMapInstruction) {
      const nextTrial = trials[state.current];
      el.hubMapInstruction.textContent = areaIndex === sideAreas.length - 1
        ? "Peta keluarga sudah lengkap. Lanjutkan ke akhir perjalanan untuk menemukan Ayah dan Ibu."
        : nextTrial
          ? `Perjalanan terbuka. Klik bulatan ${nextTrial.place} untuk memasuki Level ${state.current + 1}.`
          : "Perjalanan berikutnya telah terbuka.";
    }
  });
}

function transitionHouseScene(nextPhase, withFade) {
  const commit = () => {
    state.housePhase = nextPhase;
    state.sideX = 120;
    state.sideY = getSideGroundY() - sideWorld.playerHeight;
    state.sideVX = 0;
    state.sideVY = 0;
    activeHouseInteraction = null;
    hideMapPopup();
    saveGame();
    prepareRakaSpawn();
    renderMap();
  };
  if (!withFade) {
    commit();
    return;
  }
  showSceneLoading("Sedang keluar dari rumah dan membuka jalan menuju hutan...", commit);
}

function moveMapTo(index) {
  const areaIndex = Math.max(0, Math.min(sideAreas.length - 1, index - 1));
  const area = sideAreas[areaIndex];
  state.sideArea = areaIndex;
  state.sideX = area.triggerX || getSideAreaStartX(areaIndex);
  state.sideY = getSideGroundY() - sideWorld.playerHeight;
  state.sideVX = 0;
  state.sideVY = 0;
  saveGame();
  renderMap();
}

function moveMapBy(direction) {
  if (el.worldMap.classList.contains("hidden") || !el.modal.classList.contains("hidden") || !el.settingsOverlay.classList.contains("hidden") || !el.loadOverlay.classList.contains("hidden")) return;
  state.sideX = Math.max(80, Math.min(getSideWorldWidth() - 120, state.sideX + direction * 140));
  renderMap();
}

function stopMapMovement(suppressHeldKeys = false) {
  const wasMoving = mapKeys.size > 0 || Math.abs(state.sideVX) > 0.001 || el.mapPlayer.classList.contains("walking");
  if (suppressHeldKeys) {
    mapKeys.forEach((key) => suppressedMapKeys.add(key));
  }
  mapKeys.clear();
  state.sideVX = 0;
  rakaWalkClock = 0;
  el.mapPlayer.classList.remove("walking");
  if (wasMoving) updateRakaFrame();
}

function resetMapMovement() {
  suppressedMapKeys.clear();
  stopMapMovement();
}

function stepMapMovement(timestamp = 0) {
  const delta = Math.min(32, timestamp - (lastMapFrameTime || timestamp)) || 16;
  lastMapFrameTime = timestamp;

  if (el.worldMap.classList.contains("hidden") || !el.worldMap.classList.contains("side-level-active") || !el.modal.classList.contains("hidden") || !el.settingsOverlay.classList.contains("hidden") || !el.pauseOverlay.classList.contains("hidden") || !el.loadOverlay.classList.contains("hidden") || !el.confirmOverlay.classList.contains("hidden")) {
    stopMapMovement(true);
    mapMoveFrame = requestAnimationFrame(stepMapMovement);
    return;
  }

  let dx = 0;
  if (mapKeys.has("arrowright") || mapKeys.has("d")) dx += 1;
  if (mapKeys.has("arrowleft") || mapKeys.has("a")) dx -= 1;
  // Gerak langsung mengikuti tombol aktif. Tidak ada momentum tersisa setelah
  // keyup, sehingga karakter tidak dapat terus berjalan sendiri.
  state.sideVX = dx * sideWorld.moveSpeed;
  const { minX, maxX } = getSideMovementBounds();
  const previousX = state.sideX;
  const nextX = Math.max(70, Math.min(maxX, state.sideX + state.sideVX * delta));
  const clampedX = Math.max(minX, nextX);
  if (clampedX === minX || clampedX === maxX) {
    if (clampedX === minX && dx < 0 && state.sideArea > 0 && timestamp - lastBoundaryDialogAt > 1600) {
      lastBoundaryDialogAt = timestamp;
      showWitchDialog(state.sideArea === 1
        ? "Anda tidak dapat kembali ke area sebelumnya. Perjalanan harus dilanjutkan ke depan."
        : "Anda tidak dapat kembali terlalu jauh. Perjalanan harus dilanjutkan ke depan.");
    }
    const blockedByForestChasm = state.sideArea === 1 && !state.natureBridgeInstalled;
    if (clampedX === maxX && dx > 0 && activeSideTrigger === null && !blockedByForestChasm && !state.completed.includes(state.sideArea) && timestamp - lastBoundaryDialogAt > 1600) {
      lastBoundaryDialogAt = timestamp;
      showWitchDialog("Selesaikan misi di tempat ini dulu, Raka. Setelah itu baru lanjut ke kanan.");
    }
    state.sideVX = 0;
  }
  state.sideX = clampedX;
  state.sideY = getSideGroundY() - sideWorld.playerHeight;
  state.sideVY = 0;
  const travelledDistance = Math.abs(state.sideX - previousX);
  const didMove = travelledDistance > 0.01;
  const wasWalking = el.mapPlayer.classList.contains("walking");
  if (didMove) {
    if (!wasWalking) rakaWalkClock = 0;
    // Ikat pergantian frame ke jarak tempuh agar kaki tidak meluncur saat FPS turun.
    rakaWalkClock += travelledDistance / sideWorld.moveSpeed;
  } else {
    rakaWalkClock = 0;
  }
  el.mapPlayer.classList.toggle("walking", didMove);
  if (dx < 0) el.mapPlayer.classList.add("facing-left");
  if (dx > 0) el.mapPlayer.classList.remove("facing-left");
  updateSideArea();
  updateMapPlayerPosition();
  updateSideCamera(false, delta);
  updateSideTrigger();
  updateSideAdvance();
  maybeShowTravelHint();
  if (timestamp - lastMapSaveAt > 1400) {
    lastMapSaveAt = timestamp;
    saveGame();
  }
  mapMoveFrame = requestAnimationFrame(stepMapMovement);
}

function hideMapPopup() {
  el.mapPopup.classList.add("hidden");
}

function maybeOpenMapIntro(forcedIndex = state.mapPosition) {
  if (el.worldMap.classList.contains("hidden")) return;
  if (forcedIndex === 0 || forcedIndex === lastMapModalIndex || state.ended) return;
  lastMapModalIndex = forcedIndex;
  openLevelIntro(forcedIndex - 1);
}

function useSideTrialTrigger(index = activeSideTrigger) {
  if (index !== state.current || state.completed.includes(index)) return;
  if (activeWitchDialog) {
    closeWitchDialog();
    return;
  }

  if (index === 2) {
    if (!state.lightDoorInspected) {
      inspectLightDoor();
      return;
    }
    if (!isLightTrialUnlocked()) {
      hideMapPopup();
      showLightDeniedPopup();
      return;
    }
  }

  if (index === 3) {
    if (!state.heritageDoorInspected) {
      inspectHeritageDoor();
      return;
    }
    if (!isHeritageTrialUnlocked()) {
      hideMapPopup();
      showHeritageDeniedPopup();
      return;
    }
  }

  hideMapPopup();
  startTrial();
}

function openLevelIntro(index) {
  const trial = trials[index];
  if (!trial) return;
  const isPlayable = index === state.current && !state.completed.includes(index);
  const isDone = state.completed.includes(index);
  const lockedMessage = index > state.current
    ? `Level ini belum bisa dikerjakan. Raka harus menyelesaikan Level ${state.current + 1} dulu.`
    : "Misi ini sudah selesai dan tidak dapat diulang.";
  let statusText = isPlayable
    ? "Lokasi ini sudah bisa dimasuki."
    : isDone
      ? "Raka sudah menyelesaikan trial ini."
      : "Raka boleh melihat lokasi ini, tapi belum bisa mengerjakan trial-nya.";

  const area = getTrialArea(index);
  let actionText = isPlayable ? "TEKAN E / MULAI" : isDone ? "MISI SELESAI" : "TERKUNCI";
  let progressNote = "";

  if (isPlayable && index === 2) {
    const collected = state.lightFragments.length;
    if (!state.lightDoorInspected) {
      statusText = "Pintu masih tertutup. Periksa mekanismenya untuk mengetahui apa yang hilang.";
      actionText = "TEKAN E / PERIKSA";
    } else if (!isLightTrialUnlocked()) {
      statusText = "Pintu belum dapat dibuka karena pecahan kacanya belum lengkap.";
      actionText = "TEKAN E / CEK PINTU";
      progressNote = `${collected}/${lightCollectibles.length} pecahan kaca terkumpul`;
    } else {
      statusText = "Lima pecahan kaca lengkap dan siap disusun menjadi jalur pantulan.";
      progressNote = "Semua pecahan kaca sudah terkumpul";
    }
  }

  if (isPlayable && index === 3) {
    const collected = state.heritageMaterials.length;
    if (!state.heritageDoorInspected) {
      statusText = "Pintu masih tertutup. Periksa relung simbolnya untuk mengetahui apa yang hilang.";
      actionText = "TEKAN E / PERIKSA";
    } else if (!isHeritageTrialUnlocked()) {
      statusText = "Pintu belum dapat dibuka karena batu simbolnya belum lengkap.";
      actionText = "TEKAN E / CEK PINTU";
      progressNote = `${collected}/${heritageCollectibles.length} batu simbol terkumpul`;
    } else {
      statusText = "Delapan batu simbol lengkap dan siap disusun pada pintu kuno.";
      progressNote = "Semua batu simbol sudah terkumpul";
    }
  }

  el.mapPopupKicker.textContent = `Level ${index + 1} - ${trial.name}`;
  el.mapPopupTitle.textContent = area ? area.object : trial.place;
  el.mapPopupText.textContent = `${area ? area.popup : trial.story}. ${statusText}`;
  el.mapPopupStart.textContent = actionText;
  el.mapPopupStart.disabled = !isPlayable;
  el.mapPopupNote.textContent = isPlayable ? progressNote : lockedMessage;
  el.mapPopupNote.classList.toggle("hidden", isPlayable && !progressNote);
  el.mapPopup.classList.toggle("mission-complete", isDone);
  el.mapPopup.classList.remove("hidden");

  el.mapPopupStart.onclick = null;
  if (isPlayable) {
    el.mapPopupStart.onclick = () => useSideTrialTrigger(index);
  }
}

function render() {
  const trial = trials[state.current] || trials[trials.length - 1];
  const position = positions[Math.min(state.current, positions.length - 1)];
  el.raka.style.left = `${position.left}%`;
  el.raka.style.top = `${position.top}%`;
  el.locationName.textContent = trial.place;
  renderAllHealthBars();
  el.mapPieces.textContent = `${state.mapPieces}/5`;
  if (el.sideMapPieces) el.sideMapPieces.textContent = `${state.mapPieces}/5`;
  el.storyText.textContent = state.ended
    ? "Perjalanan selesai. Pilih reset untuk mencoba lagi."
    : `${trial.story} Edukasi: ${trial.field}.`;

  el.inventory.innerHTML = state.inventory.length
    ? state.inventory.map((item) => `<span class="item"><img src="${rewardAssets[item] || rewardAssets["Peta terbakar"]}" alt="" />${item}</span>`).join("")
    : `<span class="item"><img src="${rewardAssets["Peta terbakar"]}" alt="" />Peta terbakar</span>`;

  el.startTrial.disabled = state.ended || state.completed.includes(state.current);
  el.startTrial.textContent = state.completed.includes(state.current) ? "MISI SELESAI" : "Mulai Trial";

  el.route.innerHTML = trials
    .map((entry, index) => {
      const done = state.completed.includes(index) ? "done" : "";
      const current = index === state.current ? "current" : "";
      const disabled = index > state.current || Boolean(done);
      return `<button class="node ${done} ${current}" ${disabled ? "disabled" : ""} data-index="${index}">
        <strong>${index + 1}. ${entry.place}</strong>
        ${done ? '<span class="node-status">MISI SELESAI</span>' : entry.name}
      </button>`;
    })
    .join("");

  document.querySelectorAll(".node").forEach((node) => {
    node.addEventListener("click", () => {
      state.current = Number(node.dataset.index);
      render();
    });
  });
}
