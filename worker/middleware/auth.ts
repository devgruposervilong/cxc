import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../types";

export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  const auth = c.get("auth");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    throw new HTTPException(401, { message: "No autenticado" });
  }

  c.set("session", session);
  await next();
});

export const requireStaff = createMiddleware<AppEnv>(async (c, next) => {
  const session = c.get("session");
  if (session.user.role !== "admin" && session.user.role !== "user") {
    throw new HTTPException(403, { message: "Sin permiso" });
  }
  await next();
});

export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const session = c.get("session");
  if (session.user.role !== "admin") {
    throw new HTTPException(403, { message: "Solo administradores" });
  }
  await next();
});
