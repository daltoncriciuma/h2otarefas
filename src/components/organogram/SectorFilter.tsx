import { useSectors } from '@/hooks/useSectors';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SectorFilterProps {
  selectedSectorId: string | null;
  onSelectSector: (sectorId: string | null) => void;
}

export function SectorFilter({ selectedSectorId, onSelectSector }: SectorFilterProps) {
  const { data: sectors } = useSectors();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant={selectedSectorId === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelectSector(null)}
      >
        Todos
      </Button>
      
      {sectors?.map((sector) => (
        <Button
          key={sector.id}
          variant={selectedSectorId === sector.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectSector(sector.id)}
          className={cn(
            selectedSectorId === sector.id && 'text-white'
          )}
          style={{
            backgroundColor: selectedSectorId === sector.id ? sector.color : undefined,
            borderColor: sector.color,
          }}
        >
          {sector.name}
        </Button>
      ))}
    </div>
  );
}
