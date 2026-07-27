const fs = require('fs');
const path = require('path');

// Find vendor chunk
const distDir = path.join(__dirname, '../dist/assets');
const files = fs.readdirSync(distDir);
const vendorFile = files.find(f => f.startsWith('vendor-') && f.endsWith('.js') && !f.includes('.gz') && !f.includes('.br'));

if (!vendorFile) {
  console.log('No vendor chunk found');
  process.exit(1);
}

const vendorPath = path.join(distDir, vendorFile);
const content = fs.readFileSync(vendorPath, 'utf8');

console.log(`Vendor chunk: ${vendorFile} (${Math.round(content.length/1024)} KB unminified)`);
console.log('');

// Check for specific packages by searching for recognizable strings
const checks = {
  '@mui/icons-material': [/SvgIcon.*aria-hidden/, /data-testid.*svg/, /AutoAwesome/, /DeleteIcon/, /InfoIcon/],
  'opentelemetry': [/opentelemetry/, /@opentelemetry/],
  'zustand': [/createStore/, /subscribeWithSelector/, /zustand/i],
  'papaparse': [/PapaParse/, /papaparse/i, /parseCSV/],
  'recharts': [/recharts/, /CartesianGrid/],
  'fuse.js': [/Fuse\.prototype/, /fuseOptions/],
  'workbox': [/workbox/, /WorkboxPlugin/],
  'idb': [/idbKeyVal/, /openDB/],
};

for (const [pkg, patterns] of Object.entries(checks)) {
  const found = patterns.some(p => p.test(content));
  console.log(`  ${found ? '✓' : '✗'} ${pkg}`);
}

// Look for preserved package.json name strings or comment blocks
const commentMatches = content.match(/\/\*\*?\s*@license[^*]*\*\//g) || [];
console.log('\nLicense headers found:', commentMatches.length);
commentMatches.slice(0, 5).forEach(m => console.log(' ', m.substring(0, 150)));

// Try sourceUrl or similar debug markers
const sourceUrls = content.match(/\/\/# source(?:Mapping)?URL=[^\n]+/g) || [];
if (sourceUrls.length) console.log('\nSource maps:', sourceUrls.slice(0, 3));

// Look for recognizable library version strings  
const versions = content.match(/"version"\s*:\s*"[0-9]+\.[0-9]+\.[0-9]+"/g) || [];
console.log('\nVersion strings:', [...new Set(versions)].slice(0, 10).join(', '));

// PDF specific: TextLayer class name (very specific to pdfjs)
if (/TextLayerRenderTask|PDFDocumentLoadingTask|getDocument\(/.test(content)) console.log('\n⚠ Contains pdfjs-dist API');
else console.log('\n✓ No pdfjs-dist API found in vendor');

// Check for zustand actual size
const zustandMatch = content.match(/(createStore|subscribeWithSelector)/);
if (zustandMatch) {
  const pos = content.indexOf('zustand');
  console.log('\nzustand at position:', Math.round(pos/1024), 'KB');
}
