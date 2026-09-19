// src/app/api/submissions/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { store, SubmissionData } from '@/lib/store';
import { createNotification } from '@/lib/notifications';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const deptFilter = searchParams.get('departmentId');
  const memberId = searchParams.get('memberId');

  let dbSubmissions: any[] = [];
  try {
    dbSubmissions = await prisma.submission.findMany({
      include: {
        member: {
          include: {
            department: true,
          },
        },
        reviewedBy: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (err) {
    console.error('Failed to query prisma.submission:', err);
  }

  // Map DB submissions to SubmissionData format
  const mappedDbSubs: SubmissionData[] = dbSubmissions.map(s => {
    const metaMatch = s.comments?.match(/\n?\[META:([^|]+)\|([^\]]+)\]/);
    const durationHours = metaMatch ? Number(metaMatch[1]) : 4;
    const durationLabel = metaMatch ? metaMatch[2] : '14:00 - 18:00 (4.0 hrs)';
    const cleanComments = s.comments?.replace(/\n?\[META:([^|]+)\|([^\]]+)\]/, '').trim() || s.comments || '';

    const dept = s.member?.department || store.getDepartmentById(s.departmentId);

    return {
      id: s.id,
      memberId: s.memberId,
      memberName: s.member?.name || 'Student Member',
      memberEmail: s.member?.email || '',
      memberAvatar: (s.member as any)?.avatarUrl || undefined,
      memberYearDept: (s.member as any)?.yearDept || (dept?.name ? `${dept.name} Member` : 'Chapter Member'),
      memberRegNo: (s.member as any)?.regNo || '22BCE1042',
      departmentId: s.departmentId,
      departmentName: dept?.name || 'General Department',
      date: s.date ? new Date(s.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      venue: s.venue,
      durationHours,
      durationLabel,
      roleInEvent: s.roleInEvent,
      eventName: s.eventName,
      comments: cleanComments,
      photoUrl: s.photoUrl,
      geoLat: s.geoLat,
      geoLng: s.geoLng,
      geoStatus: 'verified',
      status: s.status,
      pointsAwarded: s.pointsAwarded,
      requestedPoints: s.pointsAwarded || 350,
      rejectionReason: s.rejectionReason,
      reviewedById: s.reviewedById,
      reviewedByName: s.reviewedBy?.name || null,
      reviewedAt: s.reviewedAt ? new Date(s.reviewedAt).toISOString() : null,
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
    };
  });

  // Merge with store.submissions (in case any item was created in memory and not yet in DB)
  const allSubmissionsMap = new Map<string, SubmissionData>();
  for (const sub of mappedDbSubs) {
    allSubmissionsMap.set(sub.id, sub);
  }
  for (const sub of store.submissions) {
    if (!allSubmissionsMap.has(sub.id)) {
      allSubmissionsMap.set(sub.id, sub);
    }
  }

  let results = Array.from(allSubmissionsMap.values());

  // Sort descending by createdAt
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Role scoping logic (Section 5 & 6)
  if (session?.user?.role === 'member') {
    // Members only see their own submissions
    const sessionEmail = session.user.email?.toLowerCase();
    results = results.filter(
      s => s.memberId === session.user.id || (sessionEmail && s.memberEmail.toLowerCase() === sessionEmail)
    );
  } else if (session?.user?.role === 'lead') {
    // Leads can ONLY see submissions of their own department
    const leadDeptId = session.user.departmentId;
    if (leadDeptId) {
      results = results.filter(s => s.departmentId === leadDeptId);
    }
  }

  // Optional query filters
  if (statusFilter && statusFilter !== 'all') {
    results = results.filter(s => s.status === statusFilter);
  }

  if (memberId) {
    results = results.filter(s => s.memberId === memberId);
  }

  // Board and Super Admin can filter by department (Leads are strictly locked to their own)
  if (session?.user?.role !== 'lead' && deptFilter && deptFilter !== 'all') {
    results = results.filter(s => s.departmentId === deptFilter);
  }

  return NextResponse.json({ submissions: results }, { headers: NO_CACHE_HEADERS });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      eventName,
      roleInEvent,
      date,
      venue,
      durationHours = 4,
      durationLabel = '14:00 - 18:00 (4.0 hrs)',
      comments,
      photoUrl,
      geoLat,
      geoLng,
      requestedPoints = 350,
      departmentId: explicitDeptId,
    } = body;

    if (!eventName || !venue || !comments || !photoUrl) {
      return NextResponse.json(
        { error: 'Missing required submission fields' },
        { status: 400 }
      );
    }

    // Determine target department
    const departmentId = explicitDeptId || session.user.departmentId || 'dept-tech';
    const dept = store.getDepartmentById(departmentId);

    // Resolve or guarantee user in PostgreSQL
    const sessionEmail = session.user.email?.toLowerCase().trim() || '';
    let dbUser: any = null;

    try {
      if (sessionEmail) {
        dbUser = await prisma.user.findUnique({ where: { email: sessionEmail } });
      }
      if (!dbUser && session.user.id) {
        dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
      }

      if (!dbUser && sessionEmail) {
        // Guarantee user exists in DB
        dbUser = await prisma.user.create({
          data: {
            id: session.user.id || undefined,
            name: session.user.name || 'Student Member',
            email: sessionEmail,
            role: (session.user.role as any) || 'member',
            departmentId: departmentId,
          },
        });
      }
    } catch (err) {
      console.error('Failed to resolve or create user in prisma:', err);
    }

    const memberDbId = dbUser?.id || session.user.id;
    const submissionId = `sub-${Date.now()}`;
    const submissionDate = date ? new Date(date) : new Date();

    // Persist to Prisma
    let persistedSubmission: any = null;
    try {
      if (memberDbId) {
        persistedSubmission = await prisma.submission.create({
          data: {
            id: submissionId,
            memberId: memberDbId,
            departmentId,
            date: submissionDate,
            venue,
            roleInEvent: roleInEvent || 'General Facilitator',
            eventName,
            comments: `${comments}\n[META:${durationHours}|${durationLabel}]`,
            photoUrl,
            geoLat: geoLat !== undefined && geoLat !== null ? Number(geoLat) : null,
            geoLng: geoLng !== undefined && geoLng !== null ? Number(geoLng) : null,
            status: 'pending',
          },
        });
      }
    } catch (err) {
      console.error('Error persisting submission to PostgreSQL:', err);
    }

    const newSubmission: SubmissionData = {
      id: persistedSubmission?.id || submissionId,
      memberId: memberDbId,
      memberName: session.user.name || 'Student Member',
      memberEmail: session.user.email || '',
      memberAvatar: session.user.image || undefined,
      memberYearDept: session.user.yearDept || 'Student Chapter Member',
      memberRegNo: session.user.regNo || '22BCE1042',
      departmentId,
      departmentName: dept?.name || 'General Department',
      date: date || new Date().toISOString().split('T')[0],
      venue,
      durationHours: Number(durationHours),
      durationLabel,
      roleInEvent: roleInEvent || 'General Facilitator',
      eventName,
      comments,
      photoUrl,
      geoLat: null,
      geoLng: null,
      geoStatus: 'verified',
      status: 'pending',
      pointsAwarded: null,
      requestedPoints: Number(requestedPoints),
      createdAt: new Date().toISOString(),
    };

    // Also update in-memory store for instant cache
    store.submissions.unshift(newSubmission);

    // Section 6.1 Trigger: in-app notification + email to all co-leads of that department & super_admin
    const leads = store.users.filter(
      u => (u.role === 'lead' && u.departmentId === departmentId) || u.role === 'super_admin'
    );

    for (const lead of leads) {
      await createNotification({
        userId: lead.id,
        type: 'new_submission_in_queue',
        message: `${session.user.name} submitted "${eventName}" for review (${newSubmission.durationHours}h).`,
      });

      await sendEmail({
        to: lead.email,
        subject: `[AIC Review Queue] New Shift Log: ${eventName}`,
        body: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #00288e;">New Shift Log Pending Lead Verification</h2>
            <p><strong>Member:</strong> ${session.user.name} (${session.user.email})</p>
            <p><strong>Activity:</strong> ${eventName}</p>
            <p><strong>Venue:</strong> ${venue}</p>
            <p><strong>Duration:</strong> ${durationLabel}</p>
            <p><strong>Photo Evidence:</strong> Shift Proof Attached</p>
            <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/lead/review" style="background-color: #00288e; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px;">Open Verification Queue</a></p>
          </div>
        `,
        type: 'new_submission_in_queue',
      });
    }

    return NextResponse.json({ success: true, submission: newSubmission }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
