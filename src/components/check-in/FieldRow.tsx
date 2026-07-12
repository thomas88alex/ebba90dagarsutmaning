import type { ReactNode } from "react";

interface FieldRowProps {
  title?: ReactNode;
  label: string;
  mainId: string;
  commentId: string;
  commentValue: string;
  onCommentChange: (value: string) => void;
  children: ReactNode;
  commentLabel?: string;
  commentPlaceholder?: string;
  error?: string;
  commentError?: string;
  hint?: string;
}

export function FieldRow({
  title,
  label,
  mainId,
  commentId,
  commentValue,
  onCommentChange,
  children,
  commentLabel = "Kommentar",
  commentPlaceholder = "Skriv en kort notering",
  error,
  commentError,
  hint,
}: FieldRowProps) {
  return (
    <div className="checkin-row">
      <div className="checkin-heading-line">
        <label htmlFor={mainId} className="checkin-question-line">
          {typeof title === "string" ? <span className="checkin-title">{title}</span> : title ?? null}
          <span className="checkin-question">{label}</span>
        </label>

        <label htmlFor={commentId} className="checkin-comment-label">
          {commentLabel}
        </label>
      </div>

      <div className="checkin-control-line">
        <div className="checkin-main">
          <div className="checkin-control">{children}</div>
          {error ? (
            <p className="field-error" role="alert">
              {error}
            </p>
          ) : null}
          {hint ? <p className="checkin-hint">{hint}</p> : null}
        </div>

        <div className="checkin-comment">
          <textarea
            id={commentId}
            value={commentValue}
            onChange={(event) => onCommentChange(event.target.value)}
            rows={2}
            placeholder={commentPlaceholder}
          />
          {commentError ? (
            <p className="field-error" role="alert">
              {commentError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
