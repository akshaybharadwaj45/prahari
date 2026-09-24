import { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { 
  Filter, ShieldAlert, ArrowRight, X, Satellite, Globe
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
    operator: 'NASA / ESA / JAXA / CSA',
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
    color: '#00f0ff',
  },
  {
    id: 'hst',
    noradId: 20580,
    name: 'HUBBLE SPACE TELESCOPE (HST)',
    type: 'PAYLOAD',
    operator: 'NASA / STScI',
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
    color: '#10b981',
  },
  {
    id: 'sentinel-6a',
    noradId: 46984,
    name: 'SENTINEL-6A (MICHAEL FREILICH)',
    type: 'PAYLOAD',
    operator: 'ESA / NASA / EUMETSAT',
    altitudeKm: 1336,
    inclinationDeg: 66.0,
    velocityKmS: 7.18,
    lat: 48.8566,
    lng: 2.3522,
    status: 'NOMINAL',
    color: '#10b981',
  },
  {
    id: 'noaa-20',
    noradId: 43013,
    name: 'NOAA-20 (JPSS-1)',
    type: 'PAYLOAD',
    operator: 'NOAA / NASA',
    altitudeKm: 824,
    inclinationDeg: 98.7,
    velocityKmS: 7.44,
    lat: 40.7128,
    lng: -74.0060,
    status: 'NOMINAL',
    color: '#10b981',
  },
  {
    id: 'oneweb-0342',
    noradId: 48950,
    name: 'ONEWEB-0342',
    type: 'PAYLOAD',
    operator: 'OneWeb Ltd',
    altitudeKm: 1200,
    inclinationDeg: 87.4,
    velocityKmS: 7.24,
    lat: 35.6762,
    lng: 139.6503,
    status: 'CRITICAL_HAZARD',
    missDistanceM: 44.0,
    associatedEventId: '1568',
    color: '#f43f5e',
  },
  {
    id: 'iridium-164',
    noradId: 43180,
    name: 'IRIDIUM 164 (NEXT)',
    type: 'PAYLOAD',
    operator: 'Iridium Communications',
    altitudeKm: 780,
    inclinationDeg: 86.4,
    velocityKmS: 7.46,
    lat: 59.9139,
    lng: 10.7522,
    status: 'NOMINAL',
    color: '#10b981',
  },
  {
    id: 'landsat-9',
    noradId: 49260,
    name: 'LANDSAT 9',
    type: 'PAYLOAD',
    operator: 'USGS / NASA',
    altitudeKm: 705,
    inclinationDeg: 98.2,
    velocityKmS: 7.50,
    lat: 12.9716,
    lng: 77.5946,
    status: 'ELEVATED',
    missDistanceM: 82.0,
    associatedEventId: '852',
    color: '#f59e0b',
  },
  {
    id: 'sl16-rb',
    noradId: 22285,
    name: 'SL-16 R/B (ZENIT-2 UPPER STAGE)',
    type: 'ROCKET_BODY',
    operator: 'Roscosmos (Spent Stage)',
    altitudeKm: 840,
    inclinationDeg: 71.0,
    velocityKmS: 7.43,
    lat: 55.7558,
    lng: 37.6173,
    status: 'CRITICAL_HAZARD',
    missDistanceM: 29.0,
    associatedEventId: '1430',
    color: '#f43f5e',
  },
  {
    id: 'falcon9-rb',
    noradId: 49000,
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
  
  // Longitude angle in Three.js SphereGeometry:
  // At 12:00 UTC, Sun is at Prime Meridian (theta = PI -> x = +1, z = 0).
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

// ── CUSTOM REALISTIC 3D PHYSICAL INSTANCED GEOMETRIES ────────────────────────

// 1. Realistic Satellite 3D Geometry (Gold Bus + Dual Blue Solar Panels)
function createSatellite3DGeometry(): THREE.BufferGeometry {
  const bus = new THREE.BoxGeometry(0.3, 0.3, 0.4);
  const leftWing = new THREE.BoxGeometry(0.7, 0.02, 0.3).translate(-0.55, 0, 0);
  const rightWing = new THREE.BoxGeometry(0.7, 0.02, 0.3).translate(0.55, 0, 0);
  const dish = new THREE.ConeGeometry(0.15, 0.12, 6).translate(0, -0.22, 0);
  
  return BufferGeometryUtils.mergeGeometries([bus, leftWing, rightWing, dish]);
}

// 2. Realistic Rocket Stage 3D Geometry (Cylinder + Conical Interstage + Engine Bell)
function createRocketStage3DGeometry(): THREE.BufferGeometry {
  const stage = new THREE.CylinderGeometry(0.15, 0.18, 0.9, 8);
  const interstage = new THREE.ConeGeometry(0.15, 0.18, 8).translate(0, 0.55, 0);
  const nozzle = new THREE.ConeGeometry(0.12, 0.16, 8).translate(0, -0.55, 0);

  return BufferGeometryUtils.mergeGeometries([stage, interstage, nozzle]);
}

// 3. Realistic Space Debris Fragment 3D Geometry (Jagged Faceted Fragment)
function createDebrisFragment3DGeometry(): THREE.BufferGeometry {
  return new THREE.DodecahedronGeometry(0.22, 0);
}

// ── 15,000 REALISTIC PHYSICAL 3D SPACECRAFT SWARM (NO ORBITS) ────────────────
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

  const satCount = 6500;
  const rbCount  = 1800;
  const debCount = 6700;

  // 3D Merged Geometries
  const satGeom = useMemo(() => createSatellite3DGeometry(), []);
  const rbGeom  = useMemo(() => createRocketStage3DGeometry(), []);
  const debGeom = useMemo(() => createDebrisFragment3DGeometry(), []);

  const satData = useMemo(() => {
    return Array.from({ length: satCount }).map((_, i) => {
      const inc = i % 2 === 0 ? 53.0 : 97.8;
      const incRad = (inc * Math.PI) / 180;
      const raanRad = Math.random() * Math.PI * 2;
      const radius = EARTH_RADIUS + 4 + Math.random() * 18;

      const axis = new THREE.Vector3(
        Math.sin(incRad) * Math.sin(raanRad),
        Math.cos(incRad),
        Math.sin(incRad) * Math.cos(raanRad)
      ).normalize();

      return {
        radius,
        speed: 0.0006 + Math.random() * 0.0006,
        axis,
        angle: Math.random() * Math.PI * 2,
        scale: 0.11 + Math.random() * 0.08,
        rotSpeed: (Math.random() - 0.5) * 0.02,
      };
    });
  }, [satCount]);

  const rbData = useMemo(() => {
    return Array.from({ length: rbCount }).map(() => {
      const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      return {
        radius: EARTH_RADIUS + 6 + Math.random() * 30,
        speed: 0.0004 + Math.random() * 0.0008,
        axis,
        angle: Math.random() * Math.PI * 2,
        scale: 0.13 + Math.random() * 0.08,
        rotSpeed: (Math.random() - 0.5) * 0.03,
      };
    });
  }, [rbCount]);

  const debData = useMemo(() => {
    return Array.from({ length: debCount }).map(() => {
      const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      return {
        radius: EARTH_RADIUS + 3 + Math.random() * 45,
        speed: 0.0004 + Math.random() * 0.0010,
        axis,
        angle: Math.random() * Math.PI * 2,
        scale: 0.09 + Math.random() * 0.06,
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
      {/* 6,500 Active Satellites (Physical 3D Bus + Solar Wings) */}
      <instancedMesh ref={satMeshRef} args={[satGeom, undefined, satCount]} visible={showSatellites}>
        <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.15} />
      </instancedMesh>

      {/* 1,800 Spent Rocket Bodies (Physical 3D Cylindrical Stages) */}
      <instancedMesh ref={rbMeshRef} args={[rbGeom, undefined, rbCount]} visible={showRocketBodies}>
        <meshStandardMaterial color="#facc15" metalness={0.85} roughness={0.2} />
      </instancedMesh>

      {/* 6,700 Space Debris (Physical 3D Faceted Fragments) */}
      <instancedMesh ref={debMeshRef} args={[debGeom, undefined, debCount]} visible={showDebris}>
        <meshStandardMaterial color="#cbd5e1" metalness={0.75} roughness={0.35} />
      </instancedMesh>
    </>
  );
}

// ── NAMED ASSETS LAYER (CLICK TO TARGET & VIEW DETAILS) ────────────────────────
function NamedAssetsInteractiveLayer({
  objects,
  selectedId,
  onSelect,
  speedMultiplier,
  isPlaying
}: {
  objects: SpaceObject[];
  selectedId: string | null;
  onSelect: (item: SpaceObject) => void;
  speedMultiplier: number;
  isPlaying: boolean;
}) {
  const satState = useMemo(() => {
    return objects.map((item, idx) => {
      const incRad = (item.inclinationDeg * Math.PI) / 180;
      const raanRad = ((idx * 38) * Math.PI) / 180;
      const radius = EARTH_RADIUS + 7 + (item.altitudeKm / 120);

      const axis = new THREE.Vector3(
        Math.sin(incRad) * Math.sin(raanRad),
        Math.cos(incRad),
        Math.sin(incRad) * Math.cos(raanRad)
      ).normalize();

      return {
        item,
        radius,
        speed: (item.velocityKmS / 7.6) * 0.0010,
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

        return (
          <group 
            key={obj.item.id} 
            ref={(el) => { if (el) groupRefs.current[i] = el; }}
            onClick={(e) => { e.stopPropagation(); onSelect(obj.item); }}
          >
            {/* 3D Physical Craft Model */}
            {obj.item.type === 'SPACE_STATION' ? (
              <group scale={isSelected ? [1.8, 1.8, 1.8] : [0.7, 0.7, 0.7]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.3, 0.3, 2.4, 12]} />
                  <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[4.8, 0.1, 0.1]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
                </mesh>
                <mesh position={[-1.6, 0.5, 0]}>
                  <boxGeometry args={[1.4, 0.8, 0.03]} />
                  <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.5} metalness={0.5} roughness={0.2} />
                </mesh>
                <mesh position={[1.6, 0.5, 0]}>
                  <boxGeometry args={[1.4, 0.8, 0.03]} />
                  <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.5} metalness={0.5} roughness={0.2} />
                </mesh>
              </group>
            ) : obj.item.type === 'ROCKET_BODY' ? (
              <group scale={isSelected ? [1.6, 1.6, 1.6] : [0.6, 0.6, 0.6]} rotation={[Math.PI / 4, 0, 0]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.35, 0.45, 2.0, 10]} />
                  <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.2} />
                </mesh>
              </group>
            ) : (
              <group scale={isSelected ? [1.6, 1.6, 1.6] : [0.6, 0.6, 0.6]}>
                <mesh castShadow>
                  <boxGeometry args={[0.8, 0.8, 1.0]} />
                  <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.1} />
                </mesh>
                <mesh position={[-1.5, 0, 0]}>
                  <boxGeometry args={[1.8, 0.04, 0.7]} />
                  <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.5} metalness={0.5} roughness={0.2} />
                </mesh>
                <mesh position={[1.5, 0, 0]}>
                  <boxGeometry args={[1.8, 0.04, 0.7]} />
                  <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.5} metalness={0.5} roughness={0.2} />
                </mesh>
              </group>
            )}

            {/* Target Reticle & Name ONLY ON CLICK */}
            {isSelected && (
              <>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[2.5, 3.0, 36]} />
                  <meshBasicMaterial color={obj.item.color} transparent opacity={0.95} side={THREE.DoubleSide} />
                </mesh>
                <Html distanceFactor={280} position={[0, 2.5, 0]} style={{ pointerEvents: 'none' }}>
                  <div className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap shadow-2xl border bg-zinc-950/95 text-white border-cyan-400 scale-110 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: obj.item.color }} />
                    <span style={{ color: obj.item.color }}>●</span>
                    <span>{obj.item.name}</span>
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

// ── PHOTOREALISTIC NASA BLUE MARBLE EARTH GLOBE WITH REAL-TIME DAY/NIGHT SHADER ─
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

      // Clean cosine angle to sun
      float sunDot = dot(normal, sunDir);
      
      // Smooth natural daylight transition
      float dayFactor = smoothstep(-0.05, 0.10, sunDot);
      float nightFactor = 1.0 - dayFactor;

      vec4 dayTex = texture2D(uDayMap, vUv);
      vec4 nightTex = texture2D(uNightMap, vUv);
      vec4 specTex = texture2D(uSpecularMap, vUv);

      // Diffuse sunlight
      float diffuse = max(0.0, sunDot);

      // Ocean specular highlight (Sun Glint on water surfaces)
      vec3 halfVec = normalize(sunDir + viewDir);
      float spec = pow(max(0.0, dot(normal, halfVec)), 36.0) * specTex.r * 2.0 * dayFactor;
      vec3 sunGlint = vec3(1.0, 0.98, 0.92) * spec;

      // Day side: rich, vibrant NASA Blue Marble surface + sunlight + ocean glint
      vec3 daySurface = dayTex.rgb * (diffuse * 0.90 + 0.14) + sunGlint;

      // Night side: dark space continent silhouette with glowing warm city lights
      vec3 cityLights = nightTex.rgb * vec3(1.15, 0.98, 0.72) * 2.8 * nightFactor;
      vec3 nightSurface = cityLights + dayTex.rgb * 0.005;

      // Combined surface
      vec3 surface = mix(nightSurface, daySurface, dayFactor);

      // Soft, realistic blue atmospheric limb glow on the sunlit side
      float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.5);
      vec3 atmosGlow = vec3(0.22, 0.60, 1.0) * fresnel * dayFactor * 0.55;

      gl_FragColor = vec4(surface + atmosGlow, 1.0);
    }
  `
};

const EarthCloudsShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldNormal;

    void main() {
      vUv = uv;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uCloudsMap;
    uniform vec3 uSunDirection;
    varying vec2 vUv;
    varying vec3 vWorldNormal;

    void main() {
      vec3 normal = normalize(vWorldNormal);
      vec3 sunDir = normalize(uSunDirection);

      float sunDot = dot(normal, sunDir);
      float dayFactor = smoothstep(-0.05, 0.15, sunDot);

      vec4 cloudTex = texture2D(uCloudsMap, vUv);

      // Cut off baseline JPEG noise (smoothstep between 0.38 and 0.85) so oceans and land are 100% clear and transparent
      float cloudDensity = smoothstep(0.38, 0.85, cloudTex.r);

      // Crisp white clouds on day side, dark unlit silhouettes on night side
      vec3 cloudColor = mix(vec3(0.02, 0.02, 0.03), vec3(1.0, 1.0, 1.0), dayFactor);
      float alpha = cloudDensity * 0.75 * dayFactor;

      gl_FragColor = vec4(cloudColor, alpha);
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
      float dayFactor = smoothstep(-0.15, 0.2, sunDot);

      float rim = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.5);
      vec3 glowColor = vec3(0.22, 0.58, 1.0) * dayFactor * 0.65;

      gl_FragColor = vec4(glowColor, rim * 0.6);
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
  const cloudsRef = useRef<THREE.Mesh>(null);
  const earthMatRef = useRef<THREE.ShaderMaterial>(null);
  const cloudsMatRef = useRef<THREE.ShaderMaterial>(null);
  const haloMatRef = useRef<THREE.ShaderMaterial>(null);

  const loader = useMemo(() => new THREE.TextureLoader(), []);

  const dayMap = useMemo(() => loader.load('/textures/earth_day.jpg'), [loader]);
  const nightMap = useMemo(() => loader.load('/textures/earth_night.jpg'), [loader]);
  const cloudsMap = useMemo(() => loader.load('/textures/earth_clouds.jpg'), [loader]);
  const specularMap = useMemo(() => loader.load('/textures/earth_specular.jpg'), [loader]);

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

  const cloudsMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uCloudsMap: { value: cloudsMap },
        uSunDirection: { value: sunDirection },
      },
      vertexShader: EarthCloudsShader.vertexShader,
      fragmentShader: EarthCloudsShader.fragmentShader,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
  }, [cloudsMap, sunDirection]);

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

  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.012;
    }
    if (earthMatRef.current) {
      earthMatRef.current.uniforms.uSunDirection.value.copy(sunDirection);
    }
    if (cloudsMatRef.current) {
      cloudsMatRef.current.uniforms.uSunDirection.value.copy(sunDirection);
    }
    if (haloMatRef.current) {
      haloMatRef.current.uniforms.uSunDirection.value.copy(sunDirection);
    }
  });

  return (
    <group>
      {/* 1. Earth Satellite Day-Night Surface */}
      <mesh material={earthMaterial} ref={(mesh) => { if (mesh) earthMatRef.current = mesh.material as THREE.ShaderMaterial; }}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
      </mesh>

      {/* 2. Real Atmospheric Clouds */}
      <mesh 
        ref={cloudsRef} 
        material={cloudsMaterial}
      >
        <sphereGeometry args={[EARTH_RADIUS + 0.8, 96, 96]} />
      </mesh>

      {/* 3. Outer Atmospheric Halo */}
      <mesh material={haloMaterial}>
        <sphereGeometry args={[EARTH_RADIUS + 3.2, 64, 64]} />
      </mesh>
    </group>
  );
}

// ── SATELLITE VIEW (HIGH-RES LEAFLET MAP) ─────────────────────────────────────
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

    // Invalidate size after short delay to ensure full fill
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
              width: ${isSelected ? '18px' : '10px'}; 
              height: ${isSelected ? '18px' : '10px'}; 
              border-radius: 50%; 
              border: 2px solid white; 
              box-shadow: 0 0 ${isSelected ? '16px' : '6px'} ${obj.color};
              transition: all 0.2s ease;
            "></div>
            ${isSelected ? `
              <div style="
                background: rgba(9, 9, 11, 0.95); 
                color: #fff; 
                font-family: monospace; 
                font-size: 11px; 
                font-weight: bold; 
                padding: 3px 8px; 
                border-radius: 6px; 
                border: 1px solid ${obj.color}; 
                margin-top: 5px; 
                white-space: nowrap;
                box-shadow: 0 4px 14px rgba(0,0,0,0.6);
                pointer-events: none;
              ">
                🛰️ ${obj.name}
              </div>
            ` : ''}
          </div>
        `,
        iconSize: [20, 20],
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

  // Selection
  const [selectedObject, setSelectedObject] = useState<SpaceObject | null>(null);
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
    <div className="flex-1 h-full relative bg-[#02050c] overflow-hidden font-mono select-none">
      
      {/* ── TOP RIGHT TOOLBAR: 3D GLOBE VS SATELLITE VIEW ── */}
      <div className="absolute top-5 right-5 z-20 flex flex-col gap-2.5">
        <div className="bg-surface/90 backdrop-blur-xl border border-border/70 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1">
          <button
            onClick={() => setViewMode('3D_GLOBE')}
            className={`px-3 py-1.5 text-xs rounded-lg text-left transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === '3D_GLOBE' 
                ? 'bg-accent text-background font-bold shadow' 
                : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceHover'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>3D Globe View</span>
          </button>
          <button
            onClick={() => setViewMode('SATELLITE_VIEW')}
            className={`px-3 py-1.5 text-xs rounded-lg text-left transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'SATELLITE_VIEW' 
                ? 'bg-accent text-background font-bold shadow' 
                : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceHover'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Satellite View</span>
          </button>
        </div>

        {/* Filter Toggle */}
        <button 
          onClick={() => setShowFilterModal(!showFilterModal)}
          className={`py-2 px-3 backdrop-blur-xl border rounded-lg flex items-center justify-center gap-1.5 text-xs transition-all shadow-lg cursor-pointer ${
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
        <div className="absolute top-44 right-5 z-30 w-64 bg-surface/95 backdrop-blur-2xl border border-border/70 rounded-xl p-3.5 shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <span className="text-xs font-bold text-textPrimary uppercase tracking-wider">Fleet Filter</span>
            <button 
              onClick={() => setShowFilterModal(false)}
              className="text-textSecondary hover:text-textPrimary cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="text-[10px] uppercase font-bold text-textSecondary mb-1">Swarm Layers</div>
            <label className="flex items-center gap-2 text-textPrimary cursor-pointer hover:text-accent">
              <input 
                type="checkbox" 
                checked={showSatellites} 
                onChange={(e) => setShowSatellites(e.target.checked)} 
                className="accent-emerald-400 cursor-pointer"
              />
              <span className="text-emerald-400 font-semibold">🟢 Satellites (6,500)</span>
            </label>

            <label className="flex items-center gap-2 text-textPrimary cursor-pointer hover:text-accent">
              <input 
                type="checkbox" 
                checked={showRocketBodies} 
                onChange={(e) => setShowRocketBodies(e.target.checked)} 
                className="accent-yellow-400 cursor-pointer"
              />
              <span className="text-yellow-400 font-semibold">🟡 Rocket Bodies (1,800)</span>
            </label>

            <label className="flex items-center gap-2 text-textPrimary cursor-pointer hover:text-accent">
              <input 
                type="checkbox" 
                checked={showDebris} 
                onChange={(e) => setShowDebris(e.target.checked)} 
                className="accent-slate-400 cursor-pointer"
              />
              <span className="text-slate-300 font-semibold">⚪ Debris Field (6,700)</span>
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

      {/* ── SELECTED OBJECT TELEMETRY HUD (ONLY ON CLICK) ── */}
      {selectedObject && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4 pointer-events-none">
          <div className="bg-surface/95 backdrop-blur-2xl border border-border/80 rounded-xl p-4 pointer-events-auto shadow-2xl space-y-3">
            <div className="flex items-start justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-2.5">
                <Satellite className="w-5 h-5" style={{ color: selectedObject.color }} />
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
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-background/90 rounded-lg border border-border/40">
                <div className="text-[9px] text-textSecondary uppercase">Altitude</div>
                <div className="text-sm font-bold text-textPrimary mt-0.5">{selectedObject.altitudeKm} km</div>
              </div>
              <div className="p-2 bg-background/90 rounded-lg border border-border/40">
                <div className="text-[9px] text-textSecondary uppercase">Velocity</div>
                <div className="text-sm font-bold text-accent mt-0.5">{selectedObject.velocityKmS} km/s</div>
              </div>
              <div className="p-2 bg-background/90 rounded-lg border border-border/40">
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
                    className="py-1 px-2.5 bg-danger hover:bg-danger/90 text-white text-xs font-bold rounded transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>ANALYZE</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* ── RENDERING: 3D GLOBE WITH 15,000 REAL PHYSICAL SATELLITES (NO ORBITS) ── */}
      {viewMode === '3D_GLOBE' ? (
        <Canvas 
          camera={{ position: [0, 60, 280], fov: 45 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.18 }}
        >
          <color attach="background" args={['#010308']} />
          
          <Stars radius={400} depth={100} count={6500} factor={3.5} saturation={0.4} fade speed={0.15} />
          
          {/* Real-world Blazing Sun Disk & Radiant Corona in Space */}
          <SunGlareInSpace sunDirection={sunDirection} />
          
          {/* Solar Directional Light synchronized to Real-Time UTC Sun Position */}
          <directionalLight 
            position={[sunDirection.x * 400, sunDirection.y * 400, sunDirection.z * 400]} 
            intensity={3.2} 
            color="#fffdf8" 
          />
          <ambientLight intensity={0.035} color="#334155" />

          {/* Photorealistic 3D Earth Globe with Bump Mountain Relief, Cloud Shadows, Sunset Terminator */}
          <PhotorealisticEarthGlobe sunDirection={sunDirection} />

          {/* Full 15,000 Real Physical 3D Objects (Satellites with Solar Panels, Rocket Bodies, Debris) — NO ORBIT LINES */}
          <Full15000RealisticSwarm 
            showSatellites={showSatellites} 
            showRocketBodies={showRocketBodies} 
            showDebris={showDebris} 
            speedMultiplier={1.0} 
            isPlaying={true} 
          />

          {/* Named Craft with Click-To-View Telemetry */}
          <NamedAssetsInteractiveLayer 
            objects={filteredObjects}
            selectedId={selectedObject?.id || null}
            onSelect={(item) => setSelectedObject(item)}
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
