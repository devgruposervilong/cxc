-- CreateTable
CREATE TABLE "seller" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT,
    "zone" TEXT,
    "keyUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seller_code_key" ON "seller"("code");

-- CreateIndex
CREATE UNIQUE INDEX "seller_keyUrl_key" ON "seller"("keyUrl");
