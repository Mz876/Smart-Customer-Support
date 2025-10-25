// SignInPage.tsx
import React, { useState, type FormEvent, type ChangeEvent } from 'react';
import {
  EnvelopeSimple,
  Lock,
  Eye,
  EyeSlash,
  UserCircle,
  GoogleLogo,
} from 'phosphor-react';
import { useNavigate } from 'react-router-dom';

export default function SignInPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();


  function validate(): string {
    if (!email) return 'Email is required';
    if (!email.includes('@') || !email.includes('.')) return 'Enter a valid email';
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  }

 async function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setError('');
  const v = validate();
  if (v) return setError(v);

  try {
    setLoading(true);

    const response = await fetch('http://localhost/project/backend/apis/auth/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

 
    const data = await response.json();

    console.log("Response data:", data);

    if (!response.ok || !data.success) {

      console.log("Error data:", data);
      console.log(response);
 
      setError(data.message || 'Invalid credentials');
      return;
    }

  
    navigate(`/panel?userId=${encodeURIComponent(data.userId)}`);

  } catch (err) {
    console.error(err);
    setError('Something went wrong. Try again.');
  } finally {
    setLoading(false);
  }
}


  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
  }

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 p-6">
         

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
                  onChange={handleEmailChange}
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
                  onChange={handlePasswordChange}
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
                onClick={() => alert('Sign in with Google (stub)')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                <GoogleLogo size={18} weight="duotone" className="text-orange-500" />
                Sign in with Google
              </button>
            </div>

            <div className="text-center text-sm text-slate-600 mt-3">
              Don't have an account? <a href="/signup" className="text-orange-600 font-medium hover:underline">Create one</a>
            </div>
          </form>

          <div className="mt-6 text-xs text-slate-400 text-center">By continuing, you agree to our Terms and Privacy Policy.</div>
        </div>
      </div>
   );
}
