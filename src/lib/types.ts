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
