ALTER TABLE acceptance_decision
  DROP CONSTRAINT acceptance_decision_decision_type_check;

ALTER TABLE acceptance_decision
  ADD CONSTRAINT acceptance_decision_decision_type_check CHECK (
    decision_type IN ('completion_request', 'accept', 'reject', 'revert_acceptance')
  );
