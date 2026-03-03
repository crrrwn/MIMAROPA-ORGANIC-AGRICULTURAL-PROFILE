import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import SharedAuthLayout from '../../components/SharedAuthLayout';
import { PROVINCES } from '../../constants';

export default function SelectProvince() {
  const [province, setProvince] = useState('');
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!province) return;
    navigate(`/encoder/${encodeURIComponent(province)}/login`);
  };

  return (
    <SharedAuthLayout title="Provincial Encoder - Select Province" backHref="/">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select your province</label>
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="input-base"
        >
          <option value="">-- Choose Province --</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          onClick={handleContinue}
          disabled={!province}
          className="mt-4 w-full py-3 bg-oa-green hover:bg-oa-green-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-sm transition-all flex items-center justify-center gap-2"
        >
          Continue
          <Icon icon="mdi:arrow-right" />
        </button>
      </div>
    </SharedAuthLayout>
  );
}
