// Mirrors the backend contract (apps/backend/app/schemas.py).

export interface Vendor {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  distance_m: number;
  lat: number;
  lng: number;
  upi_id: string;
}

export interface SearchResponse {
  vendors: Vendor[];
  interpreted_query: string;
  total: number;
}

export interface Category {
  id: string;
  name: string;
  icon_url?: string | null;
}

export interface CreateVendorRequest {
  title: string;
  category_id: string;
  description?: string | null;
  upi_id: string;
  lat: number;
  lng: number;
}

export interface VendorProfile {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  upi_id: string;
  lat: number;
  lng: number;
  is_active: boolean;
}
