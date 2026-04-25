"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Sphere, Torus } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import ParticleField from "./ParticleField";

function MovingShapes() {
  const torusRef = useRef<THREE.Mesh>(null);
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (torusRef.current) {
      torusRef.current.rotation.x = Math.sin(t / 4) / 2;
      torusRef.current.rotation.y = t / 3;
      torusRef.current.position.y = Math.sin(t / 2) * 0.5 + 1;
    }
    if (sphereRef.current) {
      sphereRef.current.position.y = Math.cos(t / 3) * 0.5 - 1;
      sphereRef.current.rotation.x = t / 4;
    }
  });

  return (
    <>
      <Torus ref={torusRef} args={[2.5, 0.5, 64, 128]} position={[3, 1, -4]}>
        <meshPhysicalMaterial 
          transmission={1} 
          thickness={1.5} 
          roughness={0.1} 
          ior={1.5} 
          clearcoat={1} 
          color="#4F46E5"
        />
      </Torus>
      
      <Sphere ref={sphereRef} args={[1.5, 64, 64]} position={[-3, -1, -5]}>
        <meshPhysicalMaterial 
          transmission={1} 
          thickness={2} 
          roughness={0.05} 
          ior={1.4} 
          color="#a855f7"
        />
      </Sphere>
    </>
  );
}

export default function BackgroundScene() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -10, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={["#030303"]} />
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#4F46E5" />
        <directionalLight position={[-10, -10, -5]} intensity={1} color="#10b981" />
        
        <Suspense fallback={null}>
          <Environment preset="city" />
          <MovingShapes />
          <ParticleField count={3000} />
        </Suspense>
      </Canvas>
    </div>
  );
}
