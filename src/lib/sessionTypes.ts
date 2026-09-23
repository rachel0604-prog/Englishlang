import type { SessionType } from "@/lib/types";

/** Quiz-type sessions are graded in-app via a case's rounds. Everything else
 * is self-directed (done off-app) and tracked via a manual "mark complete". */
export const QUIZ_SESSION_TYPES: SessionType[] = [
  "vocab_game",
  "root_context",
  "logic_puzzle",
  "spaced_review",
];

export function isQuizSession(type: SessionType): boolean {
  return QUIZ_SESSION_TYPES.includes(type);
}

export const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  reading: "Reading",
  vocab_game: "Vocabulary Game",
  root_context: "Root & Context Guessing",
  logic_puzzle: "Logic Puzzle",
  listening: "Listening",
  rewrite: "Rewrite Practice",
  spaced_review: "Spaced Review",
  speaking: "Speaking Recording",
  writing_quiz: "Writing & Checkpoint",
};
