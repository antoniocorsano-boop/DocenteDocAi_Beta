import { promises as fs } from 'fs';
import path from 'path';
import { baseDesignSystem } from '../design-system/index.js';

function generateColorTable() {
  let table = `### Colors\n\n`;
  table += `| Name | Hex Value (Light) | CSS Variable | Description |\n`;
  table += `|------|-------------------|--------------|-------------|\n`;

  for (const key in baseDesignSystem.colors) {
    const token = baseDesignSystem.colors[key];
    table += `| \`${key}\` | \`${token.value}\` | \`${token.cssVar}\` | ${token.description} |\n`;
  }
  return table;
}

function generateTypographyTable() {
  let table = `### Typography\n\n`;
  table += `| Name | Font Size | Font Weight | Line Height | CSS Variable Prefix | Description |\n`;
  table += `|------|-----------|-------------|-------------|---------------------|-------------|\n`;

  for (const key in baseDesignSystem.typography) {
    const token = baseDesignSystem.typography[key];
    const { fontSize, fontWeight, lineHeight } = token.value;
    table += `| \`${key}\` | ${fontSize} | ${fontWeight} | ${lineHeight} | \`${token.cssVar}-\` | ${token.description} |\n`;
  }
  return table;
}

function generateSpacingTable() {
  let table = `### Spacing\n\n`;
  table += `| Name | Value (rem) | Value (px) | CSS Variable | Description |\n`;
  table += `|------|-------------|------------|--------------|-------------|\n`;
  
  for (const key in baseDesignSystem.spacing) {
    const token = baseDesignSystem.spacing[key];
    table += `| \`space-${key}\` | ${token.value} | ${parseFloat(token.value) * 16}px | \`${token.cssVar}\` | ${token.description} |\n`;
  }
  return table;
}


async function main() {
  let markdownContent = `# Design System Documentation\n\n`;
  markdownContent += `**Version:** ${baseDesignSystem.version}\n\n`;
  markdownContent += `This document is auto-generated and provides a comprehensive overview of the design tokens used in this application.\n\n`;
  
  markdownContent += `${generateColorTable()}\n`;
  markdownContent += `${generateTypographyTable()}\n`;
  markdownContent += `${generateSpacingTable()}\n`;

  try {
    const outputPath = path.resolve('DESIGN_SYSTEM.md');
    await fs.writeFile(outputPath, markdownContent);
    console.log(`✅ Design system documentation successfully generated at ${outputPath}`);
  } catch (error) {
    console.error('❌ Error generating design system documentation:', error);
  }
}

main();