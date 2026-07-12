import { localStorageKeys } from "../config/challengeConfig";
import type { DailyCheckIn } from "../types/checkIn";
import type { AuthState } from "../types/auth";
import { readStorage, writeStorage } from "./localStorageService";

const BACKUP_SCHEMA_VERSION = 1;
const backupMetaKey = "ebbaChallenge.backupMeta";
const optionalRecipesKey = "ebbaChallenge.recipes";
const optionalSelectedMealsKey = "ebbaChallenge.selectedMeals";

interface ChallengeSettingsSnapshot {
  startDate: string;
}

interface BackupMeta {
  latestExportDate?: string;
}

export interface ChallengeBackupPayload {
  schemaVersion: number;
  exportDate: string;
  checkIns: DailyCheckIn[];
  challengeSettings: ChallengeSettingsSnapshot;
  userSettings: AuthState;
  recipes: unknown | null;
  selectedMeals: unknown | null;
}

export interface ImportSummary {
  schemaVersion: number;
  exportDate: string;
  checkInsCount: number;
  earliestCheckInDate: string | null;
  latestCheckInDate: string | null;
  includesChallengeSettings: boolean;
  includesUserSettings: boolean;
  includesRecipes: boolean;
  includesSelectedMeals: boolean;
}

export type ParseImportResult =
  | {
    ok: true;
    payload: ChallengeBackupPayload;
    summary: ImportSummary;
  }
  | {
    ok: false;
    error: string;
  };

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function defaultAuthState(): AuthState {
  return {
    isAuthenticated: false,
    rememberMe: false,
    user: null,
  };
}

function defaultChallengeSettings(): ChallengeSettingsSnapshot {
  return { startDate: "2026-07-13" };
}

function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildSummary(payload: ChallengeBackupPayload): ImportSummary {
  const sortedDates = payload.checkIns
    .map((item) => item.date)
    .filter((date) => isIsoDate(date))
    .sort((a, b) => a.localeCompare(b));

  return {
    schemaVersion: payload.schemaVersion,
    exportDate: payload.exportDate,
    checkInsCount: payload.checkIns.length,
    earliestCheckInDate: sortedDates[0] ?? null,
    latestCheckInDate: sortedDates[sortedDates.length - 1] ?? null,
    includesChallengeSettings: true,
    includesUserSettings: true,
    includesRecipes: payload.recipes != null,
    includesSelectedMeals: payload.selectedMeals != null,
  };
}

function validateImportedPayload(value: unknown): ParseImportResult {
  if (!isObject(value)) {
    return { ok: false, error: "Importfilen innehåller inte giltig JSON-data." };
  }

  const schemaVersion = value.schemaVersion;
  const exportDate = value.exportDate;
  const checkIns = value.checkIns;
  const challengeSettings = value.challengeSettings;
  const userSettings = value.userSettings;
  const recipes = value.recipes ?? null;
  const selectedMeals = value.selectedMeals ?? null;

  if (typeof schemaVersion !== "number" || schemaVersion < 1) {
    return { ok: false, error: "Ogiltig schemaVersion i importfilen." };
  }

  if (typeof exportDate !== "string" || Number.isNaN(Date.parse(exportDate))) {
    return { ok: false, error: "Ogiltigt exportDate i importfilen." };
  }

  if (!Array.isArray(checkIns)) {
    return { ok: false, error: "Importfilen saknar en giltig checkIns-lista." };
  }

  if (!isObject(challengeSettings) || typeof challengeSettings.startDate !== "string" || !isIsoDate(challengeSettings.startDate)) {
    return { ok: false, error: "Importfilen saknar giltiga challengeSettings." };
  }

  if (!isObject(userSettings) || typeof userSettings.isAuthenticated !== "boolean" || typeof userSettings.rememberMe !== "boolean") {
    return { ok: false, error: "Importfilen saknar giltiga userSettings." };
  }

  const normalizedPayload: ChallengeBackupPayload = {
    schemaVersion,
    exportDate,
    checkIns: checkIns as DailyCheckIn[],
    challengeSettings: {
      startDate: challengeSettings.startDate,
    },
    userSettings: {
      isAuthenticated: userSettings.isAuthenticated,
      rememberMe: userSettings.rememberMe,
      user: ("user" in userSettings ? (userSettings.user as AuthState["user"]) : null) ?? null,
    },
    recipes,
    selectedMeals,
  };

  return {
    ok: true,
    payload: normalizedPayload,
    summary: buildSummary(normalizedPayload),
  };
}

export function createBackupPayload(): ChallengeBackupPayload {
  const nowIso = new Date().toISOString();

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportDate: nowIso,
    checkIns: readStorage<DailyCheckIn[]>(localStorageKeys.checkIns, []),
    challengeSettings: readStorage<ChallengeSettingsSnapshot>(localStorageKeys.settings, defaultChallengeSettings()),
    userSettings: readStorage<AuthState>(localStorageKeys.auth, defaultAuthState()),
    recipes: readStorage<unknown | null>(optionalRecipesKey, null),
    selectedMeals: readStorage<unknown | null>(optionalSelectedMealsKey, null),
  };
}

export function restoreFromBackup(payload: ChallengeBackupPayload): void {
  writeStorage(localStorageKeys.checkIns, payload.checkIns);
  writeStorage(localStorageKeys.settings, payload.challengeSettings);
  writeStorage(localStorageKeys.auth, payload.userSettings);

  if (payload.recipes != null) {
    writeStorage(optionalRecipesKey, payload.recipes);
  }

  if (payload.selectedMeals != null) {
    writeStorage(optionalSelectedMealsKey, payload.selectedMeals);
  }
}

export function parseImportPayload(fileText: string): ParseImportResult {
  try {
    const parsed = JSON.parse(fileText) as unknown;
    return validateImportedPayload(parsed);
  } catch {
    return { ok: false, error: "Kunde inte läsa importfilen. Kontrollera att det är en JSON-fil." };
  }
}

export function buildExportFilename(date: Date): string {
  return `ebba-90-day-challenge-backup-${formatDateForFilename(date)}.json`;
}

export function buildPreImportBackupFilename(date: Date): string {
  return `ebba-90-day-challenge-pre-import-backup-${formatDateForFilename(date)}.json`;
}

export function getWeeklyBackupReminder(): { showReminder: boolean; message: string } {
  const meta = readStorage<BackupMeta>(backupMetaKey, {});
  const latestExportDate = meta.latestExportDate;

  if (!latestExportDate) {
    return {
      showReminder: true,
      message: "Du har inte exporterat backup ännu. Ta en backup denna vecka.",
    };
  }

  const latest = Date.parse(latestExportDate);
  if (Number.isNaN(latest)) {
    return {
      showReminder: true,
      message: "Senaste backupdatum är ogiltigt. Exportera en ny backup nu.",
    };
  }

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - latest;

  if (elapsed >= sevenDaysMs) {
    return {
      showReminder: true,
      message: "Det har gått minst 7 dagar sedan senaste export. Skapa en ny backup.",
    };
  }

  const daysLeft = Math.max(1, Math.ceil((sevenDaysMs - elapsed) / (24 * 60 * 60 * 1000)));
  return {
    showReminder: false,
    message: `Senaste backup är aktuell. Nästa rekommenderade backup om ${daysLeft} dag(ar).`,
  };
}

export function setLatestExportDate(exportDateIso: string): void {
  writeStorage<BackupMeta>(backupMetaKey, { latestExportDate: exportDateIso });
}
