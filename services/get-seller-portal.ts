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

// Formatea el loadedAt (UTC) como DD/MM/AAAA HH:MM a. m./p. m. en hora de
// Venezuela, replicando el formato de la página principal pero fijando la
// zona America/Caracas para no depender del timezone local.
const caracasFormatter = new Intl.DateTimeFormat("es-VE", {
  timeZone: "America/Caracas",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

function formatLoadedAtCaracas(loadedAt: string): string {
  const d = new Date(loadedAt);
  if (isNaN(d.getTime())) return loadedAt;
  const parts = caracasFormatter.formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")} ${get("dayPeriod")}`;
}

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
    loadedAt: formatLoadedAtCaracas(loadedAt),
    rows: refreshMorosidad(rows),
  };
}
