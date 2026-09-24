import pptx
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
import os

prs = pptx.Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# Styling Constants
COLOR_BG       = RGBColor(255, 255, 255)
COLOR_TEXT     = RGBColor(30, 41, 59)     # Dark Slate #1e293b
COLOR_MUTED    = RGBColor(71, 85, 105)    # Slate #475569
COLOR_TITLE    = RGBColor(220, 38, 38)    # Bright Academic Red #dc2626
COLOR_SUBTITLE = RGBColor(14, 116, 144)   # Teal #0e7490
COLOR_TEAL     = RGBColor(15, 118, 110)   # Teal corner accent
COLOR_ORANGE   = RGBColor(234, 88, 12)    # Orange top-right corner
COLOR_BORDER   = RGBColor(100, 116, 139)

def draw_corner_accents(slide):
    # Top-right orange corner triangle
    tr = slide.shapes.add_shape(MSO_SHAPE.RIGHT_TRIANGLE, Inches(12.0), Inches(0), Inches(1.333), Inches(2.2))
    tr.fill.solid()
    tr.fill.fore_color.rgb = COLOR_ORANGE
    tr.line.fill.background()
    tr.rotation = 90

    # Bottom-left teal corner triangle
    bl = slide.shapes.add_shape(MSO_SHAPE.RIGHT_TRIANGLE, Inches(0), Inches(5.3), Inches(1.2), Inches(2.2))
    bl.fill.solid()
    bl.fill.fore_color.rgb = COLOR_TEAL
    bl.line.fill.background()
    bl.rotation = 270

    # Top-left KMIT / Institution Badge
    tb_logo = slide.shapes.add_textbox(Inches(0.4), Inches(0.3), Inches(2.0), Inches(0.6))
    p_l = tb_logo.text_frame.paragraphs[0]
    p_l.text = 'Kmit'
    p_l.font.name = 'Arial'
    p_l.font.size = Pt(18)
    p_l.font.bold = True
    p_l.font.color.rgb = RGBColor(15, 23, 42)

def add_slide_header(slide, title_text):
    draw_corner_accents(slide)
    
    tb = slide.shapes.add_textbox(Inches(1.2), Inches(0.3), Inches(10.5), Inches(0.8))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = title_text.upper()
    p.font.name = 'Arial'
    p.font.size = Pt(26)
    p.font.bold = True
    p.font.color.rgb = COLOR_TITLE

# -------------------------------------------------------------
# SLIDE 1: TITLE SLIDE
# -------------------------------------------------------------
s1 = prs.slides.add_slide(prs.slide_layouts[6])
draw_corner_accents(s1)

# Institution Heading
tb_inst = s1.shapes.add_textbox(Inches(1.5), Inches(1.2), Inches(10.33), Inches(1.2))
tf_inst = tb_inst.text_frame
tf_inst.word_wrap = True

p_i1 = tf_inst.paragraphs[0]
p_i1.text = 'KESHAV MEMORIAL INSTITUTE OF TECHNOLOGY'
p_i1.font.name = 'Arial'
p_i1.font.size = Pt(20)
p_i1.font.bold = True
p_i1.font.color.rgb = RGBColor(13, 148, 136) # Teal
p_i1.alignment = PP_ALIGN.CENTER

p_i2 = tf_inst.add_paragraph()
p_i2.text = "AN AUTONOMOUS INSTITUTION - ACCREDITED BY NAAC WITH 'A' GRADE\nNarayanaguda, Hyderabad."
p_i2.font.name = 'Arial'
p_i2.font.size = Pt(11)
p_i2.font.bold = True
p_i2.font.color.rgb = COLOR_MUTED
p_i2.alignment = PP_ALIGN.CENTER

# Project Title
tb_proj = s1.shapes.add_textbox(Inches(1.0), Inches(2.6), Inches(11.33), Inches(1.0))
tf_proj = tb_proj.text_frame
tf_proj.word_wrap = True

