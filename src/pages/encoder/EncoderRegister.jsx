import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SharedAuthLayout from '../../components/SharedAuthLayout';
import PasswordInput from '../../components/PasswordInput';
import { useAuth } from '../../context/AuthContext';

export default function EncoderRegister() {
  const { province } = useParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const provinceName = decodeURIComponent(province || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, 'encoder', provinceName);
      if (rememberMe) {
        localStorage.setItem('rememberMe_email', email);
        localStorage.setItem('rememberMe_role', 'encoder');
        localStorage.setItem('rememberMe_province', provinceName);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SharedAuthLayout title={`Provincial Encoder Registration - ${provinceName}`}>
      <div>
        <form onSubmit={handleSubmit}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3 border border-oa-green/40 rounded-lg mb-4 focus:ring-2 focus:ring-oa-green" required />
          <div className="mb-4">
            <PasswordInput value={password} onChange={setPassword} placeholder="Password (min 6 characters)" required minLength={6} />
          </div>
          <div className="mb-4">
            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm Password" required />
          </div>
          <label className="flex items-center gap-2 text-sm text-oa-brown cursor-pointer mb-4">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded" />
            Remember Me
          </label>
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-oa-blue hover:bg-oa-blue-dark text-white rounded-lg font-medium transition disabled:opacity-50">
            {loading ? 'Registering...' : 'Register'}
          </button>
          <p className="mt-4 text-center text-sm text-oa-brown">
            Already have an account? <Link to={`/encoder/${province}/login`} className="text-oa-blue font-medium hover:underline">Login</Link>
          </p>
        </form>
        <Link to="/encoder/select-province" className="block mt-4 text-center text-sm text-oa-brown hover:underline">← Back to Province Selection</Link>
      </div>
    </SharedAuthLayout>
  );
}
