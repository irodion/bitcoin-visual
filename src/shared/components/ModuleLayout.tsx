import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { TheoryPanel } from "./TheoryPanel";
import { PageBackground } from "./PageBackground";

interface Tab {
  key: string;
  label: string;
}

interface TabConfig {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

interface ModuleLayoutProps {
  moduleKey: string;
  title: string;
  theoryContent: ReactNode;
  children: ReactNode;
  moduleNumber?: number;
  subtitle?: string;
  tabConfig?: TabConfig;
  statusText?: string;
  headerNotice?: ReactNode;
}

export function ModuleLayout({
  moduleKey,
  title,
  theoryContent,
  children,
  moduleNumber,
  subtitle,
  tabConfig,
  statusText,
  headerNotice,
}: ModuleLayoutProps) {
  return (
    <PageBackground>
      <div className="relative z-10 mx-4 my-4 overflow-hidden rounded-[34px] border border-border bg-module-shell shadow-container md:mx-7 md:my-5">
        {/* ── Header ── */}
        <header className="border-b border-border px-5 py-3 md:px-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="group/back flex items-center gap-1 rounded-pill border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-border-strong hover:text-accent"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover/back:-translate-x-0.5"
                >
                  <path d="M10 3 5 8l5 5" />
                </svg>
                Home
              </Link>
              <div>
                {moduleNumber != null && (
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                    Module {moduleNumber} / Bitcoin Visual
                  </div>
                )}
                <h1 className="text-lg font-bold text-text-primary md:text-xl">{title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {statusText && (
                <span className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted md:block">
                  {statusText}
                </span>
              )}

              {tabConfig && (
                <div
                  className="flex rounded-pill border border-border bg-surface-raised p-0.5"
                  role="group"
                  aria-label="View mode"
                >
                  {tabConfig.tabs.map((tab) => {
                    const isSelected = tabConfig.activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => tabConfig.onTabChange(tab.key)}
                        className={`cursor-pointer rounded-pill px-4 py-1.5 text-sm font-semibold transition-colors ${
                          isSelected
                            ? "bg-accent text-[#0D1420]"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
        </header>

        {headerNotice && <div className="px-5 pt-4 md:px-7">{headerNotice}</div>}

        {/* ── Body ── */}
        <div
          className="flex flex-1 flex-col md:flex-row"
          style={{ minHeight: "calc(100vh - 140px)" }}
        >
          <TheoryPanel moduleKey={moduleKey}>{theoryContent}</TheoryPanel>
          <main className="flex-1 overflow-y-auto p-5 md:p-8">{children}</main>
        </div>
      </div>
    </PageBackground>
  );
}
