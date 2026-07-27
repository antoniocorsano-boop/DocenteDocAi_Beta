const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'dist');
const port = process.env.PORT || 8080;

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  try {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(root, reqPath);
    if (!filePath.startsWith(root)) {
      res.statusCode = 403;
      return res.end('Forbidden');
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
    } else {
      const indexPath = path.join(root, 'index.html');
      res.setHeader('Content-Type', 'text/html');
      fs.createReadStream(indexPath).pipe(res);
    }
  } catch (err) {
    res.statusCode = 500;
    res.end('Server error');
  }
});

server.listen(port, () => {
  console.log('Static server listening on port', port);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
