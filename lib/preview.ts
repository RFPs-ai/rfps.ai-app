/**
 * Check if we're on a Vercel preview deployment
 * Preview deployments have URLs like: project-git-branch-user.vercel.app
 */
export function isPreviewDeployment(): boolean {
  if (typeof process === "undefined") return false;
  return !!(
    process.env.VERCEL_URL?.includes("-git-") ||
    process.env.VERCEL_ENV === "preview"
  );
}

