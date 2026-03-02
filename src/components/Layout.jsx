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
    <div className="min-h-screen bg-gray-100 font-poppins">
      <header className="bg-oa-blue sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-3">
              <img src="/LOGO_OA.png" alt="OA Logo" className="h-10 w-10 rounded-xl object-cover ring-2 ring-white/30" />
              <span className="text-white font-semibold text-lg tracking-tight">MIMAROPA Organic Profile</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-block px-3 py-1.5 bg-white/20 text-white text-sm font-medium rounded-lg">
                {userProfile?.province || (userProfile?.role === 'admin' ? 'Admin' : 'User')}
              </span>
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-2 px-4 py-2 text-white/90 hover:bg-white/20 rounded-lg font-medium transition-colors"
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
          <div className="bg-white rounded-2xl shadow-elevated p-6 max-w-sm w-full border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Logout</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleLogoutConfirm(true)}
                className="flex-1 py-2.5 px-4 bg-oa-green hover:bg-oa-green-dark text-white rounded-lg font-medium shadow-sm transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => handleLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
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
