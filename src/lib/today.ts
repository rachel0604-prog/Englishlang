export interface DailyTask {
  day: number; // 0 = Sunday ... 6 = Saturday
  label: string;
  title: string;
  description: string;
  isCaseDay: boolean;
}

const WEEKDAY_TASKS: Record<number, Omit<DailyTask, "day">> = {
  1: {
    label: "週一",
    title: "精讀生字圈選",
    description: "精讀本週文章，圈選出生字並標記語境線索。",
    isCaseDay: false,
  },
  2: {
    label: "週二",
    title: "字根拆解",
    description: "拆解生字的字根、字首、字尾，建立詞源筆記。",
    isCaseDay: false,
  },
  3: {
    label: "週三",
    title: "精聽＋仿寫",
    description: "精聽本週素材並仿寫句型，練習道地表達。",
    isCaseDay: false,
  },
  4: {
    label: "週四",
    title: "間隔複習＋口說錄音摘要",
    description: "間隔複習先前單字，錄音口說摘要本週主題。",
    isCaseDay: false,
  },
  5: {
    label: "週五",
    title: "寫作產出＋案件解謎",
    description: "完成寫作產出，並進入本週案件解謎解鎖密碼。",
    isCaseDay: true,
  },
};

const WEEKEND_TASK: Omit<DailyTask, "day"> = {
  label: "週末",
  title: "自由複習",
  description: "沒有排定任務，建議自由複習本週已學內容。",
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
