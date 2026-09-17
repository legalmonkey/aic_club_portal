'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

interface Submission {
  id: string;
  eventName: string;
  roleInEvent: string;
  date: string;
  venue: string;
  durationHours: number;
  comments: string;
  photoUrl: string;
  status: 'pending' | 'approved' | 'rejected' | 'resubmitted';
  pointsAwarded: number | null;
  requestedPoints: number;
  rejectionReason?: string;
  reviewedByName?: string;
  createdAt: string;
}

export default function MemberDashboardPage() {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/submissions');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const totalPoints = submissions
    .filter(s => s.status === 'approved' && s.pointsAwarded)
    .reduce((sum, s) => sum + (s.pointsAwarded || 0), 0);

  const totalHours = submissions
    .filter(s => s.status === 'approved')
    .reduce((sum, s) => sum + (s.durationHours || 0), 0);

  const filteredSubmissions = submissions.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search && !s.eventName.toLowerCase().includes(search.toLowerCase()) && !s.venue.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-off-white">
      <Sidebar />

      <div className="pl-64 flex flex-col flex-1 min-h-screen">
        <Header pageTitle="Member Points & Shift Ledger" userPoints={totalPoints} />

        <main className="w-full pt-20 px-6 sm:px-8 pb-16 flex-1 bg-off-white">
          <div className="flex flex-col w-full gap-space-lg">
            {/* Top Command Banner */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-electric-blue" />
                  <span className="font-mono text-[11px] text-electric-blue font-bold uppercase tracking-wider">
                    NIS-01 // MEMBER PROFILE
                  </span>
                </div>
                <h1 className="font-heading text-3xl font-bold text-deep-navy tracking-tight">
                  {session?.user?.name || 'Student Member'} — Chapter Standing
                </h1>
                <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-0.5">
                  Track your verified event shifts, lead approvals, and permanent chapter points ledger.
                </p>
              </div>

              <div className="flex items-center gap-space-xs">
                <Link
                  href="/member/new-entry"
                  className="px-space-md py-2.5 gradient-electric text-white font-heading text-xs font-bold rounded-lg shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  Log Shift Entry
                </Link>
              </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
              {/* Card 1: Total Points */}
              <div className="bg-white rounded-xl p-space-lg shadow-card-subtle border border-light-grey flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-electric-blue/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="font-mono text-[11px] text-tech-grey uppercase tracking-wider font-semibold">
                    Points Ledger
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-electric-blue/10 text-electric-blue flex items-center justify-center border border-electric-blue/20">
                    <span className="material-symbols-outlined text-base">hotel_class</span>
                  </div>
                </div>
                <div className="mt-space-md relative z-10">
                  <div className="font-heading text-3xl text-deep-navy font-bold tracking-tight">
                    {totalPoints.toLocaleString()}{' '}
                    <span className="font-mono text-sm text-electric-blue uppercase">pts</span>
                  </div>
                </div>
                <div className="w-full bg-light-grey rounded-full h-1.5 mt-space-md overflow-hidden relative z-10">
                  <div
                    className="bg-electric-blue h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((totalPoints / 2500) * 100))}%` }}
                  ></div>
                </div>
              </div>

              {/* Card 2: Verified Shifts */}
              <div className="bg-white rounded-xl p-space-lg shadow-card-subtle border border-light-grey flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-electric-blue/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="font-mono text-[11px] text-tech-grey uppercase tracking-wider font-semibold">
                    Verified Shifts
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-deep-navy text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-base">fact_check</span>
                  </div>
                </div>
                <div className="mt-space-md relative z-10">
                  <div className="font-heading text-3xl text-deep-navy font-bold tracking-tight">
                    {submissions.filter(s => s.status === 'approved').length}{' '}
                    <span className="font-sans text-sm text-tech-grey font-normal">Approved</span>
                  </div>
                </div>
                <div className="w-full bg-light-grey rounded-full h-1.5 mt-space-md overflow-hidden relative z-10">
                  <div
                    className="bg-electric-blue h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${submissions.length > 0 ? Math.round((submissions.filter(s => s.status === 'approved').length / submissions.length) * 100) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Card 3: Volunteer Hours */}
              <div className="bg-white rounded-xl p-space-lg shadow-card-subtle border border-light-grey flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-electric-blue/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="font-mono text-[11px] text-tech-grey uppercase tracking-wider font-semibold">
                    Volunteer Hours
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-off-white text-deep-navy border border-light-grey flex items-center justify-center">
                    <span className="material-symbols-outlined text-base">schedule</span>
                  </div>
                </div>
                <div className="mt-space-md relative z-10">
                  <div className="font-heading text-3xl text-deep-navy font-bold tracking-tight">
                    {totalHours.toFixed(1)} <span className="font-sans text-sm text-tech-grey font-normal">hrs</span>
                  </div>
                </div>
                <div className="w-full bg-light-grey rounded-full h-1.5 mt-space-md overflow-hidden relative z-10">
                  <div
                    className="bg-deep-navy h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((totalHours / 20) * 100))}%` }}
                  ></div>
                </div>
              </div>

              {/* Card 4: Queue Status */}
              <div className="bg-white rounded-xl p-space-lg shadow-card-subtle border border-light-grey flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-electric-blue/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="font-mono text-[11px] text-tech-grey uppercase tracking-wider font-semibold">
                    Pending Reviews
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-electric-blue/10 text-electric-blue border border-electric-blue/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-base">pending_actions</span>
                  </div>
                </div>
                <div className="mt-space-md relative z-10">
                  <div className="font-heading text-3xl text-deep-navy font-bold tracking-tight">
                    {submissions.filter(s => s.status === 'pending').length}{' '}
                    <span className="font-sans text-sm text-tech-grey font-normal">Under Review</span>
                  </div>
                </div>
                <div className="w-full bg-light-grey rounded-full h-1.5 mt-space-md overflow-hidden relative z-10">
                  <div
                    className="bg-electric-blue h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${submissions.length > 0 ? Math.round((submissions.filter(s => s.status === 'pending').length / submissions.length) * 100) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Submissions History Table Section */}
            <div className="bg-white rounded-xl p-space-lg sm:p-space-xl shadow-card-subtle border border-light-grey flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border-b border-light-grey pb-space-md">
                <div>
                  <h2 className="font-heading text-lg font-bold text-deep-navy">
                    Shift Submissions &amp; Verification Audit
                  </h2>
                  <p className="font-sans text-xs text-on-surface-variant">
                    Detailed record of logged chapter hours, lead feedback, and credited points.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <span className="material-symbols-outlined text-sm text-tech-grey absolute left-2.5 top-2.5">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search shift or venue..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-off-white text-deep-navy font-sans text-xs pl-8 pr-space-md py-2 rounded-lg placeholder:text-tech-grey focus:outline-none focus:ring-2 focus:ring-electric-blue border border-light-grey"
                  />
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-all ${
                    filter === 'all'
                      ? 'bg-deep-navy text-white shadow-sm'
                      : 'bg-off-white hover:bg-light-grey text-on-surface-variant'
                  }`}
                >
                  ALL ({submissions.length})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-all ${
                    filter === 'pending'
                      ? 'bg-electric-blue text-white shadow-sm'
                      : 'bg-off-white hover:bg-light-grey text-on-surface-variant'
                  }`}
                >
                  PENDING ({submissions.filter(s => s.status === 'pending').length})
                </button>
                <button
                  onClick={() => setFilter('approved')}
                  className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-all ${
                    filter === 'approved'
                      ? 'bg-electric-blue text-white shadow-sm'
                      : 'bg-off-white hover:bg-light-grey text-on-surface-variant'
                  }`}
                >
                  APPROVED ({submissions.filter(s => s.status === 'approved').length})
                </button>
                <button
                  onClick={() => setFilter('rejected')}
                  className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-all ${
                    filter === 'rejected'
                      ? 'bg-error-container text-on-error-container shadow-sm'
                      : 'bg-off-white hover:bg-light-grey text-on-surface-variant'
                  }`}
                >
                  NEEDS REVISION ({submissions.filter(s => s.status === 'rejected').length})
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-off-white text-tech-grey font-mono text-[11px] uppercase tracking-wider border-b border-light-grey">
                      <th className="py-2.5 px-space-md rounded-l-lg">Event &amp; Track</th>
                      <th className="py-2.5 px-space-md">Venue &amp; Hours</th>
                      <th className="py-2.5 px-space-md">Date</th>
                      <th className="py-2.5 px-space-md">Status</th>
                      <th className="py-2.5 px-space-md">Points</th>
                      <th className="py-2.5 px-space-md rounded-r-lg text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-grey">
                    {filteredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-space-xl text-center text-tech-grey font-sans text-xs">
                          No submissions found matching this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredSubmissions.map(sub => (
                        <tr key={sub.id} className="hover:bg-off-white/60 transition-colors">
                          <td className="py-space-md px-space-md">
                            <div className="flex flex-col">
                              <span className="font-heading text-xs font-bold text-deep-navy">
                                {sub.eventName}
                              </span>
                              <span className="font-mono text-[10px] text-electric-blue mt-0.5">
                                {sub.roleInEvent}
                              </span>
                            </div>
                          </td>
                          <td className="py-space-md px-space-md">
                            <div className="flex flex-col">
                              <span className="font-sans text-xs text-on-surface">
                                {sub.venue}
                              </span>
                              <span className="font-mono text-[10px] text-tech-grey">
                                {sub.durationHours} hrs shift
                              </span>
                            </div>
                          </td>
                          <td className="py-space-md px-space-md whitespace-nowrap">
                            <span className="font-mono text-xs text-on-surface">
                              {sub.date}
                            </span>
                          </td>
                          <td className="py-space-md px-space-md whitespace-nowrap">
                            {sub.status === 'approved' && (
                              <span className="px-2.5 py-1 rounded-full bg-electric-blue/10 text-electric-blue border border-electric-blue/20 font-mono text-[10px] font-bold inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-electric-blue" />
                                Verified
                              </span>
                            )}
                            {sub.status === 'pending' && (
                              <span className="px-2.5 py-1 rounded-full bg-light-blue/15 text-electric-blue border border-light-blue/30 font-mono text-[10px] font-bold inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-electric-blue animate-pulse" />
                                Under Review
                              </span>
                            )}
                            {sub.status === 'rejected' && (
                              <span className="px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-mono text-[10px] font-bold inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-error" />
                                Needs Revision
                              </span>
                            )}
                            {sub.status === 'resubmitted' && (
                              <span className="px-2.5 py-1 rounded-full bg-electric-blue/20 text-electric-blue font-mono text-[10px] font-bold inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-electric-blue" />
                                Resubmitted
                              </span>
                            )}
                          </td>
                          <td className="py-space-md px-space-md whitespace-nowrap">
                            {sub.pointsAwarded !== null && sub.pointsAwarded !== undefined ? (
                              <span className="px-2 py-0.5 rounded bg-electric-blue/10 text-electric-blue border border-electric-blue/20 font-mono text-xs font-bold">
                                +{sub.pointsAwarded} PTS
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-500/30 font-mono text-[11px] font-semibold">
                                Pending Lead Award
                              </span>
                            )}
                          </td>
                          <td className="py-space-md px-space-md text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-space-xs">
                              {sub.status === 'rejected' ? (
                                <Link
                                  href={`/member/entry/${sub.id}/edit`}
                                  className="px-space-sm py-1 bg-deep-navy text-white font-mono text-xs font-semibold rounded-lg shadow-sm hover:bg-navy-surface transition-colors"
                                >
                                  Edit &amp; Resubmit
                                </Link>
                              ) : (
                                <a
                                  href={sub.photoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-space-sm py-1 bg-off-white hover:bg-light-grey text-deep-navy border border-light-grey font-mono text-xs rounded-lg transition-colors"
                                >
                                  View Proof
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
