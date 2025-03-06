'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';

// Control variables for the flight simulator
interface FlightControls {
  thrust: number;
  roll: number;
  pitch: number;
  yaw: number;
}

// Airplane component
function Airplane({ controls }: { controls: FlightControls }) {
  const meshRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const speed = useRef(0);
  const position = useRef(new THREE.Vector3(0, 100, 0));
  const rotation = useRef(new THREE.Euler(0, 0, 0));
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Update speed based on thrust
    speed.current += (controls.thrust * 0.1 - speed.current * 0.01) * delta;
    
    // Update rotation based on controls
    rotation.current.x += controls.pitch * 0.01 * delta;
    rotation.current.y += controls.yaw * 0.01 * delta;
    rotation.current.z += controls.roll * 0.01 * delta;
    
    // Calculate direction vector based on rotation
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyEuler(rotation.current);
    
    // Update position based on speed and direction
    position.current.addScaledVector(direction, speed.current * delta * 10);
    
    // Update mesh position and rotation
    meshRef.current.position.copy(position.current);
    meshRef.current.rotation.copy(rotation.current);
    
    // Position camera behind airplane
    const cameraOffset = new THREE.Vector3(0, 5, 20);
    cameraOffset.applyEuler(rotation.current);
    camera.position.copy(position.current).add(cameraOffset);
    camera.lookAt(position.current);
  });
  
  return (
    <group ref={meshRef}>
      {/* Simple airplane model */}
      <mesh>
        <boxGeometry args={[1, 0.2, 3]} />
        <meshStandardMaterial color="#4285F4" />
      </mesh>
      {/* Wings */}
      <mesh position={[0, 0, -0.5]}>
        <boxGeometry args={[5, 0.1, 1]} />
        <meshStandardMaterial color="#4285F4" />
      </mesh>
      {/* Tail */}
      <mesh position={[0, 0.5, 1]}>
        <boxGeometry args={[1, 1, 0.1]} />
        <meshStandardMaterial color="#4285F4" />
      </mesh>
    </group>
  );
}

// Ground component
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
      <planeGeometry args={[10000, 10000]} />
      <meshStandardMaterial color="#1a5c1a" roughness={0.8} />
    </mesh>
  );
}

// Main scene component
const Scene: React.FC<{ controls: FlightControls }> = ({ controls }) => {
  return (
    <Canvas shadows>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <fog attach="fog" args={['#c9c9c9', 100, 1000]} />
      <Sky sunPosition={[100, 10, 100]} />
      <Airplane controls={controls} />
      <Ground />
    </Canvas>
  );
};

export default Scene; 