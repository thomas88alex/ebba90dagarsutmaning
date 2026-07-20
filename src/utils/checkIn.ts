import { completionThresholds, defaults } from "../config/challengeConfig";
import type { DailyCheckIn, CompletionStatus, MealCheckIn } from "../types/checkIn";
import { getChallengeProgress } from "./challenge";

export const trainingOptions = [
  "Medley pass 60min",
  "Bildäck",
  "Spinning",
  "Rodd Maskin",
  "Step Master",
  "Löpband",
  "Promenad",
  "Simning",
  "Annat",
  "Vila",
] as const;

export const trainingOptionDisplay: Record<(typeof trainingOptions)[number], string> = {
  "Medley pass 60min": "🔀 Medley pass 60min",
  "Bildäck": "🛞 Bildäck",
  "Spinning": "🚴 Spinning",
  "Rodd Maskin": "🚣 Rodd Maskin",
  "Step Master": "🪜 Step Master",
  "Löpband": "🏃 Löpband",
  "Promenad": "🚶 Promenad",
  "Simning": "🏊 Simning",
  "Annat": "⭐ Annat",
  "Vila": "🌙 Vila",
};

export function getTrainingIcon(activityType: string | undefined): string {
  switch (activityType) {
    case "Medley pass 60min":
      return "🔀";
    case "Bildäck":
      return "🛞";
    case "Spinning":
      return "🚴";
    case "Rodd Maskin":
      return "🚣";
    case "Step Master":
      return "🪜";
    case "Löpband":
      return "🏃";
    case "Promenad":
      return "🚶";
    case "Simning":
      return "🏊";
    case "Annat":
      return "⭐";
    case "Vila":
    case "Vilodag":
      return "🌙";
    default:
      return "🏋️";
  }
}

export const breakfastOptions = [
  "Proteinpannkakor med Blåbär & Mörk Choklad",
  "Krämig Scrambled Eggs med riskakor, gurka & Banan",
  "Choklad Overnight Oats",
  "Krämig Kyckling Pasta med Ost sås och spenat ",
  "Proteinlasagne med sötpotatis",
  "Lax med ris & Citronsås",
  "Hög Protein Frukost Wrap",
  "Hög Protein Taco Wrap",
  "Annat",
] as const;

export const lunchOptions = [
  "Proteinpannkakor med Blåbär & Mörk Choklad",
  "Krämig Scrambled Eggs med riskakor, gurka & Banan",
  "Choklad Overnight Oats",
  "Krämig Kyckling Pasta med Ost sås och spenat ",
  "Proteinlasagne med sötpotatis",
  "Lax med ris & Citronsås",
  "Hög Protein Frukost Wrap",
  "Hög Protein Taco Wrap",
  "Annat",
] as const;

export const dinnerOptions = [
  "Proteinpannkakor med Blåbär & Mörk Choklad",
  "Krämig Scrambled Eggs med riskakor, gurka & Banan",
  "Choklad Overnight Oats",
  "Krämig Kyckling Pasta med Ost sås och spenat ",
  "Proteinlasagne med sötpotatis",
  "Lax med ris & Citronsås",
  "Hög Protein Frukost Wrap",
  "Hög Protein Taco Wrap",
  "Annat",
] as const;

export interface CheckInFormValues {
  date: string;
  trainingType: string;
  trainingOther: string;
  trainingDuration: string;
  trainingHeartRate: string;
  trainingScreenshotSent: string;
  trainingComment: string;
  breakfast: string;
  breakfastOther: string;
  breakfastComment: string;
  lunch: string;
  lunchOther: string;
  lunchComment: string;
  dinner: string;
  dinnerOther: string;
  dinnerComment: string;
  nutritionPlanFollowed: string;
  starMarked: boolean;
  starMarkNote: string;
  reflectionMarked: boolean;
  reflectionMarkNote: string;
  waterLitres: string;
  waterComment: string;
  sleepHours: string;
  sleepComment: string;
  energy: number;
  energyComment: string;
  stress: number;
  stressComment: string;
  motivation: number;
  motivationComment: string;
  wentWell: string;
  wentWellComment: string;
  biggestObstacle: string;
  biggestObstacleComment: string;
  tomorrowPlan: string;
  tomorrowPlanComment: string;
}

