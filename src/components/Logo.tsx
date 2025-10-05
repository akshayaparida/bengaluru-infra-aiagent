export default function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Simple city buildings */}
      <rect x="15" y="45" width="12" height="45" fill="#737373" rx="1" />
      <rect x="35" y="35" width="12" height="55" fill="#737373" rx="1" />
      <rect x="55" y="40" width="12" height="50" fill="#737373" rx="1" />
      <rect x="75" y="30" width="12" height="60" fill="#737373" rx="1" />
      
      {/* Minimal windows */}
      <rect x="18" y="50" width="2" height="2" fill="#a3a3a3" />
      <rect x="23" y="50" width="2" height="2" fill="#a3a3a3" />
      <rect x="18" y="58" width="2" height="2" fill="#a3a3a3" />
      <rect x="23" y="58" width="2" height="2" fill="#a3a3a3" />
      
      <rect x="38" y="42" width="2" height="2" fill="#a3a3a3" />
      <rect x="43" y="42" width="2" height="2" fill="#a3a3a3" />
      <rect x="38" y="50" width="2" height="2" fill="#a3a3a3" />
      <rect x="43" y="50" width="2" height="2" fill="#a3a3a3" />
      
      <rect x="58" y="47" width="2" height="2" fill="#a3a3a3" />
      <rect x="63" y="47" width="2" height="2" fill="#a3a3a3" />
      <rect x="58" y="55" width="2" height="2" fill="#a3a3a3" />
      <rect x="63" y="55" width="2" height="2" fill="#a3a3a3" />
      
      <rect x="78" y="37" width="2" height="2" fill="#a3a3a3" />
      <rect x="83" y="37" width="2" height="2" fill="#a3a3a3" />
      <rect x="78" y="45" width="2" height="2" fill="#a3a3a3" />
      <rect x="83" y="45" width="2" height="2" fill="#a3a3a3" />
      
      {/* AI circuit - minimal */}
      <path
        d="M25 18 L45 20 L65 18 L85 20"
        stroke="#737373"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* AI nodes - minimal */}
      <circle cx="25" cy="18" r="2" fill="#a3a3a3" />
      <circle cx="45" cy="20" r="2" fill="#a3a3a3" />
      <circle cx="65" cy="18" r="2" fill="#a3a3a3" />
      <circle cx="85" cy="20" r="2" fill="#a3a3a3" />
      
      {/* Ground line */}
      <line x1="0" y1="92" x2="100" y2="92" stroke="#525252" strokeWidth="2" />
    </svg>
  );
}
