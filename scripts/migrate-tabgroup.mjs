/**
 * migrate-tabgroup.mjs — TabGroup → Tabs+Tab (MUI v7 Fase 6)
 *
 * Transforms every <TabGroup ...> consumer to inline MUI Tabs+Tab.
 * TabGroup is always self-closing.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONSUMER_FILES = [
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

// ─── Tag body extractor ──────────────────────────────────────────────────────

/**
 * Find the end position of a self-closing JSX tag starting just after <TagName.
 * Handles balanced braces, strings, and template literals.
 */
function findSelfClosingEnd(src, pos) {
  let i = pos;
  let inSingle = false, inDouble = false, inTemplate = false;
  let braceDepth = 0, squareDepth = 0, parenDepth = 0, templateDepth = 0;

  while (i < src.length) {
    const ch = src[i];

    if (inTemplate) {
      if (ch === '`' && src[i - 1] !== '\\') { inTemplate = false; }
      else if (ch === '$' && src[i + 1] === '{') { braceDepth++; i++; }
      i++; continue;
    }
    if (inSingle) {
      if (ch === "'" && src[i - 1] !== '\\') inSingle = false;
      i++; continue;
    }
    if (inDouble) {
      if (ch === '"' && src[i - 1] !== '\\') inDouble = false;
      i++; continue;
    }

    if (ch === '`') { inTemplate = true; i++; continue; }
    if (ch === "'") { inSingle = true; i++; continue; }
    if (ch === '"') { inDouble = true; i++; continue; }
    if (ch === '{') { braceDepth++; i++; continue; }
    if (ch === '}') { braceDepth--; i++; continue; }
    if (ch === '[') { squareDepth++; i++; continue; }
    if (ch === ']') { squareDepth--; i++; continue; }
    if (ch === '(') { parenDepth++; i++; continue; }
    if (ch === ')') { parenDepth--; i++; continue; }

    if (braceDepth === 0 && squareDepth === 0 && parenDepth === 0) {
      if (ch === '/' && src[i + 1] === '>') return i + 2;
      // Non-self-closing (rare for TabGroup but handle it)
      if (ch === '>') return i + 1;
    }
    i++;
  }
  return i;
}

/**
 * Extract a specific prop value from a tag body string.
 * Returns the raw value (with surrounding {} or "") or null if not found.
 * Uses a balanced-scan approach.
 */
function extractProp(tagBody, propName) {
  // Find "propName=" in the tag body
  const propRe = new RegExp(`(?:^|\\s)${propName}\\s*=\\s*`, 'g');
  let match;
  while ((match = propRe.exec(tagBody)) !== null) {
    const start = match.index + match[0].length;
    const ch = tagBody[start];
    
    if (ch === '"' || ch === "'") {
      // String literal
      const end = tagBody.indexOf(ch, start + 1);
      if (end !== -1) return tagBody.slice(start + 1, end);
    } else if (ch === '{') {
      // JSX expression — find matching }
      let depth = 0;
      let inStr = null, inTmpl = false;
      let j = start;
      while (j < tagBody.length) {
        const c = tagBody[j];
        if (inTmpl) {
          if (c === '`') inTmpl = false;
        } else if (inStr) {
          if (c === inStr) inStr = null;
        } else {
          if (c === '`') inTmpl = true;
          else if (c === '"' || c === "'") inStr = c;
          else if (c === '{') depth++;
          else if (c === '}') {
            depth--;
            if (depth === 0) return tagBody.slice(start + 1, j); // inner content
          }
        }
        j++;
      }
    }
  }
  return null;
}

/**
 * Check if a boolean prop exists (no value) in tag body.
 */
function hasBoolProp(tagBody, propName) {
  return new RegExp(`(?:^|\\s)${propName}(?:\\s|$|/)`, 'g').test(tagBody);
}

// ─── Code generator ──────────────────────────────────────────────────────────

