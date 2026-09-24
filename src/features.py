"""
Prahari Standalone: Core Astrodynamic & Temporal Feature Extractor
------------------------------------------------------------------
Extracts exactly 9 clean, intuitive, physical features with strict zero-leakage protocol.
"""

import numpy as np
import pandas as pd

FEATURE_NAMES = [
    'miss_distance',
    'relative_speed',
    'time_to_tca',
    'sigma_3d',
    'miss_to_sigma_ratio',
    'kinetic_energy',
    'hist_mean_risk',
    'risk_slope',
    'n_cdms'
]

def extract_features_from_event(event_cdms: pd.DataFrame) -> dict:
    """
    Extracts 9 physical features from a series of CDMs for an encounter event.
    Historical risk metrics strictly isolate prior updates (0 to N-2) to prevent target leakage.
    """
    g = event_cdms.sort_values('time_to_tca', ascending=False).copy()
    n = len(g)
    last_row = g.iloc[-1]
    
    # 1. Kinematics
    miss_dist = float(last_row.get('miss_distance', 1000.0))
    rel_speed = float(last_row.get('relative_speed', 10000.0))
    time_tca  = float(last_row.get('time_to_tca', 2.0))
    
    # 2. 3D Positional Uncertainty (Radial, Transverse, Normal)
    sig_r = float(np.sqrt(last_row.get('t_sigma_r', 0.0)**2 + last_row.get('c_sigma_r', 0.0)**2) if 't_sigma_r' in last_row else 10.0)
    sig_t = float(np.sqrt(last_row.get('t_sigma_t', 0.0)**2 + last_row.get('c_sigma_t', 0.0)**2) if 't_sigma_t' in last_row else 50.0)
    sig_n = float(np.sqrt(last_row.get('t_sigma_n', 0.0)**2 + last_row.get('c_sigma_n', 0.0)**2) if 't_sigma_n' in last_row else 10.0)
    sigma_3d = float(np.sqrt(sig_r**2 + sig_t**2 + sig_n**2) + 1e-6)
    
    # 3. Dimensionless Overlap & Kinetic Energy
    miss_to_sigma  = float(miss_dist / sigma_3d)
    kinetic_energy = float(0.5 * (rel_speed ** 2))
    
    # 4. Zero-Leakage Historical Risk Evolution
    history = g.iloc[:-1] if n > 1 else pd.DataFrame(columns=g.columns)
    if len(history) > 0 and 'risk' in history.columns:
        risks = pd.to_numeric(history['risk'], errors='coerce').dropna().values
        times = pd.to_numeric(history['time_to_tca'], errors='coerce').dropna().values
        hist_mean_risk = float(risks.mean()) if len(risks) > 0 else -10.0
        if len(risks) > 1:
            dt = abs(times[0] - times[-1]) + 1e-4
            risk_slope = float((risks[-1] - risks[0]) / dt)
        else:
            risk_slope = 0.0
    else:
        hist_mean_risk = -10.0
        risk_slope     = 0.0
        
    return {
        'miss_distance': miss_dist,
        'relative_speed': rel_speed,
        'time_to_tca': time_tca,
        'sigma_3d': sigma_3d,
        'miss_to_sigma_ratio': miss_to_sigma,
        'kinetic_energy': kinetic_energy,
        'hist_mean_risk': hist_mean_risk,
        'risk_slope': risk_slope,
        'n_cdms': n
    }

def process_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Processes entire DataFrame into an event feature matrix and target series."""
    grouped = df.groupby('event_id')
    rows, targets, event_ids = [], [], []
    
    for event_id, group in grouped:
        rows.append(extract_features_from_event(group))
        final_row = group.sort_values('time_to_tca', ascending=True).iloc[0]
        final_risk = float(pd.to_numeric(final_row.get('risk', np.nan), errors='coerce'))
        targets.append(final_risk)
        event_ids.append(event_id)
        
    X = pd.DataFrame(rows, index=event_ids)[FEATURE_NAMES]
    y = pd.Series(targets, index=event_ids, name='target_risk')
    return X, y
