"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import menteePostSurveyData from './mentee_postsurvey.json';
import mentorPostSurveyData from './mentor_postsurvey.json';
import Navbar from "@/components/global_navbar/Navbar";

// Process mentee survey data to create satisfaction level chart data
const processSatisfactionData = () => {
  const satisfactionCounts = Array.from({ length: 10 }, (_, i) => ({
    rating: i + 1,
    count: 0
  }));

  // Access the mentee_postsurvey array from the imported data
  const surveyData = menteePostSurveyData.mentee_postsurvey || [];
  
  surveyData.forEach(survey => {
    const rating = survey.satisfaction_level;
    if (rating >= 1 && rating <= 10) {
      satisfactionCounts[rating - 1].count++;
    }
  });

  return satisfactionCounts;
};

const menteeSatisfactionData = processSatisfactionData();

// Process low ratings data (satisfaction_level <= 3)
const processLowRatingsData = () => {
  const surveyData = menteePostSurveyData.mentee_postsurvey || [];
  
  return surveyData
    .filter(survey => survey.satisfaction_level <= 3)
    .sort((a, b) => a.satisfaction_level - b.satisfaction_level) // Sort by rating ascending
    .map((survey, index) => ({
      id: index + 1,
      mentee: survey.mentee.name,
      mentor: survey.mentor.name,
      rating: survey.satisfaction_level
    }));
};

const menteeLowRatings = processLowRatingsData();

// Process mentee objectives met data for pie chart
const processMenteeObjectivesData = () => {
  const surveyData = menteePostSurveyData.mentee_postsurvey || [];
  
  let yesCount = 0;
  let noCount = 0;
  
  surveyData.forEach(survey => {
    if (survey.objectives_met === 1) {
      yesCount++;
    } else if (survey.objectives_met === 0) {
      noCount++;
    }
  });
  
  return [
    { name: 'Yes', value: yesCount, color: '#10b981' },
    { name: 'No', value: noCount, color: '#ef4444' }
  ];
};

const menteeObjectivesData = processMenteeObjectivesData();

// Process overall mentee survey metrics for first section
const processMenteeOverallMetrics = () => {
  const surveyData = menteePostSurveyData.mentee_postsurvey || [];
  
  const totalResponses = surveyData.length;
  
  const avgSatisfaction = surveyData.length > 0 
    ? surveyData.reduce((sum: number, survey) => sum + survey.satisfaction_level, 0) / surveyData.length
    : 0;
    
  const avgEffectiveness = surveyData.length > 0
    ? surveyData.reduce((sum: number, survey) => sum + survey.mentor_effectiveness, 0) / surveyData.length
    : 0;
  
  return {
    totalResponses,
    avgSatisfaction: avgSatisfaction.toFixed(1),
    avgEffectiveness: avgEffectiveness.toFixed(1)
  };
};

const menteeOverallMetrics = processMenteeOverallMetrics();

// Process top mentors by effectiveness
const processTopMentorsByEffectiveness = () => {
  const surveyData = menteePostSurveyData.mentee_postsurvey || [];
  
  // Group by mentor_id to calculate average effectiveness
  const mentorStats = new Map();
  
  surveyData.forEach(survey => {
    const mentorId = survey.mentor.id;
    
    if (!mentorStats.has(mentorId)) {
      mentorStats.set(mentorId, {
        mentorName: survey.mentor.name,
        effectivenessScores: [],
        sessionCount: 0
      });
    }
    
    const stats = mentorStats.get(mentorId);
    stats.effectivenessScores.push(survey.mentor_effectiveness);
    stats.sessionCount += 1;
    stats.mentorName = survey.mentor.name; // Keep updating to ensure we have the name
  });
  
  // Calculate average effectiveness and create top mentors list
  const topMentors: Array<{
    id: string;
    mentorName: string;
    avgEffectiveness: number;
    sessionCount: number;
  }> = [];
  
  mentorStats.forEach((stats, mentorId) => {
    const avgEffectiveness = stats.effectivenessScores.reduce((sum: number, score: number) => sum + score, 0) / stats.effectivenessScores.length;
    
    topMentors.push({
      id: mentorId,
      mentorName: stats.mentorName,
      avgEffectiveness: parseFloat(avgEffectiveness.toFixed(1)),
      sessionCount: stats.sessionCount
    });
  });
  
  // Sort by effectiveness (highest first) and take top 10
  return topMentors
    .sort((a, b) => b.avgEffectiveness - a.avgEffectiveness)
    .slice(0, 10);
};

