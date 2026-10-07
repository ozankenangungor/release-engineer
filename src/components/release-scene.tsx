import { ReleaseMark } from "./brand";

export function ReleaseScene() {
  return (
    <div className="release-scene" aria-hidden="true">
      <div className="scene-halo" />
      <div className="scene-orbit scene-orbit-outer" />
      <div className="scene-orbit scene-orbit-inner" />
      <div className="scene-space">
        <div className="scene-object">
          <div className="scene-plane scene-plane-base">
            <span className="scene-corner scene-corner-a" />
            <span className="scene-corner scene-corner-b" />
          </div>
          <div className="scene-plane scene-plane-mid" />
          <div className="scene-plane scene-plane-top">
            <svg viewBox="0 0 280 280" fill="none" className="scene-circuit">
              <path d="M0 72h66a22 22 0 0 1 22 22v46h104a20 20 0 0 1 20 20v48h68M140 0v280M0 208h68a20 20 0 0 0 20-20v-48" />
              <path className="scene-signal" d="M0 72h66a22 22 0 0 1 22 22v46h104a20 20 0 0 1 20 20v48h68" />
              <circle cx="88" cy="140" r="5" />
              <circle cx="212" cy="208" r="5" />
              <circle cx="140" cy="32" r="3" />
            </svg>
          </div>
          <div className="scene-core">
            <ReleaseMark className="size-20" />
          </div>
        </div>
      </div>
      <span className="scene-label scene-label-context">PUBLIC PR CONTEXT</span>
      <span className="scene-label scene-label-review">STRUCTURED REVIEW</span>
    </div>
  );
}
