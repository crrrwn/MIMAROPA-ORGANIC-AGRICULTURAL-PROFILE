import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import SharedAuthLayout from '../../components/SharedAuthLayout';
import PasswordInput from '../../components/PasswordInput';
import { useAuth } from '../../context/AuthContext';

const inputBase =
  'w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border-2 border-palette-sky/50 text-palette-brown placeholder:text-palette-slate/70 focus:border-palette-blue focus:ring-2 focus:ring-palette-blue/20 focus:bg-palette-cream/30 outline-none';

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
    <SharedAuthLayout title={`Provincial Encoder Registration — ${provinceName}`} backHref="/encoder/select-province" backIconOnly>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-palette-brown mb-1">Email</label>
          <div className="relative">
            <Icon icon="mdi:email-outline" className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-palette-slate pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputBase}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-palette-brown mb-1">Password (min 6 characters)</label>
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="Create a password"
            required
            minLength={6}
            iconLeft={<Icon icon="mdi:lock-outline" className="text-lg text-palette-slate" />}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-palette-brown mb-1">Confirm Password</label>
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter password"
            required
            iconLeft={<Icon icon="mdi:lock-check-outline" className="text-lg text-palette-slate" />}
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-palette-brown cursor-pointer group">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-2 border-palette-slate/50 text-palette-green focus:ring-palette-green/30"
          />
          <span className="group-hover:text-palette-brown/90">Remember Me</span>
        </label>

        {error && (
          <p className="text-red-600 text-xs flex items-center gap-1.5">
            <Icon icon="mdi:alert-circle-outline" className="text-base shrink-0" />
            {error}
          </p>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm bg-palette-green text-white rounded-xl font-semibold shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[40px] hover:opacity-90"
          >
            {loading ? (
              <>
                <Icon icon="mdi:loading" className="text-lg" />
                Registering...
              </>
            ) : (
              <>
                <Icon icon="mdi:account-plus" className="text-lg" />
                Register
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-palette-slate pt-0.5">
          Already have an account?{' '}
          <Link
            to={`/encoder/${province}/login`}
            className="text-palette-green font-semibold hover:underline underline-offset-2 text-sm"
          >
            Login
          </Link>
        </p>
      </form>
    </SharedAuthLayout>
  );
}
