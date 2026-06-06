import axios, { AxiosError } from "axios";

import { API_BASE_URL, DEFAULT_RADIUS_KM } from "../config";
import type {
  Category,
  CreateVendorRequest,
  SearchResponse,
  VendorProfile,
} from "../types";

const client = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

// Normalise axios errors into Error(message). Backends raise FastAPI's
// `{ detail: ... }` shape on 4xx/5xx — surface that as a single readable string
// so screens can `Alert.alert("…", err.message)`.
client.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ detail?: unknown }>) => {
    const detail = err.response?.data?.detail;
    let message: string;
    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      // FastAPI validation errors come back as an array of {msg, loc, ...}
      message = detail
        .map((d: { msg?: string }) => d?.msg ?? "")
        .filter(Boolean)
        .join("; ") || "Validation error";
    } else if (err.code === "ECONNABORTED") {
      message = "Request timed out — is the backend running?";
    } else if (err.message === "Network Error") {
      message = "Couldn't reach the backend. Did you run `pnpm reverse`?";
    } else {
      message = err.message || "Unknown error";
    }
    return Promise.reject(new Error(message));
  }
);

export async function searchText(
  query: string,
  lat: number,
  lng: number,
  radiusKm: number = DEFAULT_RADIUS_KM
): Promise<SearchResponse> {
  const { data } = await client.post<SearchResponse>("/api/search/text", {
    query,
    lat,
    lng,
    radius_km: radiusKm,
  });
  return data;
}

export interface VoiceSearchResponse extends SearchResponse {
  transcript: string;
}

// Multipart POST to /api/search/voice — backend STT → intent → vendor search.
// The mobile audio recorder isn't wired yet; this helper is here so whoever
// adds it can just call `searchVoice(uri, coords)`.
export async function searchVoice(
  audioUri: string,
  lat: number,
  lng: number,
  radiusKm: number = DEFAULT_RADIUS_KM
): Promise<VoiceSearchResponse> {
  const form = new FormData();
  // RN's FormData accepts a { uri, name, type } object as a file field — cast
  // to Blob to satisfy DOM types.
  form.append("audio_file", {
    uri: audioUri,
    name: "voice.m4a",
    type: "audio/m4a",
  } as unknown as Blob);
  form.append("lat", String(lat));
  form.append("lng", String(lng));
  form.append("radius_km", String(radiusKm));
  const { data } = await client.post<VoiceSearchResponse>(
    "/api/search/voice",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await client.get<Category[]>("/api/categories");
  return data;
}

export async function createVendor(
  payload: CreateVendorRequest
): Promise<VendorProfile> {
  const { data } = await client.post<VendorProfile>("/api/vendors", payload);
  return data;
}

export async function getVendor(id: string): Promise<VendorProfile> {
  const { data } = await client.get<VendorProfile>(`/api/vendors/${id}`);
  return data;
}
