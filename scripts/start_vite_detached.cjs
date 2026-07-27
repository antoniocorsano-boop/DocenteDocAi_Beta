const { spawn } = require('child_process');

const env = Object.assign({}, process.env, { CI: 'true' });
const child = spawn('npx', ['vite', '--port', '5173', '--clearScreen', 'false'], { detached: true, stdio: 'ignore', env });
child.unref();
console.log('Vite started detached (CI=true).');
