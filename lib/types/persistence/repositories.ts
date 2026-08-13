import type { TipoDocumento } from "../domain/documento";
import type { CargaModel, ClienteModel, DocumentoModel, VendedorModel } from "./models";

export type CrearCargaInput = {
  nombreArchivo: string;
  cargadoEn: string;
};

export type CrearDocumentoInput = {
  cargaId: string;
  clienteId: string | null;
  vendedorId: string | null;
  tipo: TipoDocumento;
  numero: string;
  emision: string | null;
  vencimiento: string | null;
  morosidad: number;
  total: number | null;
};

export type CrearClienteInput = {
  rif: string | null;
  nombre: string;
};

export type CrearVendedorInput = {
  codigo: string;
  nombre: string;
};

export interface CargaRepository {
  crearCarga(input: CrearCargaInput): Promise<CargaModel>;
  obtenerCargas(): Promise<CargaModel[]>;
  obtenerCargaMasReciente(): Promise<CargaModel | null>;
  eliminarCarga(id: string): Promise<void>;
}

export interface DocumentoRepository {
  crearDocumentos(inputs: CrearDocumentoInput[]): Promise<DocumentoModel[]>;
  obtenerDocumentosPorCarga(cargaId: string): Promise<DocumentoModel[]>;
  eliminarDocumento(id: string): Promise<void>;
  eliminarDocumentosPorCarga(cargaId: string): Promise<void>;
}

export interface ClienteRepository {
  crearClientes(inputs: CrearClienteInput[]): Promise<ClienteModel[]>;
  obtenerClientes(): Promise<ClienteModel[]>;
}

export interface VendedorRepository {
  crearVendedores(inputs: CrearVendedorInput[]): Promise<VendedorModel[]>;
  obtenerVendedores(): Promise<VendedorModel[]>;
}