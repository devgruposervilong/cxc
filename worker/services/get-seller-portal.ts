import { refreshMorosidad } from "@/lib/morosidad";
import {
  normalizeSellerName,
  sellerNameVariants,
  type DataRow,
  type Seller,
} from "@/lib/types";
import type { Db } from "../db/client";
import { DrizzleSellerRepository } from "../repositories/drizzle-seller-repository";
import { getLatestUploadWithDocuments } from "./load-upload";

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

export async function getSellerPortal(
  db: Db,
  keyUrl: string
): Promise<SellerPortalData | null> {
  const sellerRepository = new DrizzleSellerRepository(db);
  const seller = await sellerRepository.getSellerByKeyUrl(keyUrl);
  if (!seller) return null;

  const variants = new Set(sellerNameVariants(seller));

  let fileName = "";
  let loadedAt = "";
  let rows: DataRow[] = [];

  const upload = await getLatestUploadWithDocuments(db);
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
