// lib/algo/mock-matching-algo.ts
import { MatchingAlgorithm, MatchingProfile, MatchingResult } from "./algo.types";

const W = { skills: 0.4, industry: 0.35, education: 0.15, hobbies: 0.1 };
const TOP_K_UNIQUE = 2;
const TOP_LIST_SIZE = 5;

/* ---------------- helpers for similarity & text ---------------- */

function jaccard(a: string[] = [], b: string[] = []) {
  const A = new Set(a.map((s) => s.toLowerCase()));
  const B = new Set(b.map((s) => s.toLowerCase()));
  if (!A.size && !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

const EDUCATION_ORDER = [
  "secondary school",
  "ite",
  "polytechnic",
  "junior college",
  "bachelor",
  "bachelor's",
  "masters",
  "master's",
  "phd",
];

function eduSim(mentor: MatchingProfile, mentee: MatchingProfile) {
  const mLevel = (mentor.details.educationalBackground?.[0]?.[0] ?? "").toLowerCase();
  const tLevel = (mentee.details.educationalBackground?.[0]?.[0] ?? "").toLowerCase();
  if (!mLevel || !tLevel) return 0.6;
  if (mLevel === tLevel) return 1;
  const mi = EDUCATION_ORDER.findIndex((x) => mLevel.includes(x));
  const ti = EDUCATION_ORDER.findIndex((x) => tLevel.includes(x));
  if (mi === -1 || ti === -1) return 0.6;
  const d = Math.abs(mi - ti);
  if (d === 1) return 0.85;
  if (d === 2) return 0.6;
  return 0.3;
}

function intersectDisplay(a: string[] = [], b: string[] = [], max = 3) {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const out: string[] = [];
  for (const s of a) if (setB.has(s.toLowerCase())) out.push(s);
  // keep original casing & stable order, cap how many we show
  return Array.from(new Set(out)).slice(0, max);
}

function strengthLabel(p: number) {
  if (p >= 0.85) return "Strong";
  if (p >= 0.6)  return "Good";
  if (p >= 0.35) return "Some";
  return "Low";
}

function ladderText(mentor: string | undefined, mentee: string | undefined) {
  const m = (mentor ?? "").toLowerCase();
  const t = (mentee ?? "").toLowerCase();
  if (!m || !t) return "Education info partially provided";
  const same = m === t;
  if (same) return `Similar education (${capitalize(t)})`;
  const mi = EDUCATION_ORDER.findIndex((x) => m.includes(x));
  const ti = EDUCATION_ORDER.findIndex((x) => t.includes(x));
  if (mi === -1 || ti === -1) return "Education info partially provided";
  if (mi > ti) return `Step-up path: mentee ${capitalize(mentee!)} → mentor ${capitalize(mentor!)}`;
  return `Peer / cross-level: mentee ${capitalize(mentee!)} vs mentor ${capitalize(mentor!)}`;
}

function listToText(items: string[]) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildReasons(m: MatchingProfile, t: MatchingProfile, scores: {
  skillScore: number; industryScore: number; educationScore: number; hobbyScore: number;
}): string[] {
  const skillsM = m.details.skills ?? [];
  const skillsT = t.details.skills ?? [];
  const hobbiesM = m.details.hobbies ?? [];
  const hobbiesT = t.details.hobbies ?? [];
  const indsM = m.details.industrySector ?? [];
  const indsT = t.details.industrySector ?? [];
  const [mLevel, mField] = m.details.educationalBackground?.[0] ?? ["", ""];
  const [tLevel, tField] = t.details.educationalBackground?.[0] ?? ["", ""];

  const commonSkills = intersectDisplay(skillsM, skillsT, 3);
  const commonHobbies = intersectDisplay(hobbiesM, hobbiesT, 2);
  const commonInds = intersectDisplay(indsM, indsT, 2);

  const reasons: string[] = [];

  // Skills
  if (commonSkills.length) {
    reasons.push(
      `${strengthLabel(scores.skillScore)} skill overlap (${Math.round(scores.skillScore * 100)}%): ${listToText(commonSkills)}`
    );
  } else {
    // show “complementary” angle with a couple of mentor skills
    const showcase = (skillsM.slice(0, 2) || []).join(", ");
    if (showcase) reasons.push(`Complementary skills — mentor brings ${showcase}`);
  }

  // Industry
  if (scores.industryScore >= 1 && commonInds.length) {
    reasons.push(`Industry aligned on ${listToText(commonInds)}`);
  } else {
    reasons.push(`Cross-industry match; transferable skills`);
  }

  // Education
  if (mLevel || tLevel) {
    const fieldHint =
      mField && tField && mField.toLowerCase() === tField.toLowerCase()
        ? ` (both in ${tField})`
        : "";
    reasons.push(`${ladderText(mLevel, tLevel)}${fieldHint}`);
  }

  // Hobbies
  if (commonHobbies.length) {
    reasons.push(`Shared interests: ${listToText(commonHobbies)}`);
  }

  return reasons;
}

/* ---------------- main algorithm (keeps unique top-2) ---------------- */

export const mockMatchingAlgorithm: MatchingAlgorithm = (mentors, mentees) => {
  const all: MatchingResult[] = [];

  for (const mentor of mentors) {
    for (const mentee of mentees) {
      const skillScore = jaccard(mentor.details.skills, mentee.details.skills);
      const industryScore =
        jaccard(mentor.details.industrySector, mentee.details.industrySector) > 0 ? 1 : 0;
      const educationScore = eduSim(mentor, mentee);
      const hobbyScore = jaccard(mentor.details.hobbies, mentee.details.hobbies);

      const overallScore =
        W.skills * skillScore +
        W.industry * industryScore +
        W.education * educationScore +
        W.hobbies * hobbyScore;

      const scores = { skillScore, industryScore, educationScore, hobbyScore };

      all.push({
        mentorId: mentor.id,
        menteeId: mentee.id,
        scores,
        overallScore,
        reasons: buildReasons(mentor, mentee, scores), // ← unique, data-driven reasons
      });
    }
  }

  const byScoreDesc = (a: MatchingResult, b: MatchingResult) =>
    b.overallScore - a.overallScore ||
    b.scores.skillScore - a.scores.skillScore ||
    b.scores.industryScore - a.scores.industryScore ||
    b.scores.educationScore - a.scores.educationScore ||
    b.scores.hobbyScore - a.scores.hobbyScore ||
    a.mentorId.localeCompare(b.mentorId) ||
    a.menteeId.localeCompare(b.menteeId);

  const byMentor = new Map<string, MatchingResult[]>();
  for (const r of all) {
    if (!byMentor.has(r.mentorId)) byMentor.set(r.mentorId, []);
    byMentor.get(r.mentorId)!.push(r);
  }
  for (const arr of byMentor.values()) arr.sort(byScoreDesc);

  const menteeTaken = new Set<string>();
  const mentorCount = new Map(mentors.map((m) => [m.id, 0]));
  const uniqueTop = new Map<string, MatchingResult[]>();

  for (const r of [...all].sort(byScoreDesc)) {
    const used = mentorCount.get(r.mentorId)!;
    if (used >= TOP_K_UNIQUE) continue;
    if (menteeTaken.has(r.menteeId)) continue;

    menteeTaken.add(r.menteeId);
    mentorCount.set(r.mentorId, used + 1);
    const arr = uniqueTop.get(r.mentorId) ?? [];
    arr.push(r);
    uniqueTop.set(r.mentorId, arr);
  }

  const out: MatchingResult[] = [];
  for (const m of mentors) {
    const base = (uniqueTop.get(m.id) ?? []).sort(byScoreDesc);
    const usedKey = new Set(base.map((x) => `${x.mentorId}|${x.menteeId}`));
    const fill = (byMentor.get(m.id) ?? []).filter(
      (x) => !usedKey.has(`${x.mentorId}|${x.menteeId}`)
    );
    out.push(...[...base, ...fill].slice(0, TOP_LIST_SIZE));
  }

  return out.sort((a, b) =>
    a.mentorId === b.mentorId ? byScoreDesc(a, b) : a.mentorId.localeCompare(b.mentorId)
  );
};
