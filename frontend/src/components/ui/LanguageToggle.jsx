import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageToggle({ className = '' }) {
  const { language, toggleLanguage, t } = useLanguage();
  const nextLabel = language === 'vi' ? 'EN' : 'VI';

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={t('toggleLanguage')}
      aria-label={t('toggleLanguage')}
      className={`inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium text-body shadow-soft transition hover:bg-body-bg hover:text-heading ${className}`}
    >
      <Languages size={18} className="text-primary" />
      <span>{nextLabel}</span>
    </button>
  );
}
