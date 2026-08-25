// Formato de montos compartido por la tabla desktop y las cards mobile.
export function formatCurrency(valor: number) {
  const negativo = valor < 0;
  const abs = Math.abs(valor);
  const [entera, decimal] = abs.toFixed(2).split(".");
  const conMiles = entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negativo ? "-" : ""}$${conMiles},${decimal}`;
}
