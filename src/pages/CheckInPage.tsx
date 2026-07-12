import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  IconBarbell,
  IconBolt,
  IconBrain,
  IconChefHat,
  IconDroplet,
  IconMoon,
  IconNotebook,
  IconSalad,
  IconSoup,
  IconTargetArrow,
  IconTrophy,
} from "@tabler/icons-react";
import { FieldRow } from "../components/check-in/FieldRow";
import { completionThresholds } from "../config/challengeConfig";
import { getCheckInByDate, getCheckIns, saveCheckIn, updateCheckIn } from "../services/checkInService";
import type { DailyCheckIn } from "../types/checkIn";
import { buildDashboardDayCells } from "../utils/statistics";
import {
  breakfastOptions,
  buildDefaultCheckIn,
  calculateCheckInScore,
  classifyCheckIn,
  dinnerOptions,
  formValuesFromCheckIn,
  lunchOptions,
  toDailyCheckIn,
  trainingOptionDisplay,
  trainingOptions,
  type CheckInFormValues,
  type CheckInValidationErrors,
  validateCheckIn,
} from "../utils/checkIn";
import { getChallengeDisplayText, getChallengeProgress } from "../utils/challenge";
import { formatLongDate, toISODate } from "../utils/date";

function getStatusLabel(score: number): string {
  if (score >= completionThresholds.checkInFullyCompletedMin) {
    return "Fully completed";
  }

  if (score >= completionThresholds.checkInPartiallyCompletedMin) {
    return "Partially completed";
  }

  return "Missed";
}

function TitleWithIcon({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <span className="checkin-title checkin-title-with-icon">
      <span className="checkin-title-icon" aria-hidden="true">{icon}</span>
      <span>{text}</span>
    </span>
  );
}

