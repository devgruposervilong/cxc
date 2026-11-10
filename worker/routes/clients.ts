import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin, requireSession, requireStaff } from "../middleware/auth";
import { createClientMaster } from "../services/create-client";
import { deleteClientMaster } from "../services/delete-client";
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

const clientSchema = z.object({
  code: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  rif: z.string().trim().max(50),
  seller: z.string().trim().max(200),
  businessUnit: z.string().trim().max(100),
});

// POST /api/clients
app.post("/", requireAdmin, async (c) => {
  const parsed = clientSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Datos invalidos" }, 400);
  }

  try {
    const created = await createClientMaster(c.get("db"), parsed.data);
    return c.json({ client: created }, 201);
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

// PATCH /api/clients/:code
app.patch("/:code", requireAdmin, async (c) => {
  const parsed = clientSchema.safeParse(await c.req.json().catch(() => null));
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

// DELETE /api/clients/:code
app.delete("/:code", requireAdmin, async (c) => {
  const deleted = await deleteClientMaster(c.get("db"), c.req.param("code"));
  if (!deleted) {
    return c.json({ error: "Cliente no encontrado" }, 404);
  }
  return c.json({ deleted: true });
});

export default app;
