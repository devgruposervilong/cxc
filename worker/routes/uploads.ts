import { Hono } from "hono";
import { z } from "zod";
import type { DataRow } from "@/lib/types";
import { requireAdmin, requireSession, requireStaff } from "../middleware/auth";
import { getLatestUploadWithDocuments } from "../services/load-upload";
import {
  deleteDocumentFromUpload,
  deleteUploadById,
  persistUpload,
  updateDocumentFromUpload,
} from "../services/persist-upload";
import type { AppEnv } from "../types";

const app = new Hono<AppEnv>();

const dataRowSchema: z.ZodType<DataRow> = z.object({
  rank: z.number().int(),
  client: z.string().nullable(),
  rif: z.string().nullable(),
  type: z.enum(["FACT", "N/CR"]),
  number: z.string(),
  emission: z.string().nullable(),
  expiration: z.string().nullable(),
  overdueDays: z.number(),
  total: z.number().nullable(),
  seller: z.string().nullable(),
  businessUnit: z.string().nullable().optional(),
});

const persistSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  loadedAt: z.string().min(1),
  rows: z.array(dataRowSchema).min(1),
});

// GET /api/uploads
app.get("/", requireSession, requireStaff, async (c) => {
  const data = await getLatestUploadWithDocuments(c.get("db"));
  return c.json(data);
});

// POST /api/uploads
app.post("/", requireSession, requireAdmin, async (c) => {
  const parsed = persistSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Datos invalidos" }, 400);
  }

  const result = await persistUpload(c.get("db"), parsed.data);
  return c.json(result, 201);
});

// DELETE /api/uploads/:id
app.delete("/:id", requireSession, requireAdmin, async (c) => {
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Falta el id de la carga" }, 400);
  }

  const deleted = await deleteUploadById(c.get("db"), id);
  if (!deleted) {
    return c.json({ error: "Carga no encontrada" }, 404);
  }

  return c.json({ deleted: true });
});

const documentChangesSchema = z.object({
  client: z.string().trim().min(1).max(200),
  type: z.enum(["FACT", "N/CR"]),
  number: z.string().trim().min(1).max(100),
  emission: z.string().trim().max(20).nullable(),
  expiration: z.string().trim().max(20).nullable(),
  total: z.number().nullable(),
  seller: z.string().trim().max(200).nullable(),
});

const updateDocumentSchema = z.object({
  originalType: z.enum(["FACT", "N/CR"]),
  originalNumber: z.string().min(1),
  changes: documentChangesSchema,
});

// PATCH /api/uploads/:id/documents
app.patch("/:id/documents", requireSession, requireAdmin, async (c) => {
  const id = c.req.param("id");
  const parsed = updateDocumentSchema.safeParse(
    await c.req.json().catch(() => null)
  );

  if (!id || !parsed.success) {
    return c.json({ error: "Datos invalidos" }, 400);
  }

  const updated = await updateDocumentFromUpload(
    c.get("db"),
    id,
    parsed.data.originalType,
    parsed.data.originalNumber,
    parsed.data.changes
  );

  if (!updated) {
    return c.json({ error: "Documento no encontrado" }, 404);
  }

  return c.json({ updated: true });
});

const deleteDocumentSchema = z.object({
  type: z.enum(["FACT", "N/CR"]),
  number: z.string().min(1),
});

// DELETE /api/uploads/:id/documents
app.delete("/:id/documents", requireSession, requireAdmin, async (c) => {
  const id = c.req.param("id");
  const parsed = deleteDocumentSchema.safeParse(
    await c.req.json().catch(() => null)
  );

  if (!id || !parsed.success) {
    return c.json({ error: "Datos invalidos" }, 400);
  }

  await deleteDocumentFromUpload(
    c.get("db"),
    id,
    parsed.data.type,
    parsed.data.number
  );

  return c.json({ deleted: true });
});

export default app;
