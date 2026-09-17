import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter, NavLink, Outlet, Route, Routes } from "react-router";
import { AnalysisRunPage } from "@/pages/AnalysisRunPage";
import { AnalysisRunsPage } from "@/pages/AnalysisRunsPage";
import { NewAnalysisPage } from "@/pages/NewAnalysisPage";
import { History, Plus, type LucideIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { queryClient } from "./query-client";
import "./styles.css";

function Layout() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <span className="text-xs font-bold tracking-widest text-muted-foreground">
          SEO AI ANALYZER
        </span>
        <nav className="flex gap-1">
          <NavItem to="/" end icon={Plus}>
            New analysis
          </NavItem>
          <NavItem to="/analyses" icon={History}>
            Analyses
          </NavItem>
        </nav>
      </header>
      <Outlet />
    </main>
  );
}

function NavItem({
  to,
  end,
  icon: Icon,
  children,
}: {
  to: string;
  end?: boolean;
  icon: LucideIcon;
  children: string;
}) {
  return (
    <NavLink to={to} end={end}>
      {({ isActive }) => (
        <Button asChild variant={isActive ? "secondary" : "ghost"} size="sm">
          <span>
            <Icon />
            {children}
          </span>
        </Button>
      )}
    </NavLink>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<NewAnalysisPage />} />
            <Route path="analyses" element={<AnalysisRunsPage />} />
            <Route path="analyses/:id" element={<AnalysisRunPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
