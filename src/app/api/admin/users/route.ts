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
  const isAllowedEmail = cleanEmail.endsWith('@vitstudent.ac.in') || cleanEmail === 'iamsanthosh2425@gmail.com';
  if (!cleanEmail || !isAllowedEmail) {
    return NextResponse.json({ error: 'Valid institutional email required' }, { status: 400 });
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

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin only' }, { status: 403 });
  }

  const body = await request.json();
  const { id, name, email, role, departmentId } = body;

  if (!id && !email) {
    return NextResponse.json({ error: 'User identifier (id or email) is required' }, { status: 400 });
  }

  const cleanEmail = email ? email.toLowerCase().trim() : undefined;
  const isAllowedEmail = !cleanEmail || cleanEmail.endsWith('@vitstudent.ac.in') || cleanEmail === 'iamsanthosh2425@gmail.com';
  if (cleanEmail && !isAllowedEmail) {
    return NextResponse.json({ error: 'Valid institutional email required' }, { status: 400 });
  }

  const cleanRole = role ? (role as 'member' | 'lead' | 'board' | 'super_admin') : undefined;
  const cleanDeptId =
    cleanRole === 'super_admin' || cleanRole === 'board'
      ? null
      : departmentId !== undefined
      ? departmentId || null
      : undefined;

  // 1. Update in Prisma
  let updatedUser: any = null;
  try {
    const targetUser = id
      ? await prisma.user.findUnique({ where: { id } })
      : (cleanEmail ? await prisma.user.findUnique({ where: { email: cleanEmail } }) : null);

    if (targetUser) {
      updatedUser = await prisma.user.update({
        where: { id: targetUser.id },
        data: {
          name: name ? name.trim() : undefined,
          email: cleanEmail || undefined,
          role: cleanRole,
          departmentId: cleanDeptId,
        },
      });
    }
  } catch (err: any) {
    console.error('Prisma user update error:', err);
    return NextResponse.json(
      { error: `Database error updating user: ${err?.message || 'Check database connection'}` },
      { status: 500 }
    );
  }

  // 2. Keep in-memory store in sync
  const storeUser = id ? store.getUserById(id) : (cleanEmail ? store.getUserByEmail(cleanEmail) : null);
  if (storeUser) {
    if (name) storeUser.name = name.trim();
    if (cleanEmail) storeUser.email = cleanEmail;
    if (cleanRole) storeUser.role = cleanRole;
    if (cleanDeptId !== undefined) storeUser.departmentId = cleanDeptId;
  }

  return NextResponse.json(
    { success: true, user: updatedUser || storeUser },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin only' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const email = searchParams.get('email');

  if (!id && !email) {
    return NextResponse.json({ error: 'User identifier (id or email) is required' }, { status: 400 });
  }

  const targetEmail = email ? email.toLowerCase().trim() : '';

  // Prevent super admin from deleting their own active account
  if (session.user?.email && (session.user.email.toLowerCase() === targetEmail || session.user?.id === id)) {
    return NextResponse.json(
      { error: 'Self-deletion restricted: You cannot remove your own active administrator account.' },
      { status: 400 }
    );
  }

  // 1. Delete from Prisma
  try {
    const userToDelete = id
      ? await prisma.user.findUnique({ where: { id } })
      : (email ? await prisma.user.findUnique({ where: { email: targetEmail } }) : null);

    if (userToDelete) {
      if (session.user?.email && userToDelete.email.toLowerCase() === session.user.email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Self-deletion restricted: You cannot remove your own active administrator account.' },
          { status: 400 }
        );
      }

      // Cleanup foreign key dependencies
      await prisma.notification.deleteMany({ where: { userId: userToDelete.id } });
      await prisma.submission.updateMany({ where: { reviewedById: userToDelete.id }, data: { reviewedById: null } });
      await prisma.submission.deleteMany({ where: { memberId: userToDelete.id } });
      await prisma.pointsLedger.deleteMany({ where: { memberId: userToDelete.id } });
      await prisma.user.delete({ where: { id: userToDelete.id } });
    }
  } catch (err: any) {
    console.error('Prisma user deletion error:', err);
    return NextResponse.json(
      { error: `Database error removing user: ${err?.message || 'Check database connection'}` },
      { status: 500 }
    );
  }

  // 2. Remove from store
  const targetIdx = store.users.findIndex(
    u => (id && u.id === id) || (targetEmail && u.email.toLowerCase() === targetEmail)
  );
  if (targetIdx !== -1) {
    store.users.splice(targetIdx, 1);
  }

  return NextResponse.json(
    { success: true, message: 'User removed successfully.' },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}
