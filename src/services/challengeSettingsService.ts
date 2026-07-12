import { challengeConfig, localStorageKeys } from "../config/challengeConfig";
import { readStorage, writeStorage } from "./localStorageService";

interface ChallengeSettings {
  startDate: string;
}

const defaultChallengeSettings: ChallengeSettings = {
  startDate: challengeConfig.startDate,
};

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function getChallengeSettings(): ChallengeSettings {
  const settings = readStorage<ChallengeSettings>(localStorageKeys.settings, defaultChallengeSettings);
  if (!isValidIsoDate(settings.startDate)) {
    return defaultChallengeSettings;
  }

  return settings;
}

export function getChallengeStartDate(): string {
  return getChallengeSettings().startDate;
}

export function setChallengeStartDate(startDate: string): void {
  if (!isValidIsoDate(startDate)) {
    return;
  }

  writeStorage<ChallengeSettings>(localStorageKeys.settings, { startDate });
}