p_p = tf_proj.paragraphs[0]
p_p.text = 'G-1400 | PRAHARI: Autonomous Spacecraft Conjunction Assessment & High-Recall Collision Triage'
p_p.font.name = 'Arial'
p_p.font.size = Pt(16)
p_p.font.bold = True
p_p.font.color.rgb = RGBColor(2, 132, 199) # Blue
p_p.alignment = PP_ALIGN.CENTER

p_date = tf_proj.add_paragraph()
p_date.text = 'Date: 25-09-2026'
p_date.font.name = 'Arial'
p_date.font.size = Pt(13)
p_date.font.bold = True
p_date.font.color.rgb = RGBColor(14, 116, 144)
p_date.alignment = PP_ALIGN.CENTER
p_date.space_before = Pt(6)

# Team Box
box_team = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(2.2), Inches(4.2), Inches(4.3), Inches(2.6))
box_team.fill.solid()
box_team.fill.fore_color.rgb = COLOR_BG
box_team.line.color.rgb = COLOR_BORDER
tf_t = box_team.text_frame
tf_t.word_wrap = True

p_th = tf_t.paragraphs[0]
p_th.text = 'Team Members'
p_th.font.name = 'Arial'
p_th.font.size = Pt(13)
p_th.font.bold = True
p_th.font.underline = True
p_th.font.color.rgb = COLOR_TEXT
p_th.alignment = PP_ALIGN.CENTER

members = [
    '1. Akshay Bharadwaj',
    '2. Team Member 2',
    '3. Team Member 3',
    '4. Team Member 4',
    '5. Team Member 5'
]
for m in members:
    p_m = tf_t.add_paragraph()
    p_m.text = m
    p_m.font.name = 'Arial'
    p_m.font.size = Pt(11)
    p_m.font.color.rgb = COLOR_TEXT
    p_m.space_before = Pt(3)

# Mentors Box
box_men = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.8), Inches(4.2), Inches(4.3), Inches(2.6))
box_men.fill.solid()
box_men.fill.fore_color.rgb = COLOR_BG
box_men.line.color.rgb = COLOR_BORDER
tf_men = box_men.text_frame
tf_men.word_wrap = True

p_mh = tf_men.paragraphs[0]
p_mh.text = 'Mentors'
p_mh.font.name = 'Arial'
p_mh.font.size = Pt(13)
p_mh.font.bold = True
p_mh.font.underline = True
p_mh.font.color.rgb = COLOR_TEXT
p_mh.alignment = PP_ALIGN.CENTER

p_mn = tf_men.add_paragraph()
p_mn.text = 'Faculty Mentor / Project Guide'
p_mn.font.name = 'Arial'
p_mn.font.size = Pt(13)
p_mn.font.bold = True
p_mn.font.color.rgb = COLOR_TEXT
p_mn.alignment = PP_ALIGN.CENTER
p_mn.space_before = Pt(36)

# -------------------------------------------------------------
# SLIDE 2: CONTENTS
# -------------------------------------------------------------
s2 = prs.slides.add_slide(prs.slide_layouts[6])
add_slide_header(s2, 'CONTENTS')

tb_c = s2.shapes.add_textbox(Inches(1.5), Inches(1.3), Inches(10.0), Inches(5.8))
tf_c = tb_c.text_frame
contents = [
    '1. Title Slide',
    '2. Content',
    '3. Introduction',
    '4. Technology Used',
    '5. Base Paper / Research Reference',
    '6. Requirement',
    '7. Design (System Architecture)',
    '8. Telemetry & Feature Architecture',
    '9. Execution Flow & Class Diagram',
    '10. Development',
    '11. Project Outcome',
    '12. Conclusion',
    '13. Thank you!'
]
for idx, c in enumerate(contents):
    p = tf_c.paragraphs[0] if idx == 0 else tf_c.add_paragraph()
    p.text = c
    p.font.name = 'Arial'
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT
    p.space_before = Pt(4)

# -------------------------------------------------------------
# SLIDE 3: INTRODUCTION
# -------------------------------------------------------------
s3 = prs.slides.add_slide(prs.slide_layouts[6])
add_slide_header(s3, 'INTRODUCTION')

