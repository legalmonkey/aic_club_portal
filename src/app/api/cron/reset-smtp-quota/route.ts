// src/app/api/cron/reset-smtp-quota/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { store } from '@/lib/store';
import { sendEmail } from '@/lib/email';

export async function GET() {
  try {
    // Reset database counters if live
    try {
      await prisma.smtpAccount.updateMany({
        data: { sentToday: 0, lastResetAt: new Date() },
      });
    } catch {
      // In-memory reset
      store.smtpAccounts.forEach(account => {
        account.sentToday = 0;
        account.lastResetAt = new Date().toISOString();
      });
    }

    // Process queued emails
    const queuedLogs = store.emailLogs.filter(l => l.status === 'queued');
    let reprocessedCount = 0;

    for (const log of queuedLogs) {
      const result = await sendEmail({
        to: log.recipient,
        subject: '[AIC Chapter Retry] Queued Notification',
        body: '<p>This notification was queued due to SMTP daily pool limits and has now been processed.</p>',
        type: (log.type as any) || 'announcement',
      });

      if (result.success) {
        log.status = 'sent';
        reprocessedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'SMTP counters reset to 0',
      queuedProcessed: reprocessedCount,
    });
  } catch (err) {
    console.error('Error resetting SMTP quotas:', err);
    return NextResponse.json({ error: 'Failed to reset quota' }, { status: 500 });
  }
}
