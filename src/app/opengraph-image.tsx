import { ImageResponse } from "next/og";

export const alt =
  "Release Engineer — Public GitHub PR reviews with Claude";
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
          justifyContent: "space-between",
          padding: "60px 68px",
          background: "#070c18",
          color: "#f0f5f2",
          fontFamily: "sans-serif",
          backgroundImage:
            "radial-gradient(ellipse at 85% 30%, #242e50, #070c18 60%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg
            width="46"
            height="46"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#c4c7ff"
            strokeWidth="1.5"
          >
            <path d="M7 4v10a4 4 0 0 0 4 4h6M7 9h8a3 3 0 0 0 3-3V4" />
            <circle cx="7" cy="4" r="2" />
            <circle cx="18" cy="4" r="2" />
            <circle cx="18" cy="18" r="2" />
          </svg>
          <span style={{ fontSize: 25 }}>Release Engineer</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 36,
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}
          >
            <span
              style={{
                color: "#c4c7ff",
                fontSize: 15,
                letterSpacing: 3,
                marginBottom: 22,
              }}
            >
              REVIEW BEFORE YOU MERGE
            </span>
            <span style={{ fontSize: 68, letterSpacing: -3, lineHeight: 1.08 }}>
              Public GitHub PR reviews with Claude
            </span>
          </div>
          <svg width="280" height="255" viewBox="0 0 280 255" fill="none">
            <path
              d="m30 161 110-63 110 63-110 63-110-63Z"
              fill="#182e2c"
              stroke="#719c89"
            />
            <path
              d="m40 133 100-58 100 58-100 58-100-58Z"
              fill="#c4c7ff"
              fillOpacity=".06"
              stroke="#719c89"
            />
            <path
              d="m50 106 90-52 90 52-90 52-90-52Z"
              fill="#c4c7ff"
              fillOpacity=".08"
              stroke="#a6c9b6"
            />
            <path d="m106 73 34-20 34 20-34 20-34-20Z" fill="#9ad6b6" />
            <path
              d="m106 73v15l34 20 34-20V73m-34 20v15M106 100l34 20 34-20v12l-34 20-34-20v-12"
              stroke="#dbf4e5"
            />
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #537363",
            paddingTop: 24,
            color: "#c4d5cb",
            fontSize: 17,
          }}
        >
          <span>Public PRs · Structured reviews · Human judgment</span>
          <span>releaseengineer.tech / early beta</span>
        </div>
      </div>
    ),
    size,
  );
}
