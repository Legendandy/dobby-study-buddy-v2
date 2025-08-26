'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { StorageManager } from '@/lib/storage';
import type { User, QuizAttempt } from '@/lib/types';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award,
  Target,
  RotateCcw,
  BookOpen
} from 'lucide-react';

export default function QuizReviewPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [quiz, setQuiz] = useState<QuizAttempt | null>(null);
  const [results, setResults] = useState<Array<{
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = StorageManager.getUser();
    if (!currentUser) {
      router.push('/onboarding');
      return;
    }
    setUser(currentUser);

    // Get quiz details from session storage or fetch
    const storedQuiz = sessionStorage.getItem('viewingQuiz');
    if (storedQuiz) {
      const parsedQuiz = JSON.parse(storedQuiz);
      setQuiz(parsedQuiz);
      
      // In a real app, you'd fetch the detailed results from API
      // For now, we'll simulate the results structure
      const mockResults = generateMockResults(parsedQuiz);
      setResults(mockResults);
    }
    
    setIsLoading(false);
  }, [router, params.id]);

  const generateMockResults = (quizAttempt: QuizAttempt) => {
    // This would normally come from your API with the actual quiz questions
    const mockQuestions = Array.from({ length: quizAttempt.totalQuestions }, (_, i) => ({
      questionId: `q${i + 1}`,
      question: `Sample Question ${i + 1}: What is the correct answer for this concept?`,
      userAnswer: Math.random() > 0.3 ? 'User provided answer' : '',
      correctAnswer: 'The correct answer',
      isCorrect: Math.random() > 0.3,
      explanation: `This is the explanation for question ${i + 1}. It provides context about why this is the correct answer and helps reinforce learning.`
    }));

    // Ensure the correct number of correct answers matches the quiz score
    let correctCount = 0;
    return mockQuestions.map((q, i) => {
      const shouldBeCorrect = correctCount < quizAttempt.score;
      if (shouldBeCorrect) correctCount++;
      
      return {
        ...q,
        isCorrect: shouldBeCorrect || (i >= quizAttempt.score && Math.random() > 0.7)
      };
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const retakeQuiz = () => {
    router.push('/quiz/create');
  };

  if (!user || isLoading) {
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

  if (!quiz) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quiz not found</h3>
            <p className="text-gray-600 mb-4">The quiz you're looking for could not be loaded.</p>
            <button
              onClick={() => router.push('/history')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to History
            </button>
          </div>
        </div>
      </div>
    );
  }

  const percentage = Math.round((quiz.score / quiz.totalQuestions) * 100);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push('/history')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to History</span>
            </button>
            
            <button
              onClick={retakeQuiz}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RotateCcw size={16} />
              <span>Retake Quiz</span>
            </button>
          </div>

          {/* Quiz Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Quiz Review: {quiz.id.slice(0, 8)}
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2 mx-auto">
                  <Target className="text-blue-600" size={24} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{percentage}%</p>
                <p className="text-gray-600 text-sm">Score</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2 mx-auto">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{quiz.score}/{quiz.totalQuestions}</p>
                <p className="text-gray-600 text-sm">Correct</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-2 mx-auto">
                  <Clock className="text-purple-600" size={24} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatTime(quiz.timeSpent)}</p>
                <p className="text-gray-600 text-sm">Time Spent</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-2 mx-auto">
                  <Award className="text-yellow-600" size={24} />
                </div>
                <p className="text-2xl font-bold text-gray-900">+{quiz.xpEarned}</p>
                <p className="text-gray-600 text-sm">XP Earned</p>
              </div>
            </div>
          </div>

          {/* Questions Review */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Question Review</h2>
            
            {results.map((result, index) => (
              <div
                key={result.questionId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className={`p-4 ${result.isCorrect ? 'bg-green-50 border-b border-green-200' : 'bg-red-50 border-b border-red-200'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Question {index + 1}</h3>
                    <div className="flex items-center space-x-2">
                      {result.isCorrect ? (
                        <CheckCircle className="text-green-600" size={20} />
                      ) : (
                        <XCircle className="text-red-600" size={20} />
                      )}
                      <span className={`text-sm font-medium ${result.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {result.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-900 font-medium mb-4">{result.question}</p>
                  
                  <div className="space-y-4">
                    {result.userAnswer && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Your Answer:</p>
                        <p className={`p-3 rounded-lg ${result.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                          {result.userAnswer}
                        </p>
                      </div>
                    )}
                    
                    {!result.isCorrect && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Correct Answer:</p>
                        <p className="p-3 bg-green-50 text-green-800 rounded-lg">
                          {result.correctAnswer}
                        </p>
                      </div>
                    )}
                    
                    {result.explanation && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Explanation:</p>
                        <p className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                          {result.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={() => router.push('/history')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to History
            </button>
            <button
              onClick={retakeQuiz}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Take Another Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}