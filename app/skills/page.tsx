// Server component: reads the markdown catalog, hands it to the client table.
import { getSkills } from "@/lib/db";
import SkillsClient from "./SkillsClient";

export const dynamic = "force-dynamic"; // always re-read the file (picks up new pending rows)

export default function SkillsPage() {
  const skills = getSkills();
  return <SkillsClient skills={skills} />;
}
