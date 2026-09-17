'use client';

import React, { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
  pageTitle?: string;
  userPoints?: number;
}

export function Header({ pageTitle = 'Portal Control Hub', userPoints }: HeaderProps) {
  const { data: session } = useSession();
  const role = session?.user?.role || 'member';
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [livePoints, setLivePoints] = useState<number>(userPoints ?? 0);

  React.useEffect(() => {
    if (userPoints !== undefined) {
      setLivePoints(userPoints);
    } else if (role === 'member') {
      fetch('/api/submissions')
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

  const personas = [
    { name: 'Arjun Verma', email: 'arjun.verma@vitstudent.ac.in', role: 'lead', title: 'Lead — Technical' },
    { name: 'Vikram Malhotra', email: 'vikram.malhotra@vitstudent.ac.in', role: 'lead', title: 'Lead — Visual Media' },
    { name: 'Tanvi Sharma', email: 'tanvi.sharma@vitstudent.ac.in', role: 'lead', title: 'Lead — Creative' },
    { name: 'Neha Kapoor', email: 'neha.kapoor@vitstudent.ac.in', role: 'lead', title: 'Lead — Outreach' },
    { name: 'Aditya Singh', email: 'aditya.singh@vitstudent.ac.in', role: 'lead', title: 'Lead — Operations' },
    { name: 'Rohan Patel', email: 'rohan.patel@vitstudent.ac.in', role: 'member', title: 'Member — Technical (350+ pts)' },
    { name: 'Dr. K. Swaminathan', email: 'k.swaminathan@vitstudent.ac.in', role: 'board', title: 'Board — Faculty Sponsor' },
    { name: 'Ritvik Arun Bhat', email: 'ritvik.arunbhat2025@vitstudent.ac.in', role: 'super_admin', title: 'Super Admin — Governance' },
  ];

  const handleSwitchPersona = async (persona: typeof personas[0]) => {
    setShowPersonaMenu(false);
    await signIn('credentials', {
      email: persona.email,
      role: persona.role,
      callbackUrl:
        persona.role === 'super_admin'
          ? '/admin'
          : persona.role === 'board'
          ? '/board/dashboard'
          : persona.role === 'lead'
          ? '/lead/dashboard'
          : '/member/dashboard',
    });
  };

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

        {/* Persona Switcher / Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-1.5 pl-1 focus:outline-none group"
            title="Switch User Role / Persona"
          >
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-electric-blue/30 shadow-sm group-hover:scale-105 transition-transform"
              src={
                session?.user?.image ||
                '/brand/logo-icon.png'
              }
            />
            <span className="material-symbols-outlined text-sm text-tech-grey group-hover:text-deep-navy transition-colors">
              arrow_drop_down
            </span>
          </button>

          {showPersonaMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPersonaMenu(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-light-grey z-50 overflow-hidden py-2">
                <div className="px-4 py-2 border-b border-light-grey">
                  <span className="text-[10px] font-mono text-tech-grey uppercase tracking-wider block font-semibold">
                    Simulate Chapter Persona
                  </span>
                  <p className="text-xs font-bold text-deep-navy mt-0.5">
                    {session?.user?.name} ({session?.user?.role?.toUpperCase()})
                  </p>
                </div>

                <div className="flex flex-col py-1">
                  {personas.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSwitchPersona(p)}
                      className="px-4 py-2 text-left hover:bg-off-white flex flex-col transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-deep-navy group-hover:text-electric-blue transition-colors">
                          {p.name}
                        </span>
                        <span className="text-[9px] uppercase font-mono font-bold bg-off-white text-tech-grey px-1.5 py-0.5 rounded border border-light-grey">
                          {p.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-tech-grey">{p.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
