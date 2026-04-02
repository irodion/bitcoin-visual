import { useState, useRef, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { TheoryPanel } from "./TheoryPanel";
import { PageBackground } from "./PageBackground";
import { Sidebar } from "./Sidebar";
import { JourneyFooter } from "./JourneyFooter";
import { StoryRibbon } from "./StoryRibbon";
import { getModuleByKey, getNextModule, getPreviousModule } from "../constants/storyHelpers";

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

function TabBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const keyboardNav = useRef(false);

  useEffect(() => {
    if (keyboardNav.current) {
      tabRefs.current.get(activeTab)?.focus();
      keyboardNav.current = false;
    }
  }, [activeTab]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const keys = tabs.map((t) => t.key);
    const idx = keys.indexOf(activeTab);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      keyboardNav.current = true;
      onTabChange(keys[(idx + 1) % keys.length]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      keyboardNav.current = true;
      onTabChange(keys[(idx - 1 + keys.length) % keys.length]);
    }
  };

  return (
    <div
      className="flex rounded-pill border border-border bg-surface-raised p-0.5"
      role="tablist"
      aria-label="View mode"
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.key, el);
            }}
            id={`tab-${tab.key}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onTabChange(tab.key)}
            className={`cursor-pointer rounded-pill px-4 py-1.5 text-sm font-semibold transition-colors ${
              isSelected
                ? "bg-accent text-text-on-accent"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentModule = getModuleByKey(moduleKey);
  const nextMod = getNextModule(moduleKey);
  const prevMod = getPreviousModule(moduleKey);

  return (
    <PageBackground>
      <div className="relative z-10 mx-4 my-4 overflow-hidden rounded-shell border border-border bg-module-shell shadow-container md:mx-7 md:my-5">
        <div className="flex">
          <Sidebar
            currentModuleKey={moduleKey}
            mobileOpen={sidebarOpen}
            onMobileClose={() => setSidebarOpen(false)}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="border-b border-border px-5 py-3 md:px-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-pill border border-border text-text-secondary transition-colors hover:border-border-strong hover:text-accent md:hidden"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open navigation"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M2 4h12M2 8h12M2 12h12" />
                    </svg>
                  </button>

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
                    {currentModule ? (
                      <div className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted md:block">
                        {currentModule.storyRole}
                        {prevMod && <span> · Builds on: {prevMod.title}</span>}
                        {nextMod && <span> · Next: {nextMod.title}</span>}
                      </div>
                    ) : (
                      moduleNumber != null && (
                        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                          Module {moduleNumber} / Bitcoin Visual
                        </div>
                      )
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
                    <TabBar
                      tabs={tabConfig.tabs}
                      activeTab={tabConfig.activeTab}
                      onTabChange={tabConfig.onTabChange}
                    />
                  )}
                </div>
              </div>

              {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
            </header>

            {currentModule && <StoryRibbon currentModuleKey={moduleKey} />}

            {headerNotice && <div className="px-5 pt-4 md:px-7">{headerNotice}</div>}

            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              <TheoryPanel moduleKey={moduleKey}>{theoryContent}</TheoryPanel>
              <main
                className="flex-1 overflow-y-auto p-5 md:p-8"
                {...(tabConfig
                  ? { role: "tabpanel", "aria-labelledby": `tab-${tabConfig.activeTab}` }
                  : {})}
              >
                {children}
                {currentModule && (
                  <JourneyFooter mod={currentModule} nextModule={nextMod} prevModule={prevMod} />
                )}
              </main>
            </div>
          </div>
        </div>
      </div>
    </PageBackground>
  );
}
