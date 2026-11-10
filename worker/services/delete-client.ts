import type { Db } from "../db/client";
import { DrizzleClientRepository } from "../repositories/drizzle-client-repository";

export async function deleteClientMaster(
  db: Db,
  code: string
): Promise<boolean> {
  return new DrizzleClientRepository(db).deleteClient(code);
}
