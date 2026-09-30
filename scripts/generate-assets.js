const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "assets", "generated");
fs.mkdirSync(outDir, { recursive: true });

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
<defs>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity=".25"/></filter>
<linearGradient id="gold" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#ffe09a"/><stop offset="1" stop-color="#b8752b"/></linearGradient>
<linearGradient id="violet" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#8b73d6"/><stop offset="1" stop-color="#372450"/></linearGradient>
</defs>${body}</svg>`;

const raka = (pose = "idle") => {
  const leg = pose.includes("walk_1") || pose.includes("walk_3") ? [-2, 4] : pose.includes("walk") ? [4, -2] : [0, 0];
  const arm = pose === "interact" ? -16 : pose === "hurt" ? 14 : pose.includes("walk") ? leg[1] * 1.4 : 0;
  const jump = pose === "jump" ? -8 : pose === "fall" ? 8 : 0;
  const torch = pose === "torch";
  return svg(120, 170, `
  <g filter="url(#soft)" transform="translate(0 ${jump})">
    <ellipse cx="60" cy="157" rx="28" ry="6" fill="#000" opacity=".18"/>
    <path d="M48 61c-8 6-11 25-10 51h43c1-27-3-45-12-51-6 5-14 5-21 0Z" fill="#6d4329" stroke="#2b1a12" stroke-width="3"/>
    <path d="M48 65h20l7 45H42Z" fill="#e7d2a8" opacity=".92"/>
    <path d="M44 108c-7 13-8 29-10 43h14c4-13 7-25 13-39Z" fill="#3c3330" stroke="#211816" stroke-width="3" transform="rotate(${leg[0]} 48 111)"/>
    <path d="M70 108c8 13 9 29 11 43H67c-4-13-7-25-13-39Z" fill="#3c3330" stroke="#211816" stroke-width="3" transform="rotate(${leg[1]} 70 111)"/>
    <path d="M40 71c-12 13-16 29-17 47" stroke="#bd7844" stroke-width="10" stroke-linecap="round" transform="rotate(${arm} 40 72)"/>
    <path d="M81 72c10 12 14 26 15 44" stroke="#bd7844" stroke-width="10" stroke-linecap="round" transform="rotate(${-arm} 82 72)"/>
    ${torch ? `<path d="M96 70l13 40" stroke="#74451f" stroke-width="6" stroke-linecap="round"/><path d="M98 56c18 14 10 28 2 36-9-8-17-18-2-36Z" fill="#ff7a2d"/><path d="M100 61c8 10 5 18 0 24-5-7-8-13 0-24Z" fill="#ffe36b"/>` : ""}
    <path d="M38 50c0-18 10-32 26-32s27 13 27 31-12 30-27 30S38 68 38 50Z" fill="#c98245" stroke="#2b1a12" stroke-width="3"/>
    <path d="M39 45c6-24 29-34 48-16 8 8 7 18 4 24-12-15-32-4-52-8Z" fill="#20130d"/>
    <circle cx="56" cy="53" r="3" fill="#1c120e"/><circle cx="76" cy="53" r="3" fill="#1c120e"/>
    <path d="M57 65c7 4 15 3 20-1" stroke="#6d321f" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M78 73c13 4 19 17 17 33l-17-4Z" fill="#5a321d" opacity=".85"/>
  </g>`);
};

const grandma = (pose = "idle") => svg(120, 170, `
<g filter="url(#soft)" opacity=".86">
  <ellipse cx="62" cy="145" rx="40" ry="16" fill="#7d69d6" opacity=".16"/>
  <path d="M36 55c10-22 40-30 58-4l-31-1Z" fill="#362249" stroke="#b69cf7" stroke-width="3"/>
  <circle cx="62" cy="67" r="20" fill="#d9c4af" stroke="#4d3659" stroke-width="3"/>
  <path d="M43 84c9-9 31-12 43 0l14 54H29Z" fill="url(#violet)" stroke="#20132d" stroke-width="3"/>
  <path d="M51 72c7 5 17 5 23 0" stroke="#745a50" stroke-width="3" fill="none" stroke-linecap="round"/>
  ${pose.includes("point_right") ? `<path d="M86 92c17-4 24-10 33-20" stroke="#d9c4af" stroke-width="8" stroke-linecap="round"/>` : ""}
  ${pose.includes("point_up") ? `<path d="M86 92c12-18 14-28 13-42" stroke="#d9c4af" stroke-width="8" stroke-linecap="round"/>` : ""}
  ${pose.includes("point_down") ? `<path d="M86 92c18 8 20 20 22 34" stroke="#d9c4af" stroke-width="8" stroke-linecap="round"/>` : ""}
  ${pose.includes("warning") ? `<path d="M93 66l18-24M111 42l8 18" stroke="#ffcf6d" stroke-width="6" stroke-linecap="round"/>` : ""}
  ${pose.includes("magic") || pose.includes("talk") ? `<circle cx="96" cy="86" r="18" fill="#b69cf7" opacity=".25"/><path d="M84 86h24M96 74v24" stroke="#d8c7ff" stroke-width="4"/>` : ""}
  <path d="M24 98c10 18 67 18 78 0" fill="none" stroke="#b69cf7" stroke-width="2" opacity=".55"/>
