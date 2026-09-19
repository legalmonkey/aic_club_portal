// src/lib/store.ts
// Dual-mode data store: Demo Mode (preloaded Stitch screens) vs Production Mode (clean live environment)

export interface UserData {
  id: string;
  name: string;
  email: string;
  googleId?: string | null;
  role: 'member' | 'lead' | 'board' | 'super_admin';
  departmentId?: string | null;
  regNo?: string;
  yearDept?: string;
  avatarUrl?: string;
  isOnboarded?: boolean;
  createdAt: Date;
}

export interface DepartmentData {
  id: string;
  name: string;
  code: string;
  leadIds: string[];
}

export interface SubmissionData {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberAvatar?: string;
  memberYearDept?: string;
  memberRegNo?: string;
  departmentId: string;
  departmentName: string;
  date: string;
  venue: string;
  durationHours: number;
  durationLabel: string;
  roleInEvent: string;
  eventName: string;
  comments: string;
  photoUrl: string;
  geoLat?: number | null;
  geoLng?: number | null;
  geoStatus?: 'verified' | 'remote' | 'missing' | 'flagged';
  geoDistanceMeters?: number;
  status: 'pending' | 'approved' | 'rejected' | 'resubmitted';
  pointsAwarded: number | null;
  requestedPoints: number;
  rejectionReason?: string | null;
  reviewedById?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface PointsLedgerData {
  id: string;
  memberId: string;
  submissionId: string;
  points: number;
  createdAt: string;
}

export interface NotificationData {
  id: string;
  userId: string;
  type: 'submission_approved' | 'submission_rejected' | 'new_submission_in_queue' | 'resubmission';
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SmtpAccountData {
  id: string;
  label: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  dailyLimit: number;
  sentToday: number;
  lastResetAt: string;
  active: boolean;
}

export interface EmailLogData {
  id: string;
  smtpAccountId: string;
  recipient: string;
  type: string;
  status: 'sent' | 'failed' | 'queued';
  sentAt: string;
}

// 1. Official Club Departments
export const initialDepartments: DepartmentData[] = [
  { id: 'dept-tech', name: 'Technical', code: 'TECH', leadIds: [] },
  { id: 'dept-vmed', name: 'Visual Media', code: 'VMED', leadIds: [] },
  { id: 'dept-crtv', name: 'Creative', code: 'CRTV', leadIds: [] },
  { id: 'dept-outr', name: 'Outreach', code: 'OUTR', leadIds: [] },
  { id: 'dept-ops', name: 'Operations', code: 'OPS', leadIds: [] },
];

// 2. Pre-configured Roster for Backend Configuration
export const preconfiguredLeadsAndBoard: Record<string, { role: 'lead' | 'board' | 'super_admin'; departmentId?: string; title: string }> = {
  'ritvik.arunbhat2025@vitstudent.ac.in': { role: 'super_admin', title: 'Super Administrator' },
  'iamsanthosh2425@gmail.com': { role: 'super_admin', title: 'Super Administrator' },
};

// 3. Production Store Manager
const globalStoreKey = Symbol.for('aic.club.portal.production.store');

class PortalStoreManager {
  departments: DepartmentData[] = [...initialDepartments];
  users: UserData[] = [
    {
      id: 'admin-super-1',
      name: 'Ritvik Arun Bhat',
      email: 'ritvik.arunbhat2025@vitstudent.ac.in',
      role: 'super_admin',
      departmentId: null,
      yearDept: 'Chapter Governance & Super Admin',
      isOnboarded: true,
      createdAt: new Date(),
    },
    {
      id: 'admin-super-santhosh',
      name: 'Santhosh (Super Admin)',
      email: 'iamsanthosh2425@gmail.com',
      role: 'super_admin',
      departmentId: null,
      yearDept: 'Chapter Governance & Super Admin',
      isOnboarded: true,
      createdAt: new Date(),
    },
    {
      id: 'member-ritvik-gmail',
      name: 'Ritvik Arun Bhat',
      email: 'ritvikarunbhat@gmail.com',
      role: 'member',
      departmentId: 'dept-tech',
      yearDept: 'Technical Department Member',
      isOnboarded: true,
      createdAt: new Date(),
    },
  ];
  submissions: SubmissionData[] = [];
  ledger: PointsLedgerData[] = [];
  notifications: NotificationData[] = [];
  smtpAccounts: SmtpAccountData[] = [];
  emailLogs: EmailLogData[] = [];

  getUserById(id: string) {
    return this.users.find(u => u.id === id) || null;
  }

  getUserByEmail(email: string) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  getDepartmentById(id: string) {
    return this.departments.find(d => d.id === id) || null;
  }

  getMemberPoints(memberId: string): number {
    return this.ledger
      .filter(l => l.memberId === memberId)
      .reduce((sum, l) => sum + l.points, 0);
  }

  getLeaderboard(departmentId?: string | null) {
    const members = this.users.filter(u => u.role === 'member');
    const filteredMembers = departmentId
      ? members.filter(m => m.departmentId === departmentId)
      : members;

    return filteredMembers.map(member => {
      const pts = this.getMemberPoints(member.id);
      const approvedSubmissions = this.submissions.filter(s => s.memberId === member.id && s.status === 'approved');
      const totalHours = approvedSubmissions.reduce((h, s) => h + (s.durationHours || 0), 0);
      const dept = this.getDepartmentById(member.departmentId || '');

      return {
        memberId: member.id,
        name: member.name,
        email: member.email,
        avatarUrl: member.avatarUrl,
        yearDept: member.yearDept || dept?.name || 'AIC Member',
        regNo: member.regNo || '22BCE0000',
        departmentId: member.departmentId || '',
        departmentName: dept?.name || 'General',
        points: pts,
        totalHours,
        shiftsCount: approvedSubmissions.length,
      };
    }).sort((a, b) => b.points - a.points);
  }
}

const globalForStore = globalThis as unknown as { [globalStoreKey]?: PortalStoreManager };

export const store = globalForStore[globalStoreKey] || (globalForStore[globalStoreKey] = new PortalStoreManager());
