import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { ViewState } from '@/types/organogram';

interface ViewControlsProps {
  viewState: ViewState;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function ViewControls({ viewState, onZoomIn, onZoomOut, onReset }: ViewControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-lg p-2 shadow-md border">
      <Button variant="ghost" size="icon" onClick={onZoomOut} disabled={viewState.scale <= 0.25}>
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <span className="text-sm font-medium min-w-[3rem] text-center">
        {Math.round(viewState.scale * 100)}%
      </span>
      
      <Button variant="ghost" size="icon" onClick={onZoomIn} disabled={viewState.scale >= 2}>
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button variant="ghost" size="icon" onClick={onReset}>
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
}
