import { challengeConfig, localStorageKeys } from "../config/challengeConfig";
import { readStorage, writeStorage } from "./localStorageService";

export const profileImageChangedEvent = "ebbaChallenge:profileImageChanged";

interface ChallengeSettings {
  startDate: string;
  profileImageDataUrl: string | null;
}

const defaultChallengeSettings: ChallengeSettings = {
  startDate: challengeConfig.startDate,
  profileImageDataUrl: null,
};

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function getChallengeSettings(): ChallengeSettings {
  const settings = readStorage<Partial<ChallengeSettings>>(localStorageKeys.settings, defaultChallengeSettings);
  if (!settings || !isValidIsoDate(settings.startDate ?? "")) {
    return defaultChallengeSettings;
  }

  const profileImageDataUrl =
    typeof settings.profileImageDataUrl === "string" || settings.profileImageDataUrl === null
      ? settings.profileImageDataUrl
      : null;

  return {
    startDate: settings.startDate ?? defaultChallengeSettings.startDate,
    profileImageDataUrl,
  };
}

export function getChallengeStartDate(): string {
  return getChallengeSettings().startDate;
}

export function setChallengeStartDate(startDate: string): void {
  if (!isValidIsoDate(startDate)) {
    return;
  }

  const currentSettings = getChallengeSettings();
  writeStorage<ChallengeSettings>(localStorageKeys.settings, {
    ...currentSettings,
    startDate,
  });
}

export function getProfileImageDataUrl(): string | null {
  return getChallengeSettings().profileImageDataUrl;
}

export function setProfileImageDataUrl(profileImageDataUrl: string | null): void {
  const currentSettings = getChallengeSettings();
  const normalizedValue = typeof profileImageDataUrl === "string" ? profileImageDataUrl : null;
  writeStorage<ChallengeSettings>(localStorageKeys.settings, {
    ...currentSettings,
    profileImageDataUrl: normalizedValue,
  });
  window.dispatchEvent(new Event(profileImageChangedEvent));
}
