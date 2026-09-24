"""
Prahari Standalone: High-Recall XGBoost Training (100 Native Dataset Features)
-------------------------------------------------------------------------------
Trains XGBoost directly on the 100 raw telemetry parameters from train_data.csv
and evaluates performance at the standard -6.0 log10(Pc) threshold on test_data.csv.
"""

import os
import sys
import json
import time
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, fbeta_score,
    r2_score, mean_squared_error, mean_absolute_error, confusion_matrix
)

# Directory Paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(CURRENT_DIR)
DATA_DIR    = os.path.join(os.path.dirname(PROJECT_DIR), "Prahari-dataset")
MODELS_DIR  = os.path.join(PROJECT_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

HIGH_RISK_THRESHOLD = -6.0

def train_high_recall_model():
    print("=" * 80)
    print("🛰️  PRAHARI: TRAINING HIGH-RECALL MODEL (100 NATIVE DATASET FEATURES)")
    print("=" * 80)

    train_path = os.path.join(DATA_DIR, "train_data.csv")
    test_path  = os.path.join(DATA_DIR, "test_data.csv")

    print(f"1. Loading datasets from {DATA_DIR}...")
    train_df = pd.read_csv(train_path)
    test_df  = pd.read_csv(test_path)
    print(f"   • Train shape: {train_df.shape} ({train_df['event_id'].nunique()} unique events)")
    print(f"   • Test shape : {test_df.shape} ({test_df['event_id'].nunique()} unique events)")

    # Identify all 100 raw numeric feature columns
    raw_cols = [c for c in train_df.columns if c not in ('event_id', 'risk', 'c_object_type')]
    print(f"2. Extracted {len(raw_cols)} native telemetry features (0 synthetic features added).")

    # Training Matrix: Ingests all observation rows
    X_train = train_df[raw_cols].copy()
    y_train = train_df['risk'].copy()

    # Pre-calculate training medians for zero-failure imputation on test/uploaded CDMs
    medians = X_train.median().to_dict()
    X_train = X_train.fillna(medians).clip(lower=-1e8, upper=1e8)

    # Test Evaluation Matrix: Ground-truth event risk at TCA
    test_targets = test_df.groupby('event_id').apply(
        lambda g: g.sort_values('time_to_tca', ascending=True).iloc[0]['risk']
    )
    # Available observation before TCA
    test_event_rows = test_df.groupby('event_id').apply(
        lambda g: g.sort_values('time_to_tca', ascending=True).iloc[0 if len(g) == 1 else 1][raw_cols]
    )
    X_test = test_event_rows.fillna(medians).clip(lower=-1e8, upper=1e8)
    y_test = test_targets.values

    # Asymmetric Sample Weighting: Heavily penalize under-predicting dangerous encounters
    sample_weights = np.where(y_train >= HIGH_RISK_THRESHOLD, 30.0, 1.0)

    print("\n3. Training Regularized XGBoost Regressor with High-Recall Asymmetric Weights...")
    t0 = time.time()
    model = xgb.XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.03,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        tree_method="hist"
    )
    model.fit(X_train, y_train, sample_weight=sample_weights)
    train_time = time.time() - t0
    print(f"   ✓ Model training completed in {train_time:.2f} seconds.")

    # Model Evaluation at -6.0 Operational Threshold
    print(f"\n4. Evaluating Model on Held-Out Test Set at Threshold: {HIGH_RISK_THRESHOLD} log10(Pc)...")
    y_pred = model.predict(X_test)
    y_test_bin = (y_test >= HIGH_RISK_THRESHOLD).astype(int)
    y_pred_bin = (y_pred >= HIGH_RISK_THRESHOLD).astype(int)

    acc  = accuracy_score(y_test_bin, y_pred_bin)
    rec  = recall_score(y_test_bin, y_pred_bin)
    prec = precision_score(y_test_bin, y_pred_bin)
    f2   = fbeta_score(y_test_bin, y_pred_bin, beta=2)
    r2   = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae  = mean_absolute_error(y_test, y_pred)

    hr_mask = y_test >= HIGH_RISK_THRESHOLD
    mse_hr = float(mean_squared_error(y_test[hr_mask], y_pred[hr_mask]))
    kelvins_L = float((1.0 / f2) * mse_hr) if f2 > 0 else 999.0

    tn, fp, fn, tp = confusion_matrix(y_test_bin, y_pred_bin).ravel()

    # Feature Importances (SHAP approximation)
    feat_imp = sorted(zip(raw_cols, model.feature_importances_), key=lambda x: x[1], reverse=True)
    top_features = [{"feature": k, "importance": round(float(v), 4)} for k, v in feat_imp[:12]]

    print("\n" + "=" * 80)
    print("📊 EMPIRICAL EVALUATION RESULTS (N = 2,167 Test Events)")
    print("=" * 80)
    print(f"• High-Risk Recall  : {rec*100:.2f}% ({tp}/{tp+fn} true collisions detected)")
    print(f"• Safety F2 Score   : {f2*100:.2f}% (Recall weighted 2x)")
    print(f"• Precision         : {prec*100:.2f}% (Only {fp} false alarms across {tn+fp} safe passes)")
    print(f"• Overall Accuracy  : {acc*100:.2f}% ({tp+tn}/{len(y_test)} correct classifications)")
    print(f"• R² Linearity Score: {r2:.4f}")
    print(f"• RMSE Error        : {rmse:.4f}")
    print(f"• MAE Error         : {mae:.4f}")
    print("=" * 80)

    # Save Model Artifacts
    model_file = os.path.join(MODELS_DIR, "xgboost_raw_model.pkl")
    joblib.dump(model, model_file)

    with open(os.path.join(MODELS_DIR, "feature_columns_raw.json"), "w") as f:
        json.dump(raw_cols, f, indent=2)

    with open(os.path.join(MODELS_DIR, "feature_medians_raw.json"), "w") as f:
        json.dump(medians, f, indent=2)

    metrics_data = {
        "model_name": "Prahari Raw Dataset Features XGBoost (High Recall)",
        "feature_count": len(raw_cols),
        "features": raw_cols,
        "threshold": HIGH_RISK_THRESHOLD,
        "accuracy": float(acc),
        "recall": float(rec),
        "precision": float(prec),
        "f2_score": float(f2),
        "mse_hr": float(mse_hr),
        "kelvins_loss": float(kelvins_L),
        "r2_score": float(r2),
        "rmse": float(rmse),
        "mae": float(mae),
        "tp": int(tp), "fp": int(fp), "fn": int(fn), "tn": int(tn),
        "training_time": float(train_time),
        "top_features": top_features
    }

    with open(os.path.join(MODELS_DIR, "metrics_raw.json"), "w") as f:
        json.dump(metrics_data, f, indent=2)

    print(f"\n✓ Artifacts successfully saved to {MODELS_DIR}/")
    return metrics_data

if __name__ == "__main__":
    train_high_recall_model()
