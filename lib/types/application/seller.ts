// Entidad VENDEDOR: corresponde a la hoja VENDEDORES
// (CODIGO, NOMBRE, APELLIDO, ZONA, KEY_URL, STATUS).
export type SellerStatus = "ACTIVO" | "INACTIVO";

export type Seller = {
  code: string;
  name: string;
  surname: string | null;
  zone: string | null;
  keyUrl: string;
  status: SellerStatus;
};

export function normalizeSellerName(value: string | null): string {
  return value?.trim().toUpperCase() ?? "";
}

// El ERP identifica al vendedor en las CxC por nombre (ej. "SOL"); también
// acepta "NOMBRE APELLIDO". Devuelve las variantes que debe aceptar un Seller.
export function sellerNameVariants(seller: Pick<Seller, "name" | "surname">): string[] {
  const variants = [normalizeSellerName(seller.name)];
  if (seller.surname) {
    variants.push(normalizeSellerName(`${seller.name} ${seller.surname}`));
  }
  return variants;
}
