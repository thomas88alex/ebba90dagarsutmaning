import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { challengeConfig } from "../config/challengeConfig";
import { getChallengeStartDate, setChallengeStartDate } from "../services/challengeSettingsService";
import {
  buildExportFilename,
  buildPreImportBackupFilename,
  createBackupPayload,
  getWeeklyBackupReminder,
  parseImportPayload,
  restoreFromBackup,
  setLatestExportDate,
  type ChallengeBackupPayload,
  type ImportSummary,
} from "../services/backupService";

function downloadJsonFile(content: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function SettingsPage() {
  const navigate = useNavigate();
  const currentStartDate = useMemo(() => getChallengeStartDate(), []);
  const [startDate, setStartDate] = useState(currentStartDate);
  const [saved, setSaved] = useState<string | null>(null);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    fileName: string;
    payload: ChallengeBackupPayload;
    summary: ImportSummary;
  } | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [backupReminder, setBackupReminder] = useState(() => getWeeklyBackupReminder());
  const importInputRef = useRef<HTMLInputElement | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!startDate) {
      return;
    }

    setChallengeStartDate(startDate);
    setSaved("Startdatum sparat.");

    window.setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 600);
  }

  function handleExportData(): void {
    setBackupSuccess(null);
    setBackupError(null);
    setImportSuccess(null);

    try {
      const payload = createBackupPayload();
      const fileName = buildExportFilename(new Date());
      downloadJsonFile(payload, fileName);
      setLatestExportDate(payload.exportDate);
      setBackupReminder(getWeeklyBackupReminder());
      setBackupSuccess(`Backup exporterad: ${fileName}`);
    } catch {
      setBackupError("Export misslyckades. Försök igen.");
    }
  }

  async function handleImportFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    setBackupSuccess(null);
    setBackupError(null);
    setImportSuccess(null);
    setImportError(null);

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseImportPayload(text);

      if (!parsed.ok) {
        setPendingImport(null);
        setImportError(parsed.error);
        return;
      }

      setPendingImport({
        fileName: file.name,
        payload: parsed.payload,
        summary: parsed.summary,
      });
    } catch {
      setPendingImport(null);
      setImportError("Import misslyckades. Filen kunde inte läsas.");
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  }

  function handleConfirmImport(): void {
    if (!pendingImport) {
      return;
    }

    setImportError(null);
    setImportSuccess(null);

    try {
      // Always create a recoverable backup before any overwrite.
      const preImportBackup = createBackupPayload();
      const preImportFileName = buildPreImportBackupFilename(new Date());
      downloadJsonFile(preImportBackup, preImportFileName);

      restoreFromBackup(pendingImport.payload);
      setImportSuccess(`Import klar. Tidigare lokal data sparades som: ${preImportFileName}`);
      setPendingImport(null);
    } catch {
      setImportError("Import misslyckades. Ingen data skrevs över.");
    }
  }

  function handleCancelImportPreview(): void {
    setPendingImport(null);
    setImportError(null);
  }

  const importSummary = pendingImport?.summary;

  return (
    <section className="page-section settings-page">
      <header className="page-header-card">
        <p className="eyebrow">Inställningar</p>
        <h2>Utmaningsinställningar</h2>
        <p>Här ställer du in datum för utmaningsstart. Kalendern och dagräkningen uppdateras direkt.</p>
      </header>

      <form className="card settings-form" onSubmit={handleSubmit}>
        <label className="field-group" htmlFor="challengeStartDate">
          <span>Datum för utmaningsstart</span>
          <input
            id="challengeStartDate"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
        </label>

        <p className="checkin-hint">Utmaningen är alltid {challengeConfig.totalDays} dagar.</p>

        {saved ? <p className="form-success">{saved}</p> : null}

        <div className="checkin-actions">
          <button type="submit" className="primary-button">Spara inställningar</button>
        </div>
      </form>

      <section className="card settings-backup-panel" aria-label="Backup och återställning">
        <p className="eyebrow">Backup & restore</p>
        <h3>Lokal backup av utmaningsdata</h3>
        <p className="settings-warning-note">
          Viktigt: all data lagras lokalt i denna webbläsare på denna enhet.
          Om webbläsardata rensas kan informationen försvinna.
        </p>

        <p className={backupReminder.showReminder ? "form-error" : "checkin-hint"}>{backupReminder.message}</p>

        <div className="settings-backup-actions">
          <button type="button" className="primary-button" onClick={handleExportData}>Export data</button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => importInputRef.current?.click()}
          >
            Import data
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFileChange}
            hidden
          />
        </div>

        {backupSuccess ? <p className="form-success">{backupSuccess}</p> : null}
        {backupError ? <p className="form-error">{backupError}</p> : null}
        {importSuccess ? <p className="form-success">{importSuccess}</p> : null}
        {importError ? <p className="form-error">{importError}</p> : null}

        {importSummary ? (
          <div className="settings-import-preview" role="status" aria-live="polite">
            <h4>Importsammanfattning</h4>
            <p>Fil: {pendingImport?.fileName}</p>
            <p>Schema version: {importSummary.schemaVersion}</p>
            <p>Exportdatum: {new Date(importSummary.exportDate).toLocaleString()}</p>
            <p>Antal check-ins: {importSummary.checkInsCount}</p>
            <p>Tidigaste datum: {importSummary.earliestCheckInDate ?? "-"}</p>
            <p>Senaste datum: {importSummary.latestCheckInDate ?? "-"}</p>
            <p>Challenge settings: {importSummary.includesChallengeSettings ? "Ja" : "Nej"}</p>
            <p>User settings: {importSummary.includesUserSettings ? "Ja" : "Nej"}</p>
            <p>Recipes i filen: {importSummary.includesRecipes ? "Ja" : "Nej"}</p>
            <p>Selected meals i filen: {importSummary.includesSelectedMeals ? "Ja" : "Nej"}</p>

            <p className="checkin-hint">Detta kommer skriva över nuvarande lokala data.</p>

            <div className="settings-backup-actions">
              <button type="button" className="primary-button" onClick={handleConfirmImport}>Bekräfta import</button>
              <button type="button" className="secondary-button" onClick={handleCancelImportPreview}>Avbryt</button>
            </div>
          </div>
        ) : null}
      </section>
    </section>
  );
}
