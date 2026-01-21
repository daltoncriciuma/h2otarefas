import { OrgDecorativeLine } from '@/types/organogram';

interface DecorativeLinesProps {
  lines: OrgDecorativeLine[];
}

export function DecorativeLines({ lines }: DecorativeLinesProps) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      {lines.map((line) => (
        <line
          key={line.id}
          x1={line.start_x}
          y1={line.start_y}
          x2={line.end_x}
          y2={line.end_y}
          stroke={line.color}
          strokeWidth={line.stroke_width}
          strokeDasharray="5,5"
        />
      ))}
    </svg>
  );
}
