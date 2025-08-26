'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { StorageManager } from '@/lib/storage';
import type { User } from '@/lib/types';
import { 
  Trophy, 
  Target, 
  Clock, 
  Zap,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Home,
  TrendingUp,
  Award,
  ArrowLeft
} from 'lucide-react';

interface QuizResults {
  attempt: {
    id: string;
    score: number;
    totalQuestions: number;
    timeSpent: number;
    xpEarned: number;
  };
  results: Array<{
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }>;
  xpBreakdown: Record<string, number>;
  performance: {
    score: number;
    totalQuestions: number;
    percentage: number;
    timeSpent: number;
    xpEarned: number;
  };
}

export default function QuizResultsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [results, setResults] = useState<QuizResults | null>(null);

  useEffect(() => {
    const currentUser = StorageManager.getUser();
    if (!currentUser) {
      router.push('/onboarding');
      return;
    }
    setUser(currentUser);

    // Get results from session storage
    const storedResults = sessionStorage.getItem('quizResults');
    if (storedResults) {
      try {
        setResults(JSON.parse(storedResults));
      } catch (error) {
        console.error('Error loading results:', error);
        router.push('/dashboard');
      }
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  if (!user || !results) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  const { performance, xpBreakdown } = results;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return '🎉 Excellent work!';
    if (percentage >= 70) return '👍 Great job!';
    if (percentage >= 50) return '👌 Good effort!';
    return '💪 Keep practicing!';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link 
              href="/dashboard"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Dashboard
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <Trophy className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Quiz Complete!
            </h1>
            <p className={`text-xl font-semibold ${getPerformanceColor(performance.percentage)}`}>
              {getPerformanceMessage(performance.percentage)}
            </p>
          </div>

          {/* Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <Target className="mx-auto text-blue-600 mb-3" size={32} />
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {performance.score}/{performance.totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Questions Correct</div>
              <div className={`text-lg font-semibold mt-2 ${getPerformanceColor(performance.percentage)}`}>
                {performance.percentage}%
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <Clock className="mx-auto text-green-600 mb-3" size={32} />
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatTime(performance.timeSpent)}
              </div>
              <div className="text-sm text-gray-600">Time Spent</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <Zap className="mx-auto text-yellow-600 mb-3" size={32} />
              <div className="text-2xl font-bold text-gray-900 mb-1">
                +{performance.xpEarned}
              </div>
              <div className="text-sm text-gray-600">XP Earned</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <TrendingUp className="mx-auto text-purple-600 mb-3" size={32} />
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {Math.floor((user.xp + performance.xpEarned) / 100) + 1}
              </div>
              <div className="text-sm text-gray-600">Current Level</div>
            </div>
          </div>

          {/* XP Breakdown */}
          {Object.keys(xpBreakdown).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Award className="mr-3 text-yellow-600" size={24} />
                  XP Breakdown
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(xpBreakdown).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                      <span className="font-semibold text-blue-600">+{value} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Results */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Detailed Results
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {results.results.map((result, index) => (
                <div key={result.questionId} className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      result.isCorrect ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {result.isCorrect ? (
                        <CheckCircle2 className="text-green-600" size={18} />
                      ) : (
                        <XCircle className="text-red-600" size={18} />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-3">
                        {index + 1}. {result.question}
                      </h3>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex flex-wrap gap-4">
                          <div>
                            <span className="text-sm text-gray-600">Your answer: </span>
                            <span className={`font-medium ${
                              result.isCorrect ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {result.userAnswer || 'Not answered'}
                            </span>
                          </div>
                          
                          {!result.isCorrect && (
                            <div>
                              <span className="text-sm text-gray-600">Correct answer: </span>
                              <span className="font-medium text-green-600">
                                {result.correctAnswer}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Explanation:</strong> {result.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quiz/create"
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <RotateCcw size={20} className="mr-2" />
              Create Another Quiz
            </Link>
            
            <Link
              href="/dashboard"
              className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Home size={20} className="mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}