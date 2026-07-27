// Fix double-encoded UTF-8 strings in source files
// Run: node scripts/fix-encoding.mjs

import { readFileSync, writeFileSync } from 'fs';

// Each pair: [corrupted sequence (UTF-8 chars), correct char]
// These are the Windows-1252 re-encoded artifacts
const STR_REPLACEMENTS = [
  ['\u00e2\u20ac\u201d', '\u2014'],  // â€" => — (U+2014, em dash)
  ['\u00e2\u20ac\u2026', '\u2026'],  // â€¦ => … (U+2026, ellipsis) — already handled in some files
  ['\u00e2\u20ac\u2122', '\u2019'],  // â€™ => ' (right single quote)
  ['\u00e2\u20ac\u0153', '\u201c'],  // â€œ => " (left double quote)
  ['\u00e2\u2020\u2019', '\u2192'],  // â†' => → (U+2192, right arrow)
  ['\u00c3\u00a0', '\u00e0'],        // Ã  + NBSP => à — but careful: C3 A0 = à directly
  ['\u00c3\u00a8', '\u00e8'],        // Ã¨ => è
  ['\u00c3\u00a9', '\u00e9'],        // Ã© => é
  ['\u00c3\u00b2', '\u00f2'],        // Ã² => ò
  ['\u00c3\u00b9', '\u00f9'],        // Ã¹ => ù
  ['\u00c2\u00b0', '\u00b0'],        // Â° => °
];

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  const orig = content;
  for (const [bad, good] of STR_REPLACEMENTS) {
    const before = content;
    content = content.split(bad).join(good);
    if (content !== before) {
      const count = (before.split(bad).length - 1);
      console.log(`  [${filePath}] replaced ${count}x "${bad}" → "${good}"`);
    }
  }
  if (content !== orig) {
    writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${filePath}`);
  } else {
    console.log(`  (unchanged) ${filePath}`);
  }
}

// Files with double-encoded UTF-8 strings
const FILES = [
  'src/components/classroom/ClassroomRegisterTab.tsx',
  'src/cognition/eventMap.ts',
  'src/components/ProgettazioneHub.tsx',
  'src/components/Home.tsx',
];

for (const f of FILES) {
  fixFile(f);
}

// --- Fix files with raw Latin-1 bytes (invalid UTF-8) ---
// AnalyticsDashboard.tsx and LessonView.tsx contain 0xE0 bare bytes
// Read as Buffer, replace bare 0xE0 with C3 A0 (UTF-8 for à)
import { Buffer } from 'buffer';

function fixRawLatinBytes(filePath) {
  const buf = readFileSync(filePath);
  const result = [];
  let i = 0;
  let count = 0;
  while (i < buf.length) {
    const b = buf[i];
    // Check for bare 0xE0 (à in Latin-1) — invalid start of 3-byte UTF-8 if not followed by two continuation bytes
    if (b === 0xE0) {
      const n1 = i + 1 < buf.length ? buf[i + 1] : 0;
      const n2 = i + 2 < buf.length ? buf[i + 2] : 0;
      if ((n1 & 0xC0) === 0x80 && (n2 & 0xC0) === 0x80) {
        // Valid 3-byte sequence — keep as-is
        result.push(b, n1, n2);
        i += 3;
      } else {
        // Bare Latin-1 0xE0 = à → emit as UTF-8 C3 A0
        result.push(0xC3, 0xA0);
        i++;
        count++;
      }
    } else if (b === 0xE8 && ((i + 1 >= buf.length) || (buf[i + 1] & 0xC0) !== 0x80)) {
      // Bare 0xE8 = è in Latin-1 → C3 A8
      result.push(0xC3, 0xA8);
      i++; count++;
    } else if (b === 0xE9 && ((i + 1 >= buf.length) || (buf[i + 1] & 0xC0) !== 0x80)) {
      // Bare 0xE9 = é in Latin-1 → C3 A9
      result.push(0xC3, 0xA9);
      i++; count++;
    } else {
      result.push(b);
      i++;
    }
  }
  if (count > 0) {
    writeFileSync(filePath, Buffer.from(result));
    console.log(`✓ Fixed ${count} raw byte(s) in: ${filePath}`);
  } else {
    console.log(`  (no raw bytes found) ${filePath}`);
  }
}

fixRawLatinBytes('src/components/AnalyticsDashboard.tsx');
fixRawLatinBytes('src/components/LessonView.tsx');

console.log('\nDone.');
