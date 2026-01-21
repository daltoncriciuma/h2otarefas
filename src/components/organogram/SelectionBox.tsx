import { SelectionBox as SelectionBoxType } from '@/types/organogram';

interface SelectionBoxProps {
  box: SelectionBoxType;
}

export function SelectionBox({ box }: SelectionBoxProps) {
  const left = Math.min(box.startX, box.endX);
  const top = Math.min(box.startY, box.endY);
  const width = Math.abs(box.endX - box.startX);
  const height = Math.abs(box.endY - box.startY);

  return (
    <div
      className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
      style={{
        left,
        top,
        width,
        height,
      }}
    />
  );
}
