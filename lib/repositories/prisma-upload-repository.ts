import { prisma } from "@/lib/prisma";
import type {
  CreateUploadInput,
  UploadModel,
  UploadRepository,
} from "@/lib/types";
import { parseLoadedAt, uploadToModel } from "./mappers";

export class PrismaUploadRepository implements UploadRepository {
  async createUpload(input: CreateUploadInput): Promise<UploadModel> {
    const upload = await prisma.upload.create({
      data: {
        fileName: input.fileName,
        loadedAt: parseLoadedAt(input.loadedAt),
      },
    });
    return uploadToModel(upload);
  }

  async getUploads(): Promise<UploadModel[]> {
    const uploads = await prisma.upload.findMany({
      orderBy: { loadedAt: "desc" },
    });
    return uploads.map(uploadToModel);
  }

  async getLatestUpload(): Promise<UploadModel | null> {
    const upload = await prisma.upload.findFirst({
      orderBy: { loadedAt: "desc" },
    });
    return upload ? uploadToModel(upload) : null;
  }

  async deleteUpload(id: string): Promise<void> {
    await prisma.upload.delete({ where: { id } });
  }
}
