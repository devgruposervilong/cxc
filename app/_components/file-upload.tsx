//COMPONENTE EN LA RUTA /_COMPONENTS/FILE-UPLOAD
"use client";

import { useRef, useState } from "react";
import { usePanel } from "../page";
import { processFile } from "@/lib/process-file";
import { refreshMorosidad } from "@/lib/morosidad";
import { Upload } from "lucide-react";

export default function FileUpload() {
  const { setFilas, setNombreArchivo, nombreArchivo, setCargadoEn, setUploadId } = usePanel();
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

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function onDragLeave() {
    setDragOver(false);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`flex h-full w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors ${
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
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-800">
            {nombreArchivo || "Sube tu archivo Excel"}
          </span>
          <span className="text-sm text-zinc-500">
            Arrastra tu archivo .xls o .xlsx aqu&iacute; o haz clic para seleccionar
          </span>
        </div>
      )}
    </div>
  );
}