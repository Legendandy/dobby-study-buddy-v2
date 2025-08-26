'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StorageManager } from '@/lib/storage';
import type { User, Question, QuizSettings } from '@/lib/types';
import { 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  Flag,
  CheckCircle2,
  AlertCircle,
  Play,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

interface QuizData {
  questions: Question[];
  settings: QuizSettings;
  quizId: string;
}

export default function TakeQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams?.get('id');
  const pageRef = useRef<HTMLDivElement>(null);
  const heartbeatRef = useRef<NodeJS.Timeout>();
  const visibilityCheckRef = useRef<NodeJS.Timeout>();

  const [user, setUser] = useState<User | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [securityViolations, setSecurityViolations] = useState<string[]>([]);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [suspiciousActivity, setSuspiciousActivity] = useState(0);
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());
  const [disableInteractions, setDisableInteractions] = useState(false);

  // More reliable visibility and focus detection
  useEffect(() => {
    if (!quizStarted) return;

    let tabSwitchCount = 0;
    let focusLossCount = 0;
    const maxViolations = 3;

    // Document visibility API - more reliable
    const handleVisibilityChange = () => {
      const isHidden = document.hidden;
      setIsPageVisible(!isHidden);
      
      if (isHidden) {
        tabSwitchCount++;
        const violation = `Tab/window switched (${tabSwitchCount})`;
        setSecurityViolations(prev => [...prev, violation]);
        
        if (tabSwitchCount >= maxViolations) {
          toast.error(`Too many tab switches (${tabSwitchCount}). Submitting quiz automatically.`);
          setTimeout(() => handleSubmitQuiz(), 1000);
        } else {
          toast.error(`Tab switch detected! Warning ${tabSwitchCount}/${maxViolations}`);
        }
      }
    };

    // Window focus/blur - backup detection
    const handleFocus = () => {
      setIsPageVisible(true);
      setLastActiveTime(Date.now());
    };

    const handleBlur = () => {
      focusLossCount++;
      const violation = `Window focus lost (${focusLossCount})`;
      setSecurityViolations(prev => [...prev, violation]);
      
      if (focusLossCount >= maxViolations) {
        toast.error(`Too many focus losses. Submitting quiz automatically.`);
        setTimeout(() => handleSubmitQuiz(), 1000);
      }
    };

    // Mouse leave detection (when cursor leaves browser window)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 || e.clientX <= 0 || 
          e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        const violation = `Mouse left browser window`;
        setSecurityViolations(prev => [...prev, violation]);
        toast.error('Cursor left browser window - suspicious activity detected');
        setSuspiciousActivity(prev => prev + 1);
      }
    };

    // Prevent right-click more aggressively
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const violation = `Right-click attempted`;
      setSecurityViolations(prev => [...prev, violation]);
      toast.error('Right-click is disabled during quiz');
      return false;
    };

    // Keyboard event blocking with better detection
    const handleKeyDown = (e: KeyboardEvent) => {
      const blockedKeys = [
        'F12',
        'F5',
        'F1', // Help
        'PrintScreen',
      ];

      const blockedCombinations = [
        { ctrl: true, key: 'r' }, // Refresh
        { ctrl: true, key: 'R' },
        { ctrl: true, key: 'c' }, // Copy
        { ctrl: true, key: 'C' },
        { ctrl: true, key: 'v' }, // Paste
        { ctrl: true, key: 'V' },
        { ctrl: true, key: 'a' }, // Select All
        { ctrl: true, key: 'A' },
        { ctrl: true, key: 's' }, // Save
        { ctrl: true, key: 'S' },
        { ctrl: true, key: 'p' }, // Print
        { ctrl: true, key: 'P' },
        { ctrl: true, key: 'u' }, // View Source
        { ctrl: true, key: 'U' },
        { ctrl: true, key: 'f' }, // Find
        { ctrl: true, key: 'F' },
        { ctrl: true, shift: true, key: 'I' }, // Dev Tools
        { ctrl: true, shift: true, key: 'i' },
        { ctrl: true, shift: true, key: 'J' }, // Console
        { ctrl: true, shift: true, key: 'j' },
        { ctrl: true, shift: true, key: 'C' }, // Inspector
        { ctrl: true, shift: true, key: 'c' },
        { alt: true, key: 'Tab' }, // Alt-Tab
        { alt: true, key: 'F4' }, // Close window
      ];

      // Check blocked keys
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        const violation = `Blocked key pressed: ${e.key}`;
        setSecurityViolations(prev => [...prev, violation]);
        
        if (e.key === 'F5') {
          toast.error('Page refresh blocked - submitting quiz');
          setTimeout(() => handleSubmitQuiz(), 500);
        } else {
          toast.error(`Key ${e.key} is blocked during quiz`);
        }
        return false;
      }

      // Check blocked combinations
      const isBlocked = blockedCombinations.some(combo => {
        return (!combo.ctrl || e.ctrlKey) && 
               (!combo.shift || e.shiftKey) && 
               (!combo.alt || e.altKey) && 
               combo.key === e.key;
      });

      if (isBlocked) {
        e.preventDefault();
        e.stopPropagation();
        const violation = `Blocked combination: ${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.altKey ? 'Alt+' : ''}${e.key}`;
        setSecurityViolations(prev => [...prev, violation]);
        
        if ((e.ctrlKey && e.key.toLowerCase() === 'r') || e.key === 'F5') {
          toast.error('Page refresh blocked - submitting quiz');
          setTimeout(() => handleSubmitQuiz(), 500);
        } else {
          toast.error('This keyboard shortcut is blocked during quiz');
        }
        return false;
      }
    };

    // Block drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      const violation = `Drag operation attempted`;
      setSecurityViolations(prev => [...prev, violation]);
    };

    // Block text selection on sensitive areas
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && typeof target.closest === 'function' && target.closest('.quiz-content')) {
        e.preventDefault();
        const violation = `Text selection attempted on quiz content`;
        setSecurityViolations(prev => [...prev, violation]);
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('selectstart', handleSelectStart);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, [quizStarted]);

  // Enhanced activity monitoring
  useEffect(() => {
    if (!quizStarted) return;

    // Heartbeat to detect if user is still active
    heartbeatRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActiveTime;
      
      // If no activity for 30 seconds, mark as suspicious
      if (timeSinceLastActivity > 30000) {
        const violation = `No activity detected for ${Math.floor(timeSinceLastActivity / 1000)} seconds`;
        setSecurityViolations(prev => [...prev, violation]);
        setSuspiciousActivity(prev => prev + 1);
        setLastActiveTime(now); // Reset to avoid spam
      }
    }, 10000); // Check every 10 seconds

    // More frequent visibility checks
    visibilityCheckRef.current = setInterval(() => {
      if (document.hidden && isPageVisible) {
        setIsPageVisible(false);
      } else if (!document.hidden && !isPageVisible) {
        setIsPageVisible(true);
      }
    }, 1000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (visibilityCheckRef.current) clearInterval(visibilityCheckRef.current);
    };
  }, [quizStarted, lastActiveTime, isPageVisible]);

  // Track mouse and keyboard activity
  useEffect(() => {
    if (!quizStarted) return;

    const updateActivity = () => {
      setLastActiveTime(Date.now());
    };

    document.addEventListener('mousemove', updateActivity);
    document.addEventListener('keypress', updateActivity);
    document.addEventListener('click', updateActivity);
    document.addEventListener('scroll', updateActivity);

    return () => {
      document.removeEventListener('mousemove', updateActivity);
      document.removeEventListener('keypress', updateActivity);
      document.removeEventListener('click', updateActivity);
      document.removeEventListener('scroll', updateActivity);
    };
  }, [quizStarted]);

  // Auto-submit on excessive violations
  useEffect(() => {
    if (suspiciousActivity >= 5 || securityViolations.length >= 10) {
      toast.error('Excessive security violations detected. Submitting quiz automatically.');
      setDisableInteractions(true);
      setTimeout(() => handleSubmitQuiz(), 2000);
    }
  }, [suspiciousActivity, securityViolations]);

  // Validate question data
  const validateQuestion = (question: Question, index: number): string[] => {
    const errors: string[] = [];
    
    if (!question.id) {
      errors.push(`Question ${index + 1}: Missing ID`);
    }
    
    if (!question.question || question.question.trim() === '') {
      errors.push(`Question ${index + 1}: Missing question text`);
    }
    
    if (!question.type) {
      errors.push(`Question ${index + 1}: Missing question type`);
    }
    
    if (!question.correctAnswer || question.correctAnswer.trim() === '') {
      errors.push(`Question ${index + 1}: Missing correct answer`);
    }
    
    // Type-specific validation
    if (question.type === 'multiple-choice') {
      if (!question.options || question.options.length === 0) {
        errors.push(`Question ${index + 1}: Multiple choice question has no options`);
      } else if (!question.options.includes(question.correctAnswer)) {
        errors.push(`Question ${index + 1}: Correct answer "${question.correctAnswer}" not found in options`);
        console.log(`Available options:`, question.options);
      }
    }
    
    if (question.type === 'true-false') {
      if (!['True', 'False', 'true', 'false'].includes(question.correctAnswer)) {
        errors.push(`Question ${index + 1}: True/False question must have "True" or "False" as correct answer, got "${question.correctAnswer}"`);
      }
    }
    
    return errors;
  };

  // Load quiz data
  useEffect(() => {
    console.log('🔍 TAKE QUIZ - Loading quiz data...');
    console.log('Quiz ID from URL:', quizId);
    
    const currentUser = StorageManager.getUser();
    if (!currentUser) {
      console.log('❌ No user found, redirecting to onboarding');
      router.push('/onboarding');
      return;
    }
    console.log('✅ User found:', currentUser.name);
    setUser(currentUser);

    // Get quiz data from session storage
    const storedQuiz = sessionStorage.getItem('currentQuiz');
    console.log('📦 Raw stored quiz data:', storedQuiz);
    
    if (storedQuiz) {
      try {
        const parsedQuiz = JSON.parse(storedQuiz);
        console.log('📋 Parsed quiz object:', parsedQuiz);
        console.log('🔢 Questions in parsed quiz:', parsedQuiz.questions?.length);
        
        if (parsedQuiz.questions && parsedQuiz.questions.length > 0) {
          console.log('📝 First question details:', parsedQuiz.questions[0]);
          
          // Validate all questions
          const allErrors: string[] = [];
          parsedQuiz.questions.forEach((question: Question, index: number) => {
            const questionErrors = validateQuestion(question, index);
            allErrors.push(...questionErrors);
            
            if (questionErrors.length > 0) {
              console.error(`❌ Question ${index + 1} validation errors:`, questionErrors);
            }
          });
          
          if (allErrors.length > 0) {
            setValidationErrors(allErrors);
            console.error('❌ Quiz validation failed with errors:', allErrors);
          }
        }
        
        const quizData = {
          questions: parsedQuiz.questions || [],
          settings: parsedQuiz.settings,
          quizId: parsedQuiz.quizId,
        };
        
        console.log('✅ Quiz data prepared:', {
          questionsCount: quizData.questions.length,
          settings: quizData.settings,
          quizId: quizData.quizId
        });
        
        setQuizData(quizData);
        
        // Calculate total time: number of questions × time per question
        const totalTimeInSeconds = quizData.questions.length * quizData.settings.timePerQuestion;
        console.log('⏰ Total time calculated:', totalTimeInSeconds, 'seconds');
        setTimeRemaining(totalTimeInSeconds);
      } catch (error) {
        console.error('❌ Error loading quiz data:', error);
        toast.error('Failed to load quiz');
        router.push('/quiz/create');
      }
    } else {
      console.log('❌ No stored quiz found, redirecting to create');
      router.push('/quiz/create');
    }
  }, [router, quizId]);

  // Auto-submit when total timer reaches zero
  const handleTimeUp = useCallback(() => {
    if (!isSubmitting && quizStarted) {
      toast.error('Time is up! Submitting quiz automatically.');
      handleSubmitQuiz();
    }
  }, [isSubmitting, quizStarted]);

  // Timer logic with warning
  useEffect(() => {
    if (!quizStarted || !quizData || timeRemaining <= 0) return;

    const totalTime = quizData.questions.length * quizData.settings.timePerQuestion;
    const warningThreshold = Math.floor(totalTime * 0.25); // 25% remaining

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setTimeout(handleTimeUp, 100);
          return 0;
        }
        
        // Show warning at 25% time remaining
        if (prev === warningThreshold && !showTimeWarning) {
          setShowTimeWarning(true);
          toast.error(`⚠️ Warning: Only ${Math.floor(warningThreshold / 60)} minutes remaining!`, {
            duration: 5000
          });
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, quizData, timeRemaining, handleTimeUp, showTimeWarning]);

  const startQuiz = () => {
    if (!quizData) return;
    
    if (validationErrors.length > 0) {
      toast.error('Cannot start quiz: there are validation errors');
      return;
    }
    
    console.log('🚀 Starting quiz with', quizData.questions.length, 'questions');
    
    setQuizStarted(true);
    setStartTime(new Date());
    setLastActiveTime(Date.now());
    
    toast.success('Quiz started!', {
      duration: 3000
    });
  };

  const handleAnswerChange = (answer: string) => {
    if (!quizData || disableInteractions) return;

    const currentQuestion = quizData.questions[currentQuestionIndex];
    console.log('✏️ Answer changed for question', currentQuestion.id, ':', answer);
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
    
    setLastActiveTime(Date.now());
  };

  const nextQuestion = useCallback(() => {
    if (!quizData || disableInteractions) return;

    if (currentQuestionIndex < quizData.questions.length - 1) {
      console.log('➡️ Moving to next question:', currentQuestionIndex + 1);
      setCurrentQuestionIndex(prev => prev + 1);
      setLastActiveTime(Date.now());
    }
  }, [currentQuestionIndex, quizData, disableInteractions]);

  const previousQuestion = () => {
    if (currentQuestionIndex > 0 && !disableInteractions) {
      console.log('⬅️ Moving to previous question:', currentQuestionIndex - 1);
      setCurrentQuestionIndex(prev => prev - 1);
      setLastActiveTime(Date.now());
    }
  };

  const handleSubmitQuiz = useCallback(async () => {
    if (!quizData || !user || !startTime || isSubmitting) return;

    console.log('📤 Submitting quiz with answers:', answers);
    console.log('🔒 Security violations during quiz:', securityViolations);
    setIsSubmitting(true);
    
    try {
      const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      
      const response = await fetch('/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quizData.quizId,
          userId: user.id,
          answers,
          questions: quizData.questions,
          timeSpent,
          settings: quizData.settings,
          securityViolations,
          suspiciousActivityCount: suspiciousActivity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const result = await response.json();
      console.log('✅ Quiz submission successful:', result);
      
      // Store quiz attempt in local storage
      StorageManager.addQuizAttempt(result.attempt);
      
      // Update user XP
      StorageManager.updateUserXP(result.attempt.xpEarned);

      // Store results for results page
      sessionStorage.setItem('quizResults', JSON.stringify(result));
      
      router.push('/quiz/results');
    } catch (error) {
      console.error('❌ Error submitting quiz:', error);
      toast.error('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [quizData, user, answers, startTime, router, isSubmitting, securityViolations, suspiciousActivity]);

  if (!user || !quizData) {
    console.log('⏳ Still loading - User:', !!user, 'QuizData:', !!quizData);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Show validation errors if any
  if (validationErrors.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Validation Failed</h1>
            <p className="text-gray-600">The quiz contains errors that need to be fixed:</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <ul className="space-y-2">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-red-800 text-sm flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  {error}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push('/quiz/create')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Quiz
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalTimeInSeconds = quizData.questions.length * quizData.settings.timePerQuestion;
  const totalTimeInMinutes = Math.ceil(totalTimeInSeconds / 60);

  if (!quizStarted) {
    console.log('📋 Showing quiz start screen for', quizData.questions.length, 'questions');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Play className="text-white" size={24} />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start?</h1>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Questions:</span>
              <span className="font-semibold">{quizData.questions.length}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Time per question:</span>
              <span className="font-semibold">{quizData.settings.timePerQuestion}s</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <span className="text-blue-800 font-medium">Total time available:</span>
              <span className="font-bold text-blue-900">
                {totalTimeInMinutes} minutes ({Math.floor(totalTimeInSeconds / 60)}:{(totalTimeInSeconds % 60).toString().padStart(2, '0')})
              </span>
            </div>
          </div>

          {/* Quiz Rules */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2 mb-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
              <h3 className="font-semibold text-blue-800 text-sm">Quiz Rules & Guidelines</h3>
            </div>
            
            <div className="text-xs text-blue-800 space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg leading-none">•</span>
                <span>Total time: {totalTimeInMinutes} minutes for all {quizData.questions.length} questions</span>
              </div>
              
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg leading-none">•</span>
                <span>Navigate freely between questions and review answers</span>
              </div>
              
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg leading-none">•</span>
                <span>Quiz auto-submits when timer reaches zero</span>
              </div>
              
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-lg leading-none">•</span>
                <span>Warning notification at 25% time remaining</span>
              </div>
              
              <div className="flex items-start space-x-2">
                <span className="text-red-600 text-lg leading-none">•</span>
                <span>Leaving the quiz page will automatically submit your answers</span>
              </div>
              
              <div className="flex items-start space-x-2">
                <span className="text-red-600 text-lg leading-none">•</span>
                <span>Right-click, dragging your mouse, and keyboard shortcuts are disabled during quiz</span>
              </div>
              
              <div className="flex items-start space-x-2">
                <span className="text-red-600 text-lg leading-none">•</span>
                <span>10 warnings will automatically submit your quiz</span>
              </div>
            </div>
          </div>

          <button
            onClick={startQuiz}
            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
          >
            <Play size={20} className="mr-2" />
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
  const currentAnswer = answers[currentQuestion.id] || '';

  return (
    <div ref={pageRef} className={`min-h-screen bg-gray-50 ${disableInteractions ? 'pointer-events-none opacity-50' : ''}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {quizData.questions.length}
              </div>
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Violation Counter */}
              {securityViolations.length > 0 && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                  <AlertCircle size={12} />
                  <span>{securityViolations.length} warnings</span>
                </div>
              )}

              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                timeRemaining <= 60 ? 'bg-red-100 text-red-700 animate-pulse' : 
                timeRemaining <= (quizData.questions.length * quizData.settings.timePerQuestion * 0.25) ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                <Clock size={16} />
                <span className="font-mono font-semibold">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>

              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting || disableInteractions}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Flag size={16} />
                <span>Submit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 quiz-content">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900" style={{ userSelect: 'none' }}>
              {currentQuestion.question}
            </h2>
            <div className="text-sm text-gray-500">
              Total time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div className="space-y-4">
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options && currentQuestion.options.length > 0 && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerChange(option)}
                    disabled={disableInteractions}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all disabled:opacity-50 ${
                      currentAnswer === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    style={{ userSelect: 'none' }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        currentAnswer === option
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {currentAnswer === option && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <span className="font-medium text-gray-700">
                        {String.fromCharCode(65 + index)}. {option}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'true-false' && (
              <div className="grid grid-cols-2 gap-4">
                {['True', 'False'].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswerChange(option)}
                    disabled={disableInteractions}
                    className={`p-6 rounded-lg border-2 transition-all disabled:opacity-50 ${
                      currentAnswer === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    style={{ userSelect: 'none' }}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">
                        {option === 'True' ? '✓' : '✗'}
                      </div>
                      <div className="font-semibold text-gray-900">{option}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'fill-in-blank' && (
              <div>
                <input
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Type your answer here..."
                  disabled={disableInteractions}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:opacity-50"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-2">
                  Fill in the blank with the most appropriate answer
                </p>
              </div>
            )}

            {/* Show error if question type not supported */}
            {!['multiple-choice', 'true-false', 'fill-in-blank'].includes(currentQuestion.type) && (
              <div className="text-red-600 p-4 border border-red-200 rounded-lg">
                Error: Unsupported question type "{currentQuestion.type}"
              </div>
            )}

            {/* Show error if multiple choice has no options */}
            {currentQuestion.type === 'multiple-choice' && (!currentQuestion.options || currentQuestion.options.length === 0) && (
              <div className="text-red-600 p-4 border border-red-200 rounded-lg">
                Error: Multiple choice question has no options available
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0 || disableInteractions}
            className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={20} />
            <span>Previous</span>
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              {Object.keys(answers).length} of {quizData.questions.length} answered
            </p>
            <div className="flex space-x-1">
              {quizData.questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentQuestionIndex
                      ? 'bg-blue-500'
                      : answers[quizData.questions[index].id]
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {currentQuestionIndex === quizData.questions.length - 1 && (
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting || disableInteractions}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle2 size={20} />
                )}
                <span>{isSubmitting ? 'Submitting...' : 'Submit Quiz'}</span>
              </button>
            )}
            
            <button
              onClick={nextQuestion}
              disabled={currentQuestionIndex === quizData.questions.length - 1 || disableInteractions}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Disabled Overlay */}
        {disableInteractions && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center max-w-md">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Submitting Quiz</h2>
              <p className="text-gray-600">
                Your quiz is being submitted automatically. Please wait...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}