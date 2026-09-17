'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BackButton } from '@/components/ui/BackButton';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchDepartments = () => {
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => {
        if (data.departments) setDepartments(data.departments);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code }),
      });

      if (res.ok) {
        setName('');
        setCode('');
        fetchDepartments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-off-white font-sans text-deep-navy">
      <Sidebar />

      <div className="pl-64 flex flex-col flex-1 min-h-screen">
        <Header pageTitle="Department & Co-Lead Management" />

        <main className="w-full pt-20 px-6 sm:px-8 pb-16 flex-1">
          <div className="flex flex-col w-full gap-8 max-w-7xl mx-auto">
            <div className="border-b border-light-grey pb-5">
              <BackButton href="/admin" label="Back to Admin Dashboard" className="mb-2" />
              <div className="flex items-center gap-2 text-electric-blue font-mono text-xs font-semibold uppercase tracking-wider mb-1">
                <span className="inline-block w-2 h-2 rounded-full bg-electric-blue animate-pulse"></span>
                NIS-01 // CHAPTER STRUCTURE &amp; CO-LEADERSHIP
              </div>
              <h1 className="font-heading text-3xl font-extrabold text-deep-navy tracking-tight">
                Chapter Departments &amp; Co-Leads
              </h1>
              <p className="font-sans text-sm text-tech-grey mt-1">
                Configure functional divisions, assign co-leads (equal permissions, 2+ per department), and oversee induction counts.
              </p>
            </div>

            {/* Grid: Create Department Form (4 cols) & Current Divisions (8 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form */}
              <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-light-grey shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-light-grey pb-3">
                  <span className="w-1.5 h-4 rounded-full bg-electric-blue"></span>
                  <h2 className="font-heading text-lg text-deep-navy font-bold">
                    Create New Division
                  </h2>
                </div>

                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-xs font-semibold text-deep-navy">Department Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cyber Security & Cryptography"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="bg-off-white px-3 py-2 rounded-lg font-sans text-xs text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-xs font-semibold text-deep-navy">Tracking Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SEC"
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase())}
                      className="bg-off-white px-3 py-2 rounded-lg font-mono text-xs text-deep-navy uppercase border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full py-2.5 bg-gradient-to-r from-electric-blue to-light-blue text-white font-sans text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                  >
                    {isCreating ? 'Creating...' : 'Add Chapter Department'}
                  </button>
                </form>
              </div>

              {/* Department Cards */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <span className="font-mono text-xs text-tech-grey uppercase tracking-wider font-semibold">
                  Active Department Wings ({departments.length})
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departments.map(d => (
                    <div
                      key={d.id}
                      className="bg-white p-5 rounded-xl border border-light-grey shadow-sm hover:border-electric-blue/40 transition-all flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-heading text-base text-deep-navy font-bold block">
                            {d.name}
                          </span>
                          <span className="font-mono text-xs text-tech-grey mt-0.5 block">
                            Code: {d.code} • {d.memberCount || 0} active members
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-electric-blue/10 text-electric-blue border border-electric-blue/20 font-mono font-bold text-[11px]">
                          {d.code}
                        </span>
                      </div>

                      <div className="border-t border-light-grey pt-3">
                        <span className="text-[11px] font-mono text-tech-grey block mb-2 uppercase">Assigned Co-Leads:</span>
                        {d.leads && d.leads.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {d.leads.map((l: any) => (
                              <span
                                key={l.id}
                                className="inline-flex items-center gap-1.5 text-xs bg-off-white border border-light-grey px-2.5 py-1 rounded-full text-deep-navy font-medium"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-electric-blue" />
                                {l.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-tech-grey italic">No leads assigned yet</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
