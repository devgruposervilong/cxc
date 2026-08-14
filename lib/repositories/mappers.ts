import type { DocumentModel, DocumentType, UploadModel } from "@/lib/types";

export function dbTypeToDomain(type: string): DocumentType {
  return type === "NCR" ? "N/CR" : "FACT";
}

export function domainTypeToDb(type: DocumentType): "FACT" | "NCR" {
  return type === "N/CR" ? "NCR" : "FACT";
}

type DocumentDbRow = {
  id: string;
  cargaId: string;
  clienteId: string | null;
  vendedorId: string | null;
  tipo: string;
  numero: string;
  emision: string | null;
  vencimiento: string | null;
  morosidad: number;
  total: { toNumber(): number } | null;
};

export function documentToModel(d: DocumentDbRow): DocumentModel {
  return {
    id: d.id,
    uploadId: d.cargaId,
    clientId: d.clienteId,
    sellerId: d.vendedorId,
    type: dbTypeToDomain(d.tipo),
    numero: d.numero,
    emision: d.emision,
    vencimiento: d.vencimiento,
    morosidad: d.morosidad,
    total: d.total ? d.total.toNumber() : null,
  };
}

type UploadDbRow = {
  id: string;
  nombreArchivo: string;
  cargadoEn: Date;
};

export function uploadToModel(c: UploadDbRow): UploadModel {
  return {
    id: c.id,
    fileName: c.nombreArchivo,
    loadedAt: c.cargadoEn.toISOString(),
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