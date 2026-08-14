// Capa API: borra una carga y sus documentos en cascada.
import { NextResponse } from "next/server";
import { deleteUploadById } from "@/services/persist-upload";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing upload id" }, { status: 400 });
  }

  try {
    const deleted = await deleteUploadById(id);
    if (!deleted) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("deleteUploadById failed:", error);
    return NextResponse.json({ error: "Failed to delete upload" }, { status: 500 });
  }
}