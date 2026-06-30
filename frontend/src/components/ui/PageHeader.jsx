export default function PageHeader({ title, subtitle, action, illustration }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-heading">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {illustration || action}
    </div>
  );
}
