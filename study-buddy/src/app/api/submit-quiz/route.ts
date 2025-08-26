import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { XPCalculator } from '@/lib/xp-calculator';
import type { QuizAttempt, Question, QuizResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { 
      quizId, 
      userId, 
      answers, 
      questions, 
      timeSpent, 
      settings 
    } = await request.json();

    if (!quizId || !userId || !answers || !questions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate score
    let correctAnswers = 0;
    const results: QuizResult[] = [];

    questions.forEach((question: Question) => {
      const userAnswer = answers[question.id] || '';
      
      // Safely handle correctAnswer - convert to string and handle null/undefined
      const correctAnswer = String(question.correctAnswer || '').toLowerCase().trim();
      const userAnswerNormalized = userAnswer.toLowerCase().trim();
      
      const isCorrect = userAnswerNormalized === correctAnswer;
      
      if (isCorrect) {
        correctAnswers++;
      }

      results.push({
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer || '', // Store original value
        isCorrect,
        explanation: question.explanation || '', // Also handle explanation safely
      });
    });

    // Calculate XP
    const maxTimeAllowed = questions.length * settings.timePerQuestion;
    const xpEarned = XPCalculator.calculateXP(
      correctAnswers,
      questions.length,
      timeSpent,
      maxTimeAllowed
    );

    // Create quiz attempt (keeping original structure for now)
    const attempt: QuizAttempt = {
      id: uuidv4(),
      quizId,
      userId,
      answers,
      score: correctAnswers,
      totalQuestions: questions.length,
      timeSpent,
      xpEarned,
      completedAt: new Date(),
      questions: questions,
      results: results,
      settings: settings,
    };

    // Store detailed results separately in the response
    // The quiz history component will need to access this data
    const detailedResults = {
      questions: questions,
      results: results,
      settings: settings,
    };

    // Get XP breakdown for display
    const xpBreakdown = XPCalculator.getXPBreakdown(
      correctAnswers,
      questions.length,
      timeSpent,
      maxTimeAllowed
    );

    return NextResponse.json({
      success: true,
      attempt,
      results,
      xpBreakdown,
      detailedResults, // Add this for the history to access
      performance: {
        score: correctAnswers,
        totalQuestions: questions.length,
        percentage: Math.round((correctAnswers / questions.length) * 100),
        timeSpent,
        xpEarned,
      },
    });

  } catch (error) {
    console.error('Quiz submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz. Please try again.' },
      { status: 500 }
    );
  }
}