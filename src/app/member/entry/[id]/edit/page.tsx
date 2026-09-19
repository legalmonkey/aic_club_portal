'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BackButton } from '@/components/ui/BackButton';

export default function EditRejectedSubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [eventName, setEventName] = useState('');
  const [roleInEvent, setRoleInEvent] = useState('');
  const [shiftDate, setShiftDate] = useState('');
  const [venue, setVenue] = useState('');
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!submissionId) return;

    fetch(`/api/submissions/${submissionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.submission) {
          const s = data.submission;
          setEventName(s.eventName);
          setRoleInEvent(s.roleInEvent);
          setShiftDate(s.date);
          setVenue(s.venue);
          setComments(s.comments);
          setRejectionReason(s.rejectionReason || 'No specific reason provided.');
          setPhotoPreview(s.photoUrl);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [submissionId]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comments.length < 50) {
      setErrorMsg('Work synopsis must be at least 50 characters.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resubmit',
          eventName,
          roleInEvent,
          date: shiftDate,
          venue,
          comments,
          photoUrl: photoPreview,
          geoLat: null,
          geoLng: null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to resubmit');
      }

      router.push('/member/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error resubmitting shift');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-surface items-center justify-center">
        <span className="font-label-md text-label-md text-outline">Loading submission...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />

      <div className="pl-64 flex flex-col flex-1 min-h-screen">
        <Header pageTitle="Edit & Resubmit Shift" />

        <main className="w-full pt-20 px-6 sm:px-8 pb-16 flex-1 bg-surface font-sans">
          <div className="flex flex-col w-full max-w-4xl gap-space-lg">
            {/* Header */}
            <div className="flex flex-col gap-space-2xs">
              <BackButton href="/member/dashboard" label="Back to Dashboard" className="mb-2" />
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 font-mono text-xs uppercase tracking-wider mb-2 font-semibold w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                NIS-01 // REVISION REQUIRED
              </div>
              <h1 className="font-heading text-3xl md:text-4xl text-deep-navy tracking-tight font-bold">
                Revise &amp; Resubmit Shift Log
              </h1>
              <p className="font-sans text-base text-tech-grey mt-1">
                Address feedback from your department lead and resubmit your shift for expedited review.
              </p>
            </div>

            {/* Lead Rejection Reason Callout */}
            <div className="bg-red-50 border border-red-200 p-space-md rounded-xl flex items-start gap-space-sm text-deep-navy shadow-sm">
              <span className="material-symbols-outlined text-red-500 text-xl shrink-0 mt-0.5">
                report_problem
              </span>
              <div className="flex flex-col">
                <span className="font-heading text-sm text-red-600 font-bold">
                  Department Lead Rejection Feedback:
                </span>
                <p className="font-sans text-sm text-deep-navy mt-1 leading-relaxed">
                  {rejectionReason}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-space-sm rounded-lg font-sans text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleResubmit} className="flex flex-col gap-space-lg">
              {/* Shift Information */}
              <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm border border-light-grey flex flex-col gap-space-md">
                <h2 className="font-heading text-xl text-deep-navy font-bold border-b border-light-grey/60 pb-space-xs">
                  Updated Shift Details
                </h2>

                <div className="flex flex-col gap-space-2xs">
                  <label className="font-sans text-sm font-semibold text-deep-navy">Event Title</label>
                  <input
                    type="text"
                    required
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                    className="bg-off-white text-deep-navy px-space-md py-2.5 rounded-lg font-sans text-sm border border-light-grey focus:outline-none focus:ring-2 focus:ring-electric-blue"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-space-2xs">
                    <label className="font-sans text-sm font-semibold text-deep-navy">Assigned Role</label>
                    <input
                      type="text"
                      required
                      value={roleInEvent}
                      onChange={e => setRoleInEvent(e.target.value)}
                      className="bg-off-white text-deep-navy px-space-md py-2.5 rounded-lg font-sans text-sm border border-light-grey focus:outline-none focus:ring-2 focus:ring-electric-blue"
                    />
                  </div>

                  <div className="flex flex-col gap-space-2xs">
                    <label className="font-sans text-sm font-semibold text-deep-navy">Date</label>
                    <input
                      type="date"
                      required
                      value={shiftDate}
                      onChange={e => setShiftDate(e.target.value)}
                      className="bg-off-white text-deep-navy px-space-md py-2 rounded-lg font-sans text-sm border border-light-grey focus:outline-none focus:ring-2 focus:ring-electric-blue"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-space-2xs">
                  <label className="font-sans text-sm font-semibold text-deep-navy">Campus Venue</label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={e => setVenue(e.target.value)}
                    className="bg-off-white text-deep-navy px-space-md py-2.5 rounded-lg font-sans text-sm border border-light-grey focus:outline-none focus:ring-2 focus:ring-electric-blue"
                  />
                </div>

                <div className="flex flex-col gap-space-2xs">
                  <div className="flex items-center justify-between">
                    <label className="font-sans text-sm font-semibold text-deep-navy">Detailed Work Synopsis</label>
                    <span className={`font-mono text-xs font-bold ${comments.length >= 50 ? 'text-electric-blue' : 'text-red-500'}`}>
                      {comments.length} / 50 MIN CHARS
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    className="bg-off-white text-deep-navy p-space-md rounded-lg font-sans text-sm border border-light-grey focus:outline-none focus:ring-2 focus:ring-electric-blue leading-relaxed"
                  />
                </div>
              </div>

              {/* Photo Evidence Update */}
              <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm border border-light-grey flex flex-col gap-space-md">
                <div className="flex items-center justify-between border-b border-light-grey/60 pb-space-xs">
                  <h2 className="font-heading text-xl text-deep-navy font-bold">
                    Shift Photo Evidence Proof
                  </h2>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-electric-blue font-sans text-xs font-bold flex items-center gap-1 hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">upload</span>
                    Upload Replacement Photo
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />

                <div className="relative rounded-xl overflow-hidden aspect-video bg-deep-navy max-h-72 border border-light-grey">
                  <img src={photoPreview} alt="Proof" className="w-full h-full object-cover" />
                  <div className="absolute bottom-3 left-3 right-3 bg-deep-navy/85 backdrop-blur-md p-space-xs px-space-sm rounded-lg text-white flex items-center justify-between border border-white/10 text-xs">
                    <span className="font-mono">
                      {venue ? `Venue: ${venue}` : 'Shift Photo Attached'}
                    </span>
                    <span className="font-mono text-light-blue font-bold">
                      READY FOR REVIEW
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
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
                  <span className="material-symbols-outlined text-base">published_with_changes</span>
                  {submitting ? 'Resubmitting to Lead Queue...' : 'Resubmit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
