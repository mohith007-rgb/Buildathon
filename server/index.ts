import express, { type NextFunction, type Request, type Response } from "express";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import multer from "multer";
import { z } from "zod";
import { ApiError, fail, ok } from "./envelope.js";
import { configFromRequest, generateJson } from "./llm.js";
import { processGeneratePipeline } from "./generatePipeline.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

const api = express.Router();

api.get("/health", (_req, res) => ok(res, { status: "up" }));

// "Test key" button in Settings. Proves the key and model work, nothing more.
api.get("/llm-check", async (req, res, next) => {
  try {
    const cfg = configFromRequest(req);
    const out = await generateJson('Return exactly {"pong": true}', z.object({ pong: z.boolean() }), cfg);
    ok(res, { provider: cfg.provider, model: cfg.model, reply: out });
  } catch (e) {
    next(e);
  }
});

// Your routes go here (Level 1 onward).

// The scorer runs your app and calls this route with the sample files, exactly like `npm run verify` does.
// Contract: multipart fields "spec" (required) and "blueprint" (optional), AI key in the x-llm-* headers.
// Reply: { success: true, data: { output: <specforge_output object>, html: "<the filled spec document>" } }
// Level 3 builds it. Until then it answers 501.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
api.post("/generate", upload.fields([{ name: "spec", maxCount: 1 }, { name: "blueprint", maxCount: 1 }]), async (req, res, next) => {
  try {
    const result = await processGeneratePipeline(req);
    ok(res, result);
  } catch (err) {
    next(err);
  }
});

// Server-side role permission enforcement for content editing
api.post("/spec/update", (req, res) => {
  const role = req.header("x-user-role") || req.body?.role || "Author";
  const { status } = req.body || {};
  if (role !== "Author") {
    return fail(res, 403, "FORBIDDEN", "Only the Author can edit course specification content.");
  }
  if (status && status !== "Draft" && status !== "Returned") {
    return fail(res, 403, "FORBIDDEN", `Content editing is locked during '${status}' state.`);
  }
  ok(res, { updated: true });
});

// Server-side governance workflow state machine and permission check
api.post("/workflow/transition", (req, res) => {
  const role = req.header("x-user-role") || req.body?.role || "Author";
  const { fromStatus, toStatus, comment } = req.body || {};

  if (toStatus === "Submitted") {
    if (role !== "Author") return fail(res, 403, "FORBIDDEN", "Only the Author can submit a course specification.");
    if (fromStatus !== "Draft" && fromStatus !== "Returned") {
      return fail(res, 400, "BAD_TRANSITION", `Cannot submit from '${fromStatus}' state.`);
    }
  } else if (toStatus === "Under Review") {
    if (role !== "Reviewer") return fail(res, 403, "FORBIDDEN", "Only the Reviewer can mark a specification Under Review.");
  } else if (toStatus === "Pending HOD") {
    if (role !== "Reviewer") return fail(res, 403, "FORBIDDEN", "Only the Reviewer can forward to Head of Department.");
  } else if (toStatus === "Approved") {
    if (role !== "HOD") return fail(res, 403, "FORBIDDEN", "Only the Head of Department can approve a course specification.");
    if (fromStatus !== "Pending HOD") {
      return fail(res, 400, "BAD_TRANSITION", "HOD approval requires prior 'Pending HOD' state.");
    }
  } else if (toStatus === "Returned") {
    if (role !== "Reviewer" && role !== "HOD") {
      return fail(res, 403, "FORBIDDEN", "Only Reviewers or HOD can return a specification.");
    }
    if (!comment || !String(comment).trim()) {
      return fail(res, 400, "COMMENT_REQUIRED", "A review comment is required when returning a specification.");
    }
  } else {
    return fail(res, 400, "BAD_STATUS", `Unknown workflow target status '${toStatus}'.`);
  }

  ok(res, { fromStatus, toStatus, by: role });
});

// Server-side artifact export to outputs/ for scoring and compliance checks
api.post("/export", (req, res) => {
  const { output, html } = req.body || {};
  if (!output || typeof output !== "object") {
    return fail(res, 400, "MISSING_DATA", "Missing 'output' object in request body.");
  }

  const outDir = path.resolve(process.cwd(), "outputs");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const jsonPath = path.join(outDir, "specforge_output.json");
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2), "utf8");

  if (html && typeof html === "string") {
    const htmlPath = path.join(outDir, "spec.html");
    fs.writeFileSync(htmlPath, html, "utf8");
  }

  ok(res, { saved: true, path: "outputs/specforge_output.json" });
});

app.use("/api/v1", api);
app.use("/api", (_req, res) => fail(res, 404, "NOT_FOUND", "No such route"));
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) return fail(res, err.status, err.code, err.message);
  console.error("Unhandled:", err instanceof Error ? err.message : "unknown error"); // never log headers or keys
  fail(res, 500, "SERVER_ERROR", "Something went wrong on the server.");
});

async function start() {
  const isDev = process.env.NODE_ENV !== "production" && process.env.npm_lifecycle_event !== "start";
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0" },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  const primaryPort = Number(process.env.PORT ?? (process.env.npm_lifecycle_event === "start" ? 3001 : 3000));
  const server = http.createServer(app);

  server.listen(primaryPort, "0.0.0.0", () => {
    console.log(`SpecForge server running on http://0.0.0.0:${primaryPort}`);
  });

  if (primaryPort !== 3001) {
    try {
      const secondaryServer = http.createServer(app);
      secondaryServer.on("error", (err: any) => {
        console.warn(`Secondary port 3001 notice: ${err.message}`);
      });
      secondaryServer.listen(3001, "0.0.0.0", () => {
        console.log(`Also listening on http://0.0.0.0:3001 for API/scorer`);
      });
    } catch {
      // ignore
    }
  }
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

