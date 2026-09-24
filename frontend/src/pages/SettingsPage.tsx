import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [autoPlay, setAutoPlay] = useState(() => localStorage.getItem('prahari_autoplay') === 'true');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('prahari_highcontrast') !== 'false');
  const [threshold, setThreshold] = useState(() => localStorage.getItem('prahari_threshold') || '-4');

  useEffect(() => {
    localStorage.setItem('prahari_autoplay', autoPlay.toString());
  }, [autoPlay]);

  useEffect(() => {
    localStorage.setItem('prahari_highcontrast', highContrast.toString());
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('prahari_threshold', threshold);
  }, [threshold]);

  return (
    <div className="p-8 h-full flex flex-col bg-background">
      <h1 className="text-2xl font-mono text-textPrimary tracking-tight mb-8 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        SYSTEM SETTINGS
      </h1>
      
      <div className="max-w-3xl space-y-6">
        <div className="p-6 border border-border/50 rounded-lg bg-surface/50 backdrop-blur">
          <h2 className="text-sm font-mono text-textPrimary mb-4">GENERAL</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs font-mono text-textPrimary">Auto-play Encounters</div>
                <div className="text-[10px] font-mono text-textSecondary">Automatically start playing timeline when opening an event.</div>
              </div>
              <input type="checkbox" checked={autoPlay} onChange={e => setAutoPlay(e.target.checked)} className="w-4 h-4 accent-accent cursor-pointer" />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs font-mono text-textPrimary">Dark Theme High Contrast</div>
                <div className="text-[10px] font-mono text-textSecondary">Increase contrast of text and borders.</div>
              </div>
              <input type="checkbox" checked={highContrast} onChange={e => setHighContrast(e.target.checked)} className="w-4 h-4 accent-accent cursor-pointer" />
            </div>
          </div>
        </div>

        <div className="p-6 border border-border/50 rounded-lg bg-surface/50 backdrop-blur">
          <h2 className="text-sm font-mono text-textPrimary mb-4">MACHINE LEARNING</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs font-mono text-textPrimary">Critical Risk Threshold (log10 Pc)</div>
                <div className="text-[10px] font-mono text-textSecondary">Defines the boundary for CRITICAL risk band.</div>
              </div>
              <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} className="bg-background border border-border/50 rounded px-3 py-1 text-xs font-mono text-textPrimary w-20 text-center" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
