import { BuildingEffect } from '../entities/Building';

export interface Building {
  id: string;
  name: string;
  description: string;
  image: string;
  cost?: {
    construction: number;
  };
  limit?: number | null;
  effects: BuildingEffect[];
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