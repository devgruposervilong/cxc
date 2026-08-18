// Capa API: borra un documento individual de una carga persistida.
import { NextResponse } from "next/server";
import { deleteDocumentFromUpload } from "@/services/persist-upload";
import type { DocumentType } from "@/lib/types";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { type: DocumentType; number: string } | null = null;
  try {
    body = (await request.json()) as { type: DocumentType; number: string } | null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !id ||
    !body ||
    (body.type !== "FACT" && body.type !== "N/CR") ||
    typeof body.number !== "string"
  ) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  try {
    await deleteDocumentFromUpload(id, body.type, body.number);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("deleteDocumentFromUpload failed:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}