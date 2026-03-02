import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SharedAuthLayout from '../../components/SharedAuthLayout';
import PasswordInput from '../../components/PasswordInput';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState(localStorage.getItem('rememberMe_email') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberMe_email'));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const { signIn, forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password, rememberMe, 'admin');
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
    <SharedAuthLayout title="Admin Login">
      <div>
        {showForgot ? (
          <>
            <h2 className="text-lg font-semibold text-oa-green-dark mb-4">Forgot Password</h2>
            {forgotSent ? (
              <p className="text-oa-green text-sm">Check your email for the reset link.</p>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-4 py-3 border rounded-lg mb-4"
                  required
                />
                {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
                <button type="submit" className="w-full py-3 bg-oa-blue text-white rounded-lg font-medium">
                  Send Reset Link
                </button>
              </form>
            )}
            <button onClick={() => { setShowForgot(false); setForgotSent(false); }} className="mt-4 text-sm text-oa-brown">
              ← Back to Login
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="input-base mb-4"
              required
            />
            <div className="mb-4">
              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder="Password"
                required
              />
            </div>
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2 text-sm text-oa-brown cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded" />
                Remember Me
              </label>
              <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-oa-blue hover:underline">
                Forgot Password?
              </button>
            </div>
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-oa-green hover:bg-oa-green-dark text-white rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
            <p className="mt-4 text-center text-sm text-oa-brown">
              Don't have an account? <Link to="/admin/register" className="text-oa-green font-medium hover:underline">Register</Link>
            </p>
          </form>
        )}
        <Link to="/" className="block mt-4 text-center text-sm text-oa-brown hover:text-oa-green">← Back to Home</Link>
      </div>
    </SharedAuthLayout>
  );
}
