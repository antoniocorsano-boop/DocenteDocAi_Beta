/**
 * migrate-selectfield.mjs — SelectField → FormControl+InputLabel+NativeSelect
 *
 * Transforms every <SelectField ...> consumer to native MUI components.
 * Pipeline per file:
 *  1. Remove SelectField from the ./ui import
 *  2. Ensure FormControl, InputLabel, NativeSelect (FormHelperText) present in @mui/material
 *  3. Transform every <SelectField ...>...</SelectField> or <SelectField ... /> occurrence
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONSUMER_FILES = [
  'src/components/AddEvaluationModal.tsx',
  'src/components/AddOrientamentoActivityModal.tsx',
  'src/components/AddProvaModal.tsx',
  'src/components/AddSourceModal.tsx',
  'src/components/AddStudentModal.tsx',
  'src/components/ConsiglioClasseWizard.tsx',
  'src/components/CreateLessonFromAiModal.tsx',
  'src/components/CurriculumManager.tsx',
  'src/components/EditSlotModal.tsx',
  'src/components/HomeworkSubmission.tsx',
  'src/components/IdeaGeneratorModal.tsx',
  'src/components/ImportStudentsModal.tsx',
  'src/components/ImpromptuLessonModal.tsx',
  'src/components/OrarioSettingsModal.tsx',
  'src/components/OrientamentoDashboard.tsx',
  'src/components/QuickEvaluationModal.tsx',
  'src/components/RegisterImportDialog.tsx',
  'src/components/StudentTransferModal.tsx',
  'src/components/Studio.tsx',
  'src/components/UdaExportModal.tsx',
  'src/components/UnifiedEvaluationModal.tsx',
  'src/components/WelcomeScreen.tsx',
].map(f => join(__dirname, '..', f));

// ─── Prop extractor ─────────────────────────────────────────────────────────

/**
 * Extracts named props from a JSX opening-tag string (without the < or >).
 * Returns a map of propName → raw value string (or '' for boolean props).
 */
function extractProps(tagBody) {
  const props = {};
  // Match: propName="..." | propName='...' | propName={...} | propName (boolean)
  const re = /(\w+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|\{((?:[^{}]|\{[^{}]*\})*)\}))?/g;
  let m;
  while ((m = re.exec(tagBody)) !== null) {
    const name = m[1];
    if (name === 'SelectField') continue; // skip component name itself if it snuck in
    if (m[2] !== undefined) props[name] = `"${m[2]}"`;        // double-quoted string
    else if (m[3] !== undefined) props[name] = `"${m[3]}"`;   // single-quoted string
    else if (m[4] !== undefined) props[name] = `{${m[4]}}`;   // JSX expression
    else props[name] = 'true';                                  // boolean
  }
  return props;
}

/**
 * Find the end of a JSX opening tag starting at `pos` in `src`.
 * Returns { selfClose: bool, endPos: number } where endPos is after > or />.
 */
function findTagEnd(src, pos) {
  let i = pos;
  let inStr = null;
  let braceDepth = 0;
  while (i < src.length) {
    const ch = src[i];
    if (inStr) {
      if (ch === inStr && src[i - 1] !== '\\') inStr = null;
    } else if (ch === '"' || ch === "'") {
      inStr = ch;
    } else if (ch === '{') {
      braceDepth++;
    } else if (ch === '}') {
      braceDepth--;
    } else if (braceDepth === 0) {
      if (ch === '/' && src[i + 1] === '>') {
        return { selfClose: true, endPos: i + 2 };
      }
      if (ch === '>') {
        return { selfClose: false, endPos: i + 1 };
      }
    }
    i++;
  }
  return { selfClose: false, endPos: i };
}

/**
 * Find the matching </SelectField> for an opening tag.
 * startPos: position just after the opening tag's >
 * Returns the position just after </SelectField>
 */
