// src/app/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role === 'super_admin') {
    redirect('/admin');
  } else if (session.user.role === 'board') {
    redirect('/board/dashboard');
  } else if (session.user.role === 'lead') {
    redirect('/lead/dashboard');
  } else {
    // For members: if first time login (no department assigned), route to onboarding
    if (!session.user.departmentId || session.user.isOnboarded === false) {
      redirect('/onboarding');
    }
    redirect('/member/dashboard');
  }
}
