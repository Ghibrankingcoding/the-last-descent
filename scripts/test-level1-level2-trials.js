const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const modalCss = fs.readFileSync(path.join(root, "css/modal.css"), "utf8");
const levelsCss = fs.readFileSync(path.join(root, "css/levels.css"), "utf8");
const mapCss = fs.readFileSync(path.join(root, "css/map.css"), "utf8");
const level2Source = fs.readFileSync(path.join(root, "js/levels/level-2-nature.js"), "utf8");
const hubSource = fs.readFileSync(path.join(root, "js/map/hub.js"), "utf8");
const audioSource = fs.readFileSync(path.join(root, "js/core/audio.js"), "utf8");
const timerSource = fs.readFileSync(path.join(root, "js/ui/modal-timer.js"), "utf8");

assert.match(modalCss, /bg_level1_fix\.jpeg/);
assert.match(levelsCss, /bg_level2_fix\.jpeg/);
assert.match(levelsCss, /\.two-stage-crafting \.crafting-material\s*\{[\s\S]*?border:\s*0;[\s\S]*?background:\s*transparent/);
assert.match(levelsCss, /\.two-stage-crafting \.crafting-material span\s*\{\s*display:\s*none/);
assert.match(levelsCss, /\.two-stage-crafting \.crafting-material img\s*\{[\s\S]*?width:\s*min\(180px, 15vw\);[\s\S]*?height:\s*166px/);
assert.match(levelsCss, /\.two-stage-crafting \.crafting-materials\s*\{[\s\S]*?height:\s*250px;[\s\S]*?display:\s*block/);
assert.match(levelsCss, /\.two-stage-crafting \.crafting-material:nth-child\(1\)[\s\S]*?--loose-item-y:\s*4px;[\s\S]*?left:\s*0/);
assert.match(levelsCss, /\.two-stage-crafting \.crafting-material:nth-child\(2\)[\s\S]*?--loose-item-y:\s*112px;[\s\S]*?left:\s*12%/);
assert.match(levelsCss, /\.two-stage-crafting \.crafting-material:nth-child\(3\)[\s\S]*?left:\s*50%;[\s\S]*?translateX\(-50%\)/);
assert.match(levelsCss, /\.two-stage-crafting \.crafting-material:nth-child\(4\)[\s\S]*?--loose-item-y:\s*0;[\s\S]*?right:\s*6%/);
assert.match(levelsCss, /\.two-stage-crafting \.crafting-material\[data-tool="Percikan"\] img\s*\{\s*transform:\s*scale\(1\.75\)/);
assert.match(mapCss, /\.house-pickup\s*\{[\s\S]*?top:\s*350px/);
assert.match(levelsCss, /\.two-stage-crafting \.crafting-table-pov::after\s*\{\s*display:\s*none/);
assert.match(levelsCss, /\.two-stage-crafting \.craft-stage\s*\{[\s\S]*?border:\s*0;[\s\S]*?background:\s*transparent/);
assert.match(levelsCss, /\.craft-slot\s*\{[\s\S]*?border:\s*2px dashed/);
assert.match(hubSource, /state\.sideArea === 0 && state\.housePhase === "inside"[\s\S]*?sideWorld\.height \* 0\.84/);
assert.match(level2Source, /class="nature-choice" draggable="true"/);
assert.match(level2Source, /class="bridge-drop-slot"/);
assert.match(level2Source, /addEventListener\("dragstart"/);
assert.match(level2Source, /addEventListener\("drop"/);
assert.doesNotMatch(level2Source, /button\.addEventListener\("click"/);

for (const helper of [
  "playItemPickupSound",
  "playCraftingSound",
  "playObjectInteractionSound",
  "playPuzzleSuccessSound",
  "playPuzzleFailureSound",
  "playHazardSound",
  "playFallingRockSound",
  "playCountdownTick"
]) {
  assert.match(audioSource, new RegExp(`function ${helper}\\(`));
}

assert.match(timerSource, /playCountdownTick\(seconds\)/);
assert.match(timerSource, /closedLevel[\s\S]*?setAmbientForMap\(\)/);
assert.equal(fs.existsSync(path.join(root, "Assets TLD/background/bg_level1_fix.jpeg")), true);
assert.equal(fs.existsSync(path.join(root, "Assets TLD/background/bg_level2_fix.jpeg")), true);

console.log("Level 1/2 trial backgrounds, Level 2 drag-and-drop, SFX helpers, and music switching valid.");
