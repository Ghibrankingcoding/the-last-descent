/* Prolog, cutscene level, reunion, dan good ending. */

function showPrologue() {
  prologueMode = "opening";
  prologueIndex = 0;
  hideMenu();
  el.prologueSkip.hidden = false;
  el.prologue.classList.remove("hidden");
  document.body.classList.add("prologue-open");
  setAmbient("prologueHappy");
  renderPrologue();
}

function getActivePrologueSlides() {
  if (prologueMode === "level3") return level3CutsceneSlides;
  if (prologueMode === "level4") return level4CutsceneSlides;
  if (prologueMode === "level5-map") return level5MapCutsceneSlides;
  if (prologueMode === "level5-reunion") return level5ReunionCutsceneSlides;
  return prologueSlides;
}

function isLevelCutsceneMode() {
  return ["level3", "level4", "level5-map", "level5-reunion"].includes(prologueMode);
}

function hidePrologue() {
  el.prologue.classList.add("hidden");
  document.body.classList.remove("prologue-open");
  stopTypewriter();
}

function renderPrologue() {
  const slides = getActivePrologueSlides();
  const slide = slides[prologueIndex];
  const backgroundAsset = slide.backgroundAsset || `Assets TLD/background/bg_awal_${slide.background}.png`;
  const resolvedBackgroundAsset = resolveAssetPath(backgroundAsset);
  const ambient = prologueMode === "level3"
    ? "light"
    : prologueMode === "level4"
      ? "heritage"
      : prologueMode.startsWith("level5-")
        ? "ending"
        : prologueIndex < 6 ? "prologueHappy" : "prologueSad";
  setAmbient(ambient);
  el.prologueScene.className = `prologue-scene ${isLevelCutsceneMode() ? `${prologueMode}-story-scene` : ""}`.trim();
  if (el.prologueScene.dataset.background !== resolvedBackgroundAsset) {
    el.prologueScene.dataset.background = resolvedBackgroundAsset;
    el.prologueScene.style.setProperty("--prologue-bg", `url("${resolvedBackgroundAsset}")`);
    void el.prologueScene.offsetWidth;
    el.prologueScene.classList.add("scene-changing");
  }
  const portraitAsset = slide.portraitAsset || getDialogPortrait(slide.speaker, slide.text);
  el.prologuePortrait.src = resolveAssetPath(portraitAsset);
  el.prologuePortrait.alt = "";
  const nextSlide = slides[prologueIndex + 1];
  if (nextSlide) {
    const nextPortrait = new Image();
    nextPortrait.src = resolveAssetPath(nextSlide.portraitAsset || getDialogPortrait(nextSlide.speaker, nextSlide.text));
  }
  el.prologueKicker.textContent = slide.kicker || "Prolog";
  el.prologueTitle.textContent = slide.speaker;
  el.prologueProgress.textContent = `${prologueIndex + 1}/${slides.length}`;
  startTypewriter(slide.text);
}

function stopTypewriter() {
  if (typewriterTimer) {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
  }
}

function setPrologueButtonText() {
  const slides = getActivePrologueSlides();
  if (prologueIndex === slides.length - 1) {
    if (prologueMode === "level5-map") {
      el.prologueNext.textContent = "CARI AYAH & IBU";
      return;
    }
    if (prologueMode === "level5-reunion") {
      el.prologueNext.textContent = "SELESAI";
      return;
    }
    el.prologueNext.textContent = isLevelCutsceneMode() ? "LANJUTKAN PERJALANAN" : "MULAI";
    return;
  }
  el.prologueNext.textContent = isLevelCutsceneMode() ? "BERIKUTNYA" : "LANJUT";
}

function startTypewriter(text) {
  stopTypewriter();
  typewriterDone = false;
  el.prologueText.textContent = "";
  el.prologueText.classList.add("typing");
  el.prologueNext.textContent = "TAMPILKAN";

  let index = 0;
  typewriterTimer = setInterval(() => {
    index += 1;
    el.prologueText.textContent = text.slice(0, index);

    if (index >= text.length) {
      stopTypewriter();
      typewriterDone = true;
      el.prologueText.classList.remove("typing");
      setPrologueButtonText();
    }
  }, getDialogueTypewriterDelay());
}

function finishTypewriter() {
  const slide = getActivePrologueSlides()[prologueIndex];
  stopTypewriter();
  typewriterDone = true;
  el.prologueText.textContent = slide.text;
  el.prologueText.classList.remove("typing");
  setPrologueButtonText();
}