function buildInlineTabs(props, indent) {
  const i1 = indent;
  const i2 = indent + '  ';
  const i3 = indent + '    ';
  const i4 = indent + '      ';
  const i5 = indent + '        ';

  const tabsVal = props.tabs || '[]';
  const activeTabVal = props.activeTab || "''";
  const handlerVal = props.onTabChange || props.onChange || null;
  const isIconOnly = props.isIconOnly === 'true' || hasBoolProp(props._raw || '', 'isIconOnly');
  const styleVal = props.style || null;

  // Variant → MUI colors
  const variant = props.variant || 'primary';
  let indicatorColor = 'primary';
  if (variant === 'secondary' || variant === 'filled' || variant === 'tonal') indicatorColor = 'secondary';
  else if (variant === 'tertiary') indicatorColor = 'primary'; // tertiary handled via sx override

  const tertiarySx = (variant === 'tertiary')
    ? `\n${i3}'& .MuiTabs-indicator': { bgcolor: 'var(--md-sys-color-tertiary)' },\n${i3}'& .Mui-selected': { color: 'var(--md-sys-color-tertiary) !important' },`
    : '';

  const styleSx = styleVal ? `\n${i3}...${styleVal},` : '';

  const changeHandler = handlerVal
    ? `(_, v: string) => (${handlerVal})(v)`
    : '() => {}';

  const labelExpr = isIconOnly
    ? `(\n${i5}<Badge badgeContent={tab.badge} color="error">\n${i5}  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>\n${i5}    {tab.icon && <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)' }}>{tab.icon}</Box>}\n${i5}  </Box>\n${i5}</Badge>\n${i4})`
    : `(\n${i5}<Badge badgeContent={tab.badge} color="error">\n${i5}  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>\n${i5}    {tab.icon && <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)' }}>{tab.icon}</Box>}\n${i5}    {tab.label}\n${i5}  </Box>\n${i5}</Badge>\n${i4})`;

  return [
    `${i1}<Tabs`,
    `${i2}value={${activeTabVal}}`,
    `${i2}onChange={${changeHandler}}`,
    `${i2}indicatorColor="${indicatorColor}"`,
    `${i2}textColor="${indicatorColor}"`,
    `${i2}aria-label="Sezioni di navigazione"`,
    `${i2}sx={{`,
    `${i3}bgcolor: 'var(--md-sys-color-surface-container-low)',`,
    `${i3}borderRadius: 'var(--md-sys-shape-corner-full)',`,
    `${i3}border: '1px solid var(--md-sys-color-outline-variant)',`,
    `${i3}minHeight: 'auto',`,
    `${i3}p: 0.5,${tertiarySx}${styleSx}`,
    `${i2}}}`,
    `${i1}>`,
    `${i2}{(${tabsVal}).map((tab) => (`,
    `${i3}<Tab`,
    `${i4}key={tab.id}`,
    `${i4}value={tab.id}`,
    `${i4}id={\`tab-\${tab.id}\`}`,
    `${i4}aria-controls={\`panel-\${tab.id}\`}`,
    `${i4}data-testid={\`tab-\${tab.id}\`}`,
    `${i4}label={${labelExpr}}`,
    `${i4}sx={{`,
    `${i5}borderRadius: 'var(--md-sys-shape-corner-full)',`,
    `${i5}minHeight: 'auto',`,
    `${i5}py: 1,`,
    `${i5}px: 2,`,
    `${i5}textTransform: 'uppercase',`,
    `${i5}fontSize: 'var(--md-sys-typescale-label-small-font-size)',`,
    `${i4}}}`,
    `${i3}/>`,
    `${i2}))}\n${i1}</Tabs>`,
  ].join('\n');
}

// ─── Per-file transformer ────────────────────────────────────────────────────

function transformFile(src) {
  let out = src;
  let searchFrom = 0;

  while (true) {
    const tagStart = out.indexOf('<TabGroup', searchFrom);
    if (tagStart === -1) break;

    // Check it's a TagGroup opening (not </TabGroup>)
    const nextCh = out[tagStart + 9];
    if (nextCh !== ' ' && nextCh !== '\n' && nextCh !== '\r' && nextCh !== '\t' && nextCh !== '/' && nextCh !== '>') {
      searchFrom = tagStart + 1;
      continue;
    }

    // Detect indentation
    const lineStart = out.lastIndexOf('\n', tagStart) + 1;
    const indent = out.slice(lineStart, tagStart).match(/^(\s*)/)?.[1] ?? '';

    // Find end of tag
    const afterName = tagStart + '<TabGroup'.length;
    const tagEnd = findSelfClosingEnd(out, afterName);
    const rawTag = out.slice(tagStart, tagEnd);
    const tagBody = out.slice(afterName, tagEnd - (rawTag.endsWith('/>') ? 2 : 1)).trim();

    // Extract props
    const tabs = extractProp(tagBody, 'tabs');
    const activeTab = extractProp(tagBody, 'activeTab');
    const onTabChange = extractProp(tagBody, 'onTabChange');
    const onChange = extractProp(tagBody, 'onChange');
    const variant = extractProp(tagBody, 'variant');
    const style = extractProp(tagBody, 'style');
    const isIconOnly = extractProp(tagBody, 'isIconOnly');

    const props = {
      tabs, activeTab, onTabChange, onChange, variant, style, isIconOnly,
      _raw: tagBody,
    };

    const replacement = buildInlineTabs(props, indent);
    out = out.slice(0, tagStart) + replacement + out.slice(tagEnd);
    // After replacement, search from beginning of replacement area
    searchFrom = tagStart + replacement.length;
  }

  return out;
}

function updateImports(src) {
  let out = src;

  // 1. Remove TabGroup from ./ui import
  out = out.replace(/,\s*TabGroup(?=\s*[,}])/g, '');
  out = out.replace(/TabGroup\s*,\s*/g, '');
  out = out.replace(/\{\s*TabGroup\s*\}/g, '{}');

  // 2. Ensure Tabs, Tab, Badge, Box are in @mui/material
  const needed = ['Tabs', 'Tab', 'Badge', 'Box'];
  const muiImportRe = /import\s*\{([^}]*)\}\s*from\s*['"]@mui\/material['"]/;
  const muiMatch = out.match(muiImportRe);
  if (muiMatch) {
    const existing = muiMatch[1];
    const toAdd = needed.filter(n => {
      // Check if 'n' is already in the import (avoid partial matches like 'Tab' matching 'Tabs')
      return !new RegExp(`\\b${n}\\b`).test(existing);
    });
    if (toAdd.length > 0) {
      out = out.replace(muiImportRe, `import {${existing}, ${toAdd.join(', ')} } from '@mui/material'`);
    }
  } else {
    // No @mui/material import at all
    const firstImport = out.indexOf('import ');
    out = out.slice(0, firstImport) + `import { ${needed.join(', ')} } from '@mui/material';\n` + out.slice(firstImport);
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

  if (!src.includes('TabGroup')) {
    console.log(`SKIP (no TabGroup): ${filePath}`);
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
