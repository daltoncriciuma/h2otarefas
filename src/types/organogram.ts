export interface OrgPerson {
  id: string;
  name: string;
  role: string;
  sector: string;
  avatar_url: string | null;
  position_x: number;
  position_y: number;
  sector_id: string | null;
  card_size: 'small' | 'medium' | 'large';
  fill_card: boolean;
  locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrgConnection {
  id: string;
  from_person_id: string;
  to_person_id: string;
  created_at: string;
}

export interface OrgDecorativeLine {
  id: string;
  start_x: number;
  start_y: number;
  end_x: number;
  end_y: number;
  color: string;
  stroke_width: number;
  created_at: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export type CardSize = 'small' | 'medium' | 'large';

export const CARD_SIZES: Record<CardSize, { width: number; height: number }> = {
  small: { width: 120, height: 80 },
  medium: { width: 180, height: 120 },
  large: { width: 240, height: 160 },
};
