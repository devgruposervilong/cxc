import { and, count, desc, eq, gt, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { sendInviteEmail } from "../email";
import { generateInviteToken, hashToken } from "../lib/tokens";
import { requireAdmin, requireSession } from "../middleware/auth";
import type { AppEnv } from "../types";
import { invite, seller, session, user } from "../db/schema";

const app = new Hono<AppEnv>();

app.use("*", requireSession, requireAdmin);

// GET /api/admin/users
app.get("/users", async (c) => {
  const db = c.get("db");

  const [users, sellers] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt)),
    db
      .select({
        id: seller.id,
        code: seller.code,
        name: seller.name,
        surname: seller.surname,
        userId: seller.userId,
      })
      .from(seller),
  ]);

  const sellerByUser = new Map(
    sellers.filter((row) => row.userId).map((row) => [row.userId!, row])
  );

  return c.json({
    users: users.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      seller: sellerByUser.get(row.id) ?? null,
    })),
    sellers,
  });
});

const updateUserSchema = z.object({
  role: z.enum(["admin", "user", "seller"]).optional(),
  sellerId: z.string().nullable().optional(),
  banned: z.boolean().optional(),
  banReason: z.string().trim().max(200).optional(),
});

// PATCH /api/admin/users/:id
app.patch("/users/:id", async (c) => {
  const db = c.get("db");
  const current = c.get("session");
  const targetId = c.req.param("id");

  const parsed = updateUserSchema.safeParse(
    await c.req.json().catch(() => null)
  );
  if (!parsed.success) {
    return c.json({ error: "Datos invalidos" }, 400);
  }

  const [target] = await db
    .select()
    .from(user)
    .where(eq(user.id, targetId))
    .limit(1);

  if (!target) {
    return c.json({ error: "Usuario no encontrado" }, 404);
  }

  if (target.id === current.user.id) {
    return c.json(
      { error: "No puedes cambiar tu propio rol o estado" },
      400
    );
  }

  if (
    parsed.data.role &&
    target.role === "admin" &&
    parsed.data.role !== "admin"
  ) {
    const [admins] = await db
      .select({ value: count() })
      .from(user)
      .where(eq(user.role, "admin"));
    if (Number(admins?.value ?? 0) <= 1) {
      return c.json({ error: "Debe existir al menos un administrador" }, 400);
    }
  }

  const statements: any[] = [];
  const userChanges: Partial<typeof user.$inferInsert> = {};

  if (parsed.data.role) {
    userChanges.role = parsed.data.role;

    if (parsed.data.role === "seller") {
      if (!parsed.data.sellerId) {
        return c.json(
          { error: "Selecciona el vendedor para asignar el rol" },
          400
        );
      }

      const [sellerRow] = await db
        .select()
        .from(seller)
        .where(eq(seller.id, parsed.data.sellerId))
        .limit(1);

      if (!sellerRow) {
        return c.json({ error: "Vendedor no encontrado" }, 404);
      }
      if (sellerRow.userId && sellerRow.userId !== target.id) {
        return c.json({ error: "El vendedor ya tiene un usuario" }, 409);
      }

      statements.push(
        db.update(seller).set({ userId: null }).where(eq(seller.userId, target.id)),
        db
          .update(seller)
          .set({ userId: target.id })
          .where(eq(seller.id, sellerRow.id))
      );
    } else {
      statements.push(
        db.update(seller).set({ userId: null }).where(eq(seller.userId, target.id))
      );
    }
  }

  if (parsed.data.banned !== undefined) {
    userChanges.banned = parsed.data.banned;
    userChanges.banReason = parsed.data.banned
      ? parsed.data.banReason ?? "Bloqueado por un administrador"
      : null;
    userChanges.banExpires = null;

    if (parsed.data.banned) {
      statements.push(db.delete(session).where(eq(session.userId, target.id)));
    }
  }

  if (Object.keys(userChanges).length > 0) {
    statements.push(
      db.update(user).set(userChanges).where(eq(user.id, target.id))
    );
  }

  if (statements.length > 0) {
    await db.batch(statements as any);
  }

  return c.json({ ok: true });
});

