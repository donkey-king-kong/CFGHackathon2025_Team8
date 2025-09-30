"use client";
import Navbar from "@/components/global_navbar/Navbar";
import SchedulerForm from "@/components/scheduler/SchedulerForm";

export default function SchedulerPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <h1 className="text-2xl font-bold text-[#3C14A6] mb-6">Schedule New Mentorship Session</h1>
          <SchedulerForm />
        </div>
      </div>
    </main>
  );
}
