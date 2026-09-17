'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const isAccessDenied = error === 'AccessDenied';

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-rose-200 p-8 flex flex-col gap-6 text-center items-center">
      <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
        <span className="material-symbols-outlined text-3xl">
          {isAccessDenied ? 'person_off' : 'domain_disabled'}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-center gap-1.5 text-rose-600 font-mono text-[10px] font-bold uppercase tracking-wider">
          NIS-01 // ACCESS POLICY RESTRICTION
        </div>
        <h1 className="font-heading text-2xl text-deep-navy tracking-tight font-extrabold">
          {isAccessDenied ? 'Account Not Registered' : 'Access Restricted'}
        </h1>
        <p className="font-sans text-xs text-tech-grey leading-relaxed">
          {isAccessDenied
            ? 'Your institutional email is authenticated, but you are not yet registered in the chapter database.'
            : 'Only official @vitstudent.ac.in email accounts are permitted to sign into the AIC Student Chapter Portal.'}
        </p>
      </div>

      <div className="bg-off-white p-4 rounded-xl text-left border border-light-grey text-xs text-tech-grey flex flex-col gap-1.5 w-full">
        <span className="font-mono text-[10px] uppercase tracking-wider text-deep-navy font-bold">
          {isAccessDenied ? 'How to get access' : 'Why am I seeing this?'}
        </span>
        <p className="leading-relaxed">
          {isAccessDenied
            ? 'The AI Club portal enforces strict pre-authorized access. Please contact a chapter administrator or department lead to have your @vitstudent.ac.in email provisioned into the database.'
            : 'Chapter shift verification and internal points ledgers are restricted to active university student chapter credentials. If you are signed in to multiple Google accounts, please select your university account.'}
        </p>
      </div>

      <Link
        href="/login"
        className="w-full h-11 bg-gradient-to-r from-electric-blue to-light-blue hover:opacity-90 text-white font-sans text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-opacity"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Return to Institutional Login
      </Link>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-off-white font-sans text-deep-navy flex flex-col justify-center items-center p-4">
      <Suspense fallback={<div className="text-xs font-mono text-tech-grey">Loading access policy...</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  );
}
