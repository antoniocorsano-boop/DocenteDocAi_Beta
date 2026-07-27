const fs = require('fs');
const path = require('path');
const pkgJson = JSON.parse(fs.readFileSync('package.json','utf8'));
const allDeps = Object.keys({...pkgJson.dependencies, ...(pkgJson.devDependencies||{})});

function scanDir(dir, results) {
  results = results || new Set();
  var files = fs.readdirSync(dir, {withFileTypes:true});
  for (var i=0;i<files.length;i++) {
    var f = files[i];
    var fp = path.join(dir, f.name);
    if (f.isDirectory() && ['node_modules','.git','dist','__tests__','e2e'].indexOf(f.name)===-1) {
      scanDir(fp, results);
    } else if (f.isFile() && /\.(ts|tsx|js|jsx)$/.test(f.name)) {
      var content = fs.readFileSync(fp,'utf8');
      var re = /from\s+['"]([^.'"\/][^'"]*)['"]/g;
      var m;
      while ((m = re.exec(content)) !== null) {
        var raw = m[1];
        var pkg = raw.startsWith('@') ? raw.split('/').slice(0,2).join('/') : raw.split('/')[0];
        if (allDeps.indexOf(pkg) !== -1) results.add(pkg);
      }
    }
  }
  return results;
}

var used = scanDir('src');
var knownChunks = ['react','react-dom','scheduler','jspdf','pdf-lib','mammoth','docx','file-saver','@google/genai','lighthouse','chrome-launcher','@dnd-kit/core','@dnd-kit/utilities','papaparse'];
var inVendor = Array.from(used).filter(function(p){ return knownChunks.indexOf(p)===-1; }).sort();
console.log('=== Packages ending up in vendor.js ===');
inVendor.forEach(function(p){ console.log(' - '+p); });
console.log('\nTotal: '+inVendor.length+' packages');
