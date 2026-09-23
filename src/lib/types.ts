export type WeekStatus = "draft" | "active" | "archived";

export interface Week {
  id: string;
  week_number: number;
  start_date: string;
  theme_title: string;
  status: WeekStatus;
  created_at: string;
}

export interface Case {
  id: string;
  week_id: string;
  case_title: string;
  source_note: string | null;
  created_at: string;
}

export interface Round {
  id: string;
  case_id: string;
  order_index: number;
  target_word: string;
  sentence_html: string;
  hint_text: string | null;
  options: string[];
  correct_index: number;
  code_fragment: string;
  created_at: string;
}

export interface Progress {
  id: string;
  round_id: string;
  is_solved: boolean;
  solved_at: string | null;
  attempts: number;
}

export interface Settings {
  id: number;
  reminder_morning_time: string;
  reminder_evening_time: string;
  push_subscription: Record<string, unknown> | null;
}

export type SessionTimeOfDay = "morning" | "evening";

export type SessionType =
  | "reading"
  | "vocab_game"
  | "root_context"
  | "logic_puzzle"
  | "listening"
  | "rewrite"
  | "spaced_review"
  | "speaking"
  | "writing_quiz";

export interface Session {
  id: string;
  week_id: string;
  day_of_week: number;
  time_of_day: SessionTimeOfDay;
  session_type: SessionType;
  title: string;
  instructions: string;
  case_id: string | null;
  created_at: string;
  generated_from_response_at: string | null;
}

export interface SessionProgress {
  id: string;
  session_id: string;
  is_complete: boolean;
  completed_at: string | null;
  response_text: string | null;
  feedback_text: string | null;
}
