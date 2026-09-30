/* Gameplay Level 4 - Trial of Heritage. */

function heritageTrial() {
  if (state.completed.includes(3)) return;
  if (!isHeritageTrialUnlocked()) {
    showHeritageDeniedPopup(state.heritageMaterials.length);
    return;
  }
  const symbols = heritageCollectibles.map((item) => ({ name: item.name }));
  const placed = new Set();
  openModal(
    "Lembah Batu Kuno",
    "Trial of Heritage",
    "Seret simbol leluhur ke batu ukir yang cocok untuk membuka jalan kuno.",
    `<div class="level-hud">
      <span>Level 4</span>
      <strong>Lembah Batu Kuno</strong>
      <span>Trial of Heritage</span>
    </div>
    <div class="heritage-drag-level">
      <div class="round-stone">
        <div class="heritage-slots">
          ${symbols.map((s, i) => `<div class="heritage-slot slot-${i + 1}" data-target="${s.name}"><span>${s.name}</span></div>`).join("")}
        </div>
        <div class="stone-core">8 SIMBOL</div>
      </div>
      <div class="heritage-tokens">
          ${symbols
      .slice()
      .sort(() => Math.random() - 0.5)
      .map((s) => `<button class="heritage-token" draggable="true" data-symbol="${s.name}" aria-label="Seret batu simbol ${s.name} ke ukiran yang cocok" title="Seret ke ukiran yang cocok">
            <img src="${heritageAssets[s.name]}" alt="${s.name}" />
          </button>`)
      .join("")}
      </div>
    </div>
    <p class="feedback">Drag 8 simbol ke placeholder yang cocok. Kesalahan mengurangi waktu 4 detik; HP hanya berkurang 2 bar jika waktu habis.</p>`,
    "level-screen heritage-level"
  );
  const feedback = document.querySelector(".feedback");

  function placeSymbol(symbol, token, slot) {
    if (slot.dataset.target !== symbol) {
      slot.classList.add("wrong");
      setTimeout(() => slot.classList.remove("wrong"), 400);
      applyMissionTimePenalty(4, "Simbol itu tidak cocok dengan batu ukirnya.");
      return;
    }
    if (placed.has(symbol)) return;
    placed.add(symbol);
    playPuzzleStepSound(placed.size);
    slot.classList.add("filled");
    slot.innerHTML = `<strong><img src="${heritageAssets[symbol]}" alt="${symbol}" /></strong>`;
    token.disabled = true;
    token.classList.add("used");
    feedback.textContent = `${placed.size}/8 simbol leluhur sudah cocok.`;
    if (placed.size === symbols.length) completeTrial("Batu ukir kuno terbuka setelah semua simbol leluhur tersusun.");
  }

  document.querySelectorAll(".heritage-token").forEach((token) => {
    token.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", token.dataset.symbol);
    });
  });

  document.querySelectorAll(".heritage-slot").forEach((slot) => {
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("ready");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("ready"));
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      slot.classList.remove("ready");
      const symbol = event.dataTransfer.getData("text/plain");
      const token = document.querySelector(`.heritage-token[data-symbol="${symbol}"]`);
      if (token && !token.disabled) placeSymbol(symbol, token, slot);
    });
  });
  startMissionTimer(3, 30);
}
