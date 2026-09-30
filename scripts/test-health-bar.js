const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

let appendedAlert = null;
let scheduledRemoval = null;
const context = vm.createContext({
  console,
  state: { hpUnits: 9, lives: 3 },
  hpUnitsPerChance: 3,
  maxChances: 3,
  maxHpUnits: 9,
  el: {},
  document: {
    getElementById() { return null; },
    createElement() {
      return {
        id: "",
        className: "",
        innerHTML: "",
        attributes: {},
        setAttribute(name, value) { this.attributes[name] = value; },
        remove() { this.removed = true; }
      };
    },
    body: {
      appendChild(element) { appendedAlert = element; }
    }
  },
  window: {
    setTimeout(callback) {
      scheduledRemoval = callback;
      return 1;
    }
  }
});

const source = fs.readFileSync(path.resolve(__dirname, "../js/core/health.js"), "utf8");
const healthCss = fs.readFileSync(path.resolve(__dirname, "../css/hub.css"), "utf8");
vm.runInContext(`${source}
  globalThis.getHealthState = getHealthState;
  globalThis.calculateHpDamage = calculateHpDamage;
  globalThis.getHealthBarMarkup = getHealthBarMarkup;
  globalThis.showChanceLostAlert = showChanceLostAlert;`, context, { filename: "js/core/health.js" });

assert.deepEqual(JSON.parse(JSON.stringify(context.getHealthState(9))), {
  totalHp: 9,
  chances: 3,
  activeHp: 3,
  groups: [3, 3, 3]
});
assert.equal(context.getHealthState(8).activeHp, 2);
assert.equal(context.getHealthState(7).activeHp, 1);
assert.equal(context.getHealthState(6).activeHp, 3);
assert.equal(context.getHealthState(6).chances, 2);

context.state.hpUnits = 9;
let markup = context.getHealthBarMarkup();
assert.equal((markup.match(/hp-bar-track/g) || []).length, 1);
assert.doesNotMatch(markup, /hp-chance-group|hp-unit/);
assert.match(markup, /--hp-fill:100%/);
assert.match(markup, /&times;<\/b>3/);

context.state.hpUnits = 5;
markup = context.getHealthBarMarkup();
assert.match(markup, /--hp-fill:67%/);
assert.match(markup, /&times;<\/b>2/);

const result = context.calculateHpDamage(7, 1);
assert.equal(result.chancesLost, 1);
assert.equal(result.after.chances, 2);
assert.equal(result.after.activeHp, 3);
context.showChanceLostAlert(result);
assert.equal(appendedAlert.id, "chanceLostAlert");
assert.match(appendedAlert.innerHTML, /KESEMPATAN BERKURANG/);
assert.match(appendedAlert.innerHTML, /&times;2/);
assert.equal(typeof scheduledRemoval, "function");
assert.match(healthCss, /hp-bar-track\.warning[\s\S]*?#58b342/);
assert.match(healthCss, /hp-bar-track\.danger[\s\S]*?#58b342/);
assert.match(healthCss, /body:has\(\.dodge-game\) \.chance-lost-alert[\s\S]*?bottom:\s*18px/);

console.log("Health HUD valid: one active bar, x3/x2/x1 chances, and chance-loss alert.");
