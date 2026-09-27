// Dependency-free development server for the existing static site.
// No build or production deployment is performed.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
const option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const port = Number(option('--port', '4173'));
const host = option('--host', '127.0.0.1');
const root = path.resolve(__dirname, '..');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.mp4':'video/mp4' };
const server = http.createServer((request, response) => {
  if (!['GET','HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://preview.local').pathname); }
  catch { response.writeHead(400); response.end('Bad request'); return; }
  // Keep hidden source-control/config files outside the served surface.
  if (pathname.split('/').some(segment => segment.startsWith('.'))) { response.writeHead(404); response.end(); return; }
  let file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) { response.writeHead(404); response.end(); return; }
  try {
    if (fs.statSync(file).isDirectory()) {
      if (!pathname.endsWith('/')) { response.writeHead(302,{Location:pathname+'/'}); response.end(); return; }
      file = path.join(file,'index.html');
    }
    const size = fs.statSync(file).size;
    response.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Content-Length':size,'Cache-Control':'no-store'});
    if (request.method === 'HEAD') response.end(); else fs.createReadStream(file).pipe(response);
  } catch { response.writeHead(404,{'Content-Type':'text/plain'}); response.end('Not found'); }
});
server.on('error', error => { console.error(error.message); process.exitCode=1; });
server.listen(port,host,()=>console.log(`MONO preview listening on ${host}:${port}. Open /deep-tech/ to review the offer page.`));
