/* Damage, penyelesaian Trial, reward, peta, dan ending. */

function fail(message, trialIndex = state.current, explicitDamage = null) {
  if (state.ended) return;
  const safeLevel = Math.max(0, Math.min(trials.length - 1, Number(trialIndex) || 0));
  const requestedDamage = explicitDamage === null ? failureDamageByLevel[safeLevel] : Number(explicitDamage);
  const result = calculateHpDamage(state.hpUnits, requestedDamage);
  state.hpUnits = result.after.totalHp;
  syncLegacyLives();
  playHazardSound();
  const feedback = document.querySelector(".feedback");
  const chanceText = result.chancesLost > 0
    ? result.after.chances > 0
      ? ` Kesempatan berkurang ${result.chancesLost}; sisa \u00d7${result.after.chances}.`
      : " Semua kesempatan habis."
    : "";
  const damageText = `HP terkena -${result.damage}. Bar aktif ${result.after.activeHp}/${hpUnitsPerChance}, kesempatan \u00d7${result.after.chances}.${chanceText}`;
  if (feedback) feedback.textContent = `${message} ${damageText}`;
  saveGame();
  render();
  showChanceLostAlert(result);
  if (state.hpUnits <= 0) showEnding(false);
}

function completeTrial(extraMessage = "", options = {}) {
  stopMissionTimer();
  const completedIndex = state.current;
  const trial = trials[completedIndex];
  playPuzzleSuccessSound();
  if (!state.completed.includes(completedIndex)) {
    state.completed.push(completedIndex);
    if (!state.inventory.includes(trial.reward)) state.inventory.push(trial.reward);
    state.notes.push(trial.note);
    if (trial.mapPiece) state.mapPieces += 1;
  }
  pendingWitchDialog = getTrialArea(completedIndex)?.afterDialog || "Bagus, Raka. Jalan berikutnya sudah menunggu di kanan.";
  saveGame();

  if (options.deferReward) {
    render();
    return;
  }

  if (completedIndex === trials.length - 1) {
    showScienceRewardPopup(completedIndex, null, extraMessage);
    return;
  }

  state.current += 1;
  saveGame();
  render();
  showScienceRewardPopup(completedIndex, trials[state.current], extraMessage);
}

function resumePostTrialExit(areaIndex) {
  const safeArea = Math.max(0, Math.min(sideAreas.length - 1, Number(areaIndex) || 0));
  postTrialExitArea = safeArea;
  state.sideArea = safeArea;
  state.sideVX = 0;
  state.sideVY = 0;
  state.sideY = getSideGroundY() - sideWorld.playerHeight;
  activeSideTrigger = null;
  activeHouseInteraction = null;
  activeForestInteraction = null;
  activeLightInteraction = null;
  activeHeritageInteraction = null;
  hideMapPopup();
  el.worldMap.classList.remove("hidden");
  el.worldMap.classList.add("side-level-active");
  document.body.classList.add("map-open");
  stopMapMovement(true);
  render();
  renderMap();
  setAmbientForMap();
  saveGame();

  const exitMessages = [
    "Obornya sudah siap. Sekarang aku harus keluar dari rumah dan mengikuti jalan di luar sebelum membuka peta perjalanan.",
    "Jembatannya sudah terpasang. Aku harus terus berjalan ke depan melewati hutan ini sebelum membuka peta perjalanan.",
    "Pintu batu sudah terbuka. Aku harus masuk melalui pintu di pojok kanan sebelum membuka peta perjalanan.",
    "Pintu leluhur sudah terbuka. Aku harus melewati pintu di pojok kanan sebelum membuka peta perjalanan.",
    "Potongan terakhir sudah kudapat. Aku harus berjalan ke pojok kanan dan keluar dari goa sebelum membuka peta lengkap."
  ];
  const message = exitMessages[safeArea];
  window.setTimeout(() => showRakaDialog(message), 220);
}

