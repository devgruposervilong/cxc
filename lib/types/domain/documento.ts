export type DocumentType = "FACT" | "N/CR";

export type Document = {
  TIPO: DocumentType;
  NUMERO: string;
  EMISION: string | null;
  VENCIMIENTO: string | null;
  MOROSIDAD: number;
  VENDEDOR: string | null;
  RIF_CLIENTE: string | null;
  TOTAL: number | null;
  CLIENTE: string | null;
};