'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function BoardSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/submissions?status=all')
      .then(res => res.json())
      .then(data => {
        if (data.submissions) setSubmissions(data.submissions);
      })
      .catch(() => {});
  }, []);

  const filtered = submissions.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (
      search &&
      !s.memberName.toLowerCase().includes(search.toLowerCase()) &&
      !s.eventName.toLowerCase().includes(search.toLowerCase()) &&
      !s.departmentName.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-off-white font-sans text-deep-navy">
      <Sidebar />

      <div className="pl-64 flex flex-col flex-1 min-h-screen">
        <Header pageTitle="Cross-Department Shift Submissions" />

        <main className="w-full pt-20 px-6 sm:px-8 pb-16 flex-1">
          <div className="flex flex-col w-full gap-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-grey pb-5">
              <div>
                <div className="flex items-center gap-2 text-electric-blue font-mono text-xs font-semibold uppercase tracking-wider mb-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-electric-blue animate-pulse"></span>
                  NIS-01 // CROSS-CHAPTER AUDIT LOG
                </div>
                <h1 className="font-heading text-3xl font-extrabold text-deep-navy tracking-tight">
                  All Chapter Submissions
                </h1>
                <p className="font-sans text-sm text-tech-grey mt-1">
                  Comprehensive audit trail across all 5 active chapter divisions.
                </p>
              </div>

              <div className="relative w-full sm:w-80">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-tech-grey text-base">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search member, event, or division..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue shadow-sm placeholder:text-tech-grey"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 rounded-lg font-sans text-xs font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-deep-navy text-white shadow-sm'
                    : 'bg-white text-tech-grey border border-light-grey hover:text-deep-navy'
                }`}
              >
                All Submissions ({submissions.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-1.5 rounded-lg font-sans text-xs font-semibold transition-all ${
                  filter === 'pending'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white text-tech-grey border border-light-grey hover:text-deep-navy'
                }`}
              >
                Pending Review ({submissions.filter(s => s.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-1.5 rounded-lg font-sans text-xs font-semibold transition-all ${
                  filter === 'approved'
                    ? 'bg-gradient-to-r from-electric-blue to-light-blue text-white shadow-sm'
                    : 'bg-white text-tech-grey border border-light-grey hover:text-deep-navy'
                }`}
              >
                Verified Approved ({submissions.filter(s => s.status === 'approved').length})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-1.5 rounded-lg font-sans text-xs font-semibold transition-all ${
                  filter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-white text-tech-grey border border-light-grey hover:text-deep-navy'
                }`}
              >
                Needs Revision ({submissions.filter(s => s.status === 'rejected').length})
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl p-6 border border-light-grey shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-off-white text-tech-grey font-mono text-[11px] uppercase tracking-wider border-b border-light-grey">
                    <th className="py-3 px-4 rounded-l-lg">Student Member</th>
                    <th className="py-3 px-4">Division</th>
                    <th className="py-3 px-4">Event Activity</th>
                    <th className="py-3 px-4">Date &amp; Venue</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Points</th>
                    <th className="py-3 px-4 rounded-r-lg text-right">Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-grey text-xs">
                  {filtered.map(sub => (
                    <tr key={sub.id} className="hover:bg-off-white/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            alt={sub.memberName}
                            src={sub.memberAvatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzkgs-Xs9KAw3ivlSvtEJ0uUrOEOwf1TMEf2YRpWINiZrHcEPQDTiO6dD7Qg3_i7pxgISTnrNvGo2eWlQei62-ocUEEtutzEPWblTSd3_60YbK8YPR5rNA1xgnF6c9MmQ64F85nCXk87wRMqyZN2FhkN2h7-pL-J9BKVNxjHZFF5TPosOeg0zeuM0gQit7i8ScbiApO6dhZaRKK1EDNkv9GpO57JpAMt8xET2g1Q50T0PhC5MjN6ZD'}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-light-grey"
                          />
                          <span className="font-sans font-bold text-deep-navy">
                            {sub.memberName}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-sans font-medium text-electric-blue">
                          {sub.departmentName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-sans font-semibold text-deep-navy">
                            {sub.eventName}
                          </span>
                          <span className="font-mono text-[11px] text-tech-grey">
                            {sub.roleInEvent}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col text-tech-grey font-mono text-[11px]">
                          <span className="text-deep-navy font-sans text-xs">{sub.date}</span>
                          <span className="truncate max-w-xs">{sub.venue}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            sub.status === 'approved'
                              ? 'bg-electric-blue/10 text-electric-blue border border-electric-blue/20'
                              : sub.status === 'rejected'
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}
                        >
                          {sub.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-deep-navy">
                          +{sub.pointsAwarded || sub.requestedPoints} pts
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <a
                          href={sub.photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-white hover:bg-off-white text-deep-navy font-sans text-xs font-semibold rounded-lg border border-light-grey transition-colors inline-block shadow-sm"
                        >
                          View Proof
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
