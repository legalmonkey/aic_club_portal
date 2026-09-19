'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

interface Submission {
  id: string;
  memberName: string;
  memberAvatar?: string;
  departmentName: string;
  eventName: string;
  venue: string;
  durationHours: number;
  date: string;
  geoStatus: string;
  pointsAwarded: number | null;
  requestedPoints: number;
  reviewedByName?: string;
  status: string;
}

interface LeaderboardUser {
  memberId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  yearDept: string;
  regNo: string;
  departmentName: string;
  points: number;
  totalHours: number;
  shiftsCount: number;
}

export default function LeadDashboardPage() {
  const { data: session } = useSession();
  const currentDeptName = session?.user?.departmentName || 'Technical';
  const [filterChip, setFilterChip] = useState<'all' | 'needs_review' | 'approved'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/submissions?_t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.submissions) setSubmissions(data.submissions);
        })
        .catch(err => console.error('Error fetching submissions:', err)),

      fetch(`/api/leaderboard?_t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.leaderboard) setLeaderboard(data.leaderboard);
        })
        .catch(err => console.error('Error fetching leaderboard:', err)),
    ]).finally(() => setLoading(false));
  }, []);

  const approvedSubmissions = submissions.filter(s => s.status === 'approved');
  const pendingSubmissions = submissions.filter(s => s.status === 'pending' || s.status === 'resubmitted');
  const totalPointsDisbursed = approvedSubmissions.reduce((sum, s) => sum + (s.pointsAwarded || 0), 0);
  const verificationRate =
    submissions.length > 0 ? ((approvedSubmissions.length / submissions.length) * 100).toFixed(1) : '100.0';
  const verificationRateNum = Number(verificationRate);
  const uniqueEventsCount = new Set(submissions.map(s => s.eventName)).size;
  const activeCohortCount =
    leaderboard.filter(u => u.departmentName === currentDeptName || !currentDeptName).length || leaderboard.length;

  const filteredSubmissions = submissions.filter(sub => {
    if (filterChip === 'needs_review' && sub.status !== 'pending' && sub.status !== 'resubmitted') return false;
    if (filterChip === 'approved' && sub.status !== 'approved') return false;
    if (
      searchFilter &&
      !sub.memberName.toLowerCase().includes(searchFilter.toLowerCase()) &&
      !sub.eventName.toLowerCase().includes(searchFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar pendingReviewCount={pendingSubmissions.length} />

      <div className="pl-64 flex flex-col flex-1 min-h-screen">
        <Header pageTitle="Executive & Department Command Center" />

        <main className="w-full pt-20 px-6 sm:px-8 pb-16 flex-1 bg-surface font-sans">
          <div className="flex flex-col w-full gap-6">
            {/* Top Command Banner */}
            <div className="border-b border-light-grey/60 pb-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-electric-blue/10 border border-electric-blue/20 text-electric-blue font-mono text-xs uppercase tracking-wider mb-2 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-electric-blue animate-pulse"></span>
                NIS-01 // EXECUTIVE COMMAND TELEMETRY
              </div>
              <h1 className="font-heading text-3xl md:text-4xl text-deep-navy tracking-tight font-bold">
                Executive &amp; Department Command Center
              </h1>
            </div>

            {/* 4 Sovereign Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-lg">
              {/* Card 1: Active Cohort */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-light-grey flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-electric-blue/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="font-mono text-xs text-tech-grey uppercase tracking-wider font-semibold">
                    ACTIVE COHORT
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-electric-blue/10 text-electric-blue flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">group</span>
                  </div>
                </div>
                <div className="mt-space-md relative z-10">
                  <div className="font-heading text-3xl font-bold text-deep-navy tracking-tight">
                    {activeCohortCount} <span className="text-lg font-normal text-tech-grey">Members</span>
                  </div>
                  <div className="flex items-center gap-space-xs mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-electric-blue/10 text-electric-blue font-mono text-xs font-bold border border-electric-blue/20">
                      100% VERIFIED
                    </span>
                    <span className="font-sans text-xs text-tech-grey">Active in chapter</span>
                  </div>
                </div>
                <div className="w-full bg-light-grey rounded-full h-1.5 mt-space-md overflow-hidden relative z-10">
                  <div className="bg-electric-blue h-full rounded-full w-full"></div>
                </div>
              </div>

              {/* Card 2: Points Ledger */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-light-grey flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-electric-blue/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="font-mono text-xs text-tech-grey uppercase tracking-wider font-semibold">
                    POINTS LEDGER
                  </span>
                  <div className="w-9 h-9 rounded-lg gradient-electric text-white flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-lg">hotel_class</span>
                  </div>
                </div>
                <div className="mt-space-md relative z-10">
                  <div className="font-heading text-3xl font-bold text-deep-navy tracking-tight">
                    {totalPointsDisbursed.toLocaleString()} <span className="text-lg font-mono text-electric-blue">pts</span>
                  </div>
                  <div className="flex items-center gap-space-xs mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-electric-blue/10 text-electric-blue font-mono text-xs font-bold border border-electric-blue/20">
                      {approvedSubmissions.length} APPROVED
                    </span>
                    <span className="font-sans text-xs text-tech-grey">awarded to date</span>
                  </div>
                </div>
                <div className="w-full bg-light-grey rounded-full h-1.5 mt-space-md overflow-hidden relative z-10">
                  <div
                    className="bg-electric-blue h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((totalPointsDisbursed / 5000) * 100))}%` }}
                  ></div>
                </div>
              </div>

              {/* Card 3: Verification Rate */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-light-grey flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-electric-blue/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="font-mono text-xs text-tech-grey uppercase tracking-wider font-semibold">
                    VERIFICATION RATE
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-electric-blue/10 text-electric-blue flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">fact_check</span>
                  </div>
                </div>
                <div className="mt-space-md flex items-center justify-between gap-space-sm relative z-10">
                  <div>
                    <div className="font-heading text-3xl font-bold text-deep-navy tracking-tight">
                      {verificationRate}%
                    </div>
                    <div className="flex items-center gap-space-xs mt-1">
                      <span className="font-mono text-xs text-electric-blue font-bold">
                        {approvedSubmissions.length}/{submissions.length}
                      </span>
                      <span className="font-sans text-xs text-tech-grey">shifts resolved</span>
                    </div>
                  </div>
                  {/* SVG Circular Progress Ring */}
                  <div className="relative w-14 h-14 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-light-grey"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                      />
                      <path
                        className="text-electric-blue"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${verificationRateNum}, 100`}
                        strokeLinecap="round"
                        strokeWidth="3.5"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-deep-navy">
                      {Math.round(verificationRateNum)}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-light-grey rounded-full h-1.5 mt-space-md overflow-hidden relative z-10">
                  <div
                    className="bg-electric-blue h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, verificationRateNum)}%` }}
                  ></div>
                </div>
              </div>

              {/* Card 4: Events & Workshops */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-light-grey flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-electric-blue/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="font-mono text-xs text-tech-grey uppercase tracking-wider font-semibold">
                    EVENTS &amp; WORKSHOPS
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-electric-blue/10 text-electric-blue flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">event_available</span>
                  </div>
                </div>
                <div className="mt-space-md relative z-10">
                  <div className="font-heading text-3xl font-bold text-deep-navy tracking-tight">
                    {uniqueEventsCount} <span className="text-lg font-normal text-tech-grey">Logged</span>
                  </div>
                  <div className="flex items-center gap-space-xs mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-electric-blue/10 text-electric-blue font-mono text-xs font-bold border border-electric-blue/20">
                      {pendingSubmissions.length} PENDING
                    </span>
                    <span className="font-sans text-xs text-tech-grey">in review queue</span>
                  </div>
                </div>
                <div className="w-full bg-light-grey rounded-full h-1.5 mt-space-md overflow-hidden relative z-10">
                  <div
                    className="bg-electric-blue h-full rounded-full transition-all duration-500"
                    style={{ width: `${submissions.length > 0 ? Math.min(100, Math.round((uniqueEventsCount / Math.max(uniqueEventsCount, 5)) * 100)) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Scoped Department Indicator Banner */}
            <div className="flex items-center justify-between pb-2 border-b border-light-grey/60">
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-lg font-heading text-xs font-bold bg-deep-navy text-white shadow-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-blue animate-pulse" />
                  {currentDeptName} Department // Scoped Lead Access
                </span>
                <span className="font-mono text-[11px] text-tech-grey hidden sm:inline">
                  (Authority restricted: Only {currentDeptName} Department submissions and queues are accessible)
                </span>
              </div>
            </div>

            {/* 12-Column Grid: Left (8 cols Audit Feed) + Right (4 cols Leaderboard) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 items-start">
              {/* LEFT: Verification Audit Feed & Queue (8 Cols) */}
              <div className="xl:col-span-8 flex flex-col gap-space-lg">
                <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-light-grey p-5 sm:p-6 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-grey/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-heading text-lg text-deep-navy font-bold">
                          Verification Audit Feed &amp; Queue
                        </h2>
                        <span className="w-5 h-5 rounded-full bg-electric-blue/10 text-electric-blue border border-electric-blue/20 font-mono text-[11px] flex items-center justify-center font-bold">
                          {submissions.filter(s => s.status === 'pending').length}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-tech-grey mt-0.5">
                        Pending shift logs for {currentDeptName} Department.
                      </p>
                    </div>

                    <div className="relative w-full sm:w-60">
                      <input
                        type="text"
                        placeholder="Filter by member or activity..."
                        value={searchFilter}
                        onChange={e => setSearchFilter(e.target.value)}
                        className="w-full bg-off-white text-deep-navy font-sans text-xs pl-8 pr-3 py-1.5 rounded-lg placeholder:text-tech-grey focus:outline-none focus:ring-1 focus:ring-electric-blue border border-light-grey"
                      />
                      <span className="material-symbols-outlined text-sm text-tech-grey absolute left-2.5 top-2">
                        search
                      </span>
                    </div>
                  </div>

                  {/* Filter Status Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setFilterChip('all')}
                      className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-all ${
                        filterChip === 'all'
                          ? 'gradient-electric text-white shadow-sm'
                          : 'bg-off-white border border-light-grey text-deep-navy hover:border-electric-blue'
                      }`}
                    >
                      ALL ({submissions.length})
                    </button>
                    <button
                      onClick={() => setFilterChip('needs_review')}
                      className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-all ${
                        filterChip === 'needs_review'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-off-white border border-light-grey text-deep-navy hover:border-electric-blue'
                      }`}
                    >
                      NEEDS REVIEW ({submissions.filter(s => s.status === 'pending').length})
                    </button>
                    <button
                      onClick={() => setFilterChip('approved')}
                      className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-all ${
                        filterChip === 'approved'
                          ? 'bg-electric-blue text-white shadow-sm'
                          : 'bg-off-white border border-light-grey text-deep-navy hover:border-electric-blue'
                      }`}
                    >
                      APPROVED ({submissions.filter(s => s.status === 'approved').length})
                    </button>
                  </div>

                  {/* Audit Feed Table - Formatted to avoid horizontal scrolling */}
                  <div className="w-full overflow-hidden">
                    <table className="w-full text-left border-collapse table-auto">
                      <thead>
                        <tr className="bg-off-white text-tech-grey font-mono text-[11px] uppercase tracking-wider border-b border-light-grey">
                          <th className="py-2.5 px-3 rounded-l-lg">MEMBER</th>
                          <th className="py-2.5 px-3">ACTIVITY &amp; VENUE</th>
                          <th className="py-2.5 px-3">DATE &amp; GEO</th>
                          <th className="py-2.5 px-3">POINTS</th>
                          <th className="py-2.5 px-3 rounded-r-lg text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light-grey/60">
                        {filteredSubmissions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-tech-grey text-xs font-sans">
                              No shift logs in the audit feed for {currentDeptName} Department.
                            </td>
                          </tr>
                        ) : (
                          filteredSubmissions.slice(0, 5).map(sub => (
                          <tr key={sub.id} className="hover:bg-off-white/80 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {sub.memberAvatar ? (
                                  <img
                                    alt={sub.memberName}
                                    src={sub.memberAvatar}
                                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-electric-blue/30"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-off-white border border-light-grey flex items-center justify-center text-tech-grey shrink-0">
                                    <span className="material-symbols-outlined text-base">person</span>
                                  </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span className="font-heading text-xs text-deep-navy font-bold truncate">
                                    {sub.memberName}
                                  </span>
                                  <span className="font-mono text-[10px] text-electric-blue truncate">
                                    {sub.departmentName}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-2.5 px-3">
                              <div className="flex flex-col min-w-0 max-w-[190px] sm:max-w-[240px]">
                                <span className="font-sans text-xs text-deep-navy font-semibold truncate">
                                  {sub.eventName}
                                </span>
                                <span className="font-mono text-[10px] text-tech-grey truncate">
                                  {sub.venue} • {sub.durationHours}h
                                </span>
                              </div>
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-mono text-xs text-deep-navy">
                                  {sub.date}
                                </span>
                                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-electric-blue font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-electric-blue"></span>
                                  {sub.status === 'resubmitted' ? 'RESUBMITTED' : sub.status === 'approved' ? 'APPROVED' : sub.status === 'rejected' ? 'REVISION' : 'NEEDS REVIEW'}
                                </span>
                              </div>
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {sub.pointsAwarded !== null && sub.pointsAwarded !== undefined ? (
                                <span className="px-2 py-0.5 rounded-md bg-electric-blue/10 text-electric-blue border border-electric-blue/30 font-mono text-[11px] font-bold">
                                  +{sub.pointsAwarded} PTS
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 border border-amber-500/30 font-mono text-[10px] font-bold">
                                  PENDING LEAD AWARD
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <Link
                                href="/lead/review"
                                className="px-2.5 py-1 bg-white hover:bg-off-white border border-light-grey hover:border-electric-blue text-deep-navy font-sans text-xs font-semibold rounded-md transition-colors shadow-sm inline-flex items-center gap-1"
                              >
                                Inspect
                                <span className="material-symbols-outlined text-xs">arrow_forward</span>
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-2 font-sans text-xs text-tech-grey border-t border-light-grey/60">
                    <span>Showing {Math.min(filteredSubmissions.length, 5)} of {submissions.length} queue items</span>
                    <Link
                      href="/lead/review"
                      className="text-electric-blue hover:text-light-blue font-heading text-xs flex items-center gap-1 font-bold"
                    >
                      Open Full Review Queue
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </section>
              </div>

              {/* RIGHT: Global Leaderboard (4 Cols) */}
              <div className="xl:col-span-4 flex flex-col gap-space-lg" id="leaderboard">
                <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-light-grey p-space-lg flex flex-col gap-space-md">
                  <div className="flex items-center justify-between border-b border-light-grey/60 pb-space-xs">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-electric-blue text-xl">military_tech</span>
                      <h3 className="font-heading text-lg text-deep-navy font-bold">
                        Global Leaderboard
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-electric-blue font-bold uppercase tracking-wider bg-electric-blue/10 border border-electric-blue/20 px-2.5 py-0.5 rounded-full">
                      ACAD YEAR 2026-27
                    </span>
                  </div>

                  {/* Rank #1 Gold Featured Card */}
                  {leaderboard.length > 0 && (
                    <div className="bg-gradient-to-br from-electric-blue/10 via-surface-container-lowest to-off-white rounded-xl p-space-md shadow-sm border border-electric-blue/30 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-space-xs">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-electric-blue uppercase">
                          <span className="material-symbols-outlined text-xs">workspace_premium</span>
                          RANK #1 GOLD STANDING
                        </span>
                        <span className="px-2 py-0.5 gradient-electric text-white rounded text-[10px] font-bold font-mono">
                          TOP CHAPTER CONTRIBUTE
                        </span>
                      </div>

                      <div className="flex items-center gap-space-md my-space-xs">
                        {leaderboard[0].avatarUrl ? (
                          <img
                            alt={leaderboard[0].name}
                            src={leaderboard[0].avatarUrl}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-electric-blue shadow-md"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-off-white border border-light-grey flex items-center justify-center text-tech-grey shrink-0">
                            <span className="material-symbols-outlined text-2xl">person</span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-heading text-base text-deep-navy font-bold">
                            {leaderboard[0].name}
                          </span>
                          <span className="font-sans text-xs text-tech-grey">
                            {leaderboard[0].yearDept}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-space-xs border-t border-electric-blue/20 mt-space-xs">
                        <span className="font-heading text-xl font-bold text-deep-navy">
                          {leaderboard[0].points.toLocaleString()}{' '}
                          <span className="text-electric-blue text-xs font-mono font-bold">PTS</span>
                        </span>
                        <span className="font-mono text-xs text-tech-grey">
                          {leaderboard[0].totalHours} verified hrs • {leaderboard[0].shiftsCount} shifts
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Other Rank Cards */}
                  <div className="flex flex-col divide-y divide-light-grey/60">
                    {leaderboard.slice(1, 5).map((user, idx) => (
                      <div key={user.memberId} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-space-sm min-w-0">
                          <span className="w-6 h-6 rounded-full bg-off-white border border-light-grey flex items-center justify-center font-mono font-bold text-xs text-tech-grey shrink-0">
                            #{idx + 2}
                          </span>
                          {user.avatarUrl ? (
                            <img
                              alt={user.name}
                              src={user.avatarUrl}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-off-white border border-light-grey flex items-center justify-center text-tech-grey shrink-0">
                              <span className="material-symbols-outlined text-base text-tech-grey">person</span>
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-heading text-xs text-deep-navy font-bold truncate">
                              {user.name}
                            </span>
                            <span className="font-sans text-[11px] text-tech-grey truncate">
                              {user.departmentName}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 pl-space-xs">
                          <span className="font-mono text-xs font-bold text-electric-blue">
                            {user.points.toLocaleString()} PTS
                          </span>
                          <span className="font-mono text-[10px] text-tech-grey">
                            {user.totalHours} hrs
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/board/dashboard"
                    className="text-center font-heading text-xs text-electric-blue font-bold hover:underline py-1"
                  >
                    View Complete Chapter Leaderboard →
                  </Link>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
