-- CreateEnum
CREATE TYPE "SellerStatus" AS ENUM ('ACTIVO', 'INACTIVO');

-- AlterTable
ALTER TABLE "seller" ADD COLUMN     "status" "SellerStatus" NOT NULL DEFAULT 'ACTIVO';
