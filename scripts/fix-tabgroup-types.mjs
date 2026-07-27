/**
 * fix-tabgroup-types.mjs
 * Adds type cast to the .map() in all migrated Tabs to fix TS2339 errors.
 * Changes: .map((tab) => ( → .map((tab: { id: string; label: string; icon?: string; badge?: number | string }) => (
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FILES = [
  'src/components/AnalyticsDashboard.tsx',
  'src/components/Calendar.tsx',
  'src/components/ClassroomView.tsx',
  'src/components/ClassSelection.tsx',
  'src/components/ConsiglioClasse.tsx',
  'src/components/ConsiglioClasseWizard.tsx',
  'src/components/CopyForRegisterModal.tsx',
  'src/components/CurriculumManager.tsx',
  'src/components/DidatticaInclusiva.tsx',
  'src/components/ExportModal.tsx',
  'src/components/HelpModal.tsx',
  'src/components/ImportStudentsModal.tsx',
  'src/components/MaterialPickerModal.tsx',
  'src/components/OrarioSettingsModal.tsx',
  'src/components/ProgettazioneHub.tsx',
  'src/components/QuickEvaluationModal.tsx',
  'src/components/ReportisticaHub.tsx',
  'src/components/Settings.tsx',
  'src/components/StudentClassroomView.tsx',
  'src/components/StudentProfile.tsx',
  'src/components/StudentTransferModal.tsx',
  'src/components/TestGeneratorModal.tsx',
  'src/components/Timetable.tsx',
].map(f => join(__dirname, '..', f));

const OLD = '.map((tab) => (';
const NEW = '.map((tab: { id: string; label: string; icon?: string; badge?: number | string }) => (';

let fixed = 0;
for (const fp of FILES) {
  const src = readFileSync(fp, 'utf8');
  if (!src.includes(OLD)) { console.log(`SKIP: ${fp}`); continue; }
  const out = src.split(OLD).join(NEW);
  writeFileSync(fp, out, 'utf8');
  console.log(`FIXED: ${fp}`);
  fixed++;
}
console.log(`\nFixed ${fixed} files.`);
