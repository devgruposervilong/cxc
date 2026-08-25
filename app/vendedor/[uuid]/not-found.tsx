// URL de vendedor inválida o inexistente.
import Link from "next/link";

export default function SellerNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-semibold text-zinc-900">Enlace no válido</h2>
      <p className="max-w-md text-sm text-zinc-500">
        El enlace que abriste no corresponde a ningún vendedor. Solicita tu enlace
        personalizado al departamento de finanzas.
      </p>
      <Link
        href="/"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
