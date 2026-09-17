import { StrictMode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Outlet, Route, Routes } from "react-router";
import { NewAnalysisDialog } from "@/features/start-analysis";
import { AnalysesPage } from "@/pages/AnalysesPage";
import { AnalysisPage } from "@/pages/AnalysisPage";
import { queryClient } from "./query-client";
import "./styles.css";

function Layout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <Link
            to="/"
            className="text-xs font-bold tracking-[0.2em] text-primary"
          >
            SEO AI ANALYZER
          </Link>
          <NewAnalysisDialog />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <Outlet />
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<AnalysesPage />} />
            <Route path="analyses/:id" element={<AnalysisPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
