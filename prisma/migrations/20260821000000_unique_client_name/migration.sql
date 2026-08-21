-- Deduplica el maestro de clientes antes de crear el índice único:
-- conserva una fila por nombre, priorizando la canónica (code = rif)
-- y, como desempate, el código menor.
DELETE FROM "client"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", ROW_NUMBER() OVER (
      PARTITION BY TRIM("name")
      ORDER BY CASE WHEN "code" = "rif" THEN 0 ELSE 1 END, "code" ASC
    ) AS rn
    FROM "client"
  ) ranked
  WHERE ranked.rn > 1
);

-- CreateIndex
CREATE UNIQUE INDEX "client_name_key" ON "client"("name");