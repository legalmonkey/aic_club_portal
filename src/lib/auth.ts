// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { store, preconfiguredLeadsAndBoard } from './store';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: 'member' | 'lead' | 'board' | 'super_admin';
      departmentId?: string | null;
      departmentName?: string | null;
      regNo?: string | null;
      yearDept?: string | null;
      isOnboarded?: boolean;
    };
  }

  interface User {
    id: string;
    role?: 'member' | 'lead' | 'board' | 'super_admin';
    departmentId?: string | null;
    regNo?: string | null;
    yearDept?: string | null;
    isOnboarded?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'member' | 'lead' | 'board' | 'super_admin';
    departmentId?: string | null;
    departmentName?: string | null;
    regNo?: string | null;
    yearDept?: string | null;
    isOnboarded?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-secret',
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'VIT Chapter Portal Login',
      credentials: {
        email: { label: 'VIT Email', type: 'email' },
        portalRole: { label: 'Target Portal', type: 'text' },
        departmentId: { label: 'Department', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const email = credentials.email.toLowerCase().trim();

        // 1. Strict domain restriction check
        if (!email.endsWith('@vitstudent.ac.in')) {
          throw new Error('Only @vitstudent.ac.in accounts allowed');
        }

        // 2. Fetch user directly from the database
        let user = store.getUserByEmail(email);

        if (!user) {
          // New user signup: check if in preconfigured roster, otherwise default to member
          const preconfigured = preconfiguredLeadsAndBoard[email];
          const role = preconfigured ? preconfigured.role : 'member';
          const departmentId = preconfigured ? preconfigured.departmentId || null : null;

          user = {
            id: `user-${Date.now()}`,
            name: email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
            email,
            role,
            departmentId: role === 'lead' ? (departmentId || 'dept-tech') : null,
            yearDept:
              role === 'super_admin'
                ? 'Chapter Governance & Super Admin'
                : role === 'lead'
                ? 'Department Co-Lead'
                : role === 'board'
                ? 'Chapter Executive'
                : 'Student Member',
            isOnboarded: role !== 'member', // members must complete onboarding
            createdAt: new Date(),
          };
          store.users.push(user);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzkgs-Xs9KAw3ivlSvtEJ0uUrOEOwf1TMEf2YRpWINiZrHcEPQDTiO6dD7Qg3_i7pxgISTnrNvGo2eWlQei62-ocUEEtutzEPWblTSd3_60YbK8YPR5rNA1xgnF6c9MmQ64F85nCXk87wRMqyZN2FhkN2h7-pL-J9BKVNxjHZFF5TPosOeg0zeuM0gQit7i8ScbiApO6dhZaRKK1EDNkv9GpO57JpAMt8xET2g1Q50T0PhC5MjN6ZD',
          role: user.role,
          departmentId: user.departmentId,
          regNo: user.regNo,
          yearDept: user.yearDept,
          isOnboarded: user.isOnboarded ?? (user.role !== 'member' || !!user.departmentId),
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email || !user.email.endsWith('@vitstudent.ac.in')) {
        return false;
      }

      // Sync role from database record
      const email = user.email.toLowerCase().trim();
      let dbUser = store.getUserByEmail(email);
      if (!dbUser) {
        const preconfigured = preconfiguredLeadsAndBoard[email];
        const role = preconfigured ? preconfigured.role : 'member';
        dbUser = {
          id: user.id || `user-${Date.now()}`,
          name: user.name || email.split('@')[0],
          email,
          role,
          departmentId: preconfigured?.departmentId || null,
          yearDept:
            role === 'super_admin'
              ? 'Chapter Governance & Super Admin'
              : role === 'lead'
              ? 'Department Co-Lead'
              : role === 'board'
              ? 'Chapter Executive'
              : 'Student Member',
          isOnboarded: role !== 'member',
          createdAt: new Date(),
        };
        store.users.push(dbUser);
      }

      user.role = dbUser.role;
      user.departmentId = dbUser.departmentId;
      user.regNo = dbUser.regNo;
      user.yearDept = dbUser.yearDept;
      user.isOnboarded = dbUser.isOnboarded;
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'member';
        token.departmentId = user.departmentId;
        token.regNo = user.regNo;
        token.yearDept = user.yearDept;
        token.isOnboarded = user.isOnboarded;
      }

      // Always read latest role and status directly from the database record
      if (token.id) {
        const dbUser = store.getUserById(token.id as string) || (token.email ? store.getUserByEmail(token.email as string) : null);
        if (dbUser) {
          token.role = dbUser.role;
          token.departmentId = dbUser.departmentId;
          token.regNo = dbUser.regNo;
          token.yearDept = dbUser.yearDept;
          token.isOnboarded = dbUser.isOnboarded;
        }
      }

      if (trigger === 'update' && session) {
        if (session.departmentId) token.departmentId = session.departmentId;
        if (session.role) token.role = session.role;
        if (session.isOnboarded !== undefined) token.isOnboarded = session.isOnboarded;
      }

      if (token.departmentId) {
        const dept = store.getDepartmentById(token.departmentId as string);
        token.departmentName = dept?.name || null;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as 'member' | 'lead' | 'board' | 'super_admin') || 'member';
        session.user.departmentId = token.departmentId as string | null;
        session.user.departmentName = token.departmentName as string | null;
        session.user.regNo = token.regNo as string | null;
        session.user.yearDept = token.yearDept as string | null;
        session.user.isOnboarded = token.isOnboarded as boolean | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login/error',
  },
};
