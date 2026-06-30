export default function AdvanceCard({ title, subtitle, icon: Icon, actions, children, bodyClass = '' }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
          <div className="flex items-start gap-3">
            {Icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light">
                <Icon size={20} className="text-primary" strokeWidth={1.75} />
              </div>
            )}
            <div>
              {title && <h2 className="text-lg font-semibold text-heading">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </div>
  );
}
