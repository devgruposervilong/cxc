import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

const cuid = () => createId();

// ---------------------------------------------------------------------------
// Better Auth: esquema core + plugin admin
// ---------------------------------------------------------------------------

export const user = sqliteTable("user", {
  id: text("id").primaryKey().$defaultFn(cuid),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  // Plugin admin
  role: text("role").notNull().default("user"),
  banned: integer("banned", { mode: "boolean" }).notNull().default(false),
  banReason: text("banReason"),
  banExpires: integer("banExpires", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey().$defaultFn(cuid),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonatedBy"),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey().$defaultFn(cuid),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey().$defaultFn(cuid),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// ---------------------------------------------------------------------------
// Dominio CxC
// ---------------------------------------------------------------------------

export const upload = sqliteTable("upload", {
  id: text("id").primaryKey().$defaultFn(cuid),
  fileName: text("fileName").notNull(),
  loadedAt: integer("loadedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const document = sqliteTable(
  "document",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    uploadId: text("uploadId")
      .notNull()
      .references(() => upload.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    client: text("client").notNull(),
    rif: text("rif"),
    type: text("type", { enum: ["FACT", "NCR"] }).notNull(),
    number: text("number").notNull(),
    emission: text("emission"),
    expiration: text("expiration"),
    total: real("total"),
    seller: text("seller"),
  },
  (table) => [index("document_upload_idx").on(table.uploadId)],
);

export const client = sqliteTable("client", {
  id: text("id").primaryKey().$defaultFn(cuid),
  code: text("code").notNull().unique(),
  name: text("name").notNull().unique(),
  rif: text("rif").notNull(),
  seller: text("seller").notNull(),
  businessUnit: text("businessUnit").notNull(),
});

export const seller = sqliteTable("seller", {
  id: text("id").primaryKey().$defaultFn(cuid),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  surname: text("surname"),
  zone: text("zone"),
  keyUrl: text("keyUrl").notNull().unique(),
  status: text("status", { enum: ["ACTIVO", "INACTIVO"] })
    .notNull()
    .default("ACTIVO"),
  userId: text("userId")
    .unique()
    .references(() => user.id, { onDelete: "set null" }),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

// ---------------------------------------------------------------------------
// Invitaciones (creacion de usuarios desde adentro)
// ---------------------------------------------------------------------------

export const invite = sqliteTable(
  "invite",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    email: text("email").notNull(),
    tokenHash: text("tokenHash").notNull().unique(),
    role: text("role", { enum: ["admin", "user", "seller"] })
      .notNull()
      .default("user"),
    sellerId: text("sellerId").references(() => seller.id, {
      onDelete: "set null",
    }),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    acceptedAt: integer("acceptedAt", { mode: "timestamp" }),
    createdBy: text("createdBy")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index("invite_email_idx").on(table.email)],
);

export const schema = {
  user,
  session,
  account,
  verification,
  upload,
  document,
  client,
  seller,
  invite,
};
