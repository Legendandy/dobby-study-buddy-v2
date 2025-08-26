'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { StorageManager } from '@/lib/storage';
import type { User, QuizAttempt } from '@/lib/types';
import { 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Target,
  Calendar,
  BookOpen
} from 'lucide-react';

export default function QuizReviewPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [quizAttempt, setQuizAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = StorageManager.getUser();
    if (!currentUser) {
      router.push('/onboarding');
      return;
    }
    setUser(currentUser);

    // First, try to get from sessionStorage (when coming from history)
    const viewingQuiz = sessionStorage.getItem('viewingQuiz');
    if (viewingQuiz) {
      try {
        const quiz = JSON.parse(viewingQuiz);
        console.log('Loaded quiz from session storage:', quiz);
        setQuizAttempt(quiz);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing viewing quiz:', error);
      }
    }

    // Fallback: find the quiz in stored history
    if (quizId) {
      const history = StorageManager.getQuizHistory();
      const foundQuiz = history.find(q => q.id === quizId);
      if (foundQuiz) {
        console.log('Found quiz in history:', foundQuiz);
        setQuizAttempt(foundQuiz);
      } else {
        console.error('Quiz not found in history');
        // Navigate back to history if quiz not found
        router.push('/history');
      }
    }
    
    setLoading(false);
  }, [router, quizId]);

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

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quiz review...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !quizAttempt) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <XCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quiz Not Found</h3>
            <p className="text-gray-600 mb-4">Unable to load the requested quiz.</p>
            <button
              onClick={() => router.push('/history')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to History
            </button>
          </div>
        </div>
      </div>
    );
  }

  const percentage = Math.round((quizAttempt.score / quizAttempt.totalQuestions) * 100);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push('/history')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span>Back to History</span>
            </button>
            
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-900">Quiz Review</h1>
              <p className="text-gray-600">Quiz #{quizAttempt.id.slice(0, 8)}</p>
            </div>
          </div>

          {/* Score Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
                percentage >= 90 ? 'bg-green-100' :
                percentage >= 70 ? 'bg-blue-100' :
                percentage >= 50 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <span className={`text-3xl font-bold ${
                  percentage >= 90 ? 'text-green-600' :
                  percentage >= 70 ? 'text-blue-600' :
                  percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {percentage}%
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {percentage >= 90 ? 'Excellent!' :
                 percentage >= 70 ? 'Good Job!' :
                 percentage >= 50 ? 'Not Bad!' : 'Keep Studying!'}
              </h2>
              <p className="text-gray-600">
                You scored {quizAttempt.score} out of {quizAttempt.totalQuestions} questions correctly
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Target className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <div className="text-sm text-gray-600">Score</div>
                <div className="text-xl font-bold">{quizAttempt.score}/{quizAttempt.totalQuestions}</div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Clock className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <div className="text-sm text-gray-600">Time Spent</div>
                <div className="text-xl font-bold">{formatTime(quizAttempt.timeSpent)}</div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Award className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                <div className="text-sm text-gray-600">XP Earned</div>
                <div className="text-xl font-bold">+{quizAttempt.xpEarned}</div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <div className="text-sm text-gray-600">Completed</div>
                <div className="text-xl font-bold">
                  {new Date(quizAttempt.completedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Question Review */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <BookOpen className="text-gray-600" size={20} />
                <h2 className="text-lg font-semibold text-gray-900">Question Review</h2>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {quizAttempt.questions && quizAttempt.questions.length > 0 ? (
                quizAttempt.questions.map((question: any, index: number) => {
                  // Try to get user answer from multiple possible sources
                  const userAnswer = quizAttempt.answers?.[question.id] || 
                                   (quizAttempt as any).userAnswers?.[question.id] || 
                                   null;
                  
                  const isCorrect = userAnswer !== null && userAnswer === question.correctAnswer;
                  
                  // Debug logging
                  console.log(`Question ${index + 1}:`, {
                    questionId: question.id,
                    userAnswer,
                    correctAnswer: question.correctAnswer,
                    allAnswers: quizAttempt.answers,
                    userAnswers: (quizAttempt as any).userAnswers
                  });
                  
                  return (
                    <div key={question.id || `question-${index}`} className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isCorrect ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {isCorrect ? (
                            <CheckCircle2 size={16} className="text-green-600" />
                          ) : (
                            <XCircle size={16} className="text-red-600" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              Question {index + 1}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                          
                          <p className="text-gray-800 mb-3">{question.question}</p>
                          
                          {userAnswer !== null ? (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-600">Your Answer: </span>
                              <span className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                {userAnswer}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                              <span className="text-sm text-gray-600 italic">No answer recorded for this question.</span>
                            </div>
                          )}
                          
                          {!isCorrect && question.correctAnswer && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-600">Correct Answer: </span>
                              <span className="text-sm text-green-600">{question.correctAnswer}</span>
                            </div>
                          )}
                          
                          {question.explanation && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                              <span className="text-sm font-medium text-blue-800">Explanation: </span>
                              <span className="text-sm text-blue-700">{question.explanation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center">
                  <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Question Details Available</h3>
                  <p className="text-gray-600">
                    Question details are not available for this quiz attempt.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Debug Information - Remove this in production */}
          {process.env.NODE_ENV === 'development' && quizAttempt && (
            <div className="bg-gray-100 rounded-xl p-4 mt-8">
              <h3 className="font-semibold mb-2">Debug Information:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify({
                  answers: quizAttempt.answers,
                  userAnswers: (quizAttempt as any).userAnswers,
                  questionsCount: quizAttempt.questions?.length,
                  firstQuestionId: quizAttempt.questions?.[0]?.id
                }, null, 2)}
              </pre>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center mt-8">
            <button
              onClick={() => router.push('/quiz/create')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}