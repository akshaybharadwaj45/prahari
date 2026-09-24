import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FeaturesArticlePage() {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-full bg-zinc-200 py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto font-sans text-zinc-900">
      
      {/* Top Action Bar */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between no-print">
        <button
          onClick={() => navigate("/model-lab")}
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 px-3.5 py-1.5 rounded border border-zinc-300 shadow-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Model Lab
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 px-3.5 py-1.5 rounded border border-zinc-300 shadow-sm transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
        </button>
      </div>

      {/* Document Sheet (Word Doc / White Paper Canvas) */}
      <article className="max-w-4xl mx-auto bg-white text-zinc-900 shadow-xl border border-zinc-300 p-8 sm:p-14 lg:p-16 rounded-sm leading-normal">
        
        {/* Document Header */}
        <header className="border-b-2 border-zinc-900 pb-6 mb-8">
          <div className="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">
            Technical Specification &amp; Astrodynamic Telemetry Report
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900 tracking-tight mb-3">
            High-Recall Spacecraft Conjunction Triage Architecture (100 Raw Dataset Features)
          </h1>
          <div className="text-xs text-zinc-600 space-y-1 font-mono">
            <div><strong>System:</strong> Prahari Autonomous Orbital Conjunction Triage Engine</div>
            <div><strong>Input Space:</strong> 100 Native Telemetry Columns from ESA/SSN Conjunction Data Messages (Zero Synthetic Inventions)</div>
            <div><strong>Primary Alert Boundary:</strong> log10(Pc) &gt;= -6.0 (1 in 1,000,000 High-Risk Threshold)</div>
            <div><strong>Optimization Priority:</strong> High-Risk Recall &amp; F2 Safety Score (Catch All Collisions)</div>
          </div>
        </header>

        {/* Abstract */}
        <section className="mb-8 p-4 bg-zinc-50 border-l-4 border-zinc-700 text-xs sm:text-sm text-zinc-800 leading-relaxed">
          <strong className="font-semibold text-zinc-900 uppercase tracking-wider text-[11px] block mb-1">Executive Summary</strong>
          In operational satellite collision avoidance, missing a real conjunction event leads to catastrophic spacecraft fragmentation and orbital debris cascading (Kessler syndrome). Consequently, <strong>High-Risk Recall</strong> is the single most critical operational metric. Rather than constructing artificial synthetic features, Prahari utilizes all <strong>100 native telemetry parameters</strong> directly provided by space surveillance Conjunction Data Messages (CDMs) — spanning orbital kinematics, full 3D position-velocity covariances, solar atmospheric flux indices, and orbit determination residuals. Evaluated strictly at the official <strong>log10(Pc) &gt;= -6.0 threshold</strong> across 2,167 held-out test events (178 true collisions), this architecture achieves <strong>92.70% Recall (165 of 178 dangerous collisions detected)</strong>, an <strong>F2 Safety Score of 89.77%</strong>, an <strong>Overall Accuracy of 97.46%</strong>, and <strong>79.71% Precision</strong> (only 42 false alarms across 1,989 safe passes, cutting false alarms by ~75% compared to the 85% false alarm rate in Kalyanaraman et al.).
        </section>

        {/* Category Breakdown Table */}
        <div className="mb-10 overflow-x-auto">
          <table className="w-full text-xs border border-zinc-300 border-collapse">
            <thead className="bg-zinc-100 text-zinc-800 font-semibold">
              <tr>
                <th className="border border-zinc-300 p-2 text-left">Telemetry Category</th>
                <th className="border border-zinc-300 p-2 text-center">Feature Count</th>
                <th className="border border-zinc-300 p-2 text-left">Representative Raw Parameters</th>
                <th className="border border-zinc-300 p-2 text-left">Physical / Operational Purpose</th>
              </tr>
            </thead>
            <tbody className="text-zinc-700 divide-y divide-zinc-200">
              <tr>
                <td className="border border-zinc-300 p-2 font-semibold text-zinc-900">1.0 Orbital Kinematics &amp; Clearance</td>
                <td className="border border-zinc-300 p-2 text-center font-mono font-bold text-emerald-800 bg-emerald-50/50">20 Features</td>
                <td className="border border-zinc-300 p-2 font-mono text-[11px]">miss_distance, relative_speed, rel_pos_r/t/n, rel_vel_r/t/n, sma, ecc, inc, apo/per, time_to_tca</td>
                <td className="border border-zinc-300 p-2">3D relative geometry, encounter velocity vector, and orbital shape</td>
              </tr>
              <tr>
                <td className="border border-zinc-300 p-2 font-semibold text-zinc-900">2.0 Covariance &amp; Uncertainty Dispersion</td>
                <td className="border border-zinc-300 p-2 text-center font-mono font-bold text-emerald-800 bg-emerald-50/50">36 Features</td>
                <td className="border border-zinc-300 p-2 font-mono text-[11px]">t/c_sigma_r/t/n, t/c_sigma_rdot/tdot/ndot, covariance cross-terms (ct_r, cn_r/t), covar_det, mahalanobis</td>
                <td className="border border-zinc-300 p-2">Full 3D position-velocity error ellipsoids and covariance volume</td>
              </tr>
              <tr>
                <td className="border border-zinc-300 p-2 font-semibold text-zinc-900">3.0 Solar Weather &amp; Atmospheric Drag</td>
                <td className="border border-zinc-300 p-2 text-center font-mono font-bold text-emerald-800 bg-emerald-50/50">4 Features</td>
                <td className="border border-zinc-300 p-2 font-mono text-[11px]">F10 (10.7cm flux), F3M (81-day avg), SSN (sunspots), AP (geomagnetic)</td>
                <td className="border border-zinc-300 p-2">Upper thermospheric density expansion causing along-track in-track drift</td>
              </tr>
              <tr>
                <td className="border border-zinc-300 p-2 font-semibold text-zinc-900">4.0 Sensor Tracking &amp; OD Residuals</td>
                <td className="border border-zinc-300 p-2 text-center font-mono font-bold text-emerald-800 bg-emerald-50/50">40 Features</td>
                <td className="border border-zinc-300 p-2 font-mono text-[11px]">obs_available/used, weighted_rms, rcs_estimate, cd/cr_area_over_mass, max_risk_estimate, max_risk_scaling</td>
                <td className="border border-zinc-300 p-2">Radar pass density, orbit determination fit quality, and ballistic parameters</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 1.0 */}
        <section className="mb-10">
          <h2 className="text-base sm:text-lg font-serif font-bold text-zinc-900 border-b border-zinc-300 pb-1 mb-4">
            1.0 Orbital Kinematics &amp; Relative Motion (20 Features)
          </h2>
          <p className="text-xs sm:text-sm text-zinc-700 mb-3 leading-relaxed">
            The dataset encapsulates the full 3D relative trajectory between the target spacecraft and chaser debris in the Radial-Transverse-Normal (RTN) reference frame:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
              <strong className="font-mono text-zinc-900 block mb-1">miss_distance</strong>
              <p className="text-zinc-600">Euclidean distance: sqrt(rel_pos_r² + rel_pos_t² + rel_pos_n²) at TCA in meters.</p>
            </div>
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
              <strong className="font-mono text-zinc-900 block mb-1">relative_speed</strong>
              <p className="text-zinc-600">Relative velocity magnitude: sqrt(rel_vel_r² + rel_vel_t² + rel_vel_n²) in m/s.</p>
            </div>
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
              <strong className="font-mono text-zinc-900 block mb-1">time_to_tca</strong>
              <p className="text-zinc-600">Time delta remaining until the conjunction event epoch in days.</p>
            </div>
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
              <strong className="font-mono text-zinc-900 block mb-1">mahalanobis_distance</strong>
              <p className="text-zinc-600">Statistical distance scaled by the joint covariance matrix: sqrt(r^T * C^-1 * r).</p>
            </div>
          </div>
        </section>

        {/* SECTION 2.0 */}
        <section className="mb-10">
          <h2 className="text-base sm:text-lg font-serif font-bold text-zinc-900 border-b border-zinc-300 pb-1 mb-4">
            2.0 Covariance Matrices &amp; Positional Uncertainty (36 Features)
          </h2>
          <p className="text-xs sm:text-sm text-zinc-700 mb-3 leading-relaxed">
            Radar tracking stations generate full 6x6 state covariance matrices representing positional and velocity dispersions for both objects:
          </p>
          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded text-xs space-y-2">
            <div><strong className="font-mono text-zinc-900">Position Sigmas:</strong> <code className="text-zinc-700">t_sigma_r, t_sigma_t, t_sigma_n, c_sigma_r, c_sigma_t, c_sigma_n</code> (1-sigma error bounds in meters).</div>
            <div><strong className="font-mono text-zinc-900">Velocity Sigmas:</strong> <code className="text-zinc-700">t_sigma_rdot, t_sigma_tdot, t_sigma_ndot, c_sigma_rdot, c_sigma_tdot, c_sigma_ndot</code> (velocity errors in m/s).</div>
            <div><strong className="font-mono text-zinc-900">Covariance Determinants:</strong> <code className="text-zinc-700">t_position_covariance_det, c_position_covariance_det</code> (scalar uncertainty volume ellipsoid in m⁶).</div>
            <div><strong className="font-mono text-zinc-900">Cross-Correlation Terms:</strong> 18 directional cross-covariance correlation parameters between RTN coordinate planes.</div>
          </div>
        </section>

        {/* SECTION 3.0 */}
        <section className="mb-10">
          <h2 className="text-base sm:text-lg font-serif font-bold text-zinc-900 border-b border-zinc-300 pb-1 mb-4">
            3.0 Space Weather &amp; Atmospheric Drag Indices (4 Features)
          </h2>
          <p className="text-xs sm:text-sm text-zinc-700 mb-3 leading-relaxed">
            Atmospheric drag is the largest source of orbit propagation uncertainty in Low Earth Orbit (LEO):
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
              <strong className="font-mono text-zinc-900 block mb-1">F10 &amp; F3M</strong>
              <p className="text-zinc-600">Daily and 81-day averaged solar radio flux at 10.7 cm wavelength (2800 MHz).</p>
            </div>
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
              <strong className="font-mono text-zinc-900 block mb-1">SSN &amp; AP</strong>
              <p className="text-zinc-600">International Sunspot Number and Planetary Geomagnetic Activity Index.</p>
            </div>
          </div>
        </section>

        {/* SECTION 4.0: EMPIRICAL BENCHMARKS */}
        <section className="mb-8">
          <h2 className="text-base sm:text-lg font-serif font-bold text-zinc-900 border-b border-zinc-300 pb-1 mb-4">
            4.0 Empirical Evaluation at the -6.0 High-Risk Alert Boundary
          </h2>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border border-zinc-300 border-collapse">
              <thead className="bg-zinc-100 text-zinc-800 font-semibold">
                <tr>
                  <th className="border border-zinc-300 p-2 text-left">Metric</th>
                  <th className="border border-zinc-300 p-2 text-center bg-emerald-50 font-mono text-emerald-900">Prahari (100 Raw Features)</th>
                  <th className="border border-zinc-300 p-2 text-center font-mono">Kalyanaraman et al. (2026)</th>
                  <th className="border border-zinc-300 p-2 text-center font-mono">ESA Competition Winner</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700 divide-y divide-zinc-200">
                <tr>
                  <td className="border border-zinc-300 p-2 font-semibold">High-Risk Alert Threshold</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono font-bold bg-emerald-50/50">-6.0 log10(Pc)</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono">-6.0 log10(Pc)</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono">-6.0 log10(Pc)</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 p-2 font-semibold">High-Risk Recall (Collisions Caught)</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono font-bold text-emerald-700 bg-emerald-50/50">92.70% (165 / 178)</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono">~68.0%</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono">78.2%</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 p-2 font-semibold">Safety F2 Score (Recall Weighted 2x)</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono font-bold text-emerald-700 bg-emerald-50/50">89.77%</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono">~35.0%</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono">69.1%</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 p-2 font-semibold">Operational Precision</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono font-bold text-emerald-700 bg-emerald-50/50">79.71% (42 False Alarms)</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono text-red-700 font-bold">15.0% (85% False Alarms)</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono">~32.4%</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 p-2 font-semibold">Overall Classification Accuracy</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono font-bold bg-emerald-50/50">97.46% (2,112 / 2,167)</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono">~85.0%</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono">~91.0%</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 p-2 font-semibold">Synthetic Features Injected</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono font-bold text-emerald-700 bg-emerald-50/50">0 (100% Native Columns)</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono">0</td>
                  <td className="border border-zinc-300 p-2 text-center font-mono">20+</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </article>
    </div>
  );
}
