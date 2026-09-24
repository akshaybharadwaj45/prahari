import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatRiskPct, getRiskBand } from '../utils';
import { useQuery } from '@tanstack/react-query';

export default function EventsPage() {
  const [filter, setFilter] = useState('ALL');
  
  const { data, error, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8000/api/events');
      if (!res.ok) throw new Error("Backend offline");
      return res.json();
    }
  });

  if (error) return <div className="p-8 text-danger font-mono">{error.message}</div>;
  if (isLoading || !data) return <div className="p-8 text-textSecondary font-mono">LOADING EVENTS...</div>;

  const eventsWithDynamicRisk = data.events.map((e: any) => ({
    ...e,
    risk_band: getRiskBand(e.highest_risk)
  }));

  const filtered = filter === 'ALL' ? eventsWithDynamicRisk : eventsWithDynamicRisk.filter((e: any) => e.risk_band === filter);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <header className="p-8 pb-4 border-b border-border/50 flex justify-between items-end bg-surface/50 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-mono text-textPrimary tracking-tight">EVENT ARCHIVE</h1>
          <p className="text-xs text-textSecondary mt-2 tracking-widest uppercase">Historical Conjunction Data Messages</p>
        </div>
        <div className="flex gap-2">
          {['ALL', 'CRITICAL', 'HIGH', 'ELEVATED', 'LOW'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[10px] font-mono rounded border transition-colors ${
                filter === f 
                  ? 'bg-accent/20 border-accent/50 text-accent' 
                  : 'bg-background/50 border-border/50 text-textSecondary hover:text-textPrimary hover:bg-surfaceHover'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <div className="border border-border/50 rounded-xl bg-surface/50 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.3)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 text-[10px] tracking-widest font-mono text-textSecondary bg-background/50">
                <th className="p-4">EVENT ID</th>
                <th className="p-4">RISK BAND</th>
                <th className="p-4">PEAK RISK (log10)</th>
                <th className="p-4">TCA (days)</th>
                <th className="p-4">MIN MISS (m)</th>
                <th className="p-4">CDMs</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e: any) => (
                <tr key={e.event_id} className="border-b border-border/30 hover:bg-surfaceHover/50 transition-colors">
                  <td className="p-4 font-mono text-textPrimary text-sm">
                    <Link to={`/events/${e.event_id}`} className="hover:text-accent flex items-center gap-2">
                      EV-{e.event_id}
                    </Link>
                  </td>
                  <td className={`p-4 font-mono text-xs ${e.risk_band === 'CRITICAL' ? 'text-danger' : e.risk_band === 'HIGH' ? 'text-warning' : e.risk_band === 'ELEVATED' ? 'text-info' : 'text-accent'}`}>
                    <span className={`px-2 py-1 rounded-md border ${e.risk_band === 'CRITICAL' ? 'border-danger/30 bg-danger/10' : e.risk_band === 'HIGH' ? 'border-warning/30 bg-warning/10' : 'border-border/30 bg-background'}`}>
                      {e.risk_band}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-textPrimary">{formatRiskPct(e.highest_risk)}</td>
                  <td className="p-4 font-mono text-textSecondary">{e.tca.toFixed(2)}</td>
                  <td className="p-4 font-mono text-textSecondary">{e.closest_miss_distance}</td>
                  <td className="p-4 font-mono text-textSecondary">{e.cdm_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-textSecondary font-mono text-sm tracking-widest">
              NO EVENTS MATCHING FILTER
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
