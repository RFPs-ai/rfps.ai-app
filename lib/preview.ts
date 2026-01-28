/**
 * Check if we're on a Vercel PR preview deployment
 * PR previews have URLs like: project-git-branch-user.vercel.app
 * This is different from production which is: project.vercel.app
 */
export function isPreviewDeployment(): boolean {
  if (typeof process === "undefined") return false;
  
  // Check if VERCEL_URL contains "-git-" which indicates a PR preview
  return !!process.env.VERCEL_URL?.includes("-git-");
}

/**
 * Client-side check for preview deployment
 * Checks if the current hostname contains "-git-"
 */
export function isPreviewDeploymentClient(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.includes("-git-");
}

