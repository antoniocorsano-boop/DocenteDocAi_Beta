/**
 * Migration script: TextArea → TextField multiline (MUI v7 Fase 6)
 *
 * For each consumer file:
 *  1. Remove 'TextArea' from the './ui' import
 *  2. Ensure 'TextField' is present in '@mui/material' imports
 *  3. Replace <TextArea → <TextField multiline
 *  4. Replace </TextArea> → </TextField>
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', 'src');

/** List of files that import TextArea (production only, no stories/tests) */
const CONSUMER_FILES = [
  'src/components/AddEvaluationModal.tsx',
  'src/components/AddOrientamentoActivityModal.tsx',
  'src/components/AiEventParserModal.tsx',
  'src/components/AnnualPlanningWizard.tsx',
  'src/components/CircolareAnalysisModal.tsx',
  'src/components/ClassPlanningWizard.tsx',
  'src/components/ClassroomView.tsx',
  'src/components/CompetencyEvaluationModal.tsx',
  'src/components/ConsiglioClasse.tsx',
  'src/components/CopyForRegisterModal.tsx',
  'src/components/CreateLessonFromAiModal.tsx',
  'src/components/CurriculumManager.tsx',
  'src/components/DocumentGeneratorModal.tsx',
  'src/components/EditableContentCard.tsx',
  'src/components/EditSlotModal.tsx',
  'src/components/EventModal.tsx',
  'src/components/IdeaGeneratorModal.tsx',
  'src/components/ImageAnalysisModal.tsx',
  'src/components/ImageGeneratorModal.tsx',
  'src/components/ImpromptuLessonModal.tsx',
  'src/components/NotebookLMImportModal.tsx',
  'src/components/ObservationModal.tsx',
  'src/components/QuickEvaluationModal.tsx',
  'src/components/RubricEditor.tsx',
  'src/components/UdaPlanner.tsx',
  'src/components/VideoAnalysisModal.tsx',
].map(f => join(__dirname, '..', f));

let totalChanged = 0;

for (const filePath of CONSUMER_FILES) {
  let src;
  try {
    src = readFileSync(filePath, 'utf8');
  } catch {
    console.warn(`SKIP (not found): ${filePath}`);
    continue;
  }

  // Skip if TextArea not used at all
  if (!src.includes('TextArea')) {
    console.log(`SKIP (no TextArea): ${filePath}`);
    continue;
  }

  let out = src;

  // 1. Remove 'TextArea' from ui import –– handles: ", TextArea" or "TextArea, " or "TextArea" alone
  //    Pattern: TextArea may appear surrounded by ", " or "{ " or " }"
  out = out.replace(/,\s*TextArea(?=\s*[,}])/g, '');
  out = out.replace(/TextArea\s*,\s*/g, '');
  out = out.replace(/\{\s*TextArea\s*\}/g, '{}'); // edge case: only export

  // 2. Ensure 'TextField' is in @mui/material imports
  //    Check if TextField is already imported from @mui/material
  if (!out.match(/from ['"]@mui\/material['"]/)) {
    // No @mui/material import at all — add one after last import line
    out = out.replace(/(import[^;]+;)\n(?!import)/, "$1\nimport { TextField } from '@mui/material';\n");
  } else if (!out.match(/TextField[^']*from ['"]@mui\/material['"]/)) {
    // @mui/material exists but TextField not in it — add TextField to existing import
    out = out.replace(
      /(import\s*\{[^}]*)\}\s*from\s*['"]@mui\/material['"]/,
      (match, prefix) => `${prefix}, TextField } from '@mui/material'`
    );
  }

  // 3. Replace JSX: <TextArea → <TextField multiline
  out = out.replace(/<TextArea(\s)/g, '<TextField multiline$1');
  out = out.replace(/<TextArea>/g, '<TextField multiline>');
  out = out.replace(/<TextArea\/>/g, '<TextField multiline />');

  // 4. Replace closing tag
  out = out.replace(/<\/TextArea>/g, '</TextField>');

  // 5. Fix onChange type annotation: React.ChangeEvent<HTMLTextAreaElement>
  //    → React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  //    (MUI TextField multiline onChange signature)
  // Only fix if it's specifically cast for TextArea usage
  // Leave as-is since HTMLTextAreaElement is compatible with multiline TextField's underlying textarea

  if (out !== src) {
    writeFileSync(filePath, out, 'utf8');
    console.log(`MIGRATED: ${filePath}`);
    totalChanged++;
  } else {
    console.log(`NO_CHANGE: ${filePath}`);
  }
}

console.log(`\nDone. ${totalChanged} files migrated.`);
