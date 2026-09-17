// src/lib/email.ts
import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { store } from './store';

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  type: 'submission_approved' | 'submission_rejected' | 'new_submission_in_queue' | 'resubmission' | 'announcement';
}

export async function sendEmail({ to, subject, body, type }: SendEmailParams): Promise<{ success: boolean; status: string; accountUsed?: string }> {
  try {
    // Attempt with Prisma if DB is live
    let account = null;
    try {
      account = await prisma.smtpAccount.findFirst({
        where: {
          active: true,
          sentToday: { lt: 100 }
        },
        orderBy: { sentToday: 'asc' },
      });
    } catch {
      // Fallback to store
      account = store.smtpAccounts.find(a => a.active && a.sentToday < a.dailyLimit);
    }

    if (!account) {
      // All accounts exhausted for the day — queue email for next reset
      try {
        await prisma.emailLog.create({
          data: { smtpAccountId: 'none', recipient: to, type, status: 'queued' }
        });
      } catch {
        store.emailLogs.unshift({
          id: `elog-${Date.now()}`,
          smtpAccountId: 'none',
          recipient: to,
          type,
          status: 'queued' as const,
          sentAt: new Date().toISOString(),
        });
      }
      return { success: false, status: 'queued' };
    }

    // Attempt real SMTP if password provided, else mock success in dev
    let sent = true;
    const accountPassword = (account as any).password;
    if (accountPassword && !accountPassword.startsWith('mock')) {
      try {
        const transporter = nodemailer.createTransport({
          host: account.host,
          port: account.port,
          auth: { user: account.username, pass: accountPassword },
        });

        await transporter.sendMail({
          from: `"AIC Chapter Portal" <${account.username}>`,
          to,
          subject,
          html: body,
        });
      } catch (err) {
        console.error('SMTP send error:', err);
        sent = false;
      }
    }

    const logStatus: 'sent' | 'failed' = sent ? 'sent' : 'failed';

    // Update sentToday count and record log
    try {
      await prisma.smtpAccount.update({
        where: { id: account.id },
        data: { sentToday: { increment: 1 } },
      });
      await prisma.emailLog.create({
        data: { smtpAccountId: account.id, recipient: to, type, status: logStatus },
      });
    } catch {
      account.sentToday += 1;
      store.emailLogs.unshift({
        id: `elog-${Date.now()}`,
        smtpAccountId: account.id,
        recipient: to,
        type,
        status: logStatus,
        sentAt: new Date().toISOString(),
      });
    }

    return { success: sent, status: logStatus, accountUsed: account.label };
  } catch (error) {
    console.error('Fatal email sending error:', error);
    return { success: false, status: 'failed' };
  }
}
