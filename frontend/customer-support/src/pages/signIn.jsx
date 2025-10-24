

import React, { useState } from 'react';
import {
  EnvelopeSimple,
  Lock,
  Eye,
  EyeSlash,
  UserCircle,
  GoogleLogo,
} from 'phosphor-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function validate() {
    if (!email) return 'Email is required';
    // basic email check (simple heuristic to avoid complex regex)
    if (!email.includes('@') || !email.includes('.')) return 'Enter a valid email';
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) return setError(v);

    try {
      setLoading(true);
      // Simulate network request
      await new Promise((res) => setTimeout(res, 700));
      // TODO: replace with real auth call
      alert(`Signed in as ${email}`);
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left - branding / promo */}
        <div className="hidden md:flex flex-col justify-center gap-6 p-8 rounded-2xl shadow-lg bg-white/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center shadow-inner">
              <UserCircle size={28} weight="duotone" className="text-orange-700" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-orange-700">Welcome back</h3>
              <p className="text-sm text-slate-600">Sign in to continue to your dashboard</p>
            </div>
          </div>

          <div className="mt-3 text-slate-700">
            <h4 className="text-lg font-medium">Fast, friendly, and warm</h4>
            <p className="text-sm mt-2">This sign-in flow uses a light orange theme with subtle depth and accessible controls. Fully responsive and ready to plug into your auth provider.</p>
          </div>

          <ul className="space-y-2 text-sm text-slate-600 mt-4">
            <li>• Accessible form controls</li>
            <li>• Keyboard-friendly and responsive</li>
            <li>• Easy to customize colors & branding</li>
          </ul>
        </div>

        {/* Right - form card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-orange-700">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">Enter your account details to access your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-orange-500">
                  <EnvelopeSimple size={20} />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-orange-500">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-10 py-2 rounded-lg border border-slate-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none"
                  placeholder="Your secure password"
                />

                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center"
                >
                  {showPassword ? <Eye size={18} /> : <EyeSlash size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-200" />
                <span className="text-slate-600">Remember me</span>
              </label>

              <a href="#" className="text-sm text-orange-600 hover:underline">Forgot password?</a>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-2 text-white font-medium shadow hover:from-orange-500 hover:to-orange-600 disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  // placeholder for social login handler
                  alert('Sign in with Google (stub)');
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                <GoogleLogo size={18} weight="duotone" className="text-orange-500" />
                Sign in with Google
              </button>
            </div>

            <div className="text-center text-sm text-slate-600 mt-3">
              Don't have an account? <a href="#" className="text-orange-600 font-medium hover:underline">Create one</a>
            </div>
          </form>

          <div className="mt-6 text-xs text-slate-400 text-center">By continuing, you agree to our Terms and Privacy Policy.</div>
        </div>
      </div>
    </div>
  );
}
