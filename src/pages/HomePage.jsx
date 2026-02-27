import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-poppins bg-gradient-to-br from-oa-green/20 via-oa-cream to-oa-blue/20 p-6">
      <img src="/LOGO_OA.png" alt="OA Logo" className="h-24 w-24 rounded-full object-cover shadow-xl mb-6" />
      <h1 className="text-3xl font-bold text-oa-green-dark mb-2">MIMAROPA Organic Profile</h1>
      <p className="text-oa-brown mb-12 text-center">Organic Agriculture Profile Management System</p>

      <div className="flex flex-col sm:flex-row gap-6">
        <Link
          to="/admin/login"
          className="flex items-center gap-3 px-8 py-4 bg-oa-green hover:bg-oa-green-dark text-white rounded-xl shadow-lg transition font-medium"
        >
          <Icon icon="mdi:shield-account" className="text-2xl" />
          Admin Login
        </Link>
        <Link
          to="/encoder/select-province"
          className="flex items-center gap-3 px-8 py-4 bg-oa-blue hover:bg-oa-blue-dark text-white rounded-xl shadow-lg transition font-medium"
        >
          <Icon icon="mdi:account-group" className="text-2xl" />
          Provincial Encoder
        </Link>
      </div>

      <p className="mt-12 text-sm text-oa-brown/80">
        Select your role to continue
      </p>
    </div>
  );
}
