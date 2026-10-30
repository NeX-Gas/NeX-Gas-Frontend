"use client";

import type { DeviceCommand } from "./types";

/**
 * Klien REST NeX-Gas-Backend.
 *
 * Kontrak mengikuti `NeX-Gas-Backend` (branch `feat/backend-core`):
 * - semua endpoint data dilindungi Bearer JWT (role viewer/operator/admin),
 * - perintah: `POST /api/command` body `{ deviceId, command }`, butuh role
 *   operator/admin, dan ditolak 403 kalau `PUBLIC_MQTT_TEST_MODE=true`,
 * - response data selalu menyertakan `data` (normal backend, NULL dipertahankan)
 *   dan `frontend` (bentuk siap pakai untuk dashboard).
 */

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

/** ID alat default; sama dengan `DEFAULT_DEVICE_ID` di backend. */
export const DEVICE_ID = process.env.NEXT_PUBLIC_DEVICE_ID ?? "nexgas-001";

export const isApiConfigured = API_URL.length > 0;

export type UserRole = "admin" | "operator" | "viewer";

export type AuthUser = { id: number; username: string; role: UserRole };

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  /** epoch ms; backend memberi `expiresIn` dalam detik (default 900). */
  expiresAt: number;
};

const AUTH_KEY = "nexgas-auth";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Sesi
// ---------------------------------------------------------------------------

const authListeners = new Set<() => void>();
/** Snapshot stabil untuk `useSyncExternalStore` (hindari objek baru tiap render). */
let cachedSession: AuthSession | null | undefined;
let storageBound = false;

function emitAuth() {
  authListeners.forEach((listener) => listener());
}

function readSessionFromStorage(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function subscribeAuth(listener: () => void): () => void {
  authListeners.add(listener);
  if (!storageBound && typeof window !== "undefined") {
    storageBound = true;
    window.addEventListener("storage", (event) => {
      if (event.key !== AUTH_KEY) return;
      cachedSession = undefined;
      emitAuth();
    });
  }
  return () => {
    authListeners.delete(listener);
  };
}

export function getSession(): AuthSession | null {
  if (cachedSession === undefined) cachedSession = readSessionFromStorage();
  return cachedSession;
}

/** Dipakai `getServerSnapshot`; server tidak punya localStorage. */
export function getServerSession(): AuthSession | null {
  return null;
}

function writeSession(session: AuthSession | null) {
  if (typeof window !== "undefined") {
    try {
      if (session) window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      else window.localStorage.removeItem(AUTH_KEY);
    } catch {
      // localStorage penuh / diblokir: sesi tetap jalan sampai refresh halaman
    }
  }
  cachedSession = session;
  emitAuth();
}

function sessionFromResponse(body: {
  user?: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}): AuthSession {
  const expiresIn = typeof body.expiresIn === "number" ? body.expiresIn : 900;
  return {
    user: body.user ?? getSession()?.user ?? { id: 0, username: "operator", role: "operator" },
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    expiresAt: Date.now() + Math.max(expiresIn - 30, 60) * 1000,
  };
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function describeError(status: number, body: Record<string, unknown>): string {
  const serverMessage =
    typeof body.message === "string" ? body.message : typeof body.error === "string" ? body.error : "";

  if (serverMessage.toUpperCase().includes("PUBLIC_MQTT_TEST_MODE")) {
    return "Perintah dimatikan di PUBLIC_MQTT_TEST_MODE (mode uji broker publik) — firmware tidak boleh digerakkan dari sini.";
  }
  if (status === 401) return "Sesi backend berakhir. Login ulang.";
  if (status === 403) {
    return serverMessage || "Role akun ini tidak punya izin untuk aksi tersebut.";
  }
  if (status === 404) return "Data alat belum ada di backend.";
  if (status === 429) return "Terlalu banyak perintah — tunggu beberapa detik lalu coba lagi.";
  if (status === 503) return "Broker MQTT backend sedang offline, perintah tidak dikirim.";
  if (status === 502) return "Backend gagal meneruskan perintah ke broker MQTT.";
  if (status >= 500) return serverMessage || "Backend sedang bermasalah.";
  return serverMessage || `Permintaan ke backend gagal (HTTP ${status}).`;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function login(username: string, password: string): Promise<AuthSession> {
  if (!isApiConfigured) {
    throw new ApiError("NEXT_PUBLIC_API_URL belum diset — login backend tidak tersedia.");
  }
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new ApiError("Backend tidak bisa dihubungi. Cek NEXT_PUBLIC_API_URL dan CORS.");
  }

  const body = await readJson(response);
  if (!response.ok) throw new ApiError(describeError(response.status, body), response.status);

  const session = sessionFromResponse(body as unknown as {
    user?: AuthUser;
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
  });
  writeSession(session);
  return session;
}

export async function logout(): Promise<void> {
  const session = getSession();
  if (session && isApiConfigured) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
    } catch {
      // offline: tetap hapus sesi lokal
    }
  }
  writeSession(null);
}

