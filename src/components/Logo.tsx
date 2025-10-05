export default function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* City building silhouette */}
      <rect x="10" y="40" width="15" height="50" fill="url(#gradient1)" rx="2" />
      <rect x="30" y="30" width="15" height="60" fill="url(#gradient2)" rx="2" />
      <rect x="50" y="35" width="15" height="55" fill="url(#gradient1)" rx="2" />
      <rect x="70" y="25" width="15" height="65" fill="url(#gradient2)" rx="2" />
      
      {/* Windows on buildings */}
      <rect x="13" y="45" width="3" height="3" fill="#0ea5e9" opacity="0.8" />
      <rect x="19" y="45" width="3" height="3" fill="#0ea5e9" opacity="0.8" />
      <rect x="13" y="52" width="3" height="3" fill="#0ea5e9" opacity="0.8" />
      <rect x="19" y="52" width="3" height="3" fill="#0ea5e9" opacity="0.8" />
      
      <rect x="33" y="35" width="3" height="3" fill="#10b981" opacity="0.8" />
      <rect x="39" y="35" width="3" height="3" fill="#10b981" opacity="0.8" />
      <rect x="33" y="42" width="3" height="3" fill="#10b981" opacity="0.8" />
      <rect x="39" y="42" width="3" height="3" fill="#10b981" opacity="0.8" />
      
      <rect x="53" y="40" width="3" height="3" fill="#0ea5e9" opacity="0.8" />
      <rect x="59" y="40" width="3" height="3" fill="#0ea5e9" opacity="0.8" />
      <rect x="53" y="47" width="3" height="3" fill="#0ea5e9" opacity="0.8" />
      <rect x="59" y="47" width="3" height="3" fill="#0ea5e9" opacity="0.8" />
      
      <rect x="73" y="30" width="3" height="3" fill="#10b981" opacity="0.8" />
      <rect x="79" y="30" width="3" height="3" fill="#10b981" opacity="0.8" />
      <rect x="73" y="37" width="3" height="3" fill="#10b981" opacity="0.8" />
      <rect x="79" y="37" width="3" height="3" fill="#10b981" opacity="0.8" />
      
      {/* AI circuit lines */}
      <path
        d="M20 15 L30 20 L40 18 L50 22 L60 20 L70 24 L80 22"
        stroke="url(#aiGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      
      {/* AI brain/network nodes */}
      <circle cx="20" cy="15" r="3" fill="#8b5cf6" opacity="0.9" />
      <circle cx="40" cy="18" r="3" fill="#8b5cf6" opacity="0.9" />
      <circle cx="60" cy="20" r="3" fill="#8b5cf6" opacity="0.9" />
      <circle cx="80" cy="22" r="3" fill="#8b5cf6" opacity="0.9" />
      
      {/* Road at bottom */}
      <rect x="0" y="90" width="100" height="10" fill="#525252" opacity="0.6" />
      <line x1="5" y1="95" x2="20" y2="95" stroke="#fbbf24" strokeWidth="1" strokeDasharray="5,5" opacity="0.7" />
      <line x1="25" y1="95" x2="40" y2="95" stroke="#fbbf24" strokeWidth="1" strokeDasharray="5,5" opacity="0.7" />
      <line x1="45" y1="95" x2="60" y2="95" stroke="#fbbf24" strokeWidth="1" strokeDasharray="5,5" opacity="0.7" />
      <line x1="65" y1="95" x2="80" y2="95" stroke="#fbbf24" strokeWidth="1" strokeDasharray="5,5" opacity="0.7" />
      <line x1="85" y1="95" x2="95" y2="95" stroke="#fbbf24" strokeWidth="1" strokeDasharray="5,5" opacity="0.7" />
      
      {/* Gradients */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
