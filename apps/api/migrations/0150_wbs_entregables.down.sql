DROP TABLE IF EXISTS work_node_projection_link;
DROP TABLE IF EXISTS acceptance_criterion_version;
DROP TABLE IF EXISTS wbs_node_detail;

ALTER TABLE work_node DROP CONSTRAINT IF EXISTS work_node_node_type_check;

ALTER TABLE work_node
  ADD CONSTRAINT work_node_node_type_check CHECK (
    node_type IN ('project_root', 'branch')
  );
