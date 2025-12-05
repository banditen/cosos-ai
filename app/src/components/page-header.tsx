'use client';

import Link from 'next/link';
import { ChevronRight, Home, Plug, FolderOpen, BookOpen, Bot } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  actions?: React.ReactNode;
}

// Map page names to icons
const pageIcons: Record<string, React.ReactNode> = {
  'Home': <Home className="h-3.5 w-3.5" />,
  'Integrations': <Plug className="h-3.5 w-3.5" />,
  'Artifacts': <FolderOpen className="h-3.5 w-3.5" />,
  'Knowledge': <BookOpen className="h-3.5 w-3.5" />,
  'Agents': <Bot className="h-3.5 w-3.5" />,
};

export function PageHeader({ breadcrumbs, actions }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between h-12 px-4 border-b bg-background shrink-0">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const icon = item.icon || pageIcons[item.label];

          return (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  {icon}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span className={`flex items-center gap-1 ${isLast ? 'text-foreground font-medium' : ''}`}>
                  {icon}
                  <span>{item.label}</span>
                </span>
              )}
            </span>
          );
        })}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}

