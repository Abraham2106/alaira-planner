import { useMemo, useRef, useState } from "react";
import type { z } from "zod";
import type { schemas as aiSchemas } from "@alaira/contracts/ai-proposal";
import { ApiClientError } from "../../lib/api-client/errors.js";
import { formatApiError } from "../project/format-api-error.js";
import { createControlTowerApi, newIdempotencyKey } from "./api.js";

type RunResponse = z.infer<(typeof aiSchemas)["RunObservationResponse"]>;
export type ProposalRecord = Extract<RunResponse, { kind: "proposal" }>["proposal"];

export type AskOutcome =
  | { type: "confirmed"; at: string }
  | { type: "rejected"; at: string }
  | { type: "executed"; at: string; tool: string };

/** Prefer the API payload text. Fall back only when the body has no message. */
export function literalApiReason(error: unknown): string {
  if (error instanceof ApiClientError) {
    const body = error.body;
    if (typeof body === "string" && body.trim()) return body.trim();
    if (body && typeof body === "object") {
      const record = body as Record<string, unknown>;
      if (typeof record.reason === "string" && record.reason.trim()) return record.reason.trim();
      if (typeof record.message === "string" && record.message.trim()) return record.message.trim();
      const nested = record.error;
      if (nested && typeof nested === "object") {
        const message = (nested as { message?: unknown }).message;
        if (typeof message === "string" && message.trim()) return message.trim();
        const reason = (nested as { reason?: unknown }).reason;
        if (typeof reason === "string" && reason.trim()) return reason.trim();
      }
    }
  }
  return formatApiError(error);
}

export function useAskCommand(projectId: string) {
  const api = useMemo(() => createControlTowerApi(), []);
  const observationRef = useRef<HTMLTextAreaElement | null>(null);
  const [observation, setObservation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [deniedReason, setDeniedReason] = useState<string | null>(null);
  const [pendingProposal, setPendingProposal] = useState<ProposalRecord | null>(null);
  const [outcome, setOutcome] = useState<AskOutcome | null>(null);

  const clearTransient = () => {
    setError(null);
    setNote(null);
    setDeniedReason(null);
  };

  const onSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    clearTransient();
    setOutcome(null);
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
        return;
      }
      if (result.kind === "executed") {
        setOutcome({ type: "executed", at: new Date().toISOString(), tool: result.tool });
        return;
      }
      setPendingProposal(result.proposal);
    } catch (err) {
      setError(literalApiReason(err));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!pendingProposal) return;
    clearTransient();
    setBusy(true);
    try {
      await api.confirmProposal(projectId.trim(), pendingProposal.id, newIdempotencyKey("confirm"));
      setPendingProposal(null);
      setOutcome({ type: "confirmed", at: new Date().toISOString() });
    } catch (err) {
      setError(literalApiReason(err));
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!pendingProposal) return;
    clearTransient();
    setBusy(true);
    try {
      await api.rejectProposal(projectId.trim(), pendingProposal.id, {
        idempotencyKey: newIdempotencyKey("reject"),
        reason: "Rechazada desde la bandeja",
      });
      setPendingProposal(null);
      setOutcome({ type: "rejected", at: new Date().toISOString() });
    } catch (err) {
      setError(literalApiReason(err));
    } finally {
      setBusy(false);
    }
  };

  const correct = () => {
    setError(null);
    setNote("Corregí la observación y volvé a enviar.");
    observationRef.current?.focus();
  };

  return {
    observationRef,
    observation,
    setObservation,
    busy,
    error,
    note,
    deniedReason,
    pendingProposal,
    outcome,
    onSubmit,
    confirm,
    reject,
    correct,
  };
}

export type AskCommandModel = ReturnType<typeof useAskCommand>;
