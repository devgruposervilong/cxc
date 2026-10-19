import { Hono } from "hono";
import { requireSession } from "../middleware/auth";
import { DrizzleSellerRepository } from "../repositories/drizzle-seller-repository";
import { getSellerPortal } from "../services/get-seller-portal";
import type { AppEnv } from "../types";

const app = new Hono<AppEnv>();

app.use("*", requireSession);

// GET /api/sellers
app.get("/", async (c) => {
  const db = c.get("db");
  const session = c.get("session");
  const repository = new DrizzleSellerRepository(db);

  if (session.user.role === "seller") {
    const own = await repository.getSellerByUserId(session.user.id);
    return c.json({ sellers: own ? [own] : [] });
  }

  const sellers = await repository.getSellers();
  return c.json({
    sellers: sellers
      .filter((seller) => seller.status === "ACTIVO")
      .map((seller) => ({
        ...seller,
        userId: undefined,
      })),
  });
});

// GET /api/sellers/:keyUrl
app.get("/:keyUrl", async (c) => {
  const db = c.get("db");
  const session = c.get("session");
  const keyUrl = c.req.param("keyUrl");

  if (session.user.role === "seller") {
    const own = await new DrizzleSellerRepository(db).getSellerByUserId(
      session.user.id
    );
    if (!own || own.keyUrl !== keyUrl) {
      return c.json({ error: "Sin permiso para ver este portal" }, 403);
    }
  }

  const portal = await getSellerPortal(db, keyUrl);
  if (!portal) {
    return c.json({ error: "Vendedor no encontrado" }, 404);
  }

  return c.json(portal);
});

export default app;
