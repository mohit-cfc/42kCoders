import axios from "axios";

import { API_BASE_URL, DEFAULT_RADIUS_KM } from "../config";
import type {
  Category,
  CreateVendorRequest,
  SearchResponse,
  VendorProfile,
} from "../types";

const client = axios.create({ baseURL: API_BASE_URL });

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

// TODO: voice search (POST /api/search/voice, multipart) once the backend
// STT endpoint is added. See apps/backend/app/agent/sarvam.py.
