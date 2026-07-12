export interface DashboardStatistics {
  totalCompletedDays: number;
  totalMissedDays: number;
  currentStreak: number;
  longestStreak: number;
  trainingCompletionPercentage: number;
  nutritionCompletionPercentage: number;
  waterCompletionPercentage: number;
  checkInCompletionPercentage: number;
}

export type DashboardDayStatus = "green" | "yellow" | "red" | "gray" | "outside";

export interface DashboardDayCell {
  challengeDay: number | null;
  date: string | null;
  dayOfMonth: number;
  monthKey: string;
  monthIndex: number;
  monthLabel: string;
  isInChallenge: boolean;
  hasCheckIn: boolean;
  completionScore: number;
  status: DashboardDayStatus;
  title: string;
}

export interface DashboardMonthGroup {
  monthKey: string;
  monthIndex: number;
  monthLabel: string;
  cells: DashboardDayCell[];
}
