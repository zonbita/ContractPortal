export default function DashboardIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-36 w-44 shrink-0">
      <ellipse cx="100" cy="145" rx="70" ry="8" fill="#7367F0" fillOpacity="0.12" />
      <rect x="55" y="70" width="90" height="55" rx="8" fill="url(#cardGrad)" />
      <rect x="65" y="82" width="35" height="28" rx="4" fill="#7367F0" fillOpacity="0.3" />
      <rect x="105" y="82" width="30" height="8" rx="2" fill="#7367F0" fillOpacity="0.2" />
      <rect x="105" y="95" width="25" height="8" rx="2" fill="#7367F0" fillOpacity="0.15" />
      <rect x="105" y="108" width="20" height="8" rx="2" fill="#7367F0" fillOpacity="0.1" />
      <circle cx="145" cy="45" r="22" fill="url(#sphereGrad)" />
      <circle cx="145" cy="45" r="22" fill="white" fillOpacity="0.15" />
      <ellipse cx="138" cy="38" rx="6" ry="4" fill="white" fillOpacity="0.35" />
      <circle cx="55" cy="50" r="14" fill="#FF9F43" fillOpacity="0.85" />
      <ellipse cx="51" cy="46" rx="4" ry="3" fill="white" fillOpacity="0.35" />
      <rect x="78" y="35" width="50" height="30" rx="6" fill="white" fillOpacity="0.9" stroke="#7367F0" strokeWidth="1.5" strokeOpacity="0.3" />
      <path d="M88 52 L98 42 L108 48 L118 38" stroke="#7367F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="118" cy="38" r="2.5" fill="#7367F0" />
      <defs>
        <linearGradient id="cardGrad" x1="55" y1="70" x2="145" y2="125" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E9E7FD" />
          <stop offset="1" stopColor="#C4B5FD" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="sphereGrad" x1="123" y1="23" x2="167" y2="67" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A78BFA" />
          <stop offset="1" stopColor="#7367F0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
