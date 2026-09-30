/* Map Hub, node level, popup level, dan render side world. */

function showMap(autoIntro = false) {
  postTrialExitArea = null;
  hideMenu();
  hidePrologue();
  closeModal();
  el.worldMap.classList.remove("hidden");
  el.worldMap.classList.remove("side-level-active");
  document.body.classList.add("map-open");
  resetMapMovement();
  closeWitchDialog();
  pendingWitchDialog = "";
  activeSideTrigger = null;
  activeHouseInteraction = null;
  activeForestInteraction = null;
  activeLightInteraction = null;
  activeHeritageInteraction = null;
  renderHubMap();
  setAmbientForMap();
  if (autoIntro && state.mapPieces === 0) {
    el.hubMapScreen?.classList.add("first-visit");
    setTimeout(() => el.hubMapScreen?.classList.remove("first-visit"), 1500);
  }
}

function renderHubMap() {
  const pieces = Math.max(0, Math.min(5, Number(state.mapPieces) || 0));
  const currentIndex = Math.max(0, Math.min(trials.length - 1, Number(state.current) || 0));
  const allComplete = state.completed.length >= trials.length;
  renderAllHealthBars();

  if (el.hubMapPieces) el.hubMapPieces.textContent = `${pieces}/5`;
  if (el.hubMapTitle) {
    el.hubMapTitle.textContent = pieces === 0
      ? "Jejak yang Belum Terungkap"
      : pieces === 5 ? "Peta Keluarga Lengkap" : `${pieces} Potongan Peta Menyala`;
  }
  if (el.hubMapPieceLayers) {
    el.hubMapPieceLayers.innerHTML = Array.from({ length: pieces }, (_, index) => (
      `<img class="hub-map-piece piece-${index + 1}" src="${mapAssets.pieces[index + 1]}" alt="" />`
    )).join("");
  }
  if (el.hubMapNodes) {
    el.hubMapNodes.innerHTML = hubLocations.map((location, index) => {
      const isDone = state.completed.includes(index);
      const isCurrent = index === currentIndex && !isDone && !state.ended;
      const isRevealed = index === 0 || pieces >= index;
      const stateClass = isDone ? "done" : isCurrent && isRevealed ? "current" : "locked";
      const status = isDone ? "Selesai" : isCurrent && isRevealed ? "Buka" : "Terkunci";
      return `<button class="hub-location ${stateClass}" style="--hub-x:${location.x}%;--hub-y:${location.y}%" data-level="${index}" ${isCurrent && isRevealed ? "" : "disabled"} aria-label="Level ${index + 1}, ${trials[index].place}, ${status}">
        <span class="hub-location-pin">
          <img src="${location.icon}" alt="" />
          ${isDone ? '<b class="hub-location-complete" aria-hidden="true">\u2713</b>' : ""}
        </span>
        <strong>${location.short}</strong><small>${status}</small>
      </button>`;
    }).join("");
    el.hubMapNodes.querySelectorAll(".hub-location.current").forEach((button) => {
      button.addEventListener("click", () => showHubLevelPopup(Number(button.dataset.level)));
    });
  }

  if (el.hubMapProgress) el.hubMapProgress.textContent = `${pieces} dari 5 potongan ditemukan`;
  if (el.hubMapInstruction) {
    el.hubMapInstruction.textContent = allComplete
      ? state.ended
        ? "Seluruh perjalanan Raka telah selesai."
        : "Peta keluarga sudah lengkap. Lanjutkan ke ruang terdalam untuk menemukan Ayah dan Ibu."
      : pieces === 0
        ? "Klik bulatan Level 1 untuk melihat detail dan masuk ke Rumah Raka."
        : `Klik bulatan ${trials[currentIndex].place} untuk melihat detail dan masuk ke level.`;
  }
  if (el.hubContinueEnding) {
    el.hubContinueEnding.hidden = !allComplete || state.ended;
  }
}

