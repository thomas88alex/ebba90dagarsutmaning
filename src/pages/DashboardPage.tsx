import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  IconBarbell,
  IconBolt,
  IconBrain,
  IconCamera,
  IconChefHat,
  IconChecklist,
  IconMessageCircle,
  IconMoon,
  IconNotebook,
  IconTargetArrow,
  IconTrophy,
} from "@tabler/icons-react";
import { challengeConfig } from "../config/challengeConfig";
import { sampleRecipes } from "../data/recipes";
import { getCheckIns } from "../services/checkInService";
import { getTrainingIcon } from "../utils/checkIn";
import { buildDashboardDayCells, buildDashboardMonthGroups, calculateDashboardStatistics } from "../utils/statistics";
import type { DailyCheckIn } from "../types/checkIn";
import { formatLongDate, getGreeting } from "../utils/date";
import { getChallengeDisplayText, getChallengeProgress } from "../utils/challenge";

const monthTintColors: Record<number, string> = {
  6: "#e8efe7",
  7: "#e8efe7",
  8: "#e8efe7",
  9: "#e8efe7",
};

const statusLabels: Record<"green" | "yellow" | "red" | "gray" | "outside", string> = {
  green: "Mål nått",
  yellow: "Delvis ifylld",
  red: "Ifylld men ej mål",
  gray: "0% ifylld",
  outside: "Utanför utmaningen",
};

const statusColors: Record<"green" | "yellow" | "red" | "gray" | "outside", string> = {
  green: "rgba(28, 110, 66, 0.92)",
  yellow: "rgba(174, 124, 18, 0.9)",
  red: "rgba(176, 53, 53, 0.92)",
  gray: "rgba(160, 160, 160, 0.92)",
  outside: "rgba(255, 255, 255, 1)",
};

type CalendarCellStyle = CSSProperties & Record<string, string>;

interface GreenGoalItem {
  icon: ReactNode;
  text: string;
}

interface RecentAreaItem {
  icon: ReactNode;
  label: string;
  detail: string;
  comment?: string;
  filled: boolean;
}

interface OverviewMetric {
  key: "energy" | "stress" | "motivation";
  label: string;
  color: string;
  icon: ReactNode;
}

interface ChartPoint {
  x: number;
  y: number;
  value: number;
}

const overviewChartLayout = {
  width: 100,
  height: 44,
  xStart: 6,
  xEnd: 99,
  yTop: 3,
  yBottom: 40,
} as const;

const greenGoalItems = [
  { icon: <IconBarbell size={16} />, text: "Minst 60 min träning" },
  { icon: <IconMoon size={16} />, text: "Minst 6-8 h sömn" },
  { icon: <IconChefHat size={16} />, text: "Receptmåltider vid 3 måltider" },
  { icon: <span aria-hidden="true">💧</span>, text: "Druckit minst 2 l vatten" },
  { icon: <IconChecklist size={16} />, text: "Check-in ifylld" },
  { icon: <IconCamera size={16} />, text: "Screenshot träning" },
] satisfies GreenGoalItem[];

const overviewMetrics: OverviewMetric[] = [
  {
    key: "energy",
    label: "Energi",
    color: "#c56a4d",
    icon: <IconBolt size={16} />,
  },
  {
    key: "stress",
    label: "Stress",
    color: "#c09222",
    icon: <IconBrain size={16} />,
  },
  {
    key: "motivation",
    label: "Motivation",
    color: "#2f7a50",
    icon: <IconTargetArrow size={16} />,
  },
];

