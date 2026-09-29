import http from 'node:http';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
export async function isPublicRequest(method, pathname, root) {
  if (method !== 'GET' && method !== 'HEAD') return false;
  if (pathname.startsWith('/_next/static/') || pathname === '/icon.svg' || pathname === '/favicon.ico') return true;
  if (new RegExp(`^/(?:exhibit|api/exhibits)/${uuid}$`, 'i').test(pathname)) return true;
  if (new RegExp(`^/api/image/${uuid}$`, 'i').test(pathname)) {
    const id = pathname.split('/').at(-1);
    try {
      for (const file of await readdir(join(root, 'exhibits'))) {
        if (!file.endsWith('.json')) continue;
        const record = JSON.parse(await readFile(join(root, 'exhibits', file), 'utf8'));
        if (record.imageId === id) return true;
      }
    } catch { return false; }
  }
  return false;
}
export function authenticated(headers, password) {
  const equal = value => { const a=Buffer.from(value || ''), b=Buffer.from(password);return a.length===b.length && timingSafeEqual(a,b); };
  const cookie = (headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('craft_maker='));
  if (cookie && equal(cookie.slice('craft_maker='.length))) return true;
  if (!headers.authorization?.startsWith('Basic ')) return false;
  const basic=Buffer.from(headers.authorization.slice(6),'base64').toString();
  return basic.startsWith('maker:') && equal(basic.slice(6));
}
async function start() {
  const root=process.env.POTTERY_DATA_DIR || join(process.cwd(),'.pottery-data');
  await mkdir(root,{recursive:true});
  const password=randomBytes(24).toString('base64url');
  await writeFile(join(root,'maker-access.txt'),`Username: maker\nPassword: ${password}\n`,{mode:0o600});
  const server=http.createServer(async(req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    const authorized=authenticated(req.headers,password);
    if (!authorized && !await isPublicRequest(req.method,pathname,root)) {
      res.writeHead(401,{'WWW-Authenticate':'Basic realm="Pottery maker", charset="UTF-8"','Cache-Control':'no-store'});res.end('Maker sign-in required. Visitors should open their product QR link.');return;
    }
    if (authorized) res.setHeader('Set-Cookie',`craft_maker=${password}; HttpOnly; Secure; SameSite=Strict; Path=/`);
    const headers={...req.headers};
    if (headers.authorization?.startsWith('Basic ')) delete headers.authorization;
    // Gateway credentials never reach the app or any third-party API.
    if (headers.cookie) headers.cookie=headers.cookie.split(';').filter(x=>!x.trim().startsWith('craft_maker=')).join(';');
    const upstream=http.request({hostname:'127.0.0.1',port:3100,path:req.url,method:req.method,headers},up=>{
      res.writeHead(up.statusCode,up.headers);up.pipe(res);
    });
    upstream.on('error',()=>{res.writeHead(502);res.end('App temporarily unavailable');});
    req.pipe(upstream);
  });
  server.listen(3101,'127.0.0.1',()=>console.log('Protected gateway listening on 127.0.0.1:3101. Maker access saved locally in .pottery-data/maker-access.txt.'));
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) await start();
