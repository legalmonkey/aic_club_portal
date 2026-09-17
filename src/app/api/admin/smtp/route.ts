// src/app/api/admin/smtp/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { store } from '@/lib/store';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin only' }, { status: 403 });
  }

  return NextResponse.json({
    accounts: store.smtpAccounts,
    logs: store.emailLogs.slice(0, 30),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin only' }, { status: 403 });
  }

  const body = await request.json();
  const { label, host, port, username, password, dailyLimit = 100 } = body;

  if (!host || !username) {
    return NextResponse.json({ error: 'Host and username required' }, { status: 400 });
  }

  const newAccount = {
    id: `smtp-${Date.now()}`,
    label: label || `SMTP Pool ${store.smtpAccounts.length + 1}`,
    host,
    port: Number(port) || 587,
    username,
    password,
    dailyLimit: Number(dailyLimit),
    sentToday: 0,
    lastResetAt: new Date().toISOString(),
    active: true,
  };

  store.smtpAccounts.push(newAccount);
  return NextResponse.json({ success: true, account: newAccount });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin only' }, { status: 403 });
  }

  const { id, active, sentToday } = await request.json();
  const account = store.smtpAccounts.find(a => a.id === id);

  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  if (active !== undefined) account.active = active;
  if (sentToday !== undefined) account.sentToday = sentToday;

  return NextResponse.json({ success: true, account });
}
