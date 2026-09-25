import { useState } from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle, Database, Upload, FileBarChart, Box } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatRiskPct, getRiskBand } from '../utils';
import { useQuery } from '@tanstack/react-query';

const STORAGE_KEY = 'prahari_prediction_history';

export default function OverviewPage() {
  const navigate = useNavigate();
  const { data, error, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8000/api/events');
      if (!res.ok) throw new Error("Backend offline");
      return res.json();
    }
  });

  // Predict states
  const [predictResult, setPredictResult] = useState<any>(null);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [predictLoading, setPredictLoading] = useState(false);

  const saveToHistory = (resData: any, fileName: string) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const prev = saved ? JSON.parse(saved) : [];
      const newItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toLocaleString(),
        sampleName: fileName,
        n_cdms_used: resData.n_cdms_used || resData.metrics?.n_cdms || 1,
        predicted_risk: resData.predicted_risk,
        probability_pct: resData.probability_pct,
        collision_probability: resData.collision_probability,
        risk_band: resData.risk_band || getRiskBand(resData.predicted_risk),
        last_time_to_tca: resData.last_time_to_tca ?? resData.metrics?.time_to_tca,
        last_miss_distance: resData.last_miss_distance ?? resData.metrics?.miss_distance,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newItem, ...prev.slice(0, 49)]));
    } catch (e) {
      console.error('Failed to save to history', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPredictLoading(true);
    setPredictError(null);
    setPredictResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/predict-cdm', {
        method: 'POST',
        body: formData,
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || resData.detail || 'Prediction failed');
      }
      setPredictResult(resData);
      saveToHistory(resData, file.name);
    } catch (err: any) {
      setPredictError(err.message);
    } finally {
      setPredictLoading(false);
    }
  };

  const viewIn3DEventLab = () => {
    if (!predictResult) return;
    const eventPayload = {
      summary: {
        event_id: 'CUSTOM',
        cdm_count: predictResult.cdms?.length || predictResult.n_cdms_used || 1,
        highest_risk: predictResult.predicted_risk,
        risk_band: predictResult.risk_band || getRiskBand(predictResult.predicted_risk),
        closest_miss_distance: predictResult.last_miss_distance ?? predictResult.metrics?.miss_distance ?? 500,
        tca: predictResult.last_time_to_tca ?? predictResult.metrics?.time_to_tca ?? 1.5,
        object_type: predictResult.metrics?.object_type ?? 'DEBRIS'
      },
      cdms: predictResult.cdms || []
    };
    sessionStorage.setItem('prahari_3d_custom_cdm', JSON.stringify(eventPayload));
    navigate('/events/custom');
  };

  if (error) return <div className="p-8 text-danger font-mono">{error.message}</div>;
  if (isLoading || !data) return <div className="p-8 text-textSecondary font-mono">INITIALIZING SYSTEM...</div>;

  const eventsWithDynamicRisk = data.events.map((e: any) => ({
    ...e,
    risk_band: getRiskBand(e.highest_risk)
  }));

  const critical = eventsWithDynamicRisk.filter((e: any) => e.risk_band === 'CRITICAL').length;
  const high = eventsWithDynamicRisk.filter((e: any) => e.risk_band === 'HIGH').length;
  const elevated = eventsWithDynamicRisk.filter((e: any) => e.risk_band === 'ELEVATED').length;
  const low = eventsWithDynamicRisk.filter((e: any) => e.risk_band === 'LOW').length;

  return (
    <div className="flex-1 h-full overflow-y-auto bg-background p-8">
      <header className="mb-8 border-b border-border/50 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-mono text-textPrimary tracking-tight">GLOBAL DASHBOARD</h1>
          <p className="text-xs text-textSecondary mt-2 tracking-widest uppercase">Prahari Command Center</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <MetricCard label="TOTAL EVENTS" value={data.count} icon={Database} />
        <MetricCard label="CRITICAL" value={critical} icon={ShieldAlert} color="text-danger" />
        <MetricCard label="HIGH RISK" value={high} icon={AlertTriangle} color="text-warning" />
        <MetricCard label="ELEVATED" value={elevated} icon={AlertCircle} color="text-info" />
        <MetricCard label="LOW RISK" value={low} icon={CheckCircle} color="text-accent" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* NEW CDM PREDICTION MODULE */}
        <div className="border border-border/50 bg-surface/50 backdrop-blur-md p-6 rounded-xl shadow-panel flex flex-col">
          <h2 className="text-xs font-mono text-textSecondary mb-6 tracking-widest flex items-center gap-2">
            <FileBarChart className="w-4 h-4 text-accent" />
            LIVE CDM ANALYSIS MODULE
          </h2>
          
          <label className="flex flex-col items-center justify-center w-full h-32 border border-border/50 border-dashed rounded-lg cursor-pointer hover:bg-surfaceHover/50 transition-colors bg-background/50">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-6 h-6 text-textSecondary mb-3" />
              <p className="mb-1 text-sm text-textSecondary font-mono">
                <span className="text-accent">Click to upload</span> or drag and drop
              </p>
              <p className="text-[10px] text-textSecondary/50 font-mono">CSV format strictly required</p>
            </div>
            <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
          </label>

          {predictLoading && <div className="mt-4 text-center font-mono text-textSecondary text-xs tracking-widest animate-pulse">PROCESSING TELEMETRY...</div>}
          
          {predictError && (
            <div className="mt-4 p-3 border border-danger/30 bg-danger/10 text-danger font-mono text-[10px] rounded-lg">
              {predictError}
            </div>
          )}

          {predictResult && (
            <div className="mt-6 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-background/50 border border-border/30 rounded-lg shadow-inner">
                  <div className="text-[9px] font-mono text-textSecondary mb-1 tracking-widest">PREDICTED RISK (log10)</div>
                  <div className="text-xl font-mono text-textPrimary">{formatRiskPct(predictResult.predicted_risk)}</div>
                </div>
                <div className="p-3 bg-background/50 border border-border/30 rounded-lg shadow-inner">
                  <div className="text-[9px] font-mono text-textSecondary mb-1 tracking-widest">PROBABILITY</div>
                  <div className="text-xl font-mono text-textPrimary">{predictResult.probability_pct.toFixed(6)}%</div>
                </div>
                <div className={`col-span-2 p-3 border rounded-lg flex items-center justify-between ${getRiskBand(predictResult.predicted_risk) === 'CRITICAL' ? 'border-danger/50 bg-danger/5' : 'border-accent/50 bg-accent/5'}`}>
                  <div className="text-[9px] font-mono text-textSecondary tracking-widest">RISK CLASSIFICATION</div>
                  <div className={`text-xl font-mono tracking-widest ${getRiskBand(predictResult.predicted_risk) === 'CRITICAL' ? 'text-danger' : 'text-accent'}`}>
                    {getRiskBand(predictResult.predicted_risk)}
                  </div>
                </div>
              </div>
              
              {predictResult.metrics && (
                <div className="mt-2 border-t border-border/30 pt-4">
                  <h3 className="text-[10px] font-mono tracking-widest text-textSecondary mb-3">CONJUNCTION PARAMETERS</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-background/50 border border-border/30 rounded-lg shadow-inner">
                      <div className="text-[9px] font-mono text-textSecondary mb-1 tracking-widest">MISS DISTANCE</div>
                      <div className="text-lg font-mono text-info">{Number(predictResult.metrics.miss_distance).toLocaleString()} m</div>
                    </div>
                    <div className="p-3 bg-background/50 border border-border/30 rounded-lg shadow-inner">
                      <div className="text-[9px] font-mono text-textSecondary mb-1 tracking-widest">RELATIVE SPEED</div>
                      <div className="text-lg font-mono text-info">{Number(predictResult.metrics.relative_speed).toLocaleString()} m/s</div>
                    </div>
                    <div className="p-3 bg-background/50 border border-border/30 rounded-lg shadow-inner">
                      <div className="text-[9px] font-mono text-textSecondary mb-1 tracking-widest">TIME TO TCA</div>
                      <div className="text-lg font-mono text-info">{Number(predictResult.metrics.time_to_tca).toFixed(2)} days</div>
                    </div>
                    <div className="p-3 bg-background/50 border border-border/30 rounded-lg shadow-inner">
                      <div className="text-[9px] font-mono text-textSecondary mb-1 tracking-widest">OBJECT TYPE</div>
                      <div className="text-lg font-mono text-accent truncate">{predictResult.metrics.object_type}</div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={viewIn3DEventLab}
                className="w-full mt-4 py-2.5 px-4 bg-accent hover:bg-accent/90 text-background font-mono font-bold text-xs rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Box className="w-4 h-4" />
                <span>VIEW ENCOUNTER IN 3D EVENT LAB</span>
              </button>
            </div>
          )}
        </div>

        {/* WATCHLIST MODULE */}
        <div className="border border-border/50 bg-surface/50 backdrop-blur-md p-6 rounded-xl shadow-panel">
          <h2 className="text-xs font-mono text-textSecondary mb-6 tracking-widest flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-danger" />
            CRITICAL WATCHLIST
          </h2>
          <div className="space-y-3">
            {eventsWithDynamicRisk.filter((e: any) => e.risk_band === 'CRITICAL').slice(0, 8).map((e: any) => (
              <Link to={`/events/${e.event_id}`} key={e.event_id} className="flex justify-between items-center p-3 border border-border/30 bg-background/50 rounded-lg hover:border-danger/50 transition-colors shadow-inner group">
                <span className="font-mono text-danger group-hover:text-danger/80">EV-{e.event_id}</span>
                <span className="text-textSecondary text-[10px] font-mono tracking-widest">{e.closest_miss_distance}m MIN DIST</span>
                <span className="text-textPrimary font-mono text-sm bg-surface px-2 py-1 rounded">{formatRiskPct(e.highest_risk)}</span>
              </Link>
            ))}
            {critical === 0 && <div className="text-textSecondary text-xs font-mono tracking-widest mt-8 text-center opacity-50">NO CRITICAL EVENTS DETECTED</div>}
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color = 'text-textPrimary' }: any) {
  return (
    <div className="bg-surface/50 backdrop-blur-md border border-border/50 rounded-xl p-5 flex flex-col justify-between h-32 shadow-card">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-mono text-textSecondary tracking-widest">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className={`text-4xl font-mono ${color}`}>{value}</div>
    </div>
  );
}
