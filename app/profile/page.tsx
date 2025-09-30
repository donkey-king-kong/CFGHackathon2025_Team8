"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlobalNav from "@/components/global_navbar/Navbar";
import { supabase } from "@/lib/supabase/client";
import { matchingMetadata } from "@/lib/algo/properties";
import z from "zod/v4";

type MatchingMetadata = z.infer<typeof matchingMetadata>;

const MIN_MAX = {
  industrySector: { min: 1, max: 3 },
  skills: { min: 1, max: 5 },
  educationalBackground: { min: 1, max: 3 },
  hobbies: { min: 1, max: 5 },
};

const INDUSTRY_SUGGESTIONS = ["Technology","Finance","Healthcare","Education","Manufacturing","Energy","Retail","Logistics"];
const SKILL_SUGGESTIONS = ["Python","JavaScript","TypeScript","React","Node.js","SQL","Machine Learning","Data Analysis","UI/UX","Go","Java"];
const EDU_SCHOOL_SUGGESTIONS = ["SMU","NUS","NTU","SUTD","SIM","SP","TP"];
const EDU_PROGRAM_SUGGESTIONS = ["Computer Science","Information Systems","Business","Data Science & Analytics","Mechanical Engineering","Electrical Engineering","Design & AI"];
const HOBBY_SUGGESTIONS = ["Badminton","Running","Reading","Cooking","Gaming","Cycling","Music","Photography"];

/* ------------------------ Chips UI components ------------------------ */

