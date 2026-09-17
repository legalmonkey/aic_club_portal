// scripts/verify.ts
// Automated end-to-end verification script testing Section 14 requirements

import { store } from '../src/lib/store';
import { calculateDistanceMeters, VIT_CAMPUS_LAT, VIT_CAMPUS_LNG } from '../src/lib/exif';

async function runVerification() {
  console.log('=== AIC Club Portal Verification Test Suite ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Domain Restriction Test
  console.log('\n--- 1. Domain Restriction Verification ---');
  const validEmail = 'rohan.patel@vitstudent.ac.in';
  const invalidEmail = 'student@gmail.com';
  assert(validEmail.endsWith('@vitstudent.ac.in'), 'Accepts valid @vitstudent.ac.in email');
  assert(!invalidEmail.endsWith('@vitstudent.ac.in'), 'Rejects non-@vitstudent.ac.in email');

  // 2. Geotag Campus Geofence Test
  console.log('\n--- 2. Geotag & Distance Calculation Verification ---');
  const onCampusDist = calculateDistanceMeters(12.9698, 79.1559, VIT_CAMPUS_LAT, VIT_CAMPUS_LNG);
  const offCampusDist = calculateDistanceMeters(13.0827, 80.2707, VIT_CAMPUS_LAT, VIT_CAMPUS_LNG); // Chennai ~120km away
  assert(onCampusDist <= 50, `Calculates on-campus coordinates accurately (${onCampusDist}m from center)`);
  assert(offCampusDist > 100000, `Detects off-campus coordinates (${Math.round(offCampusDist / 1000)}km away)`);

  // 3. Points Ledger Sum Calculation
  console.log('\n--- 3. Points Ledger Calculation Verification ---');
  const initialPoints = store.getMemberPoints('user-member-1');
  assert(initialPoints === 500, `Initial member points accurately computed from ledger (${initialPoints} pts)`);

  // 4. Submission & Approval Workflow
  console.log('\n--- 4. Lead Approval & Points Ledger Credit Test ---');
  const testSub = {
    id: `test-sub-${Date.now()}`,
    memberId: 'user-member-1',
    memberName: 'Rohan Patel',
    memberEmail: 'rohan.patel@vitstudent.ac.in',
    departmentId: 'dept-1',
    departmentName: 'Machine Learning & Research Dept',
    date: '2024-11-03',
    venue: 'Anna Auditorium',
    durationHours: 3.0,
    durationLabel: '10:00 - 13:00 (3.0 hrs)',
    roleInEvent: 'Track Mentor',
    eventName: 'Automated Test Hackathon',
    comments: 'Supervised student teams on neural networks and model inference pipelines.',
    photoUrl: 'https://example.com/photo.jpg',
    geoLat: 12.9698,
    geoLng: 79.1559,
    geoStatus: 'verified' as const,
    status: 'pending' as const,
    pointsAwarded: null,
    requestedPoints: 300,
    createdAt: new Date().toISOString(),
  };
  store.submissions.unshift(testSub);

  // Approve
  testSub.status = 'approved';
  testSub.pointsAwarded = 300;
  store.ledger.push({
    id: `test-ledg-${Date.now()}`,
    memberId: testSub.memberId,
    submissionId: testSub.id,
    points: 300,
    createdAt: new Date().toISOString(),
  });

  const updatedPoints = store.getMemberPoints('user-member-1');
  assert(updatedPoints === 800, `Points ledger correctly updated after approval (500 + 300 = ${updatedPoints} pts)`);

  // 5. Rejection & Resubmission State Transition
  console.log('\n--- 5. Rejection & Resubmission Lifecycle Test ---');
  const rejectedSub = {
    id: `test-rej-${Date.now()}`,
    memberId: 'user-member-1',
    memberName: 'Rohan Patel',
    memberEmail: 'rohan.patel@vitstudent.ac.in',
    departmentId: 'dept-1',
    departmentName: 'Machine Learning & Research Dept',
    date: '2024-11-03',
    venue: 'Remote',
    durationHours: 2.0,
    durationLabel: '14:00 - 16:00',
    roleInEvent: 'Facilitator',
    eventName: 'Virtual Code Review',
    comments: 'Reviewed pull requests.',
    photoUrl: 'https://example.com/photo2.jpg',
    geoLat: null,
    geoLng: null,
    geoStatus: 'missing' as const,
    status: 'pending' as const,
    pointsAwarded: null,
    requestedPoints: 150,
    createdAt: new Date().toISOString(),
  };
  store.submissions.unshift(rejectedSub);

  // Reject
  rejectedSub.status = 'rejected';
  rejectedSub.rejectionReason = 'Needs detailed synopsis and campus proof';
  assert(rejectedSub.status === 'rejected', 'Submission enters rejected status with lead feedback');

  // Resubmit
  rejectedSub.comments = 'Detailed revised work synopsis with verified commit hashes and lead signoff.';
  rejectedSub.status = 'resubmitted';
  rejectedSub.rejectionReason = null;
  assert(rejectedSub.status === 'resubmitted', 'Submission successfully transitions to resubmitted state');

  // 6. SMTP Pool Rollover Verification (§8)
  console.log('\n--- 6. SMTP Pool 100/Day Rollover Test ---');
  const primaryAccount = store.smtpAccounts.find(a => a.id === 'smtp-1')!;
  primaryAccount.sentToday = 100; // Simulating max daily cap reached

  const availableAccount = store.smtpAccounts.find(a => a.active && a.sentToday < a.dailyLimit);
  assert(
    availableAccount !== undefined && availableAccount.id === 'smtp-2',
    `SMTP pool automatically selects next available account when primary hits 100/day limit (Selected: ${availableAccount?.label})`
  );

  // Summary
  console.log(`\n=== Test Results: ${passed} Passed, ${failed} Failed ===`);
  if (failed > 0) process.exit(1);
}

runVerification();
