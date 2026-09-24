export interface CdmData {
  event_id: string;
  time_to_tca: number;
  risk: number; // log10(Pc)
  miss_distance: number;
  relative_speed: number;
  
  relative_position_r: number;
  relative_position_t: number;
  relative_position_n: number;
  
  relative_velocity_r: number;
  relative_velocity_t: number;
  relative_velocity_n: number;
  
  t_sigma_r: number;
  t_sigma_t: number;
  t_sigma_n: number;
  
  c_sigma_r: number;
  c_sigma_t: number;
  c_sigma_n: number;
  
  mahalanobis_distance: number;
  c_object_type: string;
  
  [key: string]: any; // Allow other fields for model prediction
}
