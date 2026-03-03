import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

export default function SharedAuthLayout({ children, title, backHref, hideBack, backIconOnly }) {
  const showBack = backHref && !hideBack;
  return (
    <div className="min-h-screen flex font-poppins bg-palette-cream/40">
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* palette accents: sky + green soft blurs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-palette-sky/30 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-palette-green/15 rounded-full blur-3xl translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-palette-blue/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="w-full max-w-sm bg-white rounded-2xl shadow-elevated border border-palette-sky/30 p-5 sm:p-6 relative">
          {showBack && (
            <Link
              to={backHref}
              className={`absolute top-3 left-3 inline-flex items-center justify-center rounded-xl border-2 border-palette-sky/50 bg-palette-cream/60 text-palette-brown hover:bg-palette-sky/25 hover:border-palette-blue/40 ${backIconOnly ? 'p-2' : 'gap-2 px-3 py-2 text-sm font-medium'}`}
              title="Back"
              aria-label="Back"
            >
              <Icon icon="mdi:arrow-left" className="text-lg" />
              {!backIconOnly && <span>Back</span>}
            </Link>
          )}
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-palette-cream border border-palette-green/30 mb-3 overflow-hidden">
              <img src="/LOGO_OA.png" alt="OA Logo" className="w-10 h-10 object-cover rounded-lg" />
            </div>
            <h1 className="text-xl font-bold text-palette-brown tracking-tight">MIMAROPA Organic Profile</h1>
            <p className="text-palette-green mt-0.5 text-sm font-semibold">{title}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
