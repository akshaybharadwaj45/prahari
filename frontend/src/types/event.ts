import type { CdmData } from './cdm';

export interface EventSummary {
  event_id: string;
  cdm_count: number;
  highest_risk: number;
  risk_band: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'LOW';
  closest_miss_distance: number;
  tca: number;
  object_type: string;
}

export interface EventDetails {
  summary: EventSummary;
  cdms: CdmData[];
}
