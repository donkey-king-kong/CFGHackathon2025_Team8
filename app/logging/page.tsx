"use client";
import { useState } from "react";
import Navbar from "@/components/global_navbar/Navbar";
import Questionnaire, { UserRole } from "@/components/questionnaire/Questionnaire";

interface SummaryResult {
  discussion: string;
  nextSteps: string[];
  keyDecisions: string[];
  participants: string[];
}

export default function LoggingPage() {
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionnaireData, setQuestionnaireData] = useState<any>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(true);
  
  const userRole: UserRole = 'mentor';

  const generateSummary = async () => {
    if (!inputText.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const summaryData = await response.json();
      setSummary(summaryData);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary({
        discussion: 'Unable to generate summary at this time. Please try again.',
        nextSteps: ['Please try submitting again'],
        keyDecisions: [],
        participants: []
      });
    } finally {
      setIsGenerating(false);
    }
  };


  const handleQuestionnaireSubmit = async (data: any, userType: string, meetingNotes?: string) => {
    setQuestionnaireData({ ...data, userType });
    setShowQuestionnaire(false);
    
    // If mentor and has meeting notes, generate summary first
    let summaryResult = null;
    if (userType === 'mentor' && meetingNotes && meetingNotes.trim()) {
      setInputText(meetingNotes);
      summaryResult = await generateSummaryWithNotes(meetingNotes);
    }
    
    // Save data to database (with summary if available)
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionnaireData: data,
          userRole: userType,
          meetingNotes: meetingNotes || '',
          summaryData: summaryResult,
          userId: 'temp-user-id', // TODO: Replace with actual user ID from auth
        }),
      });

      if (response.ok) {
        console.log('Session data saved successfully');
      } else {
        console.error('Failed to save session data');
      }
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  };

  const generateSummaryWithNotes = async (notes: string) => {
    if (!notes.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // Generate summary
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: notes }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SummaryResult = await response.json();
      setSummary(data);
      return data; // Return the summary data
    } catch (error) {
      console.error("Error generating summary:", error);
      // Fallback to a basic summary if API fails
      const fallbackSummary = {
        discussion: "Unable to generate summary at this time. Please try again.",
        nextSteps: [
          "Please try submitting again",
        ],
        keyDecisions: [],
        participants: []
      };
      setSummary(fallbackSummary);
      return fallbackSummary;
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAll = () => {
    setInputText("");
    setSummary(null);
    setQuestionnaireData(null);
    setShowQuestionnaire(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Meeting Log
          </h1>
          <p className="text-lg text-gray-600">
            Complete the session feedback and input your meeting notes
          </p>
        </div>

        {showQuestionnaire && (
          <Questionnaire role={userRole} onSubmit={handleQuestionnaireSubmit} />
        )}

        {questionnaireData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Feedback submitted successfully! ({questionnaireData.userType === 'mentor' ? 'Mentor' : 'Mentee'} feedback)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Meeting Notes Section - Only show for mentors who haven't generated summary yet */}
        {questionnaireData && questionnaireData.userType === 'mentor' && !summary && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="mb-4">
              <label htmlFor="meeting-text" className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Notes / Discussion Text
              </label>
              <textarea
                id="meeting-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Input your meeting notes, discussion points for summariing."
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  {inputText.length} characters
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={clearAll}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear
                  </button>
                  <button
                    onClick={generateSummary}
                    disabled={!inputText.trim() || isGenerating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? "Analyzing..." : "Analyze & Summarize"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {summary && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Session Analysis & Summary</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Discussion Summary</h3>
              <p className="text-gray-700 leading-relaxed">{summary.discussion}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Potential Next Steps</h3>
              <ul className="space-y-2">
                {summary.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t">
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Generate New Summary
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
