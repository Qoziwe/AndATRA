export type TrafficSeverity = "critical" | "high" | "medium" | "low";

export interface TrafficRecommendation {
  intersection_id: string;
  intersection_name: string;
  severity: TrafficSeverity;
  current_speed_kmh: number;
  free_flow_speed_kmh: number;
  congestion_percent: number;
  recommendation: string;
  reasoning: string;
  streets: string[];
  timestamp: string;
}

export interface TrafficAnalysisResponse {
  recommendations: TrafficRecommendation[];
}
