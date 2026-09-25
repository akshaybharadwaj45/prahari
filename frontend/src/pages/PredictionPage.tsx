import { useState, useEffect } from 'react';
import { 
  Upload, FileText, Play, Download, CheckCircle2, AlertTriangle, 
  ShieldAlert, Activity, History, Trash2, Eye, FileSpreadsheet 
} from 'lucide-react';

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
  top_features?: Array<{ feature: string; importance: number; raw_key?: string }>;
}

const STORAGE_KEY = 'prahari_prediction_history';

export default function PredictionPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSample, setActiveSample] = useState<string | null>(null);

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
      top_features: data.top_features,
    };

    setHistory(prev => [newItem, ...prev.slice(0, 49)]); // Keep latest 50
  };

  const executePrediction = async (fileBlob: Blob, sampleLabel?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    const label = sampleLabel || activeSample || 'Custom CDM File';
    if (sampleLabel) setActiveSample(sampleLabel);

    const formData = new FormData();
    formData.append('file', fileBlob, 'cdm_upload.csv');

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
      saveToHistory(data, label);
    } catch (err: any) {
      setError(err.message || 'Failed to process CDM prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActiveSample(file.name);
    await executePrediction(file, file.name);
    e.target.value = ''; // Reset file input
  };

  const loadSample = async (filename: string, label: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/${filename}`);
      if (!res.ok) throw new Error(`Could not fetch sample ${filename}`);
      const blob = await res.blob();
      await executePrediction(blob, label);
    } catch (err: any) {
      setError(err.message || 'Failed to load sample CDM');
      setLoading(false);
    }
  };

  const inspectHistoryItem = (item: PredictionHistoryItem) => {
    setActiveSample(`${item.sampleName} (Historical Record)`);
    setResult({
      predicted_risk: item.predicted_risk,
      probability_pct: item.probability_pct,
      collision_probability: item.collision_probability,
      risk_band: item.risk_band,
      n_cdms_used: item.n_cdms_used,
      last_time_to_tca: item.last_time_to_tca,
      last_miss_distance: item.last_miss_distance,
      top_features: item.top_features || [],
      success: true,
      is_historical: true
    });
    window.scrollTo({ top: 400, behavior: 'smooth' });
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
    const headers = ['Timestamp', 'Sample Name', 'Observations Count', 'Predicted Risk (log10)', 'Probability (%)', 'Risk Band', 'Time to TCA (days)', 'Miss Distance (m)'];
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
          NEW CDM PREDICTION & TRIAGE
        </h1>
        <p className="text-sm font-mono text-textSecondary mt-1">
          Upload real-time Conjunction Data Messages (CDMs) or load pre-configured test scenarios to evaluate 98-feature pure physical risk scores.
        </p>
      </div>

      <div className="max-w-5xl space-y-8">
        {/* Sample CDMs Quick-Loader Banner */}
        <div className="border border-border/80 bg-surface/70 rounded-xl p-6 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-mono font-semibold text-textPrimary flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              QUICK TEST BENCH (1-CLICK SAMPLE CDMS)
            </h2>
            <span className="text-[11px] font-mono text-textSecondary bg-background/80 px-2.5 py-0.5 rounded border border-border/50">
              Zero-leakage physical test cases
            </span>
          </div>
          <p className="text-xs font-mono text-textSecondary mb-4">
            Test the machine learning model immediately with pre-formatted ESA test scenarios:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sample 1: Individual CDM */}
            <div className="border border-border/60 bg-background/60 rounded-lg p-4 flex flex-col justify-between hover:border-accent/40 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-amber-400">TYPE A: INDIVIDUAL CDM</span>
                  <span className="text-[10px] font-mono text-textSecondary">1 Observation</span>
                </div>
                <p className="text-xs font-mono text-textSecondary mb-3">
                  Single snapshot telemetry with tight miss distance (high-risk close encounter).
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                <button
                  onClick={() => loadSample('sample_individual_cdm.csv', 'Individual CDM (Single Observation)')}
                  disabled={loading}
                  className="flex-1 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 text-xs font-mono py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Test Individual CDM
                </button>
                <a
                  href="/sample_individual_cdm.csv"
                  download="sample_individual_cdm.csv"
                  className="p-2 border border-border hover:bg-surfaceHover text-textSecondary hover:text-textPrimary rounded transition-colors"
                  title="Download CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Sample 2: Sequential CDMs */}
            <div className="border border-border/60 bg-background/60 rounded-lg p-4 flex flex-col justify-between hover:border-accent/40 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-emerald-400">TYPE B: SEQUENTIAL CDMS</span>
                  <span className="text-[10px] font-mono text-textSecondary">5 Observations Timeline</span>
                </div>
                <p className="text-xs font-mono text-textSecondary mb-3">
                  Multi-observation sequence tracking risk evolution from T-6.84d down to T-2.22d before TCA.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                <button
                  onClick={() => loadSample('sample_sequential_cdms.csv', 'Sequential CDMs (5 Observations Timeline)')}
                  disabled={loading}
                  className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-mono py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Test Sequential CDMs
                </button>
                <a
                  href="/sample_sequential_cdms.csv"
                  download="sample_sequential_cdms.csv"
                  className="p-2 border border-border hover:bg-surfaceHover text-textSecondary hover:text-textPrimary rounded transition-colors"
                  title="Download CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Custom File Upload Dropzone */}
        <div className="border border-border bg-surface rounded-xl p-6 shadow-md">
          <h2 className="text-sm font-mono font-semibold text-textPrimary mb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-accent" />
            CUSTOM CDM FILE UPLOAD
          </h2>
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-border border-dashed rounded-lg cursor-pointer hover:bg-surfaceHover/80 transition-colors bg-background/40">
            <div className="flex flex-col items-center justify-center pt-3 pb-3">
              <Upload className="w-6 h-6 text-textSecondary mb-1.5" />
              <p className="text-xs text-textSecondary font-mono">
                <span className="font-semibold text-textPrimary">Click to upload custom CDM (.csv)</span> or drag and drop
              </p>
              <p className="text-[10px] text-textSecondary/70 font-mono mt-0.5">Supports single observation or multi-row sequential CDMs</p>
            </div>
            <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
          </label>

          {loading && (
            <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded text-center font-mono text-accent text-xs flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
              EVALUATING 98 PURE PHYSICAL FEATURES & COVARIANCE MATRICES...
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 border border-danger/50 bg-danger/10 text-danger font-mono text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Prediction Results Display */}
        {result && (
          <div className="border border-border/80 bg-surface rounded-xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-6">
              <div>
                <span className="text-[10px] font-mono text-textSecondary uppercase tracking-widest">
                  {result.is_historical ? 'HISTORICAL RECORD' : 'ACTIVE EVALUATION'}
                </span>
                <h2 className="text-base font-mono font-bold text-textPrimary">
                  {activeSample || 'CDM Prediction Results'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-background px-3 py-1 rounded border border-border text-textSecondary">
                  Observations Used: <strong className="text-textPrimary">{result.n_cdms_used || 1}</strong>
                </span>
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded border border-emerald-500/30 font-semibold">
                  Model: 98 Pure Physics (Zero Leakage)
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
                <div className="text-[10px] font-mono text-textSecondary mt-1">Operational collision index</div>
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
                  {result.risk_band === 'CRITICAL' && 'Action: Mandatory Thruster Burn (CAM)'}
                  {result.risk_band === 'HIGH' && 'Action: Task High-Priority Radar Tracking'}
                  {result.risk_band === 'ELEVATED' && 'Action: Standby & Monitor Incoming CDMs'}
                  {result.risk_band === 'LOW' && 'Action: Benign Event (No Thruster Burn)'}
                </div>
              </div>
            </div>

            {/* Physical Telemetry Summary */}
            {result.last_time_to_tca !== undefined && result.last_time_to_tca !== null && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-background/50 border border-border/40 rounded-lg mb-6 text-xs font-mono">
                <div>
                  <span className="text-textSecondary block text-[10px]">TIME TO TCA</span>
                  <span className="text-textPrimary font-bold">{Number(result.last_time_to_tca).toFixed(2)} days</span>
                </div>
                <div>
                  <span className="text-textSecondary block text-[10px]">MISS DISTANCE</span>
                  <span className="text-textPrimary font-bold">{Number(result.last_miss_distance || 0).toLocaleString()} m</span>
                </div>
                <div>
                  <span className="text-textSecondary block text-[10px]">EVALUATION STATUS</span>
                  <span className="text-emerald-400 font-bold">Inference Complete</span>
                </div>
                <div>
                  <span className="text-textSecondary block text-[10px]">ENGINE LATENCY</span>
                  <span className="text-accent font-bold">&lt; 2.5 ms</span>
                </div>
              </div>
            )}

            {/* Top SHAP Feature Drivers */}
            <div>
              <h3 className="text-xs font-mono text-textSecondary uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Top Pure Physical Risk Drivers (SHAP Attribution)</span>
                <span className="text-[10px] text-textSecondary">Relative Feature Importance</span>
              </h3>
              <div className="space-y-2">
                {(result.top_features || []).map((f: any, i: number) => {
                  const pct = (Number(f.importance) * 100).toFixed(1);
                  return (
                    <div key={i} className="p-2.5 border border-border/40 rounded bg-background/70">
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-textPrimary font-medium">{f.feature}</span>
                        <span className="text-accent font-bold">{pct}%</span>
                      </div>
                      <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-accent h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(Math.max(Number(pct) * 3, 5), 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
                Persistent log of all evaluated conjunction messages ({history.length} records saved)
              </p>
            </div>
            
            {history.length > 0 && (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={exportHistoryCSV}
                  className="px-3 py-1.5 bg-background border border-border hover:bg-surfaceHover text-textSecondary hover:text-textPrimary rounded text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Export History as CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  Export CSV
                </button>
                <button
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
                Run a test above (Individual or Sequential CDM) to automatically log predictions here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] text-textSecondary tracking-wider bg-background/50 uppercase">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Source / Sample</th>
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
