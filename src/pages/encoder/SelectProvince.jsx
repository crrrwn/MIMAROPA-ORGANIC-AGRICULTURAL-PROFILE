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
    <SharedAuthLayout title="Provincial Encoder - Select Province">
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-oa-green/20">
        <label className="block text-sm font-medium text-oa-brown mb-2">Select your province</label>
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="w-full px-4 py-3 border border-oa-green/40 rounded-lg focus:ring-2 focus:ring-oa-green focus:border-transparent"
        >
          <option value="">-- Choose Province --</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          onClick={handleContinue}
          disabled={!province}
          className="mt-4 w-full py-3 bg-oa-blue hover:bg-oa-blue-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
        >
          Continue
          <Icon icon="mdi:arrow-right" />
        </button>
        <Link to="/" className="block mt-4 text-center text-sm text-oa-brown hover:text-oa-green">
          ← Back to Home
        </Link>
      </div>
    </SharedAuthLayout>
  );
}
