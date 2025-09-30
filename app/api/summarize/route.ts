import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Create a comprehensive prompt for meeting summarization
    const prompt = `You are a meeting analyst. Analyze the following meeting notes and return ONLY a valid JSON object with no markdown formatting, no code blocks, no explanations.

Meeting notes: "${text}"

Return this exact JSON structure:
{
  "discussion": "Brief summary of main discussion points",
  "nextSteps": ["Follow-up topic 1", "Follow-up topic 2", "Follow-up topic 3"],
  "keyDecisions": ["Decision 1", "Decision 2"],
  "participants": ["Person 1", "Person 2"]
}

Rules:
- discussion: Summarize what was actually discussed
- nextSteps: Suggest 3-4 follow-up discussion topics based on the summary. These should be related topics that could be explored in future sessions (e.g., if they discussed interviews, suggest "mock interview practice" or "resume building")
- Do not add fictional names, deadlines, or specific assignments
- Return empty arrays [] if no decisions or participants mentioned
- Return ONLY the JSON object, nothing else`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert meeting analyst and project manager. You excel at extracting key information, decisions, and actionable items from meeting notes and discussions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      // If JSON parsing fails, create a fallback response
      parsedResponse = {
        discussion: responseText.substring(0, 200) + "...",
        nextSteps: [
          "Review the generated summary for accuracy",
          "Follow up on any outstanding items mentioned in the discussion"
        ],
        keyDecisions: [],
        participants: []
      };
    }

    return NextResponse.json(parsedResponse);

  } catch (error) {
    console.error('Error in summarize API:', error);
    
    // Return a fallback response if API fails
    return NextResponse.json(
      {
        discussion: "Unable to process the text at this time. Please try again or check your API configuration.",
        nextSteps: [
          "Check your internet connection",
          "Try with a shorter text input"
        ],
        keyDecisions: [],
        participants: []
      },
      { status: 500 }
    );
  }
}
