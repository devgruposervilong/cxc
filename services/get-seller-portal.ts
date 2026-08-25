import { PrismaSellerRepository } from "@/repositories/prisma-seller-repository";
import { getLatestUploadWithDocuments } from "./load-upload";
import { refreshMorosidad } from "@/lib/morosidad";
import {
  normalizeSellerName,
  sellerNameVariants,
  type DataRow,
  type Seller,
} from "@/lib/types";

const sellerRepository = new PrismaSellerRepository();

export type SellerPortalData = {
  seller: Seller;
  fileName: string;
  loadedAt: string;
  rows: ReturnType<typeof refreshMorosidad>;
};

// Resuelve la URL pública del vendedor (uuid) a su portal de CxC: lee la
// carga más reciente, filtra los documentos que el ERP asigna al vendedor
// (por nombre o nombre+apellido) y calcula morosidad/ranking al momento.
// Devuelve null si la keyUrl no corresponde a ningún vendedor.
export async function getSellerPortal(keyUrl: string): Promise<SellerPortalData | null> {
  const seller = await sellerRepository.getSellerByKeyUrl(keyUrl);
  if (!seller) return null;

  const variants = new Set(sellerNameVariants(seller));

  let fileName = "";
  let loadedAt = "";
  let rows: DataRow[] = [];

  const upload = await getLatestUploadWithDocuments();
  if (upload) {
    fileName = upload.fileName;
    loadedAt = upload.loadedAt;
    rows = upload.rows.filter(
      (row) => row.seller !== null && variants.has(normalizeSellerName(row.seller))
    );
  }

  return {
    seller,
    fileName,
    loadedAt,
    rows: refreshMorosidad(rows),
  };
}
