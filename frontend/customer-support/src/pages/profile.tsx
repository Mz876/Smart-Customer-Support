 
import React, { type ChangeEvent, type FormEvent, type JSX, useEffect, useState } from 'react';
import { PencilSimple, FloppyDisk, X, UserCircle, EnvelopeSimple } from 'phosphor-react';

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
};

const STORAGE_KEY = 'cs_profile_v1_ts';

const defaultProfile: Profile = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  username: 'janedoe',
};

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw) as Profile;
    return { ...defaultProfile, ...parsed };
  } catch (e) {
    console.warn('Failed to load profile from storage', e);
    return defaultProfile;
  }
}

function saveProfile(p: Profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch (e) {
    console.warn('Failed to save profile', e);
  }
}

export default function ProfilePage(): JSX.Element {
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const [draft, setDraft] = useState<Profile>(profile);
  const [editing, setEditing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  function validate(p: Profile) {
    if (!p.firstName.trim()) return 'First name is required';
    if (!p.lastName.trim()) return 'Last name is required';
    if (!p.username.trim()) return 'Username is required';
    if (p.username.trim().length < 3) return 'Username must be at least 3 characters';
    if (!p.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) return 'Enter a valid email';
    return '';
  }

  function startEdit() {
    setError('');
    setSuccess('');
    setDraft(profile);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(profile);
    setError('');
    setSuccess('');
    setEditing(false);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const v = validate(draft);
    if (v) return setError(v);

    // mock async save
    try {
      // simulate checking username availability (stub)
      await new Promise((res) => setTimeout(res, 500));
      // Save locally
      setProfile(draft);
      saveProfile(draft);
      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      setError('Failed to save profile. Try again.');
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-orange-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center">
            <UserCircle size={36} weight="duotone" className="text-orange-700" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-800">{profile.firstName} {profile.lastName}</h2>
            <p className="text-sm text-slate-500">@{profile.username} • {profile.email}</p>
          </div>

          <div className="flex items-center gap-2">
            {!editing ? (
              <button onClick={startEdit} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700">
                <PencilSimple size={16} /> Edit
              </button>
            ) : (
              <>
                <button onClick={cancelEdit} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                  <X size={16} /> Cancel
                </button>
                <button onClick={() => { /* submit via form button below */ }} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500 text-white">
                  <FloppyDisk size={16} /> Save
                </button>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-700">First name</label>
            <input
              name="firstName"
              value={draft.firstName}
              onChange={handleChange}
              disabled={!editing}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 focus:outline-none ${editing ? 'border-slate-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100' : 'bg-slate-50 border-transparent'}`}
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-700">Last name</label>
            <input
              name="lastName"
              value={draft.lastName}
              onChange={handleChange}
              disabled={!editing}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 focus:outline-none ${editing ? 'border-slate-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100' : 'bg-slate-50 border-transparent'}`}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Username</label>
            <input
              name="username"
              value={draft.username}
              onChange={handleChange}
              disabled={!editing}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 focus:outline-none ${editing ? 'border-slate-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100' : 'bg-slate-50 border-transparent'}`}
            />
            <p className="mt-1 text-xs text-slate-400">At least 3 characters. No spaces.</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <div className="mt-1 relative rounded-lg">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-orange-400 pointer-events-none"><EnvelopeSimple size={16} /></span>
              <input
                name="email"
                type="email"
                value={draft.email}
                onChange={handleChange}
                disabled={!editing}
                className={`block w-full pl-10 rounded-lg border px-3 py-2 focus:outline-none ${editing ? 'border-slate-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100' : 'bg-slate-50 border-transparent'}`}
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-600 md:col-span-2">{error}</div>}
          {success && <div className="text-sm text-green-600 md:col-span-2">{success}</div>}

          <div className="md:col-span-2 flex items-center justify-end gap-3">
            {!editing ? null : (
              <>
                <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 text-white">Save changes</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
