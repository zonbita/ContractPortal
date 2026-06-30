import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const ACCENTS = {
  primary: { card: 'bg-primary/15 ring-1 ring-primary/20', iconBg: 'bg-primary', title: 'text-primary' },
  success: { card: 'bg-success/15 ring-1 ring-success/20', iconBg: 'bg-success', title: 'text-success' },
  info: { card: 'bg-info/15 ring-1 ring-info/20', iconBg: 'bg-info', title: 'text-info' },
  warning: { card: 'bg-warning/15 ring-1 ring-warning/20', iconBg: 'bg-warning', title: 'text-warning' },
  danger: { card: 'bg-danger/15 ring-1 ring-danger/20', iconBg: 'bg-danger', title: 'text-danger' },
};

const DOTS = {
  primary: 'bg-primary',
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export default function SummaryCard({ icon: Icon, accent = 'primary', label, value, caption, rows = [], to, viewLabel }) {
  const a = ACCENTS[accent] || ACCENTS.primary;

  return (
    <div className={`flex flex-col rounded-[10px] ${a.card} p-6 shadow-card transition hover:shadow-soft-lg`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg ${a.iconBg} text-white shadow-md`}>
          <Icon size={22} strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className={`text-[13px] font-semibold ${a.title}`}>{label}</p>
          <p className="text-[28px] font-bold leading-tight tracking-tight text-heading">{value}</p>
        </div>
      </div>

      {caption && <p className="mt-1 text-xs text-muted">{caption}</p>}

      <div className="mt-4 space-y-2 border-t border-border/50 pt-3">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-body">
              <span className={`h-2 w-2 rounded-full ${DOTS[r.dot] || DOTS.primary}`} />
              {r.label}
            </span>
            <span className="font-semibold text-heading">{r.value}</span>
          </div>
        ))}
      </div>

      {to && (
        <Link to={to} className={`mt-4 inline-flex items-center gap-1 text-xs font-medium ${a.title} hover:underline`}>
          {viewLabel}
          <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}
