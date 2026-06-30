import { useEffect, useRef, useState } from 'react';

const COLOR_VAR = {
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  primary: 'var(--color-primary)',
  info: 'var(--color-info)',
};

function compactNumber(n, locale) {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
}

export default function RevenueChart({ data = [], series = [], locale = 'vi-VN', height = 240 }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const update = () => setWidth(el.clientWidth || 640);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const padX = 48;
  const padTop = 16;
  const padBottom = 28;
  const chartW = width - padX * 2;
  const chartH = height - padTop - padBottom;

  const allValues = data.flatMap((d) => series.map((s) => d[s.key] || 0));
  const max = Math.max(...allValues, 1);

  const xFor = (i) => (data.length <= 1 ? padX + chartW / 2 : padX + (chartW * i) / (data.length - 1));
  const yFor = (v) => padTop + chartH - (chartH * (v || 0)) / max;

  const gridLines = 4;

  const totals = series.map((s) => ({
    ...s,
    total: data.reduce((acc, d) => acc + (d[s.key] || 0), 0),
  }));
  const grandTotal = totals.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="w-full" ref={containerRef}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = padTop + (chartH * i) / gridLines;
          const val = max * (1 - i / gridLines);
          return (
            <g key={i}>
              <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
              <text x={padX - 8} y={y + 4} textAnchor="end" fontSize="12" fill="var(--color-muted)">
                {compactNumber(val, locale)}
              </text>
            </g>
          );
        })}

        {series.map((s) => {
          const path = data
            .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(d[s.key]).toFixed(1)}`)
            .join(' ');
          const color = COLOR_VAR[s.color] || COLOR_VAR.primary;
          return (
            <g key={s.key}>
              {path && <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
              {data.length <= 14 && data.map((d, i) => (
                <circle key={i} cx={xFor(i)} cy={yFor(d[s.key])} r="2.5" fill={color} />
              ))}
            </g>
          );
        })}

        {data.map((d, i) => {
          const step = Math.ceil(data.length / 14);
          if (i % step !== 0 && i !== data.length - 1) return null;
          return (
            <text key={i} x={xFor(i)} y={height - 8} textAnchor="middle" fontSize="12" fill="var(--color-muted)">
              {d.label}
            </text>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 px-2">
        {totals.map((s) => {
          const pct = grandTotal > 0 ? Math.round((s.total / grandTotal) * 100) : 0;
          return (
            <div key={s.key} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR_VAR[s.color] || COLOR_VAR.primary }} />
              <span className="text-body">{s.label}</span>
              <span className="font-semibold text-heading">{s.legendValue != null ? s.legendValue : compactNumber(s.total, locale)}</span>
              <span className="text-xs text-muted">({s.legendPct != null ? s.legendPct : pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
