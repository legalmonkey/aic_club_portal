'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [regNo, setRegNo] = useState('');
  const [yearDept, setYearDept] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => {
        if (data.departments) {
          setDepartments(data.departments);
          if (data.departments.length > 0) {
            setSelectedDeptId(data.departments[0].id);
          }
        }
      });
  }, []);

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: selectedDeptId,
          regNo,
          yearDept,
        }),
      });

      if (res.ok) {
        await update({ departmentId: selectedDeptId, isOnboarded: true });
        window.location.href = '/member/dashboard';
      }
    } catch {
      window.location.href = '/member/dashboard';
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex flex-col justify-center items-center p-space-md sm:p-space-xl">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-card-hover border border-light-grey p-space-lg sm:p-space-xl flex flex-col gap-space-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 gradient-electric" />

        <div className="flex items-center gap-3">
          <img
            alt="AI Club VIT Chennai"
            className="h-10 w-auto object-contain"
            src="/brand/logo-icon.png"
          />
          <div className="flex flex-col">
            <span className="font-heading text-base font-bold text-deep-navy tracking-tight leading-tight">
              AI CLUB — VIT CHENNAI
            </span>
            <span className="font-mono text-[10px] text-electric-blue font-bold tracking-wider uppercase">
              NIS-01 // MEMBER INDUCTION
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-deep-navy tracking-tight">
            Select Your Chapter Division
          </h1>
          <p className="font-sans text-xs sm:text-sm text-on-surface-variant">
            Welcome, <strong>{session?.user?.name || 'Student Member'}</strong>! Please register your VIT details and select your assigned chapter division so your volunteering shifts and ledger points route to the appropriate co-leads.
          </p>
        </div>

        <form onSubmit={handleCompleteOnboarding} className="flex flex-col gap-space-md">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs text-deep-navy font-bold">
              REGISTRATION NUMBER (VIT) <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 23BCE1042"
              value={regNo}
              onChange={e => setRegNo(e.target.value.toUpperCase())}
              className="bg-off-white px-space-md py-2.5 rounded-lg font-mono text-xs text-deep-navy focus:outline-none focus:ring-2 focus:ring-electric-blue border border-light-grey uppercase font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs text-deep-navy font-bold">
              ACADEMIC PROGRAM &amp; COHORT
            </label>
            <input
              type="text"
              placeholder="e.g. 3rd Year CSE (AI &amp; Robotics)"
              value={yearDept}
              onChange={e => setYearDept(e.target.value)}
              className="bg-off-white px-space-md py-2.5 rounded-lg font-sans text-xs text-deep-navy focus:outline-none focus:ring-2 focus:ring-electric-blue border border-light-grey"
            />
          </div>

          <div className="flex flex-col gap-space-xs">
            <label className="font-mono text-xs text-deep-navy font-bold">
              CHAPTER DIVISION / DEPARTMENT <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {departments.map(dept => {
                const isSelected = selectedDeptId === dept.id;
                return (
                  <div
                    key={dept.id}
                    onClick={() => setSelectedDeptId(dept.id)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-electric-blue bg-electric-blue/5 shadow-sm'
                        : 'border-light-grey bg-off-white hover:bg-white hover:border-electric-blue/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-xs text-deep-navy font-bold">
                        {dept.name}
                      </span>
                      {isSelected ? (
                        <span className="w-2 h-2 rounded-full bg-electric-blue" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-light-grey" />
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-tech-grey">
                      CODE: {dept.code}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-space-sm w-full h-11 bg-electric-blue hover:bg-electric-blue/90 text-white font-heading text-xs font-bold rounded-lg flex items-center justify-center gap-space-xs shadow-sm transition-all disabled:opacity-60"
          >
            {submitting ? 'Setting up chapter profile...' : 'Confirm Department & Enter Portal'}
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </form>
      </div>
    </div>
  );
}
