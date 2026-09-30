/* Perhitungan dan render HP. */

function cloneState() {
  return JSON.parse(JSON.stringify(state));
}

function clampHpUnits(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(maxHpUnits, Math.round(numeric))) : maxHpUnits;
}

function getHealthState(hpUnits = state.hpUnits) {
  const totalHp = clampHpUnits(hpUnits);
  const chances = totalHp > 0 ? Math.ceil(totalHp / hpUnitsPerChance) : 0;
  const activeHp = totalHp > 0 ? ((totalHp - 1) % hpUnitsPerChance) + 1 : 0;
  const groups = Array.from({ length: maxChances }, (_, groupIndex) => (
    Math.max(0, Math.min(hpUnitsPerChance, totalHp - groupIndex * hpUnitsPerChance))
  ));

  return { totalHp, chances, activeHp, groups };
}

function calculateHpDamage(hpUnits, requestedDamage) {
  const before = getHealthState(hpUnits);
  const numericDamage = Number(requestedDamage);
  const damage = Math.max(
    1,
    Math.min(maxHpUnits, Number.isFinite(numericDamage) ? Math.round(numericDamage) : 1)
  );
  const after = getHealthState(before.totalHp - damage);

  return {
    before,
    after,
    damage: before.totalHp - after.totalHp,
    chancesLost: before.chances - after.chances
  };
}

function syncLegacyLives() {
  const health = getHealthState();
  state.hpUnits = health.totalHp;
  state.lives = health.chances;
}

function formatHpUnits(units) {
  return String(clampHpUnits(units));
}

function formatHpValue() {
  return formatHpUnits(state.hpUnits);
}

function getHealthBarMarkup() {
  const health = getHealthState();
  const fillPercent = Math.round((health.activeHp / hpUnitsPerChance) * 100);
  const barState = health.activeHp <= 1 ? "danger" : health.activeHp === 2 ? "warning" : "full";
  return `<span class="hp-label">HP</span>
    <span class="hp-bar-track ${barState}" aria-hidden="true">
      <i class="hp-bar-fill" style="--hp-fill:${fillPercent}%"></i>
    </span>
    <small class="hp-chances" title="Kesempatan tersisa"><b>&times;</b>${health.chances}</small>`;
}

function renderHealthInto(target) {
  if (!target) return;
  const health = getHealthState();
  target.innerHTML = getHealthBarMarkup();
  target.dataset.hp = String(health.totalHp);
  target.dataset.activeHp = String(health.activeHp);
  target.dataset.chances = String(health.chances);
  target.setAttribute(
    "aria-label",
    `HP aktif Raka ${health.activeHp} dari ${hpUnitsPerChance}, ${health.chances} kesempatan tersisa`
  );
}

function showChanceLostAlert(healthResult) {
  if (!healthResult || healthResult.chancesLost <= 0) return;
  document.getElementById("chanceLostAlert")?.remove();

  const remaining = healthResult.after.chances;
  const alert = document.createElement("div");
  alert.id = "chanceLostAlert";
  alert.className = `chance-lost-alert ${remaining <= 0 ? "game-over" : ""}`.trim();
  alert.setAttribute("role", "alert");
  alert.setAttribute("aria-live", "assertive");
  alert.innerHTML = remaining > 0
    ? `<strong>KESEMPATAN BERKURANG</strong><span>Sisa kesempatan <b>&times;${remaining}</b> &middot; HP aktif ${healthResult.after.activeHp}/${hpUnitsPerChance}</span>`
    : "<strong>SEMUA KESEMPATAN HABIS</strong><span>HP Raka telah kosong.</span>";
  document.body.appendChild(alert);
  window.setTimeout(() => alert.remove(), 3200);
}

function renderAllHealthBars() {
  syncLegacyLives();
  renderHealthInto(el.hubHealth);
  renderHealthInto(el.sideHealth);
  renderHealthInto(el.panelHealth);
  renderHealthInto(document.getElementById("levelHealth"));
  renderHealthInto(document.getElementById("dodgeHealth"));
  if (el.lives) el.lives.textContent = state.lives;
  if (el.sideLives) el.sideLives.textContent = state.lives;
}