function showHubLevelPopup(index) {
  const trial = trials[index];
  const isPlayable = Boolean(trial)
    && index === state.current
    && !state.completed.includes(index)
    && (index === 0 || state.mapPieces >= index)
    && !state.ended;
  if (!isPlayable) return;

  const levelNumber = index + 1;
  openModal(
    `Level ${levelNumber} - ${trial.name}`,
    `Masuk ke ${trial.place}?`,
    `Raka akan memasuki ${trial.place} untuk memulai perjalanan Level ${levelNumber}.`,
    `<div class="hub-level-confirm">
      <span class="hub-level-confirm-number" aria-hidden="true">
        <img src="${hubLocations[index].icon}" alt="" />
      </span>
      <div class="hub-level-confirm-copy">
        <strong>${trial.name}</strong>
        <p>${trial.story}</p>
      </div>
      <div class="hub-level-confirm-actions">
        <button class="secondary" id="cancelHubLevel" type="button">KEMBALI</button>
        <button class="primary" id="confirmHubLevel" type="button">MASUK KE ${trial.place.toUpperCase()}</button>
      </div>
    </div>`,
    "hub-level-confirm-modal"
  );

  document.getElementById("cancelHubLevel")?.addEventListener("click", closeModal);
  const confirmButton = document.getElementById("confirmHubLevel");
  confirmButton?.addEventListener("click", () => {
    closeModal();
    enterHubLevel(index);
  });
  confirmButton?.focus();
}

function enterHubLevel(index) {
  const isPlayable = index === state.current
    && !state.completed.includes(index)
    && (index === 0 || state.mapPieces >= index)
    && !state.ended;
  if (!isPlayable) return;

  // Setiap memasuki level, tampilkan header ringkas terlebih dahulu. Detail
  // checklist hanya dibuka jika pemain menekan kontrol di kanan atas.
  if (el.mapGuide) el.mapGuide.open = false;
  const resumeSameArea = state.sideArea === index;
  postTrialExitArea = null;
  syncSideWorldViewport();
  state.current = index;
  state.sideArea = index;
  if (!resumeSameArea) state.sideX = getSideAreaStartX(index);
  state.sideX = Math.max(80, Math.min(getSideWorldWidth() - 120, Number(state.sideX) || getSideAreaStartX(index)));
  const movementBounds = getSideMovementBounds();
  state.sideX = Math.max(movementBounds.minX, Math.min(movementBounds.maxX, state.sideX));
  state.sideY = getSideGroundY() - sideWorld.playerHeight;
  state.sideVX = 0;
  state.sideVY = 0;
  activeSideTrigger = null;
  activeHouseInteraction = null;
  activeForestInteraction = null;
  activeLightInteraction = null;
  activeHeritageInteraction = null;
  lastMapFrameTime = 0;
  prepareRakaSpawn();
  el.worldMap.classList.add("side-level-active");
  saveGame();
  renderMap();
  setAmbientForMap();

  const intro = index === 0
    ? "Masuki rumah, kumpulkan bahan obor, lalu selesaikan Trial of Fire."
    : getSideArea().dialog;
  setTimeout(() => showWitchDialog(intro), 260);
}

function hideMap() {
  el.worldMap.classList.add("hidden");
  el.worldMap.classList.remove("side-level-active");
  document.body.classList.remove("map-open");
  hideMapPopup();
  activeHouseInteraction = null;
  activeForestInteraction = null;
  activeLightInteraction = null;
  activeHeritageInteraction = null;
  resetMapMovement();
  closeWitchDialog();
}

function renderMap() {
  renderTerrain();
  updateSideArea();
  updateMapPlayerPosition();
  updateSideCamera(true);
  updateSideTrigger();
}

function renderTerrain() {
  renderCollisionDebug();
}

function getSideViewportWidth() {
  const viewport = document.querySelector(".side-viewport");
  return viewport ? viewport.clientWidth : window.innerWidth;
}

function getSideWorldWidth() {
  if (state.sideArea === 0 && state.housePhase === "route") return sideWorld.houseRouteWidth;
  return Number(getSideArea().worldWidth) || sideWorld.width;
}

function getSideArea() {
  return sideAreas[state.sideArea] || sideAreas[0];
}

function getSideCoordinateScale(areaIndex = state.sideArea) {
  const width = Number(sideAreas[areaIndex]?.worldWidth) || sideWorld.baseWidth;
  return width / sideWorld.baseWidth;
}

function getSideAreaStartX(areaIndex = state.sideArea) {
  const baseX = areaIndex === 0 ? 210 : 120;
  return Math.round(baseX * getSideCoordinateScale(areaIndex));
}

function getSideGroundY() {
  // Setiap background memiliki tinggi jalur yang sedikit berbeda.
  // Gunakan rasio tinggi viewport supaya kaki Raka tetap menempel pada
  // jalur yang sama saat berpindah antara fullscreen dan mode jendela.
  if (state.sideArea === 0 && state.housePhase === "inside") {
    return Math.round(sideWorld.height * 0.84);
  }
  if (state.sideArea === 2) return Math.round(sideWorld.height * 0.84);
  if (state.sideArea === 3) {
    const groundRatio = state.heritageDoorPhase === "open" ? 0.86 : 0.86;
    return Math.round(sideWorld.height * groundRatio);
  }
  if (state.sideArea === 4) return Math.round(sideWorld.height * 0.77);
  return sideWorld.groundY;
}

