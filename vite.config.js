import { defineConfig, loadEnv } from 'vite';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const API_DIR = fileURLToPath(new URL('./api/', import.meta.url));

/** 배포에서 vercel.json 의 rewrites 가 하는 일을 로컬에서도 한다: 주소 → api/ 파일 이름 */
const REWRITES = { '/system/terminate': 'verify' };

/**
 * 로컬 개발용: /api/* 요청을 api/*.js 핸들러로 넘긴다. REWRITES 에 있는 주소도 같은 핸들러로 넘긴다.
 * Vercel Node 런타임의 req/res 헬퍼(req.query, req.body, res.status, res.json, res.send)를 흉내 낸다.
 * 배포 환경에서는 Vercel이 api/ 폴더를 직접 서버리스 함수로 올리므로 이 플러그인은 쓰이지 않는다.
 */
function localApi() {
  return {
    name: 'local-vercel-api',
    configureServer(server) {
      server.middlewares.use('/api', (req, res) => {
        const url = new URL(req.url, 'http://localhost');
        const name = url.pathname.replace(/^\/+|\/+$/g, '');
        // 함수가 아닌 /api 경로(_lib, 소스 파일, 없는 이름)는 Vercel 처럼 404. next() 로 넘기면 Vite 가 소스를 그대로 보낸다.
        if (!name || name.startsWith('_') || name.includes('/') || !existsSync(`${API_DIR}${name}.js`)) {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }
        return runHandler(name, url, req, res);
      });

      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        const name = REWRITES[url.pathname];
        if (!name) return next();
        return runHandler(name, url, req, res);
      });
    },
  };
}

async function runHandler(name, url, req, res) {
  const file = `${API_DIR}${name}.js`;
  try {
    // 파일이 바뀌었을 때만 새로 import 한다.
    const mod = await import(`${pathToFileURL(file).href}?v=${statSync(file).mtimeMs}`);
    req.query = Object.fromEntries(url.searchParams);
    req.body = await readBody(req);
    res.status = (code) => ((res.statusCode = code), res);
    res.json = (data) => {
      if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(data));
      return res;
    };
    res.send = (body) => (typeof body === 'object' && !Buffer.isBuffer(body) ? res.json(body) : (res.end(body), res));
    await mod.default(req, res);
  } catch (err) {
    if (err === INVALID_JSON) {
      // Vercel 도 Content-Type 이 JSON 인데 본문이 깨져 있으면 함수까지 오지 않고 400 을 보낸다
      res.statusCode = 400;
      res.end();
      return;
    }
    console.error(`[api/${name}]`, err);
    if (!res.headersSent) res.statusCode = 500;
    res.end('Internal Server Error');
  }
}

const INVALID_JSON = Symbol('invalid json');

/**
 * Vercel 과 같은 규칙으로 req.body 를 만든다 (Content-Type 기준)
 * - application/json → 객체 (깨졌으면 400)
 * - text/plain → 문자열 그대로. 콘솔에서 헤더 없이 fetch(..., { body: JSON.stringify(...) }) 하면 이렇게 온다
 * - 그 밖·헤더 없음 → undefined
 */
async function readBody(req) {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return undefined;
  const type = req.headers['content-type'] ?? '';
  const isJson = type.includes('application/json');
  if (!isJson && !type.includes('text/plain')) return undefined;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!isJson) return raw;
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    throw INVALID_JSON;
  }
}

export default defineConfig(({ mode }) => {
  // .env.local 값을 api 핸들러가 process.env 로 읽을 수 있게 한다. (VITE_ 접두사 없는 값은 클라이언트에 안 들어간다)
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''), process.env);
  return {
    plugins: [localApi()],
    build: {
      // 소스맵을 만들지 않는다 (2026-11-26). Vercel 이 Production 의 .map 을 403 으로 막아서 플레이어는 어차피 못 보고,
      // 개발자 도구가 받으려다 실패하면 콘솔에 경고만 남는다. Sources 에서 읽어야 하는 퍼즐 코드는 public/stages/ 에 둔다.
      sourcemap: false,
    },
  };
});
