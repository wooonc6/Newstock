export default function NewstockLogo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ns-grad-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00e5b0" />
          <stop offset="100%" stopColor="#00b88a" />
        </linearGradient>
        <linearGradient id="ns-grad-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00c490" />
          <stop offset="100%" stopColor="#007a5e" />
        </linearGradient>
      </defs>

      {/* N lettermark — left pillar */}
      <rect x="8" y="34" width="16" height="52" rx="1" fill="url(#ns-grad-light)" />

      {/* N lettermark — diagonal */}
      <polygon points="24,34 39,34 68,86 53,86" fill="url(#ns-grad-dark)" />

      {/* N lettermark — right pillar */}
      <rect x="53" y="34" width="16" height="52" rx="1" fill="url(#ns-grad-light)" />

      {/* Document icon (dark, on top of N) */}
      <path
        d="M18,2 L50,2 Q52,2 52,4 L52,14 L60,14 L60,46 Q60,48 58,48 L18,48 Q16,48 16,46 L16,4 Q16,2 18,2 Z"
        fill="#162033"
      />
      {/* Folded corner */}
      <path d="M50,2 L50,14 L60,14" fill="none" stroke="#243450" strokeWidth="1.5" />
      {/* Text lines */}
      <line x1="23" y1="20" x2="53" y2="20" stroke="#4b5a72" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="23" y1="28" x2="53" y2="28" stroke="#4b5a72" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="23" y1="36" x2="43" y2="36" stroke="#4b5a72" strokeWidth="2.5" strokeLinecap="round" />

      {/* Upward-trending arrow (white, inside N) */}
      <line x1="19" y1="79" x2="58" y2="48" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
      <polyline
        points="46,44 58,48 54,60"
        fill="none"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
