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
  Shield,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const STORAGE_KEY = 'sidebar-collapsed';

function readCollapsedState() {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function UserAvatar({ name }) {
  const initial = name?.charAt(0)?.toUpperCase() || 'U';
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
      {initial}
    </div>
  );
}

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsedState);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/contracts', icon: FileText, label: 'Hợp đồng' },
    { to: '/customers', icon: Users, label: 'Khách hàng' },
    { to: '/notifications', icon: Bell, label: 'Thông báo' },
    ...(isAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];

  const NavContent = ({ isMobile = false }) => {
    const showLabels = isMobile || !collapsed;

    return (
      <>
        <div className={`relative border-b border-white/10 ${showLabels ? 'px-6 py-5' : 'px-3 py-4'}`}>
          {showLabels ? (
            <>
              <h1 className="text-lg font-bold text-white">Contract Portal</h1>
              <p className="mt-1 truncate text-sm text-sidebar-muted">{user?.name}</p>
              <span className="mt-2 inline-block rounded-md bg-primary px-2 py-0.5 text-xs capitalize text-white">
                {user?.role}
              </span>
            </>
          ) : (
            <div className="flex justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
                CP
              </span>
            </div>
          )}

          {!isMobile && (
            <button
              type="button"
              onClick={toggleCollapsed}
              title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
              className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-white text-body shadow hover:text-primary"
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={!showLabels ? label : undefined}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center rounded-md py-2.5 text-sm font-medium transition ${
                  showLabels ? 'gap-3 px-4' : 'justify-center px-2'
                } ${isActive ? 'bg-primary text-white shadow-sm' : 'text-sidebar-text hover:bg-white/6'}`
              }
            >
              <span className="relative shrink-0">
                <Icon size={18} />
                {to === '/notifications' && unreadCount > 0 && !showLabels && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-danger" />
                )}
              </span>
              {showLabels && (
                <>
                  <span className="truncate">{label}</span>
                  {to === '/notifications' && unreadCount > 0 && (
                    <span className="ml-auto rounded-full bg-danger px-2 py-0.5 text-xs text-white">
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            title={!showLabels ? 'Đăng xuất' : undefined}
            className={`flex w-full items-center rounded-md py-2.5 text-sm text-sidebar-text hover:bg-white/6 ${
              showLabels ? 'gap-3 px-4' : 'justify-center px-2'
            }`}
          >
            <LogOut size={18} />
            {showLabels && 'Đăng xuất'}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-body-bg">
      <aside className={`hidden shrink-0 flex-col bg-sidebar transition-all duration-300 lg:flex ${sidebarWidth}`}>
        <NavContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-[260px] flex-col bg-sidebar">
            <NavContent isMobile />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 shadow-[0_1px_0_#DBDADE] lg:px-6">
          <div className="flex items-center gap-3">
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
          </div>

          <div className="flex items-center gap-4">
            <Link to="/notifications" className="relative text-body hover:text-primary">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2"
              >
                <UserAvatar name={user?.name} />
                <span className="hidden text-sm font-medium text-heading md:block">{user?.name}</span>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-border bg-white py-1 shadow-[var(--shadow-card)]">
                    <p className="border-b border-border px-4 py-2 text-xs text-muted">{user?.email}</p>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-body hover:bg-body-bg"
                    >
                      <LogOut size={16} />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
