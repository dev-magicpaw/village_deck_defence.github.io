export enum ResourceType {
    Power,
    Construction,
    Invention
}

export enum StickerType {
    Power,
    Construction,
    Invention,
    Wild
}

export enum StickerEffectType {
    Resource
}

export enum Race {
    Elf,
    Dwarf,
    Human,
    Gnome
}

/**
 * Global registry for sticker configurations
 */
export class StickerRegistry {
  private static _instance: StickerRegistry;
  private _stickerConfigs: Map<string, StickerConfig> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance of StickerRegistry
   */
  public static getInstance(): StickerRegistry {
    if (!StickerRegistry._instance) {
      StickerRegistry._instance = new StickerRegistry();
    }
    return StickerRegistry._instance;
  }

  /**
   * Load sticker configurations from JSON array
   * @param stickersJson Array of sticker configurations from JSON
   */
  public loadStickers(stickersJson: any[]): void {
    stickersJson.forEach(stickerJson => {
      const config = this.convertStickerJsonToConfig(stickerJson);
      this._stickerConfigs.set(config.id, config);
    });
  }

  /**
   * Convert raw JSON sticker data to typed StickerConfig
   */
  private convertStickerJsonToConfig(stickerJson: any): StickerConfig {
    const typeMap: Record<string, StickerType> = {
      'Power': StickerType.Power,
      'Construction': StickerType.Construction,
      'Invention': StickerType.Invention,
      'Wild': StickerType.Wild
    };

    const effects = stickerJson.effects.map((effectJson: any) => {
      if (effectJson.type === 'Resource') {
        const resourceTypeMap: Record<string, ResourceType> = {
          'Power': ResourceType.Power,
          'Construction': ResourceType.Construction,
          'Invention': ResourceType.Invention
        };

        const effect: ResourceStickerEffect = {
          type: StickerEffectType.Resource,
          resourceType: resourceTypeMap[effectJson.resourceType],
          value: effectJson.value,
          effect: () => {
            // Resource stickers don't have special effects
          }
        };
        return effect;
      } else {
        throw new Error(`Unknown effect type: ${effectJson.type}`);
      }
    });

    return {
      id: stickerJson.id,
      name: stickerJson.name,
      description: stickerJson.description,
      image: stickerJson.image,
      type: typeMap[stickerJson.type],
      effects
    };
  }

  /**
   * Get a sticker configuration by ID
   * @param stickerId The ID of the sticker to get
   * @returns The sticker configuration or undefined if not found
   */
  public getStickerConfig(stickerId: string): StickerConfig | undefined {
    return this._stickerConfigs.get(stickerId);
  }
}

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

export interface CardSticker {
  id: string;
  name: string;
  description: string;
  image: string;
  type: StickerType;
  effects: StickerEffect[];
}

export interface StickerConfig {
  id: string;
  name: string;
  description: string;
  image: string;
  type: StickerType;
  effects: StickerEffect[];
}

export interface StickerEffect {
  type: StickerEffectType;
  effect(): void;
}

export interface ResourceStickerEffect extends StickerEffect {
  type: StickerEffectType.Resource;
  resourceType: ResourceType;
  value: number;
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
 * Helper class to create CardSticker instances from config
 */
export class StickerFactory {
  public static fromConfig(stickerConfig: StickerConfig): CardSticker {
    return {
      id: stickerConfig.id,
      name: stickerConfig.name,
      description: stickerConfig.description,
      image: stickerConfig.image,
      type: stickerConfig.type,
      effects: stickerConfig.effects
    };
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