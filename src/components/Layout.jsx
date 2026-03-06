import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logAction } from '../services/systemLogs';

const SIDEBAR_COLLAPSED_KEY = 'mimaropa-sidebar-collapsed';

const NAV_ITEMS = [
  { to: '/dashboard', icon: 'mdi:view-dashboard', label: 'Dashboard', match: (path) => path === '/dashboard' },
  { to: '/individual-forms', icon: 'mdi:account-edit', label: 'Individual', match: (path) => path === '/individual-forms' },
  { to: '/fca-forms', icon: 'mdi:account-group', label: 'FCA', match: (path) => path === '/fca-forms' },
  { to: '/encoded-forms', icon: 'mdi:file-document-multiple', label: 'Encoded Forms', match: (path) => path === '/encoded-forms' },
];

const ADMIN_NAV_ITEMS = [
  { to: '/system-logs', icon: 'mdi:clipboard-list-outline', label: 'System Logs', match: (path) => path === '/system-logs' },
];

export default function Layout({ children }) {
  const { user, userProfile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isEncoder = !isAdmin();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {}
  }, [collapsed]);

  const handleLogoutClick = () => setShowLogoutConfirm(true);

  const handleLogoutConfirm = (confirm) => {
    setShowLogoutConfirm(false);
    if (confirm) {
      logAction({
        action: 'logout',
        userId: user?.uid ?? null,
        userEmail: userProfile?.email ?? user?.email ?? null,
        role: userProfile?.role ?? null,
        province: userProfile?.province ?? null,
      }).catch(() => {});
      signOut();
      navigate('/');
    }
  };

  // PALETTE (from COLOR_PALETTE.jpg):
  // Green: #84BC40 | Brown: #8D4A25 | Vibrant Blue: #1E88E5 | Muted Blue: #2E749E | Pastel Blue: #A7D9F7 | Cream: #F2F8ED

  const linkClass = (isActive) =>
    `group flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl outline-none ${
      isActive 
        ? 'bg-[#2E749E] text-white shadow-md shadow-[#2E749E]/30' 
        : 'text-white/90 hover:bg-white/10 hover:text-white hover:translate-x-1'
    } ${collapsed ? 'justify-center px-0' : ''}`;

  const sidebarContent = (
    <>
      <div className="relative flex flex-col flex-1 min-h-0">
        
        {/* Header/Logo Section — extra right padding when collapsed so logo isn’t tight to button */}
        <div className={`relative flex items-center justify-between py-5 border-b border-white/15 ${collapsed ? 'px-4 justify-center' : 'px-4'}`}>
          <Link
            to="/dashboard"
            onClick={closeMobileMenu}
            className={`flex items-center gap-3 min-w-0 transition-opacity hover:opacity-90 ${collapsed ? 'justify-center w-full' : ''}`}
          >
            <div className="bg-[#F2F8ED] p-1 rounded-xl shadow-sm shrink-0">
              <img src="/LOGO_OA.png" alt="OA Logo" className="h-8 w-8 object-contain rounded-lg" />
            </div>
            <span
              className={`inline-block overflow-hidden whitespace-nowrap transition-all duration-200 ${
                collapsed ? 'max-w-0 opacity-0 min-w-0' : 'max-w-[12rem] opacity-100 delay-150'
              }`}
            >
              <span className="text-white font-bold text-lg leading-tight truncate tracking-wide drop-shadow-sm">
                MIMAROPA
                <span className="block text-xs font-semibold text-white/80 mt-0.5 uppercase tracking-wider">Organic Profile</span>
              </span>
            </span>
          </Link>
          <button type="button" onClick={closeMobileMenu} className="sm:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors active:scale-95 shrink-0" aria-label="Close menu">
            <Icon icon="mdi:close" className="text-xl" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="relative flex-1 mt-6 overflow-y-auto overflow-x-hidden space-y-2 px-3 pb-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {isEncoder && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => { setShowEntryModal(true); closeMobileMenu(); }}
                className={`w-full inline-flex items-center justify-center text-white font-semibold text-sm bg-[#84BC40] hover:brightness-110 hover:shadow-lg shadow-md shadow-[#84BC40]/25 transition-all duration-200 rounded-xl active:scale-95 ${collapsed ? 'p-3' : 'gap-2.5 px-4 py-3'}`}
                title="New Entry"
              >
                <Icon icon="mdi:plus-circle" className="text-xl shrink-0" />
                <span className={`inline-block overflow-hidden whitespace-nowrap transition-all duration-200 ${collapsed ? 'max-w-0 opacity-0 min-w-0' : 'max-w-[5rem] opacity-100 delay-150'}`}>New Entry</span>
              </button>
            </div>
          )}
          {NAV_ITEMS.map(({ to, icon, label, match }) => {
            const isActive = match(location.pathname);
            return (
              <Link key={to} to={to} onClick={closeMobileMenu} className={linkClass(isActive)} title={collapsed ? label : undefined}>
                <Icon icon={icon} className={`text-xl shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className={`inline-block overflow-hidden whitespace-nowrap transition-all duration-200 ${collapsed ? 'max-w-0 opacity-0 min-w-0' : 'max-w-[10rem] opacity-100 delay-150'}`}>{label}</span>
              </Link>
            );
          })}
          {isAdmin() && ADMIN_NAV_ITEMS.map(({ to, icon, label, match }) => {
            const isActive = match(location.pathname);
            return (
              <Link key={to} to={to} onClick={closeMobileMenu} className={linkClass(isActive)} title={collapsed ? label : undefined}>
                <Icon icon={icon} className={`text-xl shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className={`inline-block overflow-hidden whitespace-nowrap transition-all duration-200 ${collapsed ? 'max-w-0 opacity-0 min-w-0' : 'max-w-[10rem] opacity-100 delay-150'}`}>{label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile & Logout — transparent so gradient flows through, no hard line */}
        <div className={`relative flex flex-col gap-2 px-3 py-4 border-t border-white/10 ${collapsed ? 'items-center' : ''}`}>
          <div className={`flex items-center text-[#2E749E] font-medium text-sm ${collapsed ? 'justify-center w-10 h-10' : 'gap-3 px-2 py-1 min-w-0'}`} title={collapsed ? (userProfile?.province || (userProfile?.role === 'admin' ? 'Admin' : 'User')) : undefined}>
            <div className="p-1.5 bg-white/80 rounded-lg shrink-0 border border-[#A7D9F7]/50 shadow-sm">
              <Icon icon={userProfile?.role === 'admin' ? 'mdi:shield-account' : 'mdi:account'} className="text-lg text-[#84BC40]" />
            </div>
            <span className={`inline-block overflow-hidden whitespace-nowrap transition-all duration-200 ${collapsed ? 'max-w-0 opacity-0 min-w-0' : 'max-w-[8rem] opacity-100 delay-150 truncate'}`}>{userProfile?.province || (userProfile?.role === 'admin' ? 'Admin' : 'User')}</span>
          </div>
          <button onClick={handleLogoutClick} className={`group flex items-center text-red-600 hover:text-red-700 font-medium text-sm hover:bg-red-50/80 transition-all duration-200 rounded-xl active:scale-95 ${collapsed ? 'justify-center w-10 h-10 p-0 mt-1' : 'gap-3 w-full px-2 py-2.5'}`} title={collapsed ? 'Logout' : undefined}>
            <div className="p-1.5 shrink-0 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:logout" className="text-lg text-red-600 group-hover:text-red-700 group-hover:-translate-x-0.5 transition-all" />
            </div>
            <span className={`inline-block overflow-hidden whitespace-nowrap transition-all duration-200 ${collapsed ? 'max-w-0 opacity-0 min-w-0' : 'max-w-[4rem] opacity-100 delay-150'}`}>Logout</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen font-poppins bg-[#F2F8ED]">
      {/* Mobile: backdrop when sidebar open */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close menu"
        className={`fixed inset-0 z-40 bg-[#2E749E]/50 backdrop-blur-sm transition-opacity duration-300 sm:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeMobileMenu}
        onKeyDown={(e) => e.key === 'Escape' && closeMobileMenu()}
      />

      {/* Mobile: top bar with hamburger */}
      <header className="fixed top-0 left-0 right-0 z-30 flex sm:hidden items-center justify-between h-16 px-4 bg-[#F2F8ED] border-b border-[#A7D9F7]/50 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 text-[#8D4A25] hover:bg-[#A7D9F7]/20 rounded-xl transition-colors active:scale-95"
            aria-label="Open menu"
          >
            <Icon icon="mdi:menu" className="text-2xl" />
          </button>
          <Link to="/dashboard" onClick={closeMobileMenu} className="flex items-center gap-2.5 min-w-0">
            <img src="/LOGO_OA.png" alt="" className="h-8 w-8 object-cover shrink-0 rounded-md shadow-sm border border-[#A7D9F7]/40" />
            <span className="font-bold text-sm text-[#2E749E] truncate">MIMAROPA OA</span>
          </Link>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar: smooth gradient at every color change — Green → Brown → Blues → Cream */}
        <aside
          style={{
            background: 'linear-gradient(180deg, #84BC40 0%, #8D4A25 22%, #2E749E 42%, #1E88E5 60%, #A7D9F7 78%, #F2F8ED 100%)',
            transition: 'width 350ms cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'width',
          }}
          className={`fixed inset-y-0 left-0 z-50 flex flex-col h-screen overflow-hidden shadow-[4px_0_24px_rgba(46,116,158,0.2)]
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            sm:translate-x-0 sm:z-30
            ${collapsed ? 'w-[6rem]' : 'w-[17.5rem]'}
          `}
        >
          {sidebarContent}
        </aside>

        {/* Fixed collapse/expand button on sidebar edge — compact, minimal design */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          style={{
            left: collapsed ? 'calc(6rem - 14px)' : 'calc(17.5rem - 14px)',
            transition: 'left 350ms cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'left',
          }}
          className="fixed top-6 z-40 hidden sm:flex w-7 h-7 items-center justify-center rounded-full bg-white/95 text-[#2E749E] shadow-sm ring-1 ring-[#A7D9F7]/30 hover:ring-[#2E749E]/40 hover:shadow hover:bg-white active:scale-90"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon icon={collapsed ? 'mdi:chevron-right' : 'mdi:chevron-left'} className="text-base" />
        </button>

        {/* Main content — min-w-0 + overflow-x-hidden to prevent horizontal scroll on small screens */}
        <main
          style={{ transition: 'padding-left 350ms cubic-bezier(0.4, 0, 0.2, 1)', willChange: 'padding-left' }}
          className={`flex-1 min-w-0 mx-auto w-full max-w-full bg-[#F2F8ED] overflow-x-hidden ${
            collapsed ? 'sm:pl-[6rem]' : 'sm:pl-[17.5rem]'
          }`}
        >
          <div className="p-4 sm:p-6 lg:p-8 pt-20 sm:pt-6 lg:pt-8 min-h-screen flex flex-col min-w-0">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_4px_20px_rgba(167,217,247,0.15)] border border-[#A7D9F7]/30 flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Entry Modal */}
      {showEntryModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2E749E]/40 backdrop-blur-sm transition-opacity" onClick={() => setShowEntryModal(false)}>
          <div className="bg-white rounded-[1.5rem] shadow-2xl p-6 sm:p-8 max-w-sm w-full border border-[#A7D9F7]/40 transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#84BC40]/10 flex items-center justify-center border border-[#84BC40]/20 shrink-0">
                <Icon icon="mdi:plus-box-multiple" className="text-2xl text-[#84BC40]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#2E749E]">Select Form</h2>
                <p className="text-sm text-[#8D4A25]/70 mt-0.5">Choose a form type to encode</p>
              </div>
            </div>
            <div className="space-y-3">
              <Link
                to="/entry/individual"
                onClick={() => setShowEntryModal(false)}
                className="group flex items-center justify-between w-full p-4 bg-[#84BC40] text-white rounded-xl font-medium hover:brightness-110 shadow-md shadow-[#84BC40]/20 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <Icon icon="mdi:account-edit" className="text-xl" />
                  <span>Individual OA Profile</span>
                </div>
                <Icon icon="mdi:chevron-right" className="text-xl opacity-70 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/entry/fca"
                onClick={() => setShowEntryModal(false)}
                className="group flex items-center justify-between w-full p-4 bg-[#F2F8ED] border-2 border-[#A7D9F7]/50 text-[#2E749E] rounded-xl font-medium hover:bg-[#A7D9F7]/15 hover:border-[#A7D9F7] transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <Icon icon="mdi:account-group" className="text-xl text-[#1E88E5] group-hover:scale-110 transition-transform" />
                  <span>FCA Form</span>
                </div>
                <Icon icon="mdi:chevron-right" className="text-xl opacity-50 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <button onClick={() => setShowEntryModal(false)} className="mt-5 w-full py-3 rounded-xl text-[#8D4A25] font-semibold hover:bg-[#F2F8ED] transition-colors active:scale-[0.98]">
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2E749E]/40 backdrop-blur-sm transition-opacity" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-[1.5rem] shadow-2xl p-6 sm:p-8 max-w-sm w-full border border-[#A7D9F7]/40 transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
                <Icon icon="mdi:logout-variant" className="text-2xl text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#2E749E]">Logout</h2>
                <p className="text-sm text-[#8D4A25]/70 mt-0.5">Are you sure you want to leave?</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleLogoutConfirm(false)}
                className="flex-1 py-3 px-4 border-2 border-[#A7D9F7]/50 rounded-xl text-[#2E749E] font-semibold hover:bg-[#F2F8ED] hover:border-[#A7D9F7] transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLogoutConfirm(true)}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-semibold shadow-md shadow-red-600/25 hover:bg-red-700 transition-all active:scale-[0.98]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}