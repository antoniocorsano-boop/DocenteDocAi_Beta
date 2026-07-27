const fs = require('fs');
const path = require('path');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = Object.keys(pkg.dependencies || {});

function scanDir(dir, results) {
  results = results || new Set();
  var files;
  try { files = fs.readdirSync(dir, { withFileTypes: true }); } catch(e) { return results; }
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    var fp = path.join(dir, f.name);
    var skip = ['node_modules', '.git', 'dist', '__tests__', 'e2e', 'e2e-tests', 'archive'];
    if (f.isDirectory() && skip.indexOf(f.name) === -1) {
      scanDir(fp, results);
    } else if (f.isFile() && /\.(ts|tsx|js|cjs|mjs)$/.test(f.name)) {
      var c = fs.readFileSync(fp, 'utf8');
      // match: from 'pkg', import('pkg'), require('pkg')
      var re = /(?:from|import|require)\s*\(?\s*['"]([^.'"\/][^'"]*)['"]/g;
      var m;
      while ((m = re.exec(c)) !== null) {
        var raw = m[1];
        var pkgName = raw.startsWith('@') ? raw.split('/').slice(0, 2).join('/') : raw.split('/')[0];
        results.add(pkgName);
      }
    }
  }
  return results;
}

var used = scanDir('src');
// Also scan root scripts
scanDir('scripts', used);

var unused = deps.filter(function(d) { return !used.has(d); });
console.log('=== Unused production dependencies (not imported in src/ or scripts/) ===');
unused.forEach(function(d) { console.log(' - ' + d); });
console.log('\nTotal unused: ' + unused.length + ' / Total deps: ' + deps.length);
