import { localStorageKeys } from "../config/challengeConfig";
import type { DailyCheckIn } from "../types/checkIn";
import { calculateDashboardStatistics } from "../utils/statistics";
import { readStorage, writeStorage } from "./localStorageService";

function getSortedCheckIns(): DailyCheckIn[] {
  const checkIns = readStorage<DailyCheckIn[]>(localStorageKeys.checkIns, []);
  return [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
}

export function getCheckIns(): DailyCheckIn[] {
  return getSortedCheckIns();
}

export function getCheckInByDate(date: string): DailyCheckIn | null {
  const checkIns = getSortedCheckIns();
  return checkIns.find((item) => item.date === date) ?? null;
}

export function saveCheckIn(checkIn: DailyCheckIn): { success: boolean; message?: string } {
  const checkIns = getSortedCheckIns();
  const existing = checkIns.find((item) => item.date === checkIn.date);

  if (existing) {
    return { success: false, message: "A check-in already exists for this date." };
  }

  writeStorage(localStorageKeys.checkIns, [checkIn, ...checkIns]);
  return { success: true };
}

export function updateCheckIn(checkIn: DailyCheckIn): { success: boolean; message?: string } {
  const checkIns = getSortedCheckIns();
  const index = checkIns.findIndex((item) => item.id === checkIn.id);

  if (index === -1) {
    return { success: false, message: "Check-in was not found." };
  }

  const updated = [...checkIns];
  updated[index] = checkIn;
  writeStorage(localStorageKeys.checkIns, updated);

  return { success: true };
}

export function getRecentCheckIns(limit = 5): DailyCheckIn[] {
  return getSortedCheckIns().slice(0, limit);
}

export function getDashboardStatistics() {
  return calculateDashboardStatistics(getSortedCheckIns());
}
