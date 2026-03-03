import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-poppins p-6 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/oabg.png')" }}>
      <div className="w-full max-w-lg text-center p-9 rounded-3xl bg-white/10 backdrop-blur-md border-2 border-white/30 shadow-2xl overflow-hidden relative">
        {/* subtle gradient glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-oa-green/5 via-transparent to-oa-blue/5 pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-soft border-2 border-oa-green/30 mb-6 overflow-hidden">
            <img src="/LOGO_OA.png" alt="OA Logo" className="w-14 h-14 object-cover rounded-xl" />
          </div>
          <h1
            className="text-2xl font-bold text-white mb-2 tracking-tight"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)' }}
          >
            MIMAROPA Organic Profile
          </h1>
          <p
            className="text-white mb-8 text-center font-medium"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
          >
            Organic Agriculture Profile Management System
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center px-8 sm:px-10">
            <Link
              to="/admin/login"
              className="flex items-center justify-center gap-3 px-6 py-3 bg-oa-green hover:bg-oa-green-dark text-white rounded-2xl shadow-md font-medium whitespace-nowrap"
            >
              <Icon icon="mdi:shield-account" className="text-xl shrink-0" />
              Admin Login
            </Link>
            <Link
              to="/encoder/select-province"
              className="flex items-center justify-center gap-3 px-6 py-3 bg-oa-blue hover:bg-oa-blue-dark text-white rounded-2xl shadow-md font-medium whitespace-nowrap"
            >
              <Icon icon="mdi:account-group" className="text-xl shrink-0" />
              Provincial Encoder
            </Link>
          </div>

          <p className="mt-8 text-sm text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            Select your role to continue
          </p>
        </div>
      </div>
    </div>
  );
}
