export function CompassHud() {
  return (
    <div className="hidden md:block absolute right-0 top-0 w-[44%] h-full pointer-events-none opacity-60 z-10 select-none overflow-hidden">
      <svg
        viewBox="0 0 300 300"
        className="w-full h-full text-gray-900 dark:text-gray-100"
        fill="none"
      >
        {/* Crosshair Axes */}
        <line x1="20" y1="150" x2="280" y2="150" stroke="currentColor" opacity="0.08" strokeWidth="1" />
        <line x1="150" y1="20" x2="150" y2="280" stroke="currentColor" opacity="0.08" strokeWidth="1" />

        {/* Cardinal Directions */}
        <text x="147" y="15" fontSize="8" fill="currentColor" opacity="0.6" fontFamily="monospace" fontWeight="bold">
          N
        </text>
        <text x="286" y="153" fontSize="8" fill="currentColor" opacity="0.6" fontFamily="monospace" fontWeight="bold">
          E
        </text>
        <text x="147" y="294" fontSize="8" fill="currentColor" opacity="0.6" fontFamily="monospace" fontWeight="bold">
          S
        </text>
        <text x="6" y="153" fontSize="8" fill="currentColor" opacity="0.6" fontFamily="monospace" fontWeight="bold">
          W
        </text>

        {/* Technical Corner Brackets */}
        <g stroke="currentColor" strokeWidth="0.8" opacity="0.25">
          <path d="M40 60 H58 M40 60 V78" />
          <path d="M260 60 H242 M260 60 V78" />
          <path d="M40 240 H58 M40 240 V222" />
          <path d="M260 240 H242 M260 240 V222" />
        </g>

        {/* Rotating Outer Dial with Degree Marks */}
        <g className="origin-center animate-[spin_120s_linear_infinite]" style={{ transformOrigin: "150px 150px" }}>
          <circle cx="150" cy="150" r="115" stroke="currentColor" strokeWidth="0.75" opacity="0.18" />
          <circle cx="150" cy="150" r="120" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 6" opacity="0.25" />
          <circle cx="150" cy="150" r="85" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />

          {/* Dial Ticks */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="150"
              y1="32"
              x2="150"
              y2={deg % 90 === 0 ? "42" : "37"}
              stroke="currentColor"
              strokeWidth={deg % 90 === 0 ? "1.2" : "0.75"}
              opacity="0.35"
              transform={`rotate(${deg} 150 150)`}
            />
          ))}
        </g>

        {/* Center reticle */}
        <circle cx="150" cy="150" r="3" fill="currentColor" opacity="0.4" />
        <circle cx="150" cy="150" r="14" stroke="currentColor" strokeWidth="0.75" opacity="0.2" />
        <path d="M142 150 H158 M150 142 V158" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />
      </svg>
    </div>
  );
}
