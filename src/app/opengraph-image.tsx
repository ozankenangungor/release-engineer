import { ImageResponse } from "next/og";
import { SceneFallback } from "@/components/three/scene-fallback";
import { ReleaseMark } from "@/components/brand";

export const alt = "Release Engineer — Understand the change. Own the release.";
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
          flexDirection: "column",
          background: "#ffffff",
          color: "#151922",
          fontFamily: "sans-serif",
          padding: "30px 44px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#254ce5",
            }}
          >
            <ReleaseMark />
            <span
              style={{
                fontSize: 23,
                fontWeight: 700,
                color: "#151922",
                letterSpacing: -1,
              }}
            >
              Release Engineer
            </span>
          </div>
          <span style={{ fontSize: 13, color: "#667284" }}>
            releaseengineer.tech
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            marginTop: 36,
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: 2,
              color: "#657185",
              marginBottom: 15,
            }}
          >
            RELEASE INTELLIGENCE
          </span>
          <span
            style={{
              fontSize: 61,
              fontWeight: 700,
              letterSpacing: -3.4,
              lineHeight: 1.1,
            }}
          >
            Understand the change.
          </span>
          <span
            style={{
              fontSize: 61,
              fontWeight: 700,
              letterSpacing: -3.4,
              lineHeight: 1.1,
            }}
          >
            Own the release.
          </span>
          <span style={{ fontSize: 15, color: "#5b6370", marginTop: 17 }}>
            Public GitHub PR analysis. Claude-powered reasoning. Human
            decisions.
          </span>
        </div>
        <div
          style={{
            display: "flex",
            height: 245,
            marginTop: 27,
            background: "#080b12",
            borderRadius: 10,
            position: "relative",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 22,
              top: 16,
              color: "#a5b3c9",
              fontSize: 10,
              letterSpacing: 1,
            }}
          >
            RELEASE / SIGNAL
          </span>
          <span
            style={{
              position: "absolute",
              right: 22,
              top: 16,
              color: "#8b9cb6",
              fontSize: 9,
            }}
          >
            ILLUSTRATIVE GRAPH
          </span>
          <SceneFallback width={1020} height={245} />
        </div>
      </div>
    ),
    size,
  );
}
