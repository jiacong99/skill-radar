import "./globals.css";
import type { Metadata } from "next";
import Nav from "./components/Nav";

export const metadata: Metadata = {
  title: "Skill Radar — AI 情报 Dashboard",
  description: "明星 skills / 高星 AI 项目 / Dev AI 新闻，本地优先、markdown 当 DB。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>
        <Nav />
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
