# PROJECT PRAHARI (प्रहारी)
## AI-Powered Satellite Collision Assessment & Autonomous Risk Triage
*Comprehensive Project Handbook, Literature Review & Viva Cheat Sheet*

---

## 1. The Core Problem in Space (Why this Project Exists)

* **The Space Traffic Crisis:** Over 36,000 trackable orbital debris fragments (>10 cm) and 10,000+ active satellites orbit Earth in Low Earth Orbit (LEO) at hypervelocity speeds exceeding **7.8 km/s (28,000 km/h)**. At this velocity, even a 1-centimeter bolt carries the kinetic energy of an exploding hand grenade.
* **What is a Conjunction & CDM?** Whenever radar/telescope tracking networks (e.g. US Space Surveillance Network / ESA) detect two objects approaching within a safety threshold, they issue a standardized telemetry report called a **CDM (Conjunction Data Message)** containing positions, velocities, 3D covariance uncertainty matrices, and estimated miss distances.
* **The Human Bottleneck:** Satellite operators receive **100,000+ CDMs every single day**. Over 99.9% are benign false alarms due to sensor noise. However, human flight dynamics teams spend days manually calculating collision risks and running trajectory simulations. If a high-risk collision isn't identified 24 to 72 hours before closest approach, there is no time left to calculate and fire satellite avoidance thrusters.

---

## 2. What Project Prahari Does

Prahari is an autonomous end-to-end mission-control triage platform. Instead of days of human review, Prahari uses an **optimized 100-feature XGBoost ML engine** that inspects incoming CDMs in milliseconds, classifies the true collision risk, assigns actionable risk bands, and provides 3D visual encounter reconstructions.

### Operational Alert Bands:
| Alert Band | Log10 Risk Threshold | Real Probability | Operational Action Required |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | **$\ge -4.0$** | $\ge 1 	ext{ in } 10,000$ | Immediate Thruster Maneuver (CAM) mandatory. |
| **HIGH** | **$-5.0 	ext{ to } -4.0$** | $1 	ext{ in } 10	ext{k to } 100	ext{k}$ | Task radar tracking; compute avoidance burns. |
| **ELEVATED** | **$-6.0 	ext{ to } -5.0$** | $1 	ext{ in } 100	ext{k to } 1	ext{M}$ | Monitor follow-up CDMs; stand-by status. |
| **LOW** | **$< -6.0$** | $< 1 	ext{ in } 1,000,000$ | Benign approach; automated archive (no burn). |

---

## 3. Base Paper, Literature Review & Competition

* **The Base Benchmark:** This work builds upon the **ESA Kelvins Collision Avoidance Challenge** conducted by the European Space Agency. The dataset contains thousands of real and simulated conjunction events across ESA operational satellites (Sentinel, CryoSat, Swarm) and tracking debris.

### Baseline Comparison:
| Method / Baseline | Core Mechanism | Critical Weakness / Flaw | Prahari Advantage |
| :--- | :--- | :--- | :--- |
| **Physics-Only (Foster 2D / Alfriend 3D)** | Calculates hard covariance overlap integral analytically. | Breaks down when covariance is non-Gaussian or atmospheric drag fluctuates. | **Combines covariance + kinematics + solar flux non-linearly.** |
| **Logistic Regression / Linear SOTA** | Linear decision boundary based on miss distance & velocity. | Cannot model non-linear interactions between 3D sigma matrices. | **Tree ensembles capture multidimensional feature interactions.** |
| **Uncalibrated Default ML Classifiers** | Default 0.5 classification threshold on raw data. | High False Negatives (misses 40-50% of real collisions). | **Calibrated -6.0 threshold gives 92.7% Recall on critical events.** |

---

## 4. Why XGBoost & How it Works (The Simple Dart Analogy)

**What is XGBoost?** XGBoost stands for *eXtreme Gradient Boosting*. It is an ensemble of decision trees that learn sequentially from each other's mistakes.

