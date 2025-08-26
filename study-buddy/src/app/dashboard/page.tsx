'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { StorageManager } from '@/lib/storage';
import type { User, QuizAttempt } from '@/lib/types';
import { 
  Plus, 
  Clock, 
  Target, 
  TrendingUp,
  BookOpen,
  Zap
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [recentQuizzes, setRecentQuizzes] = useState<QuizAttempt[]>([]);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [quizzesThisWeek, setQuizzesThisWeek] = useState(0);

  useEffect(() => {
    const currentUser = StorageManager.getUser();
    if (!currentUser) {
      router.push('/onboarding');
      return;
    }
    setUser(currentUser);

    // Get all quiz history
    const allQuizzes = StorageManager.getQuizHistory();
    
    // Set total count
    setTotalQuizzes(allQuizzes.length);
    
    // Set recent quizzes (last 3)
    setRecentQuizzes(allQuizzes.slice(0, 3));
    
    // Calculate quizzes completed this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeekCount = allQuizzes.filter(quiz => 
      new Date(quiz.completedAt) > weekAgo
    ).length;
    setQuizzesThisWeek(thisWeekCount);
  }, [router]);

  if (!user) return null;

  const stats = [
    {
      label: 'Total XP',
      value: user.xp,
      icon: Zap,
      color: 'bg-yellow-500',
    },
    {
      label: 'Quizzes Completed',
      value: totalQuizzes,
      icon: Target,
      color: 'bg-green-500',
    },
    {
      label: 'Current Level',
      value: Math.floor(user.xp / 100) + 1,
      icon: TrendingUp,
      color: 'bg-blue-500',
    },
    {
      label: 'This Week',
      value: quizzesThisWeek,
      icon: Clock,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.name}! 👋
            </h1>
            <p className="text-gray-600">
              Ready to turn your notes into knowledge? Let's create a new quiz!
            </p>
          </div>

          {/* Quick Action */}
          <div className="mb-8">
            <Link
              href="/quiz/create"
              className="inline-flex items-center px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Plus size={24} className="mr-3" />
              <div>
                <div className="font-semibold text-lg">Create New Quiz</div>
                <div className="text-blue-100 text-sm">Turn your notes into a quiz</div>
              </div>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="text-white" size={24} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Quiz Activity</h2>
            </div>
            <div className="p-6">
              {recentQuizzes.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first quiz to start tracking your progress!
                  </p>
                  <Link
                    href="/quiz/create"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={18} className="mr-2" />
                    Create First Quiz
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentQuizzes.map((quiz, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Quiz #{quiz.id.slice(0, 8)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Score: {quiz.score}/{quiz.totalQuestions} • 
                          +{quiz.xpEarned} XP • 
                          {new Date(quiz.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {Math.round((quiz.score / quiz.totalQuestions) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4">
                    <Link
                      href="/history"
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      View all quiz history →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}