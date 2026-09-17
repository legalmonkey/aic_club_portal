'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export function BackButton({ href, label, className = '' }: BackButtonProps) {
  const { data: session } = useSession();

  // If no href is explicitly passed, determine destination contextually from user's active role
  const resolvedHref =
    href ||
    (() => {
      const role = session?.user?.role;
      if (role === 'super_admin') return '/admin';
      if (role === 'board') return '/board/dashboard';
      if (role === 'lead') return '/lead/dashboard';
      return '/member/dashboard';
    })();

  const defaultLabel = (() => {
    if (href === '/admin') return 'Back to Admin Dashboard';
    if (href === '/lead/dashboard') return 'Back to Lead Dashboard';
    if (href === '/board/dashboard') return 'Back to Board Dashboard';
    if (href === '/member/dashboard') return 'Back to Dashboard';
    if (href === '/login') return 'Return to Sign In';
    if (session?.user?.role === 'super_admin') return 'Back to Admin Dashboard';
    if (session?.user?.role === 'board') return 'Back to Board Dashboard';
    if (session?.user?.role === 'lead') return 'Back to Lead Dashboard';
    return 'Back to Dashboard';
  })();

  const displayLabel = label || defaultLabel;

  return (
    <Link
      href={resolvedHref}
      className={`inline-flex items-center gap-2 text-xs font-mono font-semibold text-tech-grey hover:text-electric-blue transition-colors group w-fit ${className}`}
    >
      <span className="w-6 h-6 rounded-md bg-white border border-light-grey flex items-center justify-center text-tech-grey group-hover:border-electric-blue group-hover:text-electric-blue transition-all shadow-2xs group-hover:-translate-x-0.5">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
      </span>
      <span className="uppercase tracking-wider">{displayLabel}</span>
    </Link>
  );
}
