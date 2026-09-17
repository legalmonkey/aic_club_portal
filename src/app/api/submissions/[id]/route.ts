// src/app/api/submissions/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { store } from '@/lib/store';
import { createNotification } from '@/lib/notifications';
import { sendEmail } from '@/lib/email';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const submission = store.submissions.find(s => s.id === id);

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  return NextResponse.json({ submission });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const submission = store.submissions.find(s => s.id === id);

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

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
          { status: 403 }
        );
      }

      const pointsToAward = points !== undefined ? Number(points) : (submission.requestedPoints || 350);

      submission.status = 'approved';
      submission.pointsAwarded = pointsToAward;
      submission.reviewedById = session.user.id;
      submission.reviewedByName = session.user.name || 'Department Lead';
      submission.reviewedAt = new Date().toISOString();

      // Add to PointsLedger
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

      return NextResponse.json({ success: true, submission });
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
          { status: 403 }
        );
      }

      submission.status = 'rejected';
      submission.rejectionReason = reason || 'Shift details could not be verified.';
      submission.reviewedById = session.user.id;
      submission.reviewedByName = session.user.name || 'Department Lead';
      submission.reviewedAt = new Date().toISOString();

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

      return NextResponse.json({ success: true, submission });
    }

    // 3. Member Action: EDIT & RESUBMIT (Section 6.3)
    if (action === 'resubmit') {
      // Must be owner and submission must be rejected
      if (submission.memberId !== session.user.id && session.user.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Forbidden: Only the author may edit this submission' },
          { status: 403 }
        );
      }

      if (submission.status !== 'rejected' && session.user.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Only rejected submissions can be edited and resubmitted' },
          { status: 400 }
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

      return NextResponse.json({ success: true, submission });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}
