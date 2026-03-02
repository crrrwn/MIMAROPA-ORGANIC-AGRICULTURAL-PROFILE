import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-poppins p-6 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/oabg.png')" }}>
      <div
        className="w-full max-w-xl text-center p-14 rounded-3xl bg-white/10 backdrop-blur-md border-2 border-white/30 shadow-2xl overflow-hidden relative"
        style={{ animation: 'fade-in-up 0.6s ease-out forwards, card-float 4s ease-in-out 0.6s infinite' }}
      >
        {/* subtle gradient glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-oa-green/5 via-transparent to-oa-blue/5 pointer-events-none" />
        <div className="relative">
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-soft border-2 border-oa-green/30 mb-8 overflow-hidden"
            style={{ animation: 'text-fade-in-up 0.5s ease-out 0.1s both, float 3s ease-in-out 0.6s infinite' }}
          >
            <img src="/LOGO_OA.png" alt="OA Logo" className="w-16 h-16 object-cover rounded-xl" />
          </div>
          <h1
            className="text-3xl font-bold text-white mb-2 tracking-tight"
            style={{
              textShadow: '0 1px 4px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
              animation: 'text-fade-in-up 0.6s ease-out 0.2s both',
            }}
          >
            MIMAROPA Organic Profile
          </h1>
          <p
            className="text-white mb-10 text-center font-medium"
            style={{
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              animation: 'text-fade-in-up 0.6s ease-out 0.4s both',
            }}
          >
            Organic Agriculture Profile Management System
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            style={{ animation: 'text-fade-in-up 0.6s ease-out 0.6s both' }}
          >
            <Link
              to="/admin/login"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-oa-green hover:bg-oa-green-dark text-white rounded-xl shadow-md hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 font-medium transition-all duration-300 whitespace-nowrap"
            >
              <Icon icon="mdi:shield-account" className="text-2xl shrink-0" />
              Admin Login
            </Link>
            <Link
              to="/encoder/select-province"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-oa-blue hover:bg-oa-blue-dark text-white rounded-xl shadow-md hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 font-medium transition-all duration-300 whitespace-nowrap"
            >
              <Icon icon="mdi:account-group" className="text-2xl shrink-0" />
              Provincial Encoder
            </Link>
          </div>

          <p
            className="mt-10 text-sm text-white"
            style={{
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              animation: 'text-fade-in-up 0.6s ease-out 0.8s both',
            }}
          >
            Select your role to continue
          </p>
        </div>
      </div>
    </div>
  );
}
