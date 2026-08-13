import type { CargaModel, DocumentoModel, TipoDocumento } from "@/lib/types";

export function tipoDbADominio(tipo: string): TipoDocumento {
  return tipo === "NCR" ? "N/CR" : "FACT";
}

export function tipoDominioADb(tipo: TipoDocumento): "FACT" | "NCR" {
  return tipo === "N/CR" ? "NCR" : "FACT";
}

type FilaDocumento = {
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

export function documentoAModelo(d: FilaDocumento): DocumentoModel {
  return {
    id: d.id,
    cargaId: d.cargaId,
    clienteId: d.clienteId,
    vendedorId: d.vendedorId,
    tipo: tipoDbADominio(d.tipo),
    numero: d.numero,
    emision: d.emision,
    vencimiento: d.vencimiento,
    morosidad: d.morosidad,
    total: d.total ? d.total.toNumber() : null,
  };
}

type FilaCarga = {
  id: string;
  nombreArchivo: string;
  cargadoEn: Date;
};

export function cargaAModelo(c: FilaCarga): CargaModel {
  return {
    id: c.id,
    nombreArchivo: c.nombreArchivo,
    cargadoEn: c.cargadoEn.toISOString(),
  };
}

// El frontend guarda la fecha como "DD/MM/AAAA HH:MM"
export function parsearCargadoEn(value: string): Date {
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