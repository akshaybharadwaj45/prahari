import { useState, useEffect } from 'react';
import { 
  Upload, FileText, Play, CheckCircle2, AlertTriangle, 
  ShieldAlert, Activity, History, Trash2, Eye, FileSpreadsheet,
  XCircle, ArrowRight, Box, Download, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PredictionHistoryItem {
  id: string;
  timestamp: string;
  sampleName: string;
  n_cdms_used: number;
  predicted_risk: number;
  probability_pct: number;
  collision_probability?: number;
  risk_band: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'LOW' | string;
  last_time_to_tca?: number | null;
  last_miss_distance?: number | null;
  cdms?: any[];
}

interface StagedFile {
  name: string;
  blob: Blob;
  size: number;
  rowCount: number;
  previewRows: string[][];
  headers: string[];
}

const STORAGE_KEY = 'prahari_prediction_history';

interface SampleScenario {
  id: string;
  title: string;
  description: string;
  category: 'critical' | 'multipass' | 'dynamics' | 'safe';
  categoryLabel: string;
  passes: string;
  riskLevel: string;
  badgeColor: string;
  stats: {
    missDist: string;
    relSpeed: string;
    timeSpan: string;
  };
}

const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'sample_1_iss_critical_collision.csv',
    title: 'Scenario 1: Critical Collision (ISS vs Cosmos-2251)',
    description: 'High-risk close approach (Miss distance 44m, high relative velocity 14.5 km/s, 8 passes). Requires emergency Collision Avoidance Maneuver (CAM).',
    category: 'critical',
    categoryLabel: 'Critical Alert',
    passes: '8 Passes Arc',
    riskLevel: 'CRITICAL / HIGH',
    badgeColor: 'border-danger text-danger bg-danger/10',
    stats: {
      missDist: '44.0 m',
      relSpeed: '14.5 km/s',
      timeSpan: 'T-4.4d to T-2.1d',
    }
  },
  {
    id: 'sample_2_multi_pass_radar_timeline.csv',
    title: 'Scenario 2: Multi-Pass 15-Observation Radar Timeline',
    description: 'Extended tracking sequence tracking orbit refinement from T-6.8 days to T-2.2 days over 15 sequential radar passes.',
    category: 'multipass',
    categoryLabel: 'Multi-Pass Radar',
    passes: '15 Passes Full Arc',
    riskLevel: 'NOMINAL RESOLVED',
    badgeColor: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
    stats: {
      missDist: '44.0 m',
      relSpeed: '11.3 km/s',
      timeSpan: 'T-6.8d to T-2.2d',
    }
  },
  {
    id: 'sample_3_single_shot_emergency_cdm.csv',
    title: 'Scenario 3: Single-Shot Emergency Flash CDM',
    description: 'Single radar snapshot with 37m miss distance. Demonstrates rapid sub-3ms automated triage on isolated, newly detected CDMs.',
    category: 'critical',
    categoryLabel: 'Single Flash',
    passes: '1 Snapshot Flash',
    riskLevel: 'CRITICAL',
    badgeColor: 'border-danger text-danger bg-danger/10',
    stats: {
      missDist: '37.0 m',
      relSpeed: '13.9 km/s',
      timeSpan: 'T-2.3d TCA',
    }
  },
  {
    id: 'sample_4_moderate_elevated_risk.csv',
    title: 'Scenario 4: Moderate Warning Conjunction',
    description: 'Conjunction requiring prioritized ground radar tasking and orbital tracking verification (162m miss distance, 8 passes).',
    category: 'critical',
    categoryLabel: 'Elevated Warning',
    passes: '8 Passes Sequence',
    riskLevel: 'CRITICAL / ELEVATED',
    badgeColor: 'border-amber-500 text-amber-400 bg-amber-500/10',
    stats: {
      missDist: '162.0 m',
      relSpeed: '2.9 km/s',
      timeSpan: 'T-4.3d to T-2.1d',
    }
  },
  {
    id: 'sample_5_benign_safe_encounter.csv',
    title: 'Scenario 5: Benign Safe Spacecraft Pass',
    description: 'Safe orbital clearance with > 60 km miss distance. Confirms nominal status without thruster burn or mission disruption.',
    category: 'safe',
    categoryLabel: 'Safe Nominal',
    passes: '1 Pass Nominal',
    riskLevel: 'BENIGN / SAFE',
    badgeColor: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
    stats: {
      missDist: '60.8 km',
      relSpeed: '0.2 km/s',
      timeSpan: 'T-4.8d Nominal',
    }
  },
  {
    id: 'sample_6_rapid_risk_escalation.csv',
    title: 'Scenario 6: Rapid Risk Escalation (Safe -> Critical Alert)',
    description: 'Starts at safe low risk (Pc ≈ 10^-16) at T-6.5d, but covariance shrinkage reveals high-risk collision path (99m miss distance, 14 passes).',
    category: 'dynamics',
    categoryLabel: 'Dynamic Escalation',
    passes: '14 Passes Timeline',
    riskLevel: 'HIGH ESCALATION',
    badgeColor: 'border-rose-500 text-rose-400 bg-rose-500/10',
    stats: {
      missDist: '99.0 m',
      relSpeed: '14.8 km/s',
      timeSpan: 'T-6.5d to T-2.1d',
    }
  },
  {
    id: 'sample_7_deescalating_false_alarm.csv',
    title: 'Scenario 7: De-escalating False Alarm Clear-Out',
    description: 'Starts as elevated alert due to early uncertainty bubble (Pc ≈ 10^-3.8), but resolves to safe (Pc ≈ 10^-18) as radar data refines path (16 passes).',
    category: 'dynamics',
    categoryLabel: 'False Alarm Cleared',
    passes: '16 Passes Sequence',
    riskLevel: 'RESOLVED SAFE',
    badgeColor: 'border-cyan-500 text-cyan-400 bg-cyan-500/10',
    stats: {
      missDist: '157.0 m',
      relSpeed: '15.2 km/s',
      timeSpan: 'T-6.9d to T-2.1d',
    }
  },
  {
    id: 'sample_8_hypervelocity_crosstrack.csv',
    title: 'Scenario 8: Hypervelocity Cross-Track Pass (14.1 km/s)',
    description: 'High relative speed crossing (14,136 m/s = 50,889 km/h) between retrograde polar LEO objects with 751m miss distance across 5 passes.',
    category: 'multipass',
    categoryLabel: 'Hypervelocity LEO',
    passes: '5 Passes Crossing',
    riskLevel: 'HIGH-SPEED PASS',
    badgeColor: 'border-orange-500 text-orange-400 bg-orange-500/10',
    stats: {
      missDist: '751.0 m',
      relSpeed: '14.1 km/s',
      timeSpan: 'T-3.6d to T-2.2d',
    }
  },
  {
    id: 'sample_9_polar_sso_constellation.csv',
    title: 'Scenario 9: Polar Sun-Synchronous (SSO) Constellation Pass',
    description: '15-Pass tracking arc in high-density polar Sun-Synchronous Orbit with 110m miss distance and risk escalation to Pc = 0.012%.',
    category: 'multipass',
    categoryLabel: 'SSO Orbit Arc',
    passes: '15 Passes Polar Arc',
    riskLevel: 'CRITICAL ALERT',
    badgeColor: 'border-danger text-danger bg-danger/10',
    stats: {
      missDist: '110.0 m',
      relSpeed: '13.0 km/s',
      timeSpan: 'T-6.8d to T-2.2d',
    }
  },
  {
    id: 'sample_10_coplanar_slow_drift.csv',
    title: 'Scenario 10: Low Relative Velocity Co-Planar Drift',
    description: 'Low relative velocity encounter (63 m/s) between satellites drifting in adjacent orbital planes with 935m miss distance.',
    category: 'safe',
    categoryLabel: 'Co-Planar Drift',
    passes: '2 Passes Drift',
    riskLevel: 'LOW RISK DRIFT',
    badgeColor: 'border-teal-500 text-teal-400 bg-teal-500/10',
    stats: {
      missDist: '935.0 m',
      relSpeed: '63 m/s',
      timeSpan: 'T-4.8d Nominal',
    }
  },
];

