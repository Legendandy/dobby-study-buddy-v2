import { NextRequest, NextResponse } from 'next/server';
import type { LeaderboardEntry } from '@/lib/types';

// In production, this would fetch from a database
// For now, we'll simulate leaderboard data
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Alex Chen', xp: 2450, quizzesCompleted: 45 },
  { rank: 2, name: 'Sarah Johnson', xp: 2180, quizzesCompleted: 38 },
  { rank: 3, name: 'Mike Rodriguez', xp: 1950, quizzesCompleted: 42 },
  { rank: 4, name: 'Emma Wilson', xp: 1820, quizzesCompleted: 33 },
  { rank: 5, name: 'David Kim', xp: 1650, quizzesCompleted: 29 },
  { rank: 6, name: 'Lisa Zhang', xp: 1480, quizzesCompleted: 31 },
  { rank: 7, name: 'James Brown', xp: 1320, quizzesCompleted: 26 },
  { rank: 8, name: 'Maria Garcia', xp: 1150, quizzesCompleted: 24 },
  { rank: 9, name: 'Tom Anderson', xp: 980, quizzesCompleted: 21 },
  { rank: 10, name: 'Jenny Liu', xp: 850, quizzesCompleted: 18 },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');

    let leaderboard = [...MOCK_LEADERBOARD];
    
    // In production, you would:
    // 1. Fetch all users from database
    // 2. Sort by XP descending
    // 3. Add rank numbers
    // 4. Include current user's rank even if not in top 10

    // If userId is provided, try to include user's rank
    if (userId) {
      // This would be a database query in production
      // For now, we'll simulate user data
    }

    return NextResponse.json({
      success: true,
      leaderboard: leaderboard.slice(0, limit),
      total: leaderboard.length,
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}