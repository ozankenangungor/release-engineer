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
      <ambientLight intensity={0.4} />
      <hemisphereLight args={["#eaf2ff", "#9aa9bf", 1.3]} />
      <directionalLight position={[-3, 7, 6]} intensity={2} color="#ffffff" />
      <directionalLight position={[5, 3, -4]} intensity={2} color="#95b8ff" />
    </>
  );
}