1. **Tree 1** looks at *Miss Distance* and predicts an initial risk score. Its prediction has some error (residual).
2. **Tree 2** is trained specifically to predict the *error made by Tree 1* using *Covariance Sigma R/T/N*.
3. **Tree 3** predicts the remaining residual error using *Solar Radio Flux (F10.7) and Time-to-TCA*.
4. The final risk score is the weighted sum of all trees, resulting in ultra-precise classification.

### Top Telemetry Predictive Features:
1. **Mahalanobis Distance:** Euclidean distance scaled by orbital position uncertainty bubbles (22.4% importance).
2. **Closest Miss Distance:** Minimum physical separation in meters (18.5% importance).
3. **Relative Encounter Speed:** Relative encounter velocity in m/s (14.2% importance).
4. **Time to TCA:** Days remaining until the encounter (11.8% importance).
5. **Positional Covariance Determinants:** Total 3D volume of uncertainty (16.5% combined importance).

---

## 5. System Architecture & Tech Stack

| Layer | Technologies | Key Role & Responsibility |
| :--- | :--- | :--- |
| **AI Engine** | XGBoost, Scikit-learn, Joblib | Loads 100-feature model; executes sub-2ms risk inference and SHAP importances. |
| **Backend API** | FastAPI, Uvicorn, Pandas, Python 3.10+ | Asynchronous REST API (`/api/events`, `/api/predict-cdm`, `/api/model-info`). |
| **Frontend UI** | React 18, Vite, TypeScript, TailwindCSS | Responsive glassmorphism dashboard, alert counters, interactive search & filter. |
| **3D Graphics** | Three.js, React-Three-Fiber, Drei, Leaflet | Full 3D orbital encounter scene with uncertainty ellipsoids and 2D ground track. |

---

## 6. Top 10 Viva & Interview Questions (Quick Revision Sheet)

* **Q1: What is TCA and why is it critical?**
  * **Ans:** TCA stands for **Time of Closest Approach**. It is the exact second when two orbital objects reach their minimum distance. Avoidance maneuvers must be planned 24-48 hours before TCA.
* **Q2: What is a CDM (Conjunction Data Message)?**
  * **Ans:** An international standard telemetry message (CCSDS standard) issued by space surveillance networks containing state vectors, velocities, and 3D uncertainty covariances ($\sigma_r, \sigma_t, \sigma_n$).
* **Q3: Why do we express collision risk in log10 format (e.g. -4.0)?**
  * **Ans:** Real collision probabilities are tiny fractions ($10^{-4}$ or $10^{-6}$). The $\log_{10}$ scale converts exponential fractions into a clean, human-readable operational scale ($-4.0 = 10^{-4}$).
* **Q4: Why prioritize Recall (92.7%) over Precision?**
  * **Ans:** In aerospace safety, a **False Negative (missed collision) is fatal**, while a False Positive only requires a routine check. High Recall guarantees no critical threats are missed.
* **Q5: Why choose XGBoost over Deep Neural Networks?**
  * **Ans:** CDMs are structured tabular telemetry with 100 heterogeneous numerical features and missing values. XGBoost natively handles NaNs, trains in seconds, runs inference in < 2ms, and outperforms deep neural networks on tabular datasets.
* **Q6: What is the Mahalanobis Distance?**
  * **Ans:** It measures the distance between two objects **scaled by their combined 3D covariance uncertainty bubbles**.
* **Q7: What is the Kessler Syndrome?**
  * **Ans:** A cascading collision chain reaction where orbital debris collisions create more debris, permanently destroying access to Low Earth Orbit.
* **Q8: How does Prahari handle multiple CDMs over time for a single event?**
  * **Ans:** Prahari tracks the chronological risk evolution across observations and evaluates the latest available telemetry state for accurate decision-making.
* **Q9: What happens when a user uploads a new custom CDM in the app?**
  * **Ans:** The backend evaluates the CSV with the 100-feature XGBoost model in < 10ms and returns the risk score, alert band, and top SHAP feature drivers.
* **Q10: What makes Prahari a standalone deployment?**
  * **Ans:** Prahari packages its pre-computed 2,167 event archive and ML model weights locally. Double-clicking `START.bat` launches everything without external cloud databases or internet requirements.
