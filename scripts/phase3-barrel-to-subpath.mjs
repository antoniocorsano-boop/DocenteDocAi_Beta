#!/usr/bin/env node
/**
 * Phase 3 migration: Convert @mui/material barrel imports to subpath imports.
 *
 * Before: import { Button, Box, Typography } from '@mui/material';
 * After:  import Button from '@mui/material/Button';
 *         import Box from '@mui/material/Box';
 *         import Typography from '@mui/material/Typography';
 *
 * Special cases handled:
 *  - Aliased imports:  Card as MuiCard  →  import MuiCard from '@mui/material/Card'
 *  - Inline type:     type TypographyProps  →  import type { TypographyProps } from '@mui/material/Typography'
 *  - Empty imports:   import {} from '@mui/material'  →  (removed)
 *  - Multi-line barrels: collapsed to a single logical import before processing
 *  - Deduplication:   remove exact duplicate subpath import lines
 */

import { readFileSync, writeFileSync } from 'fs';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// Types that come from named exports in a specific subpath (not default export)
const NAMED_TYPE_SUBPATH = {
  TypographyProps: '@mui/material/Typography',
  ButtonProps: '@mui/material/Button',
  IconButtonProps: '@mui/material/IconButton',
  SelectChangeEvent: '@mui/material/Select',
  TextFieldProps: '@mui/material/TextField',
  DialogProps: '@mui/material/Dialog',
  ChipProps: '@mui/material/Chip',
  BoxProps: '@mui/material/Box',
  PaperProps: '@mui/material/Paper',
  CardProps: '@mui/material/Card',
  TabProps: '@mui/material/Tab',
  TabsProps: '@mui/material/Tabs',
  BadgeProps: '@mui/material/Badge',
  Theme: '@mui/material/styles',
  SxProps: '@mui/system',
  useTheme: '@mui/material/styles',
  useMediaQuery: '@mui/material/useMediaQuery',
};

/**
 * Given a raw import specifier token (e.g. "Button", "Card as MuiCard", "type TypographyProps"),
 * return the line to emit.
 */
function tokenToImportLine(token) {
  const isTypeKeyword = token.startsWith('type ');
  const cleanToken = isTypeKeyword ? token.slice(5).trim() : token.trim();

  // Parse optional alias: "Original as Alias"
  const aliasMatch = cleanToken.match(/^(\w+)\s+as\s+(\w+)$/);
  const originalName = aliasMatch ? aliasMatch[1] : cleanToken;
  const localName = aliasMatch ? aliasMatch[2] : cleanToken;

  // Determine subpath
  const namedPath = NAMED_TYPE_SUBPATH[originalName];

  if (isTypeKeyword) {
    const path = namedPath ?? `@mui/material/${originalName}`;
    if (aliasMatch) {
      return `import type { ${originalName} as ${localName} } from '${path}';`;
    }
    return `import type { ${originalName} } from '${path}';`;
  }

  if (namedPath) {
    // Named export (hook or type re-exported as value)
    if (aliasMatch) {
      return `import { ${originalName} as ${localName} } from '${namedPath}';`;
    }
    return `import { ${originalName} } from '${namedPath}';`;
  }

  // Default component export
  return `import ${localName} from '@mui/material/${originalName}';`;
}

/** Recursively collect all .tsx files under a directory */
function collectTsxFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...collectTsxFiles(full));
    } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
      results.push(full);
    }
  }
  return results;
}

const SRC_ROOT = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

const files = collectTsxFiles(SRC_ROOT);

let processedCount = 0;
let skippedCount = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf8');

  if (!content.includes("from '@mui/material'")) {
    skippedCount++;
    continue;
  }

  // Skip lines that are already subpath imports like `from '@mui/material/Button'`
  // We only care about barrel: `from '@mui/material'` (no trailing slash+name)
  const hasBarrel = /from\s+'@mui\/material'\s*;/.test(content);
  if (!hasBarrel) {
    skippedCount++;
    continue;
  }

  let newContent = content;

  // Step 1: Normalize multi-line barrel imports into single lines so the regex works uniformly.
  // Match: import {\n  A,\n  B,\n} from '@mui/material';
  // We'll collapse whitespace inside { } blocks that end in from '@mui/material'
  newContent = newContent.replace(
    /import\s*\{([^}]*)\}\s*from\s*'@mui\/material'\s*;/gs,
    (match, importBody) => {
      // Collapse to single line format for further processing
      const collapsed = importBody.replace(/\s+/g, ' ').trim();
      return `import { ${collapsed} } from '@mui/material';`;
    }
  );

  // Step 2: Replace each barrel import line with individual subpath imports
  newContent = newContent.replace(
    /import\s*\{\s*(.*?)\s*\}\s*from\s*'@mui\/material'\s*;/g,
    (match, importBody) => {
      const tokens = importBody
        .split(',')
        .map(t => t.trim().replace(/\s+/g, ' '))
        .filter(t => t.length > 0);

      if (tokens.length === 0) {
        // Empty import — remove entirely (return empty string, clean up blank line after)
        return '';
      }

      return tokens.map(tokenToImportLine).join('\n');
    }
  );

  // Step 3: Remove any blank lines created by empty import removal
  newContent = newContent.replace(/\n{3,}/g, '\n\n');

  // Step 4: Deduplicate exact identical import lines
  const lines = newContent.split('\n');
  const seen = new Set();
  const deduped = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('import ')) return true;
    if (seen.has(trimmed)) return false;
    seen.add(trimmed);
    return true;
  });
  newContent = deduped.join('\n');

  if (newContent !== content) {
    writeFileSync(file, newContent, 'utf8');
    processedCount++;
    const relPath = file.replace(SRC_ROOT, 'src').replace(/\\/g, '/');
    console.log(`✓ ${relPath}`);
  }
}

console.log(`\nDone — processed: ${processedCount}, skipped: ${skippedCount}`);
