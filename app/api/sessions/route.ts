import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side use
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);
    
    const { 
      questionnaireData, 
      userRole, 
      meetingNotes, 
      summaryData,
      userId 
    } = body;

    console.log('Extracted data:', { questionnaireData, userRole, meetingNotes, userId });

    // Get mentorship_id from mentor-mentee relationship
    // For now, we'll need to determine this based on the user's role
    let mentorshipId;
    
    // TODO: Remove this hardcoded fallback when auth is properly implemented
    if (userId === 'temp-user-id') {
      mentorshipId = '98cdb8b3-8e7e-41f1-a940-10d8c4dfbf37';
    } else {
      // Original logic for when auth is implemented
      if (userRole === 'mentor') {
        // Get mentorship_id where mentor_id = userId
        const { data: mentorship, error: mentorshipError } = await supabase
          .from('mentor_mentee')
          .select('mentorship_id')
          .eq('mentor_id', userId)
          .single();
        
        if (mentorshipError) {
          console.error('Error fetching mentorship:', mentorshipError);
          return NextResponse.json(
            { error: 'Could not find mentorship relationship' },
            { status: 400 }
          );
        }
        
        mentorshipId = mentorship.mentorship_id;
      } else {
        // Get mentorship_id where mentee_id = userId
        const { data: mentorship, error: mentorshipError } = await supabase
          .from('mentor_mentee')
          .select('mentorship_id')
          .eq('mentee_id', userId)
          .single();
        
        if (mentorshipError) {
          console.error('Error fetching mentorship:', mentorshipError);
          return NextResponse.json(
            { error: 'Could not find mentorship relationship' },
            { status: 400 }
          );
        }
        
        mentorshipId = mentorship.mentorship_id;
      }
    }

    // Prepare session data with summary if available
    const sessionData = {
      mentorship_id: mentorshipId,
      location: questionnaireData.location || 'online',
      time: questionnaireData.sessionTime ? new Date(questionnaireData.sessionTime).toISOString() : new Date().toISOString(),
      notes: meetingNotes || '',
      created_at: new Date().toISOString(),
      generated_summary: summaryData ? {
        discussion: summaryData.discussion,
        nextSteps: summaryData.nextSteps,
      } : null
    };

    // Insert session data with summary in a single operation
    const { data: session, error: sessionError } = await supabase
      .from('session')
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to save session data', details: sessionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      message: 'Session data saved successfully'
    });

  } catch (error) {
    console.error('Error in sessions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
