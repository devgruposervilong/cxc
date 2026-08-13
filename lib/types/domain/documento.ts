export type TipoDocumento = "FACT" | "N/CR";

export type Documento = {
  TIPO: TipoDocumento;
  NUMERO: string;
  EMISION: string | null;
  VENCIMIENTO: string | null;
  MOROSIDAD: number;
  VENDEDOR: string | null;
  RIF_CLIENTE: string | null;
  TOTAL: number | null;
  CLIENTE: string | null;
};