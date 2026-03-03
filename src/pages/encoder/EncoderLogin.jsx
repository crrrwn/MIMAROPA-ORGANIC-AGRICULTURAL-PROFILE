import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import SharedAuthLayout from '../../components/SharedAuthLayout';
import PasswordInput from '../../components/PasswordInput';
import { useAuth } from '../../context/AuthContext';

const inputBase =
  'w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border-2 border-palette-sky/50 text-palette-brown placeholder:text-palette-slate/70 focus:border-palette-blue focus:ring-2 focus:ring-palette-blue/20 focus:bg-palette-cream/30 outline-none';

export default function EncoderLogin() {
  const { province } = useParams();
  const [email, setEmail] = useState(localStorage.getItem('rememberMe_province') === province ? localStorage.getItem('rememberMe_email') || '' : '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberMe_email'));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const { signIn, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const provinceName = decodeURIComponent(province || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password, rememberMe, 'encoder', provinceName);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await forgotPassword(forgotEmail);
      setForgotSent(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <SharedAuthLayout title={`Provincial Encoder — ${provinceName}`} backHref="/encoder/select-province" hideBack={showForgot} backIconOnly>
      <div className="relative">
        {showForgot ? (
          <div key="forgot" className="rounded-xl bg-palette-cream/50 border border-palette-sky/40 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-palette-blue/10 flex items-center justify-center">
                <Icon icon="mdi:key-variant" className="text-xl text-palette-blue" />
              </div>
              <div>
                <h2 className="text-base font-bold text-palette-brown">Forgot Password?</h2>
                <p className="text-xs text-palette-slate">We’ll send you a reset link</p>
              </div>
            </div>
            <p className="text-xs text-palette-brown/90 mb-4">
              Enter the email linked to your encoder account. We’ll send instructions to reset your password.
            </p>
            {forgotSent ? (
              <div className="rounded-xl bg-palette-green/10 border border-palette-green/30 p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-palette-green/20 flex items-center justify-center mx-auto mb-3">
                  <Icon icon="mdi:email-check" className="text-2xl text-palette-green" />
                </div>
                <p className="text-sm font-semibold text-palette-brown mb-1">Check your email</p>
                <p className="text-xs text-palette-slate mb-3">
                  We’ve sent a password reset link to <span className="font-medium text-palette-brown">{forgotEmail}</span>
                </p>
                <p className="text-xs text-palette-slate/90 mb-4">
                  Can’t see it? Check your spam or junk folder. The link usually expires in 1 hour.
                </p>
                <button
                  onClick={() => { setShowForgot(false); setForgotSent(false); }}
                  className="w-full py-2.5 text-sm bg-palette-green text-white rounded-xl font-semibold hover:opacity-90 inline-flex items-center justify-center gap-2"
                >
                  <Icon icon="mdi:arrow-left" className="text-base" />
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div className="relative">
                  <Icon icon="mdi:email-outline" className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-palette-slate pointer-events-none" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Encoder email address"
                    className={inputBase}
                    required
                  />
                </div>
                {error && (
                  <p key={error} className="text-red-600 text-xs flex items-center gap-1.5">
                    <Icon icon="mdi:alert-circle-outline" className="shrink-0" />
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 text-sm bg-palette-blue text-white rounded-xl font-semibold hover:opacity-90 shadow-sm"
                >
                  Send Reset Link
                </button>
              </form>
            )}
            {!forgotSent && (
              <button
                onClick={() => { setShowForgot(false); setForgotSent(false); }}
                className="mt-3 w-full py-2.5 text-sm rounded-xl border-2 border-palette-slate/40 text-palette-brown font-medium inline-flex items-center justify-center gap-2 hover:bg-palette-cream/70 hover:border-palette-slate/60"
              >
                <Icon icon="mdi:arrow-left" className="text-base" />
                Back to Login
              </button>
            )}
          </div>
        ) : (
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
              <label className="block text-xs font-medium text-palette-brown mb-1">Password</label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                required
                iconLeft={<Icon icon="mdi:lock-outline" className="text-lg text-palette-slate" />}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-palette-brown cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-2 border-palette-slate/50 text-palette-green focus:ring-palette-green/30"
                />
                <span className="group-hover:text-palette-brown/90">Remember Me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-xs text-palette-blue font-medium hover:underline underline-offset-2"
              >
                Forgot Password?
              </button>
            </div>

            {error && (
              <p key={error} className="text-red-600 text-xs flex items-center gap-1.5">
                <Icon icon="mdi:alert-circle-outline" className="text-base shrink-0" />
                {error}
              </p>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-sm bg-palette-blue text-white rounded-xl font-semibold shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[40px] hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Icon icon="mdi:loading" className="text-lg" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:login" className="text-lg" />
                    Login
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-xs text-palette-slate pt-0.5">
              Don't have an account?{' '}
              <Link to={`/encoder/${province}/register`} className="text-palette-green font-semibold hover:underline underline-offset-2 text-sm">
                Register
              </Link>
            </p>
          </form>
        )}
      </div>
    </SharedAuthLayout>
  );
}
