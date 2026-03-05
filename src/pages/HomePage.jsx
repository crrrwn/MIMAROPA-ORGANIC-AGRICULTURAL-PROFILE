import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-poppins p-6 bg-[#F2F8ED]">
      <div className="w-full max-w-md text-center p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#F2F8ED] border border-[#A7D9F7]/50 mb-5 overflow-hidden">
          <img src="/LOGO_OA.png" alt="OA Logo" className="w-11 h-11 object-contain rounded-lg" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-1.5 tracking-tight">
          MIMAROPA Organic Profile
        </h1>
        <p className="text-slate-600 text-sm mb-6">
          Organic Agriculture Profile Management System
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/admin/login"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#84BC40] hover:bg-[#84BC40]/90 text-white rounded-xl text-sm font-semibold border border-[#84BC40]"
          >
            <Icon icon="mdi:shield-account" className="text-lg shrink-0" />
            Admin Login
          </Link>
          <Link
            to="/encoder/select-province"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2E749E] hover:bg-[#2E749E]/90 text-white rounded-xl text-sm font-semibold border border-[#2E749E]"
          >
            <Icon icon="mdi:account-group" className="text-lg shrink-0" />
            Provincial Encoder
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Select your role to continue
        </p>
      </div>
    </div>
  );
}
