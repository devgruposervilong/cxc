import type { Documento } from "../domain/documento";

export type ClienteRankeado = {
  nombre: string;
  morosidadMax: number;
  montoTiebreaker: number;
  documentos: Documento[];
  totalGeneral: number;
};