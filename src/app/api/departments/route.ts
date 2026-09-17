// src/app/api/departments/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { store } from '@/lib/store';

export async function GET() {
  const departmentsWithLeads = store.departments.map(dept => {
    const leads = store.users.filter(u => u.role === 'lead' && u.departmentId === dept.id);
    const memberCount = store.users.filter(u => u.role === 'member' && u.departmentId === dept.id).length;
    return {
      ...dept,
      leads: leads.map(l => ({ id: l.id, name: l.name, email: l.email, avatarUrl: l.avatarUrl })),
      memberCount,
    };
  });

  return NextResponse.json({ departments: departmentsWithLeads });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin only' }, { status: 403 });
  }

  const { name, code } = await request.json();
  if (!name) {
    return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
  }

  const newDept = {
    id: `dept-${Date.now()}`,
    name,
    code: code || name.slice(0, 3).toUpperCase(),
    leadIds: [],
  };

  store.departments.push(newDept);
  return NextResponse.json({ success: true, department: newDept });
}
