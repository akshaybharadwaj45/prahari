export function formatRiskPct(logRisk: number | null | undefined): string {
  if (logRisk === null || logRisk === undefined) return 'N/A';
  return logRisk.toFixed(3);
}

export function getRiskBand(logRisk: number): string {
  const thresholdStr = localStorage.getItem('prahari_threshold') || '-4.0';
  const threshold = parseFloat(thresholdStr);
  
  // Directly tied to the user's calibrated threshold:
  // If threshold = -6.0: CRITICAL >= -6.0, HIGH >= -7.0, ELEVATED >= -8.0, LOW < -8.0
  // If threshold = -4.0: CRITICAL >= -4.0, HIGH >= -5.0, ELEVATED >= -6.0, LOW < -6.0
  if (logRisk >= threshold) return 'CRITICAL';
  if (logRisk >= threshold - 1.0) return 'HIGH';
  if (logRisk >= threshold - 2.0) return 'ELEVATED';
  return 'LOW';
}
