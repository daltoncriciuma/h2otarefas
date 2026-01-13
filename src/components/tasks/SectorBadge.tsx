import { cn } from '@/lib/utils';

interface SectorBadgeProps {
  name: string;
  color: string;
  className?: string;
}

export function SectorBadge({ name, color, className }: SectorBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted',
        className
      )}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}
