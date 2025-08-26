import Cookies from 'js-cookie';
import { User, QuizAttempt } from './types';

export const STORAGE_KEYS = {
  USER: 'study_buddy_user',
  QUIZ_HISTORY: 'study_buddy_quiz_history',
  SETTINGS: 'study_buddy_settings',
} as const;

export class StorageManager {
  static setUser(user: User): void {
    Cookies.set(STORAGE_KEYS.USER, JSON.stringify(user), { expires: 365 });
  }

  static getUser(): User | null {
    const userStr = Cookies.get(STORAGE_KEYS.USER);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static updateUserXP(additionalXP: number): User | null {
    const user = this.getUser();
    if (!user) return null;
    
    user.xp += additionalXP;
    this.setUser(user);
    return user;
  }

  static addQuizAttempt(attempt: QuizAttempt): void {
    try {
      const history = this.getQuizHistory();
      history.unshift(attempt);
      // Keep only last 50 attempts
      const trimmedHistory = history.slice(0, 50);
      
      // Use localStorage instead of cookies for quiz history (larger size limit)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(trimmedHistory));
      }
    } catch (error) {
      console.error('Failed to save quiz attempt:', error);
      // Fallback: try to save without the large data fields
      try {
        const lightAttempt = {
          id: attempt.id,
          quizId: attempt.quizId,
          userId: attempt.userId,
          answers: attempt.answers,
          score: attempt.score,
          totalQuestions: attempt.totalQuestions,
          timeSpent: attempt.timeSpent,
          xpEarned: attempt.xpEarned,
          completedAt: attempt.completedAt,
        };
        
        const history = this.getQuizHistory();
        history.unshift(lightAttempt as QuizAttempt);
        const trimmedHistory = history.slice(0, 50);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(trimmedHistory));
        }
      } catch (fallbackError) {
        console.error('Failed to save even lightweight quiz attempt:', fallbackError);
      }
    }
  }

  static getQuizHistory(): QuizAttempt[] {
    try {
      // Try localStorage first
      if (typeof window !== 'undefined') {
        const historyStr = localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY);
        if (historyStr) {
          return JSON.parse(historyStr);
        }
      }
      
      // Fallback to cookies for backward compatibility
      const historyStr = Cookies.get(STORAGE_KEYS.QUIZ_HISTORY);
      if (!historyStr) return [];
      return JSON.parse(historyStr);
    } catch {
      return [];
    }
  }

  static clearAllData(): void {
    // Clear cookies
    Object.values(STORAGE_KEYS).forEach(key => {
      Cookies.remove(key);
    });
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    }
  }

  static isOnboarded(): boolean {
    return this.getUser() !== null;
  }
}