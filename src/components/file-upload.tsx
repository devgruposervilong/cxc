import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { processFile } from "@/lib/process-file";
import { refreshMorosidad } from "@/lib/morosidad";
import { usePanel } from "@/src/panel";

export function FileUpload() {
  const { setFilas, setNombreArchivo, nombreArchivo, setCargadoEn, setUploadId } =
    usePanel();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setNombreArchivo(file.name);
    try {
      const rows = await processFile(file);
      setFilas(refreshMorosidad(rows));
      setUploadId(null);
      const ahora = new Date();
      const dia = String(ahora.getDate()).padStart(2, "0");
      const mes = String(ahora.getMonth() + 1).padStart(2, "0");
      const hora = String(ahora.getHours()).padStart(2, "0");
      const minutos = String(ahora.getMinutes()).padStart(2, "0");
      setCargadoEn(`${dia}/${mes}/${ahora.getFullYear()} ${hora}:${minutos}`);
    } finally {
      setLoading(false);
    }
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  function onDragOver(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(true);
  }

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={() => setDragOver(false)}
      onClick={() => inputRef.current?.click()}
      className={`flex h-full min-h-[50vh] w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors ${
        dragOver
          ? "border-emerald-500 bg-emerald-50"
          : "border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xls,.xlsx"
        className="sr-only"
        onChange={onChange}
      />

      {loading ? (
        <p className="text-sm text-zinc-500">Procesando archivo...</p>
      ) : (
        <div className="flex max-w-sm flex-col items-center gap-2 px-6">
          <Upload className="h-8 w-8 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-800">
            {nombreArchivo || "Sube tu archivo Excel"}
          </span>
          <span className="text-sm text-zinc-500">
            <span className="hidden md:inline">
              Arrastra tu archivo .xls o .xlsx aqui o haz clic para
              seleccionar
            </span>
            <span className="md:hidden">
              Toca para seleccionar un archivo .xls o .xlsx
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
