// SSR vector schematic of the same reactor, not a dashboard or review result.
// Animated only when the shell is visible and motion preferences allow it.
export function SceneFallback() {
  return (
    <svg
      viewBox="0 0 1000 650"
      fill="none"
      className="scene-fallback"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="reactor-metal"
          x1="310"
          y1="280"
          x2="725"
          y2="500"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#344467" />
          <stop offset=".5" stopColor="#18243e" />
          <stop offset="1" stopColor="#0a1428" />
        </linearGradient>
        <linearGradient
          id="reactor-light"
          x1="430"
          y1="220"
          x2="635"
          y2="350"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ededff" />
          <stop offset=".45" stopColor="#b6baff" />
          <stop offset="1" stopColor="#7184e0" />
        </linearGradient>
        <radialGradient id="reactor-field">
          <stop stopColor="#8792ff" stopOpacity=".26" />
          <stop offset="1" stopColor="#8792ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="reactor-paper">
          <stop stopColor="#aebcfa" stopOpacity=".27" />
          <stop offset="1" stopColor="#7185c8" stopOpacity=".08" />
        </linearGradient>
      </defs>
      <ellipse cx="545" cy="345" rx="380" ry="210" fill="url(#reactor-field)" />
      <g stroke="#818cc7" strokeOpacity=".24">
        <path d="m170 440 355-205 320 185M210 470l355-205 320 185M255 498l355-205 280 162M170 440l320 185M230 405l320 185M290 370l320 185M350 335l320 185M410 300l320 185M470 265l320 185" />
        <ellipse cx="535" cy="420" rx="246" ry="126" />
      </g>
      <g stroke="#9ca9ef" strokeOpacity=".4">
        <path d="m80 305 100-57 174 101 112-65M124 384l115-66 175 101M167 225l147 85 100-57M610 355l112-65 197 112M618 418l96-55 215 123M631 291l115-66 132 76" />
      </g>
      <g
        className="fallback-signal"
        stroke="#ced9ff"
        strokeWidth="2"
        strokeDasharray="5 100"
      >
        <path d="m80 305 100-57 174 101 112-65M124 384l115-66 175 101M167 225l147 85 100-57M610 355l112-65 197 112M618 418l96-55 215 123M631 291l115-66 132 76" />
      </g>
      <path
        d="m329 394 206-119 218 126-206 120-218-127Z"
        fill="url(#reactor-metal)"
        stroke="#a3ade0"
        strokeOpacity=".45"
      />
      <path
        d="m329 394v19l218 126 206-120v-19M547 521v18"
        stroke="#6678b7"
        strokeOpacity=".5"
      />
      <g className="fallback-chamber">
        <g
          fill="#a9b5ff"
          fillOpacity=".065"
          stroke="#bbc4ff"
          strokeOpacity=".45"
        >
          <path d="m364 352 171-99 184 106-171 100-184-107Z" />
          <path d="m364 310 171-99 184 106-171 100-184-107Z" />
          <path d="m364 268 171-99 184 106-171 100-184-107Z" />
          <path d="m364 226 171-99 184 106-171 100-184-107Z" />
          <path
            d="M364 226v126M719 233v126M535 127v126M548 333v126"
            strokeOpacity=".2"
          />
        </g>
        <path
          d="m462 282 73-42 80 46-73 43-80-47Z"
          fill="url(#reactor-metal)"
          stroke="#9faeea"
        />
        <path
          d="m462 282v16l80 46 73-42v-16"
          fill="#28375a"
          stroke="#8b9eda"
          strokeOpacity=".7"
        />
        <path
          d="m474 264 61-36 68 40-61 36-68-40Z"
          fill="url(#reactor-light)"
        />
        <path d="m474 264v9l68 40 61-35v-9" fill="#929cfa" />
        <path
          d="m484 258 51-30 57 33-51 30-57-33Z"
          fill="#1a2748"
          stroke="#dadfff"
          strokeOpacity=".4"
        />
        <path
          d="m518 257 19-11 20 12-19 11-20-12Z"
          stroke="#e8eaff"
          strokeWidth="2"
        />
        <path
          className="fallback-scan"
          d="m364 289 171-99 184 106-171 100-184-107Z"
          fill="#b4beff"
          fillOpacity=".12"
          stroke="#d1d9ff"
          strokeOpacity=".8"
        />
      </g>
      <g fill="url(#reactor-paper)" stroke="#becbff" strokeOpacity=".6">
        <path d="m143 285 48-28 64 37-48 28-64-37Z" />
        <path d="m227 354 48-28 64 37-48 28-64-37Z" />
        <path d="m219 240 48-28 64 37-48 28-64-37Z" />
        <path d="m766 288 66-38v91l-66 38v-91Z" />
        <path d="m816 371 66-38v91l-66 38v-91Z" />
        <path d="m697 420 66-38v91l-66 38v-91Z" />
      </g>
      <g stroke="#c4edee" strokeWidth="2" strokeOpacity=".65">
        <path d="m777 298 42-24m-42 39 30-17m-30 33 36-21m-36 36 26-15M827 381l42-24m-42 39 30-17m-30 33 36-21M708 430l42-24m-42 39 30-17m-30 33 36-21" />
      </g>
    </svg>
  );
}
