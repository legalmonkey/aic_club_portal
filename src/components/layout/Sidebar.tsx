'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

interface SidebarProps {
  pendingReviewCount?: number;
}

export function Sidebar({ pendingReviewCount }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || 'member';
  const [livePendingCount, setLivePendingCount] = React.useState<number>(pendingReviewCount ?? 0);

  React.useEffect(() => {
    if (pendingReviewCount !== undefined) {
      setLivePendingCount(pendingReviewCount);
    } else if (role === 'lead' || role === 'super_admin') {
      fetch('/api/submissions')
        .then(res => res.json())
        .then(data => {
          if (data.submissions) {
            const count = data.submissions.filter((s: any) => s.status === 'pending' || s.status === 'resubmitted').length;
            setLivePendingCount(count);
          }
        })
        .catch(() => {});
    }
  }, [pendingReviewCount, role]);

  // Determine overview link based on role
  const getOverviewHref = () => {
    if (role === 'super_admin') return '/admin';
    if (role === 'board') return '/board/dashboard';
    if (role === 'lead') return '/lead/dashboard';
    return '/member/dashboard';
  };

  const navItems = [
    {
      group: 'Operations & Records',
      items: [
        {
          label: 'Overview',
          href: getOverviewHref(),
          icon: 'dashboard',
          active: pathname === '/member/dashboard' || pathname === '/lead/dashboard' || pathname === '/board/dashboard',
        },
        // Lead and Super Admin only
        ...(role === 'lead' || role === 'super_admin'
          ? [
              {
                label: 'Review Queue',
                href: '/lead/review',
                icon: 'rate_review',
                badge: livePendingCount > 0 ? String(livePendingCount) : undefined,
                active: pathname === '/lead/review',
              },
            ]
          : []),
        // Member only: Leads and Board do not have the log shift entry option
        ...(role === 'member'
          ? [
              {
                label: 'Log Shift Entry',
                href: '/member/new-entry',
                icon: 'add_circle',
                active: pathname === '/member/new-entry',
              },
            ]
          : []),
      ],
    },
    {
      group: 'Community & Standings',
      items: [
        {
          label: 'Leaderboard',
          href: '/leaderboard',
          icon: 'military_tech',
          active: pathname === '/leaderboard',
        },
        ...(role === 'board' || role === 'super_admin' || role === 'lead'
          ? [
              {
                label: 'All Submissions',
                href: '/board/submissions',
                icon: 'receipt_long',
                active: pathname === '/board/submissions',
              },
            ]
          : []),
        ...(role === 'lead' || role === 'board'
          ? [
              {
                label: 'Analytics',
                href: role === 'board' ? '/board/analytics' : '/lead/analytics',
                icon: 'insights',
                active: pathname === '/lead/analytics' || pathname === '/board/analytics',
              },
            ]
          : []),
        ...(role === 'super_admin'
          ? [
              {
                label: 'Super Admin',
                href: '/admin',
                icon: 'admin_panel_settings',
                active: pathname.startsWith('/admin'),
              },
            ]
          : []),
      ],
    },
  ];

  const getUserSubtitle = () => {
    if (!session?.user) return 'Chapter Member';
    const userRole = session.user.role || 'member';
    const dept = session.user.departmentName || 'Technical';

    if (userRole === 'lead') {
      return `${dept} Co-Lead`;
    }
    if (userRole === 'board') {
      return 'Executive Board';
    }
    if (userRole === 'super_admin') {
      return 'Super Admin // Governance';
    }

    // Role is member: Always show their dynamic Member status!
    if (session.user.yearDept) {
      const branch = session.user.yearDept.split('•')[0].trim().replace(/lead/gi, 'Member');
      return `${branch} • Member`;
    }
    return `${dept} Member`;
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white shadow-sm z-50 flex flex-col justify-between select-none border-r border-light-grey">
      <div className="flex flex-col">
        {/* Logo Section */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-light-grey">
          <Link href={getOverviewHref()} className="flex items-center gap-2.5 group">
            <img
              alt="AI Club VIT Chennai"
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              src="/brand/logo-icon.png"
            />
            <div className="flex flex-col">
              <span className="font-heading text-sm text-deep-navy tracking-tight font-bold leading-tight">
                AI CLUB
              </span>
              <span className="font-mono text-[9px] text-tech-grey tracking-wider uppercase">
                VIT CHENNAI
              </span>
            </div>
          </Link>
        </div>


        {/* Navigation Groups */}
        {navItems.map((group, idx) => (
          <div key={idx} className={`px-3 ${idx === 0 ? 'mt-1' : 'mt-4'}`}>
            <span className="font-mono text-[10px] text-tech-grey px-2 uppercase tracking-wider block mb-1 font-semibold">
              {group.group}
            </span>
            <nav className="flex flex-col gap-0.5">
              {group.items.map((item, itemIdx) => {
                const isActive = item.active;
                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-electric-blue text-white font-heading font-bold shadow-sm'
                        : 'text-tech-grey hover:bg-off-white hover:text-deep-navy font-sans'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`material-symbols-outlined text-base ${
                          isActive ? 'text-white' : 'text-tech-grey'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-electric-blue/10 text-electric-blue border border-electric-blue/20'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* User Profile / Quick Switcher Bottom Footer */}
      <div className="p-3 bg-off-white border-t border-light-grey">
        <div className="bg-white rounded-xl p-2.5 flex items-center justify-between border border-light-grey shadow-sm">
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <img
              alt="Profile"
              className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-electric-blue/40"
              src={
                session?.user?.image ||
                '/brand/logo-icon.png'
              }
            />
            <div className="flex flex-col truncate min-w-0" title={getUserSubtitle()}>
              <span className="font-heading text-xs text-deep-navy truncate font-bold">
                {session?.user?.name || 'Student Member'}
              </span>
              <span className="font-mono text-[9px] text-tech-grey truncate">
                {getUserSubtitle()}
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Log out"
            className="p-1 text-tech-grey hover:text-error transition-colors shrink-0 flex items-center justify-center rounded-lg hover:bg-off-white"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
