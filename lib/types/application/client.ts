// Entidad CLIENTE: corresponde a la tabla CLIENTES del ERP
// (CODIGO, CLIENTE, RIF, VENDEDOR, UNIDAD_NEGOCIO).
export type Client = {
  code: string;
  name: string;
  rif: string;
  seller: string;
  businessUnit: string;
};

// El nombre es la clave de union con Document.client. Se normaliza para
// comparar el maestro con la data del Excel sin depender de mayusculas ni
// espacios accidentales.
export function normalizeClientName(value: string | null): string {
  return value?.trim().toUpperCase() ?? "";
}

export function normalizeClientRif(value: string | null): string {
  return value?.trim().toUpperCase() ?? "";
}