REVOKE ALL ON project_baseline, baseline_schedule_task, baseline_approve_idempotency, schedule_actual_task FROM alaira_app;

DROP POLICY IF EXISTS schedule_actual_task_tenant_isolation ON schedule_actual_task;
DROP POLICY IF EXISTS baseline_approve_idempotency_tenant_isolation ON baseline_approve_idempotency;
DROP POLICY IF EXISTS baseline_schedule_task_tenant_isolation ON baseline_schedule_task;
DROP POLICY IF EXISTS project_baseline_tenant_isolation ON project_baseline;

DROP TABLE IF EXISTS schedule_actual_task;
DROP TABLE IF EXISTS baseline_approve_idempotency;
DROP TABLE IF EXISTS baseline_schedule_task;
DROP TABLE IF EXISTS project_baseline;
