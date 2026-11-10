import type { Client } from "@/lib/types";
import type { Db } from "../db/client";
import { DrizzleClientRepository } from "../repositories/drizzle-client-repository";

export async function createClientMaster(
  db: Db,
  input: Client
): Promise<Client> {
  return new DrizzleClientRepository(db).createClient(input);
}
