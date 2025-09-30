import z from "zod/v4";

/**
 * Schema for validating user metadata for matching algorithm
 *
 * This should be in the profile table in the database
 */
export const matchingMetadata = z.object({
  industrySector: z.array(z.string().min(1)).min(1).max(3),
  skills: z.array(z.string().min(1)).min(1).max(5),
  educationalBackground: z
    .array(z.tuple([z.string().min(1), z.string().min(1)]))
    .min(1)
    .max(3),
  hobbies: z.array(z.string().min(1)).min(1).max(5),
});

export type MatchingMetadata = z.infer<typeof matchingMetadata>;
