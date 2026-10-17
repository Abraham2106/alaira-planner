import type { ProposalRecord } from "./use-ask-command.js";
import type { AskCommandModel } from "./use-ask-command.js";
import { resolveDefaultLocale } from "../shell/datetime/format.js";

function asText(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(asText).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => {
        const text = asText(item);
        return text ? `${key}: ${text}` : key;
      })
      .join("\n");
  }
  return "";
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(asText).filter(Boolean);
  const text = asText(value);
  return text ? [text] : [];
}

export function relativeEs(iso: string, now = Date.now()): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return iso;
  const minutes = Math.max(0, Math.round((now - time) / 60000));
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

export function clockEs(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString(resolveDefaultLocale(), { hour: "2-digit", minute: "2-digit" });
}

function stateText(record: Record<string, unknown>, empty: string): string {
  const text = asText(record);
  return text || empty;
}

function criteriaText(prior: Record<string, unknown>, proposed: Record<string, unknown>): string {
  const bag = { ...prior, ...proposed };
  const satisfied = stringList(bag.criteriaSatisfied);
  const pending = stringList(bag.criteriaPending);
  const lines: string[] = [];
  if (satisfied.length > 0) lines.push(`Cumplidos: ${satisfied.join(", ")}`);
  if (pending.length > 0) lines.push(`Pendientes: ${pending.join(", ")}`);
  if (lines.length === 0 && bag.criteria != null) {
    const raw = asText(bag.criteria);
    if (raw) lines.push(raw);
  }
  return lines.length > 0 ? lines.join("\n") : "Esta respuesta no trae criterios.";
}

function consequencesText(proposed: Record<string, unknown>): string {
  const lines: string[] = [];
  if (typeof proposed.blockedReason === "string" && proposed.blockedReason) {
    lines.push(proposed.blockedReason);
  }
  if (proposed.mayCloseItem === false) lines.push("No cierra el ítem.");
  if (proposed.mayCloseItem === true) lines.push("Puede cerrar el ítem si confirmás.");
  if (proposed.elevationRequired === true) lines.push("Requiere aprobación humana.");
  if (proposed.scheduleDeltaDays != null) {
    lines.push(`Delta de cronograma: ${asText(proposed.scheduleDeltaDays)} días.`);
  }
  if (proposed.suggestedProgressPercent != null) {
    lines.push(`Avance sugerido: ${asText(proposed.suggestedProgressPercent)}%.`);
  }
  if (typeof proposed.status === "string" && proposed.status) {
    lines.push(`Estado declarado: ${proposed.status}.`);
  }
  if (typeof proposed.note === "string" && proposed.note) lines.push(proposed.note);
  return lines.length > 0 ? lines.join("\n") : "Sin consecuencias en la respuesta.";
}

function unchangedText(
  command: string,
  prior: Record<string, unknown>,
  proposed: Record<string, unknown>,
): string {
  if (command === "modify_baseline") {
    return "El baseline no cambia hasta que confirmes. Esto es un preview.";
  }
  const keys = new Set([...Object.keys(prior), ...Object.keys(proposed)]);
  const baselineKeys = [...keys].filter((key) => /baseline/i.test(key));
  if (baselineKeys.length === 0) return "El baseline no cambia.";
  const same = baselineKeys.filter(
    (key) => JSON.stringify(prior[key]) === JSON.stringify(proposed[key]),
  );
  if (same.length > 0) return `Sigue igual: ${same.join(", ")}.`;
  return "Hay campos de baseline en el diff. Revisalos antes de confirmar.";
}

function evidenceText(ids: readonly string[]): string {
  return ids.length > 0 ? ids.join("\n") : "Sin evidencia citada.";
}

