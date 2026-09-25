# PROJECT PRAHARI (प्रहारी)
## AI Satellite Collision Assessment & Autonomous Risk Triage Engine
*Complete Codebase Architecture, Base Paper Review, Research Gaps, Feature Importance, Sample CDMs & Viva Guide*

---

## 1. Codebase Architecture & How It Works (Simple & Short)

The project is structured into a clean decoupled architecture connecting a high-speed Python/FastAPI backend with a React 18 / Three.js 3D frontend:

| File / Module | Type / Tech | What It Does in Simple Words |
| :--- | :--- | :--- |
| **`START.bat`** | Batch Script | **1-Click Launcher:** Checks Python & Node.js, auto-installs missing dependencies, launches FastAPI backend on Port 8000 and Vite frontend on Port 5173, and opens the browser. |
| **`backend/main.py`** | FastAPI Server | Exposes REST APIs: `/api/events` (archive), `/api/events/{id}` (details), `/api/predict-cdm` (custom CSV prediction), and `/api/model-info` (model metrics). |
| **`backend/services/prediction_service.py`** | ML Inference Engine | Loads trained `xgboost_raw_model.pkl`, aligns 100 telemetry columns, fills missing NaNs with precomputed medians, executes < 2ms risk inference, and returns SHAP drivers. |
| **`backend/services/dataset_service.py`** | Data Service | Loads pre-indexed 2,167 historical events from `data/events_summary.json`, handles standalone zero-database offline fallback, and builds CDM playback timelines. |
| **`frontend/src/pages/OverviewPage.tsx`** | React Component | Mission control dashboard displaying live event counters (Total, Critical, High, Elevated, Low), risk distribution charts, and quick CDM file dropzone. |
| **`frontend/src/pages/EventDetailPage.tsx`** | Three.js / React | Interactive 3D orbital encounter scene showing Target vs Chaser trajectories, 3D covariance uncertainty bubbles, time-to-TCA slider, and parameter inspector. |
| **`frontend/src/pages/PredictionPage.tsx`** | React Component | Allows operators to test **Individual** and **Sequential** sample CDMs with 1-click or drag-and-drop custom CSVs to receive instant risk scores, alert bands, and top SHAP drivers. |
| **`frontend/src/pages/ModelLabPage.tsx`** | React Component | Interactive model playground with dynamic threshold tuning slider, confusion matrix metrics (Recall, Precision, F2), and SHAP feature importance charts. |
| **`frontend/src/pages/GlobePage.tsx`** | Three.js / Leaflet | 3D interactive Earth globe displaying real satellite orbits (ISS, Tiangong, Sentinel) and 2D ground track trajectory overlays. |

---

## 2. The Real-World Space Debris Problem

* **The Crisis:** Over 36,000 trackable orbital debris pieces (>10 cm) travel at hypervelocity speeds exceeding **7.8 km/s (28,000 km/h)** in Low Earth Orbit (LEO).
* **The Human Bottleneck:** Space surveillance networks issue over **100,000 Conjunction Data Messages (CDMs) daily**. Over 99.9% are harmless false alarms, but human flight dynamics teams take days to manually analyze them.
* **The Risk of Delay:** If a real collision threat is not identified 24 to 72 hours before closest approach (TCA), operators cannot plan and execute thruster avoidance burns.

---

## 3. What Is Mentioned in the Base Paper?

* **The Foundation:** The project builds upon the **ESA Kelvins Collision Avoidance Challenge** conducted by the European Space Agency (ESA). The base paper investigated predicting the final collision risk ($\log_{10} P_c$) at the moment of closest approach (TCA) using intermediate, early CDMs received days prior.
* **Dataset:** Real & simulated conjunction events from ESA operational missions (Sentinel-1/2/3, CryoSat-2, Swarm) and space debris catalogs.
* **Custom Kelvins Loss Metric ($L$):** An asymmetric weighted mean squared error that heavily penalizes missing high-risk events:
  $$L = rac{1}{N} \sum_{i=1}^{N} (\hat{y}_i - y_i)^2 \cdot w_i, \quad 	ext{where } w_i = 10^{\max(0, y_i + 6)}$$