function getSideColliders() {
  const groundY = getSideGroundY();
  if (state.sideArea === 1 && !state.natureBridgeInstalled) {
    return [
      {
        x: 0,
        y: groundY,
        w: natureWorld.chasmLeft,
        h: sideWorld.height - groundY,
        type: "tepi-kiri-jurang",
        collision: "solid"
      },
      {
        x: natureWorld.chasmRight,
        y: groundY,
        w: getSideWorldWidth() - natureWorld.chasmRight,
        h: sideWorld.height - groundY,
        type: "tepi-kanan-jurang",
        collision: "solid"
      }
    ];
  }
  return [{
    x: 0,
    y: groundY,
    w: getSideWorldWidth(),
    h: sideWorld.height - groundY,
    type: "floor",
    collision: "solid"
  }];
}

function getCollisionKind(collider) {
  return collider.collision === "one-way" ? "one-way" : "solid";
}

function isPlayerGrounded() {
  return Math.abs(state.sideY + sideWorld.playerHeight - getSideGroundY()) < 1;
}

function isSideDoorOpen(areaIndex = state.sideArea) {
  if (areaIndex === 2) return state.lightDoorPhase === "open";
  if (areaIndex === 3) return state.heritageDoorPhase === "open";
  return true;
}

function getSideMovementBounds() {
  const worldWidth = getSideWorldWidth();
  const houseCanLeave = state.sideArea === 0 && state.inventory.includes("Obor");
  const houseInteriorOpen = state.sideArea === 0 && state.housePhase === "inside";
  let maxX = state.completed.includes(state.sideArea) || houseCanLeave || houseInteriorOpen || state.sideArea === sideAreas.length - 1
    ? worldWidth - 90
    : Math.min(worldWidth - 90, getSideArea().advanceX - 170);
  if (state.sideArea === 1 && !state.natureBridgeInstalled) {
    maxX = Math.min(maxX, natureWorld.chasmLeft - 36);
  }
  if ([2, 3].includes(state.sideArea)) {
    // Sebelum misi Raka berhenti di depan pintu. Sesudah pintu terbuka,
    // ia hanya perlu melangkah sedikit melewati ambang untuk pindah area.
    const doorArea = sideAreas[state.sideArea];
    const doorBoundaryX = state.completed.includes(state.sideArea) && isSideDoorOpen()
      ? doorArea.triggerX + 55
      : doorArea.triggerX - 40;
    maxX = Math.min(maxX, doorBoundaryX);
  }
  return {
    minX: state.sideArea > 0 ? Math.round(72 * getSideCoordinateScale()) : 70,
    maxX
  };
}

function renderCollisionDebug() {
  if (!el.collisionDebugLayer) return;
  const area = getSideArea();
  const colliderMarkup = getSideColliders().map((collider, index) => {
    const kind = getCollisionKind(collider);
    const label = `${index + 1} · ${collider.type || "collider"} · ${kind}`;
    return `<span class="collision-debug-box ${kind}" style="left:${collider.x}px; top:${collider.y}px; width:${collider.w}px; height:${collider.h}px;"><b>${label}</b></span>`;
  }).join("");
  const triggerMarkup = area.triggerX
    ? `<span class="collision-debug-box trigger" style="left:${area.triggerX - area.triggerWidth / 2}px; top:0; width:${area.triggerWidth}px; height:${area.triggerFeetMax || sideWorld.height}px;"><b>MISSION TRIGGER</b></span>`
    : "";
  const movementBounds = getSideMovementBounds();
  el.collisionDebugLayer.innerHTML = `${colliderMarkup}${triggerMarkup}
    <span class="collision-debug-boundary" style="left:${movementBounds.minX}px;"><b>MIN X</b></span>
    <span class="collision-debug-boundary" style="left:${movementBounds.maxX}px;"><b>MAX X</b></span>`;
  updateCollisionDebug();
}

function updateCollisionDebug() {
  if (!collisionDebugEnabled || !el.collisionDebugPlayer) return;
  el.collisionDebugPlayer.style.left = `${state.sideX}px`;
  el.collisionDebugPlayer.style.top = `${state.sideY}px`;
  el.collisionDebugPlayer.style.width = `${sideWorld.playerWidth}px`;
  el.collisionDebugPlayer.style.height = `${sideWorld.playerHeight}px`;
  if (el.collisionDebugInfo) {
    el.collisionDebugInfo.textContent = `X ${state.sideX.toFixed(1)} · Y ${state.sideY.toFixed(1)} · VX ${state.sideVX.toFixed(2)} · VY ${state.sideVY.toFixed(2)} · ${isPlayerGrounded() ? "GROUNDED" : "AIR"}`;
  }
}

