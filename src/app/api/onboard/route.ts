// src/app/api/onboard/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { store } from '@/lib/store';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { departmentId, regNo, yearDept } = await request.json();

  if (!departmentId) {
    return NextResponse.json({ error: 'Department is required' }, { status: 400 });
  }

  const user = store.getUserByEmail(session.user.email);
  if (user) {
    user.departmentId = departmentId;
    if (regNo) user.regNo = regNo;
    if (yearDept) user.yearDept = yearDept;
    user.isOnboarded = true;
  } else {
    store.users.push({
      id: session.user.id || `user-${Date.now()}`,
      name: session.user.name || session.user.email.split('@')[0],
      email: session.user.email,
      role: 'member',
      departmentId,
      regNo,
      yearDept,
      isOnboarded: true,
      createdAt: new Date(),
    });
  }

  return NextResponse.json({ success: true, departmentId });
}