export function CheckInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const today = toISODate(new Date());
  const initialDate = useMemo(() => {
    const dateParam = searchParams.get("date");
    if (!dateParam) {
      return today;
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;
  }, [searchParams, today]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [formValues, setFormValues] = useState<CheckInFormValues>(() => buildDefaultCheckIn(today));
  const [existingCheckIn, setExistingCheckIn] = useState<DailyCheckIn | null>(null);
  const [errors, setErrors] = useState<CheckInValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTimeout = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => {
    const existing = getCheckInByDate(selectedDate);
    setExistingCheckIn(existing);
    setFormValues(existing ? formValuesFromCheckIn(existing) : buildDefaultCheckIn(selectedDate));
    setErrors({});
    setSubmitError(null);
    setSuccessMessage(null);
  }, [selectedDate]);

  useEffect(() => {
    setSelectedDate(initialDate);
  }, [initialDate]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      if (redirectTimeout.current) {
        window.clearTimeout(redirectTimeout.current);
      }
    };
  }, []);

  const challengeProgress = useMemo(
    () => getChallengeProgress(new Date(`${selectedDate}T12:00:00`)),
    [selectedDate],
  );
  const score = useMemo(() => calculateCheckInScore(formValues), [formValues]);
  const overallStatus = useMemo(() => classifyCheckIn(score), [score]);
  const statusLabel = getStatusLabel(score);
  const buttonLabel = existingCheckIn ? "Uppdatera check-in" : "Slutför kvällscheck-in";
  const checkInHeroStatusClass = useMemo(() => {
    const previewPayload = toDailyCheckIn(formValues);
    const previewCheckIn: DailyCheckIn = {
      ...previewPayload,
      id: existingCheckIn?.id ?? previewPayload.id,
      createdAt: existingCheckIn?.createdAt ?? previewPayload.createdAt,
      updatedAt: new Date().toISOString(),
      completionScore: score,
      overallStatus,
    };

    const mergedCheckIns = [
      ...getCheckIns().filter((item) => item.date !== selectedDate),
      previewCheckIn,
    ];
    const dayStatus = buildDashboardDayCells(mergedCheckIns)
      .find((cell) => cell.date === selectedDate)?.status;

    if (!dayStatus || dayStatus === "outside") {
      return "";
    }

    return `checkin-hero-${dayStatus}`;
  }, [existingCheckIn, formValues, overallStatus, score, selectedDate]);

  function updateField<K extends keyof CheckInFormValues>(field: K, value: CheckInFormValues[K]) {
    setFormValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validateCheckIn(formValues);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload = toDailyCheckIn(formValues);
    const nowIso = new Date().toISOString();
    const nextCheckIn: DailyCheckIn = {
      ...payload,
      id: existingCheckIn?.id ?? payload.id,
      createdAt: existingCheckIn?.createdAt ?? payload.createdAt,
      updatedAt: nowIso,
      completionScore: score,
      overallStatus,
    };

    setIsSubmitting(true);
    const result = existingCheckIn ? updateCheckIn(nextCheckIn) : saveCheckIn(nextCheckIn);
    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.message ?? "Något gick fel när check-in sparades.");
      return;
    }

    setSuccessMessage("Check-in completed. Your day has been recorded.");

    if (redirectTimeout.current) {
      window.clearTimeout(redirectTimeout.current);
    }

    redirectTimeout.current = window.setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 1300);
  }

  return (
    <section className="page-section checkin-page">
      <header className={`page-header-card checkin-hero ${checkInHeroStatusClass}`.trim()}>
        <div>
          <p className="eyebrow">Kvällsuppföljning</p>
          <h2>Evening Check-In</h2>
          <p>{formatLongDate(new Date(`${selectedDate}T12:00:00`))}</p>
          <p>{getChallengeDisplayText(new Date(`${selectedDate}T12:00:00`))}</p>
        </div>

        <div className="checkin-hero-meta">
          <label htmlFor="checkin-date" className="checkin-date-label">
            Välj datum för test
          </label>
          <input
            id="checkin-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
          <p className="checkin-meta-line">Nuvarande utmaningsdag: Dag {challengeProgress.day || 0}</p>
        </div>
      </header>

      <form className="checkin-form" onSubmit={handleSubmit} noValidate>
        <article className="card checkin-score-card">
          <div>
            <p className="eyebrow">Livepoäng</p>
            <h3>Dagens fullföljandepoäng: {score}%</h3>
            <p className="checkin-status-line">{statusLabel}</p>
          </div>
          <div className="checkin-score-badge" aria-label={`Completion score ${score} percent`}>
            {score}%
          </div>
        </article>

        {submitError ? (
          <p className="form-error" role="alert">
            {submitError}
          </p>
        ) : null}

        {successMessage ? (
          <p className="form-success" role="status" aria-live="polite">
            {successMessage}
          </p>
        ) : null}

        <div className="checkin-actions">
          <div className="checkin-starmark">
            <label htmlFor="starMarked" className="checkin-starmark-toggle">
              <input
                id="starMarked"
                type="checkbox"
                checked={formValues.starMarked}
                onChange={(event) => updateField("starMarked", event.target.checked)}
              />
              <span>⭐ Starmarkera dagen att minnas</span>
            </label>
            {formValues.starMarked ? (
              <input
                id="starMarkNote"
                className="checkin-starmark-note"
                type="text"
                value={formValues.starMarkNote}
                onChange={(event) => updateField("starMarkNote", event.target.value)}
                placeholder="Ex: Särskild notering, fråga eller specifikt pass"
              />
            ) : null}
          </div>
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Sparar..." : buttonLabel}
          </button>
        </div>

        <article className="card checkin-area-card" aria-label="Genomförande">
          <p className="checkin-area-line">OMRÅDE 1: Genomförande</p>
        </article>

        <section className="card checkin-section">
          <FieldRow
            title={<TitleWithIcon icon={<IconBarbell size={16} />} text="1. Dagens Träning:" />}
            label="Vilket träningspass genomförde du idag?"
            mainId="trainingType"
            commentId="trainingComment"
            commentValue={formValues.trainingComment}
            onCommentChange={(value) => updateField("trainingComment", value)}
            error={errors.trainingType}
            commentPlaceholder="Skriv en kommentar om träningen"
          >
            <select
              id="trainingType"
              value={formValues.trainingType}
              onChange={(event) => updateField("trainingType", event.target.value)}
            >
              <option value="">Välj träning</option>
              {trainingOptions.map((option) => (
                <option key={option} value={option}>
                  {trainingOptionDisplay[option]}
                </option>
              ))}
            </select>
          </FieldRow>

          {formValues.trainingType === "Annat" ? (
            <FieldRow
              title={<TitleWithIcon icon={<IconBarbell size={16} />} text="1. Dagens Träning:" />}
              label="Vilken aktivitet var det?"
              mainId="trainingOther"
              commentId="trainingOtherComment"
              commentValue=""
              onCommentChange={() => undefined}
              commentPlaceholder="Skriv en kommentar"
              error={errors.trainingOther}
            >
              <input
                id="trainingOther"
                type="text"
                value={formValues.trainingOther}
                onChange={(event) => updateField("trainingOther", event.target.value)}
                placeholder="Beskriv aktiviteten"
              />
            </FieldRow>
          ) : null}

          {formValues.trainingType && formValues.trainingType !== "Vila" && formValues.trainingType !== "Vilodag" ? (
            <div className="training-detail-grid">
              <label className="training-detail-field" htmlFor="trainingDuration">
                <span className="checkin-title">Hur länge?</span>
                <input
                  id="trainingDuration"
                  type="range"
                  min="0"
                  max="120"
                  step="10"
                  value={formValues.trainingDuration === "" ? 0 : Number(formValues.trainingDuration)}
                  onChange={(event) => updateField("trainingDuration", event.target.value)}
                />
                <span className="slider-value">{formValues.trainingDuration || "0"} min</span>
              </label>

              <label className="training-detail-field" htmlFor="trainingHeartRate">
                <span className="checkin-title">Genomsnittspuls</span>
                <input
                  id="trainingHeartRate"
                  type="range"
                  min="100"
                  max="180"
                  step="5"
                  value={formValues.trainingHeartRate === "" ? 100 : Number(formValues.trainingHeartRate)}
                  onChange={(event) => updateField("trainingHeartRate", event.target.value)}
                />
                <span className="slider-value">{formValues.trainingHeartRate || "100"} bpm</span>
              </label>

              <label className="training-detail-field" htmlFor="trainingScreenshotSent">
                <span className="checkin-title">Har skickat screenshot till thomas på träningen</span>
                <select
                  id="trainingScreenshotSent"
                  value={formValues.trainingScreenshotSent}
                  onChange={(event) => updateField("trainingScreenshotSent", event.target.value)}
                >
                  <option value="">Välj svar</option>
                  <option value="Ja">Ja</option>
                  <option value="Nej">Nej</option>
                </select>
              </label>
            </div>
          ) : null}
        </section>

        <section className="card checkin-section">
          <FieldRow
            title={<TitleWithIcon icon={<IconChefHat size={16} />} text="2. Måltid 1:" />}
            label="Vad åt du till frukost?"
            mainId="breakfast"
            commentId="breakfastComment"
            commentValue={formValues.breakfastComment}
            onCommentChange={(value) => updateField("breakfastComment", value)}
            error={errors.breakfast}
            commentPlaceholder="Skriv en kommentar om frukosten"
          >
            <select
              id="breakfast"
              value={formValues.breakfast}
              onChange={(event) => updateField("breakfast", event.target.value)}
            >
              <option value="">Välj frukost</option>
              {breakfastOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FieldRow>

          {formValues.breakfast === "Annat" ? (
            <FieldRow
              title={<TitleWithIcon icon={<IconChefHat size={16} />} text="2. Måltid 1:" />}
              label="Vad åt du?"
              mainId="breakfastOther"
              commentId="breakfastOtherComment"
              commentValue=""
              onCommentChange={() => undefined}
              commentPlaceholder="Skriv en kommentar"
              error={errors.breakfastOther}
            >
              <input
                id="breakfastOther"
                type="text"
                value={formValues.breakfastOther}
                onChange={(event) => updateField("breakfastOther", event.target.value)}
                placeholder="Beskriv frukosten"
              />
            </FieldRow>
          ) : null}
        </section>

        <section className="card checkin-section">
          <FieldRow
            title={<TitleWithIcon icon={<IconSalad size={16} />} text="3. Måltid 2:" />}
            label="Vad åt du till lunch?"
            mainId="lunch"
            commentId="lunchComment"
            commentValue={formValues.lunchComment}
            onCommentChange={(value) => updateField("lunchComment", value)}
            error={errors.lunch}
            commentPlaceholder="Skriv en kommentar om lunchen"
          >
            <select id="lunch" value={formValues.lunch} onChange={(event) => updateField("lunch", event.target.value)}>
              <option value="">Välj lunch</option>
              {lunchOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FieldRow>

          {formValues.lunch === "Annat" ? (
            <FieldRow
              title={<TitleWithIcon icon={<IconSalad size={16} />} text="3. Måltid 2:" />}
              label="Vad åt du?"
              mainId="lunchOther"
              commentId="lunchOtherComment"
              commentValue=""
              onCommentChange={() => undefined}
              commentPlaceholder="Skriv en kommentar"
              error={errors.lunchOther}
            >
              <input
                id="lunchOther"
                type="text"
                value={formValues.lunchOther}
                onChange={(event) => updateField("lunchOther", event.target.value)}
                placeholder="Beskriv lunchen"
              />
            </FieldRow>
          ) : null}
        </section>

        <section className="card checkin-section">
          <FieldRow
            title={<TitleWithIcon icon={<IconSoup size={16} />} text="4. Måltid 3:" />}
            label="Vad åt du till middag?"
            mainId="dinner"
            commentId="dinnerComment"
            commentValue={formValues.dinnerComment}
            onCommentChange={(value) => updateField("dinnerComment", value)}
            error={errors.dinner}
            commentPlaceholder="Skriv en kommentar om middagen"
          >
            <select id="dinner" value={formValues.dinner} onChange={(event) => updateField("dinner", event.target.value)}>
              <option value="">Välj middag</option>
              {dinnerOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FieldRow>

          {formValues.dinner === "Annat" ? (
            <FieldRow
              title={<TitleWithIcon icon={<IconSoup size={16} />} text="4. Måltid 3:" />}
              label="Vad åt du?"
              mainId="dinnerOther"
              commentId="dinnerOtherComment"
              commentValue=""
              onCommentChange={() => undefined}
              commentPlaceholder="Skriv en kommentar"
              error={errors.dinnerOther}
            >
              <input
                id="dinnerOther"
                type="text"
                value={formValues.dinnerOther}
                onChange={(event) => updateField("dinnerOther", event.target.value)}
                placeholder="Beskriv middagen"
              />
            </FieldRow>
          ) : null}
        </section>

        <section className="card checkin-section">
          <div className="checkin-row">
            <label htmlFor="nutritionPlanFollowed" className="checkin-question-line">
              <TitleWithIcon icon={<IconTargetArrow size={16} />} text="Kostplan:" />
              <span className="checkin-question">Har jag följd kostplanen idag och inte ätit nåt som helst annat?</span>
            </label>
            <div className="checkin-main">
              <div className="checkin-control">
                <select
                  id="nutritionPlanFollowed"
                  value={formValues.nutritionPlanFollowed}
                  onChange={(event) => updateField("nutritionPlanFollowed", event.target.value)}
                >
                  <option value="">Välj svar</option>
                  <option value="Ja">Ja</option>
                  <option value="Nej">Nej</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="card checkin-section">
          <FieldRow
            title={<TitleWithIcon icon={<IconDroplet size={16} />} text="5. Vatten:" />}
            label="Hur mycket vatten drack du idag?"
            mainId="waterLitres"
            commentId="waterComment"
            commentValue={formValues.waterComment}
            onCommentChange={(value) => updateField("waterComment", value)}
            error={errors.waterLitres}
            commentPlaceholder="Skriv en kommentar om vattnet"
          >
            <input
              id="waterLitres"
              type="range"
              min="0"
              max="3"
              step="0.25"
              value={formValues.waterLitres === "" ? 0 : Number(formValues.waterLitres)}
              onChange={(event) => updateField("waterLitres", event.target.value)}
            />
            <span className="slider-value">{formValues.waterLitres || "0"} l</span>
          </FieldRow>
        </section>

        <section className="card checkin-section">
          <FieldRow
            title={<TitleWithIcon icon={<IconMoon size={16} />} text="6. Sömn:" />}
            label="Hur många timmar sov du i natt?"
            mainId="sleepHours"
            commentId="sleepComment"
            commentValue={formValues.sleepComment}
            onCommentChange={(value) => updateField("sleepComment", value)}
            error={errors.sleepHours}
            commentPlaceholder="Skriv en kommentar om sömnen"
          >
            <input
              id="sleepHours"
              type="range"
              min="0"
              max="10"
              step="1"
              value={formValues.sleepHours === "" ? 0 : Number(formValues.sleepHours)}
              onChange={(event) => updateField("sleepHours", event.target.value)}
            />
            <span className="slider-value">{formValues.sleepHours || "0"} h</span>
          </FieldRow>
        </section>

        <article className="card checkin-area-card" aria-label="Status">
          <p className="checkin-area-line">OMRÅDE 2: Status</p>
        </article>

        <section className="card checkin-section">
          <FieldRow
            title={<TitleWithIcon icon={<IconBolt size={16} />} text="7. Energi:" />}
            label="Hur var din energi idag? (1 = lågt, 10 = mycket)"
            mainId="energy"
            commentId="energyComment"
            commentValue={formValues.energyComment}
            onCommentChange={(value) => updateField("energyComment", value)}
            error={errors.energy}
            commentPlaceholder="Skriv en kommentar om energin"
          >
            <div className="slider-wrap">
              <input
                id="energy"
                type="range"
                min="1"
                max="10"
                value={formValues.energy}
                onChange={(event) => updateField("energy", Number(event.target.value))}
              />
              <span className="slider-value">{formValues.energy}</span>
            </div>
          </FieldRow>
        </section>

        <section className="card checkin-section">
          <FieldRow
            title={<TitleWithIcon icon={<IconBrain size={16} />} text="8. Stress:" />}
            label="Hur stressad kände du dig idag? (1 = lågt, 10 = mycket)"
            mainId="stress"
            commentId="stressComment"
            commentValue={formValues.stressComment}
            onCommentChange={(value) => updateField("stressComment", value)}
            error={errors.stress}
            commentPlaceholder="Skriv en kommentar om stressen"
          >
            <div className="slider-wrap">
              <input
                id="stress"
                type="range"
                min="1"
                max="10"
                value={formValues.stress}
                onChange={(event) => updateField("stress", Number(event.target.value))}
              />
              <span className="slider-value">{formValues.stress}</span>
            </div>
          </FieldRow>
        </section>

        <section className="card checkin-section">
          <FieldRow
            title={<TitleWithIcon icon={<IconTargetArrow size={16} />} text="9. Motivation:" />}
            label="Hur motiverad kände du dig idag? (1 = lågt, 10 = mycket)"
            mainId="motivation"
            commentId="motivationComment"
            commentValue={formValues.motivationComment}
            onCommentChange={(value) => updateField("motivationComment", value)}
            error={errors.motivation}
            commentPlaceholder="Skriv en kommentar om motivationen"
          >
            <div className="slider-wrap">
              <input
                id="motivation"
                type="range"
                min="1"
                max="10"
                value={formValues.motivation}
                onChange={(event) => updateField("motivation", Number(event.target.value))}
              />
              <span className="slider-value">{formValues.motivation}</span>
            </div>
          </FieldRow>
        </section>

        <article className="card checkin-area-card checkin-area-card-reflection" aria-label="Reflektion">
          <p className="checkin-area-line">OMRÅDE 3: Reflektion</p>
          <div className="checkin-reflection-flag">
            <label htmlFor="reflectionMarked" className="checkin-starmark-toggle">
              <input
                id="reflectionMarked"
                type="checkbox"
                checked={formValues.reflectionMarked}
                onChange={(event) => updateField("reflectionMarked", event.target.checked)}
              />
              <span>📝 Reflektion att minnas</span>
            </label>
            {formValues.reflectionMarked ? (
              <input
                id="reflectionMarkNote"
                className="checkin-starmark-note"
                type="text"
                value={formValues.reflectionMarkNote}
                onChange={(event) => updateField("reflectionMarkNote", event.target.value)}
                placeholder="Ex: Dagens viktigaste reflektion att hitta senare"
              />
            ) : null}
          </div>
        </article>

        <section className="card checkin-section">
          <FieldRow
            title={<TitleWithIcon icon={<IconTrophy size={16} />} text="10. Dagens största framgång:" />}
            label="Vad är du mest stolt över idag?"
            mainId="wentWell"
            commentId="wentWellComment"
            commentValue={formValues.wentWellComment}
            onCommentChange={(value) => updateField("wentWellComment", value)}
            error={errors.wentWell}
            commentPlaceholder="Skriv en kommentar"
          >
            <textarea
              id="wentWell"
              value={formValues.wentWell}
              onChange={(event) => updateField("wentWell", event.target.value)}
              rows={4}
              placeholder="Vad är du mest stolt över idag?"
            />
          </FieldRow>
        </section>

        <section className="card checkin-section">
          <FieldRow
            title={<TitleWithIcon icon={<IconBrain size={16} />} text="11. Dagens största hinder:" />}
            label="Vad gjorde det svårast att följa planen idag?"
            mainId="biggestObstacle"
            commentId="biggestObstacleComment"
            commentValue={formValues.biggestObstacleComment}
            onCommentChange={(value) => updateField("biggestObstacleComment", value)}
            error={errors.biggestObstacle}
            commentPlaceholder="Skriv en kommentar"
          >
            <textarea
              id="biggestObstacle"
              value={formValues.biggestObstacle}
              onChange={(event) => updateField("biggestObstacle", event.target.value)}
              rows={4}
              placeholder="Vad gjorde det svårast att följa planen idag?"
            />
          </FieldRow>
        </section>

        <section className="card checkin-section">
          <FieldRow
            title={<TitleWithIcon icon={<IconNotebook size={16} />} text="12. Plan inför imorgon:" />}
            label="Vilken är den viktigaste åtgärden för att lyckas imorgon?"
            mainId="tomorrowPlan"
            commentId="tomorrowPlanComment"
            commentValue={formValues.tomorrowPlanComment}
            onCommentChange={(value) => updateField("tomorrowPlanComment", value)}
            error={errors.tomorrowPlan}
            commentPlaceholder="Skriv en kommentar"
          >
            <textarea
              id="tomorrowPlan"
              value={formValues.tomorrowPlan}
              onChange={(event) => updateField("tomorrowPlan", event.target.value)}
              rows={4}
              placeholder="Vilken är den viktigaste åtgärden för att lyckas imorgon?"
            />
          </FieldRow>
        </section>

        <div className="checkin-actions">
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Sparar..." : buttonLabel}
          </button>
        </div>
      </form>
    </section>
  );
}
