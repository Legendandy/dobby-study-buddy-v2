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