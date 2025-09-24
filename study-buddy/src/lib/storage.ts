import { User, QuizAttempt, StudyNote, ResearchRequest } from './types';

export const STORAGE_KEYS = {
  USER: 'study_buddy_user',
  QUIZ_HISTORY: 'study_buddy_quiz_history',
  SETTINGS: 'study_buddy_settings',
  STUDY_NOTES: 'study_buddy_study_notes',
  RESEARCH_REQUESTS: 'study_buddy_research_requests',
} as const;

// Simple cookie utilities to replace js-cookie
const CookieUtils = {
  set: (name: string, value: string, days = 365) => {
    if (typeof window === 'undefined') return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  },
  
  get: (name: string): string | undefined => {
    if (typeof window === 'undefined') return undefined;
    
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return undefined;
  },
  
  remove: (name: string) => {
    if (typeof window === 'undefined') return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }
};

export class StorageManager {
  static setUser(user: User): void {
    CookieUtils.set(STORAGE_KEYS.USER, JSON.stringify(user), 365);
  }

  static getUser(): User | null {
    const userStr = CookieUtils.get(STORAGE_KEYS.USER);
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
        const lightAttempt: QuizAttempt = {
          id: attempt.id,
          quizId: attempt.quizId,
          userId: attempt.userId,
          answers: attempt.answers,
          questions: attempt.questions,
          score: attempt.score,
          totalQuestions: attempt.totalQuestions,
          timeSpent: attempt.timeSpent,
          xpEarned: attempt.xpEarned,
          completedAt: attempt.completedAt,
          results: attempt.results || [], // Include required results property
          settings: attempt.settings || {}, // Include required settings property
        };
        
        const history = this.getQuizHistory();
        history.unshift(lightAttempt);
        const trimmedHistory = history.slice(0, 50);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(trimmedHistory));
        }
      } catch (fallbackError) {
        console.error('Failed to save even lightweight quiz attempt:', fallbackError);
        // Last resort: save minimal data but ensure compatibility
        try {
          const minimalAttempt: QuizAttempt = {
            id: attempt.id,
            quizId: attempt.quizId || '',
            userId: attempt.userId,
            answers: attempt.answers || {},
            questions: attempt.questions || [],
            score: attempt.score,
            totalQuestions: attempt.totalQuestions,
            timeSpent: attempt.timeSpent,
            xpEarned: attempt.xpEarned,
            completedAt: attempt.completedAt,
            results: attempt.results || [], // Include required results property
            settings: attempt.settings || {}, // Include required settings property
          };
          
          const history = this.getQuizHistory();
          history.unshift(minimalAttempt);
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
            // Ensure all required properties exist
            answers: attempt.answers || {},
            questions: attempt.questions || [],
            results: attempt.results || [],
            settings: attempt.settings || {},
          }));
        }
      }
      
      // Fallback to cookies for backward compatibility
      const historyStr = CookieUtils.get(STORAGE_KEYS.QUIZ_HISTORY);
      if (!historyStr) return [];
      const history = JSON.parse(historyStr);
      // Apply same normalization for cookie data
      return history.map((attempt: any) => ({
        ...attempt,
        answers: attempt.answers || {},
        questions: attempt.questions || [],
        results: attempt.results || [],
        settings: attempt.settings || {},
      }));
    } catch {
      return [];
    }
  }

  // Study Notes Management
  static addStudyNote(note: StudyNote): void {
    try {
      const notes = this.getStudyNotes();
      notes.unshift(note);
      // Keep only last 100 notes
      const trimmedNotes = notes.slice(0, 100);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.STUDY_NOTES, JSON.stringify(trimmedNotes));
      }
    } catch (error) {
      console.error('Failed to save study note:', error);
    }
  }

  static getStudyNotes(): StudyNote[] {
    try {
      if (typeof window !== 'undefined') {
        const notesStr = localStorage.getItem(STORAGE_KEYS.STUDY_NOTES);
        if (notesStr) {
          return JSON.parse(notesStr);
        }
      }
      return [];
    } catch {
      return [];
    }
  }

  static getStudyNoteById(id: string): StudyNote | null {
    const notes = this.getStudyNotes();
    return notes.find(note => note.id === id) || null;
  }

  static updateStudyNote(updatedNote: StudyNote): void {
    try {
      const notes = this.getStudyNotes();
      const index = notes.findIndex(note => note.id === updatedNote.id);
      if (index !== -1) {
        notes[index] = { ...updatedNote, updatedAt: new Date().toISOString() };
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.STUDY_NOTES, JSON.stringify(notes));
        }
      }
    } catch (error) {
      console.error('Failed to update study note:', error);
    }
  }

  static deleteStudyNote(id: string): void {
    try {
      const notes = this.getStudyNotes();
      const filteredNotes = notes.filter(note => note.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.STUDY_NOTES, JSON.stringify(filteredNotes));
      }
    } catch (error) {
      console.error('Failed to delete study note:', error);
    }
  }

  // Research Requests Management (for tracking long-running API calls)
  static addResearchRequest(request: ResearchRequest): void {
    try {
      const requests = this.getResearchRequests();
      requests.unshift(request);
      // Keep only last 50 requests
      const trimmedRequests = requests.slice(0, 50);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.RESEARCH_REQUESTS, JSON.stringify(trimmedRequests));
      }
    } catch (error) {
      console.error('Failed to save research request:', error);
    }
  }

  static getResearchRequests(): ResearchRequest[] {
    try {
      if (typeof window !== 'undefined') {
        const requestsStr = localStorage.getItem(STORAGE_KEYS.RESEARCH_REQUESTS);
        if (requestsStr) {
          return JSON.parse(requestsStr);
        }
      }
      return [];
    } catch {
      return [];
    }
  }

  static updateResearchRequest(updatedRequest: ResearchRequest): void {
    try {
      const requests = this.getResearchRequests();
      const index = requests.findIndex(req => req.id === updatedRequest.id);
      if (index !== -1) {
        requests[index] = updatedRequest;
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.RESEARCH_REQUESTS, JSON.stringify(requests));
        }
      }
    } catch (error) {
      console.error('Failed to update research request:', error);
    }
  }

  static getResearchRequestById(id: string): ResearchRequest | null {
    const requests = this.getResearchRequests();
    return requests.find(req => req.id === id) || null;
  }

  static clearAllData(): void {
    // Clear cookies
    Object.values(STORAGE_KEYS).forEach(key => {
      CookieUtils.remove(key);
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