import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to the welcome page (which is protected)
  redirect("/welcome");
}
