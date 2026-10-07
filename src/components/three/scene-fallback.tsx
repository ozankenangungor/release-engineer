// Server-rendered illustration: no GPU, fonts, external assets or JavaScript.
// A pipeline schematic, never a sample report or live telemetry.
export function SceneFallback() {
  return (
    <svg
      viewBox="0 0 800 460"
      fill="none"
      className="scene-fallback"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="core-metal"
          x1="250"
          y1="120"
          x2="535"
          y2="335"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#39594f" />
          <stop offset=".45" stopColor="#132827" />
          <stop offset="1" stopColor="#081716" />
        </linearGradient>
        <linearGradient
          id="core-glass"
          x1="320"
          y1="145"
          x2="458"
          y2="250"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#dcfff0" stopOpacity=".85" />
          <stop offset=".35" stopColor="#80dfbd" stopOpacity=".6" />
          <stop offset="1" stopColor="#3a997f" stopOpacity=".25" />
        </linearGradient>
        <radialGradient id="core-field">
          <stop stopColor="#66d4aa" stopOpacity=".15" />
          <stop offset="1" stopColor="#66d4aa" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="403" cy="285" rx="310" ry="155" fill="url(#core-field)" />
      <g stroke="#68998c" strokeOpacity=".4">
        <path
          d="m260 239 153-89 153 89-153 89-153-89Z"
          fill="url(#core-metal)"
        />
        <path d="m260 239 0 13 153 89 153-89v-13M413 328v13" />
        <path
          d="m280 202 133-76 133 76-133 77-133-77Z"
          fill="#74bd9e"
          fillOpacity=".07"
        />
        <path
          d="m300 167 113-65 113 65-113 65-113-65Z"
          fill="#9ce9c7"
          fillOpacity=".06"
        />
        <path d="m163 207 80-46 86 49M121 245l73-43 97 55M192 303l81-46 80 45M494 212l107-61 75 44M510 273l100-58 82 47" />
      </g>
      <g fill="#aee9d2">
        <circle cx="163" cy="207" r="4" />
        <circle cx="121" cy="245" r="4" />
        <circle cx="192" cy="303" r="4" />
      </g>
      <path
        d="m371 171 42-24 42 24-42 25-42-25Z"
        fill="url(#core-glass)"
        stroke="#bcf8dc"
        strokeOpacity=".7"
      />
      <path
        d="m371 171v15l42 25 42-25v-15M413 196v15m-42-37 42-24 42 24M371 157l42-24 42 24-42 25-42-25Z"
        stroke="#e0fff0"
        strokeOpacity=".4"
      />
      <g stroke="#b3ead3" strokeOpacity=".45" fill="#80c8ac" fillOpacity=".07">
        <path d="m584 151 51-29 0 60-51 29v-60Z" />
        <path d="m610 211 51-29v60l-51 29v-60Z" />
        <path d="m637 271 51-29v60l-51 29v-60Z" />
      </g>
      <g stroke="#b5e5d2" strokeOpacity=".6">
        <path d="m595 158 26-15m-26 27 19-11m-19 22 23-13M621 218l26-15m-26 27 19-11m8 60 26-15m-26 27 19-11" />
      </g>
      <path d="M80 358h640" stroke="#9ad8bd" strokeOpacity=".1" />
    </svg>
  );
}
