export function SceneLights() {
  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[1, 7, 4]} intensity={4.2} color="#dde4ff" />
      <directionalLight position={[-4, 2, -3]} intensity={3} color="#959dff" />
      <pointLight
        position={[0, 1.1, 0]}
        intensity={5}
        color="#a7b2ff"
        distance={5}
      />
    </>
  );
}
