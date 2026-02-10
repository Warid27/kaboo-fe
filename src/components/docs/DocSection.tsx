import { cn } from '@/lib/utils';

interface DocSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function DocSection({ title, children, className, icon }: DocSectionProps) {
  return (
    <section className={cn('mb-10 last:mb-0', className)}>
      <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-bold text-foreground">
        {icon && <span className="text-primary">{icon}</span>}
        {title}
      </h2>
      <div className="space-y-3 font-body text-sm leading-relaxed text-foreground/80">
        {children}
      </div>
    </section>
  );
}

interface CodeBlockProps {
  children: string;
  title?: string;
}

export function CodeBlock({ children, title }: CodeBlockProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {title && (
        <div className="border-b border-border bg-muted/50 px-4 py-2">
          <span className="font-body text-xs font-semibold text-muted-foreground">{title}</span>
        </div>
      )}
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-foreground/90">
        {children}
      </pre>
    </div>
  );
}

interface TableProps {
  headers: string[];
  rows: string[][];
}

export function DocTable({ headers, rows }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left font-body text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 font-semibold text-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-foreground/80">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-primary/15 px-2 py-0.5 font-body text-xs font-semibold text-primary">
      {children}
    </span>
  );
}