function toggleCollisionDebug() {
  collisionDebugEnabled = !collisionDebugEnabled;
  document.body.classList.toggle("collision-debug-active", collisionDebugEnabled);
  if (el.collisionDebugHud) el.collisionDebugHud.setAttribute("aria-hidden", String(!collisionDebugEnabled));
  renderCollisionDebug();
}

function getTrialArea(index) {
  return sideAreas[index];
}

function getMapGuide() {
  const area = getSideArea();
  const controls = "Gunakan A/D atau panah kiri/kanan untuk bergerak, lalu tekan E untuk berinteraksi.";

  if (state.sideArea === 0 && state.housePhase === "inside") {
    const materials = ["Kayu", "Kain", "Minyak", "Percikan"];
    const hasTorch = state.inventory.includes("Obor");
    const items = materials.map((label) => ({
      label: `Kumpulkan ${label}`,
      done: state.houseMaterials.includes(label)
    }));
    items.push({ label: "Buat dan nyalakan Obor di meja crafting", done: hasTorch });
    if (hasTorch) items.push({ label: "Keluar dari rumah melalui sisi kanan", done: false });
    return {
      title: "Bahan Obor",
      description: hasTorch
        ? `Obor sudah siap. Berjalan terus ke kanan untuk keluar dari rumah. ${controls}`
        : state.houseMaterials.length === materials.length
          ? `Semua bahan sudah ada. Dekati meja crafting di sisi kanan dan tekan E. ${controls}`
          : `Cari empat bahan Obor yang tersebar di dalam rumah. ${controls}`,
      items
    };
  }

  if (state.sideArea === 0 && state.housePhase === "route") {
    return {
      title: "Jalan Keluar Rumah",
      description: `Ikuti jalan panjang sampai ujung kanan untuk membuka peta perjalanan. ${controls}`,
      items: [
        { label: "Obor berhasil dibuat", done: true },
        { label: "Capai ujung kanan jalan", done: false }
      ]
    };
  }

  if (state.sideArea === 1 && !state.completed.includes(1)) {
    return {
      title: "Membangun Jembatan",
      description: state.natureBridgeCrafted
        ? `Bawa jembatan ke tepi jurang dan tekan E untuk memasangnya. ${controls}`
        : state.natureMaterials.length === 2
          ? `Bahan lengkap. Dekati tanah datar di dekat jurang untuk merakit jembatan. ${controls}`
          : state.natureInspected
            ? `Cari Serat Tumbuhan dan Kayu Jembatan di sisi kiri. ${controls}`
            : `Periksa tepi jurang di kanan terlebih dahulu. ${controls}`,
      items: [
        { label: "Periksa jalan yang terputus", done: state.natureInspected },
        { label: "Kumpulkan Serat Tumbuhan", done: state.natureMaterials.includes("Serat Tumbuhan") },
        { label: "Kumpulkan Kayu Jembatan", done: state.natureMaterials.includes("Kayu Jembatan") },
        { label: "Rakit jembatan", done: state.natureBridgeCrafted },
        { label: "Pasang jembatan di jurang", done: state.natureBridgeInstalled }
      ]
    };
  }

  if (state.sideArea === 2 && !state.completed.includes(2)) {
    const fragmentsReady = hasAllLightFragments();
    const fragmentItems = lightCollectibles.map((item) => ({
      label: `Kumpulkan ${item.name}`,
      done: state.lightFragments.includes(item.name)
    }));
    return {
      title: "Pintu Cahaya",
      description: !state.lightDoorInspected
        ? `Jalan masih kosong. Pergi ke pintu batu di paling kanan dan tekan E untuk memeriksanya. ${controls}`
        : fragmentsReady
          ? `Lima pecahan kaca sudah lengkap. Kembali ke Pintu Cahaya dan tekan E untuk menyusun pantulannya. ${controls}`
          : `Pintu tidak dapat dibuka. Cari lima pecahan kaca yang kini terlihat di sepanjang tepian sungai. ${controls}`,
      items: [
        { label: "Periksa Pintu Cahaya di ujung kanan", done: state.lightDoorInspected },
        ...fragmentItems,
        { label: "Atur lima pecahan kaca sesuai pola", done: ["aligned", "open"].includes(state.lightDoorPhase) },
        { label: "Buka pintu dengan pantulan cahaya", done: state.lightDoorPhase === "open" }
      ]
    };
  }

  if (state.sideArea === 3 && !state.completed.includes(3)) {
    const items = heritageCollectibles.map((item) => ({
      label: `Kumpulkan Batu ${item.name}`,
      done: state.heritageMaterials.includes(item.name)
    }));
    items.unshift({ label: "Periksa Pintu Batu Kuno", done: state.heritageDoorInspected });
    items.push({ label: "Susun delapan batu pada pintu kuno", done: state.completed.includes(3) });
    return {
      title: "Batu Simbol Leluhur",
      description: !state.heritageDoorInspected
        ? `Jalan masih kosong. Pergi ke pintu kuno di ujung kanan dan tekan E untuk memeriksanya. ${controls}`
        : hasAllHeritageMaterials()
          ? `Semua batu sudah terkumpul. Kembali ke pintu kuno di kanan dan tekan E. ${controls}`
          : `Pintu tidak dapat dibuka. Kumpulkan delapan batu simbol yang kini terlihat di sepanjang lembah. ${controls}`,
      items
    };
  }

  if (state.sideArea === 4 && !state.completed.includes(4)) {
    const reachedCave = Math.abs(state.sideX - sideAreas[4].triggerX) <= sideAreas[4].triggerWidth / 2;
    return {
      title: "Runtuhan Goa Purba",
      description: `Capai lorong goa, mulai Trial of Survival, dan hindari batu yang jatuh selama 25 detik. ${controls}`,
      items: [
        { label: "Temukan lorong Goa Purba", done: reachedCave },
        { label: "Bertahan dari runtuhan selama 25 detik", done: false },
        { label: "Dapatkan potongan peta terakhir", done: false }
      ]
    };
  }

  if (state.completed.includes(state.sideArea)) {
    const isFinal = state.sideArea === sideAreas.length - 1;
    return {
      title: isFinal ? "Peta Keluarga Lengkap" : "Misi Selesai",
      description: isFinal
        ? `Potongan terakhir sudah didapat. Berjalan ke pojok kanan untuk keluar dari Goa Purba dan membuka peta lengkap di hub. ${controls}`
        : `Semua target level ini sudah selesai. Terus berjalan ke kanan untuk kembali ke hub. ${controls}`,
      items: [
        { label: `Selesaikan misi di ${area.name}`, done: true },
        { label: isFinal ? "Keluar dari Goa Purba melalui pojok kanan" : "Masuk ke pintu atau ujung kanan menuju hub", done: false }
      ]
    };
  }

  return {
    title: `Tujuan ${area.name}`,
    description: `Pergi ke kanan menuju titik Trial, lalu tekan E saat penanda muncul. ${controls}`,
    items: [{ label: `Temukan titik Trial di ${area.name}`, done: false }]
  };
}