tb_intro = s3.shapes.add_textbox(Inches(1.2), Inches(1.3), Inches(11.0), Inches(5.8))
tf_in = tb_intro.text_frame
tf_in.word_wrap = True

def add_section(tf, heading, items, first=False):
    p_h = tf.paragraphs[0] if first else tf.add_paragraph()
    p_h.text = heading
    p_h.font.name = 'Arial'
    p_h.font.size = Pt(14)
    p_h.font.bold = True
    p_h.font.color.rgb = COLOR_TEXT
    if not first:
        p_h.space_before = Pt(8)
    for it in items:
        p = tf.add_paragraph()
        p.text = '•  ' + it
        p.font.name = 'Arial'
        p.font.size = Pt(11)
        p.font.color.rgb = COLOR_MUTED
        p.space_before = Pt(3)

add_section(tf_in, 'Problem', [
    'Over 36,000 tracked debris objects and mega-constellations create thousands of close orbital conjunctions weekly in Low Earth Orbit (LEO).',
    'Missing a real collision event (False Negative) leads to permanent spacecraft destruction and runaway orbital debris cascading (Kessler syndrome).',
    'Current manual screening of Conjunction Data Messages (CDMs) is time-consuming and vulnerable to human fatigue under high alert volumes.'
], first=True)

add_section(tf_in, 'Objective', [
    'Develop Prahari: an autonomous, high-recall spacecraft conjunction triage and decision-support system.',
    'Ingest standard multi-pass CDMs to predict collision probability log10(Pc) with high precision and actionable early warning.',
    'Eliminate false alarm floods and provide interactive 3D WebGL orbit visualization for flight safety operators.'
])

add_section(tf_in, 'Solution Impact', [
    'Achieves 92.70% High-Risk Recall (165/178 dangerous collisions detected at the official -6.0 alert threshold).',
    'Reduces false alarms by ~75% (79.71% precision, only 42 false alarms vs 85% in published literature).',
    'Provides 3 to 5 days of actionable lead time for Collision Avoidance Maneuver (CAM) thruster burn execution.',
    'Enables automated triage and real-time 3D orbital encounter screening.'
])

# -------------------------------------------------------------
# SLIDE 4: TECHNOLOGY USED
# -------------------------------------------------------------
s4 = prs.slides.add_slide(prs.slide_layouts[6])
add_slide_header(s4, 'TECHNOLOGY USED')

tb_tech = s4.shapes.add_textbox(Inches(1.2), Inches(1.3), Inches(11.0), Inches(5.8))
tf_tech = tb_tech.text_frame
tf_tech.word_wrap = True

add_section(tf_tech, 'Technology Used:', [
    'Frontend: React 18, TypeScript, Vite & Tailwind CSS',
    'Backend: FastAPI (Python 3.11) & Uvicorn ASGI Server',
    'Machine Learning: Extreme Gradient Boosting (XGBoost) Regressor',
    '3D Graphics: Three.js, WebGL & Canvas (Orbital Encounter Scene)',
    'Charts & State: Recharts & TanStack React Query',
    'Optimization: Asymmetric Sample Weighting (w=30.0 for High-Risk Recall Focus)',
    'Data Imputation: Pre-Computed Median Matrix (100% Zero-Crash Reliability)',
    'Data: ESA Kelvins Spacecraft Collision Dataset & Space Surveillance Network CDMs',
    'Tools: Git, GitHub, REST APIs & Windows START.bat Launcher'
], first=True)

add_section(tf_tech, 'Base Paper :', [
    '\"Machine Learning Approaches for Spacecraft Collision Avoidance Challenge\"',
    'Authors: Kalyanaraman et al. (EPJ Web of Conferences, 2026) & Uriot et al. (ESA ACT, 2020)'
])