</g>`);

const bg = (kind) => {
  const palettes = {
    start: ["#445069", "#7e9ca5", "#486842"],
    house: ["#5e75a5", "#9fc3d7", "#5c8f58"],
    forest: ["#1c3541", "#315342", "#19391f"],
    river: ["#5f8fc9", "#92d8f2", "#477e68"],
    heritage: ["#6e6d83", "#8a7f68", "#4e493f"],
    cave: ["#141118", "#24202a", "#0b0a0d"]
  };
  const p = palettes[kind] || palettes.house;
  return svg(2400, 720, `
  <rect width="2400" height="720" fill="${p[0]}"/>
  <path d="M0 420 260 170 540 420Z M420 430 760 120 1120 430Z M1220 430 1580 150 2000 430Z" fill="${p[1]}" opacity=".45"/>
  <path d="M0 470C420 390 740 470 1120 420S1780 390 2400 450v270H0Z" fill="${p[2]}"/>
  ${kind === "forest" ? `<g fill="#0f2d1d"><circle cx="330" cy="330" r="135"/><circle cx="910" cy="300" r="150"/><circle cx="1610" cy="325" r="140"/></g>` : ""}
  ${kind === "river" ? `<rect x="1480" y="150" width="260" height="510" fill="#d9fbff" opacity=".65"/><path d="M560 590h900v130H560z" fill="#287ea8" opacity=".8"/>` : ""}
  ${kind === "heritage" ? `<g fill="#5b564c"><rect x="340" y="330" width="84" height="260"/><rect x="1280" y="290" width="95" height="300"/><rect x="1700" y="350" width="75" height="240"/></g>` : ""}
  ${kind === "cave" ? `<ellipse cx="1620" cy="380" rx="350" ry="220" fill="#050505" opacity=".65"/><g fill="#312d31"><path d="M160 0l60 170 70-170Z"/><path d="M820 0l65 190 84-190Z"/><path d="M1860 0l80 210 90-210Z"/></g>` : ""}
  <rect y="588" width="2400" height="132" fill="#7d5b39" opacity=".9"/>
  <rect y="588" width="2400" height="22" fill="#3eba55"/>
  `);
};

const obj = (kind) => svg(180, 180, `
<g filter="url(#soft)" stroke="#2b211a" stroke-width="4" stroke-linejoin="round">
${kind.includes("house") ? `<path d="M25 85 90 35l66 50v70H25Z" fill="#7b4f2e"/><path d="M14 88 90 22l78 66Z" fill="#9b4030"/><rect x="75" y="108" width="34" height="47" fill="#3b281d"/><rect x="40" y="102" width="28" height="25" fill="#ffd36e"/>` : ""}
${kind.includes("tree") || kind.includes("fiber") ? `<rect x="78" y="70" width="28" height="90" fill="#70421f"/><circle cx="92" cy="58" r="52" fill="#1e8241"/><circle cx="55" cy="84" r="34" fill="#2da454"/><circle cx="130" cy="84" r="38" fill="#2c9a50"/>` : ""}
${kind.includes("root") ? `<path d="M18 122C60 70 116 72 162 113" fill="none" stroke="#70421f" stroke-width="24" stroke-linecap="round"/>` : ""}
${kind.includes("stone") ? `<ellipse cx="90" cy="115" rx="58" ry="34" fill="#7a7165"/><path d="M58 106c18-17 42-22 66-5" fill="none" stroke="#a69d90"/>` : ""}
${kind.includes("waterfall") ? `<rect x="64" y="16" width="52" height="138" rx="20" fill="#b9f3ff"/><path d="M52 132c28 16 54 16 82 0" fill="none" stroke="#4abbd5" stroke-width="12"/>` : ""}
${kind.includes("crystal") ? `<path d="M90 22 130 86 106 156H74L50 86Z" fill="#85daff"/><path d="M90 22v134" stroke="#e6fbff"/>` : ""}
${kind.includes("altar") ? `<path d="M40 118h100l18 42H22Z" fill="#6b6255"/><rect x="58" y="70" width="64" height="48" rx="8" fill="#7c7466"/><circle cx="90" cy="94" r="18" fill="#f2b84b" opacity=".45"/>` : ""}
${kind.includes("gate") ? `<path d="M35 160V82c0-42 26-65 55-65s55 23 55 65v78Z" fill="#3a3430"/><ellipse cx="90" cy="100" rx="38" ry="52" fill="#080708"/>` : ""}
${kind.includes("table") ? `<rect x="35" y="82" width="110" height="22" rx="6" fill="#8b5b31"/><path d="M52 104v52M128 104v52" stroke="#5b351f" stroke-width="10"/>` : ""}
</g>`);

const icon = (kind) => svg(96, 96, `
<g filter="url(#soft)" stroke="#2a211a" stroke-width="3" stroke-linejoin="round">
${kind.includes("cloth") ? `<path d="M20 22c20 10 36-8 56 2v52c-20-10-36 8-56-2Z" fill="#c9b3a1"/>` : ""}
${kind.includes("oil") ? `<path d="M38 12h20l4 18c12 8 18 20 18 34 0 18-13 28-32 28S16 82 16 64c0-14 10-28 18-34Z" fill="#a96a2d"/><path d="M42 42c12 14 10 24 0 34" stroke="#ffd06d"/>` : ""}
${kind.includes("spark") ? `<path d="M48 8 58 38 88 48 58 58 48 88 38 58 8 48 38 38Z" fill="#ffd75a"/>` : ""}
${kind.includes("water") || kind.includes("river") ? `<path d="M48 8c22 28 30 42 30 58 0 17-13 26-30 26s-30-9-30-26c0-16 8-30 30-58Z" fill="#55c8df"/>` : ""}
${kind.includes("stone") || kind.includes("rock") ? `<path d="M16 58 32 28l38-8 18 36-24 28H28Z" fill="#7a7165"/>` : ""}
${kind.includes("soil") ? `<ellipse cx="48" cy="60" rx="34" ry="20" fill="#8b623a"/><circle cx="36" cy="54" r="5" fill="#b58a5a"/>` : ""}
${kind.includes("torch") ? `<path d="M43 38h10v48H43Z" fill="#7b4a25"/><path d="M48 8c18 15 14 29 2 40-12-9-19-20-2-40Z" fill="#ff7a2d"/><path d="M50 18c8 10 5 18 0 24-5-7-8-13 0-24Z" fill="#ffe36b"/>` : ""}
${kind.includes("fiber") || kind.includes("leaf") ? `<path d="M16 62c34-44 56-44 64-38-6 30-26 48-64 38Z" fill="#4ebc67"/><path d="M20 60c22-8 38-20 56-34" stroke="#22763c"/>` : ""}
${kind.includes("twist") ? `<path d="M20 28c28 28 28 12 56 40M20 68c28-28 28-12 56-40" fill="none" stroke="#c99655" stroke-width="10" stroke-linecap="round"/>` : ""}
${kind.includes("pull") || kind.includes("rope") ? `<circle cx="48" cy="48" r="26" fill="none" stroke="#c99655" stroke-width="10"/><path d="M22 68 74 28" stroke="#7b4f2b" stroke-width="6"/>` : ""}
${kind.includes("crystal") || kind.includes("mirror") ? `<path d="M48 8 74 36 62 88H34L22 36Z" fill="#85daff"/><path d="M48 8v80" stroke="#e6fbff"/>` : ""}
${kind.includes("key") ? `<circle cx="34" cy="40" r="16" fill="none" stroke="#f8df78" stroke-width="8"/><path d="M48 52 78 82M64 68l12-12" stroke="#f8df78" stroke-width="8" stroke-linecap="round"/>` : ""}
${kind.includes("symbol") ? `<circle cx="48" cy="48" r="28" fill="#6b6255"/><path d="M48 22v52M22 48h52" stroke="#f2b84b" stroke-width="6"/>` : ""}
${kind.includes("map") ? `<path d="M15 18 37 10l24 9 20-8v67l-22 8-24-9-20 8Z" fill="#d8b46c"/><path d="M24 57c19-22 29 11 48-18" fill="none" stroke="#6f401c" stroke-width="5"/>` : ""}
${kind.includes("heart") ? `<path d="M48 82C18 58 10 40 20 25c9-13 24-8 28 3 4-11 19-16 28-3 10 15 2 33-28 57Z" fill="#d94b4b"/>` : ""}
${kind.includes("button") || kind.includes("popup") || kind.includes("dialog") || kind.includes("panel") || kind.includes("timer") ? `<rect x="10" y="18" width="76" height="60" rx="12" fill="#d8b46c"/><rect x="18" y="28" width="60" height="8" rx="4" fill="#7b4f2b" opacity=".55"/>` : ""}
${kind.includes("fx") || kind.includes("beam") || kind.includes("glow") || kind.includes("correct") ? `<path d="M12 48h72" stroke="#ffe36b" stroke-width="10" stroke-linecap="round"/><circle cx="48" cy="48" r="28" fill="#ffe36b" opacity=".25"/>` : ""}
${kind.includes("wrong") ? `<path d="M24 24 72 72M72 24 24 72" stroke="#d94b4b" stroke-width="10" stroke-linecap="round"/>` : ""}
</g>`);

const files = {
  raka_idle: raka("idle"), raka_walk_1: raka("walk_1"), raka_walk_2: raka("walk_2"), raka_walk_3: raka("walk_3"), raka_walk_4: raka("walk_4"), raka_jump: raka("jump"), raka_fall: raka("fall"), raka_hurt: raka("hurt"), raka_interact: raka("interact"), raka_torch: raka("torch"),
  grandma_idle: grandma("idle"), grandma_point_right: grandma("point_right"), grandma_point_up: grandma("point_up"), grandma_point_down: grandma("point_down"), grandma_warning: grandma("warning"), grandma_talk: grandma("talk"), grandma_magic: grandma("magic"),
  bg_start: bg("start"), bg_house: bg("house"), bg_forest: bg("forest"), bg_river: bg("river"), bg_heritage: bg("heritage"), bg_cave: bg("cave"),
  obj_broken_house: obj("house"), obj_crafting_table: obj("table"), obj_giant_tree: obj("tree"), obj_root_platform: obj("root"), obj_forest_fiber_tree: obj("fiber"), obj_stepping_stone: obj("stone"), obj_waterfall: obj("waterfall"), obj_waterfall_crystal: obj("crystal"), obj_ancient_altar: obj("altar"), obj_cave_gate: obj("gate"),
  item_cloth: icon("cloth"), item_oil: icon("oil"), item_spark: icon("spark"), item_water: icon("water"), item_cold_stone: icon("stone"), item_soil: icon("soil"), item_unlit_torch: icon("unlit_torch"), item_lit_torch: icon("torch"), item_leaf_fiber: icon("fiber"), item_twist: icon("twist"), item_pull: icon("pull"), item_slippery_stone: icon("stone"), item_river_water: icon("river_water"), item_rotten_leaf: icon("leaf"), item_rope: icon("rope"), item_crystal_mirror: icon("crystal_mirror"), item_light_key: icon("key"),
  fx_light_beam: icon("fx_beam"), symbol_sun: icon("symbol_sun"), symbol_river: icon("symbol_river"), symbol_mountain: icon("symbol_mountain"), symbol_house: icon("symbol_house"), symbol_fire: icon("symbol_fire"), symbol_leaf: icon("symbol_leaf"), symbol_stone: icon("symbol_stone"), symbol_moon: icon("symbol_moon"), item_carved_stone: icon("carved_stone"), hazard_rock_small: icon("rock"), hazard_rock_medium: icon("rock"), hazard_rock_large: icon("rock"), hazard_shadow: icon("shadow"), item_map_piece: icon("map_piece"), item_complete_map: icon("map_complete"),
  ui_popup: icon("popup"), ui_dialog_box: icon("dialog"), ui_inventory_panel: icon("panel"), ui_heart: icon("heart"), ui_button: icon("button"), ui_timer: icon("timer"), fx_torch_flame: icon("fx_flame"), fx_spirit_smoke: icon("fx_smoke"), fx_item_glow: icon("fx_glow"), fx_correct: icon("correct"), fx_wrong: icon("wrong"), fx_rock_dust: icon("fx_dust")
};

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(outDir, `${name}.svg`), content);
}
console.log(`Generated ${Object.keys(files).length} assets in ${outDir}`);
