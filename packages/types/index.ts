// TypeScript Mirrors of Python Pydantic Models for API Contracts

export interface Deal {
  id: string;
  title: string;
  description: string;
  discount_percentage: number;
  valid_until: string;
}

export interface Merchant {
  id: string;
  name: string;
  category: string;
  rating: number;
  distance_meters: number;
  address: string;
  latitude: number;
  longitude: number;
  deals: Deal[];
}

export interface MerchantSearchRequest {
  query?: string;
  latitude: number;
  longitude: number;
  category?: string;
  radius_meters?: number;
}

export interface MerchantSearchResponse {
  merchants: Merchant[];
  total_found: number;
}

export interface TravelOption {
  id: string;
  type: 'flight' | 'train' | 'hotel';
  provider: string;
  name: string;
  departure_time?: string;
  arrival_time?: string;
  origin?: string;
  destination?: string;
  price: number;
  rating?: number;
  details: string;
}

export interface TravelSearchRequest {
  type: 'flight' | 'train' | 'hotel';
  origin?: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  passengers?: number;
}

export interface TravelSearchResponse {
  options: TravelOption[];
  total_found: number;
}

export interface SupportItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  action_link?: string;
}

export interface SupportSearchRequest {
  query: string;
  category?: string;
}

export interface SupportSearchResponse {
  items: SupportItem[];
  answer_synthesis?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  query: string;
  session_id: string;
  history: ChatMessage[];
  latitude?: number;
  longitude?: number;
}

export interface ChatResponse {
  text: string;
  voice_audio_base64?: string;
  intent: 'travel' | 'merchant' | 'support' | 'general';
  structured_data?: TravelSearchResponse | MerchantSearchResponse | SupportSearchResponse | null;
}
