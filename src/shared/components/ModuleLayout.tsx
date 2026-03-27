import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { TheoryPanel } from "./TheoryPanel";

interface ModuleLayoutProps {
  moduleKey: string;
  title: string;
  theoryContent: ReactNode;
  children: ReactNode;
}

export function ModuleLayout({ moduleKey, title, theoryContent, children }: ModuleLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-surface/80 px-5 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="group/back flex items-center gap-1 text-xs text-text-secondary transition-colors hover:text-accent"
          >
            <svg
              width="14"
              height="14"
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
          <span className="text-border-strong">/</span>
          <h1 className="text-sm font-medium text-text-primary">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-wider text-text-secondary/50">
            BitcoinVault
          </span>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <TheoryPanel moduleKey={moduleKey}>{theoryContent}</TheoryPanel>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
