import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { QuizSettings, Question, Quiz } from '@/lib/types';

const FIREWORKS_API_URL = 'https://api.fireworks.ai/inference/v1/chat/completions';

async function generateQuizWithAI(notes: string, settings: QuizSettings): Promise<Question[]> {
  const isMixedType = settings.questionType === 'mixed';
  
  console.log(`🎯 Generating ${settings.maxQuestions} questions of type: ${settings.questionType}`);

  // We'll try to generate questions with retries if we don't get enough valid ones
  let allQuestions: Question[] = [];
  let attempts = 0;
  const maxAttempts = 3;

  while (allQuestions.length < settings.maxQuestions && attempts < maxAttempts) {
    attempts++;
    const questionsNeeded = settings.maxQuestions - allQuestions.length;
    
    console.log(`🔄 Attempt ${attempts}: Need ${questionsNeeded} more questions`);

    // Generate ALL questions at once with explicit diversity requirements
    const systemPrompt = `You are an expert quiz generator. Create EXACTLY ${questionsNeeded} DIVERSE questions from the provided notes content.

CRITICAL REQUIREMENTS:
- ONLY use information explicitly mentioned in the notes
- Do NOT add external knowledge or examples  
- Each question must cover DIFFERENT topics/concepts from the notes
- NO duplicate or similar questions allowed
- Questions must vary in difficulty and focus area
- YOU MUST GENERATE EXACTLY ${questionsNeeded} QUESTIONS - NO MORE, NO LESS
- ${settings.customInstructions ? `Additional focus: ${settings.customInstructions}` : ''}

${isMixedType ? `QUESTION TYPE MIXING:
- You must create a MIX of question types: multiple-choice, true-false, and fill-in-blank
- Randomly distribute these types across your ${questionsNeeded} questions
- If generating multiple questions, ensure you include different types (don't use just one type)
- Choose the most appropriate question type for each specific piece of information from the notes` : `QUESTION TYPE:
- All ${questionsNeeded} questions must be of type: ${settings.questionType}`}

QUESTION TYPE SPECIFICATIONS:

**MULTIPLE-CHOICE Questions:**
- Ask about specific facts, concepts, or details from different parts of the notes
- Provide exactly 4 distinct options
- Only one option is correct (from the notes)
- Make wrong options plausible but clearly incorrect
- correctAnswer must match one option EXACTLY

**TRUE-FALSE Questions:**
- Make statements about different facts from various sections of the notes
- Statement must be verifiable as true or false from notes content
- correctAnswer must be EXACTLY "True" or "False"
- options should be empty array []

**FILL-IN-BLANK Questions:**
- Create sentences with missing key terms from different parts of notes
- Use "____" or "_____" for the blank
- correctAnswer should be 1-3 words from the notes
- Focus on important terms, names, dates, or concepts
- options should be empty array []

DIVERSITY STRATEGY:
- Scan the entire notes content for different topics/themes
- Spread questions across different sections/paragraphs of notes
- Vary question difficulty (some easy recall, some requiring understanding)
- Use different sentence structures and question formats
- Focus on different types of information (facts, processes, definitions, relationships)

JSON FORMAT (return exactly ${questionsNeeded} questions):
{
  "questions": [
    {
      "id": "q1", 
      "question": "Question text here",
      "type": "multiple-choice|true-false|fill-in-blank",
      "options": ["option1", "option2", "option3", "option4"] or [],
      "correctAnswer": "exact answer",
      "explanation": "brief explanation referencing the notes"
    }
  ]
}`;

    const questionTypeGuidance = isMixedType 
      ? `CREATE A MIX OF QUESTION TYPES:
- Use multiple-choice, true-false, AND fill-in-blank questions
- Randomly distribute these types based on what works best for different parts of the content
- If generating multiple questions, include different types - don't use just one type!
- Choose the most appropriate type for each piece of information`
      : `CREATE ${questionsNeeded} QUESTIONS OF TYPE: ${settings.questionType}`;

    try {
      const response = await fetch(FIREWORKS_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.FIREWORKS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sentientfoundation-serverless/dobby-mini-unhinged-plus-llama-3-1-8b',
          messages: [
            { role: 'system', content: systemPrompt },
            { 
              role: 'user', 
              content: `NOTES CONTENT: "${notes}"

${questionTypeGuidance}

CRITICAL: Generate EXACTLY ${questionsNeeded} questions. Count them carefully.

${allQuestions.length > 0 ? `AVOID THESE TOPICS (already covered in previous questions):
${allQuestions.map(q => `- ${q.question.substring(0, 80)}...`).join('\n')}

Focus on DIFFERENT aspects of the notes that haven't been covered yet.` : ''}

REQUIREMENTS:
- Each question must focus on DIFFERENT content from the notes
- NO repetition or similarity between questions  
- Cover various topics/concepts from across the entire notes content
- Ensure questions test different aspects (facts, understanding, recall, application)

Return JSON with exactly ${questionsNeeded} unique questions.` 
            }
          ],
          temperature: 0.7, // Higher temperature for more diversity
          max_tokens: 4000, // More tokens for multiple questions
          top_p: 0.9, // Add some randomness for variety
        }),
      });

      if (!response.ok) {
        console.error(`❌ API error on attempt ${attempts}:`, response.status);
        if (attempts === maxAttempts) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        continue;
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Parse the response
      let parsedResponse;
      try {
        let cleanedResponse = aiResponse.trim();
        
        // Remove markdown code blocks
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
        }
        
        // Extract JSON object
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error(`❌ Failed to parse AI response on attempt ${attempts}:`, aiResponse.substring(0, 300));
        if (attempts === maxAttempts) {
          throw new Error('Failed to parse AI response as JSON');
        }
        continue;
      }

      // Validate and process questions
      const newValidQuestions: Question[] = [];
      
      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
        console.error(`❌ Invalid response format on attempt ${attempts}: missing questions array`);
        if (attempts === maxAttempts) {
          throw new Error('Invalid response format: missing questions array');
        }
        continue;
      }

      for (let i = 0; i < parsedResponse.questions.length; i++) {
        const q = parsedResponse.questions[i];
        
        // Validate basic structure
        if (!q.question || !q.correctAnswer || !q.explanation || !q.type) {
          console.warn(`❌ Invalid question structure at index ${i} on attempt ${attempts}`);
          continue;
        }

        // Validate question type is allowed
        const allowedTypes = isMixedType 
          ? ['multiple-choice', 'true-false', 'fill-in-blank']
          : [settings.questionType];
        
        if (!allowedTypes.includes(q.type)) {
          console.warn(`❌ Invalid question type '${q.type}' at index ${i} on attempt ${attempts}`);
          continue;
        }

        // Check for duplicates with existing questions
        const isDuplicate = allQuestions.some(existingQ => 
          existingQ.question.toLowerCase().includes(q.question.toLowerCase().substring(0, 30)) ||
          q.question.toLowerCase().includes(existingQ.question.toLowerCase().substring(0, 30))
        );
        
        if (isDuplicate) {
          console.warn(`❌ Duplicate question detected on attempt ${attempts}: ${q.question.substring(0, 50)}...`);
          continue;
        }

        // Create validated question
        let validQuestion = {
          id: `q${allQuestions.length + newValidQuestions.length + 1}`,
          question: q.question.trim(),
          type: q.type as 'multiple-choice' | 'true-false' | 'fill-in-blank',
          options: [] as string[],
          correctAnswer: '',
          explanation: q.explanation.trim(),
        };

        // Type-specific validation and processing
        if (q.type === 'multiple-choice') {
          if (!q.options || !Array.isArray(q.options) || q.options.length < 4) {
            console.warn(`❌ Invalid multiple choice options for question ${i + 1} on attempt ${attempts}`);
            continue;
          }
          
          validQuestion.options = q.options.slice(0, 4).map(opt => opt.trim());
          
          // Find matching option for correct answer
          const matchingOption = validQuestion.options.find(option => 
            option.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
          );
          
          if (matchingOption) {
            validQuestion.correctAnswer = matchingOption;
          } else {
            // Try partial matching
            const partialMatch = validQuestion.options.find(option => 
              option.toLowerCase().includes(q.correctAnswer.toLowerCase().trim()) ||
              q.correctAnswer.toLowerCase().includes(option.toLowerCase())
            );
            
            if (partialMatch) {
              validQuestion.correctAnswer = partialMatch;
            } else {
              console.warn(`⚠️ No matching option for answer, using first option: ${q.correctAnswer}`);
              // Replace first option with the correct answer
              validQuestion.options[0] = q.correctAnswer.trim();
              validQuestion.correctAnswer = q.correctAnswer.trim();
            }
          }
          
        } else if (q.type === 'true-false') {
          const answer = q.correctAnswer.toLowerCase().trim();
          if (answer.includes('true') || answer.includes('correct') || answer.includes('yes')) {
            validQuestion.correctAnswer = 'True';
          } else if (answer.includes('false') || answer.includes('incorrect') || answer.includes('no')) {
            validQuestion.correctAnswer = 'False';
          } else {
            console.warn(`⚠️ Invalid True/False answer, defaulting to True: ${q.correctAnswer}`);
            validQuestion.correctAnswer = 'True';
          }
          validQuestion.options = [];
          
        } else if (q.type === 'fill-in-blank') {
          // Clean up the answer - keep it concise
          let cleanAnswer = q.correctAnswer.trim();
          if (cleanAnswer.length > 50) {
            const words = cleanAnswer.split(/\s+/);
            cleanAnswer = words.slice(0, 3).join(' ');
          }
          validQuestion.correctAnswer = cleanAnswer;
          validQuestion.options = [];
          
          // Ensure the question has a blank
          if (!validQuestion.question.includes('____') && !validQuestion.question.includes('_____')) {
            // Try to automatically add a blank by replacing the answer in the question
            if (validQuestion.question.toLowerCase().includes(cleanAnswer.toLowerCase())) {
              validQuestion.question = validQuestion.question.replace(
                new RegExp(cleanAnswer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
                '____'
              );
            } else {
              // Add blank at the end if we can't find where to put it
              validQuestion.question += ' ____';
            }
          }
        }

        newValidQuestions.push(validQuestion);
        console.log(`✅ Added ${q.type} question ${allQuestions.length + newValidQuestions.length}: ${validQuestion.question.substring(0, 60)}...`);
      }

      // Add new valid questions to our collection
      allQuestions.push(...newValidQuestions);
      
      console.log(`📊 Attempt ${attempts} results: Generated ${newValidQuestions.length} valid questions. Total: ${allQuestions.length}/${settings.maxQuestions}`);

    } catch (error) {
      console.error(`❌ Error in attempt ${attempts}:`, error);
      if (attempts === maxAttempts) {
        throw error;
      }
      continue;
    }
  }

  if (allQuestions.length === 0) {
    throw new Error('Could not generate any valid questions after multiple attempts');
  }

  // If we still don't have enough questions, log a warning but return what we have
  if (allQuestions.length < settings.maxQuestions) {
    console.warn(`⚠️ Only generated ${allQuestions.length} out of ${settings.maxQuestions} requested questions`);
  }

  // Trim to exact count if we somehow got more than requested
  const finalQuestions = allQuestions.slice(0, settings.maxQuestions);

  console.log(`🎉 Successfully generated ${finalQuestions.length} questions:`, 
    finalQuestions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  );

  return finalQuestions;
}

export async function POST(request: NextRequest) {
  try {
    const { notes, settings, userId } = await request.json();

    if (!notes || !settings || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (notes.length < 50) {
      return NextResponse.json(
        { error: 'Notes must be at least 50 characters long to generate meaningful questions' },
        { status: 400 }
      );
    }

    try {
      // Generate questions using AI
      console.log('🚀 Starting quiz generation...');
      const questions = await generateQuizWithAI(notes, settings);

      if (questions.length === 0) {
        return NextResponse.json(
          { error: 'Could not generate valid questions from your notes. Please ensure your notes contain specific facts, concepts, or information that can be turned into quiz questions.' },
          { status: 400 }
        );
      }

      // Create quiz object
      const quiz: Quiz = {
        id: uuidv4(),
        userId,
        questions,
        settings,
        sourceNotes: notes,
        createdAt: new Date(),
      };

      console.log('✅ Quiz created successfully:', {
        id: quiz.id,
        questionCount: questions.length,
        questionTypes: questions.map(q => q.type)
      });

      return NextResponse.json({
        success: true,
        quizId: quiz.id,
        questionCount: questions.length,
        quiz, // Send the full quiz data
      });

    } catch (aiError) {
      console.error('❌ AI generation failed:', aiError);
      return NextResponse.json(
        { error: `Failed to generate quiz: ${aiError instanceof Error ? aiError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Quiz generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz. Please try again.' },
      { status: 500 }
    );
  }
}