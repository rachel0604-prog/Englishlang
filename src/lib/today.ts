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
    title: "Close Reading & Word Circling",
    description: "Read this week's article closely and circle unfamiliar words.",
    isCaseDay: false,
  },
  2: {
    label: "Tuesday",
    title: "Root Word Breakdown",
    description: "Break each word into its roots, prefixes, and suffixes; build an etymology note.",
    isCaseDay: false,
  },
  3: {
    label: "Wednesday",
    title: "Listening & Shadow Writing",
    description: "Listen closely to this week's material and shadow-write the sentence patterns.",
    isCaseDay: false,
  },
  4: {
    label: "Thursday",
    title: "Spaced Review & Speaking Summary",
    description: "Review earlier words on a spaced schedule and record a spoken summary of the theme.",
    isCaseDay: false,
  },
  5: {
    label: "Friday",
    title: "Writing & Case File",
    description: "Finish a writing piece, then unlock this week's case file.",
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
