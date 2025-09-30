"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/global_navbar/Navbar";
import { supabase } from "@/lib/supabase/client";

interface SessionLog {
  idx: number;
  id: string;
  created_at: string;
  location: string;
  time: string;
  notes: string;
  mentorship_id: string;
  generated_summary: {
    discussion: string;
    nextSteps: string[];
  } | null;
  mentorshipDetails: {
    mentor: string;
    mentee: string;
  };
}

interface MentorshipDetails {
  mentorName: string;
  menteeName: string;
}

export default function LogbookPage() {
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [mentorshipDetails, setMentorshipDetails] = useState<MentorshipDetails | null>(null);
  const mentorshipId = "98cdb8b3-8e7e-41f1-a940-10d8c4dfbf37"; // We can make this dynamic later based on user's context

  // Function to fetch mentorship details
  async function fetchMentorshipDetails() {
    try {
      const { data: mentorshipData, error: mentorshipError } = await supabase
        .from('mentor_mentee')
        .select(`
          mentor:profiles!mentor_id(name),
          mentee:profiles!mentee_id(name)
        `)
        .eq('mentorship_id', mentorshipId)
        .single();

      if (mentorshipError) {
        console.error('Error fetching mentorship details:', mentorshipError);
        return null;
      }

      if (mentorshipData && mentorshipData.mentor && mentorshipData.mentee) {
        const mentor = Array.isArray(mentorshipData.mentor) ? mentorshipData.mentor[0] : mentorshipData.mentor;
        const mentee = Array.isArray(mentorshipData.mentee) ? mentorshipData.mentee[0] : mentorshipData.mentee;
        
        return {
          mentor: mentor.name,
          mentee: mentee.name
        };
      }
      return null;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }


  // Fetch sessions with mentorship details
  useEffect(() => {
    async function fetchSessions() {
      setLoading(true);
      try {
        // Get mentorship details first
        const mentorshipDetails = await fetchMentorshipDetails();

        // Then fetch sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('session')
          .select('*')
          .eq('mentorship_id', mentorshipId)
          .order('time', { ascending: sortOrder === 'asc' });

        if (sessionsError) {
          console.error('Error fetching sessions:', sessionsError);
          return;
        }

        // Combine mentorship data with each session and parse generated_summary
        const enrichedSessions = (sessionsData || []).map(session => {
          let parsedSummary = null;
          if (session.generated_summary) {
            try {
              // If it's a string, parse it, if it's already an object, use it as is
              const summaryData = typeof session.generated_summary === 'string' 
                ? JSON.parse(session.generated_summary)
                : session.generated_summary;
              
              parsedSummary = {
                discussion: summaryData.discussion,
                nextSteps: summaryData.nextSteps || []
              };
            } catch (e) {
              console.error('Error parsing generated_summary:', e);
            }
          }

          return {
            ...session,
            generated_summary: parsedSummary,
            mentorshipDetails: {
              mentor: mentorshipDetails?.mentor || 'Unknown Mentor',
              mentee: mentorshipDetails?.mentee || 'Unknown Mentee'
            }
          };
        });

        setSessions(enrichedSessions);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, [mentorshipId, sortOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Session Logbook</h1>
              {mentorshipDetails && (
                <div className="text-gray-600 space-x-2">
                  <span>{mentorshipDetails.mentorName}</span>
                  <span className="text-gray-400">·</span>
                  <span>{mentorshipDetails.menteeName}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-md border hover:bg-gray-50"
              >
                Sort by Date {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
        
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-600">No sessions recorded yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sessions.map((session) => (
              <Card key={session.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">
                          {new Date(session.time).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(session.time).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded ${
                        session.location.toLowerCase() === 'online' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {session.location}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="font-medium">Mentor:</span>
                      <span>{session.mentorshipDetails.mentor}</span>
                      <span className="text-gray-400">·</span>
                      <span className="font-medium">Mentee:</span>
                      <span>{session.mentorshipDetails.mentee}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="prose prose-sm space-y-6">
                    {session.notes && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Session Notes</h3>
                        <div className="whitespace-pre-wrap text-gray-700">
                          {session.notes}
                        </div>
                      </div>
                    )}
                    
                    {session.generated_summary?.nextSteps && session.generated_summary.nextSteps.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
                        <ul className="list-disc pl-4 text-blue-800 space-y-1 marker:text-blue-500">
                          {session.generated_summary.nextSteps.map((step, index) => (
                            <li key={index} className="leading-relaxed">
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