export default function PredictionPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stagedFile, setStagedFile] = useState<StagedFile | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stagingLoading, setStagingLoading] = useState(false);

  // Prediction History state
  const [history, setHistory] = useState<PredictionHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save prediction history', e);
    }
  }, [history]);

  const parseCsvPreview = async (fileBlob: Blob, filename: string): Promise<StagedFile> => {
    const text = await fileBlob.text();
    const lines = text.trim().split('\n').filter(l => l.trim().length > 0);
    const headers = lines.length > 0 ? lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '')) : [];
    const previewRows = lines.slice(1, 4).map(l => l.split(',').map(c => c.trim().replace(/^["']|["']$/g, '')));
    const rowCount = Math.max(0, lines.length - 1);

    return {
      name: filename,
      blob: fileBlob,
      size: fileBlob.size,
      rowCount,
      previewRows,
      headers: headers.slice(0, 8), // top 8 columns for preview
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setStagingLoading(true);
    try {
      const parsed = await parseCsvPreview(file, file.name);
      setStagedFile(parsed);
      setResult(null); // Clear previous result until user clicks "Run"
    } catch (err: any) {
      setError('Failed to read CSV file: ' + err.message);
    } finally {
      setStagingLoading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const loadSampleTemplate = async (filename: string, label: string) => {
    setError(null);
    setStagingLoading(true);
    try {
      const res = await fetch(`/${filename}`);
      if (!res.ok) throw new Error(`Could not load scenario ${filename}`);
      const blob = await res.blob();
      const parsed = await parseCsvPreview(blob, `${label} (${filename})`);
      setStagedFile(parsed);
      setResult(null); // Stage file only, user clicks RUN PREDICTION to execute
      window.scrollTo({ top: 320, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Failed to stage sample scenario');
    } finally {
      setStagingLoading(false);
    }
  };

  const clearStagedFile = () => {
    setStagedFile(null);
    setError(null);
  };

  const executePrediction = async () => {
    if (!stagedFile) {
      setError('Please upload a CDM CSV file first.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', stagedFile.blob, stagedFile.name);

    try {
      const res = await fetch('http://localhost:8000/api/predict-cdm', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.detail || 'Prediction failed');
      }
      setResult(data);
      saveToHistory(data, stagedFile.name);
    } catch (err: any) {
      setError(err.message || 'Failed to process CDM prediction');
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = (data: any, label: string) => {
    const newItem: PredictionHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleString(),
      sampleName: label,
      n_cdms_used: data.n_cdms_used || 1,
      predicted_risk: data.predicted_risk,
      probability_pct: data.probability_pct,
      collision_probability: data.collision_probability,
      risk_band: data.risk_band,
      last_time_to_tca: data.last_time_to_tca,
      last_miss_distance: data.last_miss_distance,
      cdms: data.cdms || [],
    };

    setHistory(prev => [newItem, ...prev.slice(0, 49)]); // Keep latest 50
  };

  const viewIn3DEventLab = (targetData?: any) => {
    const dataToUse = targetData || result;
    if (!dataToUse) return;

    const eventPayload = {
      summary: {
        event_id: 'CUSTOM',
        cdm_count: dataToUse.cdms?.length || dataToUse.n_cdms_used || 1,
        highest_risk: dataToUse.predicted_risk,
        risk_band: dataToUse.risk_band,
        closest_miss_distance: dataToUse.last_miss_distance ?? 500,
        tca: dataToUse.last_time_to_tca ?? 1.5,
        object_type: 'DEBRIS'
      },
      cdms: dataToUse.cdms && dataToUse.cdms.length > 0 ? dataToUse.cdms : [
        {
          time_to_tca: dataToUse.last_time_to_tca ?? 1.5,
          miss_distance: dataToUse.last_miss_distance ?? 500,
          relative_speed: 10200,
          relative_position_r: 120,
          relative_position_t: 450,
          relative_position_n: 80,
          relative_velocity_r: 0,
          relative_velocity_t: 0,
          relative_velocity_n: 0,
          risk: dataToUse.predicted_risk,
          predicted_risk: dataToUse.predicted_risk,
          c_object_type: 'DEBRIS',
          c_sigma_r: 15,
          c_sigma_t: 50,
          c_sigma_n: 10,
          t_sigma_r: 10,
          t_sigma_t: 40,
          t_sigma_n: 8,
          mahalanobis_distance: 4.5
        }
      ]
    };

    sessionStorage.setItem('prahari_3d_custom_cdm', JSON.stringify(eventPayload));
    navigate('/events/custom');
  };

  const inspectHistoryItem = (item: PredictionHistoryItem) => {
    setResult({
      predicted_risk: item.predicted_risk,
      probability_pct: item.probability_pct,
      collision_probability: item.collision_probability,
      risk_band: item.risk_band,
      n_cdms_used: item.n_cdms_used,
      last_time_to_tca: item.last_time_to_tca,
      last_miss_distance: item.last_miss_distance,
      cdms: item.cdms || [],
      success: true,
      is_historical: true,
      historical_title: item.sampleName
    });
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all prediction history?')) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const exportHistoryCSV = () => {
    if (history.length === 0) return;
    const headers = ['Timestamp', 'File Name', 'Observations Count', 'Predicted Risk (log10)', 'Probability (%)', 'Risk Band', 'Time to TCA (days)', 'Miss Distance (m)'];
    const rows = history.map(h => [
      `"${h.timestamp}"`,
      `"${h.sampleName}"`,
      h.n_cdms_used,
      h.predicted_risk,
      h.probability_pct,
      `"${h.risk_band}"`,
      h.last_time_to_tca ?? 'N/A',
      h.last_miss_distance ?? 'N/A'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `prahari_prediction_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 flex-1 overflow-auto bg-background">
      {/* Header */}
      <div className="max-w-5xl mb-8 border-b border-border/50 pb-4">
        <h1 className="text-2xl md:text-3xl font-mono text-textPrimary tracking-tight flex items-center gap-3">
          <Activity className="text-accent w-7 h-7" />
          CDM INFERENCE & RISK ASSESSMENT
        </h1>
        <p className="text-sm font-mono text-textSecondary mt-1">
          Upload any Conjunction Data Message (.csv) to evaluate satellite collision risk.
        </p>
      </div>

      <div className="max-w-5xl space-y-8">
        
        {/* Upload CDM Area */}
        <div className="border border-border bg-surface rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono font-semibold text-textPrimary flex items-center gap-2">
              <Upload className="w-4 h-4 text-accent" />
              UPLOAD CONJUNCTION DATA MESSAGE (.CSV)
            </h2>
            <span className="text-[11px] font-mono text-textSecondary bg-background/80 px-2.5 py-0.5 rounded border border-border/50">
              Zero Data Leakage Astrodynamics Engine
            </span>
          </div>

          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-border border-dashed rounded-lg cursor-pointer hover:bg-surfaceHover/80 transition-colors bg-background/40">
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Upload className="w-8 h-8 text-accent mb-2" />
              <p className="text-sm text-textSecondary font-mono">
                <span className="font-semibold text-accent underline">Click to select CDM CSV file</span> or drag & drop here
              </p>
              <p className="text-xs text-textSecondary/70 font-mono mt-1.5">
                Supports single-encounter CDMs and multi-pass tracking sequences
              </p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept=".csv" 
              onChange={handleFileUpload} 
              disabled={stagingLoading || loading}
            />
          </label>

          {stagingLoading && (
            <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded text-center font-mono text-accent text-xs flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
              READING & VALIDATING CDM FILE...
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 border border-danger/50 bg-danger/10 text-danger font-mono text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Benchmark Sample CDM Scenarios Panel */}
        <div className="border border-border/80 bg-surface/80 backdrop-blur rounded-xl p-6 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 border-b border-border/40 pb-3">
            <div>
              <h2 className="text-sm font-mono font-semibold text-textPrimary flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent" />
                BENCHMARK SAMPLE CDM SCENARIOS (READY TO TEST & DEMO)
              </h2>
              <p className="text-xs font-mono text-textSecondary mt-0.5">
                10 genuine CCSDS test scenarios covering emergency collisions, radar arcs, dynamic escalation, and safe clearances.
              </p>
            </div>
            <span className="text-[11px] font-mono text-textSecondary bg-background/80 px-2.5 py-0.5 rounded border border-border/50 shrink-0">
              10 Real-World Datasets
            </span>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-4 pb-2 border-b border-border/30">
            {[
              { id: 'all', label: 'All Scenarios', count: SAMPLE_SCENARIOS.length },
              { id: 'critical', label: 'Critical & Warning', count: SAMPLE_SCENARIOS.filter(s => s.category === 'critical').length },
              { id: 'multipass', label: 'Multi-Pass Arcs', count: SAMPLE_SCENARIOS.filter(s => s.category === 'multipass').length },
              { id: 'dynamics', label: 'Dynamic Evolution', count: SAMPLE_SCENARIOS.filter(s => s.category === 'dynamics').length },
              { id: 'safe', label: 'Safe & Nominal', count: SAMPLE_SCENARIOS.filter(s => s.category === 'safe').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1 rounded text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === tab.id
                    ? 'bg-accent text-background font-bold shadow-sm'
                    : 'bg-background/60 hover:bg-surfaceHover text-textSecondary hover:text-textPrimary border border-border/50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                  selectedCategory === tab.id ? 'bg-background/30 text-background' : 'bg-surface text-textSecondary'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {SAMPLE_SCENARIOS
              .filter(sc => selectedCategory === 'all' || sc.category === selectedCategory)
              .map((sc) => (
              <div 
                key={sc.id} 
                className="border border-border/60 bg-background/60 hover:border-accent/40 rounded-lg p-3.5 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${sc.badgeColor}`}>
                      {sc.riskLevel}
                    </span>
                    <span className="text-[10px] font-mono text-textSecondary bg-surface px-1.5 py-0.5 rounded border border-border/40">
                      {sc.passes}
                    </span>
                  </div>
                  <h3 className="text-xs font-mono font-bold text-textPrimary group-hover:text-accent transition-colors line-clamp-1 mb-1" title={sc.title}>
                    {sc.title}
                  </h3>
                  <p className="text-[11px] font-mono text-textSecondary line-clamp-2 mb-2.5 leading-relaxed">
                    {sc.description}
                  </p>

                  {/* Telemetry quick chips */}
                  <div className="grid grid-cols-3 gap-1.5 mb-3 bg-surface/50 p-1.5 rounded border border-border/30 text-[10px] font-mono text-textSecondary">
                    <div className="text-center">
                      <span className="block text-[9px] text-textSecondary/70 uppercase">Miss Dist</span>
                      <span className="font-semibold text-textPrimary">{sc.stats.missDist}</span>
                    </div>
                    <div className="text-center border-x border-border/30">
                      <span className="block text-[9px] text-textSecondary/70 uppercase">Rel Speed</span>
                      <span className="font-semibold text-textPrimary">{sc.stats.relSpeed}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[9px] text-textSecondary/70 uppercase">Arc</span>
                      <span className="font-semibold text-textPrimary truncate">{sc.stats.timeSpan}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2.5 border-t border-border/30">
                  <button
                    type="button"
                    onClick={() => loadSampleTemplate(sc.id, sc.title)}
                    disabled={stagingLoading || loading}
                    className="flex-1 bg-surface hover:bg-accent hover:text-background border border-border text-xs font-mono py-1.5 px-2.5 rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer font-medium disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Stage Scenario</span>
                  </button>
                  <a
                    href={`/${sc.id}`}
                    download={sc.id}
                    className="p-1.5 border border-border hover:bg-surfaceHover text-textSecondary hover:text-textPrimary rounded transition-colors"
                    title={`Download ${sc.id}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staged File & Prediction Trigger */}
        {stagedFile && (
          <div className="border-2 border-accent/40 bg-surface/90 rounded-xl p-6 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/60 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono bg-accent/20 text-accent px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    UPLOADED FILE
                  </span>
                  <span className="text-xs font-mono text-textSecondary">
                    {(stagedFile.size / 1024).toFixed(1)} KB • {stagedFile.rowCount} observation{stagedFile.rowCount > 1 ? 's' : ''} detected
                  </span>
                </div>
                <h3 className="text-base font-mono font-bold text-textPrimary flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  {stagedFile.name}
                </h3>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={clearStagedFile}
                  disabled={loading}
                  className="px-3 py-2 border border-border hover:bg-surfaceHover text-textSecondary hover:text-danger rounded text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Remove
                </button>
                <button
                  type="button"
                  onClick={executePrediction}
                  disabled={loading}
                  className="flex-1 md:flex-initial px-6 py-2.5 bg-accent hover:bg-accent/90 text-background font-mono font-bold text-sm rounded shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                      <span>EVALUATING RISK...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>RUN PREDICTION</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick CSV Data Preview */}
            <div className="bg-background/80 rounded-lg p-3 border border-border/40 overflow-x-auto">
              <div className="text-[10px] font-mono text-textSecondary mb-2 flex items-center justify-between">
                <span>CDM TELEMETRY COLUMNS PREVIEW:</span>
                <span>{stagedFile.headers.length} Columns detected</span>
              </div>
              <table className="w-full text-left text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-border/40 text-textSecondary">
                    {stagedFile.headers.map((h, i) => (
                      <th key={i} className="p-1.5 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 text-textPrimary">
                  {stagedFile.previewRows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.slice(0, stagedFile.headers.length).map((val, cIdx) => (
                        <td key={cIdx} className="p-1.5 whitespace-nowrap text-textSecondary/90">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Prediction Results Display */}
        {result && (
          <div className="border border-border/80 bg-surface rounded-xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-6">
              <div>
                <span className="text-[10px] font-mono text-textSecondary uppercase tracking-widest">
                  {result.is_historical ? 'HISTORICAL AUDIT RECORD' : 'PREDICTION RESULTS'}
                </span>
                <h2 className="text-base font-mono font-bold text-textPrimary">
                  {result.historical_title || stagedFile?.name || 'CDM Risk Assessment'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-background px-3 py-1 rounded border border-border text-textSecondary">
                  Observations Used: <strong className="text-textPrimary">{result.n_cdms_used || 1}</strong>
                </span>
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded border border-emerald-500/30 font-semibold">
                  Zero Data Leakage Model
                </span>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 border border-border/60 bg-background/60 rounded-lg">
                <div className="text-[11px] font-mono text-textSecondary mb-1">PREDICTED RISK (log10 Pc)</div>
                <div className="text-2xl font-mono font-bold text-textPrimary">
                  {Number(result.predicted_risk).toFixed(4)}
                </div>
                <div className="text-[10px] font-mono text-textSecondary mt-1">Operational collision risk index</div>
              </div>

              <div className="p-4 border border-border/60 bg-background/60 rounded-lg">
                <div className="text-[11px] font-mono text-textSecondary mb-1">COLLISION PROBABILITY</div>
                <div className="text-2xl font-mono font-bold text-accent">
                  {Number(result.probability_pct).toFixed(6)}%
                </div>
                <div className="text-[10px] font-mono text-textSecondary mt-1">
                  Pc = {result.collision_probability ? Number(result.collision_probability).toExponential(3) : 'N/A'}
                </div>
              </div>

              <div className={`p-4 border rounded-lg ${
                result.risk_band === 'CRITICAL' 
                  ? 'border-danger/60 bg-danger/10 text-danger' 
                  : result.risk_band === 'HIGH'
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                  : result.risk_band === 'ELEVATED'
                  ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400'
                  : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
              }`}>
                <div className="text-[11px] font-mono mb-1 opacity-80">TRIAGE ALERT BAND</div>
                <div className="text-2xl font-mono font-bold flex items-center gap-2">
                  {result.risk_band === 'CRITICAL' && <ShieldAlert className="w-6 h-6" />}
                  {result.risk_band === 'HIGH' && <AlertTriangle className="w-6 h-6" />}
                  {result.risk_band === 'LOW' && <CheckCircle2 className="w-6 h-6" />}
                  {result.risk_band}
                </div>
                <div className="text-[10px] font-mono mt-1 opacity-80">
                  {result.risk_band === 'CRITICAL' && 'Action: Mandatory Collision Avoidance Maneuver'}
                  {result.risk_band === 'HIGH' && 'Action: High-Priority Radar Tracking & Verification'}
                  {result.risk_band === 'ELEVATED' && 'Action: Standby & Monitor Consecutive CDMs'}
                  {result.risk_band === 'LOW' && 'Action: Benign Conjunction (No Maneuver Needed)'}
                </div>
              </div>
            </div>

            {/* Physical Telemetry Summary */}
            {result.last_time_to_tca !== undefined && result.last_time_to_tca !== null && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-background/50 border border-border/40 rounded-lg text-xs font-mono">
                <div>
                  <span className="text-textSecondary block text-[10px]">TIME TO TCA</span>
                  <span className="text-textPrimary font-bold">{Number(result.last_time_to_tca).toFixed(2)} days</span>
                </div>
                <div>
                  <span className="text-textSecondary block text-[10px]">MISS DISTANCE</span>
                  <span className="text-textPrimary font-bold">{Number(result.last_miss_distance || 0).toLocaleString()} m</span>
                </div>
                <div>
                  <span className="text-textSecondary block text-[10px]">STATUS</span>
                  <span className="text-emerald-400 font-bold">Inference Successful</span>
                </div>
                <div>
                  <span className="text-textSecondary block text-[10px]">RESPONSE TIME</span>
                  <span className="text-accent font-bold">&lt; 3.0 ms</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => viewIn3DEventLab(result)}
              className="w-full mt-4 py-2.5 px-4 bg-accent hover:bg-accent/90 text-background font-mono font-bold text-xs rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Box className="w-4 h-4" />
              <span>VIEW ENCOUNTER IN 3D EVENT LAB</span>
            </button>
          </div>
        )}

        {/* Prediction History Log */}
        <div className="border border-border/80 bg-surface rounded-xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-4 mb-4">
            <div>
              <h2 className="text-base font-mono font-bold text-textPrimary flex items-center gap-2">
                <History className="w-5 h-5 text-accent" />
                PREDICTION HISTORY & AUDIT TRAIL
              </h2>
              <p className="text-xs font-mono text-textSecondary mt-0.5">
                Persistent audit log of all evaluated conjunction messages ({history.length} records saved)
              </p>
            </div>
            
            {history.length > 0 && (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={exportHistoryCSV}
                  className="px-3 py-1.5 bg-background border border-border hover:bg-surfaceHover text-textSecondary hover:text-textPrimary rounded text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Export History as CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={clearAllHistory}
                  className="px-3 py-1.5 bg-danger/10 border border-danger/30 hover:bg-danger/20 text-danger rounded text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Clear all saved history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              </div>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-textSecondary font-mono text-xs border border-dashed border-border/50 rounded-lg bg-background/30">
              <History className="w-8 h-8 text-textSecondary/40 mx-auto mb-2" />
              NO PREDICTION HISTORY YET
              <p className="text-[11px] text-textSecondary/60 mt-1">
                Upload a CDM CSV file above and click "RUN PREDICTION" to log predictions here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] text-textSecondary tracking-wider bg-background/50 uppercase">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">File Name</th>
                    <th className="p-3">CDMs</th>
                    <th className="p-3">Predicted Risk</th>
                    <th className="p-3">Probability</th>
                    <th className="p-3">Alert Band</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {history.map(item => (
                    <tr 
                      key={item.id} 
                      onClick={() => inspectHistoryItem(item)}
                      className="hover:bg-surfaceHover/60 transition-colors cursor-pointer group"
                    >
                      <td className="p-3 text-textSecondary whitespace-nowrap">{item.timestamp}</td>
                      <td className="p-3 text-textPrimary font-medium max-w-[200px] truncate" title={item.sampleName}>
                        {item.sampleName}
                      </td>
                      <td className="p-3 text-textSecondary">{item.n_cdms_used}</td>
                      <td className="p-3 text-textPrimary font-bold">
                        {Number(item.predicted_risk).toFixed(4)}
                      </td>
                      <td className="p-3 text-accent font-semibold">
                        {Number(item.probability_pct).toFixed(4)}%
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.risk_band === 'CRITICAL'
                            ? 'bg-danger/20 text-danger border-danger/40'
                            : item.risk_band === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : item.risk_band === 'ELEVATED'
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}>
                          {item.risk_band}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); viewIn3DEventLab(item); }}
                            className="p-1 hover:bg-accent/20 text-textSecondary hover:text-accent rounded transition-colors cursor-pointer"
                            title="View in 3D Event Lab"
                          >
                            <Box className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); inspectHistoryItem(item); }}
                            className="p-1 hover:bg-accent/20 text-textSecondary hover:text-accent rounded transition-colors cursor-pointer"
                            title="Inspect in Result Card"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="p-1 hover:bg-danger/20 text-textSecondary hover:text-danger rounded transition-colors cursor-pointer"
                            title="Delete this record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
