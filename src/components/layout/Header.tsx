'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
  pageTitle?: string;
  userPoints?: number;
}

export function Header({ pageTitle = 'Portal Control Hub', userPoints }: HeaderProps) {
  const { data: session } = useSession();
  const role = session?.user?.role || 'member';
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [livePoints, setLivePoints] = useState<number>(userPoints ?? 0);

  React.useEffect(() => {
    if (userPoints !== undefined) {
      setLivePoints(userPoints);
    } else if (role === 'member') {
      fetch(`/api/submissions?_t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.submissions) {
            const approvedTotal = data.submissions
              .filter((s: any) => s.status === 'approved' && s.pointsAwarded)
              .reduce((sum: number, s: any) => sum + (s.pointsAwarded || 0), 0);
            setLivePoints(approvedTotal);
          }
        })
        .catch(() => {});
    }
  }, [userPoints, role]);

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white/90 backdrop-blur-xl shadow-sm z-40 px-6 sm:px-8 flex items-center justify-between border-b border-light-grey">
      {/* Breadcrumb & Global Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-electric-blue tracking-tight text-xs">AI CLUB</span>
          <span className="font-mono text-[10px] text-tech-grey">//</span>
          <span className="font-mono text-[10px] text-tech-grey uppercase tracking-wider">VIT CHENNAI</span>
          <span className="w-1.5 h-1.5 rounded-full bg-electric-blue mx-1" />
          <span className="font-heading text-xs sm:text-sm text-deep-navy font-semibold">{pageTitle}</span>
        </div>

        <div className="hidden xl:flex items-center bg-off-white rounded-lg px-3 py-1.5 text-tech-grey hover:text-deep-navy w-64 cursor-pointer border border-light-grey transition-colors">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">search</span>
            <span className="font-sans text-xs">Search records or members...</span>
          </div>
        </div>
      </div>

      {/* Status Indicators & Profile Actions */}
      <div className="flex items-center gap-3">
        {/* Active Term Indicator */}
        <div className="flex items-center gap-1.5 bg-off-white px-3 py-1.5 rounded-lg border border-light-grey">
          <span className="w-2 h-2 rounded-full bg-electric-blue animate-pulse" />
          <span className="font-mono text-xs text-deep-navy font-semibold tracking-wide">
            ACAD YEAR 2026-27
          </span>
        </div>

        {/* Role Badge for Leads & Board, or Chapter Points Counter for Members */}
        {role === 'member' ? (
          <div className="flex items-center gap-1.5 bg-electric-blue/10 border border-electric-blue/20 px-3 py-1 rounded-full">
            <span className="material-symbols-outlined text-sm text-electric-blue">stars</span>
            <span className="font-heading text-xs sm:text-sm text-electric-blue font-bold">
              {livePoints.toLocaleString()}
            </span>
            <span className="font-mono text-[9px] text-electric-blue/80 font-bold uppercase tracking-wider">
              PTS
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-electric-blue/10 border border-electric-blue/20 px-3 py-1 rounded-full">
            <span className="material-symbols-outlined text-sm text-electric-blue">
              {role === 'lead' ? 'supervisor_account' : role === 'board' ? 'military_tech' : 'shield'}
            </span>
            <span className="font-mono text-[11px] text-electric-blue font-bold uppercase tracking-wider">
              {role === 'lead'
                ? `${session?.user?.departmentName || 'Technical'} Lead`
                : role === 'board'
                ? 'Executive Board'
                : 'Super Admin'}
            </span>
          </div>
        )}

        {/* Notifications Popover */}
        <NotificationDropdown />

        {/* User Profile / Sign Out Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1.5 pl-1 focus:outline-none group"
            title="Account Options"
          >
            {session?.user?.image ? (
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-electric-blue/30 shadow-sm group-hover:scale-105 transition-transform"
                src={session.user.image}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-off-white border border-light-grey flex items-center justify-center text-tech-grey ring-2 ring-electric-blue/30 shadow-sm group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-base">person</span>
              </div>
            )}
            <span className="material-symbols-outlined text-sm text-tech-grey group-hover:text-deep-navy transition-colors">
              arrow_drop_down
            </span>
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-light-grey z-50 overflow-hidden p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3 pb-3 border-b border-light-grey">
                  {session?.user?.image ? (
                    <img
                      alt={session?.user?.name || 'User'}
                      src={session.user.image}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-light-grey shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-off-white border border-light-grey flex items-center justify-center text-tech-grey shrink-0">
                      <span className="material-symbols-outlined text-lg">person</span>
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-heading text-sm font-bold text-deep-navy truncate">
                      {session?.user?.name || 'Chapter User'}
                    </span>
                    <span className="font-mono text-[11px] text-tech-grey truncate">
                      {session?.user?.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-tech-grey uppercase tracking-wider text-[10px] font-semibold">
                    ROLE PERMISSIONS
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-deep-navy text-white">
                    {session?.user?.role?.replace('_', ' ') || 'MEMBER'}
                  </span>
                </div>

                {session?.user?.departmentName && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-tech-grey uppercase tracking-wider text-[10px] font-semibold">
                      DIVISION
                    </span>
                    <span className="font-sans font-medium text-electric-blue">
                      {session.user.departmentName}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-sans text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Sign Out of Chapter Portal
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
