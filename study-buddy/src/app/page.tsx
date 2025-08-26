'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StorageManager } from '@/lib/storage';
import { 
  Brain, 
  Zap, 
  Target, 
  Users, 
  ArrowRight,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

export default function Homepage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if already onboarded
    if (StorageManager.isOnboarded()) {
      router.push('/dashboard');
    }
  }, [router]);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Quiz Generation",
      description: "Transform your class notes into engaging quizzes instantly using advanced AI"
    },
    {
      icon: Clock,
      title: "Timed Challenges",
      description: "Practice under pressure with customizable timers to simulate real exam conditions"
    },
    {
      icon: Target,
      title: "Adaptive Learning",
      description: "Get personalized feedback and explanations to improve your understanding"
    },
    {
      icon: BarChart3,
      title: "Progress Tracking",
      description: "Monitor your performance and see your knowledge improve over time"
    },
    {
      icon: Users,
      title: "Compete & Learn",
      description: "Challenge friends and climb the leaderboard while mastering your subjects"
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get immediate feedback with detailed explanations for every question"
    }
  ];

  const benefits = [
    "Save hours creating study materials",
    "Improve retention with active recall",
    "Track your progress across subjects",
    "Study anywhere, anytime",
    "Compete with peers globally"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Turn Your Notes Into
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}Smart Quizzes
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Study Buddy uses AI to transform your class notes into personalized quizzes. 
              Practice with timed challenges, track your progress, and compete with peers.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Get Started Free
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed to make studying more effective and enjoyable
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Students Love Study Buddy
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="text-white" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Ready to Get Started?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Join thousands of students who are already improving their grades with Study Buddy
                  </p>
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  >
                    Start Learning Now
                    <ArrowRight className="ml-2" size={18} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Study Buddy</h3>
            <p className="text-gray-400">
              Transform your notes into knowledge, one quiz at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}