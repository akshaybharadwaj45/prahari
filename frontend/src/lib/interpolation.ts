import type { CdmData } from '../types/cdm';
import * as THREE from 'three';

// Cubic Hermite Spline interpolation
// The trajectory is normalized so it fits well in the view, since this is for analytical visualization,
// NOT a true 1:1 physical propagator (which would span millions of meters and be unviewable).

export function generateTrajectory(cdms: CdmData[], numPoints: number = 200) {
  if (!cdms || cdms.length === 0) return { trajectory: [], points: [], scale: 1, velScale: 1 };

  // Sort CDMs by time to TCA (descending because time to tca goes down to 0)
  // Let t_i = -time_to_tca
  const sorted = [...cdms].sort((a, b) => b.time_to_tca - a.time_to_tca);
  
  // Create points in ThreeJS coordinate space
  // Map RTN to XYZ. Let's say: R -> Y, T -> X, N -> Z
  // We need to normalize positions and velocities so they look good in a 3D bounding box
  
  // Find max bounds for normalization
  let maxPos = 0;
  sorted.forEach(c => {
    maxPos = Math.max(maxPos, Math.abs(c.relative_position_r), Math.abs(c.relative_position_t), Math.abs(c.relative_position_n));
  });
  
  const scale = 50 / (maxPos || 1); // Fit within a 50x50x50 box roughly
  const velScale = scale * 86400; // time_to_tca is in days, so velocity (m/s) * 86400 = m/day

  const points: { t: number; pos: THREE.Vector3; vel: THREE.Vector3; originalCdm?: CdmData }[] = sorted.map(c => ({
    t: -c.time_to_tca,
    pos: new THREE.Vector3(c.relative_position_t * scale, c.relative_position_r * scale, c.relative_position_n * scale),
    vel: new THREE.Vector3(c.relative_velocity_t * velScale, c.relative_velocity_r * velScale, c.relative_velocity_n * velScale),
    originalCdm: c
  }));

  // If there's only 1 point, we can't interpolate much, just return it
  if (points.length === 1) {
    return { trajectory: [points[0].pos], points, scale, velScale };
  }

  const trajectory: THREE.Vector3[] = [];
  const minT = points[0].t;
  const maxT = points[points.length - 1].t;
  
  // Interpolate along the curve
  for (let i = 0; i <= numPoints; i++) {
    const t = minT + (maxT - minT) * (i / numPoints);
    
    // Find segment
    let idx = 0;
    while (idx < points.length - 2 && points[idx + 1].t < t) {
      idx++;
    }
    
    const p0 = points[idx];
    const p1 = points[idx + 1];
    
    const dt = p1.t - p0.t;
    if (dt === 0) {
      trajectory.push(p0.pos.clone());
      continue;
    }
    
    const u = (t - p0.t) / dt; // normalized time 0 to 1
    const u2 = u * u;
    const u3 = u2 * u;
    
    // Hermite basis functions
    const h00 = 2 * u3 - 3 * u2 + 1;
    const h10 = u3 - 2 * u2 + u;
    const h01 = -2 * u3 + 3 * u2;
    const h11 = u3 - u2;
    
    const x = h00 * p0.pos.x + h10 * dt * p0.vel.x + h01 * p1.pos.x + h11 * dt * p1.vel.x;
    const y = h00 * p0.pos.y + h10 * dt * p0.vel.y + h01 * p1.pos.y + h11 * dt * p1.vel.y;
    const z = h00 * p0.pos.z + h10 * dt * p0.vel.z + h01 * p1.pos.z + h11 * dt * p1.vel.z;
    
    trajectory.push(new THREE.Vector3(x, y, z));
  }
  
  // Add TCA if maxT < 0
  // Wait, if maxT < 0, it means it doesn't reach TCA. We can extrapolate to TCA if needed.
  // But we want to strictly draw the CDM derived states.
  
  return { trajectory, points, scale, velScale };
}
