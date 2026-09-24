"""
Prahari Standalone Dataset & Events Service
-------------------------------------------
Loads and caches conjunction events for real-time table queries,
filtering by risk band, and individual event inspection.
"""

import os
import sys
import json
import pandas as pd

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from typing import List, Dict, Any

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(CURRENT_DIR)
DATA_DIR    = os.path.join(PROJECT_DIR, "data")
ROOT_DATA   = os.path.join(os.path.dirname(PROJECT_DIR), "Prahari-dataset")
os.makedirs(DATA_DIR, exist_ok=True)

class StandaloneDatasetService:
    def __init__(self):
        self.events_cache = []
        self.events_by_id = {}
        self.raw_test_df = None
        self.init_data()

    def init_data(self):
        cache_path = os.path.join(DATA_DIR, "events_summary.json")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, 'r') as f:
                    self.events_cache = json.load(f)
                    self.events_by_id = {str(e['event_id']): e for e in self.events_cache}
                print(f"✓ Loaded {len(self.events_cache)} cached events.")
                return
            except Exception as e:
                print(f"Error loading cached events: {e}")

        # If cache doesn't exist, build from test_data.csv
        test_path = os.path.join(ROOT_DATA, "test_data.csv")
        if os.path.exists(test_path):
            print("Building events cache from test_data.csv...")
            df = pd.read_csv(test_path)
            self.raw_test_df = df
            
            # Group by event_id
            events = []
            for event_id, group in df.groupby('event_id'):
                g_sorted = group.sort_values('time_to_tca', ascending=False)
                last_row = g_sorted.iloc[-1]
                first_row = g_sorted.iloc[0]
                
                final_risk = float(pd.to_numeric(last_row.get('risk', -10.0), errors='coerce'))
                miss_dist  = float(last_row.get('miss_distance', 1000.0))
                rel_speed  = float(last_row.get('relative_speed', 10000.0))
                time_tca   = float(last_row.get('time_to_tca', 2.0))
                mission_id = int(last_row.get('mission_id', 1))
                obj_type   = str(last_row.get('c_object_type', 'DEBRIS'))
                
                if final_risk >= -4.0:
                    risk_band = "CRITICAL"
                elif final_risk >= -5.0:
                    risk_band = "HIGH"
                elif final_risk >= -6.0:
                    risk_band = "ELEVATED"
                else:
                    risk_band = "LOW"
                    
                events.append({
                    "event_id": str(event_id),
                    "mission_id": mission_id,
                    "c_object_type": obj_type,
                    "final_risk": round(final_risk, 3),
                    "collision_prob": float(10 ** final_risk),
                    "miss_distance": round(miss_dist, 1),
                    "relative_speed": round(rel_speed, 1),
                    "time_to_tca": round(time_tca, 2),
                    "n_cdms": len(g_sorted),
                    "risk_band": risk_band
                })
                
            self.events_cache = events
            self.events_by_id = {e['event_id']: e for e in events}
            
            # Save cache
            with open(cache_path, 'w') as f:
                json.dump(events, f, indent=2)
                
            # Create a sample CDMs file for quick upload demo
            sample_events = list(df['event_id'].unique()[:5])
            sample_df = df[df['event_id'].isin(sample_events)]
            sample_df.to_csv(os.path.join(DATA_DIR, "sample_cdms.csv"), index=False)
            print(f"✓ Created {cache_path} and sample_cdms.csv")

    def get_events(self, risk_filter: str = "ALL", limit: int = 200) -> List[Dict[str, Any]]:
        if not self.events_cache:
            self.init_data()
            
        if risk_filter.upper() == "ALL":
            res = self.events_cache
        else:
            res = [e for e in self.events_cache if e['risk_band'] == risk_filter.upper()]
            
        return res[:limit]

    def get_event_details(self, event_id: str) -> Dict[str, Any]:
        if not self.events_by_id:
            self.init_data()
        return self.events_by_id.get(str(event_id), None)

dataset_service = StandaloneDatasetService()