# -------------------------------------------------------------
# SLIDE 5: BASE PAPER / RESEARCH REFERENCE
# -------------------------------------------------------------
s5 = prs.slides.add_slide(prs.slide_layouts[6])
add_slide_header(s5, 'BASE PAPER / RESEARCH REFERENCE')

tb_bp = s5.shapes.add_textbox(Inches(1.2), Inches(1.2), Inches(11.0), Inches(1.8))
tf_bp = tb_bp.text_frame
tf_bp.word_wrap = True

p_bpt = tf_bp.paragraphs[0]
p_bpt.text = 'Paper Title:'
p_bpt.font.name = 'Arial'
p_bpt.font.size = Pt(13)
p_bpt.font.bold = True
p_bpt.font.color.rgb = COLOR_TEXT

p_bp1 = tf_bp.add_paragraph()
p_bp1.text = '\"Machine Learning Approaches for Spacecraft Collision Avoidance Challenge\"'
p_bp1.font.name = 'Arial'
p_bp1.font.size = Pt(12)
p_bp1.font.bold = True
p_bp1.font.color.rgb = COLOR_SUBTITLE

p_bp2 = tf_bp.add_paragraph()
p_bp2.text = 'Focus: Spacecraft Collision Risk Prediction, CDM Assessment & Orbit Uncertainty'
p_bp2.font.name = 'Arial'
p_bp2.font.size = Pt(11)
p_bp2.font.color.rgb = COLOR_MUTED

p_bp3 = tf_bp.add_paragraph()
p_bp3.text = 'Authors: Kalyanaraman et al. (2026) & Uriot et al. (ESA Advanced Concepts Team)'
p_bp3.font.name = 'Arial'
p_bp3.font.size = Pt(11)
p_bp3.font.color.rgb = COLOR_MUTED

# Two Boxes for Existing vs Gap
b_ex = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.2), Inches(3.1), Inches(5.3), Inches(3.9))
b_ex.fill.solid()
b_ex.fill.fore_color.rgb = COLOR_BG
b_ex.line.color.rgb = COLOR_BORDER
tf_ex = b_ex.text_frame
tf_ex.word_wrap = True

p = tf_ex.paragraphs[0]
p.text = 'Existing approach :'
p.font.name = 'Arial'
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_TEXT

ex_items = [
    'Static single-snapshot CDM evaluation',
    'Evaluated strictly at TCA (t = 0 hours)',
    'Standard binary classification with SMOTE',
    'Assumes equal cost between False Positives and False Negatives',
    'Black-box feature engineering with opaque synthetic indices'
]
for it in ex_items:
    p = tf_ex.add_paragraph()
    p.text = '•  ' + it
    p.font.name = 'Arial'
    p.font.size = Pt(11)
    p.font.color.rgb = COLOR_MUTED
    p.space_before = Pt(6)

b_gap = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.9), Inches(3.1), Inches(5.3), Inches(3.9))
b_gap.fill.solid()
b_gap.fill.fore_color.rgb = COLOR_BG
b_gap.line.color.rgb = COLOR_BORDER
tf_gap = b_gap.text_frame
tf_gap.word_wrap = True

p = tf_gap.paragraphs[0]
p.text = 'Research Gap :'
p.font.name = 'Arial'
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_TITLE

gap_items = [
    'Temporal Blindness: 0-hour lead time is useless for thruster burn prep -> Solved with 3-5 days lead time.',
    'False Alarm Flooding: 85% false alarm rate (15% precision) exhausts fuel -> Solved with 79.71% precision.',
    'Class Imbalance: 178 collisions vs 1,989 safe events -> Solved via 30x Asymmetric Weighting.',
    'High Recall Focus: Prioritizing recall (92.70%) to ensure spacecraft survival.',
    'Native Telemetry: Ingests 100 raw CDM features with 0 synthetic bloat.'
]
for it in gap_items:
    p = tf_gap.add_paragraph()
    p.text = '•  ' + it
    p.font.name = 'Arial'
    p.font.size = Pt(11)
    p.font.color.rgb = COLOR_MUTED
    p.space_before = Pt(6)

