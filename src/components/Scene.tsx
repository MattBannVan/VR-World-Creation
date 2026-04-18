import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sky, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { SceneObject } from '../services/aiService';

interface SceneProps {
  objects: SceneObject[];
}

const ObjectRenderer = ({ object }: { object: SceneObject }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const { type, position, rotation, scale, color } = object;

  let Geometry: any;
  switch (type) {
    case 'box': Geometry = THREE.BoxGeometry; break;
    case 'sphere': Geometry = THREE.SphereGeometry; break;
    case 'cylinder': Geometry = THREE.CylinderGeometry; break;
    case 'torus': Geometry = THREE.TorusGeometry; break;
    case 'plane': Geometry = THREE.PlaneGeometry; break;
    default: Geometry = THREE.BoxGeometry;
  }

  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      scale={[scale.x, scale.y, scale.z]}
    >
      <primitive object={new Geometry()} attach="geometry" />
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} />
    </mesh>
  );
};

export const Scene = ({ objects }: SceneProps) => {
  return (
    <div className="w-full h-full bg-gradient-to-b from-[#E2E8F0] to-[#CBD5E1] relative">
      {/* Background Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-50"
        style={{
           backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
           backgroundSize: '40px 40px',
           transform: 'rotateX(60deg) translateY(-200px) scale(2)'
        }}
      />
      <div className="absolute inset-0 z-10 basis-full">
        <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
          <spotLight position={[-10, 10, -10]} angle={0.15} penumbra={1} intensity={1} castShadow />

          {objects.map((obj) => (
            <ObjectRenderer key={obj.id} object={obj} />
          ))}

          <ContactShadows position={[0, -0.99, 0]} opacity={0.3} scale={20} blur={2} far={1} />
          <OrbitControls makeDefault />
        </Canvas>
      </div>
    </div>
  );
};
