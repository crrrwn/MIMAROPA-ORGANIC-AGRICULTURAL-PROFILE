import { Icon } from '@iconify/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-oa-cream/30 font-poppins">
      <header className="bg-oa-green shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-3">
              <img src="/LOGO_OA.png" alt="OA Logo" className="h-10 w-10 rounded-full object-cover" />
              <span className="text-white font-semibold text-lg">MIMAROPA Organic Profile</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-white/90 text-sm">
                {userProfile?.province || (userProfile?.role === 'admin' ? 'Admin' : 'User')}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition"
              >
                <Icon icon="mdi:logout" className="text-lg" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}
