import { Database } from "../database.types";
import { MatchingMetadata } from "./properties";

type ProfileId = Database["public"]["Tables"]["profiles"]["Row"]["id"];

export type MatchingProfile = {
  id: ProfileId;
  details: MatchingMetadata;
};

export type MatchingResult = {
  menteeId: ProfileId;
  mentorId: ProfileId;
  scores: {
    skillScore: number;
    industryScore: number;
    educationScore: number;
    hobbyScore: number;
  };
  reasons: string[];
  overallScore: number;
};

export type MatchingAlgorithm = (
  mentors: MatchingProfile[],
  mentees: MatchingProfile[]
) => MatchingResult[];
