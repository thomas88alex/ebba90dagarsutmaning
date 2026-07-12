import type { ChallengeConfig } from "../types/challenge";

export const challengeConfig: ChallengeConfig = {
  startDate: "2026-07-13",
  totalDays: 90,
  displayName: "Ebba's 90-Day Challenge",
};

export const completionThresholds = {
  fullyCompletedMin: 90,
  partiallyCompletedMin: 50,
  streakMinScore: 90,
  checkInFullyCompletedMin: 90,
  checkInPartiallyCompletedMin: 50,
};

export const defaults = {
  waterTargetLitres: 2.5,
};

export const checkInScoring = {
  trainingWeight: 20,
  mealWeight: 10,
  waterWeight: 15,
  sleepWeight: 15,
  wellbeingWeight: 20,
};

export const localStorageKeys = {
  auth: "ebbaChallenge.auth",
  checkIns: "ebbaChallenge.checkIns",
  settings: "ebbaChallenge.settings",
};
