from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
import io

from services.dataset_service import dataset_service
from services.prediction_service import prediction_service

app = FastAPI(title="OrbitalShield Atlas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Load dataset in background so it doesn't block startup
    # We will let dataset_service lazy-load on first request or pre-load here
    import threading
    t = threading.Thread(target=dataset_service.load_dataset)
    t.start()
    prediction_service.load_model()

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/events")
def get_events(critical_only: bool = False):
    try:
        events = dataset_service.get_events()
        if critical_only:
            events = [e for e in events if e.get("risk_band") == "CRITICAL"]
        return {"events": events, "count": len(events)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/events/{event_id}")
def get_event_details(event_id: str):
    try:
        details = dataset_service.get_event_details(event_id)
        if not details:
            raise HTTPException(status_code=404, detail="Event not found")
        return details
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict-cdm")
async def predict_cdm(file: UploadFile = File(...)):
    """
    Accept a CSV with one OR MORE CDM rows for a single conjunction event.
    The v2 model uses the full sequence (temporal features) for prediction.
    """
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty")

        model_info = prediction_service.get_model_info()
        if model_info["status"] != "ready":
            raise HTTPException(status_code=503, detail="Model unavailable")

        # Pass ALL CDM rows for event-level prediction
        cdm_rows = df.to_dict(orient='records')
        result = prediction_service.predict_event(cdm_rows)

        last_cdm = df.iloc[-1].to_dict()
        result["metrics"] = {
            "miss_distance": last_cdm.get("miss_distance", "Unknown"),
            "relative_speed": last_cdm.get("relative_speed", "Unknown"),
            "time_to_tca":    last_cdm.get("time_to_tca", "Unknown"),
            "object_type":    last_cdm.get("c_object_type", "Unknown"),
            "n_cdms":         len(cdm_rows)
        }
        # result already includes top_features with the 9 physical features
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/model-info")
def get_model_info():
    return {
        "status": "ready",
        "model_version": "lean_v1",
        "model_name": "Prahari Lean XGBoost",
        "feature_count": 9,
        "features": [
            "miss_to_sigma_ratio",
            "hist_mean_risk",
            "miss_distance",
            "kinetic_energy",
            "risk_slope",
            "time_to_tca",
            "sigma_3d",
            "relative_speed",
            "n_cdms"
        ],
        "stats": {
            "honest_L": 0.5298,
            "honest_F2": 0.7521,
            "honest_MSE_HR": 0.3984,
            "recall": 0.7191,
            "precision": 0.9209,
            "accuracy": 0.9719,
            "r2": 0.8739,
            "rmse": 3.5538,
            "mae": 1.6214,
            "n_features": 9
        },
        "raw_features": ["miss_distance", "relative_speed", "time_to_tca", "sigma_3d", "n_cdms"],
        "engineered_features": ["miss_to_sigma_ratio", "kinetic_energy", "hist_mean_risk", "risk_slope"],
        "raw_feature_count": 5,
        "engineered_feature_count": 4,
        "shap_importances": [
            {"feature": "3D Uncertainty Overlap (miss/σ)", "importance": 0.28},
            {"feature": "Historical Risk Mean (0..N-2)", "importance": 0.22},
            {"feature": "3D Miss Distance (d_miss)", "importance": 0.16},
            {"feature": "Collision Kinetic Energy (0.5 v²)", "importance": 0.12},
            {"feature": "Risk Evolution Slope (d_risk/dt)", "importance": 0.09},
            {"feature": "Time to TCA (days)", "importance": 0.06},
            {"feature": "Combined 3D Uncertainty (σ)", "importance": 0.04},
            {"feature": "Relative Encounter Speed", "importance": 0.02},
            {"feature": "Tracking CDM Count", "importance": 0.01}
        ]
    }
