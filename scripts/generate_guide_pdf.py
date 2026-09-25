import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable, PageBreak
)
from reportlab.pdfgen import canvas

# Define paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
STANDALONE_DIR = os.path.dirname(SCRIPT_DIR)
DOCS_DIR = os.path.join(STANDALONE_DIR, 'docs')
os.makedirs(DOCS_DIR, exist_ok=True)
PDF_PATH = os.path.join(DOCS_DIR, 'Prahari_Project_Guide.pdf')
MD_PATH = os.path.join(DOCS_DIR, 'PRAHARI_PROJECT_GUIDE.md')

# Numbered Canvas for Two-Pass Page Count
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 755, "PRAHARI (प्रहारी) — Project & Research Study Guide")
            self.drawRightString(612 - 54, 755, "Orbital Conjunction Risk Assessment")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 748, 612 - 54, 748)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 45, 612 - 54, 45)
        self.setFont("Helvetica", 8)
        self.drawString(54, 32, "Confidential & Academic Use | Prahari Space Triage Engine")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 54, 32, page_str)
        self.restoreState()


def build_pdf():
    doc = SimpleDocTemplate(
        PDF_PATH,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        alignment=0,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        fontName='Helvetica',
        fontSize=10.5,
        leading=15,
        textColor=colors.HexColor('#475569'),
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0369a1'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#334155'),
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=4
    )

    q_style = ParagraphStyle(
        'Q_Style',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )

    a_style = ParagraphStyle(
        'A_Style',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155'),
        leftIndent=8,
        spaceAfter=6
    )

    callout_style = ParagraphStyle(
        'Callout_Text',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#0f172a')
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=0
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor('#1e293b')
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor('#0f172a')
    )

    story = []

    # Title & Metadata Banner
    story.append(Paragraph("PROJECT PRAHARI (प्रहारी)", title_style))
    story.append(Paragraph("<b>AI-Powered Satellite Collision Assessment & Autonomous Risk Triage</b><br/>Comprehensive Project Handbook, Literature Review & Viva Cheat Sheet", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=10))

    # SECTION 1: THE CORE PROBLEM IN SIMPLE WORDS
    story.append(Paragraph("1. The Core Problem in Space (Why this Project Exists)", h1_style))
    
    p1 = ("<b>The Space Traffic Crisis:</b> Over 36,000 trackable orbital debris fragments (>10 cm) and 10,000+ active satellites orbit Earth in Low Earth Orbit (LEO) at hypervelocity speeds exceeding <b>7.8 km/s (28,000 km/h)</b>. "
          "At this velocity, even a 1-centimeter paint fleck or screw possesses the kinetic explosive force of a hand grenade.")
    story.append(Paragraph(p1, body_style))

    p2 = ("<b>What is a Conjunction & CDM?</b> Whenever radar/telescope tracking networks (e.g. US Space Surveillance Network / ESA) detect two objects approaching within a safety sphere, they issue a standardized telemetry report called a <b>CDM (Conjunction Data Message)</b>. "
          "A CDM contains positions, velocities, 3D covariance uncertainty matrices, and estimated miss distances.")
    story.append(Paragraph(p2, body_style))

    p3 = ("<b>The Human Bottleneck:</b> Satellite operators receive <b>100,000+ CDMs every single day</b>. Over 99.9% are benign false alarms due to sensor noise. However, human orbital engineers spend days manually running orbit propagators. "
          "If a high-risk collision isn't identified 24 to 72 hours before closest approach, there is no time left to calculate and fire satellite avoidance thrusters.")
    story.append(Paragraph(p3, body_style))

    # SECTION 2: WHAT PRAHARI DOES
    story.append(Paragraph("2. What Project Prahari Does", h1_style))
    p_pra = ("Prahari is an autonomous end-to-end mission-control triage platform. Instead of days of human review, Prahari uses an <b>optimized 100-feature XGBoost ML engine</b> that inspects incoming CDMs in milliseconds, classifies the true collision risk, assigns actionable risk bands, and provides 3D visual encounter reconstructions.")
    story.append(Paragraph(p_pra, body_style))

    # Alert Bands Table
    band_data = [
        [Paragraph("Alert Band", table_header_style), Paragraph("Log10 Risk Threshold", table_header_style), Paragraph("Probability", table_header_style), Paragraph("Operational Action Required", table_header_style)],
        [Paragraph("<b>CRITICAL</b>", table_cell_bold), Paragraph("<b>≥ -4.0</b>", table_cell_style), Paragraph("≥ 1 in 10,000", table_cell_style), Paragraph("Immediate Thruster Maneuver (CAM) mandatory.", table_cell_style)],
        [Paragraph("<b>HIGH</b>", table_cell_bold), Paragraph("<b>-5.0 to -4.0</b>", table_cell_style), Paragraph("1 in 10k to 1 in 100k", table_cell_style), Paragraph("Task radar tracking; compute avoidance burns.", table_cell_style)],
        [Paragraph("<b>ELEVATED</b>", table_cell_bold), Paragraph("<b>-6.0 to -5.0</b>", table_cell_style), Paragraph("1 in 100k to 1 in 1M", table_cell_style), Paragraph("Monitor follow-up CDMs; stand-by status.", table_cell_style)],
        [Paragraph("<b>LOW</b>", table_cell_bold), Paragraph("<b>< -6.0</b>", table_cell_style), Paragraph("< 1 in 1,000,000", table_cell_style), Paragraph("Benign approach; automated archive (no burn).", table_cell_style)],
    ]
    t_band = Table(band_data, colWidths=[75, 110, 110, 209])
    t_band.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
    ]))
    story.append(t_band)
    story.append(Spacer(1, 8))

    # SECTION 3: BASE PAPER & LITERATURE REVIEW
    story.append(Paragraph("3. Base Paper, Literature Review & Competition", h1_style))
    p_base = ("<b>The Base Benchmark:</b> This work builds upon the <b>ESA Kelvins Collision Avoidance Challenge</b> conducted by the European Space Agency. "
              "The dataset contains thousands of real and simulated conjunction events across ESA operational satellites (Sentinel, CryoSat, Swarm) and tracking debris.")
    story.append(Paragraph(p_base, body_style))

    # Comparison Table
    comp_data = [
        [Paragraph("Method / Baseline", table_header_style), Paragraph("Core Mechanism", table_header_style), Paragraph("Critical Weakness / Flaw", table_header_style), Paragraph("Prahari Advantage", table_header_style)],
        [
            Paragraph("<b>Physics-Only (Foster 2D / Alfriend 3D)</b>", table_cell_bold),
            Paragraph("Calculates hard covariance overlap integral analytically.", table_cell_style),
            Paragraph("Breaks down when covariance is non-Gaussian or atmospheric drag fluctuates.", table_cell_style),
            Paragraph("<b>Combines covariance + kinematics + solar flux non-linearly.</b>", table_cell_style)
        ],
        [
            Paragraph("<b>Logistic Regression / Linear SOTA</b>", table_cell_bold),
            Paragraph("Linear boundary based on miss distance & velocity.", table_cell_style),
            Paragraph("Cannot model non-linear interactions between 3D sigma matrices.", table_cell_style),
            Paragraph("<b>Tree ensembles capture multidimensional feature interactions.</b>", table_cell_style)
        ],
        [
            Paragraph("<b>Uncalibrated Default ML Classifiers</b>", table_cell_bold),
            Paragraph("Default 0.5 classification threshold on raw data.", table_cell_style),
            Paragraph("High False Negatives (misses 40-50% of real collisions).", table_cell_style),
            Paragraph("<b>Calibrated -6.0 threshold gives 92.7% Recall on critical events.</b>", table_cell_style)
        ],
    ]
    t_comp = Table(comp_data, colWidths=[110, 115, 135, 144])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0369a1')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 8))

    # SECTION 4: HOW XGBOOST WORKS (SIMPLE EXPLANATION)
    story.append(Paragraph("4. Why XGBoost & How it Works (The Simple Dart Analogy)", h1_style))
    story.append(Paragraph("<b>What is XGBoost?</b> XGBoost stands for <i>eXtreme Gradient Boosting</i>. It is an ensemble of decision trees that learn sequentially from each other's mistakes.", body_style))
    
    story.append(Paragraph("• <b>The Sequential Correction Process:</b>", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;1. <b>Tree 1</b> looks at <i>Miss Distance</i> and predicts an initial risk score. Its prediction is slightly off (it has a 'residual error').", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;2. <b>Tree 2</b> is trained specifically to predict the <i>error made by Tree 1</i> using <i>Covariance Sigma R/T/N</i>.", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;3. <b>Tree 3</b> predicts the remaining residual error using <i>Solar Radio Flux (F10.7) and Time-to-TCA</i>.", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;4. The final risk score is the weighted sum of all trees, resulting in ultra-precise classification.", bullet_style))

    story.append(Paragraph("• <b>Top 5 Predictive Features in Telemetry:</b>", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;1. <b>Mahalanobis Distance:</b> Euclidean distance scaled by orbital position uncertainty bubbles (22.4% importance).", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;2. <b>Closest Miss Distance:</b> Minimum physical separation in meters (18.5% importance).", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;3. <b>Relative Encounter Speed:</b> Relative encounter velocity in m/s (14.2% importance).", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;4. <b>Time to TCA (Time to Closest Approach):</b> Days remaining until the encounter (11.8% importance).", bullet_style))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;5. <b>Positional Covariance Determinants (Det C):</b> Total 3D volume of uncertainty (16.5% combined importance).", bullet_style))

    # SECTION 5: PROJECT ARCHITECTURE
    story.append(Paragraph("5. System Architecture & Tech Stack", h1_style))
    
    arch_data = [
        [Paragraph("Layer", table_header_style), Paragraph("Technologies", table_header_style), Paragraph("Key Role & Responsibility", table_header_style)],
        [Paragraph("<b>AI Engine</b>", table_cell_bold), Paragraph("XGBoost, Scikit-learn, Joblib", table_cell_style), Paragraph("Loads 100-feature model; executes sub-2ms risk inference and SHAP importances.", table_cell_style)],
        [Paragraph("<b>Backend API</b>", table_cell_bold), Paragraph("FastAPI, Uvicorn, Pandas, Python 3.10+", table_cell_style), Paragraph("Asynchronous REST API (`/api/events`, `/api/predict-cdm`, `/api/model-info`).", table_cell_style)],
        [Paragraph("<b>Frontend UI</b>", table_cell_bold), Paragraph("React 18, Vite, TypeScript, TailwindCSS", table_cell_style), Paragraph("Responsive glassmorphism dashboard, alert counters, interactive search & filter.", table_cell_style)],
        [Paragraph("<b>3D Graphics</b>", table_cell_bold), Paragraph("Three.js, React-Three-Fiber, Drei, Leaflet", table_cell_style), Paragraph("Full 3D orbital encounter scene with uncertainty ellipsoids and 2D ground track.", table_cell_style)],
    ]
    t_arch = Table(arch_data, colWidths=[90, 160, 254])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 8))

    # SECTION 6: TOP 10 VIVA / PRESENTATION QUESTIONS
    story.append(Paragraph("6. Top 10 Viva & Interview Questions (Quick Revision Sheet)", h1_style))

    qas = [
        ("Q1: What is TCA and why is it critical?",
         "<b>Answer:</b> TCA stands for <b>Time of Closest Approach</b>. It is the exact second when two orbital objects reach their minimum distance. Collision Avoidance Maneuvers (CAM) must be executed at least 24-48 hours before TCA to save fuel and ensure trajectory clearance."),
        
        ("Q2: What is a CDM (Conjunction Data Message)?",
         "<b>Answer:</b> A CDM is an international standard telemetry message (CCSDS standard) published by space surveillance tracking networks containing orbital state vectors, velocities, and 3D uncertainty covariances ($\sigma_r, \sigma_t, \sigma_n$) for two approaching objects."),

        ("Q3: Why do we express collision risk in log10 format (e.g. -4.0)?",
         "<b>Answer:</b> Collision probabilities in space are tiny numbers like $0.0001$ ($10^{-4}$) or $0.000001$ ($10^{-6}$). Expressing them as $\\log_{10}(\\text{Risk})$ converts these exponential fractions into a clear, linear operational scale ($-4.0 = 10^{-4}$, $-6.0 = 10^{-6}$)."),

        ("Q4: Why prioritize Recall (92.7%) over Precision?",
         "<b>Answer:</b> In aerospace safety, a <b>False Negative (missed collision) is catastrophic</b> (satellite destruction and Kessler cascade). A False Positive only causes an engineer to inspect the data. High Recall guarantees almost zero true collision threats slip through."),

        ("Q5: Why choose XGBoost over Deep Neural Networks for this task?",
         "<b>Answer:</b> CDMs are tabular telemetry data with 100 heterogeneous numerical features and missing tracking data (NaNs). XGBoost natively handles missing values, trains in seconds, runs inference in < 2ms, and outperforms deep neural networks on tabular datasets."),

        ("Q6: What is the Mahalanobis Distance?",
         "<b>Answer:</b> It measures the distance between two objects <b>scaled by their combined 3D covariance uncertainty bubbles</b>. A 500m miss distance inside a 2,000m uncertainty bubble is dangerous, whereas a 500m miss with a 10m uncertainty bubble is safe."),

        ("Q7: What is the Kessler Syndrome?",
         "<b>Answer:</b> A cascading collision scenario where debris collisions create more debris, triggering a chain reaction that could render Low Earth Orbit unusable for communications, navigation, and science for centuries."),

        ("Q8: How does Prahari handle multiple CDMs over time for a single event?",
         "<b>Answer:</b> As ground radars make newer observations closer to TCA, multiple CDMs are received. Prahari tracks the chronological risk evolution and evaluates the latest available telemetry state for accurate decision-making."),

        ("Q9: What happens when a user uploads a new custom CDM in the app?",
         "<b>Answer:</b> The frontend sends the CSV to `/api/predict-cdm`. The FastAPI backend feeds the telemetry into the 100-feature XGBoost model and returns the predicted risk, alert band (CRITICAL/HIGH/LOW), and top SHAP feature drivers in < 10ms."),

        ("Q10: What makes Prahari a standalone deployment?",
         "<b>Answer:</b> Prahari packages its pre-computed 2,167 event archive and ML model weights locally. Double-clicking `START.bat` checks dependencies and launches both backend and frontend without external cloud databases or internet requirements.")
    ]

    for q, a in qas:
        story.append(Paragraph(q, q_style))
        story.append(Paragraph(a, a_style))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {PDF_PATH}")


def build_markdown():
    md_content = """# PROJECT PRAHARI (प्रहारी)
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
| **CRITICAL** | **$\ge -4.0$** | $\ge 1 \text{ in } 10,000$ | Immediate Thruster Maneuver (CAM) mandatory. |
| **HIGH** | **$-5.0 \text{ to } -4.0$** | $1 \text{ in } 10\text{k to } 100\text{k}$ | Task radar tracking; compute avoidance burns. |
| **ELEVATED** | **$-6.0 \text{ to } -5.0$** | $1 \text{ in } 100\text{k to } 1\text{M}$ | Monitor follow-up CDMs; stand-by status. |
| **LOW** | **$< -6.0$** | $< 1 \text{ in } 1,000,000$ | Benign approach; automated archive (no burn). |

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
"""
    with open(MD_PATH, 'w', encoding='utf-8') as f:
        f.write(md_content)
    print(f"Markdown guide successfully written to: {MD_PATH}")


if __name__ == '__main__':
    build_pdf()
    build_markdown()
