import type { Auth } from "./auth";
import type { Db } from "./db/client";

export type Session = NonNullable<
  Awaited<ReturnType<Auth["api"]["getSession"]>>
>;

export type AppEnv = {
  Bindings: Env;
  Variables: {
    db: Db;
    auth: Auth;
    session: Session;
  };
};

export type UserRole = "admin" | "user" | "seller";
