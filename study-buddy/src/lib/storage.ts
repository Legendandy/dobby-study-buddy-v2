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
      // Fallback: try to save without the large data fields but preserve essential structure
      try {
        const lightAttempt = {
          id: attempt.id,
          quizId: attempt.quizId,
          userId: attempt.userId,
          // Fix: Keep both field names for compatibility
          answers: attempt.answers,
          userAnswers: attempt.userAnswers || attempt.answers,  // Ensure userAnswers exists
          // Keep questions but maybe limit them
          questions: attempt.questions,
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
        // Last resort: save minimal data but ensure compatibility
        try {
          const minimalAttempt = {
            id: attempt.id,
            quizId: attempt.quizId || '',
            userId: attempt.userId,
            answers: attempt.answers || {},
            userAnswers: attempt.userAnswers || attempt.answers || {},
            questions: attempt.questions || [],
            score: attempt.score,
            totalQuestions: attempt.totalQuestions,
            timeSpent: attempt.timeSpent,
            xpEarned: attempt.xpEarned,
            completedAt: attempt.completedAt,
          };
          
          const history = this.getQuizHistory();
          history.unshift(minimalAttempt as QuizAttempt);
          const trimmedHistory = history.slice(0, 30); // Reduce to 30 for space
          
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(trimmedHistory));
          }
        } catch (finalError) {
          console.error('Complete failure to save quiz attempt:', finalError);
        }
      }
    }
  }

  static getQuizHistory(): QuizAttempt[] {
    try {
      // Try localStorage first
      if (typeof window !== 'undefined') {
        const historyStr = localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY);
        if (historyStr) {
          const history = JSON.parse(historyStr);
          // Fix: Ensure backward compatibility by normalizing data structure
          return history.map((attempt: any) => ({
            ...attempt,
            // If userAnswers doesn't exist but answers does, use answers
            userAnswers: attempt.userAnswers || attempt.answers || {},
            questions: attempt.questions || [],
          }));
        }
      }
      
      // Fallback to cookies for backward compatibility
      const historyStr = Cookies.get(STORAGE_KEYS.QUIZ_HISTORY);
      if (!historyStr) return [];
      const history = JSON.parse(historyStr);
      // Apply same normalization for cookie data
      return history.map((attempt: any) => ({
        ...attempt,
        userAnswers: attempt.userAnswers || attempt.answers || {},
        questions: attempt.questions || [],
      }));
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