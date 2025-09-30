"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MenteeSurvey {
  created_at: string;
  mentor: { id: string; name: string; email: string; skills: string[] };
  mentee: { id: string; name: string; email: string; skills: string[] };
  satisfaction_level: number;
  objectives_met: number;
  objectives_met_reason: string;
  mentor_effectiveness: number;
  takeaways: string;
  comments: string;
}

export default function MenteeProgressPage() {
  const [data, setData] = useState<MenteeSurvey[]>([]);
  const [loading, setLoading] = useState(true);

  // New log form state
  const [newDate, setNewDate] = useState("");
  const [newObjectives, setNewObjectives] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    fetch("/mentee_postsurvey.json")
      .then((res) => res.json())
      .then((json) => {
        setData(json.mentee_postsurvey || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-slate-600">Loading...</div>;

  // Handle new log (local only for now)
  const handleAddSession = () => {
    if (!newDate || !newObjectives) return alert("Please fill required fields.");

    const newEntry: MenteeSurvey = {
      created_at: newDate,
      mentor: { id: "temp", name: "Mentor TBD", email: "", skills: [] },
      mentee: { id: "temp", name: "You", email: "", skills: [] },
      satisfaction_level: 0,
      objectives_met: 0,
      objectives_met_reason: "",
      mentor_effectiveness: 0,
      takeaways: newObjectives,
      comments: newNotes,
    };

    setData((prev) => [...prev, newEntry]);
    setNewDate("");
    setNewObjectives("");
    setNewNotes("");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Mentee Progress Tracker</h1>
        <p className="mb-8 text-slate-600">
          Log your session details, track objectives, and review your journey.
        </p>

        {/* Session Logging Form */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Log a New Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Date & Time</label>
              <input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Objectives</label>
              <textarea
                placeholder="What were the objectives of this session?"
                value={newObjectives}
                onChange={(e) => setNewObjectives(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes / Reflections</label>
              <textarea
                placeholder="Any key takeaways or reflections?"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleAddSession}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Session
            </button>
          </CardContent>
        </Card>

        {/* Vertical Timeline */}
        {/* Vertical Timeline */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Progress Timeline (Michael Johnson)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative border-l-2 border-slate-200 pl-6">
              {data
                .filter((session) => session.mentee.name === "Michael Johnson") // <-- filter here
                .sort(
                  (a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )
                .map((session, idx) => (
                  <div key={idx} className="mb-8 relative">
                    <div className="absolute -left-3 top-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-white"></div>
                    <div className="p-4 bg-slate-50 rounded-lg shadow-sm">
                      <p className="text-sm text-slate-500">
                        {new Date(session.created_at).toLocaleString()}
                      </p>
                      <p className="font-semibold mt-1">Objectives:</p>
                      <p className="text-slate-700">{session.takeaways || "N/A"}</p>
                      {session.comments && (
                        <>
                          <p className="font-semibold mt-2">Notes:</p>
                          <p className="text-slate-700">{session.comments}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
