import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
const DEFAULT_SOCKET_PATH = ".scout/scout.sock";
const PORT = Number(process.env.SCOUT_DASHBOARD_PORT ?? 7331);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

export function startServer({ staticDir }) {
  const server = http.createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400);
      res.end("Bad request");
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await proxyRequest(req, res, url);
      return;
    }

    await serveStatic(res, staticDir, url.pathname);
  });

  server.listen(PORT, () => {
    console.log(`scout-dashboard listening on http://localhost:${PORT}`);
  });
}

async function proxyRequest(req, res, url) {
  const socketPath = process.env.SCOUT_ENGINE_SOCKET ?? DEFAULT_SOCKET_PATH;
  const upstreamPath = url.pathname.replace(/^\/api/, "") + url.search;

  const proxy = http.request(
    {
      socketPath,
      path: upstreamPath,
      method: req.method,
      headers: req.headers
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxy.on("error", (error) => {
    res.writeHead(502);
    res.end(`Proxy error: ${error.message}`);
  });

  req.pipe(proxy, { end: true });
}

async function serveStatic(res, root, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.join(root, safePath);
  const resolvedRoot = path.resolve(root);
  const resolvedFile = path.resolve(filePath);
  if (!resolvedFile.startsWith(resolvedRoot)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  let content;
  try {
    content = await fs.readFile(resolvedFile);
  } catch (error) {
    if ((error.code ?? "") === "ENOENT") {
      const indexPath = path.join(root, "index.html");
      content = await fs.readFile(indexPath);
      res.writeHead(200, { "Content-Type": mimeTypes[".html"] });
      res.end(content);
      return;
    }
    res.writeHead(500);
    res.end("Server error");
    return;
  }

  const ext = path.extname(resolvedFile);
  res.writeHead(200, { "Content-Type": mimeTypes[ext] ?? "application/octet-stream" });
  res.end(content);
}
