import { prisma } from "@/lib/prisma";
import type {
  CreateUploadInput,
  UploadModel,
  UploadRepository,
} from "@/lib/types";
import { parseLoadedAt, uploadToModel } from "./mappers";

export class PrismaUploadRepository implements UploadRepository {
  async createUpload(input: CreateUploadInput): Promise<UploadModel> {
    const upload = await prisma.carga.create({
      data: {
        nombreArchivo: input.fileName,
        cargadoEn: parseLoadedAt(input.loadedAt),
      },
    });
    return uploadToModel(upload);
  }

  async getUploads(): Promise<UploadModel[]> {
    const uploads = await prisma.carga.findMany({
      orderBy: { cargadoEn: "desc" },
    });
    return uploads.map(uploadToModel);
  }

  async getLatestUpload(): Promise<UploadModel | null> {
    const upload = await prisma.carga.findFirst({
      orderBy: { cargadoEn: "desc" },
    });
    return upload ? uploadToModel(upload) : null;
  }

  async deleteUpload(id: string): Promise<void> {
    await prisma.carga.delete({ where: { id } });
  }
}