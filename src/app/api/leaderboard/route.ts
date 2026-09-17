// src/app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get('departmentId');

  const leaderboard = store.getLeaderboard(departmentId);
  return NextResponse.json({ leaderboard });
}
