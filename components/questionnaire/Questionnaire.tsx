"use client";
import { useState } from "react";

type LocationType = 'online' | 'offline';

interface Mentee {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface MentorFormData {
  menteeId: string;
  enjoymentRating: number;
  objectivesMet: boolean;
  reasonForNo: string;
  progressNoticed: string;
  sessionTime: string;
  location: LocationType;
}

interface MenteeFormData {
  enjoymentRating: number;
  objectivesMet: boolean;
  reasonForNo: string;
  insightsProvided: number;
  insightsComment: string;
  organizerFeedback: string;
}

export type UserRole = 'mentor' | 'mentee';

interface QuestionnaireProps {
  role: UserRole;
  onSubmit: (data: any, userType: UserRole, meetingNotes?: string) => void;
}

export default function Questionnaire({ role, onSubmit }: QuestionnaireProps) {
  const [meetingNotes, setMeetingNotes] = useState('');
  
  // Mock mentees data - same as scheduler
  const mentees: Mentee[] = [
    { id: "1", name: "Felicia Hwang", email: "zhanyoulau.dynp@gmail.com", phone: "+6598889775" },
    { id: "2", name: "Bob Smith", email: "bob@example.com", phone: "+1234567891" },
    { id: "3", name: "Carol Davis", email: "carol@example.com", phone: "+1234567892" },
  ];
  
  const [mentorData, setMentorData] = useState<MentorFormData>({
    menteeId: '',
    enjoymentRating: 0,
    objectivesMet: true,
    reasonForNo: '',
    progressNoticed: '',
    sessionTime: '',
    location: 'online'
  });
  const [menteeData, setMenteeData] = useState<MenteeFormData>({
    enjoymentRating: 0,
    objectivesMet: true,
    reasonForNo: '',
    insightsProvided: 0,
    insightsComment: '',
    organizerFeedback: ''
  });

  const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
        >
          ★
        </button>
      ))}
    </div>
  );

  const NumberRating = ({ rating, onRatingChange, labels }: { rating: number; onRatingChange: (rating: number) => void; labels: string[] }) => (
    <div className="flex items-center gap-4">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onRatingChange(num)}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
              num === rating 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="text-sm text-gray-600">
        {rating > 0 && labels[rating - 1]}
      </div>
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'mentor') {
      onSubmit(mentorData, 'mentor', meetingNotes);
    } else {
      onSubmit(menteeData, 'mentee');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Session Feedback - {role === 'mentor' ? 'Mentor' : 'Mentee'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mentor-specific: Mentee Selection */}
        {role === 'mentor' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Mentee
            </label>
            <select
              value={mentorData.menteeId}
              onChange={(e) => setMentorData({ ...mentorData, menteeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose a mentee...</option>
              {mentees.map((mentee) => (
                <option key={mentee.id} value={mentee.id}>
                  {mentee.name} ({mentee.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Common Questions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How much did you enjoy the session?
          </label>
          <StarRating
            rating={role === 'mentor' ? mentorData.enjoymentRating : menteeData.enjoymentRating}
            onRatingChange={(rating) => {
              if (role === 'mentor') {
                setMentorData({ ...mentorData, enjoymentRating: rating });
              } else {
                setMenteeData({ ...menteeData, enjoymentRating: rating });
              }
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Were the objectives met?
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={role === 'mentor' ? mentorData.objectivesMet : menteeData.objectivesMet}
                onChange={() => {
                  if (role === 'mentor') {
                    setMentorData({ ...mentorData, objectivesMet: true });
                  } else {
                    setMenteeData({ ...menteeData, objectivesMet: true });
                  }
                }}
                className="mr-2"
              />
              <span className="text-gray-700">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={role === 'mentor' ? !mentorData.objectivesMet : !menteeData.objectivesMet}
                onChange={() => {
                  if (role === 'mentor') {
                    setMentorData({ ...mentorData, objectivesMet: false });
                  } else {
                    setMenteeData({ ...menteeData, objectivesMet: false });
                  }
                }}
                className="mr-2"
              />
              <span className="text-gray-700">No</span>
            </label>
          </div>
        </div>

        {/* Reason box for No */}
        {(role === 'mentor' ? !mentorData.objectivesMet : !menteeData.objectivesMet) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Please explain why the objectives were not met:
            </label>
            <textarea
              value={role === 'mentor' ? mentorData.reasonForNo : menteeData.reasonForNo}
              onChange={(e) => {
                if (role === 'mentor') {
                  setMentorData({ ...mentorData, reasonForNo: e.target.value });
                } else {
                  setMenteeData({ ...menteeData, reasonForNo: e.target.value });
                }
              }}
              className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Please provide details..."
            />
          </div>
        )}

        {/* Mentor-specific Questions */}
        {role === 'mentor' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Time
              </label>
              <input
                type="datetime-local"
                value={mentorData.sessionTime}
                onChange={(e) => setMentorData({ ...mentorData, sessionTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Session Location
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="online"
                    checked={mentorData.location === 'online'}
                    onChange={(e) => setMentorData({ ...mentorData, location: e.target.value as LocationType })}
                    className="mr-2"
                  />
                  <span className="text-gray-700">Online</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="offline"
                    checked={mentorData.location === 'offline'}
                    onChange={(e) => setMentorData({ ...mentorData, location: e.target.value as LocationType })}
                    className="mr-2"
                  />
                  <span className="text-gray-700">Offline</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What progress did you notice in your mentee since the last session?
              </label>
              <textarea
                value={mentorData.progressNoticed}
                onChange={(e) => setMentorData({ ...mentorData, progressNoticed: e.target.value })}
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe the progress you observed..."
              />
            </div>

          </>
        )}

        {/* Mentee-specific Questions */}
        {role === 'mentee' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Did the mentor provide insights into skills or qualifications needed for your chosen field?
              </label>
              <NumberRating
                rating={menteeData.insightsProvided}
                onRatingChange={(rating) => setMenteeData({ ...menteeData, insightsProvided: rating })}
                labels={['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments on the insights provided:
              </label>
              <textarea
                value={menteeData.insightsComment}
                onChange={(e) => setMenteeData({ ...menteeData, insightsComment: e.target.value })}
                className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Share your thoughts on the insights..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anything you want the organizers to know?
              </label>
              <textarea
                value={menteeData.organizerFeedback}
                onChange={(e) => setMenteeData({ ...menteeData, organizerFeedback: e.target.value })}
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Any feedback or suggestions for the organizers..."
              />
            </div>
          </>
        )}

        {/* Meeting Notes Section - Only for Mentors */}
        {role === 'mentor' && (
          <div className="pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Notes / Discussion Text
            </label>
            <textarea
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
              placeholder="Add your meeting notes or discussion text for summarizing."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="mt-2 text-sm text-gray-500">
              {meetingNotes.length} characters
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {role === 'mentor' ? 'Submit' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
}
