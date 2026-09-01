import { ImageResponse } from "next/og";
export const alt = "Release Engineer — Catch release risks before they ship.";
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
          background: "#f6f7f9",
          color: "#0a101b",
          fontFamily: "sans-serif",
          padding: 54,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 650,
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <path
                d="M5 7h5l6 9-6 9H5M16 16h11M21 7v18M25 13l3 3-3 3"
                stroke="#315dff"
                strokeWidth="2.8"
              />
            </svg>
            <span style={{ fontSize: 23, fontWeight: 600, letterSpacing: -1 }}>
              Release Engineer
            </span>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", marginTop: 40 }}
          >
            <span
              style={{
                fontSize: 12,
                letterSpacing: 2,
                color: "#586575",
                marginBottom: 22,
              }}
            >
              RELEASE INTELLIGENCE / EARLY BETA
            </span>
            <span
              style={{
                fontSize: 78,
                letterSpacing: -5,
                lineHeight: 1.02,
                fontWeight: 700,
              }}
            >
              Catch release
            </span>
            <span
              style={{
                fontSize: 78,
                letterSpacing: -5,
                lineHeight: 1.02,
                fontWeight: 700,
              }}
            >
              risks before
            </span>
            <span
              style={{
                fontSize: 78,
                letterSpacing: -5,
                lineHeight: 1.02,
                fontWeight: 700,
                color: "#315dff",
              }}
            >
              they ship.
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 28,
            }}
          >
            <span style={{ fontSize: 17, color: "#586575" }}>
              Public GitHub PR analysis, powered by Claude.
            </span>
            <span style={{ fontSize: 13, color: "#586575" }}>
              releaseengineer.tech · Human judgment stays in the loop.
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 410,
            background: "#090f1a",
            color: "#bacbe3",
            padding: 28,
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12, letterSpacing: 2 }}>
            RELEASE / SIGNAL
          </span>
          <svg width="350" height="340" viewBox="0 0 350 340" fill="none">
            <path
              d="M10 115l60-10 72 35 65 15 127-15M10 240l57-35 75 12 65 16 127 23M20 60l53 29 68 17 67 50 125 42"
              stroke="#668fff"
              strokeWidth="1.5"
            />
            <path d="m145 225 64 10 123 25" stroke="#ff795d" strokeWidth="2" />
            <path
              d="M130 72l75 10v209l-75-10V72Z"
              stroke="#91a8ca"
              strokeWidth="5"
              fill="#182b4a"
              fillOpacity=".5"
            />
            <path
              d="m147 64 75 10v209l-75-10V64Z"
              stroke="#7791b7"
              strokeWidth="2"
            />
            <path
              d="m164 56 75 10v209l-75-10V56Z"
              stroke="#7791b7"
              strokeWidth="2"
            />
            {[
              [10, 115],
              [70, 105],
              [142, 140],
              [207, 155],
              [334, 140],
              [10, 240],
              [67, 205],
              [145, 225],
              [209, 235],
              [332, 260],
              [20, 60],
              [73, 89],
              [141, 106],
              [208, 156],
              [333, 198],
            ].map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill={
                  i === 7 || i === 8 || i === 9
                    ? "#ff795d"
                    : i > 3
                      ? "#35d7c4"
                      : "#97b7ff"
                }
              />
            ))}
          </svg>
          <span style={{ fontSize: 10 }}>
            Conceptual visualization · No live telemetry
          </span>
        </div>
      </div>
    ),
    size,
  );
}
