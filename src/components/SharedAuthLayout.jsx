import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

export default function SharedAuthLayout({ children, title, backHref }) {
  return (
    <div className="min-h-screen flex font-poppins bg-gradient-to-b from-gray-100 to-gray-50">
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 sm:p-8 relative">
          {backHref && (
            <Link
              to={backHref}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
              title="Close"
              aria-label="Close"
            >
              <Icon icon="mdi:close" className="text-2xl" />
            </Link>
          )}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-50 border-2 border-gray-200 mb-4 overflow-hidden">
              <img src="/LOGO_OA.png" alt="OA Logo" className="w-14 h-14 object-cover rounded-xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">MIMAROPA Organic Profile</h1>
            <p className="text-gray-600 mt-1 font-medium">{title}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