// GET /api/admin/invites
app.get("/invites", async (c) => {
  const db = c.get("db");
  const rows = await db
    .select({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      sellerId: invite.sellerId,
      expiresAt: invite.expiresAt,
      acceptedAt: invite.acceptedAt,
      createdAt: invite.createdAt,
      sellerName: seller.name,
      sellerSurname: seller.surname,
    })
    .from(invite)
    .leftJoin(seller, eq(invite.sellerId, seller.id))
    .where(isNull(invite.acceptedAt))
    .orderBy(desc(invite.createdAt));

  return c.json({
    invites: rows.map((row) => ({
      ...row,
      expiresAt: row.expiresAt.toISOString(),
      acceptedAt: row.acceptedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      expired: row.expiresAt.getTime() < Date.now(),
      sellerName: row.sellerName
        ? [row.sellerName, row.sellerSurname].filter(Boolean).join(" ")
        : null,
    })),
  });
});

const createInviteSchema = z.object({
  email: z.string().trim().email().max(200),
  role: z.enum(["admin", "user", "seller"]),
  sellerId: z.string().optional().nullable(),
});

// POST /api/admin/invites
app.post("/invites", async (c) => {
  const db = c.get("db");
  const current = c.get("session");

  const parsed = createInviteSchema.safeParse(
    await c.req.json().catch(() => null)
  );
  if (!parsed.success) {
    return c.json({ error: "Datos invalidos" }, 400);
  }

  const email = parsed.data.email.toLowerCase();

  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existingUser) {
    return c.json({ error: "El correo ya tiene una cuenta" }, 409);
  }

  if (parsed.data.role === "seller") {
    if (!parsed.data.sellerId) {
      return c.json({ error: "Selecciona un vendedor" }, 400);
    }

    const [sellerRow] = await db
      .select()
      .from(seller)
      .where(eq(seller.id, parsed.data.sellerId))
      .limit(1);

    if (!sellerRow) {
      return c.json({ error: "Vendedor no encontrado" }, 404);
    }
    if (sellerRow.userId) {
      return c.json({ error: "El vendedor ya tiene un usuario" }, 409);
    }

    const [pending] = await db
      .select({ id: invite.id })
      .from(invite)
      .where(
        and(
          eq(invite.sellerId, parsed.data.sellerId),
          isNull(invite.acceptedAt),
          gt(invite.expiresAt, new Date())
        )
      )
      .limit(1);

    if (pending) {
      return c.json({ error: "El vendedor ya tiene una invitacion pendiente" }, 409);
    }
  }

  const token = generateInviteToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db
    .delete(invite)
    .where(and(eq(invite.email, email), isNull(invite.acceptedAt)));

  await db.insert(invite).values({
    email,
    tokenHash,
    role: parsed.data.role,
    sellerId: parsed.data.role === "seller" ? parsed.data.sellerId : null,
    expiresAt,
    createdBy: current.user.id,
  });

  const inviteUrl = `${new URL(c.req.url).origin}/invitacion/${token}`;
  let emailSent = false;
  try {
    emailSent = await sendInviteEmail(c.env, {
      to: email,
      inviteUrl,
      role: parsed.data.role,
    });
  } catch (error) {
    console.error("sendInviteEmail failed:", error);
  }

  return c.json({ inviteUrl, emailSent, expiresAt: expiresAt.toISOString() }, 201);
});

// DELETE /api/admin/invites/:id
app.delete("/invites/:id", async (c) => {
  const db = c.get("db");
  await db.delete(invite).where(eq(invite.id, c.req.param("id")));
  return c.json({ deleted: true });
});

// GET /api/admin/sellers
app.get("/sellers", async (c) => {
  const db = c.get("db");
  const rows = await db
    .select({
      id: seller.id,
      code: seller.code,
      name: seller.name,
      surname: seller.surname,
      zone: seller.zone,
      keyUrl: seller.keyUrl,
      status: seller.status,
      userId: seller.userId,
    })
    .from(seller)
    .orderBy(seller.code);

  return c.json({ sellers: rows });
});

export default app;
