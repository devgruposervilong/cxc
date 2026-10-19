import { desc, eq } from "drizzle-orm";
import type {
  CreateUploadInput,
  UploadModel,
  UploadRepository,
} from "@/lib/types";
import type { Db } from "../db/client";
import { upload } from "../db/schema";
import { parseLoadedAt, uploadToModel } from "./mappers";

export class DrizzleUploadRepository implements UploadRepository {
  constructor(private readonly db: Db) {}

  async createUpload(input: CreateUploadInput): Promise<UploadModel> {
    const [row] = await this.db
      .insert(upload)
      .values({
        fileName: input.fileName,
        loadedAt: parseLoadedAt(input.loadedAt),
      })
      .returning();

    return uploadToModel(row);
  }

  async getUploads(): Promise<UploadModel[]> {
    const rows = await this.db.select().from(upload).orderBy(desc(upload.loadedAt));
    return rows.map(uploadToModel);
  }

  async getLatestUpload(): Promise<UploadModel | null> {
    const [row] = await this.db
      .select()
      .from(upload)
      .orderBy(desc(upload.loadedAt))
      .limit(1);

    return row ? uploadToModel(row) : null;
  }

  async deleteUpload(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(upload)
      .where(eq(upload.id, id))
      .returning({ id: upload.id });

    return deleted.length > 0;
  }
}
