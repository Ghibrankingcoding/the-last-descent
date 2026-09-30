const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const lightCollectibles = Array.from({ length: 5 }, (_, index) => ({
  name: `Pecahan Kaca ${index + 1}`,
  x: 400 + index * 200,
  asset: `glass-${index + 1}.png`
}));

const classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
let trialStarts = 0;
let deniedPopups = 0;
let lastDialog = "";

const context = vm.createContext({
  console,
  currentLightDoorFlowVersion: 2,
  currentHeritageDoorFlowVersion: 2,
  trials: Array.from({ length: 5 }, (_, index) => ({ name: `Trial ${index + 1}` })),
  sideAreas: Array.from({ length: 5 }, (_, index) => ({
    name: `Area ${index + 1}`,
    object: `Pintu ${index + 1}`,
    popup: "Uji pintu"
  })),
  sideWorld: { houseRouteWidth: 3200, playerHeight: 54 },
  maxChances: 3,
  hpUnitsPerChance: 3,
  lightCollectibles,
  heritageCollectibles: [],
  clampHpUnits(value) { return Math.max(0, Math.min(9, Number(value) || 0)); },
  syncLegacyLives() {},
  getSideGroundY() { return 500; },
  getSideWorldWidth() { return 3200; },
  getSideCoordinateScale() { return 1; },
  getSideAreaStartX() { return 120; },
  playSuccessSound() {},
  playAdventureHit() {},
  playErrorSound() {},
  playItemPickupSound() {},
  playObjectInteractionSound() {},
  saveGame() {},
  updateSideArea() {},
  showRakaDialog(message) { lastDialog = message; },
  openModal() { deniedPopups += 1; },
  closeModal() {},
  closeWitchDialog() {},
  document: {
    getElementById() { return { addEventListener() {} }; },
    querySelectorAll() { return []; }
  },
  el: {
    mapPopup: { classList },
    mapPopupKicker: { textContent: "" },
    mapPopupTitle: { textContent: "" },
    mapPopupText: { textContent: "" },
    mapPopupStart: { textContent: "", disabled: false, onclick: null },
    mapPopupNote: { textContent: "", classList }
  },
  activeLightInteraction: null,
  activeSideTrigger: 2,
  activeWitchDialog: false,
  startTrial() { trialStarts += 1; },
  lightTrial() { trialStarts += 1; },
  fireTrial() {},
  natureTrial() {},
  heritageTrial() {},
  soundTrial() {}
});

function load(relativePath, exports) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const expose = exports.map((name) => `globalThis.${name} = ${name};`).join("\n");
  vm.runInContext(`${source}\n${expose}`, context, { filename: relativePath });
}

load("js/core/state.js", ["normalizeLoadedState"]);
load("js/levels/level-3-interactions.js", [
  "hasAllLightFragments",
  "isLightTrialUnlocked",
  "getLightInteraction",
  "useLightInteraction",
  "inspectLightDoor",
  "showLightDeniedPopup"
]);
load("js/map/movement.js", ["useSideTrialTrigger"]);
load("js/levels/router.js", ["startTrial"]);

function makeState(overrides = {}) {
  return {
    current: 2,
    mapPosition: 3,
    mapX: 13,
    mapY: 74,
    mapProgress: 0,
    sideArea: 2,
    sideX: 2800,
    sideWorldVersion: 2,
    hpUnits: 9,
    hpSystemVersion: 2,
    lives: 3,
    completed: [0, 1],
    inventory: [],
    notes: [],
    mapPieces: 2,
    housePhase: "forest",
    houseMaterials: [],
    natureMaterials: ["Serat Tumbuhan", "Kayu Jembatan"],
    natureInspected: true,
    natureBridgeCrafted: true,
    natureBridgeInstalled: true,
    lightDoorInspected: false,
    lightFragments: [],
    lightDoorPhase: "closed",
    heritageDoorInspected: false,
    heritageMaterials: [],
    heritageDoorPhase: "closed",
    ended: false,
    endingGood: null,
    ...overrides
  };
}

// Save lama yang sudah menandai pintu/kaca wajib kembali ke awal pra-misi.
context.state = makeState();
context.normalizeLoadedState(makeState({
  lightDoorInspected: true,
  lightFragments: lightCollectibles.map((item) => item.name)
}));
assert.equal(context.state.lightDoorInspected, false);
assert.deepEqual(Array.from(context.state.lightFragments), []);
assert.equal(context.state.sideX, 120);
assert.equal(context.state.lightDoorFlowVersion, 2);

// Sebelum pintu diperiksa, jalan tidak menyediakan interaksi kaca.
context.activeSideTrigger = 2;
assert.equal(context.getLightInteraction(), null);
context.startTrial();
assert.equal(trialStarts, 0);
assert.equal(deniedPopups, 1);
context.useSideTrialTrigger(2);
assert.equal(trialStarts, 0);
assert.equal(context.state.lightDoorInspected, true);
assert.deepEqual(Array.from(context.state.lightFragments), []);
assert.match(lastDialog, /tidak bisa dibuka/i);

// Sesudah pemeriksaan, kaca muncul tetapi Trial tetap terkunci sampai lengkap.
context.state.sideX = lightCollectibles[0].x;
assert.equal(context.getLightInteraction().name, "Pecahan Kaca 1");
context.useSideTrialTrigger(2);
assert.equal(trialStarts, 0);
assert.equal(deniedPopups, 2);

for (const collectible of lightCollectibles) {
  context.state.sideX = collectible.x;
  const interaction = context.getLightInteraction();
  assert.equal(interaction.name, collectible.name);
  context.useLightInteraction(interaction);
}

assert.equal(context.isLightTrialUnlocked(), true);
context.activeSideTrigger = 2;
context.useSideTrialTrigger(2);
assert.equal(trialStarts, 1);

console.log("Level 3 door flow valid: empty road -> inspect warning -> collect 5 glass -> Trial.");
