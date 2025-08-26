export interface User {
  id: string;
  name: string;
  age: number;
  educationLevel: 'highschool' | 'undergraduate' | 'postgraduate';
  grade?: string; // For highschool
  major?: string; // For undergraduate/postgraduate
  xp: number;
  createdAt: Date;
}

export interface QuizSettings {
  questionType: 'multiple-choice' | 'fill-in-blank' | 'true-false' | 'mixed';
  maxQuestions: number;
  timePerQuestion: number; // in seconds
  customInstructions?: string;
}

export interface Question {
  id: string;
  question: string;
  type: 'multiple-choice' | 'fill-in-blank' | 'true-false';
  options?: string[]; // For multiple choice
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  userId: string;
  questions: Question[];
  settings: QuizSettings;
  sourceNotes: string;
  createdAt: Date;
}

export interface QuizResult {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, string>;
  score: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  xpEarned: number;
  completedAt: Date;
  // Add these fields for complete quiz history
  questions: Question[];
  results: QuizResult[];
  settings: QuizSettings;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  quizzesCompleted: number;
}