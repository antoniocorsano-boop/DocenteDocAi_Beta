const http = require('http');
const { spawn } = require('child_process');

function check() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5173', (res) => {
      resolve(true);
      req.destroy();
    }).on('error', () => resolve(false));
    // safety timeout
    setTimeout(() => resolve(false), 3000);
  });
}

async function main() {
  console.log('Polling http://localhost:5173 (60s timeout)...');
  for (let i = 0; i < 60; i++) {
    const up = await check();
    if (up) {
      console.log('\nServer is UP');
      break;
    }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 1000));
    if (i === 59) {
      console.error('\nServer did not respond in time');
      process.exit(2);
    }
  }

  const args = ['playwright', 'test', 'e2e/smoke.spec.ts', '-g', 'Flusso di Onboarding (Accesso Rapido)', '--trace', 'on', '--reporter=list'];
  console.log('Running: npx ' + args.join(' '));

  const env = Object.assign({}, process.env, { PW_BASE_URL: 'http://localhost:5173' });
  const p = spawn('npx', args, { stdio: 'inherit', env });
  p.on('close', (code) => {
    console.log('Playwright exited with code', code);
    process.exit(code);
  });
  p.on('error', (err) => {
    console.error('Failed to start Playwright:', err);
    process.exit(1);
  });
}

main();
