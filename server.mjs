/**
 * Local Better Auth API Server
 * Runs on port 3000 (proxied by Vite dev server from /api)
 */
import { createServer } from "http";
import { toNodeHandler } from "better-call/node";
import { auth } from "../src/lib/auth.js";

const PORT = 3000;

const server = createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const handler = toNodeHandler(auth.handler);
    await handler(req, res);
  } catch (error) {
    console.error("Auth error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
});

server.listen(PORT, () => {
  console.log(`🔐 Better Auth API running on http://localhost:${PORT}`);
  console.log(`   Proxied by Vite at http://localhost:5173/api/auth/*`);
});

process.on("SIGINT", () => {
  console.log("\nShutting down...");
  server.close();
  process.exit(0);
});