const topMentorsByEffectiveness = processTopMentorsByEffectiveness();

// Process red flag mentees data
const processRedFlagMentees = () => {
  const surveyData = menteePostSurveyData.mentee_postsurvey || [];
  
  // Group by mentee_id to calculate averages and counts
  const menteeStats = new Map();
  
  surveyData.forEach(survey => {
    const menteeId = survey.mentee.id;
    
    if (!menteeStats.has(menteeId)) {
      menteeStats.set(menteeId, {
        menteeName: survey.mentee.name,
        mentorName: survey.mentor.name, // Use the most recent mentor
        satisfactionScores: [],
        objectivesMet: [],
        sessionCount: 0
      });
    }
    
    const stats = menteeStats.get(menteeId);
    stats.satisfactionScores.push(survey.satisfaction_level);
    stats.objectivesMet.push(survey.objectives_met);
    stats.sessionCount += 1;
    stats.mentorName = survey.mentor.name; // Keep updating to get latest mentor
  });
  
  // Calculate averages and filter red flags
  const redFlags: Array<{
    id: string;
    menteeName: string;
    mentorName: string;
    avgSatisfaction: string;
    objectivesMet: string;
    sessionCount: number;
  }> = [];
  
  menteeStats.forEach((stats, menteeId) => {
    const avgSatisfaction = stats.satisfactionScores.reduce((sum: number, score: number) => sum + score, 0) / stats.satisfactionScores.length;
    const objectivesMetPercentage = (stats.objectivesMet.reduce((sum: number, met: number) => sum + met, 0) / stats.objectivesMet.length) * 100;
    
    // Red flag criteria: avg satisfaction < 5 OR session count < 3
    if (avgSatisfaction < 5 || stats.sessionCount < 3) {
      redFlags.push({
        id: menteeId,
        menteeName: stats.menteeName,
        mentorName: stats.mentorName,
        avgSatisfaction: avgSatisfaction.toFixed(1),
        objectivesMet: `${objectivesMetPercentage.toFixed(0)}%`,
        sessionCount: stats.sessionCount
      });
    }
  });
  
  // Sort by lowest satisfaction first
  return redFlags.sort((a, b) => parseFloat(a.avgSatisfaction) - parseFloat(b.avgSatisfaction));
};

const redFlagMentees = processRedFlagMentees();

// Process mentor survey data to create satisfaction level chart data
const processMentorSatisfactionData = () => {
  const satisfactionCounts = Array.from({ length: 10 }, (_, i) => ({
    rating: i + 1,
    count: 0
  }));

  // Access the mentor survey data array directly
  const surveyData = mentorPostSurveyData || [];
  
  surveyData.forEach(survey => {
    const rating = survey.satisfaction_level;
    if (rating >= 1 && rating <= 10) {
      satisfactionCounts[rating - 1].count++;
    }
  });

  return satisfactionCounts;
};

// Process mentor low ratings data (satisfaction_level <= 3)
const processMentorLowRatingsData = () => {
  const surveyData = mentorPostSurveyData || [];
  
  return surveyData
    .filter(survey => survey.satisfaction_level <= 3)
    .sort((a, b) => a.satisfaction_level - b.satisfaction_level) // Sort by rating ascending
    .map((survey, index) => ({
      id: index + 1,
      mentee: survey.mentee.name,
      mentor: survey.mentor.name,
      rating: survey.satisfaction_level
    }));
};

const mentorSatisfactionData = processMentorSatisfactionData();
const mentorLowRatings = processMentorLowRatingsData();

// Process mentor objectives met data for pie chart
const processMentorObjectivesData = () => {
  const surveyData = mentorPostSurveyData || [];
  
  let yesCount = 0;
  let noCount = 0;
  
  surveyData.forEach(survey => {
    if (survey.objectives_met === 1) {
      yesCount++;
    } else if (survey.objectives_met === 0) {
      noCount++;
    }
  });
  
  return [
    { name: 'Yes', value: yesCount, color: '#10b981' },
    { name: 'No', value: noCount, color: '#ef4444' }
  ];
};

const mentorObjectivesData = processMentorObjectivesData();

