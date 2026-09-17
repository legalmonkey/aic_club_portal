// src/app/api/submissions/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { store, SubmissionData } from '@/lib/store';
import { createNotification } from '@/lib/notifications';
import { sendEmail } from '@/lib/email';
import { calculateDistanceMeters, VIT_CAMPUS_LAT, VIT_CAMPUS_LNG } from '@/lib/exif';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const deptFilter = searchParams.get('departmentId');
  const memberId = searchParams.get('memberId');

  let results = [...store.submissions];

  // Role scoping logic (Section 5 & 6)
  if (session?.user?.role === 'member') {
    // Members only see their own submissions
    results = results.filter(s => s.memberId === session.user.id);
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

  // Board and Super Admin can filter by department (Leads are strictly locked to their own)
  if (session?.user?.role !== 'lead' && deptFilter && deptFilter !== 'all') {
    results = results.filter(s => s.departmentId === deptFilter);
  }

  return NextResponse.json({ submissions: results });
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
    const departmentId = explicitDeptId || session.user.departmentId || 'dept-1';
    const dept = store.getDepartmentById(departmentId);

    // Evaluate geotag status
    let geoStatus: 'verified' | 'remote' | 'missing' | 'flagged' = 'missing';
    let distanceMeters: number | undefined;

    if (geoLat && geoLng) {
      distanceMeters = calculateDistanceMeters(geoLat, geoLng, VIT_CAMPUS_LAT, VIT_CAMPUS_LNG);
      if (distanceMeters <= 1500) {
        geoStatus = 'verified';
      } else {
        geoStatus = 'flagged'; // flagged for lead attention
      }
    }

    const newSubmission: SubmissionData = {
      id: `sub-${Date.now()}`,
      memberId: session.user.id,
      memberName: session.user.name || 'Student Member',
      memberEmail: session.user.email || '',
      memberAvatar: session.user.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzkgs-Xs9KAw3ivlSvtEJ0uUrOEOwf1TMEf2YRpWINiZrHcEPQDTiO6dD7Qg3_i7pxgISTnrNvGo2eWlQei62-ocUEEtutzEPWblTSd3_60YbK8YPR5rNA1xgnF6c9MmQ64F85nCXk87wRMqyZN2FhkN2h7-pL-J9BKVNxjHZFF5TPosOeg0zeuM0gQit7i8ScbiApO6dhZaRKK1EDNkv9GpO57JpAMt8xET2g1Q50T0PhC5MjN6ZD',
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
      geoLat: geoLat ? Number(geoLat) : null,
      geoLng: geoLng ? Number(geoLng) : null,
      geoStatus,
      geoDistanceMeters: distanceMeters,
      status: 'pending',
      pointsAwarded: null,
      requestedPoints: Number(requestedPoints),
      createdAt: new Date().toISOString(),
    };

    store.submissions.unshift(newSubmission);

    // Section 6.1 Trigger: in-app notification + email to all co-leads of that department
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
            <p><strong>Geotag Status:</strong> ${geoStatus.toUpperCase()}</p>
            <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/lead/review" style="background-color: #00288e; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px;">Open Verification Queue</a></p>
          </div>
        `,
        type: 'new_submission_in_queue',
      });
    }

    return NextResponse.json({ success: true, submission: newSubmission });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}
