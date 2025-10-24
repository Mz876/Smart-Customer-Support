/*
SignUpPage.jsx
React + Tailwind + phosphor-react

Collects: First name, Last name, Username, Email, Password
Theme: Light orange

Usage:
1) Ensure TailwindCSS is configured in your project.
2) Install deps: npm install phosphor-react
3) Import and use: import SignUpPage from './SignUpPage';

Notes:
- This is a single-file, responsive component ready to plug into your auth flow.
- Replace the stubbed network calls with your real backend or auth provider.
*/

import React, { useState } from 'react';
import { EnvelopeSimple, Lock, Eye, EyeSlash, UserCircle } from 'phosphor-react';

export default function SignUpPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(''); // '', 'checking', 'available', 'taken'

  function simpleEmailValid(e) {
    return e && e.includes('@') && e.includes('.');
  }

  function validate() {
    if (!firstName.trim()) return 'First name is required';
    if (!lastName.trim()) return 'Last name is required';
    if (!username.trim()) return 'Username is required';
    if (username.trim().length < 3) return 'Username must be at least 3 characters';
    if (!email.trim()) return 'Email is required';
    if (!simpleEmailValid(email)) return 'Enter a valid email';
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const v = validate();
    if (v) return setError(v);

    // if username check flagged as taken, prevent submission
    if (usernameStatus === 'taken') return setError('Username is already taken');

    try {
      setLoading(true);
      // simulate network register call
      await new Promise((res) => setTimeout(res, 900));
      setSuccess('Account created! Check your email to verify.');
      // reset form (optional)
      setFirstName('');
      setLastName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setUsernameStatus('');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // stub: fake username availability check
  function checkUsername(name) {
    if (!name || name.trim().length < 3) {
      setUsernameStatus('');
      return;
    }
    setUsernameStatus('checking');
    // simulate async check
    setTimeout(() => {
      // mark "taken" for a couple of example usernames
      const taken = ['admin', 'user', 'test'];
      if (taken.includes(name.toLowerCase())) setUsernameStatus('taken');
      else setUsernameStatus('available');
    }, 600);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 md:p-10">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center shadow-inner">
              <UserCircle size={28} weight="duotone" className="text-orange-700" />
            </div>
            <h2 className="text-2xl font-bold text-orange-700">Create an account</h2>
          </div>
          <p className="mt-2 text-sm text-slate-500">Sign up to join — it only takes a minute.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">First name</label>
            <input
              id="firstName"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
              placeholder="Jane"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">Last name</label>
            <input
              id="lastName"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
              placeholder="Doe"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="username" className="block text-sm font-medium text-slate-700">Username</label>
            <div className="mt-1 relative">
              <input
                id="username"
                name="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  checkUsername(e.target.value);
                }}
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 pr-28 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                placeholder="your-username"
              />

              <div className="absolute inset-y-0 right-2 flex items-center text-sm">
                {usernameStatus === 'checking' && <span className="text-slate-500">Checking...</span>}
                {usernameStatus === 'available' && <span className="text-green-600">Available</span>}
                {usernameStatus === 'taken' && <span className="text-red-600">Taken</span>}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
            <div className="mt-1 relative rounded-lg">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-orange-500 pointer-events-none">
                <EnvelopeSimple size={18} />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 rounded-lg border border-slate-200 px-3 py-2 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
            <div className="mt-1 relative rounded-lg">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-orange-500 pointer-events-none">
                <Lock size={16} />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 rounded-lg border border-slate-200 px-3 py-2 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                placeholder="At least 8 characters"
              />

              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 pr-2 flex items-center"
              >
                {showPassword ? <Eye size={16} /> : <EyeSlash size={16} />}
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">Use at least 8 characters. Combine letters and numbers for better security.</p>
          </div>

          <div className="md:col-span-2">
            {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
            {success && <div className="text-sm text-green-600 mb-2">{success}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-2 text-white font-medium shadow hover:from-orange-500 hover:to-orange-600 disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>

            <div className="mt-4 text-center text-sm text-slate-600">Already have an account? <a href="#" className="text-orange-600 font-medium hover:underline">Sign in</a></div>
          </div>
        </form>

        <div className="mt-6 text-xs text-slate-400 text-center">By creating an account you agree to our Terms and Privacy Policy.</div>
      </div>
    </div>
  );
}
