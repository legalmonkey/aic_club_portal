# AIC Club Portal — Implementation Document

This document is a build spec for Claude Code. It covers the full stack, data model, auth, API, pages, and logic needed to build the platform end-to-end. Follow it section by section; each section is self-contained enough to implement and test independently.

---

## 1. Project Summary

A web app where club members log verified work (events/volunteering), department leads review and award points, and everyone up to board members/super admin can view progress via dashboards and a leaderboard.

**Roles**: `member`, `lead` (co-leads, 2+ per department, equal permissions), `board`, `super_admin`.

**Auth**: Google OAuth only, restricted to `@vitstudent.ac.in`.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS | Server components where possible, client components for interactive forms/dashboards |
| Backend | Next.js API routes / Route Handlers | Keep it monolithic — no separate backend service needed for this scale |
| Database | PostgreSQL | Via Prisma ORM |
| ORM | Prisma | Schema-first, type-safe queries |
| Auth | NextAuth.js (Auth.js) with Google provider | Domain restriction via `signIn` callback |
| File storage | Cloudinary (or S3) | For geotagged photo uploads; Cloudinary preferred for built-in EXIF/metadata extraction |
| Email | Nodemailer + SMTP pool (custom logic, see §8) | Multiple SMTP accounts rotated at 100 emails/day cap each |
| Charts (analytics) | Recharts | For lead/board analytics dashboards |
| Hosting | Vercel (frontend + API routes) + a managed Postgres (Neon/Supabase/Railway) | |
| Notifications | In-app: DB-backed, polled or via SSE/websocket (see §9) | |

Install baseline:
```bash
npx create-next-app@latest aic-club-portal --typescript --tailwind --app
cd aic-club-portal
npm install prisma @prisma/client next-auth @auth/prisma-adapter
npm install nodemailer cloudinary recharts
npx prisma init
```

---

## 3. Database Schema (Prisma)

```prisma
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  member
  lead
  board
  super_admin
}

enum SubmissionStatus {
  pending
  approved
  rejected
  resubmitted
}

model User {
  id             String   @id @default(cuid())
  name           String
  email          String   @unique
  googleId       String?  @unique
  role           Role     @default(member)
  departmentId   String?
  department     Department? @relation("MemberDepartment", fields: [departmentId], references: [id])
  ledDepartments Department[] @relation("DepartmentLeads")
  submissions    Submission[] @relation("SubmittedBy")
  reviewed       Submission[] @relation("ReviewedBy")
  notifications  Notification[]
  createdAt      DateTime @default(now())
}

model Department {
  id      String @id @default(cuid())
  name    String @unique
  leads   User[] @relation("DepartmentLeads")
  members User[] @relation("MemberDepartment")
}

model Submission {
  id               String   @id @default(cuid())
  memberId         String
  member           User     @relation("SubmittedBy", fields: [memberId], references: [id])
  departmentId     String
  date             DateTime
  venue            String
  roleInEvent      String
  eventName        String
  comments         String   // mandatory, free text
  photoUrl         String
  geoLat           Float?
  geoLng           Float?
  status           SubmissionStatus @default(pending)
  pointsAwarded    Int?
  rejectionReason  String?
  reviewedById     String?
  reviewedBy       User?    @relation("ReviewedBy", fields: [reviewedById], references: [id])
  createdAt        DateTime @default(now())
  reviewedAt       DateTime?
}

model PointsLedger {
  id           String   @id @default(cuid())
  memberId     String
  submissionId String
  points       Int
  createdAt    DateTime @default(now())
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // submission_approved | submission_rejected | new_submission_in_queue | resubmission
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}

model SmtpAccount {
  id           String   @id @default(cuid())
  label        String
  host         String
  port         Int
  username     String
  password     String   // store encrypted or in env, not plain DB text, in production
  dailyLimit   Int      @default(100)
  sentToday    Int      @default(0)
  lastResetAt  DateTime @default(now())
  active       Boolean  @default(true)
}

model EmailLog {
  id            String   @id @default(cuid())
  smtpAccountId String
  recipient     String
  type          String
  status        String   // sent | failed | queued
  sentAt        DateTime @default(now())
}
```

