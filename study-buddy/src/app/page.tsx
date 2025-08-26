'use client';

import { useEffect, useState } from 'react';
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
  BarChart3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function Homepage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    // Redirect to dashboard if already onboarded
    if (StorageManager.isOnboarded()) {
      router.push('/dashboard');
    }
  }, [router]);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

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

  const universities = [
    { name: 'Harvard', image: '/harvard.png' },
    { name: 'Oxford', image: '/oxford.png' },
    { name: 'Princeton', image: '/princeton.png' },
    { name: 'Stanford', image: '/stanford.png' },
    { name: 'Yale', image: '/Yale.png' }
  ];

  const faqs = [
    {
      question: "How does Study Buddy work?",
      answer: "Study Buddy uses advanced AI to analyze your class notes and automatically generate personalized quiz questions. Simply paste your notes, select your preferences for question count and timing, choose your preferred question types, and start your quiz. Our AI creates engaging questions that help reinforce key concepts from your study material."
    },
    {
      question: "Is Study Buddy's AI quiz maker free to use?",
      answer: "Yes, Study Buddy is completely free to use! We're committed to making quality education accessible to everyone. Occasionally, you might experience temporary delays if our API usage is high due to our popularity, but simply try again in a few minutes - we're constantly expanding our capacity to serve our growing community of learners."
    },
    {
      question: "Do I need to create an account to use Study Buddy?",
      answer: "No traditional account creation required! You simply need to complete a quick onboarding process where you enter your basic details. All your information is securely stored in your browser's local storage and cookies - nothing is sent to external servers. This means your data stays private, but clearing your browser cookies or local storage will reset your progress and quiz history."
    },
    {
      question: "What can I use it for?",
      answer: "Study Buddy is perfect for exam preparation, homework review, concept reinforcement, and active recall practice. Whether you're studying for finals, preparing for standardized tests, reviewing lecture notes, or just wanting to test your knowledge retention, Study Buddy transforms any text-based study material into an interactive learning experience."
    },
    {
      question: "What text can I use to generate quiz or test questions?",
      answer: "You can use any text-based study material including class notes, textbook excerpts, lecture transcripts, study guides, or research papers. For optimal quiz generation, we recommend using at least 1000 characters of text to ensure our AI has enough context to create meaningful and diverse questions."
    },
    {
      question: "What type of quiz/test questions can I create?",
      answer: "Study Buddy offers four engaging question formats: Multiple Choice questions with several answer options, True/False statements for quick concept checking, Fill-in-the-Blank questions for testing specific knowledge, and Mixed format that combines all question types for comprehensive review. You can select your preferred format or let our AI create a varied mix."
    },
    {
      question: "How does Study Buddy handle user privacy and GDPR/CCPA compliance?",
      answer: "Privacy is our top priority. Study Buddy doesn't collect or store any personal data on external servers. All your information, quiz results, and progress are stored locally in your browser's cookies and local storage. This means your data never leaves your device and we have no access to your personal information. However, clearing your browser's cookies and local storage will permanently delete your quizzes and progress, requiring you to start fresh."
    },
    {
      question: "How much text do I need to add?",
      answer: "While Study Buddy can work with any amount of text, we recommend using at least 1000 characters (approximately 150-200 words) for the best quiz generation results. This gives our AI sufficient context to create diverse, meaningful questions that truly test your understanding of the material."
    },
    {
      question: "How do I use the AI quiz maker?",
      answer: "Using Study Buddy is simple: 1) Paste your study notes or text into the input field, 2) Choose how many questions you want (typically 5-20 work well), 3) Set your preferred time per question if you want timed practice, 4) Select your question type (Multiple Choice, True/False, Fill-in-the-Blank, or Mixed), and 5) Click 'Generate Quiz' to start your personalized learning session!"
    },
    {
      question: "Can I generate a quiz from a YouTube video?",
      answer: "Currently, Study Buddy works exclusively with text input - we don't support YouTube videos, PDFs, or URLs yet. You'll need to paste the actual text content you want to study from. However, we're actively working on exciting updates that will expand our input options, so stay tuned for new features coming soon!"
    }
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
              Dobby Study Buddy uses AI to transform your class notes into personalized quizzes. 
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

      {/* Trusted By Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Trusted by top students and educators worldwide
            </h2>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {universities.map((university, index) => (
              <div key={index} className="flex items-center justify-center">
                <img 
                  src={university.image} 
                  alt={`${university.name} logo`}
                  className="h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
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

     {/* FAQ Section */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Study Buddy
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {faqs.map((faq, index) => (
              <div key={`faq-item-${index}`} className="border border-gray-200 rounded-lg h-fit">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFaq(index);
                  }}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200 rounded-t-lg"
                >
                  <span className="text-base font-medium text-gray-900 pr-2">
                    {faq.question}
                  </span>
                  {openFaq === index ? (
                    <ChevronUp className="text-gray-500 flex-shrink-0" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-500 flex-shrink-0" size={20} />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <p className="text-gray-600 leading-relaxed text-sm pt-4">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
<footer className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center">
      <h3 className="text-2xl font-bold mb-4">Dobby Study Buddy</h3>
      <p className="text-blue-200 mb-8">
        Transform your notes into knowledge, one quiz at a time.
      </p>
    </div>
    
    {/* Attribution Section - now inside the same background */}
    <div className="border-t border-blue-700 pt-6">
      <div className="text-center">
        <p className="text-white text-xs font-medium">
          Made with ❤️ for students worldwide by{' '}
          <a 
            href="https://x.com/_hadeelen" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white hover:text-blue-100 transition-colors duration-200 underline underline-offset-2"
          >
            LegendAndy
          </a>
        </p>
      </div>
    </div>
  </div>
</footer>
    </div>
  );
}