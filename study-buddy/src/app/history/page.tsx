'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { StorageManager } from '@/lib/storage';
import type { User, QuizAttempt } from '@/lib/types';
import { 
  History, 
  Clock, 
  Target, 
  Award,
  Calendar,
  ChevronRight,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<QuizAttempt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'xp'>('date');

  useEffect(() => {
    const currentUser = StorageManager.getUser();
    if (!currentUser) {
      router.push('/onboarding');
      return;
    }
    setUser(currentUser);

    const history = StorageManager.getQuizHistory();
    setQuizHistory(history);
    setFilteredHistory(history);
  }, [router]);

  useEffect(() => {
    let filtered = [...quizHistory];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(quiz =>
        quiz.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
        case 'score':
          return (b.score / b.totalQuestions) - (a.score / a.totalQuestions);
        case 'xp':
          return b.xpEarned - a.xpEarned;
        default:
          return 0;
      }
    });

    setFilteredHistory(filtered);
  }, [quizHistory, searchTerm, sortBy]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 70) return 'text-blue-600 bg-blue-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const viewQuizDetails = (quiz: QuizAttempt) => {
    // Store quiz details for viewing
    sessionStorage.setItem('viewingQuiz', JSON.stringify(quiz));
    router.push(`/quiz/review/${quiz.id}`);
  };

  if (!user) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading history...</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    totalQuizzes: quizHistory.length,
    averageScore: quizHistory.length > 0 
      ? Math.round((quizHistory.reduce((sum, quiz) => sum + quiz.score, 0) / 
          quizHistory.reduce((sum, quiz) => sum + quiz.totalQuestions, 0)) * 100) 
      : 0,
    totalXP: quizHistory.reduce((sum, quiz) => sum + quiz.xpEarned, 0),
    totalTime: quizHistory.reduce((sum, quiz) => sum + quiz.timeSpent, 0),
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz History</h1>
            <p className="text-gray-600">Review your past quiz performances and track your progress</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Quizzes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
                </div>
                <Target className="text-blue-600" size={24} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
                </div>
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total XP Earned</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalXP}</p>
                </div>
                <Award className="text-yellow-600" size={24} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Study Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.floor(stats.totalTime / 60)}m
                  </p>
                </div>
                <Clock className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <History className="text-gray-600" size={20} />
                  <h2 className="text-lg font-semibold text-gray-900">Quiz History</h2>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search quizzes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'xp')}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="score">Sort by Score</option>
                    <option value="xp">Sort by XP</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <History size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {quizHistory.length === 0 ? 'No quiz history yet' : 'No quizzes found'}
                  </h3>
                  <p className="text-gray-600">
                    {quizHistory.length === 0 
                      ? 'Take your first quiz to see your history here'
                      : 'Try adjusting your search or filter criteria'
                    }
                  </p>
                </div>
              ) : (
                filteredHistory.map((quiz, index) => (
                  <div
                    key={quiz.id}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => viewQuizDetails(quiz)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            Quiz #{quiz.id.slice(0, 8)}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            getScoreColor(quiz.score, quiz.totalQuestions)
                          }`}>
                            {quiz.score}/{quiz.totalQuestions} ({Math.round((quiz.score / quiz.totalQuestions) * 100)}%)
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar size={14} />
                            <span>{new Date(quiz.completedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock size={14} />
                            <span>{formatTime(quiz.timeSpent)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Award size={14} />
                            <span>+{quiz.xpEarned} XP</span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="text-gray-400" size={20} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}