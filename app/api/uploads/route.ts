// Capa API: recibe la solicitud del frontend y delega en el servicio backend.
// No puede haber route.ts al mismo nivel que page.tsx, por eso vive en /api/uploads.
import { NextResponse } from "next/server";
import { persistUpload } from "@/services/persist-upload";
import { getLatestUploadWithDocuments } from "@/services/load-upload";
import type { DataRow } from "@/lib/types";

type PersistUploadBody = {
  fileName: string;
  loadedAt: string;
  rows: DataRow[];
};

export async function GET() {
  try {
    const data = await getLatestUploadWithDocuments();
    return NextResponse.json(data);
  } catch (error) {
    console.error("getLatestUploadWithDocuments failed:", error);
    return NextResponse.json({ error: "Failed to load upload" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: PersistUploadBody;
  try {
    body = (await request.json()) as PersistUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body ||
    typeof body.fileName !== "string" ||
    typeof body.loadedAt !== "string" ||
    !Array.isArray(body.rows)
  ) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  try {
    const result = await persistUpload(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("persistUpload failed:", error);
    return NextResponse.json({ error: "Failed to persist upload" }, { status: 500 });
  }
}