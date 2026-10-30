import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { getAccessToken } from '../lib/getAccessToken';

export default function AccountPage({ currentUser, onLogout }) {
  const displayName = currentUser?.user_metadata?.name || currentUser?.email || 'Member';
  const [profile, setProfile] = useState({
    full_name: displayName,
    phone: '',
    organization: ''
  });
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!mounted || !response.ok || !data.profile) return;

      setProfile({
        full_name: data.profile.full_name || displayName,
        phone: data.profile.phone || '',
        organization: data.profile.organization || ''
      });
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [displayName]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus('');

    const token = await getAccessToken();
    if (!token) {
      setStatus('You are not authenticated.');
      setIsSaving(false);
      return;
    }

    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(profile)
    });

    if (!response.ok) {
      setStatus('Failed to save profile. Please try again.');
      setIsSaving(false);
      return;
    }

    setStatus('Profile saved successfully.');
    setIsSaving(false);
  };

  return (
    <>
      <PageHero
        eyebrow="Account"
        title="Your Oneed account."
        description="Manage your profile and continue exploring Oneed programs."
      />
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-[var(--ink)]/10 bg-[var(--surface)] p-8">
          <div className="text-xs uppercase tracking-[0.3em] text-[var(--accent-2)]">Profile</div>
          <h2 className="mt-3 text-3xl font-semibold">Welcome, {displayName}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--ink)]/10 bg-white px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Name</div>
              <div className="mt-1 text-sm font-semibold text-[var(--ink)]">{displayName}</div>
            </div>
            <div className="rounded-2xl border border-[var(--ink)]/10 bg-white px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Email</div>
              <div className="mt-1 text-sm font-semibold text-[var(--ink)]">{currentUser?.email || 'Not available'}</div>
            </div>
          </div>
          <form onSubmit={handleProfileSave} className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={profile.full_name}
                onChange={handleProfileChange}
                className="mt-2 w-full rounded-full border border-[var(--ink)]/20 bg-white px-4 py-3 text-sm focus:border-[var(--accent-2)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Phone</label>
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                className="mt-2 w-full rounded-full border border-[var(--ink)]/20 bg-white px-4 py-3 text-sm focus:border-[var(--accent-2)] focus:outline-none"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Organization</label>
              <input
                type="text"
                name="organization"
                value={profile.organization}
                onChange={handleProfileChange}
                className="mt-2 w-full rounded-full border border-[var(--ink)]/20 bg-white px-4 py-3 text-sm focus:border-[var(--accent-2)] focus:outline-none"
                placeholder="Optional"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
              {status && <span className="ml-3 text-sm text-[var(--muted)]">{status}</span>}
            </div>
          </form>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/services" className="rounded-full bg-[var(--accent-2)] px-6 py-3 text-sm font-semibold text-white">
              Explore Services
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-[var(--ink)]/25 px-6 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-white"
            >
              Log Out
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
