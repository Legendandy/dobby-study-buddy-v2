'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { StorageManager } from '@/lib/storage';
import type { User, LeaderboardEntry } from '@/lib/types';
import { 
  Trophy, 
  Medal, 
  Award,
  Crown,
  TrendingUp,
  Users,
  Target,
  Zap
} from 'lucide-react';

export default function LeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = StorageManager.getUser();
    if (!currentUser) {
      router.push('/onboarding');
      return;
    }
    setUser(currentUser);
    fetchLeaderboard(currentUser.id);
  }, [router]);

  const fetchLeaderboard = async (userId?: string) => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      
      const response = await fetch(`/api/leaderboard?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
        
        // Find user's rank (if they have any XP)
        if (user && user.xp > 0) {
          // In a real app, this would come from the API
          // For now, estimate based on current XP
          const estimatedRank = data.leaderboard.findIndex((entry: LeaderboardEntry) => 
            user.xp >= entry.xp
          );
          setUserRank(estimatedRank === -1 ? data.leaderboard.length + 1 : estimatedRank + 1);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-500" size={24} />;
      case 2:
        return <Medal className="text-gray-400" size={24} />;
      case 3:
        return <Award className="text-orange-500" size={24} />;
      default:
        return <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{rank}</div>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
      default:
        return 'bg-white border border-gray-200';
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
              <Trophy className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
            <p className="text-gray-600">See how you rank against other Study Buddy users</p>
          </div>

          {/* User's Rank Card */}
          {userRank && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold">#{userRank}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <p className="text-blue-100">Your current rank</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{user.xp} XP</div>
                  <div className="text-blue-100 text-sm">Level {Math.floor(user.xp / 100) + 1}</div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Trophy className="text-yellow-500" size={24} />
                  <h2 className="text-xl font-semibold text-gray-900">Top Performers</h2>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users size={16} />
                  <span>{leaderboard.length} users</span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading leaderboard...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="p-12 text-center">
                  <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No rankings yet</h3>
                  <p className="text-gray-600">Be the first to appear on the leaderboard!</p>
                </div>
              ) : (
                leaderboard.map((entry, index) => (
                  <div
                    key={`${entry.rank}-${entry.name}`}
                    className={`p-6 ${getRankColor(entry.rank)} ${
                      entry.rank <= 3 ? 'shadow-md' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getRankIcon(entry.rank)}
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                            entry.rank <= 3 ? 'bg-white bg-opacity-20' : 'bg-gradient-to-r from-blue-600 to-purple-600'
                          }`}>
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className={`font-semibold ${entry.rank <= 3 ? 'text-white' : 'text-gray-900'}`}>
                              {entry.name}
                              {entry.name === user.name && (
                                <span className="ml-2 text-sm font-normal opacity-75">(You)</span>
                              )}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <Target size={12} />
                                <span className={entry.rank <= 3 ? 'text-white opacity-75' : 'text-gray-600'}>
                                  {entry.quizzesCompleted} quizzes
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-2xl font-bold flex items-center ${
                          entry.rank <= 3 ? 'text-white' : 'text-gray-900'
                        }`}>
                          <Zap size={20} className="mr-1" />
                          {entry.xp}
                        </div>
                        <div className={`text-sm ${entry.rank <= 3 ? 'text-white opacity-75' : 'text-gray-600'}`}>
                          Level {Math.floor(entry.xp / 100) + 1}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Encouragement for non-ranked users */}
          {!userRank && user.xp === 0 && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <TrendingUp className="mx-auto text-blue-600 mb-3" size={32} />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to climb the leaderboard?</h3>
              <p className="text-blue-700 mb-4">
                Take your first quiz to earn XP and see your name on the leaderboard!
              </p>
              <button
                onClick={() => router.push('/quiz/create')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Quiz
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}