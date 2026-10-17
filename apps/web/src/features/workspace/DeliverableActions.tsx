import { FormEvent, useMemo, useState } from "react";
import { formatApiError } from "../project/format-api-error.js";
import { createWorkApi } from "./work-api.js";

const STRATEGIES = [
  { value: "manual", label: "Manual" },
  { value: "deliverable_acceptance", label: "Aceptación de entregable" },
  { value: "weighted_checklist", label: "Lista ponderada" },
  { value: "external_evidence", label: "Evidencia externa" },
] as const;

type StrategyKind = (typeof STRATEGIES)[number]["value"];

export type ActionNode = {
  id: string;
  title: string;
  nodeType: "work_package" | "deliverable" | "milestone";
};

type DeliverableActionsProps = {
  projectId: string;
  node: ActionNode;
  confirmedStrategy: string | null;
  onChanged: () => void;
  onStrategyConfirmed: (strategyKind: string) => void;
};

export function DeliverableActions({
  projectId,
  node,
  confirmedStrategy,
  onChanged,
  onStrategyConfirmed,
}: DeliverableActionsProps) {
  const api = useMemo(() => createWorkApi(), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [strategy, setStrategy] = useState<StrategyKind | "">("");
  const [manual, setManual] = useState("");
  const [note, setNote] = useState("");
  const [criterionKey, setCriterionKey] = useState("");
  const [satisfied, setSatisfied] = useState(false);
  const [acceptReason, setAcceptReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [revertReason, setRevertReason] = useState("");
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const run = async (action: () => Promise<string>) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      setSuccess(await action());
      onChanged();
    } catch (cause) {
      setError(formatApiError(cause));
    } finally {
      setBusy(false);
    }
  };

  const onStrategy = (event: FormEvent) => {
    event.preventDefault();
    if (!strategy) return;
    const chosen = strategy;
    void run(async () => {
      const saved = await api.setProgressStrategy(projectId, node.id, chosen);
      onStrategyConfirmed(saved.strategyKind);
      setStrategy("");
      return `El servidor confirmó la estrategia ${saved.strategyKind}.`;
    });
  };

  const onManual = (event: FormEvent) => {
    event.preventDefault();
    const progressPercent = Number(manual);
    if (!Number.isInteger(progressPercent)) return;
    void run(async () => {
      const saved = await api.setManualProgress(projectId, node.id, progressPercent);
      setManual("");
      return `El servidor confirmó el avance manual en ${saved.progressPercent}%.`;
    });
  };

  const onCompletion = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const saved = await api.requestCompletion(projectId, node.id, note.trim() || undefined);
      setNote("");
      return `Solicitud registrada. Avance confirmado: ${saved.progressPercent}%.`;
    });
  };

  const onAccept = (event: FormEvent) => {
    event.preventDefault();
    const key = criterionKey.trim();
    if (!key) return;
    void run(async () => {
      const saved = await api.acceptDeliverable(projectId, node.id, {
        key,
        satisfied,
        ...(acceptReason.trim() ? { reason: acceptReason.trim() } : {}),
      });
      setCriterionKey("");
      setAcceptReason("");
      setSatisfied(false);
      return `Aceptación registrada. Avance confirmado: ${saved.progressPercent}%.`;
    });
  };

  const onReject = (event: FormEvent) => {
    event.preventDefault();
    const reason = rejectReason.trim();
    if (!reason) return;
    void run(async () => {
      const saved = await api.rejectDeliverable(projectId, node.id, reason);
      setRejectReason("");
      return `Rechazo registrado. Avance confirmado: ${saved.progressPercent}%.`;
    });
  };

  const onRevert = (event: FormEvent) => {
    event.preventDefault();
    const reason = revertReason.trim();
    if (!reason) return;
    void run(async () => {
      const saved = await api.revertAcceptance(projectId, node.id, reason);
      setRevertReason("");
      return `Aceptación revertida. Avance confirmado: ${saved.progressPercent}%.`;
    });
  };

  const onEvidence = (event: FormEvent) => {
    event.preventDefault();
    const title = evidenceTitle.trim();
    const url = evidenceUrl.trim();
    if (!title || !url) return;
    void run(async () => {
      const saved = await api.createEvidenceLink(projectId, {
        title,
        url,
        workNodeId: node.id,
      });
      setEvidenceTitle("");
      setEvidenceUrl("");
      return `Evidencia confirmada: ${saved.record.title}.`;
    });
  };

  return (
    <div className="node-actions" aria-busy={busy}>
      <p className="fact-missing">
        {confirmedStrategy
          ? `Confirmada al guardar: ${confirmedStrategy}. La API no la devuelve al leer.`
          : "Estrategia: sin dato del servidor."}
      </p>
      {error ? (
        <p className="directory-error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="hub-notice" role="status">
          {success}
        </p>
      ) : null}

      <form onSubmit={onStrategy}>
        <label className="hub-field">
          Estrategia en borrador
          <select
            aria-label={`Estrategia en borrador de ${node.title}`}
            value={strategy}
            onChange={(event) => setStrategy(event.target.value as StrategyKind | "")}
            disabled={busy}
          >
            <option value="">Elegí una estrategia para guardar</option>
            {STRATEGIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="fact-draft">Este valor no está guardado hasta que el servidor responda.</p>
        <button className="hub-button" type="submit" disabled={busy || !strategy}>
          {busy ? "Enviando…" : "Guardar estrategia"}
        </button>
      </form>

      <form onSubmit={onManual}>
        <label className="hub-field">
          Avance manual en borrador
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            inputMode="numeric"
            value={manual}
            disabled={busy}
            aria-label={`Avance manual en borrador de ${node.title}`}
            onChange={(event) => setManual(event.target.value)}
          />
        </label>
        <button className="hub-button" type="submit" disabled={busy || manual.trim() === ""}>
          {busy ? "Enviando…" : "Guardar avance manual"}
        </button>
      </form>

      <form onSubmit={onEvidence}>
        <label className="hub-field">
          Título de la evidencia
          <input
            value={evidenceTitle}
            maxLength={512}
            disabled={busy}
            onChange={(event) => setEvidenceTitle(event.target.value)}
          />
        </label>
        <label className="hub-field">
          URL de la evidencia
          <input
            type="url"
            value={evidenceUrl}
            disabled={busy}
            onChange={(event) => setEvidenceUrl(event.target.value)}
          />
        </label>
        <button
          className="hub-button"
          type="submit"
          disabled={busy || !evidenceTitle.trim() || !evidenceUrl.trim()}
        >
          {busy ? "Enviando…" : "Vincular evidencia"}
        </button>
      </form>

      {node.nodeType === "deliverable" ? (
        <>
          <form onSubmit={onCompletion}>
            <label className="hub-field">
              Nota de la solicitud
              <input
                value={note}
                maxLength={2000}
                disabled={busy}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            <button className="hub-button primary" type="submit" disabled={busy}>
              {busy ? "Enviando…" : "Solicitar finalización"}
            </button>
          </form>
          <form onSubmit={onAccept}>
            <label className="hub-field">
              Clave del criterio
              <input
                value={criterionKey}
                maxLength={128}
                disabled={busy}
                aria-label={`Clave del criterio de ${node.title}`}
                onChange={(event) => setCriterionKey(event.target.value)}
              />
            </label>
            <p className="fact-draft">El árbol no devuelve los criterios. Escribí la clave real.</p>
            <label className="hub-field">
              <input
                type="checkbox"
                checked={satisfied}
                disabled={busy}
                onChange={(event) => setSatisfied(event.target.checked)}
              />{" "}
              Criterio satisfecho
            </label>
            <label className="hub-field">
              Motivo de aceptación
              <input
                value={acceptReason}
                maxLength={2000}
                disabled={busy}
                onChange={(event) => setAcceptReason(event.target.value)}
              />
            </label>
            <button className="hub-button primary" type="submit" disabled={busy || !criterionKey.trim()}>
              {busy ? "Enviando…" : "Aceptar entregable"}
            </button>
          </form>
          <form onSubmit={onReject}>
            <label className="hub-field">
              Motivo del rechazo
              <input
                required
                value={rejectReason}
                maxLength={2000}
                disabled={busy}
                onChange={(event) => setRejectReason(event.target.value)}
              />
            </label>
            <button className="hub-button" type="submit" disabled={busy || !rejectReason.trim()}>
              {busy ? "Enviando…" : "Rechazar entregable"}
            </button>
          </form>
          <form onSubmit={onRevert}>
            <label className="hub-field">
              Motivo de la reversión
              <input
                required
                value={revertReason}
                maxLength={2000}
                disabled={busy}
                onChange={(event) => setRevertReason(event.target.value)}
              />
            </label>
            <button className="hub-button" type="submit" disabled={busy || !revertReason.trim()}>
              {busy ? "Enviando…" : "Revertir aceptación"}
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}