export interface CheckInValidationErrors {
  date?: string;
  trainingType?: string;
  trainingOther?: string;
  trainingDuration?: string;
  trainingHeartRate?: string;
  breakfast?: string;
  breakfastOther?: string;
  lunch?: string;
  lunchOther?: string;
  dinner?: string;
  dinnerOther?: string;
  waterLitres?: string;
  sleepHours?: string;
  energy?: string;
  stress?: string;
  motivation?: string;
  wentWell?: string;
  biggestObstacle?: string;
  tomorrowPlan?: string;
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function isRestDayTraining(trainingType: string): boolean {
  return trainingType === "Vila" || trainingType === "Vilodag";
}

function classifyScore(score: number): CompletionStatus {
  if (score >= completionThresholds.checkInFullyCompletedMin) {
    return "completed";
  }

  if (score >= completionThresholds.checkInPartiallyCompletedMin) {
    return "partial";
  }

  return "missed";
}

function isTrainingAreaComplete(values: CheckInFormValues): boolean {
  if (!hasText(values.trainingType)) {
    return false;
  }

  if (isRestDayTraining(values.trainingType)) {
    return true;
  }

  const duration = toNumber(values.trainingDuration);
  const heartRate = toNumber(values.trainingHeartRate);

  return duration > 0 && heartRate > 0;
}

function isTrainingScreenshotComplete(values: CheckInFormValues): boolean {
  if (isRestDayTraining(values.trainingType)) {
    return true;
  }

  return values.trainingScreenshotSent === "Ja" || values.trainingScreenshotSent === "Nej";
}

function isMealAreaComplete(value: string): boolean {
  return hasText(value);
}

function isNutritionPlanAnswerComplete(value: string): boolean {
  return value === "Ja" || value === "Nej";
}

function isNumberAreaComplete(value: string): boolean {
  return hasText(value) && Number.isFinite(toNumber(value)) && toNumber(value) > 0;
}

function isScoreSliderComplete(value: number): boolean {
  return value >= 1;
}

function isReflectionComplete(value: string): boolean {
  return hasText(value);
}

function normalizeOptionValue(value: string): string {
  return value.normalize("NFC").trim().toLocaleLowerCase("sv-SE");
}

function resolveOptionValue<T extends string>(
  value: string,
  options: readonly T[],
): T | undefined {
  const normalizedValue = normalizeOptionValue(value);
  return options.find((option) => normalizeOptionValue(option) === normalizedValue);
}

function resolveMealSelection<T extends string>(
  recipeName: string | undefined,
  customMeal: string | undefined,
  options: readonly T[],
): { value: T | "Annat" | ""; other: string } {
  if (customMeal?.trim()) {
    return { value: "Annat", other: customMeal };
  }

  if (!recipeName) {
    return { value: "", other: "" };
  }

  const matched = resolveOptionValue(recipeName, options);
  if (matched) {
    return { value: matched, other: "" };
  }

  return { value: "Annat", other: recipeName };
}

export function buildDefaultCheckIn(date: string): CheckInFormValues {
  return {
    date,
    trainingType: "",
    trainingOther: "",
    trainingDuration: "",
    trainingHeartRate: "",
    trainingScreenshotSent: "",
    trainingComment: "",
    breakfast: "",
    breakfastOther: "",
    breakfastComment: "",
    lunch: "",
    lunchOther: "",
    lunchComment: "",
    dinner: "",
    dinnerOther: "",
    dinnerComment: "",
    nutritionPlanFollowed: "",
    starMarked: false,
    starMarkNote: "",
    reflectionMarked: false,
    reflectionMarkNote: "",
    waterLitres: "",
    waterComment: "",
    sleepHours: "",
    sleepComment: "",
    energy: 0,
    energyComment: "",
    stress: 0,
    stressComment: "",
    motivation: 0,
    motivationComment: "",
    wentWell: "",
    wentWellComment: "",
    biggestObstacle: "",
    biggestObstacleComment: "",
    tomorrowPlan: "",
    tomorrowPlanComment: "",
  };
}

export function formValuesFromCheckIn(checkIn: DailyCheckIn): CheckInFormValues {
  const trainingType = checkIn.training.activityType ?? "";
  const resolvedTraining = trainingType.length > 0
    ? resolveOptionValue(trainingType, trainingOptions)
    : undefined;
  const trainingIsOther = trainingType.length > 0 && !resolvedTraining;
  const breakfastMeal = checkIn.nutrition.meals.find((meal) => meal.mealNumber === 1);
  const lunchMeal = checkIn.nutrition.meals.find((meal) => meal.mealNumber === 2);
  const dinnerMeal = checkIn.nutrition.meals.find((meal) => meal.mealNumber === 3);
  const breakfastSelection = resolveMealSelection(
    breakfastMeal?.recipeName,
    breakfastMeal?.customMeal,
    breakfastOptions,
  );
  const lunchSelection = resolveMealSelection(
    lunchMeal?.recipeName,
    lunchMeal?.customMeal,
    lunchOptions,
  );
  const dinnerSelection = resolveMealSelection(
    dinnerMeal?.recipeName,
    dinnerMeal?.customMeal,
    dinnerOptions,
  );
  const legacyReflection = checkIn.reflection as DailyCheckIn["reflection"] & {
    difficult?: string;
    improveTomorrow?: string;
  };
  const legacyComments = checkIn.comments as DailyCheckIn["comments"] & {
    improveTomorrow?: string;
  } | undefined;
  const starMark = checkIn.comments?.starMark?.trim() ?? "";
  const reflectionMark = checkIn.comments?.reflectionMark?.trim() ?? "";

  return {
    date: checkIn.date,
    trainingType: trainingIsOther ? "Annat" : resolvedTraining ?? "",
    trainingOther: trainingIsOther ? trainingType : "",
    trainingDuration: checkIn.training.durationMinutes ? String(checkIn.training.durationMinutes) : "",
    trainingHeartRate: checkIn.training.averageHeartRate ? String(checkIn.training.averageHeartRate) : "",
    trainingScreenshotSent:
      checkIn.training.screenshotSentToThomas === true
        ? "Ja"
        : checkIn.training.screenshotSentToThomas === false
          ? "Nej"
          : "",
    trainingComment: checkIn.training.notes ?? checkIn.comments?.training ?? "",
    breakfast: breakfastSelection.value,
    breakfastOther: breakfastSelection.other,
    breakfastComment: checkIn.comments?.meal1 ?? breakfastMeal?.comment ?? "",
    lunch: lunchSelection.value,
    lunchOther: lunchSelection.other,
    lunchComment: checkIn.comments?.meal2 ?? lunchMeal?.comment ?? "",
    dinner: dinnerSelection.value,
    dinnerOther: dinnerSelection.other,
    dinnerComment: checkIn.comments?.meal3 ?? dinnerMeal?.comment ?? "",
    nutritionPlanFollowed:
      checkIn.nutrition.followedMealPlan === true
        ? "Ja"
        : checkIn.nutrition.followedMealPlan === false
          ? "Nej"
          : checkIn.nutrition.ateOutsidePlan === true
            ? "Nej"
            : checkIn.nutrition.ateOutsidePlan === false
              ? "Ja"
              : "",
    starMarked: starMark.length > 0,
    starMarkNote: starMark === "⭐ Starmarkerad dag" ? "" : starMark,
    reflectionMarked: reflectionMark.length > 0,
    reflectionMarkNote: reflectionMark === "📝 Reflektion att minnas" ? "" : reflectionMark,
    waterLitres: checkIn.water.actualLitres > 0 ? String(checkIn.water.actualLitres) : "",
    waterComment: checkIn.comments?.water ?? "",
    sleepHours: String(checkIn.recovery.sleepHours ?? ""),
    sleepComment: checkIn.comments?.sleep ?? "",
    energy: checkIn.wellbeing.energy ?? 5,
    energyComment: checkIn.comments?.energy ?? "",
    stress: checkIn.wellbeing.stress ?? 5,
    stressComment: checkIn.comments?.stress ?? "",
    motivation: checkIn.wellbeing.motivation ?? 5,
    motivationComment: checkIn.comments?.motivation ?? "",
    wentWell: checkIn.reflection.wentWell ?? "",
    wentWellComment: checkIn.comments?.wentWell ?? "",
    biggestObstacle: checkIn.reflection.biggestObstacle ?? legacyReflection.difficult ?? "",
    biggestObstacleComment: checkIn.comments?.biggestObstacle ?? "",
    tomorrowPlan: checkIn.reflection.tomorrowPlan ?? legacyReflection.improveTomorrow ?? "",
    tomorrowPlanComment: checkIn.comments?.tomorrowPlan ?? legacyComments?.improveTomorrow ?? "",
  };
}

export function calculateCheckInScore(values: CheckInFormValues): number {
  const areaChecks = [
    isTrainingAreaComplete(values),
    isTrainingScreenshotComplete(values),
    isMealAreaComplete(values.breakfast),
    isMealAreaComplete(values.lunch),
    isMealAreaComplete(values.dinner),
    isNutritionPlanAnswerComplete(values.nutritionPlanFollowed),
    isNumberAreaComplete(values.waterLitres),
    isNumberAreaComplete(values.sleepHours),
    isScoreSliderComplete(values.energy),
    isScoreSliderComplete(values.stress),
    isScoreSliderComplete(values.motivation),
    isReflectionComplete(values.wentWell),
    isReflectionComplete(values.biggestObstacle),
    isReflectionComplete(values.tomorrowPlan),
  ];

  const completedAreas = areaChecks.filter(Boolean).length;
  return clampScore((completedAreas / areaChecks.length) * 100);
}

export function classifyCheckIn(score: number): CompletionStatus {
  return classifyScore(score);
}

export function validateCheckIn(values: CheckInFormValues): CheckInValidationErrors {
  const errors: CheckInValidationErrors = {};

  if (!values.date) {
    errors.date = "Datum krävs.";
  }

  if (values.trainingType && !isRestDayTraining(values.trainingType)) {
    const duration = toNumber(values.trainingDuration);
    if (values.trainingDuration.trim() !== "" && (!Number.isFinite(duration) || duration < 0 || duration > 120)) {
      errors.trainingDuration = "Tiden måste vara mellan 0 och 120 minuter.";
    }

    const heartRate = toNumber(values.trainingHeartRate);
    if (values.trainingHeartRate.trim() !== "" && (!Number.isFinite(heartRate) || heartRate < 100 || heartRate > 180)) {
      errors.trainingHeartRate = "Genomsnittspuls måste vara mellan 100 och 180.";
    }
  }

  if (values.breakfast === "Annat" && !values.breakfastOther.trim()) {
    errors.breakfastOther = "Beskriv frukosten.";
  }

  if (values.lunch === "Annat" && !values.lunchOther.trim()) {
    errors.lunchOther = "Beskriv lunchen.";
  }

  if (values.dinner === "Annat" && !values.dinnerOther.trim()) {
    errors.dinnerOther = "Beskriv middagen.";
  }

  const water = toNumber(values.waterLitres);
  if (values.waterLitres.trim() !== "" && (!Number.isFinite(water) || water < 0 || water > 3)) {
    errors.waterLitres = "Vattenmängden måste vara mellan 0 och 3 liter.";
  }

  const sleep = toNumber(values.sleepHours);
  if (values.sleepHours.trim() !== "" && (!Number.isFinite(sleep) || sleep < 0 || sleep > 10)) {
    errors.sleepHours = "Sömntimmar måste vara mellan 0 och 10.";
  }

  if (values.energy !== 0 && (values.energy < 1 || values.energy > 10)) {
    errors.energy = "Energi måste vara mellan 1 och 10.";
  }
  if (values.stress !== 0 && (values.stress < 1 || values.stress > 10)) {
    errors.stress = "Stress måste vara mellan 1 och 10.";
  }
  if (values.motivation !== 0 && (values.motivation < 1 || values.motivation > 10)) {
    errors.motivation = "Motivation måste vara mellan 1 och 10.";
  }

  return errors;
}

export function toDailyCheckIn(values: CheckInFormValues): DailyCheckIn {
  const progress = getChallengeProgress(new Date(`${values.date}T12:00:00`));
  const trainingActivity =
    values.trainingType === "Annat"
      ? (values.trainingOther.trim() || "Annat")
      : values.trainingType;

  const meals: MealCheckIn[] = [
    {
      mealNumber: 1,
      status: "completed",
      recipeName: values.breakfast === "Annat" ? undefined : values.breakfast,
      customMeal: values.breakfast === "Annat" ? values.breakfastOther.trim() : undefined,
      comment: values.breakfastComment.trim() || undefined,
    },
    {
      mealNumber: 2,
      status: "completed",
      recipeName: values.lunch === "Annat" ? undefined : values.lunch,
      customMeal: values.lunch === "Annat" ? values.lunchOther.trim() : undefined,
      comment: values.lunchComment.trim() || undefined,
    },
    {
      mealNumber: 3,
      status: "completed",
      recipeName: values.dinner === "Annat" ? undefined : values.dinner,
      customMeal: values.dinner === "Annat" ? values.dinnerOther.trim() : undefined,
      comment: values.dinnerComment.trim() || undefined,
    },
  ];

  const completionScore = calculateCheckInScore(values);
  const overallStatus = classifyCheckIn(completionScore);
  const nowIso = new Date().toISOString();

  return {
    id: `checkin-${values.date}`,
    date: values.date,
    challengeDay: progress.day,
    training: {
      status: "completed",
      activityType: trainingActivity,
      durationMinutes:
        isRestDayTraining(values.trainingType) ? undefined : toNumber(values.trainingDuration),
      averageHeartRate:
        isRestDayTraining(values.trainingType) ? undefined : toNumber(values.trainingHeartRate),
      screenshotSentToThomas:
        isRestDayTraining(values.trainingType)
          ? undefined
          : values.trainingScreenshotSent === "Ja",
      notes: values.trainingComment.trim() || undefined,
    },
    nutrition: {
      meals,
      followedMealPlan: values.nutritionPlanFollowed === "Ja",
      ateOutsidePlan: values.nutritionPlanFollowed === "Nej",
    },
    water: {
      plannedLitres: defaults.waterTargetLitres,
      actualLitres: toNumber(values.waterLitres),
      targetCompleted: toNumber(values.waterLitres) >= defaults.waterTargetLitres,
    },
    recovery: {
      sleepHours: toNumber(values.sleepHours),
      sleepQuality: Math.min(5, Math.max(1, Math.round((toNumber(values.sleepHours) / 8) * 5) || 1)),
      recoveryLevel: Math.min(5, Math.max(1, Math.round(((10 - values.stress) / 10) * 5) || 1)),
      followedBedtime: undefined,
    },
    wellbeing: {
      energy: values.energy,
      mood: values.motivation,
      stress: values.stress,
      motivation: values.motivation,
    },
    reflection: {
      wentWell: values.wentWell.trim(),
      biggestObstacle: values.biggestObstacle.trim(),
      tomorrowPlan: values.tomorrowPlan.trim(),
      additionalNotes: values.tomorrowPlanComment.trim() || undefined,
    },
    comments: {
      training: values.trainingComment.trim() || undefined,
      meal1: values.breakfastComment.trim() || undefined,
      meal2: values.lunchComment.trim() || undefined,
      meal3: values.dinnerComment.trim() || undefined,
      starMark: values.starMarked
        ? (values.starMarkNote.trim() || "⭐ Starmarkerad dag")
        : undefined,
      reflectionMark: values.reflectionMarked
        ? (values.reflectionMarkNote.trim() || "📝 Reflektion att minnas")
        : undefined,
      water: values.waterComment.trim() || undefined,
      sleep: values.sleepComment.trim() || undefined,
      energy: values.energyComment.trim() || undefined,
      stress: values.stressComment.trim() || undefined,
      motivation: values.motivationComment.trim() || undefined,
      wentWell: values.wentWellComment.trim() || undefined,
      biggestObstacle: values.biggestObstacleComment.trim() || undefined,
      tomorrowPlan: values.tomorrowPlanComment.trim() || undefined,
    },
    completionScore,
    overallStatus,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
