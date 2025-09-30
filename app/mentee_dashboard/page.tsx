"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Interfaces
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

interface MentorSurvey {
  created_at: string;
  mentor: { id: string; name: string; email: string; skills: string[] };
  mentee: { id: string; name: string; email: string; skills: string[] };
  satisfaction_level: number;
  objectives_met: number;
  objectives_met_reason: string;
  mentor_effectiveness: number;
  key_points: string;
  next_session_points: string;
  comments: string;
}

export default function AnalyticsPage() {
  const [menteeData, setMenteeData] = useState<MenteeSurvey[]>([]);
  const [mentorData, setMentorData] = useState<MentorSurvey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/mentee_postsurvey.json").then((res) => res.json()),
      fetch("/mentor_postsurvey.json").then((res) => res.json())
    ]).then(([menteeJson, mentorJson]) => {
      setMenteeData(menteeJson.mentee_postsurvey || []);
      setMentorData(mentorJson.mentor_postsurvey || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-slate-600">Loading dashboard...</div>;

  // ---------- Helper Functions ----------
  const buildKPIs = (data: any[]) => {
    const total = data.length;
    if (total === 0) return { total: 0, avgSat: "0", avgEff: "0" };

    const avgSat = (data.reduce((s, d) => s + (d.satisfaction_level || 0), 0) / total).toFixed(2);
    const avgEff = (data.reduce((s, d) => s + (d.mentor_effectiveness || 0), 0) / total).toFixed(2);

    return { total, avgSat, avgEff };
  };

  const pieColors = ["#10b981", "#ef4444"];

  // ---------- Extra Metrics (Mentee) ----------
  const sessionsPerMentee = Object.entries(
    menteeData.reduce((acc, d) => {
      acc[d.mentee.name] = (acc[d.mentee.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const effectivenessPerMentor = Object.entries(
    menteeData.reduce((acc, d) => {
      if (!acc[d.mentor.name]) acc[d.mentor.name] = [];
      acc[d.mentor.name].push(d.mentor_effectiveness);
      return acc;
    }, {} as Record<string, number[]>)
  ).map(([name, vals]) => ({
    name,
    avg: vals.reduce((a, b) => a + b, 0) / vals.length,
  }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  // ---------- Red Flags + Inactive ----------
  const buildRedFlags = (data: any[], useNames = true) => {
    const pairStats: Record<string, any> = {};
    data.forEach((d) => {
      const mentor = useNames ? d.mentor.name : d.mentor_id;
      const mentee = useNames ? d.mentee.name : d.mentee_id;
      const key = `${mentor} - ${mentee}`;
      if (!pairStats[key]) {
        pairStats[key] = { mentor, mentee, satisfaction: [], effectiveness: [], met: 0, total: 0 };
      }
      pairStats[key].satisfaction.push(d.satisfaction_level);
      pairStats[key].effectiveness.push(d.mentor_effectiveness);
      pairStats[key].met += d.objectives_met;
      pairStats[key].total += 1;
    });

    return Object.values(pairStats)
      .map((p: any) => ({
        ...p,
        avgSatisfaction: (p.satisfaction.reduce((a: number, b: number) => a + b, 0) / p.total).toFixed(1),
        avgEffectiveness: (p.effectiveness.reduce((a: number, b: number) => a + b, 0) / p.total).toFixed(1),
        metPct: ((p.met / p.total) * 100).toFixed(0),
      }))
      .filter(
        (p: any) =>
          parseFloat(p.avgSatisfaction) <= 4 ||
          parseFloat(p.avgEffectiveness) <= 4 ||
          parseFloat(p.metPct) < 50 ||
          p.total < 2
      );
  };

  const menteeRedFlags = buildRedFlags(menteeData);
  const mentorRedFlags = buildRedFlags(mentorData);

  const menteeKPIs = buildKPIs(menteeData);
  const mentorKPIs = buildKPIs(mentorData);

  // ---------- KPI Section ----------
  const KPISection = ({ title, kpis }: { title: string; kpis: any }) => (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle>Total Responses</CardTitle></CardHeader><CardContent>{kpis.total}</CardContent></Card>
        <Card><CardHeader><CardTitle>Avg Satisfaction</CardTitle></CardHeader><CardContent>{kpis.avgSat}</CardContent></Card>
        <Card><CardHeader><CardTitle>Avg Effectiveness</CardTitle></CardHeader><CardContent>{kpis.avgEff}</CardContent></Card>
      </div>
    </section>
  );

  // ---------- Red Flag Table ----------
  const RedFlagTable = ({ title, flags }: { title: string; flags: any[] }) => (
    <section className="mb-12">
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4 text-sm font-medium text-slate-600 border-b pb-2">
            <div>Mentor</div>
            <div>Mentee</div>
            <div>Avg Satisfaction</div>
            <div>Avg Effectiveness</div>
            <div>Objectives Met %</div>
            <div>Sessions</div>
          </div>
          {flags.map((rf, idx) => (
            <div key={idx} className="grid grid-cols-6 gap-4 text-sm py-2 border-b last:border-b-0">
              <div>{rf.mentor}</div>
              <div>{rf.mentee}</div>
              <div className={parseFloat(rf.avgSatisfaction) <= 4 ? "text-red-600 font-bold" : ""}>{rf.avgSatisfaction}</div>
              <div className={parseFloat(rf.avgEffectiveness) <= 4 ? "text-red-600 font-bold" : ""}>{rf.avgEffectiveness}</div>
              <div className={parseFloat(rf.metPct) < 50 ? "text-red-600 font-bold" : ""}>{rf.metPct}%</div>
              <div className={rf.total < 2 ? "text-red-600 font-bold" : ""}>{rf.total}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Mentorship Analytics Dashboard</h1>

        {/* ---------- Mentee Section ---------- */}
        <KPISection title="Mentee Feedback" kpis={menteeKPIs} />

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Satisfaction Distribution (Mentee) */}
          <Card>
            <CardHeader><CardTitle>Satisfaction Distribution (Mentees)</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Array.from({ length: 10 }, (_, i) => ({
                  score: i + 1,
                  count: menteeData.filter(d => d.satisfaction_level === i + 1).length
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="score" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Objectives Met (Mentee) */}
          <Card>
            <CardHeader><CardTitle>Objectives Met (Mentees)</CardTitle></CardHeader>
            <CardContent className="h-72 flex justify-center items-center">
              <PieChart width={300} height={300}>
                <Pie
                  data={[
                    { name: "Met", value: menteeData.filter(d => d.objectives_met === 1).length },
                    { name: "Not Met", value: menteeData.filter(d => d.objectives_met === 0).length }
                  ]}
                  dataKey="value"
                  label
                >
                  <Cell fill={pieColors[0]} />
                  <Cell fill={pieColors[1]} />
                </Pie>
                <Tooltip />
              </PieChart>
            </CardContent>
          </Card>
        </section>

        {/* Extra Mentee Metrics */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader><CardTitle>Sessions per Mentee</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionsPerMentee}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Top Mentors by Effectiveness</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={effectivenessPerMentor}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avg" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        <RedFlagTable title="Red Flags (Mentees)" flags={menteeRedFlags} />

        {/* ---------- Mentor Section ---------- */}
        <KPISection title="Mentor Feedback" kpis={mentorKPIs} />

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Satisfaction Distribution (Mentor) */}
          <Card>
            <CardHeader><CardTitle>Satisfaction Distribution (Mentors)</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Array.from({ length: 10 }, (_, i) => ({
                  score: i + 1,
                  count: mentorData.filter(d => d.satisfaction_level === i + 1).length
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="score" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Objectives Met (Mentor) */}
          <Card>
            <CardHeader><CardTitle>Objectives Met (Mentors)</CardTitle></CardHeader>
            <CardContent className="h-72 flex justify-center items-center">
              <PieChart width={300} height={300}>
                <Pie
                  data={[
                    { name: "Met", value: mentorData.filter(d => d.objectives_met === 1).length },
                    { name: "Not Met", value: mentorData.filter(d => d.objectives_met === 0).length }
                  ]}
                  dataKey="value"
                  label
                >
                  <Cell fill={pieColors[0]} />
                  <Cell fill={pieColors[1]} />
                </Pie>
                <Tooltip />
              </PieChart>
            </CardContent>
          </Card>
        </section>

        <RedFlagTable title="Red Flags (Mentors)" flags={mentorRedFlags} />
      </div>
    </div>
  );
}
