'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BackButton } from '@/components/ui/BackButton';

interface LeaderboardEntry {
  memberId: string;
  name: string;
  email: string;
  avatarUrl: string;
  regNo: string;
  departmentId: string;
  departmentName: string;
  yearDept: string;
  points: number;
  shiftsCount: number;
  totalHours: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch departments
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => {
        if (data.departments) setDepartments(data.departments);
      })
      .catch(() => {});

    // Fetch leaderboard
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = (deptId?: string) => {
    setLoading(true);
    const url = deptId && deptId !== 'all' ? `/api/leaderboard?departmentId=${deptId}` : '/api/leaderboard';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.leaderboard) setLeaderboard(data.leaderboard);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleDeptChange = (deptId: string) => {
    setSelectedDept(deptId);
    fetchLeaderboard(deptId);
  };

  const filtered = leaderboard.filter(user => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      (user.regNo && user.regNo.toLowerCase().includes(query)) ||
      (user.departmentName && user.departmentName.toLowerCase().includes(query)) ||
      (user.yearDept && user.yearDept.toLowerCase().includes(query))
    );
  });

  const currentUserEmail = session?.user?.email?.toLowerCase();
  const top1 = filtered[0];
  const top2 = filtered[1];
  const top3 = filtered[2];

  return (
    <div className="flex min-h-screen bg-off-white font-sans text-deep-navy">
      <Sidebar />

      <div className="pl-64 flex flex-col flex-1 min-h-screen">
        <Header pageTitle="Chapter Leaderboard & Points Standing" />

        <main className="w-full pt-20 px-6 sm:px-8 pb-16 flex-1 bg-off-white">
          <div className="flex flex-col w-full gap-8 max-w-7xl mx-auto">
            {/* Header / Banner */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-light-grey pb-5">
              <div>
                <BackButton className="mb-2" />
                <div className="flex items-center gap-2 text-electric-blue font-mono text-xs font-semibold uppercase tracking-wider mb-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-electric-blue animate-pulse"></span>
                  NIS-01 // CHAPTER STANDING &amp; MERIT
                </div>
                <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-deep-navy tracking-tight">
                  Official Chapter Leaderboard
                </h1>
                <p className="font-sans text-sm text-tech-grey mt-1">
                  Verified volunteer shifts, logged hours, and merit points across all 5 chapter divisions.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-white rounded-lg px-3 py-1.5 border border-light-grey shadow-sm text-xs font-mono text-tech-grey flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-electric-blue text-sm">event</span>
                  ACAD YEAR 2026-27
                </div>
                <div className="bg-electric-blue/10 border border-electric-blue/20 text-electric-blue font-mono text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">groups</span>
                  {leaderboard.length} ACTIVE MEMBERS
                </div>
              </div>
            </div>

            {/* Department Filter Pills & Search */}
            <div className="bg-white p-4 rounded-xl border border-light-grey shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Department Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeptChange('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
                    selectedDept === 'all'
                      ? 'bg-deep-navy text-white shadow-sm'
                      : 'bg-off-white text-tech-grey hover:text-deep-navy border border-light-grey'
                  }`}
                >
                  All Divisions ({leaderboard.length})
                </button>
                {departments.map(dept => {
                  const count = leaderboard.filter(u => u.departmentId === dept.id).length;
                  const isSelected = selectedDept === dept.id;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => handleDeptChange(dept.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-electric-blue to-light-blue text-white shadow-sm'
                          : 'bg-off-white text-tech-grey hover:text-deep-navy border border-light-grey'
                      }`}
                    >
                      {dept.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[240px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-tech-grey text-base">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search member, reg no..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-off-white rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue focus:bg-white transition-all shadow-sm placeholder:text-tech-grey"
                />
              </div>
            </div>

            {/* Top 3 Podium Highlights (if available and no filter/search active) */}
            {top1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 2nd Place (if exists) */}
                {top2 ? (
                  <div className="bg-white rounded-xl p-5 border border-light-grey shadow-sm flex flex-col justify-between order-2 md:order-1 hover:shadow-md transition-all relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-8 h-8 rounded-full bg-tech-grey text-white flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                        #2
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-tech-grey bg-light-grey px-2 py-0.5 rounded">
                        SILVER STANDING
                      </span>
                    </div>
                    <div className="flex items-center gap-3 my-2">
                      <img
                        alt={top2.name}
                        src={top2.avatarUrl || '/brand/logo-icon.png'}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-tech-grey/50"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-heading font-bold text-deep-navy text-sm truncate flex items-center gap-1.5">
                          {top2.name}
                          {top2.email.toLowerCase() === currentUserEmail && (
                            <span className="bg-electric-blue text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                              YOU
                            </span>
                          )}
                        </span>
                        <span className="font-sans text-xs text-electric-blue font-medium">
                          {top2.departmentName}
                        </span>
                        <span className="font-mono text-[10px] text-tech-grey">
                          {top2.regNo || top2.yearDept}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-light-grey mt-2">
                      <span className="font-heading text-lg font-bold text-deep-navy">
                        {top2.points.toLocaleString()} <span className="text-xs font-mono text-electric-blue">PTS</span>
                      </span>
                      <span className="font-mono text-xs text-tech-grey">
                        {top2.totalHours} hrs • {top2.shiftsCount} shifts
                      </span>
                    </div>
                  </div>
                ) : <div className="hidden md:block order-1" />}

                {/* 1st Place Gold Standing */}
                <div className="bg-gradient-to-b from-amber-500/10 via-white to-white rounded-xl p-6 border-2 border-amber-400 shadow-md flex flex-col justify-between order-1 md:order-2 hover:shadow-lg transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-3 py-1 bg-amber-400 text-deep-navy font-mono text-[10px] font-bold uppercase rounded-bl-lg">
                    TOP CONTRIBUTOR
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white flex items-center justify-center font-mono font-bold text-sm shadow-md ring-2 ring-amber-300">
                      #1
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full mr-20 sm:mr-24">
                      GOLD STANDING
                    </span>
                  </div>
                  <div className="flex items-center gap-3.5 my-2">
                    <img
                      alt={top1.name}
                      src={top1.avatarUrl || '/brand/logo-icon.png'}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-400 shadow-sm"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-heading font-extrabold text-deep-navy text-base truncate flex items-center gap-1.5">
                        {top1.name}
                        {top1.email.toLowerCase() === currentUserEmail && (
                          <span className="bg-electric-blue text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                            YOU
                          </span>
                        )}
                      </span>
                      <span className="font-sans text-xs text-electric-blue font-semibold">
                        {top1.departmentName}
                      </span>
                      <span className="font-mono text-[11px] text-tech-grey">
                        {top1.regNo || top1.yearDept}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-amber-200 mt-2">
                    <span className="font-heading text-2xl font-extrabold text-deep-navy">
                      {top1.points.toLocaleString()} <span className="text-xs font-mono text-electric-blue">PTS</span>
                    </span>
                    <span className="font-mono text-xs text-tech-grey font-medium">
                      {top1.totalHours} hrs • {top1.shiftsCount} shifts
                    </span>
                  </div>
                </div>

                {/* 3rd Place (if exists) */}
                {top3 ? (
                  <div className="bg-white rounded-xl p-5 border border-light-grey shadow-sm flex flex-col justify-between order-3 hover:shadow-md transition-all relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center font-mono font-bold text-xs shadow-sm">
                        #3
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        BRONZE STANDING
                      </span>
                    </div>
                    <div className="flex items-center gap-3 my-2">
                      <img
                        alt={top3.name}
                        src={top3.avatarUrl || '/brand/logo-icon.png'}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-700/50"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-heading font-bold text-deep-navy text-sm truncate flex items-center gap-1.5">
                          {top3.name}
                          {top3.email.toLowerCase() === currentUserEmail && (
                            <span className="bg-electric-blue text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                              YOU
                            </span>
                          )}
                        </span>
                        <span className="font-sans text-xs text-electric-blue font-medium">
                          {top3.departmentName}
                        </span>
                        <span className="font-mono text-[10px] text-tech-grey">
                          {top3.regNo || top3.yearDept}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-light-grey mt-2">
                      <span className="font-heading text-lg font-bold text-deep-navy">
                        {top3.points.toLocaleString()} <span className="text-xs font-mono text-electric-blue">PTS</span>
                      </span>
                      <span className="font-mono text-xs text-tech-grey">
                        {top3.totalHours} hrs • {top3.shiftsCount} shifts
                      </span>
                    </div>
                  </div>
                ) : <div className="hidden md:block order-3" />}
              </div>
            )}

            {/* Complete Rankings Ledger Table */}
            <div className="bg-white rounded-xl border border-light-grey shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-light-grey flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-electric-blue text-xl">military_tech</span>
                  <h2 className="font-heading text-lg font-bold text-deep-navy">
                    Official Chapter Points Ledger
                  </h2>
                </div>
                <span className="font-mono text-xs text-tech-grey font-semibold">
                  Showing {filtered.length} Member{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-off-white text-tech-grey font-mono text-[11px] uppercase tracking-wider border-b border-light-grey">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Student Member</th>
                      <th className="py-3 px-4">Department / Wing</th>
                      <th className="py-3 px-4">Verified Shifts</th>
                      <th className="py-3 px-4">Vol. Hours</th>
                      <th className="py-3 px-4 text-right">Points Ledger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-grey text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-tech-grey font-sans">
                          Loading chapter leaderboard...
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-tech-grey font-sans">
                          No members found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((user, idx) => {
                        const isCurrentUser = user.email?.toLowerCase() === currentUserEmail;
                        return (
                          <tr
                            key={user.memberId}
                            className={`hover:bg-off-white transition-colors ${
                              isCurrentUser ? 'bg-electric-blue/5 font-semibold' : ''
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
                                    : 'bg-off-white text-deep-navy border border-light-grey'
                                }`}
                              >
                                {idx + 1}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  alt={user.name}
                                  src={user.avatarUrl || '/brand/logo-icon.png'}
                                  className="w-8 h-8 rounded-full object-cover ring-1 ring-light-grey"
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="font-heading font-bold text-deep-navy flex items-center gap-1.5">
                                    {user.name}
                                    {isCurrentUser && (
                                      <span className="bg-electric-blue text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                                        YOU
                                      </span>
                                    )}
                                  </span>
                                  <span className="font-mono text-[11px] text-tech-grey">
                                    {user.regNo || user.email}
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
                              <span className="font-heading text-sm font-extrabold text-deep-navy">
                                {user.points.toLocaleString()}{' '}
                                <span className="font-mono text-xs text-electric-blue">pts</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })
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
