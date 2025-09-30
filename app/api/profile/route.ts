import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, role, title, bio, expertise, years_of_experience, linkedin_url } = body;

    console.log('Profile update request:', { id, name, email, role });

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prepare the details object for the JSONB column
    const details = {
      title: title || null,
      bio: bio || null,
      expertise: expertise || [],
      years_of_experience: years_of_experience || null,
      linkedin_url: linkedin_url || null
    };

    // Update the profile in the database
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name,
        email,
        role,
        details,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    console.log('Profile updated successfully:', data);
    return NextResponse.json({ 
      success: true, 
      profile: data 
    });

  } catch (error) {
    console.error('Error in profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data });

  } catch (error) {
    console.error('Error in profile GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
