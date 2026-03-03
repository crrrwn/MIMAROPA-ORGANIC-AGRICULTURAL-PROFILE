import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => setShowLogoutConfirm(true);

  const handleLogoutConfirm = (confirm) => {
    setShowLogoutConfirm(false);
    if (confirm) {
      signOut();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen font-poppins bg-gradient-to-b from-palette-cream/40 via-palette-cream/20 to-palette-sky/20">
      <header
        className="sticky top-0 z-10 shadow-xl border-b border-white/20 overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, #84C444 0%, #8D5A38 20%, #1E78D1 40%, #346A8E 60%, #A3D2EA 80%, #F4F8EB 100%)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.08) 0%, transparent 50%, rgba(0,0,0,0.18) 100%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-white/30 flex items-center justify-center overflow-hidden ring-2 ring-white/50 shadow-inner backdrop-blur-sm">
                <img src="/LOGO_OA.png" alt="OA Logo" className="h-9 w-9 object-cover rounded-lg" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight drop-shadow-md" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                MIMAROPA Organic Profile
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center justify-center gap-2 min-w-[110px] h-10 px-4 rounded-xl text-sm font-semibold text-white border border-white/30 shadow-md" style={{ backgroundColor: 'rgba(52, 106, 142, 0.95)' }}>
                <Icon icon={userProfile?.role === 'admin' ? 'mdi:shield-account' : 'mdi:account'} className="text-lg shrink-0" />
                {userProfile?.province || (userProfile?.role === 'admin' ? 'Admin' : 'User')}
              </span>
              <button
                onClick={handleLogoutClick}
                className="flex items-center justify-center gap-2 min-w-[110px] h-10 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold border border-red-800/50 shadow-md transition-colors"
              >
                <Icon icon="mdi:logout" className="text-lg" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border-2 border-palette-sky/40" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-palette-brown mb-2">Logout</h2>
            <p className="text-palette-slate mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleLogoutConfirm(true)}
                className="flex-1 py-2.5 px-4 bg-palette-green text-white rounded-xl font-semibold shadow-sm hover:opacity-90"
              >
                Yes
              </button>
              <button
                onClick={() => handleLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 border-2 border-palette-sky/50 rounded-xl text-palette-brown font-medium hover:bg-palette-cream/50"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