function getMapInstruction() {
  return getMapGuide().description;
}

function renderMapGuide() {
  const guide = getMapGuide();
  const guideSignature = JSON.stringify(guide);
  if (el.mapPrompt.dataset.guideSignature === guideSignature) return;
  el.mapPrompt.dataset.guideSignature = guideSignature;
  const completedCount = guide.items.filter((item) => item.done).length;
  if (el.mapGuideTitle) el.mapGuideTitle.textContent = guide.title;
  if (el.mapGuideProgress) {
    el.mapGuideProgress.textContent = `${completedCount}/${guide.items.length}`;
    el.mapGuideProgress.classList.toggle("complete", completedCount === guide.items.length);
  }
  el.mapPrompt.innerHTML = `<p>${guide.description}</p>
    <ul class="map-guide-checklist">
      ${guide.items.map((item) => `<li class="${item.done ? "done" : "pending"}">
        <span>${item.label}</span>
        <small>${item.done ? "Selesai" : "Belum"}</small>
      </li>`).join("")}
    </ul>`;
}

function updateSideArea() {
  const area = getSideArea();
  const worldWidth = getSideWorldWidth();
  state.mapPosition = state.sideArea + 1;
  const houseScene = state.sideArea === 0 ? `scene-house-${state.housePhase}` : "";
  const forestState = state.sideArea === 1
    ? `${state.natureInspected ? "forest-inspected" : ""} ${state.natureMaterials.length === 2 ? "forest-materials-ready" : ""} ${state.natureBridgeCrafted ? "forest-bridge-ready" : ""} ${state.natureBridgeInstalled ? "forest-bridge-installed" : ""}`
    : "";
  const lightState = state.sideArea === 2
    ? `light-door-${state.lightDoorPhase || "closed"} ${state.lightDoorInspected ? "light-door-inspected" : ""} ${hasAllLightFragments() ? "light-fragments-ready" : ""} ${!state.completed.includes(2) && Math.abs(state.sideX - sideAreas[2].triggerX) <= sideAreas[2].triggerWidth / 2 ? "light-door-nearby" : ""}`
    : "";
  const heritageState = state.sideArea === 3
    ? `heritage-door-${state.heritageDoorPhase || "closed"} ${state.heritageDoorInspected ? "heritage-door-inspected" : ""} ${hasAllHeritageMaterials() ? "heritage-materials-ready" : ""} ${!state.completed.includes(3) && Math.abs(state.sideX - sideAreas[3].triggerX) <= sideAreas[3].triggerWidth / 2 ? "heritage-door-nearby" : ""}`
    : "";
  const caveState = state.sideArea === 4 && !state.completed.includes(4) && Math.abs(state.sideX - sideAreas[4].triggerX) <= sideAreas[4].triggerWidth / 2
    ? "cave-door-nearby"
    : "";
  const dialogState = activeWitchDialog ? (activeDialogSpeaker === "Raka" ? "raka-speaking dialog-speaking" : "witch-speaking dialog-speaking") : "";
  el.mapBackdrop.className = `map-backdrop ${area.className} ${houseScene} ${forestState} ${lightState} ${heritageState} ${caveState} ${dialogState} ${state.completed.includes(state.sideArea) ? "area-clear" : ""}`.trim();
  el.mapRoute.style.width = `${worldWidth}px`;
  el.mapRoute.style.setProperty("--side-world-width", `${worldWidth}px`);
  el.mapRoute.style.setProperty("--side-ground-y", `${getSideGroundY()}px`);
  el.mapPlaceName.textContent = state.sideArea === 0
    ? state.housePhase === "inside" ? "Dalam Rumah Raka" : "Luar Rumah dan Jalan Masuk Hutan"
    : area.name;
  if (el.sideMapPieces) el.sideMapPieces.textContent = `${state.mapPieces}/5`;
  document.querySelectorAll(".house-pickup").forEach((pickup) => {
    pickup.dataset.collected = String(state.houseMaterials.includes(pickup.dataset.material));
  });
  document.querySelectorAll(".forest-pickup").forEach((pickup) => {
    pickup.dataset.collected = String(state.natureMaterials.includes(pickup.dataset.natureMaterial));
  });
  document.querySelectorAll(".light-pickup").forEach((pickup) => {
    const isCollected = state.lightFragments.includes(pickup.dataset.lightFragment);
    const isVisible = state.sideArea === 2
      && state.lightDoorInspected
      && !state.completed.includes(2)
      && !isCollected;
    pickup.dataset.collected = String(isCollected);
    pickup.style.display = isVisible ? "block" : "none";
    pickup.setAttribute("aria-hidden", String(!isVisible));
  });
  document.querySelectorAll(".heritage-pickup").forEach((pickup) => {
    const isCollected = state.heritageMaterials.includes(pickup.dataset.heritageMaterial);
    const collectible = heritageCollectibles.find((item) => item.name === pickup.dataset.heritageMaterial);
    const isVisible = state.sideArea === 3
      && Number(state.heritageDoorFlowVersion) === currentHeritageDoorFlowVersion
      && state.heritageDoorInspected
      && !state.completed.includes(3)
      && !isCollected;
    if (collectible) pickup.style.left = `${collectible.x - 42}px`;
    pickup.dataset.collected = String(isCollected);
    pickup.style.display = isVisible ? "block" : "none";
    pickup.setAttribute("aria-hidden", String(!isVisible));
  });
  const lightDoorMarker = document.querySelector(".light-door-marker");
  if (lightDoorMarker) {
    const lightReady = isLightTrialUnlocked();
    const label = !state.lightDoorInspected
      ? "PERIKSA PINTU CAHAYA"
      : lightReady ? "MASUK TRIAL OF LIGHT" : `PINTU TERKUNCI · ${state.lightFragments.length}/${lightCollectibles.length}`;
    lightDoorMarker.querySelector("b").textContent = label;
    lightDoorMarker.setAttribute("aria-label", label.toLowerCase());
  }
  const heritageDoorMarker = document.querySelector(".heritage-door-marker");
  if (heritageDoorMarker) {
    heritageDoorMarker.style.left = `${sideAreas[3].triggerX - 85}px`;
    const heritageReady = isHeritageTrialUnlocked();
    const label = !state.heritageDoorInspected
      ? "PERIKSA PINTU KUNO"
      : heritageReady ? "MASUK TRIAL OF HERITAGE" : `PINTU TERKUNCI · ${state.heritageMaterials.length}/${heritageCollectibles.length}`;
    heritageDoorMarker.querySelector("b").textContent = label;
    heritageDoorMarker.setAttribute("aria-label", label.toLowerCase());
  }
  const caveDoorMarker = document.querySelector(".cave-door-marker");
  if (caveDoorMarker) caveDoorMarker.style.left = `${sideAreas[4].triggerX - 85}px`;
  renderMapGuide();
}