function getMapRevealMarkup(pieceNumber, label) {
  const normalizedPiece = Math.max(1, Math.min(5, pieceNumber));
  const isComplete = normalizedPiece === 5;
  const pieceAsset = mapAssets.pieces[normalizedPiece];
  return `<div class="map-reward-scene map-reveal-scene" aria-label="Potongan peta ${normalizedPiece} dari 5">
    <div class="map-reveal-frame provided-map-frame ${isComplete ? "complete" : ""}">
      <img class="provided-map-piece" src="${pieceAsset}" alt="Potongan peta ${normalizedPiece}" />
      ${isComplete ? `<img class="provided-map-complete" src="${mapAssets.complete}" alt="Peta keluarga lengkap" />` : ""}
    </div>
    <div class="map-piece-caption map-reveal-caption">
      <em>${label}</em>
      <strong>${isComplete ? "Peta lengkap" : `${normalizedPiece}/5 potongan`}</strong>
    </div>
  </div>`;
}

function showScienceRewardPopup(completedIndex, nextTrial, extraMessage) {
  const doneTrial = trials[completedIndex];
  const science = scienceResults[completedIndex];
  if (!science) {
    showMapPieceRewardPopup(completedIndex, nextTrial, extraMessage);
    return;
  }

  openModal(
    "Ilmu Pengetahuan Diperoleh",
    science.title,
    `Hasil pengamatan IPA dari ${science.source.toLowerCase()} telah masuk ke Catatan Nenek.`,
    `<div class="level-transition-card knowledge-reward-card science-reward-card">
      <div class="knowledge-heading">
        <img class="knowledge-reward-icon" src="${rewardAssets[doneTrial.reward]}" alt="${doneTrial.reward}" />
        <div>
          <span>Ilmu dari ${science.source}</span>
          <strong>${science.title}</strong>
        </div>
      </div>
      <p class="knowledge-summary">${science.summary}</p>
      <div class="science-process" aria-label="Urutan konsep ilmu pengetahuan">
        ${science.steps.map((step, index) => `<span>${step}${index < science.steps.length - 1 ? "<b>&rarr;</b>" : ""}</span>`).join("")}
      </div>
      <p class="knowledge-note">${science.note}</p>
      <button class="primary reward-continue" id="showNextMapPiece">BUKA POTONGAN PETA ${Math.min(state.mapPieces, 5)}</button>
    </div>`,
    "level-transition reward-transition knowledge-transition"
  );

  document.getElementById("showNextMapPiece").addEventListener("click", () => {
    playAdventureHit();
    transitionRewardCard(() => showMapPieceRewardPopup(completedIndex, nextTrial, extraMessage));
  });
}

function showMapPieceRewardPopup(completedIndex, nextTrial, extraMessage) {
  const doneTrial = trials[completedIndex];
  const pieceNumber = Math.min(state.mapPieces, 5);
  const isFinal = completedIndex === trials.length - 1;
  const mapMessage = mapPieceMessages[completedIndex] || "Bagian baru peta keluarga Raka telah terbuka.";
  openModal(
    isFinal ? "Peta Lengkap" : "Potongan Peta Diperoleh",
    isFinal ? "Peta Keluarga Lengkap" : `Potongan Peta ${pieceNumber} Diperoleh`,
    `${extraMessage} Raka mendapat ${doneTrial.reward} dan potongan peta ${pieceNumber}.`,
    `<div class="level-transition-card ${isFinal ? "final-map-reward" : "map-piece-reward"}">
      ${getMapRevealMarkup(pieceNumber, isFinal ? "Peta Keluarga Lengkap" : `Potongan Peta ${pieceNumber}/5`)}
      <span>LEVEL ${completedIndex + 1} - MISI SELESAI</span>
      <strong>${isFinal ? "Keluar menuju peta keluarga" : `Menuju Level ${completedIndex + 2}: ${nextTrial.place}`}</strong>
      <p>${mapMessage}</p>
      <button class="primary reward-continue" id="continueAfterMapPiece">${isFinal ? "LANJUTKAN DI GOA" : "LANJUTKAN PERJALANAN"}</button>
    </div>`,
    "level-transition reward-transition"
  );

  document.getElementById("continueAfterMapPiece").addEventListener("click", () => {
    playAdventureHit();
    transitionRewardCard(() => {
      closeModal();
      if (isFinal) {
        resumePostTrialExit(completedIndex);
        return;
      }
      if (completedIndex === 2) {
        showLevel3Cutscene();
        return;
      }
      if (completedIndex === 3) {
        showLevel4Cutscene();
        return;
      }
      if (completedIndex === 1) {
        resumePostTrialExit(1);
        return;
      }
      render();
      showMap(false);
    });
  });
}

