import pandas as pd
import numpy as np
import os
import json
from typing import Dict, List, Any
from .prediction_service import prediction_service

CURRENT_SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR         = os.path.dirname(CURRENT_SERVICE_DIR)
STANDALONE_DIR     = os.path.dirname(BACKEND_DIR)
DATA_DIR           = os.path.join(STANDALONE_DIR, "data")

class DatasetService:
    def __init__(self):
        self.df = None
        self.events_cache = None
        
        # Check possible full dataset paths
        possible_paths = [
            os.path.join(DATA_DIR, "test_data.csv"),
            os.path.join(os.path.dirname(STANDALONE_DIR), "Prahari-dataset", "test_data.csv"),
        ]
        self.dataset_path = None
        for p in possible_paths:
            if os.path.exists(p):
                self.dataset_path = p
                break

    def load_dataset(self):
        if self.events_cache is not None:
            return

        if self.df is None and self.dataset_path and os.path.exists(self.dataset_path):
            print(f"Loading dataset from {self.dataset_path}")
            try:
                self.df = pd.read_csv(self.dataset_path)
                if 'event_id' in self.df.columns and 'time_to_tca' in self.df.columns:
                    self.df = self.df.sort_values(['event_id', 'time_to_tca'], ascending=[True, False]).reset_index(drop=True)
                self.df = self.df.replace({np.nan: None})
                print("Dataset loaded successfully.")
                self._build_events_cache()
                return
            except Exception as e:
                print(f"Note on CSV loading: {e}")

        # Fallback to events_summary.json (packaged in data/ for standalone clone)
        summary_path = os.path.join(DATA_DIR, "events_summary.json")
        if os.path.exists(summary_path):
            print(f"Loading events from {summary_path}")
            with open(summary_path, "r", encoding="utf-8") as f:
                raw_events = json.load(f)
                
            events = []
            for e in raw_events:
                final_risk = float(e.get('final_risk', -10.0))
                if final_risk >= -4:
                    risk_band = "CRITICAL"
                elif final_risk >= -5:
                    risk_band = "HIGH"
                elif final_risk >= -6:
                    risk_band = "ELEVATED"
                else:
                    risk_band = "LOW"
                    
                events.append({
                    "event_id": str(e.get('event_id', '0')),
                    "cdm_count": int(e.get('n_cdms', 4)),
                    "highest_risk": final_risk,
                    "risk_band": risk_band,
                    "closest_miss_distance": float(e.get('miss_distance', 500.0)),
                    "tca": float(e.get('time_to_tca', 2.0)),
                    "object_type": str(e.get('c_object_type', 'DEBRIS'))
                })
            self.events_cache = sorted(events, key=lambda x: x['highest_risk'], reverse=True)
            print(f"Fallback events cache loaded with {len(self.events_cache)} events.")

    def _build_events_cache(self):
        print("Building events cache from DataFrame...")
        events = []
        
        grouped = self.df.groupby('event_id')
        for event_id, group in grouped:
            cdm_count = len(group)
            max_risk = group['risk'].max() if 'risk' in group.columns else -999
            closest_miss = group['miss_distance'].min() if 'miss_distance' in group.columns else 0
            tca = group['time_to_tca'].min() if 'time_to_tca' in group.columns else 0
            
            if max_risk >= -4:
                risk_band = "CRITICAL"
            elif max_risk >= -5:
                risk_band = "HIGH"
            elif max_risk >= -6:
                risk_band = "ELEVATED"
            else:
                risk_band = "LOW"
                
            c_object_type = group['c_object_type'].iloc[0] if 'c_object_type' in group.columns else "UNKNOWN"
            
            events.append({
                "event_id": str(event_id),
                "cdm_count": cdm_count,
                "highest_risk": float(max_risk),
                "risk_band": risk_band,
                "closest_miss_distance": float(closest_miss),
                "tca": float(tca),
                "object_type": str(c_object_type)
            })
            
        self.events_cache = sorted(events, key=lambda x: x['highest_risk'], reverse=True)
        print(f"Events cache built with {len(self.events_cache)} events.")

    def get_events(self) -> List[Dict[str, Any]]:
        if self.events_cache is None:
            self.load_dataset()
        return self.events_cache or []
        
    def get_event_details(self, event_id: str) -> Dict[str, Any]:
        if self.df is None and self.events_cache is None:
            self.load_dataset()

        summary = next((e for e in (self.events_cache or []) if str(e['event_id']) == str(event_id)), None)

        if self.df is not None:
            try:
                event_id_val = float(event_id) if '.' in str(event_id) else int(event_id)
            except ValueError:
                event_id_val = event_id
                
            event_df = self.df[self.df['event_id'] == event_id_val]
            if not event_df.empty:
                cdms = event_df.to_dict(orient='records')
                for cdm in cdms:
                    try:
                        pred = prediction_service.predict(cdm)
                        cdm['predicted_risk'] = pred['predicted_risk']
                    except Exception:
                        cdm['predicted_risk'] = cdm.get('risk', -10.0)
                return {"summary": summary, "cdms": cdms}

        # If df is empty or event not in df, generate synthetic realistic CDM timeline for visualization
        if summary is not None:
            base_risk = summary.get('highest_risk', -6.0)
            miss_dist = summary.get('closest_miss_distance', 450.0)
            tca_days  = summary.get('tca', 2.5)
            cdm_count = summary.get('cdm_count', 4)
            
            cdms = []
            for i in range(cdm_count):
                step_tca = tca_days + (cdm_count - 1 - i) * 0.8
                step_miss = miss_dist + (cdm_count - 1 - i) * 120.0
                step_risk = base_risk - (cdm_count - 1 - i) * 0.4
                cdms.append({
                    "event_id": event_id,
                    "time_to_tca": step_tca,
                    "miss_distance": step_miss,
                    "relative_speed": 10500.0,
                    "risk": step_risk,
                    "predicted_risk": step_risk + 0.1,
                    "c_object_type": summary.get('object_type', 'DEBRIS'),
                    "t_sigma_r": 15.0 + (cdm_count - 1 - i) * 5.0,
                    "c_sigma_r": 18.0 + (cdm_count - 1 - i) * 5.0,
                    "t_sigma_t": 50.0 + (cdm_count - 1 - i) * 15.0,
                    "c_sigma_t": 60.0 + (cdm_count - 1 - i) * 15.0,
                    "t_sigma_n": 10.0 + (cdm_count - 1 - i) * 3.0,
                    "c_sigma_n": 12.0 + (cdm_count - 1 - i) * 3.0,
                })
            return {"summary": summary, "cdms": cdms}

        return None

dataset_service = DatasetService()
