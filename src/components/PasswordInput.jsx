import { useState } from 'react';
import { Icon } from '@iconify/react';

export default function PasswordInput({ value, onChange, placeholder, required, minLength, className = '' }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className={`w-full px-4 py-3 pr-12 border border-oa-green/40 rounded-lg focus:ring-2 focus:ring-oa-green focus:border-transparent ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-oa-brown/70 hover:text-oa-green"
        tabIndex={-1}
      >
        <Icon icon={show ? 'mdi:eye-off' : 'mdi:eye'} className="text-xl" />
      </button>
    </div>
  );
}
