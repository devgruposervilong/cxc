import type { DataRow, DocumentType, Seller } from "@/lib/types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new ApiError(
      response.status,
      detail?.error ?? `Error ${response.status}`
    );
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export type Me = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user" | "seller";
  };
  seller: {
    keyUrl: string;
    name: string;
    surname: string | null;
    zone: string | null;
  } | null;
};

export function getMe() {
  return apiFetch<Me>("/api/me");
}

export type LoadedUpload = {
  uploadId: string;
  fileName: string;
  loadedAt: string;
  rows: DataRow[];
};

export type SaveUploadInput = {
  fileName: string;
  loadedAt: string;
  rows: DataRow[];
};

export type SaveUploadResult = {
  uploadId: string;
  savedRows: number;
};

export type SellerPortal = {
  seller: Seller;
  fileName: string;
  loadedAt: string;
  rows: DataRow[];
};

export type SetupStatus = { needsSetup: boolean };

export type InviteInfo = {
  email: string;
  role: "admin" | "user" | "seller";
  sellerName: string | null;
  expiresAt: string;
};

export type AdminSeller = {
  id: string;
  code: string;
  name: string;
  surname: string | null;
  zone: string | null;
  keyUrl: string;
  status: "ACTIVO" | "INACTIVO";
  userId: string | null;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  createdAt: string;
  seller: {
    id: string;
    code: string;
    name: string;
    surname: string | null;
    userId: string | null;
  } | null;
};

export type AdminUsersResponse = {
  users: AdminUser[];
  sellers: AdminSeller[];
};

export type AdminInvite = {
  id: string;
  email: string;
  role: "admin" | "user" | "seller";
  sellerId: string | null;
  sellerName: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  expired: boolean;
};

export type CreateInviteResult = {
  email: string;
  inviteUrl: string;
  emailSent: boolean;
  expiresAt: string;
};

function formatLoadedAt(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  let hora = date.getHours();
  const periodo = hora >= 12 ? "p. m." : "a. m.";
  hora = hora % 12 || 12;
  const horaStr = String(hora).padStart(2, "0");
  const minutos = String(date.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${date.getFullYear()} ${horaStr}:${minutos} ${periodo}`;
}

export async function getLatestUpload(): Promise<LoadedUpload | null> {
  const data = await apiFetch<Omit<LoadedUpload, "loadedAt"> & { loadedAt: string } | null>(
    "/api/uploads"
  );
  if (!data) return null;
  return { ...data, loadedAt: formatLoadedAt(data.loadedAt) };
}

export function saveUpload(input: SaveUploadInput) {
  return apiFetch<SaveUploadResult>("/api/uploads", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteUpload(id: string) {
  return apiFetch<{ deleted: boolean }>(`/api/uploads/${id}`, {
    method: "DELETE",
  });
}

export function deleteDocumentFromUpload(
  uploadId: string,
  type: DocumentType,
  number: string
) {
  return apiFetch<{ deleted: boolean }>(`/api/uploads/${uploadId}/documents`, {
    method: "DELETE",
    body: JSON.stringify({ type, number }),
  });
}

export async function getSellers(): Promise<Seller[]> {
  const data = await apiFetch<{ sellers: Seller[] }>("/api/sellers");
  return data.sellers;
}

export function getSellerPortal(keyUrl: string) {
  return apiFetch<SellerPortal>(`/api/sellers/${encodeURIComponent(keyUrl)}`);
}

export function getSetupStatus() {
  return apiFetch<SetupStatus>("/api/setup/status");
}

export function setupAdmin(input: {
  token: string;
  name: string;
  email: string;
  password: string;
}) {
  return apiFetch<{ ok: true }>("/api/setup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getInvite(token: string) {
  return apiFetch<InviteInfo>(`/api/invites/${encodeURIComponent(token)}`);
}

export function acceptInvite(
  token: string,
  input: { name: string; password: string }
) {
  return apiFetch<{ ok: true }>(`/api/invites/${encodeURIComponent(token)}/accept`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function adminListUsers() {
  return apiFetch<AdminUsersResponse>("/api/admin/users");
}

export function adminUpdateUser(
  id: string,
  input: {
    role?: "admin" | "user" | "seller";
    sellerId?: string | null;
    banned?: boolean;
    banReason?: string;
  }
) {
  return apiFetch<{ ok: true }>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function adminListInvites(): Promise<AdminInvite[]> {
  const data = await apiFetch<{ invites: AdminInvite[] }>("/api/admin/invites");
  return data.invites;
}

export function adminCreateInvite(input: {
  email: string;
  role: "admin" | "user" | "seller";
  sellerId?: string | null;
}) {
  return apiFetch<CreateInviteResult>("/api/admin/invites", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function adminDeleteInvite(id: string) {
  return apiFetch<{ deleted: boolean }>(`/api/admin/invites/${id}`, {
    method: "DELETE",
  });
}

export function adminRegenerateInvite(id: string) {
  return apiFetch<CreateInviteResult>(
    `/api/admin/invites/${encodeURIComponent(id)}/regenerate`,
    { method: "POST" }
  );
}