export function DashboardPage() {
  const [calendarFilter, setCalendarFilter] = useState<"none" | "workout" | "water" | "sleep" | "energy" | "stress" | "motivation" | "starmark" | "reflection">("none");
  const checkIns = useMemo(() => getCheckIns(), []);
  const checkInByDate = useMemo(() => new Map(checkIns.map((checkIn) => [checkIn.date, checkIn] as const)), [checkIns]);
  const challengeProgress = useMemo(() => getChallengeProgress(new Date()), []);
  const dashboardStatistics = useMemo(() => calculateDashboardStatistics(checkIns), [checkIns]);
  const challengeCells = useMemo(() => buildDashboardDayCells(checkIns), [checkIns]);
  const monthGroups = useMemo(() => buildDashboardMonthGroups(challengeCells), [challengeCells]);

  const challengeOnlyCells = challengeCells.filter((cell) => cell.isInChallenge);
  const filledDays = challengeOnlyCells.filter((cell) => cell.hasCheckIn).length;
  const greenDays = challengeOnlyCells.filter((cell) => cell.status === "green").length;
  const redDays = challengeOnlyCells.filter((cell) => cell.status === "red").length;
  const yellowDays = challengeOnlyCells.filter((cell) => cell.status === "yellow").length;
  const filledPercentage = Math.round((filledDays / challengeConfig.totalDays) * 100);

  const recentDays = useMemo(() => {
    const timeline = challengeCells
      .filter((cell) => cell.isInChallenge && Boolean(cell.date))
      .sort((left, right) => (left.date ?? "").localeCompare(right.date ?? ""));

    if (timeline.length === 0) {
      return [];
    }

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const latestFilledDate = [...checkIns]
      .map((checkIn) => checkIn.date)
      .filter((date) => timeline.some((cell) => cell.date === date))
      .sort()
      .at(-1);

    const latestReferenceDate = timeline.some((cell) => cell.date === todayKey)
      ? todayKey
      : latestFilledDate ?? timeline[0]?.date ?? todayKey;

    let endIndex = timeline.length - 1;
    for (let index = 0; index < timeline.length; index += 1) {
      const dateKey = timeline[index]?.date;
      if (dateKey && dateKey <= latestReferenceDate) {
        endIndex = index;
      }
    }

    return timeline.slice(Math.max(0, endIndex - 4), endIndex + 1);
  }, [challengeCells, checkIns]);

  const overviewTimeline = useMemo(() => (
    challengeCells
      .filter((cell) => cell.isInChallenge && Boolean(cell.date))
      .sort((left, right) => (left.date ?? "").localeCompare(right.date ?? ""))
  ), [challengeCells]);

  const overviewSeries = useMemo(() => (
    overviewMetrics.map((metric) => {
      const values = overviewTimeline.map((dayCell) => {
        const checkIn = dayCell.date ? checkInByDate.get(dayCell.date) : undefined;
        return getWellbeingValue(checkIn, metric.key);
      });
      const segments = buildChartSegments(values);
      const allPoints = segments.flat();
      const filledCount = allPoints.length;
      const averageValue = filledCount > 0
        ? Math.round((allPoints.reduce((sum, point) => sum + point.value, 0) / filledCount) * 10) / 10
        : null;
      let latestValue: number | null = null;
      for (let index = values.length - 1; index >= 0; index -= 1) {
        const value = values[index];
        if (value != null) {
          latestValue = value;
          break;
        }
      }

      return {
        metric,
        segments,
        allPoints,
        filledCount,
        averageValue,
        latestValue,
      };
    })
  ), [overviewTimeline, checkInByDate]);

  const overviewWeekSeparators = useMemo(() => {
    if (overviewTimeline.length < 2) {
      return [];
    }

    const separators: number[] = [];
    for (let dayIndex = 4; dayIndex < overviewTimeline.length - 1; dayIndex += 5) {
      const x = overviewChartLayout.xStart
        + ((overviewChartLayout.xEnd - overviewChartLayout.xStart) * dayIndex) / (overviewTimeline.length - 1);
      separators.push(x);
    }

    return separators;
  }, [overviewTimeline.length]);

  const overviewDayLabels = useMemo(() => {
    const labels: number[] = [1];
    for (let day = 5; day <= challengeConfig.totalDays; day += 5) {
      labels.push(day);
    }

    if (labels.at(-1) !== challengeConfig.totalDays) {
      labels.push(challengeConfig.totalDays);
    }

    return labels;
  }, []);

  function getWellbeingValue(checkIn: DailyCheckIn | undefined, key: OverviewMetric["key"]): number | null {
    if (!checkIn) {
      return null;
    }

    const value = checkIn.wellbeing[key];
    return value > 0 ? value : null;
  }

  function buildChartSegments(values: Array<number | null>): ChartPoint[][] {
    if (values.length === 0) {
      return [];
    }

    const usableHeight = overviewChartLayout.yBottom - overviewChartLayout.yTop;
    const chartPoints = values.map((value, index) => {
      if (value == null) {
        return null;
      }

      const x = values.length === 1
        ? (overviewChartLayout.xStart + overviewChartLayout.xEnd) / 2
        : overviewChartLayout.xStart + ((overviewChartLayout.xEnd - overviewChartLayout.xStart) * index) / (values.length - 1);
      const y = overviewChartLayout.yBottom - ((value - 1) / 9) * usableHeight;

      return { x, y, value };
    });

    const segments: ChartPoint[][] = [];
    let currentSegment: ChartPoint[] = [];

    for (const point of chartPoints) {
      if (!point) {
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
          currentSegment = [];
        }
        continue;
      }

      currentSegment.push(point);
    }

    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    return segments;
  }

  function normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function getRecipeDetail(recipeName: string | undefined, fallbackLabel: string): string {
    if (!recipeName) {
      return fallbackLabel;
    }

    const normalizedRecipe = normalizeText(recipeName);
    const matchedRecipe = sampleRecipes.find((recipe) => {
      const normalizedTitle = normalizeText(recipe.title);
      return normalizedTitle === normalizedRecipe
        || normalizedTitle.includes(normalizedRecipe)
        || normalizedRecipe.includes(normalizedTitle);
    });

    if (!matchedRecipe) {
      return recipeName;
    }

    return `${matchedRecipe.title}, ${matchedRecipe.calories}kcal`;
  }

  function getTrainingDetail(checkIn: DailyCheckIn | undefined): string {
    if (!checkIn?.training.activityType) {
      return "Ej ifylld";
    }

    if (checkIn.training.activityType === "Vila" || checkIn.training.activityType === "Vilodag") {
      return "Vila";
    }

    const details = [checkIn.training.activityType];

    if (checkIn.training.durationMinutes) {
      details.push(`${checkIn.training.durationMinutes}min`);
    }

    if (checkIn.training.averageHeartRate) {
      details.push(`${checkIn.training.averageHeartRate}bpm`);
    }

    return details.join(", ");
  }

  function mealFilled(checkIn: DailyCheckIn | undefined, mealNumber: number): boolean {
    const meal = checkIn?.nutrition.meals.find((item) => item.mealNumber === mealNumber);
    return Boolean(meal?.recipeName || meal?.customMeal);
  }

  function getWaterIcon(actualLitres: number | undefined): ReactNode | null {
    if (typeof actualLitres !== "number" || actualLitres <= 0) {
      return null;
    }

    if (actualLitres === 2) {
      return <span aria-hidden="true">🆗</span>;
    }

    if (actualLitres > 2) {
      return <span aria-hidden="true">🌊</span>;
    }

    return <span aria-hidden="true">⚠️</span>;
  }

  function getSleepIcon(sleepHours: number | undefined): ReactNode | null {
    if (typeof sleepHours !== "number" || sleepHours <= 0) {
      return null;
    }

    if (sleepHours >= 8) {
      return <span aria-hidden="true">🌙</span>;
    }

    if (sleepHours >= 6) {
      return <span aria-hidden="true">🆗</span>;
    }

    return <span aria-hidden="true">⚠️</span>;
  }

  function getEnergyIcon(energy: number | undefined): ReactNode | null {
    if (typeof energy !== "number" || energy <= 0) {
      return null;
    }

    if (energy >= 7) {
      return <span aria-hidden="true">⚡️</span>;
    }

    if (energy >= 4) {
      return <span aria-hidden="true">🆗</span>;
    }

    return <span aria-hidden="true">⚠️</span>;
  }

  function getStressIcon(stress: number | undefined): ReactNode | null {
    if (typeof stress !== "number" || stress <= 0) {
      return null;
    }

    if (stress >= 7) {
      return <span aria-hidden="true">⚠️</span>;
    }

    if (stress >= 4) {
      return <span aria-hidden="true">🆗</span>;
    }

    return <span aria-hidden="true">🧘</span>;
  }

  function getMotivationIcon(motivation: number | undefined): ReactNode | null {
    if (typeof motivation !== "number" || motivation <= 0) {
      return null;
    }

    if (motivation >= 7) {
      return <span aria-hidden="true">🚀</span>;
    }

    if (motivation >= 4) {
      return <span aria-hidden="true">🆗</span>;
    }

    return <span aria-hidden="true">⚠️</span>;
  }

  function getStarMarkIcon(starMarkNote: string | undefined): ReactNode | null {
    if (!starMarkNote || !starMarkNote.trim()) {
      return null;
    }

    return <span aria-hidden="true">⭐</span>;
  }

  function getReflectionMarkIcon(reflectionMarkNote: string | undefined): ReactNode | null {
    if (!reflectionMarkNote || !reflectionMarkNote.trim()) {
      return null;
    }

    return <span aria-hidden="true">📝</span>;
  }

  function getDayAreaData(checkIn: DailyCheckIn | undefined): {
    genomforandePrimary: RecentAreaItem[];
    genomforandeSecondary: RecentAreaItem[];
    status: RecentAreaItem[];
    reflektion: RecentAreaItem[];
  } {
    const meal1 = checkIn?.nutrition.meals.find((item) => item.mealNumber === 1);
    const meal2 = checkIn?.nutrition.meals.find((item) => item.mealNumber === 2);
    const meal3 = checkIn?.nutrition.meals.find((item) => item.mealNumber === 3);

    const genomforandePrimary: RecentAreaItem[] = [
      {
        icon: <IconBarbell size={14} />,
        label: "Träning",
        detail: getTrainingDetail(checkIn),
        comment: checkIn?.comments?.training ?? checkIn?.training.notes,
        filled: Boolean(checkIn?.training.activityType),
      },
      {
        icon: <IconChefHat size={14} />,
        label: "Måltid 1",
        detail: getRecipeDetail(meal1?.recipeName ?? meal1?.customMeal, "Ej ifylld"),
        comment: checkIn?.comments?.meal1 ?? meal1?.comment,
        filled: mealFilled(checkIn, 1),
      },
      {
        icon: <IconChefHat size={14} />,
        label: "Måltid 2",
        detail: getRecipeDetail(meal2?.recipeName ?? meal2?.customMeal, "Ej ifylld"),
        comment: checkIn?.comments?.meal2 ?? meal2?.comment,
        filled: mealFilled(checkIn, 2),
      },
      {
        icon: <IconChefHat size={14} />,
        label: "Måltid 3",
        detail: getRecipeDetail(meal3?.recipeName ?? meal3?.customMeal, "Ej ifylld"),
        comment: checkIn?.comments?.meal3 ?? meal3?.comment,
        filled: mealFilled(checkIn, 3),
      },
    ];

    const genomforandeSecondary: RecentAreaItem[] = [
      {
        icon: <span aria-hidden="true">💧</span>,
        label: "Vatten",
        detail: `${checkIn?.water.actualLitres ?? 0} l`,
        comment: checkIn?.comments?.water,
        filled: (checkIn?.water.actualLitres ?? 0) > 0,
      },
      {
        icon: <IconMoon size={14} />,
        label: "Sömn",
        detail: `${checkIn?.recovery.sleepHours ?? 0} h`,
        comment: checkIn?.comments?.sleep,
        filled: (checkIn?.recovery.sleepHours ?? 0) > 0,
      },
      {
        icon: <IconChecklist size={14} />,
        label: "Följt upplägg",
        detail: (
          (checkIn?.nutrition.followedMealPlan === true || checkIn?.nutrition.ateOutsidePlan === false)
          && checkIn?.training.screenshotSentToThomas === true
        ) ? "Ja" : "Nej",
        comment: undefined,
        filled: (
          (checkIn?.nutrition.followedMealPlan === true || checkIn?.nutrition.ateOutsidePlan === false)
          && checkIn?.training.screenshotSentToThomas === true
        ),
      },
    ];

    const status: RecentAreaItem[] = [
      {
        icon: <IconBolt size={14} />,
        label: "Energi",
        detail: (checkIn?.wellbeing.energy ?? 0) > 0 ? `${checkIn?.wellbeing.energy}/10` : "Ej ifylld",
        comment: checkIn?.comments?.energy,
        filled: (checkIn?.wellbeing.energy ?? 0) > 0,
      },
      {
        icon: <IconBrain size={14} />,
        label: "Stress",
        detail: (checkIn?.wellbeing.stress ?? 0) > 0 ? `${checkIn?.wellbeing.stress}/10` : "Ej ifylld",
        comment: checkIn?.comments?.stress,
        filled: (checkIn?.wellbeing.stress ?? 0) > 0,
      },
      {
        icon: <IconTargetArrow size={14} />,
        label: "Motivation",
        detail: (checkIn?.wellbeing.motivation ?? 0) > 0 ? `${checkIn?.wellbeing.motivation}/10` : "Ej ifylld",
        comment: checkIn?.comments?.motivation,
        filled: (checkIn?.wellbeing.motivation ?? 0) > 0,
      },
    ];

    const reflektion: RecentAreaItem[] = [
      {
        icon: <IconTrophy size={14} />,
        label: "Framgång",
        detail: checkIn?.reflection.wentWell?.trim() || "Ej ifylld",
        comment: checkIn?.comments?.wentWell,
        filled: Boolean(checkIn?.reflection.wentWell?.trim()),
      },
      {
        icon: <IconBrain size={14} />,
        label: "Hinder",
        detail: checkIn?.reflection.biggestObstacle?.trim() || "Ej ifylld",
        comment: checkIn?.comments?.biggestObstacle,
        filled: Boolean(checkIn?.reflection.biggestObstacle?.trim()),
      },
      {
        icon: <IconNotebook size={14} />,
        label: "Plan",
        detail: checkIn?.reflection.tomorrowPlan?.trim() || "Ej ifylld",
        comment: checkIn?.comments?.tomorrowPlan,
        filled: Boolean(checkIn?.reflection.tomorrowPlan?.trim()),
      },
    ];

    return {
      genomforandePrimary,
      genomforandeSecondary,
      status,
      reflektion,
    };
  }

  function renderRecentItem(item: RecentAreaItem): ReactNode {
    return (
      <p key={item.label} className={item.filled ? "recent-item recent-item-filled" : "recent-item"}>
        <span className="recent-item-icon" aria-hidden="true">{item.icon}</span>
        <strong className="recent-item-label">{item.label}:</strong>
        <span className="recent-item-detail">{item.detail}</span>
        {item.comment ? (
          <span className="recent-item-comment-row">
            <span className="recent-item-comment-icon" aria-hidden="true"><IconMessageCircle size={12} /></span>
            <span className="recent-item-comment-text">{item.comment}</span>
          </span>
        ) : null}
      </p>
    );
  }

  return (
    <section className="page-section dashboard-page">
      <header className="page-header-card dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Översikt</p>
          <h2>
            {getGreeting()}, Ebba
          </h2>
          <p>{formatLongDate(new Date())}</p>
          <p>{getChallengeDisplayText()}</p>
        </div>

        <div className="dashboard-hero-stats">
          <div className="dashboard-hero-stat">
            <span>Utmaningsdag</span>
            <strong>{challengeProgress.day || 0}</strong>
          </div>
          <div className="dashboard-hero-stat">
            <span>Fyllda dagar</span>
            <strong>{filledDays}/{challengeConfig.totalDays}</strong>
          </div>
          <div className="dashboard-hero-stat">
            <span>Fyllnadsgrad</span>
            <strong>{filledPercentage}%</strong>
          </div>
        </div>
      </header>

      <section className="dashboard-stat-grid" aria-label="Översikt">
        <article className="dashboard-stat-card">
          <p>Gröna dagar</p>
          <strong>{greenDays}</strong>
        </article>
        <article className="dashboard-stat-card">
          <p>Gula dagar</p>
          <strong>{yellowDays}</strong>
        </article>
        <article className="dashboard-stat-card">
          <p>Röda dagar</p>
          <strong>{redDays}</strong>
        </article>
        <article className="dashboard-stat-card">
          <p>Nuvarande svit</p>
          <strong>{dashboardStatistics.currentStreak}</strong>
        </article>
        <article className="dashboard-stat-card">
          <p>Längsta svit</p>
          <strong>{dashboardStatistics.longestStreak}</strong>
        </article>
        <article className="dashboard-stat-card">
          <p>Ifyllda dagar</p>
          <strong>{dashboardStatistics.totalCompletedDays}</strong>
        </article>
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <p className="eyebrow">90-dagars översikt</p>
            <h3>Dag-för-dag kalender</h3>
          </div>
          <div className="dashboard-legend" aria-label="Färglegend">
            <span><i className="legend-swatch legend-green" />Grön = ifylld + alla mål nedan nådda</span>
            <span><i className="legend-swatch legend-yellow" />Gul = delvis ifylld</span>
            <span><i className="legend-swatch legend-red" />Röd = ifylld men mål missat</span>
            <span><i className="legend-swatch legend-gray" />Grå = 0% ifylld</span>
          </div>
        </div>

        <div className="dashboard-filter-layout" aria-label="Kalenderfilter">
          <section className="dashboard-filter-group" aria-label="Genomförande-filter">
            <p className="dashboard-filter-group-title">Genomförande</p>
            <div className="dashboard-filter-row">
              <button
                type="button"
                className={calendarFilter === "starmark" ? "dashboard-filter-button dashboard-filter-button-active" : "dashboard-filter-button"}
                onClick={() => setCalendarFilter((current) => (current === "starmark" ? "none" : "starmark"))}
              >
                Starmarkera
              </button>
              <button
                type="button"
                className={calendarFilter === "workout" ? "dashboard-filter-button dashboard-filter-button-active" : "dashboard-filter-button"}
                onClick={() => setCalendarFilter((current) => (current === "workout" ? "none" : "workout"))}
              >
                Träning
              </button>
              <button
                type="button"
                className={calendarFilter === "water" ? "dashboard-filter-button dashboard-filter-button-active" : "dashboard-filter-button"}
                onClick={() => setCalendarFilter((current) => (current === "water" ? "none" : "water"))}
              >
                Vatten
              </button>
              <button
                type="button"
                className={calendarFilter === "sleep" ? "dashboard-filter-button dashboard-filter-button-active" : "dashboard-filter-button"}
                onClick={() => setCalendarFilter((current) => (current === "sleep" ? "none" : "sleep"))}
              >
                Sömn
              </button>
            </div>
          </section>

          <section className="dashboard-filter-group" aria-label="Status-filter">
            <p className="dashboard-filter-group-title">Status</p>
            <div className="dashboard-filter-row">
              <button
                type="button"
                className={calendarFilter === "energy" ? "dashboard-filter-button dashboard-filter-button-active" : "dashboard-filter-button"}
                onClick={() => setCalendarFilter((current) => (current === "energy" ? "none" : "energy"))}
              >
                Energi
              </button>
              <button
                type="button"
                className={calendarFilter === "stress" ? "dashboard-filter-button dashboard-filter-button-active" : "dashboard-filter-button"}
                onClick={() => setCalendarFilter((current) => (current === "stress" ? "none" : "stress"))}
              >
                Stress
              </button>
              <button
                type="button"
                className={calendarFilter === "motivation" ? "dashboard-filter-button dashboard-filter-button-active" : "dashboard-filter-button"}
                onClick={() => setCalendarFilter((current) => (current === "motivation" ? "none" : "motivation"))}
              >
                Motivation
              </button>
            </div>
          </section>

          <section className="dashboard-filter-group" aria-label="Reflektions-filter">
            <p className="dashboard-filter-group-title">Reflektion</p>
            <div className="dashboard-filter-row">
              <button
                type="button"
                className={calendarFilter === "reflection" ? "dashboard-filter-button dashboard-filter-button-active" : "dashboard-filter-button"}
                onClick={() => setCalendarFilter((current) => (current === "reflection" ? "none" : "reflection"))}
              >
                Reflektion
              </button>
            </div>
          </section>
        </div>

        {calendarFilter === "water" ? (
          <div className="dashboard-filter-water-legend" aria-label="Vattenfilter förklaring">
            <span><strong>⚠️</strong> = Mindre än 2L</span>
            <span><strong>🆗</strong> = Exakt 2L</span>
            <span><strong>🌊</strong> = Mer än 2L</span>
          </div>
        ) : null}

        {calendarFilter === "sleep" ? (
          <div className="dashboard-filter-water-legend" aria-label="Sömnfilter förklaring">
            <span><strong>⚠️</strong> = Mindre än 6h</span>
            <span><strong>🆗</strong> = Mellan 6-8h</span>
            <span><strong>🌙</strong> = 8h eller Mer</span>
          </div>
        ) : null}

        {calendarFilter === "energy" ? (
          <div className="dashboard-filter-water-legend" aria-label="Energifilter förklaring">
            <span><strong>⚠️</strong> = Mellan 1-3</span>
            <span><strong>🆗</strong> = Mellan 4-6</span>
            <span><strong>⚡️</strong> = Mellan 7-10</span>
          </div>
        ) : null}

        {calendarFilter === "stress" ? (
          <div className="dashboard-filter-water-legend" aria-label="Stressfilter förklaring">
            <span><strong>🧘</strong> = Mellan 1-3</span>
            <span><strong>🆗</strong> = Mellan 4-6</span>
            <span><strong>⚠️</strong> = Mellan 7-10</span>
          </div>
        ) : null}

        {calendarFilter === "motivation" ? (
          <div className="dashboard-filter-water-legend" aria-label="Motivationsfilter förklaring">
            <span><strong>⚠️</strong> = Mellan 1-3</span>
            <span><strong>🆗</strong> = Mellan 4-6</span>
            <span><strong>🚀</strong> = Mellan 7-10</span>
          </div>
        ) : null}

        <section className="dashboard-goals" aria-label="Mål för grön dag">
          <p className="dashboard-goals-title">Mål för grön dag</p>
          <div className="dashboard-goals-list">
            {greenGoalItems.map((item) => (
              <p key={item.text} className="dashboard-goal-item">
                <span className="dashboard-goal-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.text}</span>
              </p>
            ))}
          </div>
        </section>

        <div className="dashboard-month-groups">
          {monthGroups.map((group) => (
            <section key={group.monthKey} className="dashboard-month-group" aria-label={group.monthLabel}>
              <h4 className="dashboard-month-heading">{group.monthLabel}</h4>
              <div className="dashboard-calendar" role="grid" aria-label={`${group.monthLabel} kalender`}> 
                {group.cells.map((cell) => (
                  cell.isInChallenge && cell.date ? (
                    (() => {
                      const checkIn = checkInByDate.get(cell.date);
                      const workoutActive = calendarFilter === "workout";
                      const waterActive = calendarFilter === "water";
                      const sleepActive = calendarFilter === "sleep";
                      const energyActive = calendarFilter === "energy";
                      const stressActive = calendarFilter === "stress";
                      const motivationActive = calendarFilter === "motivation";
                      const starmarkActive = calendarFilter === "starmark";
                      const reflectionActive = calendarFilter === "reflection";
                      const workoutIcon = getTrainingIcon(checkIn?.training.activityType);
                      const waterIcon = getWaterIcon(checkIn?.water.actualLitres);
                      const sleepIcon = getSleepIcon(checkIn?.recovery.sleepHours);
                      const energyIcon = getEnergyIcon(checkIn?.wellbeing.energy);
                      const stressIcon = getStressIcon(checkIn?.wellbeing.stress);
                      const motivationIcon = getMotivationIcon(checkIn?.wellbeing.motivation);
                      const starMarkIcon = getStarMarkIcon(checkIn?.comments?.starMark);
                      const reflectionMarkIcon = getReflectionMarkIcon(checkIn?.comments?.reflectionMark);
                      const workoutMinutes = checkIn?.training.durationMinutes;
                      const workoutBpm = checkIn?.training.averageHeartRate;

                      return (
                        <Link
                          key={cell.date}
                          to={`/check-in?date=${cell.date}`}
                          className={workoutActive ? `calendar-cell calendar-${cell.status} calendar-cell-filter-workout` : `calendar-cell calendar-${cell.status}`}
                          style={{
                            "--month-bg": monthTintColors[cell.monthIndex] ?? "#f3eee8",
                            "--status-bg": statusColors[cell.status],
                          } as CalendarCellStyle}
                          aria-label={`Dag ${cell.challengeDay}, ${cell.date}, ${statusLabels[cell.status]}`}
                          role="gridcell"
                          aria-selected={cell.hasCheckIn}
                        >
                          <strong className="calendar-day-number">{cell.dayOfMonth}</strong>
                          {workoutActive ? (
                            <>
                              {checkIn?.training.activityType ? <span className="calendar-workout-icon" aria-hidden="true">{workoutIcon}</span> : null}
                              {typeof workoutMinutes === "number" && workoutMinutes > 0 ? <span className="calendar-workout-minutes">{workoutMinutes}m</span> : null}
                              {typeof workoutBpm === "number" && workoutBpm > 0 ? <span className="calendar-workout-bpm">{workoutBpm}</span> : null}
                            </>
                          ) : waterActive ? (
                            <>
                              {waterIcon ? <span className="calendar-water-icon" aria-hidden="true">{waterIcon}</span> : null}
                              {typeof checkIn?.water.actualLitres === "number" && checkIn.water.actualLitres > 0 ? <span className="calendar-water-volume">{checkIn.water.actualLitres} l</span> : null}
                            </>
                          ) : sleepActive ? (
                            <>
                              {sleepIcon ? <span className="calendar-water-icon" aria-hidden="true">{sleepIcon}</span> : null}
                              {typeof checkIn?.recovery.sleepHours === "number" && checkIn.recovery.sleepHours > 0 ? <span className="calendar-water-volume">{checkIn.recovery.sleepHours} h</span> : null}
                            </>
                          ) : energyActive ? (
                            <>
                              {energyIcon ? <span className="calendar-water-icon" aria-hidden="true">{energyIcon}</span> : null}
                              {typeof checkIn?.wellbeing.energy === "number" && checkIn.wellbeing.energy > 0 ? <span className="calendar-water-volume">{checkIn.wellbeing.energy}/10</span> : null}
                            </>
                          ) : stressActive ? (
                            <>
                              {stressIcon ? <span className="calendar-water-icon" aria-hidden="true">{stressIcon}</span> : null}
                              {typeof checkIn?.wellbeing.stress === "number" && checkIn.wellbeing.stress > 0 ? <span className="calendar-water-volume">{checkIn.wellbeing.stress}/10</span> : null}
                            </>
                          ) : motivationActive ? (
                            <>
                              {motivationIcon ? <span className="calendar-water-icon" aria-hidden="true">{motivationIcon}</span> : null}
                              {typeof checkIn?.wellbeing.motivation === "number" && checkIn.wellbeing.motivation > 0 ? <span className="calendar-water-volume">{checkIn.wellbeing.motivation}/10</span> : null}
                            </>
                          ) : starmarkActive ? (
                            <>
                              {starMarkIcon ? <span className="calendar-water-icon" aria-hidden="true">{starMarkIcon}</span> : null}
                              <span className="calendar-challenge-day">Dag {cell.challengeDay}</span>
                            </>
                          ) : reflectionActive ? (
                            <>
                              {reflectionMarkIcon ? <span className="calendar-water-icon" aria-hidden="true">{reflectionMarkIcon}</span> : null}
                              <span className="calendar-challenge-day">Dag {cell.challengeDay}</span>
                            </>
                          ) : (
                            <span className="calendar-challenge-day">Dag {cell.challengeDay}</span>
                          )}
                        </Link>
                      );
                    })()
                  ) : (
                    <article
                      key={`${group.monthKey}-${cell.dayOfMonth}`}
                      className="calendar-cell calendar-outside"
                      style={{
                        "--month-bg": "#ffffff",
                        "--status-bg": statusColors.outside,
                      } as CalendarCellStyle}
                      aria-label={`${group.monthLabel} ${cell.dayOfMonth}, ${statusLabels.outside}`}
                      role="gridcell"
                      aria-selected={false}
                    >
                      <strong className="calendar-day-number">{cell.dayOfMonth}</strong>
                    </article>
                  )
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="dashboard-panel overview-panel">
        <div className="dashboard-panel-header">
          <div>
            <p className="eyebrow">Overview</p>
            <h3>Status över tid</h3>
          </div>
        </div>

        <article className="overview-combined-card">
          <div className="overview-combined-legend" aria-label="Metriclegend">
            {overviewSeries.map((series) => (
              <p key={series.metric.key} className="overview-legend-item">
                <span className="overview-legend-title" style={{ "--metric-color": series.metric.color } as CalendarCellStyle}>
                  <span className="overview-legend-dot" aria-hidden="true" />
                  <span className="overview-card-icon" aria-hidden="true">{series.metric.icon}</span>
                  <span>{series.metric.label}</span>
                </span>
                <span className="overview-legend-meta">
                  {series.filledCount > 0 && series.averageValue != null
                    ? `Snitt ${series.averageValue}/10 · Senast ${series.latestValue}/10`
                    : "Inga värden ännu"}
                </span>
              </p>
            ))}
          </div>

          <div className="overview-chart-wrap overview-chart-wrap-combined">
            <svg
              className="overview-chart"
              viewBox={`0 0 ${overviewChartLayout.width} ${overviewChartLayout.height}`}
              preserveAspectRatio="none"
              role="img"
              aria-label="Energi, stress och motivation över tid"
            >
              <rect
                x={overviewChartLayout.xStart}
                y={overviewChartLayout.yTop}
                width={overviewChartLayout.xEnd - overviewChartLayout.xStart}
                height={overviewChartLayout.yBottom - overviewChartLayout.yTop}
                className="overview-plot-border"
              />
              {Array.from({ length: 10 }, (_, index) => {
                const value = 10 - index;
                const y = overviewChartLayout.yBottom - ((value - 1) / 9) * (overviewChartLayout.yBottom - overviewChartLayout.yTop);

                return (
                  <g key={`overview-grid-${value}`}>
                    <line
                      x1={overviewChartLayout.xStart}
                      x2={overviewChartLayout.xEnd}
                      y1={y}
                      y2={y}
                      className="overview-grid-line"
                    />
                    <text
                      x={overviewChartLayout.xStart - 1.2}
                      y={y + 0.35}
                      className="overview-y-label"
                      textAnchor="end"
                    >
                      {value}
                    </text>
                  </g>
                );
              })}
              {overviewWeekSeparators.map((x, index) => (
                <line
                  key={`overview-week-${index}`}
                  x1={x}
                  x2={x}
                  y1={overviewChartLayout.yTop}
                  y2={overviewChartLayout.yBottom}
                  className="overview-week-line"
                />
              ))}
              {overviewSeries.map((series) => (
                series.segments.map((segment, segmentIndex) => (
                  <polyline
                    key={`${series.metric.key}-segment-${segmentIndex}`}
                    fill="none"
                    stroke={series.metric.color}
                    strokeWidth="0.22"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={segment.map((point) => `${point.x},${point.y}`).join(" ")}
                  />
                ))
              ))}
              {overviewSeries.map((series) => (
                series.segments
                  .filter((segment) => segment.length === 1)
                  .map((segment, segmentIndex) => {
                    const point = segment[0];
                    return (
                      <circle
                        key={`${series.metric.key}-single-point-${segmentIndex}`}
                        cx={point.x}
                        cy={point.y}
                        r="0.55"
                        fill={series.metric.color}
                      />
                    );
                  })
              ))}
            </svg>
          </div>

          <div className="overview-scale overview-day-scale" aria-hidden="true">
            {overviewDayLabels.map((day) => {
              const leftPercent = challengeConfig.totalDays <= 1
                ? 0
                : ((day - 1) / (challengeConfig.totalDays - 1)) * 100;

              return (
                <span
                  key={`overview-day-label-${day}`}
                  className="overview-day-label"
                  style={{ "--day-left": `${leftPercent}%` } as CalendarCellStyle}
                >
                  Dag {day}
                </span>
              );
            })}
          </div>
        </article>
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <p className="eyebrow">Senaste check-ins</p>
            <h3>Fem senaste dagar</h3>
          </div>
        </div>

        <div className="recent-checkin-list">
          {recentDays.length > 0 ? (
            recentDays.map((dayCell) => {
              const checkIn = dayCell.date ? checkInByDate.get(dayCell.date) : undefined;
              const areaData = getDayAreaData(checkIn);
              const checkInLink = dayCell.date ? `/check-in?date=${dayCell.date}` : "/check-in";

              return (
                <Link
                  key={dayCell.date ?? `${dayCell.monthKey}-${dayCell.dayOfMonth}`}
                  to={checkInLink}
                  className={`recent-checkin-card recent-calendar-${dayCell.status}`}
                  style={{
                    "--month-bg": monthTintColors[dayCell.monthIndex] ?? "#e8efe7",
                    "--status-bg": statusColors[dayCell.status],
                  } as CalendarCellStyle}
                >
                  <div className="recent-checkin-head">
                    <p className="recent-checkin-date">
                      {dayCell.challengeDay ? `Dag ${dayCell.challengeDay}` : "Utanför"}
                      {dayCell.date ? ` · ${formatLongDate(new Date(`${dayCell.date}T12:00:00`))}` : ""}
                    </p>
                    <h4>{checkIn ? (checkIn.overallStatus === "completed" ? "Ifylld" : checkIn.overallStatus === "partial" ? "Påbörjad" : "Missad") : "Ej ifylld"}</h4>
                  </div>

                  <div className="recent-checkin-columns">
                    <section className="recent-checkin-area recent-checkin-area-genomforande">
                      <h5>Genomförande</h5>
                      <div className="recent-genomforande-grid">
                        <div>
                          {areaData.genomforandePrimary.map(renderRecentItem)}
                        </div>
                        <div>
                          {areaData.genomforandeSecondary.map(renderRecentItem)}
                        </div>
                      </div>
                    </section>

                    <div className="recent-checkin-bottom-row">
                      <section className="recent-checkin-area">
                        <h5>Status</h5>
                        {areaData.status.map(renderRecentItem)}
                      </section>

                      <section className="recent-checkin-area">
                        <h5>Reflektion</h5>
                        {areaData.reflektion.map(renderRecentItem)}
                      </section>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <article className="placeholder-card">
              <h4>Inga check-ins ännu</h4>
              <p>När Ebba börjar fylla i dagarna kommer de att visas här och i kalendern ovan.</p>
            </article>
          )}
        </div>
      </section>
    </section>
  );
}
