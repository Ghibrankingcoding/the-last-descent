const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const references = [];
const errors = [];

function normalizeReference(value) {
  return value.trim().replace(/^['"]|['"]$/g, "").split("#")[0].split("?")[0];
}

function hasExactPathCase(target) {
  const relativePath = path.relative(projectRoot, target);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) return false;

  let currentDirectory = projectRoot;
  for (const segment of relativePath.split(path.sep).filter(Boolean)) {
    const entries = fs.readdirSync(currentDirectory);
    if (!entries.includes(segment)) return false;
    currentDirectory = path.join(currentDirectory, segment);
  }
  return true;
}

function registerReference(sourceFile, rawValue, baseDirectory) {
  const value = normalizeReference(rawValue);
  if (!value || /^(?:data:|https?:|mailto:|javascript:|#)/i.test(value) || value.includes("${")) return;

  if (sourceFile.startsWith("css/") && value.includes("Assets TLD/") && !value.startsWith("../Assets TLD/")) {
    errors.push(`${sourceFile} -> ${value} (CSS harus memakai ../Assets TLD/)`);
  }
  if ((sourceFile === "index.html" || sourceFile.startsWith("js/")) && value.includes("Assets TLD/") && !value.startsWith("Assets TLD/")) {
    errors.push(`${sourceFile} -> ${value} (HTML/JS harus memakai Assets TLD/)`);
  }

  const target = path.resolve(baseDirectory, decodeURIComponent(value));
  references.push({ sourceFile, value, target });
  if (!fs.existsSync(target)) errors.push(`${sourceFile} -> ${value} (tidak ditemukan)`);
  else if (!hasExactPathCase(target)) errors.push(`${sourceFile} -> ${value} (huruf besar/kecil tidak sama)`);
}

const htmlPath = path.join(projectRoot, "index.html");
const html = fs.readFileSync(htmlPath, "utf8");
for (const match of html.matchAll(/\b(?:src|href|poster)="([^"]+)"/g)) {
  registerReference("index.html", match[1], projectRoot);
}

const cssDirectory = path.join(projectRoot, "css");
for (const filename of fs.readdirSync(cssDirectory).filter((name) => name.endsWith(".css"))) {
  const absolutePath = path.join(cssDirectory, filename);
  const source = fs.readFileSync(absolutePath, "utf8");
  for (const match of source.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/g)) {
    registerReference(`css/${filename}`, match[2], cssDirectory);
  }
}

const javascriptFolders = ["js/core", "js/map", "js/levels", "js/ui"];
const assetLiteralPattern = /(["'`])((?:Assets TLD|assets)\/[\s\S]*?\.(?:png|jpe?g|gif|webp|svg|mp3|wav|ogg|mp4|webm|json))(?:\?[^"'`]*)?\1/gi;

for (const folder of javascriptFolders) {
  const absoluteFolder = path.join(projectRoot, folder);
  for (const filename of fs.readdirSync(absoluteFolder).filter((name) => name.endsWith(".js"))) {
    const absolutePath = path.join(absoluteFolder, filename);
    const source = fs.readFileSync(absolutePath, "utf8");
    for (const match of source.matchAll(assetLiteralPattern)) {
      registerReference(`${folder}/${filename}`, match[2], projectRoot);
    }
  }
}

if (errors.length) {
  console.error("Asset yang tidak ditemukan:");
  console.error([...new Set(errors)].join("\n"));
  process.exit(1);
}

const uniqueTargets = new Set(references.map(({ target }) => target.toLowerCase()));
console.log(`Asset valid: ${references.length} pemanggilan menuju ${uniqueTargets.size} file lokal.`);
