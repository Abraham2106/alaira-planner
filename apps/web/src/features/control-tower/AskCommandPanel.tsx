import { useId } from "react";
import "./control-tower.css";
import { AskOutcome } from "./proposal-card.js";
import { useAskCommand, type AskCommandModel } from "./use-ask-command.js";

type AskCommandPanelProps = {
  projectId: string;
  compact?: boolean;
  model?: AskCommandModel;
  showOutcome?: boolean;
};

export function AskCommandPanel(props: AskCommandPanelProps) {
  if (props.model) {
    return <AskCommandForm {...props} model={props.model} />;
  }
  return <AskCommandPanelOwned {...props} />;
}

function AskCommandPanelOwned(props: Omit<AskCommandPanelProps, "model">) {
  const model = useAskCommand(props.projectId);
  return <AskCommandForm {...props} model={model} />;
}

function AskCommandForm({
  projectId,
  compact = false,
  model,
  showOutcome = true,
}: AskCommandPanelProps & { model: AskCommandModel }) {
  const formId = useId();
  const errorId = `${formId}-error`;
  const showResult =
    showOutcome && (model.pendingProposal || model.deniedReason || model.outcome || model.error);

  return (
    <section className="ct-ask" aria-labelledby={`${formId}-legend`}>
      <form id={formId} onSubmit={model.onSubmit}>
        <fieldset className="ct-fieldset" disabled={model.busy}>
          <legend id={`${formId}-legend`}>Asistente del proyecto</legend>
          <p className="ct-note">
            {projectId.trim()
              ? compact
                ? "La consulta usa el proyecto activo."
                : "Escribí qué querés revisar. Si falta permiso, el cambio no se aplica."
              : "Abrí un proyecto para consultar. El asistente usa ese mismo proyecto."}
          </p>
          <div className="ct-fields">
            <label className="ct-field" htmlFor={`${formId}-observation`}>
              Observación o comando
              <textarea
                id={`${formId}-observation`}
                name="observation"
                ref={model.observationRef}
                value={model.observation}
                onChange={(event) => model.setObservation(event.target.value)}
                required
                rows={compact ? 3 : 4}
                maxLength={8000}
                enterKeyHint="send"
                aria-describedby={model.note ? errorId : undefined}
              />
            </label>
          </div>
          {model.note ? (
            <p className="ct-note" id={errorId} role="status">
              {model.note}
            </p>
          ) : null}
          <div className="ct-actions">
            <button type="submit" className="ct-btn ct-btn-primary" disabled={!projectId.trim()}>
              Enviar
            </button>
          </div>
        </fieldset>
      </form>
      {showResult ? <AskOutcome model={model} emptyLabel="Nada pendiente de confirmar." /> : null}
    </section>
  );
}
