// src/app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get('departmentId');

  const leaderboard = store.getLeaderboard(departmentId);
  return NextResponse.json({ leaderboard });
}
