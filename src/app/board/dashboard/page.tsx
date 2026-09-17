'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

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

export default function BoardDashboardPage() {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [departments, setDepartments] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => {
        if (data.departments) setDepartments(data.departments);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const url = selectedDept === 'all' ? '/api/leaderboard' : `/api/leaderboard?departmentId=${selectedDept}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.leaderboard) setLeaderboard(data.leaderboard);
      })
      .catch(() => {});
  }, [selectedDept]);

  const filteredLeaderboard = leaderboard.filter(u =>
    search ? u.name.toLowerCase().includes(search.toLowerCase()) || u.regNo.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="flex min-h-screen bg-off-white font-sans text-deep-navy">
      <Sidebar />

      <div className="pl-64 flex flex-col flex-1 min-h-screen">
        <Header pageTitle="Board Executive Command & Leaderboard" />

        <main className="w-full pt-20 px-6 sm:px-8 pb-16 flex-1">
          <div className="flex flex-col w-full gap-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-light-grey pb-5">
              <div>
                <div className="flex items-center gap-2 text-electric-blue font-mono text-xs font-semibold uppercase tracking-wider mb-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-electric-blue animate-pulse"></span>
                  NIS-01 // CHAPTER EXECUTIVE OVERSIGHT
                </div>
                <h1 className="font-heading text-3xl font-extrabold text-deep-navy tracking-tight">
                  Board Command &amp; Official Standing
                </h1>
                <p className="font-sans text-sm text-tech-grey mt-1">
                  Club-wide aggregate rankings, department comparisons, and verified volunteer hours for Academic Year 2026-27.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/board/submissions"
                  className="px-4 py-2 bg-white hover:bg-off-white text-deep-navy font-sans text-xs font-semibold rounded-lg border border-light-grey transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-base text-electric-blue">receipt_long</span>
                  Audit Club Shifts
                </Link>
                <Link
                  href="/lead/analytics"
                  className="px-4 py-2 bg-gradient-to-r from-electric-blue to-light-blue text-white font-sans text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">insights</span>
                  Telemetry &amp; Analytics
                </Link>
              </div>
            </div>

            {/* Department Selector & Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-light-grey shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedDept('all')}
                  className={`px-3.5 py-1.5 rounded-lg font-sans text-xs transition-all ${
                    selectedDept === 'all'
                      ? 'bg-deep-navy text-white font-bold shadow-sm'
                      : 'bg-off-white text-tech-grey hover:text-deep-navy border border-light-grey'
                  }`}
                >
                  Global Standing
                </button>
                {departments.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDept(d.id)}
                    className={`px-3.5 py-1.5 rounded-lg font-sans text-xs transition-all ${
                      selectedDept === d.id
                        ? 'bg-deep-navy text-white font-bold shadow-sm'
                        : 'bg-off-white text-tech-grey hover:text-deep-navy border border-light-grey'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-tech-grey text-base">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Filter member or Reg No..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-off-white text-deep-navy placeholder:text-tech-grey rounded-lg font-sans text-xs focus:outline-none focus:ring-1 focus:ring-electric-blue border border-light-grey"
                />
              </div>
            </div>

            {/* Leaderboard Table Card */}
            <div className="bg-white rounded-xl p-6 border border-light-grey shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-light-grey pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-5 rounded-full bg-electric-blue"></span>
                  <h2 className="font-heading text-lg text-deep-navy font-bold">
                    Official Chapter Points Standing
                  </h2>
                </div>
                <span className="font-mono text-xs font-semibold bg-electric-blue/10 text-electric-blue border border-electric-blue/20 px-3 py-1 rounded-md">
                  {selectedDept === 'all'
                    ? `SCOPE // ALL ${leaderboard.length} MEMBERS`
                    : `SCOPE // ${departments.find(d => d.id === selectedDept)?.name?.toUpperCase() || selectedDept.toUpperCase()}`}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-off-white text-tech-grey font-mono text-[11px] uppercase tracking-wider border-b border-light-grey">
                      <th className="py-3 px-4 rounded-l-lg">Rank</th>
                      <th className="py-3 px-4">Student Member</th>
                      <th className="py-3 px-4">Department / Program</th>
                      <th className="py-3 px-4">Verified Shifts</th>
                      <th className="py-3 px-4">Vol. Hours</th>
                      <th className="py-3 px-4 rounded-r-lg text-right">Points Ledger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-grey text-xs">
                    {filteredLeaderboard.map((user, idx) => (
                      <tr
                        key={user.memberId}
                        className={`hover:bg-off-white/80 transition-colors ${
                          idx === 0 ? 'bg-electric-blue/5 font-medium' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-mono font-bold text-xs ${
                              idx === 0
                                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                                : idx === 1
                                ? 'bg-tech-grey text-white'
                                : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-light-grey text-deep-navy'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <img
                                alt={user.name}
                                src={user.avatarUrl}
                                className="w-8 h-8 rounded-full object-cover ring-1 ring-light-grey shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-off-white border border-light-grey flex items-center justify-center text-tech-grey shrink-0">
                                <span className="material-symbols-outlined text-base text-tech-grey">person</span>
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="font-sans font-bold text-deep-navy">
                                {user.name}
                              </span>
                              <span className="font-mono text-[11px] text-tech-grey">
                                {user.regNo}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-sans font-medium text-electric-blue">
                              {user.departmentName}
                            </span>
                            <span className="font-mono text-[11px] text-tech-grey">
                              {user.yearDept}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono text-deep-navy">
                            {user.shiftsCount} shifts
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono text-deep-navy">
                            {user.totalHours} hrs
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-md bg-electric-blue/10 text-electric-blue border border-electric-blue/20 font-mono text-xs font-bold inline-block">
                            {user.points.toLocaleString()} pts
                          </span>
                        </td>
                      </tr>
                    ))}
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
