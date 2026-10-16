export type DbConfig = {
  adminUrl: string;
  appUrl: string;
};

export function loadDbConfig(): DbConfig {
  const base =
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/alaira";
  const appUrl =
    process.env.DATABASE_APP_URL ??
    "postgresql://alaira_app:alaira_app_dev@localhost:5432/alaira";
  return { adminUrl: base, appUrl };
}
