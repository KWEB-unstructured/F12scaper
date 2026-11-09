import { defineConfig, loadEnv } from 'vite';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const API_DIR = fileURLToPath(new URL('./api/', import.meta.url));

/**
 * 로컬 개발용: /api/* 요청을 api/*.js 핸들러로 넘긴다.
 * Vercel Node 런타임의 req/res 헬퍼(req.query, req.body, res.status, res.json, res.send)를 흉내 낸다.
 * 배포 환경에서는 Vercel이 api/ 폴더를 직접 서버리스 함수로 올리므로 이 플러그인은 쓰이지 않는다.
 */
function localApi() {
  return {
    name: 'local-vercel-api',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        const name = url.pathname.replace(/^\/+|\/+$/g, '');
        const file = `${API_DIR}${name}.js`;
        // _lib 처럼 _ 로 시작하는 파일은 Vercel에서도 라우트가 아니다.
        if (!name || name.startsWith('_') || name.includes('/') || !existsSync(file)) {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }
        try {
          // 파일이 바뀌었을 때만 새로 import 한다.
          const mod = await import(`${pathToFileURL(file).href}?v=${statSync(file).mtimeMs}`);
          req.query = Object.fromEntries(url.searchParams);
          req.body = await readJsonBody(req);
          res.status = (code) => ((res.statusCode = code), res);
          res.json = (data) => {
            if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(data));
            return res;
          };
          res.send = (body) => (typeof body === 'object' && !Buffer.isBuffer(body) ? res.json(body) : (res.end(body), res));
          await mod.default(req, res);
        } catch (err) {
          console.error(`[api/${name}]`, err);
          if (!res.headersSent) res.statusCode = 500;
          res.end('Internal Server Error');
        }
      });
    },
  };
}

async function readJsonBody(req) {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return undefined;
  const type = req.headers['content-type'] ?? '';
  if (!type.includes('application/json')) return undefined;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export default defineConfig(({ mode }) => {
  // .env.local 값을 api 핸들러가 process.env 로 읽을 수 있게 한다. (VITE_ 접두사 없는 값은 클라이언트에 안 들어간다)
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''), process.env);
  return {
    plugins: [localApi()],
    build: {
      // 플레이어가 Sources 탭에서 원본 코드를 읽을 수 있게 소스맵을 같이 배포한다.
      sourcemap: true,
    },
  };
});
