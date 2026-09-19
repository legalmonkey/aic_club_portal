// src/app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { notifications: [], unreadCount: 0 },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  }

  const userNotifications = store.notifications.filter(n => n.userId === session.user.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  return NextResponse.json(
    {
      notifications: userNotifications,
      unreadCount,
    },
    {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' },
    }
  );
}

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Mark all read for this user
  store.notifications.forEach(n => {
    if (n.userId === session.user.id) {
      n.read = true;
    }
  });

  return NextResponse.json({ success: true });
}
