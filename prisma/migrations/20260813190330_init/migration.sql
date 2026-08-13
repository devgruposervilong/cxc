-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('FACT', 'NCR');

-- CreateTable
CREATE TABLE "carga" (
    "id" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "cargadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" TEXT NOT NULL,
    "rif" TEXT,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendedor" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "vendedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento" (
    "id" TEXT NOT NULL,
    "cargaId" TEXT NOT NULL,
    "clienteId" TEXT,
    "vendedorId" TEXT,
    "tipo" "TipoDocumento" NOT NULL,
    "numero" TEXT NOT NULL,
    "emision" TEXT,
    "vencimiento" TEXT,
    "morosidad" INTEGER NOT NULL,
    "total" DECIMAL(65,30),

    CONSTRAINT "documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cliente_rif_key" ON "cliente"("rif");

-- CreateIndex
CREATE UNIQUE INDEX "vendedor_codigo_key" ON "vendedor"("codigo");

-- CreateIndex
CREATE INDEX "documento_cargaId_idx" ON "documento"("cargaId");

-- CreateIndex
CREATE INDEX "documento_clienteId_idx" ON "documento"("clienteId");

-- CreateIndex
CREATE INDEX "documento_vendedorId_idx" ON "documento"("vendedorId");

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "carga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "vendedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
