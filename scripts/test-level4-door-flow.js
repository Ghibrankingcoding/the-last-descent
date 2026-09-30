const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const heritageSource = fs.readFileSync(path.join(root, "js/levels/level-4-heritage.js"), "utf8");
const levelsCss = fs.readFileSync(path.join(root, "css/levels.css"), "utf8");
const mapCss = fs.readFileSync(path.join(root, "css/map.css"), "utf8");
const hubSource = fs.readFileSync(path.join(root, "js/map/hub.js"), "utf8");
const lightCollectibles = Array.from({ length: 5 }, (_, index) => ({
  name: `Pecahan Kaca ${index + 1}`,
  x: 300 + index * 100
}));
const heritageNames = ["Matahari", "Sungai", "Gunung", "Rumah", "Api", "Daun", "Batu", "Bulan"];
const heritageCollectibles = heritageNames.map((name, index) => ({
  name,
  x: 380 + index * 180
}));
const heritageAssets = Object.fromEntries(heritageNames.map((name) => [name, `${name}.png`]));

assert.match(levelsCss, /\.heritage-slot\s*\{[\s\S]*?border-radius:\s*50%/);
assert.doesNotMatch(heritageSource, /<\/strong><span>\$\{symbol\}<\/span>/);
assert.match(mapCss, /bg_level4_tertutup_fixbanget\.png/);
assert.match(mapCss, /bg_level4_tertutup_fixbanget\.png[^;]*\/\s*100%\s+100%\s+no-repeat/);
assert.match(hubSource, /if \(speaker === "Raka"\) stopMapMovement\(true\)/);
assert.match(hubSource, /hasRoomAbove[\s\S]*?placeOnRight/);
assert.match(hubSource, /heritageDoorPhase === "open" \? 0\.86 : 0\.86/);
assert.match(hubSource, /sideArea === 4\) return Math\.round\(sideWorld\.height \* 0\.77\)/);

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
  heritageCollectibles,
  heritageAssets,
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
  playPuzzleStepSound() {},
  saveGame() {},
  updateSideArea() {},
  updateSideTrigger() {},
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
  activeHeritageInteraction: null,
  activeSideTrigger: 3,
  activeWitchDialog: false,
  fireTrial() {},
  natureTrial() {},
  lightTrial() {},
  heritageTrial() { trialStarts += 1; },
  soundTrial() {}
});

function load(relativePath, exports) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const expose = exports.map((name) => `globalThis.${name} = ${name};`).join("\n");
  vm.runInContext(`${source}\n${expose}`, context, { filename: relativePath });
}

load("js/core/state.js", ["normalizeLoadedState"]);
load("js/levels/level-4-interactions.js", [
  "hasAllHeritageMaterials",
  "isHeritageTrialUnlocked",
  "getHeritageInteraction",
  "useHeritageInteraction",
  "inspectHeritageDoor",
  "showHeritageDeniedPopup"
]);
load("js/map/movement.js", ["useSideTrialTrigger"]);
load("js/levels/router.js", ["startTrial"]);

function makeState(overrides = {}) {
  return {
    current: 3,
    mapPosition: 4,
    mapX: 13,
    mapY: 74,
    mapProgress: 0,
    sideArea: 3,
    sideX: 2900,
    sideWorldVersion: 2,
    hpUnits: 9,
    hpSystemVersion: 2,
    lives: 3,
    completed: [0, 1, 2],
    inventory: [],
    notes: [],
    mapPieces: 3,
    housePhase: "forest",
    houseMaterials: [],
    natureMaterials: ["Serat Tumbuhan", "Kayu Jembatan"],
    natureInspected: true,
    natureBridgeCrafted: true,
    natureBridgeInstalled: true,
    lightDoorInspected: true,
    lightFragments: lightCollectibles.map((item) => item.name),
    lightDoorPhase: "open",
    lightDoorFlowVersion: 2,
    heritageDoorInspected: false,
    heritageMaterials: [],
    heritageDoorPhase: "closed",
    ended: false,
    endingGood: null,
    ...overrides
  };
}

// Save lama yang sudah memunculkan batu dikembalikan ke awal pra-misi.
context.state = makeState();
context.normalizeLoadedState(makeState({
  heritageDoorInspected: true,
  heritageMaterials: heritageNames
}));
assert.equal(context.state.heritageDoorInspected, false);
assert.deepEqual(Array.from(context.state.heritageMaterials), []);
assert.equal(context.state.sideX, 120);
assert.equal(context.state.heritageDoorFlowVersion, 2);

// Jalan kosong dan semua jalur Trial terkunci sebelum pemeriksaan pintu.
context.activeSideTrigger = 3;
assert.equal(context.getHeritageInteraction(), null);
context.startTrial();
assert.equal(trialStarts, 0);
assert.equal(deniedPopups, 1);

// Interaksi pertama di pintu hanya memberi peringatan dan mengaktifkan batu.
context.useSideTrialTrigger(3);
assert.equal(trialStarts, 0);
assert.equal(context.state.heritageDoorInspected, true);
assert.deepEqual(Array.from(context.state.heritageMaterials), []);
assert.match(lastDialog, /tidak bisa dibuka/i);

context.state.sideX = heritageCollectibles[0].x;
assert.equal(context.getHeritageInteraction().name, "Matahari");
context.useSideTrialTrigger(3);
assert.equal(trialStarts, 0);
assert.equal(deniedPopups, 2);

// Trial baru terbuka setelah seluruh delapan batu benar-benar diambil.
for (const collectible of heritageCollectibles) {
  context.state.sideX = collectible.x;
  const interaction = context.getHeritageInteraction();
  assert.equal(interaction.name, collectible.name);
  context.useHeritageInteraction(interaction);
}

assert.equal(context.isHeritageTrialUnlocked(), true);
assert.match(lastDialog, /semua batu simbol/i);
context.activeSideTrigger = 3;
context.useSideTrialTrigger(3);
assert.equal(trialStarts, 1);

console.log("Level 4 door flow valid: empty road -> inspect warning -> collect 8 stones -> Trial.");
