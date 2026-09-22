export interface DailyTask {
  day: number; // 0 = Sunday ... 6 = Saturday
  label: string;
  title: string;
  description: string;
  isCaseDay: boolean;
}

const WEEKDAY_TASKS: Record<number, Omit<DailyTask, "day">> = {
  1: {
    label: "Monday",
    title: "Close Reading & Vocabulary Annotation",
    description: "Read this week's article closely and annotate unfamiliar vocabulary in context.",
    isCaseDay: false,
  },
  2: {
    label: "Tuesday",
    title: "Word Formation & Root Analysis",
    description: "Analyse each word's roots, prefixes, and suffixes, and build an etymology note.",
    isCaseDay: false,
  },
  3: {
    label: "Wednesday",
    title: "Intensive Listening & Pattern Writing",
    description: "Listen closely to this week's material, then practise writing sentences that mirror its patterns.",
    isCaseDay: false,
  },
  4: {
    label: "Thursday",
    title: "Spaced Repetition Review & Oral Summary",
    description: "Review earlier vocabulary on a spaced-repetition schedule, then record a spoken summary of this week's theme.",
    isCaseDay: false,
  },
  5: {
    label: "Friday",
    title: "Writing Production & Case File",
    description: "Complete a piece of writing, then unlock this week's case file.",
    isCaseDay: true,
  },
};

const WEEKEND_TASK: Omit<DailyTask, "day"> = {
  label: "Weekend",
  title: "Free Review",
  description: "No task scheduled — a good time for free review of what you've learned this week.",
  isCaseDay: false,
};

export function getTodayTask(date: Date = new Date()): DailyTask {
  const day = date.getDay();
  const task = WEEKDAY_TASKS[day] ?? WEEKEND_TASK;
  return { day, ...task };
}

export function getWeekTaskList(): DailyTask[] {
  return [1, 2, 3, 4, 5].map((day) => ({ day, ...WEEKDAY_TASKS[day] }));
}
