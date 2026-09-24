import { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Html, Trail, Float, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

interface EncounterSceneProps {
  cdms: any[];
  selectedCdmIndex: number;
  cameraMode?: 'free' | 'follow-primary' | 'follow-secondary';
  recenterTick?: number;
}

function CameraController({ mode, targetPos, recenterTick }: { mode: string, targetPos: THREE.Vector3, recenterTick?: number }) {
  const { controls, camera } = useThree();
  
  useFrame(() => {
    if (mode === 'follow-primary' || mode === 'follow-secondary') {
      const lookAtTarget = targetPos.clone();
      if (controls) {
        (controls as any).target.lerp(lookAtTarget, 0.1);
        (controls as any).update();
      }
    }
  });

  useEffect(() => {
    if (recenterTick && recenterTick > 0 && controls) {
      (controls as any).target.set(0, 0, 0);
      camera.position.set(30, 20, 40);
      (controls as any).update();
    }
  }, [recenterTick, controls, camera]);

  return null;
}

const ORBIT_RADIUS = 100;
const ARC_LENGTH = Math.PI / 4; 

function getPositionOnArc(radius: number, angle: number, tiltAxis: THREE.Vector3, tiltAngle: number) {
  // Base position on XZ plane, centered at (0, 0, -radius)
  // At angle 0, pos is (0, 0, 0)
  const pos = new THREE.Vector3(
    Math.sin(angle) * radius,
    0,
    Math.cos(angle) * radius - radius 
  );
  // Apply tilt around tiltAxis
  pos.applyAxisAngle(tiltAxis, tiltAngle);
  return pos;
}

export default function EncounterScene({ cdms, selectedCdmIndex, cameraMode = 'free', recenterTick = 0 }: EncounterSceneProps) {
  // We sort CDMs by time_to_tca (descending, so it goes from large positive to 0)
  const sortedCdms = useMemo(() => {
    return [...cdms].sort((a, b) => b.time_to_tca - a.time_to_tca);
  }, [cdms]);

  const currentCdm = sortedCdms[selectedCdmIndex] || sortedCdms[0];
  
  // Find max time to scale the angles
  const maxTime = useMemo(() => {
    if (!sortedCdms.length) return 1;
    return Math.max(...sortedCdms.map(c => Math.abs(c.time_to_tca)));
  }, [sortedCdms]);

  // Generate the static orbital arc curves for visual reference
  const primaryArc = useMemo(() => {
    const pts = [];
    for (let i = -ARC_LENGTH; i <= ARC_LENGTH; i += 0.05) {
      pts.push(getPositionOnArc(ORBIT_RADIUS, i, new THREE.Vector3(1,0,0), 0));
    }
    return pts;
  }, []);

  const { primaryPos, secondaryPos, secondaryArc } = useMemo(() => {
    const pPos = new THREE.Vector3(0,0,0);
    const sPos = new THREE.Vector3(10,10,10);
    const sArc = [];
    
    if (!currentCdm) {
      for (let i = -ARC_LENGTH; i <= ARC_LENGTH; i += 0.05) {
        sArc.push(getPositionOnArc(ORBIT_RADIUS, i, new THREE.Vector3(0,0,1), Math.PI/6));
      }
      return { primaryPos: pPos, secondaryPos: sPos, secondaryArc: sArc };
    }
    
    const angle = (currentCdm.time_to_tca / maxTime) * (ARC_LENGTH / 2);
    pPos.copy(getPositionOnArc(ORBIT_RADIUS, -angle, new THREE.Vector3(1,0,0), 0));
    
    const tiltAxis = new THREE.Vector3(0, 0, 1).normalize();
    sPos.copy(getPositionOnArc(ORBIT_RADIUS, -angle, tiltAxis, Math.PI / 6));
    
    const latestCdm = sortedCdms[sortedCdms.length - 1]; // The closest prediction to TCA
    
    const visualMiss = (latestCdm.miss_distance / 1000) * 2;
    const relVec = new THREE.Vector3(
      latestCdm.relative_position_t, 
      latestCdm.relative_position_r, 
      latestCdm.relative_position_n
    ).normalize().multiplyScalar(visualMiss);
    
    if (relVec.lengthSq() === 0) relVec.set(0, visualMiss, 0);
    
    sPos.add(relVec);

    // Build arc with the exact same offset so the satellite perfectly follows it
    for (let i = -ARC_LENGTH; i <= ARC_LENGTH; i += 0.05) {
      const pt = getPositionOnArc(ORBIT_RADIUS, i, tiltAxis, Math.PI / 6);
      pt.add(relVec);
      sArc.push(pt);
    }
    
    return { primaryPos: pPos, secondaryPos: sPos, secondaryArc: sArc };
  }, [currentCdm, maxTime]);

  return (
    <Canvas camera={{ position: [30, 20, 40], fov: 45 }} gl={{ preserveDrawingBuffer: true }}>
      <CameraController mode={cameraMode} targetPos={cameraMode === 'follow-primary' ? primaryPos : secondaryPos} recenterTick={recenterTick} />
      
      <ambientLight intensity={0.2} />
      <directionalLight position={[20, 30, 20]} intensity={1.5} color="#ffffff" />
      <pointLight position={[0, 0, 0]} intensity={2} color="#a3e635" distance={50} />
      
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      {/* Realistic Earth */}
      <mesh position={[0, 0, -100]}>
        <sphereGeometry args={[80, 64, 64]} />
        <meshStandardMaterial 
          color="#0ea5e9" 
          emissive="#020617" 
          emissiveIntensity={0.5} 
          roughness={0.7} 
          metalness={0.1} 
          transparent 
          opacity={0.85} 
        />
      </mesh>
      
      {/* Earth Atmosphere Glow */}
      <mesh position={[0, 0, -100]}>
        <sphereGeometry args={[82, 64, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.1} side={THREE.BackSide} />
      </mesh>
      
      <OrbitControls makeDefault />

      {/* Orbital Tracks */}
      <Line points={primaryArc} color="#2a303a" lineWidth={1} transparent opacity={0.5} />
      <Line points={secondaryArc} color="#2a303a" lineWidth={1} transparent opacity={0.5} />

      {/* Primary Spacecraft with Covariance Ellipsoid */}
      <SpacecraftModel 
        position={primaryPos} 
        color="#a3e635" 
        label="PRIMARY" 
      />
      
      {/* Secondary Spacecraft with Covariance Ellipsoid */}
      <SpacecraftModel 
        position={secondaryPos} 
        color="#f87171" 
        label={`SECONDARY (${currentCdm?.miss_distance}m)`} 
      />

      {/* Connection Line representing current relative distance */}
      <Line 
        points={[primaryPos, secondaryPos]} 
        color="#fbbf24" 
        lineWidth={1.5} 
        dashed 
        dashScale={5} 
        transparent 
        opacity={0.8} 
      />

      {/* TCA Origin Marker */}
      <mesh position={[0,0,0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
}

function SpacecraftModel({ position, color, label }: { position: THREE.Vector3, color: string, label: string }) {
  const ref = useRef<THREE.Group>(null);
  
  // Make the spacecraft subtly float and point forward along its tangent (roughly)
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      ref.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      <Trail width={1.5} color={color} length={10} decay={1} attenuation={(t) => t * t}>
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <group ref={ref}>
            <mesh>
              <boxGeometry args={[1, 1, 1.5]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[1.5, 0, 0]}>
              <boxGeometry args={[2, 0.05, 0.8]} />
              <meshStandardMaterial color="#111827" metalness={1} roughness={0.2} />
            </mesh>
            <mesh position={[-1.5, 0, 0]}>
              <boxGeometry args={[2, 0.05, 0.8]} />
              <meshStandardMaterial color="#111827" metalness={1} roughness={0.2} />
            </mesh>
          </group>
        </Float>
      </Trail>
      <Html distanceFactor={40} position={[0, 2, 0]} center zIndexRange={[100, 0]}>
        <div className="text-[10px] font-mono text-textPrimary bg-background/80 px-2 py-1 border border-border rounded shadow-panel whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
            {label}
          </div>
        </div>
      </Html>
    </group>
  );
}
