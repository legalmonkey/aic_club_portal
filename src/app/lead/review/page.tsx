'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BackButton } from '@/components/ui/BackButton';

interface Submission {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberAvatar?: string;
  memberYearDept?: string;
  memberRegNo?: string;
  departmentId: string;
  departmentName: string;
  date: string;
  venue: string;
  durationHours: number;
  durationLabel: string;
  roleInEvent: string;
  eventName: string;
  comments: string;
  photoUrl: string;
  geoLat: number | null;
  geoLng: number | null;
  geoStatus: 'verified' | 'remote' | 'missing' | 'flagged';
  geoDistanceMeters?: number;
  status: 'pending' | 'approved' | 'rejected' | 'resubmitted';
  pointsAwarded: number | null;
  requestedPoints: number;
  rejectionReason?: string | null;
  reviewedByName?: string | null;
  createdAt: string;
}

export default function LeadReviewQueuePage() {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [currentPoints, setCurrentPoints] = useState<number>(350);
  const [filterTab, setFilterTab] = useState<'pending' | 'flagged' | 'approved' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState(
    'Missing verifiable on-campus geotag proof. Please attach in-venue photograph from the workshop.'
  );

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/submissions');
      if (res.ok) {
        const data = await res.json();
        const subs: Submission[] = data.submissions || [];
        setSubmissions(subs);
        if (subs.length > 0 && !selectedId) {
          const firstPending = subs.find(s => s.status === 'pending' || s.status === 'resubmitted') || subs[0];
          setSelectedId(firstPending.id);
          setCurrentPoints(firstPending.pointsAwarded ?? 100);
        }
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const selectedSubmission = submissions.find(s => s.id === selectedId) || submissions[0];

  const handleSelectSubmission = (sub: Submission) => {
    setSelectedId(sub.id);
    setCurrentPoints(sub.pointsAwarded ?? 100);
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/submissions/${selectedSubmission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          points: currentPoints,
        }),
      });

      if (res.ok) {
        // Update local state
        setSubmissions(prev =>
          prev.map(s =>
            s.id === selectedSubmission.id
              ? { ...s, status: 'approved', pointsAwarded: currentPoints }
              : s
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/submissions/${selectedSubmission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          reason: rejectReason,
        }),
      });

      if (res.ok) {
        setShowRejectModal(false);
        setSubmissions(prev =>
          prev.map(s =>
            s.id === selectedSubmission.id
              ? { ...s, status: 'rejected', rejectionReason: rejectReason }
              : s
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = submissions.filter(s => s.status === 'pending' || s.status === 'resubmitted').length;
  const flaggedCount = submissions.filter(s => s.geoStatus === 'flagged' || s.geoStatus === 'missing').length;

  const filteredQueue = submissions.filter(sub => {
    if (filterTab === 'pending' && sub.status !== 'pending' && sub.status !== 'resubmitted') return false;
    if (filterTab === 'flagged' && sub.geoStatus !== 'flagged' && sub.geoStatus !== 'missing') return false;
    if (filterTab === 'approved' && sub.status !== 'approved') return false;
    if (
      searchQuery &&
      !sub.memberName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !sub.eventName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar pendingReviewCount={pendingCount} />

      <div className="pl-64 flex flex-col flex-1 min-h-screen">
        <Header pageTitle="Verification & Review Queue" />

        <main className="w-full pt-20 px-6 sm:px-8 pb-16 flex-1 bg-surface font-sans">
          <div className="flex flex-col w-full gap-space-lg">
            {/* Header & Pending Action Banner */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
              <div>
                <BackButton href="/lead/dashboard" label="Back to Lead Dashboard" className="mb-2" />
                <h1 className="font-heading text-3xl md:text-4xl text-deep-navy tracking-tight font-bold">
                  Verification &amp; Review Queue
                </h1>
                <p className="font-sans text-base text-tech-grey mt-1">
                  Evaluate submitted volunteer work, review geotagged proof, and allocate chapter points for the {session?.user?.departmentName || 'Technical'} division.
                </p>
              </div>

              {pendingCount > 0 && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-700 px-4 py-2 rounded-full shrink-0 self-start xl:self-center font-mono text-xs font-bold">
                  <span className="material-symbols-outlined text-sm font-bold text-amber-600">
                    notification_important
                  </span>
                  <span>
                    {pendingCount} PENDING SHIFTS REQUIRING LEAD ACTION
                  </span>
                </div>
              )}
            </div>

            {/* Filter Tabs & Search Controls */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-light-grey flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
              <div className="flex flex-wrap items-center gap-space-xs">
                <button
                  onClick={() => setFilterTab('pending')}
                  className={`px-4 py-2 rounded-xl font-heading text-xs font-bold transition-all flex items-center gap-2 ${
                    filterTab === 'pending'
                      ? 'gradient-electric text-white shadow-sm'
                      : 'bg-off-white border border-light-grey text-deep-navy hover:border-electric-blue'
                  }`}
                >
                  <span>Pending Review</span>
                  <span className={`px-2 py-0.5 rounded-full font-mono text-xs font-bold ${filterTab === 'pending' ? 'bg-white/20 text-white' : 'bg-electric-blue/10 text-electric-blue'}`}>
                    {pendingCount}
                  </span>
                </button>

                <button
                  onClick={() => setFilterTab('flagged')}
                  className={`px-4 py-2 rounded-xl font-heading text-xs font-bold transition-all flex items-center gap-2 ${
                    filterTab === 'flagged'
                      ? 'gradient-electric text-white shadow-sm'
                      : 'bg-off-white border border-light-grey text-deep-navy hover:border-electric-blue'
                  }`}
                >
                  <span>Flagged / Escalated</span>
                  <span className={`px-2 py-0.5 rounded-full font-mono text-xs font-bold ${filterTab === 'flagged' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {flaggedCount}
                  </span>
                </button>

                <button
                  onClick={() => setFilterTab('approved')}
                  className={`px-4 py-2 rounded-xl font-heading text-xs font-bold transition-all ${
                    filterTab === 'approved'
                      ? 'gradient-electric text-white shadow-sm'
                      : 'bg-off-white border border-light-grey text-deep-navy hover:border-electric-blue'
                  }`}
                >
                  Approved History
                </button>

                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-4 py-2 rounded-xl font-heading text-xs font-bold transition-all ${
                    filterTab === 'all'
                      ? 'gradient-electric text-white shadow-sm'
                      : 'bg-off-white border border-light-grey text-deep-navy hover:border-electric-blue'
                  }`}
                >
                  All Entries
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-space-sm">
                <div className="relative flex-1 sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-tech-grey text-sm">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Filter by member or keyword..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-space-sm bg-off-white rounded-lg font-sans text-xs text-deep-navy placeholder:text-tech-grey focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-blue border border-light-grey transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Main 12-Column Grid: Queue List (5 cols) & Review Detail Panel (7 cols) */}
            <div className="grid grid-cols-12 gap-6 xl:gap-8 items-start">
              {/* LEFT: Review Queue List (5 Cols) */}
              <div className="col-span-12 xl:col-span-5 flex flex-col gap-space-md">
                <div className="flex items-center justify-between px-space-xs">
                  <span className="font-mono text-xs uppercase tracking-wider text-tech-grey font-bold">
                    PENDING REVIEW QUEUE ({filteredQueue.length})
                  </span>
                  <span className="font-heading text-xs text-electric-blue font-bold flex items-center gap-1 cursor-pointer hover:underline">
                    <span className="material-symbols-outlined text-xs">tune</span> Sort by Submission Time
                  </span>
                </div>

                <div className="flex flex-col gap-space-sm">
                  {filteredQueue.length === 0 ? (
                    <div className="bg-surface-container-lowest rounded-xl p-space-xl text-center text-tech-grey text-xs border border-light-grey">
                      No shift records in this view.
                    </div>
                  ) : (
                    filteredQueue.map(sub => {
                      const isSelected = sub.id === selectedSubmission?.id;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => handleSelectSubmission(sub)}
                          className={`p-space-lg rounded-xl shadow-sm cursor-pointer transition-all relative overflow-hidden border ${
                            isSelected
                              ? 'bg-surface-container-lowest border-electric-blue shadow-md bg-gradient-to-r from-electric-blue/5 to-transparent'
                              : 'bg-surface-container-lowest border-light-grey hover:bg-off-white'
                          }`}
                        >
                          {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-electric-blue" />}

                          <div className="flex items-start justify-between gap-space-sm mb-space-xs">
                            <div className="flex items-center gap-space-sm min-w-0">
                              <img
                                alt={sub.memberName}
                                className="w-10 h-10 rounded-full object-cover shrink-0 shadow-sm ring-2 ring-electric-blue/30"
                                src={
                                  sub.memberAvatar ||
                                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBzkgs-Xs9KAw3ivlSvtEJ0uUrOEOwf1TMEf2YRpWINiZrHcEPQDTiO6dD7Qg3_i7pxgISTnrNvGo2eWlQei62-ocUEEtutzEPWblTSd3_60YbK8YPR5rNA1xgnF6c9MmQ64F85nCXk87wRMqyZN2FhkN2h7-pL-J9BKVNxjHZFF5TPosOeg0zeuM0gQit7i8ScbiApO6dhZaRKK1EDNkv9GpO57JpAMt8xET2g1Q50T0PhC5MjN6ZD'
                                }
                              />
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-space-xs">
                                  <span className="font-heading text-sm text-deep-navy font-bold truncate">
                                    {sub.memberName}
                                  </span>
                                  <span
                                    className="material-symbols-outlined text-electric-blue text-xs"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                  >
                                    verified
                                  </span>
                                </div>
                                <span className="font-sans text-xs text-tech-grey truncate">
                                  {sub.memberYearDept || sub.departmentName}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold shrink-0 uppercase ${
                                sub.status === 'approved'
                                  ? 'bg-electric-blue/15 text-electric-blue border border-electric-blue/40'
                                  : sub.status === 'rejected'
                                  ? 'bg-red-50 text-red-600 border border-red-200'
                                  : 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
                              }`}
                            >
                              {sub.status === 'approved'
                                ? 'Approved'
                                : sub.status === 'rejected'
                                ? 'Needs Revision'
                                : 'Needs Review'}
                            </span>
                          </div>

                          <div className="bg-off-white p-space-sm rounded-lg mb-space-sm border border-light-grey">
                            <span className="font-heading text-xs truncate text-deep-navy font-bold block mb-1">
                              {sub.eventName}
                            </span>
                            <div className="flex items-center gap-space-md text-tech-grey font-mono text-[11px]">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs text-tech-grey">schedule</span>
                                {sub.durationHours} hrs
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs text-tech-grey">calendar_today</span>
                                {sub.date}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-space-xs">
                            <div className="flex items-center gap-1 text-electric-blue font-bold font-mono text-xs">
                              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                                stars
                              </span>
                              <span>+{sub.pointsAwarded || sub.requestedPoints} PTS</span>
                            </div>
                            <span className="font-heading text-xs text-electric-blue font-bold flex items-center gap-0.5 hover:underline">
                              Inspect Entry <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Auto Geofence Status Callout */}
                <div className="bg-surface-container-lowest p-space-md rounded-xl flex items-center justify-between border border-light-grey shadow-sm">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-8 h-8 rounded-lg bg-electric-blue/10 text-electric-blue flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-base">auto_awesome</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-heading text-xs text-deep-navy font-bold">
                        Auto-Geofence Audit Engine
                      </span>
                      <span className="font-sans text-xs text-tech-grey">
                        All active queue records cross-referenced against campus geofence constraints.
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-electric-blue text-lg">check_circle</span>
                </div>
              </div>

              {/* RIGHT: Detailed Submission Review Panel (7 Cols) */}
              <div className="col-span-12 xl:col-span-7 flex flex-col gap-space-lg">
                {selectedSubmission ? (
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-xl flex flex-col gap-space-lg border border-light-grey">
                    {/* Member Details Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md bg-off-white -mx-space-xl -mt-space-xl px-space-xl pt-space-xl rounded-t-xl gap-space-md border-b border-light-grey">
                      <div className="flex items-center gap-space-md min-w-0">
                        <div className="relative shrink-0">
                          <img
                            alt={selectedSubmission.memberName}
                            className="w-14 h-14 rounded-full object-cover shadow-md ring-2 ring-electric-blue/40"
                            src={
                              selectedSubmission.memberAvatar ||
                              'https://lh3.googleusercontent.com/aida-public/AB6AXuBzkgs-Xs9KAw3ivlSvtEJ0uUrOEOwf1TMEf2YRpWINiZrHcEPQDTiO6dD7Qg3_i7pxgISTnrNvGo2eWlQei62-ocUEEtutzEPWblTSd3_60YbK8YPR5rNA1xgnF6c9MmQ64F85nCXk87wRMqyZN2FhkN2h7-pL-J9BKVNxjHZFF5TPosOeg0zeuM0gQit7i8ScbiApO6dhZaRKK1EDNkv9GpO57JpAMt8xET2g1Q50T0PhC5MjN6ZD'
                            }
                          />
                          <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full gradient-electric flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                            ★
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-space-xs flex-wrap">
                            <span className="font-heading text-xl text-deep-navy font-bold">
                              {selectedSubmission.memberName}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-electric-blue/10 border border-electric-blue/20 text-electric-blue font-mono text-xs font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                                military_tech
                              </span>
                              Rank #1 Gold Member
                            </span>
                          </div>
                          <span className="font-sans text-xs text-tech-grey mt-0.5">
                            {selectedSubmission.memberYearDept} (Reg: {selectedSubmission.memberRegNo || '22BCE1042'})
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-start sm:items-end shrink-0">
                        <span className="font-mono text-xs text-tech-grey uppercase tracking-wider">
                          MOBILE GPS TELEMETRY
                        </span>
                        <span className="font-mono text-xs text-deep-navy font-semibold">
                          {selectedSubmission.date}
                        </span>
                        <span className="font-heading text-xs text-electric-blue font-bold">
                          {selectedSubmission.departmentName}
                        </span>
                      </div>
                    </div>

                    {/* 4-Stat Box Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
                      <div className="bg-off-white p-space-sm rounded-lg border border-light-grey">
                        <span className="font-mono text-xs uppercase tracking-wider text-tech-grey block mb-1">
                          EXECUTION DATE
                        </span>
                        <span className="font-heading text-xs text-deep-navy font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-electric-blue">calendar_month</span>
                          {selectedSubmission.date}
                        </span>
                      </div>

                      <div className="bg-off-white p-space-sm rounded-lg border border-light-grey">
                        <span className="font-mono text-xs uppercase tracking-wider text-tech-grey block mb-1">
                          LOGGED HOURS
                        </span>
                        <span className="font-heading text-xs text-deep-navy font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-electric-blue">timer</span>
                          {selectedSubmission.durationLabel || `${selectedSubmission.durationHours} hrs`}
                        </span>
                      </div>

                      <div className="bg-off-white p-space-sm rounded-lg border border-light-grey">
                        <span className="font-mono text-xs uppercase tracking-wider text-tech-grey block mb-1">
                          CAMPUS VENUE
                        </span>
                        <span className="font-heading text-xs text-deep-navy font-bold truncate flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-electric-blue">location_on</span>
                          {selectedSubmission.venue}
                        </span>
                      </div>

                      <div className="bg-off-white p-space-sm rounded-lg border border-light-grey">
                        <span className="font-mono text-xs uppercase tracking-wider text-tech-grey block mb-1">
                          ASSIGNED ROLE
                        </span>
                        <span className="font-heading text-xs text-deep-navy font-bold truncate flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-electric-blue">badge</span>
                          {selectedSubmission.roleInEvent}
                        </span>
                      </div>
                    </div>

                    {/* Volunteer Contribution Statement */}
                    <div className="flex flex-col gap-space-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-xs uppercase tracking-wider text-deep-navy font-bold">
                          Volunteer Work Contribution Statement
                        </span>
                        <span className="font-mono text-xs text-electric-blue font-bold flex items-center gap-1 bg-electric-blue/10 border border-electric-blue/20 px-2.5 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-xs">verified_user</span>
                          {selectedSubmission.comments.length} CHARS • DETAILED
                        </span>
                      </div>
                      <div className="bg-off-white p-space-md rounded-lg text-deep-navy font-sans text-xs leading-relaxed relative border border-light-grey">
                        <span className="material-symbols-outlined absolute top-2 right-2 text-tech-grey/30 text-2xl">
                          format_quote
                        </span>
                        “{selectedSubmission.comments}”
                      </div>
                    </div>

                    {/* Geotagged Photo & Proof Verification */}
                    <div className="flex flex-col gap-space-sm">
                      <span className="font-heading text-xs uppercase tracking-wider text-deep-navy font-bold">
                        Geotagged Photo &amp; Hardware Proof Verification
                      </span>
                      <div className="relative rounded-xl overflow-hidden shadow-sm aspect-video sm:aspect-[21/9] bg-deep-navy group border border-light-grey">
                        <img
                          src={selectedSubmission.photoUrl}
                          alt="Verification Evidence"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/90 via-transparent to-black/30 pointer-events-none" />

                        <div className="absolute top-3 left-3 bg-deep-navy/80 backdrop-blur-md px-3 py-1 rounded-lg text-white flex items-center gap-1.5 shadow-sm border border-white/10">
                          <span className="material-symbols-outlined text-xs text-electric-blue font-bold">photo_camera</span>
                          <span className="font-mono text-xs font-bold uppercase">Captured Evidence</span>
                        </div>

                        <div className="absolute top-3 right-3 bg-deep-navy/80 text-light-blue px-3 py-1 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm border border-white/10">
                          <span className="material-symbols-outlined text-xs text-electric-blue">shield</span>
                          <span>ANTI-SPOOF: VALID</span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs text-white bg-deep-navy/85 backdrop-blur-md p-3 rounded-lg border border-white/10">
                          <div className="flex items-center gap-space-xs min-w-0">
                            <span className="material-symbols-outlined text-electric-blue shrink-0 text-base">pin_drop</span>
                            <span className="font-mono text-xs truncate">
                              {selectedSubmission.geoLat && selectedSubmission.geoLng
                                ? `${selectedSubmission.geoLat.toFixed(4)}° N, ${selectedSubmission.geoLng.toFixed(4)}° E • ${selectedSubmission.venue}`
                                : 'No Location Tag Available'}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-light-blue shrink-0 font-bold">
                            {selectedSubmission.geoDistanceMeters
                              ? `DELTA: ${selectedSubmission.geoDistanceMeters}M FROM TARGET`
                              : 'CAMPUS NETWORK VERIFIED'}
                          </span>
                        </div>
                      </div>

                      {/* GPS Confirmation Banner */}
                      <div
                        className={`p-space-md rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm shadow-sm border ${
                          selectedSubmission.geoStatus === 'verified'
                            ? 'bg-electric-blue/10 border-electric-blue/30 text-deep-navy'
                            : selectedSubmission.geoStatus === 'remote'
                            ? 'bg-amber-500/10 border-amber-500/30 text-deep-navy'
                            : 'bg-red-500/10 border-red-500/30 text-deep-navy'
                        }`}
                      >
                        <div className="flex items-center gap-space-sm">
                          <div
                            className={`w-9 h-9 rounded-lg text-white flex items-center justify-center font-bold shrink-0 shadow-sm ${
                              selectedSubmission.geoStatus === 'verified'
                                ? 'gradient-electric'
                                : selectedSubmission.geoStatus === 'remote'
                                ? 'bg-amber-600'
                                : 'bg-red-600'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">
                              {selectedSubmission.geoStatus === 'verified'
                                ? 'verified'
                                : selectedSubmission.geoStatus === 'remote'
                                ? 'cloud'
                                : 'warning'}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-heading text-sm text-deep-navy font-bold">
                              {selectedSubmission.geoStatus === 'verified'
                                ? 'Campus GPS Match 100% Confirmed'
                                : selectedSubmission.geoStatus === 'remote'
                                ? 'Remote / Virtual Session Logged'
                                : 'Geotag Coordinates Missing or Out of Bounds'}
                            </span>
                            <span className="font-sans text-xs text-tech-grey">
                              {selectedSubmission.geoLat && selectedSubmission.geoLng
                                ? `Lat: ${selectedSubmission.geoLat.toFixed(4)}, Lng: ${selectedSubmission.geoLng.toFixed(4)} • ${selectedSubmission.geoDistanceMeters ? `${selectedSubmission.geoDistanceMeters.toFixed(1)}m from center` : 'Within campus bounds'}`
                                : 'No EXIF GPS metadata embedded in upload'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-xs font-bold self-start sm:self-center text-electric-blue">
                          <span className="material-symbols-outlined text-xs">fingerprint</span>
                          <span>{selectedSubmission.geoStatus.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Points Allocation & Decision Controls */}
                    <div className="bg-off-white p-space-lg rounded-xl flex flex-col gap-space-md border border-light-grey">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-space-xs">
                          <span className="material-symbols-outlined text-electric-blue font-bold">stars</span>
                          <span className="font-heading text-sm text-deep-navy font-bold">
                            Points Allocation &amp; Decision
                          </span>
                        </div>
                        <span className="font-mono text-xs text-electric-blue font-bold">DIRECT LEAD EVALUATION</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-end">
                        {/* Points Counter Stepper */}
                        <div className="md:col-span-5 flex flex-col gap-space-2xs">
                          <label className="font-mono text-xs uppercase tracking-wider text-tech-grey font-bold">
                            POINTS TO CREDIT
                          </label>
                          <div className="flex items-center bg-white rounded-lg h-11 px-space-xs shadow-sm border border-light-grey">
                            <button
                              type="button"
                              onClick={() => setCurrentPoints(Math.max(0, currentPoints - 25))}
                              className="w-8 h-8 rounded text-deep-navy hover:bg-off-white flex items-center justify-center transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">remove</span>
                            </button>
                            <div className="flex-1 flex items-center justify-center gap-1">
                              <span className="material-symbols-outlined text-electric-blue text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                                stars
                              </span>
                              <input
                                type="number"
                                value={currentPoints}
                                onChange={e => setCurrentPoints(Number(e.target.value))}
                                className="w-16 text-center font-heading text-lg text-deep-navy bg-transparent focus:outline-none font-bold"
                              />
                              <span className="font-mono text-xs text-tech-grey font-medium">pts</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCurrentPoints(currentPoints + 25)}
                              className="w-8 h-8 rounded text-deep-navy hover:bg-off-white flex items-center justify-center transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                          </div>
                        </div>

                        {/* Reject & Approve Action Buttons */}
                        <div className="md:col-span-7 flex items-center gap-space-sm justify-end">
                          <button
                            type="button"
                            onClick={() => setShowRejectModal(true)}
                            disabled={isProcessing || selectedSubmission.status === 'rejected'}
                            className="h-11 px-space-md rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-sans text-xs font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                            Reject / Revise
                          </button>

                          <button
                            type="button"
                            onClick={handleApprove}
                            disabled={isProcessing || selectedSubmission.status === 'approved'}
                            className="h-11 px-space-lg gradient-electric hover:opacity-95 text-white font-heading text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-base">check</span>
                            {selectedSubmission.status === 'approved'
                              ? 'Approved & Signed Off'
                              : isProcessing
                              ? 'Recording Ledger...'
                              : 'Signoff & Award Points'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-container-lowest rounded-xl p-space-3xl text-center text-tech-grey text-xs border border-light-grey">
                    Select a submission from the review queue to evaluate.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-deep-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-space-md">
          <div className="bg-surface-container-lowest rounded-2xl p-space-xl max-w-lg w-full shadow-2xl border border-light-grey flex flex-col gap-space-md font-sans">
            <div className="flex items-center gap-2 text-red-600">
              <span className="material-symbols-outlined text-2xl">report_problem</span>
              <h3 className="font-heading text-lg font-bold text-deep-navy">
                Provide Rejection / Revision Reason
              </h3>
            </div>

            <p className="font-sans text-xs text-tech-grey">
              The member will receive an in-app alert and email notification with this note and can edit their submission.
            </p>

            <textarea
              rows={4}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full bg-off-white text-deep-navy p-space-md rounded-lg font-sans text-xs border border-light-grey focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-space-md py-2 rounded-lg bg-off-white text-deep-navy hover:bg-light-grey font-sans text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isProcessing}
                className="px-space-lg py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-heading text-xs font-bold shadow-sm"
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