function findClosingTag(src, startPos) {
  let depth = 1;
  let i = startPos;
  // We need to track nested <SelectField> (unlikely but safe)
  while (i < src.length) {
    const open = src.indexOf('<SelectField', i);
    const close = src.indexOf('</SelectField>', i);
    if (close === -1) return src.length;
    if (open !== -1 && open < close) {
      depth++;
      i = open + 12;
    } else {
      depth--;
      if (depth === 0) return close + '</SelectField>'.length;
      i = close + '</SelectField>'.length;
    }
  }
  return src.length;
}

// ─── JSX generator ──────────────────────────────────────────────────────────

function buildFormControl(props, children, indent) {
  const i1 = indent;
  const i2 = indent + '  ';
  const i3 = indent + '    ';

  // FormControl props
  const fcProps = [];
  if (props.fullWidth === 'true' || props.fullWidth === '{true}') fcProps.push('fullWidth');
  else if (props.fullWidth) fcProps.push(`fullWidth={${props.fullWidth.replace(/^\{|\}$/g, '')}}`);
  if (props.error && props.error !== 'false') {
    const v = props.error.replace(/^\{|\}$/g, '');
    fcProps.push(`error={${v}}`);
  }
  if (props.disabled && props.disabled !== 'false') {
    const v = props.disabled.replace(/^\{|\}$/g, '');
    fcProps.push(`disabled={${v}}`);
  }
  fcProps.push('sx={{ mb: 2 }}');

  // InputLabel
  const labelValue = props.label
    ? props.label.startsWith('"') ? props.label.slice(1, -1) : `{${props.label.replace(/^\{|\}$/g, '')}}`
    : '';
  const idValue = props.id
    ? props.id.startsWith('"') ? props.id.slice(1, -1) : undefined
    : undefined;
  const htmlForAttr = idValue ? ` htmlFor="${idValue}"` : '';
  const labelContent = props.label?.startsWith('"') ? props.label.slice(1, -1) : `{${props.label?.replace(/^\{|\}$/g, '') ?? ''}}`;

  // NativeSelect props
  const nsProps = [];
  if (props.value !== undefined) {
    nsProps.push(`value=${props.value}`);
  }
  if (props.onChange !== undefined) {
    nsProps.push(`onChange=${props.onChange}`);
  }
  if (props.required === 'true') nsProps.push('required');

  // inputProps
  const ipParts = [];
  if (idValue) ipParts.push(`id: '${idValue}'`);
  if (props.name) {
    const nameVal = props.name.startsWith('"') ? props.name.slice(1, -1) : props.name.replace(/^\{|\}$/g, '');
    ipParts.push(`name: '${nameVal}'`);
  }
  if (ipParts.length > 0) {
    nsProps.push(`inputProps={{ ${ipParts.join(', ')} }}`);
  }

  // Children: either from options prop or from original children
  let childrenJsx;
  if (props.options) {
    const optVal = props.options.replace(/^\{|\}$/g, '');
    childrenJsx = `${i3}{(${optVal}).map((o) => (\n${i3}  <option key={o.value} value={o.value}>{o.label}</option>\n${i3}))}\n`;
  } else {
    childrenJsx = children;
  }

  // Build
  const fcOpenParts = fcProps.join(' ');
  const nsOpenParts = nsProps.length > 0 ? '\n' + nsProps.map(p => `${i3}${p}`).join('\n') + '\n' + i2 : '';

  return [
    `${i1}<FormControl ${fcOpenParts}>`,
    `${i2}<InputLabel${htmlForAttr}>${labelContent}</InputLabel>`,
    `${i2}<NativeSelect${nsOpenParts}>`,
    childrenJsx.endsWith('\n') ? childrenJsx.slice(0, -1) : childrenJsx,
    `${i2}</NativeSelect>`,
    `${i1}</FormControl>`,
  ].join('\n');
}

// ─── Per-file transformer ────────────────────────────────────────────────────

