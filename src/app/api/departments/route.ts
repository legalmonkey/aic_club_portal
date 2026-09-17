// src/app/api/departments/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // 1. Fetch departments and members from Prisma PostgreSQL
  let dbDepts: any[] = [];
  try {
    dbDepts = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (err) {
    console.error('Failed to fetch departments from prisma:', err);
  }

  // 2. Fetch all users from Prisma to identify leads and active members
  let dbUsers: any[] = [];
  try {
    dbUsers = await prisma.user.findMany();
  } catch (err) {
    console.error('Failed to fetch users from prisma:', err);
  }

  // If Prisma returned departments, format them with live DB leads
  if (dbDepts.length > 0) {
    const formatted = dbDepts.map(dept => {
      // Find leads from DB users
      const dbLeads = dbUsers.filter(u => u.role === 'lead' && u.departmentId === dept.id);
      const storeLeads = store.users.filter(u => u.role === 'lead' && u.departmentId === dept.id);

      const leadMap = new Map<string, any>();
      for (const l of dbLeads) {
        leadMap.set(l.email.toLowerCase(), {
          id: l.id,
          name: l.name,
          email: l.email,
          avatarUrl: l.avatarUrl || null,
        });
      }
      for (const l of storeLeads) {
        if (!leadMap.has(l.email.toLowerCase())) {
          leadMap.set(l.email.toLowerCase(), {
            id: l.id,
            name: l.name,
            email: l.email,
            avatarUrl: l.avatarUrl || null,
          });
        }
      }

      const memberCount = dbUsers.filter(u => u.role === 'member' && u.departmentId === dept.id).length;
      const storeDept = store.getDepartmentById(dept.id);
      const code = storeDept?.code || dept.name.slice(0, 4).toUpperCase();

      return {
        id: dept.id,
        name: dept.name,
        code,
        leads: Array.from(leadMap.values()),
        memberCount,
      };
    });

    return NextResponse.json(
      { departments: formatted },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  }

  // Fallback to store
  const departmentsWithLeads = store.departments.map(dept => {
    const leads = store.users.filter(u => u.role === 'lead' && u.departmentId === dept.id);
    const memberCount = store.users.filter(u => u.role === 'member' && u.departmentId === dept.id).length;
    return {
      ...dept,
      leads: leads.map(l => ({ id: l.id, name: l.name, email: l.email, avatarUrl: l.avatarUrl })),
      memberCount,
    };
  });

  return NextResponse.json(
    { departments: departmentsWithLeads },
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

  const { name, code } = await request.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
  }

  const cleanName = name.trim();
  const cleanCode = (code || cleanName.slice(0, 4)).trim().toUpperCase();
  const deptId = `dept-${cleanCode.toLowerCase()}`;

  // 1. Persist directly to Prisma PostgreSQL
  let savedDept: any = null;
  try {
    savedDept = await prisma.department.upsert({
      where: { name: cleanName },
      update: {},
      create: {
        id: deptId,
        name: cleanName,
      },
    });
  } catch (err: any) {
    console.error('Failed to create department in prisma:', err);
    return NextResponse.json(
      { error: `Database error creating department: ${err?.message || 'Check database connection'}` },
      { status: 500 }
    );
  }

  // 2. Keep in-memory store synchronized
  const existingStoreDept = store.departments.find(d => d.name.toLowerCase() === cleanName.toLowerCase());
  if (!existingStoreDept) {
    store.departments.push({
      id: savedDept?.id || deptId,
      name: cleanName,
      code: cleanCode,
      leadIds: [],
    });
  }

  return NextResponse.json(
    {
      success: true,
      department: {
        id: savedDept?.id || deptId,
        name: cleanName,
        code: cleanCode,
        leads: [],
        memberCount: 0,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}
