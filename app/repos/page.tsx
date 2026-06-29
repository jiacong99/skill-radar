import { getRepos } from "@/lib/db";
import ReposClient from "./ReposClient";

export const dynamic = "force-dynamic";

export default function ReposPage() {
  return <ReposClient repos={getRepos()} />;
}