async function refreshSession(session: AuthSession): Promise<AuthSession> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
  } catch {
    throw new ApiError("Backend tidak bisa dihubungi saat memperbarui sesi.");
  }

  const body = await readJson(response);
  if (!response.ok) {
    writeSession(null);
    throw new ApiError(describeError(response.status, body), response.status);
  }

  const next = sessionFromResponse({
    user: session.user,
    ...(body as unknown as { accessToken: string; refreshToken: string; expiresIn?: number }),
  });
  writeSession(next);
  return next;
}

/** Token akses yang masih berlaku; refresh otomatis kalau hampir kedaluwarsa. */
export async function getAccessToken(): Promise<string | null> {
  const session = getSession();
  if (!session) return null;
  if (session.expiresAt > Date.now()) return session.accessToken;
  try {
    const next = await refreshSession(session);
    return next.accessToken;
  } catch {
    return null;
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = {},
): Promise<Record<string, unknown>> {
  const url = `${API_URL}${path}`;
  const withAuth = options.auth ?? true;

  const send = async (): Promise<Response> => {
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }
    if (withAuth) {
      const token = await getAccessToken();
      if (!token) throw new ApiError("Butuh login backend untuk aksi ini.", 401);
      headers.set("Authorization", `Bearer ${token}`);
    }
    try {
      return await fetch(url, { ...init, headers, credentials: "include" });
    } catch {
      throw new ApiError("Backend tidak bisa dihubungi. Cek NEXT_PUBLIC_API_URL dan CORS.");
    }
  };

  let response = await send();
  if (response.status === 401 && withAuth) {
    const session = getSession();
    if (session) {
      try {
        await refreshSession(session);
        response = await send();
      } catch {
        // biarkan deskripsi error di bawah yang tampil
      }
    }
  }

  const body = await readJson(response);
  if (!response.ok) throw new ApiError(describeError(response.status, body), response.status);
  return body;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export type BackendSnapshot = {
  telemetry: Record<string, unknown> | null;
  state: Record<string, unknown> | null;
  online: boolean | null;
};

const deviceQuery = `?deviceId=${encodeURIComponent(DEVICE_ID)}`;

/** Ambil kondisi terakhir alat (dipakai saat halaman dibuka / WS reconnect). */
export async function fetchSnapshot(): Promise<BackendSnapshot> {
  if (!isApiConfigured) return { telemetry: null, state: null, online: null };
  if (!getSession()) return { telemetry: null, state: null, online: null };

  const [telemetry, state, status] = await Promise.all([
    apiFetch(`/api/telemetry/latest${deviceQuery}`).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }),
    apiFetch(`/api/state${deviceQuery}`).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }),
    apiFetch(`/api/status${deviceQuery}`).catch(() => null),
  ]);

  const statusData = status?.data as { status?: string } | undefined;

  return {
    telemetry: (telemetry?.data as Record<string, unknown> | undefined) ?? null,
    state: (state?.data as Record<string, unknown> | undefined) ?? null,
    online: statusData?.status ? statusData.status === "online" : null,
  };
}

export type TelemetryHistoryResponse = {
  total: number;
  items: Array<{
    receivedAt: string;
    gasSinceStartTotalL: number | null;
    ph: number | null;
    temperatureC: number | null;
    h2sAfter: number | null;
  }>;
};

export async function fetchTelemetryHistory(limit = 100): Promise<TelemetryHistoryResponse["items"]> {
  const body = await apiFetch(`/api/history/telemetry${deviceQuery}&limit=${limit}&order=asc`);
  const items = (body.items ?? body.data ?? []) as TelemetryHistoryResponse["items"];
  return Array.isArray(items) ? items : [];
}

export type CommandResult = {
  verificationStatus: string;
  message: string;
};

/**
 * Kirim perintah ke `nexgas/{deviceId}/cmd` lewat backend.
 * Backend jujur: status `published` + `pending_execution`, bukan ACK firmware.
 */
export async function postCommand(command: DeviceCommand): Promise<CommandResult> {
  if (!isApiConfigured) {
    throw new ApiError("NEXT_PUBLIC_API_URL belum diset — perintah tidak bisa dikirim.");
  }
  const body = await apiFetch("/api/command", {
    method: "POST",
    body: JSON.stringify({ deviceId: DEVICE_ID, command }),
  });

  return {
    verificationStatus: typeof body.verificationStatus === "string" ? body.verificationStatus : "pending_execution",
    message:
      typeof body.message === "string"
        ? body.message
        : "Perintah terkirim ke topik MQTT alat (eksekusi tetap diatur firmware).",
  };
}
