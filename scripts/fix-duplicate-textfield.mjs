/**
 * fix-duplicate-textfield.mjs
 *
 * Files where migrate-textarea.mjs added `TextField` to @mui/material import
 * but the file already imported `TextField` from './ui'. 
 * Since ./ui/TextField already supports multiline, we just remove the 
 * duplicate @mui/material TextField.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Files that have Duplicate identifier 'TextField' errors
const FILES = [
  'src/components/AddEvaluationModal.tsx',
  'src/components/AddOrientamentoActivityModal.tsx',
  'src/components/CreateLessonFromAiModal.tsx',
  'src/components/CurriculumManager.tsx',
  'src/components/EditSlotModal.tsx',
  'src/components/EventModal.tsx',
  'src/components/QuickEvaluationModal.tsx',
  'src/components/RubricEditor.tsx',
  'src/components/UdaPlanner.tsx',
].map(f => join(__dirname, '..', f));

let fixed = 0;

for (const filePath of FILES) {
  const src = readFileSync(filePath, 'utf8');

  // Remove ', TextField' or 'TextField, ' from @mui/material import
  // Pattern: the MUI import line containing TextField
  let out = src;

  // Remove TextField from @mui/material import (it's already in ./ui import)
  out = out.replace(
    /^(import\s*\{[^}]*),\s*TextField(\s*[,}][^}]*\}\s*from\s*['"]@mui\/material['"])/m,
    (_, before, after) => `${before}${after}`
  );
  out = out.replace(
    /^(import\s*\{[^}]*)TextField\s*,(\s*[^}]*\}\s*from\s*['"]@mui\/material['"])/m,
    (_, before, after) => `${before}${after}`
  );
  // Also handle case where TextField is alone in the import (edge case)
  out = out.replace(
    /^import\s*\{\s*TextField\s*\}\s*from\s*['"]@mui\/material['"];?\n/m,
    ''
  );

  if (out !== src) {
    writeFileSync(filePath, out, 'utf8');
    console.log(`FIXED: ${filePath}`);
    fixed++;
  } else {
    console.log(`NO_CHANGE: ${filePath}`);
  }
}

console.log(`\nFixed ${fixed} files.`);
