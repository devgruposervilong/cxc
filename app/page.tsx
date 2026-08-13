//PAGINA PRINCIPAL EN EL ROOT
"use client";

import { createContext, useContext, useState } from "react";
import type { FilaData } from "@/lib/process-file";
import CargarData from "./_components/cargar-data";
import Data from "./_components/data";

type PanelContextValue = {
  filas: FilaData[];
  setFilas: (filas: FilaData[]) => void;
  nombreArchivo: string;
  setNombreArchivo: (name: string) => void;
  cargadoEn: string | null;
  setCargadoEn: (cuando: string | null) => void;
};

const PanelContext = createContext<PanelContextValue | null>(null);

export function usePanel() {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error("usePanel debe usarse dentro del root");
  return ctx;
}

export default function Home() {
  const [filas, setFilas] = useState<FilaData[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [cargadoEn, setCargadoEn] = useState<string | null>(null);

  return (
    <PanelContext.Provider
      value={{ filas, setFilas, nombreArchivo, setNombreArchivo, cargadoEn, setCargadoEn }}
    >
      <div className="flex h-full flex-col gap-4">
        {filas.length === 0 ? <CargarData /> : <Data />}
      </div>
    </PanelContext.Provider>
  );
}
