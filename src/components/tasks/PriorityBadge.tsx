import { cn } from '@/lib/utils';
import { TaskPriority, PRIORITY_LABELS, PRIORITY_COLORS } from '@/types/database';

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        PRIORITY_COLORS[priority],
        className
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
