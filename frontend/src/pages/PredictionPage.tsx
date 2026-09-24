import { useState } from 'react';
import { Upload } from 'lucide-react';

export default function PredictionPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 flex-1 overflow-auto">
      <h1 className="text-2xl font-mono text-textPrimary tracking-tight mb-8">NEW CDM PREDICTION</h1>
      
      <div className="max-w-2xl border border-border bg-surface rounded p-8">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded cursor-pointer hover:bg-surfaceHover">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 text-textSecondary mb-2" />
            <p className="mb-2 text-sm text-textSecondary font-mono">
              <span className="font-semibold text-textPrimary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-textSecondary font-mono">CSV containing CDM features</p>
          </div>
          <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
        </label>

        {loading && <div className="mt-4 text-center font-mono text-textSecondary text-sm">PROCESSING...</div>}
        
        {error && (
          <div className="mt-4 p-4 border border-danger/50 bg-danger/10 text-danger font-mono text-sm rounded">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8">
            <h2 className="text-sm font-mono text-textSecondary mb-4">PREDICTION RESULT</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 border border-border rounded">
                <div className="text-xs font-mono text-textSecondary mb-1">PREDICTED RISK (log10 Pc)</div>
                <div className="text-2xl font-mono text-textPrimary">{result.predicted_risk.toFixed(4)}</div>
              </div>
              <div className="p-4 border border-border rounded">
                <div className="text-xs font-mono text-textSecondary mb-1">PROBABILITY</div>
                <div className="text-2xl font-mono text-textPrimary">{result.probability_pct.toFixed(6)}%</div>
              </div>
              <div className="p-4 border border-border rounded col-span-2">
                <div className="text-xs font-mono text-textSecondary mb-1">RISK BAND</div>
                <div className={`text-xl font-mono ${result.risk_band === 'CRITICAL' ? 'text-danger' : 'text-accent'}`}>
                  {result.risk_band}
                </div>
              </div>
            </div>
            
            <h3 className="text-xs font-mono text-textSecondary mt-6 mb-2">TOP FEATURES</h3>
            <div className="space-y-1">
              {(result.top_features || []).map((f: any, i: number) => (
                <div key={i} className="flex justify-between text-sm font-mono p-2 border border-border/50 rounded bg-background">
                  <span className="text-textPrimary">{f.feature}</span>
                  <span className="text-textSecondary">{(Number(f.importance) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
