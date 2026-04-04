export type AppealStatus = "new" | "processing" | "resolved" | "rejected" | "irrelevant";
export type AppealPriority = "low" | "medium" | "high" | "critical";

export interface District {
  id: number;
  name: string;
  slug: string;
  city: string;
  coordinatesCenter?: {
    lat: number;
    lng: number;
  } | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  children?: Category[];
  appealCount?: number;
  trend?: number;
}

export interface Appeal {
  id: number;
  text: string;
  title: string;
  preview: string;
  district?: District | null;
  districtName: string;
  locationText?: string | null;
  category?: Category | null;
  categoryName: string;
  categorySlug?: string;
  priority: AppealPriority;
  status: AppealStatus;
  createdAt: string;
  updatedAt?: string | null;
  aiSummary?: string | null;
  aiTags: string[];
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface AppealFilters {
  search?: string;
  category?: string;
  district?: string;
  status?: AppealStatus | "";
  priority?: AppealPriority | "";
  page?: number;
  pageSize?: number;
}

export interface AppealsResponse {
  items: Appeal[];
  total: number;
  page: number;
  pageSize: number;
}