// Process overall mentor survey metrics
const processMentorOverallMetrics = () => {
  const surveyData = mentorPostSurveyData || [];
  
  const totalResponses = surveyData.length;
  
  const avgSatisfaction = surveyData.length > 0 
    ? surveyData.reduce((sum: number, survey) => sum + survey.satisfaction_level, 0) / surveyData.length
    : 0;
    
  const avgEffectiveness = surveyData.length > 0
    ? surveyData.reduce((sum: number, survey) => sum + survey.mentor_effectiveness, 0) / surveyData.length
    : 0;
  
  return {
    totalResponses,
    avgSatisfaction: avgSatisfaction.toFixed(1),
    avgEffectiveness: avgEffectiveness.toFixed(1)
  };
};

const mentorOverallMetrics = processMentorOverallMetrics();

// Process mentors requiring attention data
const processMentorsRequiringAttention = () => {
  const surveyData = mentorPostSurveyData || [];
  
  // Group by mentor_id to calculate averages and counts
  const mentorStats = new Map();
  
  surveyData.forEach(survey => {
    const mentorId = survey.mentor.id;
    
    if (!mentorStats.has(mentorId)) {
      mentorStats.set(mentorId, {
        mentorName: survey.mentor.name,
        menteeName: survey.mentee.name, // Use the most recent mentee
        satisfactionScores: [],
        objectivesMet: [],
        effectivenessScores: [],
        sessionCount: 0
      });
    }
    
    const stats = mentorStats.get(mentorId);
    stats.satisfactionScores.push(survey.satisfaction_level);
    stats.objectivesMet.push(survey.objectives_met);
    stats.effectivenessScores.push(survey.mentor_effectiveness);
    stats.sessionCount += 1;
    stats.menteeName = survey.mentee.name; // Keep updating to get latest mentee
  });
  
  // Calculate averages and filter mentors requiring attention
  const mentorsNeedingAttention: Array<{
    id: string;
    mentorName: string;
    menteeName: string;
    avgSatisfaction: string;
    objectivesMet: string;
    mentorEffectiveness: string;
    sessionCount: number;
  }> = [];
  
  mentorStats.forEach((stats, mentorId) => {
    const avgSatisfaction = stats.satisfactionScores.reduce((sum: number, score: number) => sum + score, 0) / stats.satisfactionScores.length;
    const objectivesMetPercentage = (stats.objectivesMet.reduce((sum: number, met: number) => sum + met, 0) / stats.objectivesMet.length) * 100;
    const avgEffectiveness = stats.effectivenessScores.reduce((sum: number, score: number) => sum + score, 0) / stats.effectivenessScores.length;
    
    // Attention criteria: avg satisfaction < 5 OR session count < 3 OR effectiveness < 5
    if (avgSatisfaction < 5 || stats.sessionCount < 3 || avgEffectiveness < 5) {
      mentorsNeedingAttention.push({
        id: mentorId,
        mentorName: stats.mentorName,
        menteeName: stats.menteeName,
        avgSatisfaction: avgSatisfaction.toFixed(1),
        objectivesMet: `${objectivesMetPercentage.toFixed(0)}%`,
        mentorEffectiveness: avgEffectiveness.toFixed(1),
        sessionCount: stats.sessionCount
      });
    }
  });
  
  // Sort by lowest satisfaction first
  return mentorsNeedingAttention.sort((a, b) => parseFloat(a.avgSatisfaction) - parseFloat(b.avgSatisfaction));
};

const mentorsRequiringAttention = processMentorsRequiringAttention();