# -------------------------------------------------------------
# SLIDE 6: REQUIREMENT
# -------------------------------------------------------------
s6 = prs.slides.add_slide(prs.slide_layouts[6])
add_slide_header(s6, 'REQUIREMENT')

tb_req = s6.shapes.add_textbox(Inches(1.2), Inches(1.3), Inches(11.0), Inches(5.8))
tf_req = tb_req.text_frame
tf_req.word_wrap = True

add_section(tf_req, 'Product:', [
    'Prahari: Autonomous Spacecraft Conjunction Triage & Collision Avoidance Decision-Support System'
], first=True)

add_section(tf_req, 'Features:', [
    'Automated Multi-Pass CDM Ingestion & Telemetry Preprocessing',
    'High-Recall XGBoost Conjunction Risk Regression (log10 Pc prediction)',
    'Asymmetric Risk Thresholding calibrated at the official -6.0 alert boundary',
    'Real-time Multi-Tier Action Protocol (CRITICAL, HIGH, ELEVATED, LOW bands)',
    '100 Native Telemetry Directory (Kinematics, Covariance, Solar Weather, Tracking)',
    'Interactive 3D WebGL Orbit & Covariance Ellipsoid Encounter Visualizer',
    'Temporal Timeline Playback Scrubber for multi-day radar update evolution',
    'Model Lab with live threshold calibration slider and SHAP feature importance charts',
    'Drag-and-Drop Live Telemetry Prediction Sandbox for operational passes',
    'Automated Collision Avoidance Maneuver (CAM) alert and report generation'
])

# -------------------------------------------------------------
# SLIDE 7: DESIGN (SYSTEM ARCHITECTURE)
# -------------------------------------------------------------
s7 = prs.slides.add_slide(prs.slide_layouts[6])
add_slide_header(s7, 'DESIGN')

tb_des_title = s7.shapes.add_textbox(Inches(1.2), Inches(1.1), Inches(11.0), Inches(0.5))
p = tb_des_title.text_frame.paragraphs[0]
p.text = 'Prahari - System Design Architecture'
p.font.name = 'Arial'
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = COLOR_TEXT

arch_boxes = [
    ('1. Input Data Stream', Inches(1.2), Inches(1.8), Inches(2.5), Inches(5.0), COLOR_SUBTITLE, [
        'Space Surveillance Network (SSN)',
        'ESA Kelvins Portal',
        'CCSDS Standard CDMs',
        'Multi-Pass Observation Arc',
        'Solar Weather Feeds (F10, AP)'
    ]),
    ('2. Telemetry Processing', Inches(4.0), Inches(1.8), Inches(2.5), Inches(5.0), RGBColor(168, 85, 247), [
        '100 Raw Feature Extractor',
        'Kinematics (20 cols)',
        'Covariances (36 cols)',
        'Solar Drag (4 cols)',
        'Tracking Residuals (40 cols)',
        'Median Imputation Matrix'
    ]),
    ('3. High-Recall AI Core', Inches(6.8), Inches(1.8), Inches(2.5), Inches(5.0), COLOR_TITLE, [
        'XGBoost Regressor',
        'Asymmetric Loss (w=30x)',
        'Continuous log10(Pc) Output',
        'Threshold Filter (tau = -6.0)',
        '92.70% High-Risk Recall',
        '89.77% Safety F2 Score'
    ]),
    ('4. Mission Control UI', Inches(9.6), Inches(1.8), Inches(2.5), Inches(5.0), COLOR_TEAL, [
        'React 18 + Vite Frontend',
        'Three.js 3D Orbit Scene',
        'Timeline Playback Scrubber',
        'Model Lab Calibration',
        'Instant CSV Predictor',
        'CAM Action Protocol'
    ]),
]