function nextPrologue() {
  if (!typewriterDone) {
    finishTypewriter();
    return;
  }

  const slides = getActivePrologueSlides();
  if (prologueIndex < slides.length - 1) {
    prologueIndex += 1;
    renderPrologue();
    return;
  }

  if (prologueMode === "level3") {
    finishLevel3Cutscene();
    return;
  }
  if (prologueMode === "level4") {
    finishLevel4Cutscene();
    return;
  }
  if (prologueMode === "level5-map") {
    startLevel5FamilyWalk();
    return;
  }
  if (prologueMode === "level5-reunion") {
    finishLevel5Ending();
    return;
  }

  hidePrologue();
  render();
  showSceneLoading("Sedang memasuki rumah Raka dan memulai petunjuk pertama...", () => showMap(true));
}

function skipPrologue() {
  if (prologueMode === "level3") {
    finishLevel3Cutscene();
    return;
  }
  if (prologueMode === "level4") {
    finishLevel4Cutscene();
    return;
  }
  if (prologueMode === "level5-map") {
    startLevel5FamilyWalk();
    return;
  }
  if (prologueMode === "level5-reunion") {
    finishLevel5Ending();
    return;
  }
  hidePrologue();
  render();
  showSceneLoading("Sedang memasuki rumah Raka dan memulai petunjuk pertama...", () => showMap(true));
}

function showLevel3Cutscene() {
  closeModal();
  stopMapMovement(true);
  state.lightDoorPhase = "aligned";
  pendingWitchDialog = "";
  saveGame();
  renderMap();
  prologueMode = "level3";
  prologueIndex = 0;
  el.prologueSkip.hidden = true;
  el.prologue.classList.remove("hidden");
  document.body.classList.add("prologue-open");
  renderPrologue();
}

function finishLevel3Cutscene() {
  state.lightDoorPhase = "open";
  state.sideX = sideAreas[2].triggerX;
  pendingWitchDialog = "";
  saveGame();
  hidePrologue();
  prologueMode = "opening";
  el.prologueSkip.hidden = false;
  render();
  resumePostTrialExit(2);
}

function showLevel4Cutscene() {
  closeModal();
  stopMapMovement(true);
  pendingWitchDialog = "";
  saveGame();
  renderMap();
  prologueMode = "level4";
  prologueIndex = 0;
  el.prologueSkip.hidden = true;
  el.prologue.classList.remove("hidden");
  document.body.classList.add("prologue-open");
  renderPrologue();
}

function finishLevel4Cutscene() {
  state.heritageDoorPhase = "open";
  state.sideX = sideAreas[3].triggerX;
  pendingWitchDialog = "";
  saveGame();
  hidePrologue();
  prologueMode = "opening";
  el.prologueSkip.hidden = false;
  render();
  resumePostTrialExit(3);
}

function showLevel5EndingCutscene() {
  closeModal();
  hideMap();
  state.ended = true;
  state.endingGood = true;
  pendingWitchDialog = "";
  saveGame();
  prologueMode = "level5-map";
  prologueIndex = 0;
  el.prologueSkip.hidden = true;
  el.prologue.classList.remove("hidden");
  document.body.classList.add("prologue-open");
  setAmbient("ending");
  renderPrologue();
}

function stopLevel5FamilyWalk() {
  if (!activeLevel5WalkCleanup) return;
  const cleanup = activeLevel5WalkCleanup;
  activeLevel5WalkCleanup = null;
  cleanup();
}

