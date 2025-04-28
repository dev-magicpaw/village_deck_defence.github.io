import { StickerRegistry } from '../services/StickerRegistry';
import {
  CardSticker,
  StickerFactory
} from './Sticker';
import { Race, ResourceType } from './Types';

export interface CardConfig {
    id: string;
    name: string;
    description: string;
    image: string;
    race: Race;
    startingStickers: {
        [ResourceType.Power]: string[];
        [ResourceType.Construction]: string[];
        [ResourceType.Invention]: string[];
    };
    maxSlots: { 
        [ResourceType.Power]: number;
        [ResourceType.Construction]: number;
        [ResourceType.Invention]: number;
    };
}

export interface CardTrack {
  type: ResourceType;
  slots: CardSlot[];
}

export interface CardSlot {
  id: number;
  sticker: CardSticker | null;
  replaceable: boolean;
}

/**
 * Card entity representing a single card in the game
 */
export class Card {
  public readonly id: string;
  public readonly name: string;
  public readonly race: Race;
  private _tracks: CardTrack[];

  /**
   * Create a new Card instance
   * @param config Card configuration data
   */
  constructor(config: CardConfig) {
    this.id = config.id;
    this.name = config.name;
    this.race = config.race;
    this._tracks = [];
    this._tracks.push(this.buildTrack(
      ResourceType.Power, 
      config.maxSlots[ResourceType.Power], 
      config.startingStickers[ResourceType.Power]
    ));
    this._tracks.push(this.buildTrack(
      ResourceType.Construction, 
      config.maxSlots[ResourceType.Construction], 
      config.startingStickers[ResourceType.Construction]
    ));
    this._tracks.push(this.buildTrack(
      ResourceType.Invention, 
      config.maxSlots[ResourceType.Invention], 
      config.startingStickers[ResourceType.Invention]
    ));
  }

  private buildTrack(type: ResourceType, maxSlots: number, startingStickers: string[]): CardTrack {
    const track: CardTrack = {
      type,
      slots: []
    };
    for (let i = 0; i < maxSlots; i++) {
      track.slots.push({
        id: i,
        sticker: i < startingStickers.length ? this.createStickerFromId(startingStickers[i]) : null,
        replaceable: false
      });
    }
    return track;
  }

  /**
   * Create a sticker from its ID using the global sticker registry
   */
  private createStickerFromId(stickerId: string): CardSticker | null {
    const registry = StickerRegistry.getInstance();
    const stickerConfig = registry.getStickerConfig(stickerId);
    
    if (!stickerConfig) {
      throw new Error(`Sticker not found in registry: ${stickerId}`);
    }
    
    return StickerFactory.fromConfig(stickerConfig);
  }

  public static fromConfig(config: CardConfig): Card {
    return new Card(config);
  }
}

/**
 * Helper function to convert string race to Race enum
 */
export function stringToRace(raceStr: string): Race {
  const raceMap: Record<string, Race> = {
    'Elf': Race.Elf,
    'Dwarf': Race.Dwarf,
    'Human': Race.Human,
    'Gnome': Race.Gnome
  };
  
  return raceMap[raceStr] || Race.Human; // Default to Human if not found
}

/**
 * Function to convert card JSON data to CardConfig
 */
export function convertCardJsonToConfig(cardJson: any): CardConfig {
  return {
    id: cardJson.id,
    name: cardJson.name,
    description: cardJson.description,
    image: cardJson.image,
    race: stringToRace(cardJson.race),
    startingStickers: {
      [ResourceType.Power]: cardJson.startingStickers.power || [],
      [ResourceType.Construction]: cardJson.startingStickers.construction || [],
      [ResourceType.Invention]: cardJson.startingStickers.invention || []
    },
    maxSlots: {
      [ResourceType.Power]: cardJson.maxSlots.power || 0,
      [ResourceType.Construction]: cardJson.maxSlots.construction || 0,
      [ResourceType.Invention]: cardJson.maxSlots.invention || 0
    }
  };
} 