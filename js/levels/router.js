/* Pengarah Trial berdasarkan level aktif. */

function startTrial() {
  const index = state.current;
  if (state.completed.includes(index)) {
    playErrorSound();
    openLevelIntro(index);
    return;
  }
  // Pengaman pusat: tombol atau event lama apa pun tidak boleh langsung
  // membuka Trial of Light sebelum urutan pintu -> kaca selesai.
  if (index === 2 && !isLightTrialUnlocked()) {
    showLightDeniedPopup();
    return;
  }
  if (index === 3 && !isHeritageTrialUnlocked()) {
    showHeritageDeniedPopup();
    return;
  }
  if (index === 0) fireTrial();
  if (index === 1) natureTrial();
  if (index === 2) lightTrial();
  if (index === 3) heritageTrial();
  if (index === 4) soundTrial();
}
