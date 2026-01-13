import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OverdueBadgeProps {
  className?: string;
}

export function OverdueBadge({ className }: OverdueBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive text-destructive-foreground',
        className
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      ATRASADA
    </span>
  );
}
