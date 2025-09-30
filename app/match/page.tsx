"use client";

import {
  MatchingAlgorithm,
  MatchingProfile,
  MatchingResult,
} from "@/lib/algo/algo.types";
import { mockMatchingAlgorithm } from "@/lib/algo/mock-matching-algo";
import { matchingMetadata } from "@/lib/algo/properties";
import { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase/client";
import { useState, useEffect, useMemo } from "react";
import { DataTable } from "./data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Crown,
  Star,
  AlertTriangle,
} from "lucide-react";
import Navbar from "@/components/global_navbar/Navbar";

type MatchRow = MatchingResult & {
  mentorName: string;
  menteeName: string;
  approved?: boolean;
};

const matchingResultToRow = (
  matches: MatchingResult[],
  mentors: ProfileRow[],
  mentees: ProfileRow[]
): MatchRow[] => {
  const mentorMap = new Map(
    mentors.map((m) => [m.id, m.name || "Unknown Mentor"])
  );
  const menteeMap = new Map(
    mentees.map((m) => [m.id, m.name || "Unknown Mentee"])
  );
  return matches.map((match) => ({
    ...match,
    mentorName: mentorMap.get(match.mentorId) || "Unknown Mentor",
    menteeName: menteeMap.get(match.menteeId) || "Unknown Mentee",
  }));
};

