import type { TipoDocumento } from "../domain/documento";

export type CargaModel = {
  id: string;
  nombreArchivo: string;
  cargadoEn: string;
};

export type ClienteModel = {
  id: string;
  rif: string | null;
  nombre: string;
};

export type VendedorModel = {
  id: string;
  codigo: string;
  nombre: string;
};

export type DocumentoModel = {
  id: string;
  cargaId: string;
  clienteId: string | null;
  vendedorId: string | null;
  tipo: TipoDocumento;
  numero: string;
  emision: string | null;
  vencimiento: string | null;
  morosidad: number;
  total: number | null;
};