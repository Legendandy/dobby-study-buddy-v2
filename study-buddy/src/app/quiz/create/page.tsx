'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { StorageManager } from '@/lib/storage';
import type { User, QuizSettings } from '@/lib/types';
import { 
  FileText, 
  Settings as SettingsIcon, 
  Play,
  ArrowRight,
  Clock,
  Hash,
  Type,
  MessageSquare,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

// Add a proper type definition for the question object
interface Question {
  id: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
}

export default function CreateQuizPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState('');
  const [hasImportedNotes, setHasImportedNotes] = useState(false);
  const [settings, setSettings] = useState<QuizSettings>({
    questionType: 'mixed',
    maxQuestions: 10,
    timePerQuestion: 30,
    customInstructions: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    console.log('🚨 DEBUG VERSION LOADED - This should appear in console');
    const currentUser = StorageManager.getUser();
    if (!currentUser) {
      router.push('/onboarding');
      return;
    }
    setUser(currentUser);

    // Check for imported notes from study notes page
    const importedNotes = sessionStorage.getItem('importedNotes');
    if (importedNotes) {
      setNotes(importedNotes);
      setHasImportedNotes(true);
      // Clear the session storage after loading
      sessionStorage.removeItem('importedNotes');
      toast.success('Study notes imported successfully!');
    }
  }, [router]);

  const handleClearNotes = () => {
    setNotes('');
    setHasImportedNotes(false);
    toast.info('Notes cleared');
  };

  const handleGenerateQuiz = async () => {
    if (!notes.trim()) {
      toast.error('Please paste your notes first!');
      return;
    }

    if (notes.trim().length < 100) {
      toast.error('Please provide more detailed notes (at least 100 characters)');
      return;
    }

    setIsGenerating(true);

    try {
      console.log('Sending request to generate quiz...');
      console.log('Notes being sent:', notes.trim().substring(0, 200) + '...'); // Log first 200 chars
      console.log('Settings:', settings);
      
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notes.trim(),
          settings,
          userId: user?.id,
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to generate quiz');
      }

      const result = await response.json();
      console.log('API Result:', result);

      // DEBUG: Log each generated question with proper typing
      if (result.quiz && result.quiz.questions) {
        console.log('Generated Questions:');
        result.quiz.questions.forEach((q: Question, index: number) => {
          console.log(`Question ${index + 1}:`, {
            id: q.id,
            question: q.question,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation?.substring(0, 100) + '...'
          });
        });
      }

      // Check if we got the quiz data back
      if (!result.quiz || !result.quiz.questions || result.quiz.questions.length === 0) {
        console.error('No questions in result:', result);
        throw new Error('No questions were generated');
      }

      // Store the COMPLETE quiz data in session storage
      const quizData = {
        notes: notes.trim(),
        settings,
        quizId: result.quizId,
        questions: result.quiz.questions,
      };

      console.log('Storing quiz data with questions:', quizData.questions.length);
      sessionStorage.setItem('currentQuiz', JSON.stringify(quizData));

      // DEBUG: Verify what was stored
      const storedData = JSON.parse(sessionStorage.getItem('currentQuiz') || '{}');
      console.log('Verification - Stored questions:', storedData.questions?.length);
      if (storedData.questions?.length > 0) {
        console.log('First stored question:', storedData.questions[0]);
      }

      toast.success(`Quiz generated with ${result.quiz.questions.length} questions!`);
      router.push(`/quiz/take?id=${result.quizId}`);
      
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast.error(`Failed to generate quiz: ${(error as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create New Quiz
            </h1>
            <p className="text-gray-600">
              Paste your study notes and customize your quiz settings
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Notes Input */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Study Notes
                    </h2>
                    {hasImportedNotes && (
                      <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Imported from saved notes
                      </div>
                    )}
                  </div>
                  
                  {notes.length > 0 && (
                    <button
                      onClick={handleClearNotes}
                      className="flex items-center gap-2 text-gray-500 hover:text-red-600 text-sm transition-colors"
                      disabled={isGenerating}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Clear Notes
                    </button>
                  )}
                </div>
                
                <textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    // Remove the imported flag if user starts typing new content
                    if (hasImportedNotes && e.target.value !== notes) {
                      setHasImportedNotes(false);
                    }
                  }}
                  placeholder="Paste your study notes here... (minimum 100 characters)

You can also click 'Use for Quiz' on any saved study note to import it here automatically."
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isGenerating}
                />
                
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-500">
                    {notes.length} characters
                  </span>
                  {notes.length < 100 && notes.length > 0 && (
                    <span className="text-sm text-orange-500">
                      Need {100 - notes.length} more characters
                    </span>
                  )}
                </div>

                {/* Helper text for importing notes */}
                {notes.length === 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> You can import notes from your saved study notes by going to the{' '}
                      <button
                        onClick={() => router.push('/study-notes')}
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        Study Notes page
                      </button>
                      {' '}and clicking "Use for Quiz" on any note.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Settings Panel */}
            <div className="space-y-6">
              {/* Quiz Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <SettingsIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Quiz Settings
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Question Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Type className="w-4 h-4 inline mr-2" />
                      Question Type
                    </label>
                    <select
                      value={settings.questionType}
                      onChange={(e) => setSettings({
                        ...settings, 
                        questionType: e.target.value as QuizSettings['questionType']
                      })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isGenerating}
                    >
                      <option value="mixed">Mixed Questions</option>
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True/False</option>
                      <option value="fill-in-blank">Fill in the Blank</option>
                    </select>
                  </div>

                  {/* Max Questions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Hash className="w-4 h-4 inline mr-2" />
                      Number of Questions
                    </label>
                    <select
                      value={settings.maxQuestions}
                      onChange={(e) => setSettings({
                        ...settings, 
                        maxQuestions: parseInt(e.target.value)
                      })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isGenerating}
                    >
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                      <option value={20}>20 Questions</option>
                      <option value={30}>30 Questions</option>
                      <option value={50}>50 Questions</option>
                      <option value={100}>100 Questions</option>
                    </select>
                  </div>

                  {/* Time per Question */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Time per Question
                    </label>
                    <select
                      value={settings.timePerQuestion}
                      onChange={(e) => setSettings({
                        ...settings, 
                        timePerQuestion: parseInt(e.target.value)
                      })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isGenerating}
                    >
                      <option value={15}>15 seconds</option>
                      <option value={30}>30 seconds</option>
                      <option value={60}>1 minute</option>
                      <option value={120}>2 minutes</option>
                      <option value={0}>No time limit</option>
                    </select>
                  </div>

                  {/* Custom Instructions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MessageSquare className="w-4 h-4 inline mr-2" />
                      Custom Instructions
                    </label>
                    <textarea
                      value={settings.customInstructions}
                      onChange={(e) => setSettings({
                        ...settings, 
                        customInstructions: e.target.value
                      })}
                      placeholder="Any specific instructions for the AI..."
                      className="w-full h-20 p-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isGenerating}
                    />
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateQuiz}
                disabled={isGenerating || !notes.trim() || notes.length < 100}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Generate Quiz
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}