function showTorchRewardPopup() {
  openModal(
    "Ilmu Pengetahuan Diperoleh",
    "Proses Pembakaran",
    "Obor menunjukkan perubahan energi yang terjadi saat pembakaran.",
    `<div class="level-transition-card knowledge-reward-card">
      <div class="knowledge-heading">
        <img class="knowledge-torch" src="${rewardAssets.Obor}" alt="Obor menyala" />
        <div>
          <span>Ilmu diperoleh</span>
          <strong>Proses Pembakaran</strong>
        </div>
      </div>
      <p class="knowledge-summary">Kayu menjadi badan Obor, sedangkan kain menyerap minyak agar bahan bakar bertahan di ujungnya. Saat percikan memberi panas awal, bahan bakar bereaksi dengan oksigen dan mengubah energi kimia menjadi <b>panas dan cahaya</b>.</p>
      <div class="combustion-formula" aria-label="Bahan bakar ditambah oksigen menghasilkan panas dan cahaya">
        <span>Bahan bakar<small>Kayu + kain berminyak</small></span>
        <b>+</b>
        <span>Oksigen<small>Dari udara</small></span>
        <b>&rarr;</b>
        <span class="combustion-result">Panas + Cahaya<small>Nyala Obor</small></span>
      </div>
      <p class="knowledge-note">Obor Mati terbentuk lebih dahulu; percikan kemudian memulai pembakaran hingga menjadi Obor Nyala.</p>
      <button class="primary reward-continue" id="showTorchMapPiece">BUKA POTONGAN PETA 1</button>
    </div>`,
    "level-transition reward-transition knowledge-transition"
  );

  document.getElementById("showTorchMapPiece").addEventListener("click", () => {
    playAdventureHit();
    transitionRewardCard(showTorchMapPiecePopup);
  });
}

function showTorchMapPiecePopup() {
  const pieceNumber = Math.max(1, Math.min(state.mapPieces, 5));
  openModal(
    "Potongan Peta Diperoleh",
    "Jalur Pertama Terbuka",
    "Cahaya Obor mengungkap bagian pertama dari peta keluarga Raka.",
    `<div class="level-transition-card first-map-reward">
      ${getMapRevealMarkup(pieceNumber, "Potongan Peta 1/5")}
      <span>LEVEL 1 - MISI SELESAI</span>
      <strong>Jalur Pertama Terbuka</strong>
      <p>Bagian pertama peta menunjukkan jalan keluar dari rumah menuju hutan.</p>
      <button class="primary reward-continue" id="continueAfterTorch">LANJUTKAN PERJALANAN</button>
    </div>`,
    "level-transition reward-transition map-piece-transition"
  );

  document.getElementById("continueAfterTorch").addEventListener("click", () => {
    playAdventureHit();
    transitionRewardCard(() => {
      closeModal();
      resumePostTrialExit(0);
    });
  });
}

function transitionRewardCard(nextPopup) {
  const card = el.trialMount.querySelector(".level-transition-card");
  if (!card) {
    nextPopup();
    return;
  }
  card.querySelectorAll("button").forEach((button) => { button.disabled = true; });
  card.classList.add("leaving");
  setTimeout(nextPopup, 260);
}

function showEnding(good) {
  if (good) {
    showLevel5EndingCutscene();
    return;
  }
  state.ended = true;
  state.endingGood = false;
  saveGame();
  setAmbient("badEnding");
  const text = "Raka gagal menyelamatkan keluarganya. Seluruh kesempatannya telah habis, dan jalan menuju Ayah serta Ibu tertutup oleh reruntuhan Goa Purba. Ia hanya bisa pulang membawa penyesalan.";
  const content = `<div class="ending-video bad-ending-video">
      <div class="ending-caption">
        <span>Bad Ending</span>
        <strong>Raka Gagal Menyelamatkan Keluarganya</strong>
        <p>${text}</p>
      </div>
    </div>
    <button class="primary ending" id="playAgain">KEMBALI KE LOBBY</button>`;
  openModal("Ending", "Bad Ending", text, content, "ending-cinematic");
  document.getElementById("playAgain").addEventListener("click", returnToLobbyAfterEnding);
  render();
}