function transformFile(src) {
  let out = src;
  let offset = 0;

  // Find all <SelectField positions
  const positions = [];
  let pos = 0;
  while ((pos = src.indexOf('<SelectField', pos)) !== -1) {
    // Make sure it's not </SelectField>
    if (src[pos + 12] === ' ' || src[pos + 12] === '\n' || src[pos + 12] === '\r' || src[pos + 12] === '\t' || src[pos + 12] === '/' || src[pos + 12] === '>') {
      positions.push(pos);
    }
    pos++;
  }

  for (const startPos of positions) {
    const adjustedStart = startPos + offset;

    // Detect the indentation from the line containing <SelectField
    const lineStart = out.lastIndexOf('\n', adjustedStart) + 1;
    const beforeTag = out.slice(lineStart, adjustedStart);
    const indent = beforeTag.match(/^(\s*)/)?.[1] ?? '';

    // Find end of opening tag
    const afterName = adjustedStart + '<SelectField'.length;
    const { selfClose, endPos } = findTagEnd(out, afterName);

    // Extract the tag body (props)
    const tagBody = out.slice(afterName, selfClose ? endPos - 2 : endPos - 1).trim();
    const props = extractProps(tagBody);

    let replacement;
    if (selfClose) {
      // Self-closing: must use options prop for children
      replacement = buildFormControl(props, '', indent);
      const original = out.slice(adjustedStart, endPos);
      out = out.slice(0, adjustedStart) + replacement + out.slice(endPos);
      offset += replacement.length - original.length;
    } else {
      // Find closing tag
      const closingEnd = out.indexOf('</SelectField>', endPos);
      if (closingEnd === -1) continue;
      const actualClosingEnd = closingEnd + '</SelectField>'.length;
      const children = out.slice(endPos, closingEnd);
      replacement = buildFormControl(props, children, indent);
      const original = out.slice(adjustedStart, actualClosingEnd);
      out = out.slice(0, adjustedStart) + replacement + out.slice(actualClosingEnd);
      offset += replacement.length - original.length;
    }
  }

  return out;
}

function updateImports(src) {
  let out = src;

  // 1. Remove SelectField from ./ui import
  out = out.replace(/,\s*SelectField(?=\s*[,}])/g, '');
  out = out.replace(/SelectField\s*,\s*/g, '');
  out = out.replace(/\{\s*SelectField\s*\}/g, '{}');

  // 2. Ensure FormControl, InputLabel, NativeSelect are in @mui/material
  const needed = ['FormControl', 'InputLabel', 'NativeSelect'];
  const muiImportRe = /import\s*\{([^}]*)\}\s*from\s*['"]@mui\/material['"]/;
  const muiMatch = out.match(muiImportRe);
  if (muiMatch) {
    const existing = muiMatch[1];
    const toAdd = needed.filter(n => !existing.includes(n));
    if (toAdd.length > 0) {
      out = out.replace(muiImportRe, `import {${existing}, ${toAdd.join(', ')} } from '@mui/material'`);
    }
  } else {
    // No @mui/material import, add one
    const firstImport = out.indexOf('import ');
    const insert = `import { ${needed.join(', ')} } from '@mui/material';\n`;
    out = out.slice(0, firstImport) + insert + out.slice(firstImport);
  }

  return out;
}

// ─── Main ────────────────────────────────────────────────────────────────────

let totalChanged = 0;

for (const filePath of CONSUMER_FILES) {
  let src;
  try {
    src = readFileSync(filePath, 'utf8');
  } catch {
    console.warn(`SKIP (not found): ${filePath}`);
    continue;
  }

  if (!src.includes('SelectField')) {
    console.log(`SKIP (no SelectField): ${filePath}`);
    continue;
  }

  let out = src;
  out = updateImports(out);
  out = transformFile(out);

  if (out !== src) {
    writeFileSync(filePath, out, 'utf8');
    console.log(`MIGRATED: ${filePath}`);
    totalChanged++;
  } else {
    console.log(`NO_CHANGE: ${filePath}`);
  }
}

console.log(`\nDone. ${totalChanged} files migrated.`);
