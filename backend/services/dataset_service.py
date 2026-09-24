import pandas as pd
import numpy as np
import os
from typing import Dict, List, Any
from .prediction_service import prediction_service

class DatasetService:
    def __init__(self):
        self.df = None
        self.events_cache = None
        
        # Check available dataset paths
        possible_paths = [
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "Prahari-dataset", "test_data.csv"),
            r"C:\Users\Akshay baradwaj\Desktop\prahari-google\Prahari-dataset\test_data.csv",
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "test_data.csv"),
        ]
        self.dataset_path = None
        for p in possible_paths:
            if os.path.exists(p):
                self.dataset_path = p
                break

    def load_dataset(self):
        if self.df is None:
            if not self.dataset_path or not os.path.exists(self.dataset_path):
                print(f"Warning: Dataset not found at {self.dataset_path}")
                return
            print(f"Loading dataset from {self.dataset_path}")
            self.df = pd.read_csv(self.dataset_path)
            
            self.df = self.df.sort_values(['event_id', 'time_to_tca'], ascending=[True, False]).reset_index(drop=True)
            self.df = self.df.replace({np.nan: None})
            print("Dataset loaded successfully.")
            self._build_events_cache()
            
    def _build_events_cache(self):
        print("Building events cache...")
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
        if self.df is None:
            self.load_dataset()
            
        if self.df is None:
            return None

        try:
            event_id_val = float(event_id) if '.' in str(event_id) else int(event_id)
        except ValueError:
            event_id_val = event_id
            
        event_df = self.df[self.df['event_id'] == event_id_val]
        
        if event_df.empty:
            return None
            
        cdms = event_df.to_dict(orient='records')
        
        # Add predictions using 9-feature model
        if prediction_service.model is not None or prediction_service.load_model():
            for cdm in cdms:
                try:
                    pred = prediction_service.predict(cdm)
                    cdm['predicted_risk'] = pred['predicted_risk']
                except Exception as e:
                    cdm['predicted_risk'] = cdm.get('risk', -10.0)
        else:
            for cdm in cdms:
                cdm['predicted_risk'] = cdm.get('risk', -10.0)
        
        summary = next((e for e in (self.events_cache or []) if e['event_id'] == str(event_id)), None)
        
        return {
            "summary": summary,
            "cdms": cdms
        }

dataset_service = DatasetService()
