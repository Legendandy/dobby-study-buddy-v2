'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { StorageManager } from '@/lib/storage';
import type { User } from '@/lib/types';
import { 
  User as UserIcon, 
  Edit2, 
  Save,
  X,
  Calendar,
  Award,
  Target,
  Clock,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    const currentUser = StorageManager.getUser();
    if (!currentUser) {
      router.push('/onboarding');
      return;
    }
    setUser(currentUser);
    setEditData({
      name: currentUser.name,
      age: currentUser.age,
      educationLevel: currentUser.educationLevel,
      grade: currentUser.grade,
      major: currentUser.major,
    });

    // Calculate stats from quiz history
    const history = StorageManager.getQuizHistory();
    if (history.length > 0) {
      const totalScore = history.reduce((sum, quiz) => sum + quiz.score, 0);
      const totalQuestions = history.reduce((sum, quiz) => sum + quiz.totalQuestions, 0);
      const totalTime = history.reduce((sum, quiz) => sum + quiz.timeSpent, 0);
      
      setStats({
        totalQuizzes: history.length,
        averageScore: totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0,
        totalTimeSpent: totalTime,
        currentStreak: calculateStreak(history),
      });
    }
  }, [router]);

  const calculateStreak = (history: any[]) => {
    // Simple streak calculation - consecutive days with quizzes
    if (history.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < history.length; i++) {
      const quizDate = new Date(history[i].completedAt);
      quizDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - quizDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const handleSave = () => {
    if (!user || !editData.name?.trim()) {
      toast.error('Name is required');
      return;
    }

    const updatedUser: User = {
      ...user,
      name: editData.name.trim(),
      age: editData.age || user.age,
      educationLevel: editData.educationLevel || user.educationLevel,
      grade: editData.grade,
      major: editData.major,
    };

    StorageManager.setUser(updatedUser);
    setUser(updatedUser);
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancel = () => {
    if (user) {
      setEditData({
        name: user.name,
        age: user.age,
        educationLevel: user.educationLevel,
        grade: user.grade,
        major: user.major,
      });
    }
    setIsEditing(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!user) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
            <p className="text-gray-600">Manage your account information and view your progress</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <UserIcon className="text-blue-600" size={24} />
                      <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                    </div>
                    
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Save size={16} />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex items-center space-x-2 px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X size={16} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.name || ''}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{user.name}</p>
                      )}
                    </div>

                    {/* Age */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          min="5"
                          max="99"
                          value={editData.age || ''}
                          onChange={(e) => setEditData({ ...editData, age: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{user.age} years old</p>
                      )}
                    </div>

                    {/* Education Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Education Level
                      </label>
                      {isEditing ? (
                        <select
                          value={editData.educationLevel || ''}
                          onChange={(e) => setEditData({ 
                            ...editData, 
                            educationLevel: e.target.value as User['educationLevel']
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="highschool">High School</option>
                          <option value="undergraduate">Undergraduate</option>
                          <option value="postgraduate">Postgraduate</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 capitalize">
                          {user.educationLevel.replace('school', ' School')}
                        </p>
                      )}
                    </div>

                    {/* Grade/Major */}
                    {user.educationLevel === 'highschool' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Grade
                        </label>
                        {isEditing ? (
                          <select
                            value={editData.grade || ''}
                            onChange={(e) => setEditData({ ...editData, grade: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select Grade</option>
                            <option value="9th Grade">9th Grade</option>
                            <option value="10th Grade">10th Grade</option>
                            <option value="11th Grade">11th Grade</option>
                            <option value="12th Grade">12th Grade</option>
                          </select>
                        ) : (
                          <p className="text-gray-900">{user.grade || 'Not specified'}</p>
                        )}
                      </div>
                    )}

                    {(user.educationLevel === 'undergraduate' || user.educationLevel === 'postgraduate') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Major/Field of Study
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.major || ''}
                            onChange={(e) => setEditData({ ...editData, major: e.target.value })}
                            placeholder="e.g., Computer Science, Biology"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{user.major || 'Not specified'}</p>
                        )}
                      </div>
                    )}

                    {/* Member Since */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Member Since
                      </label>
                      <p className="text-gray-900 flex items-center">
                        <Calendar size={16} className="mr-2 text-gray-400" />
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Sidebar */}
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-8">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Your Stats</h3>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* XP and Level */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Award className="text-white" size={32} />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{user.xp} XP</div>
                    <div className="text-sm text-gray-600">Level {Math.floor(user.xp / 100) + 1}</div>
                    
                    {/* XP Progress */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(user.xp % 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {100 - (user.xp % 100)} XP to next level
                    </p>
                  </div>

                  {/* Quiz Stats */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Target className="text-blue-600" size={20} />
                        <span className="text-gray-700">Total Quizzes</span>
                      </div>
                      <span className="font-semibold text-gray-900">{stats.totalQuizzes}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="text-green-600" size={20} />
                        <span className="text-gray-700">Average Score</span>
                      </div>
                      <span className="font-semibold text-gray-900">{stats.averageScore}%</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="text-purple-600" size={20} />
                        <span className="text-gray-700">Time Studied</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {formatTime(stats.totalTimeSpent)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">🔥</span>
                        </div>
                        <span className="text-gray-700">Current Streak</span>
                      </div>
                      <span className="font-semibold text-gray-900">{stats.currentStreak} days</span>
                    </div>
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