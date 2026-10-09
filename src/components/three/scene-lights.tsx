export function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[-3, 6, 7]} intensity={3.8} color="#d5e5ff" />
      <directionalLight position={[4, 2, -3]} intensity={3} color="#315dff" />
      <pointLight
        position={[2, 0, 2]}
        intensity={8}
        color="#35d7c4"
        distance={9}
      />
      <pointLight
        position={[2, -1, 0]}
        intensity={3}
        color="#ff795d"
        distance={5}
      />
    </>
  );
}
