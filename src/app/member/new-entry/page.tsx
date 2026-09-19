'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BackButton } from '@/components/ui/BackButton';
import { DurationWheelPicker } from '@/components/ui/DurationWheelPicker';

export default function NewShiftEntryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role && session.user.role !== 'member') {
      if (session.user.role === 'lead') {
        router.replace('/lead/dashboard');
      } else if (session.user.role === 'board') {
        router.replace('/board/dashboard');
      } else {
        router.replace('/admin');
      }
    }
  }, [session, status, router]);

  // Form State - Cleared for genuine member entry
  const [eventName, setEventName] = useState('');
  const [roleInEvent, setRoleInEvent] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [shiftDate, setShiftDate] = useState('');
  const [shiftDuration, setShiftDuration] = useState('');
  const [durationHours, setDurationHours] = useState(0);
  const [venue, setVenue] = useState('');
  const [comments, setComments] = useState('');

  // Duration Wheel Picker Modal
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  // Photo State
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local preview
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) {
      setSubmitError('Please enter the event or chapter activity title.');
      return;
    }
    const finalRole = roleInEvent === 'Other' ? customRole.trim() : roleInEvent;
    if (!finalRole) {
      setSubmitError(roleInEvent === 'Other' ? 'Please specify your custom role.' : 'Please select your assigned role in the event.');
      return;
    }
    if (!shiftDate) {
      setSubmitError('Please select the date completed.');
      return;
    }
    if (durationHours <= 0) {
      setSubmitError('Please select your shift duration using the scroll wheel.');
      return;
    }
    if (!venue.trim()) {
      setSubmitError('Please write the campus venue or lab.');
      return;
    }
    if (comments.trim().length < 50) {
      setSubmitError('Work synopsis must be at least 50 characters.');
      return;
    }
    if (!photoPreview) {
      setSubmitError('Please upload an in-venue shift photo proof.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: eventName.trim(),
          roleInEvent: finalRole,
          date: shiftDate,
          venue: venue.trim(),
          durationHours,
          durationLabel: shiftDuration,
          comments: comments.trim(),
          photoUrl: photoPreview,
          geoLat: null,
          geoLng: null,
          requestedPoints: 0,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit shift log');
      }

      router.push('/member/dashboard');
    } catch (err: any) {
      setSubmitError(err.message || 'Submission error');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />

      <div className="pl-64 flex flex-col flex-1 min-h-screen">
        <Header pageTitle="Log Shift Entry" />

        <main className="w-full pt-20 px-6 sm:px-8 pb-16 flex-1 bg-surface font-sans">
          <div className="flex flex-col w-full gap-space-lg">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
              <div>
                <BackButton href="/member/dashboard" label="Back to Dashboard" className="mb-2" />
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-electric-blue/10 border border-electric-blue/20 text-electric-blue font-mono text-xs uppercase tracking-wider mb-2 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-blue animate-pulse"></span>
                  NIS-01 // TELEMETRY INGESTION ENGINE
                </div>
                <h1 className="font-heading text-3xl md:text-4xl text-deep-navy tracking-tight font-bold">
                  Submit Volunteer &amp; Event Shift
                </h1>
                <p className="font-sans text-base text-tech-grey max-w-3xl mt-1">
                  Log your completed chapter activities for department lead verification and verified points ledger crediting.
                </p>
              </div>
              <div className="flex items-center gap-space-xs self-start md:self-auto bg-surface-container-lowest border border-light-grey px-space-md py-space-xs rounded-xl shadow-sm">
                <span className="material-symbols-outlined text-electric-blue text-base">verified_user</span>
                <span className="font-mono text-xs font-semibold text-deep-navy">VIT CHAPTER // VERIFIED LEDGER</span>
              </div>
            </div>

            {/* Expedited Review Announcement Banner */}
            <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-light-grey">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-electric-blue rounded-l-xl"></div>
              <div className="flex items-center gap-space-md pl-space-xs">
                <div className="w-10 h-10 rounded-lg gradient-electric text-white flex items-center justify-center shrink-0 shadow-md">
                  <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-heading text-deep-navy font-bold text-base">Academic Year 2026-27 Shift Window Active</span>
                </div>
              </div>
            </div>

            {/* 12-Column Grid: Form (7 cols) + Status Ledger (5 cols) */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
              {/* LEFT COLUMN: Structured Form Submission (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* Section 1: Event & Shift Information */}
                <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm flex flex-col gap-space-lg border border-light-grey">
                  <div className="flex items-center justify-between pb-space-xs border-b border-light-grey/60">
                    <div className="flex items-center gap-space-sm">
                      <span className="w-7 h-7 rounded-lg bg-electric-blue/10 text-electric-blue flex items-center justify-center font-mono text-xs font-bold border border-electric-blue/20">
                        01
                      </span>
                      <h2 className="font-heading text-xl text-deep-navy font-bold">
                        Event &amp; Shift Information
                      </h2>
                    </div>
                    <span className="font-mono text-xs uppercase tracking-wider text-tech-grey">
                      SEC-01 // EVENT DATA
                    </span>
                  </div>

                  <div className="flex flex-col gap-space-md">
                    {/* Event Title */}
                    <div className="flex flex-col gap-space-2xs">
                      <label className="font-sans text-sm font-semibold text-deep-navy flex items-center justify-between" htmlFor="event-title">
                        <span>Event / Chapter Activity Title <span className="text-red-500">*</span></span>
                        <span className="font-mono text-xs text-tech-grey">OFFICIAL AIC EVENT</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-tech-grey text-lg">event_available</span>
                        <input
                          id="event-title"
                          type="text"
                          required
                          placeholder="e.g. AI Track Hackathon 2026 - Mentor Coordination"
                          value={eventName}
                          onChange={e => setEventName(e.target.value)}
                          className="w-full bg-off-white text-deep-navy pl-10 pr-4 py-2.5 rounded-lg font-sans text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-electric-blue border border-light-grey shadow-sm transition-all"
                        />
                      </div>
                    </div>

                    {/* Role & Date Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                      {/* Assigned Role */}
                      <div className="flex flex-col gap-space-2xs">
                        <label className="font-sans text-sm font-semibold text-deep-navy" htmlFor="role-select">
                          Assigned Role <span className="text-red-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3 text-tech-grey text-lg">badge</span>
                          <select
                            id="role-select"
                            required
                            value={roleInEvent}
                            onChange={e => setRoleInEvent(e.target.value)}
                            className="w-full bg-off-white text-deep-navy pl-10 pr-9 py-2.5 rounded-lg font-sans text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-electric-blue appearance-none shadow-sm transition-all cursor-pointer border border-light-grey"
                          >
                            <option value="" disabled>Select assigned role...</option>
                            <option value="Workshop Mentor / Track Lead">Workshop Mentor / Track Lead</option>
                            <option value="General Event Facilitator">General Event Facilitator</option>
                            <option value="Compute & Infra Logistics">Compute &amp; Infra Logistics</option>
                            <option value="Judging & Evaluation Desk">Judging &amp; Evaluation Desk</option>
                            <option value="Media & Documentation">Media &amp; Documentation</option>
                            <option value="Registration & Desk Operations">Registration &amp; Desk Operations</option>
                            <option value="Speaker & Guest Hospitality">Speaker &amp; Guest Hospitality</option>
                            <option value="Other">Other (Specify Custom Role)</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-3 text-tech-grey pointer-events-none text-base">
                            expand_more
                          </span>
                        </div>

                        {roleInEvent === 'Other' && (
                          <div className="relative flex items-center mt-2 animate-fadeIn">
                            <span className="material-symbols-outlined absolute left-3 text-electric-blue text-base">edit_note</span>
                            <input
                              type="text"
                              required
                              placeholder="Write your custom role..."
                              value={customRole}
                              onChange={e => setCustomRole(e.target.value)}
                              className="w-full bg-white text-deep-navy pl-9 pr-4 py-2 rounded-lg font-sans text-xs focus:outline-none focus:ring-2 focus:ring-electric-blue border border-electric-blue/40 shadow-xs"
                              autoFocus
                            />
                          </div>
                        )}
                      </div>

                      {/* Date Completed */}
                      <div className="flex flex-col gap-space-2xs">
                        <label className="font-sans text-sm font-semibold text-deep-navy" htmlFor="shift-date">
                          Date Completed <span className="text-red-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3 text-tech-grey text-lg">calendar_month</span>
                          <input
                            id="shift-date"
                            type="date"
                            required
                            value={shiftDate}
                            onChange={e => setShiftDate(e.target.value)}
                            className="w-full bg-off-white text-deep-navy pl-10 pr-4 py-2 rounded-lg font-sans text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-electric-blue shadow-sm transition-all cursor-pointer border border-light-grey"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Duration & Location Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                      {/* Shift Duration - Scroll Wheel Selector */}
                      <div className="flex flex-col gap-space-2xs">
                        <label className="font-sans text-sm font-semibold text-deep-navy flex items-center justify-between" htmlFor="shift-duration">
                          <span>Shift Duration <span className="text-red-500">*</span></span>
                          <span className="font-mono text-xs text-electric-blue font-bold">
                            {durationHours > 0 ? `${durationHours.toFixed(1)} HRS VERIFIED` : 'SCROLL WHEEL'}
                          </span>
                        </label>
                        <div
                          onClick={() => setShowDurationPicker(true)}
                          className="relative flex items-center cursor-pointer group"
                        >
                          <span className="material-symbols-outlined absolute left-3 text-tech-grey group-hover:text-electric-blue text-lg transition-colors">
                            schedule
                          </span>
                          <input
                            id="shift-duration"
                            type="text"
                            readOnly
                            required
                            placeholder="Click to scroll wheel duration..."
                            value={shiftDuration}
                            className="w-full bg-off-white text-deep-navy pl-10 pr-24 py-2.5 rounded-lg font-sans text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-electric-blue shadow-sm transition-all border border-light-grey cursor-pointer select-none"
                          />
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setShowDurationPicker(true);
                            }}
                            className="absolute right-2 px-2.5 py-1 rounded-md bg-electric-blue/10 hover:bg-electric-blue/20 text-electric-blue font-mono text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">tune</span>
                            <span>Wheel</span>
                          </button>
                        </div>
                      </div>

                      {/* Campus Venue / Lab - Free Text Entry */}
                      <div className="flex flex-col gap-space-2xs">
                        <label className="font-sans text-sm font-semibold text-deep-navy" htmlFor="venue-location">
                          Campus Venue / Lab <span className="text-red-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3 text-tech-grey text-lg">location_on</span>
                          <input
                            id="venue-location"
                            type="text"
                            required
                            list="campus-venue-suggestions"
                            placeholder="Write campus venue or lab..."
                            value={venue}
                            onChange={e => setVenue(e.target.value)}
                            className="w-full bg-off-white text-deep-navy pl-10 pr-4 py-2.5 rounded-lg font-sans text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-electric-blue shadow-sm transition-all border border-light-grey"
                          />
                          <datalist id="campus-venue-suggestions">
                            <option value="Anna Auditorium" />
                            <option value="Tech Tower (TT) 302" />
                            <option value="Tech Tower (TT) 412" />
                            <option value="SJT (Silver Jubilee Tower) Lab 102" />
                            <option value="SJT (Silver Jubilee Tower) Audi" />
                            <option value="SMV (Sir M. Visvesvaraya) Hall" />
                            <option value="MB (Main Building) 204" />
                            <option value="Delta Block AI Lab" />
                            <option value="Academic Block 1" />
                            <option value="Netaji Subhas Chandra Bose Stadium" />
                          </datalist>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Work Summary & Contribution Log */}
                <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm flex flex-col gap-space-md border border-light-grey">
                  <div className="flex items-center justify-between pb-space-xs border-b border-light-grey/60">
                    <div className="flex items-center gap-space-sm">
                      <span className="w-7 h-7 rounded-lg bg-electric-blue/10 text-electric-blue flex items-center justify-center font-mono text-xs font-bold border border-electric-blue/20">
                        02
                      </span>
                      <h2 className="font-heading text-xl text-deep-navy font-bold">
                        Contribution Log &amp; Outcomes
                      </h2>
                    </div>
                    <span className="font-mono text-xs uppercase tracking-wider text-tech-grey">
                      SEC-02 // SYNOPSIS
                    </span>
                  </div>

                  <div className="flex flex-col gap-space-2xs">
                    <div className="flex items-center justify-between">
                      <label className="font-sans text-sm font-semibold text-deep-navy" htmlFor="work-summary">
                        Detailed Work Synopsis <span className="text-red-500">*</span>
                      </label>
                      <span
                        className={`font-mono text-xs font-bold ${
                          comments.length >= 50 ? 'text-electric-blue' : 'text-red-500'
                        }`}
                      >
                        {comments.length} / 50 MIN CHARS
                      </span>
                    </div>
                    <div className="relative">
                      <textarea
                        id="work-summary"
                        rows={4}
                        required
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        placeholder="Provide clear technical, operational, or logistical tasks completed during the designated shift window..."
                        className="w-full bg-off-white text-deep-navy p-space-md rounded-lg font-sans text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-electric-blue shadow-sm transition-all border border-light-grey leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Shift Photo Evidence */}
                <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm flex flex-col gap-space-md border border-light-grey">
                  <div className="flex items-center justify-between pb-space-xs border-b border-light-grey/60">
                    <div className="flex items-center gap-space-sm">
                      <span className="w-7 h-7 rounded-lg bg-electric-blue/10 text-electric-blue flex items-center justify-center font-mono text-xs font-bold border border-electric-blue/20">
                        03
                      </span>
                      <h2 className="font-heading text-xl text-deep-navy font-bold">
                        Shift Photo Evidence
                      </h2>
                    </div>
                    <span className="font-mono text-xs uppercase tracking-wider text-tech-grey">
                      SEC-03 // PHOTO PROOF
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />

                  {/* Photo Preview Card */}
                  {photoPreview ? (
                    <div className="flex flex-col gap-space-sm">
                      <div className="relative rounded-xl overflow-hidden shadow-sm aspect-video sm:aspect-[21/9] bg-deep-navy group border border-light-grey">
                        <img
                          src={photoPreview}
                          alt="Shift photo preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/90 via-transparent to-black/30 pointer-events-none" />

                        <div className="absolute top-3 left-3 bg-deep-navy/80 backdrop-blur-md px-3 py-1 rounded-lg text-white flex items-center gap-1.5 shadow-sm border border-white/10">
                          <span className="material-symbols-outlined text-xs text-electric-blue font-bold">photo_camera</span>
                          <span className="font-mono text-xs font-bold uppercase">Captured Evidence</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute top-3 right-3 bg-white/90 hover:bg-white px-3 py-1 rounded-lg text-deep-navy font-sans text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">sync</span>
                          Change Photo
                        </button>

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white bg-deep-navy/85 backdrop-blur-md p-3 rounded-lg border border-white/10">
                          <div className="flex items-center gap-space-xs min-w-0">
                            <span className="material-symbols-outlined text-electric-blue shrink-0 text-base">location_on</span>
                            <span className="font-mono text-xs truncate">
                              {venue ? `Venue: ${venue}` : 'Shift Photo Attached'}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-light-blue shrink-0 font-bold">
                            READY FOR REVIEW
                          </span>
                        </div>
                      </div>

                      <div className="bg-electric-blue/10 border border-electric-blue/30 text-deep-navy p-space-md rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-space-sm">
                          <span className="material-symbols-outlined text-lg text-electric-blue">check_circle</span>
                          <div className="flex flex-col">
                            <span className="font-heading text-sm text-deep-navy font-bold">
                              Photo Proof Attached
                            </span>
                            <span className="font-sans text-xs text-tech-grey">
                              Image evidence attached and ready for department lead review.
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold uppercase bg-white border border-electric-blue/30 text-electric-blue px-2.5 py-1 rounded-lg">
                          ATTACHED
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-light-grey rounded-xl p-space-xl flex flex-col items-center justify-center gap-space-sm cursor-pointer hover:bg-off-white transition-colors text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-electric-blue/10 text-electric-blue flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                      </div>
                      <div>
                        <span className="font-heading text-sm text-deep-navy font-bold block">
                          Click to upload shift photo proof
                        </span>
                        <p className="font-sans text-xs text-tech-grey mt-0.5">
                          Supports JPG, PNG from mobile camera or event photo evidence
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-space-sm rounded-lg font-sans text-sm">
                    {submitError}
                  </div>
                )}

                {/* Submit Action Button */}
                <div className="flex items-center justify-end gap-space-sm">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-space-lg py-2.5 rounded-lg bg-surface-container-low text-deep-navy hover:bg-light-grey font-sans text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-space-xl py-2.5 rounded-lg gradient-electric hover:opacity-95 text-white font-heading text-sm font-bold shadow-md transition-all flex items-center gap-space-xs disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">send</span>
                    {submitting ? 'Submitting for Lead Verification...' : 'Submit Shift Log for Verification'}
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: Verification Lifecycle & Ledger Guide (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* Lifecycle Panel */}
                <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm flex flex-col gap-space-md border border-light-grey">
                  <div className="flex items-center justify-between pb-space-xs border-b border-light-grey/60">
                    <h3 className="font-heading text-lg text-deep-navy font-bold">
                      Verification Lifecycle
                    </h3>
                  </div>

                  <div className="flex flex-col gap-space-md">
                    <div className="flex items-start gap-space-sm">
                      <div className="w-7 h-7 rounded-full gradient-electric text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                        1
                      </div>
                      <div className="flex flex-col">
                        <span className="font-heading text-sm text-deep-navy font-bold">
                          Shift Submission Logged
                        </span>
                        <p className="font-sans text-xs text-tech-grey mt-0.5">
                          Your submission enters the department review queue and triggers lead notifications.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-space-sm">
                      <div className="w-7 h-7 rounded-full bg-light-blue/20 text-electric-blue border border-electric-blue/30 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="flex flex-col">
                        <span className="font-heading text-sm text-deep-navy font-bold">
                          Department Co-Lead Verification
                        </span>
                        <p className="font-sans text-xs text-tech-grey mt-0.5">
                          Leads inspect shift photo proof, verified hours, and work output before signing off.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-space-sm">
                      <div className="w-7 h-7 rounded-full bg-light-grey text-tech-grey flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="flex flex-col">
                        <span className="font-heading text-sm text-deep-navy font-bold">
                          Points Credited to Official Ledger
                        </span>
                        <p className="font-sans text-xs text-tech-grey mt-0.5">
                          Approved points immediately credit to your permanent member index and chapter leaderboard.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Point Allocation Policy Card */}
                <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-sm border border-light-grey">
                  <div className="flex items-center gap-space-xs text-electric-blue font-semibold">
                    <span className="material-symbols-outlined text-base">military_tech</span>
                    <span className="font-heading text-sm text-deep-navy font-bold">Lead Point Allocation</span>
                  </div>
                  <p className="font-sans text-xs text-tech-grey leading-relaxed">
                    Shift points are assessed and awarded directly by your department co-lead upon verifying shift output, contribution level, and verified venue presence.
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-light-grey font-mono text-[10px] text-electric-blue font-bold uppercase">
                    <span className="material-symbols-outlined text-xs">shield_person</span>
                    <span>Direct Co-Lead Evaluation</span>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* Duration Scroll Wheel Picker Modal */}
      <DurationWheelPicker
        isOpen={showDurationPicker}
        onClose={() => setShowDurationPicker(false)}
        initialHours={durationHours}
        onSelect={(hrs, label) => {
          setDurationHours(hrs);
          setShiftDuration(label);
        }}
      />
    </div>
  );
}
