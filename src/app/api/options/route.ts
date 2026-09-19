// src/app/api/options/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

const DEFAULT_ROLES = [
  'Workshop Mentor / Track Lead',
  'General Event Facilitator',
  'Compute & Infra Logistics',
  'Judging & Evaluation Desk',
  'Media & Documentation',
  'Registration & Desk Operations',
  'Speaker & Guest Hospitality',
];

const DEFAULT_VENUES = [
  'Anna Auditorium',
  'Tech Tower (TT) 302',
  'Tech Tower (TT) 412',
  'SJT (Silver Jubilee Tower) Lab 102',
  'SJT (Silver Jubilee Tower) Audi',
  'SMV (Sir M. Visvesvaraya) Hall',
  'MB (Main Building) 204',
  'Delta Block AI Lab',
  'Academic Block 1',
  'Netaji Subhas Chandra Bose Stadium',
];

export async function GET() {
  try {
    let options: any[] = [];
    try {
      options = await prisma.portalOption.findMany({
        orderBy: { createdAt: 'asc' },
      });
    } catch (err) {
      console.error('Error fetching portal options from DB:', err);
    }

    // Auto-seed defaults if database table is currently empty
    if (options.length === 0) {
      const initialInserts = [
        ...DEFAULT_ROLES.map((r, i) => ({
          id: `opt-role-${i + 1}`,
          type: 'role',
          label: r,
          value: r,
        })),
        ...DEFAULT_VENUES.map((v, i) => ({
          id: `opt-venue-${i + 1}`,
          type: 'venue',
          label: v,
          value: v,
        })),
      ];

      try {
        await prisma.portalOption.createMany({
          data: initialInserts,
          skipDuplicates: true,
        });
        options = await prisma.portalOption.findMany({
          orderBy: { createdAt: 'asc' },
        });
      } catch (seedErr) {
        console.error('Error seeding initial portal options:', seedErr);
        // Fallback to in-memory defaults
        options = initialInserts;
      }
    }

    const roleOptions = options.filter(o => o.type === 'role');
    const venueOptions = options.filter(o => o.type === 'venue');

    return NextResponse.json(
      {
        roles: roleOptions.map(o => o.label),
        venues: venueOptions.map(o => o.label),
        roleOptions,
        venueOptions,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('Failed to get options:', error);
    return NextResponse.json(
      {
        roles: DEFAULT_ROLES,
        venues: DEFAULT_VENUES,
        roleOptions: DEFAULT_ROLES.map((r, i) => ({ id: `role-${i}`, type: 'role', label: r, value: r })),
        venueOptions: DEFAULT_VENUES.map((v, i) => ({ id: `venue-${i}`, type: 'venue', label: v, value: v })),
      },
      { headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin access required' }, { status: 403, headers: NO_CACHE_HEADERS });
  }

  try {
    const body = await request.json();
    const { type, label } = body;

    if (!type || (type !== 'role' && type !== 'venue')) {
      return NextResponse.json({ error: 'Valid option type (role or venue) is required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const cleanLabel = (label || '').trim();
    if (!cleanLabel) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const newOption = await prisma.portalOption.create({
      data: {
        id: `opt-${type}-${Date.now()}`,
        type,
        label: cleanLabel,
        value: cleanLabel,
      },
    });

    return NextResponse.json({ success: true, option: newOption }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    console.error('Failed to create option:', err);
    return NextResponse.json({ error: 'Failed to create option' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin access required' }, { status: 403, headers: NO_CACHE_HEADERS });
  }

  try {
    const body = await request.json();
    const { id, label } = body;

    if (!id) {
      return NextResponse.json({ error: 'Option ID is required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const cleanLabel = (label || '').trim();
    if (!cleanLabel) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const updated = await prisma.portalOption.update({
      where: { id },
      data: {
        label: cleanLabel,
        value: cleanLabel,
      },
    });

    return NextResponse.json({ success: true, option: updated }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    console.error('Failed to update option:', err);
    return NextResponse.json({ error: 'Failed to update option' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin access required' }, { status: 403, headers: NO_CACHE_HEADERS });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Option ID is required' }, { status: 400, headers: NO_CACHE_HEADERS });
  }

  try {
    await prisma.portalOption.delete({
      where: { id },
    });
    return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    console.error('Failed to delete option:', err);
    return NextResponse.json({ error: 'Failed to delete option' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}