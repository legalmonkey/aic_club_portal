'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function AdminSmtpPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isResetting, setIsResetting] = useState(false);

  // New account form
  const [label, setLabel] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('587');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchSmtpData = () => {
    fetch('/api/admin/smtp')
      .then(res => res.json())
      .then(data => {
        if (data.accounts) setAccounts(data.accounts);
        if (data.logs) setLogs(data.logs);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchSmtpData();
  }, []);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await fetch('/api/admin/smtp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !currentActive }),
    });
    fetchSmtpData();
  };

  const handleResetQuota = async () => {
    setIsResetting(true);
    try {
      await fetch('/api/cron/reset-smtp-quota');
      fetchSmtpData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch('/api/admin/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, host, port, username, password, dailyLimit: 100 }),
      });

      if (res.ok) {
        setLabel('');
        setHost('');
        setUsername('');
        setPassword('');
        fetchSmtpData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-off-white font-sans text-deep-navy">
      <Sidebar />

      <div className="pl-64 flex flex-col flex-1 min-h-screen">
        <Header pageTitle="SMTP Relay Pool & 100/Day Cap Telemetry" />

        <main className="w-full pt-20 px-6 sm:px-8 pb-16 flex-1">
          <div className="flex flex-col w-full gap-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-grey pb-5">
              <div>
                <div className="flex items-center gap-2 text-electric-blue font-mono text-xs font-semibold uppercase tracking-wider mb-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-electric-blue animate-pulse"></span>
                  NIS-01 // INFRASTRUCTURE &amp; TRANSACTIONAL RELAY
                </div>
                <h1 className="font-heading text-3xl font-extrabold text-deep-navy tracking-tight">
                  SMTP Pool &amp; Emailing Infrastructure
                </h1>
                <p className="font-sans text-sm text-tech-grey mt-1">
                  Round-robin email relay pooling with automatic rollover at 100 emails/day per account cap.
                </p>
              </div>

              <button
                onClick={handleResetQuota}
                disabled={isResetting}
                className="px-4 py-2.5 bg-deep-navy hover:bg-deep-navy/90 text-white font-sans text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                {isResetting ? 'Resetting Quotas...' : 'Trigger Midnight Quota Reset'}
              </button>
            </div>

            {/* SMTP Accounts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {accounts.map(acc => {
                const percent = Math.min(100, Math.round((acc.sentToday / acc.dailyLimit) * 100));
                const isExhausted = acc.sentToday >= acc.dailyLimit;
                return (
                  <div
                    key={acc.id}
                    className={`bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between gap-5 transition-all ${
                      !acc.active
                        ? 'opacity-60 border-light-grey'
                        : isExhausted
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-light-grey hover:border-electric-blue/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-heading text-base font-bold text-deep-navy">
                          {acc.label}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                            acc.active && !isExhausted
                              ? 'bg-electric-blue/10 text-electric-blue border border-electric-blue/20'
                              : isExhausted
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-light-grey text-tech-grey'
                          }`}
                        >
                          {!acc.active ? 'Disabled' : isExhausted ? 'Quota Full' : 'Active Pool'}
                        </span>
                      </div>
                      <span className="text-xs text-tech-grey font-mono block">
                        {acc.username}
                      </span>
                      <span className="text-[11px] text-tech-grey font-mono block">
                        {acc.host}:{acc.port}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-tech-grey font-sans">Daily Usage Cap:</span>
                        <strong className="font-mono text-deep-navy font-bold">
                          {acc.sentToday} / {acc.dailyLimit} sent
                        </strong>
                      </div>
                      <div className="w-full bg-light-grey rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isExhausted ? 'bg-rose-500' : percent > 75 ? 'bg-amber-500' : 'bg-gradient-to-r from-electric-blue to-light-blue'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-light-grey pt-3 text-xs">
                      <span className="text-[11px] font-mono text-tech-grey">
                        Reset: {new Date(acc.lastResetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => handleToggleActive(acc.id, acc.active)}
                        className={`font-sans font-semibold text-xs ${
                          acc.active ? 'text-rose-600 hover:underline' : 'text-electric-blue hover:underline'
                        }`}
                      >
                        {acc.active ? 'Disable Relay' : 'Enable Relay'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Relay Account & Recent Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form (5 cols) */}
              <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-light-grey shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-light-grey pb-3">
                  <span className="w-1.5 h-4 rounded-full bg-electric-blue"></span>
                  <h2 className="font-heading text-lg text-deep-navy font-bold">
                    Add New SMTP Relay
                  </h2>
                </div>

                <form onSubmit={handleAddAccount} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-deep-navy">Relay Pool Label</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Google Workspace Relay Node 04"
                      value={label}
                      onChange={e => setLabel(e.target.value)}
                      className="bg-off-white px-3 py-2 rounded-lg text-xs font-sans text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 flex flex-col gap-1">
                      <label className="text-xs font-semibold text-deep-navy">Host</label>
                      <input
                        type="text"
                        required
                        placeholder="smtp.gmail.com"
                        value={host}
                        onChange={e => setHost(e.target.value)}
                        className="bg-off-white px-3 py-2 rounded-lg text-xs font-mono text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-deep-navy">Port</label>
                      <input
                        type="number"
                        required
                        value={port}
                        onChange={e => setPort(e.target.value)}
                        className="bg-off-white px-3 py-2 rounded-lg text-xs font-mono text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-deep-navy">Username / Email</label>
                    <input
                      type="text"
                      required
                      placeholder="mailer@vitstudent.ac.in"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="bg-off-white px-3 py-2 rounded-lg text-xs font-mono text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-deep-navy">App Password / Auth Key</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="bg-off-white px-3 py-2 rounded-lg text-xs font-sans text-deep-navy border border-light-grey focus:outline-none focus:ring-1 focus:ring-electric-blue"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAdding}
                    className="mt-2 py-2.5 bg-gradient-to-r from-electric-blue to-light-blue text-white font-sans text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                  >
                    {isAdding ? 'Enrolling Account...' : 'Enroll Account in Pool (100 Cap)'}
                  </button>
                </form>
              </div>

              {/* Logs (7 cols) */}
              <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-light-grey shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-light-grey pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-light-blue"></span>
                    <h2 className="font-heading text-lg text-deep-navy font-bold">
                      Recent Outbound Telemetry
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-tech-grey">{logs.length} events logged</span>
                </div>

                <div className="max-h-96 overflow-y-auto divide-y divide-light-grey">
                  {logs.length === 0 ? (
                    <div className="py-12 text-center text-tech-grey text-xs font-sans">
                      No email dispatch events recorded yet.
                    </div>
                  ) : (
                    logs.map(log => (
                      <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              log.status === 'sent'
                                ? 'bg-electric-blue'
                                : log.status === 'queued'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-sans font-semibold text-deep-navy truncate">
                              {log.recipient}
                            </span>
                            <span className="font-mono text-[11px] text-tech-grey truncate">
                              Type: {log.type}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded font-mono uppercase font-bold text-[10px] ${
                              log.status === 'sent'
                                ? 'bg-electric-blue/10 text-electric-blue border border-electric-blue/20'
                                : log.status === 'queued'
                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                : 'bg-rose-50 text-rose-600 border border-rose-200'
                            }`}
                          >
                            {log.status}
                          </span>
                          <span className="text-tech-grey font-mono text-[11px]">
                            {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
