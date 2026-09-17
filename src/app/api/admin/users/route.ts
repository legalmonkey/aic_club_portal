// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'super_admin' && session?.user?.role !== 'board') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 1. Fetch live records from Prisma PostgreSQL
  let dbUsers: any[] = [];
  try {
    dbUsers = await prisma.user.findMany({
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('Failed to fetch users from prisma:', err);
  }

  const userMap = new Map<string, any>();

  // Populate from DB first
  for (const u of dbUsers) {
    const isSuperOrBoard = u.role === 'super_admin' || u.role === 'board';
    const points = store.getMemberPoints(u.id);
    userMap.set(u.email.toLowerCase(), {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      departmentId: isSuperOrBoard ? null : u.departmentId,
      departmentName: isSuperOrBoard ? null : (u.department?.name || 'Unassigned'),
      points,
      createdAt: u.createdAt,
    });
  }

  // Complement with in-memory store records
  for (const u of store.users) {
    const emailKey = u.email.toLowerCase();
    if (!userMap.has(emailKey)) {
      const isSuperOrBoard = u.role === 'super_admin' || u.role === 'board';
      const dept = isSuperOrBoard ? null : store.getDepartmentById(u.departmentId || '');
      const points = store.getMemberPoints(u.id);
      userMap.set(emailKey, {
        ...u,
        departmentId: isSuperOrBoard ? null : u.departmentId,
        departmentName: isSuperOrBoard ? null : (dept?.name || 'Unassigned'),
        points,
      });
    }
  }

  const users = Array.from(userMap.values());
  return NextResponse.json(
    { users },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin only' }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, role, departmentId, yearDept, regNo } = body;

  const cleanEmail = email ? email.toLowerCase().trim() : '';

  if (!cleanEmail || !cleanEmail.endsWith('@vitstudent.ac.in')) {
    return NextResponse.json({ error: 'Valid @vitstudent.ac.in institutional email required' }, { status: 400 });
  }

  const cleanRole = (role as 'member' | 'lead' | 'board' | 'super_admin') || 'member';
  // Super admin and board oversee all divisions; they never have a single assigned division
  const cleanDeptId = (cleanRole === 'super_admin' || cleanRole === 'board') ? null : (departmentId || null);

  // 1. Persist directly to live PostgreSQL via Prisma
  let savedUser: any = null;
  try {
    savedUser = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: {
        name: name || undefined,
        role: cleanRole,
        departmentId: cleanDeptId,
      },
      create: {
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: cleanRole,
        departmentId: cleanDeptId,
      },
    });
  } catch (err: any) {
    console.error('Prisma user provisioning error:', err);
    return NextResponse.json(
      { error: `Database error provisioning user: ${err?.message || 'Check database connection'}` },
      { status: 500 }
    );
  }

  // 2. Keep in-memory store in sync
  const existing = store.getUserByEmail(cleanEmail);
  if (existing) {
    if (name) existing.name = name;
    existing.role = cleanRole;
    existing.departmentId = cleanDeptId;
    if (yearDept) existing.yearDept = yearDept;
    if (regNo) existing.regNo = regNo;
  } else {
    store.users.push({
      id: savedUser?.id || `user-${Date.now()}`,
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: cleanRole,
      departmentId: cleanDeptId,
      yearDept: yearDept || (cleanRole === 'super_admin' ? 'Chapter Governance & Super Admin' : 'Student Member'),
      regNo: regNo || '22BCE1000',
      avatarUrl: undefined,
      createdAt: new Date(),
    });
  }

  return NextResponse.json(
    { success: true, user: savedUser || existing },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}
