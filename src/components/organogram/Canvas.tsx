import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useOrgPeople,
  useOrgConnections,
  useUpdatePersonPosition,
  useUpdatePersonsPositions,
  useCreateConnection,
  useDeletePerson,
} from '@/hooks/useOrganogram';
import { useDecorativeLines } from '@/hooks/useLines';
import { OrgPerson, ViewState, SelectionBox as SelectionBoxType, CARD_SIZES } from '@/types/organogram';
import { PersonCard } from './PersonCard';
import { ConnectionLines } from './ConnectionLines';
import { DecorativeLines } from './DecorativeLines';
import { SelectionBox } from './SelectionBox';
import { ViewControls } from './ViewControls';
import { TopBar } from './TopBar';
import { PersonDialog } from './PersonDialog';
import { toast } from 'sonner';

export function Canvas() {
  const { isAdmin } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Data
  const { data: people = [], isLoading: isLoadingPeople } = useOrgPeople();
  const { data: connections = [], isLoading: isLoadingConnections } = useOrgConnections();
  const { data: decorativeLines = [] } = useDecorativeLines();

  // Mutations
  const updatePosition = useUpdatePersonPosition();
  const updatePositions = useUpdatePersonsPositions();
  const createConnection = useCreateConnection();
  const deletePerson = useDeletePerson();

  // State
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialPositions, setInitialPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [selectionBox, setSelectionBox] = useState<SelectionBoxType | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [editingPerson, setEditingPerson] = useState<OrgPerson | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPersonPosition, setNewPersonPosition] = useState({ x: 100, y: 100 });

  // Filter people by sector
  const filteredPeople = useMemo(() => {
    if (!selectedSectorId) return people;
    return people.filter(p => p.sector_id === selectedSectorId);
  }, [people, selectedSectorId]);

  // Filter connections to only show those between visible people
  const filteredConnections = useMemo(() => {
    const visibleIds = new Set(filteredPeople.map(p => p.id));
    return connections.filter(
      c => visibleIds.has(c.from_person_id) && visibleIds.has(c.to_person_id)
    );
  }, [connections, filteredPeople]);

  // Get canvas coordinates from mouse event
  const getCanvasCoords = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    return {
      x: (e.clientX - rect.left - viewState.offsetX) / viewState.scale,
      y: (e.clientY - rect.top - viewState.offsetY) / viewState.scale,
    };
  }, [viewState]);

  // Handle card selection
  const handleCardSelect = useCallback((personId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(personId)) {
          newSet.delete(personId);
        } else {
          newSet.add(personId);
        }
        return newSet;
      });
    } else {
      setSelectedIds(new Set([personId]));
    }
  }, []);

  // Handle card drag start
  const handleCardMouseDown = useCallback((personId: string, e: React.MouseEvent) => {
    if (!isAdmin) return;
    
    const person = people.find(p => p.id === personId);
    if (person?.locked) return;
    
    e.stopPropagation();
    
    // If not selected, select it
    if (!selectedIds.has(personId)) {
      setSelectedIds(new Set([personId]));
    }
    
    setDraggingId(personId);
    setDragStart(getCanvasCoords(e));
    
    // Store initial positions of all selected items
    const positions = new Map<string, { x: number; y: number }>();
    selectedIds.forEach(id => {
      const p = people.find(person => person.id === id);
      if (p && !p.locked) {
        positions.set(id, { x: p.position_x, y: p.position_y });
      }
    });
    // Also include the currently clicked one if not in selection
    if (!selectedIds.has(personId)) {
      const p = people.find(person => person.id === personId);
      if (p && !p.locked) {
        positions.set(personId, { x: p.position_x, y: p.position_y });
      }
    }
    setInitialPositions(positions);
  }, [isAdmin, people, selectedIds, getCanvasCoords]);

  // Handle mouse move (dragging cards or panning)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingId && dragStart) {
      const coords = getCanvasCoords(e);
      const dx = coords.x - dragStart.x;
      const dy = coords.y - dragStart.y;
      
      // Update positions optimistically in UI would require local state
      // For now, we'll update on mouse up
    } else if (isPanning && panStart) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      
      setViewState(prev => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (selectionBox) {
      const coords = getCanvasCoords(e);
      setSelectionBox(prev => prev ? { ...prev, endX: coords.x, endY: coords.y } : null);
    }
  }, [draggingId, dragStart, isPanning, panStart, selectionBox, getCanvasCoords]);

  // Handle mouse up
  const handleMouseUp = useCallback(async (e: React.MouseEvent) => {
    if (draggingId && dragStart) {
      const coords = getCanvasCoords(e);
      const dx = coords.x - dragStart.x;
      const dy = coords.y - dragStart.y;
      
      // Update all dragged positions
      const updates = Array.from(initialPositions.entries()).map(([id, pos]) => ({
        id,
        position_x: pos.x + dx,
        position_y: pos.y + dy,
      }));
      
      if (updates.length > 0) {
        await updatePositions.mutateAsync(updates);
      }
    }
    
    if (selectionBox) {
      // Find all people within selection box
      const box = selectionBox;
      const minX = Math.min(box.startX, box.endX);
      const maxX = Math.max(box.startX, box.endX);
      const minY = Math.min(box.startY, box.endY);
      const maxY = Math.max(box.startY, box.endY);
      
      const selected = filteredPeople.filter(p => {
        const size = CARD_SIZES[p.card_size];
        const centerX = p.position_x + size.width / 2;
        const centerY = p.position_y + size.height / 2;
        return centerX >= minX && centerX <= maxX && centerY >= minY && centerY <= maxY;
      });
      
      setSelectedIds(new Set(selected.map(p => p.id)));
    }
    
    setDraggingId(null);
    setDragStart(null);
    setInitialPositions(new Map());
    setIsPanning(false);
    setPanStart(null);
    setSelectionBox(null);
  }, [draggingId, dragStart, initialPositions, selectionBox, filteredPeople, getCanvasCoords, updatePositions]);

  // Handle canvas mouse down (start panning or selection box)
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle mouse or Alt+Left click = pan
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (e.button === 0) {
      // Left click = selection box or deselect
      const coords = getCanvasCoords(e);
      
      if (e.shiftKey) {
        setSelectionBox({
          startX: coords.x,
          startY: coords.y,
          endX: coords.x,
          endY: coords.y,
        });
      } else {
        setSelectedIds(new Set());
      }
    }
  }, [getCanvasCoords]);

  // Handle wheel (zoom)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.25, Math.min(2, viewState.scale * delta));
    
    // Zoom towards mouse position
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const newOffsetX = mouseX - ((mouseX - viewState.offsetX) * newScale) / viewState.scale;
      const newOffsetY = mouseY - ((mouseY - viewState.offsetY) * newScale) / viewState.scale;
      
      setViewState({
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      });
    }
  }, [viewState]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setViewState(prev => ({ ...prev, scale: Math.min(2, prev.scale * 1.2) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewState(prev => ({ ...prev, scale: Math.max(0.25, prev.scale / 1.2) }));
  }, []);

  const handleResetView = useCallback(() => {
    setViewState({ scale: 1, offsetX: 0, offsetY: 0 });
  }, []);

  // Add person
  const handleAddPerson = useCallback(() => {
    const centerX = (window.innerWidth / 2 - viewState.offsetX) / viewState.scale;
    const centerY = (window.innerHeight / 2 - viewState.offsetY) / viewState.scale;
    setNewPersonPosition({ x: centerX - 90, y: centerY - 60 });
    setIsCreating(true);
  }, [viewState]);

  // Connect selected
  const handleConnectSelected = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length < 2) return;
    
    // Connect in order of selection (first to second, second to third, etc.)
    for (let i = 0; i < ids.length - 1; i++) {
      try {
        await createConnection.mutateAsync({
          from_person_id: ids[i],
          to_person_id: ids[i + 1],
        });
      } catch (error) {
        // Connection might already exist
        console.error('Error creating connection:', error);
      }
    }
    
    setSelectedIds(new Set());
  }, [selectedIds, createConnection]);

  // Delete selected
  const handleDeleteSelected = useCallback(async () => {
    const ids = Array.from(selectedIds);
    
    for (const id of ids) {
      await deletePerson.mutateAsync(id);
    }
    
    setSelectedIds(new Set());
  }, [selectedIds, deletePerson]);

  // Handle double click to edit
  const handleCardDoubleClick = useCallback((person: OrgPerson) => {
    if (!isAdmin) return;
    setEditingPerson(person);
  }, [isAdmin]);

  if (isLoadingPeople || isLoadingConnections) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-muted/30">
      <TopBar
        isAdmin={isAdmin}
        selectedSectorId={selectedSectorId}
        onSelectSector={setSelectedSectorId}
        selectedCount={selectedIds.size}
        onAddPerson={handleAddPerson}
        onConnectSelected={handleConnectSelected}
        onDeleteSelected={handleDeleteSelected}
        isConnecting={createConnection.isPending}
      />

      <div
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${viewState.offsetX}px, ${viewState.offsetY}px) scale(${viewState.scale})`,
            transformOrigin: '0 0',
            width: '5000px',
            height: '5000px',
          }}
        >
          <DecorativeLines lines={decorativeLines} />
          <ConnectionLines connections={filteredConnections} people={filteredPeople} />
          
          {filteredPeople.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              isSelected={selectedIds.has(person.id)}
              isDragging={draggingId === person.id}
              isAdmin={isAdmin}
              onSelect={(e) => handleCardSelect(person.id, e)}
              onDoubleClick={() => handleCardDoubleClick(person)}
              onMouseDown={(e) => handleCardMouseDown(person.id, e)}
            />
          ))}
          
          {selectionBox && <SelectionBox box={selectionBox} />}
        </div>
      </div>

      <ViewControls
        viewState={viewState}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetView}
      />

      <PersonDialog
        person={editingPerson}
        isOpen={!!editingPerson || isCreating}
        onClose={() => {
          setEditingPerson(null);
          setIsCreating(false);
        }}
        isCreating={isCreating}
        defaultPosition={newPersonPosition}
      />
    </div>
  );
}