for title, left, top, width, height, color, items in arch_boxes:
    box = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    box.fill.solid()
    box.fill.fore_color.rgb = COLOR_BG
    box.line.color.rgb = color
    box.line.width = Pt(2)
    tf = box.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = 'Arial'
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = color
    
    for item in items:
        p_i = tf.add_paragraph()
        p_i.text = '•  ' + item
        p_i.font.name = 'Arial'
        p_i.font.size = Pt(10)
        p_i.font.color.rgb = COLOR_TEXT
        p_i.space_before = Pt(6)

# -------------------------------------------------------------
# SLIDE 8: TELEMETRY & FEATURE ARCHITECTURE
# -------------------------------------------------------------
s8 = prs.slides.add_slide(prs.slide_layouts[6])
add_slide_header(s8, 'TELEMETRY & FEATURE ARCHITECTURE')

tb_feat_title = s8.shapes.add_textbox(Inches(1.2), Inches(1.1), Inches(11.0), Inches(0.5))
p = tb_feat_title.text_frame.paragraphs[0]
p.text = '100 Native Telemetry Parameters (Zero Synthetic Bloat)'
p.font.name = 'Arial'
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = COLOR_TEXT

feat_cards = [
    ('1. Orbital Kinematics (20 Features)', Inches(1.2), Inches(1.7), Inches(5.3), Inches(2.5), COLOR_SUBTITLE,
     'Captures 3D spatial clearance, relative closing speed, RTN vectors, Keplerian semi-major axes, eccentricities, inclinations, and Mahalanobis statistical distance.'),
    ('2. Covariance Dispersion (36 Features)', Inches(6.9), Inches(1.7), Inches(5.3), Inches(2.5), COLOR_TEAL,
     'Encapsulates full 3D position and velocity 1-sigma error dispersions, 3x3 covariance matrix determinants (uncertainty volumes in m^6), and 18 RTN cross-correlation terms.'),
    ('3. Solar & Space Weather (4 Features)', Inches(1.2), Inches(4.4), Inches(5.3), Inches(2.5), RGBColor(217, 119, 6),
     'Includes daily 10.7 cm solar flux (F10), 81-day centered flux (F3M), sunspot number (SSN), and geomagnetic index (AP) driving atmospheric drag density in LEO.'),
    ('4. Tracking Observables (40 Features)', Inches(6.9), Inches(4.4), Inches(5.3), Inches(2.5), RGBColor(147, 51, 234),
     'Contains radar pass counts (available vs. used), weighted RMS orbit fit residuals, radar cross section (RCS), ballistic area-to-mass ratios, and theoretical maximum risk bounds.')
]

for title, left, top, width, height, color, desc in feat_cards:
    box = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    box.fill.solid()
    box.fill.fore_color.rgb = COLOR_BG
    box.line.color.rgb = color
    box.line.width = Pt(1.5)
    tf = box.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = 'Arial'
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = color
    
    p_d = tf.add_paragraph()
    p_d.text = desc
    p_d.font.name = 'Arial'
    p_d.font.size = Pt(11)
    p_d.font.color.rgb = COLOR_TEXT
    p_d.space_before = Pt(8)

# -------------------------------------------------------------
# SLIDE 9: CLASS & COMPONENT ARCHITECTURE
# -------------------------------------------------------------
s9 = prs.slides.add_slide(prs.slide_layouts[6])
add_slide_header(s9, 'CLASS & COMPONENT ARCHITECTURE')

