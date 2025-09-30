export default function Features() {
  const items = [
    { 
      title: "AI-Powered Mentorship", 
      desc: "Leverage our AI writer to draft professional emails, meeting agendas, and feedback, making mentorship more effective."
    },
    { 
      title: "Progress Tracking", 
      desc: "Keep track of meetings, goals, and achievements through our comprehensive logging and analytics system."
    },
    { 
      title: "Structured Guidance", 
      desc: "Access proven mentorship frameworks, meeting templates, and resources to ensure productive mentor-mentee relationships."
    },
  ];
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-[#3C14A6]">Platform Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((it) => (
            <div 
              key={it.title} 
              className="rounded-xl border-2 border-[#3C14A6]/10 p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-[#FFA700]/5"
            >
              <div className="font-semibold text-xl text-[#3C14A6]">{it.title}</div>
              <p className="text-base text-slate-600 mt-3">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
