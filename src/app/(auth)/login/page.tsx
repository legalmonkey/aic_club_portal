'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';

type PortalRole = 'member' | 'lead' | 'board' | 'super_admin';

export default function LoginPage() {
  const [selectedPortal, setSelectedPortal] = useState<PortalRole | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeLaunchingEmail, setActiveLaunchingEmail] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      if (error === 'AccessDenied') {
        setErrorMsg('Access Restricted: Your @vitstudent.ac.in account is not registered in the chapter database. Please contact an administrator to be provisioned.');
      } else if (error) {
        setErrorMsg(`Authentication notice: ${error}`);
      }
    }
  }, []);

  const handleOAuthLogin = () => {
    setLoading(true);
    // Let root page route directly based on database role
    signIn('google', { callbackUrl: '/' });
  };

  const handleCredentialsLogin = async (email: string) => {
    setLoading(true);
    setActiveLaunchingEmail(email);
    setErrorMsg('');

    try {
      const res = await signIn('credentials', {
        email,
        portalRole: selectedPortal || 'member',
        callbackUrl: '/',
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg(res.error || 'Authentication failed. Please check credentials.');
        setLoading(false);
        setActiveLaunchingEmail(null);
      } else {
        // Direct to root where database role determines the destination
        window.location.replace('/');
      }
    } catch (err) {
      console.error('Sign-in error:', err);
      setErrorMsg('Login connection failed. Please try again.');
      setLoading(false);
      setActiveLaunchingEmail(null);
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex flex-col justify-between p-space-md sm:p-space-xl">
      {/* Top Brand Navbar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-space-xs border-b border-light-grey pb-space-md">
        <div className="flex items-center gap-3">
          <img
            alt="AI Club VIT Chennai"
            className="h-10 w-auto object-contain"
            src="/brand/logo-icon.png"
          />
          <div className="flex flex-col">
            <span className="font-heading text-lg font-bold text-deep-navy tracking-tight leading-tight">
              AI CLUB
            </span>
            <span className="font-mono text-[10px] text-tech-grey tracking-wider uppercase font-semibold">
              VIT CHENNAI // NIS-01
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-electric-blue animate-pulse" />
          <span className="font-mono text-xs text-deep-navy font-semibold">
            NEURAL INTELLIGENCE SYSTEM
          </span>
        </div>
      </header>

      {/* Main Hero & Auth Grid */}
      <main className="max-w-6xl w-full mx-auto my-auto py-space-xl grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
        {/* Left Column: NIS-01 Brand Hero Statement */}
        <div className="lg:col-span-6 flex flex-col gap-space-md">
          <div className="flex items-center gap-2 text-tech-grey">
            <span className="w-2 h-2 rounded-full bg-electric-blue" />
            <span className="font-mono text-xs tracking-widest uppercase font-semibold text-deep-navy">
              LEARN • BUILD • COLLABORATE • CREATE
            </span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-deep-navy tracking-tight leading-[1.15]">
            WHERE HUMAN CURIOSITY MEETS{' '}
            <span className="text-electric-blue">ARTIFICIAL INTELLIGENCE.</span>
          </h1>

          <p className="font-heading text-xl sm:text-2xl font-semibold text-tech-grey tracking-wide uppercase">
            Club Management Platform
          </p>
        </div>

        {/* Right Column: Split Brain Visual & Portal Auth Card */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full bg-white rounded-2xl shadow-card-hover border border-light-grey p-space-lg sm:p-space-xl flex flex-col gap-space-md relative overflow-hidden">
            {/* Top decorative circuit line */}
            <div className="absolute top-0 left-0 right-0 h-1 gradient-electric" />

            {errorMsg && (
              <div className="bg-error-container text-on-error-container p-space-sm rounded-lg text-sm flex items-center gap-space-xs font-sans">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: Portal Role Selector (Member vs Lead vs Board) */}
            {!selectedPortal ? (
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between border-b border-light-grey pb-space-xs">
                  <span className="font-mono text-xs text-deep-navy uppercase tracking-wider font-bold">
                    SELECT PORTAL ACCESS
                  </span>
                  <span className="font-mono text-xs text-electric-blue font-semibold">STEP 01/02</span>
                </div>

                <div className="grid grid-cols-1 gap-space-sm">
                  {/* Option 1: Member Portal */}
                  <button
                    type="button"
                    onClick={() => setSelectedPortal('member')}
                    className="p-space-md rounded-xl border border-light-grey hover:border-electric-blue bg-off-white hover:bg-white text-left transition-all flex items-start gap-space-md group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-electric-blue/10 text-electric-blue flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-electric-blue/20">
                      <span className="material-symbols-outlined text-2xl">school</span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-base text-deep-navy font-bold group-hover:text-electric-blue transition-colors">
                          Member Portal
                        </span>
                        <span className="material-symbols-outlined text-tech-grey group-hover:text-electric-blue text-base">
                          arrow_forward
                        </span>
                      </div>
                      <p className="font-sans text-xs text-on-surface-variant mt-0.5">
                        Log volunteer shifts, upload geotagged proof, earn verified points, and view rankings.
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Department Lead Portal */}
                  <button
                    type="button"
                    onClick={() => setSelectedPortal('lead')}
                    className="p-space-md rounded-xl border border-light-grey hover:border-electric-blue bg-off-white hover:bg-white text-left transition-all flex items-start gap-space-md group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-deep-navy text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-2xl">rate_review</span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-base text-deep-navy font-bold group-hover:text-electric-blue transition-colors">
                          Department Lead Portal
                        </span>
                        <span className="material-symbols-outlined text-tech-grey group-hover:text-electric-blue text-base">
                          arrow_forward
                        </span>
                      </div>
                      <p className="font-sans text-xs text-on-surface-variant mt-0.5">
                        Review verification queues, audit campus GPS bounds, award ledger points, and issue revision notices.
                      </p>
                    </div>
                  </button>

                  {/* Option 3: Board & Executive Portal */}
                  <button
                    type="button"
                    onClick={() => setSelectedPortal('board')}
                    className="p-space-md rounded-xl border border-light-grey hover:border-electric-blue bg-off-white hover:bg-white text-left transition-all flex items-start gap-space-md group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-electric-blue text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                      <span className="material-symbols-outlined text-2xl">military_tech</span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-base text-deep-navy font-bold group-hover:text-electric-blue transition-colors">
                          Board &amp; Executive Portal
                        </span>
                        <span className="material-symbols-outlined text-tech-grey group-hover:text-electric-blue text-base">
                          arrow_forward
                        </span>
                      </div>
                      <p className="font-sans text-xs text-on-surface-variant mt-0.5">
                        Club-wide analytics, cross-department audit logs, global standings, and chapter governance.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 2: OAuth Login for Chosen Portal Role */
              <div className="flex flex-col gap-space-md animate-fadeIn">
                {/* Back button & Role header */}
                <div className="flex items-center justify-between border-b border-light-grey pb-space-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPortal(null);
                      setErrorMsg('');
                    }}
                    className="text-electric-blue hover:underline font-mono text-xs flex items-center gap-1 font-semibold"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    BACK TO ROLE SELECTION
                  </button>
                  <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-electric-blue/10 text-electric-blue font-bold border border-electric-blue/20">
                    {selectedPortal.toUpperCase()} ACCESS
                  </span>
                </div>

                {/* Portal description banner */}
                <div className="bg-off-white p-space-md rounded-xl border border-light-grey flex items-start gap-space-sm">
                  <span className="material-symbols-outlined text-electric-blue text-xl shrink-0 mt-0.5">
                    {selectedPortal === 'member'
                      ? 'school'
                      : selectedPortal === 'lead'
                      ? 'rate_review'
                      : 'military_tech'}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-heading text-sm text-deep-navy font-bold">
                      {selectedPortal === 'member'
                        ? 'Signing into Chapter Member Portal'
                        : selectedPortal === 'lead'
                        ? 'Signing into Department Lead Portal'
                        : 'Signing into Board Executive Portal'}
                    </span>
                    <p className="text-xs text-on-surface-variant mt-0.5 font-sans">
                      {selectedPortal === 'lead'
                        ? 'Your assigned department (Technical, Visual Media, Creative, Outreach, or Operations) will be automatically configured from the backend upon login.'
                        : selectedPortal === 'member'
                        ? 'If this is your first time signing in, you will be taken to onboarding to select your chapter department.'
                        : 'Access is restricted to authorized chapter executive committee members.'}
                    </p>
                  </div>
                </div>

                {/* Domain Policy Notice */}
                <div className="flex items-center gap-space-xs text-xs text-tech-grey px-1 font-mono">
                  <span className="material-symbols-outlined text-sm text-electric-blue">lock</span>
                  <span>
                    Restricted strictly to authorized <strong>@vitstudent.ac.in</strong> Google accounts.
                  </span>
                </div>

                {/* Primary OAuth Button */}
                <button
                  type="button"
                  onClick={handleOAuthLogin}
                  disabled={loading}
                  className="w-full h-12 bg-electric-blue hover:bg-electric-blue/90 text-white font-heading text-sm font-bold rounded-xl flex items-center justify-center gap-space-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-60"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887C18.2 16.14 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.625 0 3.09.625 4.195 1.645l2.36-2.36C17.155 3.655 14.83 2.75 12.24 2.75 7.135 2.75 3 6.885 3 12s4.135 9.25 9.24 9.25c5.34 0 8.875-3.75 8.875-9.035 0-.61-.065-1.2-.175-1.93H12.24z" />
                  </svg>
                  {loading && !activeLaunchingEmail ? 'Connecting Google OAuth...' : 'Sign in with VIT Student Google'}
                </button>

                {/* Direct Email or Demo Persona Trigger */}
                <div className="border-t border-light-grey pt-space-md flex flex-col gap-space-sm">
                  <span className="font-mono text-xs text-tech-grey uppercase tracking-wider font-bold">
                    Or Sign In with University Email
                  </span>

                  <div className="flex gap-space-xs">
                    <input
                      type="email"
                      placeholder="your.name@vitstudent.ac.in"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && emailInput && !loading) {
                          handleCredentialsLogin(emailInput);
                        }
                      }}
                      className="flex-1 bg-off-white px-space-md py-2.5 rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:ring-2 focus:ring-electric-blue"
                    />
                    <button
                      type="button"
                      onClick={() => handleCredentialsLogin(emailInput)}
                      disabled={!emailInput || loading}
                      className="px-space-lg bg-deep-navy hover:bg-navy-surface text-white font-heading text-xs font-bold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      Enter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Branding Bar */}
      <footer className="max-w-6xl w-full mx-auto flex items-center justify-between text-tech-grey font-mono text-xs pt-space-md border-t border-light-grey">
        <span>AI CLUB // VIT CHENNAI</span>
        <span className="hidden sm:inline">PEOPLE • IDEAS • TECHNOLOGY • IMPACT</span>
        <span>NIS-01 SPECIFICATION</span>
      </footer>
    </div>
  );
}