function startLevel5FamilyWalk() {
  hidePrologue();
  prologueMode = "level5-map";
  openModal(
    "Level 5",
    "Temukan Ayah dan Ibu",
    "Berjalanlah ke kanan menuju cahaya di ujung gua.",
    `<div class="level5-family-walk" id="level5FamilyWalk" tabindex="0" aria-label="Berjalan ke kanan untuk menemui Ayah dan Ibu">
      <div class="level5-family-world" id="level5FamilyWorld">
        <div class="level5-walk-raka" id="level5WalkRaka" aria-hidden="true">
          <img src="${resolveAssetPath(rakaFrames.idle)}" alt="" />
        </div>
      </div>
      <div class="level5-walk-vignette" aria-hidden="true"></div>
      <div class="level5-walk-instruction" id="level5WalkInstruction">
        <span>RUANG TERDALAM GOA</span>
        <strong>Berjalan ke kanan untuk menemui Ayah dan Ibu</strong>
        <small>Gunakan D atau tombol panah kanan</small>
      </div>
      <button class="level5-walk-right" id="level5WalkRight" type="button" aria-label="Tahan untuk berjalan ke kanan">TAHAN &rarr;</button>
      <div class="level5-walk-fade" aria-hidden="true"></div>
    </div>`,
    "ending-cinematic level5-family-walk-screen"
  );

  const screen = document.getElementById("level5FamilyWalk");
  const world = document.getElementById("level5FamilyWorld");
  const raka = document.getElementById("level5WalkRaka");
  const rakaImage = raka.querySelector("img");
  const rightButton = document.getElementById("level5WalkRight");
  const keys = new Set();
  let position = 0.08;
  let lastTime = performance.now();
  let walkClock = 0;
  let rafId = null;
  let transitionTimer = null;
  let finished = false;
  let wasWalking = false;

  function setDirection(direction, active) {
    if (active) keys.add(direction);
    else keys.delete(direction);
  }

  function renderWalk(isMoving = false) {
    if (isMoving && !wasWalking) walkClock = 0;
    const worldWidth = Math.max(world.clientWidth, window.innerWidth);
    const playerX = position * worldWidth;
    const cameraX = Math.max(0, Math.min(worldWidth - window.innerWidth, playerX - window.innerWidth * 0.38));
    raka.style.left = `${playerX}px`;
    world.style.transform = `translateX(${-cameraX}px)`;
    const frameKey = isMoving ? getRakaWalkFrame(walkClock) : "idle";
    if (raka.dataset.rakaFrame !== frameKey) {
      raka.dataset.rakaFrame = frameKey;
      rakaImage.src = resolveAssetPath(rakaFrames[frameKey]);
      const renderedWidth = raka.getBoundingClientRect().width || rakaAnimation.referenceWidth;
      raka.style.setProperty("--raka-frame-y", `${getScaledRakaFootOffset(frameKey, renderedWidth)}px`);
    }
    raka.style.setProperty("--raka-walk-cycle", `${getRakaWalkCycleDuration()}ms`);
    raka.classList.toggle("walking", isMoving);
    wasWalking = isMoving;
  }

  function arriveAtFamily() {
    if (finished) return;
    finished = true;
    keys.clear();
    renderWalk(false);
    screen.classList.add("arrived");
    rightButton.disabled = true;
    playSuccessSound();
    transitionTimer = setTimeout(showLevel5ReunionCutscene, 900);
  }

  function tick(now) {
    const delta = Math.min(50, now - lastTime);
    lastTime = now;
    const movingRight = keys.has("right");
    const movingLeft = keys.has("left");
    const direction = Number(movingRight) - Number(movingLeft);
    if (direction !== 0) {
      position = Math.max(0.06, Math.min(0.78, position + direction * delta * 0.000075));
      walkClock += delta;
    }
    if (direction < 0) raka.classList.add("facing-left");
    if (direction > 0) raka.classList.remove("facing-left");
    renderWalk(direction !== 0);
    if (position >= 0.78) {
      arriveAtFamily();
      return;
    }
    rafId = requestAnimationFrame(tick);
  }

  function onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (["arrowright", "d"].includes(key)) {
      event.preventDefault();
      setDirection("right", true);
    }
    if (["arrowleft", "a"].includes(key)) {
      event.preventDefault();
      setDirection("left", true);
    }
  }

  function onKeyUp(event) {
    const key = event.key.toLowerCase();
    if (["arrowright", "d"].includes(key)) setDirection("right", false);
    if (["arrowleft", "a"].includes(key)) setDirection("left", false);
  }

  function startRight(event) {
    event.preventDefault();
    setDirection("right", true);
  }

  function stopRight() {
    setDirection("right", false);
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", stopRight);
  const onResize = () => renderWalk(wasWalking);
  window.addEventListener("resize", onResize);
  rightButton.addEventListener("pointerdown", startRight);
  rightButton.addEventListener("pointerup", stopRight);
  rightButton.addEventListener("pointercancel", stopRight);
  rightButton.addEventListener("pointerleave", stopRight);
  screen.focus();
  renderWalk();
  rafId = requestAnimationFrame(tick);

  activeLevel5WalkCleanup = () => {
    if (rafId) cancelAnimationFrame(rafId);
    if (transitionTimer) clearTimeout(transitionTimer);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", stopRight);
    window.removeEventListener("resize", onResize);
    rightButton.removeEventListener("pointerdown", startRight);
    rightButton.removeEventListener("pointerup", stopRight);
    rightButton.removeEventListener("pointercancel", stopRight);
    rightButton.removeEventListener("pointerleave", stopRight);
  };
}

function showLevel5ReunionCutscene() {
  closeModal();
  prologueMode = "level5-reunion";
  prologueIndex = 0;
  el.prologueSkip.hidden = true;
  el.prologue.classList.remove("hidden");
  document.body.classList.add("prologue-open");
  renderPrologue();
}

