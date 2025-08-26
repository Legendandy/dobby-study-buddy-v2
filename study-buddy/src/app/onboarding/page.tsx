'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { StorageManager } from '@/lib/storage';
import type { User } from '@/lib/types';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

interface OnboardingData {
  name: string;
  age: number;
  educationLevel: 'highschool' | 'undergraduate' | 'postgraduate' | '';
  grade?: string;
  major?: string;
}

const HIGH_SCHOOL_GRADES = [
  '9th Grade', '10th Grade', '11th Grade', '12th Grade'
];

const UNDERGRADUATE_YEARS = [
  'Freshman (1st Year)', 'Sophomore (2nd Year)', 
  'Junior (3rd Year)', 'Senior (4th Year)', '5th Year+'
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    age: 0,
    educationLevel: '',
  });

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    const user: User = {
      id: uuidv4(),
      name: data.name,
      age: data.age,
      educationLevel: data.educationLevel as 'highschool' | 'undergraduate' | 'postgraduate',
      grade: data.grade,
      major: data.major,
      xp: 0,
      createdAt: new Date(),
    };

    StorageManager.setUser(user);
    router.push('/dashboard');
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.name.trim().length > 0;
      case 2:
        return data.age > 0 && data.age < 100;
      case 3:
        return data.educationLevel !== '';
      case 4:
        if (data.educationLevel === 'highschool') {
          return data.grade !== undefined;
        }
        if (data.educationLevel === 'undergraduate' || data.educationLevel === 'postgraduate') {
          return data.major !== undefined && data.major.trim().length > 0;
        }
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Step {step} of 4</span>
            <span>{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome! What's your name?</h2>
              <p className="text-gray-600 mb-6">Let's get to know you better to personalize your experience.</p>
              <input
                type="text"
                placeholder="Enter your full name"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How old are you?</h2>
              <p className="text-gray-600 mb-6">This helps us tailor content to your level.</p>
              <input
                type="number"
                placeholder="Enter your age"
                min="5"
                max="99"
                value={data.age || ''}
                onChange={(e) => setData({ ...data, age: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What's your education level?</h2>
              <p className="text-gray-600 mb-6">Choose the option that best describes your current situation.</p>
              <div className="space-y-3">
                {[
                  { value: 'highschool', label: 'High School', desc: 'Grades 9-12' },
                  { value: 'undergraduate', label: 'Undergraduate', desc: 'Bachelor\'s degree program' },
                  { value: 'postgraduate', label: 'Postgraduate', desc: 'Master\'s or PhD program' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setData({ ...data, educationLevel: option.value as any })}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      data.educationLevel === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              {data.educationLevel === 'highschool' && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">What grade are you in?</h2>
                  <p className="text-gray-600 mb-6">Select your current grade level.</p>
                  <div className="space-y-3">
                    {HIGH_SCHOOL_GRADES.map((grade) => (
                      <button
                        key={grade}
                        onClick={() => setData({ ...data, grade })}
                        className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                          data.grade === grade
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {data.educationLevel === 'undergraduate' && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">What's your major?</h2>
                  <p className="text-gray-600 mb-6">Tell us what you're studying.</p>
                  <input
                    type="text"
                    placeholder="e.g., Computer Science, Biology, Business"
                    value={data.major || ''}
                    onChange={(e) => setData({ ...data, major: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                  />
                  <div className="space-y-3">
                    {UNDERGRADUATE_YEARS.map((year) => (
                      <button
                        key={year}
                        onClick={() => setData({ ...data, grade: year })}
                        className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                          data.grade === year
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {data.educationLevel === 'postgraduate' && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">What's your field of study?</h2>
                  <p className="text-gray-600 mb-6">Tell us about your graduate program.</p>
                  <input
                    type="text"
                    placeholder="e.g., Master's in Engineering, PhD in Psychology"
                    value={data.major || ''}
                    onChange={(e) => setData({ ...data, major: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
              <ArrowRight size={20} className="ml-2" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!canProceed()}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Complete Setup
              <CheckCircle size={20} className="ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}