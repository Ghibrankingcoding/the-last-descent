/* Inisialisasi game dan loading screen awal. */

function generateAssetsIfMissing() {
  return true;
}

function createSvgAsset(name, svgContent) {
  return { name, svgContent };
}

function initGame() {
  generateAssetsIfMissing();
  // Detail petunjuk sengaja tertutup saat game pertama dimuat. Pemain dapat
  // membukanya sendiri melalui kontrol panah pada header Petunjuk Misi.
  if (el.mapGuide) el.mapGuide.open = false;
  syncSideWorldViewport(true);
  syncAudioSettingsUi();
  applyAudioVolumes();
  syncGameplaySettingsUi();
  applyGameplaySettings();
  syncFullscreenSetting();
  render();
  syncContinueButton();
  syncMenuVideoPlayback();
}

function waitForStartup(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function preloadStartupAsset(source) {
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
    image.src = source;
    if (image.complete) finish();
    window.setTimeout(finish, 4000);
  });
}

function setStartupProgress(value) {
  const progress = Math.max(0, Math.min(100, Math.round(value)));
  el.startupProgressBar.style.width = `${progress}%`;
  el.startupProgress.setAttribute("aria-valuenow", String(progress));

  let message = "Mempersiapkan aset permainan...";
  if (progress >= 35) message = "Memuat latar dan karakter...";
  if (progress >= 68) message = "Menyiapkan menu utama...";
  if (progress >= 100) message = "Perjalanan siap dimulai.";
  if (el.startupLoadingStatus.textContent !== message) {
    el.startupLoadingStatus.textContent = message;
  }
}

function getPreparedMenuMusic() {
  const music = setAmbient("menu", true, false);
  music.preload = "auto";
  return music;
}

function primeStartupMenuMusicFromGesture() {
  if (!document.body.classList.contains("startup-loading")) return;
  resumeAudio();
  const music = getPreparedMenuMusic();
  music.volume = 0;
  music.play().catch(() => { });
}

async function ensureStartupMenuMusic() {
  const music = getPreparedMenuMusic();
  music.currentTime = 0;
  music.volume = getEffectiveMainVolume() * 0.42;

  if (getEffectiveMainVolume() <= 0 || !music.paused) return;

  try {
    await music.play();
    return;
  } catch (error) {
    // Browser membutuhkan interaksi pengguna sebelum audio dengan suara boleh diputar.
  }

  if (!el.startupEnterPrompt) return;
  el.startupEnterPrompt.hidden = false;
  syncStartupFullscreenPrompt();

  await new Promise((resolve) => {
    const enterGame = async () => {
      // Klik "KLIK UNTUK MASUK" adalah gesture pengguna, jadi gunakan momen
      // yang sama untuk mengaktifkan fullscreen sekaligus membuka audio.
      const fullscreenRequest = setFullscreen(true);
      resumeAudio();
      music.currentTime = 0;
      music.volume = getEffectiveMainVolume() * 0.42;
      const playRequest = music.play();
      await Promise.allSettled([
        fullscreenRequest,
        playRequest?.then ? playRequest : Promise.resolve()
      ]);
      syncStartupFullscreenPrompt();
      resolve();
    };
    el.startupEnterPrompt.addEventListener("click", enterGame, { once: true });
  });

  el.startupEnterPrompt.hidden = true;
}

async function runStartupSequence() {
  if (!el.startupLoader || !el.startupBrandSplash || !el.startupGameSplash) {
    document.body.classList.remove("startup-loading");
    el.mainMenu.removeAttribute("inert");
    el.mainMenu.setAttribute("aria-hidden", "false");
    syncMenuVideoPlayback();
    return;
  }

  syncStartupFullscreenPrompt();
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const fadeDuration = reduceMotion ? 140 : 850;
  const brandHoldDuration = reduceMotion ? 1600 : 5500;
  const minimumLoadingDuration = reduceMotion ? 2200 : 6500;
  let loadedAssets = 0;

  const assetTasks = startupAssetManifest.map((source) => preloadStartupAsset(source).then(() => {
    loadedAssets += 1;
  }));
  const assetsReady = Promise.all(assetTasks);

  await waitForStartup(60);
  el.startupBrandSplash.setAttribute("aria-hidden", "false");
  el.startupBrandSplash.classList.add("is-visible");
  await waitForStartup(brandHoldDuration);
  el.startupBrandSplash.classList.remove("is-visible");
  el.startupBrandSplash.setAttribute("aria-hidden", "true");
  await waitForStartup(fadeDuration);

  el.startupGameSplash.setAttribute("aria-hidden", "false");
  el.startupGameSplash.classList.add("is-visible");
  await waitForStartup(fadeDuration);

  const loadingStartedAt = performance.now();
  while (performance.now() - loadingStartedAt < minimumLoadingDuration) {
    const elapsed = performance.now() - loadingStartedAt;
    const timeProgress = 4 + (elapsed / minimumLoadingDuration) * 90;
    const assetProgress = 4 + (loadedAssets / startupAssetManifest.length) * 12;
    setStartupProgress(Math.min(94, Math.max(timeProgress, assetProgress)));
    await waitForStartup(50);
  }

  await assetsReady;
  setStartupProgress(100);
  await waitForStartup(reduceMotion ? 220 : 620);
  await ensureStartupMenuMusic();

  el.startupGameSplash.classList.remove("is-visible");
  el.startupGameSplash.setAttribute("aria-hidden", "true");
  await waitForStartup(fadeDuration);

  el.startupLoader.hidden = true;
  document.body.classList.remove("startup-loading");
  el.mainMenu.removeAttribute("inert");
  el.mainMenu.setAttribute("aria-hidden", "false");
  syncMenuVideoPlayback();
}

function syncStartupFullscreenPrompt() {
  if (!el.startupFullscreenPrompt) return;
  const startupVisible = el.startupLoader && !el.startupLoader.hidden;
  const isFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  const waitingToEnter = el.startupEnterPrompt && !el.startupEnterPrompt.hidden;
  el.startupFullscreenPrompt.hidden = !startupVisible || isFullscreen || waitingToEnter;
}

function showProlog() {
  showPrologue();
}

function startSideScroller() {
  showMap(true);
}

function gameLoop(timestamp) {
  stepMapMovement(timestamp);
}

function updatePlayer(dt) {
  return dt;
}

function updatePhysics(dt) {
  return dt;
}

function updateCamera() {
  updateSideCamera();
}

function updateGrandma() {
  updateMapPlayerPosition();
}

function updateAreaTriggers() {
  updateSideTrigger();
}

function showMissionPopup(area) {
  const index = sideAreas.indexOf(area);
  if (index >= 0) openLevelIntro(index);
}

function hideMissionPopup() {
  hideMapPopup();
}

function failAttempt(message = "Percobaan salah. HP berkurang.") {
  fail(message);
}

function loseLife() {
  fail("HP Raka berkurang.");
}

function unlockNextArea() {
  state.current = Math.min(trials.length - 1, state.current + 1);
  saveGame();
}

function goToNextArea() {
  if (state.sideArea < sideAreas.length - 1) {
    state.sideArea += 1;
    state.sideX = getSideAreaStartX(state.sideArea);
    state.sideY = getSideGroundY() - sideWorld.playerHeight;
    state.sideVX = 0;
    state.sideVY = 0;
    saveGame();
    renderMap();
  }
}

function renderHUD() {
  render();
  updateSideArea();
}

function showGrandmaDialog(text) {
  showWitchDialog(text);
}

function resetGame() {
  reset(true);
}
