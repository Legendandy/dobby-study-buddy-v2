import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('Research request received');
  
  try {
    const body = await request.json();
    const { query, userId } = body;

    console.log('Research request received:', { query, userId });

    if (!query || !userId) {
      return NextResponse.json(
        { error: 'Query and userId are required' },
        { status: 400 }
      );
    }

    if (query.trim().length < 3) {
      return NextResponse.json(
        { error: 'Query must be at least 3 characters long' },
        { status: 400 }
      );
    }

    // Call your local LLM API
    const apiUrl = process.env.LLM_API_URL || 'http://localhost:5000';
    console.log('Making request to:', `${apiUrl}/api/simple/execute`);

    const response = await fetch(`${apiUrl}/api/simple/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        goal: `${query}`,
        options: {
          max_iterations: 1,
          timeout: 7200, // 2 hours
        },
        enable_hitl: false,
      }),
    });

    console.log('External API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error response:', errorText);
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('External API result:', result);

    // Extract the final_output content specifically
    let studyNotes = '';
    
    try {
      // First, try to extract final_output directly
      if (result.final_output) {
        studyNotes = result.final_output;
      }
      // If result is nested, try to parse it
      else if (result.result) {
        // If result.result is a string that might be JSON, try to parse it
        if (typeof result.result === 'string') {
          try {
            const parsedResult = JSON.parse(result.result);
            studyNotes = parsedResult.final_output || result.result;
          } catch {
            // If parsing fails, use the string as-is
            studyNotes = result.result;
          }
        } else if (result.result.final_output) {
          studyNotes = result.result.final_output;
        } else {
          studyNotes = JSON.stringify(result.result, null, 2);
        }
      }
      // Try other possible locations
      else if (result.content) {
        studyNotes = result.content;
      } else if (result.response) {
        studyNotes = result.response;
      } else {
        // Last resort: stringify the entire result
        studyNotes = JSON.stringify(result, null, 2);
      }

      // Clean up and format the extracted content
      studyNotes = formatStudyNotes(studyNotes);

    } catch (parseError) {
      console.error('Error extracting study notes:', parseError);
      studyNotes = 'Error: Unable to extract study notes from the response.';
    }

    if (!studyNotes || studyNotes.trim().length === 0) {
      return NextResponse.json(
        { error: 'No study notes were generated from the response.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      studyNotes: studyNotes,
      query: query,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Research API error:', error);
    
    // Handle timeout errors specifically
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { 
          error: 'Request timed out. The research is taking longer than expected. Please try again later or with a simpler query.',
          timeout: true 
        },
        { status: 408 }
      );
    }

    // Handle network errors
    if (error instanceof Error && (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED'))) {
      return NextResponse.json(
        { 
          error: 'Unable to connect to the research service. Please check if the LLM API is running and try again.',
          network: true 
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate study notes',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

// Helper function to format and clean study notes
function formatStudyNotes(content: string): string {
  if (!content || typeof content !== 'string') {
    return 'No content available.';
  }

  // Remove any JSON artifacts or escape sequences
  let formatted = content
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\t/g, '\t');

  // Clean up excessive whitespace
  formatted = formatted
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
    .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
    .trim();

  // Ensure proper paragraph spacing
  formatted = formatted
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n\n');

  return formatted;
}