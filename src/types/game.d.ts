export interface Card {
  id: string;
  name: string;
  race?: string;
  tracks?: {
    power: number;
    construction: number;
    invention: number;
  };
  slots?: {
    power: number;
    construction: number;
    invention: number;
  };
  startingStickers?: {
    power: string[];
    construction: string[];
    invention: string[];
  };
}

export interface Building {
  id: string;
  name: string;
  constructionCost: number;
  effect: string;
}

export interface Adventure {
  id: string;
  name: string;
  difficulty: number;
  rewards: Array<{
    type: string;
    value: number | string;
  }>;
}

export interface Sticker {
  id: string;
  name: string;
  type: string;
  value: number;
  inventionCost: number;
} 