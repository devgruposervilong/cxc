export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <label
          htmlFor="excel-upload"
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 px-6 py-10 text-center transition hover:border-zinc-400"
        >
          <span className="mb-2 text-sm font-medium text-zinc-800">
            Sube tu archivo Excel
          </span>
          <span className="mb-4 text-sm text-zinc-500">
            Acepta archivos .xlsx
          </span>
          <input id="excel-upload" type="file" accept=".xlsx" className="sr-only" />
          <span className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
            Seleccionar archivo
          </span>
        </label>
      </div>
    </main>
  );
}
