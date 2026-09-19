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

  // 3. Fetch live points ledger from Prisma
  let dbLedger: any[] = [];
  try {
    dbLedger = await prisma.pointsLedger.findMany();
  } catch (err) {
    console.error('Failed to fetch pointsLedger from prisma:', err);
  }

  // 4. Fetch live approved submissions from Prisma
  let dbApprovedSubs: any[] = [];
  try {
    dbApprovedSubs = await prisma.submission.findMany({
      where: { status: 'approved' },
      include: { member: true },
    });
  } catch (err) {
    console.error('Failed to fetch approved submissions from prisma:', err);
  }

  // Map to deduplicate members by email
  const memberMap = new Map<string, any>();

  // Helper to compute user stats combining DB and store
  const computeMemberStats = (u: any, userEmail: string, userId: string) => {
    const userDbLedger = dbLedger.filter(l => l.memberId === userId);
    const dbPts = userDbLedger.reduce((sum, l) => sum + (l.points || 0), 0);

    const userStoreLedger = store.ledger.filter(
      l => l.memberId === userId && !userDbLedger.some(dl => dl.submissionId === l.submissionId)
    );
    const storePts = userStoreLedger.reduce((sum, l) => sum + (l.points || 0), 0);
    const totalPoints = dbPts + storePts;

    // Deduplicate approved submissions by id
    const approvedMap = new Map<string, { durationHours: number }>();
    for (const s of dbApprovedSubs) {
      if (s.memberId === userId || s.member?.email?.toLowerCase() === userEmail) {
        const metaMatch = s.comments?.match(/\n?\[META:([^|]+)\|([^\]]+)\]/);
        const durationHours = metaMatch ? Number(metaMatch[1]) : 4;
        approvedMap.set(s.id, { durationHours });
      }
    }
    for (const s of store.submissions) {
      if (
        (s.memberId === userId || s.memberEmail.toLowerCase() === userEmail) &&
        s.status === 'approved' &&
        !approvedMap.has(s.id)
      ) {
        approvedMap.set(s.id, { durationHours: s.durationHours || 0 });
      }
    }

    const shiftsCount = approvedMap.size;
    let totalHours = 0;
    approvedMap.forEach(v => {
      totalHours += v.durationHours;
    });

    return { totalPoints, totalHours, shiftsCount };
  };

  // Add DB members
  for (const u of dbUsers) {
    const userEmail = u.email.toLowerCase();
    const { totalPoints, totalHours, shiftsCount } = computeMemberStats(u, userEmail, u.id);
    const dept =
      u.department ||
      dbDepts.find(d => d.id === u.departmentId) ||
      store.getDepartmentById(u.departmentId || '');

    const regNo = (u as any).regNo || '22BCE0000';
    const yearDept = (u as any).yearDept || (dept?.name ? `${dept.name} Department Member` : 'Technical Department Member');

    memberMap.set(userEmail, {
      memberId: u.id,
      name: u.name,
      email: u.email,
      avatarUrl: (u as any).avatarUrl || null,
      regNo,
      departmentId: u.departmentId || 'dept-tech',
      departmentName: dept?.name || 'Technical',
      yearDept,
      points: totalPoints,
      totalHours,
      shiftsCount,
    });
  }

  // Add store.users members that might not be in DB
  const storeMembers = store.users.filter(u => u.role === 'member');
  for (const u of storeMembers) {
    const emailKey = u.email.toLowerCase();
    if (!memberMap.has(emailKey)) {
      const { totalPoints, totalHours, shiftsCount } = computeMemberStats(u, emailKey, u.id);
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
        points: totalPoints,
        totalHours,
        shiftsCount,
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
