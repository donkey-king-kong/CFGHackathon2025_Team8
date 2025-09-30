"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Mentee {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface SchedulerData {
  title: string;
  date: string;
  time: string;
  duration: number;
  menteeId: string;
  description: string;
}

export default function SchedulerForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [meetingResult, setMeetingResult] = useState<any>(null);
  
  // Mock mentees data - in real app, this would come from API
  const [mentees] = useState<Mentee[]>([
    { id: "1", name: "Felicia Hwang", email: "zhanyoulau.dynp@gmail.com", phone: "+6598889775" },
    { id: "2", name: "Bob Smith", email: "bob@example.com", phone: "+1234567891" },
    { id: "3", name: "Carol Davis", email: "carol@example.com", phone: "+1234567892" },
  ]);

  const [formData, setFormData] = useState<SchedulerData>({
    title: "Mentor-Mentee Programme",
    date: "",
    time: "",
    duration: 60,
    menteeId: "",
    description: "Mentorship session to discuss career development and provide guidance."
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/scheduler/create-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create meeting');
      }

      setSuccessMessage(`Meeting created successfully! Meeting ID: ${result.meetingId}`);
      setMeetingResult(result);
      
      // Reset form
      setFormData({
        title: "Mentor-Mentee Programme",
        date: "",
        time: "",
        duration: 60,
        menteeId: "",
        description: "Mentorship session to discuss career development and provide guidance."
      });

    } catch (error) {
      console.error('Error creating meeting:', error);
      setSuccessMessage(`Error: ${error instanceof Error ? error.message : 'Failed to create meeting'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMentee = mentees.find(m => m.id === formData.menteeId);
  const isValidMeetLink = (url: string | undefined) => {
    if (!url) return false;
    return /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\/.*)?$/i.test(url);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meeting Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3C14A6] focus:border-transparent"
            required
          />
        </div>

        {/* Date and Time */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3C14A6] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Time
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3C14A6] focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes)
          </label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3C14A6] focus:border-transparent"
          >
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>

        {/* Mentee Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Mentee
          </label>
          <select
            value={formData.menteeId}
            onChange={(e) => setFormData({ ...formData, menteeId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3C14A6] focus:border-transparent"
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

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3C14A6] focus:border-transparent resize-none"
            placeholder="Describe the purpose of this meeting..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-[#3C14A6] text-white rounded-lg hover:bg-[#3C14A6]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isSubmitting ? 'Creating Meeting...' : 'Create Meeting'}
          </button>
        </div>
      </form>

      {/* Success/Error Message */}
      {successMessage && (
        <div className={`mt-6 p-4 rounded-lg ${
          successMessage.startsWith('Error') 
            ? 'bg-red-50 border border-red-200 text-red-700' 
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {successMessage}
        </div>
      )}

      {/* Meeting Result with WhatsApp Sharing */}
      {meetingResult && (
        <div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎉 Meeting Created Successfully!</h3>
          
          <div className="space-y-4">
            {/* Meeting Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Meeting Details</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Title:</strong> {meetingResult.meetingDetails.title}</p>
                <p><strong>Date:</strong> {meetingResult.meetingDetails.date}</p>
                <p><strong>Time:</strong> {meetingResult.meetingDetails.time}</p>
                <p><strong>Duration:</strong> {meetingResult.meetingDetails.duration}</p>
                <p><strong>Mentee:</strong> {meetingResult.mentee.name} ({meetingResult.mentee.email})</p>
              </div>
            </div>

            {/* Google Meet Link */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🔗 Google Meet Link</h4>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={meetingResult.meetLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded text-sm"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(meetingResult.meetLink)}
                  className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Email Status */}
            <div className={`p-4 rounded-lg ${
              meetingResult.emailSent 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <h4 className="font-medium mb-2">
                📧 Email RSVP Status
              </h4>
              <p className="text-sm">
                {meetingResult.emailSent 
                  ? `✅ Email invitation sent to ${meetingResult.mentee.email}`
                  : `⚠️ Email invitation could not be sent to ${meetingResult.mentee.email}`
                }
              </p>
            </div>

            {/* WhatsApp Sharing */}
            {meetingResult.mentee.phone && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">📱 Share via WhatsApp</h4>
                <p className="text-sm text-green-700 mb-3">
                  Send meeting details directly to {meetingResult.mentee.name} via WhatsApp
                </p>
                <a
                  href={meetingResult.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  Share on WhatsApp
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setMeetingResult(null);
                  setSuccessMessage(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Create Another Meeting
              </button>
              <button
                onClick={() => window.open(meetingResult.meetLink, '_blank')}
                disabled={!isValidMeetLink(meetingResult?.meetLink)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isValidMeetLink(meetingResult?.meetLink)
                    ? 'bg-[#3C14A6] text-white hover:bg-[#3C14A6]/90'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Join Meeting Now
              </button>
              {!isValidMeetLink(meetingResult?.meetLink) && (
                <span className="text-sm text-gray-500 self-center">
                  Configure Google Calendar API to enable real Meet links.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected Mentee Info */}
      {selectedMentee && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Selected Mentee</h3>
          <p className="text-blue-700">
            <strong>Name:</strong> {selectedMentee.name}<br />
            <strong>Email:</strong> {selectedMentee.email}<br />
            {selectedMentee.phone && (
              <>
                <strong>Phone:</strong> {selectedMentee.phone}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
