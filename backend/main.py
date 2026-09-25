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

        # Format full CDMs for 3D Event Lab visualization
        formatted_cdms = []
        for row in cdm_rows:
            formatted_cdms.append({
                "time_to_tca": float(row.get("time_to_tca", 0.0)) if pd.notna(row.get("time_to_tca")) else 0.0,
                "miss_distance": float(row.get("miss_distance", 500.0)) if pd.notna(row.get("miss_distance")) else 500.0,
                "relative_speed": float(row.get("relative_speed", 10000.0)) if pd.notna(row.get("relative_speed")) else 10000.0,
                "relative_position_r": float(row.get("relative_position_r", 0.0)) if pd.notna(row.get("relative_position_r")) else 0.0,
                "relative_position_t": float(row.get("relative_position_t", 0.0)) if pd.notna(row.get("relative_position_t")) else 0.0,
                "relative_position_n": float(row.get("relative_position_n", 0.0)) if pd.notna(row.get("relative_position_n")) else 0.0,
                "relative_velocity_r": float(row.get("relative_velocity_r", 0.0)) if pd.notna(row.get("relative_velocity_r")) else 0.0,
                "relative_velocity_t": float(row.get("relative_velocity_t", 0.0)) if pd.notna(row.get("relative_velocity_t")) else 0.0,
                "relative_velocity_n": float(row.get("relative_velocity_n", 0.0)) if pd.notna(row.get("relative_velocity_n")) else 0.0,
                "risk": float(row.get("risk", result["predicted_risk"])) if pd.notna(row.get("risk")) else float(result["predicted_risk"]),
                "predicted_risk": float(result["predicted_risk"]),
                "c_object_type": str(row.get("c_object_type", "DEBRIS")),
                "c_sigma_r": float(row.get("c_sigma_r", 10.0)) if pd.notna(row.get("c_sigma_r")) else 10.0,
                "c_sigma_t": float(row.get("c_sigma_t", 50.0)) if pd.notna(row.get("c_sigma_t")) else 50.0,
                "c_sigma_n": float(row.get("c_sigma_n", 10.0)) if pd.notna(row.get("c_sigma_n")) else 10.0,
                "t_sigma_r": float(row.get("t_sigma_r", 10.0)) if pd.notna(row.get("t_sigma_r")) else 10.0,
                "t_sigma_t": float(row.get("t_sigma_t", 50.0)) if pd.notna(row.get("t_sigma_t")) else 50.0,
                "t_sigma_n": float(row.get("t_sigma_n", 10.0)) if pd.notna(row.get("t_sigma_n")) else 10.0,
                "mahalanobis_distance": float(row.get("mahalanobis_distance", 5.0)) if pd.notna(row.get("mahalanobis_distance")) else 5.0,
            })
        result["cdms"] = formatted_cdms
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/model-info")
def get_model_info():
    return prediction_service.get_model_info()

