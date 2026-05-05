/**
 * Fixes UTF-8 mojibake in frontend/app/admin/page.tsx (UTF-8 bytes misread as CP1252).
 * Run: node scripts/apply-mojibake-fixes.js
 */
const fs = require("fs");
const path = "c:/Users/rgarcia/muebleria/frontend/app/admin/page.tsx";

const REPLACEMENTS = [
  // Longest / multi-char sequences first (â + CP1252 mis-decoding)
  ["\u00e2\u2022\u0090", "\u2550"], // ═
  ["\u00e2\u201d\u20ac", "\u2500"], // ─
  ["\u00e2\u20ac\u201d", "\u2014"], // —
  ["\u00e2\u2020\u2019", "\u2192"], // →
  ["\u00e2\u0161\u00a0", "\u26a0"], // ⚠
  ["\u00e2\u0153\u201c", "\u2713"], // ✓
  // Ã + second byte (UTF-8 Latin-1 supplement read via CP1252)
  ["\u00c3\u0081", "\u00c1"], // Á
  ["\u00c3\u008d", "\u00cd"], // Í
  ["\u00c3\u2030", "\u00c9"], // É (second byte 0x89 -> ‰)
  ["\u00c3\u201c", "\u00d3"], // Ó (0x93 -> “)
  ["\u00c3\u00ad", "\u00ed"], // í
  ["\u00c3\u00b3", "\u00f3"], // ó
  ["\u00c3\u00a9", "\u00e9"], // é
  ["\u00c3\u00ba", "\u00fa"], // ú
  ["\u00c3\u00a1", "\u00e1"], // á
  ["\u00c3\u00b1", "\u00f1"], // ñ
  ["\u00c3\u2014", "\u00d7"], // ×
  // Â-prefixed (C2 xx sequences)
  ["\u00c2\u00b7", "\u00b7"], // ·
  ["\u00c2\u00ab", "\u00ab"], // «
  ["\u00c2\u00bb", "\u00bb"], // »
];

let s = fs.readFileSync(path, "utf8");
const before = s;
for (const [bad, good] of REPLACEMENTS) {
  s = s.split(bad).join(good);
}
if (s === before) {
  console.error("No changes applied");
  process.exit(1);
}
fs.writeFileSync(path, s, "utf8");
console.log("OK, bytes:", before.length, "->", s.length);
