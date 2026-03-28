interface ComingSoonPlaceholderProps {
  title: string;
  description: string;
}

export function ComingSoonPlaceholder({ title, description }: ComingSoonPlaceholderProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="panel-cool rounded-[30px] border border-border p-10 text-center">
        <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.18em] text-text-muted">
          Coming Soon
        </div>
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        <p className="mt-2 max-w-sm text-sm text-text-secondary">{description}</p>
      </div>
    </div>
  );
}
