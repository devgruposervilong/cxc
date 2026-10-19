import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin } from "better-auth/plugins";
import { createId } from "@paralleldrive/cuid2";
import type { Db } from "./db/client";
import * as schema from "./db/schema";

export function createAuth(db: Db, env: Env, baseURL: string) {
  return betterAuth({
    baseURL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
      camelCase: true,
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      autoSignIn: true,
      minPasswordLength: 8,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      database: {
        generateId: () => createId(),
      },
    },
    trustedOrigins: [baseURL],
    plugins: [
      admin({
        defaultRole: "user",
        adminRoles: ["admin"],
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
