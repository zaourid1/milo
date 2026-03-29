"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  useAnimations,
  Html,
  Center,
} from "@react-three/drei";
import * as THREE from "three";

// ── The 3D Milo character ───────────────────────────────────────────────────
function MiloCharacter() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/models/milo.glb");
  const { actions } = useAnimations(animations, group);

  // Play the first animation (wave) on loop
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = actions[Object.keys(actions)[0]];
      if (firstAction) {
        firstAction.reset().fadeIn(0.5).play();
        firstAction.setLoop(THREE.LoopRepeat, Infinity);
      }
    }
  }, [actions]);

  // Gentle idle float (centered in frame; no large Y offset)
  useFrame((state) => {
    if (group.current) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
    }
  });

  return (
    <group ref={group}>
      <Center>
        <primitive object={scene} scale={1.35} />
      </Center>
    </group>
  );
}

// Preload the model
useGLTF.preload("/models/milo.glb");

// ── Loading spinner ─────────────────────────────────────────────────────────
function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-amber-500 rounded-full animate-spin" />
        <span className="text-xs text-stone-500">Loading Milo...</span>
      </div>
    </Html>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
interface MiloModelProps {
  className?: string;
}

export default function MiloModel({ className = "" }: MiloModelProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0.15, 5.25], fov: 38, near: 0.1, far: 100 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} color="#fff5e6" />
        <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
        <directionalLight position={[-3, 2, 4]} intensity={0.4} color="#fde68a" />
        <pointLight position={[0, 3, 0]} intensity={0.3} color="#f59e0b" />

        <Suspense fallback={<Loader />}>
          <MiloCharacter />
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          target={[0, 0.1, 0]}
          autoRotate
          autoRotateSpeed={1.5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2 + 0.15}
        />
      </Canvas>
    </div>
  );
}