function stopGoodEndingSequence() {
  if (!activeEndingCleanup) return;
  const cleanup = activeEndingCleanup;
  activeEndingCleanup = null;
  cleanup();
}

function startGoodEndingSequence() {
  stopGoodEndingSequence();
  hidePrologue();
  hideMap();
  hideMenu();
  stopAmbient();

  const sequence = el.endingSequence;
  const happyVideo = el.happyEndingVideo;
  const creditVideo = el.creditEndingVideo;
  const skipHint = el.creditSkipHint;
  const creditMusic = setAmbient("credits", false, false);
  const timers = new Set();
  const holdDuration = 1500;
  let phase = "happy";
  let holdStartedAt = 0;
  let holdFrame = null;
  let happyMonitorFrame = null;
  let musicFadeFrame = null;
  let creditMusicStartHandler = null;

  creditMusic.preload = "auto";
  creditMusic.load();

  function later(callback, delay) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
    return timer;
  }

  function resetVideo(video) {
    video.pause();
    try {
      video.currentTime = 0;
    } catch (error) {
      // Metadata mungkin belum selesai dimuat. Pemutaran berikutnya tetap mulai dari awal.
    }
  }

  function cancelCreditHold(resetProgress = true) {
    holdStartedAt = 0;
    if (holdFrame) cancelAnimationFrame(holdFrame);
    holdFrame = null;
    skipHint.classList.remove("holding");
    if (resetProgress) skipHint.style.setProperty("--skip-progress", "0%");
  }

  function fadeOutEndingMusic(duration) {
    const music = activeMusic;
    if (!music) return;
    const startingVolume = music.volume;
    const startedAt = performance.now();

    function step(now) {
      if (activeMusic !== music) return;
      const progress = Math.min(1, (now - startedAt) / duration);
      music.volume = startingVolume * (1 - progress);
      if (progress < 1) {
        musicFadeFrame = requestAnimationFrame(step);
      } else {
        music.pause();
        music.currentTime = 0;
        musicFadeFrame = null;
      }
    }

    musicFadeFrame = requestAnimationFrame(step);
  }

  function revealMenu() {
    if (phase !== "logo") return;
    phase = "menu";
    sequence.className = "ending-sequence menu-transition";
    showMenu();
    void sequence.offsetWidth;
    requestAnimationFrame(() => sequence.classList.add("revealing-menu"));
    later(() => stopGoodEndingSequence(), 950);
  }

  function showEndingLogo() {
    if (phase !== "credits-fade") return;
    phase = "logo";
    sequence.className = "ending-sequence logo-stage logo-visible";
    later(() => {
      if (phase !== "logo") return;
      sequence.classList.remove("logo-visible");
      sequence.classList.add("logo-fading");
      fadeOutEndingMusic(850);
      later(revealMenu, 900);
    }, 7000);
  }

  function finishCredits() {
    if (phase !== "credits") return;
    phase = "credits-fade";
    cancelCreditHold(false);
    creditVideo.pause();
    skipHint.setAttribute("aria-hidden", "true");
    showEndingLogo();
  }

  function updateCreditHold(now) {
    if (phase !== "credits" || !holdStartedAt) return;
    const progress = Math.min(1, (now - holdStartedAt) / holdDuration);
    skipHint.style.setProperty("--skip-progress", `${progress * 100}%`);
    if (progress >= 1) {
      holdFrame = null;
      finishCredits();
      return;
    }
    holdFrame = requestAnimationFrame(updateCreditHold);
  }

  function startCreditHold(event) {
    if (phase !== "credits" || event.code !== "Space" || event.repeat || holdStartedAt) return;
    event.preventDefault();
    holdStartedAt = performance.now();
    skipHint.classList.add("holding");
    holdFrame = requestAnimationFrame(updateCreditHold);
  }

  function stopCreditHold(event) {
    if (event.code !== "Space") return;
    if (phase === "credits") event.preventDefault();
    cancelCreditHold();
  }

  function revealCreditVideo() {
    if (phase !== "credits-ready") return;
    phase = "credits";
    creditMusicStartHandler = null;
    sequence.className = "ending-sequence credit-playing";
    skipHint.setAttribute("aria-hidden", "false");
    const playRequest = creditVideo.play();
    if (playRequest?.catch) playRequest.catch(() => finishCredits());
  }

  function startCredits() {
    if (phase !== "happy-fade") return;
    phase = "credits-ready";
    resetVideo(happyVideo);
    resetVideo(creditVideo);
    sequence.className = "ending-sequence credit-ready";
    creditMusic.currentTime = 0;
    creditMusic.volume = getEffectiveMainVolume() * 0.42;
    creditMusicStartHandler = revealCreditVideo;
    creditMusic.addEventListener("playing", creditMusicStartHandler, { once: true });
    const musicPlayRequest = creditMusic.play();
    if (musicPlayRequest?.then) {
      musicPlayRequest.then(revealCreditVideo).catch(() => {
        if (creditMusicStartHandler) {
          creditMusic.removeEventListener("playing", creditMusicStartHandler);
          creditMusicStartHandler = null;
        }
        revealCreditVideo();
      });
    }
  }

  function beginHappyFade() {
    if (phase !== "happy") return;
    phase = "happy-fade";
    if (happyMonitorFrame) cancelAnimationFrame(happyMonitorFrame);
    happyMonitorFrame = null;
    sequence.classList.remove("happy-visible");
    sequence.classList.add("happy-fading");
    later(startCredits, 900);
  }

  function monitorHappyVideo() {
    if (phase !== "happy") return;
    const duration = happyVideo.duration;
    if (Number.isFinite(duration) && duration > 0 && duration - happyVideo.currentTime <= 0.8) {
      happyMonitorFrame = null;
      beginHappyFade();
      return;
    }
    happyMonitorFrame = requestAnimationFrame(monitorHappyVideo);
  }

  function finishHappyVideo() {
    if (phase !== "happy") return;
    const duration = happyVideo.duration;
    if (Number.isFinite(duration) && duration > 1.1) {
      happyVideo.currentTime = duration - 1.1;
      happyVideo.play().catch(() => { });
    }
    beginHappyFade();
  }

  function handleHappyVideoError() {
    beginHappyFade();
  }

  function handleVisibilityChange() {
    if (document.hidden) return;
    if (["happy", "happy-fade"].includes(phase) && happyVideo.paused && !happyVideo.ended) {
      happyVideo.play().catch(() => { });
    }
    if (phase === "credits-ready" && creditMusic.paused) creditMusic.play().catch(() => revealCreditVideo());
    if (phase === "credits") {
      if (creditMusic.paused) creditMusic.play().catch(() => { });
      if (creditVideo.paused) creditVideo.play().catch(() => { });
    }
  }

  happyVideo.addEventListener("ended", finishHappyVideo);
  happyVideo.addEventListener("error", handleHappyVideoError);
  creditVideo.addEventListener("ended", finishCredits);
  creditVideo.addEventListener("error", finishCredits);
  window.addEventListener("keydown", startCreditHold);
  window.addEventListener("keyup", stopCreditHold);
  window.addEventListener("blur", cancelCreditHold);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  activeEndingCleanup = () => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    cancelCreditHold();
    if (happyMonitorFrame) cancelAnimationFrame(happyMonitorFrame);
    happyMonitorFrame = null;
    if (musicFadeFrame) cancelAnimationFrame(musicFadeFrame);
    musicFadeFrame = null;
    resetVideo(happyVideo);
    resetVideo(creditVideo);
    if (creditMusicStartHandler) creditMusic.removeEventListener("playing", creditMusicStartHandler);
    creditMusicStartHandler = null;
    happyVideo.removeEventListener("ended", finishHappyVideo);
    happyVideo.removeEventListener("error", handleHappyVideoError);
    creditVideo.removeEventListener("ended", finishCredits);
    creditVideo.removeEventListener("error", finishCredits);
    window.removeEventListener("keydown", startCreditHold);
    window.removeEventListener("keyup", stopCreditHold);
    window.removeEventListener("blur", cancelCreditHold);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    sequence.className = "ending-sequence hidden";
    sequence.setAttribute("aria-hidden", "true");
    skipHint.setAttribute("aria-hidden", "true");
    document.body.classList.remove("ending-open");
  };

  resetVideo(happyVideo);
  resetVideo(creditVideo);
  sequence.className = "ending-sequence happy-stage";
  sequence.setAttribute("aria-hidden", "false");
  document.body.classList.add("ending-open");
  happyVideo.playbackRate = 0.8;
  const playRequest = happyVideo.play();
  if (playRequest?.catch) playRequest.catch(() => handleHappyVideoError());
  void sequence.offsetWidth;
  requestAnimationFrame(() => sequence.classList.add("happy-visible"));
  happyMonitorFrame = requestAnimationFrame(monitorHappyVideo);
}

function finishLevel5Ending() {
  state.ended = true;
  state.endingGood = true;
  saveGame();
  hidePrologue();
  prologueMode = "opening";
  prologueIndex = 0;
  el.prologueSkip.hidden = false;
  startGoodEndingSequence();
}
