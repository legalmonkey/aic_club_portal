// src/app/api/submissions/[id]/route.ts
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let dbSub: any = null;
  try {
    dbSub = await prisma.submission.findUnique({
      where: { id },
      include: {
        member: {
          include: {
            department: true,
          },
        },
        reviewedBy: true,
      },
    });
  } catch (err) {
    console.error('Error fetching submission from prisma:', err);
  }

  if (dbSub) {
    const metaMatch = dbSub.comments?.match(/\n?\[META:([^|]+)\|([^\]]+)\]/);
    const durationHours = metaMatch ? Number(metaMatch[1]) : 4;
    const durationLabel = metaMatch ? metaMatch[2] : '14:00 - 18:00 (4.0 hrs)';
    const cleanComments = dbSub.comments?.replace(/\n?\[META:([^|]+)\|([^\]]+)\]/, '').trim() || dbSub.comments || '';
    const dept = dbSub.member?.department || store.getDepartmentById(dbSub.departmentId);

    const submission: SubmissionData = {
      id: dbSub.id,
      memberId: dbSub.memberId,
      memberName: dbSub.member?.name || 'Student Member',
      memberEmail: dbSub.member?.email || '',
      memberAvatar: (dbSub.member as any)?.avatarUrl || undefined,
      memberYearDept: (dbSub.member as any)?.yearDept || (dept?.name ? `${dept.name} Member` : 'Chapter Member'),
      memberRegNo: (dbSub.member as any)?.regNo || '22BCE1042',
      departmentId: dbSub.departmentId,
      departmentName: dept?.name || 'General Department',
      date: dbSub.date ? new Date(dbSub.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      venue: dbSub.venue,
      durationHours,
      durationLabel,
      roleInEvent: dbSub.roleInEvent,
      eventName: dbSub.eventName,
      comments: cleanComments,
      photoUrl: dbSub.photoUrl,
      geoLat: dbSub.geoLat,
      geoLng: dbSub.geoLng,
      geoStatus: 'verified',
      status: dbSub.status,
      pointsAwarded: dbSub.pointsAwarded,
      requestedPoints: dbSub.pointsAwarded || 350,
      rejectionReason: dbSub.rejectionReason,
      reviewedById: dbSub.reviewedById,
      reviewedByName: dbSub.reviewedBy?.name || null,
      reviewedAt: dbSub.reviewedAt ? new Date(dbSub.reviewedAt).toISOString() : null,
      createdAt: dbSub.createdAt ? new Date(dbSub.createdAt).toISOString() : new Date().toISOString(),
    };

    return NextResponse.json({ submission }, { headers: NO_CACHE_HEADERS });
  }

  const submission = store.submissions.find(s => s.id === id);
  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404, headers: NO_CACHE_HEADERS });
  }

  return NextResponse.json({ submission }, { headers: NO_CACHE_HEADERS });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const { id } = await params;
    let submission = store.submissions.find(s => s.id === id);

    // If not in store, try fetching from prisma
    if (!submission) {
      try {
        const dbSub = await prisma.submission.findUnique({
          where: { id },
          include: { member: { include: { department: true } }, reviewedBy: true },
        });
        if (dbSub) {
          const metaMatch = dbSub.comments?.match(/\n?\[META:([^|]+)\|([^\]]+)\]/);
          const durationHours = metaMatch ? Number(metaMatch[1]) : 4;
          const durationLabel = metaMatch ? metaMatch[2] : '14:00 - 18:00 (4.0 hrs)';
          const cleanComments = dbSub.comments?.replace(/\n?\[META:([^|]+)\|([^\]]+)\]/, '').trim() || dbSub.comments || '';
          const dept = dbSub.member?.department || store.getDepartmentById(dbSub.departmentId);

          submission = {
            id: dbSub.id,
            memberId: dbSub.memberId,
            memberName: dbSub.member?.name || 'Student Member',
            memberEmail: dbSub.member?.email || '',
            memberAvatar: (dbSub.member as any)?.avatarUrl || undefined,
            memberYearDept: (dbSub.member as any)?.yearDept || (dept?.name ? `${dept.name} Member` : 'Chapter Member'),
            memberRegNo: (dbSub.member as any)?.regNo || '22BCE1042',
            departmentId: dbSub.departmentId,
            departmentName: dept?.name || 'General Department',
            date: dbSub.date ? new Date(dbSub.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            venue: dbSub.venue,
            durationHours,
            durationLabel,
            roleInEvent: dbSub.roleInEvent,
            eventName: dbSub.eventName,
            comments: cleanComments,
            photoUrl: dbSub.photoUrl,
            geoLat: dbSub.geoLat,
            geoLng: dbSub.geoLng,
            geoStatus: 'verified',
            status: dbSub.status,
            pointsAwarded: dbSub.pointsAwarded,
            requestedPoints: dbSub.pointsAwarded || 350,
            rejectionReason: dbSub.rejectionReason,
            reviewedById: dbSub.reviewedById,
            reviewedByName: dbSub.reviewedBy?.name || null,
            reviewedAt: dbSub.reviewedAt ? new Date(dbSub.reviewedAt).toISOString() : null,
            createdAt: dbSub.createdAt ? new Date(dbSub.createdAt).toISOString() : new Date().toISOString(),
          };
          store.submissions.unshift(submission);
        }
      } catch (err) {
        console.error('Error querying submission in patch:', err);
      }
    }

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    // Resolve reviewer DB user
    let reviewerDbUser: any = null;
    try {
      const reviewerEmail = session.user.email?.toLowerCase().trim();
      if (reviewerEmail) {
        reviewerDbUser = await prisma.user.findUnique({ where: { email: reviewerEmail } });
      }
      if (!reviewerDbUser && session.user.id) {
        reviewerDbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
      }
    } catch (err) {
      console.error('Failed to lookup reviewer in DB:', err);
    }

    const reviewerId = reviewerDbUser?.id || session.user.id;

    const body = await request.json();
    const { action, points, reason, ...editFields } = body;

    // 1. Lead / Super Admin Review Action: APPROVE
    if (action === 'approve') {
      const userRole = session.user.role;
      const isAuthorizedLead =
        userRole === 'super_admin' ||
        (userRole === 'lead' && session.user.departmentId === submission.departmentId);

      if (!isAuthorizedLead) {
        return NextResponse.json(
          { error: 'Forbidden: Only co-leads of this department or super_admin may approve' },
          { status: 403, headers: NO_CACHE_HEADERS }
        );
      }

      const pointsToAward = points !== undefined ? Number(points) : (submission.requestedPoints || 350);

      submission.status = 'approved';
      submission.pointsAwarded = pointsToAward;
      submission.reviewedById = reviewerId;
      submission.reviewedByName = session.user.name || 'Department Lead';
      submission.reviewedAt = new Date().toISOString();

      // Persist to Prisma
      try {
        await prisma.submission.update({
          where: { id },
          data: {
            status: 'approved',
            pointsAwarded: pointsToAward,
            reviewedById: reviewerId,
            reviewedAt: new Date(),
          },
        });

        await prisma.pointsLedger.create({
          data: {
            memberId: submission.memberId,
            submissionId: submission.id,
            points: pointsToAward,
          },
        });
      } catch (err) {
        console.error('Error persisting approval to PostgreSQL:', err);
      }

      // Add to PointsLedger in store
      store.ledger.push({
        id: `ledg-${Date.now()}`,
        memberId: submission.memberId,
        submissionId: submission.id,
        points: pointsToAward,
        createdAt: new Date().toISOString(),
      });

      // Notify Member
      await createNotification({
        userId: submission.memberId,
        type: 'submission_approved',
        message: `Your shift log "${submission.eventName}" was approved! +${pointsToAward} pts credited.`,
      });

      await sendEmail({
        to: submission.memberEmail,
        subject: `[AIC Verified] Points Credited: ${submission.eventName}`,
        body: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #00288e;">Congratulations! Your shift was verified.</h2>
            <p>Your shift log <strong>${submission.eventName}</strong> has been approved by ${session.user.name}.</p>
            <p style="font-size: 18px; color: #855300;"><strong>+${pointsToAward} Chapter Points</strong> have been added to your ledger.</p>
            <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/member/dashboard">View Updated Points Balance</a></p>
          </div>
        `,
        type: 'submission_approved',
      });

      return NextResponse.json({ success: true, submission }, { headers: NO_CACHE_HEADERS });
    }

    // 2. Lead / Super Admin Review Action: REJECT
    if (action === 'reject') {
      const userRole = session.user.role;
      const isAuthorizedLead =
        userRole === 'super_admin' ||
        (userRole === 'lead' && session.user.departmentId === submission.departmentId);

      if (!isAuthorizedLead) {
        return NextResponse.json(
          { error: 'Forbidden: Only co-leads of this department or super_admin may reject' },
          { status: 403, headers: NO_CACHE_HEADERS }
        );
      }

      submission.status = 'rejected';
      submission.rejectionReason = reason || 'Shift details could not be verified.';
      submission.reviewedById = reviewerId;
      submission.reviewedByName = session.user.name || 'Department Lead';
      submission.reviewedAt = new Date().toISOString();

      // Persist to Prisma
      try {
        await prisma.submission.update({
          where: { id },
          data: {
            status: 'rejected',
            rejectionReason: submission.rejectionReason,
            reviewedById: reviewerId,
            reviewedAt: new Date(),
          },
        });
      } catch (err) {
        console.error('Error persisting rejection to PostgreSQL:', err);
      }

      // Notify Member
      await createNotification({
        userId: submission.memberId,
        type: 'submission_rejected',
        message: `Your shift log "${submission.eventName}" needs revision: ${submission.rejectionReason}`,
      });

      await sendEmail({
        to: submission.memberEmail,
        subject: `[AIC Action Required] Shift Log Revision: ${submission.eventName}`,
        body: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #ba1a1a;">Shift Log Requires Attention</h2>
            <p>Your shift log for <strong>${submission.eventName}</strong> was reviewed by ${session.user.name} and requires updates:</p>
            <blockquote style="background: #ffdad6; padding: 10px 15px; border-left: 4px solid #ba1a1a;">${submission.rejectionReason}</blockquote>
            <p>You can edit and resubmit your proof directly from your portal dashboard.</p>
            <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/member/entry/${submission.id}/edit">Edit & Resubmit Shift Log</a></p>
          </div>
        `,
        type: 'submission_rejected',
      });

      return NextResponse.json({ success: true, submission }, { headers: NO_CACHE_HEADERS });
    }

    // 3. Member Action: EDIT & RESUBMIT (Section 6.3)
    if (action === 'resubmit') {
      // Must be owner and submission must be rejected
      const sessionEmail = session.user.email?.toLowerCase();
      const isOwner =
        submission.memberId === session.user.id ||
        (sessionEmail && submission.memberEmail.toLowerCase() === sessionEmail);

      if (!isOwner && session.user.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Forbidden: Only the author may edit this submission' },
          { status: 403, headers: NO_CACHE_HEADERS }
        );
      }

      if (submission.status !== 'rejected' && session.user.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Only rejected submissions can be edited and resubmitted' },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }

      // Update editable fields
      if (editFields.eventName) submission.eventName = editFields.eventName;
      if (editFields.venue) submission.venue = editFields.venue;
      if (editFields.comments) submission.comments = editFields.comments;
      if (editFields.photoUrl) submission.photoUrl = editFields.photoUrl;
      if (editFields.roleInEvent) submission.roleInEvent = editFields.roleInEvent;
      if (editFields.date) submission.date = editFields.date;
      if (editFields.geoLat !== undefined) submission.geoLat = editFields.geoLat;
      if (editFields.geoLng !== undefined) submission.geoLng = editFields.geoLng;

      submission.status = 'resubmitted';
      submission.rejectionReason = null;

      // Persist to Prisma
      try {
        const durationHours = editFields.durationHours || submission.durationHours || 4;
        const durationLabel = editFields.durationLabel || submission.durationLabel || '14:00 - 18:00 (4.0 hrs)';
        const commentsToSave = editFields.comments
          ? `${editFields.comments}\n[META:${durationHours}|${durationLabel}]`
          : undefined;

        await prisma.submission.update({
          where: { id },
          data: {
            status: 'resubmitted',
            rejectionReason: null,
            eventName: editFields.eventName || undefined,
            venue: editFields.venue || undefined,
            comments: commentsToSave,
            photoUrl: editFields.photoUrl || undefined,
            roleInEvent: editFields.roleInEvent || undefined,
            date: editFields.date ? new Date(editFields.date) : undefined,
          },
        });
      } catch (err) {
        console.error('Error persisting resubmission to PostgreSQL:', err);
      }

      // Notify leads again
      const leads = store.users.filter(
        u => (u.role === 'lead' && u.departmentId === submission.departmentId) || u.role === 'super_admin'
      );

      for (const lead of leads) {
        await createNotification({
          userId: lead.id,
          type: 'resubmission',
          message: `${session.user.name} resubmitted "${submission.eventName}" for review.`,
        });
      }

      return NextResponse.json({ success: true, submission }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
