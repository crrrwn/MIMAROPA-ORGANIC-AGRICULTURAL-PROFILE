import { useState } from 'react';
import { Icon } from '@iconify/react';

export default function PasswordInput({ value, onChange, placeholder, required, minLength, className = '', iconLeft }) {
  const [show, setShow] = useState(false);
  const hasLeftIcon = !!iconLeft;
  const inputClasses = [
    'w-full py-2.5 pr-10 text-sm border-2 border-palette-sky/50 rounded-xl text-palette-brown placeholder:text-palette-slate/70',
    'focus:ring-2 focus:ring-palette-blue/20 focus:border-palette-blue focus:bg-palette-cream/30 outline-none',
    hasLeftIcon ? 'pl-10' : 'px-3',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="relative">
      {hasLeftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-palette-slate pointer-events-none">
          {iconLeft}
        </div>
      )}
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className={inputClasses}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-palette-slate hover:text-palette-blue"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        <Icon icon={show ? 'mdi:eye-off' : 'mdi:eye'} className="text-lg" />
      </button>
    </div>
  );
}
