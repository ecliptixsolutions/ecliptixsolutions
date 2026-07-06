import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const host = "127.0.0.1";
const port = Number(process.env.PORT || 5173);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff2", "font/woff2"],
]);

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return path.join(root, normalized);
}

async function resolveFile(urlPath) {
  let file = safePath(urlPath);
  let info;

  try {
    info = await stat(file);
  } catch {
    info = null;
  }

  if (info?.isDirectory()) {
    file = path.join(file, "index.html");
  } else if (!info && !path.extname(file)) {
    file = path.join(file, "index.html");
  }

  await stat(file);
  return file;
}

createServer(async (request, response) => {
  try {
    const file = await resolveFile(new URL(request.url, `http://${host}:${port}`).pathname);
    const ext = path.extname(file).toLowerCase();
    response.writeHead(200, {
      "content-type": contentTypes.get(ext) || "application/octet-stream",
      "cache-control": "no-store",
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, host, () => {
  console.log(`Local mirror running at http://${host}:${port}/`);
});
