export const OFFICIAL_PROJECT_REF = "geazxsvjkqpzbghlywbw";
export const OFFICIAL_SUPABASE_URL = `https://${OFFICIAL_PROJECT_REF}.supabase.co`;

export function deploymentProblems(environment) {
  const problems = [];
  if (environment.NEXT_PUBLIC_SUPABASE_URL !== OFFICIAL_SUPABASE_URL) problems.push("SUPABASE_PROJECT");
  if (environment.VERCEL_ENV === "preview") problems.push("PREVIEW_OFFICIAL_DATABASE");
  if (!/^sb_publishable_[\w-]+$/.test(environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "") && !/^eyJ[\w.-]+$/.test(environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "")) problems.push("PUBLIC_KEY");
  if (!environment.SUPABASE_SECRET_KEY || (environment.STAFF_AUTH_FLOW_SECRET?.length ?? 0) < 32) problems.push("SERVER_KEYS");
  try {
    const site = new URL(environment.APP_SITE_URL ?? "");
    if (site.protocol !== "https:" || site.username || site.password || site.search || site.hash || site.pathname !== "/" || /^(localhost|127\.|\[|0\.)/.test(site.hostname)) problems.push("SITE_URL");
  } catch { problems.push("SITE_URL"); }
  if (!/^[a-f0-9]{40}$/.test(environment.APP_RELEASE_ID || environment.VERCEL_GIT_COMMIT_SHA || "")) problems.push("RELEASE_ID");
  return problems;
}
