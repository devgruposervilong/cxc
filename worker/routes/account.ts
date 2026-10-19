import { and, count, eq, gt, isNull } from "drizzle-orm";
import type { Context } from "hono";
import { Hono } from "hono";
import { z } from "zod";
import { constantTimeEqual, hashToken } from "../lib/tokens";
import { requireSession } from "../middleware/auth";
import type { AppEnv } from "../types";
import { invite, seller, user } from "../db/schema";
import { DrizzleSellerRepository } from "../repositories/drizzle-seller-repository";

const app = new Hono<AppEnv>();

function copyCookies(c: Context<AppEnv>, response: Response) {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const cookies = headers.getSetCookie?.() ?? [];
  for (const cookie of cookies) {
    c.header("set-cookie", cookie, { append: true });
  }
}

async function readErrorMessage(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    message?: string;
    error?: string;
  } | null;
  return body?.message ?? body?.error ?? "No se pudo crear el usuario";
}

// GET /api/me
app.get("/me", requireSession, async (c) => {
  const { user: currentUser } = c.get("session");
  const db = c.get("db");

  let sellerInfo:
    | { keyUrl: string; name: string; surname: string | null; zone: string | null }
    | null = null;

  if (currentUser.role === "seller") {
    const row = await new DrizzleSellerRepository(db).getSellerByUserId(
      currentUser.id
    );
    if (row) {
      sellerInfo = {
        keyUrl: row.keyUrl,
        name: row.name,
        surname: row.surname,
        zone: row.zone,
      };
    }
  }

  return c.json({
    user: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
    },
    seller: sellerInfo,
  });
});

// GET /api/setup/status
app.get("/setup/status", async (c) => {
  const db = c.get("db");
  const [row] = await db.select({ value: count() }).from(user);
  return c.json({ needsSetup: Number(row?.value ?? 0) === 0 });
});

const setupSchema = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(128),
});

// POST /api/setup
app.post("/setup", async (c) => {
  const db = c.get("db");
  const auth = c.get("auth");

  const [row] = await db.select({ value: count() }).from(user);
  if (Number(row?.value ?? 0) > 0) {
    return c.json({ error: "La aplicacion ya fue inicializada" }, 409);
  }

  const parsed = setupSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Datos invalidos" }, 400);
  }

  if (!c.env.SETUP_TOKEN || !constantTimeEqual(parsed.data.token, c.env.SETUP_TOKEN)) {
    return c.json({ error: "Token de instalacion invalido" }, 403);
  }

  const email = parsed.data.email.toLowerCase();
  const signUp = await auth.api.signUpEmail({
    body: {
      name: parsed.data.name,
      email,
      password: parsed.data.password,
    },
    asResponse: true,
  });

  if (!signUp.ok) {
    return c.json({ error: await readErrorMessage(signUp) }, 400);
  }

  const data = (await signUp.json()) as { user: { id: string } };

  try {
    await db
      .update(user)
      .set({ role: "admin", emailVerified: true })
      .where(eq(user.id, data.user.id));
  } catch (error) {
    await db.delete(user).where(eq(user.id, data.user.id));
    throw error;
  }

  copyCookies(c, signUp);
  return c.json({ ok: true });
});

// GET /api/invites/:token
app.get("/invites/:token", async (c) => {
  const db = c.get("db");
  const token = c.req.param("token");
  const tokenHash = await hashToken(token);

  const [found] = await db
    .select()
    .from(invite)
    .where(
      and(
        eq(invite.tokenHash, tokenHash),
        isNull(invite.acceptedAt),
        gt(invite.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!found) {
    return c.json({ error: "Invitacion invalida o vencida" }, 404);
  }

  let sellerName: string | null = null;
  if (found.sellerId) {
    const [sellerRow] = await db
      .select({ name: seller.name, surname: seller.surname })
      .from(seller)
      .where(eq(seller.id, found.sellerId))
      .limit(1);
    if (sellerRow) {
      sellerName = [sellerRow.name, sellerRow.surname].filter(Boolean).join(" ");
    }
  }

  return c.json({
    email: found.email,
    role: found.role,
    sellerName,
    expiresAt: found.expiresAt.toISOString(),
  });
});

const acceptInviteSchema = z.object({
  name: z.string().trim().min(2).max(120),
  password: z.string().min(8).max(128),
});

// POST /api/invites/:token/accept
app.post("/invites/:token/accept", async (c) => {
  const db = c.get("db");
  const auth = c.get("auth");
  const token = c.req.param("token");
  const tokenHash = await hashToken(token);

  const [found] = await db
    .select()
    .from(invite)
    .where(
      and(
        eq(invite.tokenHash, tokenHash),
        isNull(invite.acceptedAt),
        gt(invite.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!found) {
    return c.json({ error: "Invitacion invalida o vencida" }, 404);
  }

  const parsed = acceptInviteSchema.safeParse(
    await c.req.json().catch(() => null)
  );
  if (!parsed.success) {
    return c.json({ error: "Datos invalidos" }, 400);
  }

  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, found.email))
    .limit(1);

  if (existing) {
    return c.json({ error: "El correo ya tiene una cuenta" }, 409);
  }

  if (found.role === "seller") {
    if (!found.sellerId) {
      return c.json({ error: "La invitacion no tiene vendedor asignado" }, 400);
    }
    const [sellerRow] = await db
      .select({ userId: seller.userId })
      .from(seller)
      .where(eq(seller.id, found.sellerId))
      .limit(1);
    if (!sellerRow) {
      return c.json({ error: "El vendedor ya no existe" }, 409);
    }
    if (sellerRow.userId) {
      return c.json({ error: "El vendedor ya tiene un usuario" }, 409);
    }
  }

  const signUp = await auth.api.signUpEmail({
    body: {
      name: parsed.data.name,
      email: found.email,
      password: parsed.data.password,
    },
    asResponse: true,
  });

  if (!signUp.ok) {
    return c.json({ error: await readErrorMessage(signUp) }, 400);
  }

  const data = (await signUp.json()) as { user: { id: string } };

  try {
    const statements: any[] = [
      db
        .update(user)
        .set({ role: found.role, emailVerified: true })
        .where(eq(user.id, data.user.id)),
      db
        .update(invite)
        .set({ acceptedAt: new Date() })
        .where(eq(invite.id, found.id)),
    ];

    if (found.role === "seller" && found.sellerId) {
      statements.push(
        db
          .update(seller)
          .set({ userId: data.user.id })
          .where(eq(seller.id, found.sellerId))
      );
    }

    await db.batch(statements as any);
  } catch (error) {
    await db.delete(user).where(eq(user.id, data.user.id));
    throw error;
  }

  copyCookies(c, signUp);
  return c.json({ ok: true });
});

export default app;
