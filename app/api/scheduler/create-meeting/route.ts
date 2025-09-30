import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

interface SchedulerData {
  title: string;
  date: string;
  time: string;
  duration: number;
  menteeId: string;
  description: string;
}

interface Mentee {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SchedulerData = await request.json();
    const { title, date, time, duration, menteeId, description } = body;

    console.log('Meeting creation request:', { title, date, time, duration, menteeId });

    // Mock mentees data - in real app, this would come from database
    const mentees: Mentee[] = [
      { id: "1", name: "Felicia Hwang", email: "zhanyoulau.dynp@gmail.com", phone: "+6598889775" },
      { id: "2", name: "Bob Smith", email: "bob@example.com", phone: "+1234567891" },
      { id: "3", name: "Carol Davis", email: "carol@example.com", phone: "+1234567892" },
    ];

    const selectedMentee = mentees.find(m => m.id === menteeId);
    
    if (!selectedMentee) {
      return NextResponse.json(
        { error: 'Selected mentee not found' },
        { status: 400 }
      );
    }

    // Create meeting datetime
    const meetingDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(meetingDateTime.getTime() + duration * 60000);

    // Use hardcoded Google Meet link for now
    const meetLink = "https://meet.google.com/ook-itpc-cgw";
    const meetingId = "hardcoded-meet-ook-itpc-cgw";
    const calendarEventId = "hardcoded-calendar-event";

    // Format dates for display
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    // Send email RSVP (mock implementation)
    const emailSent = await sendEmailRSVP({
      menteeEmail: selectedMentee.email,
      menteeName: selectedMentee.name,
      meetingTitle: title,
      meetingDate: formatDate(meetingDateTime),
      meetingTime: `${formatTime(meetingDateTime)} - ${formatTime(endDateTime)}`,
      meetLink: meetLink,
      description: description
    });

    // Prepare WhatsApp message
    const whatsappMessage = `🎯 *Mentorship Session Invitation*

📅 *Date:* ${formatDate(meetingDateTime)}
⏰ *Time:* ${formatTime(meetingDateTime)} - ${formatTime(endDateTime)}
📝 *Title:* ${title}

${description}

🔗 *Join Meeting:* ${meetLink}

Looking forward to our session! 🚀`;

    const whatsappLink = `https://wa.me/${selectedMentee.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

    console.log('Meeting created successfully:', {
      meetingId,
      meetLink,
      calendarEventId,
      emailSent,
      whatsappLink
    });

    return NextResponse.json({
      success: true,
      meetingId,
      meetLink,
      calendarEventId,
      emailSent,
      whatsappLink,
      mentee: selectedMentee,
      meetingDetails: {
        title,
        date: formatDate(meetingDateTime),
        time: `${formatTime(meetingDateTime)} - ${formatTime(endDateTime)}`,
        duration: `${duration} minutes`
      }
    });

  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    );
  }
}

// Google Meet creation function with real Google Calendar API integration
async function createGoogleMeetMeeting({
  title,
  startDateTime,
  endDateTime,
  menteeEmail,
  description
}: {
  title: string;
  startDateTime: Date;
  endDateTime: Date;
  menteeEmail: string;
  description: string;
}): Promise<{ meetingId: string; meetLink: string; calendarEventId?: string }> {
  try {
    // Check if Google Calendar API credentials are configured
    if (!process.env.GOOGLE_CALENDAR_API_KEY || !process.env.GOOGLE_CALENDAR_CLIENT_ID || !process.env.GOOGLE_CALENDAR_CLIENT_SECRET) {
      console.log('Google Calendar API credentials not configured, using mock meeting');
      return {
        meetingId: `mock-${Date.now()}`,
        meetLink: `https://meet.google.com/mock-${Date.now()}`
      };
    }

    // Initialize Google Calendar API using OAuth2 with refresh token
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET
    );
    if (process.env.GOOGLE_CALENDAR_REFRESH_TOKEN) {
      oauth2.setCredentials({ refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN });
    }
    const calendar = google.calendar({ version: 'v3', auth: oauth2 });

    // Create calendar event with Google Meet
    const event = {
      summary: title,
      description: description,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: [
        { email: menteeEmail }
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 10 }, // 10 minutes before
        ],
      },
    };

    // Insert event with conference data
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event as any,
      conferenceDataVersion: 1,
      sendUpdates: 'all'
    });

    const createdEvent = (response as any).data;
    const meetLink = createdEvent.conferenceData?.entryPoints?.[0]?.uri || '';
    const meetingId = createdEvent.id || `meet-${Date.now()}`;

    console.log('Created Google Meet meeting:', { 
      meetingId, 
      meetLink, 
      calendarEventId: createdEvent.id 
    });
    
    return { 
      meetingId, 
      meetLink, 
      calendarEventId: createdEvent.id 
    };

  } catch (error) {
    console.error('Error creating Google Meet meeting:', error);
    
    // Fallback to mock meeting
    const meetingId = `fallback-${Date.now()}`;
    const meetLink = `https://meet.google.com/${meetingId}`;
    
    return { meetingId, meetLink };
  }
}

// Mock email sending function
async function sendEmailRSVP({
  menteeEmail,
  menteeName,
  meetingTitle,
  meetingDate,
  meetingTime,
  meetLink,
  description
}: {
  menteeEmail: string;
  menteeName: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  meetLink: string;
  description: string;
}): Promise<boolean> {
  try {
    // In a real implementation, you would use an email service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Nodemailer with SMTP
    
    console.log('📧 Email RSVP would be sent to:', menteeEmail);
    console.log('📧 Email content:', {
      to: menteeEmail,
      subject: `Mentorship Session Invitation - ${meetingTitle}`,
      body: `
Dear ${menteeName},

You have been invited to a mentorship session:

📅 Date: ${meetingDate}
⏰ Time: ${meetingTime}
📝 Title: ${meetingTitle}

Description:
${description}

🔗 Join Meeting: ${meetLink}

Please confirm your attendance by replying to this email.

Best regards,
Your Mentor
      `
    });

    // Mock successful email send
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}