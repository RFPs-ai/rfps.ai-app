import { redirect } from "next/navigation";
import { isPreviewDeployment } from "@/lib/preview";

export default function Home() {
  // On PR preview deployments, go straight to dashboard (no auth required)
  if (isPreviewDeployment()) {
    redirect("/dashboard");
  }
  // On production, redirect to welcome page (which is protected)
  redirect("/welcome");
}
