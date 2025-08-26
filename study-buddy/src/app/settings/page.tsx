'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { StorageManager } from '@/lib/storage';
import type { User } from '@/lib/types';
import { 
  Settings as SettingsIcon, 
  Bell,
  Shield,
  Palette,
  Download,
  Trash2,
  AlertTriangle,
  Save,
  Moon,
  Sun
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AppSettings {
  notifications: boolean;
  darkMode: boolean;
  soundEffects: boolean;
  autoSave: boolean;
  defaultTimer: number;
  defaultQuestionCount: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    notifications: true,
    darkMode: false,
    soundEffects: true,
    autoSave: true,
    defaultTimer: 30,
    defaultQuestionCount: 10,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const currentUser = StorageManager.getUser();
    if (!currentUser) {
      router.push('/onboarding');
      return;
    }
    setUser(currentUser);

    // Load settings from localStorage
    const savedSettings = localStorage.getItem('study_buddy_app_settings');
    if (savedSettings) {
      try {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, [router]);

  const handleSettingChange = (key: keyof AppSettings, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('study_buddy_app_settings', JSON.stringify(newSettings));
    toast.success('Setting updated!');
  };

  const exportData = () => {
    try {
      const data = {
        user: StorageManager.getUser(),
        quizHistory: StorageManager.getQuizHistory(),
        settings,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study-buddy-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const deleteAllData = () => {
    StorageManager.clearAllData();
    localStorage.removeItem('study_buddy_app_settings');
    toast.success('All data deleted successfully');
    router.push('/');
  };

  if (!user) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Customize your Study Buddy experience</p>
          </div>

          <div className="space-y-8">
            {/* General Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <SettingsIcon className="text-blue-600" size={24} />
                  <h2 className="text-xl font-semibold text-gray-900">General</h2>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Notifications</h3>
                    <p className="text-sm text-gray-600">Receive notifications about quiz reminders and achievements</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Sound Effects</h3>
                    <p className="text-sm text-gray-600">Play sounds for correct/incorrect answers and notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.soundEffects}
                      onChange={(e) => handleSettingChange('soundEffects', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Auto Save</h3>
                    <p className="text-sm text-gray-600">Automatically save your progress during quizzes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoSave}
                      onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Quiz Defaults */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Quiz Defaults</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Timer (seconds per question)
                  </label>
                  <select
                    value={settings.defaultTimer}
                    onChange={(e) => handleSettingChange('defaultTimer', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={15}>15 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                    <option value={120}>2 minutes</option>
                    <option value={300}>5 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Question Count
                  </label>
                  <select
                    value={settings.defaultQuestionCount}
                    onChange={(e) => handleSettingChange('defaultQuestionCount', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={5}>5 questions</option>
                    <option value={10}>10 questions</option>
                    <option value={15}>15 questions</option>
                    <option value={20}>20 questions</option>
                    <option value={25}>25 questions</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Shield className="text-green-600" size={24} />
                  <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <button
                  onClick={exportData}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download size={20} />
                  <span>Export My Data</span>
                </button>

                <div className="border-t border-gray-200 pt-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                      <div className="text-sm text-red-800">
                        <p className="font-medium mb-1">Danger Zone</p>
                        <p>This action cannot be undone. All your quizzes, progress, and account data will be permanently deleted.</p>
                      </div>
                    </div>
                  </div>

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex
                    
      console.error('Error generating quiz:', error);
      toast.error('Failed to generate quiz. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) return null;

  const questionTypeOptions = [
    { value: 'mixed', label: 'Mixed Types', desc: 'Variety of question formats' },
    { value: 'multiple-choice', label: 'Multiple Choice', desc: '4 options per question' },
    { value: 'fill-in-blank', label: 'Fill in the Blank', desc: 'Complete the missing words' },
    { value: 'true-false', label: 'True/False', desc: 'Simple true or false questions' },
  ];

  const questionCountOptions = [5, 10, 15, 20, 25, 30, 40, 50];
  const timeOptions = [
    { value: 15, label: '15 seconds' },
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 120, label: '2 minutes' },
    { value: 300, label: '5 minutes' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Quiz</h1>
            <p className="text-gray-600">
              Paste your class notes below and customize your quiz settings
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Notes Input */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-blue-600" size={24} />
                    <h2 className="text-xl font-semibold text-gray-900">Your Notes</h2>
                  </div>
                </div>
                <div className="p-6">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Paste your class notes here... 

For example:
- Photosynthesis is the process by which plants convert light energy into chemical energy
- The equation for photosynthesis is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2
- Chloroplasts contain chlorophyll which absorbs light energy
- The process occurs in two stages: light reactions and dark reactions

The more detailed your notes, the better your quiz will be!"
                    className="w-full h-96 resize-none border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="mt-2 flex justify-between text-sm text-gray-500">
                    <span>{notes.length} characters</span>
                    <span>Minimum 100 characters recommended</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-8">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <SettingsIcon className="text-purple-600" size={24} />
                    <h2 className="text-xl font-semibold text-gray-900">Quiz Settings</h2>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Question Type */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                      <Type size={16} />
                      <span>Question Type</span>
                    </label>
                    <select
                      value={settings.questionType}
                      onChange={(e) => setSettings({
                        ...settings,
                        questionType: e.target.value as QuizSettings['questionType']
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {questionTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {questionTypeOptions.find(opt => opt.value === settings.questionType)?.desc}
                    </p>
                  </div>

                  {/* Max Questions */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                      <Hash size={16} />
                      <span>Number of Questions</span>
                    </label>
                    <select
                      value={settings.maxQuestions}
                      onChange={(e) => setSettings({
                        ...settings,
                        maxQuestions: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {questionCountOptions.map((count) => (
                        <option key={count} value={count}>
                          {count} questions
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time per Question */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                      <Clock size={16} />
                      <span>Time per Question</span>
                    </label>
                    <select
                      value={settings.timePerQuestion}
                      onChange={(e) => setSettings({
                        ...settings,
                        timePerQuestion: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {timeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Instructions */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                      <MessageSquare size={16} />
                      <span>Custom Instructions</span>
                    </label>
                    <textarea
                      value={settings.customInstructions}
                      onChange={(e) => setSettings({
                        ...settings,
                        customInstructions: e.target.value
                      })}
                      placeholder="e.g., Focus on definitions, Include more challenging questions, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Tell the AI what to focus on
                    </p>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateQuiz}
                    disabled={isGenerating || !notes.trim()}
                    className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isGenerating ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Generating Quiz...
                      </div>
                    ) : (
                      <>
                        <Play size={18} className="mr-2" />
                        Generate Quiz
                        <ArrowRight size={18} className="ml-2" />
                      </>
                    )}
                  </button>

                  {/* Estimated Time */}
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <Clock size={14} className="inline mr-1" />
                      Estimated time: ~{Math.ceil((settings.maxQuestions * settings.timePerQuestion) / 60)} minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
<button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={20} />
                      <span>Delete All Data</span>
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-700 font-medium">
                        Are you absolutely sure? This action cannot be undone.
                      </p>
                      <div className="flex space-x-4">
                        <button
                          onClick={deleteAllData}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash2 size={18} />
                          <span>Yes, Delete Everything</span>
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}