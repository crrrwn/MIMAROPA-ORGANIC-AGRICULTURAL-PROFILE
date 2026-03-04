import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SIDEBAR_COLLAPSED_KEY = 'mimaropa-sidebar-collapsed';

const NAV_ITEMS = [
  { to: '/dashboard', icon: 'mdi:view-dashboard', label: 'Dashboard', match: (path) => path === '/dashboard' },
  { to: '/individual-forms', icon: 'mdi:account-edit', label: 'Individual', match: (path) => path === '/individual-forms' },
  { to: '/fca-forms', icon: 'mdi:account-group', label: 'FCA', match: (path) => path === '/fca-forms' },
  { to: '/encoded-forms', icon: 'mdi:file-document-multiple', label: 'Encoded Forms', match: (path) => path === '/encoded-forms' },
];

export default function Layout({ children }) {
  const { userProfile, signOut, isAdmin } = useAuth();
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
      signOut();
      navigate('/');
    }
  };

  // PALETTE MAP:
  // Primary Blue: #1075BB
  // Dark Slate Blue: #29658A
  // Brown: #7A5230
  // Light Blue: #A8D0E6
  // Cream: #F4F6EA
  // Green: #8EBC45

  const linkClass = (isActive) =>
    `group flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl outline-none ${
      isActive 
        ? 'bg-[#1075BB] text-white shadow-md shadow-[#1075BB]/20' 
        : 'text-[#F4F6EA]/80 hover:bg-[#A8D0E6]/10 hover:text-white hover:translate-x-1'
    } ${collapsed ? 'justify-center px-0' : ''}`;

  const sidebarContent = (
    <>
      <div className="relative flex flex-col flex-1 min-h-0">
        
        {/* Header/Logo Section */}
        <div className="relative flex items-center justify-between px-4 py-5 border-b border-white/10">
          <Link
            to="/dashboard"
            onClick={closeMobileMenu}
            className={`flex items-center gap-3 min-w-0 transition-opacity hover:opacity-90 ${collapsed ? 'justify-center w-full sm:w-auto' : ''}`}
          >
            <div className="bg-[#F4F6EA] p-1 rounded-xl shadow-sm shrink-0">
              <img src="/LOGO_OA.png" alt="OA Logo" className="h-8 w-8 object-contain rounded-lg" />
            </div>
            {!collapsed && (
              <span className="text-white font-bold text-lg leading-tight truncate tracking-wide">
                MIMAROPA
                <span className="block text-xs font-semibold text-[#A8D0E6] mt-0.5 uppercase tracking-wider">Organic Profile</span>
              </span>
            )}
          </Link>
          <button type="button" onClick={closeMobileMenu} className="sm:hidden p-2 text-[#A8D0E6] hover:text-white hover:bg-white/10 rounded-lg transition-colors active:scale-95" aria-label="Close menu">
            <Icon icon="mdi:close" className="text-xl" />
          </button>
          {!collapsed && (
            <button type="button" onClick={() => setCollapsed(true)} className="hidden sm:block p-1.5 text-[#A8D0E6] hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0 active:scale-95" title="Collapse sidebar">
              <Icon icon="mdi:chevron-left" className="text-xl" />
            </button>
          )}
        </div>
        
        {/* Expand Button (when collapsed) */}
        {collapsed && (
          <div className="relative hidden sm:flex justify-center py-3 border-b border-white/10">
            <button type="button" onClick={() => setCollapsed(false)} className="p-2 text-[#A8D0E6] hover:text-white hover:bg-white/10 rounded-xl transition-colors active:scale-95" title="Expand sidebar">
              <Icon icon="mdi:chevron-right" className="text-xl" />
            </button>
          </div>
        )}
        
        {/* Navigation */}
        <nav className="relative flex-1 mt-6 overflow-y-auto overflow-x-hidden space-y-2 px-3 pb-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {isEncoder && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => { setShowEntryModal(true); closeMobileMenu(); }}
                className={`w-full inline-flex items-center justify-center text-white font-semibold text-sm bg-[#8EBC45] hover:brightness-95 shadow-md shadow-[#8EBC45]/30 transition-all duration-200 rounded-xl active:scale-95 ${collapsed ? 'p-3' : 'gap-2.5 px-4 py-3'}`}
                title="New Entry"
              >
                <Icon icon="mdi:plus-circle" className="text-xl shrink-0" />
                {!collapsed && <span>New Entry</span>}
              </button>
            </div>
          )}
          {NAV_ITEMS.map(({ to, icon, label, match }) => {
            const isActive = match(location.pathname);
            return (
              <Link key={to} to={to} onClick={closeMobileMenu} className={linkClass(isActive)} title={collapsed ? label : undefined}>
                <Icon icon={icon} className={`text-xl shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile & Logout */}
        <div className={`relative flex flex-col gap-2 px-3 py-4 border-t border-white/10 bg-black/10 backdrop-blur-sm ${collapsed ? 'items-center' : ''}`}>
          <div className={`flex items-center text-[#F4F6EA] font-medium text-sm ${collapsed ? 'justify-center w-10 h-10' : 'gap-3 px-2 py-1 min-w-0'}`} title={collapsed ? (userProfile?.province || (userProfile?.role === 'admin' ? 'Admin' : 'User')) : undefined}>
            <div className="p-1.5 bg-white/10 rounded-lg shrink-0 border border-white/10">
              <Icon icon={userProfile?.role === 'admin' ? 'mdi:shield-account' : 'mdi:account'} className="text-lg text-[#8EBC45]" />
            </div>
            {!collapsed && <span className="truncate">{userProfile?.province || (userProfile?.role === 'admin' ? 'Admin' : 'User')}</span>}
          </div>
          <button onClick={handleLogoutClick} className={`group flex items-center text-[#A8D0E6] hover:text-white font-medium text-sm hover:bg-white/10 transition-all duration-200 rounded-xl active:scale-95 ${collapsed ? 'justify-center w-10 h-10 p-0 mt-1' : 'gap-3 w-full px-2 py-2.5'}`} title={collapsed ? 'Logout' : undefined}>
            <Icon icon="mdi:logout" className="text-lg shrink-0 group-hover:-translate-x-0.5 transition-transform" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen font-poppins bg-[#F4F6EA]">
      {/* Mobile: backdrop when sidebar open */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close menu"
        className={`fixed inset-0 z-40 bg-[#29658A]/60 backdrop-blur-sm transition-opacity duration-300 sm:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeMobileMenu}
        onKeyDown={(e) => e.key === 'Escape' && closeMobileMenu()}
      />

      {/* Mobile: top bar with hamburger */}
      <header className="fixed top-0 left-0 right-0 z-30 flex sm:hidden items-center justify-between h-16 px-4 bg-[#F4F6EA] border-b border-[#A8D0E6]/50 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 text-[#7A5230] hover:bg-[#A8D0E6]/20 rounded-xl transition-colors active:scale-95"
            aria-label="Open menu"
          >
            <Icon icon="mdi:menu" className="text-2xl" />
          </button>
          <Link to="/dashboard" onClick={closeMobileMenu} className="flex items-center gap-2.5 min-w-0">
            <img src="/LOGO_OA.png" alt="" className="h-8 w-8 object-cover shrink-0 rounded-md shadow-sm border border-[#A8D0E6]/30" />
            <span className="font-bold text-sm text-[#7A5230] truncate">MIMAROPA OA</span>
          </Link>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar: Dark Slate Blue Theme */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out bg-[#29658A] shadow-[4px_0_24px_rgba(41,101,138,0.15)]
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            sm:translate-x-0 sm:z-30
            ${collapsed ? 'w-[4.5rem]' : 'w-64'}
          `}
        >
          {sidebarContent}
        </aside>

        {/* Main content */}
        <main
          className={`flex-1 mx-auto w-full transition-all duration-300 ease-in-out bg-[#F4F6EA] ${
            collapsed ? 'sm:pl-[4.5rem]' : 'sm:pl-64'
          }`}
        >
          <div className="p-4 sm:p-6 lg:p-8 pt-20 sm:pt-6 lg:pt-8 min-h-screen flex flex-col">
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(168,208,230,0.2)] border border-[#A8D0E6]/40 flex-1 p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Entry Modal */}
      {showEntryModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#29658A]/50 backdrop-blur-sm transition-opacity" onClick={() => setShowEntryModal(false)}>
          <div className="bg-white rounded-[1.5rem] shadow-2xl p-6 sm:p-8 max-w-sm w-full border border-[#A8D0E6]/50 transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#8EBC45]/10 flex items-center justify-center border border-[#8EBC45]/20 shrink-0">
                <Icon icon="mdi:plus-box-multiple" className="text-2xl text-[#8EBC45]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#29658A]">Select Form</h2>
                <p className="text-sm text-[#7A5230]/70 mt-0.5">Choose a form type to encode</p>
              </div>
            </div>
            <div className="space-y-3">
              <Link
                to="/entry/individual"
                onClick={() => setShowEntryModal(false)}
                className="group flex items-center justify-between w-full p-4 bg-[#8EBC45] text-white rounded-xl font-medium hover:brightness-95 shadow-md shadow-[#8EBC45]/20 transition-all active:scale-[0.98]"
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
                className="group flex items-center justify-between w-full p-4 bg-[#F4F6EA] border-2 border-[#A8D0E6]/40 text-[#29658A] rounded-xl font-medium hover:bg-[#A8D0E6]/20 hover:border-[#A8D0E6] transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <Icon icon="mdi:account-group" className="text-xl text-[#1075BB] group-hover:scale-110 transition-transform" />
                  <span>FCA Form</span>
                </div>
                <Icon icon="mdi:chevron-right" className="text-xl opacity-50 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <button onClick={() => setShowEntryModal(false)} className="mt-5 w-full py-3 rounded-xl text-[#7A5230] font-semibold hover:bg-[#F4F6EA] transition-colors active:scale-[0.98]">
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#29658A]/50 backdrop-blur-sm transition-opacity" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-[1.5rem] shadow-2xl p-6 sm:p-8 max-w-sm w-full border border-[#A8D0E6]/50 transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
                <Icon icon="mdi:logout-variant" className="text-2xl text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#29658A]">Logout</h2>
                <p className="text-sm text-[#7A5230]/70 mt-0.5">Are you sure you want to leave?</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleLogoutConfirm(false)}
                className="flex-1 py-3 px-4 border-2 border-[#A8D0E6]/40 rounded-xl text-[#29658A] font-semibold hover:bg-[#F4F6EA] hover:border-[#A8D0E6] transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLogoutConfirm(true)}
                className="flex-1 py-3 px-4 bg-[#7A5230] text-white rounded-xl font-semibold shadow-md shadow-[#7A5230]/20 hover:brightness-110 transition-all active:scale-[0.98]"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}