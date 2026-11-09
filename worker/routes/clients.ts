import { Hono } from "hono";
import { requireSession, requireStaff } from "../middleware/auth";
import { getClientsCatalog } from "../services/get-clients-catalog";
import type { AppEnv } from "../types";

const app = new Hono<AppEnv>();

app.use("*", requireSession, requireStaff);

// GET /api/clients
app.get("/", async (c) => {
  const catalog = await getClientsCatalog(c.get("db"));
  return c.json(catalog);
});

export default app;
