import { FormEvent, useCallback, useId, useMemo, useState } from "react";
import type { z } from "zod";
import type { schemas as aiSchemas } from "@alaira/contracts/ai-proposal";
import { formatApiError } from "../project/format-api-error.js";
import { createControlTowerApi, newIdempotencyKey } from "./api.js";

type RunResponse = z.infer<(typeof aiSchemas)["RunObservationResponse"]>;
type ProposalRecord = Extract<RunResponse, { kind: "proposal" }>["proposal"];

type AskCommandPanelProps = {
  projectId: string;
  onProjectIdChange?: (value: string) => void;
  compact?: boolean;
};

export function AskCommandPanel({
  projectId,
  onProjectIdChange,
  compact = false,
}: AskCommandPanelProps) {
  const api = useMemo(() => createControlTowerApi(), []);
  const formId = useId();
  const [observation, setObservation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pendingProposal, setPendingProposal] = useState<ProposalRecord | null>(null);
  const [deniedReason, setDeniedReason] = useState<string | null>(null);

  const resetFeedback = useCallback(() => {
    setError(null);
    setStatus(null);
    setDeniedReason(null);
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setPendingProposal(null);
    const id = projectId.trim();
    const text = observation.trim();
    if (!id || !text) return;
    setBusy(true);
    try {
      const result = await api.runObservation(id, {
        observation: text,
        idempotencyKey: newIdempotencyKey("ask"),
      });
      if (!result.ok) {
        setDeniedReason(result.reason);
        setStatus("La política denegó la acción (deny-by-default).");
        return;
      }
      if (result.kind === "executed") {
        setStatus(`Ejecutado: ${result.tool} (autonomía controlada).`);
        return;
      }
      setPendingProposal(result.proposal);
      setStatus("Propuesta de IA pendiente de confirmación humana.");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const resolveProposal = async (action: "confirm" | "reject") => {
    if (!pendingProposal) return;
    resetFeedback();
    setBusy(true);
    try {
      const id = projectId.trim();
      if (action === "confirm") {
        await api.confirmProposal(id, pendingProposal.id, newIdempotencyKey("confirm"));
        setStatus("Propuesta confirmada; revisa el Project Event Log.");
      } else {
        await api.rejectProposal(id, pendingProposal.id, {
          idempotencyKey: newIdempotencyKey("reject"),
          reason: "Rechazada desde Control Tower UI",
        });
        setStatus("Propuesta rechazada.");
      }
      setPendingProposal(null);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className={compact ? "ct-ask ct-ask-compact" : "ct-ask"}
      aria-labelledby={`${formId}-legend`}
    >
      <form id={formId} onSubmit={onSubmit}>
        <fieldset className="planner-fieldset" disabled={busy}>
          <legend id={`${formId}-legend`}>Ask / Command (REQ-096)</legend>
          {!compact ? (
            <p className="planner-muted">
              Consultas y comandos gobernados por permisos y autonomía (ADR-0005). Sin token CSRF
              las escrituras fallan de forma segura.
            </p>
          ) : null}
          <div className="planner-field-grid">
            <label htmlFor={`${formId}-project`}>
              ID de proyecto
              <input
                id={`${formId}-project`}
                name="projectId"
                value={projectId}
                onChange={(e) => onProjectIdChange?.(e.target.value)}
                required
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <label htmlFor={`${formId}-observation`}>
              Observación o comando
              <textarea
                id={`${formId}-observation`}
                name="observation"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                required
                rows={compact ? 2 : 3}
                maxLength={8000}
              />
            </label>
          </div>
          <div className="planner-actions">
            <button type="submit">Enviar</button>
          </div>
        </fieldset>
      </form>

      {status ? (
        <p className="planner-success" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}
      {deniedReason ? (
        <p className="planner-muted" role="status">
          Motivo: {deniedReason}
        </p>
      ) : null}
      {error ? (
        <p className="planner-error" role="alert">
          {error}
        </p>
      ) : null}

      {pendingProposal ? (
        <div className="ct-proposal-card" role="region" aria-label="Propuesta de IA pendiente">
          <p>
            <strong>{pendingProposal.typedCommand}</strong> · {pendingProposal.autonomyLevel}
          </p>
          <p>{pendingProposal.rationale}</p>
          <div className="planner-actions">
            <button type="button" disabled={busy} onClick={() => resolveProposal("confirm")}>
              Confirmar propuesta
            </button>
            <button type="button" disabled={busy} onClick={() => resolveProposal("reject")}>
              Rechazar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
