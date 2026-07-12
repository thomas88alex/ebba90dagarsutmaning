import { challengeConfig, completionThresholds } from "../config/challengeConfig";
import { getChallengeStartDate } from "../services/challengeSettingsService";
import type { DailyCheckIn, MealCheckIn } from "../types/checkIn";
import type { DashboardDayCell, DashboardDayStatus, DashboardMonthGroup, DashboardStatistics } from "../types/dashboard";
import { toISODate } from "./date";

function safePercentage(value: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((value / total) * 100);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function isDateWithinChallengeRange(dateKey: string, startDate: Date, endDate: Date): boolean {
  const date = startOfDay(new Date(`${dateKey}T12:00:00`));
  return date >= startDate && date <= endDate;
}

function getMonthLabel(monthIndex: number): string {
  const month = new Intl.DateTimeFormat("sv-SE", { month: "long" }).format(new Date(2026, monthIndex, 1));
  return month.charAt(0).toUpperCase() + month.slice(1);
}

function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getMonthLabelFromDate(date: Date): string {
  const month = new Intl.DateTimeFormat("sv-SE", { month: "long" }).format(date);
  return month.charAt(0).toUpperCase() + month.slice(1);
}

function isFullCheckIn(checkIn: DailyCheckIn): boolean {
  return checkIn.completionScore >= 100;
}

function mealHasRecipe(meal?: MealCheckIn): boolean {
  return Boolean(meal?.recipeName);
}

function mealTargetsMet(checkIn: DailyCheckIn): boolean {
  return [1, 2, 3].every((mealNumber) => mealHasRecipe(checkIn.nutrition.meals.find((meal) => meal.mealNumber === mealNumber)));
}

function isRestDayType(activityType: string | undefined): boolean {
  return activityType === "Vila" || activityType === "Vilodag";
}

function restDayAllowed(checkIn: DailyCheckIn, checkIns: DailyCheckIn[]): boolean {
  if (!isRestDayType(checkIn.training.activityType)) {
    return false;
  }

  const weekStart = Math.floor((checkIn.challengeDay - 1) / 7) * 7 + 1;
  const weekEnd = Math.min(weekStart + 6, challengeConfig.totalDays);

  const restDaysThisWeek = checkIns
    .filter((item) => item.challengeDay >= weekStart && item.challengeDay <= weekEnd)
    .filter((item) => isRestDayType(item.training.activityType))
    .sort((left, right) => left.challengeDay - right.challengeDay);

  return restDaysThisWeek[0]?.challengeDay === checkIn.challengeDay;
}

function dailyTargetsMet(checkIn: DailyCheckIn, checkIns: DailyCheckIn[]): boolean {
  const mealsMet = mealTargetsMet(checkIn);
  const nutritionPlanMet =
    checkIn.nutrition.followedMealPlan === true
      || checkIn.nutrition.ateOutsidePlan === false;
  const waterMet = checkIn.water.actualLitres >= 2;
  const sleepMet = checkIn.recovery.sleepHours >= 6;
  const screenshotMet =
    isRestDayType(checkIn.training.activityType)
      ? true
      : checkIn.training.screenshotSentToThomas === true;
  const workoutMet =
    isRestDayType(checkIn.training.activityType)
      ? restDayAllowed(checkIn, checkIns)
      : (checkIn.training.durationMinutes ?? 0) >= 60;
  const reflectionMet = Boolean(
    checkIn.reflection.wentWell?.trim()
    && checkIn.reflection.biggestObstacle?.trim()
    && checkIn.reflection.tomorrowPlan?.trim(),
  );

  return mealsMet && nutritionPlanMet && waterMet && sleepMet && workoutMet && screenshotMet && reflectionMet;
}

export function buildDashboardDayCells(
  checkIns: DailyCheckIn[],
  referenceDate = new Date(),
): DashboardDayCell[] {
  const startDate = startOfDay(new Date(getChallengeStartDate()));
  const endDate = addDays(startDate, challengeConfig.totalDays - 1);
  const checkInMap = new Map(checkIns.map((checkIn) => [checkIn.date, checkIn] as const));
  const today = toISODate(referenceDate);
  const months: DashboardDayCell[] = [];
  const monthCursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const lastMonthDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (monthCursor <= lastMonthDate) {
    const monthYear = monthCursor.getFullYear();
    const monthIndex = monthCursor.getMonth();
    const monthKey = getMonthKey(monthCursor);
    const monthLabel = getMonthLabelFromDate(monthCursor);
    const daysInMonth = new Date(monthYear, monthIndex + 1, 0).getDate();

    for (let dayOfMonth = 1; dayOfMonth <= 31; dayOfMonth += 1) {
      const isValidCalendarDay = dayOfMonth <= daysInMonth;
      const challengeDate = isValidCalendarDay ? new Date(monthYear, monthIndex, dayOfMonth) : null;
      const dateKey = challengeDate ? toISODate(challengeDate) : null;
      const isInChallenge = Boolean(
        challengeDate
        && challengeDate >= startDate
        && challengeDate <= endDate,
      );
      const existingCheckIn = dateKey ? checkInMap.get(dateKey) : undefined;
      const hasCheckIn = Boolean(isInChallenge && existingCheckIn);
      let status: DashboardDayStatus = "outside";

      if (isInChallenge) {
        status = existingCheckIn?.completionScore === 0 ? "gray" : "yellow";

        if (existingCheckIn && isFullCheckIn(existingCheckIn)) {
          status = dailyTargetsMet(existingCheckIn, checkIns) ? "green" : "red";
        } else if (!existingCheckIn) {
          status = "gray";
        }
      }

      const challengeDay = isInChallenge && challengeDate
        ? Math.floor((startOfDay(challengeDate).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : null;

      months.push({
        challengeDay,
        date: dateKey,
        dayOfMonth,
        monthKey,
        monthIndex,
        monthLabel,
        isInChallenge,
        hasCheckIn,
        completionScore: existingCheckIn?.completionScore ?? 0,
        status,
        title: dateKey
          ? `${dateKey}${dateKey === today ? " - idag" : ""}`
          : `${monthLabel} ${dayOfMonth}`,
      });
    }

    monthCursor.setMonth(monthCursor.getMonth() + 1);
  }

  return months;
}

export function buildDashboardMonthGroups(cells: DashboardDayCell[]): DashboardMonthGroup[] {
  const groups = new Map<string, DashboardDayCell[]>();

  for (const cell of cells) {
    const existing = groups.get(cell.monthKey);
    if (existing) {
      existing.push(cell);
    } else {
      groups.set(cell.monthKey, [cell]);
    }
  }

  return Array.from(groups.entries()).map(([monthKey, monthCells]) => ({
    monthKey,
    monthIndex: monthCells[0]?.monthIndex ?? 0,
    monthLabel: monthCells[0]?.monthLabel ?? getMonthLabel(monthCells[0]?.monthIndex ?? 0),
    cells: monthCells,
  }));
}

function isCompletedCheckIn(checkIn: DailyCheckIn): boolean {
  return checkIn.completionScore >= completionThresholds.streakMinScore;
}

function getCurrentStreak(checkIns: DailyCheckIn[]): number {
  const sorted = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;

  for (const checkIn of sorted) {
    if (isCompletedCheckIn(checkIn)) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function getLongestStreak(checkIns: DailyCheckIn[]): number {
  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let current = 0;

  for (const checkIn of sorted) {
    if (isCompletedCheckIn(checkIn)) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

export function calculateDashboardStatistics(checkIns: DailyCheckIn[]): DashboardStatistics {
  const startDate = startOfDay(new Date(getChallengeStartDate()));
  const endDate = addDays(startDate, challengeConfig.totalDays - 1);
  const challengeCheckIns = checkIns.filter((item) => isDateWithinChallengeRange(item.date, startDate, endDate));

  const total = challengeCheckIns.length;
  const totalCompletedDays = challengeCheckIns.filter((item) => item.completionScore >= 100).length;
  const totalMissedDays = challengeCheckIns.filter((item) => item.overallStatus === "missed").length;

  const trainingCompleted = challengeCheckIns.filter((item) => item.training.status === "completed").length;
  const nutritionCompleted = challengeCheckIns.filter((item) => {
    const completedMeals = item.nutrition.meals.filter((meal) => meal.status === "completed").length;
    return completedMeals >= 4;
  }).length;
  const waterCompleted = challengeCheckIns.filter((item) => item.water.targetCompleted).length;

  return {
    totalCompletedDays,
    totalMissedDays,
    currentStreak: getCurrentStreak(challengeCheckIns),
    longestStreak: getLongestStreak(challengeCheckIns),
    trainingCompletionPercentage: safePercentage(trainingCompleted, total),
    nutritionCompletionPercentage: safePercentage(nutritionCompleted, total),
    waterCompletionPercentage: safePercentage(waterCompleted, total),
    checkInCompletionPercentage: safePercentage(total, 90),
  };
}
