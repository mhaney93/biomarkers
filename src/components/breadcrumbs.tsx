import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  const items: Crumb[] = [{ label: "All biomarkers", href: "/" }, ...trail];

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />}
              {isLast || !item.href ? (
                <span className={isLast ? "font-medium text-foreground" : undefined}>
                  {i === 0 ? <Home className="h-3.5 w-3.5" /> : item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="inline-flex items-center transition-colors hover:text-foreground"
                >
                  {i === 0 ? <Home className="h-3.5 w-3.5" /> : item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
