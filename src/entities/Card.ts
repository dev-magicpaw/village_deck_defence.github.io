import { v4 as uuidv4 } from 'uuid';
import { StickerRegistry } from '../services/StickerRegistry';
import {
  CardSticker,
  StickerFactory
} from './Sticker';
import { Race } from './Types';

export interface CardConfig {
    id: string;
    name: string;
    description: string;
    image: string;
    race: Race;
    startingStickers: string[];
    maxSlotCount: number;
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
  public readonly unique_id: string;
  public readonly name: string;
  public readonly race: Race;
  private _slots: CardSlot[];

  /**
   * Create a new Card instance
   * @param config Card configuration data
   */
  constructor(config: CardConfig) {
    this.id = config.id;
    this.unique_id = uuidv4();
    this.name = config.name;
    this.race = config.race;
    this._slots = this.buildSlots(config.maxSlotCount, config.startingStickers);
  }

  private buildSlots(maxSlotCount: number, startingStickers: string[]): CardSlot[] {
    const slots: CardSlot[] = [];
    for (let i = 0; i < maxSlotCount; i++) {
      slots.push({
        id: i,
        sticker: i < startingStickers.length ? this.createStickerFromId(startingStickers[i]) : null,
        replaceable: false
      });
    }
    return slots;
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

  /**
   * Get all slots on the card
   */
  public get slots(): CardSlot[] {
    return this._slots;
  }

  /**
   * Get the total number of slots on the card
   */
  public get slotCount(): number {
    return this._slots.length;
  }

  public static fromConfig(config: CardConfig): Card {
    return new Card(config);
  }
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
    startingStickers: [...cardJson.startingStickers],
    maxSlotCount: cardJson.maxSlotCount
  };
}

// Helper function to convert a string race to Race enum
function stringToRace(race: string): Race {
  switch (race.toLowerCase()) {
    case 'human':
      return Race.Human;
    case 'elf':
      return Race.Elf;
    case 'dwarf':
      return Race.Dwarf;
    case 'gnome':
      return Race.Gnome;
    default:
      return Race.Human;
  }
} 