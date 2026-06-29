import { getSkills, getRepos, getNews } from "@/lib/db";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <DashboardClient skills={getSkills()} repos={getRepos()} news={getNews()} />;
}
