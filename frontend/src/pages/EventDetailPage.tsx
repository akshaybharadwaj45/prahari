import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Play, Pause, SkipBack, SkipForward, RotateCcw, Crosshair, BarChart2, Search, ChevronDown, ChevronUp, Focus, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import EncounterScene from '../components/three/EncounterScene';
import { formatRiskPct, getRiskBand } from '../utils';
import { useQuery } from '@tanstack/react-query';

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [selectedCdmIndex, setSelectedCdmIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(() => localStorage.getItem('prahari_autoplay') === 'true');
  const [speed, setSpeed] = useState<1 | 0.5 | 2>(1);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cameraMode, setCameraMode] = useState<'free' | 'follow-primary' | 'follow-secondary'>('free');
  const [recenterTick, setRecenterTick] = useState(0);
  
  // UI States
  const [showCharts, setShowCharts] = useState(false);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [eventSearch, setEventSearch] = useState('');

  // Fetch Event Details
  const { data, error, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:8000/api/events/${eventId}`);
      if (!res.ok) throw new Error("Event not found");
      const d = await res.json();
      d.cdms.sort((a: any, b: any) => b.time_to_tca - a.time_to_tca);
      return d;
    }
  });

  // Fetch All Events for Selector
  const { data: allEventsData } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch(`http://localhost:8000/api/events`);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    }
  });
  const allEvents = allEventsData?.events || [];

  useEffect(() => {
    setSelectedCdmIndex(0);
    setIsPlaying(localStorage.getItem('prahari_autoplay') === 'true');
  }, [eventId]);

  const exportPdf = () => {
    window.print();
  };

  // Playback
  useEffect(() => {
    if (isPlaying && data) {
      const intervalMs = speed === 1 ? 1000 : speed === 0.5 ? 2000 : 500;
      playRef.current = setInterval(() => {
        setSelectedCdmIndex(prev => {
          if (prev >= data.cdms.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else if (playRef.current) {
      clearInterval(playRef.current);
    }
    return () => {
      if (playRef.current) clearInterval(playRef.current);
    };
  }, [isPlaying, data, speed]);

  if (error) return <div className="p-8 text-danger font-mono">{error.message}</div>;
  if (isLoading || !data) return <div className="p-8 text-textSecondary font-mono">LOADING EXPERIMENT...</div>;

  const { summary, cdms } = data;
  const currentCdm = cdms[selectedCdmIndex];
  
  // Dynamic Risk Band
  const computedRiskBand = summary ? getRiskBand(summary.highest_risk) : 'UNKNOWN';

  const filteredEvents = allEvents.filter((e: any) => 
    e.event_id.toString().includes(eventSearch) || 
    e.risk_band.toLowerCase().includes(eventSearch.toLowerCase())
  ).slice(0, 100);

  return (
    <div ref={reportRef} className="flex-1 relative w-full h-full overflow-hidden bg-background">
      {/* 3D SCENE - FULL BLEED */}
      <div className="absolute inset-0 z-0">
        <EncounterScene cdms={cdms} selectedCdmIndex={selectedCdmIndex} cameraMode={cameraMode} recenterTick={recenterTick} />
      </div>

      {/* FLOATING RECENTER BUTTON */}
      <button 
        onClick={() => { setCameraMode('free'); setRecenterTick(t => t + 1); }}
        className="absolute bottom-32 right-[400px] z-30 p-4 bg-surface/80 backdrop-blur-md border border-border/50 rounded-full shadow-panel text-textPrimary hover:bg-surfaceHover hover:scale-110 transition-all flex items-center gap-2 group"
        title="Recenter Camera"
      >
        <Focus className="w-5 h-5 text-accent" />
        <span className="text-[10px] font-mono tracking-widest hidden group-hover:block pr-2">RECENTER</span>
      </button>

      {/* FLOATING HEADER */}
      <header className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#050608]/90 to-transparent z-20 flex items-center justify-between px-6 pointer-events-none">
        <div className="flex items-center gap-6 pointer-events-auto">
          <Link to="/events" className="text-textSecondary hover:text-textPrimary transition-colors flex items-center justify-center w-8 h-8 rounded-full bg-surface/50 border border-border/50 backdrop-blur-md">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          
          {/* EVENT SELECTOR */}
          <div className="relative">
            <button 
              onClick={() => setShowEventSelector(!showEventSelector)}
              className="flex items-center gap-3 px-4 py-2 bg-surface/50 backdrop-blur-md border border-border/50 rounded-lg hover:bg-surface/80 transition-colors"
            >
              <div className="text-lg font-mono text-textPrimary">EV-{summary.event_id}</div>
              <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${computedRiskBand === 'CRITICAL' ? 'border-danger text-danger bg-danger/10' : 'border-accent text-accent bg-accent/10'}`}>
                {computedRiskBand}
              </span>
              <ChevronDown className="w-4 h-4 text-textSecondary" />
            </button>
            
            {showEventSelector && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-surface/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-96">
                <div className="p-3 border-b border-border/50 flex items-center gap-2 bg-background/50">
                  <Search className="w-4 h-4 text-textSecondary" />
                  <input 
                    type="text" 
                    placeholder="Search Event ID or Risk..." 
                    className="bg-transparent border-none outline-none text-sm font-mono text-textPrimary w-full"
                    value={eventSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEventSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto flex-1">
                  {filteredEvents.map((e: any) => {
                    const eRiskBand = getRiskBand(e.highest_risk);
                    return (
                      <button 
                        key={e.event_id}
                        onClick={() => {
                          setShowEventSelector(false);
                          navigate(`/events/${e.event_id}`);
                        }}
                        className="w-full text-left px-4 py-3 border-b border-border/20 hover:bg-surfaceHover flex justify-between items-center transition-colors"
                      >
                        <span className="font-mono text-textPrimary text-sm">EV-{e.event_id}</span>
                        <span className={`text-[10px] font-mono ${eRiskBand === 'CRITICAL' ? 'text-danger' : eRiskBand === 'HIGH' ? 'text-warning' : 'text-accent'}`}>{eRiskBand}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 font-mono text-xs pointer-events-auto">
          <button 
            onClick={exportPdf}
            className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-4 py-1.5 rounded-lg border border-blue-500/50 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.2)]"
          >
            <Download className="w-4 h-4" />
            EXPORT REPORT
          </button>
          <div className="flex items-center gap-2 bg-surface/50 backdrop-blur-md px-2 py-1.5 rounded-lg border border-border/50 shadow-lg">
            <Crosshair className="w-4 h-4 text-textSecondary ml-1" />
            <button onClick={() => setCameraMode('free')} className={`px-3 py-1 rounded-md transition-colors ${cameraMode==='free'?'bg-surfaceHover text-textPrimary':'text-textSecondary hover:text-textPrimary'}`}>FREE</button>
            <button onClick={() => setCameraMode('follow-primary')} className={`px-3 py-1 rounded-md transition-colors ${cameraMode==='follow-primary'?'bg-accent/20 text-accent':'text-textSecondary hover:text-textPrimary'}`}>PRIMARY</button>
            <button onClick={() => setCameraMode('follow-secondary')} className={`px-3 py-1 rounded-md transition-colors ${cameraMode==='follow-secondary'?'bg-danger/20 text-danger':'text-textSecondary hover:text-textPrimary'}`}>SECONDARY</button>
          </div>
        </div>
      </header>

      {/* FLOATING TELEMETRY WIDGET (LEFT) */}
      <div className="absolute top-24 left-6 pointer-events-none z-10 flex flex-col gap-4">
        <div className="font-mono text-xs">
          <div className="text-textPrimary tracking-widest text-sm flex items-center gap-2 drop-shadow-md">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_#06b6d4]" />
            LIVE TELEMETRY
          </div>
        </div>
        
        <div className="flex items-center gap-6 p-4 bg-surface/30 backdrop-blur-lg border border-border/30 rounded-xl shadow-panel">
           <div className="flex flex-col">
             <span className="text-[10px] text-textSecondary font-mono tracking-wider">CURRENT MISS DISTANCE</span>
             <span className="text-3xl text-warning font-mono drop-shadow-md">{currentCdm?.miss_distance} <span className="text-sm text-textSecondary">m</span></span>
           </div>
           <div className="w-px h-12 bg-border/50" />
           <div className="flex flex-col">
             <span className="text-[10px] text-textSecondary font-mono tracking-wider">TIME TO TCA</span>
             <span className="text-3xl text-textPrimary font-mono drop-shadow-md">{currentCdm?.time_to_tca.toFixed(3)} <span className="text-sm text-textSecondary">days</span></span>
           </div>
        </div>
      </div>

      {/* SLIDE-UP CHARTS DRAWER */}
      <div className={`absolute left-0 right-96 bottom-0 z-20 transition-transform duration-500 ease-in-out ${showCharts ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'}`}>
        {/* Toggle Handle */}
        <div className="flex justify-center pointer-events-none">
          <button 
            onClick={() => setShowCharts(!showCharts)}
            className="pointer-events-auto bg-surface/80 backdrop-blur-md border border-border/50 border-b-0 rounded-t-xl px-6 py-2 flex items-center gap-2 hover:bg-surface transition-colors shadow-panel"
          >
            <BarChart2 className="w-4 h-4 text-accent" />
            <span className="font-mono text-xs text-textPrimary tracking-widest">ANALYTICS MODULE</span>
            {showCharts ? <ChevronDown className="w-4 h-4 text-textSecondary" /> : <ChevronUp className="w-4 h-4 text-textSecondary" />}
          </button>
        </div>
        
        {/* Charts Container */}
        <div className="bg-surface/90 backdrop-blur-xl border-t border-border/50 h-72 p-6 flex gap-6 shadow-panel pointer-events-auto">
          
          <div className="flex-1 flex flex-col">
            <h3 className="text-[10px] font-mono text-textSecondary mb-4 tracking-widest flex justify-between">
              <span>RISK (log10 Pc)</span>
              <span className="text-accent">Model vs Recorded</span>
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cdms} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <XAxis dataKey="time_to_tca" reversed stroke="#8a94a6" fontSize={10} tickFormatter={(v) => v.toFixed(1)} />
                  <YAxis stroke="#8a94a6" fontSize={10} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', fontFamily: 'monospace', fontSize: '10px' }} labelFormatter={(v) => `TCA: ${Number(v).toFixed(3)}d`} />
                  <ReferenceLine x={currentCdm?.time_to_tca} stroke="#f59e0b" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="risk" name="Recorded" stroke="#fafafa" dot={{r: 1.5}} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="predicted_risk" name="Model" stroke="#06b6d4" dot={{r: 1.5}} strokeWidth={1.5} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <h3 className="text-[10px] font-mono text-textSecondary mb-4 tracking-widest flex justify-between">
              <span>MISS DISTANCE (m)</span>
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cdms} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                  <XAxis dataKey="time_to_tca" reversed stroke="#8a94a6" fontSize={10} tickFormatter={(v) => v.toFixed(1)} />
                  <YAxis stroke="#8a94a6" fontSize={10} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', fontFamily: 'monospace', fontSize: '10px' }} labelFormatter={(v) => `TCA: ${Number(v).toFixed(3)}d`} />
                  <ReferenceLine x={currentCdm?.time_to_tca} stroke="#f59e0b" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="miss_distance" name="Miss (m)" stroke="#3b82f6" dot={{r: 1.5}} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <h3 className="text-[10px] font-mono text-textSecondary mb-4 tracking-widest flex justify-between">
              <span>MAHALANOBIS DISTANCE</span>
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cdms} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <XAxis dataKey="time_to_tca" reversed stroke="#8a94a6" fontSize={10} tickFormatter={(v) => v.toFixed(1)} />
                  <YAxis stroke="#8a94a6" fontSize={10} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', fontFamily: 'monospace', fontSize: '10px' }} labelFormatter={(v) => `TCA: ${Number(v).toFixed(3)}d`} />
                  <ReferenceLine x={currentCdm?.time_to_tca} stroke="#f59e0b" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="mahalanobis_distance" name="Mahalanobis" stroke="#8b5cf6" dot={{r: 1.5}} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT SIDEBAR - GLASSMORPHIC */}
      <div className="absolute top-0 right-0 bottom-0 w-96 bg-surface/60 backdrop-blur-2xl border-l border-border/30 flex flex-col z-20 shadow-panel">
        
        {/* Playback Controls */}
        <div className="p-6 border-b border-border/30 pt-20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[10px] font-mono text-textSecondary tracking-widest">TIMELINE SEQUENCE</h2>
            <div className="flex bg-background/50 border border-border/50 rounded text-[10px] font-mono overflow-hidden">
              {[0.5, 1, 2].map(s => (
                <button key={s} onClick={() => setSpeed(s as any)} className={`px-2 py-1 transition-colors ${speed === s ? 'bg-accent/20 text-accent font-bold' : 'text-textSecondary hover:bg-surfaceHover'}`}>{s}x</button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-background/50 border border-border/30 rounded-xl p-2 mb-5 shadow-inner">
            <button onClick={() => setSelectedCdmIndex(0)} className="p-2 text-textSecondary hover:text-textPrimary hover:bg-surfaceHover rounded-lg transition-colors"><RotateCcw className="w-4 h-4" /></button>
            <button onClick={() => setSelectedCdmIndex(Math.max(0, selectedCdmIndex - 1))} className="p-2 text-textSecondary hover:text-textPrimary hover:bg-surfaceHover rounded-lg transition-colors"><SkipBack className="w-4 h-4" /></button>
            <button onClick={() => setIsPlaying(!isPlaying)} className={`p-3 rounded-lg transition-all ${isPlaying ? 'bg-warning/20 text-warning shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'bg-accent/20 text-accent shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:bg-accent/30'}`}>
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <button onClick={() => setSelectedCdmIndex(Math.min(cdms.length - 1, selectedCdmIndex + 1))} className="p-2 text-textSecondary hover:text-textPrimary hover:bg-surfaceHover rounded-lg transition-colors"><SkipForward className="w-4 h-4" /></button>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
            {cdms.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setSelectedCdmIndex(i)}
                className={`w-7 h-7 flex items-center justify-center text-[10px] font-mono rounded-md transition-all duration-200 ${
                  i === selectedCdmIndex 
                    ? 'bg-accent text-background font-bold shadow-[0_0_10px_rgba(6,182,212,0.6)] scale-110' 
                    : 'bg-background/80 border border-border/50 text-textSecondary hover:border-textSecondary hover:text-textPrimary'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        
        {/* State Vectors & Details */}
        {currentCdm && (
          <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            <div>
              <h3 className="text-[10px] font-mono text-textSecondary tracking-widest mb-3 flex items-center justify-between">
                <span>CDM {selectedCdmIndex + 1} OF {cdms.length}</span>
                <span className="text-textPrimary bg-background/50 px-2 py-0.5 rounded border border-border/50 shadow-inner">{currentCdm.c_object_type}</span>
              </h3>
              
              <div className="space-y-2">
                <div className="p-3 border border-border/30 rounded-xl bg-background/40 flex justify-between items-center backdrop-blur-sm">
                  <span className="text-[10px] text-textSecondary font-mono tracking-wider">RECORDED RISK</span>
                  <span className="text-lg text-textPrimary font-mono">{formatRiskPct(currentCdm.risk)}</span>
                </div>
                <div className="p-3 border border-accent/30 rounded-xl bg-accent/5 flex justify-between items-center backdrop-blur-sm shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]">
                  <span className="text-[10px] text-accent font-mono tracking-wider">PREDICTED RISK</span>
                  <span className="text-lg text-accent font-mono drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">{formatRiskPct(currentCdm.predicted_risk)}</span>
                </div>
                <div className="p-3 border border-border/30 rounded-xl bg-background/40 flex justify-between items-center backdrop-blur-sm">
                  <span className="text-[10px] text-textSecondary font-mono tracking-wider">RELATIVE SPEED</span>
                  <span className="text-sm text-info font-mono">{currentCdm.relative_speed} <span className="text-[10px] text-textSecondary">m/s</span></span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border/30">
              <h3 className="text-[10px] font-mono tracking-widest text-textSecondary mb-3">STATE VECTORS (RTN)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 p-3 bg-background/40 rounded-xl border border-border/30 backdrop-blur-sm">
                  <div className="text-[9px] text-textSecondary font-mono tracking-widest border-b border-border/30 pb-1.5 mb-2">POSITION (m)</div>
                  <div className="font-mono text-[11px] space-y-2">
                    <div className="flex justify-between"><span className="text-accent/70">R</span> <span className="text-textPrimary">{currentCdm.relative_position_r}</span></div>
                    <div className="flex justify-between"><span className="text-accent/70">T</span> <span className="text-textPrimary">{currentCdm.relative_position_t}</span></div>
                    <div className="flex justify-between"><span className="text-accent/70">N</span> <span className="text-textPrimary">{currentCdm.relative_position_n}</span></div>
                  </div>
                </div>
                <div className="space-y-2 p-3 bg-background/40 rounded-xl border border-border/30 backdrop-blur-sm">
                  <div className="text-[9px] text-textSecondary font-mono tracking-widest border-b border-border/30 pb-1.5 mb-2">VELOCITY (m/s)</div>
                  <div className="font-mono text-[11px] space-y-2">
                    <div className="flex justify-between"><span className="text-info/70">R</span> <span className="text-textPrimary">{currentCdm.relative_velocity_r}</span></div>
                    <div className="flex justify-between"><span className="text-info/70">T</span> <span className="text-textPrimary">{currentCdm.relative_velocity_t}</span></div>
                    <div className="flex justify-between"><span className="text-info/70">N</span> <span className="text-textPrimary">{currentCdm.relative_velocity_n}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
