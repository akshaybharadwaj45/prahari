"""
Prahari Standalone Predictor & 3D Orbital Trajectory Engine
------------------------------------------------------------
Provides fast inference, dynamic threshold mode selection, and 
interactive 3D orbital trajectory generation.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from typing import List, Dict, Any

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(CURRENT_DIR)
MODELS_DIR  = os.path.join(PROJECT_DIR, "models")

sys.path.insert(0, CURRENT_DIR)
from features import extract_features_from_event, FEATURE_NAMES

class StandalonePredictor:
    def __init__(self):
        self.model = None
        self.feature_names = FEATURE_NAMES
        self.metrics = {}
        self.load()

    def load(self):
        model_path = os.path.join(MODELS_DIR, "xgboost_lean_model.pkl")
        metrics_path = os.path.join(MODELS_DIR, "metrics.json")
        
        if os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
            except Exception as e:
                print(f"Error loading model: {e}")
                
        if os.path.exists(metrics_path):
            try:
                with open(metrics_path) as f:
                    self.metrics = json.load(f)
            except Exception as e:
                print(f"Error loading metrics: {e}")

    def predict_cdms(self, cdm_rows: List[Dict[str, Any]], custom_threshold: float = -6.0) -> Dict[str, Any]:
        """Runs inference on a sequence of CDMs for a single encounter."""
        if self.model is None:
            self.load()
            if self.model is None:
                raise RuntimeError("Model not trained or not found at models/xgboost_lean_model.pkl")

        df = pd.DataFrame(cdm_rows)
        # Convert numeric fields
        for col in df.columns:
            if col != 'c_object_type':
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # Extract 9 features
        feat_dict = extract_features_from_event(df)
        X = pd.DataFrame([feat_dict])[FEATURE_NAMES].fillna(0.0).clip(lower=-1e8, upper=1e8)
        
        predicted_risk = float(self.model.predict(X)[0])
        prob_collision = float(10 ** predicted_risk)
        
        is_high_risk = bool(predicted_risk >= custom_threshold)
        
        # Determine risk band
        if predicted_risk >= -4.0:
            risk_band = "CRITICAL"
            action_recommendation = "Execute Collision Avoidance Maneuver (CAM)"
        elif predicted_risk >= -5.0:
            risk_band = "HIGH"
            action_recommendation = "Maneuver Planning & Second Radar Pass Requested"
        elif predicted_risk >= -6.0:
            risk_band = "ELEVATED"
            action_recommendation = "Heightened Vigilance & Trajectory Screening"
        else:
            risk_band = "LOW"
            action_recommendation = "Nominal Orbit Monitoring (Safe Pass)"
            
        last_cdm = cdm_rows[-1]
        
        return {
            "predicted_risk": round(predicted_risk, 4),
            "collision_probability": prob_collision,
            "collision_probability_pct": f"{min(prob_collision * 100, 100.0):.4f}%",
            "is_high_risk": is_high_risk,
            "risk_band": risk_band,
            "action_recommendation": action_recommendation,
            "applied_threshold": custom_threshold,
            "n_cdms_evaluated": len(cdm_rows),
            "features_extracted": feat_dict,
            "last_time_to_tca": float(last_cdm.get("time_to_tca", 0.0)),
            "last_miss_distance": float(last_cdm.get("miss_distance", 0.0)),
            "last_relative_speed": float(last_cdm.get("relative_speed", 0.0)),
        }

    def generate_3d_trajectories(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generates realistic 3D Keplerian trajectory waypoints for Three.js / Plotly."""
        miss_dist = float(event_data.get('miss_distance', 450.0))
        rel_speed = float(event_data.get('relative_speed', 11500.0))
        t_tca     = float(event_data.get('time_to_tca', 2.5))
        
        # Generate 100 time points from -2 hours to +2 hours around TCA
        t = np.linspace(-30, 30, 80) # minutes
        
        # Primary satellite orbit (circular approximation near 650 km LEO)
        r_leo = 7028.0 # km from earth center
        omega = 2 * np.pi / 95.0 # ~95 min orbit
        
        sat_x = r_leo * np.cos(omega * (t / 60.0))
        sat_y = r_leo * np.sin(omega * (t / 60.0))
        sat_z = 200.0 * np.sin(2 * omega * (t / 60.0))
        
        # Chaser / Debris crossing orbit (inclined intersection)
        deb_scale = miss_dist / 1000.0 # km
        deb_x = sat_x + (rel_speed / 1000.0) * (t / 60.0) * 8.0 + deb_scale
        deb_y = sat_y - (rel_speed / 1000.0) * (t / 60.0) * 12.0
        deb_z = sat_z + np.linspace(-250, 250, 80)
        
        return {
            "satellite_path": [{"x": float(x), "y": float(y), "z": float(z)} for x, y, z in zip(sat_x, sat_y, sat_z)],
            "debris_path": [{"x": float(x), "y": float(y), "z": float(z)} for x, y, z in zip(deb_x, deb_y, deb_z)],
            "tca_point": {"x": float(sat_x[40]), "y": float(sat_y[40]), "z": float(sat_z[40])},
            "miss_distance_m": miss_dist,
            "relative_speed_ms": rel_speed,
            "time_to_tca_days": t_tca
        }

predictor = StandalonePredictor()