class_boxes = [
    ('FastAPI Application (main.py)', Inches(1.2), Inches(1.5), Inches(5.3), Inches(2.6), COLOR_SUBTITLE, [
        '+ get_events(critical_only: bool)',
        '+ get_event_details(event_id: str)',
        '+ predict_cdm(file: UploadFile)',
        '+ get_model_info(): Dict[str, Any]',
        '+ health_check(): Dict[str, str]'
    ]),
    ('PredictionService (prediction_service.py)', Inches(6.9), Inches(1.5), Inches(5.3), Inches(2.6), COLOR_TITLE, [
        '+ model: XGBRegressor',
        '+ feature_cols: List[str] (100 cols)',
        '+ medians: Dict[str, float]',
        '+ predict_event(cdm_rows, threshold)',
        '+ load_model(): bool'
    ]),
    ('DatasetService (dataset_service.py)', Inches(1.2), Inches(4.3), Inches(5.3), Inches(2.6), COLOR_TEAL, [
        '+ df: DataFrame',
        '+ events_cache: List[Dict]',
        '+ load_dataset(): void',
        '+ get_events(): List[Dict]',
        '+ get_event_details(id): Dict'
    ]),
    ('Mission Control UI (React + Three.js)', Inches(6.9), Inches(4.3), Inches(5.3), Inches(2.6), RGBColor(147, 51, 234), [
        '+ EncounterScene.tsx (3D WebGL Orbit Scene)',
        '+ ModelLabPage.tsx (Threshold Slider & SHAP)',
        '+ OverviewPage.tsx (Live CDM Dashboard)',
        '+ PredictionPage.tsx (CSV Upload Module)'
    ])
]

for title, left, top, width, height, color, items in class_boxes:
    box = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    box.fill.solid()
    box.fill.fore_color.rgb = COLOR_BG
    box.line.color.rgb = color
    box.line.width = Pt(1.5)
    tf = box.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = 'Arial'
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = color
    
    for item in items:
        p_i = tf.add_paragraph()
        p_i.text = item
        p_i.font.name = 'Arial'
        p_i.font.size = Pt(10)
        p_i.font.color.rgb = COLOR_TEXT
        p_i.space_before = Pt(4)

# -------------------------------------------------------------
# SLIDE 10: DEVELOPMENT
# -------------------------------------------------------------
s10 = prs.slides.add_slide(prs.slide_layouts[6])
add_slide_header(s10, 'DEVELOPMENT')

tb_dev = s10.shapes.add_textbox(Inches(1.2), Inches(1.3), Inches(11.0), Inches(5.8))
tf_dev = tb_dev.text_frame
tf_dev.word_wrap = True

add_section(tf_dev, 'Development Steps:', [
    'Extracted and audited 100 native telemetry parameters across 162,634 observation rows.',
    'Engineered asymmetric sample weighting protocol (w = 30.0 for high risk) to prioritize recall.',
    'Trained regularized XGBoost Regressor with histogram binning and pre-computed median imputation.',
    'Evaluated performance on 2,167 completely held-out test events at the standard -6.0 threshold.',
    'Built asynchronous FastAPI backend serving sub-50ms real-time inference and metadata endpoints.',
    'Developed React 18 + Vite frontend with Three.js 3D WebGL orbital encounter scene and timeline scrubber.',
    'Created interactive Model Lab with dynamic threshold slider, 100-feature directory, and SHAP charts.',
    'Authored publication-ready academic research paper (.docx) and 16:9 presentation deck (.pptx).'
], first=True)

add_section(tf_dev, 'Tools Used:', [
    'React, TypeScript & Vite',
    'Tailwind CSS & Lucide Icons',
    'Python 3.11, FastAPI & Uvicorn',
    'XGBoost, Scikit-learn, Pandas & Joblib',
    'Three.js & WebGL Canvas Renderer',
    'Git & GitHub'
])

# -------------------------------------------------------------
# SLIDE 11: PROJECT OUTCOME
# -------------------------------------------------------------
s11 = prs.slides.add_slide(prs.slide_layouts[6])
add_slide_header(s11, 'PROJECT OUTCOME')

tb_out = s11.shapes.add_textbox(Inches(1.2), Inches(1.3), Inches(11.0), Inches(5.8))
tf_out = tb_out.text_frame
tf_out.word_wrap = True

add_section(tf_out, 'Achievements', [
    'High-Risk Recall: 92.70% (165 of 178 dangerous collisions detected ahead of time).',
    'Safety F2 Score: 89.77% (Recall weighted 2x to prioritize mission survival).',
    'Precision: 79.71% (Only 42 false alarms across 1,989 safe events, eliminating the 85% false alarm flood).',
    'Overall Accuracy: 97.46% (2,112 out of 2,167 events correctly classified).',
    '100% Native Telemetry: Ingests raw CDMs directly without artificial synthetic features.',
    'Actionable Lead Time: 3 to 5 days pre-TCA for Collision Avoidance Maneuver (CAM) execution.'
], first=True)

