import { Filter } from "bad-words";

/**
 * Server-side profanity check for user-generated text. The app already filters
 * profanity client-side (components/question-bank/QuestionSolutions.tsx) with the
 * same library; enforcing it on the write path too closes the trivial bypass of
 * calling the API directly. Fails OPEN (never blocks a write) on a filter error.
 */
const filter = new Filter();

export function containsProfanity(
  ...texts: (string | null | undefined)[]
): boolean {
  try {
    return texts.some((t) => !!t && filter.isProfane(t));
  } catch {
    return false;
  }
}

export const PROFANITY_ERROR =
  "Your text appears to contain inappropriate language. Please revise and try again.";
