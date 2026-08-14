// Metadatos de persistencia. La data de negocio usa DataRow; aquí solo vive
// la entidad contenedora de la subida de archivo.
export type UploadModel = {
  id: string;
  fileName: string;
  loadedAt: string;
};
