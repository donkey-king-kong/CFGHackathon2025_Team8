import z from "zod/v4";

/** ------- Types used by the scoring engine ------- */
export type Person = {
  id: string;
  full_name?: string | null;
  industry_sector: string[];
  skills: string[];
  education_level: string | null; // normalized single level
  hobbies: string[];
};

export type Weights = {
  industry: number;
  skills: number;
  education: number;
  hobbies: number;
};

export const DEFAULT_WEIGHTS: Weights = {
  industry: 0.35,
  skills: 0.4,
  education: 0.15,
  hobbies: 0.1,
};

/** ------- Parse your `details` JSONB safely ------- */
export const DetailsSchema = z.object({
  skills: z.array(z.string()).default([]),
  hobbies: z.array(z.string()).default([]),
  industrySector: z.array(z.string()).default([]),
  // [["Bachelor's","CS"], ["Master's","SE"]]
  educationalBackground: z.array(z.tuple([z.string(), z.string()])).default([]),
});
export type Details = z.infer<typeof DetailsSchema>;

/** ------- Normalization helpers ------- */
const normArr = (xs: string[]) =>
  Array.from(new Set(xs.map((s) => s.trim().toLowerCase()).filter(Boolean)));

function normalizeEduLevel(raw: string) {
  const s = raw.toLowerCase().replace(/\./g, "").trim();
  if (s.includes("phd") || s.includes("doctor")) return "phd";
  if (s.includes("master")) return "masters";
  if (s.includes("bachelor")) return "bachelors";
  if (s.includes("university")) return "bachelors"; // treat same band
  if (s.includes("junior college")) return "junior college";
  if (s === "poly" || s.includes("polytechnic")) return "polytechnic";
  if (s === "ite") return "ite";
  if (s.includes("secondary")) return "secondary school";
  return raw.toLowerCase(); // fallback
}

// ranking for similarity distance
const EDU_RANK: Record<string, number> = {
  "secondary school": 0,
  ite: 1,
  polytechnic: 2,
  "junior college": 3,
  bachelors: 4,
  masters: 5,
  phd: 6,
};

function highestEducation(edu: Details["educationalBackground"]) {
  if (!edu.length) return null;
  const levels = edu.map(([lvl]) => normalizeEduLevel(lvl));
  let best = levels[0];
  for (const l of levels.slice(1)) {
    if ((EDU_RANK[l] ?? -1) > (EDU_RANK[best] ?? -1)) best = l;
  }
  return best ?? null;
}

/** Convert a DB row (id, name, details) → Person for scoring */
export function rowToPerson(row: { id: string; name: string | null; details: any }): Person {
  const parsed = DetailsSchema.safeParse(row.details);
  const d = parsed.success
    ? parsed.data
    : { skills: [], hobbies: [], industrySector: [], educationalBackground: [] };

  return {
    id: row.id,
    full_name: row.name,
    industry_sector: normArr(d.industrySector),
    skills: normArr(d.skills),
    hobbies: normArr(d.hobbies),
    education_level: highestEducation(d.educationalBackground),
  };
}

/** ------- Similarity functions & scoring ------- */
const jaccard = (a: string[], b: string[]) => {
  const A = new Set(normArr(a));
  const B = new Set(normArr(b));
  if (A.size === 0 && B.size === 0) return 0;
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return inter / union;
};

const eduSimilarity = (mentor: string | null, mentee: string | null) => {
  if (!mentor || !mentee) return 0;
  const d = Math.abs((EDU_RANK[mentor] ?? 0) - (EDU_RANK[mentee] ?? 0));
  if (d === 0) return 1;
  if (d === 1) return 0.85;
  if (d === 2) return 0.6;
  return 0.3;
};

export type MatchExplanation = {
  parts: { label: string; score: number; weight: number; details?: string }[];
  totalPct: number;
  overlaps: { industry?: string[]; skills?: string[]; hobbies?: string[] };
};

export function scoreMatch(
  mentor: Person,
  mentee: Person,
  weights: Weights = DEFAULT_WEIGHTS
): MatchExplanation {
  const indOverlap = normArr(mentor.industry_sector).filter((x) =>
    normArr(mentee.industry_sector).includes(x)
  );
  const indSim = indOverlap.length ? 1 : 0;

  const skillOverlap = normArr(mentor.skills).filter((x) => normArr(mentee.skills).includes(x));
  const skillSim = jaccard(mentor.skills, mentee.skills);

  const eduSim = eduSimilarity(mentor.education_level, mentee.education_level);

  const hobOverlap = normArr(mentor.hobbies).filter((x) => normArr(mentee.hobbies).includes(x));
  const hobSim = jaccard(mentor.hobbies, mentee.hobbies);

  const parts = [
    { label: "Industry", score: indSim, weight: weights.industry, details: indOverlap.join(", ") || "—" },
    { label: "Skills", score: skillSim, weight: weights.skills, details: skillOverlap.join(", ") || "—" },
    {
      label: "Education",
      score: eduSim,
      weight: weights.education,
      details: `${mentor.education_level ?? "?"} ↔ ${mentee.education_level ?? "?"}`,
    },
    { label: "Hobbies", score: hobSim, weight: weights.hobbies, details: hobOverlap.join(", ") || "—" },
  ];

  const weighted = parts.reduce((acc, p) => acc + p.score * p.weight, 0);
  const totalPct = Math.round((weighted / (weights.industry + weights.skills + weights.education + weights.hobbies)) * 100);

  return { parts, totalPct, overlaps: { industry: indOverlap, skills: skillOverlap, hobbies: hobOverlap } };
}
