const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const mapCss = fs.readFileSync(path.join(root, "css/map.css"), "utf8");
const levelsCss = fs.readFileSync(path.join(root, "css/levels.css"), "utf8");
const dataSource = fs.readFileSync(path.join(root, "js/core/data.js"), "utf8");
const level5Source = fs.readFileSync(path.join(root, "js/levels/level-5-survival.js"), "utf8");

for (const asset of [
  "bg_level_3_tertutup_new.png",
  "bg_level4_tertutup_fixbanget.png",
  "goa_1_new.png"
]) {
  assert.match(mapCss, new RegExp(asset.replace(/[().]/g, "\\$&")));
  assert.match(dataSource, new RegExp(asset.replace(/[().]/g, "\\$&")));
}
assert.match(levelsCss, /gua\(2\)_new\.png/);
assert.match(dataSource, /gua\(2\)_new\.png/);
assert.match(levelsCss, /batu_kecil\.png/);
assert.match(levelsCss, /batu_sedang\.png/);
assert.match(levelsCss, /batu_besar\.png/);
assert.doesNotMatch(levelsCss, /debu_reruntuhan\.png/);
assert.match(levelsCss, /\.dodge-hud\s*>\s*span/);
assert.match(levelsCss, /\.dodge-raka\s*\{[\s\S]*?width:\s*clamp\(104px,\s*11vw,\s*150px\)/);
assert.match(mapCss, /goa_1_new\.png[^;]*\/\s*100%\s+100%\s+no-repeat/);
assert.match(level5Source, /const trialGroundY = 72/);
assert.match(level5Source, /const exitGroundY = 72/);
assert.match(level5Source, /const exitMoveSpeed = 0\.014/);

function makeClassList(initial = []) {
  const values = new Set(initial);
  return {
    add(...names) { names.forEach((name) => values.add(name)); },
    remove(...names) { names.forEach((name) => values.delete(name)); },
    toggle(name, force) {
      if (force === true) values.add(name);
      else if (force === false) values.delete(name);
      else if (values.has(name)) values.delete(name);
      else values.add(name);
    },
    contains(name) { return values.has(name); }
  };
}

function makeElement() {
  return {
    className: "",
    classList: makeClassList(),
    dataset: {},
    style: {
      left: "",
      top: "",
      width: "",
      height: "",
      transform: "",
      setProperty(name, value) { this[name] = value; }
    },
    textContent: "",
    clientWidth: 1900,
    offsetWidth: 1900,
    removed: false,
    children: [],
    appendChild(child) { this.children.push(child); },
    remove() { this.removed = true; },
    focus() {},
    setAttribute(name, value) { this[name] = value; },
    getBoundingClientRect() { return { width: 96 }; }
  };
}

const arena = makeElement();
const player = makeElement();
const layer = makeElement();
const timeLabel = makeElement();
const health = makeElement();
const warning = makeElement();
const feedback = makeElement();
const elements = {
  dodgeGame: arena,
  dodgeRaka: player,
  dodgeLayer: layer,
  dodgeTime: timeLabel,
  dodgeHealth: health,
  dodgeWarning: warning
};

let capturedMarkup = "";
let completedOptions = null;
let endingStarted = 0;
let now = 0;
let rafId = 0;
const rafCallbacks = new Map();
let timerId = 0;
const timers = new Map();
const windowHandlers = new Map();

const customMath = Object.create(Math);
customMath.random = () => 0.99;

const context = vm.createContext({
  console,
  Math: customMath,
  state: { completed: [], lives: 3 },
  activeDodgeCleanup: null,
  rakaFrames: { torch: "torch.png", walk1: "walk.png" },
  rakaAnimation: { referenceWidth: 96 },
  el: {
    settingsOverlay: { classList: makeClassList(["hidden"]) },
    pauseOverlay: { classList: makeClassList(["hidden"]) },
    confirmOverlay: { classList: makeClassList(["hidden"]) },
    sideHealth: makeElement()
  },
  document: {
    getElementById(id) { return elements[id] || null; },
    querySelector(selector) { return selector === ".feedback" ? feedback : null; },
    createElement() { return makeElement(); }
  },
  window: {
    addEventListener(name, handler) { windowHandlers.set(name, handler); },
    removeEventListener(name) { windowHandlers.delete(name); }
  },
  performance: { now() { return now; } },
  requestAnimationFrame(callback) {
    rafId += 1;
    rafCallbacks.set(rafId, callback);
    return rafId;
  },
  cancelAnimationFrame(id) { rafCallbacks.delete(id); },
  setTimeout(callback) {
    timerId += 1;
    timers.set(timerId, callback);
    return timerId;
  },
  clearTimeout(id) { timers.delete(id); },
  openModal(kicker, title, text, markup) { capturedMarkup = markup; },
  getHealthBarMarkup() { return "<span>HP</span>"; },
  resolveAssetPath(value) { return value; },
  getRakaWalkFrame() { return "walk1"; },
  getScaledRakaFootOffset() { return 0; },
  getRakaWalkCycleDuration() { return 600; },
  playTone() {},
  playSuccessSound() {},
  playPuzzleSuccessSound() {},
  playFallingRockSound() {},
  playCountdownTick() {},
  fail() {},
  renderHealthInto() {},
  completeTrial(message, options) { completedOptions = options; },
  showLevel5EndingCutscene() { endingStarted += 1; }
});

context.stopDodgeTrial = () => {
  if (!context.activeDodgeCleanup) return;
  const cleanup = context.activeDodgeCleanup;
  context.activeDodgeCleanup = null;
  cleanup();
};

const source = fs.readFileSync(path.join(root, "js/levels/level-5-survival.js"), "utf8");
vm.runInContext(`${source}\nglobalThis.soundTrial = soundTrial;`, context, { filename: "js/levels/level-5-survival.js" });

function runNextFrame(delta = 50) {
  const entry = [...rafCallbacks.entries()][0];
  assert.ok(entry, "Frame animasi berikutnya harus tersedia");
  rafCallbacks.delete(entry[0]);
  now += delta;
  entry[1](now);
}

function runNextTimer() {
  const entry = [...timers.entries()][0];
  assert.ok(entry, "Timer transisi berikutnya harus tersedia");
  timers.delete(entry[0]);
  entry[1]();
}

context.soundTrial();
assert.doesNotMatch(capturedMarkup, /dodge-cave-depth|dodge-path/);
assert.match(capturedMarkup, /dodge-transition-fade/);
assert.match(capturedMarkup, /TRIAL SELESAI/);

// Lewati 25 detik tanpa terkena batu untuk memicu fade penyelesaian.
let survivalFrames = 0;
while (!completedOptions && survivalFrames < 520) {
  runNextFrame();
  survivalFrames += 1;
}
assert.deepEqual(JSON.parse(JSON.stringify(completedOptions)), { deferReward: true });
assert.equal(arena.classList.contains("mission-cleared"), true);
assert.equal(arena.classList.contains("fade-out"), true);
assert.equal(endingStarted, 0);

// Fade selesai: background yang sama berubah menjadi fase berjalan ke kanan.
runNextTimer();
assert.equal(arena.classList.contains("exit-walk"), true);
assert.equal(arena.classList.contains("fade-out"), false);
assert.match(warning.textContent, /pintu goa di kanan/i);

windowHandlers.get("keydown")({ key: "d", preventDefault() {} });
for (let index = 0; index < 120 && !arena.classList.contains("cave-exit-arrived"); index += 1) {
  runNextFrame();
}
assert.equal(arena.classList.contains("cave-exit-arrived"), true);
assert.equal(arena.classList.contains("fade-out"), true);
assert.equal(player.style.left, "81%");
assert.equal(endingStarted, 0);

// Pertemuan Nenek baru dimulai sesudah fade pada pintu selesai.
runNextTimer();
assert.equal(endingStarted, 1);

console.log("Level 5 flow valid: survival -> same-background fade -> walk right -> Grandma cutscene.");