export default function AnalyticsPage() {
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    
    // Check authentication and user role
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        setUser(user);
        
        // Fetch user role
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error("Error fetching user role:", error);
          router.push('/');
          return;
        }
        
        const role = profile?.role;
        setUserRole(role);
        
        // Only allow admin users
        if (role !== 'admin') {
          router.push('/');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">
            {loading ? "Checking permissions..." : "Loading analytics..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
        <Navbar />
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Monitor your application performance and user engagement metrics.
          </p>
        </div>

        {/* Top Mentors Section */}
        <section className="mb-8">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-green-600">Top 10 Mentors by Effectiveness</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Highest rated mentors based on mentee feedback
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-slate-600 border-b pb-2">
                  <div>Rank</div>
                  <div>Mentor Name</div>
                  <div>Avg Effectiveness</div>
                  <div>Sessions Conducted</div>
                </div>
                {topMentorsByEffectiveness.length > 0 ? (
                  <div className="space-y-0">
                    {topMentorsByEffectiveness.map((mentor, index) => (
                      <div key={mentor.id} className="grid grid-cols-4 gap-4 text-sm py-3 border-b border-slate-100 last:border-b-0 hover:bg-green-50">
                        <div className="font-bold text-green-600">#{index + 1}</div>
                        <div className="font-medium">{mentor.mentorName}</div>
                        <div className="font-medium text-green-600">{mentor.avgEffectiveness}/10</div>
                        <div className="text-slate-600">{mentor.sessionCount}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-8">
                    <p className="text-sm">No mentor data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Mentee Analytics Section */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-blue-800">Mentee Analytics</h1>
                <p className="text-sm text-blue-600 mt-1">Performance insights from mentee feedback</p>
              </div>
            </div>
          </div>
          
          {/* Mentee Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{menteeOverallMetrics.totalResponses.toLocaleString()}</div>
                <p className="text-xs text-slate-600 mt-1">Mentee survey responses</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Average Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{menteeOverallMetrics.avgSatisfaction}/10</div>
                <p className="text-xs text-slate-600 mt-1">Overall satisfaction rating</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Average Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{menteeOverallMetrics.avgEffectiveness}/10</div>
                <p className="text-xs text-slate-600 mt-1">Mentor effectiveness rating</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart */}
            <Card className="border border-slate-200 shadow-sm h-[400px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-lg font-semibold">Objectives Met</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={menteeObjectivesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent as number * 100).toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {menteeObjectivesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                        formatter={(value, name) => [value, `${name} (${((value as number / menteeObjectivesData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)`]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card className="border border-slate-200 shadow-sm h-[400px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-lg font-semibold">Satisfaction Level</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={menteeSatisfactionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="rating" 
                        stroke="#64748b"
                        type="category"
                      />
                      <YAxis 
                        stroke="#64748b"
                        label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                        formatter={(value, name) => [value, 'Number of Responses']}
                        labelFormatter={(label) => `Rating: ${label}`}
                      />
                      <Bar dataKey="count" fill="#3b82f6" name="Responses" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 3-Column Table */}
            <Card className="border border-slate-200 shadow-sm h-[400px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-lg font-semibold">Low Ratings</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                <div className="flex-shrink-0 mb-3">
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium text-slate-600 border-b pb-2">
                    <div>Mentee</div>
                    <div>Mentor</div>
                    <div>Rating</div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {menteeLowRatings.length > 0 ? (
                    <div className="space-y-0">
                      {menteeLowRatings.map((rating) => (
                        <div key={rating.id} className="grid grid-cols-3 gap-4 text-sm py-2 border-b border-slate-100 last:border-b-0">
                          <div className="font-medium">{rating.mentee}</div>
                          <div className="text-slate-600">{rating.mentor}</div>
                          <div className={`font-medium ${
                            rating.rating <= 2 ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            {rating.rating}/10
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-4">
                      No ratings of 3 or below found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Red Flag Mentees Table */}
          <div className="mt-6">
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-yellow-600"> Mentees Requiring Support</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Mentees with average satisfaction &lt; 5 or &lt; 3 sessions attended
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-4 text-sm font-medium text-slate-600 border-b pb-2">
                    <div>Mentee</div>
                    <div>Mentor</div>
                    <div>Avg Satisfaction</div>
                    <div>Objectives Met</div>
                    <div>No. of Sessions</div>
                  </div>
                  {redFlagMentees.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      {redFlagMentees.map((mentee) => (
                        <div key={mentee.id} className="grid grid-cols-5 gap-4 text-sm py-3 border-b border-slate-100 last:border-b-0 hover:bg-gray-50">
                          <div className="font-medium">{mentee.menteeName}</div>
                          <div className="text-slate-600">{mentee.mentorName}</div>
                          <div className={`font-medium ${parseFloat(mentee.avgSatisfaction) < 5 ? 'text-red-600' : 'text-slate-700'}`}>{mentee.avgSatisfaction}/10</div>
                          <div className="text-slate-600">{mentee.objectivesMet}</div>
                          <div className={`font-medium ${mentee.sessionCount < 3 ? 'text-red-600' : 'text-slate-700'}`}>{mentee.sessionCount}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-8">
                      <p className="text-sm">No mentees requiring support found</p>
                      <p className="text-xs mt-1">All mentees are performing well</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Mentor Section: Bar Chart and Table */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-purple-800">Mentor Analytics</h1>
                <p className="text-sm text-purple-600 mt-1">Performance insights from mentor feedback</p>
              </div>
            </div>
          </div>
          
          {/* Mentor Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mentorOverallMetrics.totalResponses.toLocaleString()}</div>
                <p className="text-xs text-slate-600 mt-1">Mentor survey responses</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Average Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mentorOverallMetrics.avgSatisfaction}/10</div>
                <p className="text-xs text-slate-600 mt-1">Overall satisfaction rating</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Average Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mentorOverallMetrics.avgEffectiveness}/10</div>
                <p className="text-xs text-slate-600 mt-1">Mentor effectiveness rating</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart */}
            <Card className="border border-slate-200 shadow-sm h-[400px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-lg font-semibold">Objectives Met</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mentorObjectivesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent as number * 100).toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {mentorObjectivesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                        formatter={(value, name) => [value, `${name} (${((value as number / mentorObjectivesData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)`]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card className="border border-slate-200 shadow-sm h-[400px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-lg font-semibold">Satisfaction Level</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mentorSatisfactionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="rating" 
                        stroke="#64748b"
                        type="category"
                      />
                      <YAxis 
                        stroke="#64748b"
                        label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                        formatter={(value, name) => [value, 'Number of Responses']}
                        labelFormatter={(label) => `Rating: ${label}`}
                      />
                      <Bar dataKey="count" fill="#3b82f6" name="Responses" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 3-Column Table */}
            <Card className="border border-slate-200 shadow-sm h-[400px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-lg font-semibold">Low Ratings</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                <div className="flex-shrink-0 mb-3">
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium text-slate-600 border-b pb-2">
                    <div>Mentor</div>
                    <div>Mentee</div>
                    <div>Rating</div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {mentorLowRatings.length > 0 ? (
                    <div className="space-y-0">
                      {mentorLowRatings.map((rating) => (
                        <div key={rating.id} className="grid grid-cols-3 gap-4 text-sm py-2 border-b border-slate-100 last:border-b-0">
                          <div className="font-medium">{rating.mentor}</div>
                          <div className="text-slate-600">{rating.mentee}</div>
                          <div className={`font-medium ${
                            rating.rating <= 2 ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            {rating.rating}/10
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-4">
                      No ratings of 3 or below found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mentors Requiring Attention Table */}
          <div className="mt-6">
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-yellow-600">Mentors Requiring Attention</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Mentors with average satisfaction &lt; 5, &lt; 3 sessions attended, or effectiveness &lt; 5
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-6 gap-4 text-sm font-medium text-slate-600 border-b pb-2">
                    <div>Mentor</div>
                    <div>Mentee</div>
                    <div>Avg Satisfaction</div>
                    <div>Objectives Met</div>
                    <div>Mentor Effectiveness</div>
                    <div>No. of Sessions</div>
                  </div>
                  {mentorsRequiringAttention.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      {mentorsRequiringAttention.map((mentor) => (
                        <div key={mentor.id} className="grid grid-cols-6 gap-4 text-sm py-3 border-b border-slate-100 last:border-b-0 hover:bg-gray-50">
                          <div className="font-medium">{mentor.mentorName}</div>
                          <div className="text-slate-600">{mentor.menteeName}</div>
                          <div className={`font-medium ${parseFloat(mentor.avgSatisfaction) < 5 ? 'text-red-600' : 'text-slate-700'}`}>{mentor.avgSatisfaction}/10</div>
                          <div className="text-slate-600">{mentor.objectivesMet}</div>
                          <div className={`font-medium ${parseFloat(mentor.mentorEffectiveness) < 5 ? 'text-red-600' : 'text-slate-700'}`}>{mentor.mentorEffectiveness}/10</div>
                          <div className={`font-medium ${mentor.sessionCount < 3 ? 'text-red-600' : 'text-slate-700'}`}>{mentor.sessionCount}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-8">
                      <p className="text-sm">No mentors requiring attention found</p>
                      <p className="text-xs mt-1">All mentors are performing well</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