function prepareRakaSpawn() {
  if (!el.mapPlayer) return;
  rakaWalkClock = 0;
  el.mapPlayer.classList.remove("walking");
  el.mapPlayer.classList.add("raka-spawning");
  el.mapPlayer.dataset.rakaFrame = "";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.mapPlayer.classList.remove("raka-spawning"));
  });
}

function updateMapPlayerPosition() {
  const visualFootOffset = 0;
  updateRakaFrame();
  el.mapPlayer.style.left = `${state.sideX}px`;
  el.mapPlayer.style.top = `${state.sideY + sideWorld.playerHeight + visualFootOffset}px`;
  updateCollisionDebug();
  const witch = document.getElementById("witchCompanion");
  if (witch) {
    const faceLeft = el.mapPlayer.classList.contains("facing-left");
    const targetX = activeWitchDialog ? state.sideX + (faceLeft ? 112 : -112) : -200;
    const targetY = state.sideY - 54;
    witch.style.left = `${Math.max(24, targetX)}px`;
    witch.style.top = `${Math.max(90, targetY)}px`;
  }
  const bubble = document.getElementById("witchBubble");
  if (bubble && witch) {
    const footY = state.sideY + sideWorld.playerHeight;
    const renderedPlayerHeight = el.mapPlayer.getBoundingClientRect().height || 409;
    const headY = footY - renderedPlayerHeight;
    const viewportWidth = getSideViewportWidth();
    const playerScreenX = state.sideX - sideCameraX;
    const hasRoomAbove = headY >= 160;

    if (hasRoomAbove) {
      bubble.style.left = `${state.sideX}px`;
      bubble.style.top = `${headY - 18}px`;
      bubble.style.transform = "translate(-50%, -100%)";
    } else {
      const placeOnRight = playerScreenX < viewportWidth * 0.55;
      bubble.style.left = `${state.sideX + (placeOnRight ? 142 : -142)}px`;
      bubble.style.top = `${Math.max(108, headY + renderedPlayerHeight * 0.3)}px`;
      bubble.style.transform = placeOnRight ? "translate(0, -50%)" : "translate(-100%, -50%)";
    }
  }
}

