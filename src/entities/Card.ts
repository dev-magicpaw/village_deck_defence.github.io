import Phaser from 'phaser';
import { v4 as uuidv4 } from 'uuid';
import { StickerRegistry } from '../services/StickerRegistry';
import {
  CardSticker,
  StickerConfig,
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
 * Events emitted by the Card entity
 */
export enum CardEvents {
  STICKER_APPLIED = 'sticker-applied'
}

/**
 * Card entity representing a single card in the game
 */
export class Card extends Phaser.Events.EventEmitter {
  public readonly id: string;
  public readonly unique_id: string;
  public readonly name: string;
  public readonly race: Race;
  public readonly image: string;
  private _slots: CardSlot[];

  /**
   * Create a new Card instance
   * @param config Card configuration data
   */
  constructor(config: CardConfig) {
    super();
    this.id = config.id;
    this.unique_id = uuidv4();
    this.name = config.name;
    this.race = config.race;
    this.image = config.image;
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

  /**
   * Calculate the total invention value of this card
   * This includes the base value plus any contributions from stickers
   */
  public getInventionValue(): number {    
    let total = 0;
    // Add invention values from stickers
    this._slots.forEach(slot => {
      if (slot.sticker) {
        // If the sticker has an invention value, add it
        total += slot.sticker.getInventionValue();
      }
    });
    
    return total;
  }

  /**
   * Calculate the total power value of this card
   * This includes any contributions from stickers
   */
  public getPowerValue(): number {    
    let total = 0;
    // Add power values from stickers
    this._slots.forEach(slot => {
      if (slot.sticker) {
        // If the sticker has a power value, add it
        total += slot.sticker.getPowerValue();
      }
    });
    
    return total;
  }

  public getConstructionValue(): number {
    let total = 0;
    // Add construction values from stickers
    this._slots.forEach(slot => {
      if (slot.sticker) {
        // If the sticker has a construction value, add it
        total += slot.sticker.getConstructionValue();
      }
    });
    
    return total;
  }

  /**
   * Apply a sticker to a specific slot
   * @param sticker The sticker configuration to apply
   * @param slotIndex The index of the slot to apply the sticker to
   * @returns True if the sticker was applied successfully, false otherwise
   */
  public applySticker(sticker: StickerConfig, slotIndex: number): boolean {
    // Check if the slot exists
    if (slotIndex < 0 || slotIndex >= this._slots.length) {
      return false;
    }
    
    // Create the card sticker from the config
    const cardSticker = StickerFactory.fromConfig(sticker);
    
    // Replace any existing sticker in the slot
    this._slots[slotIndex].sticker = cardSticker;
    
    // Emit sticker applied event
    this.emit(CardEvents.STICKER_APPLIED, this, sticker, slotIndex);
    
    return true;
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
    maxSlotCount: cardJson.maxSlotCount,
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