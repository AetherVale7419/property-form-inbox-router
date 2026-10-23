import { createServer } from "node:http";
import { handlePropertySubmission } from "./property_router";

const port = Number(process.env.PORT || 3000);

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/submissions") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "invalid json" }));
    return;
  }

  try {
    const result = await handlePropertySubmission(body, {
      ip: req.socket.remoteAddress || undefined
    });
    res.writeHead(result.status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "internal error";
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: message }));
  }
});

server.listen(port, () => {
  console.log(`property form server listening on http://localhost:${port}`);
});
