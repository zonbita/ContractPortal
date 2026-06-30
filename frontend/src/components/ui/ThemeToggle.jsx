import { Moon, Sun } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';
  const label = isDark
    ? (language === 'vi' ? 'Sáng' : 'Light')
    : (language === 'vi' ? 'Tối' : 'Dark');
  const title = isDark
    ? (language === 'vi' ? 'Chuyển sang giao diện sáng' : 'Switch to light mode')
    : (language === 'vi' ? 'Chuyển sang giao diện tối' : 'Switch to dark mode');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={title}
      aria-label={title}
      className={`inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium text-body shadow-soft transition hover:bg-body-bg hover:text-heading ${className}`}
    >
      {isDark ? (
        <>
          <Sun size={18} className="text-warning" />
          <span className="hidden sm:inline">{label}</span>
        </>
      ) : (
        <>
          <Moon size={18} className="text-primary" />
          <span className="hidden sm:inline">{label}</span>
        </>
      )}
    </button>
  );
}
