import { OrgPerson, CARD_SIZES } from '@/types/organogram';
import { cn } from '@/lib/utils';
import { Lock, User } from 'lucide-react';
import { useSectors } from '@/hooks/useSectors';

interface PersonCardProps {
  person: OrgPerson;
  isSelected: boolean;
  isDragging: boolean;
  isAdmin: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

export function PersonCard({
  person,
  isSelected,
  isDragging,
  isAdmin,
  onSelect,
  onDoubleClick,
  onMouseDown,
}: PersonCardProps) {
  const { data: sectors } = useSectors();
  const size = CARD_SIZES[person.card_size];
  
  const sector = sectors?.find(s => s.id === person.sector_id);
  const sectorColor = sector?.color || '#3B82F6';

  return (
    <div
      className={cn(
        'absolute rounded-lg shadow-md border-2 cursor-move transition-shadow select-none overflow-hidden',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        isDragging && 'opacity-75 shadow-lg',
        person.locked && 'cursor-not-allowed'
      )}
      style={{
        left: person.position_x,
        top: person.position_y,
        width: size.width,
        height: size.height,
        borderColor: sectorColor,
        backgroundColor: person.fill_card ? sectorColor : 'hsl(var(--card))',
      }}
      onClick={onSelect}
      onDoubleClick={isAdmin ? onDoubleClick : undefined}
      onMouseDown={onMouseDown}
    >
      <div
        className={cn(
          'flex flex-col items-center justify-center h-full p-2 gap-1',
          person.fill_card && 'text-white'
        )}
      >
        {person.avatar_url ? (
          <img
            src={person.avatar_url}
            alt={person.name}
            className={cn(
              'rounded-full object-cover',
              person.card_size === 'small' && 'w-8 h-8',
              person.card_size === 'medium' && 'w-12 h-12',
              person.card_size === 'large' && 'w-16 h-16'
            )}
          />
        ) : (
          <div
            className={cn(
              'rounded-full bg-muted flex items-center justify-center',
              person.fill_card && 'bg-white/20',
              person.card_size === 'small' && 'w-8 h-8',
              person.card_size === 'medium' && 'w-12 h-12',
              person.card_size === 'large' && 'w-16 h-16'
            )}
          >
            <User className={cn(
              person.fill_card ? 'text-white' : 'text-muted-foreground',
              person.card_size === 'small' && 'w-4 h-4',
              person.card_size === 'medium' && 'w-6 h-6',
              person.card_size === 'large' && 'w-8 h-8'
            )} />
          </div>
        )}
        
        <div className="text-center w-full px-1">
          <p
            className={cn(
              'font-semibold truncate',
              person.card_size === 'small' && 'text-[10px]',
              person.card_size === 'medium' && 'text-xs',
              person.card_size === 'large' && 'text-sm'
            )}
          >
            {person.name}
          </p>
          <p
            className={cn(
              'truncate',
              person.fill_card ? 'text-white/80' : 'text-muted-foreground',
              person.card_size === 'small' && 'text-[8px]',
              person.card_size === 'medium' && 'text-[10px]',
              person.card_size === 'large' && 'text-xs'
            )}
          >
            {person.role}
          </p>
        </div>
        
        {person.locked && (
          <Lock className={cn(
            'absolute top-1 right-1',
            person.fill_card ? 'text-white/60' : 'text-muted-foreground',
            person.card_size === 'small' && 'w-2.5 h-2.5',
            person.card_size === 'medium' && 'w-3 h-3',
            person.card_size === 'large' && 'w-3.5 h-3.5'
          )} />
        )}
      </div>
    </div>
  );
}
