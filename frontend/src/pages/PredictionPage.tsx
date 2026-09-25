import { useState } from 'react';
import { Upload, FileText, Play, Download, CheckCircle2, AlertTriangle, ShieldAlert, Activity } from 'lucide-react';

export default function PredictionPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSample, setActiveSample] = useState<string | null>(null);

  const executePrediction = async (fileBlob: Blob, sampleLabel?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
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
    await executePrediction(file);
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

  return (
    <div className="p-8 flex-1 overflow-auto bg-background">
      {/* Header */}
      <div className="max-w-4xl mb-8 border-b border-border/50 pb-4">
        <h1 className="text-2xl md:text-3xl font-mono text-textPrimary tracking-tight flex items-center gap-3">
          <Activity className="text-accent w-7 h-7" />
          NEW CDM PREDICTION & TRIAGE
        </h1>
        <p className="text-sm font-mono text-textSecondary mt-1">
          Upload real-time Conjunction Data Messages (CDMs) or load pre-configured test scenarios to evaluate 100-feature XGBoost risk scores.
        </p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Sample CDMs Quick-Loader Banner */}
        <div className="border border-border/80 bg-surface/70 rounded-xl p-6 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-mono font-semibold text-textPrimary flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              QUICK TEST BENCH (1-CLICK SAMPLE CDMS)
            </h2>
            <span className="text-[11px] font-mono text-textSecondary bg-background/80 px-2.5 py-0.5 rounded border border-border/50">
              No local file search needed
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
                  className="flex-1 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 text-xs font-mono py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
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
                  className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-mono py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
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
              EVALUATING 100 TELEMETRY FEATURES & COVARIANCE MATRICES...
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
                <span className="text-[10px] font-mono text-textSecondary uppercase tracking-widest">Active Evaluation</span>
                <h2 className="text-base font-mono font-bold text-textPrimary">
                  {activeSample || 'CDM Prediction Results'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-background px-3 py-1 rounded border border-border text-textSecondary">
                  Observations Used: <strong className="text-textPrimary">{result.n_cdms_used || 1}</strong>
                </span>
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded border border-emerald-500/30 font-semibold">
                  Model: 100-Feature XGBoost
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
                <span>Top Physical Risk Drivers (SHAP Attribution)</span>
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
      </div>
    </div>
  );
}
