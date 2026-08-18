//PAGINA PRINCIPAL EN EL ROOT
"use client";

import { createContext, useContext, useState } from "react";
import type { DataRow } from "@/lib/types";
import { useUploadData } from "@/lib/hooks/use-upload-data";
import { refreshMorosidad } from "@/lib/morosidad";
import FileUpload from "./_components/file-upload";
import DataView from "./_components/data-view";

type PanelContextValue = {
  filas: DataRow[];
  setFilas: (filas: DataRow[]) => void;
  nombreArchivo: string;
  setNombreArchivo: (name: string) => void;
  cargadoEn: string | null;
  setCargadoEn: (cuando: string | null) => void;
  uploadId: string | null;
  setUploadId: (id: string | null) => void;
};

const PanelContext = createContext<PanelContextValue | null>(null);

export function usePanel() {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error("usePanel debe usarse dentro del root");
  return ctx;
}

export default function Home() {
  const [filas, setFilas] = useState<DataRow[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [cargadoEn, setCargadoEn] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);

  const { data, isPending } = useUploadData();
  const [hydrated, setHydrated] = useState(false);

  // Hidratación única durante el render: si la BD tiene data, se muestra la
  // tabla con esos datos; si no, se muestra el componente de carga.
  if (!hydrated && !isPending) {
    if (data) {
      setFilas(refreshMorosidad(data.rows));
      setNombreArchivo(data.fileName);
      setCargadoEn(data.loadedAt);
      setUploadId(data.uploadId);
    }
    setHydrated(true);
  }

  let content: React.ReactNode;
  if (filas.length > 0) {
    content = <DataView />;
  } else if (!hydrated) {
    content = (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Cargando datos...
      </div>
    );
  } else {
    content = <FileUpload />;
  }

  return (
    <PanelContext.Provider
      value={{ filas, setFilas, nombreArchivo, setNombreArchivo, cargadoEn, setCargadoEn, uploadId, setUploadId }}
    >
      <div className="flex h-full flex-col gap-4">{content}</div>
    </PanelContext.Provider>
  );
}
