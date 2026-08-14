import type { DataRow, DocumentType, UploadModel } from "@/lib/types";

export function dbTypeToDomain(type: string): DocumentType {
  return type === "NCR" ? "N/CR" : "FACT";
}

export function domainTypeToDb(type: DocumentType): "FACT" | "NCR" {
  return type === "N/CR" ? "NCR" : "FACT";
}

type DocumentDbRow = {
  rank: number;
  client: string;
  rif: string | null;
  type: string;
  number: string;
  emission: string | null;
  expiration: string | null;
  overdueDays: number;
  total: { toNumber(): number } | null;
  seller: string | null;
};

export function dbRowToDataRow(d: DocumentDbRow): DataRow {
  return {
    rank: d.rank,
    client: d.client,
    rif: d.rif,
    type: dbTypeToDomain(d.type),
    number: d.number,
    emission: d.emission,
    expiration: d.expiration,
    overdueDays: d.overdueDays,
    total: d.total ? d.total.toNumber() : null,
    seller: d.seller,
  };
}

type UploadDbRow = {
  id: string;
  fileName: string;
  loadedAt: Date;
};

export function uploadToModel(u: UploadDbRow): UploadModel {
  return {
    id: u.id,
    fileName: u.fileName,
    loadedAt: u.loadedAt.toISOString(),
  };
}

// El frontend guarda la fecha como "DD/MM/AAAA HH:MM"
export function parseLoadedAt(value: string): Date {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (match) {
    const [, dia, mes, anio, hora, min] = match;
    const date = new Date(
      Number(anio),
      Number(mes) - 1,
      Number(dia),
      Number(hora),
      Number(min)
    );
    if (!isNaN(date.getTime())) return date;
  }
  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}
