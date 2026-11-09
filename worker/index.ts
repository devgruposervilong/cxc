import { HTTPException } from "hono/http-exception";
import { Hono } from "hono";
import { createAuth } from "./auth";
import { createDb } from "./db/client";
import type { AppEnv } from "./types";
import accountRoutes from "./routes/account";
import adminRoutes from "./routes/admin";
import clientRoutes from "./routes/clients";
import sellerRoutes from "./routes/sellers";
import uploadRoutes from "./routes/uploads";

const app = new Hono<AppEnv>();

app.use("/api/*", async (c, next) => {
  const db = createDb(c.env.DB);
  const auth = createAuth(db, c.env, new URL(c.req.url).origin);
  c.set("db", db);
  c.set("auth", auth);
  await next();
});

// Auth solo por invitacion: el alta de usuarios se hace del lado servidor en
// /api/setup y /api/invites/:token/accept. El endpoint publico se bloquea.
app.all("/api/auth/sign-up/*", (c) =>
  c.json({ error: "El registro publico esta deshabilitado" }, 403)
);

app.all("/api/auth/*", (c) => c.get("auth").handler(c.req.raw));

app.route("/api", accountRoutes);
app.route("/api/uploads", uploadRoutes);
app.route("/api/sellers", sellerRoutes);
app.route("/api/clients", clientRoutes);
app.route("/api/admin", adminRoutes);

app.get("/api/health", (c) => c.json({ ok: true }));

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ error: error.message }, error.status);
  }
  console.error("Unhandled error:", error);
  return c.json({ error: "Error interno del servidor" }, 500);
});

app.notFound((c) => c.json({ error: "No encontrado" }, 404));

export default app;
