'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-tech-grey hover:text-deep-navy hover:bg-off-white transition-colors flex items-center justify-center border border-transparent hover:border-light-grey"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-electric-blue ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-light-grey z-50 overflow-hidden flex flex-col">
            <div className="p-3.5 bg-off-white flex items-center justify-between border-b border-light-grey">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 rounded-full bg-electric-blue"></span>
                <span className="font-heading text-sm font-bold text-deep-navy">Telemetry &amp; Alerts</span>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="font-mono text-[11px] text-electric-blue hover:underline font-semibold"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-light-grey">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-tech-grey text-xs">
                  No alerts logged at this time.
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-3.5 text-left transition-colors flex items-start gap-3 ${
                      !notif.read ? 'bg-electric-blue/5' : 'hover:bg-off-white/60'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-base mt-0.5 shrink-0 ${
                        notif.type === 'submission_approved'
                          ? 'text-electric-blue'
                          : notif.type === 'submission_rejected'
                          ? 'text-rose-500'
                          : 'text-light-blue'
                      }`}
                    >
                      {notif.type === 'submission_approved'
                        ? 'check_circle'
                        : notif.type === 'submission_rejected'
                        ? 'error'
                        : 'notifications'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-xs text-deep-navy leading-snug">
                        {notif.message}
                      </p>
                      <span className="font-mono text-[10px] text-tech-grey mt-1 block">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-2 bg-off-white border-t border-light-grey text-center">
              <Link
                href="/lead/review"
                onClick={() => setIsOpen(false)}
                className="font-sans text-xs text-electric-blue hover:underline py-1 block font-medium"
              >
                Inspect Activity Queue →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
