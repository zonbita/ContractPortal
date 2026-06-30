import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Bell,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  Receipt,
  FileSpreadsheet,
  Search,
  Banknote,
  Trash2,
  BarChart3,
  MessageSquare,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from './ui/LanguageToggle';
import ThemeToggle from './ui/ThemeToggle';
import api from '../services/api';

const STORAGE_KEY = 'sidebar-collapsed';

function readCollapsedState() {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function UserAvatar({ name }) {
  const initial = name?.charAt(0)?.toUpperCase() || 'U';
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-dark text-sm font-semibold text-white shadow-md shadow-primary/30">
      {initial}
    </div>
  );
}

function BrandLogo({ compact = false }) {
  const mark = (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-info to-primary shadow-lg shadow-info/30">
      <BarChart3 size={22} className="text-white" strokeWidth={2.25} />
    </div>
  );

  if (compact) return mark;

  return (
    <div className="flex items-center gap-3">
      {mark}
      <h1 className="text-lg font-bold uppercase tracking-wide text-white">Dashboard</h1>
    </div>
  );
}

const ROLE_LABELS = {
  vi: { admin: 'Quản trị viên', manager: 'Quản lý', staff: 'Nhân viên', client: 'Khách hàng' },
  en: { admin: 'Administrator', manager: 'Manager', staff: 'Staff', client: 'Client' },
};

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsedState);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarUserMenuOpen, setSidebarUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.get('/notifications/unread-count').then((res) => setUnreadCount(res.data.count)).catch(() => {});
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[260px]';

  const primaryNav = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/contracts', icon: FileText, label: t('nav.contracts') },
    { to: '/invoices', icon: Receipt, label: t('nav.invoices') },
    { to: '/quotations', icon: FileSpreadsheet, label: t('nav.quotations') },
    { to: '/receipts', icon: Banknote, label: t('nav.receipts') },
  ];

  const secondaryNav = [
    { to: '/chat', icon: MessageSquare, label: t('nav.chat') },
    { to: '/customers', icon: Users, label: t('nav.customers') },
    { to: '/search', icon: Search, label: t('nav.search') },
    { to: '/trash', icon: Trash2, label: t('nav.trash') },
    ...(isAdmin ? [{ to: '/admin', icon: Shield, label: t('nav.admin') }] : []),
  ];

  const roleLabel = (ROLE_LABELS[locale?.startsWith('en') ? 'en' : 'vi'] || ROLE_LABELS.vi)[user?.role] || user?.role;

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const NavContent = ({ isMobile = false }) => {
    const showLabels = isMobile || !collapsed;

    const renderItem = ({ to, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        end={to === '/'}
        title={!showLabels ? label : undefined}
        onClick={() => setMobileOpen(false)}
        className={({ isActive }) =>
          `flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
            showLabels ? 'gap-3 px-4' : 'justify-center px-2'
          } ${
            isActive
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'text-sidebar-text hover:bg-white/8 hover:text-white'
          }`
        }
      >
        <Icon size={18} />
        {showLabels && <span className="truncate">{label}</span>}
      </NavLink>
    );

    return (
      <>
        <div className={`relative ${showLabels ? 'px-5 py-6' : 'px-3 py-5'}`}>
          {showLabels ? <BrandLogo /> : <div className="flex justify-center"><BrandLogo compact /></div>}

          {!isMobile && (
            <button
              type="button"
              onClick={toggleCollapsed}
              title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
              className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-body shadow-md hover:text-primary"
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-3 pb-4">
          {primaryNav.map(renderItem)}
          <div className={`my-3 border-t border-white/10 ${showLabels ? 'mx-2' : 'mx-1'}`} />
          {secondaryNav.map(renderItem)}
        </nav>

        <div className="border-t border-white/8 p-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSidebarUserMenuOpen((v) => !v)}
              title={!showLabels ? user?.name : undefined}
              className={`flex w-full items-center rounded-xl py-2 text-sm transition hover:bg-white/8 ${
                showLabels ? 'gap-3 px-2' : 'justify-center px-1'
              }`}
            >
              <UserAvatar name={user?.name} />
              {showLabels && (
                <>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                    <p className="truncate text-xs text-sidebar-muted">{roleLabel}</p>
                  </div>
                  <ChevronDown size={16} className={`shrink-0 text-sidebar-muted transition ${sidebarUserMenuOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {sidebarUserMenuOpen && showLabels && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSidebarUserMenuOpen(false)} />
                <div className="absolute bottom-full left-0 z-20 mb-2 w-full overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-soft-lg">
                  <p className="border-b border-border px-4 py-2.5 text-xs text-muted">{user?.email}</p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-body transition hover:bg-body-bg"
                  >
                    <LogOut size={16} />
                    {t('nav.logout')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-body-bg">
      <aside
        className={`sidebar-gradient hidden shrink-0 flex-col transition-all duration-300 lg:flex ${sidebarWidth}`}
      >
        <NavContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="sidebar-gradient relative flex h-full w-[260px] flex-col">
            <NavContent isMobile />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-surface/90 px-4 backdrop-blur-md lg:px-6">
          <div className="flex flex-1 items-center gap-3">
            <button type="button" className="text-body hover:text-heading lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu size={22} />
            </button>
            <button
              type="button"
              className="hidden text-body hover:text-heading lg:block"
              onClick={toggleCollapsed}
            >
              {collapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
            </button>
            <form onSubmit={handleGlobalSearch} className="hidden flex-1 md:block md:max-w-md">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('common.searchDocuments')}
                  className="w-full rounded-xl border border-border/80 bg-body-bg py-2 pl-10 pr-4 text-sm text-heading outline-none transition placeholder:text-muted focus:border-primary focus:bg-card focus:ring-[3px] focus:ring-primary/10"
                />
              </div>
            </form>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              to="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-body transition hover:bg-body-bg hover:text-primary"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition hover:bg-body-bg"
              >
                <UserAvatar name={user?.name} />
                <span className="hidden text-sm font-medium text-heading md:block">{user?.name}</span>
                <ChevronDown size={16} className={`hidden text-muted transition md:block ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-soft-lg">
                    <p className="border-b border-border px-4 py-2.5 text-xs text-muted">{user?.email}</p>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-body transition hover:bg-body-bg"
                    >
                      <LogOut size={16} />
                      {t('nav.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
