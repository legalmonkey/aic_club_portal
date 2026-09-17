// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { store } from '@/lib/store';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'super_admin' && session?.user?.role !== 'board') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = store.users.map(u => {
    const dept = store.getDepartmentById(u.departmentId || '');
    const points = store.getMemberPoints(u.id);
    return {
      ...u,
      departmentName: dept?.name || 'Unassigned',
      points,
    };
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin only' }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, role, departmentId, yearDept, regNo } = body;

  if (!email || !email.endsWith('@vitstudent.ac.in')) {
    return NextResponse.json({ error: 'Valid @vitstudent.ac.in email required' }, { status: 400 });
  }

  const existing = store.getUserByEmail(email);
  if (existing) {
    // Update role & department
    if (role) existing.role = role;
    if (departmentId !== undefined) existing.departmentId = departmentId;
    if (name) existing.name = name;
    if (yearDept) existing.yearDept = yearDept;
    if (regNo) existing.regNo = regNo;
    return NextResponse.json({ success: true, user: existing });
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name: name || email.split('@')[0],
    email,
    role: role || 'member',
    departmentId: departmentId || null,
    yearDept: yearDept || 'Student Member',
    regNo: regNo || '22BCE1000',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzkgs-Xs9KAw3ivlSvtEJ0uUrOEOwf1TMEf2YRpWINiZrHcEPQDTiO6dD7Qg3_i7pxgISTnrNvGo2eWlQei62-ocUEEtutzEPWblTSd3_60YbK8YPR5rNA1xgnF6c9MmQ64F85nCXk87wRMqyZN2FhkN2h7-pL-J9BKVNxjHZFF5TPosOeg0zeuM0gQit7i8ScbiApO6dhZaRKK1EDNkv9GpO57JpAMt8xET2g1Q50T0PhC5MjN6ZD',
    createdAt: new Date(),
  };

  store.users.push(newUser);
  return NextResponse.json({ success: true, user: newUser });
}