Run:
```bash
npx prisma migrate dev --name init
```

---

## 4. Authentication

**Provider**: Google OAuth via NextAuth.js.

**Domain restriction**: in the `signIn` callback, reject any email not ending in `@vitstudent.ac.in`.

```ts
// auth.ts (NextAuth config)
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email?.endsWith("@vitstudent.ac.in")) {
        return false; // blocks login, redirects to error page
      }
      return true;
    },
    async session({ session, token }) {
      // attach role + departmentId from DB to session
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: { department: true },
      });
      session.user.role = dbUser?.role ?? "member";
      session.user.departmentId = dbUser?.departmentId ?? null;
      session.user.id = dbUser?.id;
      return session;
    },
  },
  pages: {
    error: "/login/error", // custom page: "Only @vitstudent.ac.in accounts allowed"
  },
};
```

**First-login flow**:
1. User signs in with Google.
2. Backend checks if a `User` row exists for that email.
3. If it exists and has role `lead`/`board`/`super_admin` (pre-provisioned by Super Admin) → route directly to their dashboard.
4. If no `User` row exists → create one with role `member`, redirect to `/onboarding` to select department.

**Route protection**: use middleware (`middleware.ts`) to gate `/dashboard/*` routes by role, redirecting unauthorized roles to their own dashboard or a 403 page.

---

## 5. Page & Route Map

```
/                          → marketing/landing page (optional) or redirect to /login
/login                     → Google sign-in button, domain note
/login/error               → "Only @vitstudent.ac.in accounts allowed"
/onboarding                → department selection (first-time members only)

/member/dashboard          → points total, history table, search/filter, "+ New entry"
/member/new-entry          → submission form (photo upload, date, venue, role, event, comments)
/member/entry/[id]/edit    → edit & resubmit a rejected entry

/lead/dashboard            → department overview, leaderboard, members list, search/filter
/lead/review               → review queue (pending + resubmitted), approve/reject actions
/lead/analytics            → department analytics charts

/board/dashboard           → department selector, global + per-department leaderboard
/board/submissions         → all submissions across departments, search/filter
/board/analytics           → club-wide analytics charts

/admin                     → super admin panel
/admin/users               → add/remove board members & leads, manual member add/edit
/admin/departments         → manage departments & co-leads
/admin/smtp                → SMTP pool status & configuration

/api/submissions           → POST create, GET list (scoped by role)
/api/submissions/[id]      → GET detail, PATCH approve/reject/edit
/api/departments           → GET list, POST (admin only)
/api/leaderboard           → GET, scoped by department or global
/api/notifications         → GET list, PATCH mark-read
/api/admin/users           → CRUD (super admin only)
/api/admin/smtp            → CRUD SMTP accounts (super admin only)
/api/cron/reset-smtp-quota → daily cron to reset sentToday counters
```

---

## 6. Core Feature Logic

### 6.1 Submission creation (member)
- Client uploads photo to Cloudinary (or S3) first, extracting EXIF GPS if present; if the photo has no geotag, either reject the upload client-side or flag it for lead attention (`geoLat`/`geoLng` null).
- On submit, `POST /api/submissions` creates a row with `status: pending`.
- Trigger: in-app notification + email to all co-leads of that department (`type: new_submission_in_queue`).

### 6.2 Review (lead)
- `PATCH /api/submissions/[id]` with `{ action: "approve", points: number }` or `{ action: "reject", reason: string }`.
- On approve: set `status: approved`, `pointsAwarded`, `reviewedById`, `reviewedAt`; insert a `PointsLedger` row; notify member (in-app + email).
- On reject: set `status: rejected`, `rejectionReason`; notify member (in-app + email).
- Only leads/co-leads of the submission's department (or super_admin) may act on it — enforce in the API handler, not just the UI.

