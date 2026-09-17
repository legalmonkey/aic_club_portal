// src/lib/notifications.ts
import { prisma } from './prisma';
import { store } from './store';

export interface CreateNotificationParams {
  userId: string;
  type: 'submission_approved' | 'submission_rejected' | 'new_submission_in_queue' | 'resubmission';
  message: string;
}

export async function createNotification({ userId, type, message }: CreateNotificationParams) {
  try {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          type,
          message,
          read: false,
        },
      });
    } catch {
      // In-memory fallback
      const notif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId,
        type,
        message,
        read: false,
        createdAt: new Date().toISOString(),
      };
      store.notifications.unshift(notif);
      return notif;
    }
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}