const matcher: MatchingAlgorithm = mockMatchingAlgorithm;
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export default function MatchAlgo() {
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState<ProfileRow[]>([]);
  const [mentees, setMentees] = useState<ProfileRow[]>([]);
  const [approved, setApproved] = useState<Record<string, Set<string>>>({});
  const [selectedMatches, setSelectedMatches] = useState<MatchRow[]>([]);
  const [expandedMentors, setExpandedMentors] = useState<Set<string>>(
    new Set()
  );
  const [conflictSectionExpanded, setConflictSectionExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAvailableProfiles = async () => {
    setLoading(true);

    // First, get existing assignments to filter out already assigned mentors/mentees
    const { data: existingAssignments } = await supabase
      .from("mentor_mentee")
      .select("mentor_id, mentee_id");

    const assignedMentorIds = new Set(
      existingAssignments?.map((a) => a.mentor_id) || []
    );
    const assignedMenteeIds = new Set(
      existingAssignments?.map((a) => a.mentee_id) || []
    );

    // Fetch all mentors and mentees
    const { data: allMentors } = await supabase
      .from("profiles")
      .select("id, name, role, details")
      .eq("role", "mentor");

    const { data: allMentees } = await supabase
      .from("profiles")
      .select("id, name, role, details")
      .eq("role", "mentee");

    // Filter out already assigned mentors and mentees
    const availableMentors = (allMentors ?? []).filter(
      (mentor) => !assignedMentorIds.has(mentor.id)
    );

    const availableMentees = (allMentees ?? []).filter(
      (mentee) => !assignedMenteeIds.has(mentee.id)
    );

    setMentors(availableMentors as ProfileRow[]);
    setMentees(availableMentees as ProfileRow[]);
    setLoading(false);
  };

  const saveMatches = async () => {
    if (selectedMatches.length === 0) {
      alert("No matches selected to save");
      return;
    }

    if (conflicts.size > 0) {
      const proceed = confirm(
        `There are ${conflicts.size} conflict(s) in your selection. Each mentee should only be assigned to one mentor. Do you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    setSaving(true);
    try {
      // Prepare data for insertion
      const matchesToInsert = selectedMatches.map((match) => ({
        mentor_id: match.mentorId,
        mentee_id: match.menteeId,
      }));

      const { error } = await supabase
        .from("mentor_mentee")
        .insert(matchesToInsert);

      if (error) {
        console.error("Error saving matches:", error);
        alert(`Failed to save matches: ${error.message}`);
      } else {
        alert(`Successfully saved ${selectedMatches.length} match(es)!`);
        // Clear selections and refresh data to exclude newly assigned profiles
        setSelectedMatches([]);
        await loadAvailableProfiles();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An unexpected error occurred while saving matches");
    } finally {
      setSaving(false);
    }
  };

  const matchResultRows = useMemo(() => {
    const parsedMentees = mentees
      .map((m) => ({
        ...m,
        details: matchingMetadata.safeParse(m.details).data,
      }))
      .filter((m) => !!m.details);

    const parsedMentors = mentors
      .map((m) => ({
        ...m,
        details: matchingMetadata.safeParse(m.details).data,
      }))
      .filter((m) => !!m.details);

    console.log({ parsedMentees, parsedMentors, mentees, mentors });
    const results = matcher(
      parsedMentors as MatchingProfile[],
      parsedMentees as MatchingProfile[]
    );
    return matchingResultToRow(results, mentors, mentees);
  }, [mentors, mentees]);

  const matchResultRowsWithApproval = useMemo(() => {
    return matchResultRows.map((row) => ({
      ...row,
      approved: approved[row.mentorId]?.has(row.menteeId) || false,
    }));
  }, [matchResultRows, approved]);

  const toggleMentorExpansion = (mentorName: string) => {
    setExpandedMentors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mentorName)) {
        newSet.delete(mentorName);
      } else {
        newSet.add(mentorName);
      }
      return newSet;
    });
  };

  const autoSelectTopMatches = () => {
    const topMatches: MatchRow[] = [];

    groupedMatches.forEach(({ matches }) => {
      // Take top 2 matches (already sorted by score in descending order)
      const topTwo = matches.slice(0, 2);
      topMatches.push(...topTwo);
    });

    setSelectedMatches(topMatches);
  };

  useEffect(() => {
    loadAvailableProfiles();
  }, []);

  // Group matches by mentor
  const groupedMatches = useMemo(() => {
    const groups = new Map<string, MatchRow[]>();
    matchResultRowsWithApproval.forEach((match) => {
      const mentorKey = match.mentorName;
      if (!groups.has(mentorKey)) {
        groups.set(mentorKey, []);
      }
      groups.get(mentorKey)!.push(match);
    });

    // Sort groups by mentor name and sort matches within each group by score
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mentorName, matches]) => ({
        mentorName,
        matches: matches.sort((a, b) => b.overallScore - a.overallScore),
      }));
  }, [matchResultRowsWithApproval]);

  // Auto-select top 2 matches for each mentor
  useEffect(() => {
    if (groupedMatches.length > 0) {
      const topMatches: MatchRow[] = [];

      groupedMatches.forEach(({ matches }) => {
        // Take top 2 matches (already sorted by score in descending order)
        const topTwo = matches.slice(0, 2);
        topMatches.push(...topTwo);
      });

      setSelectedMatches(topMatches);
    }
  }, [groupedMatches]);

  // Detect conflicts - mentees assigned to multiple mentors
  const conflicts = useMemo(() => {
    const menteeAssignments = new Map<string, MatchRow[]>();

    selectedMatches.forEach((match) => {
      const menteeKey = match.menteeId;
      if (!menteeAssignments.has(menteeKey)) {
        menteeAssignments.set(menteeKey, []);
      }
      menteeAssignments.get(menteeKey)!.push(match);
    });

    const conflictingMentees = new Map<string, MatchRow[]>();
    menteeAssignments.forEach((assignments, menteeId) => {
      if (assignments.length > 1) {
        conflictingMentees.set(menteeId, assignments);
      }
    });

    return conflictingMentees;
  }, [selectedMatches]);

  // Identify mentors that have conflicts
  const mentorsWithConflicts = useMemo(() => {
    const mentorSet = new Set<string>();

    conflicts.forEach((assignments) => {
      assignments.forEach((match) => {
        mentorSet.add(match.mentorName);
      });
    });

    return mentorSet;
  }, [conflicts]);

  const hasConflicts = conflicts.size > 0;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="space-y-6 max-w-screen-xl mx-auto p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Mentor-Mentee Matches
          </h1>
          <div className="flex items-center space-x-4">
            <Button
              onClick={autoSelectTopMatches}
              variant="outline"
              className="flex items-center space-x-2">
              <Crown className="h-4 w-4" />
              <span>Select Top 2 per Mentor</span>
            </Button>
            <Button onClick={() => setSelectedMatches([])} variant="outline">
              Clear Selection
            </Button>
            <Button
              onClick={saveMatches}
              disabled={selectedMatches.length === 0 || saving}
              className="flex items-center space-x-2">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>
                    Save {selectedMatches.length} Match
                    {selectedMatches.length === 1 ? "" : "es"}
                  </span>
                </>
              )}
            </Button>
            {hasConflicts && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-orange-100 text-orange-800 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {conflicts.size} Conflict{conflicts.size > 1 ? "s" : ""}{" "}
                  Detected
                </span>
              </div>
            )}
          </div>
        </div>

        {hasConflicts && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg overflow-hidden sticky top-4 z-10 shadow-md">
            <div
              className="flex items-center justify-between px-4 py-3 bg-orange-100 cursor-pointer hover:bg-orange-200 transition-colors"
              onClick={() =>
                setConflictSectionExpanded(!conflictSectionExpanded)
              }>
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <h3 className="text-lg font-medium text-orange-900">
                    Assignment Conflicts Detected
                  </h3>
                  <p className="text-sm text-orange-700">
                    {conflicts.size} mentee
                    {conflicts.size > 1 ? "s are" : " is"} assigned to multiple
                    mentors
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {conflictSectionExpanded ? (
                  <ChevronDown className="h-5 w-5 text-orange-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-orange-400" />
                )}
              </div>
            </div>

            {conflictSectionExpanded && (
              <div className="px-4 py-3 border-t border-orange-200">
                <div className="space-y-2 mb-3">
                  {Array.from(conflicts.entries()).map(
                    ([menteeId, assignments]) => {
                      const menteeName = assignments[0].menteeName;
                      return (
                        <div key={menteeId} className="text-sm text-orange-800">
                          <span className="font-medium">{menteeName}</span> is
                          assigned to{" "}
                          <span className="font-medium">
                            {assignments.length} mentors
                          </span>
                          : {assignments.map((a) => a.mentorName).join(", ")}
                        </div>
                      );
                    }
                  )}
                </div>
                <p className="text-sm text-orange-700">
                  Each mentee should only be assigned to one mentor. Please
                  review and adjust your selections.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          {groupedMatches.map(({ mentorName, matches }) => {
            const isExpanded = expandedMentors.has(mentorName);
            const hasConflict = mentorsWithConflicts.has(mentorName);
            return (
              <div
                key={mentorName}
                className="border rounded-lg overflow-hidden">
                <div
                  className={`px-6 py-4 border-b cursor-pointer transition-colors ${
                    hasConflict
                      ? "bg-orange-50 hover:bg-orange-100"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => toggleMentorExpansion(mentorName)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {hasConflict && (
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                      )}
                      <div>
                        <h3
                          className={`text-lg font-semibold ${
                            hasConflict ? "text-orange-900" : "text-gray-900"
                          }`}>
                          {mentorName}
                        </h3>
                        <p
                          className={`text-sm ${
                            hasConflict ? "text-orange-700" : "text-gray-600"
                          }`}>
                          {matches.length} potential{" "}
                          {matches.length === 1 ? "match" : "matches"}
                          {hasConflict && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Has Conflicts
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isExpanded ? (
                        <ChevronDown
                          className={`h-5 w-5 ${
                            hasConflict ? "text-orange-400" : "text-gray-400"
                          }`}
                        />
                      ) : (
                        <ChevronRight
                          className={`h-5 w-5 ${
                            hasConflict ? "text-orange-400" : "text-gray-400"
                          }`}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <Checkbox
                              checked={matches.every((match) =>
                                selectedMatches.some(
                                  (selected) =>
                                    selected.mentorId === match.mentorId &&
                                    selected.menteeId === match.menteeId
                                )
                              )}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  // Select all matches for this mentor
                                  const newSelection = [
                                    ...selectedMatches.filter(
                                      (selected) =>
                                        !matches.some(
                                          (match) =>
                                            selected.mentorId ===
                                              match.mentorId &&
                                            selected.menteeId === match.menteeId
                                        )
                                    ),
                                    ...matches,
                                  ];
                                  setSelectedMatches(newSelection);
                                } else {
                                  // Deselect all matches for this mentor
                                  const newSelection = selectedMatches.filter(
                                    (selected) =>
                                      !matches.some(
                                        (match) =>
                                          selected.mentorId ===
                                            match.mentorId &&
                                          selected.menteeId === match.menteeId
                                      )
                                  );
                                  setSelectedMatches(newSelection);
                                }
                              }}
                              aria-label={`Select all matches for ${mentorName}`}
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mentee
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Breakdown
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reasons
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {matches.map((match, index) => {
                          const isTopMatch = index < 2;
                          const isSelected = selectedMatches.some(
                            (selected) =>
                              selected.mentorId === match.mentorId &&
                              selected.menteeId === match.menteeId
                          );
                          const hasConflict =
                            isSelected && conflicts.has(match.menteeId);
                          const conflictingMentors =
                            conflicts
                              .get(match.menteeId)
                              ?.map((m) => m.mentorName) || [];

                          return (
                            <tr
                              key={`${match.mentorId}-${match.menteeId}`}
                              className={`hover:bg-gray-50 ${
                                hasConflict
                                  ? "bg-orange-50 border-l-4 border-orange-400"
                                  : isTopMatch
                                  ? "bg-yellow-50 border-l-4 border-yellow-400"
                                  : ""
                              }`}>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedMatches([
                                          ...selectedMatches,
                                          match,
                                        ]);
                                      } else {
                                        setSelectedMatches(
                                          selectedMatches.filter(
                                            (selected) =>
                                              !(
                                                selected.mentorId ===
                                                  match.mentorId &&
                                                selected.menteeId ===
                                                  match.menteeId
                                              )
                                          )
                                        );
                                      }
                                    }}
                                    aria-label={`Select match with ${match.menteeName}`}
                                  />
                                  {isTopMatch && (
                                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  )}
                                  {hasConflict && (
                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div className="flex items-center space-x-2">
                                  <span>{match.menteeName}</span>
                                  {hasConflict && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Conflict
                                    </span>
                                  )}
                                  {!hasConflict && isTopMatch && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      {index === 0 ? "Best Match" : "Top 2"}
                                    </span>
                                  )}
                                </div>
                                {hasConflict && (
                                  <div className="text-xs text-orange-600 mt-1">
                                    Also assigned to:{" "}
                                    {conflictingMentors
                                      .filter((name) => name !== mentorName)
                                      .join(", ")}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {match.overallScore.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-500">
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span>Skills:</span>
                                    <span>
                                      {match.scores.skillScore.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Industry:</span>
                                    <span>
                                      {match.scores.industryScore.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Education:</span>
                                    <span>
                                      {match.scores.educationScore.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Hobbies:</span>
                                    <span>
                                      {match.scores.hobbyScore.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-500">
                                <div className="max-w-xs">
                                  {(match.reasons || []).join(", ")}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
