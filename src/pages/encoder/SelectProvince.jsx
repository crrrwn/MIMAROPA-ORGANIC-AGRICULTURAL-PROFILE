import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import SharedAuthLayout from '../../components/SharedAuthLayout';
import { PROVINCES } from '../../constants';

export default function SelectProvince() {
  const [province, setProvince] = useState('');
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleContinue = () => {
    if (!province) return;
    navigate(`/encoder/${encodeURIComponent(province)}/login`);
  };

  const triggerBase =
    'w-full h-12 rounded-xl border-2 text-left bg-white outline-none cursor-pointer grid grid-cols-[2.5rem_1fr_2.5rem] items-center ' +
    (open
      ? 'border-palette-blue ring-2 ring-palette-blue/20 bg-palette-cream/30'
      : 'border-palette-sky/50 text-palette-brown hover:border-palette-sky focus:border-palette-blue focus:ring-2 focus:ring-palette-blue/20');

  return (
    <SharedAuthLayout title="Provincial Encoder — Select Province" backHref="/" backIconOnly>
      <div className="rounded-xl bg-palette-cream/50 border border-palette-sky/40 p-4 space-y-4 overflow-visible">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-palette-blue/10 flex items-center justify-center">
            <Icon icon="mdi:map-marker-radius" className="text-xl text-palette-blue" />
          </div>
          <div>
            <h2 className="text-base font-bold text-palette-brown">Select your province</h2>
            <p className="text-xs text-palette-slate">Choose your MIMAROPA province to continue</p>
          </div>
        </div>

        <div ref={dropdownRef} className="relative">
          <label className="block text-xs font-medium text-palette-brown mb-1.5">Province</label>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={triggerBase}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label="Select province"
          >
            <span className="flex items-center justify-center w-10 h-full">
              <Icon icon="mdi:map-marker" className="text-lg text-palette-slate" />
            </span>
            <span className={`flex items-center text-sm truncate px-1 ${province ? 'text-palette-brown' : 'text-palette-slate/70'}`}>
              {province || '— Choose Province —'}
            </span>
            <span className={`flex items-center justify-center w-10 h-full ${open ? 'rotate-180' : ''}`}>
              <Icon icon="mdi:chevron-down" className="text-lg text-palette-slate" />
            </span>
          </button>

          {open && (
            <ul
              role="listbox"
              className="absolute z-20 bottom-full left-0 w-full mb-1.5 py-1.5 rounded-xl border-2 border-palette-sky/50 bg-white shadow-lg max-h-[220px] overflow-y-auto overflow-x-hidden"
            >
              <li role="option" aria-selected={!province}>
                <button
                  type="button"
                  onClick={() => {
                    setProvince('');
                    setOpen(false);
                  }}
                  className={`relative w-full pl-10 pr-4 py-2.5 text-left text-sm flex items-center gap-2 min-h-[40px] ${!province ? 'bg-palette-sky/20 text-palette-brown font-medium' : 'text-palette-slate hover:bg-palette-cream/70'}`}
                >
                  <Icon icon="mdi:map-marker-outline" className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-palette-slate shrink-0 w-5 h-5" />
                  <span>— Choose Province —</span>
                </button>
              </li>
              {PROVINCES.map((p) => (
                <li key={p} role="option" aria-selected={province === p}>
                  <button
                    type="button"
                    onClick={() => {
                      setProvince(p);
                      setOpen(false);
                    }}
                    className={`relative w-full pl-10 pr-4 py-2.5 text-left text-sm flex items-center min-h-[40px] border-t border-palette-sky/20 ${province === p ? 'bg-palette-green/15 text-palette-brown font-medium' : 'text-palette-brown hover:bg-palette-cream/70 hover:text-palette-brown'}`}
                  >
                    <Icon
                      icon="mdi:map-marker"
                      className={`absolute left-3 top-1/2 -translate-y-1/2 shrink-0 w-5 h-5 ${province === p ? 'text-palette-green' : 'text-palette-slate'}`}
                    />
                    <span>{p}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={handleContinue}
          disabled={!province}
          className="w-full py-2.5 text-sm bg-palette-green text-white rounded-xl font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[40px] hover:opacity-90"
        >
          Continue
          <Icon icon="mdi:arrow-right" className="text-lg" />
        </button>
      </div>
    </SharedAuthLayout>
  );
}
