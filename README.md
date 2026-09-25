# 🛰️ PRAHARI: Autonomous Spacecraft Conjunction Triage & Collision Avoidance Platform

> **High-Recall Machine Learning Engine (92.70% Recall @ -6.0 $\log_{10}(P_c)$ Threshold) Utilizing 100 Native Telemetry Parameters from ESA/SSN Conjunction Data Messages.**

---

## 🌟 Key Highlights

- **92.70% High-Risk Recall**: Successfully detects 165 out of 178 dangerous collisions on held-out test data at the official `-6.0` high-risk threshold.
- **89.77% Safety $F_2$ Score**: Heavily weights recall ($2\times$) to prevent catastrophic satellite loss.
- **79.71% Precision (Only 42 False Alarms)**: Eliminates the 85% false alarm flood reported in published base literature (*Kalyanaraman et al., 2026*).
- **100% Native Dataset Telemetry**: Ingests all 100 raw CDM telemetry parameters (orbit kinematics, 3D covariance matrices, solar atmospheric drag indices, and sensor fit residuals) without synthetic feature bloat.
- **3 to 5 Days Actionable Lead Time**: Provides orbital dynamics teams ample lead time for validation and collision avoidance maneuver (CAM) thruster burns.
- **Interactive 3D Mission Control**: Full-bleed Three.js / WebGL orbital encounter visualizer, timeline playback scrubber, and Model Lab threshold calibration.

---

## 📊 Empirical Evaluation Benchmark ($N = 2,167$ Test Events)

| Metric | PRAHARI (100 Raw Features) | Kalyanaraman et al. (2026) | ESA Competition Winner |
| :--- | :---: | :---: | :---: |
| **Operational Threshold ($\tau$)** | **$-6.0\text{ }\log_{10}(P_c)$** | $-6.0\text{ }\log_{10}(P_c)$ | $-6.0\text{ }\log_{10}(P_c)$ |
| **High-Risk Recall (Collisions Caught)** | **92.70% (165 / 178)** | $\sim 68.0\%$ | $78.2\%$ |
| **Safety $F_2$ Score (Recall 2×)** | **89.77%** | $\sim 35.0\%$ | $69.1\%$ |
| **Operational Precision** | **79.71% (Only 42 False Alarms)** | $15.0\%$ (85% False Alarms) | $\sim 32.4\%$ |
| **Overall Accuracy** | **97.46% (2,112 / 2,167)** | $\sim 85.0\%$ | $\sim 91.0\%$ |
| **Actionable Early Warning Lead Time** | **3 to 5 Days pre-TCA** | **0 Hours (TCA snapshot)** | $2\text{--}5$ Days |

---

## 🚀 One-Click Quickstart

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**

### Launching Mission Control
Simply double-click **`START.bat`** (or execute from terminal):

```powershell
.\START.bat
```

This will automatically:
1. Install any missing Python dependencies (`pip install -r backend/requirements.txt`).
2. Start the **FastAPI Backend** on `http://localhost:8000`.
3. Install frontend dependencies (`npm install`) and launch the **Vite React UI** on `http://localhost:5173`.
4. Open your default web browser to the live Mission Control dashboard.

---

## 📁 Repository Structure & Directory Guide

```text
prahari-standalone/
│
├── START.bat                  # 1-Click Launch Script (starts backend + frontend)
├── README.md                  # Project Documentation & Architecture Guide
├── requirements.txt           # Python Dependencies
│
├── backend/                   # FastAPI Asynchronous Microservice Backend
│   ├── main.py                # REST API Endpoints (/api/predict-cdm, /api/events, /api/model-info)
│   ├── requirements.txt       # Backend Python dependencies
│   └── services/              # Core Services
│       ├── dataset_service.py # Telemetry CDM ingestion & event database loader
│       └── prediction_service.py # 100-Feature High-Recall XGBoost inference engine
│
├── frontend/                  # React 18 + TypeScript + Three.js 3D Mission Control
│   ├── src/                   # React UI Source Code
│   │   ├── pages/             # Mission Control Pages (Overview, ModelLab, Prediction, Globe, etc.)
│   │   ├── components/        # Layout & Three.js 3D WebGL Encounter Scene
│   │   ├── contexts/          # Auth & State Management
│   │   └── types/             # TypeScript Conjunction & Telemetry Interfaces
│   ├── public/                # 3D Earth Textures & Benchmark Figures
│   ├── package.json           # Frontend dependencies (React, Vite, Three.js, Lucide, Tailwind)
│   └── vite.config.ts         # Vite build configuration
│
├── data/                      # Mission Datasets & Telemetry Samples
│   ├── events_summary.json    # Conjunction events metadata
│   └── sample_cdms.csv        # Sample multi-pass CDMs for testing upload
│
├── models/                    # Trained Machine Learning Artifacts
│   ├── xgboost_raw_model.pkl  # High-Recall XGBoost Model (92.70% recall at -6.0 threshold)
│   ├── feature_columns_raw.json # 100 Native Telemetry Columns List
│   ├── feature_medians_raw.json # Zero-Crash Pre-computed Median Imputation Matrix
│   └── metrics_raw.json       # Empirical Benchmarking Results (2,167 held-out test events)
│
├── docs/                      # Presentation Deck, Research Paper & System Diagrams
│   ├── Prahari_Presentation.pptx # 13-Slide Institutional PPT Presentation
│   ├── Prahari_Research_Paper.docx # Academic Research Paper
│   ├── system_design_diagram.png # 4-Stage Architecture Diagram
│   ├── database_diagram.png   # 100-Parameter Telemetry Schema Diagram
│   ├── class_diagram.png      # UML Component & Class Interaction Diagram
│   ├── template_assets/       # 4K Master Template Backgrounds
│   └── slide_previews/        # High-Res Previews of all 13 Slides (slide_1 to slide_13)
│
├── scripts/                   # Utility Scripts
│   └── generate_ppt.py        # Automated PowerPoint Deck Builder
│
└── src/                       # Machine Learning Training Pipeline
    └── train.py               # 100-Feature High-Recall Training & Validation Script
```

---

## 📄 Academic Research Paper & Presentation

Full academic documentation is included inside the `docs/` folder:
- 📊 **PowerPoint Slide Deck**: [`docs/Prahari_Presentation.pptx`](docs/Prahari_Presentation.pptx)
- 📄 **Research Paper Word Doc**: [`docs/Prahari_Research_Paper.docx`](docs/Prahari_Research_Paper.docx)
- 🖼️ **Architecture Diagrams**: [`docs/system_design_diagram.png`](docs/system_design_diagram.png), [`docs/database_diagram.png`](docs/database_diagram.png), [`docs/class_diagram.png`](docs/class_diagram.png)

---

## 🛡️ License
Released under the MIT License. Developed for Space Situational Awareness & Orbital Safety.
