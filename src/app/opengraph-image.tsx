import { ImageResponse } from "next/og";
import { SceneFallback } from "@/components/three/scene-fallback";
import { ReleaseMark } from "@/components/brand";

export const alt = "Release Engineer — Catch release risks. Before they ship.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#f8fafd",
          color: "#111827",
          fontFamily: "sans-serif",
          padding: 54,
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            right: -42,
            top: 100,
          }}
        >
          <SceneFallback width={680} height={480} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "#315dff",
            }}
          >
            <ReleaseMark />
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: -1.2,
                color: "#111827",
              }}
            >
              Release Engineer
            </span>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", marginTop: 12 }}
          >
            <span
              style={{
                fontSize: 11,
                letterSpacing: 2.3,
                color: "#53657f",
                marginBottom: 28,
              }}
            >
              RELEASE INTELLIGENCE
            </span>
            <span
              style={{
                fontSize: 73,
                letterSpacing: -4.5,
                lineHeight: 1.08,
                fontWeight: 700,
              }}
            >
              Catch release risks.
            </span>
            <div
              style={{
                display: "flex",
                fontSize: 73,
                letterSpacing: -4.5,
                lineHeight: 1.08,
                fontWeight: 700,
                color: "#69778e",
              }}
            >
              Before they{" "}
              <span style={{ color: "#315dff", marginLeft: 15 }}>ship.</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              paddingTop: 28,
              borderTop: "1px solid #dfe5ee",
              fontSize: 14,
              color: "#53657f",
            }}
          >
            <span>Public GitHub PR analysis, powered by Claude.</span>
            <span>releaseengineer.tech</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