### 6.3 Edit & resubmit (member)
- Only allowed when `status === "rejected"` and `memberId === session.user.id`.
- `PATCH /api/submissions/[id]` updates the fields and sets `status: resubmitted`.
- Notify the department's leads again.

### 6.4 Points & leaderboard
- A member's total points = `SUM(PointsLedger.points WHERE memberId = X)`. Compute via aggregate query, don't store a duplicated running total on `User` (avoids drift bugs) — or if performance requires it, cache it on `User.totalPoints` and update it transactionally alongside the ledger insert.
- Leaderboard query: group by member, sum points, sort descending, scoped by `departmentId` for lead view, ungrouped for board/global view.

### 6.5 Analytics (lead & board)
Compute via aggregate Prisma queries or a raw SQL view:
- Submissions over time (group by week/month, count)
- Approval vs rejection rate (count by status)
- Most active members (count submissions per member, top N)
- Points distribution (histogram buckets)

Render with Recharts (`LineChart`, `PieChart`/`Donut`, `BarChart`).

---

## 7. Super Admin Capabilities

- **Add/remove board members & leads**: form to search/select a user by email (must already exist as a `member`, or create a placeholder `User` row directly) and change their `role`, and for leads, assign `departmentId`(s) they co-lead.
- **Manual member management**: create/edit `User` rows directly (bulk CSV import is a good v2 addition).
- **Full override on submissions**: same review UI as leads, but accessible for any department, plus ability to re-open/re-verify an already-approved or rejected submission (edit `status`, `pointsAwarded`, `geoLat`/`geoLng` if a geotag dispute needs correcting). Log all admin overrides distinctly in a simple audit trail (extra `AuditLog` model if you want a full history — not in the base schema above, easy to add later).
- **Department/co-lead management**: create departments, add/remove any number of co-leads per department.
- **SMTP pool management**: see §8.

---

## 8. SMTP Pool (Emailing)

**Goal**: send transactional emails (submission approved/rejected, new entry alert, resubmission) without exceeding a 100/day cap per SMTP account, auto-switching to the next available account when one is exhausted.

**Logic** (`lib/email.ts`):
```ts
async function sendEmail(to: string, subject: string, body: string, type: string) {
  const account = await prisma.smtpAccount.findFirst({
    where: { active: true, sentToday: { lt: prisma.smtpAccount.fields.dailyLimit } },
    orderBy: { sentToday: "asc" }, // use the least-used account first
  });

  if (!account) {
    // all accounts exhausted for the day — queue for later (simplest: log as "queued", a cron retries after reset)
    await prisma.emailLog.create({ data: { smtpAccountId: "none", recipient: to, type, status: "queued" } });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: account.host,
    port: account.port,
    auth: { user: account.username, pass: account.password },
  });

  try {
    await transporter.sendMail({ from: account.username, to, subject, html: body });
    await prisma.smtpAccount.update({
      where: { id: account.id },
      data: { sentToday: { increment: 1 } },
    });
    await prisma.emailLog.create({ data: { smtpAccountId: account.id, recipient: to, type, status: "sent" } });
  } catch (err) {
    await prisma.emailLog.create({ data: { smtpAccountId: account.id, recipient: to, type, status: "failed" } });
  }
}
```

**Daily reset**: a cron job (Vercel Cron or a scheduled route hit daily at midnight) resets every `SmtpAccount.sentToday` to 0 and processes any `queued` `EmailLog` entries from the previous day.

```ts
// /api/cron/reset-smtp-quota/route.ts
export async function GET() {
  await prisma.smtpAccount.updateMany({ data: { sentToday: 0, lastResetAt: new Date() } });
  // then retry queued emails
  return new Response("ok");
}
```

Configure in `vercel.json`:
```json
{
  "crons": [{ "path": "/api/cron/reset-smtp-quota", "schedule": "0 0 * * *" }]
}
```

---

## 9. Notifications (In-App)

