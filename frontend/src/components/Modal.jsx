export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(47,43,61,0.5)] p-4">
      <div className="w-full max-w-lg rounded-[10px] bg-card shadow-[var(--shadow-modal)]">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-heading">{title}</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-heading">
            ✕
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