function updateRakaFrame() {
  const hasTorch = state.inventory.includes("Obor");
  let frameKey = hasTorch ? "torch" : "idle";
  // Gunakan status perpindahan aktual. sideVX dapat masih menyimpan momentum
  // walaupun posisi Raka sudah tertahan oleh batas area.
  const moving = el.mapPlayer.classList.contains("walking");
  if (moving) {
    frameKey = getRakaWalkFrame(rakaWalkClock, hasTorch);
  }
  el.mapPlayer.style.setProperty("--raka-walk-cycle", `${getRakaWalkCycleDuration(hasTorch)}ms`);
  if (el.mapPlayer.dataset.rakaFrame !== frameKey) {
    el.mapPlayer.dataset.rakaFrame = frameKey;
    el.mapPlayer.style.setProperty("--raka-frame", `url("${resolveAssetPath(rakaFrames[frameKey])}")`);
    const renderedWidth = el.mapPlayer.getBoundingClientRect().width || rakaAnimation.referenceWidth;
    el.mapPlayer.style.setProperty("--raka-frame-y", `${getScaledRakaFootOffset(frameKey, renderedWidth)}px`);
  }
}

function updateSideCamera(immediate = false, delta = 16) {
  const viewportWidth = getSideViewportWidth();
  const targetX = Math.max(0, Math.min(getSideWorldWidth() - viewportWidth, state.sideX - viewportWidth * 0.42));
  const cameraEase = 1 - Math.exp(-delta / 115);
  sideCameraX = immediate ? targetX : sideCameraX + (targetX - sideCameraX) * cameraEase;
  el.mapRoute.style.transform = `translateX(${-sideCameraX}px)`;
}

