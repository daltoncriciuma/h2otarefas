import { Button } from '@/components/ui/button';
import { Plus, Link, Trash2 } from 'lucide-react';
import { SectorFilter } from './SectorFilter';

interface TopBarProps {
  isAdmin: boolean;
  selectedSectorId: string | null;
  onSelectSector: (sectorId: string | null) => void;
  selectedCount: number;
  onAddPerson: () => void;
  onConnectSelected: () => void;
  onDeleteSelected: () => void;
  isConnecting: boolean;
}

export function TopBar({
  isAdmin,
  selectedSectorId,
  onSelectSector,
  selectedCount,
  onAddPerson,
  onConnectSelected,
  onDeleteSelected,
  isConnecting,
}: TopBarProps) {
  return (
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-4 z-10">
      <SectorFilter
        selectedSectorId={selectedSectorId}
        onSelectSector={onSelectSector}
      />

      {isAdmin && (
        <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-lg p-2 shadow-md border">
          <Button size="sm" onClick={onAddPerson}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>

          {selectedCount >= 2 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onConnectSelected}
              disabled={isConnecting}
            >
              <Link className="h-4 w-4 mr-1" />
              Conectar ({selectedCount})
            </Button>
          )}

          {selectedCount > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onDeleteSelected}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir ({selectedCount})
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
