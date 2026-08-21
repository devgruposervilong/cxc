// Entidad CLIENTE: corresponde a la tabla CLIENTES del ERP
// (CODIGO, CLIENTE, RIF, VENDEDOR, UNIDAD_NEGOCIO).
export type Client = {
  code: string;
  name: string;
  rif: string;
  seller: string;
  businessUnit: string;
};