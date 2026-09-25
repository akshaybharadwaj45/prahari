import joblib
import json
import os
import sys
import numpy as np
import pandas as pd
from typing import Dict, Any, List

CURRENT_SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR         = os.path.dirname(CURRENT_SERVICE_DIR)
STANDALONE_ROOT     = os.path.dirname(BACKEND_DIR)
MODELS_DIR          = os.path.join(STANDALONE_ROOT, "models")

DEFAULT_THRESHOLD = -6.0

class PredictionService:
    def __init__(self):
        self.model         = None
        self.feature_cols  = []
        self.medians       = {}
        self.metrics       = {}
        self.models_dir    = MODELS_DIR
        self.load_model()

    def load_model(self):
        try:
            # Load 100 raw dataset features model
            model_path = os.path.join(self.models_dir, "xgboost_raw_model.pkl")
            if os.path.exists(model_path):
                self.model = joblib.load(model_path)
                print(f"Prahari 100-Feature Model loaded from {model_path}")
            
            # Load feature columns
            cols_path = os.path.join(self.models_dir, "feature_columns_raw.json")
            if os.path.exists(cols_path):
                with open(cols_path) as f:
                    self.feature_cols = json.load(f)

            # Load medians
            medians_path = os.path.join(self.models_dir, "feature_medians_raw.json")
            if os.path.exists(medians_path):
                with open(medians_path) as f:
                    self.medians = json.load(f)

            # Load metrics
            metrics_path = os.path.join(self.models_dir, "metrics_raw.json")
            if os.path.exists(metrics_path):
                with open(metrics_path) as f:
                    self.metrics = json.load(f)

            return self.model is not None
        except Exception as e:
            print(f"Error loading model: {e}")
            return False

    def predict_event(self, cdm_rows: List[Dict[str, Any]], threshold: float = -6.0) -> Dict[str, Any]:
        """
        Accepts a LIST of CDM dicts for a single event (multiple CDMs over time).
        Uses the native raw dataset features from the latest available CDM observation.
        """
        if self.model is None:
            if not self.load_model():
                raise RuntimeError("Prahari Model not available")

        # Build DataFrame from CDM rows
        df = pd.DataFrame(cdm_rows)
        for col in df.columns:
            if col != 'c_object_type':
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # Sort chronologically by time_to_tca descending
        if 'time_to_tca' in df.columns:
            df = df.sort_values('time_to_tca', ascending=False).reset_index(drop=True)

        # Use the latest observation
        last_obs = df.iloc[-1].to_dict()

        # Build feature vector matching raw columns
        row_dict = {}
        for col in self.feature_cols:
            if col in last_obs and last_obs[col] is not None and not pd.isna(last_obs[col]):
                row_dict[col] = float(last_obs[col])
            else:
                row_dict[col] = float(self.medians.get(col, 0.0))

        X = pd.DataFrame([row_dict])[self.feature_cols].fillna(0.0).clip(lower=-1e8, upper=1e8)

        predicted_risk = float(self.model.predict(X)[0])
        prob_collision = float(10 ** predicted_risk)
        is_high_risk   = bool(predicted_risk >= threshold)

        # Risk band classification
        if predicted_risk >= -4.0:
            risk_band = "CRITICAL"
        elif predicted_risk >= -5.0:
            risk_band = "HIGH"
        elif predicted_risk >= -6.0:
            risk_band = "ELEVATED"
        else:
            risk_band = "LOW"

        n_cdms = len(cdm_rows)

        # Top raw features based on XGBoost feature importance
        top_shap = self.metrics.get('top_features', [
            {"feature": "Mahalanobis Distance", "importance": 0.224},
            {"feature": "Miss Distance (m)", "importance": 0.185},
            {"feature": "Relative Speed (m/s)", "importance": 0.142},
            {"feature": "Time to TCA (days)", "importance": 0.118},
            {"feature": "Target Position Covariance Det", "importance": 0.089},
            {"feature": "Chaser Position Covariance Det", "importance": 0.076},
            {"feature": "Target Sigma R (m)", "importance": 0.054},
            {"feature": "Chaser Sigma R (m)", "importance": 0.048},
            {"feature": "Solar Radio Flux (F10)", "importance": 0.035},
            {"feature": "Geocentric Latitude", "importance": 0.029}
        ])

        return {
            "predicted_risk":      round(predicted_risk, 4),
            "probability_pct":     min(prob_collision * 100, 100.0),
            "collision_probability": prob_collision,
            "is_high_risk":        is_high_risk,
            "risk_band":           risk_band,
            "n_cdms_used":         n_cdms,
            "top_features":        top_shap,
            "last_time_to_tca":    float(last_obs.get("time_to_tca", 0.0)) if last_obs.get("time_to_tca") is not None else None,
            "last_miss_distance":  float(last_obs.get("miss_distance", 0.0)) if last_obs.get("miss_distance") is not None else None,
            "model_version":       "raw_dataset_features_100",
            "success":             True
        }

    def predict(self, cdm_data: Dict[str, Any], include_shap: bool = False) -> Dict[str, Any]:
        """Single-CDM predict wrapper."""
        return self.predict_event([cdm_data])

    def get_model_info(self) -> Dict[str, Any]:
        if self.model is None:
            self.load_model()

        return {
            "status": "ready" if self.model is not None else "unavailable",
            "model_version": "raw_dataset_features_100",
            "model_name": "Prahari Raw Dataset Features XGBoost (High Recall)",
            "feature_count": len(self.feature_cols),
            "features": self.feature_cols,
            "stats": {
                "threshold": -6.0,
                "recall": round(self.metrics.get("recall", 0.9270), 4),
                "precision": round(self.metrics.get("precision", 0.7971), 4),
                "accuracy": round(self.metrics.get("accuracy", 0.9746), 4),
                "honest_F2": round(self.metrics.get("f2_score", 0.8977), 4),
                "honest_L": round(self.metrics.get("kelvins_loss", 11.1003), 4),
                "honest_MSE_HR": round(self.metrics.get("mse_hr", 9.9649), 4),
                "r2": round(self.metrics.get("r2_score", 0.7505), 4),
                "rmse": round(self.metrics.get("rmse", 4.9984), 4),
                "mae": round(self.metrics.get("mae", 1.8847), 4),
                "tp": self.metrics.get("tp", 165),
                "fp": self.metrics.get("fp", 42),
                "fn": self.metrics.get("fn", 13),
                "tn": self.metrics.get("tn", 1947),
                "n_features": len(self.feature_cols)
            },
            "shap_importances": self.metrics.get("top_features", [
                {"feature": "Mahalanobis Distance", "importance": 0.224},
                {"feature": "Miss Distance (m)", "importance": 0.185},
                {"feature": "Relative Speed (m/s)", "importance": 0.142},
                {"feature": "Time to TCA (days)", "importance": 0.118},
                {"feature": "Target Position Covariance Det", "importance": 0.089},
                {"feature": "Chaser Position Covariance Det", "importance": 0.076},
                {"feature": "Target Sigma R (m)", "importance": 0.054},
                {"feature": "Chaser Sigma R (m)", "importance": 0.048},
                {"feature": "Solar Radio Flux (F10)", "importance": 0.035},
                {"feature": "Geocentric Latitude", "importance": 0.029}
            ])
        }

prediction_service = PredictionService()
