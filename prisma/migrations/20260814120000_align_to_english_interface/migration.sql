-- Cambio de esquema: alineación al inglés y a la interface canónica DataRow.
-- Los modelos antiguos (carga, cliente, vendedor, documento) nunca fueron
-- utilizados por la app (la persistencia no estaba conectada), por lo que se
-- recrean como upload y document con campos alineados a la interface.

-- DropForeignKey
ALTER TABLE "documento" DROP CONSTRAINT "documento_cargaId_fkey";

ALTER TABLE "documento" DROP CONSTRAINT "documento_clienteId_fkey";

ALTER TABLE "documento" DROP CONSTRAINT "documento_vendedorId_fkey";

-- DropIndex
DROP INDEX "documento_cargaId_idx";

DROP INDEX "documento_clienteId_idx";

DROP INDEX "documento_vendedorId_idx";

DROP INDEX "cliente_rif_key";

DROP INDEX "vendedor_codigo_key";

-- DropTable
DROP TABLE "documento";

DROP TABLE "vendedor";

DROP TABLE "cliente";

DROP TABLE "carga";

-- DropEnum
DROP TYPE "TipoDocumento";

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('FACT', 'NCR');

-- CreateTable
CREATE TABLE "upload" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "client" TEXT NOT NULL,
    "rif" TEXT,
    "type" "DocumentType" NOT NULL,
    "number" TEXT NOT NULL,
    "emission" TEXT,
    "expiration" TEXT,
    "overdueDays" INTEGER NOT NULL,
    "total" DECIMAL(65,30),
    "seller" TEXT,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_uploadId_idx" ON "document"("uploadId");

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;