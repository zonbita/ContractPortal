export default function StatCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        <div className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon size={22} className={iconColor} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-body">{label}</p>
          <p className="truncate text-[28px] font-bold leading-tight text-heading">{value}</p>
        </div>
      </div>
    </div>
  );
}