add_section(tf_out, 'Current Challenges', [
    'Sparse ground radar coverage causes intermittent tracking gaps in higher orbital inclinations.',
    'Solar storm geomagnetic surges temporarily inflate atmospheric drag covariance errors.'
])

add_section(tf_out, 'Future Improvements', [
    'Autonomous CAM Delta-V burn calculation using Reinforcement Learning.',
    'Live Space-Track / ESA API integration for continuous automatic ingest.',
    'Constellation multi-satellite screening to avoid secondary induced conjunctions.'
])

add_section(tf_out, 'Paper:', [
    'Status: Research paper is complete and formatted for journal submission at docs/Prahari_Research_Paper.docx.'
])

# -------------------------------------------------------------
# SLIDE 12: CONCLUSION
# -------------------------------------------------------------
s12 = prs.slides.add_slide(prs.slide_layouts[6])
add_slide_header(s12, 'CONCLUSION')

tb_con = s12.shapes.add_textbox(Inches(1.2), Inches(1.3), Inches(11.0), Inches(5.8))
tf_con = tb_con.text_frame
tf_con.word_wrap = True

add_section(tf_con, 'Key Takeaways', [
    'Prahari transforms multi-pass raw CDM telemetry into high-recall, actionable collision warnings.',
    'Asymmetric loss optimization successfully solves the class imbalance and catches 92.70% of collisions.',
    'Eliminates the temporal blindness (TCA=0h) and 85% false alarm rate of published literature.',
    'Interactive 3D Three.js mission control bridges machine learning with operational flight dynamics.'
], first=True)

add_section(tf_con, 'New Skills Learned', [
    'Space Situational Awareness (SSA) & Astrodynamic Conjunction Assessment',
    'Asymmetric Loss Formulation for Extreme Class Imbalance in Space Systems',
    'High-Dimensional Telemetry Engineering on 100 Native Parameters',
    'Full-Stack Modern Web Development (React 18, TypeScript, Vite, Tailwind CSS)',
    '3D Orbital Graphics & Covariance Ellipsoid Rendering (Three.js & WebGL)',
    'High-Performance Asynchronous Microservices (FastAPI & Uvicorn)',
    'Academic Research Paper Authoring & Rigorous Empirical Benchmarking'
])

# -------------------------------------------------------------
# SLIDE 13: THANK YOU!
# -------------------------------------------------------------
s13 = prs.slides.add_slide(prs.slide_layouts[6])
draw_corner_accents(s13)

tb_ty = s13.shapes.add_textbox(Inches(2.0), Inches(2.8), Inches(9.33), Inches(2.0))
tf_ty = tb_ty.text_frame
p_ty = tf_ty.paragraphs[0]
p_ty.text = 'Thank you!'
p_ty.font.name = 'Arial'
p_ty.font.size = Pt(48)
p_ty.font.bold = True
p_ty.font.color.rgb = COLOR_TEXT
p_ty.alignment = PP_ALIGN.CENTER

p_ty_sub = tf_ty.add_paragraph()
p_ty_sub.text = 'Questions & Discussion\n\nPRAHARI: Autonomous Spacecraft Conjunction Triage Platform\nhttps://github.com/akshaybharadwaj45/prahari'
p_ty_sub.font.name = 'Arial'
p_ty_sub.font.size = Pt(14)
p_ty_sub.font.color.rgb = COLOR_MUTED
p_ty_sub.alignment = PP_ALIGN.CENTER
p_ty_sub.space_before = Pt(16)

# Save presentation
output_dir = r'C:\Users\Akshay baradwaj\Desktop\prahari-google\prahari-standalone\docs'
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, 'Prahari_Presentation.pptx')
prs.save(output_path)
print(f'Successfully generated 13-slide presentation matching exact sample format at {output_path}')
