GRANT SELECT, INSERT, UPDATE, DELETE ON iam_invitation TO alaira_app;
GRANT SELECT, INSERT, UPDATE ON iam_login_attempt TO alaira_app;
GRANT USAGE, SELECT ON SEQUENCE iam_login_attempt_id_seq TO alaira_app;
