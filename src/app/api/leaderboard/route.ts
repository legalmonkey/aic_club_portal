// src/app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get('departmentId');

  // 1. Fetch live member records from Prisma
  let dbUsers: any[] = [];
  try {
    dbUsers = await prisma.user.findMany({
      where: { role: 'member' },
      include: { department: true },
    });
  } catch (err) {
    console.error('Failed to fetch members from prisma:', err);
  }

  // 2. Fetch departments to resolve names
  let dbDepts: any[] = [];
  try {
    dbDepts = await prisma.department.findMany();
  } catch (err) {
    console.error('Failed to fetch departments from prisma:', err);
  }

  // Map to deduplicate members by email
  const memberMap = new Map<string, any>();

  // Add DB members
  for (const u of dbUsers) {
    const pts = store.getMemberPoints(u.id);
    const approvedSubs = store.submissions.filter(
      s => (s.memberId === u.id || s.memberEmail.toLowerCase() === u.email.toLowerCase()) && s.status === 'approved'
    );
    const totalHours = approvedSubs.reduce((sum, s) => sum + (s.durationHours || 0), 0);
    const dept =
      u.department ||
      dbDepts.find(d => d.id === u.departmentId) ||
      store.getDepartmentById(u.departmentId || '');

    const regNo = (u as any).regNo || '22BCE0000';
    const yearDept = (u as any).yearDept || (dept?.name ? `${dept.name} Department Member` : 'Technical Department Member');

    memberMap.set(u.email.toLowerCase(), {
      memberId: u.id,
      name: u.name,
      email: u.email,
      avatarUrl: (u as any).avatarUrl || null,
      regNo,
      departmentId: u.departmentId || 'dept-tech',
      departmentName: dept?.name || 'Technical',
      yearDept,
      points: pts,
      totalHours,
      shiftsCount: approvedSubs.length,
    });
  }

  // Add store.users members that might not be in DB
  const storeMembers = store.users.filter(u => u.role === 'member');
  for (const u of storeMembers) {
    const emailKey = u.email.toLowerCase();
    if (!memberMap.has(emailKey)) {
      const pts = store.getMemberPoints(u.id);
      const approvedSubs = store.submissions.filter(
        s => (s.memberId === u.id || s.memberEmail.toLowerCase() === u.email.toLowerCase()) && s.status === 'approved'
      );
      const totalHours = approvedSubs.reduce((sum, s) => sum + (s.durationHours || 0), 0);
      const dept =
        store.getDepartmentById(u.departmentId || '') ||
        dbDepts.find(d => d.id === u.departmentId);

      memberMap.set(emailKey, {
        memberId: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl || null,
        regNo: u.regNo || '22BCE0000',
        departmentId: u.departmentId || 'dept-tech',
        departmentName: dept?.name || 'Technical',
        yearDept: u.yearDept || (dept?.name ? `${dept.name} Department Member` : 'Technical Department Member'),
        points: pts,
        totalHours,
        shiftsCount: approvedSubs.length,
      });
    }
  }

  let allMembers = Array.from(memberMap.values());

  // Filter by departmentId if requested
  if (departmentId && departmentId !== 'all') {
    allMembers = allMembers.filter(m => m.departmentId === departmentId);
  }

  // Sort descending by points, then by totalHours, then alphabetically by name
  allMembers.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.totalHours !== a.totalHours) return b.totalHours - a.totalHours;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json(
    { leaderboard: allMembers },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}
