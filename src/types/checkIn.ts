export type CompletionStatus = "completed" | "partial" | "missed";

export interface MealCheckIn {
  mealNumber: number;
  status: CompletionStatus;
  recipeName?: string;
  customMeal?: string;
  comment?: string;
}

export interface DailyCheckIn {
  id: string;
  date: string;
  challengeDay: number;
  training: {
    status: CompletionStatus;
    activityType?: string;
    durationMinutes?: number;
    averageHeartRate?: number;
    screenshotSentToThomas?: boolean;
    distance?: number;
    notes?: string;
  };
  nutrition: {
    meals: MealCheckIn[];
    followedMealPlan?: boolean;
    ateOutsidePlan?: boolean;
    outsidePlanNotes?: string;
  };
  water: {
    plannedLitres: number;
    actualLitres: number;
    targetCompleted: boolean;
  };
  recovery: {
    sleepHours: number;
    sleepQuality?: number;
    recoveryLevel?: number;
    followedBedtime?: boolean;
  };
  wellbeing: {
    energy: number;
    mood: number;
    stress: number;
    motivation: number;
  };
  reflection: {
    wentWell?: string;
    biggestObstacle?: string;
    tomorrowPlan?: string;
    additionalNotes?: string;
  };
  comments?: {
    training?: string;
    meal1?: string;
    meal2?: string;
    meal3?: string;
    water?: string;
    sleep?: string;
    starMark?: string;
    reflectionMark?: string;
    energy?: string;
    stress?: string;
    motivation?: string;
    wentWell?: string;
    biggestObstacle?: string;
    tomorrowPlan?: string;
  };
  completionScore: number;
  overallStatus: CompletionStatus;
  createdAt: string;
  updatedAt: string;
}
