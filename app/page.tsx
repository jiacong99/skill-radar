import { redirect } from "next/navigation";

// Skills-only app: the home is the skills list. No landing / role gate.
export default function Home() {
  redirect("/skills");
}
