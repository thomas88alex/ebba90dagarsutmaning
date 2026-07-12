import { challengeConfig } from "../config/challengeConfig";
import { getChallengeStartDate } from "../services/challengeSettingsService";
import type { ChallengeProgress } from "../types/challenge";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfDay(input: Date): Date {
  return new Date(input.getFullYear(), input.getMonth(), input.getDate());
}

export function getChallengeProgress(date = new Date()): ChallengeProgress {
  const today = startOfDay(date);
  const startDate = startOfDay(new Date(getChallengeStartDate()));
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + challengeConfig.totalDays - 1);

  if (today < startDate) {
    const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / MS_PER_DAY);
    return {
      phase: "upcoming",
      day: 0,
      totalDays: challengeConfig.totalDays,
      percentage: 0,
      daysUntilStart,
    };
  }

  if (today > endDate) {
    return {
      phase: "completed",
      day: challengeConfig.totalDays,
      totalDays: challengeConfig.totalDays,
      percentage: 100,
      daysUntilStart: 0,
    };
  }

  const day = Math.floor((today.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;
  const percentage = Math.round((day / challengeConfig.totalDays) * 100);

  return {
    phase: "active",
    day,
    totalDays: challengeConfig.totalDays,
    percentage,
    daysUntilStart: 0,
  };
}

export function getChallengeDisplayText(date = new Date()): string {
  const progress = getChallengeProgress(date);

  if (progress.phase === "upcoming") {
    return `Challenge begins in ${progress.daysUntilStart} days`;
  }

  if (progress.phase === "completed") {
    return "Challenge completed";
  }

  return `Day ${progress.day} of ${progress.totalDays}`;
}
