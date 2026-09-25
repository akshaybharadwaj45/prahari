import { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { 
  Filter, ShieldAlert, ArrowRight, X, Satellite, Globe, Crosshair
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const EARTH_RADIUS = 100;

export interface SpaceObject {
  id: string;
  noradId: number;
  name: string;
  type: 'PAYLOAD' | 'SPACE_STATION' | 'ROCKET_BODY' | 'DEBRIS';
  operator: string;
  altitudeKm: number;
  inclinationDeg: number;
  velocityKmS: number;
  lat: number;
  lng: number;
  status: 'NOMINAL' | 'ELEVATED' | 'CRITICAL_HAZARD';
  missDistanceM?: number;
  associatedEventId?: string;
  color: string;
}

const CATALOG_OBJECTS: SpaceObject[] = [
  {
    id: 'iss',
    noradId: 25544,
    name: 'INTERNATIONAL SPACE STATION (ISS)',
    type: 'SPACE_STATION',
    operator: 'NASA / ESA / JAXA / CSA / Roscosmos',
    altitudeKm: 418,
    inclinationDeg: 51.6,
    velocityKmS: 7.66,
    lat: 28.5728,
    lng: -80.6490,
    status: 'NOMINAL',
    color: '#00f0ff',
  },
  {
    id: 'tiangong',
    noradId: 48274,
    name: 'TIANGONG SPACE STATION (CSS)',
    type: 'SPACE_STATION',
    operator: 'CMSA (China Manned Space)',
    altitudeKm: 389,
    inclinationDeg: 41.5,
    velocityKmS: 7.68,
    lat: 31.2304,
    lng: 121.4737,
    status: 'NOMINAL',
    color: '#38bdf8',
  },
  {
    id: 'hst',
    noradId: 20580,
    name: 'HUBBLE SPACE TELESCOPE (HST)',
    type: 'PAYLOAD',
    operator: 'NASA / STScI / ESA',
    altitudeKm: 535,
    inclinationDeg: 28.5,
    velocityKmS: 7.59,
    lat: 25.7617,
    lng: -80.1918,
    status: 'NOMINAL',
    color: '#38bdf8',
  },
  {
    id: 'starlink-4182',
    noradId: 52140,
    name: 'STARLINK-4182 (V1.5)',
    type: 'PAYLOAD',
    operator: 'SpaceX',
    altitudeKm: 550,
    inclinationDeg: 53.0,
    velocityKmS: 7.58,
    lat: 37.7749,
    lng: -122.4194,
    status: 'CRITICAL_HAZARD',
    missDistanceM: 38.5,
    associatedEventId: '1259',
    color: '#f43f5e',
  },
  {
    id: 'starlink-2201',
    noradId: 47932,
    name: 'STARLINK-2201 (V1.0)',
    type: 'PAYLOAD',
    operator: 'SpaceX',
    altitudeKm: 545,
    inclinationDeg: 53.0,
    velocityKmS: 7.59,
    lat: 51.5074,
    lng: -0.1278,
    status: 'NOMINAL',
    color: '#06b6d4',
  },
  {
    id: 'sentinel-2a',
    noradId: 40697,
    name: 'SENTINEL-2A (COPERNICUS)',
    type: 'PAYLOAD',
    operator: 'ESA (European Space Agency)',
    altitudeKm: 786,
    inclinationDeg: 98.6,
    velocityKmS: 7.46,
    lat: 48.8566,
    lng: 2.3522,
    status: 'NOMINAL',
    color: '#10b981',
  },
  {
    id: 'noaa-20',
    noradId: 43013,
    name: 'NOAA-20 (JPSS-1 WEATHER)',
    type: 'PAYLOAD',
    operator: 'NOAA / NASA',
    altitudeKm: 824,
    inclinationDeg: 98.7,
    velocityKmS: 7.44,
    lat: 38.9072,
    lng: -77.0369,
    status: 'NOMINAL',
    color: '#10b981',
  },
  {
    id: 'terra-eos',
    noradId: 25994,
    name: 'TERRA (EOS AM-1)',
    type: 'PAYLOAD',
    operator: 'NASA Earth Science',
    altitudeKm: 705,
    inclinationDeg: 98.2,
    velocityKmS: 7.50,
    lat: 34.0522,
    lng: -118.2437,
    status: 'NOMINAL',
    color: '#34d399',
  },
  {
    id: 'oneweb-0142',
    noradId: 47682,
    name: 'ONEWEB-0142',
    type: 'PAYLOAD',
    operator: 'OneWeb / Eutelsat',
    altitudeKm: 1200,
    inclinationDeg: 87.4,
    velocityKmS: 7.25,
    lat: 55.7558,
    lng: 37.6173,
    status: 'NOMINAL',
    color: '#06b6d4',
  },
  {
    id: 'chandrayaan-relay',
    noradId: 57320,
    name: 'CHANDRAYAAN RELAY LEO-SIM',
    type: 'PAYLOAD',
    operator: 'ISRO (Indian Space Research Organisation)',
    altitudeKm: 650,
    inclinationDeg: 45.0,
    velocityKmS: 7.53,
    lat: 13.0827,
    lng: 80.2707,
    status: 'NOMINAL',
    color: '#38bdf8',
  },
  {
    id: 'falcon9-rb-1082',
    noradId: 49215,
    name: 'FALCON 9 R/B (STAGE 2)',
    type: 'ROCKET_BODY',
    operator: 'SpaceX',
    altitudeKm: 610,
    inclinationDeg: 53.2,
    velocityKmS: 7.55,
    lat: 33.9425,
    lng: -118.4081,
    status: 'NOMINAL',
    color: '#eab308',
  },
  {
    id: 'cz-5b-rb',
    noradId: 48275,
    name: 'CHANGZHENG-5B R/B CORE',
    type: 'ROCKET_BODY',
    operator: 'CALT (China)',
    altitudeKm: 375,
    inclinationDeg: 41.5,
    velocityKmS: 7.69,
    lat: 22.3193,
    lng: 114.1694,
    status: 'ELEVATED',
    missDistanceM: 85.0,
    associatedEventId: '852',
    color: '#f59e0b',
  },
  {
    id: 'cosmos-2251-deb',
    noradId: 34120,
    name: 'COSMOS 2251 DEBRIS',
    type: 'DEBRIS',
    operator: 'Iridium-Cosmos Collision',
    altitudeKm: 790,
    inclinationDeg: 74.0,
    velocityKmS: 7.45,
    lat: 37.7749,
    lng: -122.4194,
    status: 'CRITICAL_HAZARD',
    missDistanceM: 19.5,
    associatedEventId: '1259',
    color: '#f43f5e',
  },
  {
    id: 'fengyun-1c-deb',
    noradId: 29810,
    name: 'FENGYUN-1C DEBRIS',
    type: 'DEBRIS',
    operator: 'Fengyun ASAT Intercept',
    altitudeKm: 860,
    inclinationDeg: 98.8,
    velocityKmS: 7.42,
    lat: 12.9716,
    lng: 77.5946,
    status: 'ELEVATED',
    missDistanceM: 64.0,
    associatedEventId: '852',
    color: '#f59e0b',
  }
];

// ── REAL-TIME SOLAR POSITION CALCULATION (UTC ACCURATE) ──────────────────────
function calculateSunDirection(date: Date = new Date()): THREE.Vector3 {
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  
  // At 12:00 UTC, Sun is at Prime Meridian
  const thetaSun = Math.PI - (utcHours - 12.0) * (Math.PI / 12.0);
  
  // Solar declination (Earth axial tilt of 23.44°)
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const sunDeclinationDeg = 23.44 * Math.sin(((360 / 365.25) * (dayOfYear - 80) * Math.PI) / 180);
  const sunLatRad = (sunDeclinationDeg * Math.PI) / 180.0;
  
  const x = -Math.cos(sunLatRad) * Math.cos(thetaSun);
  const y = Math.sin(sunLatRad);
  const z = Math.cos(sunLatRad) * Math.sin(thetaSun);
  
  return new THREE.Vector3(x, y, z).normalize();
}

// ── HIGH-DETAIL 3D SATELLITE GEOMETRIES (ENLARGED & HIGHLIGHTED) ──────────────

// 1. Realistic Satellite 3D Geometry (Gold Body + Dual Cyan/Blue Solar Arrays + Dish)
function createSatellite3DGeometry(): THREE.BufferGeometry {
  const bus = new THREE.BoxGeometry(0.8, 0.8, 1.0);
  const leftWing = new THREE.BoxGeometry(1.6, 0.05, 0.7).translate(-1.3, 0, 0);
  const rightWing = new THREE.BoxGeometry(1.6, 0.05, 0.7).translate(1.3, 0, 0);
  const dish = new THREE.ConeGeometry(0.35, 0.25, 12).translate(0, -0.55, 0);
  
  return BufferGeometryUtils.mergeGeometries([bus, leftWing, rightWing, dish]);
}

// 2. Realistic Rocket Stage 3D Geometry (Cylinder + Interstage + Nozzle)
function createRocketStage3DGeometry(): THREE.BufferGeometry {
  const stage = new THREE.CylinderGeometry(0.4, 0.45, 2.2, 12);
  const interstage = new THREE.ConeGeometry(0.4, 0.45, 12).translate(0, 1.3, 0);
  const nozzle = new THREE.ConeGeometry(0.32, 0.38, 12).translate(0, -1.3, 0);

  return BufferGeometryUtils.mergeGeometries([stage, interstage, nozzle]);
}

// 3. Realistic Space Debris Fragment 3D Geometry
function createDebrisFragment3DGeometry(): THREE.BufferGeometry {
  return new THREE.DodecahedronGeometry(0.55, 0);
}

// ── 15,000 REALISTIC PHYSICAL 3D SPACECRAFT SWARM (BIGGER & CRISP) ────────────
function Full15000RealisticSwarm({
  showSatellites,
  showRocketBodies,
  showDebris,
  speedMultiplier,
  isPlaying,
}: {
  showSatellites: boolean;
  showRocketBodies: boolean;
  showDebris: boolean;
  speedMultiplier: number;
  isPlaying: boolean;
}) {
  const satMeshRef = useRef<THREE.InstancedMesh>(null);
  const rbMeshRef  = useRef<THREE.InstancedMesh>(null);
  const debMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const satCount = 4500;
  const rbCount  = 1200;
  const debCount = 4800;

  // 3D Merged Geometries
  const satGeom = useMemo(() => createSatellite3DGeometry(), []);
  const rbGeom  = useMemo(() => createRocketStage3DGeometry(), []);
  const debGeom = useMemo(() => createDebrisFragment3DGeometry(), []);

  const satData = useMemo(() => {
    return Array.from({ length: satCount }).map((_, i) => {
      const inc = i % 2 === 0 ? 53.0 : 97.8;
      const incRad = (inc * Math.PI) / 180;
      const raanRad = Math.random() * Math.PI * 2;
      const radius = EARTH_RADIUS + 5 + Math.random() * 22;

      const axis = new THREE.Vector3(
        Math.sin(incRad) * Math.sin(raanRad),
        Math.cos(incRad),
        Math.sin(incRad) * Math.cos(raanRad)
      ).normalize();

      return {
        radius,
        speed: 0.0005 + Math.random() * 0.0007,
        axis,
        angle: Math.random() * Math.PI * 2,
        scale: 0.32 + Math.random() * 0.22,
        rotSpeed: (Math.random() - 0.5) * 0.02,
      };
    });
  }, [satCount]);

  const rbData = useMemo(() => {
    return Array.from({ length: rbCount }).map(() => {
      const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      return {
        radius: EARTH_RADIUS + 8 + Math.random() * 32,
        speed: 0.0004 + Math.random() * 0.0008,
        axis,
        angle: Math.random() * Math.PI * 2,
        scale: 0.35 + Math.random() * 0.20,
        rotSpeed: (Math.random() - 0.5) * 0.03,
      };
    });
  }, [rbCount]);

  const debData = useMemo(() => {
    return Array.from({ length: debCount }).map(() => {
      const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      return {
        radius: EARTH_RADIUS + 4 + Math.random() * 45,
        speed: 0.0004 + Math.random() * 0.0010,
        axis,
        angle: Math.random() * Math.PI * 2,
        scale: 0.25 + Math.random() * 0.18,
        rotSpeed: (Math.random() - 0.5) * 0.05,
      };
    });
  }, [debCount]);

  useFrame((_, delta) => {
    const mult = isPlaying ? speedMultiplier : 0;

    if (satMeshRef.current && showSatellites) {
      satData.forEach((sat, i) => {
        sat.angle += sat.speed * mult * (delta * 60);
        dummy.position.set(0, sat.radius, 0);
        dummy.position.applyAxisAngle(sat.axis, sat.angle);
        dummy.rotation.set(sat.angle * 2, sat.angle, sat.rotSpeed * sat.angle);
        dummy.scale.set(sat.scale, sat.scale, sat.scale);
        dummy.updateMatrix();
        satMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      satMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (rbMeshRef.current && showRocketBodies) {
      rbData.forEach((rb, i) => {
        rb.angle += rb.speed * mult * (delta * 60);
        dummy.position.set(0, rb.radius, 0);
        dummy.position.applyAxisAngle(rb.axis, rb.angle);
        dummy.rotation.set(rb.angle, rb.angle * 1.5, 0);
        dummy.scale.set(rb.scale, rb.scale, rb.scale);
        dummy.updateMatrix();
        rbMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      rbMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (debMeshRef.current && showDebris) {
      debData.forEach((deb, i) => {
        deb.angle += deb.speed * mult * (delta * 60);
        dummy.position.set(0, deb.radius, 0);
        dummy.position.applyAxisAngle(deb.axis, deb.angle);
        dummy.rotation.set(deb.angle * 3, deb.angle * 2, deb.angle);
        dummy.scale.set(deb.scale, deb.scale, deb.scale);
        dummy.updateMatrix();
        debMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      debMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Active Satellites (Photovoltaic Cyan/Blue Wings + Gold Bus) */}
      <instancedMesh ref={satMeshRef} args={[satGeom, undefined, satCount]} visible={showSatellites}>
        <meshStandardMaterial color="#00f0ff" emissive="#0284c7" emissiveIntensity={0.4} metalness={0.9} roughness={0.15} />
      </instancedMesh>

      {/* Spent Rocket Bodies (Amber Titanium Stages) */}
      <instancedMesh ref={rbMeshRef} args={[rbGeom, undefined, rbCount]} visible={showRocketBodies}>
        <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.3} metalness={0.85} roughness={0.2} />
      </instancedMesh>

      {/* Space Debris (Faceted Fragments) */}
      <instancedMesh ref={debMeshRef} args={[debGeom, undefined, debCount]} visible={showDebris}>
        <meshStandardMaterial color="#cbd5e1" metalness={0.75} roughness={0.35} />
      </instancedMesh>
    </>
  );
}

// ── NAMED ASSETS LAYER (CLICK TO TARGET & VIEW 3D DETAILS) ─────────────────────
function NamedAssetsInteractiveLayer({
  objects,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  speedMultiplier,
  isPlaying
}: {
  objects: SpaceObject[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (item: SpaceObject) => void;
  onHover: (item: SpaceObject | null) => void;
  speedMultiplier: number;
  isPlaying: boolean;
}) {
  const satState = useMemo(() => {
    return objects.map((item, idx) => {
      const incRad = (item.inclinationDeg * Math.PI) / 180;
      const raanRad = ((idx * 38) * Math.PI) / 180;
      const radius = EARTH_RADIUS + 7 + (item.altitudeKm / 110);

      const axis = new THREE.Vector3(
        Math.sin(incRad) * Math.sin(raanRad),
        Math.cos(incRad),
        Math.sin(incRad) * Math.cos(raanRad)
      ).normalize();

      return {
        item,
        radius,
        speed: (item.velocityKmS / 7.6) * 0.0009,
        axis,
        angle: (idx * 1.3) % (Math.PI * 2),
      };
    });
  }, [objects]);

  const groupRefs = useRef<THREE.Group[]>([]);
  const dummy = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const mult = isPlaying ? speedMultiplier : 0;
    satState.forEach((obj, i) => {
      obj.angle += obj.speed * mult * (delta * 60);
      dummy.set(0, obj.radius, 0);
      dummy.applyAxisAngle(obj.axis, obj.angle);
      
      const group = groupRefs.current[i];
      if (group) {
        group.position.copy(dummy);
        group.lookAt(0, 0, 0);
      }
    });
  });

  return (
    <group>
      {satState.map((obj, i) => {
        const isSelected = selectedId === obj.item.id;
        const isHovered = hoveredId === obj.item.id;
        const isTargeted = isSelected || isHovered;

        return (
          <group 
            key={obj.item.id} 
            ref={(el) => { if (el) groupRefs.current[i] = el; }}
            onClick={(e) => { e.stopPropagation(); onSelect(obj.item); }}
            onPointerOver={(e) => { e.stopPropagation(); onHover(obj.item); }}
            onPointerOut={() => onHover(null)}
          >
            {/* 3D Physical Spacecraft Model (Substantially Enlarged & Highlighted) */}
            {obj.item.type === 'SPACE_STATION' ? (
              <group scale={isTargeted ? [3.2, 3.2, 3.2] : [2.2, 2.2, 2.2]}>
                {/* Main Pressurized Module Cylinder */}
                <mesh castShadow>
                  <cylinderGeometry args={[0.5, 0.5, 3.2, 16]} />
                  <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.15} />
                </mesh>
                {/* Cross Truss */}
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[6.5, 0.2, 0.2]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
                </mesh>
                {/* Large Solar Wing Arrays (Vibrant Photovoltaic Glow) */}
                <mesh position={[-2.2, 0.6, 0]}>
                  <boxGeometry args={[2.0, 1.1, 0.05]} />
                  <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.8} metalness={0.6} roughness={0.2} />
                </mesh>
                <mesh position={[2.2, 0.6, 0]}>
                  <boxGeometry args={[2.0, 1.1, 0.05]} />
                  <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.8} metalness={0.6} roughness={0.2} />
                </mesh>
                {/* Strobe Beacon Light */}
                <pointLight position={[0, 1.6, 0]} color="#00f0ff" intensity={3.5} distance={15} />
              </group>
            ) : obj.item.type === 'ROCKET_BODY' ? (
              <group scale={isTargeted ? [2.8, 2.8, 2.8] : [1.9, 1.9, 1.9]} rotation={[Math.PI / 4, 0, 0]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.55, 0.7, 3.0, 14]} />
                  <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
                </mesh>
                <mesh position={[0, -1.6, 0]}>
                  <coneGeometry args={[0.45, 0.6, 12]} />
                  <meshStandardMaterial color="#78716c" metalness={0.8} roughness={0.3} />
                </mesh>
              </group>
            ) : (
              <group scale={isTargeted ? [2.9, 2.9, 2.9] : [1.9, 1.9, 1.9]}>
                {/* Satellite Body (Gold Aerospace Bus) */}
                <mesh castShadow>
                  <boxGeometry args={[1.1, 1.1, 1.3]} />
                  <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.1} />
                </mesh>
                {/* Dual Solar Wings (Photovoltaic Cyan/Blue Glow) */}
                <mesh position={[-2.2, 0, 0]}>
                  <boxGeometry args={[2.4, 0.06, 0.9]} />
                  <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.85} metalness={0.6} roughness={0.2} />
                </mesh>
                <mesh position={[2.2, 0, 0]}>
                  <boxGeometry args={[2.4, 0.06, 0.9]} />
                  <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.85} metalness={0.6} roughness={0.2} />
                </mesh>
                {/* Communications Dish */}
                <mesh position={[0, -0.7, 0]} rotation={[Math.PI, 0, 0]}>
                  <coneGeometry args={[0.45, 0.35, 12]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
                </mesh>
                {/* Pulsing Beacon Light */}
                <pointLight position={[0, 0.8, 0]} color={obj.item.color} intensity={3.0} distance={12} />
              </group>
            )}

            {/* Orbit Reticle & Name Display in 3D Space */}
            {isTargeted && (
              <>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[3.8, 4.4, 48]} />
                  <meshBasicMaterial color={obj.item.color} transparent opacity={0.95} side={THREE.DoubleSide} />
                </mesh>
                
                {/* Floating 3D HUD Badge */}
                <Html distanceFactor={280} position={[0, 4.5, 0]} style={{ pointerEvents: 'none' }}>
                  <div className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap shadow-2xl border bg-zinc-950/95 text-white border-cyan-400/90 flex flex-col gap-0.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: obj.item.color }} />
                      <span className="text-cyan-400">🛰️ {obj.item.name}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-normal flex items-center gap-2">
                      <span>Alt: {obj.item.altitudeKm} km</span>
                      <span>•</span>
                      <span>Vel: {obj.item.velocityKmS} km/s</span>
                      <span>•</span>
                      <span className={obj.item.status === 'CRITICAL_HAZARD' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{obj.item.status}</span>
                    </div>
                  </div>
                </Html>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ── RAZOR-SHARP HIGH-DEFINITION DAY/NIGHT EARTH SHADER (ZERO BLUR, ZERO CLOUD NOISE) ──
const EarthDayNightShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform sampler2D uDayMap;
    uniform sampler2D uNightMap;
    uniform sampler2D uSpecularMap;
    uniform vec3 uSunDirection;

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    void main() {
      vec3 normal = normalize(vWorldNormal);
      vec3 sunDir = normalize(uSunDirection);
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);

      // Cosine angle to sun
      float sunDot = dot(normal, sunDir);
      
      // Crisp daylight terminator transition
      float dayFactor = smoothstep(-0.06, 0.08, sunDot);
      float nightFactor = 1.0 - dayFactor;

      vec4 dayTex = texture2D(uDayMap, vUv);
      vec4 nightTex = texture2D(uNightMap, vUv);
      vec4 specTex = texture2D(uSpecularMap, vUv);

      // Natural sunlight illumination
      float diffuse = max(0.0, sunDot);

      // Subtle, realistic ocean specular highlight (no blinding white circle)
      vec3 halfVec = normalize(sunDir + viewDir);
      float spec = pow(max(0.0, dot(normal, halfVec)), 80.0) * specTex.r * 0.45 * dayFactor;
      vec3 sunGlint = vec3(1.0, 0.95, 0.85) * spec;

      // Day side: crystal-clear, razor-sharp NASA Blue Marble surface
      vec3 daySurface = dayTex.rgb * (diffuse * 0.95 + 0.18) + sunGlint;

      // Night side: warm, glowing city lights
      vec3 cityLights = nightTex.rgb * vec3(1.15, 0.95, 0.70) * 2.6 * nightFactor;
      vec3 nightSurface = cityLights + dayTex.rgb * 0.008;

      // Clean blended surface
      vec3 surface = mix(nightSurface, daySurface, dayFactor);

      // Sleek, thin atmospheric blue rim on the sunlit limb
      float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 4.0);
      vec3 atmosGlow = vec3(0.20, 0.60, 1.0) * fresnel * dayFactor * 0.45;

      gl_FragColor = vec4(surface + atmosGlow, 1.0);
    }
  `
};

const AtmosphereHaloShader = {
  vertexShader: `
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    void main() {
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform vec3 uSunDirection;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    void main() {
      vec3 normal = normalize(vWorldNormal);
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 sunDir = normalize(uSunDirection);

      float sunDot = dot(normal, sunDir);
      float dayFactor = smoothstep(-0.15, 0.15, sunDot);

      float rim = pow(1.0 - max(0.0, dot(normal, viewDir)), 4.0);
      vec3 glowColor = vec3(0.20, 0.55, 1.0) * dayFactor * 0.55;

      gl_FragColor = vec4(glowColor, rim * 0.5);
    }
  `
};

// ── BLAZING SUN IN DEEP SPACE ────────────────────────────────────────────────
function SunGlareInSpace({ sunDirection }: { sunDirection: THREE.Vector3 }) {
  const sunPos = useMemo(() => {
    return [sunDirection.x * 500, sunDirection.y * 500, sunDirection.z * 500] as [number, number, number];
  }, [sunDirection]);

  return (
    <group position={sunPos}>
      {/* Core Sun Disk */}
      <mesh>
        <sphereGeometry args={[14, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Inner Solar Corona */}
      <mesh>
        <sphereGeometry args={[28, 32, 32]} />
        <meshBasicMaterial color="#ffedd5" transparent opacity={0.65} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Radiant Solar Flare Halo */}
      <mesh>
        <sphereGeometry args={[65, 32, 32]} />
        <meshBasicMaterial color="#fdba74" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function PhotorealisticEarthGlobe({ sunDirection }: { sunDirection: THREE.Vector3 }) {
  const earthMatRef = useRef<THREE.ShaderMaterial>(null);
  const haloMatRef = useRef<THREE.ShaderMaterial>(null);

  const loader = useMemo(() => new THREE.TextureLoader(), []);

  const dayMap = useMemo(() => {
    const tex = loader.load('/textures/earth_day.jpg');
    tex.anisotropy = 16;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [loader]);

  const nightMap = useMemo(() => {
    const tex = loader.load('/textures/earth_night.jpg');
    tex.anisotropy = 16;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [loader]);

  const specularMap = useMemo(() => {
    const tex = loader.load('/textures/earth_specular.jpg');
    tex.anisotropy = 16;
    tex.generateMipmaps = true;
    return tex;
  }, [loader]);

  const earthMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uDayMap: { value: dayMap },
        uNightMap: { value: nightMap },
        uSpecularMap: { value: specularMap },
        uSunDirection: { value: sunDirection },
      },
      vertexShader: EarthDayNightShader.vertexShader,
      fragmentShader: EarthDayNightShader.fragmentShader,
    });
  }, [dayMap, nightMap, specularMap, sunDirection]);

  const haloMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uSunDirection: { value: sunDirection },
      },
      vertexShader: AtmosphereHaloShader.vertexShader,
      fragmentShader: AtmosphereHaloShader.fragmentShader,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [sunDirection]);

  useFrame(() => {
    if (earthMatRef.current) {
      earthMatRef.current.uniforms.uSunDirection.value.copy(sunDirection);
    }
    if (haloMatRef.current) {
      haloMatRef.current.uniforms.uSunDirection.value.copy(sunDirection);
    }
  });

  return (
    <group>
      {/* 1. Earth High-Definition Day/Night Surface (Zero Clouds, Crystal Clear Continents & Oceans) */}
      <mesh material={earthMaterial} ref={(mesh) => { if (mesh) earthMatRef.current = mesh.material as THREE.ShaderMaterial; }}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
      </mesh>

      {/* 2. Thin Atmospheric Horizon Glow */}
      <mesh material={haloMaterial}>
        <sphereGeometry args={[EARTH_RADIUS + 2.5, 64, 64]} />
      </mesh>
    </group>
  );
}

// ── SATELLITE VIEW (HIGH-RES 2D SATELLITE MAP WITH FOOTPRINTS) ────────────────
function RealWorldSatelliteView({
  selectedObject,
  objects,
  onSelectObject
}: {
  selectedObject: SpaceObject | null;
  objects: SpaceObject[];
  onSelectObject: (obj: SpaceObject) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const footprintRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = selectedObject ? selectedObject.lat : 20.5937;
    const initialLng = selectedObject ? selectedObject.lng : 78.9629;
    const initialZoom = selectedObject ? 13 : 4;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false,
      minZoom: 2,
      maxZoom: 19,
      worldCopyJump: false,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 1.0,
    });

    // Real Sub-meter Satellite Photography
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri, Maxar, Earthstar Geographics',
      noWrap: true,
    }).addTo(map);

    L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      opacity: 0.75,
      noWrap: true,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.invalidateSize();

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    if (footprintRef.current) {
      footprintRef.current.remove();
      footprintRef.current = null;
    }

    objects.forEach(obj => {
      const isSelected = selectedObject?.id === obj.id;
      
      const customIcon = L.divIcon({
        className: 'custom-satellite-marker',
        html: `
          <div style="position: relative; display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -50%); cursor:pointer;">
            <div style="
              background: ${obj.color}; 
              width: ${isSelected ? '20px' : '12px'}; 
              height: ${isSelected ? '20px' : '12px'}; 
              border-radius: 50%; 
              border: 2px solid white; 
              box-shadow: 0 0 ${isSelected ? '18px' : '8px'} ${obj.color};
              transition: all 0.2s ease;
            "></div>
            ${isSelected ? `
              <div style="
                background: rgba(9, 9, 11, 0.95); 
                color: #fff; 
                font-family: monospace; 
                font-size: 11px; 
                font-weight: bold; 
                padding: 4px 10px; 
                border-radius: 6px; 
                border: 1px solid ${obj.color}; 
                margin-top: 6px; 
                white-space: nowrap;
                box-shadow: 0 4px 14px rgba(0,0,0,0.6);
                pointer-events: none;
              ">
                🛰️ ${obj.name}
              </div>
            ` : ''}
          </div>
        `,
        iconSize: [22, 22],
      });

      const marker = L.marker([obj.lat, obj.lng], { icon: customIcon })
        .addTo(map)
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectObject(obj);
        });

      markersRef.current[obj.id] = marker;
    });

    if (selectedObject) {
      map.flyTo([selectedObject.lat, selectedObject.lng], 14, { duration: 1.2 });

      footprintRef.current = L.circle([selectedObject.lat, selectedObject.lng], {
        radius: (selectedObject.altitudeKm / 10) * 1000,
        color: selectedObject.color,
        fillColor: selectedObject.color,
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4, 6'
      }).addTo(map);
    }
  }, [objects, selectedObject, onSelectObject]);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#02050c]">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}

// ── MAIN GLOBE PAGE ──────────────────────────────────────────────────────────
export default function GlobePage() {
  const navigate = useNavigate();
  
  // Display Mode: 3D Globe vs Satellite View
  const [viewMode, setViewMode] = useState<'3D_GLOBE' | 'SATELLITE_VIEW'>('3D_GLOBE');

  // Selection & Hover
  const [selectedObject, setSelectedObject] = useState<SpaceObject | null>(null);
  const [hoveredObject, setHoveredObject] = useState<SpaceObject | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Swarm Filters
  const [showSatellites, setShowSatellites] = useState(true);
  const [showRocketBodies, setShowRocketBodies] = useState(true);
  const [showDebris, setShowDebris] = useState(true);

  // Real-time Sun Direction Vector (Synchronized with Real-World UTC Time)
  const sunDirection = useMemo(() => calculateSunDirection(), []);

  const filteredObjects = useMemo(() => {
    return CATALOG_OBJECTS.filter(s => {
      const matchesType = filterType === 'ALL' || s.type === filterType;
      return matchesType;
    });
  }, [filterType]);

  return (
    <div className="flex-1 h-full relative bg-[#010308] overflow-hidden font-mono select-none">
      
      {/* ── TOP RIGHT TOOLBAR: 3D GLOBE VS SATELLITE VIEW ── */}
      <div className="absolute top-5 right-5 z-20 flex flex-col gap-2.5">
        <div className="bg-surface/90 backdrop-blur-xl border border-border/70 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1">
          <button
            onClick={() => setViewMode('3D_GLOBE')}
            className={`px-3.5 py-2 text-xs rounded-lg text-left transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === '3D_GLOBE' 
                ? 'bg-accent text-background font-bold shadow' 
                : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceHover'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>3D Globe View</span>
          </button>
          <button
            onClick={() => setViewMode('SATELLITE_VIEW')}
            className={`px-3.5 py-2 text-xs rounded-lg text-left transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'SATELLITE_VIEW' 
                ? 'bg-accent text-background font-bold shadow' 
                : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceHover'
            }`}
          >
            <Satellite className="w-4 h-4" />
            <span>Satellite View</span>
          </button>
        </div>

        {/* Filter Toggle */}
        <button 
          onClick={() => setShowFilterModal(!showFilterModal)}
          className={`py-2 px-3.5 backdrop-blur-xl border rounded-lg flex items-center justify-center gap-2 text-xs transition-all shadow-lg cursor-pointer ${
            showFilterModal 
              ? 'bg-accent text-background border-accent font-bold' 
              : 'bg-surface/85 text-textSecondary border-border/60 hover:text-textPrimary hover:bg-surfaceHover'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Fleet</span>
        </button>
      </div>

      {/* ── FILTER MODAL POPUP ── */}
      {showFilterModal && (
        <div className="absolute top-44 right-5 z-30 w-64 bg-surface/95 backdrop-blur-2xl border border-border/70 rounded-xl p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <span className="text-xs font-bold text-textPrimary uppercase tracking-wider">Fleet Layers</span>
            <button 
              onClick={() => setShowFilterModal(false)}
              className="text-textSecondary hover:text-textPrimary cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 text-textPrimary cursor-pointer hover:text-accent">
              <input 
                type="checkbox" 
                checked={showSatellites} 
                onChange={(e) => setShowSatellites(e.target.checked)} 
                className="accent-cyan-400 cursor-pointer"
              />
              <span className="text-cyan-400 font-semibold">🛰️ Active Satellites (4,500)</span>
            </label>

            <label className="flex items-center gap-2 text-textPrimary cursor-pointer hover:text-accent">
              <input 
                type="checkbox" 
                checked={showRocketBodies} 
                onChange={(e) => setShowRocketBodies(e.target.checked)} 
                className="accent-yellow-400 cursor-pointer"
              />
              <span className="text-yellow-400 font-semibold">🟡 Rocket Bodies (1,200)</span>
            </label>

            <label className="flex items-center gap-2 text-textPrimary cursor-pointer hover:text-accent">
              <input 
                type="checkbox" 
                checked={showDebris} 
                onChange={(e) => setShowDebris(e.target.checked)} 
                className="accent-slate-400 cursor-pointer"
              />
              <span className="text-slate-300 font-semibold">⚪ Debris Field (4,800)</span>
            </label>
          </div>

          <div className="pt-2 border-t border-border/40">
            <div className="text-[10px] uppercase font-bold text-textSecondary mb-1.5">Asset Category</div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              {(['ALL', 'PAYLOAD', 'SPACE_STATION', 'ROCKET_BODY', 'DEBRIS'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2 py-1 rounded text-center transition-all cursor-pointer ${
                    filterType === t
                      ? 'bg-accent text-background font-bold'
                      : 'bg-background/80 text-textSecondary hover:text-textPrimary hover:bg-surfaceHover border border-border/40'
                  }`}
                >
                  {t === 'ALL' ? 'ALL OBJECTS' : t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SELECTED SATELLITE HUD CARD ── */}
      {selectedObject && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-4 pointer-events-none">
          <div className="bg-surface/95 backdrop-blur-2xl border border-accent/40 rounded-xl p-4 pointer-events-auto shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start justify-between border-b border-border/40 pb-2.5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/15 border border-accent/30 text-accent">
                  <Satellite className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-textPrimary flex items-center gap-2">
                    {selectedObject.name}
                  </div>
                  <div className="text-[11px] text-textSecondary font-mono">
                    NORAD #{selectedObject.noradId} · {selectedObject.operator}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedObject(null)}
                className="text-textSecondary hover:text-textPrimary cursor-pointer p-1"
                title="Close HUD"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-background/90 rounded-lg border border-border/40">
                <div className="text-[9px] text-textSecondary uppercase">Altitude</div>
                <div className="text-sm font-bold text-textPrimary mt-0.5">{selectedObject.altitudeKm} km</div>
              </div>
              <div className="p-2.5 bg-background/90 rounded-lg border border-border/40">
                <div className="text-[9px] text-textSecondary uppercase">Velocity</div>
                <div className="text-sm font-bold text-accent mt-0.5">{selectedObject.velocityKmS} km/s</div>
              </div>
              <div className="p-2.5 bg-background/90 rounded-lg border border-border/40">
                <div className="text-[9px] text-textSecondary uppercase">Inclination</div>
                <div className="text-sm font-bold text-textPrimary mt-0.5">{selectedObject.inclinationDeg}°</div>
              </div>
            </div>

            {selectedObject.status === 'CRITICAL_HAZARD' && (
              <div className="p-2.5 bg-danger/15 border border-danger/40 rounded-lg flex items-center justify-between">
                <div className="text-xs font-bold text-danger flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 animate-pulse" /> Miss Distance: {selectedObject.missDistanceM}m
                </div>
                {selectedObject.associatedEventId && (
                  <button
                    onClick={() => navigate(`/events/${selectedObject.associatedEventId}`)}
                    className="py-1 px-3 bg-danger hover:bg-danger/90 text-white text-xs font-bold rounded transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>VIEW EVENT LAB</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BOTTOM HELPER INSTRUCTION ── */}
      <div className="absolute bottom-5 left-5 z-20 pointer-events-none">
        <div className="px-3.5 py-1.5 bg-surface/80 backdrop-blur-md rounded-lg border border-border/50 text-[11px] text-textSecondary flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-accent" />
          <span>Click any 3D satellite or station to inspect live orbital telemetry</span>
        </div>
      </div>
      
      {/* ── 3D GLOBE CANVAS ── */}
      {viewMode === '3D_GLOBE' ? (
        <Canvas 
          camera={{ position: [0, 50, 260], fov: 45 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        >
          <color attach="background" args={['#010308']} />
          
          <Stars radius={400} depth={100} count={6500} factor={3.5} saturation={0.4} fade speed={0.15} />
          
          {/* Deep Space Sun & Corona */}
          <SunGlareInSpace sunDirection={sunDirection} />
          
          {/* Solar Light Direction */}
          <directionalLight 
            position={[sunDirection.x * 400, sunDirection.y * 400, sunDirection.z * 400]} 
            intensity={3.0} 
            color="#fffdf8" 
          />
          <ambientLight intensity={0.04} color="#334155" />

          {/* Ultra-Crisp Earth Globe (No Clouds, Crystal Clear Land/Oceans, True Day/Night) */}
          <PhotorealisticEarthGlobe sunDirection={sunDirection} />

          {/* Orbiting Physical 3D Spacecraft Swarm (Enlarged & Highlighted) */}
          <Full15000RealisticSwarm 
            showSatellites={showSatellites} 
            showRocketBodies={showRocketBodies} 
            showDebris={showDebris} 
            speedMultiplier={1.0} 
            isPlaying={true} 
          />

          {/* Named Active Satellites with Interactive 3D HUD Reticles & Details */}
          <NamedAssetsInteractiveLayer 
            objects={filteredObjects}
            selectedId={selectedObject?.id || null}
            hoveredId={hoveredObject?.id || null}
            onSelect={(item) => setSelectedObject(item)}
            onHover={(item) => setHoveredObject(item)}
            speedMultiplier={1.0}
            isPlaying={true}
          />
          
          <OrbitControls 
            makeDefault 
            enablePan={false} 
            minDistance={115} 
            maxDistance={650} 
          />
        </Canvas>
      ) : (
        <RealWorldSatelliteView 
          selectedObject={selectedObject}
          objects={filteredObjects}
          onSelectObject={(obj) => setSelectedObject(obj)}
        />
      )}

    </div>
  );
}