* **Base Paper Baselines:** Traditional 2D Foster / 3D Alfriend analytical probability integrals, Linear Regression, Multi-Layer Perceptrons (MLP), and standard Random Forests.

---

## 4. Gaps Found in the Base Paper & How Prahari Fixed Them

| Identified Gap / Limitation in Base Paper | Why It Was a Problem (Flaw) | How Prahari Fixed It |
| :--- | :--- | :--- |
| **1. Neglected Cross-Feature Physical Interactions** | Base models looked at miss distance in isolation, missing that a 500m miss with high covariance uncertainty is far deadlier than a 100m miss with tight uncertainty. | **Integrated 100 Native Telemetry Parameters:** Full 3D covariance determinants, velocity vectors, and Mahalanobis uncertainty scaling. |
| **2. High False Negative Rate (Missed Collisions)** | Competing ML models used default 0.5 classification cutoffs, missing 40% to 54% of true high-risk collision events (catastrophic for satellite safety). | **Calibrated -6.0 Log-Risk Threshold:** Achieved **92.7% Recall** on critical events (165/178 critical collisions detected early). |
| **3. Fragility with Missing Data (Telemetry Dropouts)** | Real radar tracking has frequent missing parameters (NaNs). Baseline models dropped rows or used zero-imputation, distorting covariance matrices. | **Domain-Specific Median Imputation & Tree NaN Routing:** XGBoost routes missing values natively without corrupting physical calculations. |
| **4. Black-Box Nature & No Operational Visualization** | Base paper outputs were static numbers with zero explainability or visual verification for flight dynamics operators under high stress. | **SHAP Feature Attribution & Real-time 3D Scene:** Operators see exact physical drivers and interactive 3D encounter trajectories. |

---

## 5. Our Feature Importance Breakdown (What Drives the AI?)

Based on SHAP (SHapley Additive exPlanations) and XGBoost gain metrics, here are the top physical parameters governing collision risk predictions:

| Feature Name | Importance | Physical Meaning & Why It Matters |
| :--- | :--- | :--- |
| **Mahalanobis Distance** | **22.4%** | 3D spatial miss distance scaled by the combined positional uncertainty ellipsoids. The single strongest predictor of true physical collision probability. |
| **Closest Miss Distance (m)** | **18.5%** | Minimum physical Euclidean distance between target and chaser at TCA. |
| **Relative Speed (m/s)** | **14.2%** | Encounter velocity. Dictates the duration of the encounter window and total kinetic impact energy ($E_k = 0.5 m v^2$). |
| **Time to TCA (days)** | **11.8%** | Time remaining until closest approach. As time decreases, tracking uncertainty shrinks and predictions become definitive. |
| **Covariance Determinants ($\det C$)** | **16.5%** | Combined determinant of Target & Chaser position covariance matrices ($\det C_t, \det C_c$), representing total 3D uncertainty volume. |
| **Radial Uncertainty ($\sigma_r$)** | **10.2%** | Position error along the radial direction (altitude axis). This is the most sensitive orbital dimension for collision geometry. |
| **Solar Radio Flux ($F_{10.7}$)** | **3.5%** | Solar 10.7cm flux index. Directly drives thermospheric density expansion, increasing satellite drag and orbital decay uncertainty. |
| **Geocentric Latitude** | **2.9%** | Orbital latitude at TCA, accounting for Earth's oblateness ($J_2$ gravitational perturbation effect). |

---

## 6. Sample CDM Files for Testing the ML (Frontend Web Bench)

Two dedicated sample CDM files are pre-loaded in the web application (**Prediction Tab**) for instant 1-click evaluation:

| Sample File | Type & Structure | Simulated Scenario & Expected Prediction |
| :--- | :--- | :--- |
| **`sample_individual_cdm.csv`** | **Type A: Individual CDM**<br/>(1 Observation Row) | Simulates a single snapshot encounter (Event 2) with tight miss distance and high position covariance. Yields **HIGH risk alert** ($\log_{10} P_c pprox -4.66$). |
| **`sample_sequential_cdms.csv`** | **Type B: Sequential CDMs**<br/>(5 Chronological Rows) | Simulates a multi-observation tracking sequence (Event 0) tracking risk evolution from $T-6.84$d to $T-2.22$d. Yields **LOW risk alert** ($\log_{10} P_c pprox -7.37$). |

