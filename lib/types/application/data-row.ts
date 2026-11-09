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
  // Unidad de negocio del maestro de clientes. No viene en el archivo CxC:
  // se resuelve al leer (join por nombre contra Client) en load-upload.
  businessUnit?: string | null;
};

// Campos del documento que se pueden corregir desde la tabla. rank y
// overdueDays no se editan: se recalculan a partir del resto de valores.
export type DocumentChanges = {
  client: string;
  type: DocumentType;
  number: string;
  emission: string | null;
  expiration: string | null;
  total: number | null;
  seller: string | null;
};
