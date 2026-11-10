import { Hono } from "hono";
import { z } from "zod";
import {
  requireAdmin,
  requireSession,
  requireStaff,
} from "../middleware/auth";
import { DrizzleSellerRepository } from "../repositories/drizzle-seller-repository";
import { getSellerPortal } from "../services/get-seller-portal";
import type { AppEnv } from "../types";
import type { SellerInput } from "@/lib/types";

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

// GET /api/sellers/catalog -> maestro completo para la seccion Tablas.
// Debe declararse antes de /:keyUrl para que no lo capture esa ruta.
app.get("/catalog", requireStaff, async (c) => {
  const sellers = await new DrizzleSellerRepository(
    c.get("db")
  ).getSellerRecords();
  return c.json({ sellers });
});

const sellerSchema = z.object({
  code: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  surname: z.string().trim().max(200).optional().nullable(),
  zone: z.string().trim().max(100).optional().nullable(),
  status: z.enum(["ACTIVO", "INACTIVO"]),
});

function toSellerInput(data: z.infer<typeof sellerSchema>): SellerInput {
  return {
    code: data.code,
    name: data.name,
    surname: data.surname?.trim() || null,
    zone: data.zone?.trim() || null,
    status: data.status,
  };
}

// POST /api/sellers
app.post("/", requireAdmin, async (c) => {
  const parsed = sellerSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Datos invalidos" }, 400);
  }

  try {
    const created = await new DrizzleSellerRepository(
      c.get("db")
    ).createSeller(toSellerInput(parsed.data));
    return c.json({ seller: created }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("UNIQUE")) {
      return c.json(
        { error: "El codigo ya pertenece a otro vendedor" },
        409
      );
    }
    throw error;
  }
});

// PATCH /api/sellers/:id
app.patch("/:id", requireAdmin, async (c) => {
  const parsed = sellerSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Datos invalidos" }, 400);
  }

  try {
    const updated = await new DrizzleSellerRepository(
      c.get("db")
    ).updateSeller(c.req.param("id"), toSellerInput(parsed.data));

    if (!updated) {
      return c.json({ error: "Vendedor no encontrado" }, 404);
    }
    return c.json({ seller: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("UNIQUE")) {
      return c.json(
        { error: "El codigo ya pertenece a otro vendedor" },
        409
      );
    }
    throw error;
  }
});

// DELETE /api/sellers/:id
app.delete("/:id", requireAdmin, async (c) => {
  const repository = new DrizzleSellerRepository(c.get("db"));
  const seller = await repository.getSellerById(c.req.param("id"));

  if (!seller) {
    return c.json({ error: "Vendedor no encontrado" }, 404);
  }
  if (seller.userId) {
    return c.json(
      {
        error:
          "El vendedor tiene un usuario vinculado. Quita el acceso desde Usuarios antes de eliminarlo.",
      },
      409
    );
  }

  await repository.deleteSeller(seller.id);
  return c.json({ deleted: true });
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
