const COLOR_VAR = {
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  primary: 'var(--color-primary)',
  info: 'var(--color-info)',
};

export default function DonutChart({ segments = [], total, centerLabel, size = 180, thickness = 22 }) {
  const sum = total != null ? total : segments.reduce((acc, s) => acc + (s.value || 0), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offset = 0;
  const arcs = segments
    .filter((s) => (s.value || 0) > 0 && sum > 0)
    .map((s) => {
      const fraction = (s.value || 0) / sum;
      const dash = fraction * circumference;
      const arc = {
        color: COLOR_VAR[s.color] || COLOR_VAR.primary,
        dasharray: `${dash} ${circumference - dash}`,
        dashoffset: -offset,
      };
      offset += dash;
      return arc;
    });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={thickness} opacity="0.35" />
          {arcs.map((a, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={a.color}
              strokeWidth={thickness}
              strokeDasharray={a.dasharray}
              strokeDashoffset={a.dashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-heading">{sum}</span>
          {centerLabel && <span className="text-xs text-muted">{centerLabel}</span>}
        </div>
      </div>

      <div className="space-y-2.5">
        {segments.map((s, i) => {
          const pct = sum > 0 ? Math.round(((s.value || 0) / sum) * 100) : 0;
          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="h-3 w-3 rounded-full" style={{ background: COLOR_VAR[s.color] || COLOR_VAR.primary }} />
              <span className="text-body">{s.label}</span>
              <span className="font-semibold text-heading">{s.value || 0}</span>
              <span className="text-xs text-muted">({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
