export type DocumentType = "FACT" | "N/CR";

// Interface canónica: es exactamente lo que retorna processFile (fuente de
// verdad) y lo que viaja a la base de datos. La capa de persistencia solo
// añade metadatos (id, uploadId) fuera de esta interface.
export type DataRow = {
  rank: number;
  client: string | null;
  rif: string | null;
  type: DocumentType;
  number: string;
  emission: string | null;
  expiration: string | null;
  overdueDays: number;
  total: number | null;
  seller: string | null;
};
