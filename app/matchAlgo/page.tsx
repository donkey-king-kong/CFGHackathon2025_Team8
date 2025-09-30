"use client";

import Navbar from "@/components/global_navbar/Navbar";
import SecondaryNav from "@/components/landing_page/SecondaryNav";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { rowToPerson, scoreMatch, type MatchExplanation } from "@/lib/match";

// where to save approvals; set to "matches" if you used that table earlier
const MATCH_TABLE = "mentor_mentee";

type DbRow = { id: string; name: string | null; role: string; details: any };

export default function MatchAlgo() {
  const [mentors, setMentors] = useState<DbRow[]>([]);
  const [mentees, setMentees] = useState<DbRow[]>([]);
  const [approved, setApproved] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: ms } = await supabase
        .from("profiles")
        .select("id, name, role, details")
        .eq("role", "mentor");

      const { data: ts } = await supabase
        .from("profiles")
        .select("id, name, role, details")
        .eq("role", "mentee");

      setMentors((ms ?? []) as DbRow[]);
      setMentees((ts ?? []) as DbRow[]);
      setLoading(false);
    })();
  }, []);

  const top5ByMentor = useMemo(() => {
    const map: Record<string, Array<{ mentee: DbRow; score: number; explain: MatchExplanation }>> =
      {};
    for (const m of mentors) {
      const mPerson = rowToPerson(m);
      const ranked =
        mentees
          .map((t) => {
            const tPerson = rowToPerson(t);
            const explain = scoreMatch(mPerson, tPerson);
            return { mentee: t, explain, score: explain.totalPct };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 5) || [];
      map[m.id] = ranked;
    }
    return map;
  }, [mentors, mentees]);

  useEffect(() => {
    if (!loading && mentors.length && !openId) setOpenId(mentors[0].id);
  }, [loading, mentors, openId]);

  function toggleApprove(mentorId: string, menteeId: string, score: number) {
    setApproved((prev) => {
      const next = { ...prev };
      const set = new Set(next[mentorId] ?? []);
      if (set.has(menteeId)) set.delete(menteeId);
      else {
        if (set.size >= 2) return prev;
        set.add(menteeId);
      }
      next[mentorId] = set;
      return next;
    });

    // try persist; ignore failure during hackathon demo
    supabase
      .from(MATCH_TABLE)
      .upsert({ mentor_id: mentorId, mentee_id: menteeId, score, approved: true }, { onConflict: "mentor_id, mentee_id" })
      .then(() => {})
      .catch(() => {});
  }

  return (
    <main>
      <Navbar />
      <SecondaryNav />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Mentor ↔ Mentee Matching</h1>

        {loading && <div>Loading…</div>}

        {!loading && mentors.length === 0 && mentees.length === 0 && (
          <div className="text-slate-600">
            No mentors/mentees found. Ensure <code>profiles.role</code> is “mentor” or “mentee” and
            <code>details</code> contains skills/hobbies/industrySector/educationalBackground.
          </div>
        )}

        {mentors.map((m) => {
          const picks = top5ByMentor[m.id] ?? [];
          const selected = approved[m.id] ?? new Set<string>();
          const atLimit = selected.size >= 2;
          const open = openId === m.id;

          return (
            <section key={m.id} className="border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenId(open ? null : m.id)}
                className="w-full bg-gray-50 px-4 py-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{m.name ?? "Mentor"}</span>
                  <span className="text-xs text-slate-600">Approved {selected.size}/2</span>
                </div>
                <span className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
                  ▾
                </span>
              </button>

              {open && (
                <ul className="divide-y">
                  {picks.map(({ mentee, score, explain }) => {
                    const isApproved = selected.has(mentee.id);
                    const disabled = !isApproved && atLimit;
                    return (
                      <li key={mentee.id} className={`px-4 py-3 ${disabled ? "opacity-50" : ""}`}>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="font-medium">{mentee.name ?? "Mentee"}</div>
                            <div className="text-sm text-slate-600">
                              {explain.parts
                                .map((p) => `${p.label} ${Math.round(p.score * 100)}%`)
                                .join(" • ")}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold">{score}% match</span>
                            <button
                              disabled={disabled}
                              onClick={() => toggleApprove(m.id, mentee.id, score)}
                              className={`px-3 py-1.5 rounded border ${
                                isApproved ? "bg-black text-white" : "hover:bg-gray-50"
                              }`}
                              title={disabled ? "Max 2 mentees approved" : isApproved ? "Unapprove" : "Approve"}
                            >
                              {isApproved ? "Approved" : "Approve"}
                            </button>

                            <details className="text-sm">
                              <summary className="cursor-pointer select-none">Why?</summary>
                              <div className="mt-2 text-slate-700">
                                <div>Industry overlap: {explain.overlaps.industry?.join(", ") || "—"}</div>
                                <div>Shared skills: {explain.overlaps.skills?.join(", ") || "—"}</div>
                                <div>Shared hobbies: {explain.overlaps.hobbies?.join(", ") || "—"}</div>
                                <div>
                                  Education: {explain.parts.find((p) => p.label === "Education")?.details}
                                </div>
                              </div>
                            </details>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  {picks.length === 0 && (
                    <li className="px-4 py-6 text-sm text-slate-600">No recommendations.</li>
                  )}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
