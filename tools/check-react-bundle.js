// Usage: node check-react-bundle.js <path-to-downloaded-js-bundle>
// This script checks for duplicate React, ReactDOM, and scheduler definitions in a JS bundle.

const fs = require('fs');
const path = process.argv[2];
if (!path) {
  console.error('Usage: node check-react-bundle.js <bundle.js>');
  process.exit(1);
}
const content = fs.readFileSync(path, 'utf8');

function countOccurrences(str, search) {
  return (str.match(new RegExp(search, 'g')) || []).length;
}

const reactCount = countOccurrences(content, 'react.production.min.js');
const reactDomCount = countOccurrences(content, 'react-dom.production.min.js');
const schedulerCount = countOccurrences(content, 'unstable_scheduleCallback');

console.log('Occurrences in bundle:');
console.log(`- react.production.min.js: ${reactCount}`);
console.log(`- react-dom.production.min.js: ${reactDomCount}`);
console.log(`- unstable_scheduleCallback: ${schedulerCount}`);

if (reactCount > 1 || reactDomCount > 1 || schedulerCount > 1) {
  console.warn('Warning: Possible duplicate React/ReactDOM/scheduler detected!');
} else {
  console.log('No duplicate React/ReactDOM/scheduler detected.');
}
