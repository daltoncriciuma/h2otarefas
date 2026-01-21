import { OrgPerson, OrgConnection, CARD_SIZES } from '@/types/organogram';

interface ConnectionLinesProps {
  connections: OrgConnection[];
  people: OrgPerson[];
}

export function ConnectionLines({ connections, people }: ConnectionLinesProps) {
  const getPersonCenter = (person: OrgPerson) => {
    const size = CARD_SIZES[person.card_size];
    return {
      x: person.position_x + size.width / 2,
      y: person.position_y + size.height / 2,
    };
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--muted-foreground))" />
        </marker>
      </defs>
      
      {connections.map((connection) => {
        const fromPerson = people.find(p => p.id === connection.from_person_id);
        const toPerson = people.find(p => p.id === connection.to_person_id);
        
        if (!fromPerson || !toPerson) return null;
        
        const from = getPersonCenter(fromPerson);
        const to = getPersonCenter(toPerson);
        
        // Calculate the edge points considering card size
        const toSize = CARD_SIZES[toPerson.card_size];
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const padding = 5;
        
        const endX = to.x - (Math.cos(angle) * (toSize.width / 2 + padding));
        const endY = to.y - (Math.sin(angle) * (toSize.height / 2 + padding));
        
        return (
          <line
            key={connection.id}
            x1={from.x}
            y1={from.y}
            x2={endX}
            y2={endY}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
        );
      })}
    </svg>
  );
}
