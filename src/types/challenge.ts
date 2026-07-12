export type ChallengePhase = "upcoming" | "active" | "completed";

export interface ChallengeConfig {
  startDate: string;
  totalDays: number;
  displayName: string;
}

export interface ChallengeProgress {
  phase: ChallengePhase;
  day: number;
  totalDays: number;
  percentage: number;
  daysUntilStart: number;
}
