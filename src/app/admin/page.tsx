'use client';

import React from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function SuperAdminPage() {
  return (
    <div className="flex min-h-screen bg-off-white font-sans text-deep-navy">
      <Sidebar />

      <div className="pl-64 flex flex-col flex-1 min-h-screen">
        <Header pageTitle="Super Administrator Governance Suite" />

        <main className="w-full pt-20 px-6 sm:px-8 pb-16 flex-1">
          <div className="flex flex-col w-full gap-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="border-b border-light-grey pb-5">
              <div className="flex items-center gap-2 text-electric-blue font-mono text-xs font-semibold uppercase tracking-wider mb-1">
                <span className="inline-block w-2 h-2 rounded-full bg-electric-blue animate-pulse"></span>
                NIS-01 // FULL CHAPTER GOVERNANCE &amp; OVERRIDE
              </div>
              <h1 className="font-heading text-3xl font-extrabold text-deep-navy tracking-tight">
                Super Admin Command Center
              </h1>
              <p className="font-sans text-sm text-tech-grey mt-1 max-w-3xl">
                Manage executive leadership, configure transactional SMTP relay pools, create department divisions, and execute chapter-wide overrides.
              </p>
            </div>

            {/* Quick Action Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link
                href="/admin/users"
                className="bg-white p-6 rounded-xl border border-light-grey shadow-sm hover:border-electric-blue/40 hover:shadow-md transition-all flex flex-col gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-electric-blue/10 text-electric-blue flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">manage_accounts</span>
                </div>
                <div>
                  <h3 className="font-heading text-lg text-deep-navy font-bold group-hover:text-electric-blue transition-colors">
                    User &amp; Role Management
                  </h3>
                  <p className="font-sans text-xs text-tech-grey mt-1">
                    Provision accounts with registration numbers, promote members, and assign co-leads.
                  </p>
                </div>
                <span className="font-sans text-xs text-electric-blue font-bold flex items-center gap-1 mt-auto">
                  Manage Chapter Users →
                </span>
              </Link>

              <Link
                href="/admin/departments"
                className="bg-white p-6 rounded-xl border border-light-grey shadow-sm hover:border-electric-blue/40 hover:shadow-md transition-all flex flex-col gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-electric-blue/10 text-electric-blue flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">domain</span>
                </div>
                <div>
                  <h3 className="font-heading text-lg text-deep-navy font-bold group-hover:text-electric-blue transition-colors">
                    Departments &amp; Co-Leads
                  </h3>
                  <p className="font-sans text-xs text-tech-grey mt-1">
                    Create chapters, define tracking codes, and assign 2+ equal-permission co-leads per wing.
                  </p>
                </div>
                <span className="font-sans text-xs text-electric-blue font-bold flex items-center gap-1 mt-auto">
                  Manage Departments →
                </span>
              </Link>

              <Link
                href="/admin/options"
                className="bg-white p-6 rounded-xl border border-light-grey shadow-sm hover:border-electric-blue/40 hover:shadow-md transition-all flex flex-col gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-electric-blue/10 text-electric-blue flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">tune</span>
                </div>
                <div>
                  <h3 className="font-heading text-lg text-deep-navy font-bold group-hover:text-electric-blue transition-colors">
                    Roles &amp; Campus Venues
                  </h3>
                  <p className="font-sans text-xs text-tech-grey mt-1">
                    Customize the assigned shift roles and campus venue/lab options that appear in member forms.
                  </p>
                </div>
                <span className="font-sans text-xs text-electric-blue font-bold flex items-center gap-1 mt-auto">
                  Configure Dropdowns →
                </span>
              </Link>

              <Link
                href="/admin/smtp"
                className="bg-white p-6 rounded-xl border border-light-grey shadow-sm hover:border-electric-blue/40 hover:shadow-md transition-all flex flex-col gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-electric-blue/10 text-electric-blue flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">outgoing_mail</span>
                </div>
                <div>
                  <h3 className="font-heading text-lg text-deep-navy font-bold group-hover:text-electric-blue transition-colors">
                    SMTP Pool &amp; Rotator Status
                  </h3>
                  <p className="font-sans text-xs text-tech-grey mt-1">
                    Monitor 100/day account limits, trigger quota resets, and add new transactional email relays.
                  </p>
                </div>
                <span className="font-sans text-xs text-electric-blue font-bold flex items-center gap-1 mt-auto">
                  Configure SMTP Pool →
                </span>
              </Link>
            </div>

            {/* Direct Link to Verification Queue with Super Admin override */}
            <div className="bg-white p-6 rounded-xl border border-light-grey shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-deep-navy flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-2xl text-light-blue">gavel</span>
                </div>
                <div>
                  <h3 className="font-heading text-lg text-deep-navy font-bold">
                    Master Verification &amp; Points Override
                  </h3>
                  <p className="font-sans text-xs text-tech-grey mt-0.5">
                    Super admins can inspect, approve, reject, or reopen shift submissions across all departments.
                  </p>
                </div>
              </div>
              <Link
                href="/lead/review"
                className="px-5 py-2.5 bg-gradient-to-r from-electric-blue to-light-blue text-white font-sans text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity shrink-0"
              >
                Launch Verification Engine
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
