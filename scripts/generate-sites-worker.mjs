import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const distDir = fileURLToPath(new URL('../dist/', import.meta.url))
const serverDir = fileURLToPath(new URL('../dist/server/', import.meta.url))

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
}

function collectFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'server' || entry.name === '.openai') return []
      return collectFiles(fullPath)
    }

    const route = `/${relative(distDir, fullPath).replace(/\\/g, '/')}`
    const extension = extname(entry.name)
    return [{
      route,
      mimeType: mimeTypes[extension] || 'application/octet-stream',
      body: readFileSync(fullPath, 'utf8'),
    }]
  })
}

const files = collectFiles(distDir)
const routes = Object.fromEntries(files.map((file) => [file.route, {
  mimeType: file.mimeType,
  body: file.body,
}]))

mkdirSync(serverDir, { recursive: true })
writeFileSync(join(serverDir, 'index.js'), `const routes = ${JSON.stringify(routes)};

function responseFor(pathname) {
  const asset = routes[pathname] || (!pathname.includes('.') ? routes['/index.html'] : null);

  if (!asset) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(asset.body, {
    headers: {
      'content-type': asset.mimeType,
      'cache-control': pathname === '/index.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    },
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    return responseFor(url.pathname === '/' ? '/index.html' : url.pathname);
  },
};
`)
