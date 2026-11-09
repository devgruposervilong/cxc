import type { Client } from "@/lib/types";
import type { Db } from "../db/client";
import { DrizzleClientRepository } from "../repositories/drizzle-client-repository";

export async function updateClientMaster(
  db: Db,
  code: string,
  input: Client
): Promise<Client | null> {
  return new DrizzleClientRepository(db).updateClient(code, input);
}
