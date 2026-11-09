import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin, requireSession, requireStaff } from "../middleware/auth";
import { getClientsCatalog } from "../services/get-clients-catalog";
import { updateClientMaster } from "../services/update-client";
import type { AppEnv } from "../types";

const app = new Hono<AppEnv>();

app.use("*", requireSession, requireStaff);

// GET /api/clients
app.get("/", async (c) => {
  const catalog = await getClientsCatalog(c.get("db"));
  return c.json(catalog);
});

const updateClientSchema = z.object({
  code: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  rif: z.string().trim().max(50),
  seller: z.string().trim().max(200),
  businessUnit: z.enum(["BIMBO", "ECOMASTER"]),
});

// PATCH /api/clients/:code
app.patch("/:code", requireAdmin, async (c) => {
  const parsed = updateClientSchema.safeParse(
    await c.req.json().catch(() => null)
  );
  if (!parsed.success) {
    return c.json({ error: "Datos invalidos" }, 400);
  }

  try {
    const updated = await updateClientMaster(
      c.get("db"),
      c.req.param("code"),
      parsed.data
    );
    if (!updated) {
      return c.json({ error: "Cliente no encontrado" }, 404);
    }
    return c.json({ client: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("UNIQUE")) {
      return c.json(
        { error: "El codigo o el nombre ya pertenecen a otro cliente" },
        409
      );
    }
    throw error;
  }
});

export default app;
