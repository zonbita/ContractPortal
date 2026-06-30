export default function StatCard({ icon: Icon, label, value, unit, iconBg, iconColor }) {
  return (
    <div className="rounded-2xl bg-card p-6 shadow-soft transition hover:shadow-soft-lg">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={24} className={iconColor} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-body">{label}</p>
          <p className="mt-1 truncate text-[28px] font-bold leading-none tracking-tight text-heading">{value}</p>
          {unit && <p className="mt-1.5 text-xs text-muted">{unit}</p>}
        </div>
      </div>
    </div>
  );
}