/** Pill chip */
function Chip({
  children,
  onRemove,
  className = "",
}: {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-[#3C14A6]/10 text-[#3C14A6] " +
        className
      }
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="leading-none hover:text-[#3C14A6]/70"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
}

/** Suggestion chips row */
function SuggestionChips({
  suggestions,
  onAdd,
  disabled,
}: {
  suggestions: string[];
  onAdd: (v: string) => void;
  disabled?: boolean;
}) {
  if (!suggestions?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {suggestions.map((s) => (
        <button
          type="button"
          key={s}
          disabled={disabled}
          onClick={() => onAdd(s)}
          className="rounded-full px-3 py-1 text-sm border border-[#3C14A6] text-[#3C14A6] hover:bg-[#3C14A6]/5 disabled:opacity-50"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

/** ChipsInput: string[] with custom typing + suggestions */
function ChipsInput({
  label,
  values,
  onChange,
  placeholder,
  suggestions = [],
  max,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  max: number;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (values.includes(v)) {
      setDraft("");
      return;
    }
    if (values.length >= max) return;
    onChange([...values, v]);
    setDraft("");
  };

  const removeAt = (i: number) => onChange(values.filter((_, idx) => idx !== i));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," ) {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && values.length > 0) {
      // Backspace removes last chip when input is empty
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="block text-lg font-medium text-gray-800">{label}</label>
        <div className="text-sm text-gray-500">{values.length}/{max}</div>
      </div>

      <div className="mt-3">
        <div className="flex flex-wrap gap-2">
          {values.map((v, i) => (
            <Chip key={`${v}-${i}`} onRemove={() => removeAt(i)}>
              {v}
            </Chip>
          ))}
        </div>

        <div className="mt-3 flex">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#3C14A6] focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => add(draft)}
            disabled={!draft.trim() || values.length >= max}
            className="ml-2 px-3 py-2 rounded-lg bg-[#3C14A6] text-white hover:bg-[#3C14A6]/90 disabled:opacity-50"
          >
            Add
          </button>
        </div>

        <SuggestionChips
          suggestions={suggestions.filter((s) => !values.includes(s))}
          onAdd={add}
          disabled={values.length >= max}
        />
      </div>
    </div>
  );
}

/** EduChips: [school, program][] rendered as chips with two inputs to add */
function EduChips({
  label,
  values,
  onChange,
  max,
  schoolSuggestions,
  programSuggestions,
}: {
  label: string;
  values: Array<[string, string]>;
  onChange: (next: Array<[string, string]>) => void;
  max: number;
  schoolSuggestions: string[];
  programSuggestions: string[];
}) {
  const [school, setSchool] = useState("");
  const [program, setProgram] = useState("");

  const add = () => {
    const s = school.trim();
    const p = program.trim();
    if (!s || !p) return;
    if (values.some(([a, b]) => a === s && b === p)) {
      setSchool(""); setProgram(""); return;
    }
    if (values.length >= max) return;
    onChange([...values, [s, p]]);
    setSchool(""); setProgram("");
  };

  const removeAt = (i: number) => onChange(values.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="block text-lg font-medium text-gray-800">{label}</label>
        <div className="text-sm text-gray-500">{values.length}/{max}</div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {values.map(([s, p], i) => (
          <Chip key={`${s}-${p}-${i}`} onRemove={() => removeAt(i)}>
            {s} — {p}
          </Chip>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        <input
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          placeholder="School e.g., SMU"
          className="px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#3C14A6] focus:border-transparent"
        />
        <div className="flex gap-2">
          <input
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            placeholder="Program e.g., Computer Science"
            className="flex-1 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#3C14A6] focus:border-transparent"
          />
          <button
            type="button"
            onClick={add}
            disabled={!school.trim() || !program.trim() || values.length >= max}
            className="px-3 rounded-lg bg-[#3C14A6] text-white hover:bg-[#3C14A6]/90 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Clickable suggestions to fill the small inputs */}
      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
        <SuggestionChips
          suggestions={schoolSuggestions}
          onAdd={(s) => setSchool(s)}
        />
        <SuggestionChips
          suggestions={programSuggestions}
          onAdd={(p) => setProgram(p)}
        />
      </div>
    </div>
  );
}

/** Small green popup */
function SuccessToast({ show, onClose, message = "Updates Saved" }: { show: boolean; onClose: () => void; message?: string }) {
  if (!show) return null;
  return (
    <div className="fixed top-4 right-4 z-[100]">
      <div className="rounded-lg bg-green-100 text-green-800 border border-green-300 px-4 py-2 shadow">
        {message}
        <button className="ml-3 underline" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState<string>("");

  const [industrySector, setIndustrySector] = useState<string[]>([""]);
  const [skills, setSkills] = useState<string[]>([""]);
  const [educationalBackground, setEducationalBackground] = useState<Array<[string, string]>>([["",""]]);
  const [hobbies, setHobbies] = useState<string[]>([""]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [showSaved, setShowSaved] = useState(false);

  // Show toast if ?saved=1 is present; then clean URL
  useEffect(() => {
    if (!mounted) return;
    if (searchParams.get("saved") === "1") {
      setShowSaved(true);
      const t = setTimeout(() => {
        setShowSaved(false);
        router.replace("/profile");
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [mounted, searchParams, router]);

  useEffect(() => {
    if (!mounted) return;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const user = userData.user;
        if (!user) { router.push("/login"); return; }

      const { data, error } = await supabase
          .from("profiles")
          .select("name, details")
          .eq("id", user.id)
        .single();
        if (error) throw error;

        const metaName = (user.user_metadata as any)?.name as string | undefined;
        const email = user.email ?? "";
        const emailLocal = email.includes("@") ? email.split("@")[0] : email;
        setDisplayName((data?.name || metaName || emailLocal || "there").toString());

        const details = (data?.details ?? {}) as Partial<MatchingMetadata>;
        setIndustrySector(details.industrySector?.length ? details.industrySector : Array(MIN_MAX.industrySector.min).fill(""));
        setSkills(details.skills?.length ? details.skills : Array(MIN_MAX.skills.min).fill(""));
        setEducationalBackground(
          details.educationalBackground?.length
            ? details.educationalBackground.map((t) => [t?.[0] ?? "", t?.[1] ?? ""] as [string,string])
            : (Array(MIN_MAX.educationalBackground.min).fill(["",""]) as Array<[string,string]>)
        );
        setHobbies(details.hobbies?.length ? details.hobbies : Array(MIN_MAX.hobbies.min).fill(""));
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
    })();
  }, [mounted, router]);

  const canAdd = useMemo(() => ({
    industrySector: industrySector.length < MIN_MAX.industrySector.max,
    skills: skills.length < MIN_MAX.skills.max,
    educationalBackground: educationalBackground.length < MIN_MAX.educationalBackground.max,
    hobbies: hobbies.length < MIN_MAX.hobbies.max,
  }), [industrySector.length, skills.length, educationalBackground.length, hobbies.length]);

  const validateUI = (): boolean => {
    const errs: Record<string, string | null> = {};
    const nonEmpty = (s: string) => s.trim().length > 0;

    if (industrySector.length < MIN_MAX.industrySector.min || industrySector.length > MIN_MAX.industrySector.max) {
      errs.industrySector = `Must have between ${MIN_MAX.industrySector.min} and ${MIN_MAX.industrySector.max} items.`;
    } else if (!industrySector.every(nonEmpty)) errs.industrySector = "All items must be non-empty.";

    if (skills.length < MIN_MAX.skills.min || skills.length > MIN_MAX.skills.max) {
      errs.skills = `Must have between ${MIN_MAX.skills.min} and ${MIN_MAX.skills.max} items.`;
    } else if (!skills.every(nonEmpty)) errs.skills = "All items must be non-empty.";

    if (educationalBackground.length < MIN_MAX.educationalBackground.min || educationalBackground.length > MIN_MAX.educationalBackground.max) {
      errs.educationalBackground = `Must have between ${MIN_MAX.educationalBackground.min} and ${MIN_MAX.educationalBackground.max} entries.`;
    } else if (!educationalBackground.every(([a,b]) => nonEmpty(a) && nonEmpty(b))) {
      errs.educationalBackground = "Each entry must have two non-empty values.";
    }

    if (hobbies.length < MIN_MAX.hobbies.min || hobbies.length > MIN_MAX.hobbies.max) {
      errs.hobbies = `Must have between ${MIN_MAX.hobbies.min} and ${MIN_MAX.hobbies.max} items.`;
    } else if (!hobbies.every(nonEmpty)) errs.hobbies = "All items must be non-empty.";

    setFieldErrors(errs);
    return Object.values(errs).every((v) => !v);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setFieldErrors({});
    if (!validateUI()) return;

    const payload: MatchingMetadata = { industrySector, skills, educationalBackground, hobbies };
    try {
      matchingMetadata.parse(payload);
    } catch (e: unknown) {
      if (e instanceof z.ZodError) {
        const msg = e.issues.map((iss) => `${iss.path.join(".") || "<root>"}: ${iss.message}`).join("\n");
        setErr(`Validation failed:\n${msg}`);
        return;
      }
      setErr("Validation failed.");
      return;
    }

    setSaving(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userData.user;
      if (!user) throw new Error("Not signed in");

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ details: payload })
        .eq("id", user.id);
      if (updErr) throw updErr;

      router.replace("/profile?saved=1");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <GlobalNav />

      <SuccessToast
        show={showSaved}
        onClose={() => { setShowSaved(false); router.replace("/profile"); }}
        message="Updates Saved"
      />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[#3C14A6]">
              Hi {displayName}, update your profile details here
            </h1>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-lg text-[#3C14A6] border border-[#3C14A6] hover:bg-[#3C14A6]/5 transition-colors"
            >
              Back
            </button>
          </div>

          {loading ? (
            <p>Loading…</p>
          ) : (
            <form className="space-y-8" onSubmit={onSave}>
              <ChipsInput
                label="Industry Sector"
                values={industrySector}
                onChange={setIndustrySector}
                placeholder="Type a sector and press Enter"
                suggestions={INDUSTRY_SUGGESTIONS}
                max={MIN_MAX.industrySector.max}
              />
              {fieldErrors.industrySector && <p className="text-red-600 text-sm">{fieldErrors.industrySector}</p>}

              <ChipsInput
                label="Skills"
                values={skills}
                onChange={setSkills}
                placeholder="Type a skill and press Enter"
                suggestions={SKILL_SUGGESTIONS}
                max={MIN_MAX.skills.max}
              />
              {fieldErrors.skills && <p className="text-red-600 text-sm">{fieldErrors.skills}</p>}

              <EduChips
                label="Educational Background"
                values={educationalBackground}
                onChange={setEducationalBackground}
                max={MIN_MAX.educationalBackground.max}
                schoolSuggestions={EDU_SCHOOL_SUGGESTIONS}
                programSuggestions={EDU_PROGRAM_SUGGESTIONS}
              />
              {fieldErrors.educationalBackground && (
                <p className="text-red-600 text-sm">{fieldErrors.educationalBackground}</p>
              )}

              <ChipsInput
                label="Hobbies"
                values={hobbies}
                onChange={setHobbies}
                placeholder="Type a hobby and press Enter"
                suggestions={HOBBY_SUGGESTIONS}
                max={MIN_MAX.hobbies.max}
              />
              {fieldErrors.hobbies && <p className="text-red-600 text-sm">{fieldErrors.hobbies}</p>}

              <div className="flex justify-end gap-3">
                      <button
                        type="button"
                  onClick={() => router.push("/")}
                  className="px-4 py-2 rounded-lg text-[#3C14A6] border border-[#3C14A6] hover:bg-[#3C14A6]/5 transition-colors"
                      >
                  Back
                      </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-[#3C14A6] text-white hover:bg-[#3C14A6]/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>

              {err && <p className="text-red-600 whitespace-pre-wrap">{err}</p>}
            </form>
            )}
        </div>
      </div>
    </main>
  );
}
