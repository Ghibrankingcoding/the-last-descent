/* Gameplay Level 5 - Trial of Survival. */

function soundTrial() {
  if (state.completed.includes(4)) return;
  openModal(
    "Goa Purba",
    "Trial of Survival",
    "Batu-batu goa runtuh dari langit-langit. Gerakkan Raka ke kiri atau kanan dan bertahan sampai jalan terdalam terbuka.",
    `<div class="level-hud">
      <span>Level 5</span>
      <strong>Goa Purba</strong>
      <span>Dodge the Falling Rocks</span>
    </div>
    <div class="dodge-game" id="dodgeGame" tabindex="0" aria-label="Arena batu jatuh">
      <div class="dodge-hud">
        <span>Waktu <strong id="dodgeTime">25</strong></span>
        <div class="health-status dodge-health" id="dodgeHealth" aria-label="HP Raka">${getHealthBarMarkup()}</div>
      </div>
      <div class="dodge-raka" id="dodgeRaka" aria-hidden="true"></div>
      <div class="dodge-layer" id="dodgeLayer"></div>
      <div class="dodge-warning" id="dodgeWarning">Hindari bayangan batu.</div>
      <div class="dodge-transition-fade" aria-hidden="true"><strong>TRIAL SELESAI</strong></div>
    </div>
    <p class="feedback">Tahan hidup sampai timer habis. Batu kecil mengurangi 1 bar, batu sedang 2 bar, dan batu besar 3 bar.</p>`,
    "level-screen sound-level dodge-level"
  );

  const arena = document.getElementById("dodgeGame");
  const player = document.getElementById("dodgeRaka");
  const layer = document.getElementById("dodgeLayer");
  const timeLabel = document.getElementById("dodgeTime");
  const livesLabel = document.getElementById("dodgeHealth");
  const warning = document.getElementById("dodgeWarning");
  const feedback = document.querySelector(".feedback");
  const keys = new Set();
  const rocks = [];
  const transitionTimers = new Set();
  const duration = 25;
  const rockSpeedMultiplier = 1.65;
  const maxActiveRocks = 10;
  let x = 50;
  const trialGroundY = 72;
  const exitGroundY = 72;
  const exitMoveSpeed = 0.014;
  const caveDoorX = 81;
  const caveDoorY = 60;
  let y = trialGroundY;
  let lastTime = performance.now();
  let elapsed = 0;
  let spawnClock = 0;
  let invulnerable = 0;
  let walkClock = 0;
  let wasWalking = false;
  let lastCountdownSecond = duration;
  let rafId = null;
  let finished = false;

  function later(callback, delay) {
    const timer = setTimeout(() => {
      transitionTimers.delete(timer);
      callback();
    }, delay);
    transitionTimers.add(timer);
    return timer;
  }

  function movePlayer(isMoving = false, horizontalDirection = 0) {
    player.style.left = `${x}%`;
    player.style.top = `${y}%`;
    if (isMoving && !wasWalking) walkClock = 0;
    const frameKey = isMoving ? getRakaWalkFrame(walkClock, true) : "torch";
    if (player.dataset.rakaFrame !== frameKey) {
      player.dataset.rakaFrame = frameKey;
      player.style.setProperty("--raka-frame", `url("${resolveAssetPath(rakaFrames[frameKey])}")`);
      const renderedWidth = player.getBoundingClientRect().width || rakaAnimation.referenceWidth;
      player.style.setProperty("--raka-frame-y", `${getScaledRakaFootOffset(frameKey, renderedWidth)}px`);
    }
    player.style.setProperty("--raka-walk-cycle", `${getRakaWalkCycleDuration(true)}ms`);
    player.classList.toggle("walking", isMoving);
    if (horizontalDirection < 0) player.classList.add("facing-left");
    if (horizontalDirection > 0) player.classList.remove("facing-left");
    wasWalking = isMoving;
  }

  function spawnRock() {
    if (rocks.length >= maxActiveRocks) return;
    const rock = document.createElement("span");
    const typeRoll = Math.random();
    const rockType = typeRoll < 0.5 ? "small" : typeRoll < 0.82 ? "medium" : "large";
    const sizeRange = rockType === "small" ? [46, 60] : rockType === "medium" ? [64, 82] : [88, 110];
    const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
    const entryX = 10 + Math.random() * 80;
    const speed = (48 + elapsed * 1.45 + Math.random() * 22) * rockSpeedMultiplier;
    const drift = (Math.random() - 0.5) * 16;
    rock.className = `falling-rock rock-${rockType}`;
    rock.style.width = `${size}px`;
    rock.style.height = `${size}px`;
    layer.appendChild(rock);
    rocks.push({ element: rock, x: entryX, y: -10, size, speed, drift, rockType });
    playFallingRockSound(rockType);
  }

  function hitRock(rock) {
    const dx = rock.x - x;
    const dy = rock.y - y;
    const rockRadius = (rock.size / Math.max(arena.clientWidth, 1)) * 100 * 0.42;
    const playerRadius = 2.25;
    const radius = Math.max(3.4, rockRadius + playerRadius);
    return Math.hypot(dx, dy * 0.82) < radius;
  }

  function showRockHitEffect(rock) {
    arena.classList.remove("hit");
    player.classList.remove("hurt");
    void arena.offsetWidth;
    arena.classList.add("hit");
    player.classList.add("hurt");

    const impact = document.createElement("span");
    impact.className = "rock-impact";
    impact.style.left = `${rock.x}%`;
    impact.style.top = `${rock.y}%`;
    arena.appendChild(impact);

    setTimeout(() => arena.classList.remove("hit"), 420);
    setTimeout(() => player.classList.remove("hurt"), 620);
    setTimeout(() => impact.remove(), 720);
  }

  function finishWin() {
    if (finished) return;
    finished = true;
    keys.clear();
    rocks.forEach((rock) => rock.element.remove());
    rocks.length = 0;
    movePlayer(false);
    timeLabel.textContent = "0";
    feedback.textContent = "Runtuhan berhenti. Jalan menuju pintu goa di sisi kanan telah terbuka.";
    completeTrial("Raka berhasil melewati runtuhan batu dan mencapai ruang terdalam goa.", { deferReward: true });
    arena.classList.add("mission-cleared", "fade-out");

    later(() => {
      x = 10;
      y = exitGroundY;
      arena.style.setProperty("--cave-bg-position", "42%");
      walkClock = 0;
      wasWalking = false;
      keys.clear();
      arena.setAttribute("aria-label", "Jalur menuju pintu goa di sisi kanan");
      warning.textContent = "Berjalan ke pintu goa di kanan. Gunakan D atau panah kanan.";
      arena.classList.add("exit-walk");
      arena.classList.remove("fade-out");
      movePlayer(false);
      lastTime = performance.now();
      finished = false;
      rafId = requestAnimationFrame(exitTick);
    }, 900);
  }

  function finishCaveExit() {
    if (finished) return;
    finished = true;
    keys.clear();
    movePlayer(false);
    warning.textContent = "Pintu goa ditemukan...";
    arena.classList.add("cave-exit-arrived", "fade-out");
    playPuzzleSuccessSound();
    later(() => {
      stopDodgeTrial();
      showLevel5EndingCutscene();
    }, 900);
  }

  function exitTick(now) {
    const delta = Math.min(50, now - lastTime);
    lastTime = now;
    if (!el.settingsOverlay.classList.contains("hidden") || !el.pauseOverlay.classList.contains("hidden") || !el.confirmOverlay.classList.contains("hidden")) {
      rafId = requestAnimationFrame(exitTick);
      return;
    }

    const movingRight = keys.has("arrowright") || keys.has("d");
    const movingLeft = keys.has("arrowleft") || keys.has("a");
    const direction = Number(movingRight) - Number(movingLeft);
    const previousX = x;
    x = Math.max(8, Math.min(caveDoorX, x + direction * delta * exitMoveSpeed));
    const exitProgress = Math.max(0, Math.min(1, (x - 8) / (caveDoorX - 8)));
    arena.style.setProperty("--cave-bg-position", `${42 + exitProgress * 58}%`);
    const climbProgress = Math.max(0, Math.min(1, (x - 58) / (caveDoorX - 58)));
    y = exitGroundY - climbProgress * (exitGroundY - caveDoorY);
    const isMoving = Math.abs(x - previousX) > 0.001;
    if (isMoving) walkClock += delta;
    else walkClock = 0;
    movePlayer(isMoving, direction);

    if (x >= caveDoorX - 0.2) {
      finishCaveExit();
      return;
    }
    rafId = requestAnimationFrame(exitTick);
  }

  function tick(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (!el.settingsOverlay.classList.contains("hidden") || !el.pauseOverlay.classList.contains("hidden") || !el.confirmOverlay.classList.contains("hidden")) {
      rafId = requestAnimationFrame(tick);
      return;
    }
    elapsed += dt;
    spawnClock += dt;
    invulnerable = Math.max(0, invulnerable - dt);

    const move = { x: 0 };
    if (keys.has("arrowleft") || keys.has("a")) move.x -= 1;
    if (keys.has("arrowright") || keys.has("d")) move.x += 1;
    const speed = 27;
    const previousX = x;
    x = Math.max(8, Math.min(92, x + move.x * speed * dt));
    y = trialGroundY;
    const isMoving = Math.abs(x - previousX) > 0.001;
    if (isMoving) walkClock += dt * 1000;
    else walkClock = 0;
    movePlayer(isMoving, move.x);

    const interval = Math.max(0.2, 0.46 - elapsed * 0.0085);
    if (spawnClock >= interval) {
      spawnClock = 0;
      spawnRock();
      if (elapsed > 6 && Math.random() < 0.45) spawnRock();
      if (elapsed > 16 && Math.random() < 0.18) spawnRock();
    }

    for (let index = rocks.length - 1; index >= 0; index -= 1) {
      const rock = rocks[index];
      rock.y += rock.speed * dt;
      rock.x += rock.drift * dt;
      rock.element.style.left = `${rock.x}%`;
      rock.element.style.top = `${rock.y}%`;
      rock.element.style.transform = `translate(-50%, -50%) rotate(${rock.y * 7}deg)`;
      if (rock.y > 112) {
        rock.element.remove();
        rocks.splice(index, 1);
        continue;
      }
      if (invulnerable <= 0 && hitRock(rock)) {
        invulnerable = 1.15;
        showRockHitEffect(rock);
        rock.element.remove();
        rocks.splice(index, 1);
        const rockDamage = { small: 1, medium: 2, large: 3 }[rock.rockType] || 1;
        const rockLabel = { small: "kecil", medium: "sedang", large: "besar" }[rock.rockType] || "kecil";
        fail(`Raka terkena batu ${rockLabel}.`, 4, rockDamage);
        renderHealthInto(livesLabel);
        renderHealthInto(el.sideHealth);
        if (state.lives <= 0) {
          finished = true;
          stopDodgeTrial();
          return;
        }
      }
    }

    const remaining = Math.max(0, Math.ceil(duration - elapsed));
    timeLabel.textContent = remaining;
    if (remaining > 0 && remaining !== lastCountdownSecond) {
      lastCountdownSecond = remaining;
      playCountdownTick(remaining);
    }
    feedback.textContent = remaining > 8
      ? "Cari ruang kosong dan jangan berdiri di bawah bayangan batu."
      : "Goa makin runtuh. Bertahan sedikit lagi!";

    if (elapsed >= duration) {
      finishWin();
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  function onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (["arrowleft", "arrowright", "a", "d"].includes(key)) {
      event.preventDefault();
      keys.add(key);
    }
  }

  function onKeyUp(event) {
    keys.delete(event.key.toLowerCase());
  }

  function onBlur() {
    keys.clear();
    walkClock = 0;
    movePlayer(false);
  }

  arena.focus();
  movePlayer();
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  activeDodgeCleanup = () => {
    if (rafId) cancelAnimationFrame(rafId);
    transitionTimers.forEach((timer) => clearTimeout(timer));
    transitionTimers.clear();
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
    rocks.forEach((rock) => rock.element.remove());
    rocks.length = 0;
    keys.clear();
  };
  rafId = requestAnimationFrame(tick);
}