function Icon({ name }: { name: "pending" | "denied" | "ok" }) {
  if (name === "ok") {
    return (
      <svg className="ct-chip-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3.5 8.2 6.4 11l6.1-6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (name === "denied") {
    return (
      <svg className="ct-chip-icon" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.6 5.6 10.4 10.4M10.4 5.6 5.6 10.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  return (
    <svg className="ct-chip-icon" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 4.8V8l2.2 1.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function StatusChip({
  tone,
  label,
}: {
  tone: "pending" | "denied" | "ok" | "neutral";
  label: string;
}) {
  const icon = tone === "neutral" ? "pending" : tone;
  return (
    <span className={`ct-chip ct-chip-${tone}`}>
      <Icon name={icon} />
      <span>{label}</span>
    </span>
  );
}

type ProposalCardProps = {
  proposal: ProposalRecord;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCorrect: () => void;
  onReject: () => void;
};

export function ProposalCard({
  proposal,
  busy,
  error,
  onConfirm,
  onCorrect,
  onReject,
}: ProposalCardProps) {
  const prior = proposal.priorState ?? {};
  const proposed = proposal.proposedState ?? {};
  return (
    <article className="ct-proposal" aria-label="Propuesta pendiente">
      <header className="ct-proposal-head">
        <img
          className="ct-bot-avatar"
          src="/brand/logo-mark.png"
          alt=""
          width={28}
          height={28}
        />
        <p className="ct-proposal-meta">
          Alaira · bot · <time dateTime={proposal.createdAt}>{relativeEs(proposal.createdAt)}</time>
        </p>
        <StatusChip tone="pending" label="Pendiente" />
      </header>
      <p className="ct-proposal-text">{proposal.rationale || "Sin fundamento en la respuesta."}</p>
      <p className="ct-proposal-command">
        <span className="ct-mono-inline">{proposal.typedCommand}</span>
        <span className="ct-proposal-autonomy">{proposal.autonomyLevel}</span>
      </p>
      <dl className="ct-proposal-facts">
        <div>
          <dt>Antes → después</dt>
          <dd className="ct-diff">
            <pre className="ct-mono">{stateText(prior, "Sin estado previo.")}</pre>
            <span className="ct-diff-arrow" aria-hidden="true">
              →
            </span>
            <pre className="ct-mono">{stateText(proposed, "Sin estado propuesto.")}</pre>
          </dd>
        </div>
        <div>
          <dt>Evidencia</dt>
          <dd>
            <pre className="ct-mono">{evidenceText(proposal.citedEvidenceIds)}</pre>
          </dd>
        </div>
        <div>
          <dt>Criterios</dt>
          <dd>{criteriaText(prior, proposed)}</dd>
        </div>
        <div>
          <dt>Consecuencias</dt>
          <dd>{consequencesText(proposed)}</dd>
        </div>
        <div>
          <dt>Qué no cambia</dt>
          <dd>{unchangedText(proposal.typedCommand, prior, proposed)}</dd>
        </div>
      </dl>
      {error ? (
        <p className="ct-alert" role="alert">
          {error}
        </p>
      ) : null}
      <div className="ct-actions">
        <button type="button" className="ct-btn ct-btn-primary" disabled={busy} onClick={onConfirm}>
          Confirmar
        </button>
        <button type="button" className="ct-btn" disabled={busy} onClick={onCorrect}>
          Corregir
        </button>
        <button type="button" className="ct-btn ct-btn-danger" disabled={busy} onClick={onReject}>
          Rechazar
        </button>
      </div>
    </article>
  );
}

export function AskOutcome({
  model,
  emptyLabel,
}: {
  model: AskCommandModel;
  emptyLabel: string;
}) {
  const { pendingProposal, deniedReason, outcome, error, busy } = model;
  if (pendingProposal) {
    return (
      <ProposalCard
        proposal={pendingProposal}
        busy={busy}
        error={error}
        onConfirm={() => void model.confirm()}
        onCorrect={model.correct}
        onReject={() => void model.reject()}
      />
    );
  }
  if (deniedReason) {
    return (
      <div className="ct-denied" role="status">
        <StatusChip tone="denied" label="Denegado" />
        <p className="ct-denied-reason">{deniedReason}</p>
      </div>
    );
  }
  if (outcome?.type === "confirmed") {
    return (
      <p className="ct-resolution-line">
        <Icon name="ok" />
        <span>
          Confirmado por vos · <time dateTime={outcome.at}>{clockEs(outcome.at)}</time>
        </span>
      </p>
    );
  }
  if (outcome?.type === "rejected") {
    return (
      <p className="ct-resolution-line ct-resolution-line-denied">
        <Icon name="denied" />
        <span>
          Rechazado por vos · <time dateTime={outcome.at}>{clockEs(outcome.at)}</time>
        </span>
      </p>
    );
  }
  if (outcome?.type === "executed") {
    return (
      <p className="ct-resolution-line" role="status">
        <StatusChip tone="ok" label="Ejecutado" />
        <span className="ct-mono-inline">{outcome.tool}</span>
      </p>
    );
  }
  if (error) {
    return (
      <p className="ct-alert" role="alert">
        {error}
      </p>
    );
  }
  return (
    <p className="ct-empty" role="status">
      {emptyLabel}
    </p>
  );
}
