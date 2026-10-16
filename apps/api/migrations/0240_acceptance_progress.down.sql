REVOKE UPDATE (rollup_weight) ON wbs_node_detail FROM alaira_app;

REVOKE ALL
  ON work_node_lifecycle,
    progress_strategy_version,
    work_node_progress,
    work_node_checklist_progress,
    acceptance_decision,
    acceptance_command_idempotency
  FROM alaira_app;

DROP POLICY IF EXISTS acceptance_command_idempotency_tenant_isolation ON acceptance_command_idempotency;
DROP POLICY IF EXISTS acceptance_decision_tenant_isolation ON acceptance_decision;
DROP POLICY IF EXISTS work_node_checklist_progress_tenant_isolation ON work_node_checklist_progress;
DROP POLICY IF EXISTS work_node_progress_tenant_isolation ON work_node_progress;
DROP POLICY IF EXISTS progress_strategy_version_tenant_isolation ON progress_strategy_version;
DROP POLICY IF EXISTS work_node_lifecycle_tenant_isolation ON work_node_lifecycle;

DROP TABLE IF EXISTS acceptance_command_idempotency;
DROP TABLE IF EXISTS acceptance_decision;
DROP TABLE IF EXISTS work_node_checklist_progress;
DROP TABLE IF EXISTS work_node_progress;
DROP TABLE IF EXISTS progress_strategy_version;
DROP TABLE IF EXISTS work_node_lifecycle;

ALTER TABLE wbs_node_detail DROP COLUMN IF EXISTS rollup_weight;
