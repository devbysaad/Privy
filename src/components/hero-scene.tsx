"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line } from "@react-three/drei";
import { useMemo, useRef, useState, useEffect, Suspense } from "react";
import type { Group, Mesh } from "three";
import * as THREE from "three";

type NodeDef = { pos: [number, number, number]; scale: number; teal: boolean };

const NODES: NodeDef[] = [
  { pos: [0, 0.2, 0], scale: 0.28, teal: true },
  { pos: [-1.4, 0.8, 0.3], scale: 0.16, teal: false },
  { pos: [1.3, 0.7, -0.2], scale: 0.18, teal: false },
  { pos: [-1.1, -0.9, 0.4], scale: 0.14, teal: true },
  { pos: [1.2, -0.7, 0.5], scale: 0.15, teal: false },
  { pos: [0.1, 1.3, -0.5], scale: 0.12, teal: false },
  { pos: [-0.2, -1.2, -0.3], scale: 0.13, teal: true },
  { pos: [1.8, 0.1, 0.2], scale: 0.11, teal: false },
  { pos: [-1.7, 0.05, -0.4], scale: 0.12, teal: false },
];

const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [0, 6],
  [1, 8],
  [2, 7],
  [3, 6],
  [4, 7],
  [5, 1],
];

function AccessGraph({ reduced }: { reduced: boolean }) {
  const group = useRef<Group>(null);
  const pulse = useRef(0);

  useFrame((_, dt) => {
    if (!group.current || reduced) return;
    pulse.current += dt;
    group.current.rotation.y = Math.sin(pulse.current * 0.25) * 0.35;
    group.current.rotation.x = 0.15 + Math.sin(pulse.current * 0.18) * 0.08;
  });

  const edgePoints = useMemo(
    () =>
      EDGES.map(([a, b]) => [
        new THREE.Vector3(...NODES[a]!.pos),
        new THREE.Vector3(...NODES[b]!.pos),
      ]),
    [],
  );

  return (
    <group ref={group}>
      {edgePoints.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color="#94a3b8"
          lineWidth={1.2}
          transparent
          opacity={0.45}
        />
      ))}
      {NODES.map((n, i) => (
        <Float
          key={i}
          speed={reduced ? 0 : 1.2 + (i % 3) * 0.3}
          rotationIntensity={reduced ? 0 : 0.2}
          floatIntensity={reduced ? 0 : 0.4}
        >
          <mesh position={n.pos} scale={n.scale}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={n.teal ? "#0d9488" : "#1e293b"}
              metalness={0.35}
              roughness={0.35}
              emissive={n.teal ? "#0f766e" : "#0f172a"}
              emissiveIntensity={n.teal ? 0.35 : 0.08}
            />
          </mesh>
        </Float>
      ))}
      <OrbitRing reduced={reduced} />
    </group>
  );
}

function OrbitRing({ reduced }: { reduced: boolean }) {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current || reduced) return;
    ref.current.rotation.z += dt * 0.15;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2.4, 0.2, 0]}>
      <torusGeometry args={[2.1, 0.012, 8, 96]} />
      <meshStandardMaterial
        color="#0d9488"
        transparent
        opacity={0.35}
        metalness={0.5}
        roughness={0.4}
      />
    </mesh>
  );
}

function StaticFallback() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="h-full w-full bg-transparent"
      aria-hidden
    >
      <g stroke="#94a3b8" strokeWidth="1.5" opacity="0.5">
        <line x1="200" y1="180" x2="110" y2="100" />
        <line x1="200" y1="180" x2="300" y2="110" />
        <line x1="200" y1="180" x2="100" y2="270" />
        <line x1="200" y1="180" x2="310" y2="260" />
        <line x1="200" y1="180" x2="200" y2="70" />
      </g>
      <circle cx="200" cy="180" r="22" fill="#0d9488" />
      <circle cx="110" cy="100" r="12" fill="#1e293b" />
      <circle cx="300" cy="110" r="14" fill="#1e293b" />
      <circle cx="100" cy="270" r="11" fill="#0d9488" />
      <circle cx="310" cy="260" r="12" fill="#1e293b" />
      <circle cx="200" cy="70" r="10" fill="#1e293b" />
    </svg>
  );
}

export function HeroScene() {
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    setReady(true);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (!ready || reduced) {
    return (
      <div className="privy-float absolute inset-0">
        <StaticFallback />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-transparent">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.4, 5.2], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          premultipliedAlpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
        className="!bg-transparent"
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0);
          scene.background = null;
        }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[4, 6, 3]} intensity={1.1} />
        <pointLight position={[-3, -2, 2]} intensity={0.5} color="#5eead4" />
        <Suspense fallback={null}>
          <AccessGraph reduced={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}