---

## 7. Operational Alert Bands & Triage Matrix

| Alert Band | Log10 Risk Threshold | Real Probability | Operational Action Required |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | **$\ge -4.0$** | $\ge 1 	ext{ in } 10,000$ | Immediate Thruster Maneuver (CAM) mandatory. |
| **HIGH** | **$-5.0 	ext{ to } -4.0$** | $1 	ext{ in } 10	ext{k to } 100	ext{k}$ | Task radar tracking; compute avoidance burns. |
| **ELEVATED** | **$-6.0 	ext{ to } -5.0$** | $1 	ext{ in } 100	ext{k to } 1	ext{M}$ | Monitor follow-up CDMs; stand-by status. |
| **LOW** | **$< -6.0$** | $< 1 	ext{ in } 1,000,000$ | Benign approach; automated archive (no burn). |

---

## 8. Top 10 Viva & Interview Questions (Quick Revision Sheet)

* **Q1: What is TCA and why is it critical?**
  * **Ans:** TCA stands for **Time of Closest Approach**. It is the exact second when two orbital objects reach their minimum distance. Collision Avoidance Maneuvers (CAM) must be executed at least 24-48 hours before TCA to save fuel and ensure trajectory clearance.
* **Q2: What is a CDM (Conjunction Data Message)?**
  * **Ans:** An international standard telemetry format (CCSDS standard) issued by space surveillance networks (ESA/SSN) containing state vectors, velocities, and 3D uncertainty covariances ($\sigma_r, \sigma_t, \sigma_n$) for two approaching objects.
* **Q3: Why do we express collision risk in log10 format (e.g. -4.0)?**
  * **Ans:** Real collision probabilities are tiny fractions ($10^{-4}$ or $10^{-6}$). Expressing them as $\log_{10}(	ext{Risk})$ converts these exponential fractions into an intuitive linear operational scale ($-4.0 = 10^{-4}$).
* **Q4: Why prioritize Recall (92.7%) over Precision?**
  * **Ans:** In aerospace safety, a **False Negative (missed collision) is fatal** (satellite destruction and Kessler cascade). A False Positive only causes an engineer to verify the data. High Recall guarantees no critical threats slip through.
* **Q5: Why choose XGBoost over Deep Neural Networks?**
  * **Ans:** CDMs are structured tabular telemetry with 100 heterogeneous numerical features and missing values. XGBoost natively handles NaNs, trains in seconds, runs inference in < 2ms, and outperforms deep neural networks on tabular datasets.
* **Q6: What is the Mahalanobis Distance?**
  * **Ans:** It measures the distance between two objects **scaled by their combined 3D covariance uncertainty bubbles**. A 500m miss inside a 2,000m bubble is dangerous; a 500m miss inside a 10m bubble is safe.
* **Q7: What is the Kessler Syndrome?**
  * **Ans:** A runaway collision chain reaction where orbital debris collisions create more debris fragments, permanently destroying access to Low Earth Orbit for generations.
* **Q8: How does Prahari handle multiple CDMs over time for a single event?**
  * **Ans:** As ground radars make newer observations closer to TCA, multiple CDMs are issued. Prahari tracks the chronological risk evolution and evaluates the latest available telemetry state for the most accurate prediction.
* **Q9: What is the difference between Individual and Sequential CDM testing?**
  * **Ans:** Individual CDMs test single-epoch alert triage (snapshot encounter), while Sequential CDMs test time-series tracking updates as uncertainty shrinks approaching TCA. Both can be tested with 1-click in the Prediction page.
* **Q10: What makes Prahari a standalone deployment?**
  * **Ans:** Prahari packages its pre-computed 2,167 event archive and ML model weights locally. Double-clicking `START.bat` automatically verifies dependencies and launches both backend and frontend without external cloud databases.
