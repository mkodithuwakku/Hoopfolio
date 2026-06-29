import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import {
  advanceTestMarketDay,
  buyTestStock,
  getTestMarketSnapshot,
  resetTestMarket,
  searchTestMarket,
  sellTestStock
} from "../src/data/providers/testMarketProvider.mjs";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir = join(rootDir, "public");
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? "127.0.0.1";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8"
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/api/health") {
      return sendJson(res, {
        ok: true,
        app: "Hoopfolio",
        dataMode: "local-cache",
        liveProviderCalls: false
      });
    }

    if (url.pathname === "/api/market/snapshot") {
      return sendJson(res, await getTestMarketSnapshot());
    }

    if (url.pathname === "/api/market/search") {
      return sendJson(
        res,
        await searchTestMarket({
          query: url.searchParams.get("q") ?? "",
          sort: url.searchParams.get("sort") ?? "projectedReturnDesc",
          filters: parseFilters(url.searchParams)
        })
      );
    }

    if (url.pathname === "/api/teams") {
      const snapshot = await getTestMarketSnapshot();
      return sendJson(res, snapshot.teams);
    }

    if (req.method === "POST" && url.pathname === "/api/sim/reset") {
      return sendJson(res, await resetTestMarket());
    }

    if (req.method === "POST" && url.pathname === "/api/sim/advance-day") {
      return sendJson(res, await advanceTestMarketDay());
    }

    if (req.method === "POST" && url.pathname === "/api/trades/buy") {
      const body = await readJsonBody(req);
      return sendJson(
        res,
        await buyTestStock({
          playerId: body.playerId,
          amountCoins: body.amountCoins
        })
      );
    }

    if (req.method === "POST" && url.pathname === "/api/trades/sell") {
      const body = await readJsonBody(req);
      return sendJson(
        res,
        await sellTestStock({
          playerId: body.playerId,
          shares: body.shares ?? "all"
        })
      );
    }

    return serveStatic(url.pathname, res);
  } catch (error) {
    console.error(error);
    sendJson(
      res,
      {
        ok: false,
        error: error.code ?? "INTERNAL_ERROR",
        message: error.message
      },
      error.code ? 400 : 500
    );
  }
});

server.listen(port, host, () => {
  console.log(`Hoopfolio dev server running at http://${host}:${port}`);
});

function parseFilters(searchParams) {
  const filters = {};
  if (searchParams.get("team")) filters.team = searchParams.get("team");
  if (searchParams.get("position")) filters.position = searchParams.get("position");
  if (searchParams.get("boostEligible") === "true") filters.boostEligible = true;
  if (searchParams.get("buyLowOnly") === "true") filters.buyLowOnly = true;
  if (searchParams.get("trendingOnly") === "true") filters.trendingOnly = true;
  if (searchParams.get("maxPrice")) filters.maxPrice = Number(searchParams.get("maxPrice"));
  if (searchParams.get("minProjectedReturn")) {
    filters.minProjectedReturn = Number(searchParams.get("minProjectedReturn"));
  }
  if (searchParams.get("gamesRemaining")) {
    filters.gamesRemaining = Number(searchParams.get("gamesRemaining"));
  }
  return filters;
}

async function serveStatic(pathname, res) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = normalize(join(publicDir, requestedPath));
  if (!filePath.startsWith(publicDir)) {
    return sendText(res, "Not found", 404);
  }

  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      "cache-control": "no-store",
      "content-type": mimeTypes[extname(filePath)] ?? "application/octet-stream"
    });
    res.end(body);
  } catch (error) {
    if (error.code === "ENOENT") {
      return sendText(res, "Not found", 404);
    }
    throw error;
  }
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(data, null, 2));
}

function sendText(res, text, status = 200) {
  res.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "text/plain; charset=utf-8"
  });
  res.end(text);
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  return rawBody ? JSON.parse(rawBody) : {};
}
