"use client";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { PMREMGenerator } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export function SceneLights() {
  const gl = useThree((state) => state.gl);
  const environment = useMemo(() => {
    // A small studio environment is rendered once; no network asset or postprocessing.
    const room = new RoomEnvironment();
    const generator = new PMREMGenerator(gl);
    const environment = generator.fromScene(room, 0.04);
    room.dispose();
    generator.dispose();
    return environment;
  }, [gl]);
  useEffect(() => () => environment.dispose(), [environment]);
  return (
    <>
      <primitive
        object={environment.texture}
        attach="environment"
        dispose={null}
      />
      <ambientLight intensity={0.18} />
      <hemisphereLight args={["#cbd9f5", "#080a0f", 0.65]} />
      <directionalLight position={[-3, 7, 6]} intensity={2} color="#ffffff" />
      <directionalLight position={[5, 3, -4]} intensity={1.5} color="#93a8df" />
    </>
  );
}
