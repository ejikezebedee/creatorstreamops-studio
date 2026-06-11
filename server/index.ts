import cookieParser from "cookie-parser";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import { createRouter } from "./routes.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use("/api", createRouter());
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const dist = path.join(root, "dist");
  app.use(express.static(dist));
  app.get(/.*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed.",
          details: error.issues.map((issue) => issue.message),
        });
      }
      console.error("system error");
      return res.status(500).json({ error: "A safe server error occurred." });
    },
  );
  return app;
}

if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
  const port = Number(process.env.PORT || 4177);
  createApp().listen(port, "127.0.0.1", () => {
    console.log(
      `CreatorStreamOps Studio listening on http://127.0.0.1:${port}`,
    );
  });
}