- Simplest v1: DB-backed `Notification` table (already in schema), fetched via `GET /api/notifications` on dashboard load and polled every ~30s, or refreshed on navigation.
- Bell icon in top nav shows unread count (`WHERE read = false`).
- Clicking a notification marks it read (`PATCH /api/notifications/[id]`) and can deep-link to the relevant submission.
- v2 upgrade path: swap polling for Server-Sent Events or a lightweight websocket (e.g., Pusher/Ably) for real-time push — not required for MVP.

---

## 10. Geotag Handling

- Extract EXIF GPS data client-side on file select (e.g., using `exif-js` or `exifr` in the browser) before upload, so the member sees immediately if their photo has no location data.
- Store `geoLat`/`geoLng` on the `Submission`.
- On the lead's review screen, render the coordinates on a small embedded map (e.g., a static Google Maps/Mapbox image) next to the stated venue so the lead can visually cross-check.
- Flag (not block) submissions where geotag is missing or where the stated venue text doesn't match a reasonable radius of the geotag — leave the judgment call to the lead, don't auto-reject.

---

## 11. Design System — Source of Truth

Do **not** invent a design system. This project already has finalized reference screens from Google Stitch:

- `design.md` — the design language spec (colors, typography, spacing, component styles)
- 3 exported HTML screens showing the finalized look for key pages

**Instruction for Claude Code**: Before building any UI, read `design.md` and all 3 reference HTML files in full. Extract the exact color values, font family/weights/sizes, spacing scale, border radii, shadow usage, and component patterns (buttons, cards, inputs, badges, nav) used in those screens. Every page built for this app — including ones with no direct reference screen (e.g. the super admin panel, analytics pages) — must reuse these same tokens and component patterns rather than approximating them or falling back to Tailwind defaults. If a screen is needed that has no Stitch reference, extrapolate from the closest existing reference screen's patterns rather than designing from scratch.

Convert the reference HTML/CSS into a proper Tailwind config (colors, fontFamily, borderRadius, etc.) and/or shared React components at the start of the build, so every subsequent page pulls from the same source rather than each page re-implementing styles inline.

---

## 12. Environment Variables

```
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```
(SMTP credentials live in the `SmtpAccount` DB table, managed via the admin panel, rather than env vars, since there can be multiple pooled accounts added at runtime.)

---

## 13. Build Order (recommended sequence for Claude Code)

1. Scaffold Next.js project + Tailwind + Prisma schema + migrate DB
2. Google OAuth login with domain restriction + onboarding (department picker)
3. Member: new entry form + Cloudinary upload + EXIF geotag extraction
4. Member dashboard: history table, status badges, search/filter
5. Lead dashboard: members list, review queue, approve/reject logic + points ledger
6. Leaderboard (department-scoped) + edit/resubmit flow
7. Board dashboard: cross-department views, global leaderboard
8. Analytics (Recharts) for lead + board
9. Super admin panel: user/department management, SMTP pool config
10. In-app notifications (DB + bell icon + polling)
11. SMTP email sending + pooling/auto-switch + daily reset cron
12. Polish: responsive layout, empty states, loading states, error handling
13. Deploy to Vercel + managed Postgres, set up env vars and cron

---

## 14. Testing Checklist

- [ ] Non-`@vitstudent.ac.in` Google account is blocked at login
- [ ] New member is correctly routed to onboarding, then appears in the right department's lead dashboard
- [ ] Submission with no geotag still submits but is visibly flagged to the lead
- [ ] Only co-leads of the correct department can approve/reject a given submission (test via direct API call with a different department's lead token — should 403)
- [ ] Points ledger sum matches displayed total after several approvals
- [ ] Rejected entry can be edited and resubmitted, and reappears in the lead queue as "Resubmitted"
- [ ] Leaderboard sorts correctly at both department and global scope
- [ ] SMTP pool switches to the next account once one hits 100 sent/day
- [ ] Super admin can add a lead/board member and that account routes to the correct dashboard on next login
- [ ] All dashboards render correctly on mobile width
