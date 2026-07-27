#!/usr/bin/env node
/**
 * MUI V7 ESLint Rules Setup
 * 
 * Este script adiciona regras customizadas do ESLint para detectar
 * o uso de sintaxe antiga do MUI V6 e sugerir a migração para V7.
 * 
 * Uso:
 *   node setup-mui-eslint.js
 */

const fs = require('fs');
const path = require('path');

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuração do ESLint customizada para MUI V7
const muiV7EslintConfig = {
  plugins: ['mui-v7-migration'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@mui/material/*/create*'],
            message: '❌ Deep imports não são mais suportados no MUI V7. Use: import { createTheme } from "@mui/material/styles"',
          },
          {
            group: ['@mui/material/*/*'],
            message: '❌ Deep imports de mais de um nível não funcionam no MUI V7. Importe do nível do módulo principal.',
          },
          {
            group: ['@mui/lab/Alert', '@mui/lab/Autocomplete', '@mui/lab/Pagination', '@mui/lab/Rating', '@mui/lab/Skeleton'],
            message: '✨ Este componente foi movido para @mui/material no V7. Atualize seu import!',
          },
        ],
        paths: [
          {
            name: '@mui/material/Grid',
            message: '⚠️ Grid foi renomeado. Use GridLegacy para o antigo Grid, ou atualize para o novo Grid (antigo Grid2).',
          },
          {
            name: '@mui/material/Grid2',
            message: '✨ Grid2 agora é apenas Grid no MUI V7. Atualize: import Grid from "@mui/material/Grid"',
          },
          {
            name: '@mui/material',
            importNames: ['Hidden'],
            message: '❌ Hidden foi removido no V7. Use sx prop com display ou useMediaQuery hook.',
          },
          {
            name: '@mui/material',
            importNames: ['createMuiTheme'],
            message: '❌ createMuiTheme foi removido. Use createTheme em vez disso.',
          },
          {
            name: '@mui/material',
            importNames: ['experimentalStyled'],
            message: '❌ experimentalStyled foi removido. Use styled em vez disso.',
          },
        ],
      },
    ],
  },
};

// Regras adicionais para detectar uso de props depreciadas
const deprecatedPropsWarnings = `
// MUI V7 - Avisos de Props Depreciadas
/* eslint-disable */
/**
 * 🚨 ATENÇÃO - Props Depreciadas no MUI V7:
 * 
 * 1. Dialog.onBackdropClick → Use onClose={(event, reason) => {...}}
 * 2. Modal.onBackdropClick → Use onClose={(event, reason) => {...}}
 * 3. InputLabel size="normal" → Use size="medium"
 * 4. Grid → Renomeado para GridLegacy (ou migre para novo Grid)
 * 5. Hidden component → Use sx prop ou useMediaQuery
 * 
 * Execute 'npm run mui-migrate' para migração automática!
 */
/* eslint-enable */
`;

// Plugin customizado do ESLint para MUI V7
const customEslintPlugin = `
module.exports = {
  rules: {
    'no-grid-deprecated': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Detecta uso do Grid depreciado do MUI V6',
          category: 'MUI V7 Migration',
          recommended: true,
        },
        fixable: 'code',
        messages: {
          useGridLegacy: '🔄 Grid foi renomeado para GridLegacy no MUI V7. Considere migrar para o novo Grid (antigo Grid2).',
          useNewGrid: '✨ Grid2 agora é Grid no MUI V7. Atualize seus imports!',
        },
      },
      create(context) {
        return {
          ImportDeclaration(node) {
            if (node.source.value === '@mui/material/Grid') {
              context.report({
                node,
                messageId: 'useGridLegacy',
              });
            }
            if (node.source.value === '@mui/material/Grid2') {
              context.report({
                node,
                messageId: 'useNewGrid',
                fix(fixer) {
                  return fixer.replaceText(
                    node.source,
                    "'@mui/material/Grid'"
                  );
                },
              });
            }
          },
        };
      },
    },
    
    'no-deep-imports': {
      meta: {
        type: 'error',
        docs: {
          description: 'Previne deep imports que não funcionam no MUI V7',
          category: 'MUI V7 Migration',
          recommended: true,
        },
        messages: {
          noDeepImport: '❌ Deep imports de mais de um nível não são suportados no MUI V7. Use: {{ suggestion }}',
        },
      },
      create(context) {
        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            
            if (importPath.startsWith('@mui/material/') && 
                importPath.split('/').length > 3) {
              const suggestion = importPath.includes('styles') 
                ? 'import { ... } from "@mui/material/styles"'
                : 'import { ... } from "@mui/material"';
                
              context.report({
                node,
                messageId: 'noDeepImport',
                data: { suggestion },
              });
            }
          },
        };
      },
    },
    
    'no-deprecated-props': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Detecta props depreciadas no MUI V7',
          category: 'MUI V7 Migration',
          recommended: true,
        },
        messages: {
          deprecatedOnBackdropClick: '⚠️ onBackdropClick foi removido. Use onClose={(event, reason) => { if (reason === "backdropClick") {...} }}',
          deprecatedInputLabelSize: '⚠️ InputLabel size="normal" foi renomeado para size="medium"',
          deprecatedHidden: '⚠️ Hidden component foi removido. Use sx prop com display ou useMediaQuery hook',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name === 'onBackdropClick') {
              context.report({
                node,
                messageId: 'deprecatedOnBackdropClick',
              });
            }
            
            if (node.name.name === 'size' && 
                node.value?.value === 'normal' &&
                context.getAncestors().some(a => 
                  a.type === 'JSXOpeningElement' && 
                  a.name?.name === 'InputLabel'
                )) {
              context.report({
                node,
                messageId: 'deprecatedInputLabelSize',
              });
            }
          },
          
          JSXElement(node) {
            if (node.openingElement.name.name === 'Hidden') {
              context.report({
                node,
                messageId: 'deprecatedHidden',
              });
            }
          },
        };
      },
    },
  },
};
`;

