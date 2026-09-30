/* Musik, SFX, volume, dan helper audio. */

function getEffectiveMainVolume() {
  return muteAll ? 0 : mainVolume;
}

function getEffectiveSfxVolume() {
  return muteAll ? 0 : sfxVolume;
}

function syncAudioSettingsUi() {
  const mainPercent = Math.round(mainVolume * 100);
  const sfxPercent = Math.round(sfxVolume * 100);
  el.mainVolumeSlider.value = String(mainPercent);
  el.mainVolumeValue.textContent = `${mainPercent}%`;
  el.sfxVolumeSlider.value = String(sfxPercent);
  el.sfxVolumeValue.textContent = `${sfxPercent}%`;
  el.muteAllToggle.setAttribute("aria-checked", String(muteAll));
  el.muteAllValue.textContent = muteAll ? "ON" : "OFF";
  el.settingsOverlay.querySelector(".settings-box")?.classList.toggle("muted", muteAll);
}

function applyAudioVolumes() {
  const effectiveSfxVolume = getEffectiveSfxVolume();
  if (sfxMasterGain && audioContext) {
    if (typeof sfxMasterGain.gain.setTargetAtTime === "function") {
      sfxMasterGain.gain.setTargetAtTime(effectiveSfxVolume, audioContext.currentTime, 0.02);
    } else {
      sfxMasterGain.gain.value = effectiveSfxVolume;
    }
  }
  if (activeMusic) activeMusic.volume = getEffectiveMainVolume() * 0.42;
}

function setMainVolume(nextVolume) {
  mainVolume = Math.max(0, Math.min(1, Number(nextVolume) || 0));
  localStorage.setItem(mainVolumeKey, String(Math.round(mainVolume * 100)));
  syncAudioSettingsUi();
  applyAudioVolumes();
}

function setSfxVolume(nextVolume) {
  sfxVolume = Math.max(0, Math.min(1, Number(nextVolume) || 0));
  localStorage.setItem(sfxVolumeKey, String(Math.round(sfxVolume * 100)));
  syncAudioSettingsUi();
  applyAudioVolumes();
}

function setMuteAll(nextMuted) {
  muteAll = Boolean(nextMuted);
  localStorage.setItem(muteAllKey, String(muteAll));
  syncAudioSettingsUi();
  applyAudioVolumes();
}

function initAudio() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  sfxMasterGain = audioContext.createGain();
  sfxMasterGain.gain.value = getEffectiveSfxVolume();
  sfxMasterGain.connect(audioContext.destination);
}

function resumeAudio() {
  initAudio();
  if (audioContext.state === "suspended") audioContext.resume();
}

function playClip(source, clipVolume = 0.28) {
  const effectiveVolume = getEffectiveSfxVolume();
  if (effectiveVolume <= 0) return;
  const clip = new Audio(source);
  clip.volume = effectiveVolume * clipVolume;
  clip.play().catch(() => { });
}

function playTone(frequency = 440, duration = 0.12, type = "sine", gain = 0.16) {
  if (getEffectiveSfxVolume() <= 0) return;
  resumeAudio();
  const osc = audioContext.createOscillator();
  const toneGain = audioContext.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  toneGain.gain.value = 0;
  osc.connect(toneGain);
  toneGain.connect(sfxMasterGain);
  toneGain.gain.linearRampToValueAtTime(gain, audioContext.currentTime + 0.01);
  toneGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  osc.start();
  osc.stop(audioContext.currentTime + duration + 0.02);
}

function playAdventureHit(base = 220) {
  if (performance.now() - lastButtonClickSoundAt < 80) return;
  playClip(clickAssets.action, 0.2);
}

function playButtonClickSound() {
  lastButtonClickSoundAt = performance.now();
  playClip(clickAssets.action, 0.2);
}

function playSuccessSound() {
  playClip(clickAssets.success, 0.32);
}

function playErrorSound() {
  playClip(clickAssets.error, 0.3);
}

function playItemPickupSound() {
  playClip(clickAssets.success, 0.22);
  playTone(620, 0.08, "sine", 0.07);
  setTimeout(() => playTone(840, 0.1, "sine", 0.055), 55);
}

function playCraftingSound(stage = 1, complete = false) {
  playClip(clickAssets.action, 0.16);
  playTone(170 + stage * 55, 0.11, "triangle", 0.07);
  if (complete) setTimeout(() => playTone(620, 0.16, "triangle", 0.08), 80);
}

function playObjectInteractionSound() {
  playClip(clickAssets.action, 0.18);
  playTone(145, 0.1, "triangle", 0.055);
}

function playPuzzleStepSound(step = 1) {
  playTone(260 + step * 38, 0.1, "sine", 0.065);
}

function playPuzzleSuccessSound() {
  playClip(clickAssets.success, 0.32);
  playTone(440, 0.11, "sine", 0.065);
  setTimeout(() => playTone(660, 0.17, "sine", 0.07), 85);
}

function playPuzzleFailureSound() {
  playClip(clickAssets.error, 0.28);
  playTone(125, 0.18, "sawtooth", 0.055);
}

function playHazardSound() {
  playClip(clickAssets.error, 0.34);
  playTone(72, 0.24, "sawtooth", 0.08);
}

function playFallingRockSound(size = "medium") {
  const frequency = { small: 112, medium: 88, large: 64 }[size] || 88;
  playTone(frequency, 0.12, "triangle", 0.04);
}

function playCountdownTick(seconds) {
  const urgent = Number(seconds) <= 10;
  playTone(urgent ? 760 : 520, urgent ? 0.075 : 0.045, "square", urgent ? 0.045 : 0.022);
}

function setAmbient(kind, loop = true, autoplay = true) {
  if (currentAmbient === kind && activeMusic) {
    activeMusic.loop = loop;
    if (autoplay && activeMusic.paused) activeMusic.play().catch(() => { });
    return activeMusic;
  }
  currentAmbient = kind;
  if (activeMusic) {
    activeMusic.pause();
    activeMusic.currentTime = 0;
  }
  activeMusic = new Audio(musicAssets[kind] || musicAssets.menu);
  activeMusic.loop = loop;
  activeMusic.volume = getEffectiveMainVolume() * 0.42;
  if (autoplay) activeMusic.play().catch(() => { });
  return activeMusic;
}

function stopAmbient() {
  if (activeMusic) {
    activeMusic.pause();
    activeMusic.currentTime = 0;
  }
  activeMusic = null;
  currentAmbient = "";
}

function setAmbientForLevel() {
  const ambients = ["fire", "nature", "light", "heritage", "sound"];
  setAmbient(ambients[state.current] || "menu");
}

function setAmbientForMap() {
  setAmbient("travel");
}