function showCharacterDialog(text, speaker = "Cahaya Nenek", onClose = null) {
  if (!text) return;
  // Dialog Raka yang bersifat interaksi tetap berhenti, sedangkan petunjuk
  // Cahaya Nenek tidak memutus input sehingga pemain dapat terus berjalan.
  if (speaker === "Raka") stopMapMovement(true);
  activeWitchDialog = true;
  activeDialogSpeaker = speaker;
  activeDialogOnClose = typeof onClose === "function" ? onClose : null;
  el.mapBackdrop.classList.remove("witch-speaking", "raka-speaking");
  el.mapBackdrop.classList.add("dialog-speaking", speaker === "Raka" ? "raka-speaking" : "witch-speaking");
  const bubble = document.getElementById("witchBubble");
  if (bubble) {
    const portraitAsset = getDialogPortrait(speaker, text);
    bubble.innerHTML = `<img class="dialog-bubble-portrait" src="${resolveAssetPath(portraitAsset)}" alt="" />
      <div class="dialog-bubble-copy"><strong></strong><span></span><em>Klik / Enter / E untuk lanjut</em></div>`;
    bubble.querySelector("strong").textContent = speaker;
    bubble.querySelector("span").textContent = text;
  }
  updateMapPlayerPosition();
}

function showWitchDialog(text, onClose = null) {
  showCharacterDialog(text, "Cahaya Nenek", onClose);
}

function showRakaDialog(text, onClose = null) {
  showCharacterDialog(text, "Raka", onClose);
}

function closeWitchDialog() {
  const onClose = activeDialogOnClose;
  activeDialogOnClose = null;
  activeWitchDialog = false;
  el.mapBackdrop.classList.remove("witch-speaking", "raka-speaking", "dialog-speaking");
  updateMapPlayerPosition();
  if (onClose) onClose();
}

function maybeShowTravelHint() {
  if (!tutorialHintsEnabled || activeWitchDialog || activeSideTrigger !== null) return;
  const area = getSideArea();
  (area.hints || []).forEach((hint, hintIndex) => {
    const key = `${state.sideArea}-${hintIndex}`;
    if (!shownTravelHints.has(key) && Math.abs(state.sideX - hint.x) < 28) {
      shownTravelHints.add(key);
      showWitchDialog(hint.text);
    }
  });
}

function getCurrentTrigger() {
  if (state.sideArea === 0 || state.sideArea === 1) return null;
  if (state.completed.includes(state.sideArea)) return null;
  const area = getSideArea();
  if (!area.triggerX || Math.abs(state.sideX - area.triggerX) > area.triggerWidth / 2) return null;
  if (area.triggerFeetMax && state.sideY + sideWorld.playerHeight > area.triggerFeetMax) return null;
  return { area, areaIndex: state.sideArea, trialIndex: state.sideArea };
}

function updateSideTrigger() {
  const houseInteraction = getHouseInteraction();
  if (houseInteraction) {
    activeHouseInteraction = houseInteraction;
    activeForestInteraction = null;
    activeLightInteraction = null;
    activeHeritageInteraction = null;
    activeSideTrigger = null;
    showHouseInteraction(houseInteraction);
    return;
  }
  activeHouseInteraction = null;
  const forestInteraction = getForestInteraction();
  if (forestInteraction) {
    activeForestInteraction = forestInteraction;
    activeLightInteraction = null;
    activeHeritageInteraction = null;
    activeSideTrigger = null;
    // Petunjuk aksi di lokasi crafting/pemasangan harus lebih diprioritaskan
    // daripada dialog sebelumnya agar pemain langsung melihat instruksi E.
    if (activeWitchDialog && ["nature-craft", "install-bridge"].includes(forestInteraction.type)) {
      closeWitchDialog();
    }
    if (forestInteraction.type === "inspect-chasm") {
      useForestInteraction(forestInteraction);
      return;
    }
    showForestInteraction(forestInteraction);
    return;
  }
  activeForestInteraction = null;
  const lightInteraction = getLightInteraction();
  if (lightInteraction) {
    activeLightInteraction = lightInteraction;
    activeHeritageInteraction = null;
    activeSideTrigger = null;
    showLightInteraction(lightInteraction);
    return;
  }
  activeLightInteraction = null;
  const heritageInteraction = getHeritageInteraction();
  if (heritageInteraction) {
    activeHeritageInteraction = heritageInteraction;
    activeSideTrigger = null;
    showHeritageInteraction(heritageInteraction);
    return;
  }
  activeHeritageInteraction = null;
  const trigger = getCurrentTrigger();
  if (!trigger) {
    activeSideTrigger = null;
    lastMapModalIndex = null;
    hideMapPopup();
    return;
  }
  if (activeSideTrigger !== trigger.trialIndex) {
    activeSideTrigger = trigger.trialIndex;
    if ([2, 3, 4].includes(trigger.trialIndex) && activeWitchDialog) closeWitchDialog();
    openLevelIntro(trigger.trialIndex);
    if (![2, 3, 4].includes(trigger.trialIndex)) showWitchDialog(trigger.area.dialog);
  }
}