function setupMuiEslint() {
  log('\n🚀 Configurando ESLint para MUI V7...\n', 'cyan');

  const projectRoot = process.cwd();
  const eslintConfigPath = path.join(projectRoot, '.eslintrc.json');
  const packageJsonPath = path.join(projectRoot, 'package.json');

  // Verificar se já existe .eslintrc.json
  let eslintConfig = {};
  if (fs.existsSync(eslintConfigPath)) {
    log('✓ Arquivo .eslintrc.json encontrado', 'green');
    eslintConfig = JSON.parse(fs.readFileSync(eslintConfigPath, 'utf8'));
  } else {
    log('⚠ Criando novo arquivo .eslintrc.json', 'yellow');
  }

  // Merge das configurações
  eslintConfig.rules = {
    ...eslintConfig.rules,
    ...muiV7EslintConfig.rules,
  };

  eslintConfig.plugins = [
    ...(eslintConfig.plugins || []),
    ...muiV7EslintConfig.plugins,
  ];

  // Salvar configuração
  fs.writeFileSync(
    eslintConfigPath,
    JSON.stringify(eslintConfig, null, 2),
    'utf8'
  );

  log('✓ Regras ESLint do MUI V7 adicionadas com sucesso!\n', 'green');

  // Criar diretório para plugin customizado
  const pluginDir = path.join(projectRoot, 'eslint-plugin-mui-v7-migration');
  if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(pluginDir);
  }

  fs.writeFileSync(
    path.join(pluginDir, 'index.js'),
    customEslintPlugin,
    'utf8'
  );

  log('✓ Plugin ESLint customizado criado!\n', 'green');

  // Adicionar scripts ao package.json
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    packageJson.scripts = {
      ...packageJson.scripts,
      'lint:mui': 'eslint . --ext .ts,.tsx --fix',
      'mui-migrate': 'npx @mui/codemod v7.0.0/lab-removed-components src && npx @mui/codemod v7.0.0/grid-props src && npx @mui/codemod v7.0.0/input-label-size-normal-medium src',
    };

    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2),
      'utf8'
    );

    log('✓ Scripts de migração adicionados ao package.json\n', 'green');
  }

  // Criar arquivo de avisos
  const warningsPath = path.join(projectRoot, 'MUI_V7_MIGRATION.md');
  const warningsContent = `# MUI V7 Migration Guide

## ⚠️ Avisos Importantes

Este projeto agora tem regras ESLint configuradas para detectar uso de sintaxe antiga do MUI V6.

### Como usar:

1. **Verificar problemas:**
   \`\`\`bash
   npm run lint:mui
   \`\`\`

2. **Migração automática:**
   \`\`\`bash
   npm run mui-migrate
   \`\`\`

### Principais mudanças detectadas:

- ❌ Deep imports de mais de um nível
- ❌ Componentes movidos do @mui/lab
- ❌ Props depreciadas (onBackdropClick, size="normal", etc)
- ⚠️ Grid renomeado para GridLegacy
- ⚠️ Grid2 renomeado para Grid
- ⚠️ Hidden component removido

### Mensagens amigáveis:

O ESLint irá mostrar mensagens educativas como:

\`\`\`
✨ Este componente foi movido! Atualize de @mui/lab para @mui/material
🔄 Grid foi renomeado. Considere migrar para o novo sistema de Grid
⚠️ Esta prop foi removida. Aqui está a alternativa recomendada...
\`\`\`

Para mais informações, consulte: https://mui.com/material-ui/migration/upgrade-to-v7/
`;

  fs.writeFileSync(warningsPath, warningsContent, 'utf8');

  log('✓ Guia de migração criado: MUI_V7_MIGRATION.md\n', 'green');

  // Mensagem final
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('✅ Configuração concluída com sucesso!', 'bright');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  log('📋 Próximos passos:', 'yellow');
  log('  1. Execute: npm run lint:mui');
  log('  2. Para migração automática: npm run mui-migrate');
  log('  3. Revise o arquivo MUI_V7_MIGRATION.md\n');

  log('💡 Dica: O ESLint agora vai te guiar com mensagens amigáveis', 'cyan');
  log('   sempre que detectar código antigo do MUI V6!\n', 'cyan');
}

// Executar
try {
  setupMuiEslint();
} catch (error) {
  log('\n❌ Erro durante a configuração:', 'red');
  console.error(error);
  process.exit(1);
}
